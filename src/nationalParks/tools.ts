/**
 * National Parks AI Tools
 *
 * AI tools for national parks (search, get info, track visits, plan visits)
 */

import type { Tool, ToolDefinition, ToolResult } from '@/lib/ai/toolRegistry';
import { nationalParks, type NationalPark } from '@/travel/data/nationalParks';
import { travelAPI } from '@/travel/data';
import { logger } from '@/services/logger';

// =====================================================
// TOOL DEFINITIONS
// =====================================================

const searchParksDefinition: ToolDefinition = {
  type: 'function',
  function: {
    name: 'search_parks',
    description: 'Search for national parks by name, state, or features. Optional: search_query (string to search in name/description), state (state code like "US-CA"), country (country code like "US"), features (array of features like ["mountains", "glaciers"]).',
    parameters: {
      type: 'object',
      properties: {
        search_query: {
          type: 'string',
          description: 'Search query to match in park name or description - optional'
        },
        state: {
          type: 'string',
          description: 'State code (e.g., "US-CA", "US-AK") - optional'
        },
        country: {
          type: 'string',
          description: 'Country code (e.g., "US", "CA") - optional, defaults to "US"'
        },
        features: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array of features to search for - optional'
        }
      }
    }
  }
};

const getParkInfoDefinition: ToolDefinition = {
  type: 'function',
  function: {
    name: 'get_park_info',
    description: 'Get detailed information about a specific national park. Requires park_id (string) or park_name (string).',
    parameters: {
      type: 'object',
      properties: {
        park_id: {
          type: 'string',
          description: 'Park ID (e.g., "us-yosemite") - optional if park_name provided'
        },
        park_name: {
          type: 'string',
          description: 'Park name (e.g., "Yosemite") - optional if park_id provided'
        }
      }
    }
  }
};

const addVisitedParkDefinition: ToolDefinition = {
  type: 'function',
  function: {
    name: 'add_visited_park',
    description: 'Mark a national park as visited. Requires park_id (string) or park_name (string). Optional: visit_date (string), notes (string), status ("visited", "wishlist", "transit").',
    parameters: {
      type: 'object',
      properties: {
        park_id: {
          type: 'string',
          description: 'Park ID (e.g., "us-yosemite") - optional if park_name provided'
        },
        park_name: {
          type: 'string',
          description: 'Park name (e.g., "Yosemite") - optional if park_id provided'
        },
        visit_date: {
          type: 'string',
          description: 'Visit date in ISO format (YYYY-MM-DD) - optional'
        },
        notes: {
          type: 'string',
          description: 'Notes about the visit - optional'
        },
        status: {
          type: 'string',
          enum: ['visited', 'wishlist', 'transit'],
          description: 'Visit status - optional, defaults to "visited"'
        }
      }
    }
  }
};

const getVisitedParksDefinition: ToolDefinition = {
  type: 'function',
  function: {
    name: 'get_visited_parks',
    description: 'Get all visited national parks. Optional: status (string - "visited", "wishlist", "transit"), country (string - country code).',
    parameters: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          enum: ['visited', 'wishlist', 'transit'],
          description: 'Filter by visit status - optional'
        },
        country: {
          type: 'string',
          description: 'Filter by country code (e.g., "US") - optional'
        }
      }
    }
  }
};

const planParkVisitDefinition: ToolDefinition = {
  type: 'function',
  function: {
    name: 'plan_park_visit',
    description: 'Get recommendations and planning information for visiting a national park. Requires park_id (string) or park_name (string). Optional: trip_duration_days (number), season (string).',
    parameters: {
      type: 'object',
      properties: {
        park_id: {
          type: 'string',
          description: 'Park ID (e.g., "us-yosemite") - optional if park_name provided'
        },
        park_name: {
          type: 'string',
          description: 'Park name (e.g., "Yosemite") - optional if park_id provided'
        },
        trip_duration_days: {
          type: 'number',
          description: 'Planned trip duration in days - optional, defaults to 3'
        },
        season: {
          type: 'string',
          description: 'Season of visit (spring, summer, fall, winter) - optional'
        }
      }
    }
  }
};

// =====================================================
// HELPER FUNCTIONS
// =====================================================

/**
 * Find park by ID or name (case-insensitive)
 */
function findPark(parkId?: string, parkName?: string): NationalPark | null {
  if (parkId) {
    const park = nationalParks.find(p => p.id.toLowerCase() === parkId.toLowerCase());
    if (park) return park;
  }

  if (parkName) {
    const park = nationalParks.find(p =>
      p.name.toLowerCase().includes(parkName.toLowerCase())
    );
    if (park) return park;
  }

  return null;
}

/**
 * Format park for response
 */
function formatPark(park: NationalPark) {
  return {
    id: park.id,
    name: park.name,
    country: park.countryCode,
    state: park.stateCode,
    coordinates: {
      latitude: park.lat,
      longitude: park.lon
    },
    established: park.established,
    area_km2: park.area,
    description: park.description,
    unesco_site: park.unesco ?? false
  };
}

