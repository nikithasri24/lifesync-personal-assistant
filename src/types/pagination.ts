/**
 * Shared pagination types used across the application.
 * Offset-based page-number pagination with 25 items per page.
 */

export const DEFAULT_PAGE_SIZE = 25;

export interface PaginationParams {
  page: number;      // 1-indexed
  pageSize?: number; // defaults to DEFAULT_PAGE_SIZE
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;      // from Supabase count: 'exact'
  page: number;
  pageSize: number;
  totalPages: number; // Math.ceil(total / pageSize)
}
