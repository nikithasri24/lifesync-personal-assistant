/**
 * Shopping Form Types
 * Form state and input types for shopping features
 */

import type { ShoppingItem } from '../types';

export type ShoppingItemForm = {
  name: string;
  quantity: number;
  unit: string;
  category: ShoppingItem['category'];
  priority: ShoppingItem['priority'];
  estimatedPrice: string;
  brand: string;
  notes: string;
  preferredStore: string;
};

export type PantryItemForm = {
  name: string;
  quantity: string;
  unit: string;
  category: ShoppingItem['category'];
  expiration: string;
  location: string;
  threshold: string;
};

export type PantryEditForm = {
  qty: string;
  unit: string;
  exp: string;
  low: boolean;
  threshold: string;
};

export type PantryFilter = 'all' | 'expired' | 'soon' | 'low';
export type PantrySort = 'expiry' | 'name';

export type ViewType = 'master' | 'stores' | 'distribute' | 'pantry';

export const createEmptyItemForm = (): ShoppingItemForm => ({
  name: '',
  quantity: 1,
  unit: 'pcs',
  category: 'other',
  priority: 'medium',
  estimatedPrice: '',
  brand: '',
  notes: '',
  preferredStore: '',
});

export const createEmptyPantryForm = (): PantryItemForm => ({
  name: '',
  quantity: '1',
  unit: '',
  category: 'pantry',
  expiration: '',
  location: '',
  threshold: '',
});

export const createEmptyPantryEditForm = (): PantryEditForm => ({
  qty: '0',
  unit: '',
  exp: '',
  low: false,
  threshold: '',
});