/**
 * Generate visit recommendations
 */
function generateRecommendations(park: NationalPark, duration: number, season?: string): string[] {
  const recommendations: string[] = [];

  // Duration-based recommendations
  if (duration === 1) {
    recommendations.push('Plan for a quick one-day visit focusing on main highlights');
    recommendations.push('Arrive early to make the most of your day');
  } else if (duration <= 3) {
    recommendations.push('Spend 2-3 days to see major attractions and hike popular trails');
    recommendations.push('Book accommodations inside or near the park');
  } else {
    recommendations.push('With ' + duration + ' days, you can explore both popular and remote areas');
    recommendations.push('Consider backcountry camping for a deeper experience');
  }

  // Season-based recommendations
  if (season) {
    const s = season.toLowerCase();
    if (s === 'summer') {
      recommendations.push('Summer: Expect crowds, book early. Best weather for hiking.');
    } else if (s === 'winter') {
      recommendations.push('Winter: Fewer crowds, some roads may be closed. Check conditions.');
    } else if (s === 'spring') {
      recommendations.push('Spring: Wildflowers blooming, waterfalls at peak flow.');
    } else if (s === 'fall') {
      recommendations.push('Fall: Beautiful colors, moderate crowds, pleasant temperatures.');
    }
  }

  // Park-specific
  if (park.unesco) {
    recommendations.push('This is a UNESCO World Heritage Site - extra special!');
  }

  if (park.area && park.area > 10000) {
    recommendations.push('This is a very large park - prioritize areas you want to see most');
  }

  return recommendations;
}

// =====================================================
// TOOL IMPLEMENTATIONS
// =====================================================

/**
 * Search for national parks
 */
async function executeSearchParks(
  args: Record<string, unknown>,
  _userId: string
): Promise<ToolResult> {
  try {
    const searchQuery = args.search_query as string | undefined;
    const state = args.state as string | undefined;
    const country = (args.country as string | undefined) ?? 'US';
    const features = args.features as string[] | undefined;

    logger.info('NationalParksTools', 'Searching parks', {
      hasSearchQuery: !!searchQuery,
      state,
      country,
      featuresCount: features?.length ?? 0
    });

    let results = nationalParks.filter(park => park.countryCode === country);

    // Filter by state
    if (state) {
      results = results.filter(park => park.stateCode === state);
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      results = results.filter(park =>
        park.name.toLowerCase().includes(query) ||
        park.description?.toLowerCase().includes(query)
      );
    }

    // Filter by features (basic search in description)
    if (features && features.length > 0) {
      results = results.filter(park => {
        const desc = park.description?.toLowerCase() ?? '';
        return features.some(feature => desc.includes(feature.toLowerCase()));
      });
    }

    logger.info('NationalParksTools', 'Parks search completed', {
      resultsCount: results.length
    });

    return {
      success: true,
      parks: results.map(formatPark),
      count: results.length,
      message: `Found ${results.length} park${results.length !== 1 ? 's' : ''}`
    };
  } catch (error) {
    logger.error('NationalParksTools', error as Error, {
      operation: 'search_parks',
      args
    });

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to search parks'
    };
  }
}

/**
 * Get park information
 */
async function executeGetParkInfo(
  args: Record<string, unknown>,
  _userId: string
): Promise<ToolResult> {
  try {
    const parkId = args.park_id as string | undefined;
    const parkName = args.park_name as string | undefined;

    // Validate
    if (!parkId && !parkName) {
      return {
        success: false,
        error: 'Either park_id or park_name is required'
      };
    }

    logger.info('NationalParksTools', 'Getting park info', {
      parkId,
      parkName
    });

    const park = findPark(parkId, parkName);
    if (!park) {
      return {
        success: false,
        error: `Park not found: ${parkId ?? parkName}`
      };
    }

    logger.info('NationalParksTools', 'Park info retrieved', {
      parkId: park.id,
      parkName: park.name
    });

    return {
      success: true,
      park: formatPark(park),
      message: `Information for ${park.name}`
    };
  } catch (error) {
    logger.error('NationalParksTools', error as Error, {
      operation: 'get_park_info',
      args
    });

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get park info'
    };
  }
}

/**
 * Add visited park
 */
