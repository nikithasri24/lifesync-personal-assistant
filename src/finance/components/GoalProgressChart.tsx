/**
 * GoalProgressChart Component
 * Simple progress chart matching the app's design system
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
  height = 120,
}) => {
  const width = 600;
  const padding = { top: 10, right: 40, bottom: 25, left: 60 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Combine all points to find the max value for scaling
  const allPoints = [...expectedPath, ...actualPath];
  const maxAmount = Math.max(targetAmount, ...allPoints.map(p => p.amount));

  // Scale functions
  const scaleY = (amount: number): number => {
    const ratio = amount / maxAmount;
    return padding.top + chartHeight - (ratio * chartHeight);
  };

  const scaleX = (index: number, totalPoints: number): number => {
    return padding.left + (index / Math.max(1, totalPoints - 1)) * chartWidth;
  };

  // Generate path string for SVG
  const generatePath = (points: GoalProgressPoint[]): string => {
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
  const formatDate = (dateISO: string): string => {
    return new Date(dateISO).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
  };

  // Y-axis labels
  const yLabels = [
    { amount: targetAmount, label: formatCurrency(targetAmount, 0) },
    { amount: 0, label: '$0' },
  ];

  return (
    <div className="w-full">
      {/* Chart Title */}
      <h4 className="text-xs font-medium text-primary opacity-70 mb-2">Progress Timeline</h4>

      {/* Chart Container */}
      <div className="relative w-full">
        <svg
          width="100%"
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          preserveAspectRatio="xMidYMid meet"
          className="w-full"
        >
          {/* Grid lines */}
          {yLabels.map((label, i) => (
            <line
              key={i}
              x1={padding.left}
              y1={scaleY(label.amount)}
              x2={padding.left + chartWidth}
              y2={scaleY(label.amount)}
              stroke="currentColor"
              strokeWidth="1"
              opacity="0.15"
            />
          ))}

          {/* Expected path (dashed) */}
          {expectedPathString && (
            <path
              d={expectedPathString}
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              opacity="0.4"
              strokeDasharray="4,4"
            />
          )}

          {/* Actual path */}
          {actualPathString && (
            <path
              d={actualPathString}
              fill="none"
              stroke="#60a5fa"
              strokeWidth="2"
            />
          )}

          {/* Target line */}
          <line
            x1={padding.left}
            y1={scaleY(targetAmount)}
            x2={padding.left + chartWidth}
            y2={scaleY(targetAmount)}
            stroke="#34d399"
            strokeWidth="2"
          />

          {/* Y-axis labels */}
          {yLabels.map((label, i) => (
            <text
              key={i}
              x={padding.left - 10}
              y={scaleY(label.amount)}
              textAnchor="end"
              dominantBaseline="middle"
              fontSize="11"
              fill="currentColor"
              opacity="0.6"
            >
              {label.label}
            </text>
          ))}

          {/* X-axis labels */}
          {expectedPath.length > 0 && (
            <>
              <text
                x={padding.left}
                y={height - 5}
                textAnchor="start"
                fontSize="11"
                fill="currentColor"
                opacity="0.6"
              >
                {formatDate(expectedPath[0].dateISO)}
              </text>
              <text
                x={padding.left + chartWidth}
                y={height - 5}
                textAnchor="end"
                fontSize="11"
                fill="currentColor"
                opacity="0.6"
              >
                {formatDate(expectedPath[expectedPath.length - 1].dateISO)}
              </text>
            </>
          )}
        </svg>
      </div>

      {/* Legend */}
      <div className="mt-2 flex items-center justify-center gap-4 text-xs text-primary opacity-70">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-0.5 border-t border-dashed border-current opacity-40"></div>
          <span>Expected</span>
        </div>
        {actualPath.length > 0 && (
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-0.5 bg-blue-400"></div>
            <span>Actual</span>
          </div>
        )}
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-0.5 bg-emerald-400"></div>
          <span>Target</span>
        </div>
      </div>
    </div>
  );
};

export default GoalProgressChart;
