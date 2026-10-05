import type { TFunction } from 'i18next';
import type { LucideIcon } from 'lucide-react';
import { Compass, List, PlusCircle, Search } from 'lucide-react';

type LocalePath = (path?: string, search?: string) => string;

export type PrimaryNavItem = {
  to: string;
  bare: string;
  label: string;
  icon: LucideIcon;
};

/** Nav chrome ringkas: Eksplorasi, A-Z, Cari, Daftarkan. Wisata/kuliner via Eksplorasi. */
export function primaryNavItems(
  t: TFunction,
  lp: LocalePath,
): PrimaryNavItem[] {
  return [
    {
      to: lp('/eksplorasi'),
      bare: '/eksplorasi',
      label: t('explore_heading'),
      icon: Compass,
    },
    { to: lp('/words'), bare: '/words', label: t('nav_words'), icon: List },
    { to: lp('/search'), bare: '/search', label: t('nav_search'), icon: Search },
    {
      to: lp('/kontribusi', '?from=nav'),
      bare: '/kontribusi',
      label: t('nav_contribute'),
      icon: PlusCircle,
    },
  ];
}
