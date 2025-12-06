/**
 * Project Statistics Component
 * Displays aggregate statistics for all projects
 */

import React from 'react';
import type { ProjectStats } from '../types';

interface ProjectStatsProps {
  stats: ProjectStats;
}

export function ProjectStats({ stats }: ProjectStatsProps): React.JSX.Element {
  const completionPercentage = stats.totalTasks > 0
    ? Math.round((stats.completedTasks / stats.totalTasks) * 100)
    : 0;

  return (
    <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-5">
      <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
        <div className="text-2xl font-bold text-slate-900 dark:text-white">{stats.totalProjects}</div>
        <div className="text-xs text-slate-600 dark:text-slate-400">Total Projects</div>
      </div>
      <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
        <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{stats.activeProjects}</div>
        <div className="text-xs text-slate-600 dark:text-slate-400">Active</div>
      </div>
      <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.completedProjects}</div>
        <div className="text-xs text-slate-600 dark:text-slate-400">Completed</div>
      </div>
      <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
        <div className="text-2xl font-bold text-slate-900 dark:text-white">{stats.totalTasks}</div>
        <div className="text-xs text-slate-600 dark:text-slate-400">Total Tasks</div>
      </div>
      <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
        <div className="text-2xl font-bold text-slate-900 dark:text-white">{completionPercentage}%</div>
        <div className="text-xs text-slate-600 dark:text-slate-400">Completion</div>
      </div>
    </div>
  );
}
