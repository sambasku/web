/**
 * Parser event dari wire API (snake_case) ke domain aplikasi (camelCase).
 * Modul ini murni tanpa import alias supaya bisa diuji `node --test`.
 */

export type EventStatus = 'draft' | 'published' | 'archived';

/**
 * Status pelaksanaan - diturunkan read-time oleh API dari jadwal +
 * pembatalan. Tidak disimpan di DB.
 */
export type EventOccurrenceStatus = 'upcoming' | 'ongoing' | 'completed' | 'cancelled';

export type EventSourceType =
  | 'facebook'
  | 'instagram'
  | 'website'
  | 'tiktok'
  | 'youtube'
  | 'whatsapp'
  | 'other';

export interface EventCategoryRef {
  id: string;
  name: string;
}

export interface EventVillageRef {
  id: string;
  name: string;
  slug: string | null;
}

export interface EventPlaceRef {
  id: string;
  slug: string;
  name: string;
  category: string | null;
}

export interface Event {
  id: string;
  slug: string;
  name: string;
  description: string;
  categoryId: string;
  category: EventCategoryRef | null;
  startsAt: string | null;
  endsAt: string | null;
  occurrenceStatus: EventOccurrenceStatus;
  locationText: string;
  lat: number | null;
  lng: number | null;
  mapsUrl: string | null;
  /** Poster acara (bisa banyak). [0] = sampul. */
  posterUrls: string[];
  /** Penyelenggara opsional - kalau null, UI skip labelnya. */
  organizer: string | null;
  /** Link original konten. Bersih tanpa UTM (helper UTM saat render). */
  sourceUrl: string | null;
  sourceType: EventSourceType | null;
  sourceAttribution: string | null;
  regionId: string | null;
  villageId: string | null;
  village: EventVillageRef | null;
  places: EventPlaceRef[];
  status: EventStatus;
  cancelledAt: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string | null;
  goingCount: number;
  viewerGoing: boolean;
}

export interface ApiEvent {
  id: string;
  slug: string;
  name: string;
  description: string;
  category_id: string;
  category?: EventCategoryRef | null;
  starts_at: string | null;
  ends_at: string | null;
  occurrence_status?: EventOccurrenceStatus;
  location_text: string;
  lat?: number | null;
  lng?: number | null;
  maps_url?: string | null;
  poster_urls?: string[];
  organizer?: string | null;
  source_url?: string | null;
  source_type?: EventSourceType | null;
  source_attribution?: string | null;
  region_id?: string | null;
  village_id?: string | null;
  village?: EventVillageRef | null;
  places?: EventPlaceRef[];
  status: EventStatus;
  cancelled_at?: string | null;
  published_at?: string | null;
  created_at: string;
  updated_at?: string | null;
  going_count?: number;
  viewer_going?: boolean;
}

export function mapEvent(row: ApiEvent): Event {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    categoryId: row.category_id,
    category: row.category ?? null,
    startsAt: row.starts_at ?? null,
    endsAt: row.ends_at ?? null,
    occurrenceStatus: row.occurrence_status ?? 'upcoming',
    locationText: row.location_text ?? '',
    lat: row.lat ?? null,
    lng: row.lng ?? null,
    mapsUrl: row.maps_url ?? null,
    posterUrls: Array.isArray(row.poster_urls) ? row.poster_urls : [],
    organizer: row.organizer ?? null,
    sourceUrl: row.source_url ?? null,
    sourceType: row.source_type ?? null,
    sourceAttribution: row.source_attribution ?? null,
    regionId: row.region_id ?? null,
    villageId: row.village_id ?? null,
    village: row.village ?? null,
    places: row.places ?? [],
    status: row.status,
    cancelledAt: row.cancelled_at ?? null,
    publishedAt: row.published_at ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at ?? null,
    goingCount: typeof row.going_count === 'number' ? row.going_count : 0,
    viewerGoing: row.viewer_going === true,
  };
}

const OCCURRENCE_LABELS: Record<EventOccurrenceStatus, string> = {
  upcoming: 'Akan datang',
  ongoing: 'Sedang berlangsung',
  completed: 'Sudah selesai',
  cancelled: 'Dibatalkan',
};

export function eventOccurrenceLabel(status: EventOccurrenceStatus): string {
  return OCCURRENCE_LABELS[status] ?? status;
}

const SOURCE_TYPE_LABELS: Record<EventSourceType, string> = {
  facebook: 'Facebook',
  instagram: 'Instagram',
  website: 'Website',
  tiktok: 'TikTok',
  youtube: 'YouTube',
  whatsapp: 'WhatsApp',
  other: 'Lainnya',
};

export function eventSourceTypeLabel(type: EventSourceType | null): string | null {
  if (!type) return null;
  return SOURCE_TYPE_LABELS[type] ?? null;
}

/** Kunci tanggal kalender WIB (UTC+7). `en-CA` = YYYY-MM-DD. */
function jakartaDateKey(instant: Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(instant);
}

/**
 * Hari acara (WIB) sudah tiba. `startsAt` null atau tidak valid = belum.
 * Pagi hari-H tetap true walau jam mulai masih nanti.
 */
export function eventDateReached(
  startsAt: string | null,
  now: Date = new Date(),
): boolean {
  if (!startsAt) return false;
  const start = new Date(startsAt);
  if (Number.isNaN(start.getTime())) return false;
  return jakartaDateKey(now) >= jakartaDateKey(start);
}
