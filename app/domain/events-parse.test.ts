import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  eventOccurrenceLabel,
  eventSourceTypeLabel,
  mapEvent,
  type ApiEvent,
} from './events-parse.ts';

const ROW: ApiEvent = {
  id: 'ev_1',
  slug: 'pawai-blok-keywords',
  name: 'Pawai Blocks Keywords',
  description: 'Pawai tahunan warga Sambas.',
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

describe('mapEvent', () => {
  it('memetakan snake_case wire ke camelCase domain', () => {
    const event = mapEvent(ROW);
    assert.equal(event.id, 'ev_1');
    assert.equal(event.slug, 'pawai-blok-keywords');
    assert.equal(event.categoryId, 'budaya-tradisi');
    assert.equal(event.category?.name, 'Budaya & Tradisi');
    assert.equal(event.startsAt, '2026-11-01T02:00:00.000Z');
    assert.equal(event.occurrenceStatus, 'upcoming');
    assert.equal(event.locationText, 'Lapangan utama Sambas');
    assert.equal(event.sourceUrl, 'https://facebook.com/pawai/posts/1');
    assert.equal(event.sourceType, 'facebook');
    assert.equal(event.sourceAttribution, 'Panitia Pawai');
    assert.equal(event.organizer, 'Panitia Pawai');
    assert.deepEqual(event.places, []);
  });

  it('default occurrence_status upcoming saat field kosong', () => {
    const rest = { ...ROW };
    delete (rest as { occurrence_status?: string }).occurrence_status;
    assert.equal(mapEvent(rest as ApiEvent).occurrenceStatus, 'upcoming');
  });

  it('null jadi null, bukan undefined', () => {
    const event = mapEvent({
      ...ROW,
      lat: null,
      lng: null,
      poster_urls: [],
      organizer: null,
      source_url: null,
      source_type: null,
      source_attribution: null,
      category: null,
      village: null,
    });
    assert.equal(event.lat, null);
    assert.equal(event.lng, null);
    assert.deepEqual(event.posterUrls, []);
    assert.equal(event.organizer, null);
    assert.equal(event.sourceUrl, null);
    assert.equal(event.sourceType, null);
    assert.equal(event.sourceAttribution, null);
    assert.equal(event.category, null);
    assert.equal(event.village, null);
  });
});

describe('label helper', () => {
  it('label status pelaksanaan dalam Bahasa Indonesia', () => {
    assert.equal(eventOccurrenceLabel('upcoming'), 'Akan datang');
    assert.equal(eventOccurrenceLabel('ongoing'), 'Sedang berlangsung');
    assert.equal(eventOccurrenceLabel('completed'), 'Sudah selesai');
    assert.equal(eventOccurrenceLabel('cancelled'), 'Dibatalkan');
  });

  it('label platform sumber, null kalau tidak ada', () => {
    assert.equal(eventSourceTypeLabel('facebook'), 'Facebook');
    assert.equal(eventSourceTypeLabel('instagram'), 'Instagram');
    assert.equal(eventSourceTypeLabel('whatsapp'), 'WhatsApp');
    assert.equal(eventSourceTypeLabel(null), null);
  });
});
