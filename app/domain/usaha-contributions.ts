/**
 * Usulan usaha dari pengunjung web (boleh anonim).
 *
 * Kirim: `POST /api/v1/usaha-contributions` tanpa token tetap boleh (rate
 * limit 5/jam per IP). Foto sampul memakai URL https karena unggah gambar
 * butuh login - pengunjung anonim cukup menempel tautan.
 */

import { apiClient } from '@/infrastructure/api/api-client';
import type { UsahaKind } from './usaha-parse';

export interface SubmitUsahaContributionInput {
  name: string;
  region_id: string;
  description?: string | null;
  category_id?: string | null;
  kind?: UsahaKind;
  village_id?: string | null;
  address_text?: string | null;
  lat?: number | null;
  lng?: number | null;
  phone?: string | null;
  whatsapp?: string | null;
  website?: string | null;
  social_url?: string | null;
  cover_url?: string | null;
  wants_claim?: boolean;
}

/** Kirim usulan usaha. Tidak butuh login. */
export async function submitUsahaContribution(
  input: SubmitUsahaContributionInput,
): Promise<void> {
  await apiClient<null>('/usaha-contributions', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}
