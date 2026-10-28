import { createRequestHandler } from 'react-router';
import { env } from './infrastructure/config/env';
import { SITEMAP_OBJECT_KEY } from './application/utils/sitemap-items';
import {
  SITEMAP_STALE_RETRY_S,
  STALE_MAX_S,
  cacheKeyRequest,
  cacheTtlSeconds,
  canonicalCachePath,
  freshSeconds,
  isCacheableRequest,
  isOgImagePath,
  isSitemapPath,
  serveLastGood,
  withCanonicalPath,
} from './edge/cache-policy';
import {
  apiConnectOriginsFrom,
  buildSecurityHeaders,
} from './edge/security-headers';

const requestHandler = createRequestHandler(
  () => import('virtual:react-router/server-build'),
  import.meta.env.MODE,
);

const SECURITY_HEADERS = buildSecurityHeaders({
  apiConnectOrigins: apiConnectOriginsFrom([
    env.apiBaseUrl,
    ...env.apiBaseUrlFallbacks,
  ]),
  isProd: env.isProd,
});

// ponytail: _headers hanya berlaku untuk aset statis - respons SSR (HTML,
// sitemap) lewat worker ini, jadi header keamanan diset di sini.
// Nilai diturunkan dari modul yang sama dengan public/_headers (lihat
// app/edge/security-headers.ts + plugin generate-headers-file di
// vite.config.ts) supaya tidak ada dua daftar CSP yang bisa drift (BH-06).

// @cloudflare/workers-types versi ini tidak mengetikkan caches.default
const edgeCache: Cache = (caches as unknown as { default: Cache }).default;

function withSecurityHeaders(response: Response, pathname: string): Response {
  const headers = new Headers(response.headers);
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    headers.set(key, value);
  }
  // Kartu OG difetch crawler/unfurler lintas origin; CORP same-origin
  // menghalangi sebagian proxy unfurl. Crawler umumnya mengabaikan CORP,
  // tapi longgarkan khusus path ini supaya share card aman di semua klien.
  if (isOgImagePath(pathname)) {
    headers.set('Cross-Origin-Resource-Policy', 'cross-origin');
  }
  // Staging tidak boleh terlisting di search engine.
  if (!env.isProd) {
    headers.set('X-Robots-Tag', 'noindex, nofollow');
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

async function render(request: Request, bucket?: R2Bucket): Promise<Response> {
  const pathname = new URL(request.url).pathname;
  // File harian di R2. Tidak ada objek, atau bacaan gagal: pembangun di route.
  if (bucket && env.isProd && isSitemapPath(pathname)) {
    try {
      const object = await bucket.get(SITEMAP_OBJECT_KEY);
      if (object) {
        return withSecurityHeaders(
          new Response(object.body, {
            status: 200,
            headers: {
              'Content-Type': 'application/xml; charset=utf-8',
              'Cache-Control': 'public, max-age=3600, s-maxage=86400',
            },
          }),
          pathname,
        );
      }
    } catch (err) {
      console.error('[sitemap] gagal membaca R2, jatuh ke pembangun', err);
    }
  }

  // HEAD dirender sebagai GET supaya body terisi penuh dan entry cache yang
  // dihasilkan valid untuk GET berikutnya (pentest B-12); body untuk klien
  // HEAD dibuang oleh forHead.
  const effective =
    request.method === 'HEAD'
      ? new Request(request.url, { method: 'GET', headers: request.headers })
      : request;
  const response = await requestHandler(effective);
  return withSecurityHeaders(response, pathname);
}

type EdgeEnv = {
  CF_VERSION_METADATA?: WorkerVersionMetadata;
  SITEMAP?: R2Bucket;
};

/// HEAD tidak boleh membawa body (semantik HTTP); header - termasuk
/// Content-Length hasil render GET - tetap utuh (pentest B-12).
function forHead(request: Request, response: Response): Response {
  if (request.method !== 'HEAD') return response;
  return new Response(null, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  });
}

