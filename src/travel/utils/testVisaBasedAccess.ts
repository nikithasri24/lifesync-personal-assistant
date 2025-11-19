/**
 * Test script to verify visa-based access functionality
 */

import { getAdditionalAccessFromVisas, getAccessByVisa } from '../data/visaBasedAccess';

console.log('=== Visa-Based Access Test ===\n');

// Test 1: US Visa Access
console.log('1. Countries accessible with US visa (H1B, B1/B2, etc.):');
const usVisaAccess = getAccessByVisa('United States');
console.log(`   Total countries: ${usVisaAccess.length}`);
console.log(`   Countries: ${usVisaAccess.map(a => a.destinationCountry).join(', ')}\n`);

// Test 2: Schengen Visa Access
console.log('2. Countries accessible with Schengen visa:');
const schengenAccess = getAccessByVisa('France'); // France is Schengen
console.log(`   Total countries: ${schengenAccess.length}`);
console.log(`   Countries: ${schengenAccess.map(a => a.destinationCountry).join(', ')}\n`);

// Test 3: Combined Access (India passport + US H1B visa)
console.log('3. Additional access for Indian passport holder with US H1B visa:');
const combinedAccess = getAdditionalAccessFromVisas(['United States']);
console.log(`   Bonus countries: ${combinedAccess.length}`);
combinedAccess.forEach(access => {
  console.log(`   - ${access.country}: ${access.accessType} (${access.daysAllowed || 'unlimited'} days) via ${access.viaVisa}`);
});
console.log('');

// Test 4: Multiple Visas (US + Schengen)
console.log('4. Additional access with both US visa AND Schengen visa:');
const multiVisaAccess = getAdditionalAccessFromVisas(['United States', 'France']);
console.log(`   Bonus countries: ${multiVisaAccess.length}`);
const uniqueCountries = new Set(multiVisaAccess.map(a => a.country));
console.log(`   Unique countries: ${uniqueCountries.size}\n`);

// Test 5: Specific examples
console.log('5. Specific Examples:');
console.log('   a) Indian passport + US H1B → Mexico:');
const mexicoAccess = combinedAccess.find(a => a.country === 'Mexico');
if (mexicoAccess) {
  console.log(`      ✓ Visa-free for ${mexicoAccess.daysAllowed} days via ${mexicoAccess.viaVisa} visa`);
} else {
  console.log('      ✗ No access');
}

console.log('   b) Indian passport + US H1B → Colombia:');
const colombiaAccess = combinedAccess.find(a => a.country === 'Colombia');
if (colombiaAccess) {
  console.log(`      ✓ Visa-free for ${colombiaAccess.daysAllowed} days via ${colombiaAccess.viaVisa} visa`);
} else {
  console.log('      ✗ No access');
}

console.log('   c) Indian passport + Schengen visa → Albania:');
const schengenAccess2 = getAdditionalAccessFromVisas(['France']);
const albaniaAccess = schengenAccess2.find(a => a.country === 'Albania');
if (albaniaAccess) {
  console.log(`      ✓ Visa-free for ${albaniaAccess.daysAllowed} days via ${albaniaAccess.viaVisa} visa`);
} else {
  console.log('      ✗ No access');
}

console.log('\n=== Test Complete ===');
