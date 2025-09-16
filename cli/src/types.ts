export interface ShoppingItem {
  id: string;
  name: string;
  quantity: number;
  unit?: string;
  category: 'produce' | 'dairy' | 'meat' | 'pantry' | 'frozen' | 'bakery' | 'deli' | 'household' | 'personal' | 'electronics' | 'other';
  subcategory?: string;
  priority: 'low' | 'medium' | 'high';
  purchased: boolean;
  price?: number;
  estimatedPrice?: number;
  aisle?: string;
  brand?: string;
  size?: string;
  notes?: string;
  imageUrl?: string;
  barcode?: string;
  nutritionInfo?: {
    calories?: number;
    organic?: boolean;
    glutenFree?: boolean;
    vegan?: boolean;
  };
  tags?: string[];
  addedBy?: string;
  purchasedAt?: Date;
  purchasedBy?: string;
  assignedStore?: string;
  bestStores?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Recipe {
  id: string;
  name: string;
  description?: string;
  cuisine: 'american' | 'italian' | 'mexican' | 'asian' | 'indian' | 'mediterranean' | 'other';
  difficulty: 'easy' | 'medium' | 'hard';
  prepTime: number;
  cookTime: number;
  servings: number;
  ingredients: Ingredient[];
  instructions: string[];
  tags: string[];
  rating?: number;
  nutritionInfo?: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber?: number;
  };
  dietaryRestrictions: string[];
  image?: string;
  source?: string;
  sourceUrl?: string;
  sourceType?: 'youtube' | 'instagram' | 'manual';
  videoThumbnail?: string;
  authorName?: string;
  authorImage?: string;
  notes?: string;
  flowChart?: RecipeFlowStep[];
  createdAt: Date;
  lastMade?: Date;
}

export interface Ingredient {
  name: string;
  amount: number;
  unit: string;
  category: 'produce' | 'dairy' | 'meat' | 'pantry' | 'frozen' | 'bakery' | 'deli' | 'household' | 'personal' | 'other';
  optional?: boolean;
  notes?: string;
}

export interface RecipeFlowStep {
  id: string;
  step: number;
  title: string;
  description: string;
  duration?: number;
  temperature?: string;
  tips?: string;
  ingredients?: string[];
  equipment?: string[];
  image?: string;
  isParallel?: boolean;
  dependencies?: string[];
}

export interface MealPlan {
  id: string;
  date: Date;
  mealType: string;
  recipeId?: string;
  customMeal?: string;
  servings: number;
  peopleCount?: number;
  notes?: string;
  status: 'planned' | 'prepped' | 'cooked' | 'eaten';
  prepTime?: Date;
  cookTime?: Date;
}

export interface Store {
  id: string;
  name: string;
  type: 'grocery' | 'wholesale' | 'specialty' | 'organic' | 'international' | 'pharmacy';
  address?: string;
  phone?: string;
  website?: string;
  logo?: string;
  color: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  preferences: {
    priceRating: 1 | 2 | 3 | 4 | 5;
    qualityRating: 1 | 2 | 3 | 4 | 5;
    cleanlinessRating: 1 | 2 | 3 | 4 | 5;
    serviceRating: 1 | 2 | 3 | 4 | 5;
    overallRating: 1 | 2 | 3 | 4 | 5;
  };
  specialties: string[];
  bestFor: string[];
  avgPrices: { [itemName: string]: number };
  distance?: number;
  lastVisited?: Date;
  favorite: boolean;
  hours?: {
    [day: string]: { open: string; close: string; } | null;
  };
  hasDelivery?: boolean;
  hasPickup?: boolean;
  deliveryFee?: number;
}

export interface TodoCategory {
  id: string;
  name: string;
  description?: string;
  color: string;
  icon?: string;
  todos: TodoItem[];
  createdAt: Date;
}

export interface TodoItem {
  id: string;
  title: string;
  description?: string;
  status: 'need-to-start' | 'currently-working' | 'pending-others' | 'done';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  categoryId: string;
  dueDate?: Date;
  assignedTo?: string;
  blockedBy?: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  estimatedTime?: number;
  completedAt?: Date;
  completed?: boolean;
}

export interface CliConfig {
  apiUrl?: string;
  dataPath?: string;
  defaultStore?: string;
  defaultMealType?: string;
  defaultCategory?: string;
  username?: string;
}