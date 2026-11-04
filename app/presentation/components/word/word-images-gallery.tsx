import { useMemo, useState } from 'react';
import { Group, Modal, SimpleGrid, Stack, Text, Title } from '@mantine/core';
import { Image as ImageIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { WordImage } from '@/domain/entities/word.entity';
import { hasViolenceWarning } from '@/domain/image-content-warnings';
import {
  ImageLightbox,
  useImageLightbox,
  type ImageLightboxItem,
} from '@/presentation/components/image-lightbox';
import { displayImageUrl } from '@/presentation/utils/display-image-url';
import { ImageCredit } from './image-credit';
import {
  RevealViolenceConfirmFooter,
  WordImageView,
} from './word-image-view';

/**
 * Galeri foto kata. Satu konfirmasi "Lihat" membuka semua foto kekerasan
 * di halaman ini; reset saat ganti wordId.
 */
export function WordImagesGallery({
  wordId,
  images,
  lemma,
}: {
  wordId: string;
  images: WordImage[];
  lemma: string;
}) {
  const { t } = useTranslation();
  const [violenceRevealed, setViolenceRevealed] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const lightbox = useImageLightbox();
  // Reset saat pindah kata. Selama render (bukan effect) supaya tidak
  // ada render tambahan: React membuang state lama sebelum paint.
  const [seenWordId, setSeenWordId] = useState(wordId);
  if (wordId !== seenWordId) {
    setSeenWordId(wordId);
    setViolenceRevealed(false);
    setConfirmOpen(false);
  }

  const viewableLightbox = useMemo((): {
    items: ImageLightboxItem[];
    indexById: Map<string, number>;
  } => {
    const items: ImageLightboxItem[] = [];
    const indexById = new Map<string, number>();
    for (const img of images) {
      const pending =
        img.is_verified === false ||
        (() => {
          try {
            const host = new URL(img.url).hostname.toLowerCase();
            return host === 'placehold.co' || host === 'via.placeholder.com';
          } catch {
            return false;
          }
        })();
      if (pending) continue;
      if (hasViolenceWarning(img.content_warnings) && !violenceRevealed) {
        continue;
      }
      const src = displayImageUrl(img.url, { width: 1600 });
      if (!src) continue;
      indexById.set(img.id, items.length);
      items.push({
        src,
        alt: img.alt_text?.trim() || t('word_imageAlt', { lemma }),
        caption: img.attribution?.name,
      });
    }
    return { items, indexById };
  }, [images, lemma, t, violenceRevealed]);

  if (images.length === 0) return null;

  const requestReveal = () => setConfirmOpen(true);

  return (
    <>
      <Stack gap="sm">
        <Group gap="xs">
          <ImageIcon size={16} />
          <Title order={2} size="h5" c="dimmed" tt="uppercase" fw={700}>
            {t('word_imagesHeading', { count: images.length })}
          </Title>
        </Group>
        <SimpleGrid cols={{ base: 1, xs: 2 }} spacing="sm">
          {images.map((img) => {
            const at = viewableLightbox.indexById.get(img.id);
            return (
              <Stack key={img.id} gap={4}>
                <WordImageView
                  image={img}
                  revealed={violenceRevealed}
                  onRequestReveal={requestReveal}
                  onOpen={
                    at != null
                      ? () => lightbox.open(viewableLightbox.items, at)
                      : undefined
                  }
                  alt={img.alt_text?.trim() || t('word_imageAlt', { lemma })}
                />
                {img.attribution ? <ImageCredit attribution={img.attribution} /> : null}
              </Stack>
            );
          })}
        </SimpleGrid>
      </Stack>

      <Modal
        opened={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title={t('word_imageViolenceConfirmTitle')}
        centered
      >
        <Stack gap="md">
          <Text size="sm">{t('word_imageViolenceConfirmBody')}</Text>
          <RevealViolenceConfirmFooter
            onCancel={() => setConfirmOpen(false)}
            onConfirm={() => {
              setViolenceRevealed(true);
              setConfirmOpen(false);
            }}
          />
        </Stack>
      </Modal>

      <ImageLightbox
        opened={lightbox.opened}
        onClose={lightbox.close}
        images={lightbox.images}
        index={lightbox.index}
        onIndexChange={lightbox.setIndex}
      />
    </>
  );
}
