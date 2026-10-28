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
import { CalendarPlus, Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { Route } from './+types/acara';
import { buildMetaTags } from '@/application/utils/seo';
import { buildEventListJsonLd } from '@/application/utils/event-seo';
import { eventSeoLabels } from '@/application/utils/event-seo-labels';
import {
  DEFAULT_LOCALE,
  isAppLocale,
  localePath,
} from '@/application/i18n/locales';
import { getFixedT } from '@/application/i18n/i18n-instance';
import { useLocalePath } from '@/application/i18n/use-locale';
import { fetchEvents } from '@/domain/events';
import { env } from '@/infrastructure/config/env';
import { EventCard } from '@/presentation/events/event-card';

export function meta({ params, loaderData }: Route.MetaArgs) {
  const locale = isAppLocale(params.locale) ? params.locale : DEFAULT_LOCALE;
  const t = getFixedT(locale);
  return [
    ...buildMetaTags({
      title: t('event_seoTitle'),
      description: t('event_seoDescription'),
      keywords: t('event_seoKeywords'),
      path: localePath(locale, '/acara'),
      locale,
    }),
    ...(env.isProd && loaderData?.events?.length
      ? [
          {
            'script:ld+json': buildEventListJsonLd(
              loaderData.events,
              eventSeoLabels(locale),
              locale,
            ),
          },
        ]
      : []),
  ];
}

export async function loader({ request }: Route.LoaderArgs) {
  const events = await fetchEvents({}, request.signal);
  if (!events) throw new Response('Gagal memuat data acara', { status: 503 });
  return { events };
}

type TimeTab = 'all' | 'upcoming' | 'ongoing' | 'completed';

const TABS: Array<{ value: TimeTab; labelKey: string }> = [
  { value: 'all', labelKey: 'event_tabAll' },
  { value: 'upcoming', labelKey: 'event_tabUpcoming' },
  { value: 'ongoing', labelKey: 'event_tabOngoing' },
  { value: 'completed', labelKey: 'event_tabCompleted' },
];

export default function EventListPage() {
  const { events } = useLoaderData<typeof loader>();
  const lp = useLocalePath();
  const { t } = useTranslation();
  const [tab, setTab] = useState<TimeTab>('all');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  const categories = [
    ...new Map(
      events
        .filter((e) => e.category?.name)
        .map((e) => [e.categoryId, e.category!.name] as const),
    ).entries(),
  ].map(([id, name]) => ({ value: id, label: name }));

  const q = query.trim().toLowerCase();
  const shown = events.filter((e) => {
    if (tab !== 'all' && e.occurrenceStatus !== tab) return false;
    if (categoryId && e.categoryId !== categoryId) return false;
    if (q && !e.name.toLowerCase().includes(q)) return false;
    return true;
  });

  return (
    <Container size="md" px="md" pt="md" pb={32}>
      <Stack gap="md">
        <Group gap="xs">
          <ThemeIcon variant="light" size="md" radius="sm">
            <CalendarPlus size={16} />
          </ThemeIcon>
          <Title order={1} fw={800} fz={{ base: 22, sm: 28 }} lh={1.25}>
            {t('event_heading')}
          </Title>
        </Group>
        <Text size="sm" c="dimmed">
          {t('event_intro')}
        </Text>

        <Paper withBorder radius="md" p="md">
          <Group justify="space-between" wrap="nowrap" align="center">
            <Text size="sm" fw={600}>
              {t('event_contributeCta')}
            </Text>
            <Button
              component={Link}
              to={lp('/acara/kontribusi')}
              size="compact-md"
              variant="light"
              color="teal"
            >
              {t('event_contributeCta')}
            </Button>
          </Group>
        </Paper>

        <TextInput
          placeholder={t('event_searchPlaceholder')}
          aria-label={t('event_searchPlaceholder')}
          leftSection={<Search size={16} />}
          value={query}
          onChange={(e) => setQuery(e.currentTarget.value)}
        />

        <Group
          gap={6}
          wrap="nowrap"
          pb={4}
          style={{ overflowX: 'auto', scrollbarWidth: 'none' }}
        >
          {TABS.map((item) => (
            <Badge
              key={item.value}
              component="button"
              type="button"
              size="lg"
              tt="none"
              fw={500}
              variant={tab === item.value ? 'filled' : 'light'}
              color={tab === item.value ? 'teal' : 'gray'}
              aria-pressed={tab === item.value}
              onClick={() => setTab(item.value)}
              style={{ cursor: 'pointer', flexShrink: 0, border: 0 }}
            >
              {t(item.labelKey)}
            </Badge>
          ))}
        </Group>

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
              {t('event_filterAll')}
            </Badge>
            {categories.map((cat) => (
              <Badge
                key={cat.value}
                component="button"
                type="button"
                size="lg"
                tt="none"
                fw={500}
                variant={categoryId === cat.value ? 'filled' : 'light'}
                color={categoryId === cat.value ? 'teal' : 'gray'}
                aria-pressed={categoryId === cat.value}
                onClick={() => setCategoryId(cat.value)}
                style={{ cursor: 'pointer', flexShrink: 0, border: 0 }}
              >
                {cat.label}
              </Badge>
            ))}
          </Group>
        ) : null}

        {shown.length === 0 ? (
          <Stack align="center" gap="xs" py={40}>
            <Box w={56} h={56} bg="gray.1" style={{ borderRadius: 28 }} />
            <Text fw={600} ta="center">
              {events.length === 0
                ? t('event_emptyTitle')
                : t('event_noMatchTitle')}
            </Text>
            <Text size="sm" c="dimmed" ta="center">
              {events.length === 0
                ? t('event_emptyBody')
                : t('event_noMatchBody')}
            </Text>
          </Stack>
        ) : (
          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
            {shown.map((event) => (
              <EventCard key={event.id} event={event} />
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
