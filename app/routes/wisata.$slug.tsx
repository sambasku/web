import { Link, useLoaderData } from 'react-router';
import {
  Anchor,
  Badge,
  Box,
  Button,
  Group,
  Image,
  Paper,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { Clock, MapPin, Phone, Smartphone } from 'lucide-react';
import type { Route } from './+types/wisata.$slug';
import { buildMetaTags, buildPlaceJsonLd } from '@/application/utils/seo';
import {
  DEFAULT_LOCALE,
  isAppLocale,
  localePath,
} from '@/application/i18n/locales';
import { useLocalePath } from '@/application/i18n/use-locale';
import {
  PLACE_TYPE_LABELS,
  listPlaces,
  placeCover,
  placeLabel,
  type Place,
} from '@/application/use-cases/place.use-case';
import { env } from '@/infrastructure/config/env';
import { AppDownloadBadges } from '@/presentation/components/layout/app-download-badges';
import { displayImageUrl } from '@/presentation/utils/display-image-url';

/**
 * Fallback web untuk link share tempat (`/wisata/:slug`) bila aplikasi belum
 * terpasang. Layout sengaja meniru detail Place di mobile (satu kolom selebar
 * HP): hero, kredit foto, judul, badge, info, deskripsi, peta, dekat sini,
 * sumber, lalu ajakan buka aplikasi.
 */

const COLUMN_WIDTH = 480;

const capitalize = (s: string) => (s ? `${s[0].toUpperCase()}${s.slice(1)}` : s);

export function meta({ data, params }: Route.MetaArgs) {
  const locale = isAppLocale(params.locale) ? params.locale : DEFAULT_LOCALE;
  const place = data?.place;
  const path = localePath(locale, `/wisata/${encodeURIComponent(params.slug)}`);
  if (!place) {
    return buildMetaTags({
      title: 'Tempat tidak ditemukan',
      description: 'Tempat wisata ini belum tersedia di SambasKu.',
      path,
      locale,
      noindexAlways: true,
    });
  }
  const cover = placeCover(place);
  const image = cover ? displayImageUrl(cover.url, { width: 1200 }) : undefined;
  return [
    ...buildMetaTags({
      title: `${place.name} - Wisata Sambas`,
      description: place.shortDescription,
      path,
      locale,
      image,
      imageAlt: place.name,
    }),
    ...(env.isProd
      ? [{ 'script:ld+json': buildPlaceJsonLd(place, image, locale) }]
      : []),
  ];
}

export async function loader({ params, request }: Route.LoaderArgs) {
  const slug = params.slug?.trim();
  if (!slug) throw new Response('Slug tidak valid', { status: 400 });

  const places = await listPlaces(request.signal);
  const place = places.find((p) => p.slug === slug) ?? null;
  if (!place) return { slug, place: null, related: [] };

  const byId = new Map(places.map((p) => [p.id, p]));
  const related = (place.related ?? [])
    .filter((r) => r.kind === 'place')
    .map((r) => byId.get(r.id))
    .filter((p): p is Place => !!p && p.slug !== slug);
  return { slug, place, related };
}

function CreditLine({
  label,
  name,
  nameUrl,
  suffix,
  license,
  licenseUrl,
}: {
  label: string;
  name: string;
  nameUrl?: string;
  suffix?: string;
  license?: string;
  licenseUrl?: string;
}) {
  return (
    <Text size="xs" c="dimmed" lineClamp={1}>
      {label}:{' '}
      <Anchor
        href={nameUrl}
        target="_blank"
        rel="noopener noreferrer"
        size="xs"
        fw={600}
      >
        {name}
        {suffix}
      </Anchor>
      {license ? (
        <>
          {' · '}
          <Anchor
            href={licenseUrl}
            target="_blank"
            rel="noopener noreferrer"
            size="xs"
            c="dimmed"
            underline="always"
          >
            {license}
          </Anchor>
        </>
      ) : null}
    </Text>
  );
}

export default function PlaceSharePage() {
  const lp = useLocalePath();
  const { slug, place, related } = useLoaderData<typeof loader>();

  if (!place) {
    return (
      <Box maw={COLUMN_WIDTH} mx="auto" px="md" py={44}>
        <Stack gap="md">
          <Title order={1} fw={800} size="h3">
            Tempat tidak ditemukan
          </Title>
          <Text c="dimmed">
            Tempat ini belum ada di SambasKu, atau tautannya salah.
          </Text>
          <Anchor component={Link} to={lp('/wisata')}>
            Lihat semua wisata Sambas
          </Anchor>
        </Stack>
      </Box>
    );
  }

  const cover = placeCover(place);
  const credit = cover?.attribution;
  const deepLink = `sambasku://app/wisata/${encodeURIComponent(slug)}`;
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${place.lat},${place.lng}`;
  const info = [
    place.hours ? { icon: Clock, value: place.hours, caption: 'Jam buka' } : null,
    place.contact ? { icon: Phone, value: place.contact, caption: 'Kontak' } : null,
  ].filter((i) => i !== null);

  return (
    <Box maw={COLUMN_WIDTH} mx="auto" pb={32}>
      {cover ? (
        <Image
          src={displayImageUrl(cover.url, { width: 960 })}
          alt={place.name}
          style={{ aspectRatio: '16 / 10' }}
          fit="cover"
        />
      ) : (
        <Box bg="gray.2" style={{ aspectRatio: '16 / 10' }} />
      )}

      <Stack gap={0} px="md">
        {credit ? (
          <Box pt={6}>
            <CreditLine
              label="Foto"
              name={credit.name}
              nameUrl={credit.url}
              suffix={credit.provider ? ` / ${capitalize(credit.provider)}` : undefined}
              license={credit.license}
              licenseUrl={credit.license_url}
            />
          </Box>
        ) : null}

        <Anchor component={Link} to={lp('/wisata')} size="xs" fw={600} mt={14} style={{ alignSelf: 'flex-start' }}>
          Wisata Sambas
        </Anchor>
        <Title order={1} fw={800} fz={22} lh={1.25} mt={2}>
          {place.name}
        </Title>
        <Group gap={6} mt={8}>
          <Badge variant="light" color="gray">
            {place.category === 'kuliner' ? 'Kuliner' : 'Wisata'}
          </Badge>
          {place.category !== 'kuliner' && place.type && PLACE_TYPE_LABELS[place.type] ? (
            <Badge variant="light" color="gray">
              {PLACE_TYPE_LABELS[place.type]}
            </Badge>
          ) : null}
        </Group>

        {info.length > 0 ? (
          <Paper withBorder radius="md" py={10} mt={12}>
            <Group gap={0} wrap="nowrap" align="stretch">
              {info.map(({ icon: Icon, value, caption }, i) => (
                <Group
                  key={caption}
                  gap={8}
                  px={12}
                  wrap="nowrap"
                  align="flex-start"
                  style={{
                    flex: 1,
                    borderLeft:
                      i > 0 ? '1px solid var(--mantine-color-default-border)' : undefined,
                  }}
                >
                  <Icon size={16} color="var(--mantine-color-teal-6)" />
                  <Stack gap={0}>
                    <Text size="sm" fw={600} lh={1.3}>
                      {value}
                    </Text>
                    <Text size="xs" c="dimmed">
                      {caption}
                    </Text>
                  </Stack>
                </Group>
              ))}
            </Group>
          </Paper>
        ) : null}

        <Text size="sm" lh={1.5} mt={12}>
          {place.shortDescription}
        </Text>

        <Button
          component="a"
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          color="teal"
          leftSection={<MapPin size={18} />}
          mt={16}
        >
          Lihat di peta
        </Button>

        {related.length > 0 ? (
          <>
            <Text fw={700} mt={20}>
              Dekat sini
            </Text>
            <Group gap={12} wrap="nowrap" mt={8} style={{ overflowX: 'auto' }}>
              {related.map((r) => {
                const rc = placeCover(r);
                return (
                  <Anchor
                    key={r.id}
                    component={Link}
                    to={lp(`/wisata/${encodeURIComponent(r.slug)}`)}
                    underline="never"
                    c="inherit"
                    style={{ width: 136, flexShrink: 0 }}
                  >
                    {rc ? (
                      <Image
                        src={displayImageUrl(rc.url, { width: 400 })}
                        alt={r.name}
                        radius="md"
                        style={{ aspectRatio: '16 / 10' }}
                        fit="cover"
                      />
                    ) : (
                      <Box bg="gray.2" style={{ aspectRatio: '16 / 10', borderRadius: 8 }} />
                    )}
                    <Text size="sm" fw={600} lineClamp={1} mt={8}>
                      {r.name}
                    </Text>
                    <Text size="xs" c="dimmed">
                      {placeLabel(r)}
                    </Text>
                  </Anchor>
                );
              })}
            </Group>
          </>
        ) : null}

        {(place.sources ?? []).length > 0 ? (
          <Stack gap={4} mt={20}>
            {(place.sources ?? []).map((s) => (
              <CreditLine
                key={s.address}
                label="Sumber"
                name={s.name}
                nameUrl={s.address}
                license={s.license}
                licenseUrl={s.licenseUrl}
              />
            ))}
          </Stack>
        ) : null}

        <Paper withBorder radius="md" p="md" mt={24}>
          <Stack gap="sm">
            <Text size="sm" fw={600}>
              Lebih lengkap di aplikasi SambasKu
            </Text>
            <Button
              component="a"
              href={deepLink}
              variant="light"
              color="teal"
              leftSection={<Smartphone size={18} />}
            >
              Buka di aplikasi
            </Button>
            <Text size="xs" c="dimmed">
              Belum punya? Unduh gratis, lalu buka tautan ini lagi.
            </Text>
            <AppDownloadBadges />
          </Stack>
        </Paper>
      </Stack>
    </Box>
  );
}
