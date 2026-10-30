import { useEffect, useState } from 'react';
import {
  Button,
  Container,
  Group,
  Paper,
  Select,
  Stack,
  Switch,
  Text,
  Textarea,
  TextInput,
  Title,
} from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { apiClient, AppError } from '@/infrastructure/api/api-client';
import {
  AnalyticsEvents,
  trackEvent,
} from '@/infrastructure/analytics/analytics';
import { formError } from '@/application/utils/form-error';
import { fetchUsahaCategories } from '@/domain/usaha';
import { submitUsahaContribution } from '@/domain/usaha-contributions';
import type { UsahaKind } from '@/domain/usaha-parse';
import { inSambas, PlaceMap } from '@/presentation/places/place-map';

/**
 * Form usulan usaha. Boleh anonim - tidak butuh token, API yang batasi
 * 5/jam per IP. Foto sampul lewat URL https (unggah gambar butuh login).
 */
const KINDS: Array<{ value: UsahaKind; labelKey: string }> = [
  { value: 'product', labelKey: 'usaha_kindProduct' },
  { value: 'service', labelKey: 'usaha_kindService' },
  { value: 'both', labelKey: 'usaha_kindBoth' },
];

export function UsahaContributeForm() {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [kind, setKind] = useState<string | null>('product');
  const [regionId, setRegionId] = useState<string | null>(null);
  const [villageId, setVillageId] = useState<string | null>(null);
  const [address, setAddress] = useState('');
  const [point, setPoint] = useState<{ lat: number; lng: number } | null>(null);
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [website, setWebsite] = useState('');
  const [social, setSocial] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [wantsClaim, setWantsClaim] = useState(false);
  const [categories, setCategories] = useState<Array<{ value: string; label: string }>>([]);
  const [regions, setRegions] = useState<Array<{ value: string; label: string }>>([]);
  const [villages, setVillages] = useState<Array<{ value: string; label: string }>>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    trackEvent(AnalyticsEvents.usahaContributeOpen);
    fetchUsahaCategories().then((items) =>
      setCategories(items.map((c) => ({ value: c.id, label: c.name }))),
    );
    void apiClient<{ items: Array<{ id: string; name: string }> }>(
      '/regions?type=kecamatan&limit=100',
    )
      .then((res) =>
        setRegions(res.data.items.map((row) => ({ value: row.id, label: row.name }))),
      )
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!regionId) {
      setVillages([]);
      return;
    }
    void apiClient<{ items: Array<{ id: string; name: string }> }>(
      `/regions?type=desa&parent_id=${encodeURIComponent(regionId)}&limit=200`,
    )
      .then((res) =>
        setVillages(res.data.items.map((row) => ({ value: row.id, label: row.name }))),
      )
      .catch(() => {});
  }, [regionId]);

  async function submit() {
    if (name.trim().length < 3 || !regionId) {
      setError(t('usaha_contributeRequired'));
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await submitUsahaContribution({
        name: name.trim(),
        region_id: regionId,
        description: description.trim() || null,
        category_id: categoryId,
        kind: (kind as UsahaKind | null) ?? 'product',
        village_id: villageId,
        address_text: address.trim() || null,
        lat: point && inSambas(point.lat, point.lng) ? point.lat : null,
        lng: point && inSambas(point.lat, point.lng) ? point.lng : null,
        phone: phone.trim() || null,
        whatsapp: whatsapp.trim() || null,
        website: /^https:\/\//.test(website.trim()) ? website.trim() : null,
        social_url: /^https:\/\//.test(social.trim()) ? social.trim() : null,
        cover_url: /^https:\/\//.test(coverUrl.trim()) ? coverUrl.trim() : null,
        wants_claim: wantsClaim,
      });
      trackEvent(AnalyticsEvents.usahaContributeSubmit);
      setDone(true);
    } catch (err) {
      const message =
        err instanceof AppError && err.details?.length
          ? err.details.map((d) => d.message).filter(Boolean).join(' ')
          : formError(err, 'Gagal mengirim usulan');
      setError(message);
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <Container size="sm" py={28}>
        <Paper withBorder radius="md" p="lg">
          <Stack gap={6}>
            <Title order={3} fw={700}>
              {t('usaha_contributeSuccessTitle')}
            </Title>
            <Text size="sm" c="dimmed">
              {t('usaha_contributeSuccessBody')}
            </Text>
          </Stack>
        </Paper>
      </Container>
    );
  }

  return (
    <Container size="sm" py={28}>
      <Stack gap="lg">
        <Stack gap={4}>
          <Title order={1} size="h3">
            {t('usaha_contributeTitle')}
          </Title>
          <Text size="sm" c="dimmed">
            {t('usaha_contributeIntro')}
          </Text>
        </Stack>

        <Paper withBorder radius="md" p="lg">
          <Stack>
            <TextInput
              label={t('usaha_contributeFieldName')}
              required
              value={name}
              onChange={(e) => setName(e.currentTarget.value)}
            />
            <Textarea
              label={t('usaha_contributeFieldDescription')}
              minRows={3}
              value={description}
              onChange={(e) => setDescription(e.currentTarget.value)}
            />
            <Group grow align="flex-start">
              <Select
                label={t('usaha_contributeFieldCategory')}
                data={categories}
                value={categoryId}
                onChange={setCategoryId}
                searchable
                clearable
              />
              <Select
                label={t('usaha_contributeFieldKind')}
                data={KINDS.map((k) => ({ value: k.value, label: t(k.labelKey) }))}
                value={kind}
                onChange={setKind}
                allowDeselect={false}
              />
            </Group>
          </Stack>
        </Paper>

        <Paper withBorder radius="md" p="lg">
          <Stack>
            <Group grow align="flex-start">
              <Select
                label={t('usaha_contributeFieldRegion')}
                required
                data={regions}
                value={regionId}
                onChange={(value) => {
                  setRegionId(value);
                  setVillageId(null);
                }}
                searchable
              />
              <Select
                label={t('usaha_contributeFieldVillage')}
                data={villages}
                value={villageId}
                onChange={setVillageId}
                searchable
                clearable
                disabled={!regionId}
              />
            </Group>
            <TextInput
              label={t('usaha_contributeFieldAddress')}
              value={address}
              onChange={(e) => setAddress(e.currentTarget.value)}
            />
            <PlaceMap value={point} onChange={setPoint} />
          </Stack>
        </Paper>

        <Paper withBorder radius="md" p="lg">
          <Stack>
            <TextInput
              label={t('usaha_contributeFieldPhone')}
              value={phone}
              onChange={(e) => setPhone(e.currentTarget.value)}
            />
            <TextInput
              label={t('usaha_contributeFieldWhatsapp')}
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.currentTarget.value)}
            />
            <TextInput
              label={t('usaha_contributeFieldWebsite')}
              placeholder="https://"
              value={website}
              onChange={(e) => setWebsite(e.currentTarget.value)}
            />
            <TextInput
              label={t('usaha_contributeFieldSocial')}
              placeholder="https://instagram.com/..."
              value={social}
              onChange={(e) => setSocial(e.currentTarget.value)}
            />
            <TextInput
              label={t('usaha_contributeFieldCover')}
              placeholder="https://"
              value={coverUrl}
              onChange={(e) => setCoverUrl(e.currentTarget.value)}
            />
            <Switch
              label={t('usaha_contributeFieldClaim')}
              description={t('usaha_contributeFieldClaimDesc')}
              checked={wantsClaim}
              onChange={(e) => setWantsClaim(e.currentTarget.checked)}
            />
          </Stack>
        </Paper>

        {error ? <Text c="red">{error}</Text> : null}
        <Button onClick={() => void submit()} loading={busy}>
          {t('usaha_contributeSubmit')}
        </Button>
      </Stack>
    </Container>
  );
}
