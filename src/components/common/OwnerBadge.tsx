import React from 'react';

interface OwnerBadgeProps {
  userId: string;
  currentUserId: string;
  partnerName?: string;
  className?: string;
}

/**
 * Badge showing who owns an item in merged mode
 * Blue badge = "Me" (current user)
 * Purple badge = Partner's name
 */
export function OwnerBadge({
  userId,
  currentUserId,
  partnerName = 'Partner',
  className = ''
}: OwnerBadgeProps) {
  const isOwn = userId === currentUserId;

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
        isOwn
          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
          : 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
      } ${className}`}
      title={isOwn ? 'Your item' : `${partnerName}'s item`}
    >
      {isOwn ? 'Me' : partnerName}
    </span>
  );
}
