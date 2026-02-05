/**
 * Owner Badge Component
 * Displays owner information for items in merged mode
 */

import React from 'react';
import { User } from 'lucide-react';

interface OwnerBadgeProps {
  ownerName: string;
  isOwnedByCurrentUser: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function OwnerBadge({ 
  ownerName, 
  isOwnedByCurrentUser, 
  size = 'sm',
  className = '' 
}: OwnerBadgeProps) {
  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5',
    md: 'text-sm px-2 py-1',
    lg: 'text-base px-2.5 py-1.5',
  };

  const colorClasses = isOwnedByCurrentUser
    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
    : 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300';

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-medium ${sizeClasses[size]} ${colorClasses} ${className}`}
      title={isOwnedByCurrentUser ? 'Added by you' : `Added by ${ownerName}`}
    >
      <User className="w-3 h-3" />
      {ownerName}
    </span>
  );
}

/**
 * Compact owner badge for tight spaces
 */
export function CompactOwnerBadge({ 
  ownerName, 
  isOwnedByCurrentUser,
  className = '' 
}: Omit<OwnerBadgeProps, 'size'>) {
  const colorClasses = isOwnedByCurrentUser
    ? 'text-blue-600 dark:text-blue-400'
    : 'text-purple-600 dark:text-purple-400';

  return (
    <span
      className={`text-xs font-medium ${colorClasses} ${className}`}
      title={isOwnedByCurrentUser ? 'Added by you' : `Added by ${ownerName}`}
    >
      [{ownerName}]
    </span>
  );
}

