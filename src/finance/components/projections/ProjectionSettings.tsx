import React from 'react';
import { Settings } from 'lucide-react';

interface ProjectionSettingsProps {
  projectionYears: number;
  setProjectionYears: (years: number) => void;
  annualReturnRate: number;
  setAnnualReturnRate: (rate: number) => void;
  inflationRate: number;
  setInflationRate: (rate: number) => void;
}

export const ProjectionSettings: React.FC<ProjectionSettingsProps> = ({
  projectionYears,
  setProjectionYears,
  annualReturnRate,
  setAnnualReturnRate,
  inflationRate,
  setInflationRate,
}) => {
  return (
    <div className="rounded-2xl bg-primary/30 backdrop-blur-sm shadow-sm ring-1 border-primary/20 p-5">
      <div className="flex items-center gap-2 mb-4">
        <Settings className="h-5 w-5 text-[#C18B5E]" />
        <h3 className="text-lg font-semibold text-primary">Projection Settings</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-primary opacity-70 mb-2">
            Projection Years
          </label>
          <select
            value={projectionYears}
            onChange={e => setProjectionYears(Number(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#E5B88A] dark:bg-gray-700 dark:text-white"
          >
            <option value={5}>5 Years</option>
            <option value={10}>10 Years</option>
            <option value={20}>20 Years</option>
            <option value={30}>30 Years</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-primary opacity-70 mb-2">
            Expected Return Rate
          </label>
          <select
            value={annualReturnRate}
            onChange={e => setAnnualReturnRate(Number(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#E5B88A] dark:bg-gray-700 dark:text-white"
          >
            <option value={5}>5% (Conservative)</option>
            <option value={7}>7% (Moderate)</option>
            <option value={9}>9% (Aggressive)</option>
            <option value={10}>10% (Very Aggressive)</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-primary opacity-70 mb-2">
            Inflation Rate
          </label>
          <select
            value={inflationRate}
            onChange={e => setInflationRate(Number(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#E5B88A] dark:bg-gray-700 dark:text-white"
          >
            <option value={2}>2%</option>
            <option value={3}>3%</option>
            <option value={4}>4%</option>
          </select>
        </div>
      </div>
    </div>
  );
};
