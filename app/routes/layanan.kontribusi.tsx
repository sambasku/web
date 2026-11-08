import { useEffect, useState } from 'react';
import { useLoaderData, useSearchParams } from 'react-router';
import { Button, Container, Group, Select, Stack, Text, TextInput, Title } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import type { Route } from './+types/layanan.kontribusi';
import { buildMetaTags } from '@/application/utils/seo';
import { DEFAULT_LOCALE, isAppLocale, localePath } from '@/application/i18n/locales';
import { getFixedT } from '@/application/i18n/i18n-instance';
import { fetchKecamatan, fetchLayananBySlug, submitLayanan, type LayananCategory } from '@/domain/layanan';
import { readAccessToken } from '@/infrastructure/auth/access-token';
import { AppError } from '@/infrastructure/api/api-client';

type PhoneDraft = { phone: string; note: string; whatsapp: string };

export function meta({ params }: Route.MetaArgs) {
  const locale = isAppLocale(params.locale) ? params.locale : DEFAULT_LOCALE;
  const t = getFixedT(locale);
  return buildMetaTags({
    title: t('layanan_propose'),
    description: t('layanan_seoDescription'),
    path: localePath(locale, '/layanan/kontribusi'),
    locale,
    noindexAlways: true,
  });
}

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const edit = url.searchParams.get('edit');
  const [regions, current] = await Promise.all([
    fetchKecamatan(request.signal).catch(() => []),
    edit ? fetchLayananBySlug(edit, request.signal) : Promise.resolve(null),
  ]);
  return { regions, current };
}

export default function LayananKontribusiPage() {
  const { regions, current } = useLoaderData<typeof loader>();
  const { t } = useTranslation();
  const [params] = useSearchParams();
  const [authed, setAuthed] = useState(false);
  const [category, setCategory] = useState<LayananCategory>(current?.category ?? 'ambulance');
  const [regionId, setRegionId] = useState(current?.regionId ?? params.get('region') ?? regions[0]?.id ?? '');
  const [name, setName] = useState(current?.name ?? '');
  const [logoUrl, setLogoUrl] = useState(current?.logoUrl ?? '');
  const [phones, setPhones] = useState<PhoneDraft[]>(
    current?.phones?.length
      ? current.phones.map((p) => ({
          phone: p.phone,
          note: p.note ?? '',
          whatsapp: p.whatsapp ?? '',
        }))
      : [{ phone: '', note: '', whatsapp: '' }],
  );
  const [note, setNote] = useState(current?.note ?? '');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setAuthed(!!readAccessToken());
  }, []);

  async function onSubmit() {
    if (!authed) return;
    const cleaned = phones
      .map((p) => ({
        phone: p.phone.trim(),
        note: p.note.trim() || null,
        whatsapp: p.whatsapp.trim() || null,
      }))
      .filter((p) => p.phone.length >= 8);
    if (name.trim().length < 2 || cleaned.length === 0 || !regionId) {
      setError(t('layanan_formInvalid'));
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await submitLayanan({
        kind: current ? 'edit' : 'new',
        layanan_id: current?.id,
        category,
        name: name.trim(),
        phones: cleaned,
        logo_url: logoUrl.trim() || null,
        region_id: regionId,
        note: note.trim() || null,
      });
      setSent(true);
    } catch (err) {
      setError(err instanceof AppError ? err.message : t('layanan_formInvalid'));
    } finally {
      setBusy(false);
    }
  }

  if (sent) {
    return (
      <Container size="sm" py="xl">
        <Text>{t('layanan_sent')}</Text>
      </Container>
    );
  }

  return (
    <Container size="sm" py="xl">
      <Stack gap="md">
        <Title order={1}>{current ? t('layanan_proposeEdit') : t('layanan_propose')}</Title>
        {authed ? null : <Text>{t('layanan_loginGate')}</Text>}
        <Select
          label={t('layanan_category')}
          data={[
            { value: 'ambulance', label: t('layanan_ambulance') },
            { value: 'fire', label: t('layanan_fire') },
          ]}
          value={category}
          onChange={(value) => setCategory((value as LayananCategory) ?? 'ambulance')}
        />
        <Select
          label={t('layanan_pickRegion')}
          data={regions.map((r) => ({ value: r.id, label: r.name }))}
          value={regionId}
          onChange={(value) => setRegionId(value ?? '')}
          searchable
        />
        <TextInput label={t('layanan_name')} value={name} onChange={(e) => setName(e.currentTarget.value)} />
        <TextInput
          label={t('layanan_logoUrl')}
          value={logoUrl}
          onChange={(e) => setLogoUrl(e.currentTarget.value)}
        />
        {phones.map((row, index) => (
          <Stack key={index} gap="xs">
            <Group justify="space-between">
              <Text fw={600}>{t('layanan_phone')} {index + 1}</Text>
              {phones.length > 1 ? (
                <Button
                  variant="subtle"
                  color="red"
                  size="compact-sm"
                  onClick={() => setPhones((prev) => prev.filter((_, i) => i !== index))}
                >
                  {t('layanan_removePhone')}
                </Button>
              ) : null}
            </Group>
            <TextInput
              label={t('layanan_phone')}
              value={row.phone}
              onChange={(e) => {
                const value = e.currentTarget.value;
                setPhones((prev) => prev.map((p, i) => (i === index ? { ...p, phone: value } : p)));
              }}
            />
            <TextInput
              label={t('layanan_phoneNote')}
              placeholder={t('layanan_phoneNoteHint')}
              value={row.note}
              onChange={(e) => {
                const value = e.currentTarget.value;
                setPhones((prev) => prev.map((p, i) => (i === index ? { ...p, note: value } : p)));
              }}
            />
            <TextInput
              label={t('layanan_whatsapp')}
              value={row.whatsapp}
              onChange={(e) => {
                const value = e.currentTarget.value;
                setPhones((prev) => prev.map((p, i) => (i === index ? { ...p, whatsapp: value } : p)));
              }}
            />
          </Stack>
        ))}
        {phones.length < 5 ? (
          <Button
            variant="light"
            onClick={() => setPhones((prev) => [...prev, { phone: '', note: '', whatsapp: '' }])}
          >
            {t('layanan_addPhone')}
          </Button>
        ) : null}
        <TextInput label={t('layanan_note')} value={note} onChange={(e) => setNote(e.currentTarget.value)} />
        {error ? <Text c="red">{error}</Text> : null}
        <Button onClick={onSubmit} loading={busy} disabled={!authed}>{t('layanan_submit')}</Button>
      </Stack>
    </Container>
  );
}
