/**
 * Katalog acara dari API (`/api/v1/events`).
 *
 * Bentuk wire (snake_case) dipetakan di `events-parse.ts` supaya yang
 * dipakai presentation layer konsisten camelCase seperti `places-parse.ts`.
 */

import { apiClient, AppError } from '@/infrastructure/api/api-client';
import {
  mapEvent,
  type ApiEvent,
  type Event,
  type EventCategoryRef,
} from './events-parse';

export {
  eventOccurrenceLabel,
  eventSourceTypeLabel,
  mapEvent,
  type ApiEvent,
  type Event,
  type EventCategoryRef,
  type EventOccurrenceStatus,
  type EventPlaceRef,
  type EventSourceType,
  type EventStatus,
} from './events-parse';

const PAGE_CAP = 5;

export interface EventListFilters {
  category_id?: string;
  village_id?: string;
  place_id?: string;
  q?: string;
  /** "1" = hanya acara yang belum selesai. */
  not_ended?: '1';
  order?: 'asc' | 'desc';
}

/** Daftar acara published. Null = API gagal (bukan "tidak ada acara"). */
export async function fetchEvents(
  filters: EventListFilters = {},
  signal?: AbortSignal,
): Promise<Event[] | null> {
  try {
    const items: Event[] = [];
    let before: string | undefined;
    for (let page = 0; page < PAGE_CAP; page++) {
      const q = new URLSearchParams({ limit: '100' });
      if (before) q.set('before', before);
      if (filters.category_id) q.set('category_id', filters.category_id);
      if (filters.village_id) q.set('village_id', filters.village_id);
      if (filters.place_id) q.set('place_id', filters.place_id);
      if (filters.q) q.set('q', filters.q);
      if (filters.not_ended) q.set('not_ended', filters.not_ended);
      if (filters.order) q.set('order', filters.order);
      const res = await apiClient<{ items: ApiEvent[]; next_cursor: string | null }>(
        `/events?${q}`,
        { signal },
      );
      for (const row of res.data.items ?? []) items.push(mapEvent(row));
      if (!res.data.next_cursor) break;
      before = res.data.next_cursor;
    }
    return items;
  } catch {
    return null;
  }
}

export async function fetchEventBySlug(
  slug: string,
  signal?: AbortSignal,
): Promise<Event | null> {
  try {
    const res = await apiClient<ApiEvent>(`/events/${encodeURIComponent(slug)}`, { signal });
    return mapEvent(res.data);
  } catch (error) {
    if (error instanceof AppError && error.statusCode === 404) return null;
    throw error;
  }
}

/** Katalog kategori acara (published). */
export async function fetchEventCategories(
  signal?: AbortSignal,
): Promise<EventCategoryRef[]> {
  try {
    const res = await apiClient<{ items: EventCategoryRef[] }>('/events/categories', { signal });
    return res.data.items ?? [];
  } catch {
    return [];
  }
}
