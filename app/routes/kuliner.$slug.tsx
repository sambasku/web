import type { ReactNode } from 'react';
import { Link, useLoaderData } from 'react-router';
import {
  Anchor,
  Badge,
  Breadcrumbs,
  Container,
  Divider,
  Group,
  Image,
  List,
  Paper,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from '@mantine/core';
import { ArrowLeft, ChefHat, MapPin, UtensilsCrossed } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { Route } from './+types/kuliner.$slug';
import {
  fetchCuisineBySlug,
  cuisineCover,
} from '@/domain/cuisines';
import { buildCuisineJsonLd } from '@/application/utils/cuisine-seo';
import { buildMetaTags } from '@/application/utils/seo';
import { env } from '@/infrastructure/config/env';
import { safeExternalUrl } from '@/presentation/utils/safe-external-url';
import {
  DEFAULT_LOCALE,
  isAppLocale,
  localePath,
} from '@/application/i18n/locales';
import { getFixedT } from '@/application/i18n/i18n-instance';
import { useLocalePath } from '@/application/i18n/use-locale';
import { displayImageUrl } from '@/presentation/utils/display-image-url';

export function meta({ params, data }: Route.MetaArgs) {
  const locale = isAppLocale(params.locale) ? params.locale : DEFAULT_LOCALE;
  const t = getFixedT(locale);
  const c = data?.cuisine;
  if (!c) {
    return buildMetaTags({
      title: t('kuliner_notFoundTitle'),
      description: t('kuliner_notFoundBody'),
      path: localePath(locale, '/kuliner'),
      locale,
    });
  }
  const cover = cuisineCover(c);
  const desc = c.servingSuggestion
    ? `${c.description} ${c.servingSuggestion}`
    : c.description;
  return [
    ...buildMetaTags({
      title: t('kuliner_seoDetailTitle', { name: c.name }),
      description: desc.length > 158 ? `${desc.slice(0, 157)}…` : desc,
      keywords: c.tags.length ? c.tags.join(', ') : undefined,
      path: localePath(locale, `/kuliner/${encodeURIComponent(c.slug)}`),
      image: cover ? displayImageUrl(cover.url, { width: 1200 }) : undefined,
      imageAlt: cover?.attribution
        ? `${c.name} - ${cover.attribution.name}`
        : c.name,
      imageWidth: cover ? 1200 : undefined,
      type: 'article',
      locale,
    }),
    ...(env.isProd
      ? [{ 'script:ld+json': buildCuisineJsonLd(c, locale) }]
      : []),
  ];
}

export async function loader({ params, request }: Route.LoaderArgs) {
  const slug = params.slug ?? '';
  const cuisine = await fetchCuisineBySlug(slug, request.signal);
  if (!cuisine) {
    throw new Response('Not Found', { status: 404 });
  }
  return { cuisine };
}

/** HR-01: href dari JSON CDN; non-https/URL rusak render anak sebagai teks. */
function SafeExtLink({
  href,
  children,
  rel,
}: {
  href?: string;
  children: ReactNode;
  rel?: string;
}) {
  const safe = safeExternalUrl(href);
  if (!safe) return <>{children}</>;
  return (
    <Anchor
      href={safe}
      target="_blank"
      rel={rel ?? 'noopener noreferrer'}
      size="xs"
      c="inherit"
    >
      {children}
    </Anchor>
  );
}

export default function KulinerDetailPage() {
  const { cuisine: c } = useLoaderData<typeof loader>();
  const { t } = useTranslation();
  const lp = useLocalePath();
  const cover = cuisineCover(c);
  const heroUrl = cover ? displayImageUrl(cover.url, { width: 1200 }) : undefined;

  return (
    <Container size="md" py="xl">
      <Stack gap="lg">
        <Breadcrumbs separator="→">
          <Anchor component={Link} to={lp('/')} size="xs" c="dimmed">
            {t('word_homeCrumb')}
          </Anchor>
          <Anchor component={Link} to={lp('/kuliner')} size="xs" c="dimmed">
            {t('seo_kulinerTitle')}
          </Anchor>
          <Text size="xs" fw={500} lineClamp={1}>
            {c.name}
          </Text>
        </Breadcrumbs>

        <Stack gap="xs">
          <Group gap="xs">
            <ThemeIcon variant="light" size="md" radius="sm">
              <UtensilsCrossed size={16} />
            </ThemeIcon>
            <Title order={1} size="h2">
              {c.name}
            </Title>
          </Group>
          <Group gap={6} c="dimmed">
            <MapPin size={13} aria-hidden />
            <Text size="xs">{c.region}</Text>
          </Group>
        </Stack>

        {heroUrl ? (
          <Image
            src={heroUrl}
            alt={cover?.attribution ? `${c.name} - foto oleh ${cover.attribution.name}` : c.name}
            radius="md"
            mah={420}
            fit="cover"
          />
        ) : null}

        {cover?.attribution ? (
          <Text size="xs" c="dimmed">
            Foto:{' '}
            <SafeExtLink href={cover.attribution.url}>
              {cover.attribution.name}
            </SafeExtLink>
            {cover.attribution.license ? (
              <>
                {' · '}
                <SafeExtLink
                  href={cover.attribution.license_url}
                  rel="noopener noreferrer license"
                >
                  {cover.attribution.license}
                </SafeExtLink>
              </>
            ) : null}
          </Text>
        ) : null}

        <Text size="md" lh={1.7}>
          {c.description}
        </Text>

        {c.ingredients.length > 0 ? (
          <Paper withBorder p="md" radius="md">
            <Stack gap="sm">
              <Group gap="xs">
                <ChefHat size={16} aria-hidden />
                <Text size="sm" fw={700}>
                  {t('kuliner_ingredientsHeading')}
                </Text>
              </Group>
              <List size="sm" c="dimmed" spacing={4}>
                {c.ingredients.map((bahan) => (
                  <List.Item key={bahan}>{bahan}</List.Item>
                ))}
              </List>
            </Stack>
          </Paper>
        ) : null}

        {c.servingSuggestion ? (
          <Stack gap="xs">
            <Text size="sm" fw={700}>
              {t('kuliner_servingHeading')}
            </Text>
            <Text size="sm" c="dimmed" lh={1.7}>
              {c.servingSuggestion}
            </Text>
          </Stack>
        ) : null}

        {c.tags.length > 0 ? (
          <Group gap={6}>
            {c.tags.map((tag) => (
              <Badge key={tag} variant="light" color="gray" size="sm">
                {tag}
              </Badge>
            ))}
          </Group>
        ) : null}

        {c.sources.length > 0 ? (
          <>
            <Divider />
            <Stack gap={4}>
              <Text size="xs" c="dimmed" fw={600} tt="uppercase">
                {t('kuliner_sourcesHeading')}
              </Text>
              {c.sources.map((s) => (
                <Text key={s.address} size="xs" c="dimmed">
                  {s.name}
                  {s.license ? ` · ${s.license}` : ''}
                  {' - '}
                  <Anchor href={s.address} target="_blank" rel="noopener noreferrer" size="xs">
                    {s.address}
                  </Anchor>
                </Text>
              ))}
            </Stack>
          </>
        ) : null}

        <Anchor component={Link} to={lp('/kuliner')} size="sm">
          <Group gap={6} wrap="nowrap">
            <ArrowLeft size={14} aria-hidden />
            {t('kuliner_backLink')}
          </Group>
        </Anchor>
      </Stack>
    </Container>
  );
}
