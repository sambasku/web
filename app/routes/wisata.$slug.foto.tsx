import { useLoaderData } from 'react-router';
import type { Route } from './+types/wisata.$slug.foto';
import { buildMetaTags } from '@/application/utils/seo';
import { DEFAULT_LOCALE, isAppLocale, localePath } from '@/application/i18n/locales';
import { fetchPlaceBySlug } from '@/domain/places';
import { ContributeForm } from '@/presentation/places/contribute-form';

export function meta({ params }: Route.MetaArgs) {
  const locale = isAppLocale(params.locale) ? params.locale : DEFAULT_LOCALE;
  return buildMetaTags({
    title: 'Tambah foto',
    description: 'Tambah foto tempat wisata. Kredit mengikuti akun kamu.',
    path: localePath(locale, `/wisata/${params.slug}/foto`),
    locale,
    noindexAlways: true,
  });
}

export async function loader({ params, request }: Route.LoaderArgs) {
  const place = await fetchPlaceBySlug(params.slug, request.signal).catch(() => null);
  return { place };
}

export default function WisataFotoPage() {
  const { place } = useLoaderData<typeof loader>();
  return <ContributeForm mode="photo" place={place} />;
}
