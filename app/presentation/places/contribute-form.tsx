import { useEffect, useState, type DragEvent } from 'react';
import {
  Button,
  Container,
  FileButton,
  Group,
  Image,
  Paper,
  Select,
  Stack,
  Text,
  Textarea,
  TextInput,
  Title,
} from '@mantine/core';
import type { Place, PlaceType } from '@/domain/places';
import { apiClient, AppError } from '@/infrastructure/api/api-client';
import { env } from '@/infrastructure/config/env';
import { AnalyticsEvents, trackEvent } from '@/infrastructure/analytics/analytics';
import { inSambas, PlaceMap } from './place-map';

const TYPES: Array<{ value: PlaceType; label: string }> = [
  { value: 'sejarah', label: 'Sejarah' },
  { value: 'alam', label: 'Alam' },
  { value: 'budaya', label: 'Budaya' },
  { value: 'pantai', label: 'Pantai' },
  { value: 'belanja', label: 'Belanja' },
];

function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);
}

function errorText(err: unknown): string {
  if (err instanceof AppError && err.details?.length) {
    return err.details.map((item) => item.message).filter(Boolean).join(' ');
  }
  return err instanceof Error ? err.message : 'Gagal menyimpan';
}

async function uploadPlaceImage(file: File): Promise<string> {
  const body = new FormData();
  body.set('file', file);
  const base = env.apiBaseUrl.replace(/\/$/, '');
  const res = await fetch(`${base}/place-contributions/images`, { method: 'POST', body });
  const json = (await res.json()) as { data?: { url?: string }; message?: string };
  if (!res.ok || !json.data?.url) throw new Error(json.message || 'Unggah foto gagal');
  return json.data.url;
}

const MAX_PHOTOS = 20;
const MAX_PHOTO_MODE = 5;

const ACCEPT = ['image/jpeg', 'image/png', 'image/webp'];

/** Dropzone gambar: klik atau drag-and-drop, dengan preview thumbnail. */
function PhotoDropzone({
  files,
  onChange,
}: {
  files: File[];
  onChange: (files: File[]) => void;
}) {
  const [over, setOver] = useState(false);

  const add = (incoming: FileList | File[] | null) => {
    if (!incoming) return;
    const list = Array.from(incoming).filter((file) => ACCEPT.includes(file.type));
    if (list.length === 0) return;
    onChange([...files, ...list].slice(0, MAX_PHOTOS));
  };

  const drop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setOver(false);
    add(event.dataTransfer.files);
  };

  return (
    <Stack gap="sm">
      <FileButton multiple accept={ACCEPT.join(',')} onChange={add}>
        {(props) => (
          <div
            {...props}
            onClick={props.onClick}
            onDragOver={(event) => {
              event.preventDefault();
              setOver(true);
            }}
            onDragLeave={() => setOver(false)}
            onDrop={drop}
            style={{
              border: `1px dashed ${over ? 'var(--mantine-color-teal-6)' : 'var(--mantine-color-default-border)'}`,
              background: over ? 'var(--mantine-color-teal-light)' : 'transparent',
              borderRadius: 8,
              padding: '20px 12px',
              textAlign: 'center',
              cursor: 'pointer',
            }}
          >
            <Text size="sm" fw={500}>
              Tarik foto ke sini atau klik untuk memilih
            </Text>
            <Text size="xs" c="dimmed" mt={4}>
              Format: JPEG, PNG, WebP. Maksimal {MAX_PHOTOS} foto.
            </Text>
          </div>
        )}
      </FileButton>
      {files.length > 0 ? (
        <Group gap="sm">
          {files.map((file, i) => (
            <div key={`${file.name}-${i}`} style={{ position: 'relative' }}>
              <Image
                src={URL.createObjectURL(file)}
                alt={file.name}
                width={72}
                height={72}
                style={{ objectFit: 'cover', borderRadius: 8 }}
              />
              <Button
                size="compact-xs"
                variant="default"
                style={{ position: 'absolute', top: 2, right: 2 }}
                onClick={(event) => {
                  event.stopPropagation();
                  onChange(files.filter((_, index) => index !== i));
                }}
              >
                &times;
              </Button>
            </div>
          ))}
        </Group>
      ) : null}
    </Stack>
  );
}

