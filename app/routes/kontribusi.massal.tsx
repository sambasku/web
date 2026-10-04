import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import {
  ActionIcon,
  Alert,
  Anchor,
  Button,
  Card,
  Container,
  Group,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { ArrowLeft, Plus, Send, Trash2 } from 'lucide-react';
import type { Route } from './+types/kontribusi.massal';
import { buildMetaTags } from '../application/utils/seo';
import {
  DEFAULT_LOCALE,
  isAppLocale,
  localePath,
} from '@/application/i18n/locales';
import { useLocalePath } from '@/application/i18n/use-locale';
import { AppError, apiClient } from '../infrastructure/api/api-client';
import {
  AnalyticsEvents,
  trackEvent,
} from '@/infrastructure/analytics/analytics';

const BATCH_MAX_ROWS = 50;

type MassRow = {
  id: string;
  sambas: string;
  indonesia: string;
};

function blankMassRows(count: number): MassRow[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `m-${Date.now()}-${i}`,
    sambas: '',
    indonesia: '',
  }));
}

export function meta({ params }: Route.MetaArgs) {
  const locale = isAppLocale(params.locale) ? params.locale : DEFAULT_LOCALE;
  return buildMetaTags({
    title: 'Kontribusi Massal',
    description:
      'Kirim banyak kata Sambas sekaligus. Langsung tayang; tim bisa menarik batch bila perlu.',
    path: localePath(locale, '/kontribusi/massal'),
    locale,
    noindexAlways: true,
  });
}

