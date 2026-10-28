import { getFixedT } from '../i18n/i18n-instance.ts';
import type { AppLocale } from '../i18n/locales.ts';
import type { UsahaSeoLabels } from './usaha-seo.ts';

/**
 * Label i18n untuk SEO usaha. Dipisah dari `usaha-seo.ts` supaya modul SEO
 * tetap pure dan bisa diuji tanpa instance i18next.
 */
export function usahaSeoLabels(locale: AppLocale): UsahaSeoLabels {
  const t = getFixedT(locale);
  return {
    homeCrumb: t('word_homeCrumb'),
    listHeading: t('usaha_heading'),
    detailTitleTemplate: t('usaha_seoDetailTitle'),
    descSuffix: t('usaha_seoDescSuffix'),
    descFallback: t('usaha_seoDescFallback'),
  };
}
