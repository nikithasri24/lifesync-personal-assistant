/**
 * StatsGridV2 Component
 * Grid layout for displaying stat cards with soft, muted design
 */

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  CheckCircle2, 
  Target, 
  DollarSign, 
  Heart,
  TrendingUp,
  Calendar
} from 'lucide-react';
import { StatCard } from '../../../components/v2/StatCard';
import { useTasks } from '../../../hooks/useTasksQuery';
import { useHabits } from '../../../hooks/useHabitsQuery';
import { useAccountsQuery } from '../../../hooks/useFinanceQuery';
import type { TaskData, HabitData } from '../../../services/types';

export interface StatsGridV2Props {
  className?: string;
}

export const StatsGridV2: React.FC<StatsGridV2Props> = ({ className = '' }) => {
  // Fetch data
  const { data: tasks = [], isLoading: tasksLoading } = useTasks();
  const { data: habits = [], isLoading: habitsLoading } = useHabits();
  const { data: accounts = [], isLoading: accountsLoading } = useAccountsQuery();

  // Calculate stats
  const stats = useMemo(() => {
    const todayTasks = tasks.filter((t: TaskData) => t.status !== 'done').length;
    const completedToday = tasks.filter((t: TaskData) =>
      t.status === 'done' &&
      new Date(t.updated_at || '').toDateString() === new Date().toDateString()
    ).length;

    const todayHabits = habits.length;
    const completedHabits = habits.filter((h: HabitData) => {
      // Check if habit was completed today (simplified)
      return false; // TODO: implement proper completion check
    }).length;
    const habitCompletion = todayHabits > 0 ? Math.round((completedHabits / todayHabits) * 100) : 0;

    const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);

    return {
      tasks: todayTasks,
      completedTasks: completedToday,
      habits: habitCompletion,
      balance: totalBalance,
    };
  }, [tasks, habits, accounts]);

  const isLoading = tasksLoading || habitsLoading || accountsLoading;

  if (isLoading) {
    return (
      <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 ${className}`}>
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-40 bg-gray-200 dark:bg-gray-800 rounded-xl animate-pulse"
          />
        ))}
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 ${className}`}
    >
      <StatCard
        title="Tasks Today"
        value={stats.tasks}
        subtitle={`${stats.completedTasks} completed`}
        icon={CheckCircle2}
        gradient="from-[var(--color-primary-500)]/10 to-[var(--color-primary-600)]/10"
        trend={{ value: 12, isPositive: true }}
      />

      <StatCard
        title="Habit Completion"
        value={`${stats.habits}%`}
        subtitle="Daily progress"
        icon={Target}
        gradient="from-[var(--color-accent-500)]/10 to-[var(--color-accent-600)]/10"
        trend={{ value: 8, isPositive: true }}
      />

      <StatCard
        title="Net Worth"
        value={`$${(stats.balance / 1000).toFixed(1)}K`}
        subtitle="Total balance"
        icon={DollarSign}
        gradient="from-[var(--color-secondary-500)]/10 to-[var(--color-secondary-600)]/10"
        trend={{ value: 5, isPositive: true }}
      />

      <StatCard
        title="Health Score"
        value="85%"
        subtitle="This week"
        icon={Heart}
        gradient="from-amber-500/10 to-orange-500/10"
        trend={{ value: 3, isPositive: true }}
      />
    </motion.div>
  );
};

export default StatsGridV2;

