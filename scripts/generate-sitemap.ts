/**
 * Bangun sitemap.xml di luar Worker, dari API publik dan CDN data.
 * Satu halaman gagal atau daftar terpotong: proses keluar non-zero dan
 * tidak menulis file, supaya unggahan R2 kemarin tetap hidup.
 *
 * Jeda antar halaman menjaga batas 100 permintaan/menit pada GET /words.
 *
 * Script ini dijalankan Node murni (`node --experimental-strip-types`),
 * tanpa Vite. Jangan impor modul yang memakai alias `@/` (mis. domain
 * yang menarik `apiClient`) - Node menganggap `@/…` sebagai nama paket.
 * Ambil data lewat `fetch` + parser relatif (`*-parse.ts`).
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { buildUrlsetXml } from '../app/application/utils/sitemap.ts';
import {
  buildSitemapItems,
  collectVerifiedWords,
} from '../app/application/utils/sitemap-items.ts';
import {
  parseApiCuisine,
  parseCdnCuisines,
} from '../app/domain/cuisines-parse.ts';
import {
  mapPlace,
  type ApiPlace,
} from '../app/domain/places-parse.ts';

const APP_URL = 'https://sambasku.com';
const API_BASE = 'https://api.sambasku.com/api/v1';
const WORDS_URL = `${API_BASE}/words`;
const PLACES_URL = `${API_BASE}/places`;
const CUISINES_API_URL = `${API_BASE}/culinary/cuisines`;
const CUISINES_CDN_URL =
  'https://cdn.jsdelivr.net/gh/sambasku/data@main/cuisines.json';
const PAGE_SIZE = 100;
/** Di luar anggaran subrequest Worker. 400 halaman = 40 ribu lemma. */
const MAX_PAGES = 400;
const PAGE_GAP_MS = 650;
/** Samakan dengan `fetchPlaces` di domain: batas halaman supaya request tidak meledak. */
const PLACES_PAGE_CAP = 5;
const PLACES_PAGE_SIZE = 500;

interface WordsPayload {
  success?: boolean;
  data?: { lemma?: string; updated_at?: string | null }[];
  meta?: { has_more?: boolean; next_cursor?: string | null };
}

interface PlacesPayload {
  success?: boolean;
  data?: { items?: ApiPlace[]; next_cursor?: string | null };
}

interface CuisinesApiPayload {
  success?: boolean;
  data?: { items?: unknown[] };
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

/** Slug tempat dari API produksi. Null = API gagal. */
async function fetchPlaceSlugs(): Promise<string[] | null> {
  try {
    const slugs: string[] = [];
    let before: string | undefined;
    for (let page = 0; page < PLACES_PAGE_CAP; page++) {
      const url = new URL(PLACES_URL);
      url.searchParams.set('limit', String(PLACES_PAGE_SIZE));
      if (before) url.searchParams.set('before', before);
      const res = await fetch(url);
      if (!res.ok) return null;
      const body = (await res.json()) as PlacesPayload;
      if (!body.success || !Array.isArray(body.data?.items)) return null;
      for (const row of body.data.items) {
        const place = mapPlace(row);
        if (place.slug) slugs.push(place.slug);
      }
      const next = body.data.next_cursor;
      if (!next) break;
      before = next;
    }
    return slugs;
  } catch {
    return null;
  }
}

/** Slug kuliner: API dulu, CDN cadangan (sama pola domain). Null = keduanya gagal. */
async function fetchCuisineSlugs(): Promise<string[] | null> {
  try {
    const res = await fetch(`${CUISINES_API_URL}?limit=100`);
    if (res.ok) {
      const body = (await res.json()) as CuisinesApiPayload;
      const items = body.data?.items;
      if (body.success && Array.isArray(items)) {
        const parsed = items
          .map(parseApiCuisine)
          .filter((c): c is NonNullable<typeof c> => c !== null)
          .map((c) => c.slug);
        if (parsed.length > 0) return parsed;
      }
    }
  } catch {
    // jatuh ke CDN
  }

  try {
    const res = await fetch(CUISINES_CDN_URL);
    if (!res.ok) return null;
    const parsed = parseCdnCuisines(await res.json());
    return parsed?.map((c) => c.slug) ?? null;
  } catch {
    return null;
  }
}

async function main(): Promise<void> {
  const out = process.argv[2];
  if (!out) {
    throw new Error('pakai: generate-sitemap.ts <path-keluaran>');
  }

  const [words, placeSlugs, cuisineSlugs] = await Promise.all([
    collectVerifiedWords(fetchWordPage, MAX_PAGES),
    fetchPlaceSlugs(),
    fetchCuisineSlugs(),
  ]);
  if (!placeSlugs) throw new Error('daftar tempat gagal dimuat');
  if (!cuisineSlugs) throw new Error('daftar kuliner gagal dimuat');

  const xml = buildUrlsetXml(
    APP_URL,
    buildSitemapItems({
      words,
      wisataSlugs: placeSlugs,
      kulinerSlugs: cuisineSlugs,
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
