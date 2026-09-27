import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import {
  Anchor,
  Badge,
  Box,
  Button,
  Card,
  Group,
  Image,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { Sparkles, ArrowRight, BookOpen } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { WordTypeBadge } from './word-type-badge';
import { formatDateId } from '@/application/utils/formatters';
import { useLocalePath } from '@/application/i18n/use-locale';
import type { WordOfTheDay } from '@/domain/entities/word.entity';

const MASCOT_SRC = '/paksamku-maskot-pakaian-adat-melayu.webp';
/** Samakan dengan CSS: tampil hanya di atas Mantine md (62em). */
const DESKTOP_MQ = '(min-width: 62.0625em)';

function useDesktopMascot() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(DESKTOP_MQ);
    const sync = () => setShow(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  return show;
}

export function WordOfTheDayCard({ wordOfDay }: { wordOfDay: WordOfTheDay }) {
  const word = wordOfDay.word;
  const lp = useLocalePath();
  const { t } = useTranslation();
  const showMascot = useDesktopMascot();
  if (!word) return null;

  const firstMeaning = word.meanings[0];

  return (
    <Box className="wotd-card-wrap">
      {showMascot && (
        <Image
          className="wotd-mascot"
          src={MASCOT_SRC}
          alt={t('home_wotdMascotAlt')}
          w="auto"
          fit="contain"
          decoding="async"
          loading="lazy"
          fetchPriority="low"
        />
      )}
      <Card withBorder padding="lg" radius="md" className="wotd-card">
        <Stack gap="md">
          <Group justify="space-between" gap="sm" wrap="wrap">
            <Group gap="xs">
              <Badge
                size="sm"
                variant="light"
                color="yellow"
                leftSection={<Sparkles size={13} />}
              >
                Kata Hari Ini
              </Badge>
              <Badge size="sm" variant="outline">
                {formatDateId(wordOfDay.date)}
              </Badge>
            </Group>

            {wordOfDay.is_new_this_week && (
              <Badge size="sm" variant="light" color="green">
                Baru Pekan Ini
              </Badge>
            )}
          </Group>

          <Stack gap="xs">
            <Group gap="sm" align="baseline" wrap="wrap">
              <Anchor
                component={Link}
                to={lp(`/words/${encodeURIComponent(word.lemma)}`)}
                underline="never"
                c="var(--mantine-color-text)"
              >
                <Title order={3}>{word.lemma}</Title>
              </Anchor>
              <WordTypeBadge type={word.word_type} />
              {firstMeaning?.word_class && (
                <Text size="xs" c="dimmed" fs="italic">
                  {firstMeaning.word_class.code} ({firstMeaning.word_class.name})
                </Text>
              )}
            </Group>

            {firstMeaning && (
              <Text c="dimmed" lineClamp={2} maw={640}>
                {firstMeaning.definition}
              </Text>
            )}

            {firstMeaning?.translations && firstMeaning.translations.length > 0 && (
              <Text size="sm" c="dimmed">
                Terjemahan:{' '}
                <Text span fw={500} c="var(--mantine-color-text)">
                  {firstMeaning.translations.map((tr) => tr.translation_text).join(', ')}
                </Text>
              </Text>
            )}
          </Stack>

          <Button
            component={Link}
            to={lp(`/words/${encodeURIComponent(word.lemma)}`)}
            variant="light"
            leftSection={<BookOpen size={16} />}
            rightSection={<ArrowRight size={16} />}
            size="xs"
            mt="xs"
            style={{ alignSelf: 'flex-start' }}
          >
            Pelajari Kata Ini
          </Button>
        </Stack>
      </Card>
    </Box>
  );
}
