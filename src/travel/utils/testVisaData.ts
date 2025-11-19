/**
 * Test script to verify visa requirements data
 */

import {
  getVisaRequirement,
  getAccessibleDestinations,
  getVisaAccessSummary,
  getAvailablePassportCountries
} from '../data/visaRequirements';

console.log('=== Visa Requirements Data Test ===\n');

// Test 1: Available countries
const countries = getAvailablePassportCountries();
console.log(`1. Total passport countries: ${countries.length}`);
console.log(`   First 10: ${countries.slice(0, 10).join(', ')}\n`);

// Test 2: US Passport Access
console.log('2. United States Passport Analysis:');
const usSummary = getVisaAccessSummary('United States');
console.log(`   - Total destinations: ${usSummary.total}`);
console.log(`   - Visa-free: ${usSummary.visaFree}`);
console.log(`   - Visa on arrival: ${usSummary.visaOnArrival}`);
console.log(`   - ETA required: ${usSummary.eta}`);
console.log(`   - E-Visa: ${usSummary.eVisa}`);
console.log(`   - Visa required: ${usSummary.visaRequired}`);
console.log(`   - No admission: ${usSummary.noAdmission}\n`);

// Test 3: India Passport Access
console.log('3. India Passport Analysis:');
const inSummary = getVisaAccessSummary('India');
console.log(`   - Total destinations: ${inSummary.total}`);
console.log(`   - Visa-free: ${inSummary.visaFree}`);
console.log(`   - Visa on arrival: ${inSummary.visaOnArrival}`);
console.log(`   - ETA required: ${inSummary.eta}`);
console.log(`   - E-Visa: ${inSummary.eVisa}`);
console.log(`   - Visa required: ${inSummary.visaRequired}`);
console.log(`   - No admission: ${inSummary.noAdmission}\n`);

// Test 4: Specific visa requirements
console.log('4. Specific Visa Requirements:');
const usToFrance = getVisaRequirement('United States', 'France');
console.log(`   US → France: ${usToFrance?.requirement} (${usToFrance?.daysAllowed || 'unlimited'} days)`);

const usToChina = getVisaRequirement('United States', 'China');
console.log(`   US → China: ${usToChina?.requirement}`);

const indiaToUS = getVisaRequirement('India', 'United States');
console.log(`   India → US: ${indiaToUS?.requirement}`);

const indiaToNepal = getVisaRequirement('India', 'Nepal');
console.log(`   India → Nepal: ${indiaToNepal?.requirement} (${indiaToNepal?.daysAllowed || 'unlimited'} days)\n`);

// Test 5: Easy access destinations
console.log('5. Visa-free + Visa-on-arrival destinations (US passport):');
const usEasyAccess = getAccessibleDestinations('United States', ['visa-free', 'visa-on-arrival']);
console.log(`   Total: ${usEasyAccess.length} countries`);
console.log(`   Examples: ${usEasyAccess.slice(0, 15).join(', ')}\n`);

// Test 6: India easy access
console.log('6. Visa-free + Visa-on-arrival destinations (India passport):');
const indiaEasyAccess = getAccessibleDestinations('India', ['visa-free', 'visa-on-arrival']);
console.log(`   Total: ${indiaEasyAccess.length} countries`);
console.log(`   Examples: ${indiaEasyAccess.slice(0, 15).join(', ')}\n`);

console.log('=== Test Complete ===');
