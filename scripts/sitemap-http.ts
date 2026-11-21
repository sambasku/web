/**
 * GET publik untuk script sitemap (Node, tanpa Vite).
 * Retry + failover host selaras isInfraStatus di app/infrastructure/api/failover.ts.
 */

const DEFAULT_PRIMARY = 'https://api.sambasku.com/api/v1';
const DEFAULT_FALLBACKS = 'https://cloudflare.sambasku.com/api/v1';

const DEFAULT_RETRY_DELAYS_MS = [1_000, 3_000, 8_000] as const;

function retryDelaysMs(): readonly number[] {
  const raw = process.env.SITEMAP_RETRY_DELAYS_MS;
  if (raw) {
    const parsed = raw
      .split(',')
      .map((s) => Number.parseInt(s.trim(), 10))
      .filter((n) => Number.isFinite(n) && n >= 0);
    if (parsed.length > 0) return parsed;
  }
  return DEFAULT_RETRY_DELAYS_MS;
}

export function sitemapApiBases(): string[] {
  const primary = (process.env.SITEMAP_API_BASE_URL ?? DEFAULT_PRIMARY).replace(
    /\/+$/,
    '',
  );
  const fallbacks = (process.env.SITEMAP_API_BASE_URL_FALLBACKS ?? DEFAULT_FALLBACKS)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => s.replace(/\/+$/, ''));
  const seen = new Set<string>();
  const out: string[] = [];
  for (const base of [primary, ...fallbacks]) {
    if (seen.has(base)) continue;
    seen.add(base);
    out.push(base);
  }
  return out;
}

function isInfraStatus(
  status: number,
  parsed: { error_code?: string } | null,
): boolean {
  if (status === 502 || status === 504) return true;
  if (status === 503) {
    return parsed === null || parsed.error_code === 'UPSTREAM_CAPACITY';
  }
  if (status >= 500 && parsed === null) return true;
  return false;
}

function isRetryableStatus(
  status: number,
  parsed: { error_code?: string } | null,
): boolean {
  return status === 429 || isInfraStatus(status, parsed);
}

function parseErrorBody(text: string): { error_code?: string } | null {
  if (!text) return null;
  try {
    return JSON.parse(text) as { error_code?: string };
  } catch {
    return null;
  }
}

function retryDelayMs(status: number, res: Response, attemptIndex: number): number {
  if (status === 429) {
    const raw = res.headers.get('Retry-After');
    if (raw) {
      const sec = Number.parseInt(raw, 10);
      if (Number.isFinite(sec) && sec > 0) return sec * 1_000;
    }
  }
  const delays = retryDelaysMs();
  return delays[attemptIndex] ?? delays[delays.length - 1] ?? 1_000;
}

export interface FetchSitemapJsonOptions {
  /** Contoh: GET /words - untuk pesan error CI. */
  label?: string;
}

/**
 * @param url Hanya pathname + search dipakai; origin diabaikan.
 */
export async function fetchSitemapJson<T>(
  url: URL,
  options: FetchSitemapJsonOptions = {},
): Promise<T> {
  const label = options.label ?? `GET ${url.pathname}`;
  const pathWithQuery = `${url.pathname}${url.search}`;
  const bases = sitemapApiBases();
  let lastError: Error | null = null;

  for (const base of bases) {
    const targetUrl = `${base}${pathWithQuery}`;
    const delays = retryDelaysMs();
    const attempts = delays.length + 1;

    for (let attempt = 0; attempt < attempts; attempt++) {
      const res = await fetch(targetUrl);
      const text = await res.text();

      if (res.ok) {
        try {
          return JSON.parse(text) as T;
        } catch {
          throw new Error(`${label}: respons bukan JSON (${base})`);
        }
      }

      const parsed = parseErrorBody(text);
      if (!isRetryableStatus(res.status, parsed)) {
        throw new Error(`${label} gagal: HTTP ${res.status} (${base})`);
      }

      if (attempt < attempts - 1) {
        await new Promise((r) =>
          setTimeout(r, retryDelayMs(res.status, res, attempt)),
        );
        continue;
      }

      lastError = new Error(`${label} gagal: HTTP ${res.status} (${base})`);
    }
  }

  throw lastError ?? new Error(`${label} gagal: tidak ada host API`);
}