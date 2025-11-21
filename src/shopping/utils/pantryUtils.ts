import type { PantryItem, ShoppingItem } from '../types';

/**
 * Create a shopping item from a pantry item for replenishment
 * @param pantryItem - The pantry item to convert
 * @param quantityNeeded - The quantity needed
 * @returns A partial shopping item object ready to be added
 */
export function createShoppingItemFromPantry(
  pantryItem: PantryItem,
  quantityNeeded: number
): Partial<ShoppingItem> {
  return {
    name: pantryItem.name,
    quantity: quantityNeeded,
    unit: pantryItem.unit,
    category: pantryItem.category,
    subcategory: undefined,
    priority: 'medium',
    purchased: false,
    price: undefined,
    estimatedPrice: undefined,
    aisle: undefined,
    brand: undefined,
    size: undefined,
    notes: pantryItem.notes,
    imageUrl: undefined,
    nutritionInfo: undefined,
    tags: ['from:pantry', 'reason:replenish'],
    addedBy: undefined,
    purchasedAt: undefined,
    purchasedBy: undefined,
    assignedStore: undefined,
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
  const rows = items.map(item => [
    item.name,
    item.quantity?.toString() || '0',
    item.unit || '',
    item.category,
    item.expirationDate ? item.expirationDate.toISOString().split('T')[0] : '',
    item.location || '',
    item.isLowStock ? 'Yes' : 'No',
    item.lowStockThreshold?.toString() || ''
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
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