export default function KontribusiMassalPage() {
  const lp = useLocalePath();
  const [searchParams] = useSearchParams();

  const [massRows, setMassRows] = useState<MassRow[]>(() => blankMassRows(5));
  const [contributorName, setContributorName] = useState('');
  const [batchProgress, setBatchProgress] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    trackEvent(AnalyticsEvents.contributeStart, {
      guest: true,
      mode: 'massal',
      from: searchParams.get('from')?.trim() || 'direct',
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount-only
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const filled = massRows
      .map((row) => ({
        sambas: row.sambas.trim(),
        indonesia: row.indonesia.trim(),
      }))
      .filter((row) => row.sambas.length > 0 || row.indonesia.length > 0);

    if (filled.length === 0) {
      setError('Isi dulu minimal satu baris (Sambas + Indonesia) ya.');
      return;
    }

    const incomplete = filled.find((row) => !row.sambas || !row.indonesia);
    if (incomplete) {
      setError(
        'Setiap baris yang diisi harus punya Kata Sambas dan Padanan Indonesia.',
      );
      return;
    }

    if (filled.length > BATCH_MAX_ROWS) {
      setError(`Maksimal ${BATCH_MAX_ROWS} kata per kiriman.`);
      return;
    }

    setSubmitting(true);
    setBatchProgress(`Mengirim ${filled.length} kata…`);
    trackEvent(AnalyticsEvents.contributeSubmit, {
      guest: true,
      mode: 'massal',
    });
    try {
      const name = contributorName.trim();
      const res = await apiClient<{
        session_id: string;
        total: number;
        created_count: number;
        duplicates_count: number;
        meanings_added_count: number;
        invalid_count: number;
      }>('/contributions/words/batch', {
        method: 'POST',
        body: JSON.stringify({
          ...(name ? { contributor_name: name } : {}),
          rows: filled,
        }),
      });
      const data = res.data;
      trackEvent(AnalyticsEvents.contributeSuccess, {
        guest: true,
        mode: 'massal',
        created: data.created_count,
      });
      setSuccess(
        `${data.created_count} kata baru tayang` +
          (data.meanings_added_count
            ? `, ${data.meanings_added_count} makna ditambah`
            : '') +
          (data.duplicates_count
            ? `, ${data.duplicates_count} duplikat dilewati`
            : '') +
          (data.invalid_count ? `, ${data.invalid_count} tidak valid` : '') +
          '.',
      );
      setBatchProgress(null);
      setMassRows(blankMassRows(5));
    } catch (err) {
      trackEvent(AnalyticsEvents.contributeFail, {
        guest: true,
        mode: 'massal',
        error_code: err instanceof AppError ? err.code : 'UNKNOWN',
      });
      setBatchProgress(null);
      setError(
        err instanceof AppError
          ? err.message
          : 'Gagal mengirim batch. Coba lagi nanti.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Container size="sm" py="xl">
      <Stack gap="lg">
        <div>
          <Anchor
            component={Link}
            to={lp('/kontribusi')}
            size="sm"
            c="dimmed"
            mb="xs"
            display="inline-flex"
            style={{ alignItems: 'center', gap: 6 }}
          >
            <ArrowLeft size={14} />
            Kembali ke kontribusi tunggal
          </Anchor>
          <Title order={1}>Kontribusi Massal</Title>
          <Text c="dimmed" mt="xs">
            Isi banyak pasangan kata Sambas dan padanan Indonesia sekaligus.
            Langsung tayang; kalau ada masalah, tim bisa menarik seluruh
            batchnya.
          </Text>
        </div>

        {success && (
          <Alert color="teal" variant="light" title="Batch terkirim">
            {success}
          </Alert>
        )}

        {error && (
          <Alert color="red" variant="light" title="Gagal mengirim">
            {error}
          </Alert>
        )}

        <Card withBorder radius="md" padding="lg">
          <form onSubmit={onSubmit}>
            <Stack gap="md">
              <Alert color="blue" variant="light" title="Langsung tayang">
                Beda dari form tunggal, batch ini langsung masuk kamus.
                Kosongkan nama kalau mau tercatat sebagai Anonim.
              </Alert>

              <TextInput
                label="Nama (opsional)"
                placeholder="Nama buat atribusi"
                description="Kalau kosong, tercatat sebagai Anonim"
                value={contributorName}
                onChange={(e) => setContributorName(e.currentTarget.value)}
                maxLength={80}
              />

              <Stack gap="sm">
                <Group justify="space-between" wrap="nowrap">
                  <Text size="sm" fw={500}>
                    Daftar kata
                  </Text>
                  <Text size="xs" c="dimmed">
                    Maks. {BATCH_MAX_ROWS} baris
                  </Text>
                </Group>

                {massRows.map((row, index) => (
                  <Group
                    key={row.id}
                    align="flex-start"
                    wrap="nowrap"
                    gap="xs"
                  >
                    <Text
                      size="sm"
                      c="dimmed"
                      w={28}
                      ta="right"
                      pt={10}
                      style={{ flexShrink: 0 }}
                    >
                      {index + 1}
                    </Text>
                    <TextInput
                      placeholder="Sambas"
                      aria-label={`Kata Sambas baris ${index + 1}`}
                      value={row.sambas}
                      style={{ flex: 1 }}
                      onChange={(e) => {
                        const value = e.currentTarget.value;
                        setMassRows((rows) =>
                          rows.map((r) =>
                            r.id === row.id ? { ...r, sambas: value } : r,
                          ),
                        );
                      }}
                    />
                    <TextInput
                      placeholder="Indonesia"
                      aria-label={`Padanan Indonesia baris ${index + 1}`}
                      value={row.indonesia}
                      style={{ flex: 1 }}
                      onChange={(e) => {
                        const value = e.currentTarget.value;
                        setMassRows((rows) =>
                          rows.map((r) =>
                            r.id === row.id ? { ...r, indonesia: value } : r,
                          ),
                        );
                      }}
                    />
                    <ActionIcon
                      variant="subtle"
                      color="red"
                      aria-label={`Hapus baris ${index + 1}`}
                      disabled={massRows.length <= 1}
                      mt={4}
                      onClick={() =>
                        setMassRows((rows) =>
                          rows.length <= 1
                            ? rows
                            : rows.filter((r) => r.id !== row.id),
                        )
                      }
                    >
                      <Trash2 size={16} />
                    </ActionIcon>
                  </Group>
                ))}
              </Stack>

              <Button
                variant="light"
                color="gray"
                leftSection={<Plus size={16} />}
                disabled={massRows.length >= BATCH_MAX_ROWS}
                onClick={() =>
                  setMassRows((rows) => [
                    ...rows,
                    {
                      id: `m-${Date.now()}-${rows.length}`,
                      sambas: '',
                      indonesia: '',
                    },
                  ])
                }
              >
                Tambah baris
              </Button>

              {batchProgress && (
                <Text size="sm" c="dimmed">
                  {batchProgress}
                </Text>
              )}

              <Group justify="flex-end">
                <Button
                  type="submit"
                  loading={submitting}
                  leftSection={<Send size={16} />}
                >
                  Kirim batch
                </Button>
              </Group>
            </Stack>
          </form>
        </Card>
      </Stack>
    </Container>
  );
}
