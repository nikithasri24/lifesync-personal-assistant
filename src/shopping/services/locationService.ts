import { logger } from '../../services/logger';
import type { Store, ShoppingItem } from '../types';

export interface Coordinates {
  lat: number;
  lng: number;
}

export async function getUserLocation(): Promise<Coordinates | null> {
  if (!navigator.geolocation) {
    logger.error('LocationService', 'Geolocation is not supported by this browser.');
    return null;
  }

  try {
    const position = await new Promise<GeolocationPosition>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject);
    });

    return {
      lat: position.coords.latitude,
      lng: position.coords.longitude
    };
  } catch (error) {
    logger.error('LocationService', 'Unable to get your location. Please enable location services.', error);
    return null;
  }
}

export function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3959; // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function findNearbyStoresForItem(
  item: ShoppingItem,
  stores: Store[],
  userLocation: Coordinates | null
): Store[] {
  if (!userLocation) {
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
}
