/**
 * Personal Care tracking type definitions
 * Frequency-based personal care tracking for skincare, hair care, hair removal, etc.
 */

// =====================================================
// ENUMS & CONSTANTS
// =====================================================

/**
 * Tracking mode for personal care items
 * - none: Item is hidden/not tracked
 * - manual: User checks off when done, app learns patterns
 * - scheduled: Auto-adds to schedule based on interval (e.g., every 14 days)
 */
export type TrackingMode = 'none' | 'manual' | 'scheduled';

/**
 * Frequency type for categories
 * - daily: Every day tasks (Skincare AM/PM, Face exercises)
 * - weekly: 1-7 day tasks (Hair wash, Face masks)
 * - biweekly_monthly: 14-30 day tasks (Threading, Waxing)
 * - every_2_8_weeks: 14-56 day tasks (Laser, IPL, Dermaplaning)
 * - custom: User-defined category
 */
export type FrequencyType = 'daily' | 'weekly' | 'biweekly_monthly' | 'every_2_8_weeks' | 'custom';

// =====================================================
// MAIN ENTITIES
// =====================================================

/**
 * Frequency-based categories for organizing personal care items
 * Examples: "Daily", "Weekly", "Bi-weekly to Monthly", "Every 2-8 Weeks"
 */
export type PersonalCareCategory = {
  id: string;
  userId: string;

  name: string;
  frequencyType: FrequencyType;
  icon: string;
  color?: string;

  isActive: boolean;
  sortOrder: number;

  createdAt: string;
  updatedAt: string;
};

/**
 * Items within categories
 * Examples: "Bikini", "Cleanser", "Hair Wash", "Underarms"
 */
export type PersonalCareItem = {
  id: string;
  userId: string;
  categoryId: string;

  name: string;
  icon?: string;

  // Tracking configuration
  trackingMode: TrackingMode;
  scheduleIntervalDays?: number; // For 'scheduled' mode (e.g., 14 for bikini)
  goalIntervalDays?: number; // Optional: "I want to do this every X days"

  // Tracking state
  lastCompletedAt?: string;
  nextDueDate?: string;

  isActive: boolean;
  sortOrder: number;
  notes?: string;

  createdAt: string;
  updatedAt: string;
};

/**
 * Products that can be linked to care items
 */
export type PersonalCareProduct = {
  id: string;
  userId: string;

  name: string;
  brand?: string;
  category?: string; // cleanser, moisturizer, wax, razor, oil, mask, etc.
  productType?: string; // gel, cream, foam, liquid, etc.

  // Purchase & Tracking
  purchaseDate?: string;
  expiryDate?: string;
  price?: number;
  size?: string;
  whereToBuy?: string;

  // Status
  currentlyUsing: boolean;
  rating?: number; // 1-5
  notes?: string;

  createdAt: string;
  updatedAt: string;
};

/**
 * Junction table linking products to items with order
 */
export type PersonalCareItemProduct = {
  id: string;
  itemId: string;
  productId: string;
  usageOrder: number;
  createdAt: string;
};

/**
 * Log entry for when an item is completed
 */
export type PersonalCareLog = {
  id: string;
  userId: string;
  itemId: string;

  completedAt: string;
  skipped: boolean;

  notes?: string;
  rating?: number; // 1-5
  productsUsed?: string[]; // Array of product IDs

  createdAt: string;
};

/**
 * Schedule status for calendar entries
 */
export type ScheduleStatus = 'scheduled' | 'completed' | 'skipped';

/**
 * Calendar schedule entry - one item per day
 */
export type PersonalCareSchedule = {
  id: string;
  userId: string;
  itemId: string;

  scheduledDate: string; // YYYY-MM-DD format
  status: ScheduleStatus;
  completedAt?: string;
  notes?: string;

  createdAt: string;
  updatedAt: string;
};

// =====================================================
// INPUT TYPES (for forms/mutations)
// =====================================================

export type PersonalCareCategoryInput = Omit<
  PersonalCareCategory,
  'id' | 'userId' | 'createdAt' | 'updatedAt'
>;

export type PersonalCareItemInput = Omit<
  PersonalCareItem,
  'id' | 'userId' | 'createdAt' | 'updatedAt' | 'lastCompletedAt' | 'nextDueDate'
>;

export type PersonalCareProductInput = Omit<
  PersonalCareProduct,
  'id' | 'userId' | 'createdAt' | 'updatedAt'
>;

export type PersonalCareLogInput = Omit<
  PersonalCareLog,
  'id' | 'userId' | 'createdAt'
>;

export type PersonalCareScheduleInput = Omit<
  PersonalCareSchedule,
  'id' | 'userId' | 'createdAt' | 'updatedAt'
>;

// =====================================================
// EXTENDED TYPES (with relations)
// =====================================================

/**
 * Schedule entry with item details expanded
 */
export type PersonalCareScheduleWithItem = PersonalCareSchedule & {
  item: PersonalCareItem;
};

/**
 * Item with linked products expanded
 */
export type PersonalCareItemWithProducts = PersonalCareItem & {
  products: (PersonalCareProduct & { usageOrder: number })[];
};

/**
 * Category with items expanded
 */
export type PersonalCareCategoryWithItems = PersonalCareCategory & {
  items: PersonalCareItem[];
};

// =====================================================
// TODAY VIEW TYPES
// =====================================================

/**
 * Items due today (scheduled items where nextDueDate <= today)
 */
export type ScheduledItem = PersonalCareItem & {
  categoryName: string;
  categoryIcon: string;
  daysOverdue: number; // 0 = due today, positive = overdue
};

/**
 * Today's view data structure
 */
export type TodayView = {
  scheduledItems: ScheduledItem[];
  manualItems: PersonalCareItemWithProducts[];
  recentLogs: PersonalCareLog[];
};

// =====================================================
// STATS & ANALYTICS
// =====================================================

export type PersonalCareStats = {
  totalCategories: number;
  totalItems: number;
  activeItems: number;
  totalProducts: number;
  completionsLast30Days: number;
  itemsCompletedToday: number;
  overdueItems: number;
};

// =====================================================
// API RESPONSE TYPES
// =====================================================

export type PersonalCareCategoriesResponse = PersonalCareCategory[];
export type PersonalCareItemsResponse = PersonalCareItem[];
export type PersonalCareProductsResponse = PersonalCareProduct[];
export type PersonalCareLogsResponse = {
  items: PersonalCareLog[];
  total: number;
};

