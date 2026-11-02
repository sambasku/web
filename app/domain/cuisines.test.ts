import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { parseApiCuisine, parseCdnCuisines, cuisineCover } from './cuisines-parse.ts';

const API_ITEM = {
  id: 'cu_1',
  slug: 'bubur-pedas-sambas',
  name: 'Bubur Pedas Sambas',
  description: 'Bubur khas Sambas.',
  origin_region: 'Sambas',
  ingredients: ['beras'],
  tags: ['pedas'],
  serving_suggestion: 'Hangat',
  images: [
    {
      url: 'https://upload.wikimedia.org/bubur.jpg',
      is_main: false,
      attribution: {
        name: 'Wikimedia',
        license: 'CC BY-SA 4.0',
        license_url: 'https://creativecommons.org/licenses/by-sa/4.0/',
      },
    },
    {
      url: 'https://upload.wikimedia.org/bubur-2.jpg',
      is_main: true,
      attribution: { name: 'Wikimedia', license: 'CC BY-SA 4.0' },
    },
  ],
  sources: [
    { name: 'Wikimedia', address: 'https://commons.wikimedia.org', license: 'CC BY-SA 4.0' },
  ],
};

describe('parseApiCuisine', () => {
  it('memetakan snake_case API ke bentuk Cuisine', () => {
    const c = parseApiCuisine(API_ITEM);
    assert.ok(c);
    assert.equal(c.region, 'Sambas');
    assert.equal(c.servingSuggestion, 'Hangat');
    assert.equal(c.images[1]?.isMain, true);
    assert.equal(c.images[0]?.attribution?.license_url, 'https://creativecommons.org/licenses/by-sa/4.0/');
    assert.equal(c.sources[0]?.licenseUrl, undefined);
    assert.equal(c.sources[0]?.license, 'CC BY-SA 4.0');
    assert.equal(cuisineCover(c)?.url, 'https://upload.wikimedia.org/bubur-2.jpg');
  });

  it('item tanpa field wajib di-skip', () => {
    assert.equal(parseApiCuisine({ id: 'x', slug: 'y', name: 'Z' }), null);
  });

  it('gambar non-https dibuang', () => {
    const c = parseApiCuisine({
      ...API_ITEM,
      images: [{ url: 'http://contoh.test/a.jpg', is_main: true }],
    });
    assert.deepEqual(c?.images, []);
  });
});

describe('parseCdnCuisines', () => {
  it('membaca camelCase CDN dan menormalkan satu gambar utama', () => {
    const items = parseCdnCuisines({
      cuisines: [
        {
          id: 'cu_2',
          slug: 'kue-kuih',
          name: 'Kue Kuih',
          description: 'Kue tradisional.',
          region: 'Sambas',
          images: [
            { url: 'https://contoh.test/a.jpg', isMain: false },
            { url: 'https://contoh.test/b.jpg', isMain: false },
          ],
          sources: [],
        },
      ],
    });
    assert.equal(items?.[0]?.images[0]?.isMain, true);
    assert.equal(items?.[0]?.images[1]?.isMain, false);
  });

  it('body rusak -> null', () => {
    assert.equal(parseCdnCuisines('boom'), null);
    assert.equal(parseCdnCuisines({}), null);
  });
});
