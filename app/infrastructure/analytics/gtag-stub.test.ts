import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createGtag } from './gtag-stub.ts';

describe('createGtag', () => {
  it('mendorong objek arguments, bukan array (syarat gtag.js)', () => {
    const dataLayer: unknown[] = [];
    const gtag = createGtag(dataLayer);

    gtag('config', 'G-TEST', { send_page_view: false });

    assert.equal(Object.prototype.toString.call(dataLayer[0]), '[object Arguments]');
    assert.deepEqual(Array.from(dataLayer[0] as ArrayLike<unknown>), [
      'config',
      'G-TEST',
      { send_page_view: false },
    ]);
  });
});
