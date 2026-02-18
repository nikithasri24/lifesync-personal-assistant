/**
 * Zod Schemas for Travel Module Validation
 *
 * These schemas validate travel tracking data including visited locations,
 * passports, visas, and travel access information.
 */

import { z } from 'zod';
import { logger } from '@/services/logger';

// ==================== Common Schemas ====================

/**
 * ISO 3166-1 alpha-2 country code (e.g., 'US', 'FR', 'JP')
 */
export const CountryCodeSchema = z.string()
  .length(2, 'Country code must be 2 characters')
  .regex(/^[A-Z]{2}$/, 'Country code must be uppercase letters')
  .refine(
    (code) => code !== 'XX' && code !== 'ZZ',
    { message: 'Invalid country code' }
  );

/**
 * ISO date string (YYYY-MM-DD)
 */
export const ISODateSchema = z.string().refine(
  (val) => !isNaN(Date.parse(val)) && /^\d{4}-\d{2}-\d{2}/.test(val),
  { message: 'Invalid ISO date string' }
);

/**
 * UUID v4 format
 */
export const UUIDSchema = z.string().uuid('Invalid UUID format');

// ==================== Enum Schemas ====================

/**
 * Location type classification
 */
export const LocationTypeSchema = z.enum([
  'country',
  'state',
  'city',
  'region',
  'national_park',
  'island',
]);

export type LocationType = z.infer<typeof LocationTypeSchema>;

/**
 * Visit status classification
 */
export const VisitStatusSchema = z.enum([
  'visited',
  'lived',
  'transit',
  'wishlist',
]);

export type VisitStatus = z.infer<typeof VisitStatusSchema>;

/**
 * Visa requirement types
 */
export const VisaRequirementSchema = z.enum([
  'visa-free',
  'visa-on-arrival',
  'eta',
  'e-visa',
  'visa-required',
  'no-admission',
]);

export type VisaRequirement = z.infer<typeof VisaRequirementSchema>;

/**
 * Location visit category for collaborative tracking
 */
export const LocationVisitCategorySchema = z.enum(['mine', 'partner', 'both']);

export type LocationVisitCategory = z.infer<typeof LocationVisitCategorySchema>;

// ==================== Visited Location Schema ====================

/**
 * Base schema for visited location data (without refinements)
 */
const VisitedLocationBaseSchema = z.object({
  id: UUIDSchema,
  userId: UUIDSchema.nullable().optional(),
  connectionId: UUIDSchema.nullable().optional(),
  visitedBy: z.array(UUIDSchema).optional(),

  // Location details
  locationType: LocationTypeSchema,
  countryCode: CountryCodeSchema,
  countryName: z.string()
    .min(2, 'Country name must be at least 2 characters')
    .max(100, 'Country name is too long'),
  stateCode: z.string()
    .max(10, 'State code is too long')
    .optional(),
  stateName: z.string()
    .max(100, 'State name is too long')
    .optional(),
  cityName: z.string()
    .max(100, 'City name is too long')
    .optional(),
  regionName: z.string()
    .max(100, 'Region name is too long')
    .optional(),
  islandName: z.string()
    .max(100, 'Island name is too long')
    .optional(),
  nationalParkId: z.string()
    .max(50, 'National park ID is too long')
    .optional(),
  nationalParkName: z.string()
    .max(100, 'National park name is too long')
    .optional(),

  // Visit info
  status: VisitStatusSchema,
  firstVisitDate: ISODateSchema.optional(),
  lastVisitDate: ISODateSchema.optional(),
  visitCount: z.number()
    .int('Visit count must be a whole number')
    .nonnegative('Visit count cannot be negative')
    .max(10000, 'Visit count is unreasonably high'),
  totalDays: z.number()
    .int('Total days must be a whole number')
    .nonnegative('Total days cannot be negative')
    .max(100000, 'Total days is unreasonably high')
    .optional(),

  // Notes and ratings
  notes: z.string()
    .max(5000, 'Notes are too long')
    .optional(),
  rating: z.number()
    .int('Rating must be a whole number')
    .min(1, 'Rating must be between 1 and 5')
    .max(5, 'Rating must be between 1 and 5')
    .optional(),
  favoritePlace: z.boolean().optional(),

  // Timestamps
  createdAt: ISODateSchema,
  updatedAt: ISODateSchema,
});

