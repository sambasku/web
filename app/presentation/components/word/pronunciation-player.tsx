import { Badge, Group, Text } from '@mantine/core';
import type { WordAudio } from '@/domain/entities/word.entity';
import {
  AnalyticsEvents,
  trackEvent,
} from '@/infrastructure/analytics/analytics';

/** Pemutar satu take `word_audios` - URL file, bukan teks notasi IPA. */
export function WordAudioPlayer({
  audio,
  wordId,
}: {
  audio: WordAudio;
  wordId?: string;
}) {
  // Validasi skema di trust boundary (pentest W-10): URL audio berasal dari
  // data API/kontribusi - hanya https: yang boleh jadi src/href.
  if (!audio.url.startsWith('https:')) return null;
  const speaker = audio.speaker_name?.trim();
  const pendingReview = audio.is_verified === false;

  const onPlay = () => {
    trackEvent(AnalyticsEvents.audioPlay, {
      word_id: wordId,
      has_audio: true,
    });
  };

  return (
    <Group gap={8} wrap="nowrap" align="center">
      <audio
        controls
        preload="none"
        src={audio.url}
        onPlay={onPlay}
        style={{ height: 32, maxWidth: '100%', minWidth: 180 }}
      >
        <a href={audio.url}>Unduh audio</a>
      </audio>
      <Text size="xs" c="dimmed">
        {speaker || 'Anonim'}
      </Text>
      {pendingReview ? (
        <Badge size="xs" color="yellow" variant="light">
          Menunggu pengecekan
        </Badge>
      ) : null}
      {audio.is_primary ? (
        <Badge size="xs" variant="light">
          Utama
        </Badge>
      ) : null}
    </Group>
  );
}
