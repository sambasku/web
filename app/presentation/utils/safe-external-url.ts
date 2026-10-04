/**
 * URL eksternal yang aman jadi anchor `href` (pentest HR-01, issue #59).
 *
 * Data dari API bisa berisi input publik (`link_url` diskusi) atau data pihak
 * ketiga (attribution Openverse). Hanya `https:` yang boleh jadi link
 * klikable; selain itu (javascript:, data:, vbscript:, custom app protocol,
 * URL rusak, kosong) kembalikan undefined - pemanggil render teks polos.
 */
export function safeExternalUrl(
  url: string | null | undefined,
): string | undefined {
  if (!url) return undefined;
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return undefined;
  }
  if (parsed.protocol !== 'https:') return undefined;
  return url;
}
