/**
 * Kontrak kartu Bagikan web - port dari mobile share_models.dart.
 * Video/MP4 sengaja tidak didukung di web (lihat docs/web/12-web-share-card.md).
 */

export type ShareBgSource = 'stock' | 'device' | 'wordImage' | 'none';

export type ShareFontPair = 'classic' | 'editorial' | 'modern';

export type ShareTextColorId =
  | 'putih'
  | 'krem'
  | 'tinta'
  | 'terracotta'
  | 'sky';

export type ShareBackdropKind = 'gradient' | 'solid';

export type ShareGradientId = 'senja' | 'laut' | 'hutan' | 'pasir' | 'charcoal';

export type ShareTextElementId =
  | 'lemma'
  | 'padanan'
  | 'definition'
  | 'example'
  | 'wordClass';

export type ShareTemplateId =
  | 'unsplash'
  | 'kamusEditorial'
  | 'posterHuruf'
  | 'polaroid'
  | 'sisi'
  | 'kaca'
  | 'kutipan'
  | 'kartu';

export type ShareRatioId =
  | 'story'
  | 'portrait23'
  | 'portrait34'
  | 'portrait45'
  | 'post';

export interface ShareSenseLine {
  wordClassCode?: string | null;
  padanan?: string | null;
  definition?: string | null;
}

export interface ShareTextLayout {
  offsetX: number;
  offsetY: number;
  rotationDeg: number;
}

export const SHARE_TEXT_LAYOUT_ZERO: ShareTextLayout = {
  offsetX: 0,
  offsetY: 0,
  rotationDeg: 0,
};

export interface SharePoint {
  x: number;
  y: number;
}

export interface ShareEditorSettings {
  lemmaFontScale: number;
  bodyFontScale: number;
  overlayStrength: number;
  fontPair: ShareFontPair;
  textColorId: ShareTextColorId;
  gradientId: ShareGradientId;
  backdropKind: ShareBackdropKind;
  solidColor: string;
  showWordClass: boolean;
  showPadanan: boolean;
  showDefinition: boolean;
  showExample: boolean;
  showAllMeanings: boolean;
  showWatermark: boolean;
  lemmaLayout: ShareTextLayout;
  padananLayout: ShareTextLayout;
  definitionLayout: ShareTextLayout;
  exampleLayout: ShareTextLayout;
  wordClassLayout: ShareTextLayout;
  /** -1..1 crop alignment untuk foto cover. */
  mediaAlignment: SharePoint;
}

export const DEFAULT_SHARE_EDITOR_SETTINGS: ShareEditorSettings = {
  lemmaFontScale: 1,
  bodyFontScale: 1,
  overlayStrength: 0.75,
  fontPair: 'classic',
  textColorId: 'putih',
  gradientId: 'senja',
  backdropKind: 'gradient',
  solidColor: '#1C1917',
  showWordClass: true,
  showPadanan: true,
  showDefinition: true,
  showExample: false,
  showAllMeanings: false,
  showWatermark: true,
  lemmaLayout: SHARE_TEXT_LAYOUT_ZERO,
  padananLayout: SHARE_TEXT_LAYOUT_ZERO,
  definitionLayout: SHARE_TEXT_LAYOUT_ZERO,
  exampleLayout: SHARE_TEXT_LAYOUT_ZERO,
  wordClassLayout: SHARE_TEXT_LAYOUT_ZERO,
  mediaAlignment: { x: 0, y: 0 },
};

export const SHARE_TEMPLATE_IDS: readonly ShareTemplateId[] = [
  'unsplash',
  'kamusEditorial',
  'posterHuruf',
  'polaroid',
  'sisi',
  'kaca',
  'kutipan',
  'kartu',
] as const;

export const SHARE_RATIO_IDS: readonly ShareRatioId[] = [
  'story',
  'portrait23',
  'portrait34',
  'portrait45',
  'post',
] as const;

export const SHARE_FONT_PAIRS: readonly ShareFontPair[] = [
  'classic',
  'editorial',
  'modern',
] as const;

