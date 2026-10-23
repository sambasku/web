import { getFixedT } from '../i18n/i18n-instance.ts';
import type { AppLocale } from '../i18n/locales.ts';
import type { EventSeoLabels } from './event-seo.ts';

/**
 * Label i18n untuk SEO acara. Dipisah dari `event-seo.ts` supaya modul
 * SEO tetap pure dan bisa diuji tanpa instance i18next.
 */
export function eventSeoLabels(locale: AppLocale): EventSeoLabels {
  const t = getFixedT(locale);
  return {
    homeCrumb: t('word_homeCrumb'),
    listHeading: t('event_heading'),
    detailTitleTemplate: t('event_seoDetailTitle'),
    descCategoryTemplate: t('event_seoDescCategory'),
    descSuffix: t('event_seoDescSuffix'),
    locationFallback: t('event_seoDescLocationFallback'),
    descFallback: t('event_seoDescFallback'),
  };
}
