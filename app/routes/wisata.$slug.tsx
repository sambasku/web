import type { ReactNode } from 'react';
import { Link, useLoaderData } from 'react-router';
import {
  Anchor,
  Badge,
  Box,
  Button,
  Container,
  Group,
  Image,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { Clock, MapPin, Phone } from 'lucide-react';
import type { Route } from './+types/wisata.$slug';
import { buildMetaTags, buildPlaceJsonLd } from '@/application/utils/seo';
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
import { safeExternalUrl } from '@/presentation/utils/safe-external-url';
import { displayImageUrl } from '@/presentation/utils/display-image-url';

/**
 * Fallback web untuk link share tempat (`/wisata/:slug`) bila aplikasi belum
 * terpasang: hero, kredit foto, judul, badge, info, deskripsi, peta, dekat
 * sini, sumber, lalu ajakan buka aplikasi. Responsif: Container md di desktop,
 * tetap satu kolom di HP.
 */

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
  if (!places) throw new Response('Gagal memuat data wisata', { status: 503 });
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
      {/* HR-01: URL dari JSON CDN pihak ketiga; non-https render teks polos. */}
      <SafeAnchor href={nameUrl} fw={600}>
        {name}
        {suffix}
      </SafeAnchor>
      {license ? (
        <>
          {' · '}
          <SafeAnchor href={licenseUrl} c="dimmed" underline="always">
            {license}
          </SafeAnchor>
        </>
      ) : null}
    </Text>
  );
}

/** HR-01: href dari JSON CDN; non-https/URL rusak render anak sebagai teks. */
function SafeAnchor({
  href,
  children,
  fw,
  c,
  underline,
}: {
  href?: string;
  children: ReactNode;
  fw?: number;
  c?: string;
  underline?: 'always' | 'never' | 'hover';
}) {
  const safe = safeExternalUrl(href);
  if (!safe) return <>{children}</>;
  return (
    <Anchor
      href={safe}
      target="_blank"
      rel="noopener noreferrer"
      size="xs"
      fw={fw}
      c={c}
      underline={underline}
    >
      {children}
    </Anchor>
  );
}

export default function PlaceSharePage() {
  const lp = useLocalePath();
  const { slug, place, related } = useLoaderData<typeof loader>();

  if (!place) {
    return (
      <Container size="md" px="md" py={44}>
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
      </Container>
    );
  }

  const cover = placeCover(place);
  const credit = cover?.attribution;
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${place.lat},${place.lng}`;
  const info = [
    place.hours ? { icon: Clock, value: place.hours, caption: 'Jam buka' } : null,
    place.contact ? { icon: Phone, value: place.contact, caption: 'Kontak' } : null,
  ].filter((i) => i !== null);

  return (
    <Container size="md" px={0} pb={32}>
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
        <Title order={1} fw={800} fz={{ base: 22, sm: 30 }} lh={1.25} mt={2}>
          {place.name}
        </Title>
        <Group gap={6} mt={8}>
          <Badge variant="light" color="gray">
            {placeLabel(place)}
          </Badge>
          {place.category !== 'kuliner' && place.type && (
            <Badge variant="light" color="gray">
              {PLACE_TYPE_LABELS[place.type]}
            </Badge>
          )}
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
            <SimpleGrid cols={{ base: 2, xs: 3, sm: 4 }} spacing="md" mt={8}>
              {related.map((r) => {
                const rc = placeCover(r);
                return (
                  <Anchor
                    key={r.id}
                    component={Link}
                    to={lp(`/wisata/${encodeURIComponent(r.slug)}`)}
                    underline="never"
                    c="inherit"
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
            </SimpleGrid>
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
      </Stack>
    </Container>
  );
}
