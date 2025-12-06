/**
 * Project Card Component
 * Displays a single project with progress and stats
 */

import React from 'react';
import type { ProjectView, TaskView } from '../types';
import { getStatusColor } from '../utils';

interface ProjectCardProps {
  project: ProjectView;
  tasks: TaskView[];
  onViewTasks: (projectId: string) => void;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  tasks,
  onViewTasks
}) => {
  const projectTasks = tasks.filter(t => t.projectId === project.id);
  const completedTasks = projectTasks.filter(t => t.status === 'completed').length;
  const progress = projectTasks.length > 0 ? (completedTasks / projectTasks.length) * 100 : 0;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="text-2xl">{project.icon}</div>
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white">{project.name}</h3>
            {project.description && (
              <p className="text-sm text-slate-600 dark:text-slate-300">{project.description}</p>
            )}
          </div>
        </div>

        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(project.status)}`}>
          {project.status.replace('_', ' ')}
        </span>
      </div>

      <div className="space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-slate-600 dark:text-slate-300">Tasks</span>
          <span className="font-medium text-slate-900 dark:text-white">
            {completedTasks}/{projectTasks.length}
          </span>
        </div>

        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
          <div
            className="h-2 rounded-full transition-all duration-500"
            style={{
              width: `${progress}%`,
              backgroundColor: project.color
            }}
          ></div>
        </div>

        <div className="flex justify-between text-sm">
          <span className="text-slate-600 dark:text-slate-300">Time</span>
          <span className="font-medium text-slate-900 dark:text-white">
            {project.actualHours}h / {project.estimatedHours}h
          </span>
        </div>

        <div className="pt-3 border-t border-slate-200 dark:border-slate-700">
          <button
            onClick={() => onViewTasks(project.id)}
            className="w-full px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            View Tasks
          </button>
        </div>
      </div>
    </div>
  );
};
