/**
 * Test script to verify visa-based access functionality
 */

import { getAdditionalAccessFromVisas, getAccessByVisa } from '../data/visaBasedAccess';
import { logger } from '../../services/logger';

logger.debug('Utils', '=== Visa-Based Access Test ===\n');

// Test 1: US Visa Access
logger.debug('Utils', '1. Countries accessible with US visa (H1B, B1/B2, etc.):');
const usVisaAccess = getAccessByVisa('United States');
logger.debug('Utils', `   Total countries: ${usVisaAccess.length}`);
logger.debug('Utils', `   Countries: ${usVisaAccess.map(a => a.destinationCountry).join(', ')}\n`);

// Test 2: Schengen Visa Access
logger.debug('Utils', '2. Countries accessible with Schengen visa:');
const schengenAccess = getAccessByVisa('France'); // France is Schengen
logger.debug('Utils', `   Total countries: ${schengenAccess.length}`);
logger.debug('Utils', `   Countries: ${schengenAccess.map(a => a.destinationCountry).join(', ')}\n`);

// Test 3: Combined Access (India passport + US H1B visa)
logger.debug('Utils', '3. Additional access for Indian passport holder with US H1B visa:');
const combinedAccess = getAdditionalAccessFromVisas(['United States']);
logger.debug('Utils', `   Bonus countries: ${combinedAccess.length}`);
combinedAccess.forEach(access => {
  logger.debug('Utils', `   - ${access.country}: ${access.accessType} (${access.daysAllowed || 'unlimited'} days) via ${access.viaVisa}`);
});
logger.debug('Utils', '');

// Test 4: Multiple Visas (US + Schengen)
logger.debug('Utils', '4. Additional access with both US visa AND Schengen visa:');
const multiVisaAccess = getAdditionalAccessFromVisas(['United States', 'France']);
logger.debug('Utils', `   Bonus countries: ${multiVisaAccess.length}`);
const uniqueCountries = new Set(multiVisaAccess.map(a => a.country));
logger.debug('Utils', `   Unique countries: ${uniqueCountries.size}\n`);

// Test 5: Specific examples
logger.debug('Utils', '5. Specific Examples:');
logger.debug('Utils', '   a) Indian passport + US H1B → Mexico:');
const mexicoAccess = combinedAccess.find(a => a.country === 'Mexico');
if (mexicoAccess) {
  logger.debug('Utils', `      ✓ Visa-free for ${mexicoAccess.daysAllowed} days via ${mexicoAccess.viaVisa} visa`);
} else {
  logger.debug('Utils', '      ✗ No access');
}

logger.debug('Utils', '   b) Indian passport + US H1B → Colombia:');
const colombiaAccess = combinedAccess.find(a => a.country === 'Colombia');
if (colombiaAccess) {
  logger.debug('Utils', `      ✓ Visa-free for ${colombiaAccess.daysAllowed} days via ${colombiaAccess.viaVisa} visa`);
} else {
  logger.debug('Utils', '      ✗ No access');
}

logger.debug('Utils', '   c) Indian passport + Schengen visa → Albania:');
const schengenAccess2 = getAdditionalAccessFromVisas(['France']);
const albaniaAccess = schengenAccess2.find(a => a.country === 'Albania');
if (albaniaAccess) {
  logger.debug('Utils', `      ✓ Visa-free for ${albaniaAccess.daysAllowed} days via ${albaniaAccess.viaVisa} visa`);
} else {
  logger.debug('Utils', '      ✗ No access');
}

logger.debug('Utils', '\n=== Test Complete ===');
