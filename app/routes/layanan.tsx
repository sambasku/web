import { useEffect, useMemo, useState } from 'react';
import { Link, useLoaderData, useSearchParams } from 'react-router';
import { Anchor, Button, Container, Group, Select, Stack, Text, Title } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import type { Route } from './+types/layanan';
import { buildMetaTags } from '@/application/utils/seo';
import { DEFAULT_LOCALE, isAppLocale, localePath } from '@/application/i18n/locales';
import { getFixedT } from '@/application/i18n/i18n-instance';
import { useLocalePath } from '@/application/i18n/use-locale';
import { fetchKecamatan, fetchLayanan, type Layanan } from '@/domain/layanan';

const REGION_KEY = 'layanan_region_id';

export function meta({ params }: Route.MetaArgs) {
  const locale = isAppLocale(params.locale) ? params.locale : DEFAULT_LOCALE;
  const t = getFixedT(locale);
  return buildMetaTags({
    title: t('layanan_seoTitle'),
    description: t('layanan_seoDescription'),
    path: localePath(locale, '/layanan'),
    locale,
  });
}

export async function loader({ request }: Route.LoaderArgs) {
  const region = new URL(request.url).searchParams.get('region') ?? undefined;
  const [items, regions] = await Promise.all([
    fetchLayanan(region, request.signal),
    fetchKecamatan(request.signal).catch(() => []),
  ]);
  if (!items) throw new Response('Gagal memuat layanan', { status: 503 });
  return { items, regions, region: region ?? null };
}

function day(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso.slice(0, 10);
  const d = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${d}-${m}-${date.getFullYear()}`;
}

function GroupList({ title, items }: { title: string; items: Layanan[] }) {
  const { t } = useTranslation();
  const lp = useLocalePath();
  return (
    <Stack gap="xs">
      <Title order={2} size="h4">{title}</Title>
      {items.length === 0 ? <Text c="dimmed">{t('layanan_categoryEmpty')}</Text> : null}
      {items.map((item) => {
        const primary = item.phones[0];
        const phoneLabel = primary
          ? primary.note
            ? `${primary.phone} · ${primary.note}`
            : primary.phone
          : t('layanan_categoryEmpty');
        const extra =
          item.phones.length > 1 ? ` · ${item.phones.length} nomor` : '';
        return (
          <Group key={item.id} justify="space-between" wrap="nowrap" align="flex-start">
            <Group gap="sm" wrap="nowrap" align="flex-start">
              {item.logoUrl ? (
                <Anchor component={Link} to={lp(`/layanan/${item.slug}`)}>
                  <img
                    src={item.logoUrl}
                    alt=""
                    width={40}
                    height={40}
                    style={{ borderRadius: 8, objectFit: 'cover' }}
                  />
                </Anchor>
              ) : null}
              <Stack gap={0}>
                <Anchor component={Link} to={lp(`/layanan/${item.slug}`)}>{item.name}</Anchor>
                <Text size="sm">{phoneLabel}{extra}</Text>
                <Text size="xs" c="dimmed">{t('layanan_checked', { date: day(item.updatedAt) })}</Text>
              </Stack>
            </Group>
            {primary ? (
              <Button component="a" href={`tel:${primary.phone}`} variant="light">
                {t('layanan_call')}
              </Button>
            ) : null}
          </Group>
        );
      })}
    </Stack>
  );
}

export default function LayananListPage() {
  const { items, regions, region } = useLoaderData<typeof loader>();
  const { t } = useTranslation();
  const lp = useLocalePath();
  const [params, setParams] = useSearchParams();
  const [remembered, setRemembered] = useState<string | null>(region);

  useEffect(() => {
    if (region) {
      localStorage.setItem(REGION_KEY, region);
      return;
    }
    const saved = localStorage.getItem(REGION_KEY) ?? regions[0]?.id ?? null;
    if (saved) setParams({ region: saved }, { replace: true });
    setRemembered(saved);
  }, [region, regions, setParams]);

  const current = region ?? remembered;
  const shown = useMemo(
    () => (current ? items.filter((item) => item.regionId === current || item.regionSlug === current) : items),
    [items, current],
  );

  return (
    <Container size="sm" py="xl">
      <Stack gap="lg">
        <Title order={1}>{t('layanan_title')}</Title>
        <Select
          label={t('layanan_pickRegion')}
          data={regions.map((r) => ({ value: r.id, label: r.name }))}
          value={current}
          onChange={(value) => {
            if (!value) return;
            localStorage.setItem(REGION_KEY, value);
            setParams({ region: value });
          }}
          searchable
        />
        {shown.length === 0 ? (
          <Stack>
            <Text>{t('layanan_empty')}</Text>
            <Anchor component={Link} to={lp(`/layanan/kontribusi${current ? `?region=${current}` : ''}`)}>
              {t('layanan_propose')}
            </Anchor>
          </Stack>
        ) : (
          <>
            <GroupList title={t('layanan_ambulance')} items={shown.filter((i) => i.category === 'ambulance')} />
            <GroupList title={t('layanan_fire')} items={shown.filter((i) => i.category === 'fire')} />
        <Anchor component={Link} to={lp(`/layanan/kontribusi${current ? `?region=${current}` : ''}`)}>
          {t('layanan_propose')}
        </Anchor>
          </>
        )}
      </Stack>
    </Container>
  );
}
