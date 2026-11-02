/**
 * Parse kuliner (murni, tanpa dependensi infrastruktur) supaya bisa dites
 * dengan node test runner tanpa alias `@/`.
 *
 * Dua sumber wire: item API (snake_case) dan item CDN (`data/cuisines.json`,
 * camelCase). Keduanya dinormalkan ke satu bentuk [Cuisine].
 */

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

/** Item bentuk CDN. Item rusak (field wajib absen) -> null. */
export function parseCuisine(raw: unknown): Cuisine | null {
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

/** Isi `cuisines.json` CDN -> daftar [Cuisine]. */
export function parseCdnCuisines(body: unknown): Cuisine[] | null {
  if (typeof body !== 'object' || body === null) return null;
  const list = (body as Record<string, unknown>).cuisines;
  if (!Array.isArray(list)) return null;
  return list.map(parseCuisine).filter((c): c is Cuisine => c !== null);
}

/**
 * Item API memakai snake_case (`origin_region`, `is_main`, `license_url`).
 * Dipetakan ke bentuk CDN lama supaya [parseCuisine] (normalisasi satu
 * gambar utama, wajib https) tetap satu-satunya jalur parse.
 */
export function parseApiCuisine(raw: unknown): Cuisine | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const r = raw as Record<string, unknown>;
  return parseCuisine({
    id: r.id,
    slug: r.slug,
    name: r.name,
    description: r.description,
    region: r.origin_region,
    ingredients: r.ingredients,
    tags: r.tags,
    servingSuggestion: r.serving_suggestion,
    images: Array.isArray(r.images)
      ? r.images.map((img) => {
          if (typeof img !== 'object' || img === null) return img;
          const i = img as Record<string, unknown>;
          const attr = i.attribution;
          return {
            url: i.url,
            isMain: i.is_main === true,
            attribution:
              typeof attr === 'object' && attr !== null
                ? {
                    name: (attr as Record<string, unknown>).name,
                    provider: (attr as Record<string, unknown>).provider,
                    url: (attr as Record<string, unknown>).url,
                    license: (attr as Record<string, unknown>).license,
                    license_url: (attr as Record<string, unknown>).license_url,
                  }
                : undefined,
          };
        })
      : r.images,
    sources: Array.isArray(r.sources)
      ? r.sources.map((s) => {
          if (typeof s !== 'object' || s === null) return s;
          const src = s as Record<string, unknown>;
          return {
            name: src.name,
            address: src.address,
            license: src.license,
            licenseUrl: src.license_url,
          };
        })
      : r.sources,
  });
}

/** Cover list/kartu. List kosong -> null (placeholder). */
export function cuisineCover(c: Cuisine): CuisineImage | null {
  return c.images.find((i) => i.isMain) ?? c.images[0] ?? null;
}
