import { Link } from 'react-router';
import { Anchor, Badge, Box, Group, Image, Paper, Stack, Text } from '@mantine/core';
import { CalendarDays, MapPin } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { Event, EventOccurrenceStatus } from '@/domain/events-parse';
import { useLocalePath } from '@/application/i18n/use-locale';
import { formatDateTimeId } from '@/application/utils/formatters';
import { displayImageUrl } from '@/presentation/utils/display-image-url';

/**
 * Kartu acara untuk daftar `/acara` dan daftar terkait di detail wisata.
 * Ringkas: poster, tanggal, lokasi, kategori, badge status.
 */

const STATUS_COLOR: Record<EventOccurrenceStatus, string> = {
  upcoming: 'teal',
  ongoing: 'green',
  completed: 'gray',
  cancelled: 'red',
};

const STATUS_KEY: Record<EventOccurrenceStatus, string> = {
  upcoming: 'event_statusUpcoming',
  ongoing: 'event_statusOngoing',
  completed: 'event_statusCompleted',
  cancelled: 'event_statusCancelled',
};

export function EventStatusBadge({ status }: { status: EventOccurrenceStatus }) {
  const { t } = useTranslation();
  return (
    <Badge variant="light" color={STATUS_COLOR[status]} size="sm" tt="none">
      {t(STATUS_KEY[status])}
    </Badge>
  );
}

export function EventCard({ event }: { event: Event }) {
  const lp = useLocalePath();
  const { t } = useTranslation();
  const poster = event.posterUrl
    ? displayImageUrl(event.posterUrl, { width: 480, height: 270 })
    : null;

  return (
    <Anchor
      component={Link}
      to={lp(`/acara/${encodeURIComponent(event.slug)}`)}
      underline="never"
      c="inherit"
      style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}
    >
      {poster ? (
        <Image
          src={poster}
          alt={event.name}
          w={112}
          h={84}
          radius={12}
          fit="cover"
          loading="lazy"
          style={{ flexShrink: 0 }}
        />
      ) : (
        <Box
          w={112}
          h={84}
          bg="gray.2"
          style={{ borderRadius: 12, flexShrink: 0 }}
        />
      )}
      <Stack gap={4} style={{ minWidth: 0 }}>
        <Group gap={6} wrap="wrap">
          <EventStatusBadge status={event.occurrenceStatus} />
          {event.category ? (
            <Badge variant="light" color="gray" size="sm" tt="none">
              {event.category.name}
            </Badge>
          ) : null}
        </Group>
        <Text component="h3" fz={{ base: 15, sm: 16 }} fw={600} lh={1.3} m={0}>
          {event.name}
        </Text>
        <Group gap={6} wrap="nowrap" style={{ minWidth: 0 }}>
          <CalendarDays
            size={13}
            style={{ flexShrink: 0, color: 'var(--mantine-color-teal-6)' }}
            aria-hidden
          />
          <Text fz={12} c="dimmed" lineClamp={1}>
            {formatDateTimeId(event.startsAt)}
          </Text>
        </Group>
        {event.locationText ? (
          <Group gap={6} wrap="nowrap" style={{ minWidth: 0 }}>
            <MapPin
              size={13}
              style={{ flexShrink: 0, color: 'var(--mantine-color-teal-6)' }}
              aria-hidden
            />
            <Text fz={12} c="dimmed" lineClamp={1}>
              {event.locationText}
            </Text>
          </Group>
        ) : null}
      </Stack>
    </Anchor>
  );
}

/** Daftar acara pendek untuk section "Agenda terkait". */
export function EventMiniList({ events }: { events: Event[] }) {
  const lp = useLocalePath();
  const { t } = useTranslation();
  return (
    <Stack gap="xs" mt={8}>
      <Text fw={700}>{t('event_agendaHeading')}</Text>
      {events.map((event) => (
        <Paper key={event.id} withBorder radius="md" p="sm">
          <Stack gap={4}>
            <Group gap={8} wrap="wrap">
              <EventStatusBadge status={event.occurrenceStatus} />
              <Text fz={13} fw={600} lineClamp={1}>
                {event.name}
              </Text>
            </Group>
            <Text fz={12} c="dimmed">
              {formatDateTimeId(event.startsAt)}
              {event.locationText ? ` - ${event.locationText}` : ''}
            </Text>
            <Anchor
              component={Link}
              to={lp(`/acara/${encodeURIComponent(event.slug)}`)}
              size="xs"
              fw={600}
            >
              {t('event_detailLink')}
            </Anchor>
          </Stack>
        </Paper>
      ))}
    </Stack>
  );
}