export const SHARE_TEXT_COLOR_IDS: readonly ShareTextColorId[] = [
  'putih',
  'krem',
  'tinta',
  'terracotta',
  'sky',
] as const;

export const SHARE_GRADIENT_IDS: readonly ShareGradientId[] = [
  'senja',
  'laut',
  'hutan',
  'pasir',
  'charcoal',
] as const;

export function shareProviderLabel(id: string): string {
  switch (id) {
    case 'pixabay':
      return 'Pixabay';
    case 'openverse':
      return 'Openverse';
    case 'unsplash':
      return 'Unsplash';
    case 'pexels':
      return 'Pexels';
    case 'wikimedia':
      return 'Wikimedia';
    default:
      return id;
  }
}

export function shareTemplateLabel(id: ShareTemplateId): string {
  switch (id) {
    case 'unsplash':
      return 'Penuh';
    case 'kamusEditorial':
      return 'Editorial';
    case 'posterHuruf':
      return 'Poster';
    case 'polaroid':
      return 'Bingkai';
    case 'sisi':
      return 'Sisi';
    case 'kaca':
      return 'Kaca';
    case 'kutipan':
      return 'Kutipan';
    case 'kartu':
      return 'Kartu';
  }
}

export function shareRatioLabel(id: ShareRatioId): string {
  switch (id) {
    case 'story':
      return '9:16';
    case 'portrait23':
      return '2:3';
    case 'portrait34':
      return '3:4';
    case 'portrait45':
      return '4:5';
    case 'post':
      return '1:1';
  }
}

export function shareRatioSize(id: ShareRatioId): { width: number; height: number } {
  switch (id) {
    case 'story':
      return { width: 1080, height: 1920 };
    case 'portrait23':
      return { width: 1080, height: 1620 };
    case 'portrait34':
      return { width: 1080, height: 1440 };
    case 'portrait45':
      return { width: 1080, height: 1350 };
    case 'post':
      return { width: 1080, height: 1080 };
  }
}

export function shareRatioPrefersSideSplit(id: ShareRatioId): boolean {
  const { width, height } = shareRatioSize(id);
  return height / width <= 1.05;
}

export function shareTemplateForcesNoPhoto(id: ShareTemplateId): boolean {
  return id === 'posterHuruf';
}

export function shareTemplateUsesOverlay(id: ShareTemplateId): boolean {
  return id === 'unsplash' || id === 'kaca' || id === 'kutipan';
}

export function shareTemplateAllowsMediaPan(id: ShareTemplateId): boolean {
  return !shareTemplateForcesNoPhoto(id);
}

export function shareFontPairLabel(pair: ShareFontPair): string {
  switch (pair) {
    case 'classic':
      return 'Klasik';
    case 'editorial':
      return 'Editorial';
    case 'modern':
      return 'Modern';
  }
}

export function shareTextColorLabel(id: ShareTextColorId): string {
  switch (id) {
    case 'putih':
      return 'Putih';
    case 'krem':
      return 'Krem';
    case 'tinta':
      return 'Tinta';
    case 'terracotta':
      return 'Terracotta';
    case 'sky':
      return 'Sky';
  }
}

export function shareTextColorLemma(id: ShareTextColorId): string {
  switch (id) {
    case 'putih':
      return '#FFFFFF';
    case 'krem':
      return '#FFF7ED';
    case 'tinta':
      return '#1C1917';
    case 'terracotta':
      return '#FDBA74';
    case 'sky':
      return '#BAE6FD';
  }
}

export function shareTextColorBody(id: ShareTextColorId): string {
  switch (id) {
    case 'putih':
      return 'rgba(255,255,255,0.92)';
    case 'krem':
      return '#FFEDD5';
    case 'tinta':
      return '#44403C';
    case 'terracotta':
      return '#FED7AA';
    case 'sky':
      return '#E0F2FE';
  }
}

export function shareTextColorPrefersDarkSurface(id: ShareTextColorId): boolean {
  return id !== 'tinta';
}

