/**
 * Test script to verify visa requirements data
 */

import { logger } from '../../services/logger';
import {
  getVisaRequirement,
  getAccessibleDestinations,
  getVisaAccessSummary,
  getAvailablePassportCountries
} from '../data/visaRequirements';

logger.debug('Utils', '=== Visa Requirements Data Test ===\n');

// Test 1: Available countries
const countries = getAvailablePassportCountries();
logger.debug('Utils', `1. Total passport countries: ${countries.length}`);
logger.debug('Utils', `   First 10: ${countries.slice(0, 10).join(', ')}\n`);

// Test 2: US Passport Access
logger.debug('Utils', '2. United States Passport Analysis:');
const usSummary = getVisaAccessSummary('United States');
logger.debug('Utils', `   - Total destinations: ${usSummary.total}`);
logger.debug('Utils', `   - Visa-free: ${usSummary.visaFree}`);
logger.debug('Utils', `   - Visa on arrival: ${usSummary.visaOnArrival}`);
logger.debug('Utils', `   - ETA required: ${usSummary.eta}`);
logger.debug('Utils', `   - E-Visa: ${usSummary.eVisa}`);
logger.debug('Utils', `   - Visa required: ${usSummary.visaRequired}`);
logger.debug('Utils', `   - No admission: ${usSummary.noAdmission}\n`);

// Test 3: India Passport Access
logger.debug('Utils', '3. India Passport Analysis:');
const inSummary = getVisaAccessSummary('India');
logger.debug('Utils', `   - Total destinations: ${inSummary.total}`);
logger.debug('Utils', `   - Visa-free: ${inSummary.visaFree}`);
logger.debug('Utils', `   - Visa on arrival: ${inSummary.visaOnArrival}`);
logger.debug('Utils', `   - ETA required: ${inSummary.eta}`);
logger.debug('Utils', `   - E-Visa: ${inSummary.eVisa}`);
logger.debug('Utils', `   - Visa required: ${inSummary.visaRequired}`);
logger.debug('Utils', `   - No admission: ${inSummary.noAdmission}\n`);

// Test 4: Specific visa requirements
logger.debug('Utils', '4. Specific Visa Requirements:');
const usToFrance = getVisaRequirement('United States', 'France');
logger.debug('Utils', `   US → France: ${usToFrance?.requirement} (${usToFrance?.daysAllowed ?? 'unlimited'} days)`);

const usToChina = getVisaRequirement('United States', 'China');
logger.debug('Utils', `   US → China: ${usToChina?.requirement}`);

const indiaToUS = getVisaRequirement('India', 'United States');
logger.debug('Utils', `   India → US: ${indiaToUS?.requirement}`);

const indiaToNepal = getVisaRequirement('India', 'Nepal');
logger.debug('Utils', `   India → Nepal: ${indiaToNepal?.requirement} (${indiaToNepal?.daysAllowed ?? 'unlimited'} days)\n`);

// Test 5: Easy access destinations
logger.debug('Utils', '5. Visa-free + Visa-on-arrival destinations (US passport):');
const usEasyAccess = getAccessibleDestinations('United States', ['visa-free', 'visa-on-arrival']);
logger.debug('Utils', `   Total: ${usEasyAccess.length} countries`);
logger.debug('Utils', `   Examples: ${usEasyAccess.slice(0, 15).join(', ')}\n`);

// Test 6: India easy access
logger.debug('Utils', '6. Visa-free + Visa-on-arrival destinations (India passport):');
const indiaEasyAccess = getAccessibleDestinations('India', ['visa-free', 'visa-on-arrival']);
logger.debug('Utils', `   Total: ${indiaEasyAccess.length} countries`);
logger.debug('Utils', `   Examples: ${indiaEasyAccess.slice(0, 15).join(', ')}\n`);

logger.debug('Utils', '=== Test Complete ===');
