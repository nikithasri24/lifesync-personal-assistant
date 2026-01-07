/**
 * Store Data Mappers
 * Transform between API data and UI models
 */

import type { Store } from '../types';
import type { StoreData } from '../../services/types';

type RatingValue = 1 | 2 | 3 | 4 | 5;

const DEFAULT_PREFERENCES: Store['preferences'] = {
  priceRating: 3,
  qualityRating: 3,
  cleanlinessRating: 3,
  serviceRating: 3,
  overallRating: 3,
};

/**
 * Clamp a number to a valid rating value (1-5)
 */
function toRating(value: number | undefined, defaultValue: RatingValue = 3): RatingValue {
  if (value === undefined) return defaultValue;
  const clamped = Math.min(5, Math.max(1, Math.round(value)));
  return clamped as RatingValue;
}

export function mapStoreDataToStore(data: StoreData): Store {
  const prefs = data.preferences;
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
      priceRating: toRating(prefs?.priceRating, DEFAULT_PREFERENCES.priceRating),
      qualityRating: toRating(prefs?.qualityRating, DEFAULT_PREFERENCES.qualityRating),
      cleanlinessRating: toRating(prefs?.cleanlinessRating, DEFAULT_PREFERENCES.cleanlinessRating),
      serviceRating: toRating(prefs?.serviceRating, DEFAULT_PREFERENCES.serviceRating),
      overallRating: toRating(prefs?.overallRating, DEFAULT_PREFERENCES.overallRating),
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
