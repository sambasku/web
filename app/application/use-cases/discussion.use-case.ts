import { apiClient, type UnwrappedResult } from '@/infrastructure/api/api-client';
import type {
  DiscussionPublicDetail,
  DiscussionPublicItem,
} from '@/domain/entities/discussion.entity';

export interface ListDiscussionsParams {
  limit?: number;
  cursor?: string;
  sort?: 'latest' | 'popular';
  signal?: AbortSignal;
}

export async function listPublishedDiscussions(
  params: ListDiscussionsParams = {},
): Promise<UnwrappedResult<DiscussionPublicItem[]>> {
  const query = new URLSearchParams();
  if (params.limit) query.set('limit', String(params.limit));
  if (params.cursor) query.set('cursor', params.cursor);
  if (params.sort) query.set('sort', params.sort);

  const qs = query.toString();
  return apiClient<DiscussionPublicItem[]>(
    `/discussions${qs ? `?${qs}` : ''}`,
    { signal: params.signal },
  );
}

export async function getDiscussionDetail(
  id: string,
  signal?: AbortSignal,
): Promise<DiscussionPublicDetail> {
  const res = await apiClient<DiscussionPublicDetail>(
    `/discussions/${encodeURIComponent(id)}`,
    { signal },
  );
  return res.data;
}