/// Yang disimpan di Cache API perlu TTL panjang supaya entry tidak dihapus.
/// Yang dikirim ke browser harus no-cache: kalau browser menyimpan HTML
/// sehari, deploy berikutnya membuat semua <script src="/assets/*"> 404.
function forBrowser(response: Response, cacheStatus: string): Response {
  const headers = new Headers(response.headers);
  headers.set('Cache-Control', 'no-cache');
  // Header internal entry cache tidak boleh bocor ke klien (pentest W-08).
  headers.delete('x-cached-at');
  headers.delete('x-cache-ttl');
  headers.set('x-cache', cacheStatus);
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

async function renderAndCache(
  request: Request,
  ctx: ExecutionContext,
  versionId: string,
  bucket?: R2Bucket,
): Promise<Response> {
  const response = await render(request, bucket);
  const ttlS = cacheTtlSeconds(new URL(request.url).pathname, response.status);
  if (ttlS > 0) {
    const headers = new Headers(response.headers);
    // Cache API menolak menyimpan respons ber-Set-Cookie: put() jadi no-op
    // diam-diam sehingga edge cache HTML mati total (pentest G-01). Entry
    // cache memang harus bebas state per-user; cookie tetap sampai ke browser
    // lewat `response` yang dikembalikan.
    headers.delete('Set-Cookie');
    headers.set('x-cached-at', String(Date.now()));
    headers.set('x-cache-ttl', String(ttlS));
    headers.set('Cache-Control', `public, max-age=${ttlS}`);
    // PENTING: body stream cuma boleh dibaca SATU kali. clone() dulu untuk
    // cache - pakai response.body langsung membuat stream "disturbed" dan
    // response yang dikembalikan ke klien melempar error. put di waitUntil
    // supaya klien tidak menunggu penulisan cache.
    const forCache = new Response(response.clone().body, {
      status: response.status,
      headers,
    });
    ctx.waitUntil(edgeCache.put(cacheKeyRequest(request, versionId), forCache));
  }
  return response;
}

/** Rebuild di belakang. Gagal: tahan salinan 200 selama SITEMAP_STALE_RETRY_S. */
async function refreshExpiredSitemap(
  request: Request,
  ctx: ExecutionContext,
  versionId: string,
  stale: Response,
  bucket: R2Bucket | undefined,
): Promise<void> {
  try {
    const response = await renderAndCache(request, ctx, versionId, bucket);
    if (response.status === 200) {
      await response.body?.cancel();
      await stale.body?.cancel();
      return;
    }
    await response.body?.cancel();
    const headers = new Headers(stale.headers);
    headers.set('x-cached-at', String(Date.now()));
    headers.set('x-cache-ttl', String(SITEMAP_STALE_RETRY_S));
    await edgeCache.put(
      cacheKeyRequest(request, versionId),
      new Response(stale.body, {
        status: stale.status,
        statusText: stale.statusText,
        headers,
      }),
    );
  } catch (err) {
    console.error('[sitemap] gagal menyegarkan cache basi', err);
  }
}

const HTTPS_ONLY_HOSTS = new Set([
  'sambasku.com',
  'www.sambasku.com',
  'sambasku-web-staging.iamutaki.com',
]);

function httpsOnlyHost(hostname: string): boolean {
  return HTTPS_ONLY_HOSTS.has(hostname);
}

/** Skema yang dilihat pengunjung. Worker Cloudflare menerima URL sebagai https. */
function inboundHttp(request: Request): boolean {
  const visitor = request.headers.get('CF-Visitor');
  if (visitor) {
    try {
      const parsed = JSON.parse(visitor) as { scheme?: string };
      return parsed.scheme === 'http';
    } catch {
      return false;
    }
  }
  return new URL(request.url).protocol === 'http:';
}

export default {
  async fetch(request, env: EdgeEnv, ctx): Promise<Response> {
    const inboundUrl = new URL(request.url);

    // www hanya alias; apex kanonikal (pentest W-11).
    // Di Cloudflare, request.url selalu https. Skema klien ada di CF-Visitor.
    if (
      inboundUrl.hostname === 'www.sambasku.com' ||
      (inboundHttp(request) && httpsOnlyHost(inboundUrl.hostname))
    ) {
      inboundUrl.protocol = 'https:';
      if (inboundUrl.hostname === 'www.sambasku.com') {
        inboundUrl.hostname = 'sambasku.com';
      }
      // Path ikut dikanonikalkan di Location supaya klien tidak menyimpan
      // bookmark dengan slash ganda / trailing slash.
      inboundUrl.pathname = canonicalCachePath(inboundUrl.pathname);
      return Response.redirect(inboundUrl.toString(), 301);
    }

    // Samakan path dengan kunci cache sebelum lookup/render (BH-04): tanpa ini
    // `/id//words//x` merender 404 lalu negative-cache meracuni entry 200.
    // Variabel baru (bukan reassign `request`): `new Request(url, req)` di
    // Workers bertipe `CfProperties`, bukan `IncomingRequestCfProperties`.
    const canonical = withCanonicalPath(request);
    const { method } = canonical;
    const url = new URL(canonical.url);
    const { pathname } = url;

    if (!isCacheableRequest(method, pathname, url.search)) {
      return forHead(canonical, forBrowser(await render(canonical, env.SITEMAP), 'bypass'));
    }

    const versionId = env.CF_VERSION_METADATA?.id ?? 'dev';
    const key = cacheKeyRequest(canonical, versionId);
    const cached = await edgeCache.match(key);
    if (cached) {
      const ttlS = Number(cached.headers.get('x-cache-ttl') ?? STALE_MAX_S);
      const ageS =
        (Date.now() - Number(cached.headers.get('x-cached-at') ?? 0)) / 1000;
      if (ageS >= ttlS) {
        if (serveLastGood(pathname, cached.status)) {
          const forClient = cached.clone();
          ctx.waitUntil(
            refreshExpiredSitemap(canonical, ctx, versionId, cached, env.SITEMAP),
          );
          return forHead(canonical, forBrowser(forClient, 'stale'));
        }
        const response = await renderAndCache(canonical, ctx, versionId, env.SITEMAP);
        return forHead(canonical, forBrowser(response, 'miss'));
      }
      const freshS = Math.min(freshSeconds(pathname), ttlS);
      if (ageS > freshS) {
        ctx.waitUntil(
          renderAndCache(canonical, ctx, versionId, env.SITEMAP).then(async (response) => {
            await response.body?.cancel();
          }),
        );
      }
      return forHead(
        canonical,
        forBrowser(cached, ageS <= freshS ? 'hit' : 'swr'),
      );
    }

    const response = await renderAndCache(canonical, ctx, versionId, env.SITEMAP);
    return forHead(canonical, forBrowser(response, 'miss'));
  },
} satisfies ExportedHandler<EdgeEnv>;
