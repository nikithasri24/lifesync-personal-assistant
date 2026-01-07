import React from 'react';

/**
 * LoadingSkeletonV2 - Soft & muted loading states
 * 
 * Features:
 * - Multiple variants (card, list, stat, text)
 * - Soft pulsing animation
 * - Muted colors
 * - Light & dark mode support
 */

type SkeletonVariant = 'card' | 'list' | 'stat' | 'text';

interface LoadingSkeletonV2Props {
  variant?: SkeletonVariant;
  count?: number;
  className?: string;
}

export function LoadingSkeletonV2({ 
  variant = 'card', 
  count = 1,
  className = '' 
}: LoadingSkeletonV2Props): React.ReactElement {
  const skeletons = Array.from({ length: count }, (_, i) => i);

  return (
    <>
      {skeletons.map((index) => (
        <SkeletonItem key={index} variant={variant} className={className} />
      ))}
    </>
  );
}

interface SkeletonItemProps {
  variant: SkeletonVariant;
  className?: string;
}

function SkeletonItem({ variant, className = '' }: SkeletonItemProps): React.ReactElement {
  const baseClasses = 'animate-pulse';

  if (variant === 'card') {
    return (
      <div
        role="status"
        aria-label="Loading content"
        className={`${baseClasses} bg-[var(--bg-secondary)] rounded-2xl shadow-sm border border-[var(--border-primary)] p-6 ${className}`}
      >
        <div className="flex items-center space-x-4">
          <div className="rounded-full bg-[var(--color-primary-200)]/40 dark:bg-[var(--color-primary-800)]/40 h-12 w-12"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-[var(--color-primary-200)]/40 dark:bg-[var(--color-primary-800)]/40 rounded w-3/4"></div>
            <div className="h-3 bg-[var(--color-primary-200)]/30 dark:bg-[var(--color-primary-800)]/30 rounded w-1/2"></div>
          </div>
        </div>
        <div className="mt-4 space-y-2">
          <div className="h-3 bg-[var(--color-primary-200)]/30 dark:bg-[var(--color-primary-800)]/30 rounded"></div>
          <div className="h-3 bg-[var(--color-primary-200)]/30 dark:bg-[var(--color-primary-800)]/30 rounded w-5/6"></div>
        </div>
      </div>
    );
  }

  if (variant === 'stat') {
    return (
      <div
        role="status"
        aria-label="Loading statistics"
        className={`${baseClasses} bg-[var(--bg-secondary)] rounded-2xl shadow-sm border border-[var(--border-primary)] p-6 ${className}`}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="h-4 bg-[var(--color-primary-200)]/40 dark:bg-[var(--color-primary-800)]/40 rounded w-1/3"></div>
          <div className="rounded-full bg-[var(--color-primary-200)]/40 dark:bg-[var(--color-primary-800)]/40 h-8 w-8"></div>
        </div>
        <div className="h-8 bg-[var(--color-primary-200)]/50 dark:bg-[var(--color-primary-800)]/50 rounded w-1/2 mb-2"></div>
        <div className="h-3 bg-[var(--color-primary-200)]/30 dark:bg-[var(--color-primary-800)]/30 rounded w-2/3"></div>
      </div>
    );
  }

  if (variant === 'list') {
    return (
      <div
        role="status"
        aria-label="Loading list item"
        className={`${baseClasses} flex items-center gap-3 p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-secondary)] ${className}`}
      >
        <div className="rounded-md bg-[var(--color-primary-200)]/40 dark:bg-[var(--color-primary-800)]/40 h-5 w-5"></div>
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-[var(--color-primary-200)]/40 dark:bg-[var(--color-primary-800)]/40 rounded w-3/4"></div>
          <div className="h-3 bg-[var(--color-primary-200)]/30 dark:bg-[var(--color-primary-800)]/30 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  // variant === 'text'
  return (
    <div
      role="status"
      aria-label="Loading text"
      className={`${baseClasses} space-y-2 ${className}`}
    >
      <div className="h-4 bg-[var(--color-primary-200)]/40 dark:bg-[var(--color-primary-800)]/40 rounded w-full"></div>
      <div className="h-4 bg-[var(--color-primary-200)]/30 dark:bg-[var(--color-primary-800)]/30 rounded w-5/6"></div>
      <div className="h-4 bg-[var(--color-primary-200)]/30 dark:bg-[var(--color-primary-800)]/30 rounded w-4/6"></div>
    </div>
  );
}

/**
 * DashboardLoadingStateV2 - Complete dashboard loading state
 */
export function DashboardLoadingStateV2(): React.ReactElement {
  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Welcome Banner Skeleton */}
      <div className="animate-pulse bg-gradient-to-br from-[var(--color-primary-400)]/10 to-[var(--color-secondary-400)]/10 rounded-2xl p-6 sm:p-8 h-32 sm:h-36 border border-[var(--border-primary)]"></div>

      {/* Stats Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <LoadingSkeletonV2 variant="stat" count={4} />
      </div>

      {/* Content Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
        <LoadingSkeletonV2 variant="card" className="h-80" />
        <LoadingSkeletonV2 variant="card" className="h-80" />
        <LoadingSkeletonV2 variant="card" className="h-80" />
        <LoadingSkeletonV2 variant="card" className="h-80" />
      </div>
    </div>
  );
}

