/**
 * Zod validation schemas for Shopping types
 * Runtime type safety for shopping lists and items
 */

import { z } from 'zod';

// =====================================================
// SHOPPING LIST SCHEMAS
// =====================================================

export const ShoppingListStatusSchema = z.enum(['active', 'completed', 'archived']);

export const ShoppingListDataSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  name: z.string().min(1),
  description: z.string().nullable().optional(),
  status: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const ShoppingListDataArraySchema = z.array(ShoppingListDataSchema);

// =====================================================
// SHOPPING ITEM SCHEMAS
// =====================================================

export const ShoppingItemCategorySchema = z.enum([
  'produce',
  'dairy',
  'meat',
  'pantry',
  'frozen',
  'bakery',
  'deli',
  'household',
  'personal',
  'electronics',
  'other',
]);

export const ShoppingItemPrioritySchema = z.enum(['low', 'medium', 'high']);

export const NutritionInfoSchema = z.object({
  calories: z.number().optional(),
  organic: z.boolean().optional(),
  glutenFree: z.boolean().optional(),
  vegan: z.boolean().optional(),
}).optional();

export const RecurringInfoSchema = z.object({
  frequency: z.enum(['daily', 'weekly', 'biweekly', 'monthly']).optional(),
  lastAdded: z.string().optional(),
}).optional();

export const ShoppingItemDataSchema = z.object({
  id: z.string(),
  shopping_list_id: z.string(),
  user_id: z.string(),
  name: z.string().min(1),
  quantity: z.number().nullable().optional(),
  unit: z.string().nullable().optional(),
  estimated_price: z.number().nullable().optional(),
  actual_price: z.number().nullable().optional(),
  category: z.string().nullable().optional(),
  subcategory: z.string().nullable().optional(),
  brand: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  is_purchased: z.boolean().nullable().optional(),
  purchased_at: z.string().nullable().optional(),
  purchased_by: z.string().nullable().optional(),
  position: z.number().nullable().optional(),
  priority: z.string().nullable().optional(),
  tags: z.array(z.string()).nullable().optional(),
  assigned_store: z.string().nullable().optional(),
  best_stores: z.array(z.string()).nullable().optional(),
  aisle: z.string().nullable().optional(),
  barcode: z.string().nullable().optional(),
  image_url: z.string().nullable().optional(),
  nutrition_info: z.unknown().nullable().optional(), // Json type
  recurring: z.unknown().nullable().optional(), // Json type
  added_by: z.string().nullable().optional(),
  auto_added: z.boolean().nullable().optional(),
  recipe_id: z.string().nullable().optional(),
  store: z.string().nullable().optional(),
  source_type: z.enum(['manual', 'batch_cook', 'recipe', 'pantry']).nullable().optional(),
  source_name: z.string().nullable().optional(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const ShoppingItemDataArraySchema = z.array(ShoppingItemDataSchema);

// =====================================================
// STORE SCHEMAS
// =====================================================

export const StoreTypeSchema = z.enum([
  'grocery',
  'wholesale',
  'specialty',
  'organic',
  'international',
  'pharmacy',
]);

export const StorePreferencesSchema = z.object({
  priceRating: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]),
  qualityRating: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]),
  cleanlinessRating: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]),
  serviceRating: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]),
  overallRating: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]),
});

export const StoreDataSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  name: z.string().min(1),
  type: StoreTypeSchema,
  address: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  website: z.string().nullable().optional(),
  logo: z.string().nullable().optional(),
  color: z.string(),
  coordinates: z.object({
    lat: z.number(),
    lng: z.number(),
  }).nullable().optional(),
  preferences: StorePreferencesSchema.optional(),
  specialties: z.array(z.string()).optional(),
  best_for: z.array(z.string()).optional(),
  avg_prices: z.record(z.number()).optional(),
  distance: z.number().nullable().optional(),
  last_visited: z.string().nullable().optional(),
  favorite: z.boolean().optional(),
  hours: z.record(z.object({
    open: z.string(),
    close: z.string(),
  }).nullable()).nullable().optional(),
  has_delivery: z.boolean().nullable().optional(),
  has_pickup: z.boolean().nullable().optional(),
  delivery_fee: z.number().nullable().optional(),
  connection_id: z.string().nullable().optional(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const StoreDataArraySchema = z.array(StoreDataSchema);
