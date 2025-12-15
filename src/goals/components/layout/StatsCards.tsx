import React from 'react';

interface StatsCardsProps {
  goalStats: {
    total: number;
    completed: number;
    inProgress: number;
  };
  dreamStats: {
    total: number;
    achieved: number;
  };
}

/**
 * Stats cards showing goal and dream statistics
 */
export function StatsCards({ goalStats, dreamStats }: StatsCardsProps): React.ReactElement {
  return (
    <section className="grid gap-4 sm:grid-cols-2">
      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Goals</p>
        <p className="mt-2 text-2xl font-semibold text-slate-900">{goalStats.total}</p>
        <p className="text-xs text-slate-500">{goalStats.completed} completed • {goalStats.inProgress} in progress</p>
      </div>
      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Dreams</p>
        <p className="mt-2 text-2xl font-semibold text-slate-900">{dreamStats.total}</p>
        <p className="text-xs text-slate-500">{dreamStats.achieved} achieved</p>
      </div>
    </section>
  );
}
