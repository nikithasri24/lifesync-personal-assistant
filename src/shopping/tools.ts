/**
 * Shopping AI Tools
 *
 * AI tools for shopping list and pantry management
 */

import type { Tool, ToolDefinition, ToolResult } from '@/lib/ai/toolRegistry';
import * as shoppingAPI from '@/api/shoppingAPI';
import * as mealPlanningAPI from '@/api/mealPlanningAPI';
import { logger } from '@/services/logger';
import type { ShoppingListData, ShoppingItemData, PantryItemData } from '@/services/types';

// =====================================================
// TOOL DEFINITIONS
// =====================================================

const addToShoppingListDefinition: ToolDefinition = {
  type: 'function',
  function: {
    name: 'add_to_shopping_list',
    description: 'Add an item to the shopping list. Requires item_name (string). Optional: quantity (number), unit (string like "lbs", "oz"), category (string), list_name (defaults to "My Shopping List").',
    parameters: {
      type: 'object',
      properties: {
        item_name: {
          type: 'string',
          description: 'Name of the item to add (e.g., "milk", "bananas") - required'
        },
        quantity: {
          type: 'number',
          description: 'Quantity to buy - optional, defaults to 1'
        },
        unit: {
          type: 'string',
          description: 'Unit of measurement (e.g., "lbs", "oz", "count") - optional'
        },
        category: {
          type: 'string',
          description: 'Category like "produce", "dairy", "meat" - optional'
        },
        list_name: {
          type: 'string',
          description: 'Which shopping list to add to - optional, defaults to "My Shopping List"'
        }
      },
      required: ['item_name']
    }
  }
};

const getShoppingListDefinition: ToolDefinition = {
  type: 'function',
  function: {
    name: 'get_shopping_list',
    description: 'Get shopping list items. Optional: list_name (string) to specify which list, show_purchased (boolean) to include purchased items.',
    parameters: {
      type: 'object',
      properties: {
        list_name: {
          type: 'string',
          description: 'Specific list name - optional, returns active list if not specified'
        },
        show_purchased: {
          type: 'boolean',
          description: 'Include purchased items - optional, defaults to false'
        }
      }
    }
  }
};

const addToPantryDefinition: ToolDefinition = {
  type: 'function',
  function: {
    name: 'add_to_pantry',
    description: 'Add an item to the pantry inventory. Requires item_name (string). Optional: quantity (number), unit (string), category (string), expiration_date (ISO format YYYY-MM-DD).',
    parameters: {
      type: 'object',
      properties: {
        item_name: {
          type: 'string',
          description: 'Name of the pantry item (e.g., "flour", "rice") - required'
        },
        quantity: {
          type: 'number',
          description: 'Quantity in pantry - optional'
        },
        unit: {
          type: 'string',
          description: 'Unit of measurement - optional'
        },
        category: {
          type: 'string',
          description: 'Category like "grains", "spices", "canned goods" - optional'
        },
        expiration_date: {
          type: 'string',
          description: 'Expiration date in ISO format (YYYY-MM-DD) - optional'
        }
      },
      required: ['item_name']
    }
  }
};

const getPantryDefinition: ToolDefinition = {
  type: 'function',
  function: {
    name: 'get_pantry',
    description: 'Get all pantry items. Optional: category (string) to filter by category, show_low_stock (boolean) to show only low stock items.',
    parameters: {
      type: 'object',
      properties: {
        category: {
          type: 'string',
          description: 'Filter by category - optional'
        },
        show_low_stock: {
          type: 'boolean',
          description: 'Show only low stock items - optional'
        }
      }
    }
  }
};

// =====================================================
// HELPER FUNCTIONS
// =====================================================

/**
 * Get or create the default shopping list
 */
async function getOrCreateDefaultList(listName: string = 'My Shopping List'): Promise<ShoppingListData> {
  try {
    const lists = await shoppingAPI.getShoppingLists();

    // Find list by name
    let list = lists.find(l =>
      l.name.toLowerCase() === listName.toLowerCase() &&
      l.status === 'active'
    );

    // Create if not found
    if (!list) {
      logger.info('ShoppingTools', 'Creating new shopping list', { listName });
      list = await shoppingAPI.createShoppingList({
        name: listName,
        status: 'active'
      });
    }

    return list;
  } catch (error) {
    logger.error('ShoppingTools', 'Operation failed', { error,
      operation: 'getOrCreateDefaultList',
      listName
    });
    throw error;
  }
}

// =====================================================
// TOOL IMPLEMENTATIONS
// =====================================================

/**
 * Add item to shopping list
 */
async function executeAddToShoppingList(
  args: Record<string, unknown>,
  _userId: string
): Promise<ToolResult> {
  try {
    const itemName = args.item_name as string;
    const quantity = (args.quantity as number) ?? 1;
    const unit = args.unit as string | undefined;
    const category = args.category as string | undefined;
    const listName = (args.list_name as string) ?? 'My Shopping List';

    // Validate
    if (!itemName || itemName.trim().length === 0) {
      return {
        success: false,
        error: 'Item name is required'
      };
    }

    logger.info('ShoppingTools', 'Adding item to shopping list', {
      itemName,
      quantity,
      unit,
      category,
      listName
    });

    // Get or create the list
    const list = await getOrCreateDefaultList(listName);

    if (!list.id) {
      return {
        success: false,
        error: 'Failed to get or create shopping list'
      };
    }

    // Add item to list
    const item = await shoppingAPI.createShoppingItem(list.id, {
      name: itemName.trim(),
      quantity,
      unit,
      category,
      is_purchased: false
    });

    logger.info('ShoppingTools', 'Item added to shopping list', {
      itemId: item.id,
      itemName: item.name,
      listId: list.id
    });

    return {
      success: true,
      message: `Added ${quantity > 1 ? `${quantity} ` : ''}${itemName}${unit ? ` (${unit})` : ''} to ${list.name}`,
      item: {
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        unit: item.unit,
        category: item.category
      },
      list_name: list.name
    };
  } catch (error) {
    logger.error('ShoppingTools', 'Operation failed', { error,
      operation: 'add_to_shopping_list',
      args
    });

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to add item to shopping list'
    };
  }
}

