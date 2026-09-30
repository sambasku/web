import { Link, useLoaderData } from 'react-router';
import { Anchor, Container, Stack, Text, Title } from '@mantine/core';
import type { Route } from './+types/syarat-ketentuan';
import { apiClient } from '@/infrastructure/api/api-client';
import { buildMetaTags } from '@/application/utils/seo';
import {
  DEFAULT_LOCALE,
  isAppLocale,
  localePath,
} from '@/application/i18n/locales';
import { useLocalePath } from '@/application/i18n/use-locale';

type LegalDoc = {
  document_type: string;
  version: string;
  title: string;
  body_markdown: string;
  status: string;
  published_at: string | null;
};

export async function loader() {
  try {
    const res = await apiClient<LegalDoc>('/legal/documents/terms');
    return { doc: res.data, error: null as string | null };
  } catch {
    return { doc: null as LegalDoc | null, error: 'Dokumen belum tersedia' };
  }
}

export function meta({ params }: Route.MetaArgs) {
  const locale = isAppLocale(params.locale) ? params.locale : DEFAULT_LOCALE;
  return buildMetaTags({
    title: 'Syarat dan Ketentuan',
    description:
      'Syarat dan Ketentuan SambasKu: pemakaian layanan, kontribusi, dan penghapusan akun.',
    path: localePath(locale, '/syarat-ketentuan'),
    locale,
  });
}

function MarkdownBlocks({ markdown }: { markdown: string }) {
  const blocks = markdown.split(/\n{2,}/).filter(Boolean);
  return (
    <Stack gap="sm">
      {blocks.map((block, i) => {
        const trimmed = block.trim();
        if (trimmed.startsWith('# ')) {
          return (
            <Title key={i} order={1} fw={800}>
              {trimmed.slice(2)}
            </Title>
          );
        }
        if (trimmed.startsWith('## ')) {
          return (
            <Title key={i} order={2} size="h4" fw={700}>
              {trimmed.slice(3)}
            </Title>
          );
        }
        if (trimmed.startsWith('- ')) {
          const items = trimmed.split('\n').map((l) => l.replace(/^- /, '').trim());
          return (
            <Stack key={i} gap={4} pl="md">
              {items.map((item, j) => (
                <Text key={j} size="sm" lh={1.7}>
                  • {item}
                </Text>
              ))}
            </Stack>
          );
        }
        return (
          <Text key={i} size="sm" lh={1.75}>
            {trimmed.replace(/\*\*/g, '')}
          </Text>
        );
      })}
    </Stack>
  );
}

export default function TermsPage() {
  const lp = useLocalePath();
  const { doc, error } = useLoaderData<typeof loader>();

  return (
    <Container size="sm" py={44}>
      <Stack gap="xl">
        {error || !doc ? (
          <Text c="dimmed">{error ?? 'Dokumen belum tersedia'}</Text>
        ) : (
          <>
            <Text c="dimmed" size="sm">
              Versi {doc.version}
              {doc.published_at
                ? ` · Diterbitkan ${new Date(doc.published_at).toLocaleDateString('id-ID')}`
                : ''}
            </Text>
            <MarkdownBlocks markdown={doc.body_markdown} />
          </>
        )}

        <Text size="sm" c="dimmed">
          <Anchor component={Link} to={lp('/privacy-policy')}>
            Kebijakan Privasi
          </Anchor>
          {' · '}
          <Anchor component={Link} to={lp('/hapus-akun')}>
            Hapus akun
          </Anchor>
          {' · '}
          <Anchor component={Link} to={lp('/')}>
            Beranda
          </Anchor>
        </Text>
      </Stack>
    </Container>
  );
}
