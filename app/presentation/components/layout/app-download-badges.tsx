import { Anchor, Image } from '@mantine/core';
import { useTranslation } from 'react-i18next';

const PLAY_STORE_URL =
  'https://play.google.com/store/apps/details?id=com.iamutaki.sambasku';

/** google_play.webp 250x75. */
const BADGE_ASPECT = 250 / 75;

/** Badge Google Play. */
export function AppDownloadBadges({ h = 36 }: { h?: number }) {
  const { t } = useTranslation();
  const w = Math.round(h * BADGE_ASPECT);

  return (
    <Anchor
      href={PLAY_STORE_URL}
      target="_blank"
      rel="noopener noreferrer"
      underline="never"
      aria-label={t('common_getAppAria')}
    >
      <Image
        src="/google_play.webp"
        alt={t('common_getOnGooglePlay')}
        h={h}
        w={w}
        fit="contain"
        decoding="async"
      />
    </Anchor>
  );
}
