/**
 * Data wisata/tempat dari CDN (repo `data` via jsDelivr, file `places.json`).
 *
 * Sumber sama dengan mobile (PlacesRepositoryImpl): satu JSON statis,
 * di-fetch SSR. Parse defensif: item tanpa field wajib di-skip.
 */

const CDN_URL = 'https://cdn.jsdelivr.net/gh/sambasku/data@main/places.json';

export interface PlaceImage {
  url: string;
  isMain: boolean;
  attribution?: {
    name: string;
    provider?: string;
    url?: string;
    license?: string;
    license_url?: string;
  };
}

export interface PlaceSource {
  name: string;
  address: string;
  license?: string;
  licenseUrl?: string;
}

export type PlaceCategory = 'wisata' | 'kuliner';
export type PlaceType =
  | 'sejarah'
  | 'alam'
  | 'budaya'
  | 'pantai'
  | 'belanja';

export interface Place {
  id: string;
  slug: string;
  name: string;
  category: PlaceCategory;
  type: PlaceType | null;
  lat: number;
  lng: number;
  shortDescription: string;
  images: PlaceImage[];
  hours?: string;
  contact?: string;
  related: Array<{ kind: string; id: string }>;
  sources: PlaceSource[];
}

function str(v: unknown): string | null {
  return typeof v === 'string' && v.trim() ? v.trim() : null;
}

function parseImage(raw: unknown): PlaceImage | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const r = raw as Record<string, unknown>;
  const url = str(r.url);
  if (!url?.startsWith('https://')) return null;
  const attrRaw = r.attribution;
  const attribution =
    typeof attrRaw === 'object' &&
    attrRaw !== null &&
    str((attrRaw as Record<string, unknown>).name)
      ? {
          name: str((attrRaw as Record<string, unknown>).name)!,
          provider: str((attrRaw as Record<string, unknown>).provider) ?? undefined,
          url: str((attrRaw as Record<string, unknown>).url) ?? undefined,
          license: str((attrRaw as Record<string, unknown>).license) ?? undefined,
          license_url: str((attrRaw as Record<string, unknown>).license_url) ?? undefined,
        }
      : undefined;
  return { url, isMain: r.isMain === true, attribution };
}

function parseSource(raw: unknown): PlaceSource | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const r = raw as Record<string, unknown>;
  const name = str(r.name);
  const address = str(r.address);
  if (!name || !address) return null;
  return {
    name,
    address,
    license: str(r.license) ?? undefined,
    licenseUrl: str(r.licenseUrl) ?? undefined,
  };
}

function parsePlace(raw: unknown): Place | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const r = raw as Record<string, unknown>;
  const id = str(r.id);
  const slug = str(r.slug);
  const name = str(r.name);
  const category = str(r.category);
  const shortDescription = str(r.shortDescription);
  const lat = typeof r.lat === 'number' ? r.lat : NaN;
  const lng = typeof r.lng === 'number' ? r.lng : NaN;
  if (!id || !slug || !name || !shortDescription) return null;
  if (Number.isNaN(lat) || Number.isNaN(lng)) return null;
  if (category !== 'wisata' && category !== 'kuliner') return null;

  const images: PlaceImage[] = [];
  if (Array.isArray(r.images)) {
    for (const rawImg of r.images) {
      const img = parseImage(rawImg);
      if (img) images.push(img);
    }
    if (images.length && !images.some((i) => i.isMain)) {
      images[0] = { ...images[0], isMain: true };
    }
  }

  const typeRaw = str(r.type);
  const PLACE_TYPES = ['sejarah', 'alam', 'budaya', 'pantai', 'belanja'];
  const type =
    category === 'wisata' && typeRaw && PLACE_TYPES.includes(typeRaw)
      ? (typeRaw as PlaceType)
      : null;

  const related: Array<{ kind: string; id: string }> = [];
  if (Array.isArray(r.related)) {
    for (const rawRel of r.related) {
      if (typeof rawRel !== 'object' || rawRel === null) continue;
      const rr = rawRel as Record<string, unknown>;
      const kind = str(rr.kind);
      const rid = str(rr.id);
      if (kind && rid) related.push({ kind, id: rid });
    }
  }

  const sources: PlaceSource[] = Array.isArray(r.sources)
    ? r.sources.map(parseSource).filter((s): s is PlaceSource => s !== null)
    : [];

  return {
    id,
    slug,
    name,
    category: category as PlaceCategory,
    type,
    lat,
    lng,
    shortDescription,
    images,
    hours: str(r.hours) ?? undefined,
    contact: str(r.contact) ?? undefined,
    related,
    sources,
  };
}

/** Cover list/kartu/peta. List kosong → null (placeholder). */
export function placeCover(p: Place): PlaceImage | null {
  return p.images.find((i) => i.isMain) ?? p.images[0] ?? null;
}

/** Null = CDN gagal/JSON rusak (soft-fail, caller yang putuskan render). */
export async function fetchPlaces(
  signal?: AbortSignal,
): Promise<Place[] | null> {
  try {
    const res = await fetch(CDN_URL, { signal });
    if (!res.ok) return null;
    const body: unknown = await res.json();
    if (typeof body !== 'object' || body === null) return null;
    const list = (body as Record<string, unknown>).places;
    if (!Array.isArray(list)) return null;
    return list.map(parsePlace).filter((p): p is Place => p !== null);
  } catch {
    return null;
  }
}

export async function fetchPlaceBySlug(
  slug: string,
  signal?: AbortSignal,
): Promise<Place | null> {
  const all = await fetchPlaces(signal);
  return all?.find((p) => p.slug === slug && p.category === 'wisata') ?? null;
}

/** Label type wisata untuk badge/UI. */
export const placeTypeLabels: Record<PlaceType, string> = {
  sejarah: 'Sejarah',
  alam: 'Alam',
  budaya: 'Budaya',
  pantai: 'Pantai',
  belanja: 'Belanja',
};

/** Label kategori untuk chip UI: kuliner tetap Kuliner, wisata ikut type. */
export const placeLabel = (p: Place): string =>
  p.category === 'kuliner'
    ? 'Kuliner'
    : p.type !== null
      ? (placeTypeLabels[p.type] ?? 'Wisata')
      : 'Wisata';
