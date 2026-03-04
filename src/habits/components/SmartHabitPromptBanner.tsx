/**
 * SmartHabitPromptBanner
 * Contextual in-app banner shown when a habit's reminder time is approaching
 * and the habit hasn't been completed yet.
 */

import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { X } from 'lucide-react';
import { useHabits, useHabitEntries, useCreateHabitEntry } from '@/hooks/useHabitsQuery';
import { useToast } from '@/hooks/useToast';

const BANNER_AUTO_HIDE_MS = 15_000;

export const SmartHabitPromptBanner: React.FC = () => {
  const today = new Date().toISOString().split('T')[0];
  const { data: habits = [] } = useHabits({ isActive: true });
  const { data: entries = [] } = useHabitEntries({ startDate: today, endDate: today });
  const createEntry = useCreateHabitEntry();
  const { showToast } = useToast();
  const [dismissed, setDismissed] = useState(false);
  const [visible, setVisible] = useState(false);

  // Find the first habit that needs a prompt right now
  const promptHabit = useMemo(() => {
    const now = new Date();
    const currentMins = now.getHours() * 60 + now.getMinutes();
    // Respect quiet hours: don't show between 22:00–07:00
    if (currentMins >= 22 * 60 || currentMins < 7 * 60) return null;

    return habits.find(h => {
      if (!h.reminder_enabled || !h.reminder_time) return false;
      const [hh, mm] = h.reminder_time.split(':').map(Number);
      const reminderMins = hh * 60 + mm;
      const withinWindow = currentMins >= reminderMins && currentMins <= reminderMins + 30;
      const alreadyDone = entries.some(e => e.habit_id === h.id && e.date === today);
      const dismissKey = `prompt_dismissed_${h.id}_${today}`;
      const wasDismissed = !!localStorage.getItem(dismissKey);
      return withinWindow && !alreadyDone && !wasDismissed;
    }) ?? null;
  }, [habits, entries, today]);

  // Show/hide banner with slide animation
  useEffect(() => {
    if (promptHabit && !dismissed) {
      setVisible(true);
      const timer = setTimeout(() => setVisible(false), BANNER_AUTO_HIDE_MS);
      return () => clearTimeout(timer);
    } else {
      setVisible(false);
    }
  }, [promptHabit, dismissed]);

  const handleDone = useCallback(async () => {
    if (!promptHabit?.id) return;
    try {
      await createEntry.mutateAsync({ habit_id: promptHabit.id, date: today, value: 1 });
      showToast(`${promptHabit.name} completed! 🎉`, 'success');
    } catch {
      showToast('Could not record habit', 'error');
    }
    setDismissed(true);
  }, [promptHabit, createEntry, today, showToast]);

  const handleSkip = useCallback(() => {
    if (!promptHabit?.id) return;
    localStorage.setItem(`prompt_dismissed_${promptHabit.id}_${today}`, '1');
    setDismissed(true);
  }, [promptHabit, today]);

  if (!visible || !promptHabit) return null;

  const streakCount = promptHabit.streak_count ?? 0;

  return (
    <div
      className="fixed left-0 right-0 flex justify-center px-4"
      style={{
        bottom: 'calc(env(safe-area-inset-bottom, 0px) + 80px)',
        zIndex: 55,
        transition: 'opacity 0.3s, transform 0.3s',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(20px)',
      }}
    >
      <div
        className="w-full rounded-2xl shadow-xl border"
        style={{
          maxWidth: '480px',
          backgroundColor: 'white',
          borderColor: '#E5D5C3',
          padding: '16px',
        }}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">⏰</span>
              <span className="font-semibold text-gray-900 truncate">
                Time for {promptHabit.name}!
              </span>
            </div>
            {streakCount > 0 && (
              <p className="text-sm" style={{ color: '#9B8B7A' }}>
                You've got a {streakCount}-day streak 🔥 — keep it going!
              </p>
            )}
          </div>
          <button
            onClick={handleSkip}
            className="p-1 rounded-lg hover:bg-gray-100 transition-colors flex-shrink-0"
            aria-label="Dismiss banner"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        <div className="flex gap-2 mt-3">
          <button
            onClick={() => { void handleDone(); }}
            disabled={createEntry.isPending}
            className="flex-1 py-2.5 rounded-xl font-semibold text-white text-sm transition-opacity disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, #D4A574 0%, #C18B5E 100%)' }}
          >
            {createEntry.isPending ? 'Saving…' : 'Done ✓'}
          </button>
          <button
            onClick={handleSkip}
            className="flex-1 py-2.5 rounded-xl font-semibold text-sm bg-gray-100 hover:bg-gray-200 transition-colors"
            style={{ color: '#6B5847' }}
          >
            Skip
          </button>
        </div>
      </div>
    </div>
  );
};

export default SmartHabitPromptBanner;
