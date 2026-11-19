/**
 * Beacon view detail entitas by slug (dedupe sessionStorage).
 *
 * Modul ini SENGAJA tidak import api-client supaya bisa diuji tanpa jaringan.
 * Pemanggil mengikat fungsi `send` dan prefix kunci per entitas.
 */

/** Bagian storage yang dipakai: `sessionStorage` browser. */
export type SlugViewStorage = Pick<Storage, 'getItem' | 'setItem'>;

/** Prefix kunci dedupe per jenis entitas. */
export const SLUG_VIEW_PREFIX = {
  usaha: 'usaha-view',
  cuisine: 'cuisine-view',
  article: 'article-view',
} as const;

/** Kunci dedupe per slug di storage browser. */
export function slugViewKey(prefix: string, slug: string): string {
  return `${prefix}:${slug}`;
}

function browserSessionStorage(): SlugViewStorage | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

/**
 * Kirim 1 view per sesi per slug. Reload halaman tidak dihitung view baru.
 *
 * Return true kalau view dikirim.
 */
export function recordSlugViewOnce(
  prefix: string,
  slug: string,
  send: (slug: string) => void,
  storage: SlugViewStorage | null = browserSessionStorage(),
): boolean {
  const key = slugViewKey(prefix, slug);
  if (storage) {
    try {
      if (storage.getItem(key)) return false;
      storage.setItem(key, '1');
    } catch {
      // Lanjut kirim tanpa dedupe.
    }
  }
  send(slug);
  return true;
}