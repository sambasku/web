import type { Place, PlaceType } from '@/domain/places';
import { placeTypeLabels } from '@/domain/places';
import { env } from '@/infrastructure/config/env';
import { getFixedT } from '@/application/i18n/i18n-instance';
import {
  DEFAULT_LOCALE,
  localePath,
  type AppLocale,
} from '@/application/i18n/locales';

function resolve(localeInput?: string): AppLocale {
  return localeInput && (localeInput === 'id' || localeInput === 'id-SBS')
    ? (localeInput as AppLocale)
    : DEFAULT_LOCALE;
}

/**
 * JSON-LD detail wisata: TouristAttraction (schema.org Place) +
 * BreadcrumbList. Geo + photo memperkuat rich result destinasi.
 */
export function buildPlaceJsonLd(p: Place, localeInput?: string) {
  const locale = resolve(localeInput);
  const t = getFixedT(locale);
  const url = `${env.appUrl}${localePath(locale, `/wisata/${encodeURIComponent(p.slug)}`)}`;
  const listUrl = `${env.appUrl}${localePath(locale, '/wisata')}`;
  const homeUrl = `${env.appUrl}${localePath(locale, '/')}`;
  const cover = p.images.find((i) => i.isMain) ?? p.images[0];

  const attraction: Record<string, unknown> = {
    '@type': 'TouristAttraction',
    '@id': `${url}#place`,
    name: p.name,
    description: p.shortDescription,
    url,
    inLanguage: locale,
    geo: {
      '@type': 'GeoCoordinates',
      latitude: p.lat,
      longitude: p.lng,
    },
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'ID',
      addressRegion: 'Kalimantan Barat',
      addressLocality: 'Sambas',
    },
    ...(cover ? { photo: cover.url, image: cover.url } : {}),
    ...(p.type
      ? {
          additionalProperty: [
            {
              '@type': 'PropertyValue',
              name: 'Kategori',
              value: placeTypeLabels[p.type as PlaceType],
            },
          ],
        }
      : {}),
    ...(p.hours
      ? {
          openingHoursSpecification: [
            {
              '@type': 'OpeningHoursSpecification',
              description: p.hours,
            },
          ],
        }
      : {}),
    ...(p.sources.length
      ? {
          citation: p.sources.map((s) => ({
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
      {
        '@type': 'ListItem',
        position: 1,
        name: t('word_homeCrumb'),
        item: homeUrl,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: t('seo_wisataTitle'),
        item: listUrl,
      },
      { '@type': 'ListItem', position: 3, name: p.name, item: url },
    ],
  };

  return {
    '@context': 'https://schema.org',
    '@graph': [attraction, breadcrumb],
  };
}

/** CollectionPage + ItemList + BreadcrumbList halaman daftar wisata. */
export function buildPlaceListJsonLd(
  items: Place[],
  localeInput?: string,
) {
  const locale = resolve(localeInput);
  const t = getFixedT(locale);
  const listUrl = `${env.appUrl}${localePath(locale, '/wisata')}`;
  const homeUrl = `${env.appUrl}${localePath(locale, '/')}`;

  const collection = {
    '@type': 'CollectionPage',
    '@id': `${listUrl}#collection`,
    name: t('seo_wisataTitle'),
    url: listUrl,
    isPartOf: { '@id': `${homeUrl}#website` },
    inLanguage: locale,
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: items.map((p, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: p.name,
        ...(p.shortDescription ? { description: p.shortDescription } : {}),
        url: `${env.appUrl}${localePath(locale, `/wisata/${encodeURIComponent(p.slug)}`)}`,
      })),
    },
  };

  const breadcrumb = {
    '@type': 'BreadcrumbList',
    '@id': `${listUrl}#breadcrumb`,
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: t('word_homeCrumb'),
        item: homeUrl,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: t('seo_wisataTitle'),
        item: listUrl,
      },
    ],
  };

  return {
    '@context': 'https://schema.org',
    '@graph': [collection, breadcrumb],
  };
}
