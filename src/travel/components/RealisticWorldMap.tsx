/**
 * RealisticWorldMap - Using embedded map visualization
 */

import React from 'react';
import type { VisitStatus } from '../types';

type RealisticWorldMapProps = {
  visitedCountries: Record<string, VisitStatus>;
  onCountryClick: (countryCode: string) => void;
};

const RealisticWorldMap: React.FC<RealisticWorldMapProps> = ({ visitedCountries }) => {
  const [mapUrl, setMapUrl] = React.useState<string>('');

  React.useEffect(() => {
    // Generate map visualization URL based on visited countries
    const visitedCodes = Object.keys(visitedCountries).join(',');

    // Using amCharts map or similar service
    // For now, show instructions
    setMapUrl('');
  }, [visitedCountries]);

  const stats = {
    visited: Object.values(visitedCountries).filter(s => s === 'visited').length,
    lived: Object.values(visitedCountries).filter(s => s === 'lived').length,
    transit: Object.values(visitedCountries).filter(s => s === 'transit').length,
    wishlist: Object.values(visitedCountries).filter(s => s === 'wishlist').length,
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      {/* Map Container with better visual */}
      <div className="relative bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-100 rounded-lg p-8 min-h-[500px]">
        {/* Decorative world map placeholder */}
        <div className="absolute inset-0 opacity-10 flex items-center justify-center">
          <svg viewBox="0 0 800 400" className="w-full h-full">
            {/* Continents outline */}
            <g fill="#1E40AF" stroke="none">
              {/* North America */}
              <ellipse cx="180" cy="120" rx="90" ry="70" />
              {/* South America */}
              <ellipse cx="250" cy="280" rx="50" ry="90" />
              {/* Europe */}
              <ellipse cx="420" cy="100" rx="60" ry="40" />
              {/* Africa */}
              <ellipse cx="450" cy="220" rx="70" ry="90" />
              {/* Asia */}
              <ellipse cx="600" cy="140" rx="120" ry="80" />
              {/* Australia */}
              <ellipse cx="680" cy="320" rx="60" ry="40" />
            </g>
          </svg>
        </div>

        {/* Stats overlay */}
        <div className="relative z-10 flex flex-col items-center justify-center h-full">
          <div className="bg-white/95 rounded-xl shadow-lg p-8 max-w-2xl">
            <div className="text-center mb-6">
              <div className="text-6xl mb-4">🗺️</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Your Travel Map
              </h3>
              <p className="text-gray-600">
                Track your adventures across the globe
              </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
                <div className="text-3xl font-bold text-blue-600">{stats.visited}</div>
                <div className="text-sm text-blue-700 font-medium mt-1">Visited</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg border-2 border-green-200">
                <div className="text-3xl font-bold text-green-600">{stats.lived}</div>
                <div className="text-sm text-green-700 font-medium mt-1">Lived</div>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg border-2 border-yellow-200">
                <div className="text-3xl font-bold text-yellow-600">{stats.transit}</div>
                <div className="text-sm text-yellow-700 font-medium mt-1">Transit</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg border-2 border-purple-200">
                <div className="text-3xl font-bold text-purple-600">{stats.wishlist}</div>
                <div className="text-sm text-purple-700 font-medium mt-1">Wishlist</div>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200 text-center">
              <p className="text-sm text-gray-600 mb-4">
                Use the <strong>Country Grid</strong> view below to select countries
              </p>
              <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
                <span>💡 Tip:</span>
                <span>Click countries in the grid to mark your travel status</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Additional info */}
      <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex items-start gap-3">
          <div className="text-2xl">🌍</div>
          <div className="flex-1">
            <h4 className="font-semibold text-gray-900 mb-1">Visual Map Coming Soon!</h4>
            <p className="text-sm text-gray-600">
              We're working on integrating a detailed interactive world map. For now, use the Country Grid below to mark countries you've visited.
              Your progress is automatically saved and will be displayed on the visual map once it's ready!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RealisticWorldMap;
