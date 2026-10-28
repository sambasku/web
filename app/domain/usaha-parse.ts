/**
 * Parser usaha dari wire API (snake_case) ke domain aplikasi (camelCase).
 * Murni tanpa import alias supaya bisa diuji `node --test`.
 */

export type UsahaKind = 'product' | 'service' | 'both';

export type UsahaOperationalStatus =
  | 'unknown'
  | 'open'
  | 'temporarily_closed'
  | 'permanently_closed';

export interface UsahaCategoryRef {
  id: string;
  name: string;
}

export interface UsahaVillageRef {
  id: string;
  name: string;
  slug: string | null;
}

export interface UsahaItem {
  id: string;
  name: string;
  description: string | null;
  /** Teks bebas - null berarti belum dicantumkan, BUKAN gratis. */
  priceText: string | null;
  imageUrl: string | null;
  sortOrder: number;
}

export interface Usaha {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  categoryId: string | null;
  category: UsahaCategoryRef | null;
  kind: UsahaKind;
  regionId: string | null;
  villageId: string | null;
  village: UsahaVillageRef | null;
  addressText: string | null;
  lat: number | null;
  lng: number | null;
  mapsUrl: string | null;
  phone: string | null;
  whatsapp: string | null;
  website: string | null;
  socialUrl: string | null;
  coverUrl: string | null;
  operationalStatus: UsahaOperationalStatus;
  items: UsahaItem[];
  createdAt: string;
  updatedAt: string | null;
}

export interface ApiUsahaItem {
  id: string;
  name: string;
  description?: string | null;
  price_text?: string | null;
  image_url?: string | null;
  sort_order?: number;
}

export interface ApiUsaha {
  id: string;
  slug: string;
  name: string;
  description?: string | null;
  category_id?: string | null;
  category?: UsahaCategoryRef | null;
  kind?: string | null;
  region_id?: string | null;
  village_id?: string | null;
  village?: UsahaVillageRef | null;
  address_text?: string | null;
  lat?: number | null;
  lng?: number | null;
  maps_url?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  website?: string | null;
  social_url?: string | null;
  cover_url?: string | null;
  operational_status?: string | null;
  items?: ApiUsahaItem[];
  created_at: string;
  updated_at?: string | null;
}

const KINDS: readonly UsahaKind[] = ['product', 'service', 'both'];
const OPERATIONAL: readonly UsahaOperationalStatus[] = [
  'unknown',
  'open',
  'temporarily_closed',
  'permanently_closed',
];

function text(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function mapItem(row: ApiUsahaItem): UsahaItem {
  return {
    id: row.id,
    name: row.name,
    description: text(row.description),
    priceText: text(row.price_text),
    imageUrl: text(row.image_url),
    sortOrder: typeof row.sort_order === 'number' ? row.sort_order : 0,
  };
}

export function mapUsaha(row: ApiUsaha): Usaha {
  const kind = KINDS.includes(row.kind as UsahaKind)
    ? (row.kind as UsahaKind)
    : 'product';
  const operational = OPERATIONAL.includes(row.operational_status as UsahaOperationalStatus)
    ? (row.operational_status as UsahaOperationalStatus)
    : 'unknown';
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: text(row.description),
    categoryId: text(row.category_id),
    category: row.category ?? null,
    kind,
    regionId: text(row.region_id),
    villageId: text(row.village_id),
    village: row.village ?? null,
    addressText: text(row.address_text),
    lat: typeof row.lat === 'number' ? row.lat : null,
    lng: typeof row.lng === 'number' ? row.lng : null,
    mapsUrl: text(row.maps_url),
    phone: text(row.phone),
    whatsapp: text(row.whatsapp),
    website: text(row.website),
    socialUrl: text(row.social_url),
    coverUrl: text(row.cover_url),
    operationalStatus: operational,
    items: Array.isArray(row.items) ? row.items.map(mapItem) : [],
    createdAt: row.created_at,
    updatedAt: text(row.updated_at),
  };
}

const OPERATIONAL_LABELS: Record<UsahaOperationalStatus, string> = {
  unknown: '',
  open: 'Buka',
  temporarily_closed: 'Tutup sementara',
  permanently_closed: 'Tutup permanen',
};

export function usahaOperationalLabel(status: UsahaOperationalStatus): string {
  return OPERATIONAL_LABELS[status] ?? '';
}

const KIND_LABELS: Record<UsahaKind, string> = {
  product: 'Produk',
  service: 'Jasa',
  both: 'Produk dan jasa',
};

export function usahaKindLabel(kind: UsahaKind): string {
  return KIND_LABELS[kind] ?? kind;
}

/** Alamat tampil: petunjuk lokasi, desa, atau null. */
export function usahaLocationLine(usaha: Usaha): string | null {
  return usaha.addressText ?? usaha.village?.name ?? null;
}
