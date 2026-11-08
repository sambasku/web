import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  mapPlace,
  placeCategoryLabel,
  placeLabel,
  placeTypeLabels,
} from './places-parse.ts';

test('placeCategoryLabel: wisata/kuliner/budaya tanpa type', () => {
  assert.equal(placeCategoryLabel('wisata'), 'Wisata');
  assert.equal(placeCategoryLabel('kuliner'), 'Kuliner');
  assert.equal(placeCategoryLabel('budaya'), 'Budaya');
  assert.equal(placeCategoryLabel('lain'), 'Wisata');
});

test('placeLabel: kuliner selalu Kuliner walau type terisi', () => {
  assert.equal(
    placeLabel({
      id: '01X', slug: 'bubur-pedas', name: 'Bubur Pedas', category: 'kuliner',
      type: 'sejarah', lat: 1.3, lng: 109.3, shortDescription: 'd',
      images: [], imageCount: 0, mapsUrl: null, related: [], sources: [],
    }),
    'Kuliner',
  );
});

test('placeLabel: wisata pakai label type', () => {
  assert.equal(
    placeLabel({
      id: '01X', slug: 'istana', name: 'Istana', category: 'wisata',
      type: 'sejarah', lat: 1.3, lng: 109.3, shortDescription: 'd',
      images: [], imageCount: 0, mapsUrl: null, related: [], sources: [],
    }),
    'Sejarah',
  );
});

test('placeLabel: wisata tanpa type fallback Wisata', () => {
  assert.equal(
    placeLabel({
      id: '01X', slug: 'pantai', name: 'Pantai', category: 'wisata',
      type: null, lat: 1.3, lng: 109.3, shortDescription: 'd',
      images: [], imageCount: 0, mapsUrl: null, related: [], sources: [],
    }),
    'Wisata',
  );
});

test('placeTypeLabels lengkap tujuh kategori', () => {
  assert.deepEqual(Object.keys(placeTypeLabels).sort(), [
    'agro', 'alam', 'bahari', 'budaya', 'religi', 'sejarah', 'tirta',
  ]);
});

test('mapPlace: entri tanpa koordinat tetap lolos (lat/lng null)', () => {
  const place = mapPlace({
    id: 'x', slug: 'pantai-camar-bulan', name: 'Pantai Camar Bulan',
    category: 'wisata', type: 'bahari', lat: null, lng: null,
    short_description: 'Pantai di Paloh.',
    images: [], related: [], sources: [],
  });
  assert.equal(place.lat, null);
  assert.equal(place.lng, null);
});
