/**
 * Owner Badge Component
 * Displays who owns a piece of financial data in merged mode
 * - Blue badge for "Me" (current user's data)
 * - Purple badge for "Partner" (partner's data)
 */

import React from 'react';

interface OwnerBadgeProps {
  userId: string;
  currentUserId: string;
  partnerName?: string;
  className?: string;
  size?: 'sm' | 'md';
}

export function OwnerBadge({
  userId,
  currentUserId,
  partnerName,
  className = '',
  size = 'sm'
}: OwnerBadgeProps): React.JSX.Element {
  const isOwn = userId === currentUserId;

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
  };

  const colorClasses = isOwn
    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
    : 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';

  return (
    <span
      className={`inline-flex items-center rounded font-medium ${sizeClasses[size]} ${colorClasses} ${className}`}
    >
      {isOwn ? 'Me' : partnerName || 'Partner'}
    </span>
  );
}

export default OwnerBadge;

