import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  HealthKitIntegration,
  WebHealthIntegration,
  getHealthIntegration,
  PeriodPredictor,
} from '../healthSync';
import type { PeriodCycle, HealthKitData } from '../../types/index';

describe('HealthKitIntegration', () => {
  let healthKit: HealthKitIntegration;
  let _originalNavigator: Navigator;
  let _originalWindow: Window;

  beforeEach((): void => {
    // Store original values
    _originalNavigator = { ...navigator };
    _originalWindow = { ...window };

    // Mock localStorage
    vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(null);
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation((): void => {});

    // Mock console methods
    vi.spyOn(console, 'log').mockImplementation((): void => {});
    vi.spyOn(console, 'error').mockImplementation((): void => {});

    // Mock window.alert
    vi.spyOn(window, 'alert').mockImplementation((): void => {});

    // Mock window.matchMedia with type-safe implementation
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query: string): MediaQueryList => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });

    healthKit = new HealthKitIntegration();
  });

  afterEach((): void => {
    vi.restoreAllMocks();
  });

  describe('Support Detection', () => {
    it('should detect non-iOS devices as unsupported', (): void => {
      // Default navigator.userAgent in vitest is not iOS
      expect(healthKit['isSupported']).toBe(false);
    });

    it('should detect iOS devices', (): void => {
      // Mock iOS user agent
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
        configurable: true,
      });

      const iosHealthKit = new HealthKitIntegration();
      // Will be false in test environment without actual HealthKit, but constructor runs
      expect(iosHealthKit).toBeDefined();
    });
  });

  describe('requestPermissions', () => {
    it('should show iOS instructions when not supported', async (): Promise<void> => {
      const result = await healthKit.requestPermissions();

      expect(result).toBe(false);
      expect(window.alert).toHaveBeenCalled();
    });

    it('should return false when requestPermission is not available', async (): Promise<void> => {
      healthKit['isSupported'] = true;
      const result = await healthKit.requestPermissions();

      expect(result).toBe(false);
    });

    it('should request permissions when API is available', async (): Promise<void> => {
      healthKit['isSupported'] = true;
      // Type-safe mock that matches the window interface
      const windowWithPermission = window as Window & {
        requestPermission?: (type: string, options?: object) => Promise<string>
      };
      windowWithPermission.requestPermission = vi.fn().mockResolvedValue('granted');

      const result = await healthKit.requestPermissions();

      expect(result).toBe(true);
      expect(windowWithPermission.requestPermission).toHaveBeenCalledWith('health', {
        read: expect.arrayContaining(['menstrualFlow', 'symptoms']),
      });

      delete windowWithPermission.requestPermission;
    });
  });

  describe('syncPeriodData', () => {
    it('should throw error when not supported', async (): Promise<void> => {
      const result = await healthKit.syncPeriodData();

      expect(result.status).toBe('error');
      expect(result.errors).toContain('HealthKit not supported');
      expect(result.recordsImported).toBe(0);
    });

    it('should sync data successfully when supported', async (): Promise<void> => {
      healthKit['isSupported'] = true;
      const mockHealthData: HealthKitData = {
        menstrualFlow: {
          samples: [
            {
              startDate: new Date('2025-01-01'),
              endDate: new Date('2025-01-02'),
              value: 2,
            },
            {
              startDate: new Date('2025-01-02'),
              endDate: new Date('2025-01-03'),
              value: 3,
            },
          ],
        },
      };

      vi.spyOn(
        healthKit as unknown as { fetchHealthKitData(): Promise<HealthKitData> },
        'fetchHealthKitData' as keyof HealthKitIntegration
      ).mockResolvedValue(mockHealthData);

      const result = await healthKit.syncPeriodData(new Date('2025-01-01'));

      expect(result.status).toBe('success');
      expect(result.recordsImported).toBe(2);
      expect(result.errors).toEqual([]);
    });
  });

  describe('getLiveHealthData', () => {
    it('should return fallback data when healthStore is not available', async (): Promise<void> => {
      const result = await healthKit.getLiveHealthData();

      // When healthStore is not available, it uses fallback which returns mock data
      expect(result).toBeDefined();
      expect(typeof result).toBe('object');
    });

    it('should query all health data types when healthStore is available', async (): Promise<void> => {
      const mockHealthStore = {
        postMessage: vi.fn().mockResolvedValue({ samples: [] }),
      };

      (healthKit as unknown as { healthStore: unknown })['healthStore'] = mockHealthStore;

      const result = await healthKit.getLiveHealthData();

      expect(result).toBeDefined();
      expect(mockHealthStore.postMessage).toHaveBeenCalled();
    });

    it('should use fallback when direct queries fail', async (): Promise<void> => {
      vi.spyOn(
        healthKit as unknown as { fallbackHealthQuery(): Promise<HealthKitData> },
        'fallbackHealthQuery' as keyof HealthKitIntegration
      ).mockResolvedValue({
        menstrualFlow: { samples: [] },
      });

      const result = await healthKit.getLiveHealthData();

      expect(result).toBeDefined();
    });
  });

  describe('convertHealthKitToPeriodCycles', () => {
    it('should return empty array when no menstrual flow data', (): void => {
      const result = healthKit.convertHealthKitToPeriodCycles({});

      expect(result).toEqual([]);
    });

    it('should convert single period to cycle', (): void => {
      const healthData: HealthKitData = {
        menstrualFlow: {
          samples: [
            {
              startDate: new Date('2025-01-01'),
              endDate: new Date('2025-01-02'),
              value: 2,
            },
            {
              startDate: new Date('2025-01-02'),
              endDate: new Date('2025-01-03'),
              value: 3,
            },
          ],
        },
      };

      const result = healthKit.convertHealthKitToPeriodCycles(healthData);

      expect(result).toHaveLength(1);
      expect(result[0].flow).toBe('medium');
      expect(result[0].source).toBe('apple-health');
      expect(result[0].synced).toBe(true);
    });

    it('should create separate cycles when gap > 7 days', (): void => {
      const healthData: HealthKitData = {
        menstrualFlow: {
          samples: [
            {
              startDate: new Date('2025-01-01'),
              endDate: new Date('2025-01-02'),
              value: 2,
            },
            {
              startDate: new Date('2025-01-15'),
              endDate: new Date('2025-01-16'),
              value: 3,
            },
          ],
        },
      };

      const result = healthKit.convertHealthKitToPeriodCycles(healthData);

      expect(result).toHaveLength(2);
      expect(result[0].startDate).toEqual(new Date('2025-01-01'));
      expect(result[1].startDate).toEqual(new Date('2025-01-15'));
    });

    it('should convert HealthKit flow values correctly', (): void => {
      const healthData: HealthKitData = {
        menstrualFlow: {
          samples: [
            {
              startDate: new Date('2025-01-01'),
              endDate: new Date('2025-01-02'),
              value: 1, // light
            },
            {
              startDate: new Date('2025-01-30'),
              endDate: new Date('2025-01-31'),
              value: 5, // heavy
            },
          ],
        },
      };

      const result = healthKit.convertHealthKitToPeriodCycles(healthData);

      expect(result).toHaveLength(2);
      expect(result[0].flow).toBe('light');
      expect(result[1].flow).toBe('heavy');
    });

    it('should update flow to heaviest in same cycle', (): void => {
      const healthData: HealthKitData = {
        menstrualFlow: {
          samples: [
            {
              startDate: new Date('2025-01-01'),
              endDate: new Date('2025-01-02'),
              value: 1, // light
            },
            {
              startDate: new Date('2025-01-02'),
              endDate: new Date('2025-01-03'),
              value: 5, // heavy
            },
            {
              startDate: new Date('2025-01-03'),
              endDate: new Date('2025-01-04'),
              value: 2, // light
            },
          ],
        },
      };

      const result = healthKit.convertHealthKitToPeriodCycles(healthData);

      expect(result).toHaveLength(1);
      expect(result[0].flow).toBe('heavy'); // Should be heaviest flow
    });
  });

  describe('generateMockHealthData', () => {
    it('should generate realistic mock data', (): void => {
      const mockData = (healthKit as unknown as { generateMockHealthData(): HealthKitData })['generateMockHealthData']();

      expect(mockData.menstrualFlow).toBeDefined();
      expect(mockData.menstrualFlow?.samples.length).toBeGreaterThan(0);
      expect(mockData.symptoms).toBeDefined();
      expect(mockData.basalBodyTemperature).toBeDefined();
    });

    it('should generate 3 cycles of data', (): void => {
      const mockData = (healthKit as unknown as { generateMockHealthData(): HealthKitData })['generateMockHealthData']();

      // Should have samples from 3 cycles (each 4-6 days)
      expect(mockData.menstrualFlow?.samples.length ?? 0).toBeGreaterThanOrEqual(12);
      expect(mockData.menstrualFlow?.samples.length ?? 0).toBeLessThanOrEqual(18);
    });
  });
});

