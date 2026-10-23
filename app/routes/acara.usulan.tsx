import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { Anchor, Badge, Container, Stack, Text, Title } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import type { Route } from './+types/acara.usulan';
import { buildMetaTags } from '@/application/utils/seo';
import {
  DEFAULT_LOCALE,
  isAppLocale,
  localePath,
} from '@/application/i18n/locales';
import { getFixedT } from '@/application/i18n/i18n-instance';
import { useLocalePath } from '@/application/i18n/use-locale';
import { readAccessToken } from '@/infrastructure/auth/access-token';
import {
  fetchMyEventContributions,
  type EventContribution,
  type EventContributionStatus,
} from '@/domain/event-contributions';

export function meta({ params }: Route.MetaArgs) {
  const locale = isAppLocale(params.locale) ? params.locale : DEFAULT_LOCALE;
  const t = getFixedT(locale);
  return buildMetaTags({
    title: t('event_usulanTitle'),
    description: t('event_usulanIntro'),
    path: localePath(locale, '/acara/usulan'),
    locale,
    noindexAlways: true,
  });
}

const STATUS_KEY: Record<EventContributionStatus, string> = {
  pending: 'event_usulanStatusPending',
  needs_revision: 'event_usulanStatusNeedsRevision',
  approved: 'event_usulanStatusApproved',
  rejected: 'event_usulanStatusRejected',
};

const STATUS_COLOR: Record<EventContributionStatus, string> = {
  pending: 'yellow',
  needs_revision: 'orange',
  approved: 'teal',
  rejected: 'red',
};

export default function EventUsulanPage() {
  const lp = useLocalePath();
  const { t } = useTranslation();
  const [items, setItems] = useState<EventContribution[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!readAccessToken()) {
      setItems([]);
      return;
    }
    void fetchMyEventContributions()
      .then((rows) => setItems(rows))
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : 'Gagal memuat usulan'),
      );
  }, []);

  return (
    <Container size="md" py={28}>
      <Stack gap="md">
        <Stack gap={4}>
          <Title order={1} size="h3">
            {t('event_usulanTitle')}
          </Title>
          <Text size="sm" c="dimmed">
            {t('event_usulanIntro')}
          </Text>
        </Stack>

        <Anchor component={Link} to={lp('/acara/kontribusi')}>
          {t('event_contributeCta')}
        </Anchor>

        {error ? <Text c="red">{error}</Text> : null}
        {items?.length === 0 ? (
          <Text c="dimmed">{t('event_usulanEmpty')}</Text>
        ) : null}
        {items?.map((item) => (
          <Stack key={item.id} gap={4}>
            <Text fw={600}>{item.payload.name}</Text>
            <Badge variant="light" color={STATUS_COLOR[item.status]} tt="none">
              {t(STATUS_KEY[item.status])}
            </Badge>
            {item.status === 'rejected' && item.reject_reason_display ? (
              <Text size="xs" c="red">
                {t('event_usulanRejectReason')}: {item.reject_reason_display}
              </Text>
            ) : null}
            {item.status === 'needs_revision' && item.revision_note ? (
              <Text size="xs" c="orange.8">
                {t('event_usulanRevisionNote')}: {item.revision_note}
              </Text>
            ) : null}
          </Stack>
        ))}
      </Stack>
    </Container>
  );
}