async function executeAddVisitedPark(
  args: Record<string, unknown>,
  _userId: string
): Promise<ToolResult> {
  try {
    const parkId = args.park_id as string | undefined;
    const parkName = args.park_name as string | undefined;
    const visitDate = args.visit_date as string | undefined;
    const notes = args.notes as string | undefined;
    const status = (args.status as 'visited' | 'wishlist' | 'transit' | undefined) ?? 'visited';

    // Validate
    if (!parkId && !parkName) {
      return {
        success: false,
        error: 'Either park_id or park_name is required'
      };
    }

    const park = findPark(parkId, parkName);
    if (!park) {
      return {
        success: false,
        error: `Park not found: ${parkId ?? parkName}`
      };
    }

    logger.info('NationalParksTools', 'Adding visited park', {
      parkId: park.id,
      parkName: park.name,
      status
    });

    // Mark location as visited using travel API
    const location = await travelAPI.markLocation({
      locationType: 'national_park',
      countryCode: park.countryCode,
      countryName: park.countryCode === 'US' ? 'United States' : park.countryCode,
      stateCode: park.stateCode,
      nationalParkId: park.id,
      nationalParkName: park.name,
      status,
      visitDate: visitDate ? new Date(visitDate) : new Date(),
      notes
    });

    logger.info('NationalParksTools', 'Park marked as visited', {
      locationId: location.id,
      parkId: park.id
    });

    return {
      success: true,
      message: `${park.name} marked as ${status}`,
      park: formatPark(park),
      location_id: location.id
    };
  } catch (error) {
    logger.error('NationalParksTools', error as Error, {
      operation: 'add_visited_park',
      args
    });

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to add visited park'
    };
  }
}

/**
 * Get visited parks
 */
async function executeGetVisitedParks(
  args: Record<string, unknown>,
  _userId: string
): Promise<ToolResult> {
  try {
    const status = args.status as 'visited' | 'wishlist' | 'transit' | undefined;
    const country = args.country as string | undefined;

    logger.info('NationalParksTools', 'Getting visited parks', {
      status,
      country
    });

    // Get all visited locations of type national_park
    const visitedLocations = await travelAPI.listVisitedLocations();
    let parkLocations = visitedLocations.filter(loc => loc.locationType === 'national_park');

    // Apply filters
    if (status) {
      parkLocations = parkLocations.filter(loc => loc.status === status);
    }
    if (country) {
      parkLocations = parkLocations.filter(loc => loc.countryCode === country);
    }

    // Enrich with park details
    const visitedParks = parkLocations.map(loc => {
      const park = nationalParks.find(p => p.id === loc.nationalParkId);
      return {
        location_id: loc.id,
        park: park ? formatPark(park) : null,
        status: loc.status,
        visit_date: loc.visitDate,
        notes: loc.notes
      };
    }).filter(v => v.park !== null);

    logger.info('NationalParksTools', 'Visited parks retrieved', {
      count: visitedParks.length
    });

    return {
      success: true,
      visited_parks: visitedParks,
      count: visitedParks.length,
      message: `You have ${visitedParks.length} ${status ?? 'total'} park${visitedParks.length !== 1 ? 's' : ''}`
    };
  } catch (error) {
    logger.error('NationalParksTools', error as Error, {
      operation: 'get_visited_parks',
      args
    });

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get visited parks'
    };
  }
}

/**
 * Plan park visit
 */
async function executePlanParkVisit(
  args: Record<string, unknown>,
  _userId: string
): Promise<ToolResult> {
  try {
    const parkId = args.park_id as string | undefined;
    const parkName = args.park_name as string | undefined;
    const tripDuration = (args.trip_duration_days as number | undefined) ?? 3;
    const season = args.season as string | undefined;

    // Validate
    if (!parkId && !parkName) {
      return {
        success: false,
        error: 'Either park_id or park_name is required'
      };
    }

    const park = findPark(parkId, parkName);
    if (!park) {
      return {
        success: false,
        error: `Park not found: ${parkId ?? parkName}`
      };
    }

    logger.info('NationalParksTools', 'Planning park visit', {
      parkId: park.id,
      parkName: park.name,
      tripDuration,
      season
    });

    const recommendations = generateRecommendations(park, tripDuration, season);

    logger.info('NationalParksTools', 'Park visit plan generated', {
      parkId: park.id,
      recommendationsCount: recommendations.length
    });

    return {
      success: true,
      park: formatPark(park),
      trip_duration_days: tripDuration,
      season,
      recommendations,
      message: `Visit plan for ${park.name} (${tripDuration} day${tripDuration !== 1 ? 's' : ''})`
    };
  } catch (error) {
    logger.error('NationalParksTools', error as Error, {
      operation: 'plan_park_visit',
      args
    });

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to plan park visit'
    };
  }
}

// =====================================================
// EXPORTED TOOLS
// =====================================================

export const nationalParksTools: Tool[] = [
  {
    definition: searchParksDefinition,
    execute: executeSearchParks
  },
  {
    definition: getParkInfoDefinition,
    execute: executeGetParkInfo
  },
  {
    definition: addVisitedParkDefinition,
    execute: executeAddVisitedPark
  },
  {
    definition: getVisitedParksDefinition,
    execute: executeGetVisitedParks
  },
  {
    definition: planParkVisitDefinition,
    execute: executePlanParkVisit
  }
];
