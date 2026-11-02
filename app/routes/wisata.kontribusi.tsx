import type { Route } from './+types/wisata.kontribusi';
import { buildMetaTags } from '@/application/utils/seo';
import { DEFAULT_LOCALE, isAppLocale, localePath } from '@/application/i18n/locales';
import { ContributeForm } from '@/presentation/places/contribute-form';

export function meta({ params }: Route.MetaArgs) {
  const locale = isAppLocale(params.locale) ? params.locale : DEFAULT_LOCALE;
  return buildMetaTags({
    title: 'Usulkan wisata',
    description: 'Kirim usulan tempat wisata di Kabupaten Sambas.',
    path: localePath(locale, '/wisata/kontribusi'),
    locale,
    noindexAlways: true,
  });
}

export default function WisataKontribusiPage() {
  return <ContributeForm mode="create" />;
}
