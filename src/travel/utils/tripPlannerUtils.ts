/**
 * Trip Planner Utility Functions
 * Calculate trip summaries, costs, and visa optimizations
 */

import type { TripWithDestinations, TripSummary } from '../types/trip';
import type { VisaRequirement } from '../types/visa';

// Schengen Area countries (as of 2025)
const SCHENGEN_COUNTRIES = [
  'Austria', 'Belgium', 'Czech Republic', 'Croatia', 'Denmark', 'Estonia',
  'Finland', 'France', 'Germany', 'Greece', 'Hungary', 'Iceland', 'Italy',
  'Latvia', 'Liechtenstein', 'Lithuania', 'Luxembourg', 'Malta', 'Netherlands',
  'Norway', 'Poland', 'Portugal', 'Slovakia', 'Slovenia', 'Spain', 'Sweden',
  'Switzerland',
];

/**
 * Check if a country is in the Schengen Area
 */
export function isSchengenCountry(countryName: string): boolean {
  return SCHENGEN_COUNTRIES.some(
    schengen => schengen.toLowerCase() === countryName.toLowerCase()
  );
}

/**
 * Get Schengen countries in trip
 */
export function getSchengenCountriesInTrip(trip: TripWithDestinations): string[] {
  return trip.destinations
    .filter(dest => isSchengenCountry(dest.countryName))
    .map(dest => dest.countryName);
}

/**
 * Calculate trip summary statistics
 */
export function calculateTripSummary(trip: TripWithDestinations): TripSummary {
  const schengenCountries = getSchengenCountriesInTrip(trip);

  let visaFreeCount = 0;
  let visaRequiredCount = 0;
  let totalEstimatedCost = 0;
  let totalProcessingDays = 0;

  // Count by visa requirement type
  trip.destinations.forEach(dest => {
    const req = dest.visaRequirement;

    if (!req) return;

    // Count visa-free vs visa-required
    if (req.visaType === 'visa-free' || req.visaType === 'visa-on-arrival') {
      visaFreeCount++;
    } else if (req.visaType === 'visa-required' || req.visaType === 'e-visa' || req.visaType === 'eta') {
      visaRequiredCount++;
    }

    // Sum costs and processing time
    if (req.estimatedCost) {
      totalEstimatedCost += req.estimatedCost;
    }
    if (req.processingDays) {
      totalProcessingDays = Math.max(totalProcessingDays, req.processingDays);
    }
  });

  // Check if Schengen visa optimization is possible
  // If visiting 2+ Schengen countries, only need 1 Schengen visa
  const canUseSchengenVisa = schengenCountries.length >= 2;

  // Adjust cost if Schengen optimization applies
  if (canUseSchengenVisa && schengenCountries.length > 1) {
    // Typically, Schengen visa costs around €80-90
    // Remove individual costs for Schengen countries and add single Schengen visa cost
    const schengenVisaCost = 90; // EUR, approximate

    // Recalculate without individual Schengen costs
    totalEstimatedCost = 0;
    let hasSchengenCost = false;

    trip.destinations.forEach(dest => {
      const req = dest.visaRequirement;
      if (!req?.estimatedCost) return;

      if (isSchengenCountry(dest.countryName)) {
        if (!hasSchengenCost) {
          totalEstimatedCost += schengenVisaCost;
          hasSchengenCost = true;
        }
      } else {
        totalEstimatedCost += req.estimatedCost;
      }
    });
  }

  return {
    totalCountries: trip.destinations.length,
    visaFreeCount,
    visaRequiredCount,
    totalEstimatedCost,
    totalProcessingDays,
    schengenCountries,
    canUseSchengenVisa,
  };
}

/**
 * Get visa requirement badge color
 */
