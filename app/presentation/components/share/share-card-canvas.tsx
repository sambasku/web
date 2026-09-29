import type { CSSProperties, ReactNode } from 'react';
import {
  layoutFor,
  senseWordClassBracket,
  shareBackdropColors,
  shareBodyFontFamily,
  shareLemmaFontFamily,
  shareRatioPrefersSideSplit,
  shareRatioSize,
  shareTemplateForcesNoPhoto,
  shareTextColorBody,
  shareTextColorLemma,
  shareTextColorPrefersDarkSurface,
  type ShareEditorSettings,
  type ShareRatioId,
  type ShareTemplateId,
  type ShareTextElementId,
} from './share-models';
import {
  shareCreditLine,
  shareTrustLabel,
  type ShareCardData,
} from './share-card-data';

export interface ShareCardCanvasProps {
  data: ShareCardData;
  template: ShareTemplateId;
  ratio: ShareRatioId;
  settings: ShareEditorSettings;
  /** URL foto (wsrv / blob) untuk <img crossOrigin>. */
  imageUrl?: string | null;
  layoutEditMode?: boolean;
  selectedElement?: ShareTextElementId | null;
  mediaSelected?: boolean;
  onSelectElement?: (id: ShareTextElementId) => void;
  onPanElement?: (id: ShareTextElementId, dx: number, dy: number) => void;
  onSelectMedia?: () => void;
  onPanMedia?: (dx: number, dy: number) => void;
}

function gradientCss(colors: string[]): string {
  return `linear-gradient(135deg, ${colors.join(', ')})`;
}

function LaidOut({
  id,
  settings,
  layoutEditMode,
  selected,
  onSelect,
  onPan,
  children,
}: {
  id: ShareTextElementId;
  settings: ShareEditorSettings;
  layoutEditMode?: boolean;
  selected?: ShareTextElementId | null;
  onSelect?: (id: ShareTextElementId) => void;
  onPan?: (id: ShareTextElementId, dx: number, dy: number) => void;
  children: ReactNode;
}) {
  const layout = layoutFor(settings, id);
  const isSelected = selected === id;
  const style: CSSProperties = {
    transform: `translate(${layout.offsetX}px, ${layout.offsetY}px) rotate(${layout.rotationDeg}deg)`,
    outline: layoutEditMode
      ? isSelected
        ? '3px solid #38BDF8'
        : '1.5px solid rgba(255,255,255,0.4)'
      : undefined,
    cursor: layoutEditMode ? 'grab' : undefined,
    touchAction: layoutEditMode ? 'none' : undefined,
  };

  if (!layoutEditMode) {
    return <div style={style}>{children}</div>;
  }

  return (
    <div
      style={style}
      onPointerDown={(e) => {
        e.stopPropagation();
        onSelect?.(id);
        const el = e.currentTarget;
        el.setPointerCapture(e.pointerId);
        let lastX = e.clientX;
        let lastY = e.clientY;
        const onMove = (ev: PointerEvent) => {
          const dx = ev.clientX - lastX;
          const dy = ev.clientY - lastY;
          lastX = ev.clientX;
          lastY = ev.clientY;
          onPan?.(id, dx, dy);
        };
        const onUp = () => {
          el.releasePointerCapture(e.pointerId);
          window.removeEventListener('pointermove', onMove);
          window.removeEventListener('pointerup', onUp);
        };
        window.addEventListener('pointermove', onMove);
        window.addEventListener('pointerup', onUp);
      }}
    >
      {children}
    </div>
  );
}

