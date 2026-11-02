import { test } from 'node:test';
import assert from 'node:assert/strict';
import { groupRelations } from './lemma-relations.ts';

const rel = (relation_type: string, lemma: string) => ({
  word_id: lemma.padEnd(26, '0'),
  lemma,
  relation_type,
});

test('groupRelations: urutan PRD (nonstandard_of paling atas) + tipe tak dikenal dibuang', () => {
  const sections = groupRelations([
    rel('synonym', 'jape'),
    rel('nonstandard_of', 'taek palat'),
    rel('derived_from', 'ansoh'),
    rel('variant_of', 'jope'),
    rel('unknown_type', 'xxx'),
  ]);

  assert.deepEqual(
    sections.map((s) => s.type),
    ['nonstandard_of', 'variant_of', 'derived_from', 'synonym'],
  );
  assert.equal(sections[0].label, 'Bentuk tidak baku dari');
  assert.equal(sections[0].items[0].lemma, 'taek palat');
});

test('groupRelations: kosong saat tak ada relasi yang dikenal', () => {
  assert.deepEqual(groupRelations([]), []);
  assert.deepEqual(groupRelations([rel('weird', 'zzz')]), []);
});
