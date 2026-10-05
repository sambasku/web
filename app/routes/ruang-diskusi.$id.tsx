import { Link, useLoaderData } from 'react-router';
import {
  Anchor,
  Badge,
  Button,
  Card,
  Container,
  Group,
  Image,
  SimpleGrid,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import {
  ArrowBigDown,
  ArrowBigUp,
  ArrowLeft,
  Languages,
  Pin,
} from 'lucide-react';
import type { Route } from './+types/ruang-diskusi.$id';
import { getDiscussionDetail } from '@/application/use-cases/discussion.use-case';
import { buildMetaTags } from '@/application/utils/seo';
import {
  DEFAULT_LOCALE,
  isAppLocale,
  localePath,
} from '@/application/i18n/locales';
import { useLocalePath } from '@/application/i18n/use-locale';

import { formatDateId } from '@/application/utils/formatters';
import { displayImageUrl } from '@/presentation/utils/display-image-url';
import { safeExternalUrl } from '@/presentation/utils/safe-external-url';
import type { DiscussionReply } from '@/domain/entities/discussion.entity';
import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';
import {
  AnalyticsEvents,
  trackEvent,
} from '@/infrastructure/analytics/analytics';
import { hasViolenceWarning } from '@/domain/image-content-warnings';

export function meta({ data, params }: Route.MetaArgs) {
  const locale = isAppLocale(params.locale) ? params.locale : DEFAULT_LOCALE;
  if (!data?.help) {
    return buildMetaTags({
      title: 'Ruang Diskusi Tidak Ditemukan',
      description:
        'Baca obrolan warga di Ruang Diskusi. Buka atau balas lewat aplikasi SambasKu.',
      path: localePath(locale, '/ruang-diskusi'),
    locale,
    });
  }

  const excerpt =
    data.help.body?.trim().slice(0, 140) ||
    'Obrolan warga di Ruang Diskusi.';
  const safeImage = data.help.images.find(
    (img) => !hasViolenceWarning(img.content_warnings),
  );
  const rawImage = safeImage?.public_url;
  const ogImage = displayImageUrl(rawImage, { width: 1200 });

  return buildMetaTags({
    title: 'Ruang Diskusi',
    description: excerpt,
    path: localePath(locale, `/ruang-diskusi/${encodeURIComponent(data.help.id)}`),
    image: ogImage,
    type: 'article',
    locale,
    // Thread tidak di sitemap - temukan lewat daftar, bukan SERP.
    noindexAlways: true,
  });
}

export async function loader({ params, request }: Route.LoaderArgs) {
  const id = params.id?.trim();
  if (!id) {
    throw new Response('ID tidak valid', { status: 400 });
  }

  try {
    const help = await getDiscussionDetail(id, request.signal);
    return { help };
  } catch (error) {
    const status = (error as { statusCode?: number }).statusCode ?? 404;
    throw new Response('Ruang diskusi tidak ditemukan', { status });
  }
}

function replyBodyLabel(reply: DiscussionReply): string {
  if (reply.status === 'taken_down') {
    return 'Balasan ini sudah diturunkan oleh moderasi.';
  }
  if (reply.status === 'deleted_by_author') {
    return 'Balasan dihapus penulisnya.';
  }
  return reply.body?.trim() || '';
}

function sortReplies(replies: DiscussionReply[]): DiscussionReply[] {
  return [...replies].sort((a, b) => {
    if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1;
    const netA = (a.upvotes ?? 0) - (a.downvotes ?? 0);
    const netB = (b.upvotes ?? 0) - (b.downvotes ?? 0);
    if (netA !== netB) return netB - netA;
    return b.created_at.localeCompare(a.created_at);
  });
}

export default function RuangDiskusiDetailPage() {
  const lp = useLocalePath();
  const { t } = useTranslation();
  const [violenceRevealed, setViolenceRevealed] = useState(false);

  const { help } = useLoaderData<typeof loader>();
  const replies = sortReplies(help.replies);
  const author =
    help.display_name?.trim() || help.username || 'Pengguna';
  // HR-01: link_url input bebas pembuat diskusi - hanya https yang boleh
  // jadi anchor; skema lain tampil sebagai teks polos.
  const linkUrl = safeExternalUrl(help.link_url?.trim());

  useEffect(() => {
    trackEvent(AnalyticsEvents.discussionView, {
      view: 'detail',
      discussion_id: help.id,
      reply_count: replies.length,
    });
  }, [help.id, replies.length]);

  return (
    <Container size="sm" py={44}>
      <Stack gap="xl">
        <Group gap={6} wrap="wrap">
          <Anchor component={Link} to={lp('/')} size="xs" c="dimmed">
            {t('word_homeCrumb')}
          </Anchor>
          <Text size="xs" c="dimmed">
            /
          </Text>
          <Anchor component={Link} to={lp('/ruang-diskusi')} size="xs" c="dimmed">
            Ruang Diskusi
          </Anchor>
        </Group>

        <Button
          component={Link}
          to={lp('/ruang-diskusi')}
          variant="subtle"
          size="compact-sm"
          leftSection={<ArrowLeft size={15} />}
          w="fit-content"
        >
          Kembali ke feed
        </Button>

        <Stack gap="md">
          <Group gap="xs">
            <Languages size={20} />
            <Title order={1} fw={800} size="h2">
              Ruang Diskusi
            </Title>
          </Group>

          <Text size="sm" c="dimmed">
            {author} · {formatDateId(help.created_at)}
            {(help.upvotes ?? 0) > 0 ? ` · ↑ ${help.upvotes}` : ''}
          </Text>

          {help.body?.trim() ? (
            <Text size="lg" style={{ whiteSpace: 'pre-wrap' }}>
              {help.body}
            </Text>
          ) : null}

          {linkUrl ? (
            <Anchor
              href={linkUrl}
              target="_blank"
              rel="noopener noreferrer"
              size="sm"
            >
              {linkUrl}
            </Anchor>
          ) : help.link_url?.trim() ? (
            <Text size="sm" style={{ wordBreak: 'break-all' }}>
              {help.link_url.trim()}
            </Text>
          ) : null}

          {help.images.length > 0 ? (
            <SimpleGrid cols={{ base: 1, xs: 2 }} spacing="sm">
              {help.images.map((img) => {
                const src = displayImageUrl(img.public_url, { width: 800 });
                const violent = hasViolenceWarning(img.content_warnings);
                if (violent && !violenceRevealed) {
                  return (
                    <Button
                      key={img.public_url}
                      variant="default"
                      h={200}
                      onClick={() => setViolenceRevealed(true)}
                      styles={{
                        root: {
                          position: 'relative',
                          overflow: 'hidden',
                          padding: 0,
                        },
                      }}
                    >
                      <Image
                        src={src}
                        alt=""
                        h={200}
                        w="100%"
                        fit="cover"
                        style={{ filter: 'blur(24px)', transform: 'scale(1.08)' }}
                      />
                      <Text
                        size="sm"
                        fw={600}
                        c="white"
                        style={{
                          position: 'absolute',
                          inset: 0,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: 'rgba(0,0,0,0.45)',
                        }}
                      >
                        Konten kekerasan · ketuk untuk lihat
                      </Text>
                    </Button>
                  );
                }
                return (
                  <Image
                    key={img.public_url}
                    src={src}
                    alt="Lampiran ruang diskusi"
                    radius="md"
                    fit="cover"
                    mah={320}
                  />
                );
              })}
            </SimpleGrid>
          ) : null}

          <Text size="sm" c="dimmed">
            ↑ {help.upvotes ?? 0}
          </Text>
        </Stack>

        <Stack gap="sm">
          <Title order={2} size="h4">
            Balasan ({replies.length})
          </Title>

          {replies.length === 0 ? (
          <Text size="sm" c="dimmed">
            Belum ada balasan. Kamu bisa jadi yang pertama lewat aplikasi.
          </Text>
          ) : (
            <Stack gap="sm">
              {replies.map((reply) => (
                <Card key={reply.id} withBorder padding="md" radius="md" shadow="none">
                  <Stack gap="xs">
                    <Group gap="xs" wrap="wrap">
                      <Text size="sm" fw={600}>
                        {reply.display_name?.trim() || reply.username || 'Pengguna'}
                      </Text>
                      {reply.is_verifier ? (
                        <Badge size="sm" color="teal" variant="light">
                          Verifikator
                        </Badge>
                      ) : null}
                      {reply.is_pinned ? (
                        <Badge
                          size="sm"
                          color="yellow"
                          variant="light"
                          leftSection={<Pin size={11} />}
                        >
                          Disematkan
                        </Badge>
                      ) : null}
                      <Text size="xs" c="dimmed">
                        {formatDateId(reply.created_at)}
                      </Text>
                    </Group>
                    <Text
                      size="sm"
                      c={reply.status === 'published' ? undefined : 'dimmed'}
                      fs={reply.status === 'published' ? undefined : 'italic'}
                      style={{ whiteSpace: 'pre-wrap' }}
                    >
                      {replyBodyLabel(reply)}
                    </Text>
                    {reply.status === 'published' ? (
                      <Text size="xs" c="dimmed">
                        <ArrowBigDown size={12} /> {reply.downvotes ?? 0} ·{' '}
                        <ArrowBigUp size={12} /> {reply.upvotes ?? 0}
                      </Text>
                    ) : null}
                  </Stack>
                </Card>
              ))}
            </Stack>
          )}
        </Stack>
      </Stack>
    </Container>
  );
}
