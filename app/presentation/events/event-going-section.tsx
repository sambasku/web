import { useState, useTransition } from 'react';
import { Button, Group, Text } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import {
  markEventGoing,
  unmarkEventGoing,
  type Event,
} from '@/domain/events';
import { readAccessToken } from '@/infrastructure/auth/access-token';

function goingLabel(
  t: (key: string, opts?: Record<string, unknown>) => string,
  count: number,
  viewerGoing: boolean,
): string {
  if (viewerGoing) {
    if (count <= 1) return t('event_goingCountYou');
    return t('event_goingCountYouAndOthers', { others: count - 1 });
  }
  if (count <= 0) return t('event_goingCountZero');
  if (count === 1) return t('event_goingCountOne');
  return t('event_goingCountMany', { count });
}

/** Soft RSVP "berencana datang" di detail acara. */
export function EventGoingSection({ event }: { event: Event }) {
  const { t } = useTranslation();
  const [pending, startTransition] = useTransition();
  const [goingCount, setGoingCount] = useState(event.goingCount);
  const [viewerGoing, setViewerGoing] = useState(event.viewerGoing);
  const [error, setError] = useState<string | null>(null);

  const canToggle =
    event.occurrenceStatus === 'upcoming' || event.occurrenceStatus === 'ongoing';

  if (!canToggle && goingCount === 0 && !viewerGoing) {
    return null;
  }

  const onToggle = () => {
    if (!canToggle || pending) return;
    if (!readAccessToken()) {
      setError(t('event_goingLoginGate'));
      return;
    }
    setError(null);
    startTransition(async () => {
      try {
        const result = viewerGoing
          ? await unmarkEventGoing(event.id)
          : await markEventGoing(event.id);
        setGoingCount(result.goingCount);
        setViewerGoing(result.viewerGoing);
      } catch {
        setError(t('event_goingToggleFailed'));
      }
    });
  };

  return (
    <Group justify="space-between" align="center" mt={12} gap="sm" wrap="wrap">
      <Text size="sm" c="dimmed">
        {goingLabel(t, goingCount, viewerGoing)}
      </Text>
      {canToggle ? (
        <Button
          size="compact-sm"
          variant={viewerGoing ? 'light' : 'filled'}
          loading={pending}
          onClick={onToggle}
        >
          {viewerGoing ? t('event_goingCtaUnmark') : t('event_goingCtaMark')}
        </Button>
      ) : null}
      {error ? (
        <Text size="xs" c="red" w="100%">
          {error}
        </Text>
      ) : null}
    </Group>
  );
}
