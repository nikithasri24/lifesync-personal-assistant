/**
 * Fuzzy String Matching Utilities
 *
 * Provides Levenshtein distance and similarity scoring for merchant name matching
 * Zero-cost alternative to AI-based categorization
 */

/**
 * Calculate Levenshtein distance between two strings
 * Returns the minimum number of single-character edits needed to transform one string into another
 *
 * @param str1 - First string
 * @param str2 - Second string
 * @returns Distance (0 = identical, higher = more different)
 */
export function levenshteinDistance(str1: string, str2: string): number {
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();

  if (s1 === s2) return 0;
  if (s1.length === 0) return s2.length;
  if (s2.length === 0) return s1.length;

  // Create matrix
  const matrix: number[][] = [];

  // Initialize first column
  for (let i = 0; i <= s2.length; i++) {
    matrix[i] = [i];
  }

  // Initialize first row
  for (let j = 0; j <= s1.length; j++) {
    matrix[0][j] = j;
  }

  // Fill in the rest of the matrix
  for (let i = 1; i <= s2.length; i++) {
    for (let j = 1; j <= s1.length; j++) {
      if (s2.charAt(i - 1) === s1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  return matrix[s2.length][s1.length];
}

/**
 * Calculate similarity score between two strings (0-1)
 * 1.0 = identical, 0.0 = completely different
 *
 * @param str1 - First string
 * @param str2 - Second string
 * @returns Similarity score between 0 and 1
 */
export function similarity(str1: string, str2: string): number {
  const distance = levenshteinDistance(str1, str2);
  const maxLength = Math.max(str1.length, str2.length);

  if (maxLength === 0) return 1.0;

  return 1 - (distance / maxLength);
}

/**
 * Find best match from a list of candidates
 *
 * @param target - String to match against
 * @param candidates - List of possible matches
 * @param minSimilarity - Minimum similarity threshold (0-1)
 * @returns Best match with score, or null if no match above threshold
 */
export function findBestMatch(
  target: string,
  candidates: string[],
  minSimilarity: number = 0.6
): { match: string; score: number } | null {
  let bestMatch: string | null = null;
  let bestScore = 0;

  for (const candidate of candidates) {
    const score = similarity(target, candidate);
    if (score > bestScore && score >= minSimilarity) {
      bestScore = score;
      bestMatch = candidate;
    }
  }

  return bestMatch ? { match: bestMatch, score: bestScore } : null;
}

/**
 * Check if string contains a substring (fuzzy)
 * Allows for minor typos/variations
 *
 * @param haystack - String to search in
 * @param needle - String to search for
 * @param threshold - Similarity threshold (0-1)
 * @returns True if fuzzy match found
 */
export function fuzzyContains(
  haystack: string,
  needle: string,
  threshold: number = 0.8
): boolean {
  const haystackLower = haystack.toLowerCase();
  const needleLower = needle.toLowerCase();

  // Exact substring match first (fast path)
  if (haystackLower.includes(needleLower)) return true;

  // Fuzzy word matching
  const haystackWords = haystackLower.split(/\s+/);
  const needleWords = needleLower.split(/\s+/);

  for (const needleWord of needleWords) {
    let found = false;
    for (const haystackWord of haystackWords) {
      if (similarity(haystackWord, needleWord) >= threshold) {
        found = true;
        break;
      }
    }
    if (!found) return false;
  }

  return true;
}

/**
 * Normalize merchant name for consistent matching
 * Removes common prefixes, suffixes, and normalizes spacing
 *
 * @param merchantName - Raw merchant name from transaction
 * @returns Normalized merchant name
 */
export function normalizeMerchantName(merchantName: string): string {
  let normalized = merchantName.trim().toUpperCase();

  // Remove common transaction prefixes
  normalized = normalized.replace(/^(DEBIT|CREDIT|PURCHASE|POS|CARD|PAYMENT|PAYPAL|SQ\s+\*|TST\s+\*)\s+/i, '');

  // Remove common suffixes (locations, IDs)
  normalized = normalized.replace(/\s+#?\d+$/, ''); // Trailing numbers
  normalized = normalized.replace(/\s+(LLC|INC|CORP|CO|LTD)\.?$/i, ''); // Company suffixes

  // Remove special characters but keep spaces
  normalized = normalized.replace(/[^A-Z0-9\s]/g, ' ');

  // Normalize spacing
  normalized = normalized.replace(/\s+/g, ' ').trim();

  return normalized;
}

/**
 * Extract merchant name variations for better matching
 * Generates common variations and abbreviations
 *
 * @param merchantName - Merchant name
 * @returns Array of possible variations
 */
export function generateMerchantVariations(merchantName: string): string[] {
  const normalized = normalizeMerchantName(merchantName);
  const variations = new Set<string>([normalized]);

  // Add lowercase version
  variations.add(normalized.toLowerCase());

  // Add without spaces
  variations.add(normalized.replace(/\s+/g, ''));

  // Add first word only (often the brand name)
  const firstWord = normalized.split(/\s+/)[0];
  if (firstWord && firstWord.length > 2) {
    variations.add(firstWord);
  }

  // Add common abbreviations
  const words = normalized.split(/\s+/);
  if (words.length > 1) {
    // Acronym (first letters)
    const acronym = words.map(w => w[0]).join('');
    if (acronym.length >= 2) {
      variations.add(acronym);
    }
  }

  return Array.from(variations);
}

/**
 * Check if two merchant names likely refer to the same business
 * Handles common variations, typos, and formats
 *
 * @param name1 - First merchant name
 * @param name2 - Second merchant name
 * @param threshold - Similarity threshold (0-1)
 * @returns True if likely the same merchant
 */
export function isSameMerchant(
  name1: string,
  name2: string,
  threshold: number = 0.75
): boolean {
  // Normalize both names
  const norm1 = normalizeMerchantName(name1);
  const norm2 = normalizeMerchantName(name2);

  // Exact match
  if (norm1 === norm2) return true;

  // Check similarity
  if (similarity(norm1, norm2) >= threshold) return true;

  // Check if one contains the other (after normalization)
  if (norm1.includes(norm2) || norm2.includes(norm1)) return true;

  // Check variations
  const variations1 = generateMerchantVariations(name1);
  const variations2 = generateMerchantVariations(name2);

  for (const v1 of variations1) {
    for (const v2 of variations2) {
      if (v1 === v2 || similarity(v1, v2) >= threshold) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Calculate confidence score for a match
 * Takes into account multiple factors for categorization confidence
 *
 * @param merchantSimilarity - Similarity to known merchant (0-1)
 * @param amountMatch - Whether amount matches expected range (boolean)
 * @param historyCount - Number of times this pattern matched before
 * @returns Confidence score (0-1)
 */
export function calculateConfidence(
  merchantSimilarity: number,
  amountMatch: boolean = true,
  historyCount: number = 0
): number {
  let confidence = merchantSimilarity * 0.7; // Merchant match is 70% of confidence

  // Amount match adds confidence
  if (amountMatch) {
    confidence += 0.1;
  }

  // Historical success adds confidence (up to 20%)
  const historyBonus = Math.min(0.2, historyCount * 0.02);
  confidence += historyBonus;

  // Cap at 1.0
  return Math.min(1.0, confidence);
}
