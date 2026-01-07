/**
 * Skincare AI Tools
 * AI tools for skincare product and condition tracking
 */

import type { Tool, ToolDefinition, ToolResult } from '@/lib/ai/toolRegistry';
import {
  getSkincareProducts,
  createSkincareProduct,
  createSkinConditionLog,
  getSkincareStats,
} from '@/api/skincareAPI';
import type { SkincareProduct, SkinConditionLog } from '@/services/types';
import { logger } from '@/services/logger';

// =====================================================
// TOOL DEFINITIONS
// =====================================================

const addSkincareProductDefinition: ToolDefinition = {
  type: 'function',
  function: {
    name: 'add_skincare_product',
    description:
      'Add a skincare product to your collection. Requires name, brand, and category. Optional: ingredients, price, rating, notes.',
    parameters: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Product name - required' },
        brand: { type: 'string', description: 'Brand name - required' },
        category: {
          type: 'string',
          enum: ['cleanser', 'toner', 'serum', 'moisturizer', 'sunscreen', 'treatment', 'mask', 'exfoliant'],
          description: 'Product category - required',
        },
        ingredients: {
          type: 'array',
          items: { type: 'string', description: 'Ingredient name' },
          description: 'List of ingredients - optional',
        },
        key_ingredients: {
          type: 'array',
          items: { type: 'string', description: 'Key ingredient name' },
          description: 'List of key active ingredients - optional',
        },
        price: { type: 'number', description: 'Product price - optional' },
        rating: { type: 'number', description: 'Your rating (1-5) - optional' },
        notes: { type: 'string', description: 'Additional notes - optional' },
      },
      required: ['name', 'brand', 'category'],
    },
  },
};

const logSkinConditionDefinition: ToolDefinition = {
  type: 'function',
  function: {
    name: 'log_skin_condition',
    description:
      'Log your skin condition for tracking. Requires date and overall_condition (1-5). Optional: concerns, notes.',
    parameters: {
      type: 'object',
      properties: {
        date: { type: 'string', description: 'Date in YYYY-MM-DD format - required' },
        overall_condition: {
          type: 'number',
          description: 'Overall skin condition (1=terrible, 5=excellent) - required',
        },
        concerns: {
          type: 'array',
          items: { type: 'string', description: 'Skin concern' },
          description: 'List of skin concerns (e.g., acne, dryness, redness) - optional',
        },
        notes: { type: 'string', description: 'Additional notes - optional' },
      },
      required: ['date', 'overall_condition'],
    },
  },
};

const getRoutineSuggestionDefinition: ToolDefinition = {
  type: 'function',
  function: {
    name: 'get_routine_suggestion',
    description: 'Get suggested skincare routine based on your products and skin condition.',
    parameters: {
      type: 'object',
      properties: {
        time_of_day: {
          type: 'string',
          enum: ['am', 'pm'],
          description: 'Morning or evening routine - optional',
        },
      },
    },
  },
};

const trackProductUsageDefinition: ToolDefinition = {
  type: 'function',
  function: {
    name: 'track_product_usage',
    description: 'Track usage of a skincare product (mark as in use or not in use). Requires product_id and in_use boolean.',
    parameters: {
      type: 'object',
      properties: {
        product_id: { type: 'string', description: 'Product ID - required' },
        in_use: { type: 'boolean', description: 'Whether product is currently in use - required' },
      },
      required: ['product_id', 'in_use'],
    },
  },
};

const getSkincareStatsDefinition: ToolDefinition = {
  type: 'function',
  function: {
    name: 'get_skincare_stats',
    description: 'Get skincare statistics including product counts and average skin condition.',
    parameters: {
      type: 'object',
      properties: {},
    },
  },
};

// =====================================================
// TOOL EXECUTION FUNCTIONS
// =====================================================