export function shareGradientLabel(id: ShareGradientId): string {
  switch (id) {
    case 'senja':
      return 'Senja';
    case 'laut':
      return 'Laut';
    case 'hutan':
      return 'Hutan';
    case 'pasir':
      return 'Pasir';
    case 'charcoal':
      return 'Charcoal';
  }
}

export function shareGradientColors(id: ShareGradientId): readonly string[] {
  switch (id) {
    case 'senja':
      return ['#1B3A4B', '#C45C26', '#2A1810'];
    case 'laut':
      return ['#0F172A', '#1E3A5F', '#0EA5E9'];
    case 'hutan':
      return ['#14532D', '#3F6212', '#D9F99D'];
    case 'pasir':
      return ['#F5E6D3', '#C45C26', '#A16207'];
    case 'charcoal':
      return ['#292524', '#57534E', '#A8A29E'];
  }
}

export function shareBackdropColors(settings: ShareEditorSettings): string[] {
  if (settings.backdropKind === 'solid') {
    return [settings.solidColor, settings.solidColor];
  }
  return [...shareGradientColors(settings.gradientId)];
}

export function senseWordClassBracket(
  code: string | null | undefined,
): string | null {
  const trimmed = code?.trim();
  if (!trimmed) return null;
  return `[${trimmed.toLowerCase()}]`;
}

export function senseHasBody(sense: ShareSenseLine): boolean {
  const pad = sense.padanan?.trim() ?? '';
  const def = sense.definition?.trim() ?? '';
  return pad.length > 0 || def.length > 0;
}

export function layoutFor(
  settings: ShareEditorSettings,
  id: ShareTextElementId,
): ShareTextLayout {
  switch (id) {
    case 'lemma':
      return settings.lemmaLayout;
    case 'padanan':
      return settings.padananLayout;
    case 'definition':
      return settings.definitionLayout;
    case 'example':
      return settings.exampleLayout;
    case 'wordClass':
      return settings.wordClassLayout;
  }
}

export function withLayout(
  settings: ShareEditorSettings,
  id: ShareTextElementId,
  layout: ShareTextLayout,
): ShareEditorSettings {
  switch (id) {
    case 'lemma':
      return { ...settings, lemmaLayout: layout };
    case 'padanan':
      return { ...settings, padananLayout: layout };
    case 'definition':
      return { ...settings, definitionLayout: layout };
    case 'example':
      return { ...settings, exampleLayout: layout };
    case 'wordClass':
      return { ...settings, wordClassLayout: layout };
  }
}

export function resetLayouts(settings: ShareEditorSettings): ShareEditorSettings {
  return {
    ...settings,
    lemmaLayout: SHARE_TEXT_LAYOUT_ZERO,
    padananLayout: SHARE_TEXT_LAYOUT_ZERO,
    definitionLayout: SHARE_TEXT_LAYOUT_ZERO,
    exampleLayout: SHARE_TEXT_LAYOUT_ZERO,
    wordClassLayout: SHARE_TEXT_LAYOUT_ZERO,
    mediaAlignment: { x: 0, y: 0 },
  };
}

/** Font stacks self-host / sistem - CSP font-src tidak mengizinkan Google CDN. */
export function shareLemmaFontFamily(pair: ShareFontPair): string {
  switch (pair) {
    case 'classic':
      return "'Plus Jakarta Sans', Georgia, 'Times New Roman', serif";
    case 'editorial':
      return "Georgia, 'Times New Roman', serif";
    case 'modern':
      return "'Plus Jakarta Sans', system-ui, sans-serif";
  }
}

export function shareBodyFontFamily(pair: ShareFontPair): string {
  switch (pair) {
    case 'classic':
      return "'Plus Jakarta Sans', system-ui, sans-serif";
    case 'editorial':
      return "system-ui, 'Segoe UI', sans-serif";
    case 'modern':
      return "'Plus Jakarta Sans', system-ui, sans-serif";
  }
}
