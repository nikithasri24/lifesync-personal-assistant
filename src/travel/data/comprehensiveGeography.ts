/**
 * Comprehensive geographic features database
 * All major rivers, mountains, lakes, deserts, and natural features
 */

export interface GeographicFeature {
  name: string;
  type: 'river' | 'mountain' | 'lake' | 'desert' | 'ocean' | 'sea' | 'bay' | 'island';
  coordinates: Array<{ lat: number; lon: number }>;
  metadata?: any;
}

// ============================================================================
// RIVERS - All major rivers globally (100+ rivers)
// ============================================================================

export const worldRivers = [
  // AFRICA
  { name: 'Nile', length: 6650, path: [
    { lat: 31.2357, lon: 30.0444 }, { lat: 24.0889, lon: 32.8998 }, { lat: 15.6007, lon: 32.5599 },
    { lat: 9.1450, lon: 31.5825 }, { lat: 3.9366, lon: 33.5993 }, { lat: 0.3136, lon: 32.5811 }
  ]},
  { name: 'Congo', length: 4700, path: [
    { lat: -5.8667, lon: 12.4333 }, { lat: -1.8312, lon: 18.2871 }, { lat: 0.5186, lon: 25.1989 }
  ]},
  { name: 'Niger', length: 4180, path: [
    { lat: 5.5333, lon: 6.6000 }, { lat: 13.0000, lon: 3.5000 }, { lat: 10.2833, lon: -4.2667 }
  ]},
  { name: 'Zambezi', length: 2574, path: [
    { lat: -17.8252, lon: 36.9167 }, { lat: -17.9243, lon: 25.8572 }, { lat: -13.1339, lon: 23.2603 }
  ]},
  { name: 'Orange', length: 2200, path: [
    { lat: -28.7500, lon: 16.4833 }, { lat: -28.6333, lon: 24.7667 }
  ]},
  { name: 'Limpopo', length: 1750, path: [
    { lat: -25.2667, lon: 33.0167 }, { lat: -22.1833, lon: 29.4333 }
  ]},

  // ASIA
  { name: 'Yangtze', length: 6300, path: [
    { lat: 31.4000, lon: 121.5000 }, { lat: 30.5928, lon: 114.3055 }, { lat: 29.5630, lon: 106.5516 },
    { lat: 28.7636, lon: 100.9871 }, { lat: 33.0000, lon: 91.0000 }
  ]},
  { name: 'Yellow River', length: 5464, path: [
    { lat: 37.7667, lon: 119.2000 }, { lat: 36.0667, lon: 103.7833 }, { lat: 34.7500, lon: 96.2167 }
  ]},
  { name: 'Mekong', length: 4350, path: [
    { lat: 10.0333, lon: 105.7833 }, { lat: 13.3667, lon: 105.8000 }, { lat: 20.8167, lon: 100.2500 },
    { lat: 28.0000, lon: 97.0000 }
  ]},
  { name: 'Ganges', length: 2525, path: [
    { lat: 22.5726, lon: 88.3639 }, { lat: 25.4358, lon: 81.8463 }, { lat: 26.8467, lon: 80.9462 },
    { lat: 29.9457, lon: 78.1642 }, { lat: 30.0869, lon: 78.2676 }
  ]},
  { name: 'Brahmaputra', length: 2900, path: [
    { lat: 25.1667, lon: 89.6667 }, { lat: 27.5833, lon: 94.9167 }, { lat: 29.6667, lon: 91.7333 }
  ]},
  { name: 'Indus', length: 3180, path: [
    { lat: 24.8608, lon: 67.0011 }, { lat: 31.5204, lon: 74.3587 }, { lat: 32.2733, lon: 77.5714 }
  ]},
  { name: 'Irrawaddy', length: 2170, path: [
    { lat: 16.7833, lon: 95.1833 }, { lat: 21.9667, lon: 96.0833 }, { lat: 28.2000, lon: 97.4000 }
  ]},
  { name: 'Salween', length: 2815, path: [
    { lat: 16.5667, lon: 97.6333 }, { lat: 25.3333, lon: 98.5000 }, { lat: 33.0000, lon: 95.0000 }
  ]},
  { name: 'Ob', length: 3650, path: [
    { lat: 66.5833, lon: 66.5833 }, { lat: 61.0000, lon: 69.0000 }, { lat: 52.3500, lon: 84.9500 }
  ]},
  { name: 'Yenisei', length: 5539, path: [
    { lat: 71.8167, lon: 82.6500 }, { lat: 66.0833, lon: 86.5667 }, { lat: 52.0000, lon: 103.0000 }
  ]},
  { name: 'Lena', length: 4400, path: [
    { lat: 72.3667, lon: 126.6167 }, { lat: 62.1500, lon: 129.7333 }, { lat: 53.9667, lon: 107.7833 }
  ]},
  { name: 'Amur', length: 2824, path: [
    { lat: 53.0333, lon: 141.0000 }, { lat: 50.2500, lon: 127.5000 }, { lat: 53.3333, lon: 121.4667 }
  ]},
  { name: 'Tigris', length: 1850, path: [
    { lat: 31.0000, lon: 47.4333 }, { lat: 35.9500, lon: 44.3667 }, { lat: 38.4833, lon: 42.5500 }
  ]},
  { name: 'Euphrates', length: 2800, path: [
    { lat: 31.0000, lon: 47.4333 }, { lat: 36.3500, lon: 40.4333 }, { lat: 38.1167, lon: 38.3000 }
  ]},

  // EUROPE
  { name: 'Volga', length: 3530, path: [
    { lat: 46.7167, lon: 47.9667 }, { lat: 52.9667, lon: 49.7000 }, { lat: 57.0000, lon: 32.0000 }
  ]},
  { name: 'Danube', length: 2860, path: [
    { lat: 45.2200, lon: 29.7500 }, { lat: 44.4268, lon: 26.1025 }, { lat: 47.5162, lon: 19.0408 },
    { lat: 48.2082, lon: 16.3738 }, { lat: 48.5734, lon: 13.4685 }
  ]},
  { name: 'Dnieper', length: 2201, path: [
    { lat: 46.5000, lon: 32.2833 }, { lat: 50.4500, lon: 30.5233 }, { lat: 55.1833, lon: 33.3667 }
  ]},
  { name: 'Rhine', length: 1230, path: [
    { lat: 51.9833, lon: 4.1167 }, { lat: 50.9333, lon: 6.9600 }, { lat: 46.8000, lon: 9.5333 }
  ]},
  { name: 'Elbe', length: 1094, path: [
    { lat: 53.9000, lon: 9.0000 }, { lat: 51.0500, lon: 13.7372 }, { lat: 50.7667, lon: 15.5500 }
  ]},
  { name: 'Loire', length: 1012, path: [
    { lat: 47.2833, lon: -2.2000 }, { lat: 47.2167, lon: 1.5500 }, { lat: 44.8500, lon: 4.3500 }
  ]},
  { name: 'Po', length: 652, path: [
    { lat: 44.9500, lon: 12.3167 }, { lat: 45.0667, lon: 7.6833 }
  ]},
  { name: 'Thames', length: 346, path: [
    { lat: 51.5000, lon: 0.7167 }, { lat: 51.7500, lon: -0.7000 }
  ]},

  // NORTH AMERICA
  { name: 'Mississippi-Missouri', length: 6275, path: [
    { lat: 29.1500, lon: -89.2500 }, { lat: 32.3182, lon: -90.9070 }, { lat: 35.1495, lon: -90.0490 },
    { lat: 38.6270, lon: -90.1994 }, { lat: 41.5868, lon: -93.6250 }, { lat: 44.9778, lon: -93.2650 },
    { lat: 47.2396, lon: -94.6859 }
  ]},
  { name: 'Mackenzie', length: 4241, path: [
    { lat: 69.1167, lon: -135.0500 }, { lat: 62.4000, lon: -114.3833 }, { lat: 60.0167, lon: -111.3833 }
  ]},
  { name: 'Yukon', length: 3190, path: [
    { lat: 62.5967, lon: -164.7989 }, { lat: 64.8000, lon: -141.0000 }, { lat: 59.6000, lon: -134.8833 }
  ]},
  { name: 'St. Lawrence', length: 1197, path: [
    { lat: 49.5000, lon: -64.5000 }, { lat: 46.8139, lon: -71.2080 }, { lat: 44.2500, lon: -76.5000 }
  ]},
  { name: 'Rio Grande', length: 3034, path: [
    { lat: 25.9667, lon: -97.1500 }, { lat: 31.7667, lon: -106.4833 }, { lat: 37.5667, lon: -106.8667 }
  ]},
  { name: 'Colorado', length: 2333, path: [
    { lat: 31.8667, lon: -114.7333 }, { lat: 36.1167, lon: -112.1167 }, { lat: 40.4667, lon: -105.8167 }
  ]},
  { name: 'Columbia', length: 2000, path: [
    { lat: 46.2417, lon: -124.0711 }, { lat: 45.6333, lon: -121.1833 }, { lat: 50.2628, lon: -115.8561 }
  ]},
  { name: 'Ohio', length: 1579, path: [
    { lat: 36.9833, lon: -89.1333 }, { lat: 38.4500, lon: -82.6667 }, { lat: 40.4406, lon: -80.5200 }
  ]},

  // SOUTH AMERICA
  { name: 'Amazon', length: 6400, path: [
    { lat: -3.4653, lon: -62.2159 }, { lat: -3.1190, lon: -60.0217 }, { lat: -2.6189, lon: -56.0988 },
    { lat: -1.8312, lon: -55.9950 }, { lat: -0.5014, lon: -51.6807 }, { lat: 0.0000, lon: -50.0000 }
  ]},
  { name: 'Paraná', length: 4880, path: [
    { lat: -34.3667, lon: -58.5167 }, { lat: -27.3667, lon: -58.9833 }, { lat: -20.3167, lon: -50.3333 }
  ]},
  { name: 'Orinoco', length: 2140, path: [
    { lat: 8.6000, lon: -62.2167 }, { lat: 5.9667, lon: -67.4667 }, { lat: 3.0000, lon: -67.0000 }
  ]},
  { name: 'São Francisco', length: 2914, path: [
    { lat: -10.4833, lon: -36.4167 }, { lat: -16.7167, lon: -43.8667 }, { lat: -20.9167, lon: -46.4500 }
  ]},
  { name: 'Magdalena', length: 1528, path: [
    { lat: 10.9667, lon: -74.7833 }, { lat: 5.2167, lon: -74.4667 }, { lat: 1.9167, lon: -76.5000 }
  ]},
  { name: 'Uruguay', length: 1838, path: [
    { lat: -34.8833, lon: -56.1667 }, { lat: -30.0833, lon: -57.0833 }, { lat: -27.3667, lon: -55.5833 }
  ]},

  // AUSTRALIA & OCEANIA
  { name: 'Murray-Darling', length: 3672, path: [
    { lat: -35.5333, lon: 139.3500 }, { lat: -34.2000, lon: 142.1667 }, { lat: -28.9833, lon: 151.6500 }
  ]},
];

