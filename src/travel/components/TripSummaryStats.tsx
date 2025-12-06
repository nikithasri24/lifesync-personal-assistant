import React from 'react';
import { Globe, DollarSign, Clock } from 'lucide-react';

interface TripSummary {
  totalCountries: number;
  visaFreeCount: number;
  totalEstimatedCost: number;
  totalProcessingDays: number;
  canUseSchengenVisa: boolean;
  schengenCountries: string[];
}

interface TripSummaryStatsProps {
  summary: TripSummary;
}

const TripSummaryStats: React.FC<TripSummaryStatsProps> = ({ summary }) => {
  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <Globe className="w-4 h-4 text-blue-600" />
            <span className="text-xs text-blue-600 font-medium">Countries</span>
          </div>
          <div className="text-2xl font-bold text-blue-700">{summary.totalCountries}</div>
        </div>
        <div className="bg-green-50 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <Globe className="w-4 h-4 text-green-600" />
            <span className="text-xs text-green-600 font-medium">Visa Free</span>
          </div>
          <div className="text-2xl font-bold text-green-700">{summary.visaFreeCount}</div>
        </div>
        <div className="bg-orange-50 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <DollarSign className="w-4 h-4 text-orange-600" />
            <span className="text-xs text-orange-600 font-medium">Est. Cost</span>
          </div>
          <div className="text-2xl font-bold text-orange-700">
            ${summary.totalEstimatedCost}
          </div>
        </div>
        <div className="bg-purple-50 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-4 h-4 text-purple-600" />
            <span className="text-xs text-purple-600 font-medium">Processing</span>
          </div>
          <div className="text-2xl font-bold text-purple-700">
            {summary.totalProcessingDays}d
          </div>
        </div>
      </div>

      {summary.canUseSchengenVisa && (
        <div className="mt-4 p-3 bg-purple-50 border border-purple-200 rounded-lg">
          <div className="flex items-start gap-2">
            <span className="text-lg">💡</span>
            <div>
              <h4 className="font-semibold text-purple-900 text-sm">Schengen Visa Optimization</h4>
              <p className="text-sm text-purple-700 mt-1">
                You're visiting {summary.schengenCountries.length} Schengen countries.
                You only need ONE Schengen visa for: {summary.schengenCountries.join(', ')}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default TripSummaryStats;
