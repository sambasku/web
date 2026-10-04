import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { safeExternalUrl } from './safe-external-url.ts';

describe('safeExternalUrl (pentest HR-01, issue #59)', () => {
  it('menerima https apa adanya', () => {
    assert.equal(
      safeExternalUrl('https://example.com/artikel?a=1'),
      'https://example.com/artikel?a=1',
    );
    assert.equal(
      safeExternalUrl('HTTPS://EXAMPLE.COM/X'),
      'HTTPS://EXAMPLE.COM/X',
    );
  });

  it('menolak skema berbahaya dan eksotis', () => {
    assert.equal(
      safeExternalUrl('data:text/html,<script>alert(1)</script>'),
      undefined,
    );
    assert.equal(safeExternalUrl('javascript:alert(1)'), undefined);
    assert.equal(safeExternalUrl('vbscript:msgbox(1)'), undefined);
    assert.equal(safeExternalUrl('sambasku://app/users/x'), undefined);
    assert.equal(safeExternalUrl('ftp://files.example.com/a'), undefined);
    assert.equal(safeExternalUrl('http://example.com/'), undefined);
  });

  it('menolak input rusak dan kosong', () => {
    assert.equal(safeExternalUrl('bukan url'), undefined);
    assert.equal(safeExternalUrl(''), undefined);
    assert.equal(safeExternalUrl(null), undefined);
    assert.equal(safeExternalUrl(undefined), undefined);
  });
});
