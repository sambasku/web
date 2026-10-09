/**
 * Util teks kartu OG (murni, tanpa dependensi wasm) - dipakai route
 * og.words[.]png.ts dan unit test og-card-text.test.ts.
 */

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
