import { redirect, type LoaderFunctionArgs } from 'react-router';
import {
  DEFAULT_LOCALE,
  isAppLocale,
  localePath,
  stripLocalePrefix,
} from '@/application/i18n/locales';
import { env } from '@/infrastructure/config/env';

/**
 * Path lama `/bantuan-terjemahan` → `/ruang-diskusi` (dengan locale).
 * Cover: tanpa locale, `/:locale/bantuan-terjemahan`, dan `.../:id`.
 */
export async function loader({ request, params }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const { path, locale: strippedLocale } = stripLocalePrefix(url.pathname);
  const locale =
    (params.locale && isAppLocale(params.locale) ? params.locale : null) ??
    strippedLocale ??
    DEFAULT_LOCALE;

  const match = path.match(/^\/bantuan-terjemahan(?:\/([^/]+))?$/);
  const id = match?.[1] ?? params.id;
  const targetPath = id
    ? `/ruang-diskusi/${encodeURIComponent(id)}`
    : '/ruang-diskusi';

  throw redirect(
    localePath(locale, targetPath, url.search),
    env.isProd ? 301 : 302,
  );
}

export default function BantuanTerjemahanRedirect() {
  return null;
}
