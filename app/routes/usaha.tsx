import { useState } from 'react';
import { Link, useLoaderData } from 'react-router';
import {
  Anchor,
  Badge,
  Box,
  Button,
  Container,
  Group,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  ThemeIcon,
  Title,
} from '@mantine/core';
import { Search, Store } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { Route } from './+types/usaha';
import { buildMetaTags } from '@/application/utils/seo';
import {
  DEFAULT_LOCALE,
  isAppLocale,
  localePath,
} from '@/application/i18n/locales';
import { getFixedT } from '@/application/i18n/i18n-instance';
import { useLocalePath } from '@/application/i18n/use-locale';
import { fetchUsahaCategories, fetchUsahas } from '@/domain/usaha';
import { UsahaCard } from '@/presentation/usaha/usaha-card';

export function meta({ params }: Route.MetaArgs) {
  const locale = isAppLocale(params.locale) ? params.locale : DEFAULT_LOCALE;
  const t = getFixedT(locale);
  return buildMetaTags({
    title: t('usaha_seoTitle'),
    description: t('usaha_seoDescription'),
    keywords: t('usaha_seoKeywords'),
    path: localePath(locale, '/usaha'),
    locale,
  });
}

export async function loader({ request }: Route.LoaderArgs) {
  const [usahas, categories] = await Promise.all([
    fetchUsahas({}, request.signal),
    fetchUsahaCategories(request.signal),
  ]);
  if (!usahas) throw new Response('Gagal memuat data usaha', { status: 503 });
  return { usahas, categories };
}

export default function UsahaListPage() {
  const { usahas, categories } = useLoaderData<typeof loader>();
  const { t } = useTranslation();
  const lp = useLocalePath();
  const [query, setQuery] = useState('');
  const [categoryId, setCategoryId] = useState<string | null>(null);

  const q = query.trim().toLowerCase();
  const shown = usahas.filter((item) => {
    if (categoryId && item.categoryId !== categoryId) return false;
    if (!q) return true;
    return (
      item.name.toLowerCase().includes(q) ||
      (item.description ?? '').toLowerCase().includes(q)
    );
  });

  return (
    <Container size="md" px="md" pt="md" pb={32}>
      <Stack gap="md">
        <Group gap="xs">
          <ThemeIcon variant="light" size="md" radius="sm">
            <Store size={16} />
          </ThemeIcon>
          <Title order={1} fw={800} fz={{ base: 22, sm: 28 }} lh={1.25}>
            {t('usaha_heading')}
          </Title>
        </Group>
        <Text size="sm" c="dimmed">
          {t('usaha_intro')}
        </Text>

        <Paper withBorder radius="md" p="md">
          <Group justify="space-between" wrap="nowrap" align="center">
            <Text size="sm" fw={600}>
              {t('usaha_contributeCta')}
            </Text>
            <Button
              component={Link}
              to={lp('/usaha/kontribusi')}
              size="compact-md"
              variant="light"
              color="teal"
            >
              {t('usaha_contributeCta')}
            </Button>
          </Group>
        </Paper>

        <TextInput
          placeholder={t('usaha_searchPlaceholder')}
          aria-label={t('usaha_searchPlaceholder')}
          leftSection={<Search size={16} />}
          value={query}
          onChange={(e) => setQuery(e.currentTarget.value)}
        />

        {categories.length > 0 ? (
          <Group
            gap={6}
            wrap="nowrap"
            pb={4}
            style={{ overflowX: 'auto', scrollbarWidth: 'none' }}
          >
            <Badge
              component="button"
              type="button"
              size="lg"
              tt="none"
              fw={500}
              variant={categoryId === null ? 'filled' : 'light'}
              color={categoryId === null ? 'teal' : 'gray'}
              aria-pressed={categoryId === null}
              onClick={() => setCategoryId(null)}
              style={{ cursor: 'pointer', flexShrink: 0, border: 0 }}
            >
              {t('usaha_filterAll')}
            </Badge>
            {categories.map((cat) => (
              <Badge
                key={cat.id}
                component="button"
                type="button"
                size="lg"
                tt="none"
                fw={500}
                variant={categoryId === cat.id ? 'filled' : 'light'}
                color={categoryId === cat.id ? 'teal' : 'gray'}
                aria-pressed={categoryId === cat.id}
                onClick={() => setCategoryId(cat.id)}
                style={{ cursor: 'pointer', flexShrink: 0, border: 0 }}
              >
                {cat.name}
              </Badge>
            ))}
          </Group>
        ) : null}

        {shown.length === 0 ? (
          <Stack align="center" gap="xs" py={40}>
            <Box w={56} h={56} bg="gray.1" style={{ borderRadius: 28 }} />
            <Text fw={600} ta="center">
              {usahas.length === 0
                ? t('usaha_emptyTitle')
                : t('usaha_noMatchTitle')}
            </Text>
            <Text size="sm" c="dimmed" ta="center">
              {usahas.length === 0
                ? t('usaha_emptyBody')
                : t('usaha_noMatchBody')}
            </Text>
          </Stack>
        ) : (
          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
            {shown.map((usaha) => (
              <UsahaCard key={usaha.id} usaha={usaha} />
            ))}
          </SimpleGrid>
        )}

        <Anchor component={Link} to={lp('/eksplorasi')} size="sm" c="dimmed">
          {t('explore_heading')}
        </Anchor>
      </Stack>
    </Container>
  );
}
