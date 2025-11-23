/**
 * Habit Card Component
 * Displays an individual habit with actions and optional edit form
 */

import React from 'react';
import type { FormEvent } from 'react';
import { CheckCircle2, Pencil, RefreshCcw, Trash2, X } from 'lucide-react';
import type { HabitData } from '../../services/types';
import type { HabitDraft } from '../types';
import { HabitEditForm } from './HabitEditForm';

interface HabitCardProps {
  habit: HabitData;
  todayCompletions: number;
  targetCount: number;
  hasReachedTarget: boolean;
  currentStreak: number;
  totalCompletions: number;
  isEditing: boolean;
  editDraft: HabitDraft | null;
  isCompletingHabit: boolean;
  isUpdating: boolean;
  hasUpdateError: boolean;
  isResettingToday: boolean;
  isResettingHistory: boolean;
  isDeleting: boolean;
  onComplete: () => void;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onEditDraftChange: (draft: HabitDraft) => void;
  onEditSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onResetToday: () => void;
  onResetHistory: () => void;
  onDelete: () => void;
}

export function HabitCard({
  habit,
  todayCompletions,
  targetCount,
  hasReachedTarget,
  currentStreak,
  totalCompletions,
  isEditing,
  editDraft,
  isCompletingHabit,
  isUpdating,
  hasUpdateError,
  isResettingToday,
  isResettingHistory,
  isDeleting,
  onComplete,
  onStartEdit,
  onCancelEdit,
  onEditDraftChange,
  onEditSubmit,
  onResetToday,
  onResetHistory,
  onDelete,
}: HabitCardProps): JSX.Element {
  return (
    <article className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <p className="font-semibold text-slate-900">{habit.name}</p>
            {hasReachedTarget ? (
              <span className="rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-semibold text-green-600 border border-green-200">
                Completed today{targetCount > 1 ? ` (${todayCompletions}/${targetCount})` : ''}
              </span>
            ) : (
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600 border border-slate-200">
                Today {todayCompletions}/{targetCount}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500">{habit.category ?? 'general'} • {habit.frequency ?? 'daily'}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onComplete}
            disabled={hasReachedTarget || isEditing || isCompletingHabit}
            className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium transition ${
              hasReachedTarget || isEditing || isCompletingHabit
                ? 'cursor-not-allowed bg-emerald-100 text-emerald-400'
                : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
            }`}
          >
            <CheckCircle2 className="h-4 w-4" />
            {hasReachedTarget ? 'Completed today' : isCompletingHabit ? 'Saving...' : 'Complete today'}
          </button>
          <button
            type="button"
            onClick={isEditing ? onCancelEdit : onStartEdit}
            disabled={isUpdating}
            className={`inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1 text-xs font-medium transition disabled:opacity-50 ${
              isEditing ? 'bg-slate-100 text-slate-500' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {isEditing ? (
              <>
                <X className="h-4 w-4" />
                Cancel
              </>
            ) : (
              <>
                <Pencil className="h-4 w-4" />
                Edit
              </>
            )}
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onResetToday}
              data-testid={`habit-reset-today-${habit.id}`}
              disabled={isResettingToday}
              className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600 transition hover:bg-slate-100 disabled:opacity-50"
              title="Clear today's completion"
            >
              <RefreshCcw className="h-4 w-4" />
              {isResettingToday ? 'Resetting...' : 'Reset today'}
            </button>
            <button
              type="button"
              onClick={onResetHistory}
              data-testid={`habit-reset-streak-${habit.id}`}
              disabled={isResettingHistory}
              className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600 transition hover:bg-slate-100 disabled:opacity-50"
              title="Reset streak and history"
            >
              <RefreshCcw className="h-4 w-4" />
              {isResettingHistory ? 'Resetting...' : 'Reset streak'}
            </button>
          </div>
          <button
            type="button"
            onClick={onDelete}
            data-testid={`habit-delete-${habit.id}`}
            disabled={isDeleting}
            className="rounded-full border border-slate-200 p-1 text-slate-500 transition hover:bg-slate-100 disabled:opacity-50"
            aria-label="Delete habit"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
      {habit.description && <p className="text-sm text-slate-600">{habit.description}</p>}
      <div className="flex flex-wrap gap-3 text-xs text-slate-500">
        <span>Target: {targetCount} per {habit.frequency === 'daily' ? 'day' : habit.frequency === 'weekly' ? 'week' : 'month'}</span>
        <span>Progress: {totalCompletions}</span>
        <span>Streak: {currentStreak}</span>
      </div>
      {isEditing && editDraft && (
        <HabitEditForm
          editDraft={editDraft}
          isSubmitting={isUpdating}
          hasError={hasUpdateError}
          onDraftChange={onEditDraftChange}
          onSubmit={onEditSubmit}
          onCancel={onCancelEdit}
        />
      )}
    </article>
  );
}
