import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Badge,
  Box,
  Button,
  Group,
  Modal,
  SimpleGrid,
  Skeleton,
  Stack,
  Text,
  TextInput,
  UnstyledButton,
} from '@mantine/core';
import { Search } from 'lucide-react';
import {
  STOCK_PHOTO_PROVIDERS,
  STOCK_PROVIDER_LABELS,
  listShareBackgrounds,
  type ShareBackgroundItem,
  type StockPhotoProvider,
} from '@/infrastructure/api/share-backgrounds-api';
import { displayImageUrl } from '@/presentation/utils/display-image-url';

export interface MediaExplorerModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (item: ShareBackgroundItem) => void;
  /** Query awal (mis. padanan + kategori untuk Bagikan kartu). */
  initialQuery?: string;
}

function isAbortError(err: unknown): boolean {
  return (
    (err instanceof DOMException && err.name === 'AbortError') ||
    (typeof err === 'object' &&
      err !== null &&
      'name' in err &&
      (err as { name: string }).name === 'AbortError')
  );
}

const PAGE_SIZE = 12;
const SKELETON_COUNT = 6;

function ExplorerGridSkeleton({ count = SKELETON_COUNT }: { count?: number }) {
  return (
    <SimpleGrid cols={{ base: 2, sm: 3 }} spacing="md" verticalSpacing="lg">
      {Array.from({ length: count }, (_, i) => (
        <Stack key={i} gap="sm">
          <Skeleton radius={12} style={{ aspectRatio: '4 / 3', width: '100%' }} />
          <Skeleton height={12} width="65%" radius="sm" />
        </Stack>
      ))}
    </SimpleGrid>
  );
}

/**
 * Browser foto stock untuk ilustrasi kontribusi kata (tanpa upload).
 * GET /api/v1/share/backgrounds - foto saja.
 *
 * Cangkang modal hanya mengelola `open`/`onClose`. Seluruh state sesi hidup di
 * `MediaExplorerSession`, yang di-mount ulang setiap kali modal dibuka
 * (pentest BH-01): remount itu yang mereset provider/query/halaman, sehingga
 * tidak ada `setState` di dalam effect seperti `react-hooks/set-state-in-effect`
 * dan render kedua yang tidak perlu.
 */
export function MediaExplorerModal({
  open,
  onClose,
  onSelect,
  initialQuery = '',
}: MediaExplorerModalProps) {
  return (
    <Modal
      opened={open}
      onClose={onClose}
      title="Media Explorer"
      size="lg"
      centered
      padding="lg"
      radius="md"
    >
      {open ? (
        <MediaExplorerSession
          onSelect={onSelect}
          onClose={onClose}
          initialQuery={initialQuery}
        />
      ) : null}
    </Modal>
  );
}

type LoadOptions = {
  page: number;
  query: string;
  provider: StockPhotoProvider;
  append: boolean;
};

/**
 * State hidup satu sesi eksplorasi: di-mount hanya saat modal terbuka dan
 * di-unmount saat ditutup, sehingga `abortRef` di-effect cleanup membatalkan
 * request in-flight dan sesi berikutnya selalu mulai dari state bersih.
 */
