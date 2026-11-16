export interface EncyclopediaCategory {
  id: string;
  name: string;
}

export interface EncyclopediaTag {
  id: string;
  name: string;
  slug: string;
}

export interface EncyclopediaArticleAuthor {
  user_id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  is_verifier: boolean;
}

export interface EncyclopediaArticle {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  body_md: string;
  references_md: string | null;
  cover_url: string | null;
  category: EncyclopediaCategory;
  tags: EncyclopediaTag[];
  author: EncyclopediaArticleAuthor;
  status: string;
  published_at: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface EncyclopediaArticleListItem {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  cover_url: string | null;
  category: EncyclopediaCategory;
  tags: EncyclopediaTag[];
  author: EncyclopediaArticleAuthor;
  status: string;
  published_at: string | null;
  created_at: string;
}

export interface EncyclopediaComment {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  body: string;
  isEdited: boolean;
  createdAt: string;
}

export interface EncyclopediaCommentAuthor {
  user_id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  is_verifier: boolean;
}

export interface ListArticlesResponse {
  items: EncyclopediaArticleListItem[];
  meta: { limit: number; next_cursor: string | null; has_more: boolean };
}

export interface ListCategoriesResponse {
  items: EncyclopediaCategory[];
}

export interface ListTagsResponse {
  items: EncyclopediaTag[];
}

export interface ArticleDetailResponse extends EncyclopediaArticle {
  comments?: {
    items: EncyclopediaComment[];
    meta: { limit: number; next_cursor: string | null; has_more: boolean };
  };
}

export interface SubmitContributionPayload {
  kind: "new" | "edit";
  /** ULID artikel (mode edit). Opsional: articleSlug di-resolve di use case. */
  article_id?: string;
  /** Compat URL query - di-resolve ke article_id sebelum POST. */
  articleSlug?: string;
  title: string;
  excerpt: string;
  body_md: string;
  category_id: string;
  tags: string[];
  change_note?: string;
}

export interface SubmitContributionResponse {
  id: string;
  status: string;
}

export interface MyContributionItem {
  id: string;
  kind: "new" | "edit";
  articleSlug: string | null;
  articleTitle: string | null;
  payload: {
    title: string;
    excerpt: string;
    body_md: string;
    category_id: string;
    tags: string[];
  };
  status: string;
  rejectReasonCode: string | null;
  rejectReasonText: string | null;
  revisionNote: string | null;
  createdAt: string;
}
