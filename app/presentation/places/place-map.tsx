import { useEffect, useRef, useState } from 'react';
import { Button, Group, Loader, Paper, Text, TextInput, UnstyledButton } from '@mantine/core';
import { MapPin, Search, X } from 'lucide-react';
import maplibreWorkerSource from 'maplibre-gl/dist/maplibre-gl-worker.mjs?raw';
import 'maplibre-gl/dist/maplibre-gl.css';

const STYLE = 'https://tiles.openfreemap.org/styles/bright';
const CENTER = { lat: 1.3617, lng: 109.313 };

export function inSambas(lat: number, lng: number): boolean {
  return lat >= 1 && lat <= 1.8 && lng >= 108.5 && lng <= 110;
}

function pin(): HTMLDivElement {
  const el = document.createElement('div');
  el.style.width = '18px';
  el.style.height = '18px';
  el.style.borderRadius = '50%';
  el.style.background = '#0ca678';
  el.style.border = '2px solid #fff';
  el.style.boxShadow = '0 1px 4px rgba(0,0,0,.45)';
  return el;
}

interface NominatimHit {
  lat: number;
  lng: number;
  label: string;
}

function cleanQuery(raw: string): string | null {
  const query = raw.replace(/\s+/g, ' ').trim();
  if (query.length < 3 || query.length > 80) return null;
  if (!/[A-Za-z0-9]/.test(query)) return null;
  return query;
}

/** "Jalan Foo, Desa Bar, Kecamatan Baz, Sambas, ..." -> bagian sebelum ", Sambas". */
function shortLabel(label: string): string {
  const cut = label.split(', Kabupaten Sambas')[0].split(', Sambas')[0];
  return cut.length > 80 ? `${cut.slice(0, 80)}...` : cut;
}

