import { describe, it, expect } from 'vitest';
import { nationalParks } from '@/travel/data/nationalParks';

describe('National Parks', () => {
  it('should search parks by name', () => {
    const results = nationalParks.filter((park) =>
      park.name.toLowerCase().includes('yosemite')
    );

    expect(results.length).toBeGreaterThan(0);
    expect(results[0].name).toContain('Yosemite');
  });

  it('should search parks by state', () => {
    const californiaParks = nationalParks.filter(
      (park) => park.stateCode === 'US-CA'
    );

    expect(californiaParks.length).toBeGreaterThan(0);
    expect(californiaParks.every((p) => p.stateCode === 'US-CA')).toBe(true);
  });

  it('should get park information by ID', () => {
    const park = nationalParks.find((p) => p.id === 'us-yosemite');

    if (park) {
      expect(park.name).toBeDefined();
      expect(park.countryCode).toBe('US');
      expect(park.lat).toBeDefined();
      expect(park.lon).toBeDefined();
    }
  });

  it('should filter parks by features in description', () => {
    const mountainParks = nationalParks.filter((park) =>
      park.description?.toLowerCase().includes('mountain')
    );

    expect(mountainParks.length).toBeGreaterThan(0);
  });

  it('should identify UNESCO sites', () => {
    const unescoParks = nationalParks.filter((park) => park.unesco === true);

    expect(unescoParks.length).toBeGreaterThan(0);
    expect(unescoParks.every((p) => p.unesco === true)).toBe(true);
  });

  it('should have valid coordinates', () => {
    const park = nationalParks[0];

    expect(park.lat).toBeGreaterThanOrEqual(-90);
    expect(park.lat).toBeLessThanOrEqual(90);
    expect(park.lon).toBeGreaterThanOrEqual(-180);
    expect(park.lon).toBeLessThanOrEqual(180);
  });

  it('should have establishment years', () => {
    const parksWithYears = nationalParks.filter((park) => park.established);

    expect(parksWithYears.length).toBeGreaterThan(0);
    expect(parksWithYears.every((p) => p.established && p.established > 1800)).toBe(true);
  });

  it('should have area information', () => {
    const parksWithArea = nationalParks.filter((park) => park.area);

    expect(parksWithArea.length).toBeGreaterThan(0);
    expect(parksWithArea.every((p) => p.area && p.area > 0)).toBe(true);
  });

  it('should search parks case-insensitively', () => {
    const results = nationalParks.filter((park) =>
      park.name.toLowerCase().includes('YELLOWSTONE'.toLowerCase())
    );

    expect(results.length).toBeGreaterThan(0);
  });

  it('should filter by country code', () => {
    const usParks = nationalParks.filter((park) => park.countryCode === 'US');

    expect(usParks.length).toBeGreaterThan(0);
    expect(usParks.every((p) => p.countryCode === 'US')).toBe(true);
  });
});
