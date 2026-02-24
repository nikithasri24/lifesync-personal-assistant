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
    <div className={`inline-flex items-center ${className}`}>
      <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
        <button
          onClick={() => onChange('all')}
          className={`inline-flex items-center gap-1.5 px-3 py-2 text-sm font-semibold rounded-lg transition-all duration-200 ${
            value === 'all'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
          }`}
          aria-label="Show all items"
        >
          <Users className="h-4 w-4" />
          <span className="whitespace-nowrap">All</span>
        </button>
        <button
          onClick={() => onChange('mine')}
          className={`inline-flex items-center gap-1.5 px-3 py-2 text-sm font-semibold rounded-lg transition-all duration-200 ${
            value === 'mine'
              ? 'bg-blue-500 text-white shadow-sm'
              : 'text-slate-600 hover:bg-blue-50 hover:text-blue-700'
          }`}
          aria-label="Show my items only"
        >
          <User className="h-4 w-4" />
          <span className="whitespace-nowrap">Mine</span>
        </button>
        <button
          onClick={() => onChange('partner')}
          className={`inline-flex items-center gap-1.5 px-3 py-2 text-sm font-semibold rounded-lg transition-all duration-200 ${
            value === 'partner'
              ? 'bg-purple-500 text-white shadow-sm'
              : 'text-slate-600 hover:bg-purple-50 hover:text-purple-700'
          }`}
          aria-label={`Show ${partnerName}'s items only`}
        >
          <User className="h-4 w-4" />
          <span className="whitespace-nowrap">{partnerName}</span>
        </button>
      </div>
    </div>
  );
};

