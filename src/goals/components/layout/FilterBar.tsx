import React from 'react';
import { Filter, Users, User, Clock, CheckCircle2 } from 'lucide-react';
import { useThemeColors } from '@/hooks/useThemeColors';

export type StatusFilter = 'all' | 'active' | 'completed';
export type OwnershipFilter = 'all' | 'mine' | 'partner' | 'shared';

interface FilterBarProps {
  // Status filter
  statusFilter: StatusFilter;
  onStatusFilterChange: (filter: StatusFilter) => void;

  // Ownership filter (only shown in merged mode)
  ownershipFilter: OwnershipFilter;
  onOwnershipFilterChange: (filter: OwnershipFilter) => void;
  isMerged: boolean;
  partnerName?: string;

  // Type-specific labels
  itemType: 'goals' | 'dreams';
}

export function FilterBar({
  statusFilter,
  onStatusFilterChange,
  ownershipFilter,
  onOwnershipFilterChange,
  isMerged,
  partnerName = 'Partner',
  itemType,
}: FilterBarProps): React.ReactElement {
  const colors = useThemeColors();

  const statusOptions: { value: StatusFilter; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { value: 'all', label: 'All', icon: Filter },
    { value: 'active', label: 'Active', icon: Clock },
    { value: 'completed', label: itemType === 'goals' ? 'Completed' : 'Achieved', icon: CheckCircle2 },
  ];

  const ownershipOptions: { value: OwnershipFilter; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { value: 'all', label: 'All', icon: Filter },
    { value: 'mine', label: 'Mine', icon: User },
    { value: 'partner', label: partnerName, icon: User },
    { value: 'shared', label: 'Shared', icon: Users },
  ];

  const getActiveButtonStyle = (isActive: boolean): React.CSSProperties => {
    if (isActive) {
      return {
        background: `linear-gradient(135deg, ${colors.accent.start} 0%, ${colors.accent.end} 100%)`,
        color: '#FFFFFF',
      };
    }
    return {
      backgroundColor: colors.bg.secondary,
      color: colors.text.tertiary,
    };
  };

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-4" style={{ borderBottom: `1px solid ${colors.border.light}` }}>
      {/* Status Filter */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium" style={{ color: colors.text.secondary }}>Status:</span>
        <div className="flex gap-1">
          {statusOptions.map((option) => {
            const Icon = option.icon;
            const isActive = statusFilter === option.value;
            return (
              <button
                key={option.value}
                onClick={() => onStatusFilterChange(option.value)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all"
                style={getActiveButtonStyle(isActive)}
                aria-label={`Filter by ${option.label.toLowerCase()}`}
                aria-pressed={isActive}
              >
                <Icon className="h-3.5 w-3.5" />
                {option.label}
                {isActive && (
                  <svg className="h-3 w-3 ml-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Ownership Filter (only in merged mode) */}
      {isMerged && (
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium" style={{ color: colors.text.secondary }}>Show:</span>
          <div className="flex gap-1">
            {ownershipOptions.map((option) => {
              const Icon = option.icon;
              const isActive = ownershipFilter === option.value;
              return (
                <button
                  key={option.value}
                  onClick={() => onOwnershipFilterChange(option.value)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all"
                  style={getActiveButtonStyle(isActive)}
                  aria-label={`Show ${option.label.toLowerCase()} ${itemType}`}
                  aria-pressed={isActive}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {option.label}
                  {isActive && (
                    <svg className="h-3 w-3 ml-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
