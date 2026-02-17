/**
 * Receipt Item Matcher Service
 * Uses fuzzy string matching to link receipt items to shopping list items
 */

import fuzzball from 'fuzzball';
import type { ShoppingItem } from '../types';
import type { ParsedReceiptItem } from './receiptParser';
import { logger } from '@/services/logger';

export interface ItemMatch {
  receiptItem: ParsedReceiptItem;
  shoppingItem: ShoppingItem | null;
  confidence: number; // 0-100
  suggestions: Array<{
    item: ShoppingItem;
    score: number;
  }>;
}

export interface MatchResult {
  matches: ItemMatch[];
  matchedCount: number;
  unmatchedCount: number;
  totalAmount: number;
}

/**
 * Match receipt items to shopping list items using fuzzy string matching
 * @param receiptItems - Parsed items from receipt
 * @param shoppingItems - Active shopping list items (unpurchased)
 * @param minConfidence - Minimum confidence score (0-100) to auto-match
 * @returns Match results with suggestions
 */
export function matchReceiptItemsToShoppingList(
  receiptItems: ParsedReceiptItem[],
  shoppingItems: ShoppingItem[],
  minConfidence = 70
): MatchResult {
  logger.debug('ReceiptMatcher', 'Starting item matching', {
    receiptItemCount: receiptItems.length,
    shoppingItemCount: shoppingItems.length,
    minConfidence,
  });

  const matches: ItemMatch[] = [];
  let matchedCount = 0;
  let unmatchedCount = 0;
  let totalAmount = 0;

  for (const receiptItem of receiptItems) {
    // Calculate similarity scores for all shopping items
    const scored = shoppingItems.map(shoppingItem => {
      const score = calculateItemSimilarity(receiptItem, shoppingItem);
      return { item: shoppingItem, score };
    });

    // Sort by score descending
    const sorted = scored.sort((a, b) => b.score - a.score);
    const topMatch = sorted[0];
    const suggestions = sorted.slice(0, 3); // Top 3 suggestions

    // Auto-match if confidence is high enough
    const shoppingItem = topMatch && topMatch.score >= minConfidence ? topMatch.item : null;
    const confidence = topMatch?.score ?? 0;

    matches.push({
      receiptItem,
      shoppingItem,
      confidence,
      suggestions,
    });

    if (shoppingItem) {
      matchedCount++;
    } else {
      unmatchedCount++;
    }

    // Add to total amount
    if (receiptItem.price) {
      totalAmount += receiptItem.price * receiptItem.quantity;
    }
  }

  logger.info('ReceiptMatcher', 'Item matching completed', {
    matchedCount,
    unmatchedCount,
    totalAmount: totalAmount.toFixed(2),
    autoMatchRate: `${((matchedCount / receiptItems.length) * 100).toFixed(1)}%`,
  });

  return {
    matches,
    matchedCount,
    unmatchedCount,
    totalAmount,
  };
}

/**
 * Calculate similarity score between receipt item and shopping item
 * Uses fuzzy string matching on names and considers category overlap
 */
function calculateItemSimilarity(
  receiptItem: ParsedReceiptItem,
  shoppingItem: ShoppingItem
): number {
  const receiptName = normalizeItemName(receiptItem.name);
  const shoppingName = normalizeItemName(shoppingItem.name);

  // Base score: fuzzy string match on names
  const nameScore = fuzzball.ratio(receiptName, shoppingName);

  // Bonus points for category match
  const categoryBonus = receiptItem.category === shoppingItem.category ? 10 : 0;

  // Bonus points for brand match (if available)
  let brandBonus = 0;
  if (shoppingItem.brand) {
    const brandInReceipt = receiptName.includes(normalizeItemName(shoppingItem.brand));
    brandBonus = brandInReceipt ? 10 : 0;
  }

  // Bonus points for size match (if available)
  let sizeBonus = 0;
  if (receiptItem.size && shoppingItem.size) {
    const sizeMatch = receiptItem.size.toLowerCase().includes(shoppingItem.size.toLowerCase());
    sizeBonus = sizeMatch ? 5 : 0;
  }

  // Final score (capped at 100)
  const finalScore = Math.min(100, nameScore + categoryBonus + brandBonus + sizeBonus);

  return finalScore;
}

/**
 * Normalize item name for comparison
 * - Lowercase
 * - Remove extra whitespace
 * - Remove common filler words
 */
function normalizeItemName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\b(organic|fresh|premium|select|choice|grade a|free range|natural)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Apply receipt matches to shopping items
 * Updates shopping items with actual prices and marks as purchased
 * @param matches - Confirmed matches from user review
 * @param storeId - Store ID where items were purchased
 * @returns Updated shopping items ready for database update
 */
export function applyReceiptMatchesToShoppingItems(
  matches: ItemMatch[],
  storeId?: string
): Array<{
  id: string;
  updates: Partial<ShoppingItem>;
}> {
  const now = new Date();
  const updates: Array<{ id: string; updates: Partial<ShoppingItem> }> = [];

  for (const match of matches) {
    if (!match.shoppingItem) continue;

    const itemUpdates: Partial<ShoppingItem> = {
      purchased: true,
      purchasedAt: now,
    };

    // Update actual price if available
    if (match.receiptItem.price !== undefined) {
      itemUpdates.price = match.receiptItem.price;
    }

    // Update quantity if different
    if (match.receiptItem.quantity > match.shoppingItem.quantity) {
      itemUpdates.quantity = match.receiptItem.quantity;
    }

    // Update store assignment
    if (storeId && !match.shoppingItem.assignedStore) {
      itemUpdates.assignedStore = storeId;
    }

    updates.push({
      id: match.shoppingItem.id,
      updates: itemUpdates,
    });
  }

  logger.debug('ReceiptMatcher', 'Applied receipt matches', {
    updatedItemCount: updates.length,
  });

  return updates;
}
