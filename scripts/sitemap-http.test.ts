import assert from 'node:assert/strict';
import { afterEach, beforeEach, describe, it } from 'node:test';
import { fetchSitemapJson, sitemapApiBases } from './sitemap-http.ts';

const originalFetch = globalThis.fetch;

function apiUrl(path: string, search = ''): URL {
  return new URL(`${path}${search}`, 'http://sitemap.local');
}

describe('sitemapApiBases', () => {
  const prevBase = process.env.SITEMAP_API_BASE_URL;
  const prevFb = process.env.SITEMAP_API_BASE_URL_FALLBACKS;

  afterEach(() => {
    if (prevBase === undefined) delete process.env.SITEMAP_API_BASE_URL;
    else process.env.SITEMAP_API_BASE_URL = prevBase;
    if (prevFb === undefined) delete process.env.SITEMAP_API_BASE_URL_FALLBACKS;
    else process.env.SITEMAP_API_BASE_URL_FALLBACKS = prevFb;
  });

  it('dedupe primary dan fallback', () => {
    process.env.SITEMAP_API_BASE_URL = 'https://api.example.com/api/v1';
    process.env.SITEMAP_API_BASE_URL_FALLBACKS =
      'https://api.example.com/api/v1,https://cf.example.com/api/v1';
    assert.deepEqual(sitemapApiBases(), [
      'https://api.example.com/api/v1',
      'https://cf.example.com/api/v1',
    ]);
  });
});

describe('fetchSitemapJson', () => {
  const prevDelays = process.env.SITEMAP_RETRY_DELAYS_MS;

  beforeEach(() => {
    process.env.SITEMAP_API_BASE_URL = 'https://primary.test/api/v1';
    process.env.SITEMAP_API_BASE_URL_FALLBACKS = 'https://fallback.test/api/v1';
    process.env.SITEMAP_RETRY_DELAYS_MS = '0,0,0';
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    delete process.env.SITEMAP_API_BASE_URL;
    delete process.env.SITEMAP_API_BASE_URL_FALLBACKS;
    if (prevDelays === undefined) delete process.env.SITEMAP_RETRY_DELAYS_MS;
    else process.env.SITEMAP_RETRY_DELAYS_MS = prevDelays;
  });

  it('502 lalu 200 sukses setelah retry', async () => {
    let calls = 0;
    globalThis.fetch = (async () => {
      calls += 1;
      if (calls === 1) {
        return new Response('bad gateway', { status: 502 });
      }
      return new Response(JSON.stringify({ success: true, data: [] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }) as typeof fetch;

    const body = await fetchSitemapJson<{ success: boolean }>(
      apiUrl('/words', '?limit=1'),
      { label: 'GET /words' },
    );
    assert.equal(body.success, true);
    assert.equal(calls, 2);
  });

  it('primary gagal terus, fallback 200', async () => {
    let primaryCalls = 0;
    globalThis.fetch = (async (input) => {
      const url = String(input);
      if (url.startsWith('https://primary.test')) {
        primaryCalls += 1;
        return new Response('', { status: 502 });
      }
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }) as typeof fetch;

    const body = await fetchSitemapJson<{ ok: boolean }>(apiUrl('/words'), {
      label: 'GET /words',
    });
    assert.equal(body.ok, true);
    assert.equal(primaryCalls, 4);
  });

  it('429 menghormati Retry-After', async () => {
    const t0 = Date.now();
    let calls = 0;
    globalThis.fetch = (async () => {
      calls += 1;
      if (calls === 1) {
        return new Response(
          JSON.stringify({
            success: false,
            error_code: 'RATE_LIMITED',
          }),
          {
            status: 429,
            headers: { 'Retry-After': '1' },
          },
        );
      }
      return new Response(JSON.stringify({ success: true }), { status: 200 });
    }) as typeof fetch;

    await fetchSitemapJson(apiUrl('/words'), { label: 'GET /words' });
    assert.ok(Date.now() - t0 >= 900);
    assert.equal(calls, 2);
  });

  it('semua host gagal melempar', async () => {
    globalThis.fetch = (async () => new Response('', { status: 502 })) as typeof fetch;

    await assert.rejects(
      () => fetchSitemapJson(apiUrl('/words'), { label: 'GET /words' }),
      /GET \/words gagal: HTTP 502/,
    );
  });
});