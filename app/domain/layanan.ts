import { apiClient, AppError } from '@/infrastructure/api/api-client';
import { authHeaders } from '@/infrastructure/auth/access-token';

export type LayananCategory = 'ambulance' | 'fire';

export interface LayananPhone {
  phone: string;
  note: string | null;
  whatsapp: string | null;
}

export interface Layanan {
  id: string;
  slug: string;
  category: LayananCategory;
  name: string;
  phones: LayananPhone[];
  logoUrl: string | null;
  addressText: string | null;
  lat: number | null;
  lng: number | null;
  mapsUrl: string | null;
  regionId: string;
  regionName: string | null;
  regionSlug: string | null;
  note: string | null;
  updatedAt: string;
}

export interface LayananRegion {
  id: string;
  slug: string;
  name: string;
  type: string;
}

interface LayananPhoneWire {
  phone: string;
  note: string | null;
  whatsapp: string | null;
}

interface LayananWire {
  id: string;
  slug: string;
  category: LayananCategory;
  name: string;
  phones: LayananPhoneWire[];
  logo_url: string | null;
  address_text: string | null;
  lat: number | null;
  lng: number | null;
  maps_url: string | null;
  region_id: string;
  region_name: string | null;
  region_slug: string | null;
  note: string | null;
  updated_at: string;
}

function mapLayanan(row: LayananWire): Layanan {
  return {
    id: row.id,
    slug: row.slug,
    category: row.category,
    name: row.name,
    phones: (row.phones ?? []).map((p) => ({
      phone: p.phone,
      note: p.note,
      whatsapp: p.whatsapp,
    })),
    logoUrl: row.logo_url,
    addressText: row.address_text,
    lat: row.lat,
    lng: row.lng,
    mapsUrl: row.maps_url,
    regionId: row.region_id,
    regionName: row.region_name,
    regionSlug: row.region_slug,
    note: row.note,
    updatedAt: row.updated_at,
  };
}

export async function fetchLayanan(regionId?: string, signal?: AbortSignal): Promise<Layanan[] | null> {
  try {
    const q = new URLSearchParams();
    if (regionId) q.set('region_id', regionId);
    const res = await apiClient<{ items: LayananWire[] }>(
      `/layanan${q.size ? `?${q}` : ''}`,
      { signal },
    );
    return (res.data.items ?? []).map(mapLayanan);
  } catch {
    return null;
  }
}

export async function fetchLayananBySlug(slug: string, signal?: AbortSignal): Promise<Layanan | null> {
  try {
    const res = await apiClient<LayananWire>(`/layanan/${encodeURIComponent(slug)}`, { signal });
    return mapLayanan(res.data);
  } catch (error) {
    if (error instanceof AppError && error.statusCode === 404) return null;
    throw error;
  }
}

export async function fetchKecamatan(signal?: AbortSignal): Promise<LayananRegion[]> {
  const res = await apiClient<{ regions: LayananRegion[] }>('/regions/catalog', { signal });
  return (res.data.regions ?? []).filter((r) => r.type === 'kecamatan');
}

export async function submitLayanan(body: Record<string, unknown>): Promise<void> {
  await apiClient('/layanan-contributions', {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(body),
  });
}
