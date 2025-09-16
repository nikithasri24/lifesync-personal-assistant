import React, { useState, useEffect, useRef } from 'react';
import { TrendingUp, TrendingDown, BarChart3, PieChart, Activity, Info } from 'lucide-react';

interface ChartDataPoint {
  label: string;
  value: number;
  color?: string;
  trend?: 'up' | 'down' | 'neutral';
}

interface LineChartProps {
  data: { x: string; y: number }[];
  height?: number;
  color?: string;
  showGrid?: boolean;
  animated?: boolean;
  className?: string;
}

interface BarChartProps {
  data: ChartDataPoint[];
  height?: number;
  horizontal?: boolean;
  showValues?: boolean;
  animated?: boolean;
  className?: string;
}

interface DonutChartProps {
  data: ChartDataPoint[];
  size?: number;
  thickness?: number;
  showLegend?: boolean;
  animated?: boolean;
  className?: string;
}

interface ProgressRingProps {
  value: number;
  max: number;
  size?: number;
  thickness?: number;
  color?: string;
  backgroundColor?: string;
  showValue?: boolean;
  animated?: boolean;
  className?: string;
}

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon?: React.ComponentType<any>;
  color?: string;
  animated?: boolean;
  className?: string;
}

// Line Chart Component
export function LineChart({ 
  data, 
  height = 200, 
  color = '#3B82F6', 
  showGrid = true, 
  animated = true,
  className = '' 
}: LineChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [animationProgress, setAnimationProgress] = useState(0);

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

  const maxValue = Math.max(...data.map(d => d.y));
  const minValue = Math.min(...data.map(d => d.y));
  const valueRange = maxValue - minValue || 1;

  const points = data.map((point, index) => {
    const x = (index / (data.length - 1)) * 100;
    const y = 100 - ((point.y - minValue) / valueRange) * 100;
    return `${x},${y}`;
  }).join(' ');

  const pathLength = points.split(' ').length * 10; // Approximate path length for animation

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
        {/* Grid */}
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
        
        {/* Area under curve */}
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
        
        {/* Line */}
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
        
        {/* Data points */}
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

// Bar Chart Component
export function BarChart({ 
  data, 
  height = 200, 
  horizontal = false, 
  showValues = true, 
  animated = true,
  className = '' 
}: BarChartProps) {
  const [animationProgress, setAnimationProgress] = useState(0);

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
              {/* Bar */}
              <div
                className={`${horizontal ? 'h-8' : 'w-full'} rounded transition-all duration-700 ease-out`}
                style={{
                  backgroundColor: item.color || '#3B82F6',
                  [horizontal ? 'width' : 'height']: `${animatedPercentage}%`,
                  transitionDelay: `${index * 100}ms`
                }}
              />
              
              {/* Value label */}
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
              
              {/* Label */}
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

// Donut Chart Component
export function DonutChart({ 
  data, 
  size = 200, 
  thickness = 20, 
  showLegend = true, 
  animated = true,
  className = '' 
}: DonutChartProps) {
  const [animationProgress, setAnimationProgress] = useState(0);

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
      {/* Chart */}
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#E5E7EB"
            strokeWidth={thickness}
          />
          
          {/* Data segments */}
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
                stroke={item.color || `hsl(${index * 45}, 70%, 60%)`}
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
        
        {/* Center text */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{total.toLocaleString()}</div>
            <div className="text-sm text-gray-600">Total</div>
          </div>
        </div>
      </div>
      
      {/* Legend */}
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
                style={{ backgroundColor: item.color || `hsl(${index * 45}, 70%, 60%)` }}
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

// Progress Ring Component
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
}: ProgressRingProps) {
  const [animationProgress, setAnimationProgress] = useState(0);

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
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={backgroundColor}
          strokeWidth={thickness}
        />
        
        {/* Progress circle */}
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
      
      {/* Center text */}
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

// Metric Card Component
export function MetricCard({ 
  title, 
  value, 
  change, 
  changeLabel = 'vs last period',
  icon: Icon,
  color = 'blue',
  animated = true,
  className = '' 
}: MetricCardProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (animated) {
      const timer = setTimeout(() => setIsVisible(true), 100);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(true);
    }
  }, [animated]);

  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    green: 'bg-green-50 text-green-600 border-green-200',
    red: 'bg-red-50 text-red-600 border-red-200',
    yellow: 'bg-yellow-50 text-yellow-600 border-yellow-200',
    purple: 'bg-purple-50 text-purple-600 border-purple-200',
    gray: 'bg-gray-50 text-gray-600 border-gray-200'
  };

  return (
    <div 
      className={`p-4 rounded-xl border-2 transition-all duration-500 ${
        colorClasses[color as keyof typeof colorClasses] || colorClasses.blue
      } ${isVisible ? 'opacity-100 transform scale-100' : 'opacity-0 transform scale-95'} ${className}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>
          
          {change !== undefined && (
            <div className="flex items-center mt-2 space-x-1">
              {change >= 0 ? (
                <TrendingUp className="w-4 h-4 text-green-600" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-600" />
              )}
              <span className={`text-sm font-medium ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {change >= 0 ? '+' : ''}{change}%
              </span>
              <span className="text-sm text-gray-500">{changeLabel}</span>
            </div>
          )}
        </div>
        
        {Icon && (
          <div className="ml-4">
            <Icon className="w-8 h-8" />
          </div>
        )}
      </div>
    </div>
  );
}

// Dashboard Grid Component
export function DashboardGrid({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 ${className}`}>
      {children}
    </div>
  );
}

// Chart Container Component
export function ChartContainer({ 
  title, 
  subtitle, 
  children, 
  actions,
  className = '' 
}: { 
  title: string; 
  subtitle?: string; 
  children: React.ReactNode; 
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`bg-white rounded-xl shadow-lg border border-gray-200 p-6 ${className}`}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          {subtitle && <p className="text-sm text-gray-600 mt-1">{subtitle}</p>}
        </div>
        {actions && <div className="flex items-center space-x-2">{actions}</div>}
      </div>
      {children}
    </div>
  );
}