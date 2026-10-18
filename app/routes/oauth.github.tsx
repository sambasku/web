import { useEffect, useState } from 'react';
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

export default function OauthGithubCallbackPage() {
  const [stagingHref, setStagingHref] = useState('#');
  const [prodHref, setProdHref] = useState('#');

  useEffect(() => {
    const staging = androidIntentUrl('com.iamutaki.sambasku.staging');
    const prod = androidIntentUrl('com.iamutaki.sambasku');
    setStagingHref(staging);
    setProdHref(prod);
    // Coba buka app staging (dev) otomatis.
    window.location.href = staging;
  }, []);

  return (
    <Container size="sm" py="xl">
      <Stack gap="sm">
        <Title order={2}>Kembali ke aplikasi</Title>
        <Text c="dimmed">
          Menyelesaikan masuk GitHub. Kalau app tidak terbuka, ketuk tombol di
          bawah.
        </Text>
        <Button component="a" href={stagingHref}>
          Buka SambasKu Staging
        </Button>
        <Button variant="light" component="a" href={prodHref}>
          Buka SambasKu
        </Button>
      </Stack>
    </Container>
  );
}
