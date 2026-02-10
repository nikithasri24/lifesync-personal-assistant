import React from 'react';
import { Filter, Users, User, Clock, CheckCircle2 } from 'lucide-react';

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

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 dark:border-slate-700 pb-4">
      {/* Status Filter */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Status:</span>
        <div className="flex gap-1">
          {statusOptions.map((option) => {
            const Icon = option.icon;
            const isActive = statusFilter === option.value;
            return (
              <button
                key={option.value}
                onClick={() => onStatusFilterChange(option.value)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md ring-2 ring-indigo-200 dark:ring-indigo-800'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600'
                }`}
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
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Show:</span>
          <div className="flex gap-1">
            {ownershipOptions.map((option) => {
              const Icon = option.icon;
              const isActive = ownershipFilter === option.value;
              return (
                <button
                  key={option.value}
                  onClick={() => onOwnershipFilterChange(option.value)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-purple-600 text-white shadow-md ring-2 ring-purple-200 dark:ring-purple-800'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600'
                  }`}
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
