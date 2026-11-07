import { listEncyclopediaArticles } from "../application/use-cases/encyclopedia.use-case";

export interface EncyclopediaArticleListItem {
  slug: string;
  updated_at?: string | null;
}

/** Daftar artikel ensiklopedia published untuk sitemap / eksplorasi. */
export async function fetchEncyclopediaArticles(
  signal?: AbortSignal,
): Promise<EncyclopediaArticleListItem[]> {
  try {
    const res = await listEncyclopediaArticles({ limit: 500, signal });
    const items = res.data?.items ?? [];
    return items.map((item) => ({ slug: item.slug }));
  } catch {
    return [];
  }
}
