/**
 * Eisenhower Matrix view component
 */
import React from 'react';
import { format, isToday, isPast } from 'date-fns';
import { CheckCircle2, CalendarDays } from 'lucide-react';
import type { Task, Project, EisenhowerMatrix, MatrixQuadrant } from '../types';

interface MatrixViewProps {
  tasks: Task[];
  projects: Project[];
  selectedProject: string;
  onToggleStatus: (taskId: string) => void;
  isUpdating: boolean;
}

export function MatrixView({
  tasks,
  projects,
  selectedProject,
  onToggleStatus,
  isUpdating
}: MatrixViewProps): React.JSX.Element {
  // Build Eisenhower Matrix
  const filteredTasks = tasks.filter(
    t => selectedProject === 'all' || t.projectId === selectedProject
  );

  const matrix: EisenhowerMatrix = {
    urgentImportant: {
      title: 'Urgent & Important',
      subtitle: 'Do first',
      color: 'bg-red-50 dark:bg-slate-800',
      tasks: filteredTasks.filter(
        t =>
          t.status !== 'done' &&
          (t.priority === 'urgent' || t.priority === 'high') &&
          t.dueDate &&
          (isToday(t.dueDate) || isPast(t.dueDate))
      )
    },
    notUrgentImportant: {
      title: 'Not Urgent & Important',
      subtitle: 'Schedule',
      color: 'bg-blue-50 dark:bg-slate-800',
      tasks: filteredTasks.filter(
        t =>
          t.status !== 'done' &&
          (t.priority === 'urgent' || t.priority === 'high') &&
          (!t.dueDate || (!isToday(t.dueDate) && !isPast(t.dueDate)))
      )
    },
    urgentNotImportant: {
      title: 'Urgent & Not Important',
      subtitle: 'Delegate',
      color: 'bg-yellow-50 dark:bg-slate-800',
      tasks: filteredTasks.filter(
        t =>
          t.status !== 'done' &&
          (t.priority === 'medium' || t.priority === 'low') &&
          t.dueDate &&
          (isToday(t.dueDate) || isPast(t.dueDate))
      )
    },
    notUrgentNotImportant: {
      title: 'Not Urgent & Not Important',
      subtitle: 'Eliminate',
      color: 'bg-gray-50 dark:bg-slate-800',
      tasks: filteredTasks.filter(
        t =>
          t.status !== 'done' &&
          (t.priority === 'medium' || t.priority === 'low') &&
          (!t.dueDate || (!isToday(t.dueDate) && !isPast(t.dueDate)))
      )
    }
  };

  const getPriorityStyles = (priority: string, status: string): string => {
    if (status === 'done') {
      return 'bg-blue-500 border-blue-500 text-white';
    }
    switch (priority) {
      case 'urgent': return 'border-red-400 hover:border-red-500';
      case 'high': return 'border-orange-400 hover:border-orange-500';
      case 'medium': return 'border-blue-400 hover:border-blue-500';
      default: return 'border-gray-300 hover:border-gray-400';
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="bg-blue-50 dark:bg-slate-800 border border-blue-200 dark:border-slate-600 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
            Eisenhower Matrix
          </h3>
          <p className="text-blue-700 dark:text-blue-300 text-sm">
            Organize your tasks by urgency and importance to prioritize what matters most.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6 h-96">
        {(Object.entries(matrix) as [keyof EisenhowerMatrix, MatrixQuadrant][]).map(([key, quadrant]) => (
          <div
            key={key}
            className={`${quadrant.color} dark:bg-slate-800 dark:border-slate-600 border rounded-lg p-4 flex flex-col`}
          >
            <div className="mb-4">
              <h3 className="font-semibold text-gray-900 dark:text-white">{quadrant.title}</h3>
              <p className="text-sm text-gray-600 dark:text-slate-400">{quadrant.subtitle}</p>
              <span className="inline-block mt-2 bg-white dark:bg-slate-700 px-2 py-1 rounded-full text-xs font-medium text-gray-700 dark:text-gray-300">
                {quadrant.tasks.length} tasks
              </span>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto">
              {quadrant.tasks.map((task) => {
                const project = projects.find(p => p.id === task.projectId);
                return (
                  <div
                    key={task.id}
                    className="bg-white dark:bg-slate-700 p-3 rounded-lg shadow-sm border border-gray-200 dark:border-slate-600"
                  >
                    <div className="flex items-start space-x-3">
                      <button
                        onClick={() => onToggleStatus(task.id)}
                        disabled={isUpdating}
                        className={`mt-0.5 w-4 h-4 rounded border-2 flex items-center justify-center transition-all disabled:opacity-50 ${getPriorityStyles(
                          task.priority,
                          task.status
                        )}`}
                      >
                        {task.status === 'done' && <CheckCircle2 size={10} />}
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 dark:text-white text-sm mb-1">
                          {task.title}
                        </div>
                        {task.description && (
                          <div className="text-xs text-gray-600 dark:text-slate-400 mb-2">
                            {task.description}
                          </div>
                        )}
                        <div className="flex items-center space-x-2 text-xs">
                          {task.priority !== 'low' && (
                            <span
                              className={`px-2 py-0.5 rounded-full font-medium ${
                                task.priority === 'urgent'
                                  ? 'bg-red-100 text-red-800'
                                  : task.priority === 'high'
                                  ? 'bg-orange-100 text-orange-800'
                                  : 'bg-blue-100 text-blue-800'
              }`}
                            >
                              {task.priority}
                            </span>
                          )}
                          {task.dueDate && (
                            <span
                              className={`flex items-center space-x-1 px-2 py-0.5 rounded ${
                                isPast(task.dueDate)
                                  ? 'bg-red-100 text-red-800'
                                  : isToday(task.dueDate)
                                  ? 'bg-orange-100 text-orange-800'
                                  : 'bg-gray-100 text-gray-600'
                              }`}
                            >
                              <CalendarDays size={10} />
                              <span>
                                {isPast(task.dueDate)
                                  ? 'Overdue'
                                  : isToday(task.dueDate)
                                  ? 'Today'
                                  : format(task.dueDate, 'MMM d')}
                              </span>
                            </span>
                          )}
                          {project && (
                            <span className="flex items-center space-x-1 px-2 py-0.5 bg-gray-100 dark:bg-slate-600 rounded">
                              <div
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: project.color }}
                              ></div>
                              <span className="text-gray-700 dark:text-gray-300">{project.name}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              {quadrant.tasks.length === 0 && (
                <div className="text-center py-6 text-gray-400 dark:text-slate-500">
                  <div className="text-2xl mb-2">🎆</div>
                  <p className="text-sm">No tasks here</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
