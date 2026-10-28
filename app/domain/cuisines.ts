/**
 * Data kuliner. Sumber utama API (`/api/v1/culinary/cuisines`), cadangan
 * CDN lama (`data/cuisines.json` via jsDelivr) saat API kosong/gagal.
 * Atribusi & lisensi tetap verbatim dari kedua sumber.
 *
 * Parse murni ada di `cuisines-parse.ts` (bisa dites tanpa alias `@/`);
 * file ini cuma pengambil data.
 */
import { apiClient } from '@/infrastructure/api/api-client';
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

/** Null: API dan CDN dua-duanya gagal (caller putuskan render). */
export async function fetchCuisines(
  signal?: AbortSignal,
): Promise<Cuisine[] | null> {
  try {
    const res = await apiClient<{ items: unknown[] }>(
      '/culinary/cuisines?limit=100',
      { signal },
    );
    const items = res.data?.items;
    if (!Array.isArray(items)) return fetchCuisinesFromCdn(signal);
    const parsed = items
      .map(parseApiCuisine)
      .filter((c): c is Cuisine => c !== null);
    // API kosong bisa berarti DB belum di-seed: pakai CDN sebagai cadangan
    // supaya halaman kuliner publik tidak kosong saat migrasi.
    return parsed.length > 0 ? parsed : fetchCuisinesFromCdn(signal);
  } catch {
    return fetchCuisinesFromCdn(signal);
  }
}

export async function fetchCuisineBySlug(
  slug: string,
  signal?: AbortSignal,
): Promise<Cuisine | null> {
  const all = await fetchCuisines(signal);
  return all?.find((c) => c.slug === slug) ?? null;
}
