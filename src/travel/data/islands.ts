/**
 * Island data for places like Hawaii, Greek islands, Caribbean, etc.
 * Allows tracking individual islands within island groups
 */

export interface Island {
  id: string;
  name: string;
  countryCode: string;
  stateCode?: string;
  lat: number;
  lon: number;
  area?: number; // Square kilometers
  population?: number;
  description?: string;
  islandGroup?: string; // e.g., "Hawaiian Islands", "Greek Islands"
}

export const islands: Island[] = [
  // ========== HAWAIIAN ISLANDS ==========
  {
    id: 'us-hi-oahu',
    name: 'Oahu',
    countryCode: 'US',
    stateCode: 'US-HI',
    lat: 21.4389,
    lon: -158.0001,
    area: 1545,
    population: 1016508,
    islandGroup: 'Hawaiian Islands',
    description: 'Home to Honolulu and Waikiki Beach'
  },
  {
    id: 'us-hi-maui',
    name: 'Maui',
    countryCode: 'US',
    stateCode: 'US-HI',
    lat: 20.7984,
    lon: -156.3319,
    area: 1883,
    population: 164221,
    islandGroup: 'Hawaiian Islands',
    description: 'The Valley Isle, famous for Haleakalā'
  },
  {
    id: 'us-hi-hawaii',
    name: 'Hawaii (Big Island)',
    countryCode: 'US',
    stateCode: 'US-HI',
    lat: 19.5429,
    lon: -155.6659,
    area: 10432,
    population: 200629,
    islandGroup: 'Hawaiian Islands',
    description: 'Largest island with active volcanoes'
  },
  {
    id: 'us-hi-kauai',
    name: 'Kauai',
    countryCode: 'US',
    stateCode: 'US-HI',
    lat: 22.0964,
    lon: -159.5261,
    area: 1456,
    population: 72293,
    islandGroup: 'Hawaiian Islands',
    description: 'The Garden Isle with Na Pali Coast'
  },
  {
    id: 'us-hi-molokai',
    name: 'Molokai',
    countryCode: 'US',
    stateCode: 'US-HI',
    lat: 21.1444,
    lon: -157.0226,
    area: 673,
    population: 7345,
    islandGroup: 'Hawaiian Islands',
    description: 'Most Hawaiian island with sea cliffs'
  },
  {
    id: 'us-hi-lanai',
    name: 'Lanai',
    countryCode: 'US',
    stateCode: 'US-HI',
    lat: 20.8283,
    lon: -156.9197,
    area: 364,
    population: 3367,
    islandGroup: 'Hawaiian Islands',
    description: 'The Pineapple Island'
  },
  {
    id: 'us-hi-niihau',
    name: 'Niihau',
    countryCode: 'US',
    stateCode: 'US-HI',
    lat: 21.9000,
    lon: -160.1667,
    area: 180,
    population: 170,
    islandGroup: 'Hawaiian Islands',
    description: 'The Forbidden Isle, privately owned'
  },
  {
    id: 'us-hi-kahoolawe',
    name: 'Kahoolawe',
    countryCode: 'US',
    stateCode: 'US-HI',
    lat: 20.5500,
    lon: -156.6000,
    area: 116,
    population: 0,
    islandGroup: 'Hawaiian Islands',
    description: 'Uninhabited, former military target'
  },

  // ========== GREEK ISLANDS (Sample) ==========
  {
    id: 'gr-santorini',
    name: 'Santorini',
    countryCode: 'GR',
    lat: 36.3932,
    lon: 25.4615,
    area: 90,
    population: 15550,
    islandGroup: 'Cyclades',
    description: 'Famous for white buildings and sunset views'
  },
  {
    id: 'gr-mykonos',
    name: 'Mykonos',
    countryCode: 'GR',
    lat: 37.4467,
    lon: 25.3289,
    area: 105,
    population: 10134,
    islandGroup: 'Cyclades',
    description: 'Known for vibrant nightlife and beaches'
  },
  {
    id: 'gr-crete',
    name: 'Crete',
    countryCode: 'GR',
    lat: 35.2401,
    lon: 24.8093,
    area: 8336,
    population: 623666,
    islandGroup: 'Crete',
    description: 'Largest Greek island with ancient Minoan civilization'
  },
  {
    id: 'gr-rhodes',
    name: 'Rhodes',
    countryCode: 'GR',
    lat: 36.1629,
    lon: 27.9714,
    area: 1401,
    population: 115490,
    islandGroup: 'Dodecanese',
    description: 'Medieval Old Town and beaches'
  },

  // ========== CARIBBEAN (Sample) ==========
  {
    id: 'pr-main',
    name: 'Puerto Rico',
    countryCode: 'PR',
    lat: 18.2208,
    lon: -66.5901,
    area: 8897,
    population: 3194000,
    islandGroup: 'Greater Antilles',
    description: 'Rich cultural heritage and El Yunque rainforest'
  },
  {
    id: 'jm-main',
    name: 'Jamaica',
    countryCode: 'JM',
    lat: 18.1096,
    lon: -77.2975,
    area: 10991,
    population: 2961000,
    islandGroup: 'Greater Antilles',
    description: 'Reggae, beaches, and Blue Mountains'
  },

  // ========== CANARY ISLANDS ==========
  {
    id: 'es-tenerife',
    name: 'Tenerife',
    countryCode: 'ES',
    lat: 28.2916,
    lon: -16.6291,
    area: 2034,
    population: 917841,
    islandGroup: 'Canary Islands',
    description: 'Largest Canary Island with Mount Teide'
  },
  {
    id: 'es-gran-canaria',
    name: 'Gran Canaria',
    countryCode: 'ES',
    lat: 27.9268,
    lon: -15.5856,
    area: 1560,
    population: 851231,
    islandGroup: 'Canary Islands',
    description: 'Diverse landscapes from dunes to mountains'
  },
];

// Helper functions
export function getIslandsByCountry(countryCode: string): Island[] {
  return islands.filter(island => island.countryCode === countryCode);
}

export function getIslandsByState(stateCode: string): Island[] {
  return islands.filter(island => island.stateCode === stateCode);
}

export function getIslandsByGroup(groupName: string): Island[] {
  return islands.filter(island => island.islandGroup === groupName);
}

// Hawaiian Islands helper
export function getHawaiianIslands(): Island[] {
  return islands.filter(island => island.islandGroup === 'Hawaiian Islands');
}
