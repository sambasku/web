/**
 * Kebijakan cache edge untuk respons SSR.
 *
 * Dipisah dari `worker.ts` supaya pure dan bisa diuji tanpa runtime
 * Cloudflare (pentest BH-07): `worker.ts` mengimpor `virtual:react-router/
 * server-build` yang mustahil di-import di test runner.
 */
// Ekstensi `.ts` eksplisit: modul ini diimpor langsung oleh test yang jalan
// di `node --experimental-strip-types`, yang butuh specifier lengkap (ESM).
// Semua import relatif di repo tetap tanpa ekstensi.
import { stripLocalePrefix } from '../application/i18n/locales.ts';

/**
 * Bentuk kanonik pathname untuk kunci cache: satu slash pemisah, tanpa
 * segmen `.`/`..`, tanpa trailing slash (kecuali root).
 *
 * `new URL()` sudah menyelesaikan `.` dan `..`, tapi TIDAK menyatukan slash
 * ganda dan tidak membuang trailing slash - sehingga `/id/words/x`,
 * `/id/words/x/`, dan `/id//words//x` menjadi tiga entry cache berbeda untuk
 * konten yang identik (pentest BH-04). Tanpa kanonikalisasi ini, penyerang
 * bisa memperbanyak entry cache hanya dengan vary path.
 *
 * Persent-encoding TIDAK di-decode: `%2F` di dalam segmen adalah data,
 * bukan separator, dan decode-otomatis akan mengubah arti path.
 */
export function canonicalCachePath(pathname: string): string {
  const out: string[] = [];
  for (const segment of pathname.split('/')) {
    if (segment === '' || segment === '.') continue;
    if (segment === '..') {
      out.pop();
      continue;
    }
    out.push(segment);
  }
  return `/${out.join('/')}`;
}

/**
 * Samakan pathname request dengan kunci cache sebelum lookup/render.
 *
 * Kunci cache saja tidak cukup: React Router melihat path mentah, jadi
 * `/id//words//x` (segmen kosong) tidak match `words/:lemma` dan merender
 * 404. Negative cache lalu menulis 404 di bawah kunci kanonik yang sama
 * dengan halaman 200 - meracuni entry (BH-04). Rewrite internal (bukan
 * redirect) supaya varian path tetap bisa `x-cache: hit` berbagi entry.
 */
export function withCanonicalPath(request: Request): Request {
  const url = new URL(request.url);
  const canonical = canonicalCachePath(url.pathname);
  if (canonical === url.pathname) return request;
  url.pathname = canonical;
  return new Request(url, request);
}

/// HTML SSR memuat URL chunk ber-hash. Cache tanpa id deploy tetap
/// menyajikan HTML lama setelah wrangler deploy menghapus file itu (404).
///
/// Key dinormalisasi ke origin+pathname KANONIKLAL (prefix locale
/// dipertahankan: /id/words/x dan /id-SBS/words/x kontennya beda bahasa -
/// tidak boleh berbagi entry) dan query string masukan DIABUANG: halaman
/// cacheable tidak bergantung query, dan tanpa normalisasi tiap URL unik
/// membuat entry cache baru = cache flooding (pentest W-03/B-03).
export function cacheKeyUrl(
  origin: string,
  pathname: string,
  versionId: string,
): string {
  return `${origin}${canonicalCachePath(pathname)}?__build=${versionId}`;
}

/// Cache API hanya menerima GET; HEAD di-cache sebagai GET (pentest B-12).
export function cacheKeyRequest(request: Request, versionId: string): Request {
  const url = new URL(request.url);
  return new Request(cacheKeyUrl(url.origin, url.pathname, versionId), {
    method: 'GET',
  });
}

const FRESH_S = 60;
export const STALE_MAX_S = 86400;

/// Negative cache pendek untuk 404 halaman kata: tanpa ini /words/<random>
/// selalu memicu render SSR + subrequest API (pentest W-04).
const NEGATIVE_TTL_S = 60;

/// Sitemap jauh lebih mahal daripada satu halaman HTML (satu subrequest API per
/// halaman kata), dan isinya berubah lambat. Jendela segarnya sehari, bukan 60
/// detik, supaya crawler tidak memicu pembangunan ulang terus-menerus.
///
/// Hanya `/sitemap.xml` yang berisi urlset. `/sitemap-static.xml` dan
/// `/sitemap-words/:letter` adalah redirect 301 ke index (lokasi lama) - jangan
/// tandai cacheable (BH-08: path redirect tidak boleh lookup cache).
export const SITEMAP_PATH = '/sitemap.xml';
const SITEMAP_FRESH_S = 86400;

/// Struktur sitemap: hanya index kanonik yang di-cache.
export function isSitemapPath(pathname: string): boolean {
  return canonicalCachePath(pathname) === SITEMAP_PATH;
}

/// RSS dibangun dari satu subrequest API dan dibaca ulang pembaca feed tiap
/// jam; jendela segar 1 jam seimbang antara beban API dan kesegaran feed.
export const RSS_PATH = '/rss.xml';
const RSS_FRESH_S = 3600;

