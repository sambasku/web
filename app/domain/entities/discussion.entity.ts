export interface DiscussionPublicImage {
  public_url: string;
  content_warnings?: string[];
}

export type DiscussionReplyStatus = 'published' | 'taken_down' | 'deleted_by_author';

export interface DiscussionReply {
  id: string;
  user_id: string;
  username: string | null;
  display_name: string | null;
  body: string | null;
  status: DiscussionReplyStatus;
  is_verifier: boolean;
  is_pinned: boolean;
  upvotes: number;
  downvotes: number;
  created_at: string;
}

export interface DiscussionPublicItem {
  id: string;
  user_id: string;
  username: string | null;
  display_name: string | null;
  body: string | null;
  link_url: string | null;
  images: DiscussionPublicImage[];
  status: 'published';
  pinned_reply_id: string | null;
  upvotes: number;
  created_at: string;
}

export interface DiscussionPublicDetail extends DiscussionPublicItem {
  replies: DiscussionReply[];
}
