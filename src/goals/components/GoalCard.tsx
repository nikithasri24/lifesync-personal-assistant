import React, { useState } from 'react';
import { Edit3, Trash2, CheckCircle2, RotateCcw, ChevronDown, ChevronRight } from 'lucide-react';
import type { LifeGoal } from '../types/lifeGoals';
import { BadgeV2 } from '@/components/v2/BadgeV2';
import { useThemeColors } from '@/hooks/useThemeColors';
import { gradients } from '@/styles/colors';
import { GoalCheckinModal } from './v2/GoalCheckinModal';
import { useGoalCheckinsQuery } from '@/goals/hooks/useGoalCheckinsQuery';
import { format } from 'date-fns';

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
  const [showCheckinModal, setShowCheckinModal] = useState(false);
  const [currentGoal, setCurrentGoal] = useState(goal);

  // Load check-ins lazily only when expanded
  const { data: checkins = [] } = useGoalCheckinsQuery(isExpanded ? goal.id : null);

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
          <div className="flex items-center gap-2 text-xs flex-wrap" style={{ color: colors.text.tertiary }}>
            <span>{categoryEmoji} {goal.category}</span>
            {goal.targetDate && (
              <>
                <span>•</span>
                <span>📅 {new Date(goal.targetDate).toLocaleDateString()}</span>
                {!isCompleted && new Date(goal.targetDate) < new Date() && (
                  <span
                    className="px-1.5 py-0.5 rounded-full text-white font-semibold"
                    style={{ backgroundColor: '#DC2626', fontSize: '10px' }}
                  >
                    Overdue
                  </span>
                )}
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
          {!isCompleted && (
            <button
              type="button"
              onClick={() => setShowCheckinModal(true)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors"
              style={{ backgroundColor: 'rgba(212,165,116,0.12)', color: '#C18B5E' }}
              aria-label="Log progress check-in"
            >
              + Log
            </button>
          )}
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

      {/* Expandable content — check-in timeline */}
      {isExpanded && (
        <div className="mt-4 pt-4" style={{ borderTop: `1px solid ${colors.border.light}` }}>
          {checkins.length === 0 ? (
            <p className="text-xs text-center py-2" style={{ color: colors.text.tertiary }}>
              No progress logs yet. Tap "+ Log" to add your first check-in.
            </p>
          ) : (
            <div className="space-y-0">
              {checkins.slice(0, 5).map((c) => (
                <div
                  key={c.id}
                  className="flex gap-3 py-2.5"
                  style={{ borderBottom: `1px solid ${colors.border.light}` }}
                >
                  <span className="text-xs w-14 flex-shrink-0 mt-0.5" style={{ color: colors.text.tertiary }}>
                    {format(new Date(c.checkInDate), 'MMM d')}
                  </span>
                  <div className="flex-1 min-w-0">
                    {c.progressUpdate !== undefined && (
                      <span className="text-xs font-bold mr-1" style={{ color: '#C18B5E' }}>
                        {c.progressUpdate}%
                      </span>
                    )}
                    <span className="text-xs" style={{ color: colors.text.primary }}>{c.notes}</span>
                    {c.wins && (
                      <p className="text-xs mt-0.5" style={{ color: '#059669' }}>Win: {c.wins}</p>
                    )}
                    {c.blockers && (
                      <p className="text-xs mt-0.5" style={{ color: '#DC2626' }}>Blocker: {c.blockers}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
          {children && (
            <div className="mt-3">
              {children}
            </div>
          )}
        </div>
      )}

      {/* Check-in modal */}
      <GoalCheckinModal
        isOpen={showCheckinModal}
        goal={currentGoal}
        onClose={() => setShowCheckinModal(false)}
        onSuccess={(newProgress) => {
          setCurrentGoal((g) => ({ ...g, progress: newProgress }));
        }}
      />
    </div>
  );
}
