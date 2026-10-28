import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  placeViewKey,
  recordPlaceViewOnce,
  type PlaceViewStorage,
} from './place-view-beacon.ts';

function fakeStorage(initial: Record<string, string> = {}): PlaceViewStorage & {
  data: Record<string, string>;
} {
  const data = { ...initial };
  return {
    data,
    getItem: (k: string) => data[k] ?? null,
    setItem: (k: string, v: string) => {
      data[k] = v;
    },
  };
}

test('placeViewKey per slug', () => {
  assert.equal(placeViewKey('pantai'), 'place-view:pantai');
});

test('view terkirim sekali per slug per sesi', () => {
  const sent: string[] = [];
  const storage = fakeStorage();

  assert.equal(recordPlaceViewOnce('pantai', (s) => sent.push(s), storage), true);
  assert.equal(recordPlaceViewOnce('pantai', (s) => sent.push(s), storage), false);

  assert.deepEqual(sent, ['pantai']);
});

test('slug berbeda dihitung terpisah', () => {
  const sent: string[] = [];
  const storage = fakeStorage();

  recordPlaceViewOnce('pantai', (s) => sent.push(s), storage);
  recordPlaceViewOnce('gunung', (s) => sent.push(s), storage);

  assert.deepEqual(sent, ['pantai', 'gunung']);
});

test('storage diblokir: view tetap terkirim', () => {
  const sent: string[] = [];
  const broken: PlaceViewStorage = {
    getItem: () => {
      throw new Error('blocked');
    },
    setItem: () => {
      throw new Error('blocked');
    },
  };

  assert.equal(recordPlaceViewOnce('pantai', (s) => sent.push(s), broken), true);
  assert.deepEqual(sent, ['pantai']);
});

test('tanpa storage (SSR) tidak ada view terkirim', () => {
  const sent: string[] = [];
  assert.equal(recordPlaceViewOnce('pantai', (s) => sent.push(s), null), true);
  assert.deepEqual(sent, ['pantai']);
});
