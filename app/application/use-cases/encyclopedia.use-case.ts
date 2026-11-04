import {
  apiClient,
  type UnwrappedResult,
} from "@/infrastructure/api/api-client";
import type {
  ArticleDetailResponse,
  EncyclopediaCategory,
  EncyclopediaTag,
  ListArticlesResponse,
  MyContributionItem,
  SubmitContributionPayload,
  SubmitContributionResponse,
} from "@/domain/entities/encyclopedia.entity";

export interface ListEncyclopediaArticlesParams {
  category?: string;
  tag?: string;
  q?: string;
  limit?: number;
  cursor?: string;
  signal?: AbortSignal;
}

export async function listEncyclopediaArticles(
  params: ListEncyclopediaArticlesParams = {},
): Promise<UnwrappedResult<ListArticlesResponse>> {
  const query = new URLSearchParams();
  if (params.category) query.set("category", params.category);
  if (params.tag) query.set("tag", params.tag);
  if (params.q) query.set("q", params.q);
  if (params.limit) query.set("limit", String(params.limit));
  if (params.cursor) query.set("cursor", params.cursor);
  const qs = query.toString();
  return apiClient<ListArticlesResponse>(
    `/encyclopedia/articles${qs ? `?${qs}` : ""}`,
    {
      signal: params.signal,
    },
  );
}

export async function getEncyclopediaArticle(
  slug: string,
  signal?: AbortSignal,
): Promise<UnwrappedResult<ArticleDetailResponse>> {
  const res = await apiClient<ArticleDetailResponse>(
    `/encyclopedia/articles/${encodeURIComponent(slug)}`,
    { signal },
  );
  return res;
}

export async function searchEncyclopediaArticles(
  q: string,
  signal?: AbortSignal,
): Promise<UnwrappedResult<ListArticlesResponse>> {
  const res = await apiClient<ListArticlesResponse>(
    `/encyclopedia/articles/search?q=${encodeURIComponent(q)}`,
    { signal },
  );
  return res;
}

export async function listEncyclopediaCategories(
  signal?: AbortSignal,
): Promise<UnwrappedResult<EncyclopediaCategory[]>> {
  const res = await apiClient<EncyclopediaCategory[]>(
    `/encyclopedia/categories`,
    { signal },
  );
  return res;
}

export async function listEncyclopediaTags(
  params: { q?: string; limit?: number; signal?: AbortSignal } = {},
): Promise<UnwrappedResult<EncyclopediaTag[]>> {
  const query = new URLSearchParams();
  if (params.q) query.set("q", params.q);
  if (params.limit) query.set("limit", String(params.limit));
  const qs = query.toString();
  return apiClient<EncyclopediaTag[]>(
    `/encyclopedia/tags${qs ? `?${qs}` : ""}`,
    {
      signal: params.signal,
    },
  );
}

export async function listArticleComments(
  articleId: string,
  params: { limit?: number; cursor?: string; signal?: AbortSignal } = {},
): Promise<
  UnwrappedResult<{
    items: ArticleDetailResponse["comments"];
    meta: { limit: number; next_cursor: string | null; has_more: boolean };
  }>
> {
  const query = new URLSearchParams();
  if (params.limit) query.set("limit", String(params.limit));
  if (params.cursor) query.set("cursor", params.cursor);
  const qs = query.toString();
  return apiClient(
    `/encyclopedia/articles/${encodeURIComponent(articleId)}/comments${qs ? `?${qs}` : ""}`,
    { signal: params.signal },
  );
}

export async function submitEncyclopediaContribution(
  payload: SubmitContributionPayload,
  signal?: AbortSignal,
): Promise<UnwrappedResult<SubmitContributionResponse>> {
  return apiClient<SubmitContributionResponse>("/encyclopedia/contributions", {
    method: "POST",
    signal,
    body: JSON.stringify(payload),
  });
}

export async function listMyEncyclopediaContributions(
  params: { limit?: number; cursor?: string; signal?: AbortSignal } = {},
): Promise<UnwrappedResult<MyContributionItem[]>> {
  const query = new URLSearchParams();
  if (params.limit) query.set("limit", String(params.limit));
  if (params.cursor) query.set("cursor", params.cursor);
  const qs = query.toString();
  return apiClient<MyContributionItem[]>(
    `/encyclopedia/contributions/me${qs ? `?${qs}` : ""}`,
    {
      signal: params.signal,
    },
  );
}
