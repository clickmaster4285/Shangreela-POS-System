import { api, type PaginatedResponse } from '@/lib/api';

/** Matches backend `parsePagination` maximum `limit` (1000). */
export const MAX_LIST_LIMIT = 50;

const MAX_PAGES_SAFETY = 50;

/**
 * Follows `hasNext` until all items are loaded. Use for admin-style “load entire list” flows.
 */
export async function fetchAllPaginatedItems<T>(
  buildPath: (page: number, limit: number) => string,
  pageSize = Math.min(200, MAX_LIST_LIMIT)
): Promise<T[]> {
  const out: T[] = [];
  for (let page = 1; page <= MAX_PAGES_SAFETY; page += 1) {
    const res = await api<PaginatedResponse<T>>(buildPath(page, pageSize));
    out.push(...(res.items ?? []));
    if (!res.pagination?.hasNext) break;
  }
  return out;
}
