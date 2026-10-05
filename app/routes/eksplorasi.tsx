import { Link, useLoaderData } from 'react-router';
import { Anchor, Card, Container, Group, Image, SimpleGrid, Stack, Text, ThemeIcon, Title } from '@mantine/core';
import { BookOpen, Compass, MapPin, Search, UtensilsCrossed } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { Route } from './+types/eksplorasi';
import { buildMetaTags } from '@/application/utils/seo';
import {
  DEFAULT_LOCALE,
  isAppLocale,
  localePath,
} from '@/application/i18n/locales';
import { getFixedT } from '@/application/i18n/i18n-instance';
import { useLocalePath } from '@/application/i18n/use-locale';
import { displayImageUrl } from '@/presentation/utils/display-image-url';
import { fetchCuisines, cuisineCover } from '@/domain/cuisines';
import { fetchPlaces, placeCover } from '@/domain/places';

/**
 * Halaman Eksplorasi: hub kategori konten web (grid ala tab Eksplorasi di
 * aplikasi mobile). Kartu kamus/wisata/kuliner memakai thumbnail asli dari
 * data; kartu cari & diskusi ikon saja karena bentuknya utilitas.
 */

export function meta({ params }: Route.MetaArgs) {
  const locale = isAppLocale(params.locale) ? params.locale : DEFAULT_LOCALE;
  const t = getFixedT(locale);
  return buildMetaTags({
    title: t('explore_title'),
    description: t('explore_description'),
    path: localePath(locale, '/eksplorasi'),
    locale,
  });
}

export default function EksplorasiPage() {
  const { t } = useTranslation();
  const lp = useLocalePath();
  const { places, cuisines } = useLoaderData<typeof loader>();
  const wisataCover = places.find((p) => p.category === 'wisata');
  const kulinerCover = cuisines.length > 0 ? cuisineCover(cuisines[0]) : null;

  const cards = [
    {
      to: lp('/words'),
      icon: BookOpen,
      title: t('explore_cardWords'),
      desc: t('explore_cardWordsDesc'),
      image: undefined,
      color: 'teal',
    },
    {
      to: lp('/wisata'),
      icon: MapPin,
      title: t('explore_cardWisata'),
      desc: t('explore_cardWisataDesc'),
      image: wisataCover && placeCover(wisataCover)
        ? displayImageUrl(placeCover(wisataCover)!.url, { width: 640, height: 360 })
        : undefined,
      color: 'teal',
    },
    {
      to: lp('/kuliner'),
      icon: UtensilsCrossed,
      title: t('explore_cardKuliner'),
      desc: t('explore_cardKulinerDesc'),
      image: kulinerCover
        ? displayImageUrl(kulinerCover.url, { width: 640, height: 360 })
        : undefined,
      color: 'orange',
    },
    {
      to: lp('/search'),
      icon: Search,
      title: t('explore_cardSearch'),
      desc: t('explore_cardSearchDesc'),
      image: undefined,
      color: 'violet',
    },
    {
      to: lp('/ruang-diskusi'),
      icon: Compass,
      title: t('explore_cardDiskusi'),
      desc: t('explore_cardDiskusiDesc'),
      image: undefined,
      color: 'orange',
    },
  ];

  return (
    <Container size="lg" py="xl">
      <Stack gap="lg">
        <Stack gap="xs">
          <Group gap="xs">
            <ThemeIcon variant="light" size="md" radius="sm">
              <Compass size={16} />
            </ThemeIcon>
            <Title order={1} size="h2">
              {t('explore_heading')}
            </Title>
          </Group>
          <Text size="sm" c="dimmed" maw={640}>
            {t('explore_intro')}
          </Text>
        </Stack>

        <SimpleGrid cols={{ base: 1, xs: 2, md: 3 }} spacing="md">
          {cards.map((c) => (
            <ExploreCard key={c.title} {...c} />
          ))}
        </SimpleGrid>
      </Stack>
    </Container>
  );
}

function ExploreCard({
  to,
  icon: Icon,
  title,
  desc,
  image,
  color,
}: {
  to: string;
  icon: typeof Compass;
  title: string;
  desc: string;
  image?: string;
  color: string;
}) {
  return (
    <Card
      component={Link}
      to={to}
      withBorder
      padding="md"
      radius="md"
      shadow="none"
    >
      <Card.Section component="div">
        {image ? (
          <Image src={image} alt={title} h={140} fit="cover" />
        ) : (
          <Stack align="center" justify="center" h="140px" bg={`var(--mantine-color-${color}-0)`}>
            <Icon
              size={64}
              strokeWidth={1.6}
              style={{ color: `var(--mantine-color-${color}-6)` }}
            />
          </Stack>
        )}
      </Card.Section>
      <Stack gap={4} pt="md">
        <Text size="lg" fw={700} lh={1.3}>
          {title}
        </Text>
        <Text size="sm" c="dimmed" lineClamp={2}>
          {desc}
        </Text>
      </Stack>
    </Card>
  );
}

export async function loader({ request }: Route.LoaderArgs) {
  const [places, cuisines] = await Promise.all([
    fetchPlaces(request.signal),
    fetchCuisines(request.signal),
  ]);
  return { places: places ?? [], cuisines: cuisines ?? [] };
}

export function ErrorBoundary() {
  return (
    <Container size="md" py={44}>
      <Stack align="center" gap="sm" maw={420} mx="auto">
        <Title order={1} fw={800} size="h3">
          Terjadi kesalahan
        </Title>
        <Anchor component={Link} to="/">
          Kembali ke beranda
        </Anchor>
      </Stack>
    </Container>
  );
}
