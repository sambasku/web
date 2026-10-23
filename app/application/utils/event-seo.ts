import type { Event } from '../../domain/events-parse.ts';
import { env } from '../../infrastructure/config/env.ts';
import {
  DEFAULT_LOCALE,
  type AppLocale,
  getLocaleConfig,
  isAppLocale,
  localePath,
} from '../i18n/locales.ts';

/**
 * SEO acara: copy judul/deskripsi + JSON-LD schema.org `Event`.
 *
 * Status pelaksanaan (upcoming/ongoing/completed/cancelled) DITURUNKAN
 * read-time oleh API - JSON-LD cuma memancarkan `startDate`/`endDate`
 * yang selalu valid, dan menandai `eventStatus` kalau dibatalkan.
 *
 * Modul ini PURE (tanpa i18next) supaya bisa diuji `node --test`.
 * Teks label masuk dari luar lewat `EventSeoLabels`; interpolasi `{{nama}}`
 * ditangani lokal supaya penerjemah tetap pegang kontrol atas kalimat.
 */

export interface EventSeoLabels {
  /** Nama k_crumb beranda, mis. "Kamus Sambas". */
  homeCrumb: string;
  /** Judul daftar acara, mis. "Acara Sambas". */
  listHeading: string;
  /** Template judul detail, mis. "{{name}} - Acara Sambas". */
  detailTitleTemplate: string;
  /** Template kalimat kategori, mis. "Acara {{category}} di Kabupaten Sambas." */
  descCategoryTemplate: string;
  /** Kalimat penutup deskripsi. */
  descSuffix: string;
  /** Fallback nama lokasi kalau acara tidak punya location_text. */
  locationFallback: string;
  /** Fallback deskripsi kalau acara tidak punya description. */
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
  const base = (lastSpace > 80 ? cut.slice(0, lastSpace) : cut).trimEnd();
  return `${base}…`;
}

/** Ganti `{{key}}` dengan nilainya. Key tak dikenal dibiarkan utuh. */
function interpolate(template: string, values: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key: string) =>
    key in values ? values[key] : match,
  );
}

/** Copy SEO untuk satu acara (judul + deskripsi). */
export function buildEventSeoCopy(
  event: Event,
  labels: EventSeoLabels,
): { title: string; description: string } {
  const title = interpolate(labels.detailTitleTemplate, { name: event.name });
  const parts = [
    event.category?.name
      ? interpolate(labels.descCategoryTemplate, { category: event.category.name })
      : null,
    event.locationText || labels.locationFallback,
    labels.descSuffix,
  ].filter(Boolean);
  return {
    title,
    description: truncateSeo(parts.join(' ')),
  };
}

/**
 * JSON-LD `Event` untuk detail acara.
 *
 * - `location` = Place (alamat + geo kalau koordinat ada).
 * - `organizer` = Organization kalau penyelenggara diisi.
 * - `image` = poster kalau ada.
 * - `eventStatus` = EventCancelled kalau dibatalkan.
 * - `sameAs` = link sumber resmi (URL BERSIH - UTM hanya untuk link yang
 *   diklik manusia, bukan data terstruktur).
 */
export function buildEventJsonLd(
  event: Event,
  labels: EventSeoLabels,
  localeInput?: string,
) {
  const locale = resolveLocale(localeInput);
  const url = `${env.appUrl}${localePath(locale, `/acara/${encodeURIComponent(event.slug)}`)}`;
  const listUrl = `${env.appUrl}${localePath(locale, '/acara')}`;
  const homeUrl = `${env.appUrl}${localePath(locale, '/')}`;

  const eventNode: Record<string, unknown> = {
    '@type': 'Event',
    '@id': `${url}#event`,
    name: event.name,
    description: event.description || labels.descFallback,
    url,
    inLanguage: locale,
    startDate: event.startsAt,
    endDate: event.endsAt,
    eventStatus:
      event.occurrenceStatus === 'cancelled'
        ? 'https://schema.org/EventCancelled'
        : 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    location: {
      '@type': 'Place',
      name: event.locationText || labels.locationFallback,
      address: {
        '@type': 'PostalAddress',
        addressLocality: 'Kabupaten Sambas',
        addressRegion: 'Kalimantan Barat',
        addressCountry: 'ID',
      },
      ...(event.lat !== null && event.lng !== null
        ? {
            geo: {
              '@type': 'GeoCoordinates',
              latitude: event.lat,
              longitude: event.lng,
            },
          }
        : {}),
    },
    ...(event.posterUrl ? { image: event.posterUrl } : {}),
    ...(event.organizer
      ? {
          organizer: {
            '@type': 'Organization',
            name: event.organizer,
          },
        }
      : {}),
    ...(event.sourceUrl ? { sameAs: [event.sourceUrl] } : {}),
  };

  const breadcrumb = {
    '@type': 'BreadcrumbList',
    '@id': `${url}#breadcrumb`,
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: labels.homeCrumb, item: homeUrl },
      { '@type': 'ListItem', position: 2, name: labels.listHeading, item: listUrl },
      { '@type': 'ListItem', position: 3, name: event.name, item: url },
    ],
  };

  return {
    '@context': 'https://schema.org',
    '@graph': [eventNode, breadcrumb],
  };
}

/** JSON-LD daftar `/acara`: CollectionPage + ItemList acara. */
export function buildEventListJsonLd(
  events: Event[],
  labels: EventSeoLabels,
  localeInput?: string,
) {
  const locale = resolveLocale(localeInput);
  const listUrl = `${env.appUrl}${localePath(locale, '/acara')}`;
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
          itemListElement: events.map((event, i) => ({
            '@type': 'ListItem',
            position: i + 1,
            name: event.name,
            url: `${env.appUrl}${localePath(locale, `/acara/${encodeURIComponent(event.slug)}`)}`,
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

/** Og locale untuk locale tertentu (dipakai router meta). */
export function eventOgLocale(locale: string): string {
  return getLocaleConfig(resolveLocale(locale)).ogLocale;
}
