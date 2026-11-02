import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  buildUrlsetXml,
  priorityForLocale,
  xmlEscape,
} from './sitemap.ts';

const APP_URL = 'https://sambasku.com';

describe('xmlEscape', () => {
  it('me-escape lima karakter wajib XML', () => {
    assert.equal(xmlEscape('a&b<c>d"e\'f'), 'a&amp;b&lt;c&gt;d&quot;e&apos;f');
  });

  it('string biasa tidak berubah', () => {
    assert.equal(xmlEscape('/id/words/capal'), '/id/words/capal');
  });
});

describe('priorityForLocale', () => {
  it('locale default mempertahankan priority', () => {
    assert.equal(priorityForLocale('0.9', 'id'), '0.9');
    assert.equal(priorityForLocale('1.0', 'id'), '1.0');
  });

  it('locale id-SBS dibatasi agar tidak menyaingi /id', () => {
    assert.equal(priorityForLocale('1.0', 'id-SBS'), '0.4');
    assert.equal(priorityForLocale('0.9', 'id-SBS'), '0.4');
    assert.equal(priorityForLocale('0.35', 'id-SBS'), '0.2');
  });
});

describe('buildUrlsetXml', () => {
  it('setiap item menjadi URL per locale seoIndex dengan hreflang', () => {
    const xml = buildUrlsetXml(APP_URL, [
      { bare: '/words', priority: '0.9', changefreq: 'daily', lastmod: '2026-09-26' },
    ]);
    // 2 locale x 1 item = 2 <url>.
    assert.equal((xml.match(/<url>/g) ?? []).length, 2);
    assert.ok(xml.includes(`<loc>${APP_URL}/id/words</loc>`));
    assert.ok(xml.includes(`<loc>${APP_URL}/id-SBS/words</loc>`));
    // Tiap URL membawa alternates kedua locale + x-default.
    assert.equal((xml.match(/hreflang="id"/g) ?? []).length, 2);
    assert.equal((xml.match(/hreflang="id-SBS"/g) ?? []).length, 2);
    assert.equal((xml.match(/hreflang="x-default"/g) ?? []).length, 2);
    assert.ok(xml.includes(`href="${APP_URL}/id/words"`));
  });

  it('priority /id penuh, /id-SBS ter-cap di XML', () => {
    const xml = buildUrlsetXml(APP_URL, [
      { bare: '/eksplorasi', priority: '0.9', changefreq: 'weekly' },
    ]);
    const idBlock = xml.slice(
      xml.indexOf(`<loc>${APP_URL}/id/eksplorasi</loc>`),
      xml.indexOf(`<loc>${APP_URL}/id-SBS/eksplorasi</loc>`),
    );
    const sbsBlock = xml.slice(xml.indexOf(`<loc>${APP_URL}/id-SBS/eksplorasi</loc>`));
    assert.ok(idBlock.includes('<priority>0.9</priority>'));
    assert.ok(sbsBlock.includes('<priority>0.4</priority>'));
  });

  it('lemma dengan karakter khusus lolos escaping', () => {
    const xml = buildUrlsetXml(APP_URL, [
      { bare: '/words/a&b<c', priority: '0.35', changefreq: 'weekly', lastmod: '2026-09-26' },
    ]);
    assert.ok(!xml.includes('/words/a&b<c<'));
    assert.ok(xml.includes('&amp;b&lt;c'));
  });

  it('lastmod hanya ditulis bila ada tanggal', () => {
    const withDate = buildUrlsetXml(APP_URL, [
      { bare: '/words/capal', priority: '0.35', changefreq: 'weekly', lastmod: '2026-09-01' },
    ]);
    assert.ok(withDate.includes('<lastmod>2026-09-01</lastmod>'));

    const without = buildUrlsetXml(APP_URL, [
      { bare: '/faq', priority: '0.85', changefreq: 'monthly' },
    ]);
    assert.equal(without.includes('<lastmod>'), false);
  });
});
