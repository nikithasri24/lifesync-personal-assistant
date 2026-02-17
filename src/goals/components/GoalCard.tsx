import React from 'react';
import { Edit3, Trash2, CheckCircle2, RotateCcw, ChevronDown, ChevronRight } from 'lucide-react';
import type { LifeGoal } from '../types/lifeGoals';
import { PriorityBadge } from './PriorityBadge';
import { ProgressBar } from './ProgressBar';
import { useThemeColors } from '@/hooks/useThemeColors';

interface GoalCardProps {
  goal: LifeGoal;
  onEdit: (goal: LifeGoal) => void;
  onComplete: (goalId: string) => void;
  onUndoComplete: (goalId: string) => void;
  onDelete: (goalId: string) => void;
  onExpand?: (goalId: string) => void;
  isExpanded?: boolean;
  isPartner?: boolean;
  children?: React.ReactNode;
}

/**
 * Modern goal card with terracotta theme, priority badge, and gradient progress bar
 */
export function GoalCard({
  goal,
  onEdit,
  onComplete,
  onUndoComplete,
  onDelete,
  onExpand,
  isExpanded = false,
  isPartner = false,
  children,
}: GoalCardProps): React.ReactElement {
  const colors = useThemeColors();
  const isCompleted = goal.status === 'completed';

  return (
    <div
      className="goal-card rounded-2xl p-4 shadow-sm transition-all hover:shadow-md"
      style={{
        backgroundColor: colors.bg.white,
        borderWidth: '1px',
        borderColor: colors.border.light,
      }}
    >
      {/* Header: Title + Priority Badge */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <h3
            className="goal-title text-base font-semibold mb-1"
            style={{ color: colors.text.primary }}
          >
            {goal.title}
          </h3>
          <div className="flex items-center gap-2 text-xs" style={{ color: colors.text.tertiary }}>
            <span>{goal.category}</span>
            {goal.targetDate && (
              <>
                <span>•</span>
                <span>Due {new Date(goal.targetDate).toLocaleDateString()}</span>
              </>
            )}
          </div>
        </div>
        <PriorityBadge priority={goal.priority} />
      </div>

      {/* Description */}
      {goal.description && (
        <p className="text-sm mb-3" style={{ color: colors.text.secondary, lineHeight: '1.5' }}>
          {goal.description}
        </p>
      )}

      {/* Progress Bar */}
      <div className="mb-3">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs font-semibold" style={{ color: colors.text.secondary }}>
            Progress
          </span>
          <span className="text-xs font-bold" style={{ color: colors.text.primary }}>
            {goal.progress}%
          </span>
        </div>
        <ProgressBar percentage={goal.progress} />
      </div>

      {/* Category Tag */}
      <div className="mb-3">
        <span
          className="inline-block px-3 py-1 rounded-full text-xs font-semibold"
          style={{
            backgroundColor: colors.badge.bg,
            color: colors.badge.text,
          }}
        >
          {goal.category}
        </span>
      </div>

      {/* Action Buttons */}
      {!isPartner && (
        <div className="flex items-center gap-2 pt-3" style={{ borderTop: `1px solid ${colors.border.light}` }}>
          {isCompleted ? (
            <button
              type="button"
              onClick={() => onUndoComplete(goal.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors"
              style={{
                backgroundColor: 'rgba(251, 191, 36, 0.15)',
                color: '#D97706',
              }}
              aria-label="Reopen goal"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reopen
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onComplete(goal.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors"
              style={{
                backgroundColor: 'rgba(16, 185, 129, 0.15)',
                color: '#059669',
              }}
              aria-label="Mark as complete"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              Complete
            </button>
          )}
          <button
            type="button"
            onClick={() => onEdit(goal)}
            className="p-1.5 rounded-full transition-colors"
            style={{
              backgroundColor: colors.bg.secondary,
              color: colors.text.tertiary,
            }}
            aria-label="Edit goal"
          >
            <Edit3 className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(goal.id)}
            className="p-1.5 rounded-full transition-colors"
            style={{
              backgroundColor: colors.bg.secondary,
              color: colors.text.tertiary,
            }}
            aria-label="Delete goal"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
          {onExpand && (
            <button
              type="button"
              onClick={() => onExpand(goal.id)}
              className="ml-auto flex items-center gap-1 text-xs font-medium transition-colors"
              style={{ color: colors.accent.end }}
              aria-label={isExpanded ? "Hide details" : "Show details"}
            >
              {isExpanded ? (
                <>
                  <ChevronDown className="h-3.5 w-3.5" />
                  Hide details
                </>
              ) : (
                <>
                  <ChevronRight className="h-3.5 w-3.5" />
                  Show details
                </>
              )}
            </button>
          )}
        </div>
      )}

      {/* Expandable content (milestones, check-ins, etc.) */}
      {isExpanded && children && (
        <div className="mt-4 pt-4" style={{ borderTop: `1px solid ${colors.border.light}` }}>
          {children}
        </div>
      )}
    </div>
  );
}
