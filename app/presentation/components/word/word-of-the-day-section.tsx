import { useEffect, useState } from 'react';
import { Stack, Title } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { getWordOfDay } from '@/application/use-cases/word.use-case';
import type { WordOfTheDay } from '@/domain/entities/word.entity';
import { WordOfTheDayCard } from './word-of-the-day-card';

/**
 * Kata hari ini di-fetch di client setelah paint.
 * Loader beranda tidak menunggu /words/today supaya TTFB/LCP hero tetap cepat
 * (field data: /id sering Needs Improvement/Poor, /id/search hampir selalu Good).
 */
export function WordOfTheDaySection() {
  const { t } = useTranslation();
  const [wordOfDay, setWordOfDay] = useState<WordOfTheDay | null>(null);

  useEffect(() => {
    const ac = new AbortController();
    getWordOfDay(ac.signal)
      .then((data) => {
        if (!ac.signal.aborted && data.word) setWordOfDay(data);
      })
      .catch(() => {
        /* diam: seksi disembunyikan kalau gagal */
      });
    return () => ac.abort();
  }, []);

  if (!wordOfDay?.word) return null;

  return (
    <Stack gap="xs" className="wotd-section">
      <Title order={2} size="h5" c="dimmed" tt="uppercase" fw={600}>
        {t('home_wotdHeading')}
      </Title>
      <WordOfTheDayCard wordOfDay={wordOfDay} />
    </Stack>
  );
}
