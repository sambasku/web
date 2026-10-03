/**
 * Data sponsor/pendana operasional. Sumber sama dengan mobile (repo data,
 * disajikan jsDelivr), jadi web dan aplikasi selalu sinkron.
 * Attribusi nama + logo saja; nominal dana dicatat terpisah di Kas Publik
 * (repo github-pages).
 */
const SPONSORS_URL =
  'https://cdn.jsdelivr.net/gh/sambasku/data@main/sponsors.json';

export type Sponsor = {
  id: string;
  name: string;
  description?: string | null;
  logoUrl?: string | null;
  url?: string | null;
  /** ISO date (YYYY-MM-DD), dasar sorting terlama dulu. */
  since: string;
  note: string;
};

export async function listSponsors(signal?: AbortSignal): Promise<Sponsor[]> {
  const res = await fetch(SPONSORS_URL, { signal });
  if (!res.ok) throw new Response('Gagal memuat data sponsor', { status: 502 });
  const body = (await res.json()) as { sponsors?: Sponsor[] };
  return [...(body.sponsors ?? [])].sort((a, b) =>
    a.since < b.since ? -1 : a.since > b.since ? 1 : 0,
  );
}
