/**
 * Store Data Mappers
 * Transform between API data and UI models
 */

import type { Store } from '../types';
import type { StoreData } from '../../services/types';

const DEFAULT_PREFERENCES: Store['preferences'] = {
  priceRating: 3,
  qualityRating: 3,
  cleanlinessRating: 3,
  serviceRating: 3,
  overallRating: 3,
};

export function mapStoreDataToStore(data: StoreData): Store {
  return {
    id: data.id ?? crypto.randomUUID(),
    name: data.name,
    type: data.type,
    address: data.address ?? undefined,
    phone: data.phone ?? undefined,
    website: data.website ?? undefined,
    logo: data.logo ?? undefined,
    color: data.color ?? '#4F46E5',
    coordinates: data.coordinates ?? undefined,
    preferences: {
      ...DEFAULT_PREFERENCES,
      ...(data.preferences ?? {}),
    },
    specialties: data.specialties ?? [],
    bestFor: data.best_for ?? [],
    avgPrices: data.avg_prices ?? {},
    distance: data.distance ?? undefined,
    lastVisited: data.last_visited ? new Date(data.last_visited) : undefined,
    favorite: data.favorite ?? false,
    hours: data.hours ?? undefined,
    hasDelivery: data.has_delivery ?? undefined,
    hasPickup: data.has_pickup ?? undefined,
    deliveryFee: data.delivery_fee ?? undefined,
  };
}
