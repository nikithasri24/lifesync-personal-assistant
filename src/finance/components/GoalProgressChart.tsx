/**
 * GoalProgressChart Component
 * Shows expected vs actual progress towards a goal with visual indicators
 */

import React from 'react';
import type { GoalProgressPoint } from '../types';
import { formatCurrency } from '../utils/currency';

interface GoalProgressChartProps {
  expectedPath: GoalProgressPoint[];
  actualPath?: GoalProgressPoint[];
  targetAmount: number;
  currentAmount: number;
  height?: number;
}

export const GoalProgressChart: React.FC<GoalProgressChartProps> = ({
  expectedPath,
  actualPath = [],
  targetAmount,
  currentAmount,
  height = 120,
}) => {
  const width = 100; // Percentage-based width
  const padding = { top: 10, right: 10, bottom: 20, left: 10 };
  const chartHeight = height - padding.top - padding.bottom;

  // Combine all points to find the max value for scaling
  const allPoints = [...expectedPath, ...actualPath];
  const maxAmount = Math.max(targetAmount, ...allPoints.map(p => p.amount));
  const minAmount = 0;

  // Scale functions
  const scaleY = (amount: number) => {
    const ratio = (amount - minAmount) / (maxAmount - minAmount);
    return chartHeight - (ratio * chartHeight) + padding.top;
  };

  const scaleX = (index: number, totalPoints: number) => {
    return (index / Math.max(1, totalPoints - 1)) * 100;
  };

  // Generate path string for SVG
  const generatePath = (points: GoalProgressPoint[]) => {
    if (points.length === 0) return '';

    return points.map((p, i) => {
      const x = scaleX(i, points.length);
      const y = scaleY(p.amount);
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');
  };

  const expectedPathString = generatePath(expectedPath);
  const actualPathString = actualPath.length > 0 ? generatePath(actualPath) : '';

  // Format date for display
  const formatDate = (dateISO: string) => {
    return new Date(dateISO).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
  };

  return (
    <div className="relative w-full" style={{ height: `${height}px` }}>
      <svg
        viewBox={`0 0 100 ${height}`}
        preserveAspectRatio="none"
        className="w-full h-full"
      >
        {/* Background grid lines */}
        <line x1="0" y1={scaleY(targetAmount)} x2="100" y2={scaleY(targetAmount)} stroke="#cbd5e1" strokeWidth="0.5" strokeDasharray="2,2" />
        <line x1="0" y1={scaleY(targetAmount / 2)} x2="100" y2={scaleY(targetAmount / 2)} stroke="#e2e8f0" strokeWidth="0.3" />

        {/* Expected path (dashed line) */}
        {expectedPathString && (
          <path
            d={expectedPathString}
            fill="none"
            stroke="#94a3b8"
            strokeWidth="0.8"
            strokeDasharray="3,3"
            vectorEffect="non-scaling-stroke"
          />
        )}

        {/* Actual path (solid line) */}
        {actualPathString && (
          <path
            d={actualPathString}
            fill="none"
            stroke="#3b82f6"
            strokeWidth="1.2"
            vectorEffect="non-scaling-stroke"
          />
        )}

        {/* Current progress dot */}
        {actualPath.length > 0 && (
          <circle
            cx={scaleX(actualPath.length - 1, expectedPath.length)}
            cy={scaleY(actualPath[actualPath.length - 1].amount)}
            r="1.5"
            fill="#3b82f6"
            vectorEffect="non-scaling-stroke"
          />
        )}

        {/* Target line */}
        <line
          x1="0"
          y1={scaleY(targetAmount)}
          x2="100"
          y2={scaleY(targetAmount)}
          stroke="#10b981"
          strokeWidth="0.8"
          vectorEffect="non-scaling-stroke"
        />
      </svg>

      {/* Legend */}
      <div className="absolute bottom-0 left-0 right-0 flex items-center justify-center gap-4 text-xs text-slate-600">
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-0.5 bg-slate-400 border-t border-dashed border-slate-400"></div>
          <span>Expected</span>
        </div>
        {actualPath.length > 0 && (
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-0.5 bg-blue-500"></div>
            <span>Actual</span>
          </div>
        )}
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-0.5 bg-emerald-500"></div>
          <span>Target</span>
        </div>
      </div>

      {/* Start and end labels */}
      {expectedPath.length > 0 && (
        <>
          <div className="absolute bottom-5 left-0 text-xs text-slate-500">
            {formatDate(expectedPath[0].dateISO)}
          </div>
          <div className="absolute bottom-5 right-0 text-xs text-slate-500">
            {formatDate(expectedPath[expectedPath.length - 1].dateISO)}
          </div>
        </>
      )}
    </div>
  );
};

export default GoalProgressChart;