/**
 * Get shopping list items
 */
async function executeGetShoppingList(
  args: Record<string, unknown>,
  _userId: string
): Promise<ToolResult> {
  try {
    const listName = args.list_name as string | undefined;
    const showPurchased = (args.show_purchased as boolean) ?? false;

    logger.info('ShoppingTools', 'Getting shopping list', { listName, showPurchased });

    const lists = await shoppingAPI.getShoppingLists();

    // Find the list
    let list: ShoppingListData | undefined;
    if (listName) {
      list = lists.find(l => l.name.toLowerCase() === listName.toLowerCase());
    } else {
      // Get the first active list
      list = lists.find(l => l.status === 'active');
    }

    if (!list || !list.id) {
      return {
        success: true,
        items: [],
        count: 0,
        message: 'No shopping list found. Add items to create one!'
      };
    }

    // Get items for the list
    const allItems = await shoppingAPI.getShoppingListItems(list.id);

    // Filter purchased items if needed
    const items = showPurchased
      ? allItems
      : allItems.filter(item => !item.is_purchased);

    logger.info('ShoppingTools', 'Shopping list retrieved', {
      listId: list.id,
      listName: list.name,
      itemCount: items.length
    });

    return {
      success: true,
      list_name: list.name,
      items: items.map(item => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        unit: item.unit,
        category: item.category,
        is_purchased: item.is_purchased
      })),
      count: items.length,
      purchased_count: allItems.filter(i => i.is_purchased).length,
      message: `You have ${items.length} item${items.length !== 1 ? 's' : ''} on ${list.name}`
    };
  } catch (error) {
    logger.error('ShoppingTools', 'Operation failed', { error,
      operation: 'get_shopping_list',
      args
    });

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get shopping list'
    };
  }
}

/**
 * Add item to pantry
 */
async function executeAddToPantry(
  args: Record<string, unknown>,
  _userId: string
): Promise<ToolResult> {
  try {
    const itemName = args.item_name as string;
    const quantity = args.quantity as number | undefined;
    const unit = args.unit as string | undefined;
    const category = args.category as string | undefined;
    const expirationDate = args.expiration_date as string | undefined;

    // Validate
    if (!itemName || itemName.trim().length === 0) {
      return {
        success: false,
        error: 'Item name is required'
      };
    }

    logger.info('ShoppingTools', 'Adding item to pantry', {
      itemName,
      quantity,
      unit,
      category,
      expirationDate
    });

    // Add to pantry
    const item = await mealPlanningAPI.createPantryItem({
      name: itemName.trim(),
      quantity,
      unit,
      category,
      expiration_date: expirationDate,
      is_low_stock: false
    });

    logger.info('ShoppingTools', 'Item added to pantry', {
      itemId: item.id,
      itemName: item.name
    });

    return {
      success: true,
      message: `Added ${itemName}${quantity ? ` (${quantity}${unit ? ` ${unit}` : ''})` : ''} to pantry`,
      item: {
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        unit: item.unit,
        category: item.category,
        expiration_date: item.expiration_date
      }
    };
  } catch (error) {
    logger.error('ShoppingTools', 'Operation failed', { error,
      operation: 'add_to_pantry',
      args
    });

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to add item to pantry'
    };
  }
}

/**
 * Get pantry items
 */
async function executeGetPantry(
  args: Record<string, unknown>,
  _userId: string
): Promise<ToolResult> {
  try {
    const category = args.category as string | undefined;
    const showLowStock = (args.show_low_stock as boolean) ?? false;

    logger.info('ShoppingTools', 'Getting pantry items', { category, showLowStock });

    let items = await mealPlanningAPI.getPantryItems();

    // Apply filters
    if (category) {
      items = items.filter(item =>
        item.category?.toLowerCase() === category.toLowerCase()
      );
    }

    if (showLowStock) {
      items = items.filter(item => item.is_low_stock === true);
    }

    logger.info('ShoppingTools', 'Pantry items retrieved', {
      count: items.length,
      category,
      showLowStock
    });

    return {
      success: true,
      items: items.map(item => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        unit: item.unit,
        category: item.category,
        expiration_date: item.expiration_date,
        is_low_stock: item.is_low_stock
      })),
      count: items.length,
      message: `You have ${items.length} item${items.length !== 1 ? 's' : ''} in your pantry`
    };
  } catch (error) {
    logger.error('ShoppingTools', 'Operation failed', { error,
      operation: 'get_pantry',
      args
    });

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get pantry items'
    };
  }
}

// =====================================================
// EXPORTED TOOLS
// =====================================================

export const shoppingTools: Tool[] = [
  {
    definition: addToShoppingListDefinition,
    execute: executeAddToShoppingList
  },
  {
    definition: getShoppingListDefinition,
    execute: executeGetShoppingList
  },
  {
    definition: addToPantryDefinition,
    execute: executeAddToPantry
  },
  {
    definition: getPantryDefinition,
    execute: executeGetPantry
  }
];
