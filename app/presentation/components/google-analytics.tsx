import { useEffect } from 'react';
import { useLocation } from 'react-router';
import { env } from '@/infrastructure/config/env';

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

const GA_SCRIPT_ID = 'ga4-gtag';

function isGaEnabled(): boolean {
  return env.isProd && env.gaMeasurementId.trim() !== '';
}

/**
 * GA4 gtag: load sekali, pageview tiap navigasi SPA.
 * No-op di non-prod atau jika VITE_GA_MEASUREMENT_ID kosong.
 */
export function GoogleAnalytics() {
  const location = useLocation();
  const measurementId = env.gaMeasurementId.trim();
  const enabled = isGaEnabled();

  useEffect(() => {
    if (!enabled) return;

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
      script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
      document.head.appendChild(script);
    }

    window.gtag('config', measurementId, {
      send_page_view: false,
    });
  }, [enabled, measurementId]);

  useEffect(() => {
    if (!enabled || typeof window.gtag !== 'function') return;

    const pagePath = `${location.pathname}${location.search}`;
    window.gtag('event', 'page_view', {
      page_path: pagePath,
      page_title: document.title,
      page_location: window.location.href,
    });
  }, [enabled, location.pathname, location.search]);

  return null;
}
