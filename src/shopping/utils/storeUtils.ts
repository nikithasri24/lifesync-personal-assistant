import type { Store, ShoppingItem } from '../types';

/**
 * Calculate the distance between two coordinates using the Haversine formula
 * @param lat1 - Latitude of first point
 * @param lng1 - Longitude of first point
 * @param lat2 - Latitude of second point
 * @param lng2 - Longitude of second point
 * @returns Distance in miles
 */
export function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3959; // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

/**
 * Calculate a score for a store based on multiple factors
 * @param store - The store to score
 * @param category - The item category being considered
 * @returns A numerical score (higher is better)
 */
export function calculateStoreScore(store: Store, category: string): number {
  let score = 0;

  // Best for category
  if (store.bestFor.includes(category)) score += 3;

  // Price rating (higher is better for affordability)
  score += store.preferences.priceRating * 0.5;

  // Quality rating
  score += store.preferences.qualityRating * 0.4;

  // Distance penalty (closer is better)
  score -= (store.distance ?? 5) * 0.2;

  // Specialty bonus
  if (store.specialties.length > 0) score += 0.5;

  // Favorite bonus
  if (store.favorite) score += 1;

  return score;
}

/**
 * Smart store recommendation algorithm
 * @param stores - List of available stores
 * @param itemName - Name of the item
 * @param category - Category of the item
 * @returns Array of store IDs sorted by recommendation score
 */
export function smartRecommendStores(stores: Store[], itemName: string, category: string): string[] {
  return stores
    .filter(store =>
      store.bestFor.includes(category) ||
      store.avgPrices[itemName] ||
      (category === 'produce' && store.specialties.includes('organic'))
    )
    .sort((a, b) => {
      // Score based on multiple factors
      const scoreA = calculateStoreScore(a, category);
      const scoreB = calculateStoreScore(b, category);
      return scoreB - scoreA;
    })
    .map(store => store.id);
}

/**
 * Find the best store for a specific item
 * @param item - The shopping item
 * @param stores - List of available stores
 * @returns The best store ID or undefined
 */
export function findBestStoreForItem(item: ShoppingItem, stores: Store[]): string | undefined {
  const recommendations = smartRecommendStores(stores, item.name, item.category);
  return recommendations[0];
}
