/**
 * Visa-Based Access Data
 * Countries that grant visa-free or visa-on-arrival access based on holding specific visas
 *
 * This is particularly useful for countries with:
 * - US visa (H1B, B1/B2, etc.)
 * - Schengen visa
 * - UK visa
 * - Canada visa
 */

export interface VisaBasedAccessEntry {
  grantedBy: string; // Visa issuing country
  visaTypes?: string[]; // Specific visa types (optional, if all types qualify, leave empty)
  destinationCountry: string;
  accessType: 'visa-free' | 'visa-on-arrival' | 'eta';
  daysAllowed?: number;
  conditions?: string; // Additional requirements
  notes?: string;
}

/**
 * Countries that accept travelers with a valid US visa
 */
export const usVisaAccess: VisaBasedAccessEntry[] = [
  // H1B and other US visas grant access to these countries

  // LATIN AMERICA
  {
    grantedBy: 'United States',
    destinationCountry: 'Mexico',
    accessType: 'visa-free',
    daysAllowed: 180,
    conditions: 'Valid US visa (any type)',
    notes: 'Can enter Mexico for tourism/business with valid US visa'
  },
  {
    grantedBy: 'United States',
    destinationCountry: 'Costa Rica',
    accessType: 'visa-free',
    daysAllowed: 30,
    conditions: 'Valid US visa (B1/B2, H1B, etc.) and used at least once',
    notes: 'Must have used the US visa to enter the US at least once'
  },
  {
    grantedBy: 'United States',
    destinationCountry: 'Panama',
    accessType: 'visa-free',
    daysAllowed: 30,
    conditions: 'Valid US visa (used at least once)',
    notes: 'US visa must be valid and previously used'
  },
  {
    grantedBy: 'United States',
    destinationCountry: 'Dominican Republic',
    accessType: 'visa-free',
    daysAllowed: 30,
    conditions: 'Valid US visa',
    notes: 'Can enter with valid US visa'
  },
  {
    grantedBy: 'United States',
    destinationCountry: 'Colombia',
    accessType: 'visa-free',
    daysAllowed: 90,
    conditions: 'Valid US visa (any type)',
    notes: 'Can enter Colombia with valid US visa for tourism/business'
  },
  {
    grantedBy: 'United States',
    destinationCountry: 'Chile',
    accessType: 'visa-free',
    daysAllowed: 90,
    conditions: 'Valid US visa',
    notes: 'US visa holders exempt from Chilean visa'
  },
  {
    grantedBy: 'United States',
    destinationCountry: 'Peru',
    accessType: 'visa-free',
    daysAllowed: 183,
    conditions: 'Valid US visa (B1/B2, H1B, etc.) with at least 6 months validity',
    notes: 'US visa must have at least 6 months validity remaining'
  },
  {
    grantedBy: 'United States',
    destinationCountry: 'El Salvador',
    accessType: 'visa-free',
    daysAllowed: 90,
    conditions: 'Valid US visa',
    notes: 'CA-4 agreement country'
  },
  {
    grantedBy: 'United States',
    destinationCountry: 'Honduras',
    accessType: 'visa-free',
    daysAllowed: 90,
    conditions: 'Valid US visa',
    notes: 'CA-4 agreement country'
  },
  {
    grantedBy: 'United States',
    destinationCountry: 'Nicaragua',
    accessType: 'visa-free',
    daysAllowed: 90,
    conditions: 'Valid US visa',
    notes: 'CA-4 agreement country'
  },
  {
    grantedBy: 'United States',
    destinationCountry: 'Guatemala',
    accessType: 'visa-free',
    daysAllowed: 90,
    conditions: 'Valid US visa',
    notes: 'CA-4 agreement country'
  },

  // CARIBBEAN
  {
    grantedBy: 'United States',
    destinationCountry: 'Bermuda',
    accessType: 'visa-free',
    daysAllowed: 180,
    conditions: 'Valid US visa',
    notes: 'British Overseas Territory'
  },
  {
    grantedBy: 'United States',
    destinationCountry: 'Aruba',
    accessType: 'visa-free',
    daysAllowed: 30,
    conditions: 'Valid US visa',
    notes: 'Dutch Caribbean territory'
  },
  {
    grantedBy: 'United States',
    destinationCountry: 'Curacao',
    accessType: 'visa-free',
    daysAllowed: 30,
    conditions: 'Valid US visa',
    notes: 'Dutch Caribbean territory'
  },

  // ASIA
  {
    grantedBy: 'United States',
    destinationCountry: 'Philippines',
    accessType: 'visa-free',
    daysAllowed: 7,
    conditions: 'Valid US visa and ticket to US',
    notes: 'In transit to/from US only'
  },
  {
    grantedBy: 'United States',
    destinationCountry: 'South Korea',
    accessType: 'visa-free',
    daysAllowed: 30,
    conditions: 'Valid US visa, in transit to/from US',
    notes: 'Transit privilege for US visa holders'
  },
  {
    grantedBy: 'United States',
    destinationCountry: 'Singapore',
    accessType: 'visa-free',
    daysAllowed: 96,
    conditions: 'Valid US visa, in transit',
    notes: 'Visa Free Transit Facility (VFTF) - 96 hours'
  },
  {
    grantedBy: 'United States',
    destinationCountry: 'Turkey',
    accessType: 'visa-free',
    daysAllowed: 90,
    conditions: 'Valid US visa or residence permit',
    notes: 'Must hold valid US visa or permanent residence'
  },
  {
    grantedBy: 'United States',
    destinationCountry: 'Georgia',
    accessType: 'visa-free',
    daysAllowed: 90,
    conditions: 'Valid US visa',
    notes: 'Can enter Georgia with valid US visa'
  },
];

