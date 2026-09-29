import {
  localePath,
  type AppLocale,
} from '../../../application/i18n/locales.ts';
import type {
  WordDetail,
  WordMeaning,
} from '../../../domain/entities/word.entity.ts';
import {
  senseHasBody,
  senseWordClassBracket,
  shareProviderLabel,
  type ShareEditorSettings,
  type ShareSenseLine,
} from './share-models.ts';

export interface ShareCardData {
  lemma: string;
  wordClassName?: string | null;
  wordClassCode?: string | null;
  definition?: string | null;
  padanan?: string | null;
  senses: ShareSenseLine[];
  exampleSentence?: string | null;
  photographer?: string | null;
  provider?: string | null;
  variantsLine?: string | null;
  isVerified: boolean;
  /** URL kanonis untuk caption (/{locale}/words/{lemma}). */
  publicUrl: string;
}

export function shareTrustLabel(isVerified: boolean): string {
  return isVerified ? 'Terverifikasi' : 'Menunggu pengecekan';
}

export function shareCreditLine(data: {
  photographer?: string | null;
  provider?: string | null;
}): string | null {
  const name = data.photographer?.trim();
  if (!name) return null;
  const id = data.provider?.trim() ?? '';
  if (!id) return `Foto: ${name}`;
  return `Foto: ${name} / ${shareProviderLabel(id)}`;
}

/** URL publik ber-locale untuk caption + Web Share. */
export function wordSharePublicUrl(
  lemma: string,
  locale: AppLocale,
  appUrl: string,
): string {
  const base = appUrl.replace(/\/+$/, '');
  const path = localePath(locale, `/words/${encodeURIComponent(lemma)}`);
  return `${base}${path}`;
}

export function buildShareCaption(data: ShareCardData): string {
  const pad =
    data.padanan != null && data.padanan.trim() !== ''
      ? data.padanan.trim()
      : data.lemma;
  const variants = data.variantsLine?.trim();
  const base =
    variants && variants.length > 0
      ? `"${data.lemma}" (${variants}) - ${pad} · kamus bahasa Sambas #SambasKu`
      : `"${data.lemma}" - ${pad} · kamus bahasa Sambas #SambasKu`;
  const withUrl = data.publicUrl ? `${base}\n${data.publicUrl}` : base;
  if (data.isVerified) return withUrl;
  return `${withUrl}\nArti belum diperiksa tim Sambasku.`;
}

export function buildShareCopyText(data: ShareCardData): string {
  const lines: string[] = [data.lemma];
  if (data.variantsLine?.trim()) lines.push(data.variantsLine.trim());

  const senses =
    data.senses.length > 0
      ? data.senses
      : [
          {
            wordClassCode: data.wordClassCode,
            padanan: data.padanan,
            definition: data.definition,
          },
        ];

  for (let i = 0; i < senses.length; i++) {
    const sense = senses[i]!;
    if (!senseHasBody(sense) && !senseWordClassBracket(sense.wordClassCode)) {
      continue;
    }
    const prefix = senses.length > 1 ? `${i + 1} ` : '';
    const bracket = senseWordClassBracket(sense.wordClassCode);
    const pad = sense.padanan?.trim();
    const headParts = [
      bracket ?? '',
      pad && pad.length > 0 ? `→ ${pad}` : '',
    ].filter(Boolean);
    const head = headParts.join(' ');
    if (head) lines.push(`${prefix}${head}`);
    const def = sense.definition?.trim();
    if (def) {
      if (head) lines.push(def);
      else lines.push(`${prefix}${def}`);
    }
  }

  if (data.exampleSentence?.trim()) {
    lines.push(`"${data.exampleSentence.trim()}"`);
  }
  if (!data.isVerified) {
    lines.push('Arti belum diperiksa tim Sambasku.');
  }
  lines.push('', '#SambasKu');
  return lines.join('\n');
}

export function pickPadanan(meaning: WordMeaning): string | null {
  const direct = meaning.translations.find((t) => t.translation_type === 'direct');
  if (direct?.translation_text) return direct.translation_text;
  if (meaning.translations.length > 0) {
    return meaning.translations[0]!.translation_text;
  }
  return null;
}

export function buildShareQuery(detail: WordDetail, meaning: WordMeaning): string {
  const padanan = pickPadanan(meaning) ?? '';
  const category =
    detail.categories.length > 0 ? detail.categories[0]!.name : '';
  const parts = [padanan, category]
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  if (parts.length === 0) return 'indonesia culture';
  return parts.join(' ');
}

export function senseLineFromMeaning(meaning: WordMeaning): ShareSenseLine {
  const definition = meaning.definition?.trim();
  return {
    wordClassCode: meaning.word_class?.code ?? null,
    padanan: pickPadanan(meaning),
    definition: !definition || definition === '-' ? null : definition,
  };
}

/** Maks. 3 makna; urut order_index naik. */
export function senseLinesForCard(
  meanings: WordMeaning[],
  opts: { allMeanings: boolean; selected: WordMeaning; max?: number },
): ShareSenseLine[] {
  const max = opts.max ?? 3;
  if (!opts.allMeanings || meanings.length <= 1) {
    return [senseLineFromMeaning(opts.selected)];
  }
  const sorted = [...meanings].sort((a, b) => a.order_index - b.order_index);
  return sorted.slice(0, max).map(senseLineFromMeaning);
}

export function spellingVariantsLine(detail: WordDetail): string | null {
  const seen = new Set<string>([detail.lemma.trim().toLowerCase()]);
  const parts: string[] = [];
  for (const v of detail.variants) {
    const form = v.form.trim();
    if (!form) continue;
    const key = form.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    parts.push(form);
  }
  if (parts.length === 0) return null;
  return parts.join(' / ');
}

export function buildShareCardData(opts: {
  detail: WordDetail;
  meaning: WordMeaning;
  settings: ShareEditorSettings;
  locale: AppLocale;
  appUrl: string;
  photographer?: string | null;
  provider?: string | null;
}): ShareCardData {
  const { detail, meaning, settings, locale, appUrl } = opts;
  const senses = senseLinesForCard(detail.meanings, {
    allMeanings: settings.showAllMeanings,
    selected: meaning,
  });
  return {
    lemma: detail.lemma,
    wordClassName: meaning.word_class?.name ?? null,
    wordClassCode: meaning.word_class?.code ?? null,
    definition: meaning.definition,
    padanan: pickPadanan(meaning),
    senses,
    exampleSentence:
      settings.showExample && meaning.examples.length > 0
        ? meaning.examples[0]!.source_sentence
        : null,
    photographer: opts.photographer ?? null,
    provider: opts.provider ?? null,
    variantsLine: spellingVariantsLine(detail),
    isVerified: detail.is_verified,
    publicUrl: wordSharePublicUrl(detail.lemma, locale, appUrl),
  };
}