export function getVisaRequirementColor(requirement: VisaRequirement): string {
  switch (requirement) {
    case 'visa-free':
      return 'bg-green-100 text-green-800 border-green-300';
    case 'visa-on-arrival':
      return 'bg-blue-100 text-blue-800 border-blue-300';
    case 'eta':
      return 'bg-cyan-100 text-cyan-800 border-cyan-300';
    case 'e-visa':
      return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    case 'visa-required':
      return 'bg-orange-100 text-orange-800 border-orange-300';
    case 'no-admission':
      return 'bg-red-100 text-red-800 border-red-300';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-300';
  }
}

/**
 * Get visa requirement label
 */
export function getVisaRequirementLabel(requirement: VisaRequirement): string {
  switch (requirement) {
    case 'visa-free':
      return 'Visa Free';
    case 'visa-on-arrival':
      return 'Visa on Arrival';
    case 'eta':
      return 'ETA Required';
    case 'e-visa':
      return 'E-Visa';
    case 'visa-required':
      return 'Visa Required';
    case 'no-admission':
      return 'No Admission';
    default:
      return requirement;
  }
}

/**
 * Estimate visa cost based on visa type and country
 * These are approximate values - actual costs vary
 */
export function estimateVisaCost(visaType: VisaRequirement, countryName: string): number {
  // Common visa costs (in USD)
  switch (visaType) {
    case 'visa-free':
    case 'visa-on-arrival':
      return 0;

    case 'eta':
      // ETA costs vary: US ESTA $21, Canada eTA $7, Australia ETA $20, etc.
      if (countryName === 'United States') return 21;
      if (countryName === 'Canada') return 7;
      if (countryName === 'Australia') return 20;
      if (countryName === 'New Zealand') return 17;
      if (countryName === 'Sri Lanka') return 50;
      return 20; // Default ETA

    case 'e-visa':
      // E-visa costs vary widely
      if (countryName === 'India') return 80;
      if (countryName === 'Turkey') return 50;
      if (countryName === 'Kenya') return 50;
      if (countryName === 'Egypt') return 25;
      return 50; // Default e-visa

    case 'visa-required':
      // Embassy visa costs vary widely
      if (SCHENGEN_COUNTRIES.includes(countryName)) return 90; // Schengen visa
      if (countryName === 'United States') return 185; // B1/B2 visa
      if (countryName === 'United Kingdom') return 115;
      if (countryName === 'China') return 140;
      if (countryName === 'Russia') return 160;
      return 100; // Default embassy visa

    case 'no-admission':
      return 0; // Cannot obtain visa

    default:
      return 0;
  }
}

/**
 * Estimate visa processing time (in days)
 */
export function estimateProcessingTime(visaType: VisaRequirement, countryName: string): number {
  switch (visaType) {
    case 'visa-free':
    case 'visa-on-arrival':
      return 0;

    case 'eta':
      return 1; // Most ETAs are instant or within 1-2 days

    case 'e-visa':
      if (countryName === 'India') return 4;
      if (countryName === 'Turkey') return 1;
      if (countryName === 'Kenya') return 3;
      return 3; // Default e-visa processing

    case 'visa-required':
      if (SCHENGEN_COUNTRIES.includes(countryName)) return 15; // Schengen visa
      if (countryName === 'United States') return 21; // B1/B2 visa interview + processing
      if (countryName === 'United Kingdom') return 15;
      if (countryName === 'China') return 10;
      return 14; // Default embassy visa

    case 'no-admission':
      return 0;

    default:
      return 0;
  }
}

/**
 * Calculate trip duration in days
 */
export function calculateTripDuration(startDate?: string, endDate?: string): number | null {
  if (!startDate || !endDate) return null;

  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = end.getTime() - start.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays >= 0 ? diffDays : null;
}

/**
 * Check if trip is upcoming, ongoing, or past
 */
export function getTripStatus(trip: TripWithDestinations): 'upcoming' | 'ongoing' | 'past' | 'draft' {
  if (!trip.startDate || !trip.endDate) return 'draft';

  const today = new Date();
  const start = new Date(trip.startDate);
  const end = new Date(trip.endDate);

  if (today < start) return 'upcoming';
  if (today > end) return 'past';
  return 'ongoing';
}
