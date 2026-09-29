import { useEffect, useMemo, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import {
  Alert,
  Box,
  Button,
  Drawer,
  Group,
  Loader,
  ScrollArea,
  SegmentedControl,
  Skeleton,
  Slider,
  Stack,
  Switch,
  Text,
  TextInput,
  UnstyledButton,
} from '@mantine/core';
import { Copy, Download, Link2, Share2, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { AppLocale } from '@/application/i18n/locales';
import type { WordDetail, WordImage } from '@/domain/entities/word.entity';
import { hasViolenceWarning } from '@/domain/image-content-warnings';
import { env } from '@/infrastructure/config/env';
import {
  AnalyticsEvents,
  trackEvent,
} from '@/infrastructure/analytics/analytics';
import {
  listShareBackgrounds,
  type ShareBackgroundItem,
} from '@/infrastructure/api/share-backgrounds-api';
import { displayImageUrl } from '@/presentation/utils/display-image-url';
import { MediaExplorerModal } from '@/presentation/components/media-explorer/media-explorer-modal';
import { ShareCardCanvas } from './share-card-canvas';
import {
  buildShareCaption,
  buildShareCardData,
  buildShareCopyText,
  buildShareQuery,
} from './share-card-data';
import {
  downloadBlob,
  exportShareCardPng,
  copyLinkToClipboard,
  shareOrDownloadPng,
} from './share-export';
import {
  DEFAULT_SHARE_EDITOR_SETTINGS,
  resetLayouts,
  SHARE_FONT_PAIRS,
  SHARE_GRADIENT_IDS,
  SHARE_RATIO_IDS,
  SHARE_TEMPLATE_IDS,
  SHARE_TEXT_COLOR_IDS,
  shareFontPairLabel,
  shareGradientColors,
  shareGradientLabel,
  shareRatioLabel,
  shareRatioSize,
  shareTemplateAllowsMediaPan,
  shareTemplateForcesNoPhoto,
  shareTemplateLabel,
  shareTemplateUsesOverlay,
  shareTextColorLabel,
  shareTextColorLemma,
  withLayout,
  type ShareBgSource,
  type ShareEditorSettings,
  type ShareRatioId,
  type ShareTemplateId,
  type ShareTextElementId,
} from './share-models';

export interface WordShareSheetProps {
  opened: boolean;
  onClose: () => void;
  word: WordDetail;
  locale: AppLocale;
}

function shareableWordImages(images: WordImage[]): WordImage[] {
  return images.filter(
    (img) =>
      img.is_verified !== false &&
      !hasViolenceWarning(img.content_warnings) &&
      !!img.url,
  );
}

function Chip({
  active,
  label,
  onClick,
  swatch,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
  swatch?: string;
}) {
  return (
    <UnstyledButton
      onClick={onClick}
      style={{
        padding: swatch ? 0 : '6px 12px',
        borderRadius: 999,
        border: active ? '2px solid var(--mantine-color-blue-6)' : '1px solid var(--mantine-color-default-border)',
        background: swatch ?? (active ? 'var(--mantine-color-blue-light)' : 'transparent'),
        fontSize: 12,
        fontWeight: 600,
        whiteSpace: 'nowrap',
        minWidth: swatch ? 28 : undefined,
        height: swatch ? 28 : undefined,
      }}
      aria-pressed={active}
    >
      {swatch ? <span style={{ display: 'block', width: 28, height: 28 }} title={label} /> : label}
    </UnstyledButton>
  );
}

export function WordShareSheet({ opened, onClose, word, locale }: WordShareSheetProps) {
  const { t } = useTranslation();
  // Tunda mount canvas berat sampai animasi drawer selesai - hindari jank/glitch.
  const [canvasReady, setCanvasReady] = useState(false);

  const handleClose = () => {
    setCanvasReady(false);
    onClose();
  };

  return (
    <Drawer
      opened={opened}
      onClose={handleClose}
      position="bottom"
      size="94%"
      title={t('share_sheetTitle')}
      padding="md"
      // Scrollbar gutter hilang/muncul = “glitch” di belakang overlay.
      lockScroll={false}
      transitionProps={{
        duration: 220,
        onEntered: () => setCanvasReady(true),
        onExit: () => setCanvasReady(false),
      }}
      styles={{
        content: { display: 'flex', flexDirection: 'column' },
        body: {
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0,
          paddingTop: 0,
        },
      }}
    >
      {opened ? (
        <WordShareSheetSession
          word={word}
          locale={locale}
          canvasReady={canvasReady}
        />
      ) : null}
    </Drawer>
  );
}

function preloadImage(url: string, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException('Aborted', 'AbortError'));
      return;
    }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    const onAbort = () => {
      img.src = '';
      reject(new DOMException('Aborted', 'AbortError'));
    };
    signal?.addEventListener('abort', onAbort, { once: true });
    img.onload = () => {
      signal?.removeEventListener('abort', onAbort);
      resolve();
    };
    img.onerror = () => {
      signal?.removeEventListener('abort', onAbort);
      reject(new Error('image load failed'));
    };
    img.src = url;
  });
}

