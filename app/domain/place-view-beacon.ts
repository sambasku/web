/**
 * Beacon view detail place (metrik popularitas, docs/api/45-api-place-views.md).
 *
 * Modul ini SENGAJA tidak import api-client supaya bisa diuji tanpa jaringan.
 * Pemanggil mengikat fungsi `send` (web: POST /places/:slug/view).
 */

/** Bagian storage yang dipakai: `sessionStorage` browser. */
export type PlaceViewStorage = Pick<Storage, 'getItem' | 'setItem'>;

/** Kunci dedupe per slug di storage browser. */
export function placeViewKey(slug: string): string {
  return `place-view:${slug}`;
}

function browserSessionStorage(): PlaceViewStorage | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.sessionStorage;
  } catch {
    // Mode privat / storage diblokir browser.
    return null;
  }
}

/**
 * Kirim 1 view per sesi per slug. Reload halaman tidak dihitung view baru.
 *
 * `send` dipanggil paling banyak sekali per (sesi, slug). Gagal menulis
 * storage (mode privat) tidak menghalangi pengiriman - view tetap tercatat
 * tanpa dedupe.
 *
 * Return true kalau view dikirim.
 */
export function recordPlaceViewOnce(
  slug: string,
  send: (slug: string) => void,
  storage: PlaceViewStorage | null = browserSessionStorage(),
): boolean {
  const key = placeViewKey(slug);
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
