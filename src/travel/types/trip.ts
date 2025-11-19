/**
 * Trip Planner Types
 */

import type { VisaRequirement } from './visa';

export interface Trip {
  id: string;
  userId: string;
  name: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TripDestination {
  id: string;
  tripId: string;
  countryCode: string;
  countryName: string;
  arrivalDate?: string;
  departureDate?: string;
  daysStaying?: number;
  orderIndex: number;
  notes?: string;
  createdAt: string;
}

export interface TripVisaRequirement {
  id: string;
  tripId: string;
  destinationId: string;
  visaType: VisaRequirement;
  daysAllowed?: number;
  estimatedCost?: number;
  processingDays?: number;
  accessVia: string; // 'passport' or visa name like 'US H1B'
  notes?: string;
  createdAt: string;
}

export interface TripDestinationWithRequirement extends TripDestination {
  visaRequirement?: TripVisaRequirement;
}

export interface TripWithDestinations extends Trip {
  destinations: TripDestinationWithRequirement[];
}

export interface TripSummary {
  totalCountries: number;
  visaFreeCount: number;
  visaRequiredCount: number;
  totalEstimatedCost: number;
  totalProcessingDays: number;
  schengenCountries: string[];
  canUseSchengenVisa: boolean;
}

export interface CreateTripInput {
  name: string;
  description?: string;
  startDate?: string;
  endDate?: string;
}

export interface AddDestinationInput {
  tripId: string;
  countryCode: string;
  countryName: string;
  arrivalDate?: string;
  departureDate?: string;
  daysStaying?: number;
  orderIndex: number;
  notes?: string;
}
