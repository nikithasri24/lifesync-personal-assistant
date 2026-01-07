/**
 * ProfessionalWorldMap - Using react-svg-worldmap for accurate country boundaries
 * NOTE: This component requires 'react-svg-worldmap' package to be installed
 * Run: npm install react-svg-worldmap
 */

import React from 'react';
// import WorldMap from 'react-svg-worldmap';  // TODO: Install package
import type { VisitStatus } from '../types';

type ProfessionalWorldMapProps = {
  visitedCountries: Record<string, VisitStatus>;
  onCountryClick: (countryCode: string) => void;
};

type CountryData = {
  country?: string;
};

type ClickEvent = {
  target?: unknown;
};

const ProfessionalWorldMap: React.FC<ProfessionalWorldMapProps> = ({
  visitedCountries,
  onCountryClick: _onCountryClick,
}) => {
  // Convert our visited countries to the format expected by react-svg-worldmap
  const _mapData = Object.entries(visitedCountries).map(([code, status]) => {
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

  const _getCountryColor = (country: CountryData, _countryValue: number): string => {
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

  const _handleCountryClick = (_event: ClickEvent, countryCode: string): void => {
    const code = countryCode.toUpperCase();
    _onCountryClick(code);
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
        {/* <WorldMap
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
        /> */}
        <div className="flex items-center justify-center h-96 text-gray-500">
          <div className="text-center">
            <p className="text-lg mb-2">Map component not available</p>
            <p className="text-sm">Install react-svg-worldmap package to enable this feature</p>
          </div>
        </div>
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
