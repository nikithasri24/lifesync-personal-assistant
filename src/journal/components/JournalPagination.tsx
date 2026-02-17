import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useThemeColors } from '@/hooks/useThemeColors';

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
  const colors = useThemeColors();

  // Don't render if there's only one page or no pages
  if (totalPages <= 1) {
    return null;
  }

  const canGoPrevious = currentPage > 0;
  const canGoNext = currentPage < totalPages - 1;

  return (
    <div
      className="flex items-center justify-center gap-4 py-5"
      data-testid="journal-pagination"
    >
      <button
        type="button"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={!canGoPrevious}
        className="w-9 h-9 rounded-lg text-sm font-bold transition hover:opacity-70 disabled:opacity-50 disabled:cursor-not-allowed"
        style={{
          backgroundColor: 'rgba(212, 165, 116, 0.1)',
          color: '#C18B5E',
        }}
        aria-label="Previous page"
        data-testid="journal-pagination-prev"
      >
        <ChevronLeft className="h-5 w-5 mx-auto" strokeWidth={2.5} />
      </button>

      <span
        className="text-sm font-semibold"
        style={{ color: colors.text.secondary }}
        data-testid="journal-pagination-info"
      >
        Page {currentPage + 1} of {totalPages}
      </span>

      <button
        type="button"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={!canGoNext}
        className="w-9 h-9 rounded-lg text-sm font-bold transition hover:opacity-70 disabled:opacity-50 disabled:cursor-not-allowed"
        style={{
          backgroundColor: 'rgba(212, 165, 116, 0.1)',
          color: '#C18B5E',
        }}
        aria-label="Next page"
        data-testid="journal-pagination-next"
      >
        <ChevronRight className="h-5 w-5 mx-auto" strokeWidth={2.5} />
      </button>
    </div>
  );
}

export default JournalPagination;

