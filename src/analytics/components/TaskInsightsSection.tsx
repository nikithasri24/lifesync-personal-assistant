import React from 'react';
import { Award } from 'lucide-react';

interface TodoItem {
  estimated_time?: number | null;
  priority?: 'low' | 'medium' | 'high' | 'urgent' | 'important';
}

interface TaskInsightsSectionProps {
  completedTodos: number;
  todoCompletionRate: number;
  todos: TodoItem[];
}

/**
 * Task insights section with metrics
 */
export function TaskInsightsSection({
  completedTodos,
  todoCompletionRate,
  todos,
}: TaskInsightsSectionProps): React.ReactElement {
  const avgTime = todos.length > 0
    ? Math.round(todos.reduce((sum: number, todo): number => sum + (todo.estimated_time ?? 30), 0) / todos.length)
    : 0;

  const highPriorityCount = todos.filter((todo): boolean =>
    (todo.priority === 'high' || todo.priority === 'urgent')
  ).length;

  return (
    <div className="card">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
        <Award className="mr-2" size={20} />
        Task Insights
      </h3>
      <div className="space-y-4">
        <div className="p-3 bg-green-50 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-green-800">Completed Tasks</span>
            <span className="text-lg font-bold text-green-600">{completedTodos}</span>
          </div>
          <div className="w-full bg-green-200 rounded-full h-2">
            <div
              className="bg-green-600 h-2 rounded-full"
              style={{ width: `${todoCompletionRate}%` }}
            />
          </div>
        </div>

        <div className="p-3 bg-blue-50 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-blue-800">Average Time</span>
            <span className="text-lg font-bold text-blue-600">{avgTime}m</span>
          </div>
          <p className="text-xs text-blue-600">Per task estimation</p>
        </div>

        <div className="p-3 bg-purple-50 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-purple-800">High Priority</span>
            <span className="text-lg font-bold text-purple-600">{highPriorityCount}</span>
          </div>
          <p className="text-xs text-purple-600">Tasks need attention</p>
        </div>
      </div>
    </div>
  );
}
