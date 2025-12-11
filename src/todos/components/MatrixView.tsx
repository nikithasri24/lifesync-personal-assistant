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

  // Helper to get due date from either dueDate or due_date
  const getDueDate = (task: Task) => task.due_date || task.dueDate;

  const matrix: EisenhowerMatrix = {
    urgentImportant: {
      title: 'Urgent & Important',
      subtitle: 'Do first',
      color: 'bg-red-50 dark:bg-slate-800',
      tasks: filteredTasks.filter(
        t => {
          const dueDate = getDueDate(t);
          return t.status !== 'done' &&
            (t.priority === 'urgent' || t.priority === 'high') &&
            dueDate &&
            (isToday(new Date(dueDate)) || isPast(new Date(dueDate)));
        }
      )
    },
    notUrgentImportant: {
      title: 'Not Urgent & Important',
      subtitle: 'Schedule',
      color: 'bg-blue-50 dark:bg-slate-800',
      tasks: filteredTasks.filter(
        t => {
          const dueDate = getDueDate(t);
          return t.status !== 'done' &&
            (t.priority === 'urgent' || t.priority === 'high') &&
            (!dueDate || (!isToday(new Date(dueDate)) && !isPast(new Date(dueDate))));
        }
      )
    },
    urgentNotImportant: {
      title: 'Urgent & Not Important',
      subtitle: 'Delegate',
      color: 'bg-yellow-50 dark:bg-slate-800',
      tasks: filteredTasks.filter(
        t => {
          const dueDate = getDueDate(t);
          return t.status !== 'done' &&
            (t.priority === 'medium' || t.priority === 'low') &&
            dueDate &&
            (isToday(new Date(dueDate)) || isPast(new Date(dueDate)));
        }
      )
    },
    notUrgentNotImportant: {
      title: 'Not Urgent & Not Important',
      subtitle: 'Eliminate',
      color: 'bg-gray-50 dark:bg-slate-800',
      tasks: filteredTasks.filter(
        t => {
          const dueDate = getDueDate(t);
          return t.status !== 'done' &&
            (t.priority === 'medium' || t.priority === 'low') &&
            (!dueDate || (!isToday(new Date(dueDate)) && !isPast(new Date(dueDate))));
        }
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
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-gray-800 dark:to-gray-800 border-l-4 border-purple-500 rounded-lg p-4">
          <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-1">
            Eisenhower Matrix
          </h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Organize your tasks by urgency and importance to prioritize what matters most.
          </p>
        </div>
      </div>

      {/* Matrix Grid */}
      <div className="flex-1 p-6 overflow-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full min-h-[600px]">
        {(Object.entries(matrix) as [keyof EisenhowerMatrix, MatrixQuadrant][]).map(([key, quadrant]) => {
          const getBorderColor = () => {
            if (key === 'urgentImportant') return 'border-red-200 dark:border-red-900/30';
            if (key === 'notUrgentImportant') return 'border-blue-200 dark:border-blue-900/30';
            if (key === 'urgentNotImportant') return 'border-yellow-200 dark:border-yellow-900/30';
            return 'border-gray-300 dark:border-gray-700';
          };

          const getHeaderColor = () => {
            if (key === 'urgentImportant') return 'bg-red-500';
            if (key === 'notUrgentImportant') return 'bg-blue-500';
            if (key === 'urgentNotImportant') return 'bg-yellow-500';
            return 'bg-gray-500';
          };

          return (
            <div
              key={key}
              className={`${quadrant.color} border-2 ${getBorderColor()} rounded-xl overflow-hidden flex flex-col shadow-sm hover:shadow-md transition-shadow`}
            >
              {/* Quadrant Header */}
              <div className={`${getHeaderColor()} px-4 py-3`}>
                <h3 className="font-bold text-white text-base">{quadrant.title}</h3>
                <p className="text-white/90 text-sm mt-0.5">{quadrant.subtitle}</p>
              </div>

              {/* Task Count Badge */}
              <div className="px-4 py-2 bg-white/50 dark:bg-gray-900/30 border-b border-gray-200 dark:border-gray-700">
                <span className="inline-flex items-center gap-1.5 bg-white dark:bg-gray-800 px-3 py-1 rounded-full text-xs font-semibold text-gray-700 dark:text-gray-300 shadow-sm">
                  <span className={`w-2 h-2 rounded-full ${getHeaderColor()}`}></span>
                  {quadrant.tasks.length} {quadrant.tasks.length === 1 ? 'task' : 'tasks'}
                </span>
              </div>

            {/* Tasks List */}
            <div className="flex-1 p-4 space-y-2 overflow-y-auto">
              {quadrant.tasks.map((task) => {
                const project = projects.find(p => p.id === task.projectId);
                const taskDueDate = getDueDate(task);
                return (
                  <div
                    key={task.id}
                    className="group bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-md transition-all cursor-pointer"
                  >
                    <div className="flex items-start gap-3">
                      <button
                        onClick={() => onToggleStatus(task.id)}
                        disabled={isUpdating}
                        className={`mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all disabled:opacity-50 flex-shrink-0 ${getPriorityStyles(
                          task.priority,
                          task.status
                        )}`}
                      >
                        {task.status === 'done' && <CheckCircle2 size={12} className="text-white" />}
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-gray-900 dark:text-white text-sm mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {task.title}
                        </div>
                        {task.description && (
                          <div className="text-xs text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                            {task.description}
                          </div>
                        )}
                        <div className="flex flex-wrap items-center gap-1.5 text-xs">
                          {task.priority !== 'low' && (
                            <span
                              className={`px-2 py-0.5 rounded-md font-semibold ${
                                task.priority === 'urgent'
                                  ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                                  : task.priority === 'high'
                                  ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400'
                                  : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
              }`}
                            >
                              {task.priority}
                            </span>
                          )}
                          {taskDueDate && (
                            <span
                              className={`flex items-center gap-1 px-2 py-0.5 rounded-md font-medium ${
                                isPast(new Date(taskDueDate))
                                  ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                                  : isToday(new Date(taskDueDate))
                                  ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400'
                                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                              }`}
                            >
                              <CalendarDays size={12} />
                              <span>
                                {isPast(new Date(taskDueDate))
                                  ? 'Overdue'
                                  : isToday(new Date(taskDueDate))
                                  ? 'Today'
                                  : format(new Date(taskDueDate), 'MMM d')}
                              </span>
                            </span>
                          )}
                          {project && (
                            <span className="flex items-center gap-1 px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded-md">
                              <div
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: project.color }}
                              ></div>
                              <span className="text-gray-700 dark:text-gray-300 font-medium">{project.name}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              {quadrant.tasks.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full min-h-[200px] text-gray-400 dark:text-gray-500">
                  <div className="text-4xl mb-3">✨</div>
                  <p className="text-sm font-medium">No tasks here</p>
                  <p className="text-xs mt-1">You're all clear!</p>
                </div>
              )}
            </div>
          </div>
          );
        })}
        </div>
      </div>
    </div>
  );
}
