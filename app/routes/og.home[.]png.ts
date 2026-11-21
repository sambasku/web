import type { Route } from './+types/og.home[.]png';
import { ImageResponse } from 'workers-og';
import { env } from '../infrastructure/config/env';
import { LOGO_DATA_URL } from '../application/utils/og-card-logo';
import {
  OG_CARD_HEIGHT,
  OG_CARD_WIDTH,
} from '../application/utils/og-image-meta';
import { clampText } from '../application/utils/og-card-text';

/**
 * Kartu OG beranda: /og/home (Content-Type image/png), 1200x630.
 * Brand share (WA/FB/X) - Google Search klasik tidak menampilkan kartu ini.
 */

const HOME_TITLE = 'Kamus Sambas';
const HOME_SUBTITLE =
  'Cari arti kata Melayu Sambas, terjemahan Indonesia, contoh kalimat, dan lafal.';

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function buildHomeCardHtml(logoUrl = LOGO_DATA_URL): string {
  // Satori: setiap node ber-anak WAJIB display:flex eksplisit.
  return `<div style="display:flex;flex-direction:column;width:1200px;height:630px;background:#ffffff;font-family:sans-serif;box-sizing:border-box;">
  <div style="display:flex;flex-direction:column;flex-grow:1;padding:56px 72px 32px 72px;box-sizing:border-box;">
    <div style="display:flex;justify-content:space-between;align-items:flex-start;width:100%;">
      <div style="display:flex;flex-direction:column;gap:24px;max-width:890px;overflow:hidden;">
        <div style="display:flex;color:#101826;font-size:96px;font-weight:800;line-height:1.05;letter-spacing:-2px;overflow:hidden;">${escapeHtml(HOME_TITLE)}</div>
        <div style="display:flex;color:#4b5563;font-size:36px;line-height:1.4;overflow:hidden;">${escapeHtml(clampText(HOME_SUBTITLE, 140))}</div>
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

export async function loader(_args: Route.LoaderArgs) {
  if (env.mode !== 'production' && env.mode !== 'staging') {
    throw new Response('Not Found', { status: 404 });
  }

  let pngBuffer: ArrayBuffer;
  try {
    const png = new ImageResponse(buildHomeCardHtml(), {
      width: OG_CARD_WIDTH,
      height: OG_CARD_HEIGHT,
    });
    pngBuffer = await png.arrayBuffer();
  } catch (err) {
    console.error('[og] gagal render kartu beranda', err);
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
