/**
 * Katalog tempat dari API (`/api/v1/places`), sumbernya Turso.
 * Bukan CDN `places.json`.
 */

import { apiClient, AppError } from '@/infrastructure/api/api-client';
export {
  mapPlace,
  placeCover,
  placeLabel,
  placeTypeLabels,
  type Place,
  type PlaceCategory,
  type PlaceImage,
  type PlaceRelated,
  type PlaceSource,
  type PlaceType,
} from './places-parse';
import { mapPlace, type ApiImage, type ApiPlace, type Place, type PlaceImage } from './places-parse';

const PAGE_CAP = 5;

/** Null = API gagal. Maksimal 5 halaman supaya tidak meledakkan subrequest. */
export async function fetchPlaces(signal?: AbortSignal): Promise<Place[] | null> {
  try {
    const items: Place[] = [];
    let before: string | undefined;
    for (let page = 0; page < PAGE_CAP; page++) {
      const q = new URLSearchParams({ limit: '500' });
      if (before) q.set('before', before);
      const res = await apiClient<{ items: ApiPlace[]; next_cursor: string | null }>(
        `/places?${q}`,
        { signal },
      );
      for (const row of res.data.items ?? []) items.push(mapPlace(row));
      if (!res.data.next_cursor) break;
      before = res.data.next_cursor;
    }
    return items;
  } catch {
    return null;
  }
}

export async function fetchPlaceBySlug(slug: string, signal?: AbortSignal): Promise<Place | null> {
  try {
    const res = await apiClient<ApiPlace>(`/places/${encodeURIComponent(slug)}`, { signal });
    return mapPlace(res.data);
  } catch (error) {
    if (error instanceof AppError && error.statusCode === 404) return null;
    throw error;
  }
}

export async function fetchPlaceImages(
  slug: string,
  offset: number,
): Promise<{ items: PlaceImage[]; total: number; nextOffset: number | null } | null> {
  try {
    const res = await apiClient<{
      items: ApiImage[];
      total: number;
      next_offset: number | null;
    }>(`/places/${encodeURIComponent(slug)}/images?offset=${offset}`);
    return {
      items: (res.data.items ?? []).map((img) => ({
        url: img.url,
        isMain: img.is_main === true,
        attribution: img.attribution?.name
          ? { name: img.attribution.name, provider: img.attribution.provider }
          : undefined,
      })),
      total: res.data.total,
      nextOffset: res.data.next_offset,
    };
  } catch {
    return null;
  }
}
