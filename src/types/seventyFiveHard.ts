/**
 * 75 Hard Challenge - Simplified Type Definitions
 *
 * Clean, minimal types for the simplified architecture:
 * - ONE challenge per user (active or completed)
 * - Customizable tasks (editable at creation, locked after)
 * - Daily check-ins (not in general Todos)
 * - Auto-reset on missed day (no pause/resume)
 */

// ==================== Core Types ====================

/**
 * A single task in the 75 Hard challenge
 * Defined at challenge creation, immutable afterward
 */
export interface Task {
  id: string;
  title: string;
  description?: string;
  order: number; // Display order (1, 2, 3...)
}

/**
 * Challenge status - only TWO states
 */
export type ChallengeStatus = 'active' | 'completed';

/**
 * The 75 Hard challenge
 * ONE challenge per user at a time
 */
export interface SeventyFiveHardChallenge {
  id: string;
  userId: string;

  // Core fields
  startDate: Date;
  currentDay: number; // 1-75
  status: ChallengeStatus;

  // Tasks (locked once challenge starts)
  tasks: Task[];

  // Completion
  completedAt?: Date; // Only set when day 75 completed

  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Tracks completion of a single task on a specific day
 */
export interface TaskCompletion {
  taskId: string; // References Task.id
  completed: boolean;
  completedAt?: Date; // When checkbox was checked
}

/**
 * Daily check-in
 * One per day, tracks completion of all tasks
 */
export interface DailyCheckIn {
  id: string;
  challengeId: string;

  // Which day
  date: Date; // Calendar date (e.g., 2025-01-15)
  dayNumber: number; // Challenge day (1-75)

  // Task completions (dynamic based on challenge.tasks)
  taskCompletions: TaskCompletion[];

  // Optional data
  photo?: string; // Photo URL
  weight?: number; // Weight in kg or lbs
  notes?: string; // User notes

  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

// ==================== Default Tasks ====================

/**
 * Default 75 Hard tasks (pre-filled in setup form)
 * User can edit these before starting
 */
export const DEFAULT_TASKS: Omit<Task, 'id'>[] = [
  {
    title: 'Follow a Diet',
    description: 'No cheat meals or alcohol',
    order: 1
  },
  {
    title: 'Workout Twice Daily',
    description: '45 minutes each, one must be outdoors',
    order: 2
  },
  {
    title: 'Drink 1 Gallon of Water',
    description: '',
    order: 3
  },
  {
    title: 'Read 10 Pages',
    description: 'Non-fiction or personal development',
    order: 4
  },
  {
    title: 'Take Progress Photo',
    description: '',
    order: 5
  }
];

// ==================== Constants ====================

export const CHALLENGE_CONSTANTS = {
  TOTAL_DAYS: 75,
  MIN_DAY: 1,
  MAX_DAY: 75,
  MIN_TASKS: 1,
  MAX_TASKS: 20,
  MAX_TITLE_LENGTH: 100,
  MAX_DESCRIPTION_LENGTH: 200,
  MAX_NOTES_LENGTH: 1000,
} as const;

// ==================== Type Guards ====================

/**
 * Check if challenge is active
 */
export const isActiveChallenge = (
  challenge: SeventyFiveHardChallenge | null | undefined
): challenge is SeventyFiveHardChallenge => {
  return challenge?.status === 'active';
};

/**
 * Check if challenge is completed
 */
export const isCompletedChallenge = (
  challenge: SeventyFiveHardChallenge | null | undefined
): challenge is SeventyFiveHardChallenge => {
  return challenge?.status === 'completed';
};

/**
 * Check if all tasks in a check-in are completed
 */
export const areAllTasksComplete = (
  taskCompletions: TaskCompletion[]
): boolean => {
  return taskCompletions.length > 0 && taskCompletions.every(tc => tc.completed);
};

/**
 * Calculate completion percentage for a check-in
 */
export const getCompletionPercentage = (
  taskCompletions: TaskCompletion[]
): number => {
  if (taskCompletions.length === 0) return 0;
  const completed = taskCompletions.filter(tc => tc.completed).length;
  return Math.round((completed / taskCompletions.length) * 100);
};

// ==================== Helper Functions ====================

/**
 * Generate a unique ID for tasks, check-ins, etc.
 * Uses crypto.randomUUID() for cryptographically secure IDs
 */
export const generateId = (): string => {
  return crypto.randomUUID();
};

/**
 * Create tasks from default templates with generated IDs
 */
export const createDefaultTasks = (): Task[] => {
  return DEFAULT_TASKS.map((template, index) => ({
    ...template,
    id: generateId(),
    order: index + 1
  }));
};

/**
 * Validate task array
 */
export const validateTasks = (tasks: Omit<Task, 'id'>[]): string | null => {
  if (tasks.length < CHALLENGE_CONSTANTS.MIN_TASKS) {
    return 'At least one task is required';
  }

  if (tasks.length > CHALLENGE_CONSTANTS.MAX_TASKS) {
    return `Maximum ${CHALLENGE_CONSTANTS.MAX_TASKS} tasks allowed`;
  }

  for (const task of tasks) {
    if (!task.title || task.title.trim().length === 0) {
      return 'All tasks must have a title';
    }

    if (task.title.length > CHALLENGE_CONSTANTS.MAX_TITLE_LENGTH) {
      return `Task title must be ${CHALLENGE_CONSTANTS.MAX_TITLE_LENGTH} characters or less`;
    }

    if (task.description && task.description.length > CHALLENGE_CONSTANTS.MAX_DESCRIPTION_LENGTH) {
      return `Task description must be ${CHALLENGE_CONSTANTS.MAX_DESCRIPTION_LENGTH} characters or less`;
    }
  }

  return null;
};

/**
 * Create initial task completions for a new check-in
 */
export const createInitialTaskCompletions = (tasks: Task[]): TaskCompletion[] => {
  return tasks.map(task => ({
    taskId: task.id,
    completed: false
  }));
};

// ==================== Database Mapping Types ====================

/**
 * Database representation of a challenge (for Supabase)
 */
export interface ChallengeRow {
  id: string;
  user_id: string;
  start_date: string; // ISO date string
  current_day: number;
  status: string;
  tasks: unknown; // JSONB
  completed_at?: string; // ISO timestamp
  created_at: string;
  updated_at: string;
}

/**
 * Database representation of a check-in (for Supabase)
 */
export interface CheckInRow {
  id: string;
  challenge_id: string;
  date: string; // ISO date string
  day_number: number;
  task_completions: unknown; // JSONB
  photo?: string;
  weight?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Map database row to Challenge type
 */
export const mapRowToChallenge = (row: ChallengeRow): SeventyFiveHardChallenge => {
  // Parse dates using parseISO for proper timezone handling
  // Note: For date-only fields (start_date), we create a local date to avoid timezone shifts
  const dateParts = row.start_date.split('-').map(Number);
  const startDate = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);

