import type { ReactNode } from 'react';
import { Link, useLoaderData } from 'react-router';
import {
  Anchor,
  Badge,
  Box,
  Breadcrumbs,
  Button,
  Container,
  Divider,
  Group,
  Image,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { ArrowLeft, CalendarDays, MapPin, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { Route } from './+types/acara.$slug';
import { buildMetaTags } from '@/application/utils/seo';
import {
  buildEventJsonLd,
  buildEventSeoCopy,
} from '@/application/utils/event-seo';
import { eventSeoLabels } from '@/application/utils/event-seo-labels';
import {
  DEFAULT_LOCALE,
  isAppLocale,
  localePath,
} from '@/application/i18n/locales';
import { getFixedT } from '@/application/i18n/i18n-instance';
import { useLocalePath } from '@/application/i18n/use-locale';
import { fetchEventBySlug } from '@/domain/events';
import { formatDateTimeId } from '@/application/utils/formatters';
import { env } from '@/infrastructure/config/env';
import { safeExternalUrl } from '@/presentation/utils/safe-external-url';
import { displayImageUrl } from '@/presentation/utils/display-image-url';
import { EventStatusBadge } from '@/presentation/events/event-card';

export function meta({ params, loaderData }: Route.MetaArgs) {
  const locale = isAppLocale(params.locale) ? params.locale : DEFAULT_LOCALE;
  const t = getFixedT(locale);
  const event = loaderData?.event;
  const path = localePath(locale, `/acara/${encodeURIComponent(params.slug)}`);
  if (!event) {
    return buildMetaTags({
      title: t('event_notFoundTitle'),
      description: t('event_notFoundBody'),
      path,
      locale,
      noindexAlways: true,
    });
  }
  const { title, description } = buildEventSeoCopy(event, eventSeoLabels(locale));
  const image = event.posterUrl
    ? displayImageUrl(event.posterUrl, { width: 1200 })
    : undefined;
  return [
    ...buildMetaTags({
      title,
      description,
      path,
      locale,
      image,
      imageAlt: event.name,
      imageWidth: image ? 1200 : undefined,
      type: 'article',
    }),
    ...(env.isProd
      ? [
          {
            'script:ld+json': buildEventJsonLd(
              event,
              eventSeoLabels(locale),
              locale,
            ),
          },
        ]
      : []),
  ];
}

export async function loader({ params, request }: Route.LoaderArgs) {
  const slug = params.slug?.trim();
  if (!slug) throw new Response('Slug tidak valid', { status: 400 });

  try {
    return { slug, event: await fetchEventBySlug(slug, request.signal) };
  } catch {
    throw new Response('Gagal memuat data acara', { status: 503 });
  }
}

/** HR-01: href eksternal harus https; `safeExternalUrl` juga sisip UTM. */
function SafeExtLink({
  href,
  children,
  fw,
}: {
  href?: string | null;
  children: ReactNode;
  fw?: number;
}) {
  const safe = safeExternalUrl(href);
  if (!safe) return <>{children}</>;
  return (
    <Anchor
      href={safe}
      target="_blank"
      rel="noopener noreferrer"
      size="sm"
      fw={fw}
    >
      {children}
    </Anchor>
  );
}

export default function EventDetailPage() {
  const { event } = useLoaderData<typeof loader>();
  const lp = useLocalePath();
  const { t } = useTranslation();

  if (!event) {
    return (
      <Container size="md" px="md" py={44}>
        <Stack gap="md">
          <Title order={1} fw={800} size="h3">
            {t('event_notFoundTitle')}
          </Title>
          <Text c="dimmed">{t('event_notFoundBody')}</Text>
          <Anchor component={Link} to={lp('/acara')}>
            {t('event_backLink')}
          </Anchor>
        </Stack>
      </Container>
    );
  }

  const poster = event.posterUrl
    ? displayImageUrl(event.posterUrl, { width: 960 })
    : null;
  const mapsUrl =
    event.mapsUrl ??
    (event.lat !== null && event.lng !== null
      ? `https://www.google.com/maps/search/?api=1&query=${event.lat},${event.lng}`
      : null);
  const sourceLabel = event.sourceType
    ? t(`event_sourceType${event.sourceType.charAt(0).toUpperCase()}${event.sourceType.slice(1)}` as 'event_sourceTypeFacebook')
    : null;

  return (
    <Container size="md" px={0} pb={32}>
      {poster ? (
        <Image
          src={poster}
          alt={event.name}
          style={{ aspectRatio: '16 / 9' }}
          fit="cover"
        />
      ) : null}

      <Stack gap={0} px="md">
        <Box pt={12}>
          <Breadcrumbs separator="/">
            <Anchor component={Link} to={lp('/')} size="xs" c="dimmed">
              {t('word_homeCrumb')}
            </Anchor>
            <Anchor component={Link} to={lp('/acara')} size="xs" c="dimmed">
              {t('event_heading')}
            </Anchor>
            <Text size="xs" fw={500} lineClamp={1}>
              {event.name}
            </Text>
          </Breadcrumbs>
        </Box>

        <Title order={1} fw={800} fz={{ base: 22, sm: 30 }} lh={1.25} mt={8}>
          {event.name}
        </Title>

        <Group gap={6} mt={8}>
          <EventStatusBadge status={event.occurrenceStatus} />
          {event.category ? (
            <Badge variant="light" color="gray">
              {event.category.name}
            </Badge>
          ) : null}
          {event.village ? (
            <Badge variant="light" color="gray">
              {event.village.name}
            </Badge>
          ) : null}
        </Group>

        {event.occurrenceStatus === 'cancelled' ? (
          <Paper withBorder radius="md" p="sm" mt={12} bg="red.0">
            <Text size="sm" c="red.9">
              {t('event_cancelledNotice')}
            </Text>
          </Paper>
        ) : null}

        <Paper withBorder radius="md" p="md" mt={12}>
          <Stack gap="sm">
            <Group gap={8} wrap="nowrap" align="flex-start">
              <CalendarDays
                size={16}
                style={{ flexShrink: 0, color: 'var(--mantine-color-teal-6)' }}
                aria-hidden
              />
              <Stack gap={0}>
                <Text size="sm" fw={600} lh={1.3}>
                  {formatDateTimeId(event.startsAt)}
                </Text>
                <Text size="xs" c="dimmed">
                  {t('event_timeLabel')}
                </Text>
              </Stack>
            </Group>

            {event.locationText ? (
              <Group gap={8} wrap="nowrap" align="flex-start">
                <MapPin
                  size={16}
                  style={{ flexShrink: 0, color: 'var(--mantine-color-teal-6)' }}
                  aria-hidden
                />
                <Stack gap={0}>
                  <Text size="sm" fw={600} lh={1.3}>
                    {event.locationText}
                  </Text>
                  <Text size="xs" c="dimmed">
                    {t('event_locationLabel')}
                    {event.village ? ` - ${event.village.name}` : ''}
                  </Text>
                </Stack>
              </Group>
            ) : null}

            {event.organizer ? (
              <Group gap={8} wrap="nowrap" align="flex-start">
                <Users
                  size={16}
                  style={{ flexShrink: 0, color: 'var(--mantine-color-teal-6)' }}
                  aria-hidden
                />
                <Stack gap={0}>
                  <Text size="sm" fw={600} lh={1.3}>
                    {event.organizer}
                  </Text>
                  <Text size="xs" c="dimmed">
                    {t('event_organizerLabel')}
                  </Text>
                </Stack>
              </Group>
            ) : null}
          </Stack>
        </Paper>

        {event.description ? (
          <Text size="sm" lh={1.6} mt={14}>
            {event.description}
          </Text>
        ) : null}

        {mapsUrl ? (
          <Button
            component="a"
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            color="teal"
            leftSection={<MapPin size={18} />}
            mt={16}
          >
            {t('event_mapsButton')}
          </Button>
        ) : null}

        {event.sourceUrl ? (
          <Stack gap={4} mt={20}>
            <Divider />
            <Text size="xs" c="dimmed" fw={600} tt="uppercase">
              {t('event_sourceHeading')}
            </Text>
            <Group gap={8} align="center">
              <SafeExtLink href={event.sourceUrl} fw={600}>
                {t('event_sourceHeading')}
              </SafeExtLink>
              {sourceLabel ? (
                <Badge variant="light" color="gray" size="xs" tt="none">
                  {sourceLabel}
                </Badge>
              ) : null}
            </Group>
            {event.sourceAttribution ? (
              <Text size="xs" c="dimmed">
                {t('event_sourceAttribution', { name: event.sourceAttribution })}
              </Text>
            ) : null}
          </Stack>
        ) : null}

        {event.places.length > 0 ? (
          <Stack gap={8} mt={20}>
            <Text fw={700}>{t('event_placesHeading')}</Text>
            <SimpleGrid cols={{ base: 1, xs: 2, sm: 3 }} spacing="md">
              {event.places.map((place) => (
                <Anchor
                  key={place.id}
                  component={Link}
                  to={lp(`/wisata/${encodeURIComponent(place.slug)}`)}
                  underline="never"
                  c="inherit"
                >
                  <Text size="sm" fw={600} lineClamp={1}>
                    {place.name}
                  </Text>
                </Anchor>
              ))}
            </SimpleGrid>
          </Stack>
        ) : null}

        <Anchor
          component={Link}
          to={lp('/acara')}
          size="sm"
          mt={24}
          style={{ alignSelf: 'flex-start' }}
        >
          <Group gap={6} wrap="nowrap">
            <ArrowLeft size={14} aria-hidden />
            {t('event_backLink')}
          </Group>
        </Anchor>
      </Stack>
    </Container>
  );
}
