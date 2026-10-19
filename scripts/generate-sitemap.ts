/**
 * Bangun sitemap.xml di luar Worker, dari API publik dan CDN data.
 * Satu halaman gagal atau daftar terpotong: proses keluar non-zero dan
 * tidak menulis file, supaya unggahan R2 kemarin tetap hidup.
 *
 * Jeda antar halaman menjaga batas 100 permintaan/menit pada GET /words.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { buildUrlsetXml } from '../app/application/utils/sitemap.ts';
import {
  buildSitemapItems,
  collectVerifiedWords,
} from '../app/application/utils/sitemap-items.ts';
import { fetchCuisines } from '../app/domain/cuisines.ts';
import { fetchPlaces } from '../app/domain/places.ts';

const APP_URL = 'https://sambasku.com';
const WORDS_URL = 'https://api.sambasku.com/api/v1/words';
const PAGE_SIZE = 100;
/** Di luar anggaran subrequest Worker. 400 halaman = 40 ribu lemma. */
const MAX_PAGES = 400;
const PAGE_GAP_MS = 650;

interface WordsPayload {
  success?: boolean;
  data?: { lemma?: string; updated_at?: string | null }[];
  meta?: { has_more?: boolean; next_cursor?: string | null };
}

async function fetchWordPage(cursor?: string) {
  if (cursor) await new Promise((resolve) => setTimeout(resolve, PAGE_GAP_MS));
  const url = new URL(WORDS_URL);
  url.searchParams.set('is_verified', 'true');
  url.searchParams.set('limit', String(PAGE_SIZE));
  if (cursor) url.searchParams.set('cursor', cursor);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`GET /words gagal: HTTP ${res.status}`);
  const body = (await res.json()) as WordsPayload;
  if (!body.success || !Array.isArray(body.data)) {
    throw new Error('GET /words tidak mengembalikan daftar kata');
  }
  return {
    data: body.data
      .filter((word): word is { lemma: string; updated_at?: string | null } =>
        typeof word.lemma === 'string' && word.lemma.trim() !== '',
      )
      .map((word) => ({ lemma: word.lemma, updated_at: word.updated_at })),
    hasMore: Boolean(body.meta?.has_more),
    nextCursor: body.meta?.next_cursor ?? null,
  };
}

async function main(): Promise<void> {
  const out = process.argv[2];
  if (!out) {
    throw new Error('pakai: generate-sitemap.ts <path-keluaran>');
  }

  const [words, places, cuisines] = await Promise.all([
    collectVerifiedWords(fetchWordPage, MAX_PAGES),
    fetchPlaces(),
    fetchCuisines(),
  ]);
  if (!places) throw new Error('places.json gagal dimuat');
  if (!cuisines) throw new Error('cuisines.json gagal dimuat');

  const xml = buildUrlsetXml(
    APP_URL,
    buildSitemapItems({
      words,
      wisataSlugs: places.map((place) => place.slug),
      kulinerSlugs: cuisines.map((cuisine) => cuisine.slug),
    }),
  );

  await mkdir(dirname(out), { recursive: true });
  await writeFile(out, xml, 'utf8');
  console.log(`sitemap ${words.length} lemma, ${Buffer.byteLength(xml)} byte -> ${out}`);
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
