import type { Usaha } from '../../domain/usaha-parse.ts';
import { env } from '../../infrastructure/config/env.ts';
import {
  DEFAULT_LOCALE,
  type AppLocale,
  isAppLocale,
  localePath,
} from '../i18n/locales.ts';

/**
 * SEO usaha: copy judul/deskripsi + JSON-LD schema.org `LocalBusiness`.
 *
 * Modul ini PURE (tanpa i18next) supaya bisa diuji `node --test`. Teks label
 * masuk dari luar lewat `UsahaSeoLabels`; interpolasi `{{nama}}` ditangani
 * lokal supaya penerjemah tetap pegang kontrol atas kalimat.
 */

export interface UsahaSeoLabels {
  /** Nama crumb beranda, mis. "Kamus Sambas". */
  homeCrumb: string;
  /** Judul daftar usaha, mis. "Usaha Sambas". */
  listHeading: string;
  /** Template judul detail, mis. "{{name}} - Usaha Sambas". */
  detailTitleTemplate: string;
  /** Kalimat penutup deskripsi. */
  descSuffix: string;
  /** Fallback deskripsi kalau usaha tidak punya description. */
  descFallback: string;
}

function resolveLocale(locale?: string): AppLocale {
  return isAppLocale(locale) ? locale : DEFAULT_LOCALE;
}

const SEO_DESCRIPTION_MAX = 158;

function truncateSeo(text: string, max = SEO_DESCRIPTION_MAX): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(' ');
  return `${(lastSpace > 80 ? cut.slice(0, lastSpace) : cut).trim()}…`;
}

function interpolate(template: string, values: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => values[key] ?? '');
}

/** Judul + deskripsi SEO halaman detail usaha. */
export function buildUsahaSeoCopy(usaha: Usaha, labels: UsahaSeoLabels) {
  const title = interpolate(labels.detailTitleTemplate, { name: usaha.name });
  const parts = [
    usaha.description?.trim() || labels.descFallback,
    usaha.category?.name ? `${usaha.category.name}.` : '',
    labels.descSuffix,
  ].filter(Boolean);
  return { title, description: truncateSeo(parts.join(' ')) };
}

/**
 * JSON-LD detail usaha.
 * - `@type` = `LocalBusiness` (subtipe generik, cukup untuk direktori).
 * - `address` pakai addressLocality Kabupaten Sambas + petunjuk lokasi kalau ada.
 * - `telephone` / `sameAs` hanya dari data bersih (tanpa UTM).
 */
export function buildUsahaJsonLd(
  usaha: Usaha,
  labels: UsahaSeoLabels,
  localeInput?: string,
) {
  const locale = resolveLocale(localeInput);
  const url = `${env.appUrl}${localePath(locale, `/usaha/${encodeURIComponent(usaha.slug)}`)}`;
  const listUrl = `${env.appUrl}${localePath(locale, '/usaha')}`;
  const homeUrl = `${env.appUrl}${localePath(locale, '/')}`;

  const usahaNode: Record<string, unknown> = {
    '@type': 'LocalBusiness',
    '@id': `${url}#business`,
    name: usaha.name,
    description: usaha.description || labels.descFallback,
    url,
    inLanguage: locale,
    address: {
      '@type': 'PostalAddress',
      streetAddress: usaha.addressText ?? undefined,
      addressLocality: usaha.village?.name ?? 'Kabupaten Sambas',
      addressRegion: 'Kalimantan Barat',
      addressCountry: 'ID',
    },
    ...(usaha.lat !== null && usaha.lng !== null
      ? {
          geo: {
            '@type': 'GeoCoordinates',
            latitude: usaha.lat,
            longitude: usaha.lng,
          },
        }
      : {}),
    ...(usaha.phone ? { telephone: usaha.phone } : {}),
    ...(usaha.coverUrl ? { image: usaha.coverUrl } : {}),
    ...(usaha.socialUrl || usaha.website
      ? { sameAs: [usaha.website, usaha.socialUrl].filter(Boolean) }
      : {}),
  };

  const breadcrumb = {
    '@type': 'BreadcrumbList',
    '@id': `${url}#breadcrumb`,
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: labels.homeCrumb, item: homeUrl },
      { '@type': 'ListItem', position: 2, name: labels.listHeading, item: listUrl },
      { '@type': 'ListItem', position: 3, name: usaha.name, item: url },
    ],
  };

  return {
    '@context': 'https://schema.org',
    '@graph': [usahaNode, breadcrumb],
  };
}

/** JSON-LD daftar `/usaha`: CollectionPage + ItemList usaha. */
export function buildUsahaListJsonLd(
  usahas: Usaha[],
  labels: UsahaSeoLabels,
  localeInput?: string,
) {
  const locale = resolveLocale(localeInput);
  const listUrl = `${env.appUrl}${localePath(locale, '/usaha')}`;
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        '@id': `${listUrl}#collection`,
        name: labels.listHeading,
        url: listUrl,
        inLanguage: locale,
        isPartOf: { '@id': `${env.appUrl}${localePath(locale, '/')}#website` },
        mainEntity: {
          '@type': 'ItemList',
          itemListElement: usahas.map((usaha, i) => ({
            '@type': 'ListItem',
            position: i + 1,
            name: usaha.name,
            url: `${env.appUrl}${localePath(locale, `/usaha/${encodeURIComponent(usaha.slug)}`)}`,
          })),
        },
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${listUrl}#breadcrumb`,
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: labels.homeCrumb,
            item: `${env.appUrl}${localePath(locale, '/')}`,
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: labels.listHeading,
            item: listUrl,
          },
        ],
      },
    ],
  };
}
