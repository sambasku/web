import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  buildEventJsonLd,
  buildEventListJsonLd,
  buildEventSeoCopy,
  type EventSeoLabels,
} from './event-seo.ts';
import { mapEvent, type ApiEvent } from '../../domain/events-parse.ts';

const LABELS: EventSeoLabels = {
  homeCrumb: 'Kamus Sambas',
  listHeading: 'Acara Sambas',
  detailTitleTemplate: '{{name}} - Acara Sambas',
  descCategoryTemplate: 'Acara {{category}} di Kabupaten Sambas.',
  descSuffix: 'Lihat jadwal dan detailnya.',
  locationFallback: 'lokasi di Kabupaten Sambas',
  descFallback: 'Detail acara di Kabupaten Sambas, Kalimantan Barat.',
};

const ROW: ApiEvent = {
  id: 'ev_1',
  slug: 'pawai-blok-keywords',
  name: 'Pawai Blocks Keywords',
  description: 'Pawai tahunan warga Sambas dengan pawai kostum.',
  category_id: 'budaya-tradisi',
  category: { id: 'budaya-tradisi', name: 'Budaya & Tradisi' },
  starts_at: '2026-11-01T02:00:00.000Z',
  ends_at: '2026-11-01T09:00:00.000Z',
  occurrence_status: 'upcoming',
  location_text: 'Lapangan utama Sambas',
  lat: 1.3617,
  lng: 109.313,
  maps_url: null,
  poster_urls: ['https://cdn.example.com/poster.jpg'],
  organizer: 'Panitia Pawai',
  source_url: 'https://facebook.com/pawai/posts/1',
  source_type: 'facebook',
  source_attribution: 'Panitia Pawai',
  region_id: null,
  village_id: null,
  village: null,
  places: [],
  status: 'published',
  cancelled_at: null,
  published_at: '2026-10-01T00:00:00.000Z',
  created_at: '2026-10-01T00:00:00.000Z',
  updated_at: null,
};

describe('buildEventSeoCopy', () => {
  it('judul berisi nama acara, deskripsi isi kategori + lokasi', () => {
    const { title, description } = buildEventSeoCopy(mapEvent(ROW), LABELS);
    assert.ok(title.includes('Pawai Blocks Keywords'));
    assert.ok(title.includes('Acara Sambas'));
    assert.ok(description.includes('Budaya & Tradisi'));
    assert.ok(description.includes('Lapangan utama Sambas'));
    assert.ok(description.length <= 158);
  });
});

describe('buildEventJsonLd', () => {
  it('memancarkan Event + startDate/endDate + geo', () => {
    const jsonLd = buildEventJsonLd(mapEvent(ROW), LABELS, 'id');
    const event = (jsonLd['@graph'] as Array<Record<string, unknown>>)[0];
    assert.equal(event['@type'], 'Event');
    assert.equal(event.startDate, '2026-11-01T02:00:00.000Z');
    assert.equal(event.endDate, '2026-11-01T09:00:00.000Z');
    assert.equal(event.eventStatus, 'https://schema.org/EventScheduled');
    assert.equal(event.image, 'https://cdn.example.com/poster.jpg');
    const location = event.location as Record<string, unknown>;
    assert.equal(location['@type'], 'Place');
    assert.equal((location.geo as Record<string, unknown>).latitude, 1.3617);
  });

  it('acara dibatalkan ditandai EventCancelled', () => {
    const jsonLd = buildEventJsonLd(
      mapEvent({ ...ROW, occurrence_status: 'cancelled', cancelled_at: ROW.starts_at }),
      LABELS,
      'id',
    );
    const event = (jsonLd['@graph'] as Array<Record<string, unknown>>)[0];
    assert.equal(event.eventStatus, 'https://schema.org/EventCancelled');
  });

  it('organizer dan sameAs ikut kalau ada', () => {
    const jsonLd = buildEventJsonLd(mapEvent(ROW), LABELS, 'id');
    const event = (jsonLd['@graph'] as Array<Record<string, unknown>>)[0];
    assert.deepEqual(event.organizer, {
      '@type': 'Organization',
      name: 'Panitia Pawai',
    });
    assert.deepEqual(event.sameAs, ['https://facebook.com/pawai/posts/1']);
  });

  it('tanpa koordinat, node location tidak punya geo', () => {
    const jsonLd = buildEventJsonLd(mapEvent({ ...ROW, lat: null, lng: null }), LABELS, 'id');
    const event = (jsonLd['@graph'] as Array<Record<string, unknown>>)[0];
    const location = event.location as Record<string, unknown>;
    assert.equal(location.geo, undefined);
  });
});

describe('buildEventListJsonLd', () => {
  it('CollectionPage + ItemList dengan urutan', () => {
    const jsonLd = buildEventListJsonLd([mapEvent(ROW)], LABELS, 'id');
    const graph = jsonLd['@graph'] as Array<Record<string, unknown>>;
    const collection = graph[0];
    assert.equal(collection['@type'], 'CollectionPage');
    const items = (collection.mainEntity as Record<string, unknown>).itemListElement as Array<
      Record<string, unknown>
    >;
    assert.equal(items.length, 1);
    assert.equal(items[0].position, 1);
    assert.equal(items[0].name, 'Pawai Blocks Keywords');
  });
});
