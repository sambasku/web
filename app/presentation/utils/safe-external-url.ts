import { withSambaskuUtm } from './external-link.ts';
/**
 * URL eksternal yang aman jadi anchor `href` (pentest HR-01, issue #59).
 *
 * Data dari API bisa berisi input publik (`link_url` diskusi) atau data pihak
 * ketiga (attribution Openverse). Hanya `https:` yang boleh jadi link
 * klikable; selain itu (javascript:, data:, vbscript:, custom app protocol,
 * URL rusak, kosong) kembalikan undefined - pemanggil render teks polos.
 *
 * Sekaligus titik sisip UTM referal (rule external-link-utm): semua link
 * eksternal yang lolos filter https otomatis membawa
 * `utm_source=sambasku.com&utm_medium=referral`; UTM existing tidak
 * ditimpa. URL yang tersimpan di DB tetap bersih.
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
  return withSambaskuUtm(url);
}
