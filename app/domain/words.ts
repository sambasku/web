import { apiClient } from '@/infrastructure/api/api-client';

/**
 * Catat 1 view detail kata by lemma (metrik popularitas,
 * docs/api/59-api-word-views.md). Best-effort total - kegagalan jaringan
 * tidak boleh ganggu render halaman.
 */
export function sendWordView(lemma: string): void {
  void apiClient(`/words/lemma/${encodeURIComponent(lemma)}/view`, {
    method: 'POST',
  }).catch(() => {});
}