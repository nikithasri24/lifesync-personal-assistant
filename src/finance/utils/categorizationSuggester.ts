/**
 * categorizationSuggester
 * Client-side smart category suggestion for transactions.
 * Scans recent transactions for keyword matches and returns the most-frequent
 * category. No DB changes, no rule table — pure frequency-based inference.
 */

interface RecentTransaction {
  description: string;
  category_id: string | null;
}

/**
 * Returns the most likely category_id based on keyword overlap with recent
 * transactions, or null if confidence is below the threshold.
 *
 * @param description - The new transaction description to categorize
 * @param recentTransactions - Array of past transactions with known categories
 * @param minMatches - Minimum number of matching transactions required (default 2)
 */
export function suggestCategory(
  description: string,
  recentTransactions: RecentTransaction[],
  minMatches = 2
): string | null {
  const trimmed = description.trim();
  if (!trimmed || recentTransactions.length === 0) return null;

  // Split into words, ignore very short tokens (articles, prepositions)
  const words = trimmed
    .toLowerCase()
    .split(/[\s,./\\-]+/)
    .filter((w) => w.length > 2);

  if (words.length === 0) return null;

  // Find transactions whose descriptions contain at least one word
  const matches = recentTransactions.filter(
    (t) =>
      t.category_id !== null &&
      words.some((w) => t.description.toLowerCase().includes(w))
  );

  if (matches.length < minMatches) return null;

  // Tally category frequencies among matches
  const freq: Record<string, number> = {};
  for (const t of matches) {
    freq[t.category_id!] = (freq[t.category_id!] ?? 0) + 1;
  }

  // Return the category with the highest match count
  const sorted = Object.entries(freq).sort((a, b) => b[1] - a[1]);
  return sorted[0][0];
}
