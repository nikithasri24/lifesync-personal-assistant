/**
 * usePagination - page state manager hook
 *
 * Manages current page number for offset-based pagination.
 * Call resetPage() whenever filters change to return to page 1.
 */

import { useState } from 'react';

export function usePagination(defaultPage = 1) {
  const [page, setPage] = useState(defaultPage);

  const resetPage = () => setPage(1);

  return { page, setPage, resetPage };
}
