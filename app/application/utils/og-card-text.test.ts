import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { clampLemma, clampText } from './og-card-text.ts';

describe('clampLemma', () => {
  it('pass-through pendek', () => {
    assert.strictEqual(clampLemma('somet'), 'somet');
  });
  it('exact limit passthrough', () => {
    assert.strictEqual(clampLemma('s'.repeat(20)), 's'.repeat(20));
  });
  it('potong >20 char + ellipsis, total tepat 20', () => {
    assert.equal(clampLemma('abcdefghijklmnopqrstuv'), 'abcdefghijklmnopqrs…');
  });
  it('pass-through pendek verbatim', () => {
    assert.equal(clampLemma('somet '), 'somet ');
  });
  it('potong spasi akhir sebelum ellipsis', () => {
    assert.strictEqual(clampLemma('abcdefghijklmnopqrs tu'), 'abcdefghijklmnopqrs…');
  });
});

describe('clampText', () => {
  it('pass-through pendek', () => {
    assert.strictEqual(clampText('bulu yang tumbuh di atas'), 'bulu yang tumbuh di atas');
  });
  it('potong >120 char di whitespace terakhir', () => {
    const long =
      'bulu yang tumbuh di atas bibir atas biasanya hanya terdapat pada laki-laki misai yang sangat lebat dan panjang di seluruh wajah';
    const result = clampText(long);
    assert.ok(result.endsWith('…'));
    assert.ok(result.length <= 121);
  });
  it('cut tanpa spasi → potong char terakhir', () => {
    const result = clampText('a'.repeat(130));
    assert.ok(result.endsWith('…'));
    assert.strictEqual(result.length, 120);
  });
});