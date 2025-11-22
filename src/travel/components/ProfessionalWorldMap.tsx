/**
 * ProfessionalWorldMap - Using react-svg-worldmap for accurate country boundaries
 */

import React from 'react';
import WorldMap from 'react-svg-worldmap';
import type { VisitStatus } from '../types';

type ProfessionalWorldMapProps = {
  visitedCountries: Record<string, VisitStatus>;
  onCountryClick: (countryCode: string) => void;
};

const ProfessionalWorldMap: React.FC<ProfessionalWorldMapProps> = ({
  visitedCountries,
  onCountryClick,
}) => {
  // Convert our visited countries to the format expected by react-svg-worldmap
  const mapData = Object.entries(visitedCountries).map(([code, status]) => {
    // Assign values based on status for color coding
    let value = 0;
    switch (status) {
      case 'visited':
        value = 1;
        break;
      case 'lived':
        value = 2;
        break;
      case 'transit':
        value = 0.5;
        break;
      case 'wishlist':
        value = 0.3;
        break;
    }

    return {
      country: code.toLowerCase(),
      value,
    };
  });

  const getCountryColor = (country: any, _countryValue: number) => {
    const code = country?.country?.toUpperCase();
    const status = code ? visitedCountries[code] : undefined;

    switch (status) {
      case 'visited':
        return '#3B82F6'; // blue-500
      case 'lived':
        return '#10B981'; // green-500
      case 'transit':
        return '#F59E0B'; // yellow-500
      case 'wishlist':
        return '#A855F7'; // purple-500
      default:
        return '#E5E7EB'; // gray-200
    }
  };

  const handleCountryClick = (event: any, countryCode: string) => {
    const code = countryCode.toUpperCase();
    onCountryClick(code);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Interactive World Map</h3>
        <p className="text-sm text-gray-600">
          Click on any country to mark your visit status
        </p>
      </div>

      <div className="relative bg-blue-50 rounded-lg p-4">
        <WorldMap
          color="#3B82F6"
          title=""
          value-suffix="countries"
          size="xxl"
          data={mapData}
          richInteraction={true}
          backgroundColor="#E0F2FE"
          borderColor="#FFFFFF"
          strokeOpacity={0.3}
          onClickFunction={handleCountryClick}
          styleFunction={getCountryColor}
        />
      </div>

      <div className="mt-4 flex items-center justify-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-500 rounded"></div>
          <span className="text-gray-700">Visited</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-500 rounded"></div>
          <span className="text-gray-700">Lived</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-yellow-500 rounded"></div>
          <span className="text-gray-700">Transit</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-purple-500 rounded"></div>
          <span className="text-gray-700">Wishlist</span>
        </div>
      </div>
    </div>
  );
};

export default ProfessionalWorldMap;
