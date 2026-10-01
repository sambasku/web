import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { displayImageUrl, isProxiedImageHost } from './display-image-url.ts';

describe('displayImageUrl (pentest W-10/BH-02)', () => {
  it('menolak skema non-https', () => {
    assert.equal(
      displayImageUrl('http://cdn.jsdelivr.net/gh/sambasku/x.webp'),
      undefined,
    );
    assert.equal(displayImageUrl('javascript:alert(1)'), undefined);
    assert.equal(displayImageUrl('data:image/png;base64,xxxx'), undefined);
  });

  it('menolak URL yang tidak valid dan input kosong', () => {
    assert.equal(displayImageUrl('bukan url'), undefined);
    assert.equal(displayImageUrl(''), undefined);
    assert.equal(displayImageUrl(undefined), undefined);
  });

  it('https jsDelivr dibungkus wsrv.nl', () => {
    const wrapped = displayImageUrl(
      'https://cdn.jsdelivr.net/gh/sambasku/audios/a.webp',
      {
        width: 800,
      },
    );
    assert.match(wrapped ?? '', /^https:\/\/wsrv\.nl\//);
    const params = new URL(wrapped ?? '').searchParams;
    assert.equal(
      params.get('url'),
      'cdn.jsdelivr.net/gh/sambasku/audios/a.webp',
    );
    assert.equal(params.get('w'), '800');
    assert.equal(params.get('output'), 'webp');
  });

  it('https host lain dikembalikan apa adanya', () => {
    assert.equal(
      displayImageUrl('https://ik.imagekit.io/abc/x.webp'),
      'https://ik.imagekit.io/abc/x.webp',
    );
  });

  // BH-02: host CDN foto stock tidak ada di allowlist CSP img-src, sehingga
  // <img src={preview_url}> mentah diblokir CSP. Semua harus lewat wsrv.nl.
  it('host CDN foto stock dibungkus wsrv.nl', () => {
    const stock = [
      'https://live.staticflickr.com/65535/52000000000_0000000000_b.jpg',
      'https://cdn.pixabay.com/photo/2015/03/26/10/28/sunflowers-908227_1280.jpg',
      'https://api.openverse.org/v1/images/abc123/thumb/',
    ];
    for (const url of stock) {
      const wrapped = displayImageUrl(url, { width: 320, height: 110 });
      assert.match(
        wrapped ?? '',
        /^https:\/\/wsrv\.nl\//,
        `tidak diproksi: ${url}`,
      );
      assert.equal(
        new URL(wrapped ?? '').searchParams.get('url'),
        new URL(url).host + new URL(url).pathname,
      );
    }
  });

  // Unsplash API Guidelines: wajib hotlink, resize lewat param imgix.
  it('Unsplash di-hotlink (bukan wsrv.nl) dengan param resize', () => {
    const out = displayImageUrl(
      'https://images.unsplash.com/photo-1?ixid=abc&w=1080&fm=jpg',
      { width: 800 },
    );
    const u = new URL(out ?? '');
    assert.equal(u.host, 'images.unsplash.com');
    assert.equal(u.searchParams.get('ixid'), 'abc');
    assert.equal(u.searchParams.get('w'), '800');
    assert.equal(u.searchParams.get('fm'), 'webp');
  });

  it('suffix host dicocokkan pada batas label, bukan substring', () => {
    assert.equal(isProxiedImageHost('cdn.jsdelivr.net'), true);
    assert.equal(
      isProxiedImageHost('evilcdn.jsdelivr.net.attacker.test'),
      false,
    );
    assert.equal(isProxiedImageHost('pixabay.com.evil.test'), false);
    assert.equal(isProxiedImageHost('CDN.PIXABAY.COM'), true);
  });
});
