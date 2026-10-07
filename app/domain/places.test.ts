import assert from 'node:assert/strict';
import { test } from 'node:test';

import { fetchPlaceBySlug, fetchPlaces, placeLabel, placeTypeLabels } from './places.ts';

test('placeLabel: kuliner selalu Kuliner walau type terisi', () => {
  assert.equal(
    placeLabel({
      id: '01X', slug: 'bubur-pedas', name: 'Bubur Pedas', category: 'kuliner',
      type: 'sejarah', lat: 1.3, lng: 109.3, shortDescription: 'd',
      images: [], related: [], sources: [],
    }),
    'Kuliner',
  );
});

test('placeLabel: wisata pakai label type', () => {
  assert.equal(
    placeLabel({
      id: '01X', slug: 'istana', name: 'Istana', category: 'wisata',
      type: 'sejarah', lat: 1.3, lng: 109.3, shortDescription: 'd',
      images: [], related: [], sources: [],
    }),
    'Sejarah',
  );
});

test('placeLabel: wisata tanpa type fallback Wisata', () => {
  assert.equal(
    placeLabel({
      id: '01X', slug: 'pantai', name: 'Pantai', category: 'wisata',
      type: null, lat: 1.3, lng: 109.3, shortDescription: 'd',
      images: [], related: [], sources: [],
    }),
    'Wisata',
  );
});

test('placeTypeLabels lengkap lima type', () => {
  assert.deepEqual(Object.keys(placeTypeLabels).sort(), [
    'alam', 'belanja', 'budaya', 'pantai', 'sejarah',
  ]);
});

test('fetchPlaceBySlug: kontrak ter-ekspor untuk route wisata', () => {
  assert.equal(typeof fetchPlaceBySlug, 'function');
});

test('fetchPlaces: entri tanpa koordinat tetap lolos (lat/lng null)', async () => {
  const raw = {
    places: [
      {
        id: 'x', slug: 'pantai-camar-bulan', name: 'Pantai Camar Bulan',
        category: 'wisata', type: 'pantai', lat: null, lng: null,
        shortDescription: 'Pantai di Paloh.',
        images: [], related: [], sources: [],
      },
    ],
  };
  const realFetch = globalThis.fetch;
  globalThis.fetch = (async () =>
    new Response(JSON.stringify(raw), { status: 200 })) as typeof fetch;
  try {
    const places = await fetchPlaces();
    assert.equal(places?.length, 1);
    assert.equal(places?.[0].lat, null);
    assert.equal(places?.[0].lng, null);
  } finally {
    globalThis.fetch = realFetch;
  }
});
