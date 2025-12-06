import React, { useState, useEffect } from 'react';
import type { ProgressRingProps } from '../DataVisualization.types';

export function ProgressRing({
  value,
  max,
  size = 120,
  thickness = 8,
  color = '#3B82F6',
  backgroundColor = '#E5E7EB',
  showValue = true,
  animated = true,
  className = ''
}: ProgressRingProps): React.ReactElement {
  const [animationProgress, setAnimationProgress] = useState<number>(0);

  useEffect(() => {
    if (animated) {
      setAnimationProgress(0);
      const timer = setTimeout(() => setAnimationProgress(1), 100);
      return () => clearTimeout(timer);
    } else {
      setAnimationProgress(1);
    }
  }, [value, max, animated]);

  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  const percentage = (value / max) * 100;
  const strokeDashoffset = circumference - (circumference * percentage / 100) * animationProgress;

  return (
    <div className={`relative ${className}`} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={backgroundColor}
          strokeWidth={thickness}
        />

        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={thickness}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          style={{
            transition: animated ? 'stroke-dashoffset 1s ease-out' : 'none'
          }}
        />
      </svg>

      {showValue && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-lg font-bold text-gray-900">
              {Math.round(percentage * animationProgress)}%
            </div>
            <div className="text-xs text-gray-600">
              {Math.round(value * animationProgress)} / {max}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
