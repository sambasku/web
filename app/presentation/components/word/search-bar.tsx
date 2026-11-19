import { useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import {
  ActionIcon,
  Box,
  Button,
  Group,
  Paper,
  SegmentedControl,
  Stack,
  Text,
  TextInput,
  UnstyledButton,
} from '@mantine/core';
import { useClickOutside, useDebouncedCallback } from '@mantine/hooks';
import { Search, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { stripLocalePrefix } from '@/application/i18n/locales';
import { useLocalePath } from '@/application/i18n/use-locale';
import { searchWords } from '@/application/use-cases/word.use-case';
import type { WordSummary } from '@/domain/entities/word.entity';

export interface SearchBarProps {
  initialQuery?: string;
  initialDirection?: 'lemma' | 'translation';
  autoFocus?: boolean;
}

const BLUR_IDLE_MS = 600;

/**
 * Kotak pencarian + typeahead: saran lemma muncul setelah 2 karakter dengan
 * debounce 300 ms. Typeahead pakai `record_miss=false`; bila saran kosong
 * setelah settle, fire-and-forget commit miss (tanpa wajib Enter). Enter /
 * Cari / blur idle tetap navigasi `/search`.
 */
export function SearchBar({
  initialQuery = '',
  initialDirection = 'lemma',
  autoFocus = false,
}: SearchBarProps) {
  const [q, setQ] = useState(initialQuery);
  const [direction, setDirection] = useState<'lemma' | 'translation'>(initialDirection);
  const [suggestions, setSuggestions] = useState<WordSummary[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const abortRef = useRef<AbortController | null>(null);
  const blurTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const lp = useLocalePath();
  const clickOutsideRef = useClickOutside(() => setOpen(false));

  const clearBlurTimer = () => {
    if (blurTimerRef.current != null) {
      clearTimeout(blurTimerRef.current);
      blurTimerRef.current = null;
    }
  };

  const fetchSuggestions = useDebouncedCallback(async (query: string) => {
    abortRef.current?.abort();
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setSuggestions([]);
      setOpen(false);
      return;
    }
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    try {
      const res = await searchWords({
        q: trimmed,
        limit: 6,
        searchIn: direction,
        recordMiss: false,
        signal: ctrl.signal,
      });
      setSuggestions(res.data);
      setActive(-1);
      setOpen(res.data.length > 0);
      // Saran kosong setelah jeda = user sudah "mencari"; catat miss tanpa
      // menunggu Enter / navigasi /search.
      if (res.data.length === 0) {
        void searchWords({
          q: trimmed,
          limit: 1,
          searchIn: direction,
          recordMiss: true,
        }).catch(() => {
          /* best-effort */
        });
      }
    } catch {
      // dibatalkan (request baru) atau gagal jaringan: biarkan saran terakhir
    }
  }, 300);

  const goWord = (word: WordSummary) => {
    clearBlurTimer();
    setOpen(false);
    navigate(lp(`/words/${encodeURIComponent(word.lemma)}`), {
      state: { analyticsSource: 'search' },
    });
  };

  const goSearchPage = (query: string) => {
    clearBlurTimer();
    setOpen(false);
    const nextPath = lp(
      '/search',
      `?q=${encodeURIComponent(query)}&search_in=${direction}`,
    );
    const { path: currentPath } = stripLocalePrefix(location.pathname);
    const currentQ = new URLSearchParams(location.search).get('q')?.trim() ?? '';
    const currentIn =
      (new URLSearchParams(location.search).get('search_in') as
        | 'lemma'
        | 'translation'
        | null) || 'lemma';
    // Sudah di /search dengan q+arah sama → jangan navigasi ulang (blur idle).
    if (
      currentPath === '/search' &&
      currentQ === query &&
      currentIn === direction
    ) {
      return;
    }
    navigate(nextPath);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (open && active >= 0 && suggestions[active]) {
      goWord(suggestions[active]);
      return;
    }
    const query = q.trim();
    if (!query) return;
    goSearchPage(query);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open || suggestions.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, -1));
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  const handleBlur = () => {
    clearBlurTimer();
    blurTimerRef.current = setTimeout(() => {
      const query = q.trim();
      // Hanya commit ke /search bila tidak sedang memilih saran.
      if (query.length >= 2 && !open) {
        goSearchPage(query);
      }
    }, BLUR_IDLE_MS);
  };

  return (
    <form onSubmit={handleSearch} style={{ width: '100%' }}>
      <Stack gap="xs" w="100%" maw={640} mx="auto">
        <Box pos="relative" ref={clickOutsideRef}>
          <TextInput
            data-autofocus={autoFocus ? true : undefined}
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              fetchSuggestions(e.target.value);
            }}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              clearBlurTimer();
              if (suggestions.length > 0) setOpen(true);
            }}
            onBlur={handleBlur}
            placeholder={
              direction === 'lemma' ? t('search_placeholderLemma') : t('search_placeholderTranslation')
            }
            size="md"
            leftSection={<Search size={16} />}
            rightSectionWidth={q ? 110 : 84}
            rightSection={
              <Group gap={4} wrap="nowrap" pr={4}>
                {q && (
                  <ActionIcon
                    variant="subtle"
                    size="sm"
                    onClick={() => {
                      setQ('');
                      setSuggestions([]);
                      setOpen(false);
                    }}
                    aria-label={t('search_clearAria')}
                  >
                    <X size={14} />
                  </ActionIcon>
                )}
                <Button
                  type="submit"
                  size="compact-sm"
                  leftSection={<Search size={14} />}
                >
                  {t('search_submit')}
                </Button>
              </Group>
            }
            aria-autocomplete="list"
            aria-expanded={open}
            role="combobox"
            aria-controls="search-suggestions"
          />

          {open && suggestions.length > 0 && (
            <Paper
              id="search-suggestions"
              role="listbox"
              aria-label={t('search_suggestAria')}
              pos="absolute"
              top="calc(100% + 4px)"
              left={0}
              right={0}
              shadow="md"
              withBorder
              radius="sm"
              style={{ zIndex: 200, overflow: 'hidden' }}
            >
              {suggestions.map((word, i) => (
                <UnstyledButton
                  key={word.id}
                  component={Link}
                  to={lp(`/words/${encodeURIComponent(word.lemma)}`)}
                  state={{ analyticsSource: 'search' }}
                  onMouseDown={(e) => {
                    // Cegah blur-idle navigate ke /search saat klik saran.
                    e.preventDefault();
                    clearBlurTimer();
                  }}
                  onClick={() => {
                    clearBlurTimer();
                    setOpen(false);
                  }}
                  role="option"
                  aria-selected={i === active}
                  w="100%"
                  px="sm"
                  py={7}
                  style={{
                    display: 'block',
                    background:
                      i === active
                        ? 'var(--mantine-color-default-hover)'
                        : undefined,
                  }}
                >
                  <Group justify="space-between" gap="sm" wrap="nowrap">
                    <Text size="sm" fw={600} component="span">
                      {word.lemma}
                    </Text>
                    <Text size="xs" c="dimmed" component="span">
                      {word.word_type}
                    </Text>
                  </Group>
                </UnstyledButton>
              ))}
            </Paper>
          )}
        </Box>

        <Group justify="space-between" gap="sm" wrap="nowrap">
          <SegmentedControl
            size="xs"
            value={direction}
            onChange={(value) => setDirection(value as 'lemma' | 'translation')}
            data={[
              { value: 'lemma', label: t('search_directionLemma') },
              { value: 'translation', label: t('search_directionTranslation') },
            ]}
          />
          <Text size="xs" c="dimmed" visibleFrom="sm" style={{ whiteSpace: 'nowrap' }}>
            {t('search_pressEnter')}
          </Text>
        </Group>
      </Stack>
    </form>
  );
}
