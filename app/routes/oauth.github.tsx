import { Container, Stack, Text, Title } from '@mantine/core';
import { buildMetaTags } from '../application/utils/seo';

/**
 * Callback OAuth GitHub (mobile AppAuth).
 * Path tanpa locale - harus cocok Authorization callback URL di GitHub OAuth App.
 * Idealnya App Link / Universal Link langsung ke RedirectUriReceiverActivity;
 * halaman ini fallback jika dibuka di browser.
 */
export function meta() {
  return buildMetaTags({
    title: 'Masuk dengan GitHub',
    description: 'Menyelesaikan masuk SambasKu dengan GitHub.',
    path: '/oauth/github',
    noindexAlways: true,
  });
}

export default function OauthGithubCallbackPage() {
  return (
    <Container size="sm" py="xl">
      <Stack gap="sm">
        <Title order={2}>Kembali ke aplikasi</Title>
        <Text c="dimmed">
          Jika SambasKu tidak terbuka otomatis, tutup tab ini lalu buka app
          lagi. Pastikan kamu memakai perangkat yang sama dengan yang memulai
          masuk GitHub.
        </Text>
      </Stack>
    </Container>
  );
}
