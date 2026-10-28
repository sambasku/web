import type { SitemapItem } from './sitemap.ts';

/** Kunci objek di bucket R2 `sambasku-web-sitemap`. */
export const SITEMAP_OBJECT_KEY = 'sitemap.xml';

export interface SitemapWord {
  lemma: string;
  updatedAt?: string | null;
}

export interface SitemapSourceWord {
  lemma: string;
  updated_at?: string | null;
}

export interface SitemapWordPage {
  data: SitemapSourceWord[];
  hasMore: boolean;
  nextCursor: string | null;
}

/** YYYY-MM-DD dari ISO. Bentuk lain diabaikan supaya lastmod tidak bohong. */
export function lastmodOf(updatedAt: string | null | undefined): string | undefined {
  if (!updatedAt) return undefined;
  const day = updatedAt.slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(day) ? day : undefined;
}

function letterOf(lemma: string): string | null {
  const c = lemma.trim().charAt(0).toLowerCase();
  return c >= 'a' && c <= 'z' ? c : null;
}

/** Lemma yang sama di dua baris API hanya satu URL. lastmod yang lebih baru menang. */
function uniqueWords(words: readonly SitemapWord[]): SitemapWord[] {
  const byLemma = new Map<string, SitemapWord>();
  for (const word of words) {
    const prev = byLemma.get(word.lemma);
    if (!prev) {
      byLemma.set(word.lemma, word);
      continue;
    }
    const prevDay = lastmodOf(prev.updatedAt) ?? '';
    const nextDay = lastmodOf(word.updatedAt) ?? '';
    if (nextDay > prevDay) byLemma.set(word.lemma, word);
  }
  return [...byLemma.values()];
}

function uniqueSlugs(slugs: readonly string[]): string[] {
  return [...new Set(slugs.map((slug) => slug.trim()).filter((slug) => slug !== ''))];
}

/**
 * Satu urlset: rute statis, tiap slug tempat dari API (halaman /wisata/:slug
 * menerima semua kategori), kuliner dari cuisines.json, halaman huruf, lemma.
 * Slug ganda di sumber hanya ditulis sekali.
 */
export function buildSitemapItems(input: {
  words: readonly SitemapWord[];
  wisataSlugs: readonly string[];
  kulinerSlugs: readonly string[];
  acaraSlugs?: readonly string[];
  usahaSlugs?: readonly string[];
}): SitemapItem[] {
  const words = uniqueWords(input.words);
  const letters = [
    ...new Set(
      words
        .map((word) => letterOf(word.lemma))
        .filter((letter): letter is string => letter !== null),
    ),
  ].sort();

  const wisata = uniqueSlugs(input.wisataSlugs).map(
    (slug) =>
      ({
        bare: `/wisata/${encodeURIComponent(slug)}`,
        priority: '0.7',
        changefreq: 'monthly',
      }) satisfies SitemapItem,
  );
  const kuliner = uniqueSlugs(input.kulinerSlugs).map(
    (slug) =>
      ({
        bare: `/kuliner/${encodeURIComponent(slug)}`,
        priority: '0.7',
        changefreq: 'monthly',
      }) satisfies SitemapItem,
  );
const acara = uniqueSlugs(input.acaraSlugs ?? []).map(
  (slug) =>
    ({
      bare: `/acara/${encodeURIComponent(slug)}`,
      priority: '0.7',
      changefreq: 'weekly',
    }) satisfies SitemapItem,
);

const usaha = uniqueSlugs(input.usahaSlugs ?? []).map(
  (slug) =>
    ({
      bare: `/usaha/${encodeURIComponent(slug)}`,
      priority: '0.7',
      changefreq: 'monthly',
    }) satisfies SitemapItem,
);

  return [
    { bare: '/', priority: '1.0', changefreq: 'daily' },
    { bare: '/eksplorasi', priority: '0.8', changefreq: 'weekly' },
    { bare: '/words', priority: '0.9', changefreq: 'daily' },
    { bare: '/wisata', priority: '0.8', changefreq: 'weekly' },
    ...wisata,
    { bare: '/kuliner', priority: '0.8', changefreq: 'weekly' },
    ...kuliner,
    { bare: '/acara', priority: '0.8', changefreq: 'weekly' },
    ...acara,
    { bare: '/usaha', priority: '0.8', changefreq: 'weekly' },
    ...usaha,
    ...letters.map(
      (letter) =>
        ({
          bare: `/huruf/${letter}`,
          priority: '0.6',
          changefreq: 'weekly',
        }) satisfies SitemapItem,
    ),
    { bare: '/ruang-diskusi', priority: '0.7', changefreq: 'daily' },
    { bare: '/faq', priority: '0.8', changefreq: 'monthly' },
    { bare: '/api-publik', priority: '0.6', changefreq: 'monthly' },
    { bare: '/privacy-policy', priority: '0.5', changefreq: 'yearly' },
    { bare: '/hapus-akun', priority: '0.4', changefreq: 'yearly' },
    ...words.map(
      (word) =>
        ({
          bare: `/words/${encodeURIComponent(word.lemma)}`,
          priority: '0.7',
          changefreq: 'weekly',
          lastmod: lastmodOf(word.updatedAt),
        }) satisfies SitemapItem,
    ),
  ];
}

/**
 * Halaman kata sampai habis. Masih ada cursor setelah `maxPages` = lempar,
 * jangan kembalikan daftar terpotong (urlset yang diam-diam pendek).
 */
export async function collectVerifiedWords(
  fetchPage: (cursor?: string) => Promise<SitemapWordPage>,
  maxPages: number,
): Promise<SitemapWord[]> {
  const words: SitemapWord[] = [];
  let cursor: string | undefined;
  for (let page = 0; page < maxPages; page++) {
    const res = await fetchPage(cursor);
    for (const word of res.data) {
      words.push({ lemma: word.lemma, updatedAt: word.updated_at });
    }
    if (!res.hasMore || !res.nextCursor) return words;
    if (page === maxPages - 1) {
      throw new Error('sitemap terpotong: masih ada halaman kata');
    }
    cursor = res.nextCursor;
  }
  throw new Error('sitemap terpotong: masih ada halaman kata');
}
