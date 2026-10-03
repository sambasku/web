import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  API_PUBLIK_PRIMARY,
  API_PUBLIK_SECONDARY,
  buildApiPublikRequestUrl,
  splitApiPublikParams,
} from './api-publik-content.ts';

const search = API_PUBLIK_PRIMARY.find((e) => e.id === 'search');
const lemma = API_PUBLIK_PRIMARY.find((e) => e.id === 'lemma');

test('splitApiPublikParams: pisah path param dan query param', () => {
  const s = splitApiPublikParams(search);
  assert.deepEqual(s.pathParamNames, []);
  assert.ok(s.queryParamNames.includes('q'));
  const l = splitApiPublikParams(lemma);
  assert.deepEqual(l.pathParamNames, ['lemma']);
  assert.ok(!l.queryParamNames.includes('lemma'));
});

test('buildApiPublikRequestUrl: query param diisi', () => {
  const r = buildApiPublikRequestUrl(search, { q: 'cawan', limit: '5' });
  assert.equal(
    'url' in r && r.url,
    'https://api.sambasku.com/api/v1/words/search?q=cawan&limit=5',
  );
});

test('buildApiPublikRequestUrl: path param kosong balas error', () => {
  const r = buildApiPublikRequestUrl(lemma, {});
  assert.ok('error' in r);
  assert.match(r.error, /:lemma/);
});

test('buildApiPublikRequestUrl: path param di-encode (spasi, apostrof)', () => {
  const r = buildApiPublikRequestUrl(lemma, { lemma: 'Daan keladaan' });
  assert.equal(
    'url' in r && r.url,
    'https://api.sambasku.com/api/v1/words/lemma/Daan%20keladaan',
  );
});

test('buildApiPublikRequestUrl: query kosong tanpa tanda tanya', () => {
  const byId = API_PUBLIK_SECONDARY.find((e) => e.id === 'by-id');
  const r = buildApiPublikRequestUrl(byId, {
    id: '01JDWORDMAKATN000000000000',
  });
  assert.equal('url' in r && r.url.includes('?'), false);
});
