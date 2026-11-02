import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { isOwnHost, withSambaskuUtm } from './external-link.ts';

describe('withSambaskuUtm (rule external-link-utm)', () => {
  it('menambah utm_source+utm_medium pada link eksternal', () => {
    assert.equal(
      withSambaskuUtm('https://instagram.com/p/abc123'),
      'https://instagram.com/p/abc123?utm_source=sambasku.com&utm_medium=referral',
    );
  });

  it('query dan hash yang sudah ada tetap utuh', () => {
    const out = withSambaskuUtm('https://example.com/a?x=1&y=2#frag');
    assert.equal(out, 'https://example.com/a?x=1&y=2&utm_source=sambasku.com&utm_medium=referral#frag');
  });

  it('tidak menimpa utm_source yang sudah ada (mis. Unsplash)', () => {
    const url = 'https://unsplash.com/@foto?utm_source=sambasku&utm_medium=referral';
    assert.equal(withSambaskuUtm(url), url);
  });

  it('link ke domain sendiri tidak diberi UTM', () => {
    assert.equal(withSambaskuUtm('https://sambasku.com/acara'), 'https://sambasku.com/acara');
    assert.equal(
      withSambaskuUtm('https://api.sambasku.com/api/v1/events'),
      'https://api.sambasku.com/api/v1/events',
    );
  });

  it('input non-https atau rusak dikembalikan apa adanya', () => {
    assert.equal(withSambaskuUtm('http://example.com/'), 'http://example.com/');
    assert.equal(withSambaskuUtm('bukan url'), 'bukan url');
    assert.equal(withSambaskuUtm(''), '');
  });
});

describe('isOwnHost', () => {
  it('menerima domain sendiri dan sub-domainnya', () => {
    assert.ok(isOwnHost('sambasku.com'));
    assert.ok(isOwnHost('www.sambasku.com'));
    assert.ok(isOwnHost('render.sambasku.com'));
  });

  it('menolak domain pihak ketiga', () => {
    assert.ok(!isOwnHost('instagram.com'));
    assert.ok(!isOwnHost('sambasku.com.evil.example'));
  });
});
