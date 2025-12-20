import React from 'react';
import { Edit2, Trash2, CheckCircle, Circle, ChevronDown, ChevronRight } from 'lucide-react';
import { StatusBadge } from '../StatusBadge';
import type { Project } from '@/hooks/useProjectsQuery';
import type { Task } from '@/types/task';

interface ProjectMetrics {
  projectId: string;
  completedTasks: number;
  totalTasks: number;
  progress: number;
  tasks: Task[];
}

interface ProjectCardProps {
  project: Project;
  metrics: ProjectMetrics;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

/**
 * Individual project card with metrics and task list
 */
export function ProjectCard({
  project,
  metrics,
  isExpanded,
  onToggleExpand,
  onEdit,
  onDelete,
}: ProjectCardProps): React.ReactElement {
  const safeProject = {
    id: project.id,
    name: project.name,
    icon: project.icon,
    status: project.status,
    description: project.description ?? '',
    color: project.color
  };

  return (
    <div className="group rounded-lg border border-slate-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md dark:border-slate-700 dark:bg-slate-800">
      {/* Project Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3 flex-1">
          <div className="text-2xl">{safeProject.icon}</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white truncate">
                {safeProject.name}
              </h3>
              <StatusBadge status={safeProject.status} />
            </div>
            {safeProject.description && (
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
                {safeProject.description}
              </p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={onEdit}
            className="rounded p-1.5 text-slate-600 hover:bg-slate-100 hover:text-indigo-600 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-indigo-400"
          >
            <Edit2 className="h-4 w-4" />
          </button>
          <button
            onClick={onDelete}
            className="rounded p-1.5 text-slate-600 hover:bg-red-50 hover:text-red-600 dark:text-slate-400 dark:hover:bg-red-900/20 dark:hover:text-red-400"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Metrics */}
      <div className="mt-4 space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-600 dark:text-slate-400">Progress</span>
          <span className="font-medium text-slate-900 dark:text-white">
            {metrics.completedTasks} / {metrics.totalTasks} tasks
          </span>
        </div>

        {/* Progress Bar */}
        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${metrics.progress}%`,
              backgroundColor: safeProject.color,
            }}
          />
        </div>

        {/* Task List Toggle */}
        {metrics.totalTasks > 0 && (
          <button
            onClick={onToggleExpand}
            className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            <span>View Tasks ({metrics.totalTasks})</span>
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>
        )}

        {isExpanded && metrics.tasks.length > 0 && (
          <div className="mt-2 space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-900/50">
            {metrics.tasks.map((task: Task) => (
              <div
                key={task.id}
                className="flex items-start gap-2 text-sm"
              >
                {task.status === 'done' ? (
                  <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-500" />
                ) : (
                  <Circle className="mt-0.5 h-4 w-4 flex-shrink-0 text-slate-400" />
                )}
                <span
                  className={`flex-1 ${
                    task.status === 'done'
                      ? 'text-slate-500 line-through dark:text-slate-500'
                      : 'text-slate-900 dark:text-white'
                  }`}
                >
                  {task.title}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