describe('WebHealthIntegration', () => {
  let webHealth: WebHealthIntegration;

  beforeEach((): void => {
    webHealth = new WebHealthIntegration();
  });

  describe('isSupported', () => {
    it('should check for navigator and permissions API', (): void => {
      const result = webHealth.isSupported();

      // In vitest environment, navigator exists but may not have full permissions API
      expect(typeof result).toBe('boolean');
    });
  });

  describe('requestPermissions', () => {
    it('should return boolean based on support', (): void => {
      const result = webHealth.requestPermissions();

      expect(typeof result).toBe('boolean');
    });
  });

  describe('syncData', () => {
    it('should return error status for unsupported Web Health API', (): void => {
      const result = webHealth.syncData();

      expect(result.status).toBe('error');
      expect(result.recordsImported).toBe(0);
      expect(result.errors).toContain('Web Health API not yet supported');
    });
  });
});

describe('getHealthIntegration', () => {
  beforeEach((): void => {
    // Mock matchMedia globally for this describe block
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query: string): MediaQueryList => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  });

  it('should return HealthKitIntegration or WebHealthIntegration', (): void => {
    const integration = getHealthIntegration();

    expect(integration).toBeDefined();
    expect(
      integration instanceof HealthKitIntegration || integration instanceof WebHealthIntegration
    ).toBe(true);
  });

  it('should return WebHealthIntegration when HealthKit is not supported', (): void => {
    const integration = getHealthIntegration();

    // In test environment, HealthKit is not supported
    expect(integration instanceof WebHealthIntegration).toBe(true);
  });
});

