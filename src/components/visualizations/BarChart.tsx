import React, { useState, useEffect } from 'react';
import type { BarChartProps } from '../DataVisualization.types';

export function BarChart({
  data,
  height = 200,
  horizontal = false,
  showValues = true,
  animated = true,
  className = ''
}: BarChartProps): React.ReactElement | null {
  const [animationProgress, setAnimationProgress] = useState<number>(0);

  useEffect((): void => {
    if (animated) {
      setAnimationProgress(0);
      const timer = setTimeout(() => setAnimationProgress(1), 100);
      return () => clearTimeout(timer);
    } else {
      setAnimationProgress(1);
    }
  }, [data, animated]);

  if (data.length === 0) return null;

  const maxValue = Math.max(...data.map(d => d.value));

  return (
    <div className={`w-full ${className}`} style={{ height }}>
      <div className={`h-full flex ${horizontal ? 'flex-col' : 'flex-row items-end'} gap-2`}>
        {data.map((item, index) => {
          const percentage = (item.value / maxValue) * 100;
          const animatedPercentage = percentage * animationProgress;

          return (
            <div
              key={index}
              className={`flex-1 relative group ${horizontal ? 'flex items-center' : 'flex flex-col justify-end'}`}
            >
              <div
                className={`${horizontal ? 'h-8' : 'w-full'} rounded transition-all duration-700 ease-out`}
                style={{
                  backgroundColor: item.color ?? '#3B82F6',
                  [horizontal ? 'width' : 'height']: `${animatedPercentage}%`,
                  transitionDelay: `${index * 100}ms`
                }}
              />

              {showValues && (
                <div
                  className={`absolute text-xs font-medium text-gray-700 ${
                    horizontal ? 'left-2 top-1/2 -translate-y-1/2' : 'bottom-full mb-1 left-1/2 -translate-x-1/2'
                  }`}
                  style={{
                    opacity: animationProgress,
                    transition: animated ? `opacity 0.5s ease-out ${index * 100 + 700}ms` : 'none'
                  }}
                >
                  {item.value.toLocaleString()}
                </div>
              )}

              <div
                className={`text-xs text-gray-600 text-center ${horizontal ? 'ml-2' : 'mt-2'}`}
                style={{
                  opacity: animationProgress,
                  transition: animated ? `opacity 0.5s ease-out ${index * 100 + 500}ms` : 'none'
                }}
              >
                {item.label}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
