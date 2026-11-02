import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  mapUsaha,
  usahaKindLabel,
  usahaLocationLine,
  usahaOperationalLabel,
  type ApiUsaha,
} from './usaha-parse.ts';

const ROW: ApiUsaha = {
  id: 'us_1',
  slug: 'warung-kopi-pemangkat',
  name: 'Warung Kopi Pemangkat',
  description: 'Kopi robusta dan gorengan pagi.',
  category_id: 'kuliner',
  category: { id: 'kuliner', name: 'Kuliner' },
  kind: 'both',
  region_id: 'pemangkat',
  village_id: 'pemangkat-kota',
  village: { id: 'pemangkat-kota', name: 'Pemangkat Kota', slug: null },
  address_text: 'Jl. Raya Pemangkat no. 1',
  lat: 1.1725,
  lng: 108.9812,
  maps_url: null,
  phone: '081234567890',
  whatsapp: '081234567890',
  website: null,
  social_url: null,
  cover_url: 'https://cdn.example.com/kopi.jpg',
  operational_status: 'open',
  items: [
    {
      id: 'it_1',
      name: 'Kopi susu',
      description: null,
      price_text: 'Rp 15.000',
      image_url: null,
      sort_order: 1,
    },
  ],
  created_at: '2026-10-01T00:00:00.000Z',
  updated_at: null,
};

describe('mapUsaha', () => {
  it('memetakan field wire ke domain camelCase', () => {
    const usaha = mapUsaha(ROW);
    assert.equal(usaha.category?.name, 'Kuliner');
    assert.equal(usaha.kind, 'both');
    assert.equal(usaha.operationalStatus, 'open');
    assert.equal(usaha.items.length, 1);
    assert.equal(usaha.items[0].priceText, 'Rp 15.000');
    assert.equal(usaha.village?.name, 'Pemangkat Kota');
  });

  it('nilai kosong jadi null, bukan string kosong', () => {
    const usaha = mapUsaha({ ...ROW, description: '   ', phone: '' });
    assert.equal(usaha.description, null);
    assert.equal(usaha.phone, null);
  });

  it('kind / operational_status rusak jatuh ke nilai aman', () => {
    const usaha = mapUsaha({ ...ROW, kind: 'aneh', operational_status: 'x' });
    assert.equal(usaha.kind, 'product');
    assert.equal(usaha.operationalStatus, 'unknown');
  });

  it('items absen jadi array kosong', () => {
    const usaha = mapUsaha({ ...ROW, items: undefined });
    assert.deepEqual(usaha.items, []);
  });
});

describe('label', () => {
  it('operational unknown tidak punya label tampil', () => {
    assert.equal(usahaOperationalLabel('unknown'), '');
    assert.equal(usahaOperationalLabel('permanently_closed'), 'Tutup permanen');
  });

  it('kind berlabel Indonesia', () => {
    assert.equal(usahaKindLabel('service'), 'Jasa');
  });

  it('location line utamakan alamat, lalu desa', () => {
    assert.equal(usahaLocationLine(mapUsaha(ROW)), 'Jl. Raya Pemangkat no. 1');
    const tanpaAlamat = mapUsaha({ ...ROW, address_text: null });
    assert.equal(usahaLocationLine(tanpaAlamat), 'Pemangkat Kota');
  });
});
