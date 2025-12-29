import type { EnergyLevel, UserSchedulingPrefs } from './types';

/**
 * Get energy level for a given hour or Date
 */
export function getEnergyLevel(timeOrHour: Date | number, prefs: UserSchedulingPrefs): EnergyLevel {
  const hour = typeof timeOrHour === 'number' ? timeOrHour : timeOrHour.getHours();
  if (hour >= prefs.peakEnergyStart && hour < prefs.peakEnergyEnd) {
    return 'peak';
  }
  if (hour >= prefs.lowEnergyStart && hour < prefs.lowEnergyEnd) {
    return 'low';
  }
  return 'moderate';
}
