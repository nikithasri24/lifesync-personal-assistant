import type { HealthKitData, HealthSyncStatus, PeriodCycle, PeriodSymptom } from '../types/index';

// Enhanced Apple Health integration utilities
export class HealthKitIntegration {
  private isSupported: boolean;
  private healthStore: any;

  constructor() {
    this.isSupported = this.checkSupport();
    this.initializeHealthStore();
  }

  private checkSupport(): boolean {
    // Check if we're on iOS Safari or a native app with HealthKit
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const hasHealthKit = typeof (window as any).webkit !== 'undefined' && 
                        typeof (window as any).webkit.messageHandlers !== 'undefined' &&
                        typeof (window as any).webkit.messageHandlers.health !== 'undefined';
    
    // Also check for PWA capabilities
    const isPWA = window.matchMedia('(display-mode: standalone)').matches;
    
    return isIOS && (hasHealthKit || isPWA || 'serviceWorker' in navigator);
  }

  private async initializeHealthStore() {
    if (!this.isSupported) return;
    
    try {
      // Try to access the Health app integration
      if ((window as any).webkit?.messageHandlers?.health) {
        this.healthStore = (window as any).webkit.messageHandlers.health;
      } else if ('HealthKit' in window) {
        this.healthStore = (window as any).HealthKit;
      }
    } catch (error) {
      console.log('HealthKit not available, using fallback methods');
    }
  }

  async requestPermissions(): Promise<boolean> {
    try {
      if (!this.isSupported) {
        // On non-iOS devices, prompt user to add to home screen or use Safari
        this.showIOSInstructions();
        return false;
      }

      // Request comprehensive permissions for cycle tracking
      const permission = await this.requestHealthKitPermission([
        'menstrualFlow',
        'intermenstrualBleeding',
        'ovulationTestResult',
        'pregnancyTestResult',
        'contraceptive',
        'lactation',
        'sexualActivity',
        'symptoms'
      ]);

      return permission;
    } catch (error) {
      console.error('Failed to request HealthKit permissions:', error);
      return false;
    }
  }

  private showIOSInstructions() {
    const instructions = `
To sync with Apple Health:
1. Open this app on your iPhone in Safari
2. Add to Home Screen for full integration
3. Grant Health app permissions when prompted
    `;
    alert(instructions);
  }

  private async requestHealthKitPermission(dataTypes: string[]): Promise<boolean> {
    // This would be implemented differently in a native app vs web
    // For web, we'd use the Health Records API or similar
    try {
      // Mock implementation - in real app this would use HealthKit
      if ('requestPermission' in (window as any)) {
        const result = await (window as any).requestPermission('health', {
          read: dataTypes
        });
        return result === 'granted';
      }
      return false;
    } catch (error) {
      console.error('HealthKit permission request failed:', error);
      return false;
    }
  }