/**
 * Countries that accept travelers with a valid Schengen visa
 * Schengen Area: 27 countries in Europe
 */
export const schengenVisaAccess: VisaBasedAccessEntry[] = [
  // EUROPE (Non-Schengen)
  {
    grantedBy: 'Schengen',
    destinationCountry: 'Albania',
    accessType: 'visa-free',
    daysAllowed: 90,
    conditions: 'Valid multiple-entry Schengen visa',
    notes: 'Must have multiple-entry Schengen visa'
  },
  {
    grantedBy: 'Schengen',
    destinationCountry: 'Bosnia and Herzegovina',
    accessType: 'visa-free',
    daysAllowed: 90,
    conditions: 'Valid Schengen visa',
    notes: 'Can stay for duration of Schengen visa validity'
  },
  {
    grantedBy: 'Schengen',
    destinationCountry: 'Bulgaria',
    accessType: 'visa-free',
    daysAllowed: 90,
    conditions: 'Valid Schengen visa',
    notes: 'Bulgaria is joining Schengen but currently separate'
  },
  {
    grantedBy: 'Schengen',
    destinationCountry: 'Croatia',
    accessType: 'visa-free',
    daysAllowed: 90,
    conditions: 'Valid Schengen visa',
    notes: 'Croatia joined Schengen in 2023'
  },
  {
    grantedBy: 'Schengen',
    destinationCountry: 'Cyprus',
    accessType: 'visa-free',
    daysAllowed: 90,
    conditions: 'Valid Schengen visa',
    notes: 'Not part of Schengen but accepts Schengen visas'
  },
  {
    grantedBy: 'Schengen',
    destinationCountry: 'Romania',
    accessType: 'visa-free',
    daysAllowed: 90,
    conditions: 'Valid Schengen visa',
    notes: 'Romania is joining Schengen but currently separate'
  },
  {
    grantedBy: 'Schengen',
    destinationCountry: 'Kosovo',
    accessType: 'visa-free',
    daysAllowed: 15,
    conditions: 'Valid multiple-entry Schengen visa',
    notes: 'Must have multiple-entry visa'
  },
  {
    grantedBy: 'Schengen',
    destinationCountry: 'Montenegro',
    accessType: 'visa-free',
    daysAllowed: 30,
    conditions: 'Valid Schengen visa',
    notes: 'Can stay during Schengen visa validity'
  },
  {
    grantedBy: 'Schengen',
    destinationCountry: 'North Macedonia',
    accessType: 'visa-free',
    daysAllowed: 15,
    conditions: 'Valid Schengen visa',
    notes: 'Up to 15 days'
  },
  {
    grantedBy: 'Schengen',
    destinationCountry: 'Serbia',
    accessType: 'visa-free',
    daysAllowed: 90,
    conditions: 'Valid Schengen visa',
    notes: 'Can stay during Schengen visa validity'
  },

  // MIDDLE EAST
  {
    grantedBy: 'Schengen',
    destinationCountry: 'Turkey',
    accessType: 'visa-free',
    daysAllowed: 90,
    conditions: 'Valid Schengen visa',
    notes: 'Must hold valid Schengen visa or residence permit'
  },

  // LATIN AMERICA
  {
    grantedBy: 'Schengen',
    destinationCountry: 'Colombia',
    accessType: 'visa-free',
    daysAllowed: 90,
    conditions: 'Valid Schengen visa (Type C)',
    notes: 'Schengen short-stay visa (Type C) holders exempt'
  },
  {
    grantedBy: 'Schengen',
    destinationCountry: 'Mexico',
    accessType: 'visa-free',
    daysAllowed: 180,
    conditions: 'Valid Schengen visa',
    notes: 'Can enter Mexico with valid Schengen visa'
  },
  {
    grantedBy: 'Schengen',
    destinationCountry: 'Panama',
    accessType: 'visa-free',
    daysAllowed: 30,
    conditions: 'Valid Schengen visa (used at least once)',
    notes: 'Must have used Schengen visa at least once'
  },
  {
    grantedBy: 'Schengen',
    destinationCountry: 'Peru',
    accessType: 'visa-free',
    daysAllowed: 183,
    conditions: 'Valid Schengen visa with at least 6 months validity',
    notes: 'Must have at least 6 months validity'
  },

  // ASIA
  {
    grantedBy: 'Schengen',
    destinationCountry: 'Georgia',
    accessType: 'visa-free',
    daysAllowed: 90,
    conditions: 'Valid Schengen visa',
    notes: 'Can enter Georgia with valid Schengen visa'
  },
  {
    grantedBy: 'Schengen',
    destinationCountry: 'Philippines',
    accessType: 'visa-free',
    daysAllowed: 7,
    conditions: 'Valid Schengen visa and ticket to Schengen',
    notes: 'In transit only'
  },
];

