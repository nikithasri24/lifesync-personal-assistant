import { useState } from 'react';
import { logger } from '../../services/logger';
import type { Store, ShoppingItem } from '../types';
import type { Coordinates } from '../services/locationService';
import { calculateDistance } from '../utils/storeUtils';

interface StoreWithDistance extends Store {
  actualDistance: number;
}

export function useStoreSuggestions(stores: Store[]): {
  userLocation: Coordinates | null;
  getUserLocation: () => Promise<void>;
  findNearbyStoresForItem: (item: ShoppingItem) => StoreWithDistance[];
} {
  const [userLocation, setUserLocation] = useState<Coordinates | null>(null);

  /**
   * Get the user's current location using the browser's Geolocation API
   */
  const getUserLocation = async (): Promise<void> => {
    if (!navigator.geolocation) {
      logger.error('useStoreSuggestions', 'Geolocation is not supported by this browser.');
      return;
    }

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject);
      });

      setUserLocation({
        lat: position.coords.latitude,
        lng: position.coords.longitude
      });
    } catch (error) {
      logger.error('useStoreSuggestions', 'Error getting location:', error);
      logger.error('useStoreSuggestions', 'Unable to get your location. Please enable location services.');
    }
  };

  /**
   * Find nearby stores for a specific item, sorted by relevance and distance
   * @param item - The shopping item to find stores for
   * @returns Array of stores with actual distances calculated
   */
  const findNearbyStoresForItem = (item: ShoppingItem): StoreWithDistance[] => {
    if (!userLocation) {
      void getUserLocation();
      return [];
    }

    const storesWithDistance = stores.map(store => ({
      ...store,
      actualDistance: store.coordinates
        ? calculateDistance(userLocation.lat, userLocation.lng, store.coordinates.lat, store.coordinates.lng)
        : store.distance ?? 999
    }));

    // Filter and sort by relevance and distance
    return storesWithDistance
      .filter(store =>
        store.bestFor.includes(item.category) ||
        store.avgPrices[item.name] ||
        store.specialties.some(specialty =>
          ((item.nutritionInfo?.organic ?? false) && specialty === 'organic') ||
          (item.category === 'produce' && specialty === 'organic')
        )
      )
      .sort((a, b) => {
        // Prioritize by relevance first, then distance
        const aRelevance = (a.bestFor.includes(item.category) ? 2 : 0) +
                          (a.avgPrices[item.name] ? 3 : 0) +
                          (a.favorite ? 1 : 0);
        const bRelevance = (b.bestFor.includes(item.category) ? 2 : 0) +
                          (b.avgPrices[item.name] ? 3 : 0) +
                          (b.favorite ? 1 : 0);

        if (aRelevance !== bRelevance) {
          return bRelevance - aRelevance;
        }

        return a.actualDistance - b.actualDistance;
      })
      .slice(0, 5); // Show top 5 suggestions
  };

  return {
    userLocation,
    getUserLocation,
    findNearbyStoresForItem,
  };
}
