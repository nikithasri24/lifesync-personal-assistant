import React, { useState, useEffect } from 'react';
import type { DonutChartProps } from '../DataVisualization.types';

export function DonutChart({
  data,
  size = 200,
  thickness = 20,
  showLegend = true,
  animated = true,
  className = ''
}: DonutChartProps): React.ReactElement | null {
  const [animationProgress, setAnimationProgress] = useState<number>(0);

  useEffect(() => {
    if (animated) {
      setAnimationProgress(0);
      const timer = setTimeout(() => setAnimationProgress(1), 100);
      return () => clearTimeout(timer);
    } else {
      setAnimationProgress(1);
    }
  }, [data, animated]);

  if (data.length === 0) return null;

  const total = data.reduce((sum, item) => sum + item.value, 0);
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;

  let cumulativePercentage = 0;

  return (
    <div className={`flex items-center gap-6 ${className}`}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#E5E7EB"
            strokeWidth={thickness}
          />

          {data.map((item, index) => {
            const percentage = (item.value / total) * 100;
            const strokeDasharray = circumference;
            const strokeDashoffset = circumference - (circumference * percentage / 100) * animationProgress;
            const rotation = (cumulativePercentage / 100) * 360;

            cumulativePercentage += percentage;

            return (
              <circle
                key={index}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={item.color ?? `hsl(${index * 45}, 70%, 60%)`}
                strokeWidth={thickness}
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                style={{
                  transformOrigin: `${size / 2}px ${size / 2}px`,
                  transform: `rotate(${rotation}deg)`,
                  transition: animated ? `stroke-dashoffset 1s ease-out ${index * 200}ms` : 'none'
                }}
              />
            );
          })}
        </svg>

        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{total.toLocaleString()}</div>
            <div className="text-sm text-gray-600">Total</div>
          </div>
        </div>
      </div>

      {showLegend && (
        <div className="space-y-2">
          {data.map((item, index) => (
            <div
              key={index}
              className="flex items-center space-x-2"
              style={{
                opacity: animationProgress,
                transition: animated ? `opacity 0.5s ease-out ${index * 100 + 1000}ms` : 'none'
              }}
            >
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: item.color ?? `hsl(${index * 45}, 70%, 60%)` }}
              />
              <span className="text-sm text-gray-700">{item.label}</span>
              <span className="text-sm font-medium text-gray-900">
                {((item.value / total) * 100).toFixed(1)}%
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