function PhotoOrGradient({
  imageUrl,
  gradient,
  mediaAlignment,
  layoutEditMode,
  mediaSelected,
  onSelectMedia,
  onPanMedia,
}: {
  imageUrl?: string | null;
  gradient: string[];
  mediaAlignment: { x: number; y: number };
  layoutEditMode?: boolean;
  mediaSelected?: boolean;
  onSelectMedia?: () => void;
  onPanMedia?: (dx: number, dy: number) => void;
}) {
  const objectPosition = `${50 + mediaAlignment.x * 50}% ${50 + mediaAlignment.y * 50}%`;
  const border = layoutEditMode && mediaSelected ? '6px solid #38BDF8' : undefined;

  const media = imageUrl ? (
    <img
      src={imageUrl}
      alt=""
      {...(imageUrl.startsWith('blob:') || imageUrl.startsWith('data:')
        ? {}
        : { crossOrigin: 'anonymous' as const })}
      draggable={false}
      style={{
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        objectPosition,
        display: 'block',
      }}
    />
  ) : (
    <div style={{ width: '100%', height: '100%', background: gradientCss(gradient) }} />
  );

  if (!layoutEditMode) {
    return <div style={{ position: 'absolute', inset: 0 }}>{media}</div>;
  }

  return (
    <div
      style={{ position: 'absolute', inset: 0, outline: border, boxSizing: 'border-box' }}
      onPointerDown={(e) => {
        onSelectMedia?.();
        const el = e.currentTarget;
        el.setPointerCapture(e.pointerId);
        let lastX = e.clientX;
        let lastY = e.clientY;
        const onMove = (ev: PointerEvent) => {
          onPanMedia?.(ev.clientX - lastX, ev.clientY - lastY);
          lastX = ev.clientX;
          lastY = ev.clientY;
        };
        const onUp = () => {
          el.releasePointerCapture(e.pointerId);
          window.removeEventListener('pointermove', onMove);
          window.removeEventListener('pointerup', onUp);
        };
        window.addEventListener('pointermove', onMove);
        window.addEventListener('pointerup', onUp);
      }}
    >
      {media}
    </div>
  );
}

function Watermark({ data, pair }: { data: ShareCardData; pair: ShareEditorSettings['fontPair'] }) {
  const credit = shareCreditLine(data);
  return (
    <div
      style={{
        position: 'absolute',
        right: 48,
        bottom: 48,
        padding: '16px 26px',
        borderRadius: credit ? 20 : 999,
        background: 'rgba(0,0,0,0.28)',
        border: '1px solid rgba(255,255,255,0.14)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        textAlign: 'right',
        zIndex: 5,
      }}
    >
      <img
        src="/logo_hor_dark.webp"
        alt="SambasKu"
        style={{ height: 40, display: 'block', marginLeft: 'auto' }}
      />
      {credit ? (
        <div
          style={{
            marginTop: 8,
            fontFamily: shareBodyFontFamily(pair),
            fontSize: 22,
            color: 'rgba(255,255,255,0.82)',
            fontWeight: 500,
          }}
        >
          {credit}
        </div>
      ) : null}
    </div>
  );
}

