/**
 * Skincare tracking type definitions
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

export type RoutineType = 'AM' | 'PM' | 'WEEKLY' | 'SPECIAL';

export type SkinCondition = 'great' | 'good' | 'okay' | 'bad' | 'terrible';

export type Weather = 'sunny' | 'rainy' | 'humid' | 'dry' | 'cold';

export type ObservationType =
  | 'breakout'
  | 'irritation'
  | 'improvement'
  | 'dryness'
  | 'oiliness'
  | 'redness'
  | 'glow'
  | 'texture'
  | 'sensitivity';

export type SkinLocation =
  | 'forehead'
  | 'cheeks'
  | 'chin'
  | 'nose'
  | 'around_eyes'
  | 'neck'
  | 'full_face';

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

export type SkincareRoutine = {
  id: string;
  userId: string;

  name: string; // "Morning Routine", "Evening Routine", "Special Occasion"
  routineType: RoutineType;
  isActive: boolean;

  // Routine Steps (ordered list of product IDs)
  productIds: string[];

  // Scheduling
  daysOfWeek?: number[]; // 0=Sunday, 1=Monday, etc. null means all days

  // Reminders
  reminderEnabled?: boolean;
  reminderTime?: string; // HH:MM format

  notes?: string;

  createdAt: string;
  updatedAt: string;
};

export type SkincareLog = {
  id: string;
  userId: string;

  date: string; // ISO date
  routineId?: string;
  routineType: RoutineType;

  // Completion tracking
  completed: boolean;
  completedAt?: string;
  productsUsed?: string[]; // Array of product IDs actually used
  skippedProducts?: string[]; // Products in routine but skipped

  // Skin condition tracking
  skinCondition?: SkinCondition;
  skinNotes?: string; // How skin felt, any reactions, etc.

  // Environmental factors
  weather?: Weather;
  stressLevel?: number; // 1-5
  sleepQuality?: number; // 1-5

  // Photos
  photoUrls?: string[];

  createdAt: string;
  updatedAt: string;
};

export type SkinObservation = {
  id: string;
  userId: string;

  date: string; // ISO date

  // Observation
  observationType: ObservationType;
  severity?: number; // 1-5
  location?: SkinLocation;

  description?: string;

  // Potential causes
  suspectedProductId?: string;
  otherFactors?: string; // diet, stress, hormones, weather, etc.

  // Resolution
  resolved: boolean;
  resolvedDate?: string;
  resolutionNotes?: string;

  createdAt: string;
  updatedAt: string;
};

// Input types for forms
export type SkincareProductInput = Omit<
  SkincareProduct,
  'id' | 'userId' | 'createdAt' | 'updatedAt'
>;

export type SkincareRoutineInput = Omit<
  SkincareRoutine,
  'id' | 'userId' | 'createdAt' | 'updatedAt'
>;

export type SkincareLogInput = Omit<
  SkincareLog,
  'id' | 'userId' | 'createdAt' | 'updatedAt'
>;

export type SkinObservationInput = Omit<
  SkinObservation,
  'id' | 'userId' | 'createdAt' | 'updatedAt'
>;

// Analytics types
export type SkincareStreak = {
  userId: string;
  currentStreakDays: number;
  lastCompletionDate: string;
};

export type RoutineSummary = {
  routineId: string;
  userId: string;
  routineName: string;
  routineType: RoutineType;
  isActive: boolean;
  productCount: number;
  categoriesUsed: ProductCategory[];
};

export type SkincareStats = {
  totalProducts: number;
  activeProducts: number;
  totalRoutines: number;
  activeRoutines: number;
  currentStreak: number;
  completionRate: number; // Percentage of days completed in last 30 days
  mostUsedCategory: ProductCategory;
  favoriteProducts: SkincareProduct[]; // Highest rated products
};

// API Response types
export type SkincareProductsResponse = SkincareProduct[];
export type SkincareRoutinesResponse = SkincareRoutine[];
export type SkincareLogsResponse = {
  items: SkincareLog[];
  total: number;
};
export type SkinObservationsResponse = {
  items: SkinObservation[];
  total: number;
};
