/**
 * TodayTasksSectionV2 Component
 * Today's tasks section with V2 design
 */

import React from 'react';
import { CheckSquare, Plus } from 'lucide-react';
import type { Task } from '../../../lib/supabase';
import { SectionHeaderV2 } from './SectionHeaderV2';
import { EmptyStateV2 } from './EmptyStateV2';
import { TaskCardV2 } from './TaskCardV2';

export interface TodayTasksSectionV2Props {
  tasks: Task[];
  onViewAll: () => void;
  onComplete: (taskId: string) => void;
  completingTask: string | null;
}

export const TodayTasksSectionV2: React.FC<TodayTasksSectionV2Props> = ({
  tasks,
  onViewAll,
  onComplete,
  completingTask,
}) => {
  return (
    <div className="
      bg-white dark:bg-gray-800
      rounded-2xl p-6
      border border-gray-200 dark:border-gray-700
      shadow-sm
    ">
      <SectionHeaderV2
        title="Today's Tasks"
        icon={CheckSquare}
        actionLabel="View all"
        onAction={onViewAll}
      />

      <div className="space-y-3">
        {tasks.length === 0 ? (
          <EmptyStateV2
            icon={CheckSquare}
            title="No tasks for today"
            description="You're all caught up! Create a task or enjoy your free time."
            actionLabel="Add Your First Task"
            onAction={onViewAll}
            variant="primary"
          />
        ) : (
          tasks.slice(0, 5).map((task, index) => (
            <TaskCardV2
              key={task.id}
              task={task}
              onComplete={onComplete}
              isCompleting={completingTask === task.id}
              index={index}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default TodayTasksSectionV2;

