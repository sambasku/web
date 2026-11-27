import { useState, useTransition } from 'react';
import { Button, Group, Text } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import {
  eventDateReached,
  markEventGoing,
  unmarkEventGoing,
  type Event,
} from '@/domain/events';
import { readAccessToken } from '@/infrastructure/auth/access-token';

function goingLabel(
  t: (key: string, opts?: Record<string, unknown>) => string,
  count: number,
  viewerGoing: boolean,
  reached: boolean,
): string {
  const tense = reached ? 'Attend' : 'Plan';
  if (viewerGoing) {
    if (count <= 1) return t(`event_goingCountYou${tense}`);
    return t(`event_goingCountYouAndOthers${tense}`, { others: count - 1 });
  }
  if (count <= 0) return t(`event_goingCountZero${tense}`);
  if (count === 1) return t(`event_goingCountOne${tense}`);
  return t(`event_goingCountMany${tense}`, { count });
}

/** Kehadiran di detail acara. Tense ikut tanggal WIB. */
export function EventGoingSection({ event }: { event: Event }) {
  const { t } = useTranslation();
  const [pending, startTransition] = useTransition();
  const [goingCount, setGoingCount] = useState(event.goingCount);
  const [viewerGoing, setViewerGoing] = useState(event.viewerGoing);
  const [error, setError] = useState<string | null>(null);

  const canToggle =
    event.occurrenceStatus === 'upcoming' || event.occurrenceStatus === 'ongoing';
  const reached = eventDateReached(event.startsAt);

  if (!canToggle && goingCount === 0 && !viewerGoing) {
    return null;
  }

  const onToggle = () => {
    if (!canToggle || pending) return;
    if (!readAccessToken()) {
      setError(t(reached ? 'event_goingLoginGateAttend' : 'event_goingLoginGatePlan'));
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
        setError(t(reached ? 'event_goingToggleFailedAttend' : 'event_goingToggleFailedPlan'));
      }
    });
  };

  return (
    <Group justify="space-between" align="center" mt={12} gap="sm" wrap="wrap">
      <Text size="sm" c="dimmed">
        {goingLabel(t, goingCount, viewerGoing, reached)}
      </Text>
      {canToggle ? (
        <Button
          size="compact-sm"
          variant={viewerGoing ? 'light' : 'filled'}
          loading={pending}
          onClick={onToggle}
        >
          {viewerGoing
            ? t(reached ? 'event_goingCtaUnmarkAttend' : 'event_goingCtaUnmarkPlan')
            : t(reached ? 'event_goingCtaMarkAttend' : 'event_goingCtaMarkPlan')}
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
