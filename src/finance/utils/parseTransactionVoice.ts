/**
 * parseTransactionVoice
 * Pure function that parses a voice transcript into transaction form fields.
 * No React dependencies — safe to call from any context.
 *
 * Examples:
 *   "Add $45 Whole Foods to groceries"  → { amount: "45", description: "Whole Foods", categoryHint: "groceries", type: "debit" }
 *   "Received salary 5000 dollars"       → { amount: "5000", type: "credit" }
 *   "Spent 12.50 at McDonald's"          → { amount: "12.50", description: "McDonald's", type: "debit" }
 */

export interface ParsedTransaction {
  amount?: string;
  description?: string;
  categoryHint?: string;
  type?: 'debit' | 'credit';
}

export function parseTransactionVoice(transcript: string): ParsedTransaction {
  if (!transcript) return {};

  const lower = transcript.toLowerCase();
  const result: ParsedTransaction = {};

  // ── Amount ────────────────────────────────────────────────────────────────
  // "$45", "$45.50", "$ 12"
  const dollarMatch = transcript.match(/\$\s*(\d+(?:\.\d{1,2})?)/i);
  // "45 dollars", "45.50 dollars"
  const wordsMatch = transcript.match(/(\d+(?:\.\d{1,2})?)\s+dollars?/i);
  const amountStr = dollarMatch?.[1] ?? wordsMatch?.[1];
  if (amountStr) {
    result.amount = parseFloat(amountStr).toFixed(2);
  }

  // ── Merchant / description ────────────────────────────────────────────────
  // "at Whole Foods", "from Target", "to McDonald's"
  const merchantMatch = transcript.match(
    /\b(?:at|from|to)\s+([A-Za-z0-9'\s&-]+?)(?:\s+(?:on|for|to|in)\b|$)/i
  );
  if (merchantMatch?.[1]) {
    result.description = merchantMatch[1].trim();
  }

  // ── Category hint ─────────────────────────────────────────────────────────
  // "for groceries", "on clothing", "in entertainment"
  const categoryMatch = transcript.match(/\b(?:for|on|in)\s+([A-Za-z\s]+?)(?:\s+at\b|$)/i);
  if (categoryMatch?.[1]) {
    const hint = categoryMatch[1].trim();
    // Avoid false positives — skip very short strings or duplicates of description
    if (hint.length > 2 && hint.toLowerCase() !== result.description?.toLowerCase()) {
      result.categoryHint = hint;
    }
  }

  // ── Transaction type ──────────────────────────────────────────────────────
  const isIncome = /\b(?:received?|income|salary|got paid|earned?|paycheck|refund|bonus|dividend)\b/i.test(lower);
  result.type = isIncome ? 'credit' : 'debit';

  return result;
}