/**
 * Schema for validating visited location data with date validation
 */
export const VisitedLocationSchema = VisitedLocationBaseSchema.refine(
  (data) => {
    // If lastVisitDate is provided, it must be >= firstVisitDate
    if (data.firstVisitDate && data.lastVisitDate) {
      return new Date(data.lastVisitDate) >= new Date(data.firstVisitDate);
    }
    return true;
  },
  { message: 'Last visit date must be after or equal to first visit date' }
);

export type ValidatedVisitedLocation = z.infer<typeof VisitedLocationSchema>;

/**
 * Schema for visited location input (without system fields)
 */
export const VisitedLocationInputSchema = VisitedLocationBaseSchema.omit({
  id: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
}).refine(
  (data) => {
    // If lastVisitDate is provided, it must be >= firstVisitDate
    if (data.firstVisitDate && data.lastVisitDate) {
      return new Date(data.lastVisitDate) >= new Date(data.firstVisitDate);
    }
    return true;
  },
  { message: 'Last visit date must be after or equal to first visit date' }
);

export type ValidatedVisitedLocationInput = z.infer<typeof VisitedLocationInputSchema>;

/**
 * Schema for visited location updates (all fields optional except id)
 */
export const VisitedLocationUpdateSchema = VisitedLocationBaseSchema.partial().required({ id: true });

export type ValidatedVisitedLocationUpdate = z.infer<typeof VisitedLocationUpdateSchema>;

// ==================== Categorized Location Schema ====================

/**
 * Schema for categorized location (with visit category)
 */
export const CategorizedLocationSchema = VisitedLocationBaseSchema.extend({
  visitCategory: LocationVisitCategorySchema,
}).refine(
  (data) => {
    // If lastVisitDate is provided, it must be >= firstVisitDate
    if (data.firstVisitDate && data.lastVisitDate) {
      return new Date(data.lastVisitDate) >= new Date(data.firstVisitDate);
    }
    return true;
  },
  { message: 'Last visit date must be after or equal to first visit date' }
);

export type ValidatedCategorizedLocation = z.infer<typeof CategorizedLocationSchema>;

// ==================== Visa Access Schema ====================

/**
 * Schema for visa access information
 */
export const VisaAccessSchema = z.object({
  destinationCountry: CountryCodeSchema,
  requirement: VisaRequirementSchema,
  daysAllowed: z.number()
    .int('Days allowed must be a whole number')
    .min(0, 'Days allowed cannot be negative')
    .max(365, 'Days allowed is unreasonably high')
    .optional(),
  notes: z.string()
    .max(500, 'Notes are too long')
    .optional(),
});

export type ValidatedVisaAccess = z.infer<typeof VisaAccessSchema>;

// ==================== Passport Data Schema ====================

/**
 * Schema for passport data (visa-free access information)
 */
export const PassportDataSchema = z.object({
  countryCode: CountryCodeSchema,
  countryName: z.string()
    .min(2, 'Country name must be at least 2 characters')
    .max(100, 'Country name is too long'),
  rank: z.number()
    .int('Rank must be a whole number')
    .positive('Rank must be positive')
    .max(250, 'Rank is unreasonably high')
    .optional(),
  visaFreeScore: z.number()
    .int('Visa-free score must be a whole number')
    .nonnegative('Visa-free score cannot be negative')
    .max(250, 'Visa-free score is unreasonably high')
    .optional(),
  visaFreeAccess: z.array(VisaAccessSchema),
});

export type ValidatedPassportData = z.infer<typeof PassportDataSchema>;

// ==================== User Visa Schema ====================

/**
 * Base schema for user visa records (without refinements)
 */
const UserVisaBaseSchema = z.object({
  id: UUIDSchema,
  userId: UUIDSchema,
  countryCode: CountryCodeSchema,
  countryName: z.string()
    .min(2, 'Country name must be at least 2 characters')
    .max(100, 'Country name is too long'),
  visaType: z.string()
    .min(1, 'Visa type is required')
    .max(50, 'Visa type is too long'),
  issueDate: ISODateSchema,
  expiryDate: ISODateSchema,
  multipleEntry: z.boolean(),
  maxStayDays: z.number()
    .int('Max stay days must be a whole number')
    .positive('Max stay days must be positive')
    .max(365, 'Max stay days is unreasonably high')
    .optional(),
  notes: z.string()
    .max(1000, 'Notes are too long')
    .optional(),
  createdAt: ISODateSchema,
  updatedAt: ISODateSchema,
});

