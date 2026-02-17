import React from 'react';
import { Edit3, Trash2, CheckCircle2, RotateCcw, ChevronDown, ChevronRight } from 'lucide-react';
import type { LifeGoal } from '../types/lifeGoals';
import { BadgeV2 } from '@/components/v2/BadgeV2';
import { useThemeColors } from '@/hooks/useThemeColors';
import { gradients } from '@/styles/colors';

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

  // Priority badge variant mapping
  const getPriorityVariant = (): 'success' | 'info' | 'warning' | 'default' => {
    switch (goal.priority) {
      case 'low':
        return 'success';
      case 'medium':
        return 'info';
      case 'high':
        return 'warning';
      case 'critical':
        return 'warning';
      default:
        return 'default';
    }
  };
  const priorityVariant = getPriorityVariant();

  // Category emoji mapping
  const categoryEmoji = {
    personal: '📚',
    health: '💪',
    career: '💼',
    financial: '💰',
    fitness: '🏃',
  }[goal.category] || '🎯';

  return (
    <div
      className="goal-card rounded-2xl p-4 shadow-sm transition-all hover:shadow-md"
      style={{
        backgroundColor: colors.bg.white,
        borderWidth: '2px',
        borderColor: isCompleted ? '#4CAF50' : colors.border.light,
        opacity: isCompleted ? 0.85 : 1,
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
            <span>{categoryEmoji} {goal.category}</span>
            {goal.targetDate && (
              <>
                <span>•</span>
                <span>📅 {new Date(goal.targetDate).toLocaleDateString()}</span>
              </>
            )}
          </div>
        </div>
        <BadgeV2 variant={priorityVariant} size="sm">
          {isCompleted ? '✓ Done' :
           goal.priority === 'critical' ? 'Critical' :
           goal.priority === 'high' ? 'High' :
           goal.priority === 'medium' ? 'Medium' : 'Low'}
        </BadgeV2>
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
        <div
          className="h-2 w-full overflow-hidden rounded-full"
          style={{ backgroundColor: colors.bg.secondary }}
        >
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{
              width: `${goal.progress}%`,
              background: isCompleted
                ? 'linear-gradient(135deg, #4CAF50 0%, #388E3C 100%)'
                : gradients.primary,
            }}
          />
        </div>
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
                  Hide
                </>
              ) : (
                <>
                  <ChevronRight className="h-3.5 w-3.5" />
                  Show
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
