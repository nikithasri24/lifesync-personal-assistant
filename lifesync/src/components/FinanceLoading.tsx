import React from 'react';
import { SkeletonCard, SkeletonTable, SkeletonChart } from './LoadingSpinner';

export function FinanceOverviewLoading() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="animate-pulse">
        <div className="h-8 bg-gray-300 rounded w-1/3 mb-2"></div>
        <div className="h-4 bg-gray-300 rounded w-2/3"></div>
      </div>

      {/* Account cards skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <SkeletonCard key={i} className="h-40" />
        ))}
      </div>

      {/* Summary cards skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonCard key={i} className="h-32" />
        ))}
      </div>

      {/* Quick actions skeleton */}
      <SkeletonCard className="h-48" />

      {/* Recent transactions skeleton */}
      <SkeletonTable rows={5} columns={4} />
    </div>
  );
}

export function FinanceTransactionsLoading() {
  return (
    <div className="space-y-6">
      {/* Search and filters skeleton */}
      <SkeletonCard className="h-20" />
      
      {/* Transaction table skeleton */}
      <SkeletonTable rows={10} columns={7} />
    </div>
  );
}

export function FinanceChartsLoading() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SkeletonChart />
        <SkeletonChart />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <SkeletonCard className="h-64" />
        <SkeletonCard className="h-64" />
        <SkeletonCard className="h-64" />
      </div>
    </div>
  );
}

export function FinancePortfolioLoading() {
  return (
    <div className="space-y-6">
      {/* Portfolio summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonCard key={i} className="h-32" />
        ))}
      </div>

      {/* Portfolio breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SkeletonTable rows={8} columns={5} />
        <SkeletonChart />
      </div>
    </div>
  );
}