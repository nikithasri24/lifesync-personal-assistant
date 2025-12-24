/**
 * DashboardV2 - Redesigned Dashboard
 * Premium design with glassmorphism, animations, and better UX
 */

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  CheckCircle2, 
  Calendar, 
  TrendingUp, 
  Heart,
  Zap,
  Target,
  DollarSign,
  Activity
} from 'lucide-react';
import { Card } from '../components/v2/Card';
import { StatCard } from '../components/v2/StatCard';
import { Button } from '../components/v2/Button';
import { useTasks } from '../hooks/useTasksQuery';
import { useHabits } from '../hooks/useHabitsQuery';
import { useAccountsQuery } from '../hooks/useFinanceQuery';
import { format } from 'date-fns';
import type { TaskData, HabitData } from '../services/types';

const DashboardV2: React.FC = () => {
  // Fetch data
  const { data: tasks = [] } = useTasks();
  const { data: habits = [] } = useHabits();
  const { data: accounts = [] } = useAccountsQuery();

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

  // Time-based greeting
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return { text: 'Good Morning', emoji: '🌅' };
    if (hour < 18) return { text: 'Good Afternoon', emoji: '☀️' };
    if (hour < 22) return { text: 'Good Evening', emoji: '🌆' };
    return { text: 'Good Night', emoji: '🌙' };
  }, []);

  const today = format(new Date(), 'EEEE, MMMM d, yyyy');

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Greeting Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center space-y-2"
        >
          <h1 className="text-5xl font-bold text-[var(--text-primary)] flex items-center justify-center gap-3">
            {greeting.text} <span className="text-6xl">{greeting.emoji}</span>
          </h1>
          <p className="text-xl text-[var(--text-secondary)]">{today}</p>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          <StatCard
            title="Tasks Today"
            value={stats.tasks}
            subtitle={`${stats.completedTasks} completed`}
            icon={CheckCircle2}
            gradient="from-slate-400/15 to-blue-400/15"
            trend={{ value: 12, isPositive: true }}
          />

          <StatCard
            title="Habit Completion"
            value={`${stats.habits}%`}
            subtitle="Daily progress"
            icon={Target}
            gradient="from-teal-400/15 to-emerald-400/15"
            trend={{ value: 8, isPositive: true }}
          />

          <StatCard
            title="Net Worth"
            value={`$${(stats.balance / 1000).toFixed(1)}K`}
            subtitle="Total balance"
            icon={DollarSign}
            gradient="from-violet-400/15 to-purple-400/15"
            trend={{ value: 5, isPositive: true }}
          />

          <StatCard
            title="Health Score"
            value="85%"
            subtitle="This week"
            icon={Heart}
            gradient="from-amber-400/15 to-orange-400/15"
            trend={{ value: 3, isPositive: true }}
          />
        </motion.div>

        {/* Today's Focus */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          <Card variant="glass" padding="lg">
            <div className="flex items-center gap-3 mb-6">
              <Zap className="h-6 w-6 text-amber-600/70" />
              <h2 className="text-2xl font-bold text-[var(--text-primary)]">Today's Focus</h2>
            </div>
            
            <div className="space-y-3">
              {[
                { icon: '⚡', text: 'Complete project proposal', priority: 'high' },
                { icon: '🏃', text: '30min workout', priority: 'medium' },
                { icon: '💰', text: 'Review credit card statements', priority: 'low' },
              ].map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                  className="flex items-center gap-4 p-4 rounded-xl bg-white/50 dark:bg-gray-800/50 hover:bg-white/80 dark:hover:bg-gray-800/80 transition-all cursor-pointer group"
                >
                  <span className="text-2xl">{item.icon}</span>
                  <span className="flex-1 text-lg text-[var(--text-primary)] group-hover:text-[var(--color-primary-500)] transition-colors">
                    {item.text}
                  </span>
                  <span className={`
                    px-3 py-1 rounded-full text-xs font-semibold
                    ${item.priority === 'high' ? 'bg-rose-100/70 text-rose-600/80 dark:bg-rose-900/20 dark:text-rose-400/70' : ''}
                    ${item.priority === 'medium' ? 'bg-amber-100/70 text-amber-600/80 dark:bg-amber-900/20 dark:text-amber-400/70' : ''}
                    ${item.priority === 'low' ? 'bg-sky-100/70 text-sky-600/80 dark:bg-sky-900/20 dark:text-sky-400/70' : ''}
                  `}>
                    {item.priority}
                  </span>
                </motion.div>
              ))}
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default DashboardV2;

