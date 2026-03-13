/**
 * intentParser
 * Lightweight, dependency-free intent classifier for the Smart Quick Capture.
 * Runs synchronously on every keystroke — must stay fast and pure.
 *
 * Intent hierarchy (first match wins):
 *   'transaction' → contains money signals ($, "dollars", merchant keywords)
 *   'habit'       → contains known habit names or completion verbs
 *   'note'        → starts with "/" or contains "note:", "remember:"
 *   'task'        → everything else (safe default)
 */

import { parseTransactionVoice, type ParsedTransaction } from '@/finance/utils/parseTransactionVoice';

// ── Types ─────────────────────────────────────────────────────────────────

export type CaptureIntent = 'task' | 'transaction' | 'habit' | 'note';

export interface ParsedIntent {
  intent: CaptureIntent;
  label: string;      // human-readable label for the preview chip
  emoji: string;
  confidence: 'high' | 'medium' | 'low';

  // Populated when intent = 'transaction'
  transaction?: ParsedTransaction;

  // Populated when intent = 'habit'
  habitMatch?: {
    name: string;   // the matched habit name fragment
    id?: string;    // populated by the caller if habits are available
  };
}

// ── Constants ─────────────────────────────────────────────────────────────

// Generic completion verbs that signal a habit log
const COMPLETION_VERBS = [
  'done', 'did', 'finished', 'completed', 'logged', 'checked',
  'took', 'drank', 'ran', 'walked', 'worked out', 'exercised',
  'meditated', 'read', 'wrote', 'journaled',
];

// Note trigger prefixes
const NOTE_TRIGGERS = ['/note', 'note:', 'remember:', 'remind me', 'jot:'];

// Transaction signal patterns (beyond what parseTransactionVoice already handles)
const TX_VERB_PATTERNS = /\b(spent|paid|bought|purchased|charged|billed|transferred|withdrew|deposited|received|earned|got paid)\b/i;

// ── Core classifier ────────────────────────────────────────────────────────

/**
 * Classify the intent of a raw capture string.
 *
 * @param text       Raw user input
 * @param habitNames Optional list of user's active habit names for fuzzy matching
 */
export function parseIntent(text: string, habitNames: string[] = []): ParsedIntent {
  if (!text.trim()) {
    return { intent: 'task', label: 'Task', emoji: '✅', confidence: 'low' };
  }

  const lower = text.toLowerCase().trim();

  // ── Note ──────────────────────────────────────────────────────────────
  if (NOTE_TRIGGERS.some(t => lower.startsWith(t))) {
    return { intent: 'note', label: 'Note', emoji: '📝', confidence: 'high' };
  }

  // ── Transaction ───────────────────────────────────────────────────────
  const hasDollarSign = /\$\s*\d/.test(text);
  const hasWordDollars = /\d+\s+dollars?/i.test(text);
  const hasTxVerb = TX_VERB_PATTERNS.test(text);

  if (hasDollarSign || hasWordDollars || hasTxVerb) {
    const transaction = parseTransactionVoice(text);
    return {
      intent: 'transaction',
      label: transaction.amount ? `$${transaction.amount}` : 'Transaction',
      emoji: '💳',
      confidence: hasDollarSign ? 'high' : 'medium',
      transaction,
    };
  }

  // ── Habit ─────────────────────────────────────────────────────────────
  // First: check if any of the user's actual habit names appear in the text
  if (habitNames.length > 0) {
    for (const name of habitNames) {
      if (lower.includes(name.toLowerCase())) {
        return {
          intent: 'habit',
          label: name,
          emoji: '🔥',
          confidence: 'high',
          habitMatch: { name },
        };
      }
    }
  }

  // Second: generic completion verb patterns
  const matchedVerb = COMPLETION_VERBS.find(v => lower.startsWith(v) || lower.includes(` ${v} `) || lower.endsWith(` ${v}`));
  if (matchedVerb) {
    // Extract what comes after the verb as the potential habit name
    const afterVerb = lower.replace(matchedVerb, '').trim();
    return {
      intent: 'habit',
      label: afterVerb || 'Habit',
      emoji: '🔥',
      confidence: afterVerb.length > 1 ? 'medium' : 'low',
      habitMatch: afterVerb ? { name: afterVerb } : undefined,
    };
  }

  // ── Task (default) ─────────────────────────────────────────────────────
  return { intent: 'task', label: 'Task', emoji: '✅', confidence: 'high' };
}

/**
 * Given a habit intent result and the user's full habit list, find the best
 * matching habit ID so the caller can log it directly.
 */
export function matchHabitId(
  habitMatch: { name: string },
  habits: Array<{ id?: string; name: string }>
): string | undefined {
  const needle = habitMatch.name.toLowerCase();
  // Exact prefix match first
  const exact = habits.find(h => h.name.toLowerCase().startsWith(needle) || needle.startsWith(h.name.toLowerCase()));
  if (exact?.id) return exact.id;
  // Partial word overlap
  const words = needle.split(/\s+/).filter(w => w.length > 2);
  const fuzzy = habits.find(h => words.some(w => h.name.toLowerCase().includes(w)));
  return fuzzy?.id;
}
