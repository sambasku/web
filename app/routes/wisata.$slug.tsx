import { Link, useLoaderData } from 'react-router';
import {
  Anchor,
  Badge,
  Breadcrumbs,
  Button,
  Container,
  Divider,
  Group,
  Image,
  Paper,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from '@mantine/core';
import {
  ArrowLeft,
  Clock,
  ExternalLink,
  Landmark,
  MapPin,
  Phone,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { Route } from './+types/wisata.$slug';
import { fetchPlaceBySlug, placeCover, placeTypeLabels } from '@/domain/places';
import { buildPlaceJsonLd } from '@/application/utils/place-seo';
import { buildMetaTags } from '@/application/utils/seo';
import { env } from '@/infrastructure/config/env';
import {
  DEFAULT_LOCALE,
  isAppLocale,
  localePath,
} from '@/application/i18n/locales';
import { getFixedT } from '@/application/i18n/i18n-instance';
import { useLocalePath } from '@/application/i18n/use-locale';
import { displayImageUrl } from '@/presentation/utils/display-image-url';

/** Peta Google: marker di koordinat tempat; rute diurus aplikasi Maps. */
function googleMapsUri(lat: number, lng: number): string {
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
}

export function meta({ params, data }: Route.MetaArgs) {
  const locale = isAppLocale(params.locale) ? params.locale : DEFAULT_LOCALE;
  const t = getFixedT(locale);
  const p = data?.place;
  if (!p) {
    return buildMetaTags({
      title: t('wisata_notFoundTitle'),
      description: t('wisata_notFoundBody'),
      path: localePath(locale, '/wisata'),
      locale,
    });
  }
  const cover = placeCover(p);
  return [
    ...buildMetaTags({
      title: t('wisata_seoDetailTitle', { name: p.name }),
      description: p.shortDescription,
      keywords: p.type
        ? `${p.name}, wisata ${placeTypeLabels[p.type].toLowerCase()} sambas`
        : p.name,
      path: localePath(locale, `/wisata/${encodeURIComponent(p.slug)}`),
      image: cover ? displayImageUrl(cover.url, { width: 1200 }) : undefined,
      imageAlt: cover?.attribution
        ? `${p.name} - ${cover.attribution.name}`
        : p.name,
      imageWidth: cover ? 1200 : undefined,
      type: 'article',
      locale,
    }),
    ...(env.isProd
      ? [{ 'script:ld+json': buildPlaceJsonLd(p, locale) }]
      : []),
  ];
}

export async function loader({ params, request }: Route.LoaderArgs) {
  const slug = params.slug ?? '';
  const place = await fetchPlaceBySlug(slug, request.signal);
  if (!place) {
    throw new Response('Not Found', { status: 404 });
  }
  return { place };
}

export default function WisataDetailPage() {
  const { place: p } = useLoaderData<typeof loader>();
  const { t } = useTranslation();
  const lp = useLocalePath();
  const cover = placeCover(p);
  const heroUrl = cover
    ? displayImageUrl(cover.url, { width: 1200 })
    : undefined;

  return (
    <Container size="md" py="xl">
      <Stack gap="lg">
        <Breadcrumbs separator="→">
          <Anchor component={Link} to={lp('/')} size="xs" c="dimmed">
            {t('word_homeCrumb')}
          </Anchor>
          <Anchor component={Link} to={lp('/wisata')} size="xs" c="dimmed">
            {t('seo_wisataTitle')}
          </Anchor>
          <Text size="xs" fw={500} lineClamp={1}>
            {p.name}
          </Text>
        </Breadcrumbs>

        <Stack gap="xs">
          <Group gap="xs">
            <ThemeIcon variant="light" size="md" radius="sm">
              <Landmark size={16} />
            </ThemeIcon>
            <Title order={1} size="h2">
              {p.name}
            </Title>
          </Group>
          <Group gap={6} c="dimmed">
            {p.type ? (
              <Badge variant="light" color="gray" size="sm">
                {placeTypeLabels[p.type]}
              </Badge>
            ) : null}
            <Group gap={4} wrap="nowrap">
              <MapPin size={13} aria-hidden />
              <Text size="xs">Sambas, Kalimantan Barat</Text>
            </Group>
          </Group>
        </Stack>

        {heroUrl ? (
          <Image
            src={heroUrl}
            alt={
              cover?.attribution
                ? `${p.name} - foto oleh ${cover.attribution.name}`
                : p.name
            }
            radius="md"
            mah={420}
            fit="cover"
          />
        ) : null}

        {cover?.attribution ? (
          <Text size="xs" c="dimmed">
            Foto:{' '}
            {cover.attribution.url ? (
              <Anchor
                href={cover.attribution.url}
                target="_blank"
                rel="noopener noreferrer"
                size="xs"
              >
                {cover.attribution.name}
              </Anchor>
            ) : (
              cover.attribution.name
            )}
            {cover.attribution.license ? (
              <>
                {' · '}
                {cover.attribution.license_url ? (
                  <Anchor
                    href={cover.attribution.license_url}
                    target="_blank"
                    rel="noopener noreferrer license"
                    size="xs"
                  >
                    {cover.attribution.license}
                  </Anchor>
                ) : (
                  cover.attribution.license
                )}
              </>
            ) : null}
          </Text>
        ) : null}

        <Text size="md" lh={1.7}>
          {p.shortDescription}
        </Text>

        {p.hours || p.contact ? (
          <Paper withBorder p="md" radius="md">
            <Stack gap="sm">
              {p.hours ? (
                <Group gap="xs" wrap="nowrap">
                  <Clock size={16} aria-hidden style={{ flexShrink: 0 }} />
                  <Stack gap={0}>
                    <Text size="sm" fw={600}>
                      {p.hours}
                    </Text>
                    <Text size="xs" c="dimmed">
                      {t('wisata_hoursCaption')}
                    </Text>
                  </Stack>
                </Group>
              ) : null}
              {p.contact ? (
                <Group gap="xs" wrap="nowrap">
                  <Phone size={16} aria-hidden style={{ flexShrink: 0 }} />
                  <Stack gap={0}>
                    <Text size="sm" fw={600}>
                      {p.contact}
                    </Text>
                    <Text size="xs" c="dimmed">
                      {t('wisata_contactCaption')}
                    </Text>
                  </Stack>
                </Group>
              ) : null}
            </Stack>
          </Paper>
        ) : null}

        <Group>
          <Button
            component="a"
            href={googleMapsUri(p.lat, p.lng)}
            target="_blank"
            rel="noopener noreferrer"
            variant="light"
            leftSection={<MapPin size={16} />}
          >
            {t('wisata_openMapButton')}
          </Button>
        </Group>

        {p.sources.length > 0 ? (
          <>
            <Divider />
            <Stack gap={4}>
              <Text size="xs" c="dimmed" fw={600} tt="uppercase">
                {t('wisata_sourcesHeading')}
              </Text>
              {p.sources.map((s) => (
                <Text key={s.address} size="xs" c="dimmed">
                  {s.name}
                  {s.license ? ` · ${s.license}` : ''}
                  {' - '}
                  <Anchor
                    href={s.address}
                    target="_blank"
                    rel="noopener noreferrer"
                    size="xs"
                  >
                    <ExternalLink
                      size={10}
                      aria-hidden
                      style={{ display: 'inline', verticalAlign: 'middle' }}
                    />{' '}
                    {s.address}
                  </Anchor>
                </Text>
              ))}
            </Stack>
          </>
        ) : null}

        <Anchor component={Link} to={lp('/wisata')} size="sm">
          <Group gap={6} wrap="nowrap">
            <ArrowLeft size={14} aria-hidden />
            {t('wisata_backLink')}
          </Group>
        </Anchor>
      </Stack>
    </Container>
  );
}
