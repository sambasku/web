import { Button, Container, Stack, Text, Title } from '@mantine/core';
import { buildMetaTags } from '../application/utils/seo';

/**
 * Callback OAuth GitHub (mobile AppAuth).
 * Path tanpa locale - harus cocok Authorization callback URL di GitHub OAuth App.
 *
 * Ideal: App Link verified → Chrome menyerahkan URL ke
 * RedirectUriReceiverActivity (halaman ini tidak terlihat).
 *
 * JANGAN auto-redirect ke app di sini: membuka app dari Custom Tab
 * men-dismiss browser → AppAuth menganggap user batal ("Masuk dibatalkan").
 * Tombol manual mengarah ke RedirectUriReceiverActivity (bukan MainActivity).
 */
export function meta() {
  return buildMetaTags({
    title: 'Masuk dengan GitHub',
    description: 'Menyelesaikan masuk SambasKu dengan GitHub.',
    path: '/oauth/github',
    noindexAlways: true,
  });
}

function androidAppAuthIntent(packageName: string): string {
  const { host, pathname, search } = window.location;
  const component =
    `${packageName}/net.openid.appauth.RedirectUriReceiverActivity`;
  return (
    `intent://${host}${pathname}${search}` +
    `#Intent;scheme=https;package=${packageName};` +
    `component=${component};end`
  );
}

function openAppAuth(packageName: string) {
  window.location.href = androidAppAuthIntent(packageName);
}

export default function OauthGithubCallbackPage() {
  return (
    <Container size="sm" py="xl">
      <Stack gap="sm">
        <Title order={2}>Lanjutkan di aplikasi</Title>
        <Text c="dimmed">
          Ketuk tombol di bawah untuk menyelesaikan masuk GitHub. Jangan tutup
          tab ini sebelum app terbuka.
        </Text>
        <Button onClick={() => openAppAuth('com.iamutaki.sambasku.staging')}>
          Lanjutkan di SambasKu Staging
        </Button>
        <Button
          variant="light"
          onClick={() => openAppAuth('com.iamutaki.sambasku')}
        >
          Lanjutkan di SambasKu
        </Button>
      </Stack>
    </Container>
  );
}
