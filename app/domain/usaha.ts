/**
 * Direktori usaha dari API (`/api/v1/usaha`).
 *
 * Wire snake_case dipetakan di `usaha-parse.ts` supaya presentation layer
 * tetap camelCase seperti `events.ts` / `places.ts`.
 */

import { apiClient, AppError } from '@/infrastructure/api/api-client';
import {
  mapUsaha,
  type ApiUsaha,
  type Usaha,
  type UsahaCategoryRef,
  type UsahaKind,
  type UsahaOperationalStatus,
} from './usaha-parse';

export {
  mapUsaha,
  usahaKindLabel,
  usahaLocationLine,
  usahaOperationalLabel,
  type ApiUsaha,
  type Usaha,
  type UsahaCategoryRef,
  type UsahaItem,
  type UsahaKind,
  type UsahaOperationalStatus,
  type UsahaVillageRef,
} from './usaha-parse';

/** Maks 5 halaman x 100 = 500 usaha, cukup untuk direktori kabupaten. */
const PAGE_CAP = 5;

export interface UsahaListFilters {
  category_id?: string;
  region_id?: string;
  village_id?: string;
  kind?: UsahaKind;
  operational_status?: UsahaOperationalStatus;
  q?: string;
}

/** Daftar usaha published. Null = API gagal (bukan "belum ada usaha"). */
export async function fetchUsahas(
  filters: UsahaListFilters = {},
  signal?: AbortSignal,
): Promise<Usaha[] | null> {
  try {
    const items: Usaha[] = [];
    let before: string | undefined;
    for (let page = 0; page < PAGE_CAP; page++) {
      const q = new URLSearchParams({ limit: '100' });
      if (before) q.set('before', before);
      if (filters.category_id) q.set('category_id', filters.category_id);
      if (filters.region_id) q.set('region_id', filters.region_id);
      if (filters.village_id) q.set('village_id', filters.village_id);
      if (filters.kind) q.set('kind', filters.kind);
      if (filters.operational_status)
        q.set('operational_status', filters.operational_status);
      if (filters.q) q.set('q', filters.q);
      const res = await apiClient<{ items: ApiUsaha[]; next_cursor: string | null }>(
        `/usaha?${q}`,
        { signal },
      );
      for (const row of res.data.items ?? []) items.push(mapUsaha(row));
      if (!res.data.next_cursor) break;
      before = res.data.next_cursor;
    }
    return items;
  } catch {
    return null;
  }
}

export async function fetchUsahaBySlug(
  slug: string,
  signal?: AbortSignal,
): Promise<Usaha | null> {
  try {
    const res = await apiClient<ApiUsaha>(`/usaha/${encodeURIComponent(slug)}`, {
      signal,
    });
    return mapUsaha(res.data);
  } catch (error) {
    if (error instanceof AppError && error.statusCode === 404) return null;
    throw error;
  }
}

/** Katalog kategori usaha (published). */
export async function fetchUsahaCategories(
  signal?: AbortSignal,
): Promise<UsahaCategoryRef[]> {
  try {
    const res = await apiClient<{ items: UsahaCategoryRef[] }>(
      '/usaha-categories',
      { signal },
    );
    return res.data.items ?? [];
  } catch {
    return [];
  }
}
