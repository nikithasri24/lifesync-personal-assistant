import React from 'react';
import { CheckSquare, BookOpen, Target } from 'lucide-react';

interface WeeklyOverviewProps {
  completedTasks: number;
  journalEntries: number;
  totalHabits: number;
}

/**
 * Weekly overview with stats cards
 */
export function WeeklyOverview({
  completedTasks,
  journalEntries,
  totalHabits,
}: WeeklyOverviewProps): React.ReactElement {
  return (
    <div className="card animate-scale-in">
      <h3 className="text-xl font-semibold text-primary font-display mb-6">This Week</h3>
      <div className="space-y-6">
        <div className="flex items-center justify-between p-4 bg-accent-soft rounded-xl">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-accent rounded-lg">
              <CheckSquare size={18} className="text-white" />
            </div>
            <span className="font-medium text-black">Tasks Completed</span>
          </div>
          <span className="text-2xl font-bold text-black font-display">{completedTasks}</span>
        </div>
        <div className="flex items-center justify-between p-4 bg-accent-soft rounded-xl">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-accent rounded-lg">
              <BookOpen size={18} className="text-white" />
            </div>
            <span className="font-medium text-black">Journal Entries</span>
          </div>
          <span className="text-2xl font-bold text-black font-display">{journalEntries}</span>
        </div>
        <div className="flex items-center justify-between p-4 bg-accent-soft rounded-xl">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-accent rounded-lg">
              <Target size={18} className="text-white" />
            </div>
            <span className="font-medium text-black">Total Habits</span>
          </div>
          <span className="text-2xl font-bold text-black font-display">{totalHabits}</span>
        </div>
      </div>
    </div>
  );
}
