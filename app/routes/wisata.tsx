import { Link, useLoaderData, useNavigation } from 'react-router';
import {
  Card,
  Container,
  Group,
  Image,
  SimpleGrid,
  Skeleton,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from '@mantine/core';
import { Landmark, MapPin, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { Route } from './+types/wisata';
import { fetchPlaces, placeCover, type Place, placeTypeLabels } from '@/domain/places';
import { buildPlaceListJsonLd } from '@/application/utils/place-seo';
import { buildMetaTags } from '@/application/utils/seo';
import { env } from '@/infrastructure/config/env';
import {
  DEFAULT_LOCALE,
  isAppLocale,
  localePath,
  stripLocalePrefix,
} from '@/application/i18n/locales';
import { getFixedT } from '@/application/i18n/i18n-instance';
import { useLocalePath } from '@/application/i18n/use-locale';
import { displayImageUrl } from '@/presentation/utils/display-image-url';

export function meta({ params, data }: Route.MetaArgs) {
  const locale = isAppLocale(params.locale) ? params.locale : DEFAULT_LOCALE;
  const t = getFixedT(locale);
  return [
    ...buildMetaTags({
      title: t('seo_wisataTitle'),
      description: t('seo_wisataDescription'),
      keywords: t('seo_wisataKeywords'),
      path: localePath(locale, '/wisata'),
      locale,
    }),
    ...(env.isProd && data?.items?.length
      ? [{ 'script:ld+json': buildPlaceListJsonLd(data.items, locale) }]
      : []),
  ];
}

export async function loader({ request }: Route.LoaderArgs) {
  const places = await fetchPlaces(request.signal);
  return { items: places?.filter((p) => p.category === 'wisata') ?? [] };
}

export default function WisataListPage() {
  const { items } = useLoaderData<typeof loader>();
  const navigation = useNavigation();
  const { t } = useTranslation();
  const isLoading =
    navigation.state === 'loading' &&
    stripLocalePrefix(navigation.location.pathname).path === '/wisata';

  return (
    <Container size="md" py="xl">
      <Stack gap="lg">
        <Stack gap="sm">
          <Group gap="xs">
            <ThemeIcon variant="light" size="md" radius="sm">
              <Landmark size={16} />
            </ThemeIcon>
            <Title order={1} size="h2">
              {t('wisata_heading')}
            </Title>
          </Group>
          <Text size="sm" c="dimmed" maw={640}>
            {t('wisata_intro')}
          </Text>
        </Stack>

        {isLoading ? (
          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} height={240} radius="md" />
            ))}
          </SimpleGrid>
        ) : items.length > 0 ? (
          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
            {items.map((p) => (
              <PlaceCard key={p.id} p={p} />
            ))}
          </SimpleGrid>
        ) : (
          <Stack align="center" gap="sm" py={48} maw={420} mx="auto">
            <ThemeIcon size={52} variant="light" color="gray" radius="xl">
              <AlertCircle size={24} />
            </ThemeIcon>
            <Title order={4} ta="center">
              {t('wisata_emptyTitle')}
            </Title>
            <Text size="sm" c="dimmed" ta="center">
              {t('wisata_emptyBody')}
            </Text>
          </Stack>
        )}
      </Stack>
    </Container>
  );
}

function PlaceCard({ p }: { p: Place }) {
  const lp = useLocalePath();
  const cover = placeCover(p);
  const thumb = cover
    ? displayImageUrl(cover.url, { width: 640, height: 360 })
    : undefined;
  return (
    <Card
      component={Link}
      to={lp(`/wisata/${encodeURIComponent(p.slug)}`)}
      withBorder
      padding="md"
      radius="md"
      shadow="none"
    >
      <Card.Section component="div">
        {thumb ? (
          <Image src={thumb} alt={p.name} h={180} fit="cover" />
        ) : (
          <Stack align="center" justify="center" h="180px" bg="var(--mantine-color-gray-0)">
            <Landmark size={40} stroke="1.4" style={{ opacity: 0.4 }} />
          </Stack>
        )}
      </Card.Section>
      <Stack gap={6} pt="md">
        <Text size="lg" fw={700} lh={1.3}>
          {p.name}
        </Text>
        <Group gap={6} c="dimmed">
          {p.type ? (
            <Text size="xs" fw={600} style={{ whiteSpace: 'nowrap' }}>
              {placeTypeLabels[p.type]}
            </Text>
          ) : null}
          <Group gap={4} wrap="nowrap">
            <MapPin size={13} aria-hidden />
            <Text size="xs">Sambas</Text>
          </Group>
        </Group>
        <Text size="sm" c="dimmed" lineClamp={3}>
          {p.shortDescription}
        </Text>
      </Stack>
    </Card>
  );
}
