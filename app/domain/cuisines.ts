/**
 * Data kuliner. Sumber utama API (`/api/v1/culinary/cuisines`).
 * Cadangan CDN (`data/cuisines.json` via jsDelivr) hanya saat request API gagal.
 * Daftar published kosong tetap kosong, bukan file CDN.
 *
 * Parse murni ada di `cuisines-parse.ts` (bisa dites tanpa alias `@/`);
 * file ini cuma pengambil data.
 */
import { apiClient, AppError } from '@/infrastructure/api/api-client';
import {
  parseApiCuisine,
  parseCdnCuisines,
  type Cuisine,
} from './cuisines-parse';

export {
  cuisineCover,
  parseCuisine,
  type Cuisine,
  type CuisineImage,
  type CuisineSource,
} from './cuisines-parse';

const CDN_URL =
  'https://cdn.jsdelivr.net/gh/sambasku/data@main/cuisines.json';

/** Null = CDN gagal/JSON rusak (soft-fail, caller yang putuskan render). */
async function fetchCuisinesFromCdn(
  signal?: AbortSignal,
): Promise<Cuisine[] | null> {
  try {
    const res = await fetch(CDN_URL, { signal });
    if (!res.ok) return null;
    return parseCdnCuisines(await res.json());
  } catch {
    return null;
  }
}

/** Maks 5 halaman x 100 = 500 kuliner. */
const PAGE_CAP = 5;

/**
 * Daftar kuliner published. Null hanya kalau API gagal dan CDN juga gagal.
 * Respons API yang sah (termasuk daftar kosong) tidak jatuh ke CDN.
 */
export async function fetchCuisines(
  signal?: AbortSignal,
): Promise<Cuisine[] | null> {
  try {
    const items: Cuisine[] = [];
    let before: string | undefined;
    for (let page = 0; page < PAGE_CAP; page++) {
      const q = new URLSearchParams({ limit: '100' });
      if (before) q.set('before', before);
      const res = await apiClient<{
        items: unknown[];
        next_cursor: string | null;
      }>(`/culinary/cuisines?${q}`, { signal });
      const rows = res.data?.items;
      if (!Array.isArray(rows)) return items;
      for (const row of rows) {
        const parsed = parseApiCuisine(row);
        if (parsed) items.push(parsed);
      }
      if (!res.data.next_cursor) break;
      before = res.data.next_cursor;
    }
    return items;
  } catch {
    return fetchCuisinesFromCdn(signal);
  }
}

export async function fetchCuisineBySlug(
  slug: string,
  signal?: AbortSignal,
): Promise<Cuisine | null> {
  try {
    const res = await apiClient<unknown>(
      `/culinary/cuisines/${encodeURIComponent(slug)}`,
      { signal },
    );
    return parseApiCuisine(res.data);
  } catch (error) {
    if (error instanceof AppError && error.statusCode === 404) return null;
    const all = await fetchCuisinesFromCdn(signal);
    return all?.find((c) => c.slug === slug) ?? null;
  }
}
