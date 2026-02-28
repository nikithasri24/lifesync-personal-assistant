/**
 * PaginationV2 - Terracotta-styled page number controls
 *
 * Renders: "Showing 1–25 of 847   < 1  2  3  ...  34 >"
 * - Max 5 page buttons + ellipsis
 * - Disabled prev on page 1, disabled next on last page
 * - Matches terracotta design system
 */

import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationV2Props {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

function getPageNumbers(currentPage: number, totalPages: number): (number | '...')[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const pages: (number | '...')[] = [];

  if (currentPage <= 4) {
    pages.push(1, 2, 3, 4, 5, '...', totalPages);
  } else if (currentPage >= totalPages - 3) {
    pages.push(1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
  } else {
    pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
  }

  return pages;
}

export const PaginationV2: React.FC<PaginationV2Props> = ({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
}) => {
  if (totalPages <= 1) return null;

  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);
  const pageNumbers = getPageNumbers(currentPage, totalPages);

  const buttonBase =
    'min-w-[2.25rem] h-9 px-2 flex items-center justify-center rounded-lg text-sm font-medium transition-all';

  return (
    <div className="flex flex-col items-center gap-3 py-4">
      {/* Item count summary */}
      <p className="text-sm" style={{ color: '#6B7280' }}>
        Showing {startItem}–{endItem} of {totalItems}
      </p>

      {/* Page controls */}
      <div className="flex items-center gap-1">
        {/* Previous */}
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={`${buttonBase} disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100`}
          style={{ color: '#6B7280' }}
          aria-label="Previous page"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Page numbers */}
        {pageNumbers.map((page, idx) =>
          page === '...' ? (
            <span
              key={`ellipsis-${idx}`}
              className="min-w-[2.25rem] h-9 flex items-center justify-center text-sm"
              style={{ color: '#9CA3AF' }}
            >
              …
            </span>
          ) : (
            <button
              key={page}
              type="button"
              onClick={() => onPageChange(page as number)}
              className={buttonBase}
              style={
                page === currentPage
                  ? {
                      background: 'linear-gradient(135deg, #D4A574 0%, #C18B5E 100%)',
                      color: '#ffffff',
                    }
                  : { color: '#374151' }
              }
              aria-label={`Page ${page}`}
              aria-current={page === currentPage ? 'page' : undefined}
            >
              {page}
            </button>
          )
        )}

        {/* Next */}
        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={`${buttonBase} disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100`}
          style={{ color: '#6B7280' }}
          aria-label="Next page"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
