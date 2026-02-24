/**
 * Habits Component - Enhanced with Together tab patterns
 *
 * Server State (React Query):
 * - Habits data loading and caching
 * - Habit entries data loading and caching
 * - Create/Update/Delete mutations for habits
 * - Create/Delete mutations for entries
 *
 * Client State (useModalState):
 * - Modal visibility and editing state
 */

import React, { useMemo, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { Toast } from '../components/Toast';
import { useToast } from '../hooks/useToast';
import { useModalState } from '../hooks/useModalState';
import { useThemeColors } from '../hooks/useThemeColors';
import { FeatureErrorBoundary } from '../components/FeatureErrorBoundary';
import {
  useHabits,
  useHabitEntries,
  useCreateHabit,
  useUpdateHabit,
  useDeleteHabit,
  useCreateHabitEntry,
  useDeleteHabitEntriesForDate,
  useMergedHabitsConnectionQuery,
} from '../hooks/useHabitsQuery';
import { useCurrentUserId } from '../hooks/useOwnerInfo';
import type { OwnerFilterValue } from '../components/common/OwnerFilter';
import { logger } from '../services/logger';
import type { HabitDraft } from '../habits/types';
import { toHabitDraft } from '../habits/services/habitHelpers';
import { HabitsLoadingState } from '../habits/components/layout/HabitsLoadingState';
import { HabitsErrorState } from '../habits/components/layout/HabitsErrorState';
import { HabitsHeaderV2 } from '../habits/components/v2/HabitsHeaderV2';
import { HabitCardV2 } from '../habits/components/v2/HabitCardV2';
import { HabitFormModalV2 } from '../habits/components/v2/HabitFormModalV2';
import { HabitWeeklyGridV2 } from '../habits/components/v2/HabitWeeklyGridV2';
import { FABV2 } from '../components/v2/FABV2';

// Helper function to get the start and end of the current week (Monday to Sunday)
const getWeekBoundaries = (date: Date = new Date()): { start: string; end: string } => {
  const current = new Date(date);
  const day = current.getDay();
  const diff = current.getDate() - day + (day === 0 ? -6 : 1);

  const monday = new Date(current.setDate(diff));
  monday.setHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  return {
    start: monday.toISOString().split('T')[0],
    end: sunday.toISOString().split('T')[0],
  };
};

const HabitsContent: React.FC = () => {
  // React Query hooks
  const { data: apiHabits = [], isLoading: habitsLoading, error: habitsError } = useHabits({ isActive: true });
  const { data: apiEntries = [], isLoading: entriesLoading } = useHabitEntries();

  // Merged mode support
  const { data: mergedConnection } = useMergedHabitsConnectionQuery();
  const { data: currentUserId } = useCurrentUserId();

  // Mutations
  const createHabitMutation = useCreateHabit();
  const updateHabitMutation = useUpdateHabit();
  const deleteHabitMutation = useDeleteHabit();
  const createEntryMutation = useCreateHabitEntry();
  const deleteEntriesForDateMutation = useDeleteHabitEntriesForDate();

  // Load saved view mode from localStorage
  const loadViewMode = (): 'today' | 'weekly' => {
    try {
      const saved = localStorage.getItem('habits_view_mode');
      if (saved === 'today' || saved === 'weekly') {
        return saved;
      }
    } catch (error) {
      logger.error('Habits', error as Error, { context: 'Failed to load view mode' });
    }
    return 'today';
  };

  // UI State - using useModalState
  const modals = useModalState({
    showForm: false,
    editingHabitId: null as string | null,
    ownerFilter: 'all' as OwnerFilterValue,
    viewMode: loadViewMode() as 'today' | 'weekly',
    selectedDate: new Date() as Date,
  });

  // Save view mode to localStorage when it changes
  useEffect(() => {
    try {
      localStorage.setItem('habits_view_mode', modals.state.viewMode);
    } catch (error) {
      logger.error('Habits', error as Error, { context: 'Failed to save view mode' });
    }
  }, [modals.state.viewMode]);

  const selectedDateKey = modals.state.selectedDate.toISOString().split('T')[0];
  const todayKey = new Date().toISOString().split('T')[0];
  const weekBoundaries = getWeekBoundaries();
  const { toast, showToast, dismissToast } = useToast();
  const colors = useThemeColors();

  // Get partner name for display
  const partnerName = mergedConnection?.partnerName ?? 'Partner';

  // Filter habits by owner in merged mode
  const filteredHabits = useMemo(() => {
    if (!mergedConnection || modals.state.ownerFilter === 'all') {
      return apiHabits;
    }

    if (modals.state.ownerFilter === 'mine') {
      return apiHabits.filter(habit => habit.user_id === currentUserId);
    }

    if (modals.state.ownerFilter === 'partner') {
      return apiHabits.filter(habit => habit.user_id === mergedConnection.partnerId);
    }

    return apiHabits;
  }, [apiHabits, modals.state.ownerFilter, currentUserId, mergedConnection]);

  // Combine habits with their entry counts
  const habitsWithStats = useMemo(() => {
    return filteredHabits.map((habit) => {
      const habitEntries = apiEntries.filter(entry => entry.habit_id === habit.id);
      const targetCount = habit.target_value ?? 1;
      let completionCount = 0;
      let hasReachedTarget = false;

      // Handle different frequencies
      if (habit.frequency === 'weekly') {
        completionCount = habitEntries.filter(
          entry => entry.date >= weekBoundaries.start && entry.date <= weekBoundaries.end
        ).length;
        hasReachedTarget = completionCount >= targetCount;
      } else if (habit.frequency === 'monthly') {
        const currentMonth = new Date().toISOString().slice(0, 7);
        completionCount = habitEntries.filter(
          entry => entry.date.startsWith(currentMonth)
        ).length;
        hasReachedTarget = completionCount >= targetCount;
      } else {
        // Daily habits - use selected date
        completionCount = habitEntries.filter(
          entry => entry.date === selectedDateKey
        ).length;
        hasReachedTarget = completionCount >= targetCount;
      }

      return {
        habit,
        todayCompletions: completionCount,
        targetCount,
        hasReachedTarget,
        currentStreak: habit.streak_count ?? 0,
        totalCompletions: habit.current_progress ?? 0,
      };
    });
  }, [filteredHabits, apiEntries, selectedDateKey, weekBoundaries]);

  // Create/Update handler
  const handleSubmit = async (data: HabitDraft): Promise<void> => {
    const parsedTarget = Number(data.targetValue);
    const normalizedTarget = Number.isFinite(parsedTarget) ? Math.max(1, Math.floor(parsedTarget)) : 1;

    try {
      if (modals.state.editingHabitId) {
        // UPDATE
        await updateHabitMutation.mutateAsync({
          id: modals.state.editingHabitId,
          updates: {
            name: data.name.trim(),
            description: data.description.trim() || undefined,
            frequency: data.frequency,
            target_value: normalizedTarget,
            category: data.category,
            color: data.color,
          },
        });
        showToast('Habit updated! ✏️', 'success');
        modals.close('showForm');
        modals.set('editingHabitId', null);
      } else {
        // CREATE
        await createHabitMutation.mutateAsync({
          name: data.name.trim(),
          description: data.description.trim() || undefined,
          frequency: data.frequency,
          target_value: normalizedTarget,
          category: data.category,
          color: data.color,
          is_active: true,
          streak_count: 0,
          best_streak: 0,
          current_progress: 0,
          goal_mode: 'daily-target',
        });
        showToast('Habit created! 💪', 'success');
        modals.close('showForm');
      }
    } catch (error) {
      logger.error('Habits', error as Error);
      showToast('Unable to save the habit right now. Please try again.', 'error');
      throw error; // Re-throw so FormModalV2 knows it failed
    }
  };

  // Delete handler
  const handleDelete = (): void => {
    if (modals.state.editingHabitId) {
      deleteHabitMutation.mutate(modals.state.editingHabitId, {
        onSuccess: () => {
          showToast('Habit deleted! 🗑️', 'success');
          modals.close('showForm');
          modals.set('editingHabitId', null);
        },
        onError: (error) => {
          logger.error('Habits', error);
          showToast('Deleting the habit failed. Please try again.', 'error');
        },
      });
    }
  };

  // Toggle completion (for today view - respects selected date)
  const handleToggleComplete = (habitId: string): void => {
    const habit = apiHabits.find(h => h.id === habitId);
    if (!habit) {
      logger.warn('Habits', 'Habit not found', { habitId });
      return;
    }

    const habitWithStats = habitsWithStats.find(h => h.habit.id === habitId);
    if (!habitWithStats) {
      logger.warn('Habits', 'Habit stats not found', { habitId });
      return;
    }

    // Log all entries for this habit to debug
    const entriesForHabit = apiEntries.filter(e => e.habit_id === habitId);
    logger.debug('Habits', 'Toggle complete called', {
      habitId,
      habitName: habit.name,
      selectedDateKey,
      hasReachedTarget: habitWithStats.hasReachedTarget,
      todayCompletions: habitWithStats.todayCompletions,
      targetCount: habitWithStats.targetCount,
      totalEntriesForHabit: entriesForHabit.length,
      entriesForHabit: entriesForHabit.map(e => ({ id: e.id, date: e.date, value: e.value })),
    });

    if (habitWithStats.hasReachedTarget) {
      // Unmark complete
      logger.debug('Habits', 'Deleting entries for date', { habitId, date: selectedDateKey });
      deleteEntriesForDateMutation.mutate(
        { habitId, date: selectedDateKey },
        {
          onSuccess: () => {
            logger.info('Habits', 'Entries deleted successfully', { habitId, date: selectedDateKey });
            showToast('Marked incomplete', 'success');
          },
          onError: (error) => {
            logger.error('Habits', error, { context: 'Failed to delete entries', habitId, date: selectedDateKey });
            showToast('Could not uncheck the habit. Please try again.', 'error');
          },
        }
      );
    } else {
      // Mark complete
      logger.debug('Habits', 'Creating entry for date', { habitId, date: selectedDateKey, value: 1 });
      createEntryMutation.mutate(
        {
          habit_id: habitId,
          date: selectedDateKey,
          value: 1,
        },
        {
          onSuccess: () => {
            logger.info('Habits', 'Entry created successfully', { habitId, date: selectedDateKey });
            showToast('Marked complete! ✅', 'success');
          },
          onError: (error) => {
            logger.error('Habits', error, { context: 'Failed to create entry' });
            showToast('Could not record the completion. Please try again.', 'error');
          },
        }
      );
    }
  };

  // Toggle completion for weekly view (with specific date)
  const handleToggleWeeklyEntry = (habitId: string, date: string): void => {
    const isChecked = apiEntries.some(e => e.habit_id === habitId && e.date === date);

    if (isChecked) {
      // Delete entry
      deleteEntriesForDateMutation.mutate(
        { habitId, date },
        {
          onSuccess: () => {
            showToast('Marked incomplete', 'success');
          },
        }
      );
    } else {
      // Create entry
      createEntryMutation.mutate(
        {
          habit_id: habitId,
          date,
          value: 1,
        },
        {
          onSuccess: () => {
            showToast('Marked complete! ✅', 'success');
          },
          onError: (error) => {
            logger.error('Habits', error);
            showToast('Could not record the completion. Please try again.', 'error');
          },
        }
      );
    }
  };

  // Edit handler
  const handleEditHabit = (habit: any): void => {
    modals.set('editingHabitId', habit.id);
    modals.open('showForm');
  };

  // Loading state
  if (habitsLoading || entriesLoading) {
    return <HabitsLoadingState />;
  }

  // Error state
  if (habitsError) {
    return (
      <>
        <Toast toast={toast} onDismiss={dismissToast} />
        <HabitsErrorState />
      </>
    );
  }

  // Get editing habit data
  const editingHabit = modals.state.editingHabitId
    ? apiHabits.find(h => h.id === modals.state.editingHabitId)
    : null;
  const editingDraft = editingHabit ? toHabitDraft(editingHabit) : undefined;

  // Calculate stats for header (unused now but kept for future)
  const totalHabits = filteredHabits.length;
  const completedToday = habitsWithStats.filter(h => h.hasReachedTarget).length;
  const completionPercentage = totalHabits > 0 ? Math.round((completedToday / totalHabits) * 100) : 0;
  const maxStreak = Math.max(...habitsWithStats.map(h => h.currentStreak), 0);

  return (
    <div style={{ backgroundColor: colors.bg.primary, minHeight: '100vh' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '1.5rem', paddingBottom: '5rem' }}>
        <Toast toast={toast} onDismiss={dismissToast} />

        {/* Header */}
        <HabitsHeaderV2
          totalHabits={totalHabits}
          completionPercentage={completionPercentage}
          currentStreak={maxStreak}
          completedToday={completedToday}
          onAddHabit={() => {
            modals.set('editingHabitId', null);
            modals.open('showForm');
          }}
          mergedConnection={mergedConnection}
          ownerFilter={modals.state.ownerFilter}
          onOwnerFilterChange={(value) => modals.set('ownerFilter', value)}
          partnerName={partnerName}
          viewMode={modals.state.viewMode}
          onViewModeChange={(mode) => modals.set('viewMode', mode)}
          selectedDate={modals.state.selectedDate}
          onDateChange={(date) => modals.set('selectedDate', date)}
        />

        {/* Habits List or Weekly Grid */}
        {modals.state.viewMode === 'today' ? (
          <div style={{ padding: '16px 0 100px' }}>
            {habitsWithStats.length === 0 ? (
              <div
                className="p-8 rounded-xl border-2 border-dashed text-center"
                style={{ borderColor: colors.border.medium }}
              >
                <div className="text-4xl mb-3">🎯</div>
                <p className="font-medium mb-2" style={{ color: colors.text.primary }}>
                  No habits yet
                </p>
                <p className="text-sm mb-4" style={{ color: colors.text.secondary }}>
                  Get started by adding your first habit
                </p>
                <button
                  onClick={() => {
                    modals.set('editingHabitId', null);
                    modals.open('showForm');
                  }}
                  className="px-4 py-2 rounded-lg font-semibold text-white"
                  style={{
                    background: 'linear-gradient(135deg, #D4A574 0%, #C18B5E 100%)',
                  }}
                >
                  Add First Habit
                </button>
              </div>
            ) : (
              habitsWithStats.map((habitWithStats) => (
                <HabitCardV2
                  key={habitWithStats.habit.id}
                  habit={habitWithStats.habit}
                  habitEntries={apiEntries.filter(e => e.habit_id === habitWithStats.habit.id)}
                  todayCompletions={habitWithStats.todayCompletions}
                  targetCount={habitWithStats.targetCount}
                  hasReachedTarget={habitWithStats.hasReachedTarget}
                  currentStreak={habitWithStats.currentStreak}
                  bestStreak={habitWithStats.habit.best_streak}
                  isCompleting={createEntryMutation.isPending}
                  onComplete={() => handleToggleComplete(habitWithStats.habit.id)}
                  onEdit={() => handleEditHabit(habitWithStats.habit)}
                  onDelete={() => {}} // Not used anymore
                  mergedConnection={mergedConnection}
                  currentUserId={currentUserId}
                  partnerName={partnerName}
                />
              ))
            )}
          </div>
        ) : (
          <HabitWeeklyGridV2
            habits={filteredHabits}
            entries={apiEntries}
            onToggleEntry={handleToggleWeeklyEntry}
            selectedDate={modals.state.selectedDate}
          />
        )}

        {/* FAB for quick add */}
        <button
          onClick={() => {
            modals.set('editingHabitId', null);
            modals.open('showForm');
          }}
          style={{
            position: 'fixed',
            bottom: '100px',
            right: '24px',
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #D4A574 0%, #C18B5E 100%)',
            boxShadow: '0 8px 24px rgba(193, 139, 94, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '32px',
            color: 'white',
            cursor: 'pointer',
            transition: 'all 0.3s',
            border: 'none',
            zIndex: 50,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.1)';
            e.currentTarget.style.boxShadow = '0 12px 32px rgba(193, 139, 94, 0.5)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow = '0 8px 24px rgba(193, 139, 94, 0.4)';
          }}
          aria-label="Create new habit"
        >
          +
        </button>

        {/* Form Modal */}
        <HabitFormModalV2
          isOpen={modals.state.showForm}
          onClose={() => {
            modals.close('showForm');
            modals.set('editingHabitId', null);
          }}
          onSubmit={handleSubmit}
          onDelete={handleDelete}
          initialData={editingDraft}
          isEditing={!!modals.state.editingHabitId}
          isPending={
            createHabitMutation.isPending ||
            updateHabitMutation.isPending ||
            deleteHabitMutation.isPending
          }
        />
      </div>
    </div>
  );
};

const Habits: React.FC = () => {
  return (
    <FeatureErrorBoundary feature="Habits">
      <HabitsContent />
    </FeatureErrorBoundary>
  );
};

export default Habits;
