import { useEffect } from 'react';
import { Button, Container, Stack, Text, Title } from '@mantine/core';
import { buildMetaTags } from '../application/utils/seo';

/**
 * Callback OAuth GitHub (mobile AppAuth).
 * Path tanpa locale - harus cocok Authorization callback URL di GitHub OAuth App.
 * Idealnya App Link / Universal Link langsung ke RedirectUriReceiverActivity;
 * halaman ini fallback jika dibuka di browser (App Link belum verified).
 */
export function meta() {
  return buildMetaTags({
    title: 'Masuk dengan GitHub',
    description: 'Menyelesaikan masuk SambasKu dengan GitHub.',
    path: '/oauth/github',
    noindexAlways: true,
  });
}

function androidIntentUrl(packageName: string): string {
  const { host, pathname, search } = window.location;
  return (
    `intent://${host}${pathname}${search}` +
    `#Intent;scheme=https;package=${packageName};end`
  );
}

function openApp(packageName: string) {
  window.location.href = androidIntentUrl(packageName);
}

export default function OauthGithubCallbackPage() {
  useEffect(() => {
    // Coba buka app staging (dev) otomatis.
    openApp('com.iamutaki.sambasku.staging');
  }, []);

  return (
    <Container size="sm" py="xl">
      <Stack gap="sm">
        <Title order={2}>Kembali ke aplikasi</Title>
        <Text c="dimmed">
          Menyelesaikan masuk GitHub. Kalau app tidak terbuka, ketuk tombol di
          bawah.
        </Text>
        <Button onClick={() => openApp('com.iamutaki.sambasku.staging')}>
          Buka SambasKu Staging
        </Button>
        <Button
          variant="light"
          onClick={() => openApp('com.iamutaki.sambasku')}
        >
          Buka SambasKu
        </Button>
      </Stack>
    </Container>
  );
}
