import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface JournalPaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

/**
 * Pagination controls for journal entries
 * Shows Previous/Next buttons and current page indicator
 */
export function JournalPagination({
  currentPage,
  totalPages,
  onPageChange,
}: JournalPaginationProps): React.ReactElement | null {
  // Don't render if there's only one page or no pages
  if (totalPages <= 1) {
    return null;
  }

  const canGoPrevious = currentPage > 0;
  const canGoNext = currentPage < totalPages - 1;

  return (
    <div
      className="flex items-center justify-center gap-4"
      data-testid="journal-pagination"
    >
      <button
        type="button"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={!canGoPrevious}
        className="inline-flex items-center gap-1 rounded-lg border px-3 py-2 text-sm font-medium transition border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
        style={{ color: 'inherit' }}
        aria-label="Previous page"
        data-testid="journal-pagination-prev"
      >
        <ChevronLeft className="h-4 w-4 dark:stroke-white" />
        <span className="dark:text-white">Previous</span>
      </button>

      <span
        className="text-sm text-slate-600 dark:text-white"
        data-testid="journal-pagination-info"
      >
        Page {currentPage + 1} of {totalPages}
      </span>

      <button
        type="button"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={!canGoNext}
        className="inline-flex items-center gap-1 rounded-lg border px-3 py-2 text-sm font-medium transition border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label="Next page"
        data-testid="journal-pagination-next"
      >
        <span className="text-slate-700" style={{ color: 'var(--tw-text-opacity, 1)' }}>Next</span>
        <ChevronRight className="h-4 w-4" style={{ stroke: 'currentColor' }} />
      </button>
    </div>
  );
}

export default JournalPagination;

