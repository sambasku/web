import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { clampLemma, clampText, isValidLemma } from './og-card-text.ts';

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
describe('isValidLemma', () => {
  it('menerima lemma berspasi (router sudah decode %20)', () => {
    assert.ok(isValidLemma('Agek buat ape'));
  });
  it('menerima apostrof lurus dan curl', () => {
    assert.ok(isValidLemma("Ae'k maddas"));
    assert.ok(isValidLemma('Ade’ / de’'));
  });
  it('menerima unicode + hyphen + titik', () => {
    assert.ok(isValidLemma('Ba-baki'));
    assert.ok(isValidLemma('Ngéran'));
  });
  it('menolak kosong dan >100 char', () => {
    assert.ok(!isValidLemma(''));
    assert.ok(!isValidLemma('a'.repeat(101)));
  });
  it('menolak injeksi markup/skema', () => {
    assert.ok(!isValidLemma('<script>'));
    assert.ok(!isValidLemma('../etc/passwd'));
    assert.ok(!isValidLemma('a\nb'));
  });
});

describe('isValidLemma / decode', () => {
  it('menerima lemma %20 ter-encode', () => {
    assert.ok(isValidLemma(decodeURIComponent('Agek%20buat%20ape')));
  });
  it('tolak %2e%2e traversal ter-encode', () => {
    assert.ok(!isValidLemma(decodeURIComponent('%2e%2e/passwd')));
  });
  it('tolak double-encode', () => {
    assert.ok(!isValidLemma(decodeURIComponent('Agek%2520buat%2520ape')));
  });
  it('tolak percent-overflow (invalid seq) -> decodeURI throw', () => {
    assert.throws(() => decodeURIComponent("a%"));
  });
});
