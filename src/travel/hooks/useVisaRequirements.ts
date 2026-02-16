/**
 * React Query hooks for Visa Requirements
 * Provides caching and state management for visa requirement queries
 */

import { useQuery } from '@tanstack/react-query';
import {
  getVisaRequirement,
  getAccessibleDestinations,
  getVisaAccessSummary,
  getAvailablePassportCountries,
  getPassportVisaData,
} from '../api/visaRequirementsAPI';
import type { VisaRequirement } from '../types/visa';

/**
 * Hook to get visa requirement for a specific passport-destination pair
 */
export function useVisaRequirement(passportCountry: string, destinationCountry: string) {
  return useQuery({
    queryKey: ['visaRequirement', passportCountry, destinationCountry],
    queryFn: () => getVisaRequirement(passportCountry, destinationCountry),
    staleTime: Infinity, // Visa requirements don't change often
    enabled: !!passportCountry && !!destinationCountry,
  });
}

/**
 * Hook to get all accessible destinations for a passport
 */
export function useAccessibleDestinations(
  passportCountry: string,
  includeTypes?: VisaRequirement[]
) {
  return useQuery({
    queryKey: ['accessibleDestinations', passportCountry, includeTypes],
    queryFn: () => getAccessibleDestinations(passportCountry, includeTypes),
    staleTime: Infinity,
    enabled: !!passportCountry,
  });
}

/**
 * Hook to get visa access summary for a passport
 */
export function useVisaAccessSummary(passportCountry: string) {
  return useQuery({
    queryKey: ['visaAccessSummary', passportCountry],
    queryFn: () => getVisaAccessSummary(passportCountry),
    staleTime: Infinity,
    enabled: !!passportCountry,
  });
}

/**
 * Hook to get all available passport countries
 */
export function useAvailablePassportCountries() {
  return useQuery({
    queryKey: ['availablePassportCountries'],
    queryFn: getAvailablePassportCountries,
    staleTime: Infinity,
  });
}

/**
 * Hook to get all visa data for a passport (for offline caching)
 * This fetches all ~200 destination countries in one query
 */
export function usePassportVisaData(passportCountry: string) {
  return useQuery({
    queryKey: ['passportVisaData', passportCountry],
    queryFn: () => getPassportVisaData(passportCountry),
    staleTime: Infinity,
    enabled: !!passportCountry,
  });
}
