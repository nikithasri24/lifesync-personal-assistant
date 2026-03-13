/**
 * SmartQuickCapture
 *
 * Replaces the original QuickCapture FAB.
 * Same 1-tap surface, but now routes input to the correct handler:
 *
 *   💳 "$45 Whole Foods groceries"  → creates transaction (pre-filled)
 *   🔥 "B12 done"                  → logs habit entry instantly
 *   📝 "/note buy milk"            → creates note
 *   ✅ (anything else)             → creates task
 *
 * Voice input wired directly — one mic tap from anywhere.
 *
 * Intent chip previews update on every keystroke so the user
 * always knows what will happen before they submit.
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Plus, X, Loader2, Mic, MicOff } from 'lucide-react';
import { format } from 'date-fns';
import { logger } from '@/services/logger';
import { useToast } from '@/hooks/useToast';
import { useAuth } from '@/hooks/useAuth';
import { useThemeColors } from '@/hooks/useThemeColors';

// Data hooks
import { useHabits, useCreateHabitEntry } from '@/hooks/useHabitsQuery';
import { useCreateTask } from '@/hooks/useTasksQuery';
import { useCreateNote } from '@/hooks/useNotesQuery';
import { usePendingInboxCount, useCreateInboxItem } from '@/hooks/useInboxQuery';
import { useAccountsQuery, useCategoriesQuery } from '@/hooks/useFinanceQuery';
import { useUpsertTransactionMutation } from '@/finance/hooks/useTransactionsQuery';

// Intent parsing
import { parseIntent, matchHabitId, type ParsedIntent, type CaptureIntent } from '@/lib/intentParser';

// Voice
import { useVoiceInput } from '@/shopping/hooks/useVoiceInput';

// ── Helpers ───────────────────────────────────────────────────────────────

const INTENT_COLORS: Record<CaptureIntent, string> = {
  task:        'rgba(59,130,246,0.12)',  // blue
  transaction: 'rgba(16,185,129,0.12)', // green
  habit:       'rgba(245,158,11,0.12)', // amber
  note:        'rgba(139,92,246,0.12)', // purple
};

const INTENT_TEXT_COLORS: Record<CaptureIntent, string> = {
  task:        '#2563EB',
  transaction: '#059669',
  habit:       '#D97706',
  note:        '#7C3AED',
};

const INTENT_PLACEHOLDERS: Record<CaptureIntent, string> = {
  task:        'What needs doing?',
  transaction: '$45 Whole Foods for groceries…',
  habit:       'Which habit did you complete?',
  note:        'Start with /note …',
};

// ── Component ────────────────────────────────────────────────────────────

export function SmartQuickCapture(): React.ReactElement {
  const colors = useThemeColors();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [text, setText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // ── Voice ──
  const { isListening, startVoiceInput, stopVoiceInput } = useVoiceInput();

  // ── Queries ──
  const { data: habits = [] } = useHabits({ isActive: true });
  const { data: accounts = [] } = useAccountsQuery();
  const { data: categories = [] } = useCategoriesQuery();
  const { data: pendingCount = 0 } = usePendingInboxCount();

  // ── Mutations ──
  const createTask = useCreateTask();
  const createNote = useCreateNote();
  const createHabitEntry = useCreateHabitEntry();
  const upsertTransaction = useUpsertTransactionMutation();
  const createInboxItem = useCreateInboxItem();

  // ── Intent ──
  const habitNames = habits.map(h => h.name);
  const parsed: ParsedIntent = parseIntent(text, habitNames);

  // ── Keyboard shortcuts ──
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setIsOpen(true); }
      if (e.key === 'Escape') { setIsOpen(false); setText(''); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // ── Focus on open ──
  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 50);
  }, [isOpen]);

  // ── Voice handler ──
  const handleVoice = useCallback(() => {
    if (isListening) { stopVoiceInput(); return; }
    startVoiceInput((transcript) => {
      setText(transcript);
      // Small delay so user can see what was heard before auto-submit
      setTimeout(() => {
        if (transcript.trim()) void handleSubmit(transcript);
      }, 600);
    });
  }, [isListening, startVoiceInput, stopVoiceInput]); // eslint-disable-line

  // ── Submit ──
  const handleSubmit = useCallback(async (overrideText?: string) => {
    const raw = (overrideText ?? text).trim();
    if (!raw || isSubmitting) return;

    setIsSubmitting(true);
    const intent = parseIntent(raw, habitNames);

    try {
      switch (intent.intent) {

        case 'transaction': {
          const tx = intent.transaction ?? {};
          const amount = parseFloat(tx.amount ?? '0');
          if (!amount) {
            // No parseable amount → fall through to inbox
            await createInboxItem.mutateAsync({ content: raw, source: 'manual' });
            showToast('Saved to inbox — no amount detected 📥', 'success');
            break;
          }
          // Find best matching category
          const catHint = tx.categoryHint?.toLowerCase() ?? '';
          const matchedCat = categories.find(c => c.name.toLowerCase().includes(catHint));
          // Use first account as default
          const defaultAccount = accounts[0];
          if (!defaultAccount) {
            await createInboxItem.mutateAsync({ content: raw, source: 'manual' });
            showToast('Saved to inbox — set up a finance account first 📥', 'info');
            break;
          }
          await upsertTransaction.mutateAsync({
            userId: user?.id ?? '',
            dateISO: new Date().toISOString(),
            description: tx.description ?? raw,
            amount,
            type: tx.type ?? 'debit',
            accountId: defaultAccount.id,
            categoryId: matchedCat?.id,
          } as any);
          showToast(`${tx.type === 'credit' ? 'Income' : 'Expense'} logged: ${tx.description ?? ''} $${amount.toFixed(2)} 💳`, 'success');
          break;
        }

        case 'habit': {
          const habitId = intent.habitMatch
            ? matchHabitId(intent.habitMatch, habits)
            : undefined;

          if (habitId) {
            const today = format(new Date(), 'yyyy-MM-dd');
            await createHabitEntry.mutateAsync({ habit_id: habitId, date: today, value: 1 });
            const habitName = habits.find(h => h.id === habitId)?.name ?? intent.habitMatch?.name ?? 'Habit';
            showToast(`${habitName} logged! 🔥`, 'success');
          } else {
            // Can't match a habit — create task instead
            await createTask.mutateAsync({ title: raw, status: 'todo', priority: 'medium', category: 'personal' } as any);
            showToast('Task created ✅', 'success');
          }
          break;
        }

        case 'note': {
          const noteText = raw.replace(/^\/note[:\s]*/i, '').replace(/^note:\s*/i, '').replace(/^remember:\s*/i, '').trim();
          await createNote.mutateAsync({ title: noteText.slice(0, 60) || 'Quick note', content: noteText, tags: [], noteType: 'text' });
          showToast('Note saved 📝', 'success');
          break;
        }

        case 'task':
        default: {
          await createTask.mutateAsync({ title: raw, status: 'todo', priority: 'medium', category: 'personal' } as any);
          showToast('Task created ✅', 'success');
          break;
        }
      }

      setText('');
      setIsOpen(false);
    } catch (err) {
      logger.error('SmartQuickCapture', err as Error, { intent: intent.intent, text: raw });
      showToast('Could not save — try again', 'error');
    } finally {
      setIsSubmitting(false);
    }
  }, [text, habitNames, habits, accounts, categories, isSubmitting, createTask, createNote, createHabitEntry, upsertTransaction, createInboxItem, showToast]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void handleSubmit(); }
  };

  // ── Render ─────────────────────────────────────────────────────────────

  const intentBg = INTENT_COLORS[parsed.intent];
  const intentText = INTENT_TEXT_COLORS[parsed.intent];

  return (
    <>
      {/* FAB */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed z-50 flex items-center justify-center rounded-full shadow-lg transition-all hover:scale-105 active:scale-95"
        style={{
          bottom: 'calc(env(safe-area-inset-bottom, 0px) + 88px)',
          right: '20px',
          width: '52px',
          height: '52px',
          background: 'linear-gradient(135deg, #D4A574 0%, #C18B5E 100%)',
          boxShadow: '0 4px 16px rgba(193,139,94,0.45)',
        }}
        aria-label="Quick capture (⌘K)"
      >
        <Plus className="w-6 h-6 text-white" strokeWidth={2.5} />
        {pendingCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full w-4.5 h-4.5 flex items-center justify-center" style={{ width: '18px', height: '18px' }}>
            {pendingCount > 9 ? '9+' : pendingCount}
          </span>
        )}
      </button>

      {/* Modal */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center px-4 pb-safe"
          style={{ backgroundColor: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }}
          onClick={(e) => { if (e.target === e.currentTarget) { setIsOpen(false); setText(''); } }}
        >
          <div
            className="w-full rounded-t-3xl sm:rounded-2xl overflow-hidden"
            style={{ maxWidth: '540px', backgroundColor: 'white', boxShadow: '0 24px 64px rgba(0,0,0,0.2)' }}
          >
            {/* Drag handle (mobile) */}
            <div className="sm:hidden pt-2.5 flex justify-center">
              <div className="w-9 h-1 rounded-full bg-gray-300" />
            </div>

            {/* Intent chip + close */}
            <div className="flex items-center justify-between px-4 pt-3 pb-2">
              <div
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold transition-all"
                style={{ backgroundColor: intentBg, color: intentText }}
              >
                <span>{parsed.emoji}</span>
                <span>{parsed.label}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-gray-400 hidden sm:block">⌘K</span>
                <button
                  onClick={() => { setIsOpen(false); setText(''); }}
                  className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                  aria-label="Close"
                >
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              </div>
            </div>

            {/* Input */}
            <div className="px-4 pb-2">
              <textarea
                ref={inputRef}
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={isListening ? 'Listening…' : INTENT_PLACEHOLDERS[parsed.intent]}
                rows={2}
                className="w-full resize-none border-0 outline-none text-gray-900 text-base placeholder-gray-400 bg-transparent"
                style={{ lineHeight: '1.5' }}
                disabled={isSubmitting || isListening}
              />
            </div>

            {/* Footer */}
            <div
              className="flex items-center justify-between px-4 py-3 border-t"
              style={{ borderColor: '#F3EDE6' }}
            >
              {/* Hint */}
              <p className="text-[11px] text-gray-400">
                {parsed.intent === 'transaction' && parsed.transaction?.amount
                  ? `$${parsed.transaction.amount}${parsed.transaction.description ? ` · ${parsed.transaction.description}` : ''}`
                  : parsed.intent === 'habit' && parsed.habitMatch
                  ? `Will log: ${parsed.habitMatch.name}`
                  : 'Enter to save · Shift+Enter for newline'}
              </p>

              {/* Actions */}
              <div className="flex items-center gap-2">
                {/* Voice button */}
                <button
                  onClick={handleVoice}
                  className="flex items-center gap-1 px-3 py-2 rounded-xl text-sm font-medium transition-all"
                  style={{
                    backgroundColor: isListening ? 'rgba(239,68,68,0.1)' : 'rgba(212,165,116,0.1)',
                    color: isListening ? '#DC2626' : '#C18B5E',
                  }}
                  aria-label={isListening ? 'Stop recording' : 'Voice input'}
                >
                  {isListening
                    ? <><MicOff className="w-4 h-4" /><span>Stop</span></>
                    : <><Mic className="w-4 h-4" /><span>Voice</span></>
                  }
                </button>

                {/* Submit button */}
                <button
                  onClick={() => void handleSubmit()}
                  disabled={!text.trim() || isSubmitting}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-40"
                  style={{ background: 'linear-gradient(135deg, #D4A574 0%, #C18B5E 100%)' }}
                  aria-label="Save"
                >
                  {isSubmitting
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <span>Save</span>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default SmartQuickCapture;
