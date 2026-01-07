import type { ShoppingItem, Store, ShoppingList } from '../types';

export type DistributionStrategy = 'price' | 'quality' | 'convenience' | 'mixed';

export interface DistributeItemsOptions {
  items: ShoppingItem[];
  stores: Store[];
  strategy: DistributionStrategy;
}

export function distributeItemsToStores(options: DistributeItemsOptions): ShoppingList[] {
  const { items, stores, strategy } = options;
  const unpurchasedItems = items.filter(item => !item.purchased);

  if (unpurchasedItems.length === 0) {
    return [];
  }

  // Initialize store collections
  const storeItems = new Map<string, ShoppingItem[]>();
  const storeScores = new Map<string, number>();

  stores.forEach(store => {
    storeItems.set(store.id, []);
    storeScores.set(store.id, 0);
  });

  // Assign each item to its best store
  unpurchasedItems.forEach(item => {
    // If user has a preferred store, assign it there
    if (item.assignedStore) {
      const storeItemsList = storeItems.get(item.assignedStore) ?? [];
      storeItemsList.push({ ...item, assignedStore: item.assignedStore });
      storeItems.set(item.assignedStore, storeItemsList);
      storeScores.set(item.assignedStore, (storeScores.get(item.assignedStore) ?? 0) + 1);
      return;
    }

    // Otherwise, find best store based on strategy
    const bestStoreId = findBestStoreForItem(item, stores, strategy);
    if (bestStoreId) {
      const storeItemsList = storeItems.get(bestStoreId) ?? [];
      storeItemsList.push({ ...item, assignedStore: bestStoreId });
      storeItems.set(bestStoreId, storeItemsList);
      storeScores.set(bestStoreId, (storeScores.get(bestStoreId) ?? 0) + 1);
    }
  });

  // Create store lists only for stores that have items
  const storeLists: ShoppingList[] = [];

  storeItems.forEach((items, storeId) => {
    if (items.length === 0) return;

    const store = stores.find(s => s.id === storeId);
    if (!store) return;

    const totalCost = items.reduce((sum, item) => sum + (item.estimatedPrice ?? 0), 0);
    const distanceLabel = store.distance != null ? `${store.distance}mi` : 'distance unknown';

    storeLists.push({
      id: `store-${storeId}`,
      name: store.name,
      description: `${items.length} items • $${totalCost.toFixed(2)} • ${distanceLabel}`,
      type: 'store-specific',
      color: store.color,
      storeId: storeId,
      items: items,
      totalEstimatedCost: totalCost,
      createdAt: new Date(),
      updatedAt: new Date()
    });
  });

  // Sort by strategy
  storeLists.sort((a, b) => {
    if (strategy === 'price') {
      return (a.totalEstimatedCost ?? 0) - (b.totalEstimatedCost ?? 0); // Cheapest first
    }
    return b.items.length - a.items.length; // Most items first
  });

  return storeLists;
}

export function findBestStoreForItem(
  item: ShoppingItem,
  stores: Store[],
  strategy: DistributionStrategy
): string | null {
  let bestStoreId: string | null = null;
  let bestScore = -1;

  stores.forEach(store => {
    let score = 0;

    switch (strategy) {
      case 'price': {
        // Prioritize stores with good price ratings and known low prices for this item
        score = store.preferences.priceRating * 2;
        if (store.avgPrices[item.name]) {
          score += 3; // Bonus for having price data
        }
        if (store.bestFor.includes(item.category)) {
          score += 2;
        }
        break;
      }

      case 'quality': {
        // Prioritize quality and specialty matches
        score = store.preferences.qualityRating * 2;
        if (item.nutritionInfo?.organic && store.specialties.includes('organic')) {
          score += 4; // Big bonus for organic matches
        }
        if (store.bestFor.includes(item.category)) {
          score += 3;
        }
        break;
      }

      case 'convenience': {
        // Prioritize nearby stores
        score = Math.max(0, 6 - (store.distance ?? 5)); // Closer = higher score
        if (store.bestFor.includes(item.category)) {
          score += 2;
        }
        break;
      }

      case 'mixed':
      default: {
        // Balanced approach
        const priceScore = store.preferences.priceRating * 0.3;
        const qualityScore = store.preferences.qualityRating * 0.25;
        const convenienceScore = Math.max(0, 6 - (store.distance ?? 5)) * 0.2;

        let specialtyScore = 0;
        if (item.bestStores?.includes(store.id)) {
          specialtyScore = 2;
        } else if (store.bestFor.includes(item.category)) {
          specialtyScore = 1.5;
        } else if (item.nutritionInfo?.organic && store.specialties.includes('organic')) {
          specialtyScore = 1.8;
        }
        specialtyScore *= 0.25;

        score = priceScore + qualityScore + convenienceScore + specialtyScore;
        break;
      }
    }

    // Bonus for user's favorite stores
    if (store.favorite) {
      score += 0.5;
    }

    // Check if this is the best store so far
    if (score > bestScore) {
      bestScore = score;
      bestStoreId = store.id;
    }
  });

  return bestStoreId;
}
