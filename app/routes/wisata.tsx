import { Fragment, useState } from 'react';
import { Link, useLoaderData } from 'react-router';
import {
  Anchor,
  Badge,
  Box,
  Divider,
  Group,
  Image,
  Paper,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { Search } from 'lucide-react';
import type { Route } from './+types/wisata';
import { buildMetaTags, buildPlaceListJsonLd } from '@/application/utils/seo';
import {
  DEFAULT_LOCALE,
  isAppLocale,
  localePath,
} from '@/application/i18n/locales';
import { useLocalePath } from '@/application/i18n/use-locale';
import {
  fetchPlaces as listPlaces,
  placeCover,
  placeLabel,
  placeTypeLabels as PLACE_TYPE_LABELS,
  type Place,
} from '@/domain/places';
import { env } from '@/infrastructure/config/env';
import { AppDownloadBadges } from '@/presentation/components/layout/app-download-badges';
import { displayImageUrl } from '@/presentation/utils/display-image-url';

/**
 * Daftar wisata & kuliner Sambas. Layout meniru list Place di mobile (satu
 * kolom selebar HP): search, chip filter satu baris, row card + divider.
 * Semua row ikut SSR supaya crawler dapat link ke setiap `/wisata/:slug`;
 * filter cuma menyaring di klien.
 */

const COLUMN_WIDTH = 480;
const THUMB = 88;

const FILTERS = ['semua', 'alam', 'budaya', 'pantai', 'sejarah', 'belanja', 'kuliner'] as const;
type Filter = (typeof FILTERS)[number];

const filterLabel = (f: Filter) =>
  f === 'semua' ? 'Semua' : f === 'kuliner' ? 'Kuliner' : PLACE_TYPE_LABELS[f];

const matchesFilter = (p: Place, f: Filter) =>
  f === 'semua' ||
  (f === 'kuliner' ? p.category === 'kuliner' : p.category === 'wisata' && p.type === f);

export function meta({ data, params }: Route.MetaArgs) {
  const locale = isAppLocale(params.locale) ? params.locale : DEFAULT_LOCALE;
  return [
    ...buildMetaTags({
      title: 'Wisata Sambas - Tempat Wisata & Kuliner di Kabupaten Sambas',
      description:
        'Daftar tempat wisata Sambas, Kalimantan Barat: situs sejarah, alam, budaya, pantai, sampai kuliner khas. Lengkap dengan foto, peta, dan sumber.',
      path: localePath(locale, '/wisata'),
      locale,
    }),
    ...(env.isProd && data
      ? [{ 'script:ld+json': buildPlaceListJsonLd(data.places, locale) }]
      : []),
  ];
}

export async function loader({ request }: Route.LoaderArgs) {
  const places = await listPlaces(request.signal);
  if (!places) throw new Response('Gagal memuat data wisata', { status: 503 });
  return { places };
}

function PlaceRow({ place }: { place: Place }) {
  const lp = useLocalePath();
  const cover = placeCover(place);
  return (
    <Anchor
      component={Link}
      to={lp(`/wisata/${encodeURIComponent(place.slug)}`)}
      underline="never"
      c="inherit"
      py={12}
      style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}
    >
      {cover ? (
        <Image
          src={displayImageUrl(cover.url, { width: 240 })}
          alt={place.name}
          w={THUMB}
          h={THUMB}
          radius={12}
          fit="cover"
          loading="lazy"
          style={{ flexShrink: 0 }}
        />
      ) : (
        <Box w={THUMB} h={THUMB} bg="gray.2" style={{ borderRadius: 12, flexShrink: 0 }} />
      )}
      <Stack gap={2} style={{ minWidth: 0 }}>
        <Text component="h2" size="sm" fw={600} lh={1.3} m={0}>
          {place.name}
        </Text>
        <Text size="xs" c="teal" fw={500}>
          {placeLabel(place)}
        </Text>
        <Text size="xs" c="dimmed" lineClamp={1}>
          {place.shortDescription}
        </Text>
      </Stack>
    </Anchor>
  );
}

export default function PlaceListPage() {
  const { places } = useLoaderData<typeof loader>();
  const [filter, setFilter] = useState<Filter>('semua');
  const [query, setQuery] = useState('');

  const q = query.trim().toLowerCase();
  const shown = places.filter(
    (p) => matchesFilter(p, filter) && (!q || p.name.toLowerCase().includes(q)),
  );

  return (
    <Box maw={COLUMN_WIDTH} mx="auto" px="md" pt="md" pb={32}>
      <Title order={1} fw={800} fz={22} lh={1.25}>
        Wisata Sambas
      </Title>
      <Text size="sm" c="dimmed" mt={4}>
        Tempat wisata dan kuliner di Kabupaten Sambas, Kalimantan Barat.
      </Text>

      <TextInput
        mt="md"
        placeholder="Cari tempat"
        aria-label="Cari tempat"
        leftSection={<Search size={16} />}
        value={query}
        onChange={(e) => setQuery(e.currentTarget.value)}
      />

      <Group
        gap={6}
        wrap="nowrap"
        mt="sm"
        pb={4}
        style={{ overflowX: 'auto', scrollbarWidth: 'none' }}
      >
        {FILTERS.map((f) => (
          <Badge
            key={f}
            component="button"
            type="button"
            size="lg"
            tt="none"
            fw={500}
            variant={filter === f ? 'filled' : 'light'}
            color={filter === f ? 'teal' : 'gray'}
            aria-pressed={filter === f}
            onClick={() => setFilter(f)}
            style={{ cursor: 'pointer', flexShrink: 0, border: 0 }}
          >
            {filterLabel(f)}
          </Badge>
        ))}
      </Group>

      {shown.length === 0 ? (
        <Text size="sm" c="dimmed" ta="center" py={40}>
          {places.length === 0
            ? 'Belum ada tempat. Nanti kami tambahkan, ya.'
            : 'Tidak ada tempat yang cocok. Coba kata lain atau ganti filter.'}
        </Text>
      ) : (
        <Box mt={4}>
          {shown.map((p, i) => (
            <Fragment key={p.id}>
              {i > 0 ? <Divider /> : null}
              <PlaceRow place={p} />
            </Fragment>
          ))}
        </Box>
      )}

      <Paper withBorder radius="md" p="md" mt={24}>
        <Stack gap="sm">
          <Text size="sm" fw={600}>
            Jelajahi dengan peta di aplikasi SambasKu
          </Text>
          <AppDownloadBadges />
        </Stack>
      </Paper>
    </Box>
  );
}