export const LLMS_FULL_PATH = '/llms-full.txt';
const LLMS_FULL_FRESH_S = 86400;

/// Kartu OG per kata: mahal dirender (resvg) dan isinya stabil per deploy,
/// jadi jendela segar sehari penuh. Karakter segmen sama dengan guard route.
/** Regex cache-policy untuk route OG kata.
 * Charset sama dengan isValidLemma + '%' untuk bentuk ter-encode
 * (canonicalCachePath sengaja tidak mem-decode: %2F dalam segmen
 * adalah data, bukan separator). '/' TIDAK termasuk: di pathname itu
 * separator segmen — slash dalam lemma selalu tampil sebagai %2F.
 * Lemma nyata: spasi, apostrof lurus/curly, hyphen, titik.
 */
const OG_WORDS_RE = /^\/og\/words\/[\p{L}\p{N}% '’\-.]{1,100}$/u;
const OG_FRESH_S = 86400;

export function isOgImagePath(pathname: string): boolean {
  return OG_WORDS_RE.test(canonicalCachePath(pathname));
}

export function freshSeconds(pathname: string): number {
  if (isSitemapPath(pathname)) return SITEMAP_FRESH_S;
  const canonical = canonicalCachePath(pathname);
  if (canonical === RSS_PATH) return RSS_FRESH_S;
  if (canonical === LLMS_FULL_PATH) return LLMS_FULL_FRESH_S;
  if (isOgImagePath(canonical)) return OG_FRESH_S;
  return FRESH_S;
}

/// Halaman huruf `/{locale}/huruf/:letter`: satu huruf a-z persis. Regex ketat
/// supaya `/huruf/<apapun>` tidak bisa memperbanyak entry cache.
const HURUF_PATH_RE = /^\/huruf\/[a-z]$/;

export function isCacheableRequest(
  method: string,
  pathname: string,
  search = '',
): boolean {
  // URL publik nyata berprefix /:locale (routes.ts) - '/words/…' polos hanyalah
  // redirect legacy yang tak pernah 200. Pengecekan memakai path TANPA prefix
  // locale (pentest B-02: selama ini cache tidak pernah menyala untuk
  // /id/words/…). HEAD ikut di-cache (pentest B-12): render HEAD dilakukan
  // sebagai GET sehingga entry berisi body penuh.
  // '/words' (daftar, ada filter query) dan '/search' sengaja tidak di-cache;
  // hanya beranda per-locale, halaman detail '/words/<lemma>', dan sitemap.
  //
  // Syarat locale WAJIB ada (pentest BH-08). Setiap path tanpa prefix locale
  // adalah redirect (routes.ts: `index` → root-redirect, `words/:lemma` →
  // legacy-redirect), jadi statusnya 301/302 dan `cacheTtlSeconds` selalu 0.
  // Sebelumnya isCacheable tetap menerima path itu, sehingga tiap request
  // melakukan lookup cache yang dijamin kosong lalu render SSR penuh - dan
  // path redirect adalah target termurah yang ada (tanpa subrequest API).
  // Perhatikan `stripLocalePrefix('/id')` juga mengembalikan path '/', jadi
  // sekadar menghapus `bare === '/'` akan mematikan cache beranda /id dan
  // /id-SBS yang memang 200 dan layak di-cache.
  const canonical = canonicalCachePath(pathname);
  const { locale, path: bare } = stripLocalePrefix(canonical);
  if (method !== 'GET' && method !== 'HEAD') return false;
  // Kunci cache membuang query string, jadi URL ber-query tidak boleh
  // di-cache: '?cursor=' halaman huruf akan menyajikan halaman 1 selamanya.
  // Sitemap/robots tidak punya query yang bermakna.
  if (search !== '') return false;
  if (isSitemapPath(canonical)) return true;
  if (canonical === RSS_PATH) return true;
  if (canonical === LLMS_FULL_PATH) return true;
  if (isOgImagePath(canonical)) return true;
  if (locale === null) return false;
  return bare === '/' || bare.startsWith('/words/') || HURUF_PATH_RE.test(bare);
}

/** TTL entry cache menurut status respons; 0 = jangan di-cache. */
export function cacheTtlSeconds(pathname: string, status: number): number {
  if (status === 200) return STALE_MAX_S;
  // Path nyata selalu berprefix /:locale - cek path BARE, bukan mentah
  // (pentest G-02: '/id/words/…' tak pernah match '/words/' sehingga
  // negative cache 404 tidak pernah aktif).
  const { path: bare } = stripLocalePrefix(canonicalCachePath(pathname));
  // path selalu berprefix locale, jadi `/` dan `/words/<lemma>` polos tidak
  // akan pernah sampai ke sini (lihat isCacheableRequest). Bulk request ke
  // path redirect itu hanya lookup cache yang dijamin kosong (pentest BH-08).
  if (status === 404 && (bare.startsWith('/words/') || isOgImagePath(bare))) {
    return NEGATIVE_TTL_S;
  }
  return 0;
}
