/**
 * Plan My Day - Auto-Scheduling Component
 * Automatically schedules unscheduled tasks for today based on priority, energy, and availability
 */

import React, { useState, useMemo } from 'react';
import { format, isToday, isBefore, startOfDay } from 'date-fns';
import {
  Sparkles, Calendar, Clock, CheckCircle, AlertCircle,
  Loader2, ChevronDown, ChevronUp, Zap, Target
} from 'lucide-react';
import { useTasks } from '../../hooks/useTasksQuery';
import { useAutoScheduleMutation, type AutoScheduleResult } from '../../hooks/useSchedulingQuery';
import type { Task } from '../../types/task';

interface PlanMyDayProps {
  className?: string;
  onComplete?: () => void;
}

export function PlanMyDay({ className = '', onComplete }: PlanMyDayProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [result, setResult] = useState<AutoScheduleResult | null>(null);
  
  const { data: tasks = [] } = useTasks();
  const autoScheduleMutation = useAutoScheduleMutation();

  // Get unscheduled tasks that are due today or have no due date
  const unscheduledTasks = useMemo(() => {
    const today = startOfDay(new Date());
    return (tasks as Task[]).filter(task => {
      if (task.deleted || task.archived) return false;
      if (task.status === 'done' || task.status === 'scheduled') return false;
      
      // Include tasks due today, overdue, or with no due date
      if (!task.dueDate) return true;
      const dueDate = new Date(task.dueDate);
      return isToday(dueDate) || isBefore(dueDate, today);
    });
  }, [tasks]);

  // Map to the format expected by auto-schedule
  const tasksForScheduling = useMemo(() => {
    return unscheduledTasks.map(task => ({
      id: task.id,
      title: task.title,
      priority: task.priority as 'urgent' | 'high' | 'medium' | 'low',
      estimatedMinutes: task.estimatedTime || 25, // Default 25 min (pomodoro)
      complexity: getComplexityFromPriority(task.priority),
    }));
  }, [unscheduledTasks]);

  const handlePlanMyDay = async () => {
    if (tasksForScheduling.length === 0) return;
    
    try {
      const scheduleResult = await autoScheduleMutation.mutateAsync({
        tasks: tasksForScheduling,
        date: new Date(),
      });
      setResult(scheduleResult);
      setIsExpanded(true);
      onComplete?.();
    } catch (error) {
      console.error('Auto-schedule failed:', error);
    }
  };

  const isLoading = autoScheduleMutation.isPending;

  return (
    <div className={`card ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-primary">Plan My Day</h3>
            <p className="text-xs text-secondary">
              {unscheduledTasks.length} task{unscheduledTasks.length !== 1 ? 's' : ''} to schedule
            </p>
          </div>
        </div>
        
        <button
          onClick={handlePlanMyDay}
          disabled={isLoading || unscheduledTasks.length === 0}
          className={`px-4 py-2 rounded-xl font-medium text-sm transition-all flex items-center gap-2
            ${unscheduledTasks.length === 0 
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white hover:shadow-lg hover:scale-105'
            }`}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Planning...
            </>
          ) : (
            <>
              <Zap className="w-4 h-4" />
              Auto-Schedule
            </>
          )}
        </button>
      </div>

      {/* Task Preview (collapsed view) */}
      {!result && unscheduledTasks.length > 0 && (
        <div className="space-y-2">
          {unscheduledTasks.slice(0, 3).map(task => (
            <div 
              key={task.id}
              className="flex items-center gap-3 p-2 bg-tertiary rounded-lg"
            >
              <Target className={`w-4 h-4 ${getPriorityColor(task.priority)}`} />
              <span className="text-sm text-primary truncate flex-1">{task.title}</span>
              <span className="text-xs text-muted">{task.estimatedTime || 25}m</span>
            </div>
          ))}
          {unscheduledTasks.length > 3 && (
            <p className="text-xs text-muted text-center">
              +{unscheduledTasks.length - 3} more tasks
            </p>
          )}
        </div>
      )}

      {/* Empty State */}
      {unscheduledTasks.length === 0 && !result && (
        <div className="text-center py-4">
          <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
          <p className="text-sm text-secondary">All tasks are scheduled!</p>
        </div>
      )}

      {/* Results Section */}
      {result && (
        <ResultsSection 
          result={result} 
          isExpanded={isExpanded}
          onToggle={() => setIsExpanded(!isExpanded)}
        />
      )}
    </div>
  );
}

// Helper Components

interface ResultsSectionProps {
  result: AutoScheduleResult;
  isExpanded: boolean;
  onToggle: () => void;
}

function ResultsSection({ result, isExpanded, onToggle }: ResultsSectionProps) {
  return (
    <div className="border-t border-slate-200 pt-4 mt-4">
      {/* Summary */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between text-left"
      >
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <span className="text-sm font-medium text-green-700">{result.totalScheduled} scheduled</span>
          </div>
          {result.totalUnscheduled > 0 && (
            <div className="flex items-center gap-1">
              <AlertCircle className="w-4 h-4 text-amber-600" />
              <span className="text-sm font-medium text-amber-700">{result.totalUnscheduled} couldn't fit</span>
            </div>
          )}
        </div>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-slate-500" />
        ) : (
          <ChevronDown className="w-5 h-5 text-slate-500" />
        )}
      </button>

      {/* Details */}
      {isExpanded && (
        <div className="mt-4 space-y-3">
          {/* Scheduled Tasks */}
          {result.scheduled.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-slate-500 uppercase mb-2">
                Scheduled for Today
              </h4>
              <div className="space-y-2">
                {result.scheduled.map(item => (
                  <div
                    key={item.taskId}
                    className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-xl"
                  >
                    <Calendar className="w-4 h-4 text-green-600 flex-shrink-0" />
                    <span className="text-sm font-medium text-green-800 flex-1 truncate">
                      {item.taskTitle}
                    </span>
                    <div className="flex items-center gap-1 text-xs font-medium text-green-700 bg-green-100 px-2 py-1 rounded-lg">
                      <Clock className="w-3 h-3" />
                      {format(item.start, 'h:mm a')}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Unscheduled Tasks */}
          {result.unscheduled.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-slate-500 uppercase mb-2">
                Couldn't Schedule
              </h4>
              <div className="space-y-2">
                {result.unscheduled.map(item => (
                  <div
                    key={item.taskId}
                    className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-200 rounded-xl"
                  >
                    <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                    <span className="text-sm font-medium text-amber-800 flex-1 truncate">
                      {item.taskTitle}
                    </span>
                    <span className="text-xs font-medium text-amber-700 bg-amber-100 px-2 py-1 rounded-lg">{item.reason}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Conflicts */}
          {result.conflicts.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-slate-500 uppercase mb-2">
                Conflicts Detected
              </h4>
              <div className="space-y-2">
                {result.conflicts.map((conflict, index) => (
                  <div
                    key={`${conflict.event1Title}-${conflict.event2Title}-${index}`}
                    className="flex items-start gap-3 p-3 bg-rose-50 border border-rose-200 rounded-xl"
                  >
                    <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-rose-800 truncate">
                        {conflict.event1Title} vs {conflict.event2Title}
                      </p>
                      <p className="text-xs text-rose-700 mt-1">
                        Overlap: {conflict.overlapMinutes} min · Suggested: {conflict.suggestedResolution.replace('_', ' ')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Helper Functions

function getComplexityFromPriority(priority: string): 'deep_work' | 'shallow' | 'routine' {
  switch (priority) {
    case 'urgent':
    case 'high':
      return 'deep_work';
    case 'medium':
      return 'shallow';
    default:
      return 'routine';
  }
}

function getPriorityColor(priority: string): string {
  switch (priority) {
    case 'urgent':
      return 'text-red-500';
    case 'high':
      return 'text-orange-500';
    case 'medium':
      return 'text-yellow-500';
    default:
      return 'text-blue-500';
  }
}
