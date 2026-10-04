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
import { UtensilsCrossed, MapPin, AlertCircle } from 'lucide-react';
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

/** Tanpa subrequest saat data kosong? Tetap fetch: halaman ini kontennya. */
export async function loader({ request }: Route.LoaderArgs) {
  const items = await fetchCuisines(request.signal);
  return { items: items ?? [] };
}

export default function KulinerListPage() {
  const { items } = useLoaderData<typeof loader>();
  const navigation = useNavigation();
  const { t } = useTranslation();
  const isLoading =
    navigation.state === 'loading' &&
    stripLocalePrefix(navigation.location.pathname).path === '/kuliner';

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

        {isLoading ? (
          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} height={220} radius="md" />
            ))}
          </SimpleGrid>
        ) : items.length > 0 ? (
          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
            {items.map((c) => (
              <CuisineCard key={c.id} c={c} />
            ))}
          </SimpleGrid>
        ) : (
          <Stack align="center" gap="sm" py={48} maw={420} mx="auto">
            <ThemeIcon size={52} variant="light" color="gray" radius="xl">
              <AlertCircle size={24} />
            </ThemeIcon>
            <Title order={4} ta="center">
              {t('kuliner_emptyTitle')}
            </Title>
            <Text size="sm" c="dimmed" ta="center">
              {t('kuliner_emptyBody')}
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
  const thumb = cover ? displayImageUrl(cover.url, { width: 640, height: 360 }) : undefined;
  return (
    <Card
      component={Link}
      to={lp(`/kuliner/${encodeURIComponent(c.slug)}`)}
      withBorder
      padding="md"
      radius="md"
      shadow="none"
    >
      <Card.Section component="div">
        {thumb ? (
          <Image src={thumb} alt={c.name} h={180} fit="cover" />
        ) : (
          <Stack align="center" justify="center" h="180px" bg="var(--mantine-color-gray-0)">
            <UtensilsCrossed size={40} stroke="1.4" style={{ opacity: 0.4 }} />
          </Stack>
        )}
      </Card.Section>
      <Stack gap={6} pt="md">
        <Text size="lg" fw={700} lh={1.3}>
          {c.name}
        </Text>
        <Group gap={6} c="dimmed">
          <MapPin size={13} aria-hidden />
          <Text size="xs">{c.region}</Text>
        </Group>
        <Text size="sm" c="dimmed" lineClamp={3}>
          {c.description}
        </Text>
      </Stack>
    </Card>
  );
}
