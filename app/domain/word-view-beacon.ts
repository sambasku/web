/**
 * Beacon view detail kata (metrik popularitas, docs/api/59-api-word-views.md).
 *
 * Modul ini SENGAJA tidak import api-client supaya bisa diuji tanpa jaringan.
 * Pemanggil mengikat fungsi `send` (web: POST /words/lemma/:lemma/view).
 */

/** Bagian storage yang dipakai: `sessionStorage` browser. */
export type WordViewStorage = Pick<Storage, 'getItem' | 'setItem'>;

/** Kunci dedupe per lemma di storage browser. */
export function wordViewKey(lemma: string): string {
  return `word-view:${lemma}`;
}

function browserSessionStorage(): WordViewStorage | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.sessionStorage;
  } catch {
    // Mode privat / storage diblokir browser.
    return null;
  }
}

/**
 * Kirim 1 view per sesi per lemma. Reload halaman tidak dihitung view baru.
 *
 * `send` dipanggil paling banyak sekali per (sesi, lemma). Gagal menulis
 * storage (mode privat) tidak menghalangi pengiriman - view tetap tercatat
 * tanpa dedupe.
 *
 * Return true kalau view dikirim.
 */
export function recordWordViewOnce(
  lemma: string,
  send: (lemma: string) => void,
  storage: WordViewStorage | null = browserSessionStorage(),
): boolean {
  const key = wordViewKey(lemma);
  if (storage) {
    try {
      if (storage.getItem(key)) return false;
      storage.setItem(key, '1');
    } catch {
      // Lanjut kirim tanpa dedupe.
    }
  }
  send(lemma);
  return true;
}