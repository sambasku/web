import { useState } from 'react';
import { Link, useLoaderData, useNavigation } from 'react-router';
import {
  Anchor,
  Badge,
  Box,
  Container,
  Group,
  Image,
  SimpleGrid,
  Skeleton,
  Stack,
  Text,
  TextInput,
  ThemeIcon,
  Title,
} from '@mantine/core';
import { UtensilsCrossed, AlertCircle, Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { Route } from './+types/kuliner';
import { fetchCuisines, cuisineCover, type Cuisine } from '@/domain/cuisines';
import {
  buildCuisineListJsonLd,
} from '@/application/utils/cuisine-seo';
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
      title: t('seo_kulinerTitle'),
      description: t('seo_kulinerDescription'),
      keywords: t('seo_kulinerKeywords'),
      path: localePath(locale, '/kuliner'),
      locale,
    }),
    ...(env.isProd && data?.items?.length
      ? [{ 'script:ld+json': buildCuisineListJsonLd(data.items, locale) }]
      : []),
  ];
}

const THUMB = 88;

/** Tanpa subrequest saat data kosong? Tetap fetch: halaman ini kontennya. */
export async function loader({ request }: Route.LoaderArgs) {
  const items = await fetchCuisines(request.signal);
  return { items: items ?? [] };
}

export default function KulinerListPage() {
  const { items } = useLoaderData<typeof loader>();
  const navigation = useNavigation();
  const { t } = useTranslation();
  const [filter, setFilter] = useState<string>('semua');
  const [query, setQuery] = useState('');
  const isLoading =
    navigation.state === 'loading' &&
    stripLocalePrefix(navigation.location.pathname).path === '/kuliner';

  // Chip filter unik dari region yang ada di data; kosong = "Semua" saja.
  const regions = [...new Set(items.map((c) => c.region).filter(Boolean))].sort();

  const q = query.trim().toLowerCase();
  const shown = items.filter(
    (c) =>
      (filter === 'semua' || c.region === filter) &&
      (!q || c.name.toLowerCase().includes(q)),
  );

  return (
    <Container size="md" py="xl">
      <Stack gap="lg">
        <Stack gap="sm">
          <Group gap="xs">
            <ThemeIcon variant="light" size="md" radius="sm">
              <UtensilsCrossed size={16} />
            </ThemeIcon>
            <Title order={1} size="h2">
              {t('kuliner_heading')}
            </Title>
          </Group>
          <Text size="sm" c="dimmed" maw={640}>
            {t('kuliner_intro')}
          </Text>
        </Stack>

        <TextInput
          placeholder={t('kuliner_searchPlaceholder')}
          aria-label={t('kuliner_searchPlaceholder')}
          leftSection={<Search size={16} />}
          value={query}
          onChange={(e) => setQuery(e.currentTarget.value)}
        />

        {regions.length > 0 ? (
          <Group gap={6} wrap="nowrap" pb={4} style={{ overflowX: 'auto', scrollbarWidth: 'none' }}>
            {['semua', ...regions].map((r) => (
              <Badge
                key={r}
                component="button"
                type="button"
                size="lg"
                tt="none"
                fw={500}
                variant={filter === r ? 'filled' : 'light'}
                color={filter === r ? 'teal' : 'gray'}
                aria-pressed={filter === r}
                onClick={() => setFilter(r)}
                style={{ cursor: 'pointer', flexShrink: 0, border: 0 }}
              >
                {r === 'semua' ? t('kuliner_filterAll') : r}
              </Badge>
            ))}
          </Group>
        ) : null}

        {isLoading ? (
          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} height={THUMB + 24} radius="md" />
            ))}
          </SimpleGrid>
        ) : shown.length > 0 ? (
          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
            {shown.map((c) => (
              <CuisineCard key={c.id} c={c} />
            ))}
          </SimpleGrid>
        ) : (
          <Stack align="center" gap="sm" py={48} maw={420} mx="auto">
            <ThemeIcon size={52} variant="light" color="gray" radius="xl">
              <AlertCircle size={24} />
            </ThemeIcon>
            <Title order={4} ta="center">
              {items.length === 0 ? t('kuliner_emptyTitle') : t('kuliner_noMatchTitle')}
            </Title>
            <Text size="sm" c="dimmed" ta="center">
              {items.length === 0 ? t('kuliner_emptyBody') : t('kuliner_noMatchBody')}
            </Text>
          </Stack>
        )}
      </Stack>
    </Container>
  );
}

function CuisineCard({ c }: { c: Cuisine }) {
  const lp = useLocalePath();
  const cover = cuisineCover(c);
  const thumb = cover ? displayImageUrl(cover.url, { width: 240 }) : undefined;
  return (
    <Anchor
      component={Link}
      to={lp(`/kuliner/${encodeURIComponent(c.slug)}`)}
      underline="never"
      c="inherit"
      py={12}
      style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}
    >
      {thumb ? (
        <Image
          src={thumb}
          alt={c.name}
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
        <Text component="h2" fz={{ base: 15, sm: 17 }} fw={600} lh={1.3} m={0}>
          {c.name}
        </Text>
        <Text fz={{ base: 12, sm: 14 }} c="dimmed" fw={500}>
          {c.region}
        </Text>
        <Text fz={{ base: 12, sm: 14 }} c="dimmed" lineClamp={1}>
          {c.description}
        </Text>
      </Stack>
    </Anchor>
  );
}
