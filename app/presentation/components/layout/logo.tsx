import { Image } from '@mantine/core';

/** Dimensi intrinsik aset /logo_hor_{light,dark}.webp (333×96). */
const LOGO_ASPECT = 333 / 96;

interface LogoProps {
  h: number;
  /** Logo di atas lipatan (header): prioritaskan fetch, tanpa lazy. */
  eager?: boolean;
}

/**
 * Dua varian logo dirender bersamaan, satu disembunyikan via CSS
 * (lightHidden/darkHidden) berdasarkan data-mantine-color-scheme yang
 * dipasang ColorSchemeScript SEBELUM hidrasi - jadi tidak pernah salah
 * varian pada frame pertama (beda dengan pendekatan hook yang ganti
 * gambar SETELAH efek jalan = flash logo terang di tema dark).
 *
 * Width eksplisit dari aspek rasio: hindari unsized-images / CLS.
 */
export function Logo({ h, eager }: LogoProps) {
  const w = Math.round(h * LOGO_ASPECT);
  const loadProps = eager
    ? { fetchPriority: 'high' as const }
    : { loading: 'lazy' as const };

  return (
    <>
      <Image
        src="/logo_hor_dark.webp"
        alt="SambasKu"
        h={h}
        w={w}
        fit="contain"
        decoding="async"
        lightHidden
        {...loadProps}
      />
      <Image
        src="/logo_hor_light.webp"
        alt="SambasKu"
        h={h}
        w={w}
        fit="contain"
        decoding="async"
        darkHidden
        {...loadProps}
      />
    </>
  );
}
