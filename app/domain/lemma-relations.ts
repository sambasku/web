import type { RelatedWord } from './entities/word.entity.ts';

/**
 * PRD relasi-lemma: label manusia untuk `relation_type`. Kode wire tidak
 * pernah tampil ke pembaca; tipe tak dikenal disembunyikan dari UI.
 */
export const RELATION_LABELS: Record<string, string> = {
  nonstandard_of: 'Bentuk tidak baku dari',
  variant_of: 'Variasi dari',
  derived_from: 'Diturunkan dari',
  synonym: 'Sinonim',
  antonym: 'Antonim',
  has_component: 'Komponen',
  see_also: 'Lihat juga',
};

/** Urutan section relasi: PRD 8.1, 8.2, lalu relasi lama. */
export const RELATION_ORDER = [
  'nonstandard_of',
  'variant_of',
  'derived_from',
  'synonym',
  'antonym',
  'has_component',
  'see_also',
];

export interface RelationSection {
  type: string;
  label: string;
  items: RelatedWord[];
}

/** Kelompokkan relasi per tipe, urut sesuai [RELATION_ORDER]. */
export function groupRelations(relations: RelatedWord[]): RelationSection[] {
  const buckets = new Map<string, RelatedWord[]>();
  for (const rel of relations) {
    if (!RELATION_LABELS[rel.relation_type]) continue;
    const bucket = buckets.get(rel.relation_type) ?? [];
    bucket.push(rel);
    buckets.set(rel.relation_type, bucket);
  }
  return RELATION_ORDER.filter((type) => buckets.has(type)).map((type) => ({
    type,
    label: RELATION_LABELS[type],
    items: buckets.get(type)!,
  }));
}
