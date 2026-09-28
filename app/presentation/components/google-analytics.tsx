import { useEffect } from 'react';
import { useLocation } from 'react-router';
import {
  ensureGtagLoaded,
  isGaEnabled,
  trackPageView,
} from '@/infrastructure/analytics/analytics';

/**
 * GA4 gtag: load sekali, pageview tiap navigasi SPA.
 * No-op di non-prod atau jika VITE_GA_MEASUREMENT_ID kosong.
 * Event interaksi lewat `trackEvent` di call site (bukan di sini).
 */
export function GoogleAnalytics() {
  const location = useLocation();
  const enabled = isGaEnabled();

  useEffect(() => {
    if (!enabled) return;
    ensureGtagLoaded();
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;

    const pagePath = `${location.pathname}${location.search}`;
    trackPageView({
      pagePath,
      pageTitle: document.title,
      pageLocation: window.location.href,
    });
  }, [enabled, location.pathname, location.search]);

  return null;
}