export function ContributeForm({
  mode,
  place,
}: {
  mode: 'create' | 'edit' | 'photo';
  place?: Place | null;
}) {
  const [name, setName] = useState(place?.name ?? '');
  const [category, setCategory] = useState(place?.category ?? 'wisata');
  const [type, setType] = useState<string | null>(place?.type ?? null);
  const [description, setDescription] = useState(place?.shortDescription ?? '');
  const [regionId, setRegionId] = useState<string | null>(null);
  const [villageId, setVillageId] = useState<string | null>(null);
  const [regions, setRegions] = useState<Array<{ value: string; label: string }>>([]);
  const [villages, setVillages] = useState<Array<{ value: string; label: string }>>([]);
  const [categories, setCategories] = useState<Array<{ value: string; label: string }>>([]);
  const [point, setPoint] = useState<{ lat: number; lng: number } | null>(
    place?.lat != null && place.lng != null && inSambas(place.lat, place.lng)
      ? { lat: place.lat, lng: place.lng }
      : null,
  );
  const [hours, setHours] = useState(place?.hours ?? '');
  const [contact, setContact] = useState(place?.contact ?? '');
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    trackEvent(AnalyticsEvents.wisataContributeOpen, { mode });
    void apiClient<{ items: Array<{ id: string; name: string }> }>('/place-categories?limit=100')
      .then((res) => {
        setCategories(res.data.items.map((row) => ({ value: row.id, label: row.name })));
      })
      .catch(() => {});
    void apiClient<{ items: Array<{ id: string; name: string }> }>('/regions?type=kecamatan&limit=100')
      .then((res) => {
        setRegions(res.data.items.map((row) => ({ value: row.id, label: row.name })));
      })
      .catch(() => {});
  }, [mode]);

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
    if (mode !== 'photo' && (!name.trim() || !description.trim())) {
      setError('Nama dan deskripsi wajib diisi.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const urls: string[] = [];
      const toUpload = files.slice(0, mode === 'photo' ? MAX_PHOTO_MODE : MAX_PHOTOS);
      for (const file of toUpload) {
        urls.push(await uploadPlaceImage(file));
      }
      if (mode === 'photo') {
        if (!place) throw new Error('Tempat tidak ditemukan');
        if (urls.length === 0) throw new Error('Pilih minimal satu foto.');
        await apiClient(`/places/${encodeURIComponent(place.slug)}/images`, {
          method: 'POST',
          body: JSON.stringify({ urls }),
        });
        trackEvent(AnalyticsEvents.wisataContributeSubmit, { slug: place.slug });
        setDone(true);
        return;
      }
      const slug = place?.slug || slugify(name);
      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
        throw new Error('Nama perlu punya huruf atau angka supaya bisa disimpan.');
      }
      const payload: Record<string, unknown> = {
        slug,
        name: name.trim(),
        category,
        short_description: description.trim(),
      };
      if (mode === 'edit' && place) payload.place_id = place.id;
      if (type) payload.type = type;
      if (point && inSambas(point.lat, point.lng)) {
        payload.lat = point.lat;
        payload.lng = point.lng;
      }
      if (regionId) payload.region_id = regionId;
      if (villageId) payload.village_id = villageId;
      if (hours.trim()) payload.hours = hours.trim();
      if (contact.trim()) payload.contact = contact.trim();
      if (urls.length > 0) payload.images = urls.map((url) => ({ url }));
      await apiClient('/place-contributions', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      trackEvent(AnalyticsEvents.wisataContributeSubmit, { slug });
      setDone(true);
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  }

  const title = mode === 'photo' ? 'Tambah foto' : mode === 'edit' ? 'Usulkan suntingan' : 'Usulkan wisata';

  return (
    <Container size="sm" py={28}>
      <Stack gap="lg">
        <Stack gap={4}>
          <Title order={1} size="h3">
            {title}
          </Title>
          <Text size="sm" c="dimmed">
            {mode === 'photo'
              ? 'Foto ke tempat yang sudah terbit langsung tampil, dengan kredit anonim.'
              : 'Tidak perlu masuk. Usulan ini dicatat sebagai kontribusi anonim dan menunggu tinjauan.'}
          </Text>
        </Stack>

        {done ? (
          <Paper withBorder radius="md" p="lg">
            <Text fw={600}>
              {mode === 'photo' ? 'Foto sudah masuk.' : 'Usulan terkirim.'}
            </Text>
            <Text size="sm" c="dimmed" mt={6}>
              {mode === 'photo'
                ? 'Foto langsung tampil di halaman tempat.'
                : 'Kami tinjau dulu sebelum tempat ini tampil di daftar wisata.'}
            </Text>
          </Paper>
        ) : mode === 'photo' ? (
          <Paper withBorder radius="md" p="lg">
            <Stack>
              <PhotoDropzone files={files} onChange={setFiles} />
              {error ? <Text c="red">{error}</Text> : null}
              <Button onClick={() => void submit()} loading={busy} disabled={files.length === 0}>
                Kirim foto
              </Button>
            </Stack>
          </Paper>
        ) : (
          <Stack gap="md">
            <Paper withBorder radius="md" p="lg">
              <Stack>
                <Text fw={600}>Identitas</Text>
                <TextInput label="Nama" required value={name} onChange={(e) => setName(e.currentTarget.value)} />
                <Select
                  label="Kategori"
                  data={categories}
                  value={category}
                  onChange={(v) => v && setCategory(v)}
                  allowDeselect={false}
                />
                <Select label="Jenis" description="Opsional" data={TYPES} value={type} onChange={setType} clearable />
                <Textarea
                  label="Deskripsi"
                  required
                  minRows={4}
                  value={description}
                  onChange={(e) => setDescription(e.currentTarget.value)}
                />
              </Stack>
            </Paper>

            <Paper withBorder radius="md" p="lg">
              <Stack>
                <Text fw={600}>Lokasi</Text>
                <Text size="sm" c="dimmed">
                  Pilih kecamatan dan desa. Titik peta opsional.
                </Text>
                <Select
                  label="Kecamatan"
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
                  label="Desa"
                  data={villages}
                  value={villageId}
                  onChange={setVillageId}
                  searchable
                  clearable
                  disabled={!regionId}
                />
                <PlaceMap value={point} onChange={setPoint} />
              </Stack>
            </Paper>

            <Paper withBorder radius="md" p="lg">
              <Stack>
                <Text fw={600}>Kontak</Text>
                <TextInput
                  label="Jam buka"
                  description="Opsional"
                  value={hours}
                  onChange={(e) => setHours(e.currentTarget.value)}
                />
                <TextInput
                  label="Kontak"
                  description="Opsional. Nomor, email, atau catatan."
                  value={contact}
                  onChange={(e) => setContact(e.currentTarget.value)}
                />
              </Stack>
            </Paper>

            <Paper withBorder radius="md" p="lg">
              <Stack>
                <Text fw={600}>Foto</Text>
                <Text size="sm" c="dimmed">
                  Opsional, maksimal 20. Foto di usulan baru tampil setelah usulan disetujui.
                </Text>
                <PhotoDropzone files={files} onChange={setFiles} />
              </Stack>
            </Paper>

            {error ? <Text c="red">{error}</Text> : null}
            <Button onClick={() => void submit()} loading={busy}>
              Kirim usulan
            </Button>
          </Stack>
        )}
      </Stack>
    </Container>
  );
}