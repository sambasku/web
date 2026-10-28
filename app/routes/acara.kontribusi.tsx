import type { Route } from './+types/acara.kontribusi';
import { buildMetaTags } from '@/application/utils/seo';
import {
  DEFAULT_LOCALE,
  isAppLocale,
  localePath,
} from '@/application/i18n/locales';
import { getFixedT } from '@/application/i18n/i18n-instance';
import { EventContributeForm } from '@/presentation/events/event-contribute-form';

export function meta({ params }: Route.MetaArgs) {
  const locale = isAppLocale(params.locale) ? params.locale : DEFAULT_LOCALE;
  const t = getFixedT(locale);
  return buildMetaTags({
    title: t('event_contributeTitle'),
    description: t('event_contributeIntro'),
    path: localePath(locale, '/acara/kontribusi'),
    locale,
    noindexAlways: true,
  });
}

export default function EventKontribusiPage() {
  return <EventContributeForm />;
}
