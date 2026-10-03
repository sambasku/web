/**
 * Data kontributor langsung project (repo data, disajikan jsDelivr).
 * Sama pola dengan sponsor.use-case.ts: attribusi nama + peran,
 * disinkronkan manual lewat repo sambasku/data.
 */
const CONTRIBUTORS_URL =
  'https://cdn.jsdelivr.net/gh/sambasku/data@main/contributor.json';

export type Contributor = {
  id: string;
  name: string;
  roles: string[];
  avatarUrl?: string | null;
  url?: string | null;
  /** ISO date (YYYY-MM-DD), dasar sorting terlama dulu. */
  since: string;
  note: string;
};

export async function listContributors(
  signal?: AbortSignal,
): Promise<Contributor[]> {
  const res = await fetch(CONTRIBUTORS_URL, { signal });
  if (!res.ok)
    throw new Response('Gagal memuat data kontributor', { status: 502 });
  const body = (await res.json()) as { contributors?: Contributor[] };
  return [...(body.contributors ?? [])].sort((a, b) =>
    a.since < b.since ? -1 : a.since > b.since ? 1 : 0,
  );
}
