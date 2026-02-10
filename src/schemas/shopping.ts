/**
 * Zod Schemas for Shopping Module Validation
 *
 * These schemas validate shopping items, lists, stores, and receipts
 * to ensure data integrity and prevent garbage data from entering the system.
 */

import { z } from 'zod';

// ==================== Common Schemas ====================

/**
 * UUID v4 format
 */
export const UUIDSchema = z.string().uuid('Invalid UUID format');

/**
 * ISO date string validation
 */
export const ISODateSchema = z.string().refine(
  (val) => !isNaN(Date.parse(val)) && /^\d{4}-\d{2}-\d{2}/.test(val),
  { message: 'Invalid ISO date string' }
);

/**
 * URL validation
 */
export const URLSchema = z.string().url('Invalid URL format');

/**
 * Phone number validation (flexible format)
 */
export const PhoneSchema = z.string()
  .regex(/^[\d\s\-\(\)\+\.]+$/, 'Invalid phone number format')
  .min(10, 'Phone number is too short')
  .max(20, 'Phone number is too long');

/**
 * Color hex code validation
 */
export const ColorHexSchema = z.string()
  .regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color format (must be #RRGGBB)');

// ==================== Enum Schemas ====================

/**
 * Valid shopping item categories
 */
export const ShoppingCategorySchema = z.enum([
  'produce',
  'meat',
  'dairy',
  'bakery',
  'frozen',
  'deli',
  'pantry',
  'beverages',
  'snacks',
  'household',
  'personal',
  'health',
  'baby',
  'pet',
  'electronics',
  'other',
]);

export type ShoppingCategory = z.infer<typeof ShoppingCategorySchema>;

/**
 * Shopping item priority levels
 */
export const PrioritySchema = z.enum(['low', 'medium', 'high']);

export type Priority = z.infer<typeof PrioritySchema>;

/**
 * Store types
 */
export const StoreTypeSchema = z.enum([
  'grocery',
  'wholesale',
  'specialty',
  'organic',
  'international',
  'pharmacy',
]);

export type StoreType = z.infer<typeof StoreTypeSchema>;

/**
 * Shopping list types
 */
export const ShoppingListTypeSchema = z.enum([
  'master',
  'store-specific',
  'shared',
  'recipe-based',
]);

export type ShoppingListType = z.infer<typeof ShoppingListTypeSchema>;

/**
 * Rating values (1-5)
 */
export const RatingSchema = z.number()
  .int('Rating must be a whole number')
  .min(1, 'Rating must be between 1 and 5')
  .max(5, 'Rating must be between 1 and 5');

// ==================== Parsed Receipt Item Schema ====================

/**
 * Schema for validating individual receipt items
 */
export const ParsedReceiptItemSchema = z.object({
  id: z.string().min(1, 'Item ID is required'),
  name: z.string()
    .min(2, 'Item name must be at least 2 characters')
    .max(200, 'Item name is too long')
    .refine(
      (name) => /^[a-zA-Z0-9\s\-&',./()]+$/.test(name),
      { message: 'Item name contains invalid characters' }
    ),
  quantity: z.number()
    .int('Quantity must be a whole number')
    .positive('Quantity must be greater than 0')
    .max(1000, 'Quantity is unreasonably high'),
  selected: z.boolean(),
  category: ShoppingCategorySchema,
  threshold: z.string(),
  price: z.number()
    .nonnegative('Price cannot be negative')
    .max(10000, 'Price is unreasonably high')
    .optional(),
  size: z.string()
    .max(50, 'Size string is too long')
    .optional(),
});

export type ValidatedReceiptItem = z.infer<typeof ParsedReceiptItemSchema>;

/**
 * Schema for validating an array of receipt items
 */
export const ParsedReceiptItemsSchema = z.array(ParsedReceiptItemSchema)
  .min(1, 'Receipt must contain at least one valid item')
  .max(500, 'Too many items in receipt');

// ==================== Receipt Meta Schema ====================

/**
 * Schema for validating receipt metadata
 */
export const ReceiptMetaSchema = z.object({
  merchant: z.string()
    .max(200, 'Merchant name is too long')
    .optional(),
  address: z.string()
    .max(300, 'Address is too long')
    .optional(),
  date: z.string()
    .regex(
      /^\d{4}[\/-]\d{1,2}[\/-]\d{1,2}$|^\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4}$/,
      'Invalid date format'
    )
    .optional(),
  time: z.string()
    .regex(
      /^\d{1,2}:\d{2}(?::\d{2})?\s*(?:AM|PM)?$/i,
      'Invalid time format'
    )
    .optional(),
  subtotal: z.number()
    .nonnegative('Subtotal cannot be negative')
    .max(100000, 'Subtotal is unreasonably high')
    .optional(),
  tax: z.number()
    .nonnegative('Tax cannot be negative')
    .max(50000, 'Tax is unreasonably high')
    .optional(),
  total: z.number()
    .nonnegative('Total cannot be negative')
    .max(100000, 'Total is unreasonably high')
    .optional(),
  payment: z.string()
    .max(100, 'Payment method string is too long')
    .optional(),
}).refine(
  (data) => {
    // If we have subtotal and tax, total should be approximately subtotal + tax
    if (data.subtotal && data.tax && data.total) {
      const expectedTotal = data.subtotal + data.tax;
      const difference = Math.abs(data.total - expectedTotal);
      // Allow 1% tolerance for rounding
      return difference <= expectedTotal * 0.01;
    }
    return true;
  },
  { message: 'Total does not match subtotal + tax' }
);

export type ValidatedReceiptMeta = z.infer<typeof ReceiptMetaSchema>;

// ==================== Validation Helper Functions ====================

/**
 * Validates parsed receipt items and filters out invalid ones
 * Returns only valid items with a warning for any invalid ones
 */
export function validateReceiptItems(
  items: unknown[],
  options?: { strict?: boolean }
): { valid: ValidatedReceiptItem[]; invalid: number; errors: string[] } {
  const valid: ValidatedReceiptItem[] = [];
  const errors: string[] = [];
  let invalidCount = 0;

  for (let i = 0; i < items.length; i++) {
    const result = ParsedReceiptItemSchema.safeParse(items[i]);
    if (result.success) {
      valid.push(result.data);
    } else {
      invalidCount++;
      const itemName = typeof items[i] === 'object' && items[i] !== null && 'name' in items[i]
        ? String((items[i] as { name: unknown }).name)
        : `item ${i + 1}`;
      errors.push(`Invalid item "${itemName}": ${result.error.issues[0]?.message || 'validation failed'}`);

      // In strict mode, throw on first error
      if (options?.strict) {
        throw new Error(`Receipt validation failed at item ${i + 1}: ${result.error.issues[0]?.message}`);
      }
    }
  }

  return { valid, invalid: invalidCount, errors };
}

/**
 * Validates receipt metadata
 * In non-strict mode, returns empty object if validation fails
 */
export function validateReceiptMeta(
  meta: unknown,
  options?: { strict?: boolean }
): ValidatedReceiptMeta {
  const result = ReceiptMetaSchema.safeParse(meta);

  if (result.success) {
    return result.data;
  }

  if (options?.strict) {
    throw new Error(`Receipt metadata validation failed: ${result.error.issues[0]?.message}`);
  }

  // Return empty metadata if validation fails in non-strict mode
  return {};
}

/**
 * Validates an entire receipt (items + metadata)
 */
export interface ValidatedReceipt {
  items: ValidatedReceiptItem[];
  meta: ValidatedReceiptMeta;
  validation: {
    itemCount: number;
    invalidItemCount: number;
    errors: string[];
  };
}

export function validateReceipt(
  items: unknown[],
  meta: unknown,
  options?: { strict?: boolean }
): ValidatedReceipt {
  const itemsResult = validateReceiptItems(items, options);
  const validatedMeta = validateReceiptMeta(meta, options);

  // In strict mode, throw if no valid items
  if (options?.strict && itemsResult.valid.length === 0) {
    throw new Error('No valid items found in receipt');
  }

  return {
    items: itemsResult.valid,
    meta: validatedMeta,
    validation: {
      itemCount: itemsResult.valid.length,
      invalidItemCount: itemsResult.invalid,
      errors: itemsResult.errors,
    },
  };
}

// ==================== Nutrition Info Schema ====================

/**
 * Schema for nutrition information
 */
export const NutritionInfoSchema = z.object({
  calories: z.number()
    .int('Calories must be a whole number')
    .nonnegative('Calories cannot be negative')
    .max(10000, 'Calories value is unreasonably high')
    .optional(),
  organic: z.boolean().optional(),
  glutenFree: z.boolean().optional(),
  vegan: z.boolean().optional(),
});

export type ValidatedNutritionInfo = z.infer<typeof NutritionInfoSchema>;

// ==================== Shopping Item Schema ====================

/**
 * Schema for validating shopping items
 */
export const ShoppingItemSchema = z.object({
  id: UUIDSchema,
  name: z.string()
    .min(1, 'Item name is required')
    .max(200, 'Item name is too long'),
  quantity: z.number()
    .positive('Quantity must be greater than 0')
    .max(10000, 'Quantity is unreasonably high'),
  unit: z.string()
    .max(50, 'Unit is too long')
    .optional(),
  category: ShoppingCategorySchema,
  subcategory: z.string()
    .max(100, 'Subcategory is too long')
    .optional(),
  priority: PrioritySchema,
  purchased: z.boolean(),
  price: z.number()
    .nonnegative('Price cannot be negative')
    .max(100000, 'Price is unreasonably high')
    .optional(),
  estimatedPrice: z.number()
    .nonnegative('Estimated price cannot be negative')
    .max(100000, 'Estimated price is unreasonably high')
    .optional(),
  aisle: z.string()
    .max(50, 'Aisle is too long')
    .optional(),
  brand: z.string()
    .max(100, 'Brand name is too long')
    .optional(),
  size: z.string()
    .max(50, 'Size is too long')
    .optional(),
  notes: z.string()
    .max(1000, 'Notes are too long')
    .optional(),
  imageUrl: URLSchema.optional(),
  barcode: z.string()
    .regex(/^[\d\-]+$/, 'Invalid barcode format')
    .max(20, 'Barcode is too long')
    .optional(),
  nutritionInfo: NutritionInfoSchema.optional(),
  tags: z.array(z.string().max(50, 'Tag is too long'))
    .max(20, 'Too many tags')
    .optional(),
  addedBy: UUIDSchema.optional(),
  purchasedAt: ISODateSchema.optional(),
  purchasedBy: UUIDSchema.optional(),
  assignedStore: UUIDSchema.optional(),
  bestStores: z.array(UUIDSchema)
    .max(10, 'Too many best stores')
    .optional(),
  createdAt: ISODateSchema,
  updatedAt: ISODateSchema,
});

export type ValidatedShoppingItem = z.infer<typeof ShoppingItemSchema>;

/**
 * Schema for shopping item input (without system fields)
 */
export const ShoppingItemInputSchema = ShoppingItemSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type ValidatedShoppingItemInput = z.infer<typeof ShoppingItemInputSchema>;

/**
 * Schema for shopping item updates (all fields optional except id)
 */
export const ShoppingItemUpdateSchema = ShoppingItemSchema.partial().required({ id: true });

export type ValidatedShoppingItemUpdate = z.infer<typeof ShoppingItemUpdateSchema>;

// ==================== Coordinates Schema ====================

/**
 * Schema for geographic coordinates
 */
export const CoordinatesSchema = z.object({
  lat: z.number()
    .min(-90, 'Latitude must be between -90 and 90')
    .max(90, 'Latitude must be between -90 and 90'),
  lng: z.number()
    .min(-180, 'Longitude must be between -180 and 180')
    .max(180, 'Longitude must be between -180 and 180'),
});

export type ValidatedCoordinates = z.infer<typeof CoordinatesSchema>;

// ==================== Store Preferences Schema ====================

/**
 * Schema for store preferences (ratings)
 */
export const StorePreferencesSchema = z.object({
  priceRating: RatingSchema,
  qualityRating: RatingSchema,
  cleanlinessRating: RatingSchema,
  serviceRating: RatingSchema,
  overallRating: RatingSchema,
});

export type ValidatedStorePreferences = z.infer<typeof StorePreferencesSchema>;

// ==================== Store Hours Schema ====================

/**
 * Schema for store hours (single day)
 */
export const StoreHoursEntrySchema = z.object({
  open: z.string()
    .regex(/^\d{1,2}:\d{2}\s*(?:AM|PM)?$/i, 'Invalid time format'),
  close: z.string()
    .regex(/^\d{1,2}:\d{2}\s*(?:AM|PM)?$/i, 'Invalid time format'),
}).nullable();

/**
 * Schema for all store hours (week)
 */
export const StoreHoursSchema = z.record(
  z.string(),
  StoreHoursEntrySchema
).optional();

export type ValidatedStoreHours = z.infer<typeof StoreHoursSchema>;

// ==================== Store Schema ====================

/**
 * Schema for validating stores
 */
export const StoreSchema = z.object({
  id: UUIDSchema,
  name: z.string()
    .min(1, 'Store name is required')
    .max(200, 'Store name is too long'),
  type: StoreTypeSchema,
  address: z.string()
    .max(500, 'Address is too long')
    .optional(),
  phone: PhoneSchema.optional(),
  website: URLSchema.optional(),
  logo: URLSchema.optional(),
  color: ColorHexSchema,
  coordinates: CoordinatesSchema.optional(),
  preferences: StorePreferencesSchema,
  specialties: z.array(z.string().max(100, 'Specialty is too long'))
    .max(50, 'Too many specialties'),
  bestFor: z.array(z.string().max(100, 'Best for item is too long'))
    .max(50, 'Too many best for items'),
  avgPrices: z.record(
    z.string(),
    z.number().nonnegative('Price cannot be negative').max(10000, 'Price is unreasonably high')
  ),
  distance: z.number()
    .nonnegative('Distance cannot be negative')
    .max(10000, 'Distance is unreasonably high')
    .optional(),
  lastVisited: ISODateSchema.optional(),
  favorite: z.boolean(),
  hours: StoreHoursSchema,
  hasDelivery: z.boolean().optional(),
  hasPickup: z.boolean().optional(),
  deliveryFee: z.number()
    .nonnegative('Delivery fee cannot be negative')
    .max(1000, 'Delivery fee is unreasonably high')
    .optional(),
});

export type ValidatedStore = z.infer<typeof StoreSchema>;

/**
 * Schema for store input (without system fields)
 */
export const StoreInputSchema = StoreSchema.omit({
  id: true,
});

export type ValidatedStoreInput = z.infer<typeof StoreInputSchema>;

/**
 * Schema for store updates (all fields optional except id)
 */
export const StoreUpdateSchema = StoreSchema.partial().required({ id: true });

export type ValidatedStoreUpdate = z.infer<typeof StoreUpdateSchema>;

// ==================== Shopping List Schema ====================

/**
 * Schema for validating shopping lists
 */
export const ShoppingListSchema = z.object({
  id: UUIDSchema,
  name: z.string()
    .min(1, 'List name is required')
    .max(200, 'List name is too long'),
  description: z.string()
    .max(1000, 'Description is too long')
    .optional(),
  type: ShoppingListTypeSchema,
  color: ColorHexSchema,
  icon: z.string()
    .max(50, 'Icon is too long')
    .optional(),
  storeId: UUIDSchema.optional(),
  totalEstimatedCost: z.number()
    .nonnegative('Total estimated cost cannot be negative')
    .max(1000000, 'Total estimated cost is unreasonably high')
    .optional(),
  totalActualCost: z.number()
    .nonnegative('Total actual cost cannot be negative')
    .max(1000000, 'Total actual cost is unreasonably high')
    .optional(),
  items: z.array(ShoppingItemSchema)
    .max(1000, 'Too many items in list'),
  createdAt: ISODateSchema,
  updatedAt: ISODateSchema,
});

export type ValidatedShoppingList = z.infer<typeof ShoppingListSchema>;

/**
 * Schema for shopping list input (without system fields)
 */
export const ShoppingListInputSchema = ShoppingListSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type ValidatedShoppingListInput = z.infer<typeof ShoppingListInputSchema>;

/**
 * Schema for shopping list updates (all fields optional except id)
 */
export const ShoppingListUpdateSchema = ShoppingListSchema.partial().required({ id: true });

export type ValidatedShoppingListUpdate = z.infer<typeof ShoppingListUpdateSchema>;

// ==================== Array Schemas ====================

/**
 * Schema for arrays of shopping items
 */
export const ShoppingItemsArraySchema = z.array(ShoppingItemSchema);

/**
 * Schema for arrays of stores
 */
export const StoresArraySchema = z.array(StoreSchema);

/**
 * Schema for arrays of shopping lists
 */
export const ShoppingListsArraySchema = z.array(ShoppingListSchema);

// ==================== Additional Validation Helpers ====================

/**
 * Validates and filters an array of shopping items
 */
export function validateShoppingItemsArray<T>(
  schema: z.ZodSchema<unknown>,
  data: unknown[],
  context: string
): T[] {
  const validItems: T[] = [];

  for (let i = 0; i < data.length; i++) {
    const result = schema.safeParse(data[i]);
    if (result.success) {
      validItems.push(result.data as T);
    } else {
      console.warn(`Invalid item at index ${i} in ${context}:`, {
        errors: result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`),
        item: data[i],
      });
    }
  }

  return validItems;
}

/**
 * Validates a single shopping-related item and throws on error
 */
export function validateShoppingItem<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
  context: string
): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    const errors = result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
    throw new Error(`Validation failed for ${context}: ${errors}`);
  }
  return result.data;
}
