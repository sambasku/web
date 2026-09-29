import { Anchor, Group, Image } from '@mantine/core';
import { useTranslation } from 'react-i18next';

const PLAY_STORE_URL =
  'https://play.google.com/store/apps/details?id=com.iamutaki.sambasku';

/** Nama file tetap di rilis production; GitHub mengarah ke release terbaru. */
const APK_DOWNLOAD_URL =
  'https://github.com/sambasku/mobile/releases/latest/download/app-production-release.apk';

/** google_play.webp dan github_apk.webp sama-sama 250x75. */
const BADGE_ASPECT = 250 / 75;

/** Badge Google Play dan unduh APK, tinggi sama supaya sejajar. */
export function AppDownloadBadges({ h = 36 }: { h?: number }) {
  const { t } = useTranslation();
  const w = Math.round(h * BADGE_ASPECT);

  return (
    <Group gap="xs" wrap="nowrap" align="center">
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
      <Anchor
        href={APK_DOWNLOAD_URL}
        underline="never"
        aria-label={t('common_downloadApkAria')}
      >
        <Image
          src="/github_apk.webp"
          alt={t('common_downloadApk')}
          h={h}
          w={w}
          fit="contain"
          decoding="async"
        />
      </Anchor>
    </Group>
  );
}
