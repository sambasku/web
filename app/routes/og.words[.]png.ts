import type { Route } from './+types/og.words[.]png';
import { ImageResponse } from 'workers-og';
import { getWordByLemma } from '../application/use-cases/word.use-case';
import { env } from '../infrastructure/config/env';
import { LOGO_DATA_URL } from '../application/utils/og-card-logo';

/**
 * Kartu OG dinamis per kata: /og/words/{lemma} (Content-Type image/png).
 *
 * Gaya GitHub repo card (Variasi A, issue #79):
 * - Canvas putih bersih 1200x630.
 * - Lemma (120px, navy #101826) + definisi langsung tanpa label verbose.
 * - Logo favicon sambasku di pojok kanan-atas.
 * - Full-width navy footer bar (#101826) di bagian bawah.
 *
 * Edge cache menutup biaya render setelah hit pertama per deploy.
 */

/** Batas aman segmen lemma di URL (guard murah sebelum subrequest API). */
const LEMMA_PATH_RE = /^[A-Za-z0-9%._~-]{1,100}$/;

const FALLBACK_DEFINITION = 'Makna dan penggunaan dalam bahasa Melayu Sambas.';

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Potong deskripsi agar muat dua baris kartu (satori tak punya line-clamp). */
export function clampText(text: string, max = 140): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(' ');
  return `${(lastSpace > 60 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`;
}

export function buildCardHtml(
  lemma: string,
  definition: string,
  logoUrl = LOGO_DATA_URL,
): string {
  // Catatan satori: setiap node ber-anak WAJIB display:flex eksplisit.
  return `<div style="display:flex;flex-direction:column;justify-content:space-between;width:1200px;height:630px;background:#ffffff;padding:56px 72px 0 72px;font-family:sans-serif;box-sizing:border-box;">
  <div style="display:flex;justify-content:space-between;align-items:flex-start;width:100%;">
    <div style="display:flex;flex-direction:column;gap:20px;max-width:920px;">
      <div style="display:flex;color:#101826;font-size:120px;font-weight:800;line-height:1;letter-spacing:-2px;">${escapeHtml(lemma)}</div>
      <div style="display:flex;color:#4b5563;font-size:40px;line-height:1.4;">${escapeHtml(clampText(definition))}</div>
    </div>
    <img src="${logoUrl}" style="width:80px;height:80px;border-radius:16px;border:1px solid #e5e7eb;" />
  </div>
  <div style="display:flex;align-items:center;justify-content:space-between;width:1200px;height:88px;margin-left:-72px;margin-right:-72px;background:#101826;padding:0 72px;box-sizing:border-box;">
    <div style="display:flex;color:#ffffff;font-size:26px;font-weight:600;">Kamus Sambas</div>
    <div style="display:flex;color:#a5b4cf;font-size:24px;">sambasku.com</div>
  </div>
</div>`;
}

export async function loader({ params }: Route.LoaderArgs) {
  // Prod + staging boleh; dev lokal tetap 404 (API prod tak boleh
  // dihajar oleh server dev interaktif). Staging perlu hidup supaya
  // kartu OG bisa dipreview di sambasku-web-staging sebelum produksi.
  if (env.mode !== 'production' && env.mode !== 'staging') {
    throw new Response('Not Found', { status: 404 });
  }
  const lemma = params.lemma ?? '';
  if (!LEMMA_PATH_RE.test(lemma)) {
    throw new Response('Not Found', { status: 404 });
  }

  let word;
  try {
    word = await getWordByLemma(lemma);
  } catch {
    // Kata tak ditemukan: 404 (di-negative-cache oleh cache-policy).
    throw new Response('Not Found', { status: 404 });
  }

  const firstMeaning = word.meanings[0];
  const rawDefinition = firstMeaning?.definition?.trim() ?? '';
  // API memakai placeholder "-" untuk definisi yang belum diisi (lihat
  // is_have_definition); jangan pernah tampilkan strip itu di kartu OG.
  const hasDefinition =
    firstMeaning?.is_have_definition === true ||
    (rawDefinition !== '' && rawDefinition !== '-');
  const translation = firstMeaning?.translations?.[0]?.translation_text?.trim();
  const definition = hasDefinition
    ? rawDefinition
    : translation || FALLBACK_DEFINITION;

  // Buffer ke Uint8Array, jangan kembalikan stream-nya: pipeline worker
  // (clone + re-wrap body) memutus stream lazy buatan ImageResponse
  // sehingga body sampai kosong (terverifikasi lokal wrangler dev).
  let pngBuffer: ArrayBuffer;
  try {
    const png = new ImageResponse(buildCardHtml(word.lemma, definition), {
      width: 1200,
      height: 630,
    });
    pngBuffer = await png.arrayBuffer();
  } catch (err) {
    console.error('[og] gagal render kartu', err);
    throw new Response('Not Found', { status: 404 });
  }
  return new Response(pngBuffer, {
    status: 200,
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=86400',
    },
  });
}
