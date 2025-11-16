/**
 * Weight Chart Component
 *
 * Displays weight tracking over time for the 75 Hard challenge.
 * Shows trend line, summary statistics, and handles empty states.
 *
 * Features:
 * - Line chart with animated rendering
 * - Weight change summary (start, current, difference)
 * - Empty state when no weight data exists
 * - Responsive design with dark mode support
 *
 * @component
 */

import React, { useMemo } from 'react';
import { Scale, TrendingDown, TrendingUp, Minus } from 'lucide-react';
import { format } from 'date-fns';
import { LineChart } from '../../../components/DataVisualization';
import type { DailyCheckIn } from '../../../types/seventyFiveHard';

interface WeightChartProps {
  checkIns: DailyCheckIn[];
}

/**
 * Weight Chart Component
 * Visualizes weight tracking data with trend analysis
 */
export default function WeightChart({ checkIns }: WeightChartProps) {
  // ==================== Data Processing ====================

  /**
   * Process and sort weight data for chart visualization
   * Filters out check-ins without weight and sorts chronologically
   */
  const weightData = useMemo(() => {
    return checkIns
      .filter(ci => ci.weight !== undefined && ci.weight !== null)
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .map(ci => ({
        x: format(ci.date, 'MMM d'),
        y: ci.weight!,
        fullDate: format(ci.date, 'MMMM d, yyyy')
      }));
  }, [checkIns]);

  /**
   * Calculate weight change statistics
   */
  const stats = useMemo(() => {
    if (weightData.length === 0) {
      return null;
    }

    const startWeight = weightData[0].y;
    const currentWeight = weightData[weightData.length - 1].y;
    const change = currentWeight - startWeight;
    const changePercentage = ((change / startWeight) * 100);

    return {
      startWeight,
      currentWeight,
      change,
      changePercentage,
      dataPoints: weightData.length,
      trend: change < 0 ? 'down' : change > 0 ? 'up' : 'neutral'
    };
  }, [weightData]);

  // ==================== Empty State ====================

  if (weightData.length === 0) {
    return (
      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700 p-8 text-center">
        <Scale className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-3" />
        <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-1">
          No Weight Data Tracked
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Start logging your weight from the Today tab to see trends here
        </p>
      </div>
    );
  }

  // ==================== Chart View ====================

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Weight Trend
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {stats!.dataPoints} {stats!.dataPoints === 1 ? 'measurement' : 'measurements'} tracked
          </p>
        </div>
        <Scale className="w-8 h-8 text-purple-600" />
      </div>

      {/* Summary Statistics */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {/* Starting Weight */}
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
            <p className="text-xs font-medium text-gray-600 dark:text-gray-400">
              Start
            </p>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {stats!.startWeight.toFixed(1)}
            <span className="text-sm font-normal text-gray-600 dark:text-gray-400 ml-1">kg</span>
          </p>
        </div>

        {/* Current Weight */}
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-purple-500"></div>
            <p className="text-xs font-medium text-gray-600 dark:text-gray-400">
              Current
            </p>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {stats!.currentWeight.toFixed(1)}
            <span className="text-sm font-normal text-gray-600 dark:text-gray-400 ml-1">kg</span>
          </p>
        </div>

        {/* Weight Change */}
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-1">
            {stats!.trend === 'down' && <TrendingDown className="w-4 h-4 text-green-600" />}
            {stats!.trend === 'up' && <TrendingUp className="w-4 h-4 text-red-600" />}
            {stats!.trend === 'neutral' && <Minus className="w-4 h-4 text-gray-600" />}
            <p className="text-xs font-medium text-gray-600 dark:text-gray-400">
              Change
            </p>
          </div>
          <p className={`text-2xl font-bold ${
            stats!.trend === 'down' ? 'text-green-600' :
            stats!.trend === 'up' ? 'text-red-600' :
            'text-gray-600'
          }`}>
            {stats!.change > 0 ? '+' : ''}{stats!.change.toFixed(1)}
            <span className="text-sm font-normal text-gray-600 dark:text-gray-400 ml-1">kg</span>
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
            {stats!.changePercentage > 0 ? '+' : ''}{stats!.changePercentage.toFixed(1)}%
          </p>
        </div>
      </div>

      {/* Line Chart */}
      <div className="mt-6">
        <LineChart
          data={weightData.map(d => ({ x: d.x, y: d.y }))}
          height={250}
          color="#9333EA"
          showGrid={true}
          animated={true}
        />
      </div>

      {/* X-axis labels */}
      <div className="flex justify-between mt-2 px-2">
        <span className="text-xs text-gray-600 dark:text-gray-400">
          {weightData[0].fullDate}
        </span>
        <span className="text-xs text-gray-600 dark:text-gray-400">
          {weightData[weightData.length - 1].fullDate}
        </span>
      </div>
    </div>
  );
}
