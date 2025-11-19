/**
 * Script to process the passport-index CSV data into a TypeScript lookup structure
 * Run this once to generate the visa requirements data file
 */

import fs from 'fs';
import path from 'path';
import type { VisaRequirement } from '../types/visa';

interface VisaEntry {
  passport: string;
  destination: string;
  requirement: string;
}

interface ProcessedVisaData {
  [passportCountry: string]: {
    [destinationCountry: string]: {
      requirement: VisaRequirement;
      daysAllowed?: number;
    };
  };
}

function parseRequirement(req: string): { requirement: VisaRequirement; daysAllowed?: number } {
  const trimmed = req.trim().toLowerCase();

  // Check if it's -1 (same country, no visa needed - unlimited stay)
  if (trimmed === '-1') {
    return { requirement: 'visa-free' }; // Own country = visa-free with unlimited stay
  }

  // Check if it's a number (visa-free days)
  const days = parseInt(trimmed, 10);
  if (!isNaN(days) && days > 0) {
    return { requirement: 'visa-free', daysAllowed: days };
  }

  // Map string requirements to our types
  if (trimmed === 'visa free' || trimmed === 'visa-free') {
    return { requirement: 'visa-free' };
  }
  if (trimmed === 'visa on arrival') {
    return { requirement: 'visa-on-arrival' };
  }
  if (trimmed === 'eta' || trimmed === 'e-ta') {
    return { requirement: 'eta' };
  }
  if (trimmed === 'e-visa' || trimmed === 'evisa') {
    return { requirement: 'e-visa' };
  }
  if (trimmed === 'visa required') {
    return { requirement: 'visa-required' };
  }
  if (trimmed === 'no admission' || trimmed === 'admission refused') {
    return { requirement: 'no-admission' };
  }

  // Default to visa required if unknown
  console.warn(`Unknown requirement: ${req}`);
  return { requirement: 'visa-required' };
}

export function processVisaDataFromCSV(csvPath: string): ProcessedVisaData {
  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const lines = csvContent.split('\n');

  const data: ProcessedVisaData = {};

  // Skip header row
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const parts = line.split(',');
    if (parts.length < 3) continue;

    const passport = parts[0].trim();
    const destination = parts[1].trim();
    const requirement = parts.slice(2).join(',').trim(); // Handle commas in requirement

    if (!passport || !destination || !requirement) continue;

    // Initialize passport country if not exists
    if (!data[passport]) {
      data[passport] = {};
    }

    // Parse and store requirement
    const parsed = parseRequirement(requirement);
    data[passport][destination] = parsed;
  }

  return data;
}

export function generateTypeScriptFile(data: ProcessedVisaData, outputPath: string): void {
  const countryCount = Object.keys(data).length;
  const totalEntries = Object.values(data).reduce((sum, destinations) => sum + Object.keys(destinations).length, 0);

  let output = `/**
 * Visa Requirements Database
 * Generated from passport-index-dataset
 *
 * Source: https://github.com/ilyankou/passport-index-dataset
 * License: MIT
 * Data as of: January 2025
 *
 * ${countryCount} passport countries
 * ${totalEntries} total visa requirement entries
 */

import type { VisaRequirement } from '../types/visa';

export interface VisaRequirementEntry {
  requirement: VisaRequirement;
  daysAllowed?: number;
}

export interface VisaRequirementsData {
  [passportCountry: string]: {
    [destinationCountry: string]: VisaRequirementEntry;
  };
}

export const visaRequirements: VisaRequirementsData = ${JSON.stringify(data, null, 2)};

/**
 * Get visa requirement for a specific passport-destination pair
 */
export function getVisaRequirement(
  passportCountry: string,
  destinationCountry: string
): VisaRequirementEntry | null {
  const passportData = visaRequirements[passportCountry];
  if (!passportData) return null;

  return passportData[destinationCountry] || null;
}

/**
 * Get all destinations accessible to a passport holder
 */
export function getAccessibleDestinations(
  passportCountry: string,
  includeTypes: VisaRequirement[] = ['visa-free', 'visa-on-arrival', 'eta']
): string[] {
  const passportData = visaRequirements[passportCountry];
  if (!passportData) return [];

  return Object.entries(passportData)
    .filter(([_, entry]) => includeTypes.includes(entry.requirement))
    .map(([destination]) => destination);
}

/**
 * Get visa-free access summary for a passport
 */
export function getVisaAccessSummary(passportCountry: string): {
  visaFree: number;
  visaOnArrival: number;
  eta: number;
  eVisa: number;
  visaRequired: number;
  noAdmission: number;
  total: number;
} {
  const passportData = visaRequirements[passportCountry];
  if (!passportData) {
    return { visaFree: 0, visaOnArrival: 0, eta: 0, eVisa: 0, visaRequired: 0, noAdmission: 0, total: 0 };
  }

  const summary = {
    visaFree: 0,
    visaOnArrival: 0,
    eta: 0,
    eVisa: 0,
    visaRequired: 0,
    noAdmission: 0,
    total: 0,
  };

  Object.values(passportData).forEach(entry => {
    summary.total++;
    switch (entry.requirement) {
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
}

/**
 * Get all available passport countries in the dataset
 */
export function getAvailablePassportCountries(): string[] {
  return Object.keys(visaRequirements).sort();
}
`;

  fs.writeFileSync(outputPath, output, 'utf-8');
  console.log(`Generated ${outputPath}`);
  console.log(`- ${countryCount} passport countries`);
  console.log(`- ${totalEntries} total entries`);
}

// Main execution
const csvPath = '/tmp/passport-matrix.csv';
const outputPath = '/Users/sri.nikitha/Documents/GenAI/lifesync-personal-assistant/src/travel/data/visaRequirements.ts';

console.log('Processing visa data...');
const data = processVisaDataFromCSV(csvPath);

console.log('Generating TypeScript file...');
generateTypeScriptFile(data, outputPath);

console.log('Done!');
