import type { Route } from './+types/usaha.kontribusi';
import { buildMetaTags } from '@/application/utils/seo';
import {
  DEFAULT_LOCALE,
  isAppLocale,
  localePath,
} from '@/application/i18n/locales';
import { getFixedT } from '@/application/i18n/i18n-instance';
import { UsahaContributeForm } from '@/presentation/usaha/usaha-contribute-form';

export function meta({ params }: Route.MetaArgs) {
  const locale = isAppLocale(params.locale) ? params.locale : DEFAULT_LOCALE;
  const t = getFixedT(locale);
  return buildMetaTags({
    title: t('usaha_contributeTitle'),
    description: t('usaha_contributeIntro'),
    path: localePath(locale, '/usaha/kontribusi'),
    locale,
    noindexAlways: true,
  });
}

export default function UsahaKontribusiPage() {
  return <UsahaContributeForm />;
}
