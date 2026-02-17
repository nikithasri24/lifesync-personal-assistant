/**
 * Kanban board view component
 */
import React from 'react';
import { format, isToday, isPast } from 'date-fns';
import { CheckCircle2, CalendarDays } from 'lucide-react';
import type { Task, Project } from '../types';

interface KanbanViewProps {
  tasks: Task[];
  projects: Project[];
  selectedProject: string;
  onToggleStatus: (taskId: string) => void;
  isUpdating: boolean;
}

export function KanbanView({
  tasks,
  projects,
  selectedProject,
  onToggleStatus,
  isUpdating
}: KanbanViewProps): React.JSX.Element {
  const kanbanColumns = [
    {
      id: 'todo',
      title: 'To Do',
      tasks: tasks.filter(
        t => t.status === 'todo' && (selectedProject === 'all' || t.projectId === selectedProject)
      )
    },
    {
      id: 'done',
      title: 'Done',
      tasks: tasks.filter(
        t => t.status === 'done' && (selectedProject === 'all' || t.projectId === selectedProject)
      )
    }
  ];

  const getPriorityStyles = (priority: string, status: string): string => {
    if (status === 'done') {
      return 'bg-[#C18B5E] border-[#C18B5E] text-white';
    }
    switch (priority) {
      case 'urgent': return 'border-red-400 hover:border-red-500';
      case 'high': return 'border-orange-400 hover:border-orange-500';
      case 'medium': return 'border-[#D4A574] hover:border-[#C18B5E]';
      default: return 'border-gray-300 hover:border-gray-400';
    }
  };

  return (
    <div className="p-6">
      <div className="grid grid-cols-2 gap-6 h-full">
        {kanbanColumns.map((column) => (
          <div key={column.id} className="bg-gray-50 dark:bg-slate-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 dark:text-white">{column.title}</h3>
              <span className="bg-gray-200 dark:bg-slate-600 text-gray-700 dark:text-gray-300 px-2 py-1 rounded-full text-xs font-medium">
                {column.tasks.length}
              </span>
            </div>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {column.tasks.map((task) => {
                const project = projects.find(p => p.id === task.projectId);
                return (
                  <div
                    key={task.id}
                    className="bg-white dark:bg-slate-700 p-3 rounded-lg shadow-sm border border-gray-200 dark:border-slate-600 cursor-pointer hover:shadow-md transition-shadow"
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
                                  : 'bg-[#F5EBE0] text-[#8B6F47]'
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
              {column.tasks.length === 0 && (
                <div className="text-center py-6 text-gray-400 dark:text-slate-500">
                  <div className="text-2xl mb-2">📋</div>
                  <p className="text-sm">No {column.title.toLowerCase()} tasks</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
