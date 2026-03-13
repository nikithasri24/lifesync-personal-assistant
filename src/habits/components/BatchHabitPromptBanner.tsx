/**
 * BatchHabitPromptBanner
 *
 * Replaces SmartHabitPromptBanner with a multi-habit version.
 * Shows ALL habits that are currently due (within their 30-min reminder window)
 * in a single card with individual "Done" buttons and one "All done!" batch action.
 *
 * Streaks-style: appears from the bottom, auto-hides after 20 seconds of inactivity,
 * dismisses permanently per habit per day via localStorage.
 */

import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { X, Check, Zap } from 'lucide-react';
import { format } from 'date-fns';
import { useHabits, useHabitEntries, useCreateHabitEntry } from '@/hooks/useHabitsQuery';
import { useToast } from '@/hooks/useToast';

const AUTO_HIDE_MS = 20_000;
const DISMISS_KEY = (habitId: string, today: string) => `prompt_dismissed_${habitId}_${today}`;

export const BatchHabitPromptBanner: React.FC = () => {
  const today = format(new Date(), 'yyyy-MM-dd');
  const { data: habits = [] } = useHabits({ isActive: true });
  const { data: entries = [] } = useHabitEntries({ startDate: today, endDate: today });
  const createEntry = useCreateHabitEntry();
  const { showToast } = useToast();

  const [visible, setVisible] = useState(false);
  const [completing, setCompleting] = useState<Set<string>>(new Set());
  const [localCompleted, setLocalCompleted] = useState<Set<string>>(new Set());
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  // IDs already logged to DB today
  const loggedIds = useMemo(() => new Set(entries.map(e => e.habit_id)), [entries]);

  // Habits that need prompting right now
  const promptHabits = useMemo(() => {
    const now = new Date();
    const currentMins = now.getHours() * 60 + now.getMinutes();
    // Quiet hours: 22:00–07:00
    if (currentMins >= 22 * 60 || currentMins < 7 * 60) return [];

    return habits.filter(h => {
      if (!h.reminder_enabled || !h.reminder_time || !h.id) return false;
      const [hh, mm] = h.reminder_time.split(':').map(Number);
      const reminderMins = hh * 60 + mm;
      const inWindow = currentMins >= reminderMins && currentMins <= reminderMins + 30;
      const alreadyDone = loggedIds.has(h.id) || localCompleted.has(h.id);
      const wasDismissed = dismissed.has(h.id) || !!localStorage.getItem(DISMISS_KEY(h.id, today));
      return inWindow && !alreadyDone && !wasDismissed;
    });
  }, [habits, entries, loggedIds, localCompleted, dismissed, today]);

  // Show/hide banner
  useEffect(() => {
    if (promptHabits.length > 0) {
      setVisible(true);
      const timer = setTimeout(() => setVisible(false), AUTO_HIDE_MS);
      return () => clearTimeout(timer);
    } else {
      setVisible(false);
    }
  }, [promptHabits.length]);

  const completeHabit = useCallback(async (habitId: string) => {
    if (completing.has(habitId)) return;
    setCompleting(prev => new Set(prev).add(habitId));
    try {
      await createEntry.mutateAsync({ habit_id: habitId, date: today, value: 1 });
      setLocalCompleted(prev => new Set(prev).add(habitId));
    } catch {
      showToast('Could not log habit', 'error');
    } finally {
      setCompleting(prev => { const n = new Set(prev); n.delete(habitId); return n; });
    }
  }, [completing, createEntry, today, showToast]);

  const completeAll = useCallback(async () => {
    const pending = promptHabits.filter(h => h.id && !localCompleted.has(h.id!));
    await Promise.all(pending.map(h => completeHabit(h.id!)));
    showToast(`All ${pending.length} habit${pending.length === 1 ? '' : 's'} done! 🔥`, 'success');
  }, [promptHabits, localCompleted, completeHabit, showToast]);

  const dismissAll = useCallback(() => {
    promptHabits.forEach(h => {
      if (h.id) localStorage.setItem(DISMISS_KEY(h.id, today), '1');
    });
    setDismissed(prev => new Set([...prev, ...promptHabits.map(h => h.id!)]));
    setVisible(false);
  }, [promptHabits, today]);

  if (!visible || promptHabits.length === 0) return null;

  const allLocallyDone = promptHabits.every(h => h.id && localCompleted.has(h.id));

  return (
    <div
      className="fixed left-0 right-0 flex justify-center px-4"
      style={{
        bottom: 'calc(env(safe-area-inset-bottom, 0px) + 80px)',
        zIndex: 55,
        transition: 'opacity 0.3s, transform 0.3s',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(24px)',
        pointerEvents: visible ? 'auto' : 'none',
      }}
    >
      <div
        className="w-full rounded-2xl shadow-2xl border"
        style={{ maxWidth: '440px', backgroundColor: 'white', borderColor: '#E5D5C3', padding: '16px' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">⏰</span>
            <span className="font-bold text-gray-900 text-sm">
              {promptHabits.length === 1
                ? `Time for ${promptHabits[0].name}!`
                : `${promptHabits.length} habits ready`}
            </span>
          </div>
          <button
            onClick={dismissAll}
            className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        {/* Habit chips */}
        {promptHabits.length > 1 && (
          <div className="flex flex-col gap-2 mb-3">
            {promptHabits.map(h => {
              const done = localCompleted.has(h.id!) || loggedIds.has(h.id!);
              const loading = completing.has(h.id!);
              return (
                <div key={h.id} className="flex items-center justify-between">
                  <span
                    className="text-sm font-medium"
                    style={{ color: done ? '#16A34A' : '#5C4A3A', textDecoration: done ? 'line-through' : 'none' }}
                  >
                    {h.name}
                    {(h.streak_count ?? 0) > 0 && (
                      <span className="ml-1.5 text-xs text-orange-500">🔥{h.streak_count}</span>
                    )}
                  </span>
                  <button
                    onClick={() => { if (h.id) void completeHabit(h.id); }}
                    disabled={done || loading}
                    className="w-8 h-8 rounded-full flex items-center justify-center transition-all"
                    style={{
                      backgroundColor: done ? '#DCFCE7' : 'rgba(212,165,116,0.12)',
                      border: `1.5px solid ${done ? '#86EFAC' : '#C18B5E'}`,
                    }}
                    aria-label={`Complete ${h.name}`}
                  >
                    <Check className="w-3.5 h-3.5" style={{ color: done ? '#16A34A' : '#C18B5E' }} />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Action buttons */}
        {!allLocallyDone && (
          <div className="flex gap-2">
            {promptHabits.length > 1 && (
              <button
                onClick={() => void completeAll()}
                disabled={createEntry.isPending}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl font-semibold text-white text-sm transition-opacity disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #D4A574 0%, #C18B5E 100%)' }}
              >
                <Zap className="w-3.5 h-3.5" />
                All done!
              </button>
            )}
            {promptHabits.length === 1 && (
              <button
                onClick={() => { if (promptHabits[0].id) void completeHabit(promptHabits[0].id); }}
                disabled={createEntry.isPending || localCompleted.has(promptHabits[0].id!)}
                className="flex-1 py-2.5 rounded-xl font-semibold text-white text-sm transition-opacity disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #D4A574 0%, #C18B5E 100%)' }}
              >
                Done ✓
              </button>
            )}
            <button
              onClick={dismissAll}
              className="px-4 py-2.5 rounded-xl font-semibold text-sm bg-gray-100 hover:bg-gray-200 transition-colors"
              style={{ color: '#6B5847' }}
            >
              Later
            </button>
          </div>
        )}

        {allLocallyDone && (
          <p className="text-center text-sm font-semibold text-green-600">
            All habits completed! 🎉
          </p>
        )}
      </div>
    </div>
  );
};

export default BatchHabitPromptBanner;