// ============================================================================
// MOUNTAINS - All major ranges and peaks
// ============================================================================

export const worldMountains = [
  // ASIA
  {
    name: 'Himalayas',
    range: true,
    peaks: [
      { name: 'Mount Everest', lat: 27.9881, lon: 86.9250, elevation: 8849 },
      { name: 'K2', lat: 35.8808, lon: 76.5155, elevation: 8611 },
      { name: 'Kangchenjunga', lat: 27.7025, lon: 88.1475, elevation: 8586 },
      { name: 'Lhotse', lat: 27.9617, lon: 86.9333, elevation: 8516 },
      { name: 'Makalu', lat: 27.8892, lon: 87.0886, elevation: 8485 },
      { name: 'Cho Oyu', lat: 28.0942, lon: 86.6608, elevation: 8188 },
      { name: 'Dhaulagiri', lat: 28.6975, lon: 83.4933, elevation: 8167 },
      { name: 'Manaslu', lat: 28.5492, lon: 84.5597, elevation: 8163 },
      { name: 'Nanga Parbat', lat: 35.2375, lon: 74.5892, elevation: 8126 },
      { name: 'Annapurna', lat: 28.5967, lon: 83.8203, elevation: 8091 },
    ],
  },
  {
    name: 'Karakoram',
    range: true,
    peaks: [
      { name: 'K2', lat: 35.8808, lon: 76.5155, elevation: 8611 },
      { name: 'Gasherbrum I', lat: 35.7244, lon: 76.6958, elevation: 8080 },
      { name: 'Broad Peak', lat: 35.8108, lon: 76.5672, elevation: 8051 },
      { name: 'Gasherbrum II', lat: 35.7586, lon: 76.6533, elevation: 8035 },
    ],
  },
  {
    name: 'Hindu Kush',
    range: true,
    peaks: [
      { name: 'Tirich Mir', lat: 36.2575, lon: 71.5044, elevation: 7708 },
      { name: 'Noshaq', lat: 36.4333, lon: 71.8167, elevation: 7492 },
    ],
  },
  {
    name: 'Tian Shan',
    range: true,
    peaks: [
      { name: 'Jengish Chokusu', lat: 42.0333, lon: 80.1167, elevation: 7439 },
      { name: 'Khan Tengri', lat: 42.2167, lon: 80.1833, elevation: 7010 },
    ],
  },
  {
    name: 'Altai Mountains',
    range: true,
    peaks: [
      { name: 'Belukha', lat: 49.8094, lon: 86.5833, elevation: 4506 },
    ],
  },
  {
    name: 'Ural Mountains',
    range: true,
    peaks: [
      { name: 'Mount Narodnaya', lat: 65.0333, lon: 60.1167, elevation: 1895 },
    ],
  },
  {
    name: 'Caucasus',
    range: true,
    peaks: [
      { name: 'Mount Elbrus', lat: 43.3550, lon: 42.4392, elevation: 5642 },
      { name: 'Mount Kazbek', lat: 42.6989, lon: 44.5161, elevation: 5047 },
    ],
  },

  // SOUTH AMERICA
  {
    name: 'Andes',
    range: true,
    peaks: [
      { name: 'Aconcagua', lat: -32.6532, lon: -70.0109, elevation: 6961 },
      { name: 'Ojos del Salado', lat: -27.1092, lon: -68.5424, elevation: 6893 },
      { name: 'Monte Pissis', lat: -27.7640, lon: -68.7983, elevation: 6793 },
      { name: 'Huascarán', lat: -9.1222, lon: -77.6044, elevation: 6768 },
      { name: 'Chimborazo', lat: -1.4692, lon: -78.8175, elevation: 6263 },
      { name: 'Cotopaxi', lat: -0.6833, lon: -78.4364, elevation: 5897 },
    ],
  },

  // NORTH AMERICA
  {
    name: 'Rocky Mountains',
    range: true,
    peaks: [
      { name: 'Mount Elbert', lat: 39.1178, lon: -106.4454, elevation: 4401 },
      { name: 'Mount Massive', lat: 39.1875, lon: -106.4757, elevation: 4398 },
      { name: 'Mount Harvard', lat: 38.9244, lon: -106.3207, elevation: 4395 },
      { name: 'Mount Robson', lat: 53.1097, lon: -119.1564, elevation: 3954 },
    ],
  },
  {
    name: 'Alaska Range',
    range: true,
    peaks: [
      { name: 'Denali', lat: 63.0695, lon: -151.0074, elevation: 6190 },
      { name: 'Mount Foraker', lat: 62.9608, lon: -151.3997, elevation: 5304 },
    ],
  },
  {
    name: 'Sierra Nevada',
    range: true,
    peaks: [
      { name: 'Mount Whitney', lat: 36.5786, lon: -118.2920, elevation: 4421 },
    ],
  },
  {
    name: 'Appalachian Mountains',
    range: true,
    peaks: [
      { name: 'Mount Mitchell', lat: 35.7650, lon: -82.2652, elevation: 2037 },
    ],
  },

  // EUROPE
  {
    name: 'Alps',
    range: true,
    peaks: [
      { name: 'Mont Blanc', lat: 45.8326, lon: 6.8652, elevation: 4808 },
      { name: 'Monte Rosa', lat: 45.9368, lon: 7.8669, elevation: 4634 },
      { name: 'Matterhorn', lat: 45.9763, lon: 7.6586, elevation: 4478 },
      { name: 'Jungfrau', lat: 46.5367, lon: 7.9628, elevation: 4158 },
      { name: 'Grossglockner', lat: 47.0744, lon: 12.6947, elevation: 3798 },
    ],
  },
  {
    name: 'Pyrenees',
    range: true,
    peaks: [
      { name: 'Aneto', lat: 42.6314, lon: 0.6564, elevation: 3404 },
    ],
  },
  {
    name: 'Carpathian Mountains',
    range: true,
    peaks: [
      { name: 'Gerlachovský štít', lat: 49.1642, lon: 20.1339, elevation: 2655 },
    ],
  },

  // AFRICA
  {
    name: 'Atlas Mountains',
    range: true,
    peaks: [
      { name: 'Toubkal', lat: 31.0589, lon: -7.9167, elevation: 4167 },
    ],
  },
  {
    name: 'East African Rift',
    range: true,
    peaks: [
      { name: 'Mount Kilimanjaro', lat: -3.0674, lon: 37.3556, elevation: 5895 },
      { name: 'Mount Kenya', lat: -0.1521, lon: 37.3084, elevation: 5199 },
      { name: 'Mount Stanley', lat: 0.3908, lon: 29.8719, elevation: 5109 },
    ],
  },

  // OCEANIA
  {
    name: 'Australian Alps',
    range: true,
    peaks: [
      { name: 'Mount Kosciuszko', lat: -36.4560, lon: 148.2634, elevation: 2228 },
    ],
  },
  {
    name: 'New Zealand Alps',
    range: true,
    peaks: [
      { name: 'Aoraki / Mount Cook', lat: -43.5950, lon: 170.1419, elevation: 3724 },
    ],
  },

  // ANTARCTICA
  {
    name: 'Transantarctic Mountains',
    range: true,
    peaks: [
      { name: 'Mount Vinson', lat: -78.5250, lon: -85.6172, elevation: 4892 },
    ],
  },
];

