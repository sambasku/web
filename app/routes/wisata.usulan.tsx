import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { Anchor, Badge, Container, Stack, Text, Title } from '@mantine/core';
import type { Route } from './+types/wisata.usulan';
import { buildMetaTags } from '@/application/utils/seo';
import { DEFAULT_LOCALE, isAppLocale, localePath } from '@/application/i18n/locales';
import { useLocalePath } from '@/application/i18n/use-locale';
import { apiClient } from '@/infrastructure/api/api-client';
import { authHeaders, readAccessToken } from '@/infrastructure/auth/access-token';

export function meta({ params }: Route.MetaArgs) {
  const locale = isAppLocale(params.locale) ? params.locale : DEFAULT_LOCALE;
  return buildMetaTags({
    title: 'Usulan wisata saya',
    description: 'Status usulan tempat wisata yang kamu kirim.',
    path: localePath(locale, '/wisata/usulan'),
    locale,
    noindexAlways: true,
  });
}

interface Proposal {
  id: string;
  status: 'pending' | 'approved' | 'rejected';
  reject_reason_display?: string | null;
  payload: { name: string; slug: string };
}

const LABEL = { pending: 'Menunggu', approved: 'Disetujui', rejected: 'Ditolak' } as const;

export default function WisataUsulanPage() {
  const lp = useLocalePath();
  const [items, setItems] = useState<Proposal[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!readAccessToken()) {
      setItems([]);
      return;
    }
    void apiClient<{ items: Proposal[] }>('/place-contributions/mine', { headers: authHeaders() })
      .then((res) => setItems(res.data.items))
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Gagal memuat'));
  }, []);

  return (
    <Container size="md" py={28}>
      <Stack>
        <Title order={1} size="h3">Usulan saya</Title>
        <Anchor component={Link} to={lp('/wisata/kontribusi')}>Usulkan tempat baru</Anchor>
        {error ? <Text c="red">{error}</Text> : null}
        {items?.length === 0 ? (
          <Text c="dimmed">
            Usulan dari web masuk tanpa akun, jadi tidak ada daftar pribadi di sini.
          </Text>
        ) : null}
        {items?.map((item) => (
          <Stack key={item.id} gap={2}>
            <Text fw={600}>{item.payload.name}</Text>
            <Badge variant="light">{LABEL[item.status]}</Badge>
            {item.status === 'rejected' && item.reject_reason_display ? (
              <Text size="xs" c="red">
                Alasan: {item.reject_reason_display}
              </Text>
            ) : null}
          </Stack>
        ))}
      </Stack>
    </Container>
  );
}
