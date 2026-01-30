/**
 * Geographic features data for enhanced map visualization
 * Includes mountains, rivers, terrain, and administrative boundaries
 */

export interface MountainRange {
  name: string;
  peaks: Array<{ name: string; lat: number; lon: number; elevation: number }>;
  countries: string[];
}

export interface River {
  name: string;
  length: number; // in km
  path: Array<{ lat: number; lon: number }>;
  countries: string[];
}

export interface StateProvince {
  name: string;
  country: string;
  capital?: string;
  boundaries: unknown; // GeoJSON geometry
}

// Major mountain ranges
export const mountainRanges: MountainRange[] = [
  {
    name: 'Himalayas',
    peaks: [
      { name: 'Mount Everest', lat: 27.9881, lon: 86.9250, elevation: 8849 },
      { name: 'K2', lat: 35.8808, lon: 76.5155, elevation: 8611 },
      { name: 'Kangchenjunga', lat: 27.7025, lon: 88.1475, elevation: 8586 },
    ],
    countries: ['NP', 'CN', 'IN', 'BT', 'PK'],
  },
  {
    name: 'Andes',
    peaks: [
      { name: 'Aconcagua', lat: -32.6532, lon: -70.0109, elevation: 6961 },
      { name: 'Ojos del Salado', lat: -27.1092, lon: -68.5424, elevation: 6893 },
      { name: 'Monte Pissis', lat: -27.7640, lon: -68.7983, elevation: 6793 },
    ],
    countries: ['AR', 'CL', 'BO', 'PE', 'EC', 'CO', 'VE'],
  },
  {
    name: 'Rocky Mountains',
    peaks: [
      { name: 'Mount Elbert', lat: 39.1178, lon: -106.4454, elevation: 4401 },
      { name: 'Mount Massive', lat: 39.1875, lon: -106.4757, elevation: 4398 },
      { name: 'Mount Harvard', lat: 38.9244, lon: -106.3207, elevation: 4395 },
    ],
    countries: ['US', 'CA'],
  },
  {
    name: 'Alps',
    peaks: [
      { name: 'Mont Blanc', lat: 45.8326, lon: 6.8652, elevation: 4808 },
      { name: 'Monte Rosa', lat: 45.9368, lon: 7.8669, elevation: 4634 },
      { name: 'Matterhorn', lat: 45.9763, lon: 7.6586, elevation: 4478 },
    ],
    countries: ['FR', 'IT', 'CH', 'AT', 'DE', 'SI'],
  },
  {
    name: 'Atlas Mountains',
    peaks: [
      { name: 'Toubkal', lat: 31.0589, lon: -7.9167, elevation: 4167 },
    ],
    countries: ['MA', 'DZ', 'TN'],
  },
];

// Major rivers
export const rivers: River[] = [
  {
    name: 'Amazon',
    length: 6400,
    path: [
      { lat: -3.4653, lon: -62.2159 },
      { lat: -3.1190, lon: -60.0217 },
      { lat: -2.6189, lon: -56.0988 },
      { lat: -1.8312, lon: -55.9950 },
      { lat: -0.5014, lon: -51.6807 },
      { lat: 0.0000, lon: -50.0000 },
    ],
    countries: ['BR', 'PE', 'CO'],
  },
  {
    name: 'Nile',
    length: 6650,
    path: [
      { lat: 31.2357, lon: 30.0444 },
      { lat: 24.0889, lon: 32.8998 },
      { lat: 15.6007, lon: 32.5599 },
      { lat: 9.1450, lon: 31.5825 },
      { lat: 3.9366, lon: 33.5993 },
      { lat: 0.3136, lon: 32.5811 },
    ],
    countries: ['EG', 'SD', 'SS', 'UG', 'ET'],
  },
  {
    name: 'Mississippi',
    length: 3730,
    path: [
      { lat: 29.1500, lon: -89.2500 },
      { lat: 32.3182, lon: -90.9070 },
      { lat: 35.1495, lon: -90.0490 },
      { lat: 38.6270, lon: -90.1994 },
      { lat: 41.5868, lon: -93.6250 },
      { lat: 44.9778, lon: -93.2650 },
      { lat: 47.2396, lon: -94.6859 },
    ],
    countries: ['US'],
  },
  {
    name: 'Yangtze',
    length: 6300,
    path: [
      { lat: 31.4000, lon: 121.5000 },
      { lat: 30.5928, lon: 114.3055 },
      { lat: 29.5630, lon: 106.5516 },
      { lat: 28.7636, lon: 100.9871 },
      { lat: 33.0000, lon: 91.0000 },
    ],
    countries: ['CN'],
  },
  {
    name: 'Danube',
    length: 2860,
    path: [
      { lat: 45.2200, lon: 29.7500 },
      { lat: 44.4268, lon: 26.1025 },
      { lat: 47.5162, lon: 19.0408 },
      { lat: 48.2082, lon: 16.3738 },
      { lat: 48.5734, lon: 13.4685 },
    ],
    countries: ['RO', 'BG', 'RS', 'HU', 'AT', 'SK', 'DE'],
  },
  {
    name: 'Ganges',
    length: 2525,
    path: [
      { lat: 22.5726, lon: 88.3639 },
      { lat: 25.4358, lon: 81.8463 },
      { lat: 26.8467, lon: 80.9462 },
      { lat: 29.9457, lon: 78.1642 },
      { lat: 30.0869, lon: 78.2676 },
    ],
    countries: ['IN', 'BD'],
  },
];