function WordShareSheetSession({
  word,
  locale,
  canvasReady,
}: {
  word: WordDetail;
  locale: AppLocale;
  canvasReady: boolean;
}) {
  const { t } = useTranslation();
  const exportRef = useRef<HTMLDivElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const meanings = word.meanings;
  const [meaningIndex, setMeaningIndex] = useState(0);
  const meaning = meanings[Math.min(meaningIndex, Math.max(0, meanings.length - 1))];

  const wordImages = useMemo(
    () => shareableWordImages(word.images),
    [word.images],
  );

  const [template, setTemplate] = useState<ShareTemplateId>('unsplash');
  const [ratio, setRatio] = useState<ShareRatioId>('story');
  const [settings, setSettings] = useState<ShareEditorSettings>(
    DEFAULT_SHARE_EDITOR_SETTINGS,
  );
  // Mulai dari gradien / gambar kata (siap lokal) - jangan tunggu stok.
  const [bgSource, setBgSource] = useState<ShareBgSource>(() =>
    wordImages.length > 0 ? 'wordImage' : 'none',
  );
  const [stockItems, setStockItems] = useState<ShareBackgroundItem[]>([]);
  const [stockLoading, setStockLoading] = useState(true);
  const [stockDegraded, setStockDegraded] = useState(false);
  const [selectedStock, setSelectedStock] = useState<ShareBackgroundItem | null>(
    null,
  );
  const [deviceUrl, setDeviceUrl] = useState<string | null>(null);
  const [wordImage, setWordImage] = useState<WordImage | null>(
    () => wordImages[0] ?? null,
  );
  const [explorerOpen, setExplorerOpen] = useState(false);
  const [layoutEditMode, setLayoutEditMode] = useState(false);
  const [selectedElement, setSelectedElement] =
    useState<ShareTextElementId | null>(null);
  const [mediaSelected, setMediaSelected] = useState(false);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const shareQuery = useMemo(
    () => (meaning ? buildShareQuery(word, meaning) : 'indonesia culture'),
    [word, meaning],
  );

  const photographer =
    bgSource === 'stock' ? selectedStock?.photographer : null;
  const provider = bgSource === 'stock' ? selectedStock?.provider : undefined;

  const cardData = useMemo(() => {
    if (!meaning) return null;
    return buildShareCardData({
      detail: word,
      meaning,
      settings,
      locale,
      appUrl: env.appUrl,
      photographer,
      provider,
    });
  }, [word, meaning, settings, locale, photographer, provider]);

  const caption = useMemo(
    () => (cardData ? buildShareCaption(cardData) : ''),
    [cardData],
  );
  const copyText = useMemo(
    () => (cardData ? buildShareCopyText(cardData) : ''),
    [cardData],
  );

  const imageUrl = useMemo(() => {
    if (shareTemplateForcesNoPhoto(template) || bgSource === 'none') {
      return null;
    }
    if (bgSource === 'device' && deviceUrl) return deviceUrl;
    if (bgSource === 'wordImage' && wordImage) {
      return displayImageUrl(wordImage.url, { width: 1080 }) ?? wordImage.url;
    }
    if (bgSource === 'stock' && selectedStock) {
      return (
        displayImageUrl(selectedStock.url, { width: 1080 }) ??
        selectedStock.url
      );
    }
    return null;
  }, [template, bgSource, deviceUrl, wordImage, selectedStock]);

  const { width: designW, height: designH } = shareRatioSize(ratio);
  /** Lebar preview penuh vs mengecil saat panel kontrol di-scroll. */
  const PREVIEW_MAX_W = 240;
  const PREVIEW_MIN_W = 108;
  const COLLAPSE_RANGE_PX = 140;
  const previewShellRef = useRef<HTMLDivElement>(null);
  const previewViewportRef = useRef<HTMLDivElement>(null);
  const previewScaleWrapRef = useRef<HTMLDivElement>(null);
  const scaleRef = useRef(PREVIEW_MAX_W / designW);
  const layoutEditModeRef = useRef(layoutEditMode);
  const designRef = useRef({ w: designW, h: designH });
  const scrollYRef = useRef(0);

  useEffect(() => {
    layoutEditModeRef.current = layoutEditMode;
  }, [layoutEditMode]);

  useEffect(() => {
    designRef.current = { w: designW, h: designH };
  }, [designW, designH]);

  const applyPreviewCollapse = (scrollY: number) => {
    const { w: dw, h: dh } = designRef.current;
    const collapse = layoutEditModeRef.current
      ? 0
      : Math.min(1, Math.max(0, scrollY / COLLAPSE_RANGE_PX));
    const previewW = PREVIEW_MAX_W - (PREVIEW_MAX_W - PREVIEW_MIN_W) * collapse;
    const scale = previewW / dw;
    const previewH = dh * scale;
    const pad = 12 - 6 * collapse;
    scaleRef.current = scale;
    const shell = previewShellRef.current;
    const viewport = previewViewportRef.current;
    const wrap = previewScaleWrapRef.current;
    if (shell) {
      shell.style.height = `${previewH + pad * 2}px`;
      shell.style.padding = `${pad}px`;
    }
    if (viewport) {
      viewport.style.width = `${previewW}px`;
      viewport.style.height = `${previewH}px`;
    }
    if (wrap) {
      wrap.style.transform = `scale(${scale})`;
    }
  };

  // Reset ukuran saat rasio / mode layout berubah.
  useEffect(() => {
    applyPreviewCollapse(scrollYRef.current);
  }, [ratio, layoutEditMode, designW, designH]);

  const initialScale = PREVIEW_MAX_W / designW;
  const initialPreviewH = designH * initialScale;

  useEffect(() => {
    return () => {
      if (deviceUrl?.startsWith('blob:')) URL.revokeObjectURL(deviceUrl);
    };
  }, [deviceUrl]);

  useEffect(() => {
    trackEvent(AnalyticsEvents.shareStart, { word_id: word.id });
  }, [word.id]);

  // Prefetch stok di latar; jangan ganti latar kartu sampai gambar siap
  // (hindari flash gradien → foto saat drawer masih animasi).
  useEffect(() => {
    const ac = new AbortController();
    void (async () => {
      try {
        const res = await listShareBackgrounds({
          q: shareQuery,
          page: 1,
          sort: 'relevant',
          provider: 'pixabay',
          limit: 12,
          signal: ac.signal,
        });
        if (ac.signal.aborted) return;
        setStockDegraded(res.degraded);
        setStockItems(res.items);
        const first = res.items[0];
        if (!first || res.degraded) {
          return;
        }
        const preview =
          displayImageUrl(first.url, { width: 1080 }) ?? first.url;
        try {
          await preloadImage(preview, ac.signal);
        } catch {
          if (ac.signal.aborted) return;
          // Tetap simpan item untuk strip thumbs; jangan auto-apply.
          return;
        }
        if (ac.signal.aborted) return;
        setSelectedStock(first);
        // Hanya auto-apply stok jika user belum pilih sumber lain.
        setBgSource((cur) => (cur === 'none' ? 'stock' : cur));
      } catch {
        // Diam: strip thumbs kosong; kartu tetap gradien/gambar kata.
      } finally {
        if (!ac.signal.aborted) setStockLoading(false);
      }
    })();
    return () => ac.abort();
  }, [shareQuery]);

  const patchSettings = (patch: Partial<ShareEditorSettings>) => {
    setSettings((s) => ({ ...s, ...patch }));
  };

  const onPanElement = (id: ShareTextElementId, dx: number, dy: number) => {
    setSettings((s) => {
      const cur = (() => {
        switch (id) {
          case 'lemma':
            return s.lemmaLayout;
          case 'padanan':
            return s.padananLayout;
          case 'definition':
            return s.definitionLayout;
          case 'example':
            return s.exampleLayout;
          case 'wordClass':
            return s.wordClassLayout;
        }
      })();
      return withLayout(s, id, {
        ...cur,
        offsetX: cur.offsetX + dx / scaleRef.current,
        offsetY: cur.offsetY + dy / scaleRef.current,
      });
    });
  };

  const onPanMedia = (dx: number, dy: number) => {
    if (!shareTemplateAllowsMediaPan(template)) return;
    setSettings((s) => ({
      ...s,
      mediaAlignment: {
        x: Math.min(
          1,
          Math.max(
            -1,
            s.mediaAlignment.x + dx / (designW * scaleRef.current * 0.5),
          ),
        ),
        y: Math.min(
          1,
          Math.max(
            -1,
            s.mediaAlignment.y + dy / (designH * scaleRef.current * 0.5),
          ),
        ),
      },
    }));
  };

  const onDeviceFile = (file: File | undefined) => {
    if (!file || !file.type.startsWith('image/')) return;
    if (deviceUrl?.startsWith('blob:')) URL.revokeObjectURL(deviceUrl);
    const url = URL.createObjectURL(file);
    setDeviceUrl(url);
    setBgSource('device');
    setSelectedStock(null);
    setWordImage(null);
  };

  const runExport = async (mode: 'share' | 'download') => {
    const node = exportRef.current;
    if (!node || !cardData || busy) return;
    setBusy(true);
    setError(null);
    setFeedback(null);
    try {
      let blob: Blob;
      try {
        ({ blob } = await exportShareCardPng(node, {
          width: designW,
          height: designH,
        }));
      } catch (firstErr) {
        // CORS / gambar eksternal sering mematahkan html-to-image.
        // Coba ulang dengan latar gradien saja.
        console.warn('[share] export dengan foto gagal, retry tanpa foto', firstErr);
        const prevSource = bgSource;
        const prevStock = selectedStock;
        const prevWord = wordImage;
        flushSync(() => {
          setBgSource('none');
          setSelectedStock(null);
          setWordImage(null);
        });
        try {
          const retryNode = exportRef.current;
          if (!retryNode) throw firstErr;
          ({ blob } = await exportShareCardPng(retryNode, {
            width: designW,
            height: designH,
          }));
          setFeedback(t('share_bgFallback'));
        } catch (retryErr) {
          flushSync(() => {
            setBgSource(prevSource);
            setSelectedStock(prevStock);
            setWordImage(prevWord);
          });
          throw retryErr;
        }
      }
      const filename = `sambasku-${word.lemma.replace(/\s+/g, '-')}.png`;
      if (mode === 'download') {
        downloadBlob(blob, filename);
        trackEvent(AnalyticsEvents.shareComplete, {
          word_id: word.id,
          method: 'download',
        });
        setFeedback((prev) => prev ?? t('share_downloaded'));
        return;
      }
      const method = await shareOrDownloadPng({
        blob,
        filename,
        caption,
        url: cardData.publicUrl,
        title: word.lemma,
      });
      trackEvent(AnalyticsEvents.shareComplete, {
        word_id: word.id,
        method,
      });
      setFeedback(
        method === 'native_file' ? t('share_shared') : t('share_downloaded'),
      );
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      console.error('[share] export gagal total', err);
      setError(t('share_exportFailed'));
    } finally {
      setBusy(false);
    }
  };

  const copyCardText = async () => {
    try {
      await navigator.clipboard.writeText(copyText);
      setFeedback(t('share_textCopied'));
    } catch {
      setError(t('share_copyFailed'));
    }
  };

  const copyLink = async () => {
    if (!cardData) return;
    try {
      await copyLinkToClipboard(cardData.publicUrl);
      trackEvent(AnalyticsEvents.shareComplete, {
        word_id: word.id,
        method: 'clipboard_link',
      });
      setFeedback(t('share_linkCopied'));
    } catch {
      setError(t('share_copyFailed'));
    }
  };

  return (
    <>
      <Stack gap="sm" style={{ flex: 1, minHeight: 0 }}>
        {error ? (
          <Alert color="red" variant="light">
            {error}
          </Alert>
        ) : null}
        {!meaning || !cardData ? (
          <Alert color="yellow" variant="light">
            {t('share_exportFailed')}
          </Alert>
        ) : null}
        {feedback ? (
          <Alert color="teal" variant="light">
            {feedback}
          </Alert>
        ) : null}

        <Box
          ref={previewShellRef}
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            background: 'var(--mantine-color-default-hover)',
            borderRadius: 12,
            padding: 12,
            overflow: 'hidden',
            flexShrink: 0,
            height: initialPreviewH + 24,
          }}
        >
          {!canvasReady ? (
            <Skeleton
              width={PREVIEW_MAX_W}
              height={initialPreviewH}
              radius="md"
            />
          ) : (
            <div
              ref={previewViewportRef}
              style={{
                width: PREVIEW_MAX_W,
                height: initialPreviewH,
                position: 'relative',
                overflow: 'hidden',
                borderRadius: 8,
              }}
            >
              {/* Scale di wrapper; ref export di anak tanpa transform. */}
              <div
                ref={previewScaleWrapRef}
                style={{
                  transform: `scale(${initialScale})`,
                  transformOrigin: 'top left',
                  willChange: 'transform',
                }}
              >
                <div
                  ref={exportRef}
                  style={{
                    width: designW,
                    height: designH,
                  }}
                >
                  {cardData ? (
                    <ShareCardCanvas
                      data={cardData}
                      template={template}
                      ratio={ratio}
                      settings={settings}
                      imageUrl={imageUrl}
                      layoutEditMode={layoutEditMode}
                      selectedElement={selectedElement}
                      mediaSelected={mediaSelected}
                      onSelectElement={(id) => {
                        setSelectedElement(id);
                        setMediaSelected(false);
                      }}
                      onPanElement={onPanElement}
                      onSelectMedia={() => {
                        setMediaSelected(true);
                        setSelectedElement(null);
                      }}
                      onPanMedia={onPanMedia}
                    />
                  ) : null}
                </div>
              </div>
            </div>
          )}
        </Box>

        <ScrollArea
          style={{ flex: 1 }}
          type="auto"
          offsetScrollbars
          onScrollPositionChange={({ y }) => {
            scrollYRef.current = y;
            applyPreviewCollapse(y);
          }}
        >
          <Stack gap="md" pb="md">
            <div>
              <Text size="xs" fw={700} mb={6}>
                {t('share_background')}
              </Text>
              <Group gap={6} wrap="wrap">
                <Chip
                  active={bgSource === 'none' || shareTemplateForcesNoPhoto(template)}
                  label={t('share_bgNone')}
                  onClick={() => {
                    setBgSource('none');
                    setSelectedStock(null);
                  }}
                />
                <Chip
                  active={false}
                  label={t('share_bgExplorer')}
                  onClick={() => setExplorerOpen(true)}
                />
                <Chip
                  active={bgSource === 'device'}
                  label={t('share_bgGallery')}
                  onClick={() => galleryInputRef.current?.click()}
                />
                <Chip
                  active={false}
                  label={t('share_bgCamera')}
                  onClick={() => cameraInputRef.current?.click()}
                />
                {wordImages.map((img) => {
                  const thumb =
                    displayImageUrl(img.url, { width: 96 }) ?? img.url;
                  return (
                    <UnstyledButton
                      key={img.id}
                      onClick={() => {
                        setBgSource('wordImage');
                        setWordImage(img);
                        setSelectedStock(null);
                      }}
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 8,
                        overflow: 'hidden',
                        border:
                          bgSource === 'wordImage' && wordImage?.id === img.id
                            ? '2px solid var(--mantine-color-blue-6)'
                            : '1px solid var(--mantine-color-default-border)',
                      }}
                    >
                      <img
                        src={thumb}
                        alt=""
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </UnstyledButton>
                  );
                })}
                {stockLoading ? <Loader size="sm" /> : null}
                {stockDegraded && !stockLoading && stockItems.length === 0 ? (
                  <Text size="xs" c="dimmed">
                    {t('share_bgDegraded')}
                  </Text>
                ) : null}
                {stockItems.slice(0, 8).map((item) => {
                  const thumb =
                    displayImageUrl(item.preview_url || item.url, {
                      width: 96,
                    }) ?? item.url;
                  return (
                    <UnstyledButton
                      key={item.id}
                      onClick={() => {
                        setBgSource('stock');
                        setSelectedStock(item);
                        setWordImage(null);
                      }}
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 8,
                        overflow: 'hidden',
                        border:
                          bgSource === 'stock' && selectedStock?.id === item.id
                            ? '2px solid var(--mantine-color-blue-6)'
                            : '1px solid var(--mantine-color-default-border)',
                      }}
                    >
                      <img
                        src={thumb}
                        alt=""
                        crossOrigin="anonymous"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </UnstyledButton>
                  );
                })}
              </Group>
              <Group gap={6} mt="xs" wrap="wrap">
                {SHARE_GRADIENT_IDS.map((id) => (
                  <Chip
                    key={id}
                    active={
                      bgSource === 'none' &&
                      settings.backdropKind === 'gradient' &&
                      settings.gradientId === id
                    }
                    label={shareGradientLabel(id)}
                    swatch={shareGradientColors(id)[1]}
                    onClick={() => {
                      setBgSource('none');
                      patchSettings({
                        backdropKind: 'gradient',
                        gradientId: id,
                      });
                    }}
                  />
                ))}
                <TextInput
                  size="xs"
                  w={110}
                  value={settings.solidColor}
                  onChange={(e) => {
                    setBgSource('none');
                    patchSettings({
                      backdropKind: 'solid',
                      solidColor: e.currentTarget.value,
                    });
                  }}
                  leftSection={<Sparkles size={12} />}
                  aria-label={t('share_solidColor')}
                />
              </Group>
            </div>

            <div>
              <Text size="xs" fw={700} mb={6}>
                {t('share_style')}
              </Text>
              <Group gap={6} wrap="wrap">
                {SHARE_TEMPLATE_IDS.map((id) => (
                  <Chip
                    key={id}
                    active={template === id}
                    label={shareTemplateLabel(id)}
                    onClick={() => setTemplate(id)}
                  />
                ))}
              </Group>
            </div>

            <div>
              <Text size="xs" fw={700} mb={6}>
                {t('share_ratio')}
              </Text>
              <Group gap={6} wrap="wrap">
                {SHARE_RATIO_IDS.map((id) => (
                  <Chip
                    key={id}
                    active={ratio === id}
                    label={shareRatioLabel(id)}
                    onClick={() => setRatio(id)}
                  />
                ))}
              </Group>
            </div>

            {meanings.length > 1 ? (
              <div>
                <Text size="xs" fw={700} mb={6}>
                  {t('share_meaning')}
                </Text>
                <Group gap={6} wrap="wrap">
                  {meanings.map((m, i) => (
                    <Chip
                      key={m.id}
                      active={!settings.showAllMeanings && meaningIndex === i}
                      label={`${i + 1}`}
                      onClick={() => {
                        setMeaningIndex(i);
                        patchSettings({ showAllMeanings: false });
                      }}
                    />
                  ))}
                  <Chip
                    active={settings.showAllMeanings}
                    label={t('share_allMeanings')}
                    onClick={() => patchSettings({ showAllMeanings: true })}
                  />
                </Group>
              </div>
            ) : null}

            <div>
              <Text size="xs" fw={700} mb={6}>
                {t('share_editor')}
              </Text>
              <Stack gap="xs">
                <Text size="xs">{t('share_lemmaScale')}</Text>
                <Slider
                  min={0.8}
                  max={1.4}
                  step={0.05}
                  value={settings.lemmaFontScale}
                  onChange={(v) => patchSettings({ lemmaFontScale: v })}
                />
                <Text size="xs">{t('share_bodyScale')}</Text>
                <Slider
                  min={0.8}
                  max={1.3}
                  step={0.05}
                  value={settings.bodyFontScale}
                  onChange={(v) => patchSettings({ bodyFontScale: v })}
                />
                {shareTemplateUsesOverlay(template) ? (
                  <>
                    <Text size="xs">{t('share_overlay')}</Text>
                    <Slider
                      min={0}
                      max={1}
                      step={0.05}
                      value={settings.overlayStrength}
                      onChange={(v) => patchSettings({ overlayStrength: v })}
                    />
                  </>
                ) : null}
                <Text size="xs">{t('share_font')}</Text>
                <Group gap={6} wrap="wrap">
                  {SHARE_FONT_PAIRS.map((pair) => (
                    <Chip
                      key={pair}
                      active={settings.fontPair === pair}
                      label={shareFontPairLabel(pair)}
                      onClick={() => patchSettings({ fontPair: pair })}
                    />
                  ))}
                </Group>
                <Text size="xs">{t('share_textColor')}</Text>
                <Group gap={6} wrap="wrap">
                  {SHARE_TEXT_COLOR_IDS.map((id) => (
                    <Chip
                      key={id}
                      active={settings.textColorId === id}
                      label={shareTextColorLabel(id)}
                      swatch={shareTextColorLemma(id)}
                      onClick={() => patchSettings({ textColorId: id })}
                    />
                  ))}
                </Group>
                <Switch
                  label={t('share_showWordClass')}
                  checked={settings.showWordClass}
                  onChange={(e) =>
                    patchSettings({ showWordClass: e.currentTarget.checked })
                  }
                />
                <Switch
                  label={t('share_showPadanan')}
                  checked={settings.showPadanan}
                  onChange={(e) =>
                    patchSettings({ showPadanan: e.currentTarget.checked })
                  }
                />
                <Switch
                  label={t('share_showDefinition')}
                  checked={settings.showDefinition}
                  onChange={(e) =>
                    patchSettings({ showDefinition: e.currentTarget.checked })
                  }
                />
                <Switch
                  label={t('share_showExample')}
                  checked={settings.showExample}
                  onChange={(e) =>
                    patchSettings({ showExample: e.currentTarget.checked })
                  }
                />
                <Switch
                  label={t('share_showWatermark')}
                  checked={settings.showWatermark}
                  onChange={(e) =>
                    patchSettings({ showWatermark: e.currentTarget.checked })
                  }
                />
                <SegmentedControl
                  fullWidth
                  value={layoutEditMode ? 'layout' : 'preview'}
                  onChange={(v) => setLayoutEditMode(v === 'layout')}
                  data={[
                    { value: 'preview', label: t('share_previewMode') },
                    { value: 'layout', label: t('share_layoutMode') },
                  ]}
                />
                {layoutEditMode ? (
                  <Button
                    variant="light"
                    size="xs"
                    onClick={() => setSettings((s) => resetLayouts(s))}
                  >
                    {t('share_resetLayout')}
                  </Button>
                ) : null}
              </Stack>
            </div>
          </Stack>
        </ScrollArea>

        <Group grow gap="xs">
          <Button
            variant="light"
            leftSection={<Download size={16} />}
            loading={busy}
            disabled={!canvasReady || !cardData}
            onClick={() => void runExport('download')}
          >
            {t('share_save')}
          </Button>
          <Button
            leftSection={<Share2 size={16} />}
            loading={busy}
            disabled={!canvasReady || !cardData}
            onClick={() => void runExport('share')}
          >
            {t('share_shareCard')}
          </Button>
        </Group>
        <Group grow gap="xs">
          <Button
            variant="subtle"
            size="compact-sm"
            leftSection={<Copy size={14} />}
            onClick={() => void copyCardText()}
          >
            {t('share_copyText')}
          </Button>
          <Button
            variant="subtle"
            size="compact-sm"
            leftSection={<Link2 size={14} />}
            onClick={() => void copyLink()}
          >
            {t('share_copyLink')}
          </Button>
        </Group>
      </Stack>

      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          onDeviceFile(e.target.files?.[0]);
          e.target.value = '';
        }}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        hidden
        onChange={(e) => {
          onDeviceFile(e.target.files?.[0]);
          e.target.value = '';
        }}
      />

      <MediaExplorerModal
        open={explorerOpen}
        onClose={() => setExplorerOpen(false)}
        initialQuery={shareQuery}
        onSelect={(item) => {
          setBgSource('stock');
          setSelectedStock(item);
          setWordImage(null);
          setStockItems((prev) => {
            if (prev.some((p) => p.id === item.id)) return prev;
            return [item, ...prev];
          });
          setExplorerOpen(false);
        }}
      />
    </>
  );
}
