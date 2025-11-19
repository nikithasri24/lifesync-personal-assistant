/**
 * National Parks data from around the world
 * Organized by country with coordinates and basic info
 * US National Parks: All 63 parks as of 2024
 */

export interface NationalPark {
  id: string;
  name: string;
  countryCode: string;
  stateCode?: string; // For US states, Canadian provinces, etc.
  lat: number;
  lon: number;
  established?: number; // Year
  area?: number; // Square kilometers
  description?: string;
  unesco?: boolean; // UNESCO World Heritage Site
}

export const nationalParks: NationalPark[] = [
  // ========== UNITED STATES (All 63 National Parks) ==========

  // ALASKA (8 parks)
  {
    id: 'us-denali',
    name: 'Denali National Park',
    countryCode: 'US',
    stateCode: 'US-AK',
    lat: 63.1148,
    lon: -151.1926,
    established: 1917,
    area: 19185,
    description: 'Home to North America\'s highest peak, Mount Denali'
  },
  {
    id: 'us-gates-of-the-arctic',
    name: 'Gates of the Arctic National Park',
    countryCode: 'US',
    stateCode: 'US-AK',
    lat: 67.7876,
    lon: -153.2989,
    established: 1980,
    area: 34287,
    description: 'America\'s northernmost national park, entirely above the Arctic Circle'
  },
  {
    id: 'us-glacier-bay',
    name: 'Glacier Bay National Park',
    countryCode: 'US',
    stateCode: 'US-AK',
    lat: 58.6658,
    lon: -136.9003,
    established: 1980,
    area: 13287,
    unesco: true,
    description: 'Tidewater glaciers, mountains, and abundant wildlife'
  },
  {
    id: 'us-katmai',
    name: 'Katmai National Park',
    countryCode: 'US',
    stateCode: 'US-AK',
    lat: 58.5975,
    lon: -155.0649,
    established: 1980,
    area: 14870,
    description: 'Famous for brown bears fishing for salmon at Brooks Falls'
  },
  {
    id: 'us-kenai-fjords',
    name: 'Kenai Fjords National Park',
    countryCode: 'US',
    stateCode: 'US-AK',
    lat: 59.8119,
    lon: -150.1063,
    established: 1980,
    area: 2710,
    description: 'Glaciers, fjords, and diverse marine wildlife'
  },
  {
    id: 'us-kobuk-valley',
    name: 'Kobuk Valley National Park',
    countryCode: 'US',
    stateCode: 'US-AK',
    lat: 67.3500,
    lon: -159.1167,
    established: 1980,
    area: 7084,
    description: 'Great Kobuk Sand Dunes and caribou migration'
  },
  {
    id: 'us-lake-clark',
    name: 'Lake Clark National Park',
    countryCode: 'US',
    stateCode: 'US-AK',
    lat: 60.4127,
    lon: -154.3227,
    established: 1980,
    area: 16308,
    description: 'Volcanoes, mountains, and pristine lakes'
  },
  {
    id: 'us-wrangell-st-elias',
    name: 'Wrangell-St. Elias National Park',
    countryCode: 'US',
    stateCode: 'US-AK',
    lat: 61.7103,
    lon: -142.9854,
    established: 1980,
    area: 53321,
    unesco: true,
    description: 'Largest national park in the US, massive glaciers and peaks'
  },

  // ARIZONA (3 parks)
  {
    id: 'us-grand-canyon',
    name: 'Grand Canyon National Park',
    countryCode: 'US',
    stateCode: 'US-AZ',
    lat: 36.1069,
    lon: -112.1129,
    established: 1919,
    area: 4862,
    unesco: true,
    description: 'Massive canyon carved by the Colorado River'
  },
  {
    id: 'us-petrified-forest',
    name: 'Petrified Forest National Park',
    countryCode: 'US',
    stateCode: 'US-AZ',
    lat: 34.9090,
    lon: -109.8067,
    established: 1962,
    area: 895,
    description: 'Ancient petrified wood and Painted Desert'
  },
  {
    id: 'us-saguaro',
    name: 'Saguaro National Park',
    countryCode: 'US',
    stateCode: 'US-AZ',
    lat: 32.2967,
    lon: -111.1666,
    established: 1994,
    area: 370,
    description: 'Giant saguaro cacti in the Sonoran Desert'
  },

  // ARKANSAS (1 park)
  {
    id: 'us-hot-springs',
    name: 'Hot Springs National Park',
    countryCode: 'US',
    stateCode: 'US-AR',
    lat: 34.5217,
    lon: -93.0424,
    established: 1921,
    area: 22,
    description: 'Historic thermal springs in the heart of a city'
  },

  // CALIFORNIA (9 parks)
  {
    id: 'us-channel-islands',
    name: 'Channel Islands National Park',
    countryCode: 'US',
    stateCode: 'US-CA',
    lat: 34.0069,
    lon: -119.7785,
    established: 1980,
    area: 1009,
    description: 'Five ecologically rich islands off the California coast'
  },
  {
    id: 'us-death-valley',
    name: 'Death Valley National Park',
    countryCode: 'US',
    stateCode: 'US-CA',
    lat: 36.5054,
    lon: -117.0794,
    established: 1994,
    area: 13650,
    description: 'Hottest, driest, and lowest national park'
  },
  {
    id: 'us-joshua-tree',
    name: 'Joshua Tree National Park',
    countryCode: 'US',
    stateCode: 'US-CA',
    lat: 33.8734,
    lon: -115.9010,
    established: 1994,
    area: 3196,
    description: 'Unique Joshua trees and desert landscape'
  },
  {
    id: 'us-kings-canyon',
    name: 'Kings Canyon National Park',
    countryCode: 'US',
    stateCode: 'US-CA',
    lat: 36.8879,
    lon: -118.5551,
    established: 1940,
    area: 1869,
    description: 'Deep canyons and giant sequoia groves'
  },
  {
    id: 'us-lassen-volcanic',
    name: 'Lassen Volcanic National Park',
    countryCode: 'US',
    stateCode: 'US-CA',
    lat: 40.4977,
    lon: -121.4207,
    established: 1916,
    area: 429,
    description: 'Active volcanic area with hydrothermal features'
  },
  {
    id: 'us-pinnacles',
    name: 'Pinnacles National Park',
    countryCode: 'US',
    stateCode: 'US-CA',
    lat: 36.4906,
    lon: -121.1825,
    established: 2013,
    area: 107,
    description: 'Rock formations from ancient volcanic field'
  },
  {
    id: 'us-redwood',
    name: 'Redwood National Park',
    countryCode: 'US',
    stateCode: 'US-CA',
    lat: 41.2132,
    lon: -124.0046,
    established: 1968,
    area: 562,
    unesco: true,
    description: 'Tallest trees on Earth, coastal redwoods'
  },
  {
    id: 'us-sequoia',
    name: 'Sequoia National Park',
    countryCode: 'US',
    stateCode: 'US-CA',
    lat: 36.4864,
    lon: -118.5658,
    established: 1890,
    area: 1635,
    description: 'Home to General Sherman, the world\'s largest tree'
  },
  {
    id: 'us-yosemite',
    name: 'Yosemite National Park',
    countryCode: 'US',
    stateCode: 'US-CA',
    lat: 37.8651,
    lon: -119.5383,
    established: 1890,
    area: 3083,
    unesco: true,
    description: 'Famous for granite cliffs, waterfalls, and giant sequoias'
  },

  // COLORADO (4 parks)
  {
    id: 'us-black-canyon',
    name: 'Black Canyon of the Gunnison National Park',
    countryCode: 'US',
    stateCode: 'US-CO',
    lat: 38.5754,
    lon: -107.7416,
    established: 1999,
    area: 124,
    description: 'Steep, narrow canyon with dramatic rock walls'
  },
  {
    id: 'us-great-sand-dunes',
    name: 'Great Sand Dunes National Park',
    countryCode: 'US',
    stateCode: 'US-CO',
    lat: 37.7916,
    lon: -105.5943,
    established: 2004,
    area: 343,
    description: 'North America\'s tallest sand dunes'
  },
  {
    id: 'us-mesa-verde',
    name: 'Mesa Verde National Park',
    countryCode: 'US',
    stateCode: 'US-CO',
    lat: 37.2309,
    lon: -108.4618,
    established: 1906,
    area: 211,
    unesco: true,
    description: 'Ancient Puebloan cliff dwellings'
  },
  {
    id: 'us-rocky-mountain',
    name: 'Rocky Mountain National Park',
    countryCode: 'US',
    stateCode: 'US-CO',
    lat: 40.3428,
    lon: -105.6836,
    established: 1915,
    area: 1076,
    description: 'High elevation peaks and alpine tundra'
  },

  // FLORIDA (3 parks)
  {
    id: 'us-biscayne',
    name: 'Biscayne National Park',
    countryCode: 'US',
    stateCode: 'US-FL',
    lat: 25.4824,
    lon: -80.2100,
    established: 1980,
    area: 700,
    description: 'Coral reefs and marine sanctuary near Miami'
  },
  {
    id: 'us-dry-tortugas',
    name: 'Dry Tortugas National Park',
    countryCode: 'US',
    stateCode: 'US-FL',
    lat: 24.6285,
    lon: -82.8732,
    established: 1992,
    area: 261,
    description: 'Remote islands with historic fort and coral reefs'
  },
  {
    id: 'us-everglades',
    name: 'Everglades National Park',
    countryCode: 'US',
    stateCode: 'US-FL',
    lat: 25.2866,
    lon: -80.8987,
    established: 1947,
    area: 6104,
    unesco: true,
    description: 'Largest tropical wilderness in the US'
  },

  // HAWAII (2 parks)
  {
    id: 'us-haleakala',
    name: 'Haleakalā National Park',
    countryCode: 'US',
    stateCode: 'US-HI',
    lat: 20.7204,
    lon: -156.1552,
    established: 1916,
    area: 134,
    description: 'Massive volcanic crater on Maui'
  },
  {
    id: 'us-hawaii-volcanoes',
    name: 'Hawaiʻi Volcanoes National Park',
    countryCode: 'US',
    stateCode: 'US-HI',
    lat: 19.4194,
    lon: -155.2885,
    established: 1916,
    area: 1348,
    unesco: true,
    description: 'Active volcanoes Kīlauea and Mauna Loa'
  },

  // INDIANA (1 park)
  {
    id: 'us-indiana-dunes',
    name: 'Indiana Dunes National Park',
    countryCode: 'US',
    stateCode: 'US-IN',
    lat: 41.6533,
    lon: -87.0524,
    established: 2019,
    area: 61,
    description: 'Sand dunes along Lake Michigan'
  },

  // KENTUCKY (1 park)
  {
    id: 'us-mammoth-cave',
    name: 'Mammoth Cave National Park',
    countryCode: 'US',
    stateCode: 'US-KY',
    lat: 37.1862,
    lon: -86.1000,
    established: 1941,
    area: 214,
    unesco: true,
    description: 'World\'s longest known cave system'
  },

  // MAINE (1 park)
  {
    id: 'us-acadia',
    name: 'Acadia National Park',
    countryCode: 'US',
    stateCode: 'US-ME',
    lat: 44.3386,
    lon: -68.2733,
    established: 1919,
    area: 198,
    description: 'Rocky coastline and woodland of the Atlantic'
  },

  // MICHIGAN (1 park)
  {
    id: 'us-isle-royale',
    name: 'Isle Royale National Park',
    countryCode: 'US',
    stateCode: 'US-MI',
    lat: 48.0081,
    lon: -88.5546,
    established: 1940,
    area: 2314,
    description: 'Remote island wilderness in Lake Superior'
  },

  // MINNESOTA (1 park)
  {
    id: 'us-voyageurs',
    name: 'Voyageurs National Park',
    countryCode: 'US',
    stateCode: 'US-MN',
    lat: 48.4839,
    lon: -92.8382,
    established: 1975,
    area: 883,
    description: 'Water-based park along the Canadian border'
  },

  // MISSOURI (1 park)
  {
    id: 'us-gateway-arch',
    name: 'Gateway Arch National Park',
    countryCode: 'US',
    stateCode: 'US-MO',
    lat: 38.6247,
    lon: -90.1848,
    established: 2018,
    area: 0.8,
    description: 'Iconic arch monument to westward expansion'
  },

  // MONTANA (2 parks)
  {
    id: 'us-glacier',
    name: 'Glacier National Park',
    countryCode: 'US',
    stateCode: 'US-MT',
    lat: 48.7596,
    lon: -113.7870,
    established: 1910,
    area: 4102,
    description: 'Pristine forests, alpine meadows, and glacial lakes'
  },
  {
    id: 'us-yellowstone',
    name: 'Yellowstone National Park',
    countryCode: 'US',
    stateCode: 'US-WY',
    lat: 44.4280,
    lon: -110.5885,
    established: 1872,
    area: 8983,
    unesco: true,
    description: 'First national park in the world, famous for geysers and wildlife'
  },

  // NEVADA (2 parks)
  {
    id: 'us-great-basin',
    name: 'Great Basin National Park',
    countryCode: 'US',
    stateCode: 'US-NV',
    lat: 38.9833,
    lon: -114.3000,
    established: 1986,
    area: 312,
    description: 'Ancient bristlecone pines and Lehman Caves'
  },

  // NEW MEXICO (2 parks)
  {
    id: 'us-carlsbad-caverns',
    name: 'Carlsbad Caverns National Park',
    countryCode: 'US',
    stateCode: 'US-NM',
    lat: 32.1479,
    lon: -104.5567,
    established: 1930,
    area: 189,
    unesco: true,
    description: 'Spectacular limestone caves with massive chambers'
  },
  {
    id: 'us-white-sands',
    name: 'White Sands National Park',
    countryCode: 'US',
    stateCode: 'US-NM',
    lat: 32.7872,
    lon: -106.3257,
    established: 2019,
    area: 587,
    description: 'World\'s largest gypsum dune field'
  },

  // NORTH CAROLINA (1 park)
  {
    id: 'us-great-smoky-mountains',
    name: 'Great Smoky Mountains National Park',
    countryCode: 'US',
    stateCode: 'US-NC',
    lat: 35.6118,
    lon: -83.4895,
    established: 1934,
    area: 2114,
    unesco: true,
    description: 'Most visited national park, ancient mountains and diverse forests'
  },

  // NORTH DAKOTA (1 park)
  {
    id: 'us-theodore-roosevelt',
    name: 'Theodore Roosevelt National Park',
    countryCode: 'US',
    stateCode: 'US-ND',
    lat: 46.9790,
    lon: -103.4501,
    established: 1978,
    area: 285,
    description: 'Badlands, wildlife, and TR\'s ranch cabin'
  },

  // OHIO (1 park)
  {
    id: 'us-cuyahoga-valley',
    name: 'Cuyahoga Valley National Park',
    countryCode: 'US',
    stateCode: 'US-OH',
    lat: 41.2808,
    lon: -81.5678,
    established: 2000,
    area: 133,
    description: 'Waterfalls, trails, and historic canal between Cleveland and Akron'
  },

  // OREGON (1 park)
  {
    id: 'us-crater-lake',
    name: 'Crater Lake National Park',
    countryCode: 'US',
    stateCode: 'US-OR',
    lat: 42.8684,
    lon: -122.1685,
    established: 1902,
    area: 741,
    description: 'Deepest lake in the US, formed in a volcanic crater'
  },

  // SOUTH CAROLINA (1 park)
  {
    id: 'us-congaree',
    name: 'Congaree National Park',
    countryCode: 'US',
    stateCode: 'US-SC',
    lat: 33.7948,
    lon: -80.7821,
    established: 2003,
    area: 107,
    description: 'Old-growth bottomland hardwood forest'
  },

  // SOUTH DAKOTA (2 parks)
  {
    id: 'us-badlands',
    name: 'Badlands National Park',
    countryCode: 'US',
    stateCode: 'US-SD',
    lat: 43.8554,
    lon: -102.3397,
    established: 1978,
    area: 982,
    description: 'Layered rock formations and fossil beds'
  },
  {
    id: 'us-wind-cave',
    name: 'Wind Cave National Park',
    countryCode: 'US',
    stateCode: 'US-SD',
    lat: 43.5710,
    lon: -103.4394,
    established: 1903,
    area: 137,
    description: 'One of the world\'s longest caves with boxwork formations'
  },

  // TENNESSEE (1 park - shared with NC, listed under NC)

  // TEXAS (2 parks)
  {
    id: 'us-big-bend',
    name: 'Big Bend National Park',
    countryCode: 'US',
    stateCode: 'US-TX',
    lat: 29.1275,
    lon: -103.2428,
    established: 1944,
    area: 3242,
    description: 'Desert landscape along the Rio Grande'
  },
  {
    id: 'us-guadalupe-mountains',
    name: 'Guadalupe Mountains National Park',
    countryCode: 'US',
    stateCode: 'US-TX',
    lat: 31.9230,
    lon: -104.8617,
    established: 1972,
    area: 349,
    description: 'Highest peak in Texas and fossil reef'
  },

  // UTAH (5 parks - "The Mighty 5")
  {
    id: 'us-arches',
    name: 'Arches National Park',
    countryCode: 'US',
    stateCode: 'US-UT',
    lat: 38.7331,
    lon: -109.5925,
    established: 1971,
    area: 310,
    description: 'Over 2,000 natural stone arches'
  },
  {
    id: 'us-bryce-canyon',
    name: 'Bryce Canyon National Park',
    countryCode: 'US',
    stateCode: 'US-UT',
    lat: 37.5930,
    lon: -112.1871,
    established: 1928,
    area: 145,
    description: 'Unique hoodoos and red rock formations'
  },
  {
    id: 'us-canyonlands',
    name: 'Canyonlands National Park',
    countryCode: 'US',
    stateCode: 'US-UT',
    lat: 38.3269,
    lon: -109.8783,
    established: 1964,
    area: 1366,
    description: 'Colorful canyons carved by the Colorado River'
  },
  {
    id: 'us-capitol-reef',
    name: 'Capitol Reef National Park',
    countryCode: 'US',
    stateCode: 'US-UT',
    lat: 38.0877,
    lon: -111.1676,
    established: 1971,
    area: 979,
    description: 'Waterpocket Fold, a geologic monocline'
  },
  {
    id: 'us-zion',
    name: 'Zion National Park',
    countryCode: 'US',
    stateCode: 'US-UT',
    lat: 37.2982,
    lon: -113.0263,
    established: 1919,
    area: 595,
    description: 'Red rock canyons and dramatic cliffs'
  },

  // US VIRGIN ISLANDS (1 park)
  {
    id: 'us-virgin-islands',
    name: 'Virgin Islands National Park',
    countryCode: 'US',
    stateCode: 'US-VI',
    lat: 18.3419,
    lon: -64.7490,
    established: 1956,
    area: 60,
    description: 'Tropical paradise with coral reefs and historic ruins'
  },

  // VIRGINIA (1 park)
  {
    id: 'us-shenandoah',
    name: 'Shenandoah National Park',
    countryCode: 'US',
    stateCode: 'US-VA',
    lat: 38.4754,
    lon: -78.4535,
    established: 1935,
    area: 806,
    description: 'Blue Ridge Mountains with Skyline Drive'
  },

  // WASHINGTON (3 parks)
  {
    id: 'us-mount-rainier',
    name: 'Mount Rainier National Park',
    countryCode: 'US',
    stateCode: 'US-WA',
    lat: 46.8800,
    lon: -121.7269,
    established: 1899,
    area: 956,
    description: 'Iconic volcanic peak with glaciers and wildflower meadows'
  },
  {
    id: 'us-north-cascades',
    name: 'North Cascades National Park',
    countryCode: 'US',
    stateCode: 'US-WA',
    lat: 48.7718,
    lon: -121.2985,
    established: 1968,
    area: 2043,
    description: 'Rugged mountains with over 300 glaciers'
  },
  {
    id: 'us-olympic',
    name: 'Olympic National Park',
    countryCode: 'US',
    stateCode: 'US-WA',
    lat: 47.8021,
    lon: -123.6044,
    established: 1938,
    area: 3734,
    unesco: true,
    description: 'Diverse ecosystems from rainforest to mountains'
  },

  // WEST VIRGINIA (1 park)
  {
    id: 'us-new-river-gorge',
    name: 'New River Gorge National Park',
    countryCode: 'US',
    stateCode: 'US-WV',
    lat: 37.9389,
    lon: -81.0629,
    established: 2020,
    area: 28,
    description: 'America\'s newest national park, deep river gorge'
  },

  // WYOMING (2 parks - Yellowstone listed under Montana, Grand Teton here)
  {
    id: 'us-grand-teton',
    name: 'Grand Teton National Park',
    countryCode: 'US',
    stateCode: 'US-WY',
    lat: 43.7904,
    lon: -110.6818,
    established: 1929,
    area: 1254,
    description: 'Dramatic Teton Range and Jackson Hole valley'
  },

  // AMERICAN SAMOA (1 park)
  {
    id: 'us-american-samoa',
    name: 'National Park of American Samoa',
    countryCode: 'AS',
    stateCode: 'AS',
    lat: -14.2581,
    lon: -170.6835,
    established: 1988,
    area: 36,
    description: 'Tropical rainforest and coral reefs in the South Pacific'
  },

  // ========== CANADA ==========
  {
    id: 'ca-banff',
    name: 'Banff National Park',
    countryCode: 'CA',
    stateCode: 'CA-AB',
    lat: 51.4968,
    lon: -115.9281,
    established: 1885,
    area: 6641,
    unesco: true,
    description: 'Canada\'s first national park with stunning Rocky Mountain scenery'
  },
  {
    id: 'ca-jasper',
    name: 'Jasper National Park',
    countryCode: 'CA',
    stateCode: 'CA-AB',
    lat: 52.8734,
    lon: -117.9543,
    established: 1907,
    area: 11000,
    unesco: true,
    description: 'Largest national park in the Canadian Rockies'
  },
  {
    id: 'ca-pacific-rim',
    name: 'Pacific Rim National Park',
    countryCode: 'CA',
    stateCode: 'CA-BC',
    lat: 48.9945,
    lon: -125.5427,
    established: 1970,
    area: 511,
    description: 'Rugged coastline and temperate rainforest'
  },
  {
    id: 'ca-yoho',
    name: 'Yoho National Park',
    countryCode: 'CA',
    stateCode: 'CA-BC',
    lat: 51.4000,
    lon: -116.5000,
    established: 1885,
    area: 1313,
    unesco: true,
    description: 'Waterfalls, glacial lakes, and Burgess Shale fossils'
  },
  {
    id: 'ca-kootenay',
    name: 'Kootenay National Park',
    countryCode: 'CA',
    stateCode: 'CA-BC',
    lat: 50.9000,
    lon: -116.0500,
    established: 1920,
    area: 1406,
    unesco: true,
    description: 'Hot springs and diverse ecosystems'
  },

  // ========== INDIA ==========
  {
    id: 'in-jim-corbett',
    name: 'Jim Corbett National Park',
    countryCode: 'IN',
    stateCode: 'IN-UT',
    lat: 29.5308,
    lon: 78.7748,
    established: 1936,
    area: 1288,
    description: 'India\'s oldest national park, famous for Bengal tigers'
  },
  {
    id: 'in-ranthambore',
    name: 'Ranthambore National Park',
    countryCode: 'IN',
    stateCode: 'IN-RJ',
    lat: 26.0173,
    lon: 76.5026,
    established: 1980,
    area: 392,
    description: 'Known for tiger sightings and ancient fort ruins'
  },
  {
    id: 'in-kaziranga',
    name: 'Kaziranga National Park',
    countryCode: 'IN',
    stateCode: 'IN-AS',
    lat: 26.5775,
    lon: 93.1711,
    established: 1974,
    area: 859,
    unesco: true,
    description: 'Home to two-thirds of the world\'s one-horned rhinoceros'
  },
  {
    id: 'in-kanha',
    name: 'Kanha National Park',
    countryCode: 'IN',
    stateCode: 'IN-MP',
    lat: 22.3344,
    lon: 80.6105,
    established: 1955,
    area: 940,
    description: 'Inspiration for Rudyard Kipling\'s The Jungle Book'
  },

  // ========== AUSTRALIA ==========
  {
    id: 'au-kakadu',
    name: 'Kakadu National Park',
    countryCode: 'AU',
    stateCode: 'AU-NT',
    lat: -12.6986,
    lon: 132.8819,
    established: 1979,
    area: 19804,
    unesco: true,
    description: 'Aboriginal rock art and diverse ecosystems'
  },
  {
    id: 'au-uluru',
    name: 'Uluru-Kata Tjuta National Park',
    countryCode: 'AU',
    stateCode: 'AU-NT',
    lat: -25.3444,
    lon: 131.0369,
    established: 1987,
    area: 1326,
    unesco: true,
    description: 'Sacred Aboriginal site featuring the iconic Uluru rock'
  },
  {
    id: 'au-great-barrier-reef',
    name: 'Great Barrier Reef Marine Park',
    countryCode: 'AU',
    stateCode: 'AU-QLD',
    lat: -18.2871,
    lon: 147.6992,
    established: 1975,
    area: 344400,
    unesco: true,
    description: 'World\'s largest coral reef system'
  },

  // ========== NEW ZEALAND ==========
  {
    id: 'nz-fiordland',
    name: 'Fiordland National Park',
    countryCode: 'NZ',
    lat: -45.4167,
    lon: 167.7167,
    established: 1952,
    area: 12500,
    unesco: true,
    description: 'Dramatic fiords, mountains, and rainforests'
  },
  {
    id: 'nz-tongariro',
    name: 'Tongariro National Park',
    countryCode: 'NZ',
    lat: -39.2903,
    lon: 175.5625,
    established: 1887,
    area: 796,
    unesco: true,
    description: 'Active volcanic landscape and cultural significance'
  },
  {
    id: 'nz-aoraki-mount-cook',
    name: 'Aoraki/Mount Cook National Park',
    countryCode: 'NZ',
    lat: -43.5950,
    lon: 170.1418,
    established: 1953,
    area: 707,
    unesco: true,
    description: 'New Zealand\'s highest peak and alpine landscapes'
  },

  // ========== AFRICA ==========
  {
    id: 'tz-serengeti',
    name: 'Serengeti National Park',
    countryCode: 'TZ',
    lat: -2.3333,
    lon: 34.8333,
    established: 1951,
    area: 14763,
    unesco: true,
    description: 'Famous for annual wildebeest migration'
  },
  {
    id: 'ke-maasai-mara',
    name: 'Maasai Mara National Reserve',
    countryCode: 'KE',
    lat: -1.5064,
    lon: 35.1440,
    established: 1961,
    area: 1510,
    description: 'Part of the Serengeti ecosystem, known for big cats'
  },
  {
    id: 'za-kruger',
    name: 'Kruger National Park',
    countryCode: 'ZA',
    lat: -23.9884,
    lon: 31.5547,
    established: 1926,
    area: 19485,
    description: 'One of Africa\'s largest game reserves'
  },
  {
    id: 'bw-chobe',
    name: 'Chobe National Park',
    countryCode: 'BW',
    lat: -18.7500,
    lon: 24.7500,
    established: 1968,
    area: 11700,
    description: 'Home to one of Africa\'s largest elephant populations'
  },

  // ========== SOUTH AMERICA ==========
  {
    id: 'br-iguazu',
    name: 'Iguazu National Park',
    countryCode: 'BR',
    lat: -25.6953,
    lon: -54.4367,
    established: 1939,
    area: 1852,
    unesco: true,
    description: 'Home to the magnificent Iguazu Falls'
  },
  {
    id: 'cl-torres-del-paine',
    name: 'Torres del Paine National Park',
    countryCode: 'CL',
    lat: -51.2500,
    lon: -73.0000,
    established: 1959,
    area: 2422,
    description: 'Dramatic mountains, glaciers, and lakes in Patagonia'
  },
  {
    id: 'ec-galapagos',
    name: 'Galápagos National Park',
    countryCode: 'EC',
    lat: -0.9538,
    lon: -90.9656,
    established: 1959,
    area: 7995,
    unesco: true,
    description: 'Unique volcanic islands with endemic species'
  },
  {
    id: 'ar-los-glaciares',
    name: 'Los Glaciares National Park',
    countryCode: 'AR',
    lat: -50.0000,
    lon: -73.0000,
    established: 1937,
    area: 7269,
    unesco: true,
    description: 'Perito Moreno Glacier and dramatic peaks'
  },

  // ========== EUROPE ==========
  {
    id: 'ch-swiss-national',
    name: 'Swiss National Park',
    countryCode: 'CH',
    lat: 46.6958,
    lon: 10.2181,
    established: 1914,
    area: 170,
    description: 'Switzerland\'s only national park, pristine Alpine wilderness'
  },
  {
    id: 'is-vatnajokull',
    name: 'Vatnajökull National Park',
    countryCode: 'IS',
    lat: 64.4167,
    lon: -16.7833,
    established: 2008,
    area: 14141,
    description: 'Europe\'s largest national park, featuring glaciers and volcanoes'
  },
  {
    id: 'no-jotunheimen',
    name: 'Jotunheimen National Park',
    countryCode: 'NO',
    lat: 61.5833,
    lon: 8.4167,
    established: 1980,
    area: 1151,
    description: 'Norway\'s highest mountains and glaciers'
  },
  {
    id: 'hr-plitvice',
    name: 'Plitvice Lakes National Park',
    countryCode: 'HR',
    lat: 44.8654,
    lon: 15.5820,
    established: 1949,
    area: 296,
    unesco: true,
    description: 'Cascading lakes and waterfalls in Croatia'
  },

  // ========== ASIA ==========
  {
    id: 'cn-zhangjiajie',
    name: 'Zhangjiajie National Forest Park',
    countryCode: 'CN',
    lat: 29.3255,
    lon: 110.4793,
    established: 1982,
    area: 130,
    unesco: true,
    description: 'Pillar-like rock formations that inspired Avatar'
  },
  {
    id: 'jp-fuji-hakone-izu',
    name: 'Fuji-Hakone-Izu National Park',
    countryCode: 'JP',
    lat: 35.3606,
    lon: 138.7274,
    established: 1936,
    area: 1227,
    description: 'Features iconic Mount Fuji and hot springs'
  },
  {
    id: 'th-khao-yai',
    name: 'Khao Yai National Park',
    countryCode: 'TH',
    lat: 14.4396,
    lon: 101.3716,
    established: 1962,
    area: 2168,
    unesco: true,
    description: 'Thailand\'s first national park with diverse wildlife'
  },
  {
    id: 'id-komodo',
    name: 'Komodo National Park',
    countryCode: 'ID',
    lat: -8.5458,
    lon: 119.4892,
    established: 1980,
    area: 1733,
    unesco: true,
    description: 'Home to the Komodo dragon, world\'s largest lizard'
  },
];

// Helper function to get parks by country
export function getParksByCountry(countryCode: string): NationalPark[] {
  return nationalParks.filter(park => park.countryCode === countryCode);
}

// Helper function to get parks by state
export function getParksByState(stateCode: string): NationalPark[] {
  return nationalParks.filter(park => park.stateCode === stateCode);
}

// Get US National Parks count
export function getUSParksCount(): number {
  return nationalParks.filter(park => park.countryCode === 'US' || park.countryCode === 'AS').length;
}

// Get UNESCO World Heritage Parks
export function getUNESCOParks(): NationalPark[] {
  return nationalParks.filter(park => park.unesco === true);
}
