/**
 * Visa Requirements API
 * Database-backed queries for visa requirement data
 *
 * Replaces static data from src/travel/data/visaRequirements.ts
 * Data stored in Supabase: visa_requirements table
 */

import { supabase } from '@/lib/supabase';
import { logger } from '@/services/logger';
import type { VisaRequirement } from '../types/visa';

export interface VisaRequirementEntry {
  requirement: VisaRequirement;
  daysAllowed?: number;
}

/**
 * Get visa requirement for a specific passport-destination pair
 */
export async function getVisaRequirement(
  passportCountry: string,
  destinationCountry: string
): Promise<VisaRequirementEntry | null> {
  try {
    const { data, error } = await supabase
      .from('visa_requirements')
      .select('requirement, days_allowed')
      .eq('passport_country', passportCountry)
      .eq('destination_country', destinationCountry)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned - this is expected for some country pairs
        return null;
      }
      throw error;
    }

    return {
      requirement: data.requirement as VisaRequirement,
      daysAllowed: data.days_allowed || undefined
    };
  } catch (error) {
    logger.error('Travel', 'Failed to fetch visa requirement', {
      passportCountry,
      destinationCountry,
      error
    });
    return null;
  }
}

/**
 * Get all destinations accessible to a passport holder
 */
export async function getAccessibleDestinations(
  passportCountry: string,
  includeTypes: VisaRequirement[] = ['visa-free', 'visa-on-arrival', 'eta']
): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from('visa_requirements')
      .select('destination_country')
      .eq('passport_country', passportCountry)
      .in('requirement', includeTypes);

    if (error) throw error;

    return data?.map(row => row.destination_country) || [];
  } catch (error) {
    logger.error('Travel', 'Failed to fetch accessible destinations', {
      passportCountry,
      includeTypes,
      error
    });
    return [];
  }
}

/**
 * Get visa-free access summary for a passport
 */
export async function getVisaAccessSummary(passportCountry: string): Promise<{
  visaFree: number;
  visaOnArrival: number;
  eta: number;
  eVisa: number;
  visaRequired: number;
  noAdmission: number;
  total: number;
}> {
  const defaultSummary = {
    visaFree: 0,
    visaOnArrival: 0,
    eta: 0,
    eVisa: 0,
    visaRequired: 0,
    noAdmission: 0,
    total: 0,
  };

  try {
    const { data, error } = await supabase
      .from('visa_requirements')
      .select('requirement')
      .eq('passport_country', passportCountry);

    if (error) throw error;
    if (!data) return defaultSummary;

    const summary = { ...defaultSummary };

    data.forEach(row => {
      summary.total++;
      switch (row.requirement) {
        case 'visa-free':
          summary.visaFree++;
          break;
        case 'visa-on-arrival':
          summary.visaOnArrival++;
          break;
        case 'eta':
          summary.eta++;
          break;
        case 'e-visa':
          summary.eVisa++;
          break;
        case 'visa-required':
          summary.visaRequired++;
          break;
        case 'no-admission':
          summary.noAdmission++;
          break;
      }
    });

    return summary;
  } catch (error) {
    logger.error('Travel', 'Failed to fetch visa access summary', {
      passportCountry,
      error
    });
    return defaultSummary;
  }
}

/**
 * Get all available passport countries in the dataset
 */
export async function getAvailablePassportCountries(): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from('visa_requirements')
      .select('passport_country')
      .order('passport_country');

    if (error) throw error;

    // Get unique countries (data may have duplicates)
    const uniqueCountries = [...new Set(data?.map(row => row.passport_country) || [])];
    return uniqueCountries.sort();
  } catch (error) {
    logger.error('Travel', 'Failed to fetch available passport countries', error);
    return [];
  }
}

/**
 * Get all visa requirements for a specific passport (for offline caching)
 * Returns all destination countries and their requirements in one query
 */
export async function getPassportVisaData(
  passportCountry: string
): Promise<Record<string, VisaRequirementEntry>> {
  try {
    const { data, error } = await supabase
      .from('visa_requirements')
      .select('destination_country, requirement, days_allowed')
      .eq('passport_country', passportCountry);

    if (error) throw error;

    const result: Record<string, VisaRequirementEntry> = {};

    data?.forEach(row => {
      result[row.destination_country] = {
        requirement: row.requirement as VisaRequirement,
        daysAllowed: row.days_allowed || undefined
      };
    });

    return result;
  } catch (error) {
    logger.error('Travel', 'Failed to fetch passport visa data', {
      passportCountry,
      error
    });
    return {};
  }
}
