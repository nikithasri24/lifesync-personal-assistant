/**
 * DependencyIndicator Component
 * Shows blocked status and dependency chain for a task
 */

import React, { useState } from 'react';
import { Link2, Lock, Unlock, ChevronDown, ChevronUp, CheckCircle2 } from 'lucide-react';
import type { TaskData } from '@/services/types';
import { getTaskDependencyInfo } from '@/hooks/useDependencies';

interface DependencyIndicatorProps {
  /** The task to show dependencies for */
  task: TaskData;
  /** All tasks (for resolving dependency info) */
  allTasks: TaskData[];
  /** Show compact or detailed view */
  variant?: 'compact' | 'detailed';
  /** Callback when clicking on a blocking task */
  onTaskClick?: (taskId: string) => void;
}

export const DependencyIndicator: React.FC<DependencyIndicatorProps> = ({
  task,
  allTasks,
  variant = 'compact',
  onTaskClick,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const depInfo = getTaskDependencyInfo(task, allTasks);
  
  // No dependencies
  if (depInfo.allDependencies.length === 0) {
    return null;
  }
  
  // Compact variant - just show icon and count
  if (variant === 'compact') {
    if (depInfo.isBlocked) {
      return (
        <div 
          className="flex items-center gap-1 text-amber-600 dark:text-amber-400"
          title={`Blocked by ${depInfo.blockingTasks.length} task(s)`}
        >
          <Lock className="w-3.5 h-3.5" />
          <span className="text-xs font-medium">{depInfo.blockingTasks.length}</span>
        </div>
      );
    }
    
    return (
      <div 
        className="flex items-center gap-1 text-green-600 dark:text-green-400"
        title="All dependencies complete"
      >
        <Unlock className="w-3.5 h-3.5" />
      </div>
    );
  }
  
  // Detailed variant - show full dependency chain
  return (
    <div className="space-y-2">
      {/* Header */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className={`flex items-center gap-2 w-full p-2 rounded-lg transition-colors ${
          depInfo.isBlocked 
            ? 'bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800' 
            : 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
        }`}
      >
        {depInfo.isBlocked ? (
          <Lock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
        ) : (
          <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
        )}
        
        <span className={`text-sm font-medium flex-1 text-left ${
          depInfo.isBlocked 
            ? 'text-amber-700 dark:text-amber-300' 
            : 'text-green-700 dark:text-green-300'
        }`}>
          {depInfo.isBlocked 
            ? `Blocked by ${depInfo.blockingTasks.length} of ${depInfo.allDependencies.length} dependencies`
            : `All ${depInfo.allDependencies.length} dependencies complete`
          }
        </span>
        
        {/* Progress bar */}
        <div className="w-16 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
          <div 
            className={`h-full transition-all ${
              depInfo.isBlocked ? 'bg-amber-500' : 'bg-green-500'
            }`}
            style={{ width: `${depInfo.completionPercentage}%` }}
          />
        </div>
        
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-slate-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-slate-400" />
        )}
      </button>
      
      {/* Expanded dependency list */}
      {isExpanded && (
        <div className="ml-4 space-y-1">
          {depInfo.allDependencies.map(dep => dep.id && (
            <div
              key={dep.id}
              onClick={() => dep.id && onTaskClick?.(dep.id)}
              className={`flex items-center gap-2 p-2 rounded-lg text-sm cursor-pointer
                         hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors ${
                dep.status === 'done'
                  ? 'text-slate-500 dark:text-slate-400'
                  : 'text-slate-700 dark:text-slate-200'
              }`}
            >
              {dep.status === 'done' ? (
                <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
              ) : (
                <Lock className="w-4 h-4 text-amber-500 flex-shrink-0" />
              )}
              <span className={dep.status === 'done' ? 'line-through' : ''}>
                {dep.title}
              </span>
              <Link2 className="w-3 h-3 text-slate-400 ml-auto" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DependencyIndicator;

