import { Link } from 'react-router';
import { Badge, Card, Group, Stack, Text } from '@mantine/core';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { WordTypeBadge } from './word-type-badge';
import { UsageLabelsBadges } from './usage-labels-badges';
import type { WordSummary } from '@/domain/entities/word.entity';
import { useLocalePath } from '@/application/i18n/use-locale';

function glossLines(word: WordSummary): string[] {
  const sense = word.sense?.trim() || '';
  const matched = word.matched_translation?.trim() || '';
  const lines: string[] = [];
  if (sense) lines.push(sense);
  // Hindari duplikat bila matched sudah terkandung di sense (atau sama).
  if (matched && matched !== sense && !sense.includes(matched)) {
    lines.push(matched);
  }
  return lines;
}

export function WordCard({
  word,
  analyticsSource,
}: {
  word: WordSummary;
  /** Sumber navigasi untuk `word_open` (search, letter, list, ...). */
  analyticsSource?: string;
}) {
  const { t } = useTranslation();
  const lp = useLocalePath();
  const gloss = glossLines(word);

  return (
    <Card
      component={Link}
      to={lp(`/words/${encodeURIComponent(word.lemma)}`)}
      state={
        analyticsSource ? { analyticsSource } : undefined
      }
      withBorder
      padding="sm"
      radius="md"
      shadow="none"
    >
      <Group justify="space-between" gap="md" wrap="nowrap" align="flex-start">
        <Stack gap={4} style={{ flex: 1, minWidth: 0 }}>
          <Group gap="xs" wrap="wrap">
            <Text fw={600} size="lg" component="span">
              {word.lemma}
            </Text>
            {word.is_verified ? (
              <Badge
                size="sm"
                variant="light"
                color="teal"
                leftSection={<CheckCircle2 size={13} />}
              >
                {t('common_verified')}
              </Badge>
            ) : (
              <Badge size="sm" variant="light" color="yellow">
                {t('common_pendingReview')}
              </Badge>
            )}
            <WordTypeBadge type={word.word_type} />
            <UsageLabelsBadges labels={word.usage_labels} size="xs" />
          </Group>
          {gloss.length > 0 ? (
            <Text size="sm" c="dimmed" component="p" m={0}>
              {gloss.join(' · ')}
            </Text>
          ) : null}
        </Stack>

        <ArrowRight size={16} opacity={0.5} style={{ flexShrink: 0, marginTop: 6 }} />
      </Group>
    </Card>
  );
}
