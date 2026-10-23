/**
 * Usulan acara dari pengguna (boleh anonim).
 *
 * Kirim: `POST /api/v1/event-contributions` tanpa token tetap boleh (rate
 * limit ketat 5/jam per IP). Daftar usulan pribadi: `GET /mine` butuh login.
 */

import { apiClient } from '@/infrastructure/api/api-client';
import { authHeaders } from '@/infrastructure/auth/access-token';
import type { EventSourceType } from './events-parse';

export type { EventSourceType };

export type EventContributionStatus =
  | 'pending'
  | 'needs_revision'
  | 'approved'
  | 'rejected';

export interface EventContributionPayload {
  name: string;
  description: string;
  category_id: string;
  starts_at: string;
  ends_at: string;
  location_text: string;
  lat?: number | null;
  lng?: number | null;
  maps_url?: string | null;
  poster_url?: string | null;
  organizer?: string | null;
  source_url?: string | null;
  source_type?: EventSourceType | null;
  source_attribution?: string | null;
  region_id?: string | null;
  village_id?: string | null;
  place_ids?: string[];
}

export interface EventContribution {
  id: string;
  user_id: string;
  event_id: string | null;
  status: EventContributionStatus;
  revision_note: string | null;
  reject_reason_code: string | null;
  reject_reason_text: string | null;
  reject_reason_display: string | null;
  created_at: string;
  updated_at: string | null;
  reviewed_at: string | null;
  payload: EventContributionPayload;
}

export interface SubmitEventContributionInput {
  name: string;
  description: string;
  category_id: string;
  starts_at: string;
  ends_at: string;
  location_text: string;
  lat?: number | null;
  lng?: number | null;
  organizer?: string | null;
  source_url?: string | null;
  source_type?: EventSourceType | null;
  source_attribution?: string | null;
  region_id?: string | null;
  village_id?: string | null;
}

/** Kirim usulan acara. Tidak butuh login. */
export async function submitEventContribution(
  input: SubmitEventContributionInput,
): Promise<EventContribution> {
  const res = await apiClient<EventContribution>('/event-contributions', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return res.data;
}

/** Usulan milik user yang login. */
export async function fetchMyEventContributions(
  signal?: AbortSignal,
): Promise<EventContribution[]> {
  const res = await apiClient<{ items: EventContribution[] }>('/event-contributions/mine', {
    headers: authHeaders(),
    signal,
  });
  return res.data.items ?? [];
}
