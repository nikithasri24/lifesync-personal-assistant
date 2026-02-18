/**
 * OwnerFilter Component
 * Filter dropdown for merged mode to show All/Mine/Partner's items
 */

import React from 'react';
import { User, Users } from 'lucide-react';

export type OwnerFilterValue = 'all' | 'mine' | 'partner';

interface OwnerFilterProps {
  value: OwnerFilterValue;
  onChange: (value: OwnerFilterValue) => void;
  partnerName?: string;
  className?: string;
}

export const OwnerFilter: React.FC<OwnerFilterProps> = ({
  value,
  onChange,
  partnerName = 'Partner',
  className = '',
}) => {
  return (
    <div className={`flex flex-wrap items-center gap-2.5 ${className}`}>
      <span className="text-xs font-semibold uppercase tracking-wider text-slate-600">Filter:</span>
      <div className="inline-flex flex-wrap rounded-lg border border-slate-200 bg-white p-0.5 shadow-sm">
        <button
          onClick={() => onChange('all')}
          className={`inline-flex items-center gap-1.5 px-3 py-2 text-sm font-semibold rounded-md transition-all duration-200 ${
            value === 'all'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
          }`}
        >
          <Users className="h-3.5 w-3.5" />
          <span className="whitespace-nowrap">All</span>
        </button>
        <button
          onClick={() => onChange('mine')}
          className={`inline-flex items-center gap-1.5 px-3 py-2 text-sm font-semibold rounded-md transition-all duration-200 ${
            value === 'mine'
              ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-blue-50 hover:text-blue-700'
          }`}
        >
          <User className="h-3.5 w-3.5" />
          <span className="whitespace-nowrap">Mine</span>
        </button>
        <button
          onClick={() => onChange('partner')}
          className={`inline-flex items-center gap-1.5 px-3 py-2 text-sm font-semibold rounded-md transition-all duration-200 ${
            value === 'partner'
              ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-purple-50 hover:text-purple-700'
          }`}
        >
          <User className="h-3.5 w-3.5" />
          <span className="whitespace-nowrap">{partnerName}</span>
        </button>
      </div>
    </div>
  );
};

