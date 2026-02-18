/**
 * TodayTasksSectionV2 Component
 * Today's tasks section with V2 design
 */

import React from 'react';
import { CheckSquare } from 'lucide-react';
import { useThemeColors } from '@/hooks/useThemeColors';
import type { Task } from '../../../lib/supabase';
import { SectionHeaderV2 } from './SectionHeaderV2';
import { EmptyStateV2 } from './EmptyStateV2';
import { TaskCardV2 } from './TaskCardV2';

export interface TodayTasksSectionV2Props {
  tasks: Task[];
  onViewAll: () => void;
  onAddTask: () => void;
  onComplete: (taskId: string) => void;
  completingTask: string | null;
}

export const TodayTasksSectionV2: React.FC<TodayTasksSectionV2Props> = ({
  tasks,
  onViewAll,
  onAddTask,
  onComplete,
  completingTask,
}) => {
  const colors = useThemeColors();

  return (
    <div
      className="rounded-2xl p-6 border mb-6"
      style={{
        backgroundColor: colors.bg.white,
        borderColor: colors.border.light,
      }}
    >
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
            onAction={onAddTask}
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