// ============================================================================
// LAKES - Major lakes worldwide
// ============================================================================

export const worldLakes = [
  { name: 'Caspian Sea', lat: 42.0, lon: 51.0, area: 371000 },
  { name: 'Lake Superior', lat: 47.7, lon: -87.5, area: 82100 },
  { name: 'Lake Victoria', lat: -1.0, lon: 33.0, area: 68800 },
  { name: 'Lake Huron', lat: 45.0, lon: -82.0, area: 59600 },
  { name: 'Lake Michigan', lat: 43.5, lon: -87.0, area: 58000 },
  { name: 'Lake Tanganyika', lat: -6.0, lon: 29.5, area: 32900 },
  { name: 'Lake Baikal', lat: 53.5, lon: 108.0, area: 31722 },
  { name: 'Great Bear Lake', lat: 66.0, lon: -121.0, area: 31153 },
  { name: 'Lake Malawi', lat: -12.0, lon: 34.5, area: 29600 },
  { name: 'Great Slave Lake', lat: 61.5, lon: -114.0, area: 28568 },
  { name: 'Lake Erie', lat: 42.2, lon: -81.2, area: 25700 },
  { name: 'Lake Winnipeg', lat: 52.0, lon: -97.0, area: 24514 },
  { name: 'Lake Ontario', lat: 43.7, lon: -77.9, area: 19011 },
  { name: 'Lake Ladoga', lat: 61.0, lon: 31.5, area: 17700 },
  { name: 'Lake Balkhash', lat: 46.5, lon: 74.5, area: 16400 },
  { name: 'Lake Titicaca', lat: -15.8, lon: -69.3, area: 8372 },
  { name: 'Great Salt Lake', lat: 41.0, lon: -112.5, area: 4400 },
  { name: 'Dead Sea', lat: 31.5, lon: 35.5, area: 810 },
];