/**
 * Schema for user visa records with date validation
 */
export const UserVisaSchema = UserVisaBaseSchema.refine(
  (data) => new Date(data.expiryDate) > new Date(data.issueDate),
  { message: 'Expiry date must be after issue date' }
);

export type ValidatedUserVisa = z.infer<typeof UserVisaSchema>;

/**
 * Schema for user visa input (without system fields)
 */
export const UserVisaInputSchema = UserVisaBaseSchema.omit({
  id: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
}).refine(
  (data) => new Date(data.expiryDate) > new Date(data.issueDate),
  { message: 'Expiry date must be after issue date' }
);

export type ValidatedUserVisaInput = z.infer<typeof UserVisaInputSchema>;

// ==================== User Passport Schema ====================

/**
 * Base schema for user passport records (without refinements)
 */
const UserPassportBaseSchema = z.object({
  id: UUIDSchema,
  userId: UUIDSchema,
  countryCode: CountryCodeSchema,
  countryName: z.string()
    .min(2, 'Country name must be at least 2 characters')
    .max(100, 'Country name is too long'),
  passportNumber: z.string()
    .min(3, 'Passport number is too short')
    .max(20, 'Passport number is too long')
    .optional(),
  issueDate: ISODateSchema.optional(),
  expiryDate: ISODateSchema.optional(),
  isPrimary: z.boolean(),
  createdAt: ISODateSchema,
  updatedAt: ISODateSchema,
});

/**
 * Schema for user passport records with date validation
 */
export const UserPassportSchema = UserPassportBaseSchema.refine(
  (data) => {
    // If both dates provided, expiry must be after issue
    if (data.issueDate && data.expiryDate) {
      return new Date(data.expiryDate) > new Date(data.issueDate);
    }
    return true;
  },
  { message: 'Expiry date must be after issue date' }
);

export type ValidatedUserPassport = z.infer<typeof UserPassportSchema>;

/**
 * Schema for user passport input (without system fields)
 */
export const UserPassportInputSchema = UserPassportBaseSchema.omit({
  id: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
}).refine(
  (data) => {
    // If both dates provided, expiry must be after issue
    if (data.issueDate && data.expiryDate) {
      return new Date(data.expiryDate) > new Date(data.issueDate);
    }
    return true;
  },
  { message: 'Expiry date must be after issue date' }
);

export type ValidatedUserPassportInput = z.infer<typeof UserPassportInputSchema>;

// ==================== Travel Stats Schema ====================

/**
 * Schema for travel statistics
 */
export const TravelStatsSchema = z.object({
  userId: UUIDSchema,

  // Location stats
  countriesVisited: z.number()
    .int('Countries visited must be a whole number')
    .nonnegative('Countries visited cannot be negative')
    .max(250, 'Countries visited is unreasonably high'),
  statesVisited: z.number()
    .int('States visited must be a whole number')
    .nonnegative('States visited cannot be negative')
    .max(10000, 'States visited is unreasonably high'),
  citiesVisited: z.number()
    .int('Cities visited must be a whole number')
    .nonnegative('Cities visited cannot be negative')
    .max(100000, 'Cities visited is unreasonably high'),
  continentsVisited: z.number()
    .int('Continents visited must be a whole number')
    .nonnegative('Continents visited cannot be negative')
    .max(7, 'Maximum 7 continents'),

  // Journal stats
  journalEntries: z.number()
    .int('Journal entries must be a whole number')
    .nonnegative('Journal entries cannot be negative')
    .max(1000000, 'Journal entries is unreasonably high'),
  photosUploaded: z.number()
    .int('Photos uploaded must be a whole number')
    .nonnegative('Photos uploaded cannot be negative')
    .max(10000000, 'Photos uploaded is unreasonably high'),

  // Achievements
  visitedAllContinents: z.boolean(),
  visited50Countries: z.boolean(),
  visited100Countries: z.boolean(),
});

