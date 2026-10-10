/** Kategori/glosarium kata (GET /api/v1/categories — list 15-api.md). */
export interface CategoryOption {
  id: string;
  parent_id: string | null;
  name: string;
  description: string | null;
  word_count: number;
}