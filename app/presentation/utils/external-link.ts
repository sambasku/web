/**
 * UTM referal untuk semua link eksternal (rule external-link-utm).
 *
 * Tujuan: web target (FB/IG/website penyelenggara) tahu trafik datang dari
 * SambasKu (muncul di insight mereka sebagai referral). Preseden pola ini:
 * kredit Unsplash (`image-credit.tsx`, `utm_source=sambasku` - syarat API
 * Unsplash, TIDAK digabung dengan helper ini).
 *
 * Aturan: sisip on-the-fly saat render href; URL di DB tetap bersih; tidak
 * menimpa `utm_source` yang sudah ada (mis. link Unsplash); link ke domain
 * sendiri tidak diberi UTM.
 */

const UTM_SOURCE = 'sambasku.com';
const UTM_MEDIUM = 'referral';

/** Domain SambasKu sendiri + sub-domainnya: tidak diberi UTM. */
const OWN_HOSTS = new Set([
  'sambasku.com',
  'www.sambasku.com',
  'api.sambasku.com',
  'render.sambasku.com',
  'sambasku-staging.iamutaki.com',
  'sambasku-web-staging.ibnuul.workers.dev',
]);

export function isOwnHost(host: string): boolean {
  const lower = host.toLowerCase();
  return (
    OWN_HOSTS.has(lower) ||
    lower.endsWith('.sambasku.com') ||
    lower.endsWith('.iamutaki.com')
  );
}

/**
 * Tambah `utm_source=sambasku.com&utm_medium=referral` ke URL https eksternal.
 * Input bukan https / punya `utm_source` sendiri / domain sendiri: apa adanya.
 * Query string dan hash yang sudah ada tetap utuh; bentuk asli URL (huruf
 * besar scheme/host, path) tidak dinormalisasi.
 */
export function withSambaskuUtm(url: string): string {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return url;
  }
  if (parsed.protocol !== 'https:') return url;
  if (isOwnHost(parsed.host)) return url;
  if (parsed.searchParams.has('utm_source')) return url;

  const utm = `utm_source=${encodeURIComponent(UTM_SOURCE)}&utm_medium=${UTM_MEDIUM}`;

  // Susun ulang string (bukan `parsed.toString()`) supaya bentuk asli URL
  // tetap: hash harus di ujung, query tetap di tengah.
  const hashAt = url.indexOf('#');
  const hash = hashAt >= 0 ? url.slice(hashAt) : '';
  const withoutHash = hashAt >= 0 ? url.slice(0, hashAt) : url;
  const queryAt = withoutHash.indexOf('?');
  if (queryAt >= 0) {
    const base = withoutHash.slice(0, queryAt);
    const query = withoutHash.slice(queryAt + 1);
    const separator = query.length > 0 ? '&' : '';
    return `${base}?${query}${separator}${utm}${hash}`;
  }
  return `${withoutHash}?${utm}${hash}`;
}
