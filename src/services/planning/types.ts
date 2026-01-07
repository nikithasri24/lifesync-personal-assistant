/**
 * Weekly Planning Types
 * Type definitions for weekly planning and review features
 */

export interface WeeklyOverview {
  weekStart: string;
  weekEnd: string;
  
  // Events
  events: WeekEvent[];
  eventCount: number;
  busyDays: string[]; // Days with 3+ events
  
  // Tasks
  tasksDue: WeekTask[];
  tasksOverdue: WeekTask[];
  unscheduledTasks: WeekTask[];
  
  // Goals
  activeGoals: WeekGoal[];
  goalCheckIns: GoalCheckIn[];
  
  // Habits
  habitsToMaintain: WeekHabit[];
  streaksAtRisk: WeekHabit[];
  
  // Bills
  billsDue: WeekBill[];
  
  // Insights
  estimatedWorkload: 'light' | 'moderate' | 'heavy' | 'overloaded';
  suggestedFocusAreas: string[];
  warnings: string[];
}

export interface WeekEvent {
  id: string;
  title: string;
  date: string;
  startTime?: string;
  endTime?: string;
  isAllDay: boolean;
}

export interface WeekTask {
  id: string;
  title: string;
  dueDate?: string;
  priority: string;
  estimatedHours?: number;
  category?: string;
}

export interface WeekGoal {
  id: string;
  title: string;
  progress: number;
  targetDate?: string;
  category?: string;
}

export interface GoalCheckIn {
  goalId: string;
  goalTitle: string;
  question: string;
  suggestedActions: string[];
}

export interface WeekHabit {
  id: string;
  name: string;
  currentStreak: number;
  frequency: string;
  completedThisWeek: number;
  targetThisWeek: number;
}

export interface WeekBill {
  id: string;
  name: string;
  amount: number;
  dueDate: string;
  isAutoPay: boolean;
}

export interface WeeklyReview {
  weekStart: string;
  weekEnd: string;
  
  // Accomplishments
  tasksCompleted: number;
  tasksCreated: number;
  completionRate: number;
  
  // Habits
  habitsCompleted: number;
  habitsMissed: number;
  streaksGained: number;
  streaksLost: number;
  
  // Focus
  focusMinutes: number;
  focusSessions: number;
  
  // Goals
  goalProgress: { goalId: string; goalTitle: string; progressDelta: number }[];
  
  // Mood/Energy (if tracked)
  averageMood?: number;
  averageEnergy?: number;
  
  // Insights
  wins: string[];
  areasToImprove: string[];
  lessonsLearned: string[];
  
  // Next week
  topPrioritiesNextWeek: string[];
}

export interface PlanningSession {
  id: string;
  user_id: string;
  week_start: string;
  
  // User inputs
  topPriorities: string[];
  focusAreas: string[];
  blockedTime: { day: string; reason: string }[];
  
  // Generated plan
  suggestedSchedule: { taskId: string; suggestedTime: string }[];
  
  created_at: string;
  updated_at: string;
}

