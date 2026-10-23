import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  buildSitemapItems,
  collectVerifiedWords,
  lastmodOf,
} from './sitemap-items.ts';

describe('lastmodOf', () => {
  it('mengambil tanggal dari ISO dan menolak bentuk lain', () => {
    assert.equal(lastmodOf('2026-10-05T06:52:03.000Z'), '2026-10-05');
    assert.equal(lastmodOf('bukan-tanggal'), undefined);
    assert.equal(lastmodOf(null), undefined);
  });
});

describe('buildSitemapItems', () => {
  it('menulis tiap slug wisata sekali, plus kuliner dan huruf', () => {
    const items = buildSitemapItems({
      words: [{ lemma: 'capal', updatedAt: '2026-10-05T00:00:00.000Z' }],
      wisataSlugs: ['pantai-temajuk', 'pantai-temajuk', 'alun-alun'],
      kulinerSlugs: ['bubur-pedas'],
    });
    const wisata = items.filter((item) => item.bare.startsWith('/wisata/'));
    assert.deepEqual(
      wisata.map((item) => item.bare),
      ['/wisata/pantai-temajuk', '/wisata/alun-alun'],
    );
    assert.equal(items.filter((item) => item.bare === '/wisata').length, 1);
    assert.ok(items.some((item) => item.bare === '/kuliner/bubur-pedas'));
    assert.ok(items.some((item) => item.bare === '/huruf/c'));
    assert.equal(items.find((item) => item.bare === '/words/capal')?.lastmod, '2026-10-05');
  });

  it('lemma ganda satu URL, lastmod yang lebih baru', () => {
    const items = buildSitemapItems({
      words: [
        { lemma: 'lajjang', updatedAt: '2026-01-01T00:00:00.000Z' },
        { lemma: 'lajjang', updatedAt: '2026-10-05T00:00:00.000Z' },
      ],
      wisataSlugs: [],
      kulinerSlugs: [],
    });
    const hits = items.filter((item) => item.bare === '/words/lajjang');
    assert.equal(hits.length, 1);
    assert.equal(hits[0]?.lastmod, '2026-10-05');
  });

  it('acara published masuk sitemap, slug dobel ditulis sekali', () => {
    const items = buildSitemapItems({
      words: [],
      wisataSlugs: [],
      kulinerSlugs: [],
      acaraSlugs: ['pawai-blok-keywords', 'pawai-blok-keywords'],
    });
    assert.equal(items.filter((item) => item.bare === '/acara').length, 1);
    const acara = items.filter((item) => item.bare.startsWith('/acara/'));
    assert.deepEqual(
      acara.map((item) => item.bare),
      ['/acara/pawai-blok-keywords'],
    );
  });
});

describe('collectVerifiedWords', () => {
  it('menggabungkan halaman sampai cursor habis', async () => {
    let calls = 0;
    const words = await collectVerifiedWords(async () => {
      calls += 1;
      if (calls === 1) {
        return {
          data: [{ lemma: 'Ade', updated_at: '2026-10-05T06:52:03.000Z' }],
          hasMore: true,
          nextCursor: 'c',
        };
      }
      return { data: [{ lemma: 'Ba' }], hasMore: false, nextCursor: null };
    }, 40);
    assert.equal(calls, 2);
    assert.equal(words[0]?.updatedAt, '2026-10-05T06:52:03.000Z');
    assert.deepEqual(
      words.map((word) => word.lemma),
      ['Ade', 'Ba'],
    );
  });

  it('melempar bila masih ada halaman setelah batas, tanpa daftar parsial', async () => {
    await assert.rejects(
      () =>
        collectVerifiedWords(
          async () => ({
            data: [{ lemma: 'a' }],
            hasMore: true,
            nextCursor: 'n',
          }),
          1,
        ),
      /terpotong/,
    );
  });
});
