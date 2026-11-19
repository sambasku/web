import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  wordViewKey,
  recordWordViewOnce,
  type WordViewStorage,
} from './word-view-beacon.ts';

function fakeStorage(initial: Record<string, string> = {}): WordViewStorage & {
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

test('wordViewKey per lemma', () => {
  assert.equal(wordViewKey('pantai'), 'word-view:pantai');
});

test('view terkirim sekali per lemma per sesi', () => {
  const sent: string[] = [];
  const storage = fakeStorage();

  assert.equal(recordWordViewOnce('makatn', (s) => sent.push(s), storage), true);
  assert.equal(recordWordViewOnce('makatn', (s) => sent.push(s), storage), false);

  assert.deepEqual(sent, ['makatn']);
});

test('lemma berbeda dihitung terpisah', () => {
  const sent: string[] = [];
  const storage = fakeStorage();

  recordWordViewOnce('makatn', (s) => sent.push(s), storage);
  recordWordViewOnce('antre', (s) => sent.push(s), storage);

  assert.deepEqual(sent, ['makatn', 'antre']);
});

test('storage diblokir: view tetap terkirim', () => {
  const sent: string[] = [];
  const broken: WordViewStorage = {
    getItem: () => {
      throw new Error('blocked');
    },
    setItem: () => {
      throw new Error('blocked');
    },
  };

  assert.equal(recordWordViewOnce('makatn', (s) => sent.push(s), broken), true);
  assert.deepEqual(sent, ['makatn']);
});

test('tanpa storage (SSR) tidak ada view terkirim', () => {
  const sent: string[] = [];
  assert.equal(recordWordViewOnce('makatn', (s) => sent.push(s), null), true);
  assert.deepEqual(sent, ['makatn']);
});