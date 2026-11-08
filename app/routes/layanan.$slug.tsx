import { Link, useLoaderData } from 'react-router';
import { Anchor, Button, Container, Group, Image, Stack, Text, Title } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import type { Route } from './+types/layanan.$slug';
import { buildMetaTags } from '@/application/utils/seo';
import { DEFAULT_LOCALE, isAppLocale, localePath } from '@/application/i18n/locales';
import { getFixedT } from '@/application/i18n/i18n-instance';
import { useLocalePath } from '@/application/i18n/use-locale';
import { fetchLayananBySlug } from '@/domain/layanan';
import { withSambaskuUtm } from '@/presentation/utils/external-link';

export function meta({ params, loaderData }: Route.MetaArgs) {
  const locale = isAppLocale(params.locale) ? params.locale : DEFAULT_LOCALE;
  const t = getFixedT(locale);
  return buildMetaTags({
    title: loaderData?.item ? `${loaderData.item.name} - ${t('layanan_title')}` : t('layanan_title'),
    description: t('layanan_seoDescription'),
    path: localePath(locale, `/layanan/${params.slug ?? ''}`),
    locale,
  });
}

export async function loader({ params, request }: Route.LoaderArgs) {
  const item = await fetchLayananBySlug(params.slug ?? '', request.signal);
  if (!item) throw new Response('Layanan tidak ditemukan', { status: 404 });
  return { item };
}

function day(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso.slice(0, 10);
  const d = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${d}-${m}-${date.getFullYear()}`;
}

export default function LayananDetailPage() {
  const { item } = useLoaderData<typeof loader>();
  const { t } = useTranslation();
  const lp = useLocalePath();
  const map = item.mapsUrl
    ? withSambaskuUtm(item.mapsUrl)
    : item.lat != null && item.lng != null
      ? withSambaskuUtm(`https://www.google.com/maps?q=${item.lat},${item.lng}`)
      : null;

  return (
    <Container size="sm" py="xl">
      <Stack gap="md">
        <Anchor component={Link} to={lp('/layanan')}>{t('layanan_title')}</Anchor>
        {item.logoUrl ? (
          <Image src={item.logoUrl} alt="" w={72} h={72} radius="md" fit="cover" />
        ) : null}
        <Title order={1}>{item.name}</Title>
        <Text c="dimmed">{t('layanan_checked', { date: day(item.updatedAt) })}</Text>
        {item.regionName ? <Text>{item.regionName}</Text> : null}
        {item.addressText ? <Text>{item.addressText}</Text> : null}
        {item.note ? <Text>{item.note}</Text> : null}
        <Stack gap="xs">
          {item.phones.map((phone) => {
            const waDigits = phone.whatsapp?.replace(/\D/g, '');
            return (
              <Group key={`${phone.phone}-${phone.note ?? ''}`} justify="space-between" wrap="wrap">
                <Stack gap={0}>
                  <Text>{phone.phone}</Text>
                  {phone.note ? <Text size="sm" c="dimmed">{phone.note}</Text> : null}
                </Stack>
                <Group gap="xs">
                  <Button component="a" href={`tel:${phone.phone}`}>{t('layanan_call')}</Button>
                  {waDigits ? (
                    <Anchor
                      href={withSambaskuUtm(`https://wa.me/${waDigits}`)}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {t('layanan_whatsapp')}
                    </Anchor>
                  ) : null}
                </Group>
              </Group>
            );
          })}
        </Stack>
        {map ? (
          <Anchor href={map} target="_blank" rel="noreferrer">{t('layanan_map')}</Anchor>
        ) : null}
        <Anchor component={Link} to={lp(`/layanan/kontribusi?region=${item.regionId}&edit=${item.slug}`)}>
          {t('layanan_proposeEdit')}
        </Anchor>
      </Stack>
    </Container>
  );
}
