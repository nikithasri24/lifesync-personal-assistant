export interface ChartDataPoint {
  label: string;
  value: number;
  color?: string;
  trend?: 'up' | 'down' | 'neutral';
}

export interface LineChartProps {
  data: { x: string; y: number }[];
  height?: number;
  color?: string;
  showGrid?: boolean;
  animated?: boolean;
  className?: string;
}

export interface BarChartProps {
  data: ChartDataPoint[];
  height?: number;
  horizontal?: boolean;
  showValues?: boolean;
  animated?: boolean;
  className?: string;
}

export interface DonutChartProps {
  data: ChartDataPoint[];
  size?: number;
  thickness?: number;
  showLegend?: boolean;
  animated?: boolean;
  className?: string;
}

export interface ProgressRingProps {
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

export interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  color?: 'blue' | 'green' | 'red' | 'yellow' | 'purple' | 'gray';
  animated?: boolean;
  className?: string;
}
