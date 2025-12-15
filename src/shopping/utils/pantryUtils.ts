import type { PantryItem } from '../../types';
import type { ShoppingItem } from '../types';

/**
 * Create a shopping item from a pantry item for replenishment
 * @param pantryItem - The pantry item to convert
 * @param quantityNeeded - The quantity needed
 * @returns A shopping item object ready to be added (without id, createdAt, updatedAt)
 */
export function createShoppingItemFromPantry(
  pantryItem: PantryItem,
  quantityNeeded: number
): Omit<ShoppingItem, 'id' | 'createdAt' | 'updatedAt'> {
  // Map pantry category to shopping category (pantry has fewer categories)
  const categoryMap: Record<PantryItem['category'], ShoppingItem['category']> = {
    produce: 'produce',
    dairy: 'dairy',
    meat: 'meat',
    pantry: 'pantry',
    bakery: 'bakery',
    other: 'other',
  };

  return {
    name: pantryItem.name,
    quantity: quantityNeeded,
    unit: pantryItem.unit,
    category: categoryMap[pantryItem.category] ?? 'other',
    priority: 'medium',
    purchased: false,
    notes: pantryItem.notes,
    tags: ['from:pantry', 'reason:replenish'],
    bestStores: [],
  };
}

/**
 * Export pantry items to CSV format
 * @param items - Array of pantry items to export
 * @returns CSV string ready for download
 */
export function exportPantryToCsv(items: PantryItem[]): string {
  const headers = ['Name', 'Quantity', 'Unit', 'Category', 'Expiration', 'Location', 'Low Stock', 'Threshold'];
  const rows: string[][] = items.map((item): string[] => [
    item.name,
    item.quantity?.toString() ?? '0',
    item.unit ?? '',
    item.category,
    item.expirationDate ? item.expirationDate.toISOString().split('T')[0] : '',
    item.location ?? '',
    item.isLowStock ? 'Yes' : 'No',
    item.lowStockThreshold?.toString() ?? ''
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map((row): string => row.map((cell): string => `"${cell}"`).join(','))
  ].join('\n');

  return csvContent;
}

/**
 * Download a CSV file to the user's browser
 * @param csvContent - The CSV content as a string
 * @param filename - The desired filename
 */
export function downloadCsv(csvContent: string, filename: string = 'pantry-export.csv'): void {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
