import { toBlob, toPng } from 'html-to-image';

export type ShareExportMethod =
  | 'native_file'
  | 'download'
  | 'clipboard_link';

function canShareFiles(file: File): boolean {
  if (typeof navigator === 'undefined' || typeof navigator.share !== 'function') {
    return false;
  }
  if (typeof navigator.canShare !== 'function') {
    return true;
  }
  try {
    return navigator.canShare({ files: [file] });
  } catch {
    return false;
  }
}

/**
 * Siapkan <img> di clone: same-origin tanpa crossOrigin; eksternal tetap
 * anonymous. Hapus query cache-bust yang merusak CORS.
 */
function prepareImagesForExport(root: HTMLElement): void {
  root.querySelectorAll('img').forEach((img) => {
    const el = img as HTMLImageElement;
    try {
      const src = el.currentSrc || el.src;
      if (!src) return;
      const url = new URL(src, window.location.href);
      if (url.origin === window.location.origin) {
        el.removeAttribute('crossorigin');
      } else if (!el.crossOrigin) {
        el.crossOrigin = 'anonymous';
      }
    } catch {
      // ignore URL rusak
    }
  });
}

/** Soften CSS yang sering merusak html-to-image (backdrop-filter, dll). */
function softenUnsupportedStyles(root: HTMLElement): void {
  root.querySelectorAll<HTMLElement>('*').forEach((el) => {
    const style = el.style as CSSStyleDeclaration & {
      webkitBackdropFilter?: string;
    };
    if (style.backdropFilter || style.webkitBackdropFilter) {
      style.backdropFilter = 'none';
      style.webkitBackdropFilter = 'none';
      if (!style.background || style.background === 'transparent') {
        style.background = 'rgba(0,0,0,0.45)';
      }
    }
  });
}

/**
 * DOM → PNG. Node harus ukuran desain penuh (tanpa transform scale di dirinya).
 * Parent boleh di-scale untuk preview.
 */
export async function exportShareCardPng(
  node: HTMLElement,
  size: { width: number; height: number },
): Promise<{ blob: Blob; dataUrl: string }> {
  const opts = {
    width: size.width,
    height: size.height,
    // 1 cukup: node sudah 1080 lebar desain.
    pixelRatio: 1 as const,
    // cacheBust menambah ?t=... ke URL gambar → sering mematahkan CORS.
    cacheBust: false,
    // Skip font embedding yang gagal di beberapa browser; pakai font ter-load.
    skipFonts: true,
    style: {
      transform: 'none',
      transformOrigin: 'top left',
      width: `${size.width}px`,
      height: `${size.height}px`,
      margin: '0',
      inset: 'auto',
    },
    filter: (domNode: HTMLElement) => {
      // Jangan ikut sertakan input file tersembunyi dsb.
      if (domNode.tagName === 'INPUT') return false;
      return true;
    },
    onclone: (_doc: Document, cloned: HTMLElement) => {
      prepareImagesForExport(cloned);
      softenUnsupportedStyles(cloned);
      cloned.style.transform = 'none';
      cloned.style.width = `${size.width}px`;
      cloned.style.height = `${size.height}px`;
    },
  };

  let dataUrl: string;
  try {
    dataUrl = await toPng(node, opts);
  } catch (err) {
    console.error('[share] toPng gagal', err);
    throw err;
  }

  let blob: Blob | null = null;
  try {
    blob = await toBlob(node, opts);
  } catch (err) {
    console.warn('[share] toBlob gagal, fallback fetch dataUrl', err);
  }
  if (!blob) {
    blob = await (await fetch(dataUrl)).blob();
  }
  if (!blob || blob.size === 0) {
    throw new Error('PNG kosong');
  }
  return { blob, dataUrl };
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export async function shareOrDownloadPng(opts: {
  blob: Blob;
  filename: string;
  caption: string;
  url: string;
  title: string;
}): Promise<ShareExportMethod> {
  const file = new File([opts.blob], opts.filename, { type: 'image/png' });

  if (canShareFiles(file)) {
    try {
      await navigator.share({
        files: [file],
        title: opts.title,
        text: opts.caption,
        url: opts.url,
      });
      return 'native_file';
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        throw err;
      }
    }
  }

  downloadBlob(opts.blob, opts.filename);
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(opts.caption);
    } catch {
      // unduh sudah sukses
    }
  }
  return 'download';
}

/** Salin URL saja - tanpa navigator.share (itu memunculkan sheet native). */
export async function copyLinkToClipboard(url: string): Promise<'clipboard_link'> {
  if (typeof navigator === 'undefined' || !navigator.clipboard?.writeText) {
    throw new Error('Clipboard tidak tersedia');
  }
  await navigator.clipboard.writeText(url);
  return 'clipboard_link';
}
