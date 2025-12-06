/**
 * Draft Storage Service
 * Manages localStorage for meal planning drafts
 */

import { logger } from '../../../services/logger';

const DRAFT_PREFIX = 'meal-draft-';
const DRAFT_EXPIRY_DAYS = 7;

/**
 * Generate storage key for a meal draft
 */
export function getMealDraftKey(dateKey: string, mealType: string): string {
  return `${DRAFT_PREFIX}${dateKey}-${mealType}`;
}

/**
 * Save a meal draft to localStorage
 */
export function saveMealDraft(dateKey: string, mealType: string, value: string): void {
  try {
    const key = getMealDraftKey(dateKey, mealType);
    localStorage.setItem(key, value);
    logger.debug('DraftStorage', `Saved draft: ${key}`);
  } catch (error) {
    logger.error('DraftStorage', 'Failed to save draft:', { error });
  }
}

/**
 * Get a meal draft from localStorage
 */
export function getMealDraft(dateKey: string, mealType: string): string | null {
  try {
    const key = getMealDraftKey(dateKey, mealType);
    return localStorage.getItem(key);
  } catch (error) {
    logger.error('DraftStorage', 'Failed to get draft:', { error });
    return null;
  }
}

/**
 * Clear a specific meal draft
 */
export function clearMealDraft(dateKey: string, mealType: string): void {
  try {
    const key = getMealDraftKey(dateKey, mealType);
    localStorage.removeItem(key);
    logger.debug('DraftStorage', `Cleared draft: ${key}`);
  } catch (error) {
    logger.error('DraftStorage', 'Failed to clear draft:', { error });
  }
}

/**
 * Cleanup old meal drafts from localStorage (older than specified days)
 */
export function cleanupOldDrafts(daysOld: number = DRAFT_EXPIRY_DAYS): void {
  try {
    const today = new Date();
    const expiryDate = new Date(today);
    expiryDate.setDate(today.getDate() - daysOld);

    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(DRAFT_PREFIX)) {
        // Extract date from key: "meal-draft-2025-01-14-breakfast"
        const match = key.match(/meal-draft-(\d{4}-\d{2}-\d{2})/);
        if (match) {
          const draftDate = new Date(match[1]);
          if (draftDate < expiryDate) {
            keysToRemove.push(key);
          }
        }
      }
    }

    keysToRemove.forEach(key => localStorage.removeItem(key));
    if (keysToRemove.length > 0) {
      logger.debug('DraftStorage', `Cleaned up ${keysToRemove.length} old meal drafts`);
    }
  } catch (error) {
    logger.error('DraftStorage', 'Failed to cleanup old drafts:', { error });
  }
}

/**
 * Get all draft keys
 */
export function getAllDraftKeys(): string[] {
  try {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(DRAFT_PREFIX)) {
        keys.push(key);
      }
    }
    return keys;
  } catch (error) {
    logger.error('DraftStorage', 'Failed to get all draft keys:', { error });
    return [];
  }
}

/**
 * Clear all meal drafts
 */
export function clearAllDrafts(): void {
  try {
    const keys = getAllDraftKeys();
    keys.forEach(key => localStorage.removeItem(key));
    logger.debug('DraftStorage', `Cleared ${keys.length} drafts`);
  } catch (error) {
    logger.error('DraftStorage', 'Failed to clear all drafts:', { error });
  }
}
