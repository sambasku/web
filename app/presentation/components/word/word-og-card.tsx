import { Group, Image, Stack, Title } from '@mantine/core';
import { Image as ImageIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  OG_CARD_HEIGHT,
  OG_CARD_WIDTH,
  wordOgCardPath,
} from '@/application/utils/og-image-meta';

/**
 * Kartu OG lemma sebagai <img> terlihat - Google Images butuh gambar di
 * body halaman, bukan hanya meta og:image. Dipakai saat belum ada foto kata.
 */
export function WordOgCard({ lemma }: { lemma: string }) {
  const { t } = useTranslation();
  const src = wordOgCardPath(lemma);

  return (
    <Stack gap="sm">
      <Group gap="xs">
        <ImageIcon size={16} />
        <Title order={2} size="h5" c="dimmed" tt="uppercase" fw={700}>
          {t('word_ogCardHeading')}
        </Title>
      </Group>
      <Image
        src={src}
        alt={t('word_ogCardAlt', { lemma })}
        radius="md"
        w="100%"
        maw={600}
        fit="contain"
        decoding="async"
        loading="lazy"
        style={{
          aspectRatio: `${OG_CARD_WIDTH} / ${OG_CARD_HEIGHT}`,
          background: 'var(--mantine-color-default-hover)',
        }}
      />
    </Stack>
  );
}
