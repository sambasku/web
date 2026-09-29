import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { WordDetail, WordMeaning } from '../../../domain/entities/word.entity.ts';
import {
  buildShareCaption,
  buildShareCopyText,
  buildShareQuery,
  pickPadanan,
  senseLinesForCard,
  spellingVariantsLine,
  wordSharePublicUrl,
  type ShareCardData,
} from './share-card-data.ts';

function meaning(partial: Partial<WordMeaning> & Pick<WordMeaning, 'id'>): WordMeaning {
  return {
    word_class: null,
    definition: '',
    is_have_definition: true,
    is_have_translation: true,
    order_index: 0,
    translations: [],
    examples: [],
    ...partial,
  };
}

function detail(partial: Partial<WordDetail> & Pick<WordDetail, 'id' | 'lemma'>): WordDetail {
  return {
    language_id: 'x',
    notes: null,
    word_type: 'word',
    usage_labels: [],
    status: 'published',
    is_verified: true,
    is_corrected: false,
    meanings: [],
    categories: [],
    pronunciations: [],
    audios: [],
    images: [],
    related_words: [],
    variants: [],
    ...partial,
  };
}

describe('wordSharePublicUrl', () => {
  it('membangun URL kanonis ber-locale', () => {
    assert.equal(
      wordSharePublicUrl('makatn', 'id', 'https://sambasku.com'),
      'https://sambasku.com/id/words/makatn',
    );
    assert.equal(
      wordSharePublicUrl('a b', 'id-SBS', 'https://sambasku.com/'),
      'https://sambasku.com/id-SBS/words/a%20b',
    );
  });
});

describe('buildShareCaption', () => {
  it('caption dasar + URL + hashtag', () => {
    const data: ShareCardData = {
      lemma: 'makatn',
      padanan: 'makan',
      senses: [],
      isVerified: true,
      publicUrl: 'https://sambasku.com/id/words/makatn',
    };
    assert.equal(
      buildShareCaption(data),
      '"makatn" - makan · kamus bahasa Sambas #SambasKu\nhttps://sambasku.com/id/words/makatn',
    );
  });

  it('menyertakan variants dan disclaimer unverified', () => {
    const data: ShareCardData = {
      lemma: 'makatn',
      padanan: 'makan',
      variantsLine: 'makatan',
      senses: [],
      isVerified: false,
      publicUrl: 'https://sambasku.com/id/words/makatn',
    };
    const caption = buildShareCaption(data);
    assert.ok(caption.includes('(makatan)'));
    assert.ok(caption.includes('Arti belum diperiksa'));
  });
});

describe('buildShareCopyText', () => {
  it('menyusun teks salin multi-makna', () => {
    const data: ShareCardData = {
      lemma: 'somet',
      senses: [
        { wordClassCode: 'n', padanan: 'gelas', definition: 'wadah minum' },
        { wordClassCode: 'v', padanan: 'minum', definition: 'aksi minum' },
      ],
      isVerified: true,
      publicUrl: 'https://sambasku.com/id/words/somet',
    };
    const text = buildShareCopyText(data);
    assert.ok(text.startsWith('somet'));
    assert.ok(text.includes('1 [n] → gelas'));
    assert.ok(text.includes('wadah minum'));
    assert.ok(text.includes('#SambasKu'));
  });
});

describe('pickPadanan / buildShareQuery', () => {
  it('mengutamakan terjemahan direct', () => {
    const m = meaning({
      id: '1',
      translations: [
        {
          language_id: 'id',
          translation_text: 'sekunder',
          translation_type: 'gloss',
        },
        {
          language_id: 'id',
          translation_text: 'makan',
          translation_type: 'direct',
        },
      ],
    });
    assert.equal(pickPadanan(m), 'makan');
  });

  it('query = padanan + kategori', () => {
    const m = meaning({
      id: '1',
      translations: [
        {
          language_id: 'id',
          translation_text: 'makan',
          translation_type: 'direct',
        },
      ],
    });
    const d = detail({
      id: 'w1',
      lemma: 'makatn',
      meanings: [m],
      categories: [{ id: 'c1', name: 'makanan' }],
    });
    assert.equal(buildShareQuery(d, m), 'makan makanan');
  });

  it('fallback indonesia culture', () => {
    const m = meaning({ id: '1' });
    const d = detail({ id: 'w1', lemma: 'x', meanings: [m] });
    assert.equal(buildShareQuery(d, m), 'indonesia culture');
  });
});

describe('senseLinesForCard / spellingVariantsLine', () => {
  it('membatasi 3 makna saat semua', () => {
    const meanings = [0, 1, 2, 3].map((i) =>
      meaning({
        id: `m${i}`,
        order_index: i,
        definition: `def${i}`,
        translations: [
          {
            language_id: 'id',
            translation_text: `p${i}`,
            translation_type: 'direct',
          },
        ],
      }),
    );
    const lines = senseLinesForCard(meanings, {
      allMeanings: true,
      selected: meanings[0]!,
    });
    assert.equal(lines.length, 3);
    assert.equal(lines[0]!.padanan, 'p0');
  });

  it('variants skip lemma duplikat', () => {
    const d = detail({
      id: 'w1',
      lemma: 'Makatn',
      variants: [
        { id: 'v1', form: 'makatn', variant_type: 'spelling' },
        { id: 'v2', form: 'makatan', variant_type: 'spelling' },
      ],
    });
    assert.equal(spellingVariantsLine(d), 'makatan');
  });
});