  return {
    id: row.id,
    userId: row.user_id,
    startDate,
    currentDay: row.current_day,
    status: row.status as ChallengeStatus,
    tasks: row.tasks as Task[],
    completedAt: row.completed_at ? new Date(row.completed_at) : undefined,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at)
  };
};

/**
 * Map Challenge to database insert object
 */
export const mapChallengeToInsert = (challenge: Partial<SeventyFiveHardChallenge>) => {
  return {
    user_id: challenge.userId,
    start_date: challenge.startDate?.toISOString().split('T')[0],
    current_day: challenge.currentDay,
    status: challenge.status,
    tasks: challenge.tasks,
    completed_at: challenge.completedAt?.toISOString(),
  };
};

/**
 * Map database row to CheckIn type
 */
export const mapRowToCheckIn = (row: CheckInRow): DailyCheckIn => {
  // Parse date as local date to avoid timezone issues
  // row.date is "YYYY-MM-DD" string from database
  const dateParts = row.date.split('-').map(Number);
  const date = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);

  return {
    id: row.id,
    challengeId: row.challenge_id,
    date,
    dayNumber: row.day_number,
    taskCompletions: row.task_completions as TaskCompletion[],
    photo: row.photo,
    weight: row.weight,
    notes: row.notes,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at)
  };
};

/**
 * Map CheckIn to database insert object
 */
export const mapCheckInToInsert = (checkIn: Partial<DailyCheckIn>) => {
  return {
    challenge_id: checkIn.challengeId,
    date: checkIn.date?.toISOString().split('T')[0],
    day_number: checkIn.dayNumber,
    task_completions: checkIn.taskCompletions,
    photo: checkIn.photo,
    weight: checkIn.weight,
    notes: checkIn.notes,
  };
};

// ==================== Statistics Types ====================

/**
 * Challenge statistics for display
 */
export interface ChallengeStats {
  totalDaysCompleted: number;
  currentStreak: number;
  completionRate: number; // 0-100
  daysRemaining: number;
  estimatedCompletionDate?: Date;
}

/**
 * Calculate challenge statistics
 */
export const calculateStats = (
  challenge: SeventyFiveHardChallenge,
  checkIns: DailyCheckIn[]
): ChallengeStats => {
  const totalDaysCompleted = checkIns.filter(c => areAllTasksComplete(c.taskCompletions)).length;
  const daysRemaining = CHALLENGE_CONSTANTS.TOTAL_DAYS - challenge.currentDay + 1;

  // Calculate current streak (consecutive days from most recent)
  let currentStreak = 0;
  const sortedCheckIns = [...checkIns].sort((a, b) => b.date.getTime() - a.date.getTime());

  for (const checkIn of sortedCheckIns) {
    if (areAllTasksComplete(checkIn.taskCompletions)) {
      currentStreak++;
    } else {
      break;
    }
  }

  const completionRate = challenge.currentDay > 1
    ? Math.round((totalDaysCompleted / (challenge.currentDay - 1)) * 100)
    : 0;

  // Estimate completion date
  let estimatedCompletionDate: Date | undefined;
  if (challenge.status === 'active') {
    estimatedCompletionDate = new Date(challenge.startDate);
    estimatedCompletionDate.setDate(estimatedCompletionDate.getDate() + CHALLENGE_CONSTANTS.TOTAL_DAYS - 1);
  }

  return {
    totalDaysCompleted,
    currentStreak,
    completionRate,
    daysRemaining,
    estimatedCompletionDate
  };
};