export type ValidatedTravelStats = z.infer<typeof TravelStatsSchema>;

// ==================== Country Info Schema ====================

/**
 * Schema for country information
 */
export const CountryInfoSchema = z.object({
  code: CountryCodeSchema,
  name: z.string()
    .min(2, 'Country name must be at least 2 characters')
    .max(100, 'Country name is too long'),
  continent: z.string()
    .min(2, 'Continent name must be at least 2 characters')
    .max(50, 'Continent name is too long'),
  region: z.string()
    .max(100, 'Region name is too long')
    .optional(),
  flag: z.string()
    .max(500, 'Flag string is too long')
    .optional(),
});

export type ValidatedCountryInfo = z.infer<typeof CountryInfoSchema>;

// ==================== World Map Data Schema ====================

/**
 * Schema for world map visualization data
 */
export const WorldMapDataSchema = z.object({
  visited: z.array(CountryCodeSchema),
  lived: z.array(CountryCodeSchema),
  transit: z.array(CountryCodeSchema),
  wishlist: z.array(CountryCodeSchema),
});

export type ValidatedWorldMapData = z.infer<typeof WorldMapDataSchema>;

// ==================== Travel Access Summary Schema ====================

/**
 * Schema for travel access summary
 */
export const TravelAccessSummarySchema = z.object({
  passportCountry: CountryCodeSchema,
  totalDestinations: z.number()
    .int()
    .nonnegative()
    .max(250),
  visaFree: z.number()
    .int()
    .nonnegative()
    .max(250),
  visaOnArrival: z.number()
    .int()
    .nonnegative()
    .max(250),
  etaRequired: z.number()
    .int()
    .nonnegative()
    .max(250),
  eVisaRequired: z.number()
    .int()
    .nonnegative()
    .max(250),
  visaRequired: z.number()
    .int()
    .nonnegative()
    .max(250),
  noAdmission: z.number()
    .int()
    .nonnegative()
    .max(250),
  bonusAccessFromVisas: z.number()
    .int()
    .nonnegative()
    .max(250),
});

export type ValidatedTravelAccessSummary = z.infer<typeof TravelAccessSummarySchema>;

// ==================== Destination Access Schema ====================

/**
 * Schema for destination access information
 */
export const DestinationAccessSchema = z.object({
  countryCode: CountryCodeSchema,
  countryName: z.string()
    .min(2, 'Country name must be at least 2 characters')
    .max(100, 'Country name is too long'),
  accessType: VisaRequirementSchema,
  daysAllowed: z.number()
    .int()
    .nonnegative()
    .max(365)
    .optional(),
  source: z.enum(['passport', 'visa']),
  visaCountry: CountryCodeSchema.optional(),
});

export type ValidatedDestinationAccess = z.infer<typeof DestinationAccessSchema>;

// ==================== Array Schemas ====================

/**
 * Schema for arrays of visited locations
 */
export const VisitedLocationsArraySchema = z.array(VisitedLocationSchema);

/**
 * Schema for arrays of user visas
 */
export const UserVisasArraySchema = z.array(UserVisaSchema);

/**
 * Schema for arrays of user passports
 */
export const UserPassportsArraySchema = z.array(UserPassportSchema);

/**
 * Schema for arrays of visa access data
 */
export const VisaAccessArraySchema = z.array(VisaAccessSchema);

// ==================== Validation Helper Functions ====================

/**
 * Validates and filters an array of items, logging warnings for invalid items
 */
export function validateTravelArrayWithFilter<T>(
  schema: z.ZodSchema<unknown>,
  data: unknown[],
  context: string
): T[] {
  const validItems: T[] = [];

  for (let i = 0; i < data.length; i++) {
    const result = schema.safeParse(data[i]);
    if (result.success) {
      validItems.push(result.data as T);
    } else {
      logger.warn('TravelSchema', `Invalid item at index ${i} in ${context}`, {
        errors: result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`),
        item: data[i],
      });
    }
  }

  return validItems;
}

/**
 * Validates a single item and throws on error
 */
export function validateTravelItem<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
  context: string
): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    const errors = result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
    throw new Error(`Validation failed for ${context}: ${errors}`);
  }
  return result.data;
}