  async syncPeriodData(lastSyncDate?: Date): Promise<HealthSyncStatus> {
    try {
      if (!this.isSupported) {
        throw new Error('HealthKit not supported');
      }

      const syncStart = Date.now();
      let recordsImported = 0;

      // Fetch menstrual flow data
      const healthData = await this.fetchHealthKitData(lastSyncDate);
      
      if (healthData.menstrualFlow) {
        recordsImported += healthData.menstrualFlow.samples.length;
      }

      return {
        lastSync: new Date(),
        status: 'success',
        recordsImported,
        errors: []
      };
    } catch (error) {
      return {
        lastSync: new Date(),
        status: 'error',
        recordsImported: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }

  // Real-time sync with live Health app data
  async getLiveHealthData(): Promise<HealthKitData> {
    try {
      let data: HealthKitData = {};

      if (this.healthStore) {
        // Direct HealthKit integration
        const queries = [
          this.queryMenstrualFlow(),
          this.querySymptoms(),
          this.queryOvulation(),
          this.queryBasalBodyTemperature()
        ];

        const results = await Promise.allSettled(queries);
        
        results.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            switch (index) {
              case 0: data.menstrualFlow = result.value; break;
              case 1: data.symptoms = result.value; break;
              case 2: data.ovulation = result.value; break;
              case 3: data.basalBodyTemperature = result.value; break;
            }
          }
        });
      } else {
        // Fallback: Try to read from Health app via shortcuts/intents
        data = await this.fallbackHealthQuery();
      }

      return data;
    } catch (error) {
      console.error('Failed to fetch live Health data:', error);
      return {};
    }
  }

  private async queryMenstrualFlow() {
    if (!this.healthStore) return null;
    
    try {
      // Query last 6 months of menstrual flow data
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - 180 * 24 * 60 * 60 * 1000);
      
      return await this.healthStore.postMessage({
        type: 'query',
        dataType: 'HKCategoryTypeIdentifierMenstrualFlow',
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      });
    } catch (error) {
      console.error('Failed to query menstrual flow:', error);
      return null;
    }
  }

  private async querySymptoms() {
    if (!this.healthStore) return null;
    
    try {
      const symptomTypes = [
        'HKCategoryTypeIdentifierAbdominalCramps',
        'HKCategoryTypeIdentifierBloating',
        'HKCategoryTypeIdentifierBreastPain',
        'HKCategoryTypeIdentifierHeadache',
        'HKCategoryTypeIdentifierMoodChanges',
        'HKCategoryTypeIdentifierPelvicPain'
      ];

      const queries = symptomTypes.map(type => 
        this.healthStore.postMessage({
          type: 'query',
          dataType: type,
          startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
          endDate: new Date().toISOString()
        })
      );

      const results = await Promise.all(queries);
      return { samples: results.flat() };
    } catch (error) {
      console.error('Failed to query symptoms:', error);
      return null;
    }
  }

  private async queryOvulation() {
    if (!this.healthStore) return null;
    
    try {
      return await this.healthStore.postMessage({
        type: 'query',
        dataType: 'HKCategoryTypeIdentifierOvulationTestResult',
        startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to query ovulation data:', error);
      return null;
    }
  }

  private async queryBasalBodyTemperature() {
    if (!this.healthStore) return null;
    
    try {
      return await this.healthStore.postMessage({
        type: 'query',
        dataType: 'HKQuantityTypeIdentifierBasalBodyTemperature',
        startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to query basal body temperature:', error);
      return null;
    }
  }

  private async fallbackHealthQuery(): Promise<HealthKitData> {
    // For web-based access, try various fallback methods
    try {
      // Method 1: Check if user has shortcuts configured
      if ('navigator' in window && 'share' in navigator) {
        // Could potentially trigger a Shortcuts action
      }

      // Method 2: Local storage from previous syncs
      const cachedData = localStorage.getItem('health-app-cache');
      if (cachedData) {
        return JSON.parse(cachedData);
      }

      // Method 3: Mock data for demo (remove in production)
      return this.generateMockHealthData();
    } catch (error) {
      console.error('Fallback health query failed:', error);
      return {};
    }
  }

  private generateMockHealthData(): HealthKitData {
    // Generate realistic mock data for demonstration
    const now = new Date();
    const samples = [];
    
    // Generate last 3 cycles
    for (let i = 0; i < 3; i++) {
      const cycleStart = new Date(now.getTime() - (i * 28 + Math.random() * 4 - 2) * 24 * 60 * 60 * 1000);
      const periodLength = 4 + Math.floor(Math.random() * 3);
      
      for (let day = 0; day < periodLength; day++) {
        const sampleDate = new Date(cycleStart.getTime() + day * 24 * 60 * 60 * 1000);
        samples.push({
          startDate: sampleDate,
          endDate: new Date(sampleDate.getTime() + 24 * 60 * 60 * 1000),
          value: (day === 0 || day === periodLength - 1 ? 1 : day === 1 ? 3 : 2) as 1 | 2 | 3 | 4 | 5 // Light/Medium/Heavy pattern
        });
      }
    }

    return {
      menstrualFlow: { samples },
      symptoms: { samples: [] },
      basalBodyTemperature: { samples: [] }
    };
  }

  private async fetchHealthKitData(since?: Date): Promise<HealthKitData> {
    // Use the new live data method
    return await this.getLiveHealthData();
  }

  convertHealthKitToPeriodCycles(healthData: HealthKitData): PeriodCycle[] {
    const cycles: PeriodCycle[] = [];

    if (!healthData.menstrualFlow) return cycles;

    // Group consecutive flow samples into cycles
    const samples = healthData.menstrualFlow.samples.sort(
      (a, b) => a.startDate.getTime() - b.startDate.getTime()
    );

    let currentCycle: Partial<PeriodCycle> | null = null;

    for (const sample of samples) {
      if (!currentCycle || this.isNewCycle(currentCycle.startDate!, sample.startDate)) {
        // Start new cycle
        if (currentCycle) {
          cycles.push(this.completeCycle(currentCycle));
        }

        currentCycle = {
          id: this.generateId(),
          startDate: sample.startDate,
          flow: this.convertHealthKitFlow(sample.value),
          symptoms: [],
          source: 'apple-health',
          synced: true,
          createdAt: new Date(),
          updatedAt: new Date()
        };
      } else {
        // Update existing cycle
        currentCycle.endDate = sample.endDate;
        // Update flow to heaviest recorded
        const currentFlow = this.getFlowWeight(currentCycle.flow || 'light');
        const newFlow = this.getFlowWeight(this.convertHealthKitFlow(sample.value));
        if (newFlow > currentFlow) {
          currentCycle.flow = this.convertHealthKitFlow(sample.value);
        }
      }
    }

    if (currentCycle) {
      cycles.push(this.completeCycle(currentCycle));
    }

    return cycles;
  }

  private isNewCycle(lastDate: Date, currentDate: Date): boolean {
    const daysDiff = Math.floor(
      (currentDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    return daysDiff > 7; // More than 7 days gap indicates new cycle
  }

  private convertHealthKitFlow(healthKitValue: number): 'light' | 'medium' | 'heavy' {
    switch (healthKitValue) {
      case 1:
      case 2:
        return 'light';
      case 3:
        return 'medium';
      case 4:
      case 5:
        return 'heavy';
      default:
        return 'medium';
    }
  }

  private getFlowWeight(flow: 'light' | 'medium' | 'heavy'): number {
    switch (flow) {
      case 'light': return 1;
      case 'medium': return 2;
      case 'heavy': return 3;
      default: return 2;
    }
  }

  private completeCycle(cycle: Partial<PeriodCycle>): PeriodCycle {
    return {
      id: cycle.id!,
      startDate: cycle.startDate!,
      endDate: cycle.endDate,
      flow: cycle.flow!,
      symptoms: cycle.symptoms || [],
      source: cycle.source!,
      synced: cycle.synced!,
      createdAt: cycle.createdAt!,
      updatedAt: cycle.updatedAt!
    };
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}

// Web Health API fallback for non-iOS devices
export class WebHealthIntegration {
  async isSupported(): Promise<boolean> {
    return 'navigator' in window && 'permissions' in navigator;
  }

  async requestPermissions(): Promise<boolean> {
    try {
      if (await this.isSupported()) {
        // Web Health API is limited, but we can request basic permissions
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  async syncData(): Promise<HealthSyncStatus> {
    return {
      lastSync: new Date(),
      status: 'error',
      recordsImported: 0,
      errors: ['Web Health API not yet supported']
    };
  }
}

// Factory function to get appropriate health integration
export function getHealthIntegration(): HealthKitIntegration | WebHealthIntegration {
  const healthKit = new HealthKitIntegration();
  if (healthKit['isSupported']) {
    return healthKit;
  }
  return new WebHealthIntegration();
}

// Period prediction algorithms
export class PeriodPredictor {
  static calculateAverageCycleLength(cycles: PeriodCycle[]): number {
    if (cycles.length < 2) return 28; // Default cycle length

    const cycleLengths: number[] = [];
    
    for (let i = 1; i < cycles.length; i++) {
      const prev = cycles[i - 1];
      const current = cycles[i];
      
      if (prev.startDate && current.startDate) {
        const daysDiff = Math.floor(
          (current.startDate.getTime() - prev.startDate.getTime()) / (1000 * 60 * 60 * 24)
        );
        if (daysDiff > 14 && daysDiff < 45) { // Reasonable cycle length
          cycleLengths.push(daysDiff);
        }
      }
    }

    if (cycleLengths.length === 0) return 28;

    return Math.round(cycleLengths.reduce((sum, length) => sum + length, 0) / cycleLengths.length);
  }

  static calculateAveragePeriodLength(cycles: PeriodCycle[]): number {
    const periodLengths = cycles
      .filter(cycle => cycle.endDate)
      .map(cycle => {
        const daysDiff = Math.floor(
          (cycle.endDate!.getTime() - cycle.startDate.getTime()) / (1000 * 60 * 60 * 24)
        );
        return daysDiff + 1; // Include start day
      })
      .filter(length => length > 0 && length <= 10); // Reasonable period length

    if (periodLengths.length === 0) return 5; // Default period length

    return Math.round(periodLengths.reduce((sum, length) => sum + length, 0) / periodLengths.length);
  }

  static predictNextPeriod(cycles: PeriodCycle[]): Date | null {
    if (cycles.length === 0) return null;

    const sortedCycles = cycles
      .filter(cycle => cycle.startDate)
      .sort((a, b) => b.startDate.getTime() - a.startDate.getTime());

    if (sortedCycles.length === 0) return null;

    const lastCycle = sortedCycles[0];
    const averageCycleLength = this.calculateAverageCycleLength(cycles);

    const nextPeriodDate = new Date(lastCycle.startDate);
    nextPeriodDate.setDate(nextPeriodDate.getDate() + averageCycleLength);

    return nextPeriodDate;
  }
}