/**
 * Countries that accept travelers with a valid UK visa
 */
export const ukVisaAccess: VisaBasedAccessEntry[] = [
  {
    grantedBy: 'United Kingdom',
    destinationCountry: 'Ireland',
    accessType: 'visa-free',
    daysAllowed: 90,
    conditions: 'Valid UK visa, traveling from UK',
    notes: 'Common Travel Area - must arrive from UK'
  },
  {
    grantedBy: 'United Kingdom',
    destinationCountry: 'Gibraltar',
    accessType: 'visa-free',
    daysAllowed: 90,
    conditions: 'Valid UK visa',
    notes: 'British Overseas Territory'
  },
];

/**
 * Countries that accept travelers with a valid Canada visa
 */
export const canadaVisaAccess: VisaBasedAccessEntry[] = [
  {
    grantedBy: 'Canada',
    destinationCountry: 'Mexico',
    accessType: 'visa-free',
    daysAllowed: 180,
    conditions: 'Valid Canadian visa',
    notes: 'Can enter Mexico with valid Canadian visa'
  },
  {
    grantedBy: 'Canada',
    destinationCountry: 'Costa Rica',
    accessType: 'visa-free',
    daysAllowed: 30,
    conditions: 'Valid Canadian visa',
    notes: 'Canadian visa must be valid'
  },
  {
    grantedBy: 'Canada',
    destinationCountry: 'Panama',
    accessType: 'visa-free',
    daysAllowed: 30,
    conditions: 'Valid Canadian visa (used at least once)',
    notes: 'Must have used visa at least once'
  },
  {
    grantedBy: 'Canada',
    destinationCountry: 'Peru',
    accessType: 'visa-free',
    daysAllowed: 183,
    conditions: 'Valid Canadian visa with at least 6 months validity',
    notes: 'Must have at least 6 months validity'
  },
];

/**
 * All visa-based access entries combined
 */
export const allVisaBasedAccess: VisaBasedAccessEntry[] = [
  ...usVisaAccess,
  ...schengenVisaAccess,
  ...ukVisaAccess,
  ...canadaVisaAccess,
];

/**
 * Get additional access granted by a specific visa
 */
export function getAccessByVisa(visaCountry: string): VisaBasedAccessEntry[] {
  // Normalize country name
  const normalized = visaCountry.trim();

  // Check for Schengen countries
  const schengenCountries = [
    'Austria', 'Belgium', 'Croatia', 'Czech Republic', 'Denmark', 'Estonia',
    'Finland', 'France', 'Germany', 'Greece', 'Hungary', 'Iceland', 'Italy',
    'Latvia', 'Lithuania', 'Luxembourg', 'Malta', 'Netherlands', 'Norway',
    'Poland', 'Portugal', 'Slovakia', 'Slovenia', 'Spain', 'Sweden', 'Switzerland'
  ];

  if (schengenCountries.includes(normalized)) {
    return schengenVisaAccess;
  }

  if (normalized === 'United States') {
    return usVisaAccess;
  }

  if (normalized === 'United Kingdom') {
    return ukVisaAccess;
  }

  if (normalized === 'Canada') {
    return canadaVisaAccess;
  }

  return [];
}

/**
 * Get all countries accessible with user's visas
 */
export function getAdditionalAccessFromVisas(visaCountries: string[]): {
  country: string;
  accessType: 'visa-free' | 'visa-on-arrival' | 'eta';
  daysAllowed?: number;
  viaVisa: string;
  conditions?: string;
}[] {
  const accessMap = new Map<string, {
    country: string;
    accessType: 'visa-free' | 'visa-on-arrival' | 'eta';
    daysAllowed?: number;
    viaVisa: string;
    conditions?: string;
  }>();

  visaCountries.forEach(visaCountry => {
    const access = getAccessByVisa(visaCountry);
    access.forEach(entry => {
      // Only add if not already in map or if this entry is better
      const existing = accessMap.get(entry.destinationCountry);
      if (!existing || (entry.daysAllowed && (!existing.daysAllowed || entry.daysAllowed > existing.daysAllowed))) {
        accessMap.set(entry.destinationCountry, {
          country: entry.destinationCountry,
          accessType: entry.accessType,
          daysAllowed: entry.daysAllowed,
          viaVisa: visaCountry,
          conditions: entry.conditions,
        });
      }
    });
  });

  return Array.from(accessMap.values());
}
