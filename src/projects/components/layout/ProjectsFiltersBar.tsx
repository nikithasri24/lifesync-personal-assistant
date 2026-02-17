import React from 'react';
import { Search, Grid, List } from 'lucide-react';
import type { StatusFilter } from '../../types';
import { OwnerFilter, type OwnerFilterValue } from '@/components/common/OwnerFilter';
import { SegmentedControlV2 } from '@/components/v2/SegmentedControlV2';
import { useThemeColors } from '@/hooks/useThemeColors';

interface ProjectsFiltersBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  statusFilter: StatusFilter;
  onStatusFilterChange: (filter: StatusFilter) => void;
  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;
  // Merged mode props (optional)
  showOwnerFilter?: boolean;
  ownerFilter?: OwnerFilterValue;
  onOwnerFilterChange?: (filter: OwnerFilterValue) => void;
  partnerName?: string;
}

/**
 * Filters bar with search, status filter, and view toggle using V2 components
 */
export function ProjectsFiltersBar({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  viewMode,
  onViewModeChange,
  showOwnerFilter = false,
  ownerFilter = 'all',
  onOwnerFilterChange,
  partnerName = 'Partner',
}: ProjectsFiltersBarProps): React.ReactElement {
  const colors = useThemeColors();

  return (
    <div className="mb-6 space-y-3">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: colors.text.tertiary }} />
        <input
          type="text"
          placeholder="Search projects..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 transition-all"
          style={{
            backgroundColor: colors.bg.white,
            borderWidth: '1px',
            borderColor: colors.border.light,
            color: colors.text.primary,
          }}
          aria-label="Search projects"
        />
      </div>

      {/* Filters Row */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        {/* Status Filter + Owner Filter */}
        <div className="flex gap-3 flex-1">
          <SegmentedControlV2
            segments={[
              { value: 'all', label: 'All' },
              { value: 'active', label: 'Active' },
              { value: 'completed', label: 'Done' },
            ]}
            value={statusFilter}
            onChange={(value) => onStatusFilterChange(value as StatusFilter)}
            size="sm"
            className="flex-1"
            aria-label="Filter projects by status"
          />

          {/* Owner Filter (Merged Mode) */}
          {showOwnerFilter && onOwnerFilterChange && (
            <OwnerFilter
              value={ownerFilter}
              onChange={onOwnerFilterChange}
              partnerName={partnerName}
            />
          )}
        </div>

        {/* View Toggle */}
        <SegmentedControlV2
          segments={[
            { value: 'grid', label: '', icon: <Grid className="h-4 w-4" /> },
            { value: 'list', label: '', icon: <List className="h-4 w-4" /> },
          ]}
          value={viewMode}
          onChange={(value) => onViewModeChange(value as 'grid' | 'list')}
          size="sm"
          className="w-24"
          aria-label="Toggle view mode"
        />
      </div>
    </div>
  );
}