// US States boundaries (simplified - would need full GeoJSON for production)
export const usStates = [
  { code: 'AL', name: 'Alabama', capital: 'Montgomery' },
  { code: 'AK', name: 'Alaska', capital: 'Juneau' },
  { code: 'AZ', name: 'Arizona', capital: 'Phoenix' },
  { code: 'AR', name: 'Arkansas', capital: 'Little Rock' },
  { code: 'CA', name: 'California', capital: 'Sacramento' },
  { code: 'CO', name: 'Colorado', capital: 'Denver' },
  { code: 'CT', name: 'Connecticut', capital: 'Hartford' },
  { code: 'DE', name: 'Delaware', capital: 'Dover' },
  { code: 'FL', name: 'Florida', capital: 'Tallahassee' },
  { code: 'GA', name: 'Georgia', capital: 'Atlanta' },
  { code: 'HI', name: 'Hawaii', capital: 'Honolulu' },
  { code: 'ID', name: 'Idaho', capital: 'Boise' },
  { code: 'IL', name: 'Illinois', capital: 'Springfield' },
  { code: 'IN', name: 'Indiana', capital: 'Indianapolis' },
  { code: 'IA', name: 'Iowa', capital: 'Des Moines' },
  { code: 'KS', name: 'Kansas', capital: 'Topeka' },
  { code: 'KY', name: 'Kentucky', capital: 'Frankfort' },
  { code: 'LA', name: 'Louisiana', capital: 'Baton Rouge' },
  { code: 'ME', name: 'Maine', capital: 'Augusta' },
  { code: 'MD', name: 'Maryland', capital: 'Annapolis' },
  { code: 'MA', name: 'Massachusetts', capital: 'Boston' },
  { code: 'MI', name: 'Michigan', capital: 'Lansing' },
  { code: 'MN', name: 'Minnesota', capital: 'Saint Paul' },
  { code: 'MS', name: 'Mississippi', capital: 'Jackson' },
  { code: 'MO', name: 'Missouri', capital: 'Jefferson City' },
  { code: 'MT', name: 'Montana', capital: 'Helena' },
  { code: 'NE', name: 'Nebraska', capital: 'Lincoln' },
  { code: 'NV', name: 'Nevada', capital: 'Carson City' },
  { code: 'NH', name: 'New Hampshire', capital: 'Concord' },
  { code: 'NJ', name: 'New Jersey', capital: 'Trenton' },
  { code: 'NM', name: 'New Mexico', capital: 'Santa Fe' },
  { code: 'NY', name: 'New York', capital: 'Albany' },
  { code: 'NC', name: 'North Carolina', capital: 'Raleigh' },
  { code: 'ND', name: 'North Dakota', capital: 'Bismarck' },
  { code: 'OH', name: 'Ohio', capital: 'Columbus' },
  { code: 'OK', name: 'Oklahoma', capital: 'Oklahoma City' },
  { code: 'OR', name: 'Oregon', capital: 'Salem' },
  { code: 'PA', name: 'Pennsylvania', capital: 'Harrisburg' },
  { code: 'RI', name: 'Rhode Island', capital: 'Providence' },
  { code: 'SC', name: 'South Carolina', capital: 'Columbia' },
  { code: 'SD', name: 'South Dakota', capital: 'Pierre' },
  { code: 'TN', name: 'Tennessee', capital: 'Nashville' },
  { code: 'TX', name: 'Texas', capital: 'Austin' },
  { code: 'UT', name: 'Utah', capital: 'Salt Lake City' },
  { code: 'VT', name: 'Vermont', capital: 'Montpelier' },
  { code: 'VA', name: 'Virginia', capital: 'Richmond' },
  { code: 'WA', name: 'Washington', capital: 'Olympia' },
  { code: 'WV', name: 'West Virginia', capital: 'Charleston' },
  { code: 'WI', name: 'Wisconsin', capital: 'Madison' },
  { code: 'WY', name: 'Wyoming', capital: 'Cheyenne' },
  // US Territories
  { code: 'DC', name: 'Washington, D.C.', capital: 'Washington' },
  { code: 'PR', name: 'Puerto Rico', capital: 'San Juan' },
  { code: 'VI', name: 'U.S. Virgin Islands', capital: 'Charlotte Amalie' },
  { code: 'GU', name: 'Guam', capital: 'Hagåtña' },
  { code: 'AS', name: 'American Samoa', capital: 'Pago Pago' },
  { code: 'MP', name: 'Northern Mariana Islands', capital: 'Saipan' },
];

