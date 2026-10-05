import { Link, useLoaderData, useNavigation, useSearchParams } from 'react-router';
import {
  Alert,
  Badge,
  Button,
  Card,
  Container,
  Group,
  Image,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { Languages } from 'lucide-react';
import type { Route } from './+types/ruang-diskusi';
import { listPublishedDiscussions } from '@/application/use-cases/discussion.use-case';
import { buildMetaTags, buildDiscussionFaqJsonLd } from '@/application/utils/seo';
import { getFixedT } from '@/application/i18n/i18n-instance';
import {
  DEFAULT_LOCALE,
  isAppLocale,
  localePath,
  stripLocalePrefix,
} from '@/application/i18n/locales';
import { useTranslation } from 'react-i18next';
import { useLocalePath } from '@/application/i18n/use-locale';

import { formatDateId } from '@/application/utils/formatters';
import { displayImageUrl } from '@/presentation/utils/display-image-url';
import { hasViolenceWarning } from '@/domain/image-content-warnings';
import { env } from '@/infrastructure/config/env';
import type { DiscussionPublicItem } from '@/domain/entities/discussion.entity';
import { useEffect } from 'react';
import {
  AnalyticsEvents,
  trackEvent,
} from '@/infrastructure/analytics/analytics';

const PLAY_STORE_URL =
  'https://play.google.com/store/apps/details?id=com.iamutaki.sambasku';

export function meta({ params }: Route.MetaArgs) {
  const locale = isAppLocale(params.locale) ? params.locale : DEFAULT_LOCALE;
  const t = getFixedT(locale);
  return [
    ...buildMetaTags({
      title: t('seo_diskusiTitle'),
      description: t('seo_diskusiDescription'),
      keywords: t('seo_diskusiKeywords'),
      path: localePath(locale, '/ruang-diskusi'),
      locale,
    }),
    ...(env.isProd ? [{ 'script:ld+json': buildDiscussionFaqJsonLd(locale) }] : []),
  ];
}

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const cursor = url.searchParams.get('cursor') || undefined;
  const sortParam = url.searchParams.get('sort');
  const sort = sortParam === 'popular' ? 'popular' : 'latest';

  try {
    const res = await listPublishedDiscussions({
      limit: 20,
      cursor,
      sort,
      signal: request.signal,
    });
    return {
      items: res.data,
      meta: res.meta ?? { limit: 20, next_cursor: null, has_more: false },
      sort,
    };
  } catch {
    return {
      items: [] as DiscussionPublicItem[],
      meta: { limit: 20, next_cursor: null, has_more: false },
      sort,
    };
  }
}

function HelpCard({ item }: { item: DiscussionPublicItem }) {
  const lp = useLocalePath();
  const preview = item.body?.trim() || 'Pertanyaan dengan gambar';
  const safeThumb = item.images.find((img) => !hasViolenceWarning(img.content_warnings));
  const thumb = displayImageUrl(safeThumb?.public_url, { width: 320, height: 200 });
  const hasViolenceOnly =
    item.images.length > 0 && !safeThumb && item.images.some((img) => hasViolenceWarning(img.content_warnings));

  return (
    <Card
      component={Link}
      to={lp(`/ruang-diskusi/${encodeURIComponent(item.id)}`)}
      withBorder
      padding="md"
      radius="md"
      shadow="none"
    >
      <Stack gap="sm">
        {thumb ? (
          <Image src={thumb} alt="" radius="sm" h={140} fit="cover" />
        ) : hasViolenceOnly ? (
          <Text size="xs" c="dimmed">
            Foto berisi peringatan kekerasan - buka detail untuk melihat.
          </Text>
        ) : null}
        <Text size="sm" lineClamp={3}>
          {preview}
        </Text>
        <Group gap="xs" wrap="nowrap" justify="space-between">
          <Text size="xs" c="dimmed">
            ↑ {item.upvotes ?? 0}
          </Text>
          <Text size="xs" c="dimmed" lineClamp={1}>
            {item.display_name?.trim() || item.username || 'Pengguna'} ·{' '}
            {formatDateId(item.created_at)}
          </Text>
        </Group>
      </Stack>
    </Card>
  );
}

export default function RuangDiskusiFeedPage() {
  const { items, meta, sort } = useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigation = useNavigation();
  const isLoading =
    navigation.state === 'loading' &&
    stripLocalePrefix(navigation.location.pathname).path === '/ruang-diskusi';
  const { t } = useTranslation();

  useEffect(() => {
    trackEvent(AnalyticsEvents.discussionView, {
      view: 'feed',
      sort,
      result_count: items.length,
    });
    // Mount / ganti sort (bukan setiap pagination cursor).
    // eslint-disable-next-line react-hooks/exhaustive-deps -- feed view once per sort
  }, [sort]);

  const setSort = (next: 'latest' | 'popular') => {
    const nextParams = new URLSearchParams(searchParams);
    if (next === 'latest') nextParams.delete('sort');
    else nextParams.set('sort', next);
    nextParams.delete('cursor');
    setSearchParams(nextParams);
  };

  return (
    <Container size="md" py={44}>
      <Stack gap="xl">
        <Stack gap="sm">
          <Group gap="xs">
            <Languages size={22} />
            <Title order={1} fw={800}>
              Ruang Diskusi
            </Title>
          </Group>
          <Text c="dimmed" maw={560}>
            Obrolan warga yang sudah tayang. Membaca bebas di web; membuka
            atau membalas thread lewat aplikasi SambasKu.
          </Text>
        </Stack>

        {/* Alert banner: di Ruang Diskusi kamu bisa tanya soal bahasa & budaya Sambas */}
        <Alert
          variant="light"
          color="teal"
          title={t('diskusi_alertTitle')}
          icon={<Languages size={16} />}
        >
          {t('diskusi_alertBody')}
        </Alert>

        <Group gap="xs">
          <Button
            size="compact-sm"
            variant={sort === 'latest' ? 'filled' : 'light'}
            onClick={() => setSort('latest')}
          >
            Terbaru
          </Button>
          <Button
            size="compact-sm"
            variant={sort === 'popular' ? 'filled' : 'light'}
            onClick={() => setSort('popular')}
          >
            Populer
          </Button>
        </Group>

        {isLoading ? (
          <Text c="dimmed" size="sm">
            Memuat…
          </Text>
        ) : items.length === 0 ? (
          <Stack gap="xs" py="xl" align="center">
            <Badge variant="light" color="gray">
              Belum ada yang tayang
            </Badge>
            <Text c="dimmed" ta="center" maw={420}>
              Belum ada yang tayang. Mulai lewat aplikasi SambasKu, nanti
              muncul di sini.
            </Text>
            <Button
              component="a"
              href={PLAY_STORE_URL}
              target="_blank"
              rel="noopener noreferrer"
              variant="light"
              leftSection={<Smartphone size={16} />}
            >
              Buka di Google Play
            </Button>
          </Stack>
        ) : (
          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
            {items.map((item) => (
              <HelpCard key={item.id} item={item} />
            ))}
          </SimpleGrid>
        )}

        {meta.has_more && meta.next_cursor ? (
          <Group justify="center">
            <Button
              variant="default"
              onClick={() => {
                const next = new URLSearchParams();
                next.set('cursor', meta.next_cursor as string);
                if (sort === 'popular') next.set('sort', 'popular');
                setSearchParams(next);
              }}
            >
              Muat lebih banyak
            </Button>
          </Group>
        ) : null}
      </Stack>
    </Container>
  );
}
