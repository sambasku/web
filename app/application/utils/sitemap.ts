/**
 * Pembangun XML sitemap (pure, tanpa import env) supaya bisa diuji
 * `node --test` seperti edge/cache-policy.
 *
 * /sitemap.xml adalah satu urlset (bukan indeks): rute statis, halaman
 * huruf yang punya lemma terverifikasi, dan lemma terverifikasi.
 */
// Ekstensi `.ts` eksplisit: modul ini diimpor langsung oleh test yang jalan
// di `node --experimental-strip-types`, yang butuh specifier lengkap (ESM).
// Semua import relatif di repo tetap tanpa ekstensi.
import {
  DEFAULT_LOCALE,
  localePath,
  seoLocales,
  type AppLocale,
} from '../i18n/locales.ts';

export function xmlEscape(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export interface SitemapImage {
  /** Path absolut situs, mis. `/og/words/capal`. */
  path: string;
  /** Opsional - judul gambar di Google Images. */
  title?: string;
}

export interface SitemapItem {
  /** Path tanpa prefix locale, mis. '/words' atau '/huruf/k'. */
  bare: string;
  priority: string;
  changefreq: string;
  /** YYYY-MM-DD. Kosong = jangan tulis lastmod (tanggal tidak diketahui). */
  lastmod?: string;
  /** Gambar terkait URL (Google image sitemap extension). */
  images?: readonly SitemapImage[];
}

/** Baris xhtml:link hreflang (per locale seoIndex + x-default). */
function xhtmlAlternates(appUrl: string, bare: string): string {
  const lines = seoLocales().map(
    (l) =>
      `    <xhtml:link rel="alternate" hreflang="${l.code}" href="${appUrl}${xmlEscape(localePath(l.code as AppLocale, bare))}" />`,
  );
  lines.push(
    `    <xhtml:link rel="alternate" hreflang="x-default" href="${appUrl}${xmlEscape(localePath(DEFAULT_LOCALE, bare))}" />`,
  );
  return lines.join('\n');
}

/**
 * Locale non-default (id-SBS) dibatasi supaya tidak menyaingi /id untuk
 * branded sitelinks / query "sambasku". hreflang tetap dipasang penuh.
 */
export function priorityForLocale(
  priority: string,
  locale: AppLocale,
): string {
  if (locale === DEFAULT_LOCALE) return priority;
  const n = Number.parseFloat(priority);
  if (!Number.isFinite(n)) return priority;
  return Math.min(n * 0.5, 0.4).toFixed(1);
}

function imageEntriesXml(
  appUrl: string,
  images: readonly SitemapImage[] | undefined,
): string {
  if (!images?.length) return '';
  const base = appUrl.replace(/\/$/, '');
  return images
    .map((img) => {
      const loc = img.path.startsWith('http')
        ? img.path
        : `${base}${img.path.startsWith('/') ? img.path : `/${img.path}`}`;
      const title = img.title
        ? `\n      <image:title>${xmlEscape(img.title)}</image:title>`
        : '';
      return `    <image:image>
      <image:loc>${xmlEscape(loc)}</image:loc>${title}
    </image:image>`;
    })
    .join('\n');
}

/**
 * urlset lengkap: setiap item × setiap locale seoIndex, tiap URL membawa
 * pasangan hreflang-nya. Lemma boleh membawa image:image (kartu OG).
 */
export function buildUrlsetXml(appUrl: string, items: SitemapItem[]): string {
  const urls = items
    .flatMap((item) =>
      seoLocales().map((l) => {
        const locale = l.code as AppLocale;
        return {
          loc: `${appUrl}${localePath(locale, item.bare)}`,
          bare: item.bare,
          priority: priorityForLocale(item.priority, locale),
          changefreq: item.changefreq,
          lastmod: item.lastmod,
          images: item.images,
        };
      }),
    )
    .map((u) => {
      const imagesXml = imageEntriesXml(appUrl, u.images);
      return `  <url>
    <loc>${xmlEscape(u.loc)}</loc>
${xhtmlAlternates(appUrl, u.bare)}
${u.lastmod ? `    <lastmod>${xmlEscape(u.lastmod)}</lastmod>\n` : ''}    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>${imagesXml ? `\n${imagesXml}` : ''}
  </url>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urls}
</urlset>`;
}