function MediaExplorerSession({
  onSelect,
  onClose,
  initialQuery = '',
}: {
  onSelect: (item: ShareBackgroundItem) => void;
  onClose: () => void;
  initialQuery?: string;
}) {
  const seeded = initialQuery.trim();
  const [provider, setProvider] = useState<StockPhotoProvider>('pixabay');
  const [query, setQuery] = useState(seeded);
  const [activeQuery, setActiveQuery] = useState(seeded);
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<ShareBackgroundItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [degraded, setDegraded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  /**
   * Fetch murni: tidak menyentuh state, jadi aman dipanggil dari event
   * handler maupun dari effect mount.
   */
  const fetchPage = useCallback(
    async (opts: LoadOptions, signal: AbortSignal) => {
      const sort = opts.query.trim() ? 'relevant' : 'popular';
      return listShareBackgrounds({
        q: opts.query,
        page: opts.page,
        sort,
        provider: opts.provider,
        limit: PAGE_SIZE,
        signal,
      });
    },
    [],
  );

  const applyResult = useCallback(
    (result: Awaited<ReturnType<typeof fetchPage>>, append: boolean) => {
      setDegraded(result.degraded);
      setItems((prev) => (append ? [...prev, ...result.items] : result.items));
      setHasMore(result.items.length >= PAGE_SIZE);
    },
    [],
  );

  const applyError = useCallback((err: unknown, append: boolean) => {
    if (isAbortError(err)) return;
    setLoadError('Gagal memuat Media Explorer');
    if (!append) setItems([]);
    setHasMore(false);
  }, []);

  const load = useCallback(
    async (opts: LoadOptions) => {
      abortRef.current?.abort();
      const ac = new AbortController();
      abortRef.current = ac;
      if (opts.append) setLoadingMore(true);
      else setLoading(true);
      setLoadError(null);
      try {
        applyResult(await fetchPage(opts, ac.signal), opts.append);
      } catch (err) {
        applyError(err, opts.append);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [applyError, applyResult, fetchPage],
  );

  useEffect(() => {
    const ac = new AbortController();
    abortRef.current = ac;
    const initial: LoadOptions = {
      page: 1,
      query: seeded,
      provider: 'pixabay',
      append: false,
    };
    void (async () => {
      try {
        // `loading` sudah true sejak state awal, jadi tidak perlu setState
        // sinkron sebelum await pertama.
        applyResult(await fetchPage(initial, ac.signal), false);
      } catch (err) {
        applyError(err, false);
      } finally {
        setLoading(false);
      }
    })();
    return () => {
      // Batalkan request yang sedang berjalan, bukan cuma yang pertama: kalau
      // user sudah searching, `load()` sudah menggantinya di `abortRef`.
      abortRef.current?.abort();
    };
  }, [applyError, applyResult, fetchPage, seeded]);

  const changeProvider = (id: StockPhotoProvider) => {
    setProvider(id);
    setPage(1);
    void load({ page: 1, query: activeQuery, provider: id, append: false });
  };

  const onSearch = () => {
    const q = query.trim();
    setActiveQuery(q);
    setPage(1);
    void load({ page: 1, query: q, provider, append: false });
  };

  const loadMore = () => {
    if (loading || loadingMore || !hasMore) return;
    const next = page + 1;
    setPage(next);
    void load({ page: next, query: activeQuery, provider, append: true });
  };

  return (
    <Stack gap="md">
      <Text size="sm" c="dimmed" lh={1.5}>
        Pilih foto stock sebagai ilustrasi kata (URL eksternal, tanpa upload).
      </Text>

      <Group gap="sm" align="flex-end" wrap="nowrap">
        <TextInput
          flex={1}
          size="md"
          placeholder="Cari (kosong = populer)"
          value={query}
          onChange={(e) => setQuery(e.currentTarget.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              onSearch();
            }
          }}
        />
        <Button size="md" leftSection={<Search size={16} />} onClick={onSearch}>
          Cari
        </Button>
      </Group>

      <Group gap="sm">
        {STOCK_PHOTO_PROVIDERS.map((id) => (
          <Badge
            key={id}
            component="button"
            type="button"
            size="lg"
            variant={provider === id ? 'filled' : 'light'}
            color={provider === id ? 'blue' : 'gray'}
            style={{ cursor: 'pointer', border: 'none', paddingInline: 14 }}
            onClick={() => changeProvider(id)}
          >
            {STOCK_PROVIDER_LABELS[id]}
          </Badge>
        ))}
      </Group>

      {degraded ? (
        <Alert color="yellow" variant="light">
          Penyedia sedang terbatas - hasil mungkin kosong.
        </Alert>
      ) : null}
      {loadError ? (
        <Alert color="red" variant="light">
          {loadError}
        </Alert>
      ) : null}

      {loading ? (
        <ExplorerGridSkeleton />
      ) : items.length === 0 ? (
        <Box py="xl" style={{ textAlign: 'center' }}>
          <Text size="sm" c="dimmed">
            Tidak ada hasil.
          </Text>
        </Box>
      ) : (
        <Stack gap="md">
          <SimpleGrid
            cols={{ base: 2, sm: 3 }}
            spacing="md"
            verticalSpacing="lg"
            style={{ maxHeight: 460, overflowY: 'auto', paddingRight: 4 }}
          >
            {items.map((item) => (
              <UnstyledButton
                key={`${item.provider}-${item.id}`}
                onClick={() => {
                  onSelect(item);
                  onClose();
                }}
                style={{
                  border: '1px solid var(--mantine-color-default-border)',
                  borderRadius: 12,
                  overflow: 'hidden',
                  background: 'var(--mantine-color-body)',
                  textAlign: 'left',
                  display: 'block',
                }}
              >
                <Box
                  style={{
                    position: 'relative',
                    width: '100%',
                    paddingBottom: '75%',
                    background: 'var(--mantine-color-default-hover)',
                  }}
                >
                  <img
                    src={displayImageUrl(item.preview_url || item.url, {
                      width: 480,
                      height: 360,
                    })}
                    alt={item.photographer}
                    loading="lazy"
                    style={{
                      position: 'absolute',
                      inset: 0,
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      display: 'block',
                    }}
                  />
                </Box>
                <Text size="xs" px="sm" py="xs" c="dimmed" lineClamp={1}>
                  {item.photographer || STOCK_PROVIDER_LABELS[item.provider]}
                </Text>
              </UnstyledButton>
            ))}
          </SimpleGrid>
          {hasMore ? (
            <Button
              variant="light"
              fullWidth
              onClick={loadMore}
              loading={loadingMore}
              disabled={loadingMore}
            >
              Muat lebih banyak
            </Button>
          ) : null}
          {loadingMore ? <ExplorerGridSkeleton count={3} /> : null}
        </Stack>
      )}
    </Stack>
  );
}