async function executeAddSkincareProduct(args: Record<string, unknown>): Promise<ToolResult> {
  try {
    const product = await createSkincareProduct({
      name: args.name as string,
      brand: args.brand as string,
      category: args.category as SkincareProduct['category'],
      keyIngredients: (args.key_ingredients as string[]) || [],
      price: args.price as number | undefined,
      rating: args.rating as number | undefined,
      notes: args.notes as string | undefined,
      currentlyUsing: false,
      usageTime: [],
    });

    logger.info('SkincareTools', 'Skincare product added', { id: product.id, name: product.name });
    return {
      success: true,
      message: `Added skincare product: ${product.name} by ${product.brand}`,
      data: product,
    };
  } catch (error) {
    logger.error('SkincareTools', 'Operation failed', { error, context: 'executeAddSkincareProduct' });
    return { success: false, error: (error as Error).message };
  }
}

async function executeLogSkinCondition(args: Record<string, unknown>): Promise<ToolResult> {
  try {
    const log = await createSkinConditionLog({
      date: args.date as string,
      overall_condition: args.overall_condition as SkinConditionLog['overall_condition'],
      concerns: (args.concerns as string[]) || [],
      notes: args.notes as string | undefined,
    });

    logger.info('SkincareTools', 'Skin condition logged', { id: log.id, date: log.date });
    return {
      success: true,
      message: `Logged skin condition for ${log.date}: ${log.overall_condition}/5`,
      data: log,
    };
  } catch (error) {
    logger.error('SkincareTools', 'Operation failed', { error, context: 'executeLogSkinCondition' });
    return { success: false, error: (error as Error).message };
  }
}

async function executeGetRoutineSuggestion(args: Record<string, unknown>): Promise<ToolResult> {
  try {
    const products = await getSkincareProducts({ in_use: true });
    const timeOfDay = args.time_of_day as 'am' | 'pm' | undefined;

    // Build suggested routine order
    const routineOrder = ['cleanser', 'toner', 'serum', 'treatment', 'moisturizer', 'sunscreen'];
    const routine = routineOrder
      .map((category) => products.find((p) => p.category === category))
      .filter((p) => {
        if (!p) return false;
        // Skip sunscreen in PM routine
        if (timeOfDay === 'pm' && p.category === 'sunscreen') return false;
        return true;
      });

    return {
      success: true,
      message: `Suggested ${timeOfDay || 'daily'} routine with ${routine.length} steps`,
      data: routine,
      count: routine.length,
    };
  } catch (error) {
    logger.error('SkincareTools', 'Operation failed', { error, context: 'executeGetRoutineSuggestion' });
    return { success: false, error: (error as Error).message };
  }
}

async function executeTrackProductUsage(_args: Record<string, unknown>): Promise<ToolResult> {
  // This would update the product's in_use status
  // For now, returning a placeholder
  return {
    success: true,
    message: 'Product usage tracking would be updated here',
  };
}

async function executeGetSkincareStats(_args: Record<string, unknown>): Promise<ToolResult> {
  try {
    const stats = await getSkincareStats();

    logger.info('SkincareTools', 'Skincare stats retrieved', stats);
    return {
      success: true,
      message: `Total products: ${stats.totalProducts}, In use: ${stats.productsInUse}, Avg condition: ${stats.averageCondition.toFixed(1)}/5`,
      data: stats,
    };
  } catch (error) {
    logger.error('SkincareTools', 'Operation failed', { error, context: 'executeGetSkincareStats' });
    return { success: false, error: (error as Error).message };
  }
}

// =====================================================
// EXPORT TOOLS
// =====================================================

export const skincareTools: Tool[] = [
  { definition: addSkincareProductDefinition, execute: executeAddSkincareProduct },
  { definition: logSkinConditionDefinition, execute: executeLogSkinCondition },
  { definition: getRoutineSuggestionDefinition, execute: executeGetRoutineSuggestion },
  { definition: trackProductUsageDefinition, execute: executeTrackProductUsage },
  { definition: getSkincareStatsDefinition, execute: executeGetSkincareStats },
];
