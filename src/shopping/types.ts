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
  assignedStore?: string; // Store ID where this item should be bought
  bestStores?: string[]; // Ordered list of best stores for this item
  ownerId?: string; // User ID of the owner (for merged mode)
  createdAt: Date;
  updatedAt: Date;
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
    priceRating: 1 | 2 | 3 | 4 | 5; // 1 = expensive, 5 = cheap
    qualityRating: 1 | 2 | 3 | 4 | 5; // 1 = poor, 5 = excellent
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
  monthlyBudget?: number; // Monthly spending budget for this store
}

export interface ShoppingList {
  id: string;
  name: string;
  description?: string;
  type: 'master' | 'store-specific' | 'shared' | 'recipe-based';
  color: string;
  icon?: string;
  storeId?: string;
  totalEstimatedCost?: number;
  totalActualCost?: number;
  items: ShoppingItem[];
  createdAt: Date;
  updatedAt: Date;
}

// Owner information types for merged mode
export interface ShoppingItemWithOwner extends ShoppingItem {
  ownerId: string;
  ownerName: string;
  isOwnedByCurrentUser: boolean;
}

export interface ShoppingListWithOwner extends ShoppingList {
  ownerId: string;
  ownerName: string;
  isOwnedByCurrentUser: boolean;
}