function hitsFrom(data: unknown): NominatimHit[] {
  if (!Array.isArray(data)) return [];
  const out: NominatimHit[] = [];
  for (const row of data) {
    if (typeof row !== 'object' || row === null) continue;
    const r = row as { lat?: string; lon?: string; display_name?: string };
    const lat = Number(r.lat);
    const lng = Number(r.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
    if (!inSambas(lat, lng)) continue;
    const label =
      typeof r.display_name === 'string' && r.display_name.trim()
        ? r.display_name.trim()
        : 'Titik di Sambas';
    out.push({ lat, lng, label });
    if (out.length >= 5) break;
  }
  return out;
}

export function PlaceMap({
  value,
  onChange,
}: {
  value: { lat: number; lng: number } | null;
  onChange: (point: { lat: number; lng: number } | null) => void;
}) {
  const box = useRef<HTMLDivElement>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const valueRef = useRef(value);
  valueRef.current = value;
  const flyRef = useRef<(lat: number, lng: number) => void>(() => {});
  const abortRef = useRef<AbortController | null>(null);
  const lastQueryRef = useRef('');
  const [hint, setHint] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<NominatimHit[]>([]);
  const [query, setQuery] = useState('');

  useEffect(() => {
    const node = box.current;
    if (!node) return;
    let remove = () => {};
    let dead = false;
    void import('maplibre-gl').then(({ Map, Marker, NavigationControl, setWorkerUrl }) => {
      const workerBlob = new Blob([maplibreWorkerSource], { type: 'text/javascript' });
      setWorkerUrl(URL.createObjectURL(workerBlob));
      if (dead || !node.isConnected) return;
      const start = valueRef.current;
      const map = new Map({
        container: node,
        style: STYLE,
        center: [start?.lng ?? CENTER.lng, start?.lat ?? CENTER.lat],
        zoom: start ? 14 : 10,
      });
      map.addControl(new NavigationControl({ showCompass: false }), 'top-right');
      let marker: InstanceType<typeof Marker> | null = null;
      const place = (lat: number, lng: number, recenter: boolean) => {
        if (!marker) {
          marker = new Marker({ element: pin(), anchor: 'center' }).setLngLat([lng, lat]).addTo(map);
        } else {
          marker.setLngLat([lng, lat]);
        }
        if (recenter) map.jumpTo({ center: [lng, lat], zoom: Math.max(map.getZoom(), 14) });
      };
      const resize = () => map.resize();
      map.on('error', () => {
        setHint('Peta tidak bisa dimuat. Kecamatan dan desa sudah cukup.');
      });
      map.on('load', () => {
        resize();
        map.jumpTo({
          center: [start?.lng ?? CENTER.lng, start?.lat ?? CENTER.lat],
          zoom: start ? 14 : 10,
        });
        const current = valueRef.current;
        if (current) place(current.lat, current.lng, false);
      });
      const observer = new ResizeObserver(() => resize());
      observer.observe(node);
      flyRef.current = (lat, lng) => place(lat, lng, true);
      map.on('click', (event) => {
        const lat = Number(event.lngLat.lat.toFixed(6));
        const lng = Number(event.lngLat.lng.toFixed(6));
        if (!inSambas(lat, lng)) {
          setHint('Titik itu di luar Kabupaten Sambas, jadi tidak disimpan.');
          return;
        }
        setHint(null);
        place(lat, lng, false);
        onChangeRef.current({ lat, lng });
      });
      remove = () => {
        observer.disconnect();
        map.remove();
      };
    });
    return () => {
      dead = true;
      remove();
    };
  }, []);

  // Pencarian Nominatim dengan debounce. Tidak ada permintaan saat query
  // kosong atau sama dengan query terakhir; permintaan sebelumnya dibatalkan.
  useEffect(() => {
    const cleaned = cleanQuery(query);
    if (!cleaned) {
      abortRef.current?.abort();
      abortRef.current = null;
      setSearching(false);
      setResults([]);
      if (query.trim().length > 0) setHint('Ketik minimal 3 huruf.');
      return;
    }
    if (cleaned === lastQueryRef.current) return;

    const timer = setTimeout(() => {
      const controller = new AbortController();
      abortRef.current = controller;
      setSearching(true);
      setHint(null);
      const url = new URL('https://nominatim.openstreetmap.org/search');
      url.searchParams.set('format', 'jsonv2');
      url.searchParams.set('limit', '5');
      url.searchParams.set('q', cleaned);
      url.searchParams.set('viewbox', '108.5,2.0,110.1,0.8');
      url.searchParams.set('bounded', '1');
      fetch(url, { headers: { Accept: 'application/json' }, signal: controller.signal })
        .then((res) => res.json())
        .then((rows: unknown) => {
          if (controller.signal.aborted) return;
          lastQueryRef.current = cleaned;
          const hits = hitsFrom(rows);
          setSearching(false);
          setResults(hits);
          setHint(hits.length === 0 ? 'Tempat itu tidak ketemu di peta Sambas.' : null);
        })
        .catch(() => {
          if (controller.signal.aborted) return;
          setSearching(false);
          setHint('Peta tidak bisa mencari sekarang. Isi kecamatan dan desa saja.');
        });
    }, 600);
    return () => clearTimeout(timer);
  }, [query]);

  const pick = (hit: NominatimHit) => {
    setResults([]);
    setQuery(shortLabel(hit.label));
    setHint(null);
    flyRef.current(hit.lat, hit.lng);
    onChangeRef.current({ lat: hit.lat, lng: hit.lng });
  };

  return (
    <>
      <div style={{ position: 'relative' }}>
        <TextInput
          label="Cari di peta"
          description="Hasil muncul otomatis. Ketuk satu hasil untuk memakai titiknya."
          placeholder="Nama tempat di Sambas"
          leftSection={<Search size={16} strokeWidth={1.8} />}
          rightSection={
            searching ? (
              <Loader size="xs" type="dots" />
            ) : query ? (
              <UnstyledButton
                aria-label="Bersihkan pencarian"
                onClick={() => {
                  setQuery('');
                  setResults([]);
                  setHint(null);
                }}
              >
                <X size={16} strokeWidth={1.8} />
              </UnstyledButton>
            ) : null
          }
          value={query}
          onChange={(event) => setQuery(event.currentTarget.value)}
        />
        <div
          ref={box}
          style={{
            height: 320,
            width: '100%',
            marginTop: 8,
            borderRadius: 12,
            overflow: 'hidden',
            border: '1px solid var(--mantine-color-default-border)',
          }}
        />
        {results.length > 0 ? (
          <Paper
            withBorder
            shadow="md"
            radius="md"
            style={{
              position: 'absolute',
              top: 64,
              left: 8,
              right: 8,
              zIndex: 10,
              overflow: 'hidden',
            }}
          >
            <Text size="xs" fw={600} c="dimmed" px="sm" pt={8} pb={4}>
              Hasil pencarian
            </Text>
            {results.map((hit, i) => (
              <UnstyledButton
                key={`${hit.lat},${hit.lng},${i}`}
                onClick={() => pick(hit)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  width: '100%',
                  padding: '8px 12px',
                  borderTop: '1px solid var(--mantine-color-default-border)',
                }}
              >
                <MapPin size={16} strokeWidth={1.8} style={{ flexShrink: 0 }} />
                <Text size="sm" style={{ flex: 1, textAlign: 'left' }} lineClamp={2}>
                  {shortLabel(hit.label)}
                </Text>
                <Text size="xs" c="dimmed">
                  {i + 1}
                </Text>
              </UnstyledButton>
            ))}
          </Paper>
        ) : null}
      </div>
      <Group justify="space-between" mt={8}>
        <Text size="sm" c="dimmed">
          {value ? `${value.lat}, ${value.lng}` : 'Belum ada titik. Ketuk peta kalau mau menaruh.'}
        </Text>
        {value ? (
          <Button variant="subtle" size="compact-sm" onClick={() => onChange(null)}>
            Hapus titik
          </Button>
        ) : null}
      </Group>
      {hint ? (
        <Text size="sm" c="red" mt={4}>
          {hint}
        </Text>
      ) : null}
    </>
  );
}
