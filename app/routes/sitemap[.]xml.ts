import { buildUrlsetXml } from '../application/utils/sitemap';
import {
  buildSitemapItems,
  collectVerifiedWords,
} from '../application/utils/sitemap-items';
import { listWordsAtoZ } from '../application/use-cases/word.use-case';
import { fetchCuisines } from '../domain/cuisines';
import { fetchEvents } from '../domain/events';
import { fetchPlaces } from '../domain/places';
import { env } from '../infrastructure/config/env';

/**
 * Cadangan bila objek R2 belum ada. Anggaran subrequest Worker (paket
 * gratis 50 per request). 40 halaman menyisakan ruang di bawah batas itu.
 * Masih ada halaman setelah batas: 503, jangan terbitkan urlset terpotong.
 * CDN tempat/kuliner gagal = lewati slug-nya, jangan gugurkan seluruh sitemap.
 */
const PAGE_SIZE = 100;
const MAX_PAGES = 40;

export async function loader() {
  if (!env.isProd) {
    throw new Response('Not Found', { status: 404 });
  }

  try {
    const words = await collectVerifiedWords(async (cursor) => {
      const res = await listWordsAtoZ({
        isVerified: true,
        limit: PAGE_SIZE,
        cursor,
      });
      return {
        data: res.data,
        hasMore: Boolean(res.meta?.has_more),
        nextCursor: res.meta?.next_cursor ?? null,
      };
    }, MAX_PAGES);
    const [cuisines, places, events] = await Promise.all([
      fetchCuisines(),
      fetchPlaces(),
      fetchEvents(),
    ]);
    const items = buildSitemapItems({
      words,
      wisataSlugs: places?.map((place) => place.slug) ?? [],
      kulinerSlugs: cuisines?.map((cuisine) => cuisine.slug) ?? [],
      acaraSlugs: events?.map((event) => event.slug) ?? [],
    });
    return new Response(buildUrlsetXml(env.appUrl, items), {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600, s-maxage=86400',
      },
    });
  } catch (err) {
    console.error('[sitemap] gagal mengambil daftar kata', err);
    return new Response('Service Unavailable', {
      status: 503,
      headers: { 'Cache-Control': 'no-store', 'Retry-After': '600' },
    });
  }
}
