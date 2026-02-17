import React from 'react';

export type OwnerFilterValue = 'all' | 'mine' | 'partner';

interface OwnerFilterProps {
  value: OwnerFilterValue;
  onChange: (value: OwnerFilterValue) => void;
  partnerName?: string;
  className?: string;
}

/**
 * Filter pills for merged mode (Mine / Partner's / Both)
 * Matches notes-design-spec.html styling
 */
export function OwnerFilter({
  value,
  onChange,
  partnerName = 'Partner',
  className = ''
}: OwnerFilterProps) {
  const pills: { value: OwnerFilterValue; label: string }[] = [
    { value: 'mine', label: 'Mine' },
    { value: 'partner', label: `${partnerName}'s` },
    { value: 'all', label: 'Both' },
  ];

  return (
    <div className={`flex gap-2 ${className}`}>
      {pills.map((pill) => {
        const isActive = value === pill.value;
        return (
          <button
            key={pill.value}
            onClick={() => onChange(pill.value)}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
              isActive
                ? 'border-2 text-terracotta-600'
                : 'border-2 border-transparent'
            }`}
            style={{
              background: isActive
                ? 'linear-gradient(135deg, rgba(212, 165, 116, 0.2) 0%, rgba(193, 139, 94, 0.2) 100%)'
                : '#E8DCC8',
              borderColor: isActive ? '#C18B5E' : 'transparent',
              color: isActive ? '#C18B5E' : '#5C4A3A',
            }}
            aria-label={`Filter by ${pill.label}`}
          >
            {pill.label}
          </button>
        );
      })}
    </div>
  );
}
