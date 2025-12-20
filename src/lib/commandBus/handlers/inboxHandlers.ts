/**
 * Inbox Command Handlers
 * 
 * Handles all inbox-related commands through the command bus.
 * Uses the API layer for data access.
 */

import * as inboxAPI from '@/api/inboxAPI';
import * as tasksAPI from '@/api/tasksAPI';
import * as shoppingAPI from '@/api/shoppingAPI';
import { logger } from '@/services/logger';
import type {
  CommandResult,
  QuickCaptureCommand,
  ProcessInboxItemCommand,
} from '../types';

/**
 * Handle QUICK_CAPTURE command
 */
export async function handleQuickCapture(command: QuickCaptureCommand): Promise<CommandResult> {
  const { payload } = command;

  try {
    // Map command item type to inbox item type
    const typeMap: Record<string, inboxAPI.InboxItemType> = {
      idea: 'idea',
      reminder: 'reminder',
      note: 'note',
      link: 'note',
      voice_note: 'note',
    };

    const data = await inboxAPI.createInboxItem({
      content: payload.content,
      suggested_type: typeMap[payload.itemType || 'note'] || 'unknown',
    });

    return {
      success: true,
      data,
      message: 'Captured to inbox',
    };
  } catch (error) {
    logger.error('InboxHandlers', 'Failed to capture to inbox', { error });
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Handle PROCESS_INBOX_ITEM command
 */
export async function handleProcessInboxItem(command: ProcessInboxItemCommand): Promise<CommandResult> {
  const { payload } = command;

  try {
    const { id, action, conversionData } = payload;

    switch (action) {
      case 'convert_to_task': {
        // Get the inbox item first
        const items = await inboxAPI.getInboxItems();
        const item = items.find(i => i.id === id);
        if (!item) {
          return { success: false, error: 'Inbox item not found' };
        }

        // Create task from inbox item
        const task = await tasksAPI.createTask({
          title: (conversionData?.title as string) || item.content,
          description: (conversionData?.description as string) || '',
          priority: (conversionData?.priority as 'low' | 'medium' | 'high' | 'urgent') || 'medium',
          status: 'todo',
          deleted: false,
          archived: false,
        });

        // Mark inbox item as processed
        await inboxAPI.markProcessed(id, { converted_to: 'task', task_id: task.id });

        return {
          success: true,
          data: { task },
          message: 'Converted to task',
        };
      }

      case 'convert_to_shopping': {
        // Get the inbox item first
        const items = await inboxAPI.getInboxItems();
        const item = items.find(i => i.id === id);
        if (!item) {
          return { success: false, error: 'Inbox item not found' };
        }

        // Get or create a default shopping list
        const lists = await shoppingAPI.getShoppingLists();
        let listId: string | undefined = lists[0]?.id;
        if (!listId) {
          // Create a default list if none exists
          const newList = await shoppingAPI.createShoppingList({ name: 'Shopping List' });
          listId = newList.id;
        }

        // Ensure we have a valid list ID
        if (!listId) {
          return { success: false, error: 'Failed to get or create shopping list' };
        }

        // Create shopping item
        const shoppingItem = await shoppingAPI.createShoppingItem(listId, {
          name: (conversionData?.name as string) || item.content,
          quantity: (conversionData?.quantity as number) || 1,
          category: (conversionData?.category as string) || 'other',
          is_purchased: false,
        });

        // Mark inbox item as processed
        await inboxAPI.markProcessed(id, { converted_to: 'shopping', item_id: shoppingItem.id || '' });

        return {
          success: true,
          data: { shoppingItem },
          message: 'Added to shopping list',
        };
      }

      case 'delete': {
        await inboxAPI.deleteInboxItem(id);
        return {
          success: true,
          message: 'Inbox item deleted',
        };
      }

      case 'snooze': {
        // For snooze, we just update the item (could add a snooze_until field)
        await inboxAPI.updateInboxItem(id, {
          status: 'pending',
        });
        return {
          success: true,
          message: 'Inbox item snoozed',
        };
      }

      case 'convert_to_event': {
        // Calendar event conversion would go here
        // For now, just mark as processed
        await inboxAPI.markProcessed(id, { converted_to: 'event' });
        return {
          success: true,
          message: 'Converted to event (placeholder)',
        };
      }

      default:
        return { success: false, error: `Unknown action: ${action}` };
    }
  } catch (error) {
    logger.error('InboxHandlers', 'Failed to process inbox item', { error });
    return { success: false, error: (error as Error).message };
  }
}

/**
 * All inbox handlers mapped by command type
 */
export const inboxHandlers = {
  QUICK_CAPTURE: handleQuickCapture,
  PROCESS_INBOX_ITEM: handleProcessInboxItem,
};

