import { apiClient, type UnwrappedResult } from '@/infrastructure/api/api-client';
import type { CategoryOption } from '@/domain/entities/category.entity';

/** Daftar kategori/glosarium (GET /categories) untuk filter daftar kata. */
export async function listCategories(
  signal?: AbortSignal,
): Promise<UnwrappedResult<CategoryOption[]>> {
  return apiClient<CategoryOption[]>('/categories', { signal });
}
