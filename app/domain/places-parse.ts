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

export interface PlaceRelated {
  kind: string;
  slug: string;
  name: string | null;
  category: string | null;
  type: string | null;
  coverUrl: string | null;
}

export type PlaceCategory = string;
export type PlaceType = 'sejarah' | 'alam' | 'budaya' | 'pantai' | 'belanja';

export interface Place {
  id: string;
  slug: string;
  name: string;
  category: PlaceCategory;
  type: PlaceType | null;
  lat: number | null;
  lng: number | null;
  mapsUrl: string | null;
  shortDescription: string;
  images: PlaceImage[];
  imageCount: number;
  hours?: string;
  contact?: string;
  related: PlaceRelated[];
  sources: PlaceSource[];
}

export interface ApiImage {
  url: string;
  is_main?: boolean;
  attribution?: {
    name?: string;
    provider?: string;
    url?: string | null;
    license?: string | null;
    license_url?: string | null;
  } | null;
}

export interface ApiPlace {
  id: string;
  slug: string;
  name: string;
  category: string;
  type: PlaceType | null;
  lat: number | null;
  lng: number | null;
  maps_url?: string | null;
  short_description: string;
  hours?: string | null;
  contact?: string | null;
  image_count?: number;
  images?: ApiImage[];
  related?: Array<{
    kind: string;
    slug: string;
    name?: string | null;
    category?: string | null;
    type?: string | null;
    cover_url?: string | null;
  }>;
  sources?: Array<{
    name: string;
    address: string;
    license?: string | null;
    license_url?: string | null;
  }>;
}

export function mapPlace(row: ApiPlace): Place {
  const images = (row.images ?? []).map((img) => ({
    url: img.url,
    isMain: img.is_main === true,
    attribution: img.attribution?.name
      ? {
          name: img.attribution.name,
          provider: img.attribution.provider,
          url: img.attribution.url ?? undefined,
          license: img.attribution.license ?? undefined,
          license_url: img.attribution.license_url ?? undefined,
        }
      : undefined,
  }));
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    category: row.category,
    type: row.type,
    lat: row.lat,
    lng: row.lng,
    mapsUrl: row.maps_url ?? null,
    shortDescription: row.short_description ?? '',
    images,
    imageCount: row.image_count ?? images.length,
    hours: row.hours ?? undefined,
    contact: row.contact ?? undefined,
    related: (row.related ?? []).map((r) => ({
      kind: r.kind,
      slug: r.slug,
      name: r.name ?? null,
      category: r.category ?? null,
      type: r.type ?? null,
      coverUrl: r.cover_url ?? null,
    })),
    sources: (row.sources ?? []).map((s) => ({
      name: s.name,
      address: s.address,
      license: s.license ?? undefined,
      licenseUrl: s.license_url ?? undefined,
    })),
  };
}

export function placeCover(p: Place): PlaceImage | null {
  return p.images.find((i) => i.isMain) ?? p.images[0] ?? null;
}

export const placeTypeLabels: Record<PlaceType, string> = {
  sejarah: 'Sejarah',
  alam: 'Alam',
  budaya: 'Budaya',
  pantai: 'Pantai',
  belanja: 'Belanja',
};

export const placeLabel = (p: { category: string; type: PlaceType | null }): string =>
  p.category === 'kuliner'
    ? 'Kuliner'
    : p.type !== null
      ? (placeTypeLabels[p.type] ?? 'Wisata')
      : 'Wisata';