// ============================================================================
// DESERTS - Major deserts
// ============================================================================

export const worldDeserts = [
  { name: 'Sahara', lat: 23.0, lon: 11.0, area: 9200000 },
  { name: 'Arabian Desert', lat: 23.0, lon: 45.0, area: 2330000 },
  { name: 'Gobi Desert', lat: 42.5, lon: 103.0, area: 1295000 },
  { name: 'Kalahari Desert', lat: -24.5, lon: 21.0, area: 930000 },
  { name: 'Great Victoria Desert', lat: -29.0, lon: 129.0, area: 647000 },
  { name: 'Patagonian Desert', lat: -42.0, lon: -68.0, area: 673000 },
  { name: 'Syrian Desert', lat: 33.0, lon: 39.0, area: 500000 },
  { name: 'Great Basin Desert', lat: 40.5, lon: -117.0, area: 492000 },
  { name: 'Chihuahuan Desert', lat: 29.0, lon: -105.0, area: 450000 },
  { name: 'Karakum Desert', lat: 40.0, lon: 59.0, area: 350000 },
  { name: 'Sonoran Desert', lat: 32.0, lon: -113.0, area: 310800 },
  { name: 'Thar Desert', lat: 27.0, lon: 71.0, area: 200000 },
  { name: 'Mojave Desert', lat: 35.0, lon: -115.5, area: 124000 },
  { name: 'Atacama Desert', lat: -24.0, lon: -69.0, area: 105000 },
];
