import { describe, it, expect } from 'vitest';
import {
  CountryCodeSchema,
  ISODateSchema,
  LocationTypeSchema,
  VisitStatusSchema,
  VisaRequirementSchema,
  VisitedLocationSchema,
  VisitedLocationInputSchema,
  UserVisaSchema,
  UserVisaInputSchema,
  UserPassportSchema,
  UserPassportInputSchema,
  TravelStatsSchema,
  VisaAccessSchema,
  PassportDataSchema,
  WorldMapDataSchema,
  validateTravelArrayWithFilter,
  validateTravelItem,
} from '../travel';

describe('Travel Schemas', () => {
  describe('CountryCodeSchema', () => {
    it('should validate correct country codes', () => {
      expect(CountryCodeSchema.parse('US')).toBe('US');
      expect(CountryCodeSchema.parse('FR')).toBe('FR');
      expect(CountryCodeSchema.parse('JP')).toBe('JP');
    });

    it('should reject invalid country codes', () => {
      expect(() => CountryCodeSchema.parse('USA')).toThrow(); // Too long
      expect(() => CountryCodeSchema.parse('U')).toThrow(); // Too short
      expect(() => CountryCodeSchema.parse('us')).toThrow(); // Lowercase
      expect(() => CountryCodeSchema.parse('U1')).toThrow(); // Contains number
      expect(() => CountryCodeSchema.parse('XX')).toThrow(); // Reserved code
    });
  });

  describe('ISODateSchema', () => {
    it('should validate correct ISO dates', () => {
      expect(ISODateSchema.parse('2024-01-15')).toBe('2024-01-15');
      expect(ISODateSchema.parse('2024-01-15T10:00:00Z')).toBe('2024-01-15T10:00:00Z');
      expect(ISODateSchema.parse('2024-12-31T23:59:59.999Z')).toBe('2024-12-31T23:59:59.999Z');
    });

    it('should reject invalid dates', () => {
      expect(() => ISODateSchema.parse('2024/01/15')).toThrow(); // Wrong format
      expect(() => ISODateSchema.parse('15-01-2024')).toThrow(); // Wrong order
      expect(() => ISODateSchema.parse('not-a-date')).toThrow();
      expect(() => ISODateSchema.parse('2024-13-01')).toThrow(); // Invalid month
    });
  });

  describe('Enum Schemas', () => {
    it('should validate LocationTypeSchema', () => {
      expect(LocationTypeSchema.parse('country')).toBe('country');
      expect(LocationTypeSchema.parse('national_park')).toBe('national_park');
      expect(() => LocationTypeSchema.parse('invalid')).toThrow();
    });

    it('should validate VisitStatusSchema', () => {
      expect(VisitStatusSchema.parse('visited')).toBe('visited');
      expect(VisitStatusSchema.parse('lived')).toBe('lived');
      expect(() => VisitStatusSchema.parse('maybe')).toThrow();
    });

    it('should validate VisaRequirementSchema', () => {
      expect(VisaRequirementSchema.parse('visa-free')).toBe('visa-free');
      expect(VisaRequirementSchema.parse('eta')).toBe('eta');
      expect(() => VisaRequirementSchema.parse('unknown')).toThrow();
    });
  });

  describe('VisitedLocationSchema', () => {
    const validLocation = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      userId: '123e4567-e89b-12d3-a456-426614174001',
      locationType: 'country',
      countryCode: 'US',
      countryName: 'United States',
      status: 'visited',
      visitCount: 5,
      createdAt: '2024-01-15T10:00:00Z',
      updatedAt: '2024-01-15T10:00:00Z',
    };

    it('should validate a complete visited location', () => {
      const result = VisitedLocationSchema.parse(validLocation);
      expect(result.countryCode).toBe('US');
      expect(result.visitCount).toBe(5);
    });

    it('should validate with optional fields', () => {
      const location = {
        ...validLocation,
        cityName: 'New York',
        rating: 5,
        favoritePlace: true,
        notes: 'Amazing city!',
        firstVisitDate: '2020-01-01',
        lastVisitDate: '2024-01-01',
        totalDays: 30,
      };

      const result = VisitedLocationSchema.parse(location);
      expect(result.cityName).toBe('New York');
      expect(result.rating).toBe(5);
    });

    it('should reject invalid ratings', () => {
      expect(() =>
        VisitedLocationSchema.parse({ ...validLocation, rating: 0 })
      ).toThrow(); // Too low
      expect(() =>
        VisitedLocationSchema.parse({ ...validLocation, rating: 6 })
      ).toThrow(); // Too high
      expect(() =>
        VisitedLocationSchema.parse({ ...validLocation, rating: 3.5 })
      ).toThrow(); // Not integer
    });

    it('should reject negative visit counts', () => {
      expect(() =>
        VisitedLocationSchema.parse({ ...validLocation, visitCount: -1 })
      ).toThrow();
    });

    it('should reject invalid country codes', () => {
      expect(() =>
        VisitedLocationSchema.parse({ ...validLocation, countryCode: 'USA' })
      ).toThrow();
    });

    it('should reject lastVisitDate before firstVisitDate', () => {
      expect(() =>
        VisitedLocationSchema.parse({
          ...validLocation,
          firstVisitDate: '2024-01-15',
          lastVisitDate: '2020-01-01',
        })
      ).toThrow();
    });

    it('should allow lastVisitDate equal to firstVisitDate', () => {
      const result = VisitedLocationSchema.parse({
        ...validLocation,
        firstVisitDate: '2024-01-15',
        lastVisitDate: '2024-01-15',
      });
      expect(result.firstVisitDate).toBe('2024-01-15');
    });

    it('should validate country name length', () => {
      expect(() =>
        VisitedLocationSchema.parse({ ...validLocation, countryName: 'A' })
      ).toThrow(); // Too short

      expect(() =>
        VisitedLocationSchema.parse({
          ...validLocation,
          countryName: 'A'.repeat(101),
        })
      ).toThrow(); // Too long
    });
  });

  describe('VisitedLocationInputSchema', () => {
    it('should validate input without system fields', () => {
      const input = {
        locationType: 'city',
        countryCode: 'FR',
        countryName: 'France',
        cityName: 'Paris',
        status: 'visited',
        visitCount: 1,
      };

      const result = VisitedLocationInputSchema.parse(input);
      expect(result.cityName).toBe('Paris');
      expect(result).not.toHaveProperty('id');
      expect(result).not.toHaveProperty('userId');
    });
  });

  describe('UserVisaSchema', () => {
    const validVisa = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      userId: '123e4567-e89b-12d3-a456-426614174001',
      countryCode: 'US',
      countryName: 'United States',
      visaType: 'Tourist',
      issueDate: '2024-01-01',
      expiryDate: '2025-01-01',
      multipleEntry: true,
      createdAt: '2024-01-15T10:00:00Z',
      updatedAt: '2024-01-15T10:00:00Z',
    };

    it('should validate a complete visa record', () => {
      const result = UserVisaSchema.parse(validVisa);
      expect(result.visaType).toBe('Tourist');
      expect(result.multipleEntry).toBe(true);
    });

    it('should validate with optional fields', () => {
      const visa = {
        ...validVisa,
        maxStayDays: 90,
        notes: 'Must have return ticket',
      };

      const result = UserVisaSchema.parse(visa);
      expect(result.maxStayDays).toBe(90);
    });

    it('should reject expiry date before issue date', () => {
      expect(() =>
        UserVisaSchema.parse({
          ...validVisa,
          issueDate: '2025-01-01',
          expiryDate: '2024-01-01',
        })
      ).toThrow();
    });

    it('should reject invalid max stay days', () => {
      expect(() =>
        UserVisaSchema.parse({ ...validVisa, maxStayDays: 0 })
      ).toThrow(); // Not positive
      expect(() =>
        UserVisaSchema.parse({ ...validVisa, maxStayDays: 366 })
      ).toThrow(); // Too high
    });

    it('should validate visa type is required', () => {
      expect(() =>
        UserVisaSchema.parse({ ...validVisa, visaType: '' })
      ).toThrow();
    });
  });

  describe('UserPassportSchema', () => {
    const validPassport = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      userId: '123e4567-e89b-12d3-a456-426614174001',
      countryCode: 'US',
      countryName: 'United States',
      isPrimary: true,
      createdAt: '2024-01-15T10:00:00Z',
      updatedAt: '2024-01-15T10:00:00Z',
    };

    it('should validate a complete passport record', () => {
      const result = UserPassportSchema.parse(validPassport);
      expect(result.countryCode).toBe('US');
      expect(result.isPrimary).toBe(true);
    });

    it('should validate with all optional fields', () => {
      const passport = {
        ...validPassport,
        passportNumber: 'P123456789',
        issueDate: '2019-01-01',
        expiryDate: '2029-01-01',
      };

      const result = UserPassportSchema.parse(passport);
      expect(result.passportNumber).toBe('P123456789');
    });

    it('should reject expiry date before issue date', () => {
      expect(() =>
        UserPassportSchema.parse({
          ...validPassport,
          issueDate: '2029-01-01',
          expiryDate: '2019-01-01',
        })
      ).toThrow();
    });

    it('should validate passport number length', () => {
      expect(() =>
        UserPassportSchema.parse({ ...validPassport, passportNumber: 'P1' })
      ).toThrow(); // Too short

      expect(() =>
        UserPassportSchema.parse({
          ...validPassport,
          passportNumber: 'P'.repeat(21),
        })
      ).toThrow(); // Too long
    });
  });

  describe('TravelStatsSchema', () => {
    const validStats = {
      userId: '123e4567-e89b-12d3-a456-426614174000',
      countriesVisited: 25,
      statesVisited: 10,
      citiesVisited: 50,
      continentsVisited: 4,
      journalEntries: 100,
      photosUploaded: 500,
      visitedAllContinents: false,
      visited50Countries: false,
      visited100Countries: false,
    };

    it('should validate complete travel stats', () => {
      const result = TravelStatsSchema.parse(validStats);
      expect(result.countriesVisited).toBe(25);
      expect(result.continentsVisited).toBe(4);
    });

    it('should reject more than 7 continents', () => {
      expect(() =>
        TravelStatsSchema.parse({ ...validStats, continentsVisited: 8 })
      ).toThrow();
    });

    it('should reject negative values', () => {
      expect(() =>
        TravelStatsSchema.parse({ ...validStats, countriesVisited: -1 })
      ).toThrow();
    });

    it('should reject non-integer values', () => {
      expect(() =>
        TravelStatsSchema.parse({ ...validStats, countriesVisited: 25.5 })
      ).toThrow();
    });
  });

  describe('VisaAccessSchema', () => {
    const validAccess = {
      destinationCountry: 'FR',
      requirement: 'visa-free',
      daysAllowed: 90,
    };

    it('should validate visa access', () => {
      const result = VisaAccessSchema.parse(validAccess);
      expect(result.requirement).toBe('visa-free');
      expect(result.daysAllowed).toBe(90);
    });

    it('should validate without days allowed', () => {
      const access = {
        destinationCountry: 'US',
        requirement: 'visa-required',
      };

      const result = VisaAccessSchema.parse(access);
      expect(result.daysAllowed).toBeUndefined();
    });

    it('should reject invalid days allowed', () => {
      expect(() =>
        VisaAccessSchema.parse({ ...validAccess, daysAllowed: -1 })
      ).toThrow(); // Negative
      expect(() =>
        VisaAccessSchema.parse({ ...validAccess, daysAllowed: 366 })
      ).toThrow(); // Too high
    });
  });

  describe('PassportDataSchema', () => {
    const validPassportData = {
      countryCode: 'US',
      countryName: 'United States',
      rank: 7,
      visaFreeScore: 186,
      visaFreeAccess: [
        { destinationCountry: 'FR', requirement: 'visa-free', daysAllowed: 90 },
        { destinationCountry: 'JP', requirement: 'visa-free', daysAllowed: 90 },
      ],
    };

    it('should validate complete passport data', () => {
      const result = PassportDataSchema.parse(validPassportData);
      expect(result.rank).toBe(7);
      expect(result.visaFreeAccess).toHaveLength(2);
    });

    it('should validate with empty visa access array', () => {
      const data = { ...validPassportData, visaFreeAccess: [] };
      const result = PassportDataSchema.parse(data);
      expect(result.visaFreeAccess).toHaveLength(0);
    });
  });

  describe('WorldMapDataSchema', () => {
    it('should validate world map data', () => {
      const data = {
        visited: ['US', 'FR', 'JP'],
        lived: ['US'],
        transit: ['DE'],
        wishlist: ['AU', 'NZ'],
      };

      const result = WorldMapDataSchema.parse(data);
      expect(result.visited).toHaveLength(3);
      expect(result.wishlist).toHaveLength(2);
    });

    it('should validate empty arrays', () => {
      const data = {
        visited: [],
        lived: [],
        transit: [],
        wishlist: [],
      };

      const result = WorldMapDataSchema.parse(data);
      expect(result.visited).toHaveLength(0);
    });

    it('should reject invalid country codes', () => {
      expect(() =>
        WorldMapDataSchema.parse({
          visited: ['USA'], // Invalid code
          lived: [],
          transit: [],
          wishlist: [],
        })
      ).toThrow();
    });
  });

  describe('Helper Functions', () => {
    describe('validateTravelArrayWithFilter', () => {
      it('should filter out invalid items and keep valid ones', () => {
        const data = [
          { destinationCountry: 'FR', requirement: 'visa-free', daysAllowed: 90 },
          { destinationCountry: 'INVALID', requirement: 'visa-free' }, // Invalid code
          { destinationCountry: 'JP', requirement: 'eta', daysAllowed: 30 },
        ];

        const result = validateTravelArrayWithFilter(
          VisaAccessSchema,
          data,
          'test context'
        );

        expect(result).toHaveLength(2);
        expect(result[0].destinationCountry).toBe('FR');
        expect(result[1].destinationCountry).toBe('JP');
      });

      it('should return empty array when all items are invalid', () => {
        const data = [
          { destinationCountry: 'INVALID' },
          { requirement: 'visa-free' }, // Missing country
        ];

        const result = validateTravelArrayWithFilter(
          VisaAccessSchema,
          data,
          'test context'
        );

        expect(result).toHaveLength(0);
      });
    });

    describe('validateTravelItem', () => {
      it('should return validated item on success', () => {
        const data = {
          destinationCountry: 'FR',
          requirement: 'visa-free',
          daysAllowed: 90,
        };

        const result = validateTravelItem(VisaAccessSchema, data, 'test');
        expect(result.destinationCountry).toBe('FR');
      });

      it('should throw error on validation failure', () => {
        const data = { destinationCountry: 'INVALID', requirement: 'visa-free' };

        expect(() =>
          validateTravelItem(VisaAccessSchema, data, 'test context')
        ).toThrow(/Validation failed for test context/);
      });
    });
  });
});
