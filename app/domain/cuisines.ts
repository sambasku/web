/**
 * Data kuliner dari CDN (repo `data` via jsDelivr, file `cuisines.json`).
 *
 * Sumber sama dengan mobile: satu JSON statis, di-fetch SSR lalu di-cache.
 * Parse defensif: item tanpa field wajib di-skip - satu item rusak tidak
 * mematikan seluruh koleksi.
 */

const CDN_URL =
  'https://cdn.jsdelivr.net/gh/sambasku/data@main/cuisines.json';

export interface CuisineImage {
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

export interface CuisineSource {
  name: string;
  address: string;
  license?: string;
  licenseUrl?: string;
}

export interface Cuisine {
  id: string;
  slug: string;
  name: string;
  description: string;
  images: CuisineImage[];
  ingredients: string[];
  region: string;
  tags: string[];
  servingSuggestion?: string;
  sources: CuisineSource[];
}

function str(v: unknown): string | null {
  return typeof v === 'string' && v.trim() ? v.trim() : null;
}

function stringList(v: unknown): string[] {
  return Array.isArray(v)
    ? v.filter((s): s is string => typeof s === 'string' && !!s.trim())
    : [];
}

function parseImage(raw: unknown): CuisineImage | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const url = str((raw as Record<string, unknown>).url);
  if (!url?.startsWith('https://')) return null;
  const r = raw as Record<string, unknown>;
  const attrRaw = r.attribution;
  const attribution =
    typeof attrRaw === 'object' && attrRaw !== null && str((attrRaw as Record<string, unknown>).name)
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

function parseSource(raw: unknown): CuisineSource | null {
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

function parseCuisine(raw: unknown): Cuisine | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const r = raw as Record<string, unknown>;
  const id = str(r.id);
  const slug = str(r.slug);
  const name = str(r.name);
  const description = str(r.description);
  const region = str(r.region);
  if (!id || !slug || !name || !description || !region) return null;

  const images: CuisineImage[] = [];
  if (Array.isArray(r.images)) {
    for (const rawImg of r.images) {
      const img = parseImage(rawImg);
      if (img) images.push(img);
    }
    // Normalisasi: tepat satu main - true pertama menang; tanpa true,
    // elemen pertama dianggap main.
    if (images.length && !images.some((i) => i.isMain)) {
      images[0] = { ...images[0], isMain: true };
    }
  }

  const sources: CuisineSource[] = Array.isArray(r.sources)
    ? r.sources.map(parseSource).filter((s): s is CuisineSource => s !== null)
    : [];

  return {
    id,
    slug,
    name,
    description,
    images,
    ingredients: stringList(r.ingredients),
    region,
    tags: stringList(r.tags),
    servingSuggestion: str(r.servingSuggestion) ?? undefined,
    sources,
  };
}

/** Cover list/kartu. List kosong → null (placeholder). */
export function cuisineCover(c: Cuisine): CuisineImage | null {
  return c.images.find((i) => i.isMain) ?? c.images[0] ?? null;
}

/** Null = CDN gagal/JSON rusak (soft-fail, caller yang putuskan render). */
export async function fetchCuisines(
  signal?: AbortSignal,
): Promise<Cuisine[] | null> {
  try {
    const res = await fetch(CDN_URL, { signal });
    if (!res.ok) return null;
    const body: unknown = await res.json();
    if (typeof body !== 'object' || body === null) return null;
    const list = (body as Record<string, unknown>).cuisines;
    if (!Array.isArray(list)) return null;
    return list.map(parseCuisine).filter((c): c is Cuisine => c !== null);
  } catch {
    return null;
  }
}

export async function fetchCuisineBySlug(
  slug: string,
  signal?: AbortSignal,
): Promise<Cuisine | null> {
  const all = await fetchCuisines(signal);
  return all?.find((c) => c.slug === slug) ?? null;
}
