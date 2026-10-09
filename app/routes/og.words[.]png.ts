import type { Route } from './+types/og.words[.]png';
import { ImageResponse } from 'workers-og';
import { getWordByLemma } from '../application/use-cases/word.use-case';
import { env } from '../infrastructure/config/env';
import { LOGO_DATA_URL } from '../application/utils/og-card-logo';
import { MASCOT_DATA_URL, MASCOT_WIDTH, MASCOT_HEIGHT } from '../application/utils/og-card-mascot';
import { clampLemma, clampText, isValidLemma } from '../application/utils/og-card-text';

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

/** Fallback definisi bila makna belum ada terjemahan apa pun. */
const FALLBACK_DEFINITION = 'Makna dan penggunaan dalam bahasa Melayu Sambas.';

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function buildCardHtml(
  lemma: string,
  definition: string,
  logoUrl = LOGO_DATA_URL,
): string {
  // Catatan satori: setiap node ber-anak WAJIB display:flex eksplisit.
  // Footer jadi sibling content-area (bukan margin negatif) - satori/yoga
  // tidak menghitung negative margin seperti browser, kartu pertama
  // ter-render dengan celah putih 44px di bawah footer.
  // Maskot watermark: background-image di content-area (satu-satunya cara
  // yang pasti di belakang teks di satori; absolute img akan digambar di
  // atas konten sesuai urutan DOM).
  return `<div style="display:flex;flex-direction:column;width:1200px;height:630px;background:#ffffff;font-family:sans-serif;box-sizing:border-box;">
  <div style="display:flex;flex-direction:column;flex-grow:1;padding:56px 72px 32px 72px;box-sizing:border-box;background-image:url('${MASCOT_DATA_URL}');background-repeat:no-repeat;background-position:right bottom;background-size:${MASCOT_WIDTH}px ${MASCOT_HEIGHT}px;">
    <div style="display:flex;justify-content:space-between;align-items:flex-start;width:100%;">
      <div style="display:flex;flex-direction:column;gap:20px;max-width:890px;overflow:hidden;">
        <div style="display:flex;color:#101826;font-size:120px;font-weight:800;line-height:1;letter-spacing:-2px;overflow:hidden;">${escapeHtml(clampLemma(lemma))}</div>
        <div style="display:flex;color:#4b5563;font-size:40px;line-height:1.4;overflow:hidden;">${escapeHtml(clampText(definition))}</div>
      </div>
      <img src="${logoUrl}" style="width:96px;height:96px;border-radius:16px;border:1px solid #e5e7eb;flex-shrink:0;" />
    </div>
  </div>
  <div style="display:flex;align-items:center;width:1200px;height:88px;background:#101826;box-sizing:border-box;">
    <div style="display:flex;align-items:center;justify-content:space-between;width:100%;padding:0 72px;box-sizing:border-box;">
      <div style="display:flex;color:#ffffff;font-size:26px;font-weight:600;">Kamus Sambas</div>
      <div style="display:flex;color:#a5b4cf;font-size:24px;">sambasku</div>
    </div>
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
  const lemmaRaw = params.lemma ?? '';
  // Decode percent-encoded (router tidak mem-decode param). Bisa throw
  // URIError bila sequence rusak ('a%') → tangkap sebagai 404, bukan 500.
  let lemma: string;
  try {
    lemma = decodeURIComponent(lemmaRaw);
  } catch {
    throw new Response('Not Found', { status: 404 });
  }
  if (!isValidLemma(lemma)) {
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