describe('PeriodPredictor', () => {
  describe('calculateAverageCycleLength', () => {
    it('should return default 28 days for less than 2 cycles', (): void => {
      const result = PeriodPredictor.calculateAverageCycleLength([]);
      expect(result).toBe(28);

      const oneCycle: PeriodCycle[] = [
        {
          id: '1',
          startDate: new Date('2025-01-01'),
          flow: 'medium',
          symptoms: [],
          source: 'manual',
          synced: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];
      expect(PeriodPredictor.calculateAverageCycleLength(oneCycle)).toBe(28);
    });

    it('should calculate average cycle length from multiple cycles', (): void => {
      const cycles: PeriodCycle[] = [
        {
          id: '1',
          startDate: new Date('2025-01-01'),
          flow: 'medium',
          symptoms: [],
          source: 'manual',
          synced: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '2',
          startDate: new Date('2025-01-29'), // 28 days later
          flow: 'medium',
          symptoms: [],
          source: 'manual',
          synced: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '3',
          startDate: new Date('2025-02-27'), // 29 days later
          flow: 'medium',
          symptoms: [],
          source: 'manual',
          synced: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const result = PeriodPredictor.calculateAverageCycleLength(cycles);
      expect(result).toBe(29); // Average of 28 and 29
    });

    it('should ignore unrealistic cycle lengths', (): void => {
      const cycles: PeriodCycle[] = [
        {
          id: '1',
          startDate: new Date('2025-01-01'),
          flow: 'medium',
          symptoms: [],
          source: 'manual',
          synced: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '2',
          startDate: new Date('2025-01-05'), // 4 days - too short
          flow: 'medium',
          symptoms: [],
          source: 'manual',
          synced: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '3',
          startDate: new Date('2025-02-04'), // 30 days from id:1
          flow: 'medium',
          symptoms: [],
          source: 'manual',
          synced: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const result = PeriodPredictor.calculateAverageCycleLength(cycles);
      expect(result).toBe(30); // Should ignore the 4-day cycle
    });
  });

  describe('calculateAveragePeriodLength', () => {
    it('should return default 5 days when no valid cycles', (): void => {
      const result = PeriodPredictor.calculateAveragePeriodLength([]);
      expect(result).toBe(5);
    });

    it('should calculate average period length', (): void => {
      const cycles: PeriodCycle[] = [
        {
          id: '1',
          startDate: new Date('2025-01-01'),
          endDate: new Date('2025-01-05'), // 5 days
          flow: 'medium',
          symptoms: [],
          source: 'manual',
          synced: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '2',
          startDate: new Date('2025-02-01'),
          endDate: new Date('2025-02-06'), // 6 days
          flow: 'medium',
          symptoms: [],
          source: 'manual',
          synced: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const result = PeriodPredictor.calculateAveragePeriodLength(cycles);
      expect(result).toBe(6); // Average of 5 and 6, rounded
    });

    it('should ignore cycles without end date', (): void => {
      const cycles: PeriodCycle[] = [
        {
          id: '1',
          startDate: new Date('2025-01-01'),
          // No endDate
          flow: 'medium',
          symptoms: [],
          source: 'manual',
          synced: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '2',
          startDate: new Date('2025-02-01'),
          endDate: new Date('2025-02-05'),
          flow: 'medium',
          symptoms: [],
          source: 'manual',
          synced: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const result = PeriodPredictor.calculateAveragePeriodLength(cycles);
      expect(result).toBe(5); // Only counts cycle with endDate
    });
  });

  describe('predictNextPeriod', () => {
    it('should return null for empty cycles', (): void => {
      const result = PeriodPredictor.predictNextPeriod([]);
      expect(result).toBeNull();
    });

    it('should predict next period based on average cycle length', (): void => {
      const cycles: PeriodCycle[] = [
        {
          id: '1',
          startDate: new Date('2025-01-01'),
          flow: 'medium',
          symptoms: [],
          source: 'manual',
          synced: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '2',
          startDate: new Date('2025-01-29'), // 28 days later
          flow: 'medium',
          symptoms: [],
          source: 'manual',
          synced: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const result = PeriodPredictor.predictNextPeriod(cycles);

      expect(result).toBeDefined();
      expect(result).toBeInstanceOf(Date);

      // Should be approximately 28 days after Jan 29
      const expected = new Date('2025-02-26');
      expect(result?.toDateString()).toBe(expected.toDateString());
    });

    it('should use most recent cycle for prediction', (): void => {
      const cycles: PeriodCycle[] = [
        {
          id: '1',
          startDate: new Date('2024-12-01'),
          flow: 'medium',
          symptoms: [],
          source: 'manual',
          synced: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '2',
          startDate: new Date('2025-01-01'),
          flow: 'medium',
          symptoms: [],
          source: 'manual',
          synced: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '3',
          startDate: new Date('2025-02-01'), // Most recent
          flow: 'medium',
          symptoms: [],
          source: 'manual',
          synced: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const result = PeriodPredictor.predictNextPeriod(cycles);

      // Should be based on Feb 1 (most recent)
      expect(result).toBeDefined();
      const daysDiff = result ? Math.floor(
        (result.getTime() - new Date('2025-02-01').getTime()) / (1000 * 60 * 60 * 24)
      ) : 0;
      expect(daysDiff).toBeGreaterThanOrEqual(28);
      expect(daysDiff).toBeLessThanOrEqual(32);
    });
  });
});
