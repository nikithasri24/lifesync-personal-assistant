import React, { type ReactElement } from 'react';
import { BarChart3, CheckSquare, Target, Calendar } from 'lucide-react';
import { format } from 'date-fns';

interface DayProductivity {
  date: Date;
  todos: number;
  habits: number;
  journal: number;
  total: number;
}

interface WeeklyProductivityChartProps {
  weeklyProductivity: DayProductivity[];
}

/**
 * Weekly productivity bar chart
 */
export function WeeklyProductivityChart({
  weeklyProductivity,
}: WeeklyProductivityChartProps): React.ReactElement {
  return (
    <div className="card">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
        <BarChart3 className="mr-2" size={20} />
        Weekly Productivity
      </h3>
      <div className="space-y-4">
        {weeklyProductivity.map((day, index): ReactElement => (
          <div key={index} className="flex items-center space-x-4">
            <div className="w-16 text-sm text-gray-600 flex-shrink-0">
              {format(day.date, 'EEE')}
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-1">
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min((day.total / 20) * 100, 100)}%` }}
                  />
                </div>
                <span className="text-sm font-medium text-gray-900 w-8">{day.total}</span>
              </div>
              <div className="flex space-x-4 text-xs text-gray-500">
                <span className="flex items-center">
                  <CheckSquare size={12} className="mr-1" />
                  {day.todos} tasks
                </span>
                <span className="flex items-center">
                  <Target size={12} className="mr-1" />
                  {day.habits} habits
                </span>
                <span className="flex items-center">
                  <Calendar size={12} className="mr-1" />
                  {day.journal} journal
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
