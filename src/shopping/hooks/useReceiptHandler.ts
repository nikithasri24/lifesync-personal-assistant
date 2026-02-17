/**
 * Custom hook for handling receipt scanning and matching to shopping list
 * Integrates OCR results with shopping items for accurate budget tracking
 */

import { useCallback } from 'react';
import { logger } from '@/services/logger';
import type { ParsedReceiptItem } from '../services/receiptParser';
import type { ShoppingItem } from '../types';
import {
  matchReceiptItemsToShoppingList,
  applyReceiptMatchesToShoppingItems,
  type ItemMatch,
} from '../services/receiptItemMatcher';

export interface UseReceiptHandlerParams {
  shoppingItems: ShoppingItem[];
  updateShoppingItem: (id: string, updates: Partial<ShoppingItem>) => Promise<void>;
  showToast: (message: string, type: 'success' | 'error' | 'info') => void;
  storeId?: string;
}

export interface UseReceiptHandlerReturn {
  handleReceiptScanned: (items: ParsedReceiptItem[]) => Promise<void>;
  getReceiptMatches: (items: ParsedReceiptItem[]) => ItemMatch[];
}

/**
 * Hook for handling receipt scanning workflow
 * Matches receipt items to shopping list and updates with actual prices
 */
export function useReceiptHandler(params: UseReceiptHandlerParams): UseReceiptHandlerReturn {
  const { shoppingItems, updateShoppingItem, showToast, storeId } = params;

  /**
   * Get receipt matches without applying them
   * Useful for showing a review/confirmation UI
   */
  const getReceiptMatches = useCallback((items: ParsedReceiptItem[]): ItemMatch[] => {
    // Only match against unpurchased shopping items
    const unpurchasedItems = shoppingItems.filter(item => !item.purchased);

    logger.debug('ReceiptHandler', 'Getting receipt matches', {
      receiptItemCount: items.length,
      unpurchasedItemCount: unpurchasedItems.length,
    });

    const matchResult = matchReceiptItemsToShoppingList(items, unpurchasedItems, 70);
    return matchResult.matches;
  }, [shoppingItems]);

  /**
   * Handle receipt scanned and automatically update shopping items
   * Matches items, updates prices, and marks as purchased
   */
  const handleReceiptScanned = useCallback(async (items: ParsedReceiptItem[]): Promise<void> => {
    try {
      logger.info('ReceiptHandler', 'Processing scanned receipt', {
        receiptItemCount: items.length,
      });

      // Get matches
      const matches = getReceiptMatches(items);
      const confirmedMatches = matches.filter(m => m.shoppingItem && m.confidence >= 70);

      if (confirmedMatches.length === 0) {
        showToast('No matching items found in shopping list', 'info');
        logger.warn('ReceiptHandler', 'No matches found', {
          receiptItemCount: items.length,
          shoppingItemCount: shoppingItems.length,
        });
        return;
      }

      // Apply matches to shopping items
      const updates = applyReceiptMatchesToShoppingItems(confirmedMatches, storeId);

      // Update each shopping item
      let successCount = 0;
      for (const { id, updates: itemUpdates } of updates) {
        try {
          await updateShoppingItem(id, itemUpdates);
          successCount++;
        } catch (error) {
          logger.error('ReceiptHandler', 'Failed to update shopping item', {
            itemId: id,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }

      // Calculate total amount
      const totalAmount = confirmedMatches.reduce((sum, match) => {
        const price = match.receiptItem.price ?? 0;
        const quantity = match.receiptItem.quantity;
        return sum + (price * quantity);
      }, 0);

      // Show success message
      showToast(
        `Updated ${successCount} items with actual prices ($${totalAmount.toFixed(2)})`,
        'success'
      );

      logger.info('ReceiptHandler', 'Receipt processing completed', {
        matchedCount: confirmedMatches.length,
        updatedCount: successCount,
        totalAmount: totalAmount.toFixed(2),
      });
    } catch (error) {
      logger.error('ReceiptHandler', 'Failed to process receipt', {
        error: error instanceof Error ? error.message : String(error),
      });
      showToast('Failed to process receipt', 'error');
    }
  }, [shoppingItems, storeId, updateShoppingItem, showToast, getReceiptMatches]);

  return {
    handleReceiptScanned,
    getReceiptMatches,
  };
}
