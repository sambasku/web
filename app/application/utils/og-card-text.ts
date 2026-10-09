/**
 * Util teks kartu OG (murni, tanpa dependensi wasm) - dipakai route
 * og.words[.]png.ts dan unit test og-card-text.test.ts.
 */

/**
 * Charset lemma yang diizinkan di kartu OG. Unicode-aware: lemma nyata
 * berisi spasi ("Agek buat ape"), apostrof ("Ae'k maddas"), slash
 * ("Ade' / de'"). Router react-router sudah mem-decode %20 dsb.,
 * jadi pengujian dilakukan pada nilai ter-decode, bukan path mentah.
 */
const LEMMA_TEXT_RE = /^[\p{L}\p{N} '’\-./]{1,100}$/u;

/** Guard murah sebelum subrequest API: charset + panjang lemma ter-decode. */
export function isValidLemma(lemma: string): boolean {
  // Sekuens traversal/protokol dibuang meski charset longgar: lemma sah
  // tidak pernah berisi "..", "//", atau ":"
  if (/\.\.|\/\/|:/.test(lemma)) return false;
  return LEMMA_TEXT_RE.test(lemma);
}

/** Batas aman lemma di kartu: 20 char agar paling banget wrap 2 baris (120px). */
export function clampLemma(text: string, max = 20): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1).trimEnd()}…`;
}

/** Potong deskripsi agar muat tiga baris kartu (satori tak punya line-clamp). */
export function clampText(text: string, max = 120): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(' ');
  return `${(lastSpace > 60 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`;
}
