/**
* Galeri foto acara -grid 3 kolom + lazy-load + lightbox.
* Mirip mobile EventPhotosPage.
*/
import { useState } from 'react';
import { Link, useLoaderData, useSearchParams } from 'react-router';
import {
Anchor,
Button,
Container,
Group,
SimpleGrid,
Stack,
Text,
Title,
} from '@mantine/core';
import { ArrowLeft, Camera } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { Route } from './+types/acara.$slug.foto';
import { buildMetaTags } from '@/application/utils/seo';
import {
DEFAULT_LOCALE,
isAppLocale,
localePath,
} from '@/application/i18n/locales';
import { getFixedT } from '@/application/i18n/i18n-instance';
import { useLocalePath } from '@/application/i18n/use-locale';
import { fetchEventBySlug, fetchEventImages, type EventImage } from '@/domain/events';
import { displayImageUrl } from '@/presentation/utils/display-image-url';
import {
ImageLightbox,
LightboxTrigger,
useImageLightbox,
} from '@/presentation/components/image-lightbox';

const PAGE_SIZE = 12;

export function meta({ params }: Route.MetaArgs) {
  const locale = isAppLocale(params.locale) ? params.locale : DEFAULT_LOCALE;
  const t = getFixedT(locale);
  const slug = params.slug ?? '';
  return buildMetaTags({
    title: t('event_photosGalleryTitle'),
    description: t('event_photosGalleryDescription'),
    path: localePath(locale, `/acara/${encodeURIComponent(slug)}/foto`),
    locale,
  });
}

export async function loader({ params, request }: Route.LoaderArgs) {
  const slug = params.slug?.trim();
  if (!slug) throw new Response('Slug tidak valid', { status: 400 });

  const [event, imagePage] = await Promise.all([
    fetchEventBySlug(slug, request.signal).catch(() => null),
    fetchEventImages(slug, 0, request.signal).catch(() => null),
  ]);

  return {
    event,
    images: imagePage?.items ?? [],
    total: imagePage?.total ?? 0,
    nextOffset: imagePage?.nextOffset ?? null,
  };
}

export default function EventPhotosPage() {
  const { event, images: initialImages, total, nextOffset } =
    useLoaderData<typeof loader>();
  const lp = useLocalePath();
  const { t } = useTranslation();
  const lightbox = useImageLightbox();
  const openAria = t('imageLightbox_openAria');

  const [images, setImages] = useState<EventImage[]>(initialImages);
  const [offset, setOffset] = useState<number | null>(nextOffset);
  const [loading, setLoading] = useState(false);

  if (!event) {
    return (
      <Container size="md" px="md" py={44}>
        <Stack gap="md">
          <Title order={1} fw={800} size="h3">
            {t('event_notFoundTitle')}
          </Title>
          <Text c="dimmed">{t('event_notFoundBody')}</Text>
          <Anchor component={Link} to={lp('/acara')}>
            {t('event_backLink')}
          </Anchor>
        </Stack>
      </Container>
    );
  }

  const slug = event.slug;
  const eventLp = lp(`/acara/${encodeURIComponent(slug)}`);

  const loadMore = async () => {
    if (offset === null || loading) return;
    setLoading(true);
    try {
      const page = await fetchEventImages(slug, offset);
      if (page) {
        setImages((prev) => [...prev, ...page.items]);
        setOffset(page.nextOffset);
      }
    } finally {
      setLoading(false);
    }
  };

  const lightboxImages = images.map((img) => ({
    src: displayImageUrl(img.url, { width: 1200 }) ?? img.url,
    alt: img.attribution?.name ?? event.name,
  }));

  return (
    <Container size="md" px="md" pb={32}>
      <Stack gap={0} px="md">
        <Group gap={6} wrap="wrap" pt={12}>
          <Anchor component={Link} to={lp('/')} size="xs" c="dimmed">
            {t('word_homeCrumb')}
          </Anchor>
          <Text size="xs" c="dimmed">/</Text>
          <Anchor component={Link} to={lp('/acara')} size="xs" c="dimmed">
            {t('event_heading')}
          </Anchor>
          <Text size="xs" c="dimmed">/</Text>
          <Anchor component={Link} to={eventLp} size="xs" c="dimmed">
            {event.name}
          </Anchor>
          <Text size="xs" c="dimmed">/</Text>
          <Text size="xs" fw={500}>
            {t('event_photosGalleryTitle')}
          </Text>
        </Group>

        <Group justify="space-between" align="center" mt={12} mb={16}>
          <Title order={2} fw={700} fz={{ base: 18, sm: 22 }}>
            {t('event_photosGalleryTitle')}
          </Title>
          <Button
            component={Link}
            to={lp(`/acara/${encodeURIComponent(slug)}/foto/tambah`)}
            leftSection={<Camera size={16} />}
            color="teal"
            size="sm"
          >
            {t('event_uploadPhoto')}
          </Button>
        </Group>
      </Stack>

      {images.length === 0 ? (
        <Stack align="center" gap="md" py={48}>
          <Text c="dimmed">{t('event_photosEmpty')}</Text>
          <Button
            component={Link}
            to={lp(`/acara/${encodeURIComponent(slug)}/foto/tambah`)}
            leftSection={<Camera size={16} />}
            variant="outline"
            color="teal"
          >
            {t('event_uploadPhoto')}
          </Button>
        </Stack>
      ) : (
        <>
          <SimpleGrid cols={3} spacing={4} px="md">
            {images.map((img, i) => (
              <LightboxTrigger
                key={img.id}
                label={openAria}
                onOpen={() => lightbox.open(lightboxImages, i)}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={displayImageUrl(img.url, { width: 480 }) ?? img.url}
                  alt={img.attribution?.name ?? `${event.name} - foto ${i + 1}`}
                  loading="lazy"
                  style={{
                    width: '100%',
                    aspectRatio: '1',
                    objectFit: 'cover',
                    borderRadius: 8,
                    display: 'block',
                    cursor: 'pointer',
                  }}
                />
              </LightboxTrigger>
            ))}
          </SimpleGrid>

          {offset !== null && (
            <Stack align="center" mt={16}>
              <Button
                variant="outline"
                color="teal"
                onClick={loadMore}
                loading={loading}
              >
                {t('event_loadMorePhotos', {
                  shown: images.length,
                  total,
                })}
              </Button>
            </Stack>
          )}
        </>
      )}

      <Anchor
        component={Link}
        to={eventLp}
        size="sm"
        mt={24}
        style={{ alignSelf: 'flex-start', display: 'flex' }}
      >
        <Group gap={6} wrap="nowrap">
          <ArrowLeft size={14} aria-hidden />
          {t('event_backLink')}
        </Group>
      </Anchor>

      <ImageLightbox
        opened={lightbox.opened}
        onClose={lightbox.close}
        images={lightbox.images}
        index={lightbox.index}
        onIndexChange={lightbox.setIndex}
      />
    </Container>
  );
}
