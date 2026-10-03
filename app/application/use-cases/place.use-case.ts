/**
 * Data tempat wisata/kuliner. Sumber sama dengan mobile (repo data,
 * disajikan jsDelivr), jadi web dan aplikasi selalu sinkron.
 */
const PLACES_URL =
  'https://cdn.jsdelivr.net/gh/sambasku/data@main/mobile/explore/places.json';

export const PLACE_TYPE_LABELS: Record<string, string> = {
  sejarah: 'Sejarah',
  alam: 'Alam',
  budaya: 'Budaya',
  pantai: 'Pantai',
  belanja: 'Belanja',
};

type Attribution = {
  name: string;
  provider?: string;
  url?: string;
  license?: string;
  license_url?: string;
};

type PlaceImage = { url: string; isMain?: boolean; attribution?: Attribution };

export type Place = {
  id: string;
  slug: string;
  name: string;
  category: 'wisata' | 'kuliner';
  type?: string | null;
  lat: number;
  lng: number;
  shortDescription: string;
  images?: PlaceImage[];
  hours?: string | null;
  contact?: string | null;
  related?: { kind: string; id: string }[];
  sources?: {
    name: string;
    address: string;
    license?: string;
    licenseUrl?: string;
  }[];
};

export async function listPlaces(signal?: AbortSignal): Promise<Place[]> {
  const res = await fetch(PLACES_URL, { signal });
  if (!res.ok) throw new Response('Gagal memuat data tempat', { status: 502 });
  return ((await res.json()) as { places?: Place[] }).places ?? [];
}

export const placeCover = (p: Place) =>
  p.images?.find((i) => i.isMain) ?? p.images?.[0] ?? null;

export const placeLabel = (p: Place) =>
  p.category === 'kuliner'
    ? 'Kuliner'
    : (PLACE_TYPE_LABELS[p.type ?? ''] ?? 'Wisata');
