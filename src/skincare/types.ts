/**
 * Skincare/Self Care type definitions
 *
 * Active types for products and weekly routines.
 */

// Category types
export type ProductCategory =
  | 'cleanser'
  | 'toner'
  | 'serum'
  | 'moisturizer'
  | 'sunscreen'
  | 'treatment'
  | 'mask'
  | 'eye_cream'
  | 'exfoliant'
  | 'oil'
  | 'other';

export type UsageTime = 'AM' | 'PM' | 'BOTH';

export type Frequency = 'daily' | 'every_other_day' | 'weekly' | 'as_needed';

// Main entities
export type SkincareProduct = {
  id: string;
  userId: string;

  // Product Info
  name: string;
  brand?: string;
  category: ProductCategory;
  productType?: string; // gel, cream, foam, liquid, spray, sheet_mask, etc.

  // Usage Info
  usageTime: UsageTime[];
  orderInRoutine?: number; // Step order in routine (1=first, 2=second, etc.)
  frequency?: Frequency;

  // Product Details
  skinConcerns?: string[]; // acne, dryness, aging, sensitivity, hyperpigmentation, redness, etc.
  keyIngredients?: string[];
  notes?: string;

  // Purchase & Tracking
  purchaseDate?: string;
  expiryDate?: string;
  price?: number;
  size?: string; // e.g., "50ml", "1oz"
  whereToBuy?: string;
  repurchase?: boolean;

  // Status
  currentlyUsing: boolean;
  startedUsingDate?: string;
  stoppedUsingDate?: string;

  // Ratings
  rating?: number; // 1-5
  effectiveness?: number; // 1-5

  createdAt: string;
  updatedAt: string;
};

// Weekly Routine (simple text-based)
export type SkincareWeeklyRoutine = {
  id: string;
  userId: string;

  dayOfWeek: number; // 0=Sunday, 1=Monday, ..., 6=Saturday

  // Text-based routine descriptions
  amRoutine?: string; // e.g., "Cleanser + Vitamin C + Moisturizer + SPF"
  pmRoutine?: string; // e.g., "Oil Cleanser → Cleanser → Retinol → Moisturizer"

  notes?: string;

  createdAt: string;
  updatedAt: string;
};

// Input types for forms
export type SkincareProductInput = Omit<
  SkincareProduct,
  'id' | 'userId' | 'createdAt' | 'updatedAt'
>;

export type SkincareWeeklyRoutineInput = Omit<
  SkincareWeeklyRoutine,
  'id' | 'userId' | 'createdAt' | 'updatedAt'
>;
