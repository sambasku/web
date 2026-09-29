import type { TFunction } from 'i18next';
import type { LucideIcon } from 'lucide-react';
import { List, PlusCircle, Search } from 'lucide-react';

type LocalePath = (path?: string, search?: string) => string;

export type PrimaryNavItem = {
  to: string;
  bare: string;
  label: string;
  icon: LucideIcon;
};

/** Nav chrome ringkas: A-Z, Cari, Daftarkan. Tanya/FAQ di footer. */
export function primaryNavItems(
  t: TFunction,
  lp: LocalePath,
): PrimaryNavItem[] {
  return [
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
