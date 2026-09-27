import { useEffect, useState } from 'react';
import { Card, Skeleton, Stack, Title } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { getWordOfDay } from '@/application/use-cases/word.use-case';
import type { WordOfTheDay } from '@/domain/entities/word.entity';
import { WordOfTheDayCard } from './word-of-the-day-card';

type WotdStatus = 'loading' | 'ready' | 'empty';

/** Tinggi kartu tipikal di viewport mobile Lighthouse - tahan CLS A-Z/CTA. */
const WOTD_CARD_MIN_H = 200;

/**
 * Kata hari ini di-fetch di client setelah paint.
 * Loader beranda tidak menunggu /words/today supaya TTFB/LCP hero tetap cepat
 * (field data: /id sering Needs Improvement/Poor, /id/search hampir selalu Good).
 *
 * Saat loading: skeleton tinggi tetap (hindari CLS 0.16 dari inject kartu).
 * Saat empty/error: collapse - shift setelah idle jauh lebih ringan di lab CLS.
 */
export function WordOfTheDaySection() {
  const { t } = useTranslation();
  const [status, setStatus] = useState<WotdStatus>('loading');
  const [wordOfDay, setWordOfDay] = useState<WordOfTheDay | null>(null);

  useEffect(() => {
    const ac = new AbortController();
    getWordOfDay(ac.signal)
      .then((data) => {
        if (ac.signal.aborted) return;
        if (data.word) {
          setWordOfDay(data);
          setStatus('ready');
        } else {
          setStatus('empty');
        }
      })
      .catch(() => {
        if (!ac.signal.aborted) setStatus('empty');
      });
    return () => ac.abort();
  }, []);

  if (status === 'empty') return null;

  return (
    <Stack gap="xs" className="wotd-section">
      <Title order={2} size="h5" c="dimmed" tt="uppercase" fw={600}>
        {t('home_wotdHeading')}
      </Title>
      {status === 'ready' && wordOfDay?.word ? (
        <WordOfTheDayCard wordOfDay={wordOfDay} />
      ) : (
        <Card withBorder padding="lg" radius="md" mih={WOTD_CARD_MIN_H}>
          <Stack gap="md">
            <Skeleton height={22} width="40%" radius="sm" />
            <Skeleton height={28} width="55%" radius="sm" />
            <Skeleton height={14} width="90%" radius="sm" />
            <Skeleton height={14} width="70%" radius="sm" />
            <Skeleton height={28} width={140} radius="sm" mt="xs" />
          </Stack>
        </Card>
      )}
    </Stack>
  );
}