function MeaningBlock({
  data,
  settings,
  lemmaColor,
  bodyColor,
  padananSize,
  definitionSize,
  align = 'start',
  layoutEditMode,
  selected,
  onSelect,
  onPan,
}: {
  data: ShareCardData;
  settings: ShareEditorSettings;
  lemmaColor: string;
  bodyColor: string;
  padananSize: number;
  definitionSize: number;
  align?: 'start' | 'center';
  layoutEditMode?: boolean;
  selected?: ShareTextElementId | null;
  onSelect?: (id: ShareTextElementId) => void;
  onPan?: (id: ShareTextElementId, dx: number, dy: number) => void;
}) {
  if (!settings.showWordClass && !settings.showPadanan && !settings.showDefinition) {
    return null;
  }
  const senses = data.senses.length
    ? data.senses
    : [
        {
          wordClassCode: data.wordClassCode,
          padanan: data.padanan,
          definition: data.definition,
        },
      ];
  const numbered = settings.showAllMeanings && senses.length > 1;
  const rows: ReactNode[] = [];

  for (let i = 0; i < senses.length; i++) {
    const sense = senses[i]!;
    const bracket = settings.showWordClass
      ? senseWordClassBracket(sense.wordClassCode)
      : null;
    const pad = settings.showPadanan ? (sense.padanan?.trim() ?? '') : '';
    const def = settings.showDefinition ? (sense.definition?.trim() ?? '') : '';
    if (!bracket && !pad && !def) continue;
    if (rows.length) rows.push(<div key={`gap-${i}`} style={{ height: 14 }} />);
    const lead = `${numbered ? `${i + 1} ` : ''}${bracket ? `${bracket} ` : ''}`;
    rows.push(
      <div key={i} style={{ textAlign: align }}>
        {pad ? (
          <div
            style={{
              fontFamily: shareBodyFontFamily(settings.fontPair),
              fontSize: padananSize,
              fontWeight: 500,
              color: lemmaColor,
              lineHeight: 1.35,
            }}
          >
            {lead}→ {pad}
          </div>
        ) : null}
        {def ? (
          <div
            style={{
              marginTop: pad ? 8 : 0,
              fontFamily: shareBodyFontFamily(settings.fontPair),
              fontSize: definitionSize,
              fontWeight: 500,
              color: bodyColor,
              lineHeight: 1.35,
              display: '-webkit-box',
              WebkitLineClamp: numbered ? 3 : 5,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {pad ? def : `${lead}${def}`}
          </div>
        ) : !pad && bracket ? (
          <div
            style={{
              fontFamily: shareBodyFontFamily(settings.fontPair),
              fontSize: definitionSize,
              color: bodyColor,
            }}
          >
            {lead}
          </div>
        ) : null}
      </div>,
    );
  }
  if (!rows.length) return null;

  return (
    <LaidOut
      id="definition"
      settings={settings}
      layoutEditMode={layoutEditMode}
      selected={selected}
      onSelect={onSelect}
      onPan={onPan}
    >
      <div>{rows}</div>
    </LaidOut>
  );
}

function VariantsAndTrust({
  data,
  settings,
  color,
  size,
  align = 'start',
}: {
  data: ShareCardData;
  settings: ShareEditorSettings;
  color: string;
  size: number;
  align?: 'start' | 'center';
}) {
  return (
    <div style={{ textAlign: align, marginTop: 10 }}>
      <div
        style={{
          fontFamily: shareBodyFontFamily(settings.fontPair),
          fontSize: size * 0.85,
          color,
          fontWeight: 500,
        }}
      >
        {shareTrustLabel(data.isVerified)}
      </div>
      {data.variantsLine ? (
        <div
          style={{
            marginTop: 10,
            fontFamily: shareBodyFontFamily(settings.fontPair),
            fontSize: size,
            color,
            fontWeight: 500,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {data.variantsLine}
        </div>
      ) : null}
    </div>
  );
}

function LemmaBlock({
  data,
  settings,
  color,
  size,
  align = 'start',
  layoutEditMode,
  selected,
  onSelect,
  onPan,
}: {
  data: ShareCardData;
  settings: ShareEditorSettings;
  color: string;
  size: number;
  align?: 'start' | 'center';
  layoutEditMode?: boolean;
  selected?: ShareTextElementId | null;
  onSelect?: (id: ShareTextElementId) => void;
  onPan?: (id: ShareTextElementId, dx: number, dy: number) => void;
}) {
  return (
    <LaidOut
      id="lemma"
      settings={settings}
      layoutEditMode={layoutEditMode}
      selected={selected}
      onSelect={onSelect}
      onPan={onPan}
    >
      <div
        style={{
          fontFamily: shareLemmaFontFamily(settings.fontPair),
          fontSize: size,
          fontWeight: 700,
          color,
          lineHeight: 1.05,
          letterSpacing: -0.5,
          textAlign: align,
        }}
      >
        {data.lemma}
      </div>
      <VariantsAndTrust
        data={data}
        settings={settings}
        color={color}
        size={Math.max(22, size * 0.22)}
        align={align}
      />
    </LaidOut>
  );
}

function ExampleBlock({
  data,
  settings,
  color,
  size,
  align = 'start',
  layoutEditMode,
  selected,
  onSelect,
  onPan,
}: {
  data: ShareCardData;
  settings: ShareEditorSettings;
  color: string;
  size: number;
  align?: 'start' | 'center';
  layoutEditMode?: boolean;
  selected?: ShareTextElementId | null;
  onSelect?: (id: ShareTextElementId) => void;
  onPan?: (id: ShareTextElementId, dx: number, dy: number) => void;
}) {
  if (!settings.showExample || !data.exampleSentence?.trim()) return null;
  return (
    <LaidOut
      id="example"
      settings={settings}
      layoutEditMode={layoutEditMode}
      selected={selected}
      onSelect={onSelect}
      onPan={onPan}
    >
      <div
        style={{
          marginTop: 20,
          fontFamily: shareBodyFontFamily(settings.fontPair),
          fontSize: size,
          fontStyle: 'italic',
          color,
          textAlign: align,
          lineHeight: 1.35,
        }}
      >
        “{data.exampleSentence.trim()}”
      </div>
    </LaidOut>
  );
}

function textClearanceBottom(
  showWatermark: boolean,
  hasCredit: boolean,
  anchorBottom = 48,
): number {
  if (!showWatermark) return 72;
  const chip = 16 * 2 + 40 + (hasCredit ? 8 + 22 * 1.35 : 0) + 2;
  return Math.max(72, anchorBottom + chip + 28);
}

export function ShareCardCanvas({
  data,
  template,
  ratio,
  settings,
  imageUrl,
  layoutEditMode,
  selectedElement,
  mediaSelected,
  onSelectElement,
  onPanElement,
  onSelectMedia,
  onPanMedia,
}: ShareCardCanvasProps) {
  const { width, height } = shareRatioSize(ratio);
  const gradient = shareBackdropColors(settings);
  const lemmaColor = shareTextColorLemma(settings.textColorId);
  const bodyColor = shareTextColorBody(settings.textColorId);
  const darkSurface = shareTextColorPrefersDarkSurface(settings.textColorId);
  const forceNoPhoto = shareTemplateForcesNoPhoto(template);
  const effectiveImage = forceNoPhoto ? null : imageUrl;
  const overlay = Math.min(1, Math.max(0, settings.overlayStrength));
  const lemmaSize = 120 * settings.lemmaFontScale;
  const bodySize = 40 * settings.bodyFontScale;
  const credit = shareCreditLine(data);
  const bottomPad = textClearanceBottom(settings.showWatermark, !!credit);

  const layoutProps = {
    layoutEditMode,
    selected: selectedElement,
    onSelect: onSelectElement,
    onPan: onPanElement,
  };

  const mediaProps = {
    imageUrl: effectiveImage,
    gradient,
    mediaAlignment: settings.mediaAlignment,
    layoutEditMode: layoutEditMode && !forceNoPhoto,
    mediaSelected,
    onSelectMedia,
    onPanMedia,
  };

  const content = (() => {
    switch (template) {
      case 'unsplash':
        return (
          <>
            <PhotoOrGradient {...mediaProps} />
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: `linear-gradient(180deg, rgba(0,0,0,${0.2 * overlay}) 0%, transparent 35%, rgba(0,0,0,${0.85 * overlay + 0.15}) 100%)`,
                pointerEvents: 'none',
              }}
            />
            <div
              style={{
                position: 'relative',
                zIndex: 2,
                height: '100%',
                boxSizing: 'border-box',
                padding: `160px 72px ${bottomPad}px`,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-end',
                pointerEvents: layoutEditMode ? 'auto' : 'none',
              }}
            >
              <LemmaBlock
                data={data}
                settings={settings}
                color={lemmaColor}
                size={lemmaSize}
                {...layoutProps}
              />
              <div style={{ height: 28 }} />
              <MeaningBlock
                data={data}
                settings={settings}
                lemmaColor={lemmaColor}
                bodyColor={bodyColor}
                padananSize={bodySize}
                definitionSize={bodySize * 0.9}
                {...layoutProps}
              />
              <ExampleBlock
                data={data}
                settings={settings}
                color={bodyColor}
                size={bodySize * 0.85}
                {...layoutProps}
              />
            </div>
          </>
        );

      case 'kamusEditorial':
        return (
          <>
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: darkSurface ? '#101826' : '#F8F4EC',
              }}
            />
            {effectiveImage ? (
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '42%',
                  overflow: 'hidden',
                }}
              >
                <PhotoOrGradient {...mediaProps} />
              </div>
            ) : null}
            <div
              style={{
                position: 'relative',
                zIndex: 2,
                height: '100%',
                boxSizing: 'border-box',
                padding: effectiveImage
                  ? `calc(42% + 48px) 80px ${bottomPad}px`
                  : `160px 80px ${bottomPad}px`,
                pointerEvents: layoutEditMode ? 'auto' : 'none',
              }}
            >
              <div
                style={{
                  fontFamily: shareBodyFontFamily(settings.fontPair),
                  fontSize: 28,
                  color: darkSurface ? '#A5B4CF' : '#78716C',
                  fontWeight: 600,
                  marginBottom: 24,
                }}
              >
                Kamus Sambas
              </div>
              <LemmaBlock
                data={data}
                settings={settings}
                color={darkSurface ? '#FFFFFF' : lemmaColor}
                size={lemmaSize * 0.95}
                {...layoutProps}
              />
              <div style={{ height: 32 }} />
              <MeaningBlock
                data={data}
                settings={settings}
                lemmaColor={darkSurface ? '#FFFFFF' : lemmaColor}
                bodyColor={darkSurface ? '#C3CFE6' : bodyColor}
                padananSize={bodySize}
                definitionSize={bodySize * 0.9}
                {...layoutProps}
              />
              <ExampleBlock
                data={data}
                settings={settings}
                color={darkSurface ? '#C3CFE6' : bodyColor}
                size={bodySize * 0.85}
                {...layoutProps}
              />
            </div>
          </>
        );

      case 'posterHuruf':
        return (
          <>
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: gradientCss(gradient),
              }}
            />
            <div
              style={{
                position: 'relative',
                zIndex: 2,
                height: '100%',
                boxSizing: 'border-box',
                padding: `120px 64px ${bottomPad}px`,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                pointerEvents: layoutEditMode ? 'auto' : 'none',
              }}
            >
              <LemmaBlock
                data={data}
                settings={settings}
                color={lemmaColor}
                size={lemmaSize * 1.35}
                align="center"
                {...layoutProps}
              />
              <div style={{ height: 40 }} />
              <MeaningBlock
                data={data}
                settings={settings}
                lemmaColor={lemmaColor}
                bodyColor={bodyColor}
                padananSize={bodySize}
                definitionSize={bodySize * 0.9}
                align="center"
                {...layoutProps}
              />
            </div>
          </>
        );

      case 'polaroid':
        return (
          <>
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: darkSurface ? '#1C1917' : '#E7E5E4',
              }}
            />
            <div
              style={{
                position: 'absolute',
                inset: '72px 72px 220px',
                background: '#fff',
                padding: 28,
                boxSizing: 'border-box',
                boxShadow: '0 18px 40px rgba(0,0,0,0.25)',
              }}
            >
              <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                <PhotoOrGradient {...mediaProps} />
              </div>
            </div>
            <div
              style={{
                position: 'absolute',
                left: 72,
                right: 72,
                bottom: bottomPad,
                zIndex: 2,
                pointerEvents: layoutEditMode ? 'auto' : 'none',
              }}
            >
              <LemmaBlock
                data={data}
                settings={settings}
                color={lemmaColor}
                size={lemmaSize * 0.7}
                {...layoutProps}
              />
              <div style={{ height: 16 }} />
              <MeaningBlock
                data={data}
                settings={settings}
                lemmaColor={lemmaColor}
                bodyColor={bodyColor}
                padananSize={bodySize * 0.9}
                definitionSize={bodySize * 0.8}
                {...layoutProps}
              />
            </div>
          </>
        );

      case 'sisi': {
        const side = shareRatioPrefersSideSplit(ratio);
        return (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: side ? 'row' : 'column',
              background: darkSurface ? '#0F172A' : '#F5F5F4',
            }}
          >
            <div style={{ flex: 1, position: 'relative', minHeight: side ? undefined : '48%' }}>
              <PhotoOrGradient {...mediaProps} />
            </div>
            <div
              style={{
                flex: 1,
                boxSizing: 'border-box',
                padding: side ? `80px 56px ${bottomPad}px` : `48px 64px ${bottomPad}px`,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                pointerEvents: layoutEditMode ? 'auto' : 'none',
                zIndex: 2,
              }}
            >
              <LemmaBlock
                data={data}
                settings={settings}
                color={lemmaColor}
                size={lemmaSize * 0.75}
                {...layoutProps}
              />
              <div style={{ height: 24 }} />
              <MeaningBlock
                data={data}
                settings={settings}
                lemmaColor={lemmaColor}
                bodyColor={bodyColor}
                padananSize={bodySize * 0.9}
                definitionSize={bodySize * 0.8}
                {...layoutProps}
              />
              <ExampleBlock
                data={data}
                settings={settings}
                color={bodyColor}
                size={bodySize * 0.8}
                {...layoutProps}
              />
            </div>
          </div>
        );
      }

      case 'kaca':
        return (
          <>
            <PhotoOrGradient {...mediaProps} />
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: `rgba(0,0,0,${0.35 * overlay})`,
                pointerEvents: 'none',
              }}
            />
            <div
              style={{
                position: 'absolute',
                left: 64,
                right: 64,
                bottom: bottomPad,
                padding: 40,
                borderRadius: 28,
                background: 'rgba(255,255,255,0.14)',
                border: '1px solid rgba(255,255,255,0.28)',
                backdropFilter: 'blur(18px)',
                WebkitBackdropFilter: 'blur(18px)',
                zIndex: 2,
                pointerEvents: layoutEditMode ? 'auto' : 'none',
              }}
            >
              <LemmaBlock
                data={data}
                settings={settings}
                color={lemmaColor}
                size={lemmaSize * 0.85}
                {...layoutProps}
              />
              <div style={{ height: 20 }} />
              <MeaningBlock
                data={data}
                settings={settings}
                lemmaColor={lemmaColor}
                bodyColor={bodyColor}
                padananSize={bodySize}
                definitionSize={bodySize * 0.9}
                {...layoutProps}
              />
            </div>
          </>
        );

      case 'kutipan':
        return (
          <>
            <PhotoOrGradient {...mediaProps} />
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: `rgba(15,23,42,${0.55 * overlay + 0.2})`,
                pointerEvents: 'none',
              }}
            />
            <div
              style={{
                position: 'relative',
                zIndex: 2,
                height: '100%',
                boxSizing: 'border-box',
                padding: `140px 80px ${bottomPad}px`,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                pointerEvents: layoutEditMode ? 'auto' : 'none',
              }}
            >
              <div
                style={{
                  fontFamily: shareLemmaFontFamily(settings.fontPair),
                  fontSize: 120,
                  color: 'rgba(255,255,255,0.35)',
                  lineHeight: 1,
                  marginBottom: 8,
                }}
              >
                “
              </div>
              <LemmaBlock
                data={data}
                settings={settings}
                color={lemmaColor}
                size={lemmaSize * 0.9}
                align="center"
                {...layoutProps}
              />
              <div style={{ height: 28 }} />
              <MeaningBlock
                data={data}
                settings={settings}
                lemmaColor={lemmaColor}
                bodyColor={bodyColor}
                padananSize={bodySize}
                definitionSize={bodySize * 0.9}
                align="center"
                {...layoutProps}
              />
              <ExampleBlock
                data={data}
                settings={settings}
                color={bodyColor}
                size={bodySize * 0.85}
                align="center"
                {...layoutProps}
              />
            </div>
          </>
        );

      case 'kartu':
        return (
          <>
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: gradientCss(gradient),
              }}
            />
            <div
              style={{
                position: 'absolute',
                inset: 56,
                borderRadius: 36,
                overflow: 'hidden',
                background: darkSurface ? 'rgba(15,23,42,0.88)' : 'rgba(255,255,255,0.92)',
                boxShadow: '0 24px 60px rgba(0,0,0,0.28)',
              }}
            >
              {effectiveImage ? (
                <div style={{ position: 'absolute', inset: 0, opacity: 0.35 }}>
                  <PhotoOrGradient {...mediaProps} />
                </div>
              ) : null}
              <div
                style={{
                  position: 'relative',
                  zIndex: 2,
                  height: '100%',
                  boxSizing: 'border-box',
                  padding: `72px 56px ${Math.max(56, bottomPad - 40)}px`,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'flex-end',
                  pointerEvents: layoutEditMode ? 'auto' : 'none',
                }}
              >
                <LemmaBlock
                  data={data}
                  settings={settings}
                  color={lemmaColor}
                  size={lemmaSize * 0.85}
                  {...layoutProps}
                />
                <div style={{ height: 24 }} />
                <MeaningBlock
                  data={data}
                  settings={settings}
                  lemmaColor={lemmaColor}
                  bodyColor={bodyColor}
                  padananSize={bodySize}
                  definitionSize={bodySize * 0.9}
                  {...layoutProps}
                />
                <ExampleBlock
                  data={data}
                  settings={settings}
                  color={bodyColor}
                  size={bodySize * 0.85}
                  {...layoutProps}
                />
              </div>
            </div>
          </>
        );
    }
  })();

  return (
    <div
      style={{
        width,
        height,
        position: 'relative',
        overflow: 'hidden',
        background: '#000',
        fontSynthesis: 'none',
      }}
    >
      {content}
      {settings.showWatermark ? (
        <Watermark data={data} pair={settings.fontPair} />
      ) : null}
    </div>
  );
}
