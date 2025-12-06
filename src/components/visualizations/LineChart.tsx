import React, { useState, useEffect, useRef } from 'react';
import type { LineChartProps } from '../DataVisualization.types';

export function LineChart({
  data,
  height = 200,
  color = '#3B82F6',
  showGrid = true,
  animated = true,
  className = ''
}: LineChartProps): React.ReactElement | null {
  const svgRef = useRef<SVGSVGElement>(null);
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

  const maxValue = Math.max(...data.map(d => d.y));
  const minValue = Math.min(...data.map(d => d.y));
  const valueRange = maxValue - minValue || 1;

  const points = data.map((point, index) => {
    const x = (index / (data.length - 1)) * 100;
    const y = 100 - ((point.y - minValue) / valueRange) * 100;
    return `${x},${y}`;
  }).join(' ');

  const pathLength = points.split(' ').length * 10;

  return (
    <div className={`w-full ${className}`}>
      <svg
        ref={svgRef}
        width="100%"
        height={height}
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="overflow-visible"
      >
        {showGrid && (
          <g opacity="0.1">
            {[0, 25, 50, 75, 100].map(y => (
              <line key={y} x1="0" y1={y} x2="100" y2={y} stroke="currentColor" strokeWidth="0.5" />
            ))}
            {[0, 25, 50, 75, 100].map(x => (
              <line key={x} x1={x} y1="0" x2={x} y2="100" stroke="currentColor" strokeWidth="0.5" />
            ))}
          </g>
        )}

        <defs>
          <linearGradient id="lineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0.05" />
          </linearGradient>
        </defs>

        <path
          d={`M 0,100 L ${points} L 100,100 Z`}
          fill="url(#lineGradient)"
          style={{
            transform: `scaleX(${animationProgress})`,
            transformOrigin: 'left center',
            transition: animated ? 'transform 1.5s ease-out' : 'none'
          }}
        />

        <polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            strokeDasharray: animated ? pathLength : 'none',
            strokeDashoffset: animated ? pathLength * (1 - animationProgress) : 0,
            transition: animated ? 'stroke-dashoffset 1.5s ease-out' : 'none'
          }}
        />

        {data.map((point, index) => {
          const x = (index / (data.length - 1)) * 100;
          const y = 100 - ((point.y - minValue) / valueRange) * 100;
          return (
            <circle
              key={index}
              cx={x}
              cy={y}
              r="2"
              fill={color}
              style={{
                opacity: animationProgress,
                transform: `scale(${animationProgress})`,
                transformOrigin: `${x}% ${y}%`,
                transition: animated ? `all 0.5s ease-out ${index * 0.1}s` : 'none'
              }}
            />
          );
        })}
      </svg>
    </div>
  );
}
