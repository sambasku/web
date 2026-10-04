import type { Cuisine } from '@/domain/cuisines';
import { env } from '@/infrastructure/config/env';
import { getFixedT } from '@/application/i18n/i18n-instance';
import {
  DEFAULT_LOCALE,
  localePath,
  type AppLocale,
} from '@/application/i18n/locales';

/** Meta + JSON-LD halaman daftar kuliner `/{locale}/kuliner`. */
export function buildCuisineListSeo(localeInput?: string) {
  const locale = resolve(localeInput);
  const t = getFixedT(locale);
  const path = localePath(locale, '/kuliner');
  return {
    meta: { title: t('seo_kulinerTitle'), description: t('seo_kulinerDescription'), path, locale },
    path,
  };
}

function resolve(localeInput?: string): AppLocale {
  return localeInput && isLocale(localeInput) ? localeInput : DEFAULT_LOCALE;
}

function isLocale(v: string): v is AppLocale {
  return v === 'id' || v === 'id-SBS';
}

/**
 * ItemList + BreadcrumbList halaman daftar. Ringkas: hanya nama + URL
 * per item (deskripsi penuh milik halaman detail).
 */
export function buildCuisineListJsonLd(
  items: Cuisine[],
  localeInput?: string,
) {
  const locale = resolve(localeInput);
  const t = getFixedT(locale);
  const listUrl = `${env.appUrl}${localePath(locale, '/kuliner')}`;
  const homeUrl = `${env.appUrl}${localePath(locale, '/')}`;

  const collection = {
    '@type': 'CollectionPage',
    '@id': `${listUrl}#collection`,
    name: t('seo_kulinerTitle'),
    url: listUrl,
    isPartOf: { '@id': `${homeUrl}#website` },
    inLanguage: locale,
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: items.map((c, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: c.name,
        ...(c.description ? { description: c.description } : {}),
        url: `${env.appUrl}${localePath(locale, `/kuliner/${encodeURIComponent(c.slug)}`)}`,
      })),
    },
  };

  const breadcrumb = {
    '@type': 'BreadcrumbList',
    '@id': `${listUrl}#breadcrumb`,
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: t('word_homeCrumb'), item: homeUrl },
      { '@type': 'ListItem', position: 2, name: t('seo_kulinerTitle'), item: listUrl },
    ],
  };

  return {
    '@context': 'https://schema.org',
    '@graph': [collection, breadcrumb],
  };
}

/**
 * JSON-LD detail: Dish (skema.org untuk resep/makanan) + BreadcrumbList.
 * Dish menyertakan recipeIngredient + serving suggestion bila ada, dan
 * menautkan sumber (citation) untuk kredit CC.
 */
export function buildCuisineJsonLd(c: Cuisine, localeInput?: string) {
  const locale = resolve(localeInput);
  const t = getFixedT(locale);
  const url = `${env.appUrl}${localePath(locale, `/kuliner/${encodeURIComponent(c.slug)}`)}`;
  const listUrl = `${env.appUrl}${localePath(locale, '/kuliner')}`;
  const homeUrl = `${env.appUrl}${localePath(locale, '/')}`;
  const cover = c.images.find((i) => i.isMain) ?? c.images[0];

  const dish: Record<string, unknown> = {
    '@type': 'Dish',
    '@id': `${url}#dish`,
    name: c.name,
    description: c.description,
    url,
    inLanguage: locale,
    ...(c.ingredients.length
      ? { recipeIngredient: c.ingredients }
      : {}),
    ...(c.servingSuggestion ? { recipeInstructions: c.servingSuggestion } : {}),
    ...(cover ? { image: cover.url } : {}),
    ...(c.sources.length
      ? {
          citation: c.sources.map((s) => ({
            '@type': 'CreativeWork',
            name: s.name,
            url: s.address,
          })),
        }
      : {}),
  };

  const breadcrumb = {
    '@type': 'BreadcrumbList',
    '@id': `${url}#breadcrumb`,
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: t('word_homeCrumb'), item: homeUrl },
      { '@type': 'ListItem', position: 2, name: t('seo_kulinerTitle'), item: listUrl },
      { '@type': 'ListItem', position: 3, name: c.name, item: url },
    ],
  };

  return {
    '@context': 'https://schema.org',
    '@graph': [dish, breadcrumb],
  };
}
