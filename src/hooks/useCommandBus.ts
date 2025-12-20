/**
 * useCommandBus Hook
 * 
 * React hook for dispatching commands through the CommandBus.
 * Integrates with React Query for cache invalidation.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { commandBus, type Command, type CommandResult } from '@/lib/commandBus';
import { logger } from '@/services/logger';

/**
 * Map of command types to query keys that should be invalidated
 */
const COMMAND_INVALIDATION_MAP: Record<string, string[][]> = {
  // Task commands
  CREATE_TASK: [['tasks']],
  UPDATE_TASK: [['tasks']],
  DELETE_TASK: [['tasks']],
  COMPLETE_TASK: [['tasks']],
  SCHEDULE_TASK: [['tasks'], ['schedule']],
  
  // Habit commands
  CREATE_HABIT: [['habits']],
  LOG_HABIT: [['habits'], ['habit-entries']],
  UPDATE_HABIT: [['habits']],
  DELETE_HABIT: [['habits']],
  
  // Schedule commands
  CREATE_SCHEDULE_BLOCK: [['schedule'], ['schedule-blocks']],
  UPDATE_SCHEDULE_BLOCK: [['schedule'], ['schedule-blocks']],
  DELETE_SCHEDULE_BLOCK: [['schedule'], ['schedule-blocks']],
  PLAN_DAY: [['tasks'], ['schedule']],
  
  // Goal commands
  CREATE_GOAL: [['goals']],
  UPDATE_GOAL: [['goals']],
  DELETE_GOAL: [['goals']],
  
  // Inbox commands
  QUICK_CAPTURE: [['inbox']],
  PROCESS_INBOX_ITEM: [['inbox'], ['tasks'], ['shopping']],
};

/**
 * Hook to dispatch a command through the CommandBus
 * Automatically invalidates relevant React Query caches
 */
export function useCommand<T extends Command>() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (command: T): Promise<CommandResult> => {
      logger.debug('useCommand', `Dispatching ${command.type}`, { source: command.source });
      return commandBus.dispatch(command);
    },
    onSuccess: (result, command) => {
      if (result.success) {
        // Invalidate relevant queries
        const queryKeys = COMMAND_INVALIDATION_MAP[command.type] || [];
        queryKeys.forEach(key => {
          queryClient.invalidateQueries({ queryKey: key });
        });
        
        logger.debug('useCommand', `Invalidated queries for ${command.type}`, { 
          queryKeys,
          success: result.success 
        });
      }
    },
    onError: (error, command) => {
      logger.error('useCommand', `Command failed: ${command.type}`, { error });
    },
  });
}

/**
 * Hook to create a task via CommandBus
 */
export function useCreateTaskCommand() {
  const mutation = useCommand();

  return {
    ...mutation,
    createTask: (payload: {
      title: string;
      description?: string;
      priority?: 'low' | 'medium' | 'high' | 'urgent';
      dueDate?: string;
      estimatedTime?: number;
      category?: string;
      tags?: string[];
      depends_on?: string[];
    }) => {
      return mutation.mutateAsync({
        type: 'CREATE_TASK',
        timestamp: new Date(),
        source: 'ui',
        payload,
      } as Command);
    },
  };
}

/**
 * Hook to complete a task via CommandBus
 */
export function useCompleteTaskCommand() {
  const mutation = useCommand();

  return {
    ...mutation,
    completeTask: (taskId: string) => {
      return mutation.mutateAsync({
        type: 'COMPLETE_TASK',
        timestamp: new Date(),
        source: 'ui',
        payload: { id: taskId },
      } as Command);
    },
  };
}

/**
 * Hook to schedule a task via CommandBus
 */
export function useScheduleTaskCommand() {
  const mutation = useCommand();

  return {
    ...mutation,
    scheduleTask: (taskId: string, date: string, time: string) => {
      return mutation.mutateAsync({
        type: 'SCHEDULE_TASK',
        timestamp: new Date(),
        source: 'ui',
        payload: { id: taskId, date, time },
      } as Command);
    },
  };
}

/**
 * Hook to plan a day via CommandBus
 */
export function usePlanDayCommand() {
  const mutation = useCommand();

  return {
    ...mutation,
    planDay: (date: string, options?: { includeOverdue?: boolean; maxTasks?: number }) => {
      return mutation.mutateAsync({
        type: 'PLAN_DAY',
        timestamp: new Date(),
        source: 'ui',
        payload: {
          date,
          includeOverdue: options?.includeOverdue,
          maxTasks: options?.maxTasks,
        },
      } as Command);
    },
  };
}

/**
 * Hook to log a habit via CommandBus
 */
export function useLogHabitCommand() {
  const mutation = useCommand();

  return {
    ...mutation,
    logHabit: (habitId: string, date?: string, notes?: string) => {
      return mutation.mutateAsync({
        type: 'LOG_HABIT',
        timestamp: new Date(),
        source: 'ui',
        payload: { habitId, date, notes },
      } as Command);
    },
  };
}

