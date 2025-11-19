/**
 * Script to find countries in the GeoJSON map that don't have visa data
 */

import { getAvailablePassportCountries } from '../data/visaRequirements';

// List of countries from the Natural Earth GeoJSON dataset
const geoJsonCountries = [
  'Afghanistan', 'Albania', 'Algeria', 'Andorra', 'Angola', 'Antigua and Barbuda',
  'Argentina', 'Armenia', 'Australia', 'Austria', 'Azerbaijan', 'Bahamas', 'Bahrain',
  'Bangladesh', 'Barbados', 'Belarus', 'Belgium', 'Belize', 'Benin', 'Bhutan',
  'Bolivia', 'Bosnia and Herzegovina', 'Botswana', 'Brazil', 'Brunei', 'Bulgaria',
  'Burkina Faso', 'Burundi', 'Cambodia', 'Cameroon', 'Canada', 'Cape Verde',
  'Central African Republic', 'Chad', 'Chile', 'China', 'Colombia', 'Comoros',
  'Congo', 'Costa Rica', 'Croatia', 'Cuba', 'Cyprus', 'Czech Republic', 'Denmark',
  'Djibouti', 'Dominica', 'Dominican Republic', 'East Timor', 'Ecuador', 'Egypt',
  'El Salvador', 'Equatorial Guinea', 'Eritrea', 'Estonia', 'Ethiopia', 'Fiji',
  'Finland', 'France', 'Gabon', 'Gambia', 'Georgia', 'Germany', 'Ghana', 'Greece',
  'Grenada', 'Guatemala', 'Guinea', 'Guinea-Bissau', 'Guyana', 'Haiti', 'Honduras',
  'Hungary', 'Iceland', 'India', 'Indonesia', 'Iran', 'Iraq', 'Ireland', 'Israel',
  'Italy', 'Ivory Coast', 'Jamaica', 'Japan', 'Jordan', 'Kazakhstan', 'Kenya',
  'Kiribati', 'Kosovo', 'Kuwait', 'Kyrgyzstan', 'Laos', 'Latvia', 'Lebanon',
  'Lesotho', 'Liberia', 'Libya', 'Liechtenstein', 'Lithuania', 'Luxembourg',
  'Macedonia', 'Madagascar', 'Malawi', 'Malaysia', 'Maldives', 'Mali', 'Malta',
  'Marshall Islands', 'Mauritania', 'Mauritius', 'Mexico', 'Micronesia', 'Moldova',
  'Monaco', 'Mongolia', 'Montenegro', 'Morocco', 'Mozambique', 'Myanmar', 'Namibia',
  'Nauru', 'Nepal', 'Netherlands', 'New Zealand', 'Nicaragua', 'Niger', 'Nigeria',
  'North Korea', 'Norway', 'Oman', 'Pakistan', 'Palau', 'Palestine', 'Panama',
  'Papua New Guinea', 'Paraguay', 'Peru', 'Philippines', 'Poland', 'Portugal',
  'Qatar', 'Romania', 'Russia', 'Rwanda', 'Saint Kitts and Nevis', 'Saint Lucia',
  'Saint Vincent and the Grenadines', 'Samoa', 'San Marino', 'Sao Tome and Principe',
  'Saudi Arabia', 'Senegal', 'Serbia', 'Seychelles', 'Sierra Leone', 'Singapore',
  'Slovakia', 'Slovenia', 'Solomon Islands', 'Somalia', 'South Africa', 'South Korea',
  'South Sudan', 'Spain', 'Sri Lanka', 'Sudan', 'Suriname', 'Swaziland', 'Sweden',
  'Switzerland', 'Syria', 'Taiwan', 'Tajikistan', 'Tanzania', 'Thailand', 'Togo',
  'Tonga', 'Trinidad and Tobago', 'Tunisia', 'Turkey', 'Turkmenistan', 'Tuvalu',
  'Uganda', 'Ukraine', 'United Arab Emirates', 'United Kingdom', 'United States of America',
  'Uruguay', 'Uzbekistan', 'Vanuatu', 'Vatican City', 'Venezuela', 'Vietnam', 'Yemen',
  'Zambia', 'Zimbabwe',
  // Territories and special regions
  'Greenland', 'French Guiana', 'Puerto Rico', 'Western Sahara', 'Antarctica',
  'Falkland Islands', 'French Southern and Antarctic Lands', 'New Caledonia',
  'French Polynesia', 'Somaliland', 'Northern Cyprus'
];

async function findMissingCountries() {
  const availableCountries = getAvailablePassportCountries();

  console.log('Countries in GeoJSON map but NOT in visa dataset:\n');
  console.log('='.repeat(60));

  const missingCountries: string[] = [];

  geoJsonCountries.forEach(geoCountry => {
    // Check if this country exists in visa data
    const found = availableCountries.some(visaCountry => {
      return visaCountry.toLowerCase() === geoCountry.toLowerCase() ||
             visaCountry.includes(geoCountry) ||
             geoCountry.includes(visaCountry);
    });

    if (!found) {
      missingCountries.push(geoCountry);
    }
  });

  missingCountries.sort();

  console.log(`\nTotal missing: ${missingCountries.length} countries/territories\n`);

  // Categorize them
  const territories = ['Greenland', 'French Guiana', 'Puerto Rico', 'Western Sahara',
                      'Antarctica', 'Falkland Islands', 'French Southern and Antarctic Lands',
                      'New Caledonia', 'French Polynesia', 'Somaliland', 'Northern Cyprus'];

  const actualCountries = missingCountries.filter(c => !territories.includes(c));
  const missingTerritories = missingCountries.filter(c => territories.includes(c));

  console.log('TERRITORIES/SPECIAL REGIONS (expected to be missing):');
  console.log('-'.repeat(60));
  missingTerritories.forEach(country => console.log(`  - ${country}`));

  console.log('\n\nCOUNTRIES (need name mapping):');
  console.log('-'.repeat(60));
  actualCountries.forEach(country => console.log(`  - ${country}`));

  console.log('\n\nAll GeoJSON countries:', geoJsonCountries.length);
  console.log('Countries in visa dataset:', availableCountries.length);
  console.log('Missing from visa dataset:', missingCountries.length);
}

findMissingCountries();
