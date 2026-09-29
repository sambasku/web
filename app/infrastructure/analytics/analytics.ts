import { env } from '@/infrastructure/config/env';

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

/**
 * Nama event kanonik web - selaras docs/mobile/mobile-base-stack.md
 * Section 15 untuk event yang fiturnya ada di web. snake_case, tanpa PII.
 */
export const AnalyticsEvents = {
  pageView: 'page_view',
  searchSubmit: 'search_submit',
  wotdTap: 'wotd_tap',
  wordOpen: 'word_open',
  audioPlay: 'audio_play',
  contributeStart: 'contribute_start',
  contributeSubmit: 'contribute_submit',
  contributeSuccess: 'contribute_success',
  contributeFail: 'contribute_fail',
  /** Klik CTA "kirim banyak kata" di halaman /kontribusi. */
  contributeMassalCta: 'contribute_massal_cta',
  shareStart: 'share_start',
  shareComplete: 'share_complete',
  letterBrowse: 'letter_browse',
  themeChange: 'theme_change',
  localeChange: 'locale_change',
  discussionView: 'discussion_view',
} as const;

export type AnalyticsEventName =
  (typeof AnalyticsEvents)[keyof typeof AnalyticsEvents];

export type AnalyticsParams = Record<
  string,
  string | number | boolean | undefined
>;

const GA_SCRIPT_ID = 'ga4-gtag';

function measurementId(): string {
  return env.gaMeasurementId.trim();
}

/** Prod + Measurement ID. Non-prod selalu no-op (kecuali uji manual di prod). */
export function isGaEnabled(): boolean {
  return env.isProd && measurementId() !== '';
}

/** `?ga_debug=1` di prod mengaktifkan DebugView GA4. */
export function isGaDebugMode(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return new URLSearchParams(window.location.search).get('ga_debug') === '1';
  } catch {
    return false;
  }
}

function withDebug(params?: AnalyticsParams): AnalyticsParams | undefined {
  if (!isGaDebugMode()) return params;
  return { ...params, debug_mode: true };
}

/**
 * Pastikan stub dataLayer + gtag + script gtag.js ada (idempotent).
 * Dipanggil dari GoogleAnalytics mount dan sebelum event bila perlu.
 */
export function ensureGtagLoaded(): void {
  if (!isGaEnabled() || typeof window === 'undefined') return;

  const id = measurementId();
  window.dataLayer = window.dataLayer ?? [];
  if (typeof window.gtag !== 'function') {
    window.gtag = function gtag(...args: unknown[]) {
      window.dataLayer?.push(args);
    };
    window.gtag('js', new Date());
  }

  if (!document.getElementById(GA_SCRIPT_ID)) {
    const script = document.createElement('script');
    script.id = GA_SCRIPT_ID;
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`;
    document.head.appendChild(script);
  }

  window.gtag('config', id, {
    send_page_view: false,
    ...(isGaDebugMode() ? { debug_mode: true } : {}),
  });
}

export function trackPageView(opts: {
  pagePath: string;
  pageTitle?: string;
  pageLocation?: string;
}): void {
  if (!isGaEnabled() || typeof window === 'undefined') return;
  if (typeof window.gtag !== 'function') return;

  window.gtag(
    'event',
    AnalyticsEvents.pageView,
    withDebug({
      page_path: opts.pagePath,
      page_title: opts.pageTitle ?? document.title,
      page_location: opts.pageLocation ?? window.location.href,
    }),
  );
}

/**
 * Kirim event kustom. No-op di non-prod / tanpa Measurement ID.
 * Jangan kirim email, nomor HP, atau isi form mentah di params.
 */
export function trackEvent(
  name: AnalyticsEventName | string,
  params?: AnalyticsParams,
): void {
  if (!isGaEnabled() || typeof window === 'undefined') return;
  if (typeof window.gtag !== 'function') {
    ensureGtagLoaded();
  }
  if (typeof window.gtag !== 'function') return;

  const payload = withDebug(params);
  if (payload) {
    window.gtag('event', name, payload);
  } else {
    window.gtag('event', name);
  }
}
