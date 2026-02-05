import React from 'react';

export type OwnerFilterValue = 'all' | 'mine' | 'partner';

interface OwnerFilterProps {
  value: OwnerFilterValue;
  onChange: (value: OwnerFilterValue) => void;
  partnerName?: string;
  className?: string;
}

/**
 * Filter dropdown for merged mode (All / Mine / Partner)
 */
export function OwnerFilter({
  value,
  onChange,
  partnerName = 'Partner',
  className = ''
}: OwnerFilterProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <label htmlFor="owner-filter" className="text-sm font-medium text-gray-700 dark:text-gray-300">
        Show:
      </label>
      <select
        id="owner-filter"
        value={value}
        onChange={(e) => onChange(e.target.value as OwnerFilterValue)}
        className="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="all">All</option>
        <option value="mine">Mine</option>
        <option value="partner">{partnerName}</option>
      </select>
    </div>
  );
}
