import type { PeriodCycle } from '../types/index';

// Period prediction algorithms
export class PeriodPredictor {
  static calculateAverageCycleLength(cycles: PeriodCycle[]): number {
    if (cycles.length < 2) return 28; // Default cycle length

    const cycleLengths: number[] = [];

    for (let i = 1; i < cycles.length; i++) {
      const prev = cycles[i - 1];
      const current = cycles[i];

      if (prev !== undefined && current !== undefined && prev.startDate !== undefined && current.startDate !== undefined) {
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
      .filter(cycle => cycle.endDate !== undefined)
      .map(cycle => {
        if (cycle.endDate === undefined) {
          return 0;
        }
        const daysDiff = Math.floor(
          (cycle.endDate.getTime() - cycle.startDate.getTime()) / (1000 * 60 * 60 * 24)
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
      .filter(cycle => cycle.startDate !== undefined)
      .sort((a, b) => b.startDate.getTime() - a.startDate.getTime());

    if (sortedCycles.length === 0) return null;

    const lastCycle = sortedCycles[0];
    if (lastCycle === undefined) return null;

    const averageCycleLength = this.calculateAverageCycleLength(cycles);

    const nextPeriodDate = new Date(lastCycle.startDate);
    nextPeriodDate.setDate(nextPeriodDate.getDate() + averageCycleLength);

    return nextPeriodDate;
  }
}