// Canadian Provinces
export const canadianProvinces = [
  { code: 'ON', name: 'Ontario', capital: 'Toronto' },
  { code: 'QC', name: 'Quebec', capital: 'Quebec City' },
  { code: 'BC', name: 'British Columbia', capital: 'Victoria' },
  { code: 'AB', name: 'Alberta', capital: 'Edmonton' },
  { code: 'MB', name: 'Manitoba', capital: 'Winnipeg' },
  { code: 'SK', name: 'Saskatchewan', capital: 'Regina' },
  { code: 'NS', name: 'Nova Scotia', capital: 'Halifax' },
  { code: 'NB', name: 'New Brunswick', capital: 'Fredericton' },
  { code: 'NL', name: 'Newfoundland and Labrador', capital: 'St. John\'s' },
  { code: 'PE', name: 'Prince Edward Island', capital: 'Charlottetown' },
  { code: 'NT', name: 'Northwest Territories', capital: 'Yellowknife' },
  { code: 'YT', name: 'Yukon', capital: 'Whitehorse' },
  { code: 'NU', name: 'Nunavut', capital: 'Iqaluit' },
];

// Terrain elevation data (simplified)
export function getTerrainColor(elevation: number): string {
  if (elevation < 0) return '#A4CDE3'; // Ocean
  if (elevation < 200) return '#B8D4A8'; // Lowland
  if (elevation < 500) return '#D4D9A8'; // Plains
  if (elevation < 1000) return '#D9C8A8'; // Hills
  if (elevation < 2000) return '#C8B69C'; // Mountains
  if (elevation < 4000) return '#A89878'; // High Mountains
  return '#F0F0F0'; // Snow peaks
}

// Get terrain relief shading based on lat/lon (simplified approximation)
export function getTerrainElevation(lat: number, lon: number): number {
  // This is a simplified approximation
  // In production, you'd use actual elevation data from a DEM (Digital Elevation Model)

  // Himalayas
  if (lat >= 25 && lat <= 35 && lon >= 70 && lon <= 100) {
    return 3000 + Math.random() * 2000;
  }

  // Andes
  if (lat >= -40 && lat <= -10 && lon >= -75 && lon <= -65) {
    return 2500 + Math.random() * 2000;
  }

  // Rockies
  if (lat >= 35 && lat <= 55 && lon >= -120 && lon <= -105) {
    return 2000 + Math.random() * 1500;
  }

  // Alps
  if (lat >= 45 && lat <= 48 && lon >= 5 && lon <= 15) {
    return 2000 + Math.random() * 1500;
  }

  // Default lowland
  return 100 + Math.random() * 100;
}
