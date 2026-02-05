/**
 * Unified Owner Badge Component
 * Displays who owns an item in merged mode
 * - Blue badge for "Me" (current user's data)
 * - Purple badge for partner's data
 *
 * Supports two API styles:
 * 1. userId + currentUserId (Finance style)
 * 2. ownerName + isOwnedByCurrentUser (Shopping style)
 */

import React from 'react';
import { User } from 'lucide-react';

interface OwnerBadgePropsUserId {
  userId: string;
  currentUserId: string;
  partnerName?: string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
}

interface OwnerBadgePropsOwnerName {
  ownerName: string;
  isOwnedByCurrentUser: boolean;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
}

type OwnerBadgeProps = OwnerBadgePropsUserId | OwnerBadgePropsOwnerName;

function isUserIdProps(props: OwnerBadgeProps): props is OwnerBadgePropsUserId {
  return 'userId' in props;
}

/**
 * Badge showing who owns an item in merged mode
 * Blue badge = "Me" (current user)
 * Purple badge = Partner's name
 */
export function OwnerBadge(props: OwnerBadgeProps) {
  const {
    size = 'sm',
    showIcon = false,
    className = ''
  } = props;

  // Normalize props to consistent format
  let isOwn: boolean;
  let displayName: string;

  if (isUserIdProps(props)) {
    isOwn = props.userId === props.currentUserId;
    displayName = isOwn ? 'Me' : (props.partnerName || 'Partner');
  } else {
    isOwn = props.isOwnedByCurrentUser;
    displayName = props.ownerName;
  }

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base',
  };

  const iconSizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
    lg: 'w-4 h-4',
  };

  const colorClasses = isOwn
    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
    : 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';

  return (
    <span
      className={`inline-flex items-center gap-1 rounded font-medium ${sizeClasses[size]} ${colorClasses} ${className}`}
      title={isOwn ? 'Your item' : `${displayName}'s item`}
    >
      {showIcon && <User className={iconSizeClasses[size]} />}
      {displayName}
    </span>
  );
}

/**
 * Compact owner badge for tight spaces
 * Shows owner name in brackets with colored text only (no background)
 */
export function CompactOwnerBadge({
  ownerName,
  isOwnedByCurrentUser,
  className = ''
}: Omit<OwnerBadgePropsOwnerName, 'size' | 'showIcon'>) {
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

export default OwnerBadge;
