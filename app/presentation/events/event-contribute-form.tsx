import { useEffect, useState } from 'react';
import {
  Button,
  Container,
  Group,
  Paper,
  Select,
  Stack,
  Text,
  Textarea,
  TextInput,
  Title,
} from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { apiClient, AppError } from '@/infrastructure/api/api-client';
import { formError } from '@/application/utils/form-error';
import { fetchEventCategories } from '@/domain/events';
import {
  submitEventContribution,
  type EventSourceType,
} from '@/domain/event-contributions';

/**
 * Form usulan acara. Boleh anonim - tidak butuh token, API yang batasi.
 * Field sumber (link original) disimpan bersih; UTM disisip saat render.
 */

const SOURCE_TYPES: Array<{ value: EventSourceType; labelKey: string }> = [
  { value: 'facebook', labelKey: 'event_sourceTypeFacebook' },
  { value: 'instagram', labelKey: 'event_sourceTypeInstagram' },
  { value: 'website', labelKey: 'event_sourceTypeWebsite' },
  { value: 'tiktok', labelKey: 'event_sourceTypeTiktok' },
  { value: 'youtube', labelKey: 'event_sourceTypeYoutube' },
  { value: 'whatsapp', labelKey: 'event_sourceTypeWhatsapp' },
  { value: 'other', labelKey: 'event_sourceTypeOther' },
];

export function EventContributeForm() {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [startsAt, setStartsAt] = useState('');
  const [endsAt, setEndsAt] = useState('');
  const [locationText, setLocationText] = useState('');
  const [organizer, setOrganizer] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [sourceType, setSourceType] = useState<string | null>(null);
  const [sourceAttribution, setSourceAttribution] = useState('');
  const [regionId, setRegionId] = useState<string | null>(null);
  const [villageId, setVillageId] = useState<string | null>(null);
  const [categories, setCategories] = useState<
    Array<{ value: string; label: string }>
  >([]);
  const [regions, setRegions] = useState<Array<{ value: string; label: string }>>([]);
  const [villages, setVillages] = useState<Array<{ value: string; label: string }>>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    void fetchEventCategories().then((items) => {
      setCategories(items.map((c) => ({ value: c.id, label: c.name })));
    });
    void apiClient<{ items: Array<{ id: string; name: string }> }>(
      '/regions?type=kecamatan&limit=100',
    )
      .then((res) => {
        setRegions(res.data.items.map((row) => ({ value: row.id, label: row.name })));
      })
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
      .then((res) => {
        setVillages(res.data.items.map((row) => ({ value: row.id, label: row.name })));
      })
      .catch(() => {});
  }, [regionId]);

  async function submit() {
    if (!name.trim() || !description.trim() || !categoryId || !startsAt || !endsAt || !locationText.trim()) {
      setError(t('event_contributeRequired'));
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await submitEventContribution({
        name: name.trim(),
        description: description.trim(),
        category_id: categoryId,
        starts_at: new Date(startsAt).toISOString(),
        ends_at: new Date(endsAt).toISOString(),
        location_text: locationText.trim(),
        organizer: organizer.trim() || null,
        source_url: sourceUrl.trim() || null,
        source_type: (sourceType as EventSourceType | null) ?? null,
        source_attribution: sourceAttribution.trim() || null,
        region_id: regionId,
        village_id: villageId,
      });
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
              {t('event_contributeSuccessTitle')}
            </Title>
            <Text size="sm" c="dimmed">
              {t('event_contributeSuccessBody')}
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
            {t('event_contributeTitle')}
          </Title>
          <Text size="sm" c="dimmed">
            {t('event_contributeIntro')}
          </Text>
        </Stack>

        <Paper withBorder radius="md" p="lg">
          <Stack>
            <TextInput
              label={t('event_contributeFieldName')}
              required
              value={name}
              onChange={(e) => setName(e.currentTarget.value)}
            />
            <Textarea
              label={t('event_contributeFieldDescription')}
              required
              minRows={4}
              value={description}
              onChange={(e) => setDescription(e.currentTarget.value)}
            />
            <Select
              label={t('event_contributeFieldCategory')}
              required
              data={categories}
              value={categoryId}
              onChange={setCategoryId}
              searchable
              allowDeselect={false}
            />
          </Stack>
        </Paper>

        <Paper withBorder radius="md" p="lg">
          <Stack>
            <Text fw={600}>{t('event_timeLabel')}</Text>
            <Group grow align="flex-start">
              <TextInput
                type="datetime-local"
                label={t('event_contributeFieldStartsAt')}
                required
                value={startsAt}
                onChange={(e) => setStartsAt(e.currentTarget.value)}
              />
              <TextInput
                type="datetime-local"
                label={t('event_contributeFieldEndsAt')}
                required
                value={endsAt}
                onChange={(e) => setEndsAt(e.currentTarget.value)}
              />
            </Group>
            <TextInput
              label={t('event_contributeFieldLocation')}
              description="Opsional. Nama tempat atau alamat acara."
              required
              value={locationText}
              onChange={(e) => setLocationText(e.currentTarget.value)}
            />
            <Group grow align="flex-start">
              <Select
                label={t('event_contributeFieldRegion')}
                data={regions}
                value={regionId}
                onChange={(value) => {
                  setRegionId(value);
                  setVillageId(null);
                }}
                searchable
                clearable
              />
              <Select
                label={t('event_contributeFieldVillage')}
                data={villages}
                value={villageId}
                onChange={setVillageId}
                searchable
                clearable
                disabled={!regionId}
              />
            </Group>
            <TextInput
              label={t('event_contributeFieldOrganizer')}
              description={t('event_contributeFieldOrganizerDesc')}
              value={organizer}
              onChange={(e) => setOrganizer(e.currentTarget.value)}
            />
          </Stack>
        </Paper>

        <Paper withBorder radius="md" p="lg">
          <Stack>
            <Text fw={600}>{t('event_sourceHeading')}</Text>
            <TextInput
              label={t('event_contributeFieldSourceUrl')}
              description={t('event_contributeFieldSourceUrlDesc')}
              placeholder="https://"
              value={sourceUrl}
              onChange={(e) => setSourceUrl(e.currentTarget.value)}
            />
            <Select
              label={t('event_contributeFieldSourceType')}
              description={t('event_contributeFieldSourceTypeDesc')}
              data={SOURCE_TYPES.map((s) => ({
                value: s.value,
                label: t(s.labelKey),
              }))}
              value={sourceType}
              onChange={setSourceType}
              clearable
            />
            <TextInput
              label={t('event_contributeFieldSourceAttribution')}
              description={t('event_contributeFieldSourceAttributionDesc')}
              value={sourceAttribution}
              onChange={(e) => setSourceAttribution(e.currentTarget.value)}
            />
          </Stack>
        </Paper>

        {error ? <Text c="red">{error}</Text> : null}
        <Button onClick={() => void submit()} loading={busy}>
          {t('event_contributeSubmit')}
        </Button>
      </Stack>
    </Container>
  );
}
