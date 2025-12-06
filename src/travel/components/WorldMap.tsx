/**
 * WorldMap - Interactive scratch-style world map
 * Using a simple clickable country list for now
 */

import React from 'react';
import { Check } from 'lucide-react';
import type { VisitStatus } from '../types';

type WorldMapProps = {
  visitedCountries: Record<string, VisitStatus>; // country code -> status
  onCountryClick: (countryCode: string) => void;
};

const WorldMap: React.FC<WorldMapProps> = ({ visitedCountries, onCountryClick }) => {
  const getStatusColor = (status?: VisitStatus): string => {
    switch (status) {
      case 'visited':
        return 'bg-blue-500';
      case 'lived':
        return 'bg-green-500';
      case 'transit':
        return 'bg-yellow-500';
      case 'wishlist':
        return 'bg-purple-500';
      default:
        return 'bg-gray-200';
    }
  };

  const getStatusBorder = (status?: VisitStatus): string => {
    switch (status) {
      case 'visited':
        return 'border-blue-300';
      case 'lived':
        return 'border-green-300';
      case 'transit':
        return 'border-yellow-300';
      case 'wishlist':
        return 'border-purple-300';
      default:
        return 'border-gray-300';
    }
  };

  // Organized list of countries by continent
  const continents = [
    {
      name: 'North America',
      countries: [
        { code: 'US', name: 'United States', flag: '🇺🇸' },
        { code: 'CA', name: 'Canada', flag: '🇨🇦' },
        { code: 'MX', name: 'Mexico', flag: '🇲🇽' },
      ],
    },
    {
      name: 'South America',
      countries: [
        { code: 'BR', name: 'Brazil', flag: '🇧🇷' },
        { code: 'AR', name: 'Argentina', flag: '🇦🇷' },
        { code: 'CL', name: 'Chile', flag: '🇨🇱' },
        { code: 'PE', name: 'Peru', flag: '🇵🇪' },
        { code: 'CO', name: 'Colombia', flag: '🇨🇴' },
      ],
    },
    {
      name: 'Europe',
      countries: [
        { code: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
        { code: 'FR', name: 'France', flag: '🇫🇷' },
        { code: 'DE', name: 'Germany', flag: '🇩🇪' },
        { code: 'ES', name: 'Spain', flag: '🇪🇸' },
        { code: 'IT', name: 'Italy', flag: '🇮🇹' },
        { code: 'PT', name: 'Portugal', flag: '🇵🇹' },
        { code: 'NL', name: 'Netherlands', flag: '🇳🇱' },
        { code: 'CH', name: 'Switzerland', flag: '🇨🇭' },
        { code: 'GR', name: 'Greece', flag: '🇬🇷' },
        { code: 'NO', name: 'Norway', flag: '🇳🇴' },
        { code: 'SE', name: 'Sweden', flag: '🇸🇪' },
        { code: 'DK', name: 'Denmark', flag: '🇩🇰' },
      ],
    },
    {
      name: 'Asia',
      countries: [
        { code: 'CN', name: 'China', flag: '🇨🇳' },
        { code: 'IN', name: 'India', flag: '🇮🇳' },
        { code: 'JP', name: 'Japan', flag: '🇯🇵' },
        { code: 'TH', name: 'Thailand', flag: '🇹🇭' },
        { code: 'VN', name: 'Vietnam', flag: '🇻🇳' },
        { code: 'SG', name: 'Singapore', flag: '🇸🇬' },
        { code: 'MY', name: 'Malaysia', flag: '🇲🇾' },
        { code: 'ID', name: 'Indonesia', flag: '🇮🇩' },
        { code: 'PH', name: 'Philippines', flag: '🇵🇭' },
        { code: 'KR', name: 'South Korea', flag: '🇰🇷' },
      ],
    },
    {
      name: 'Africa',
      countries: [
        { code: 'EG', name: 'Egypt', flag: '🇪🇬' },
        { code: 'ZA', name: 'South Africa', flag: '🇿🇦' },
        { code: 'KE', name: 'Kenya', flag: '🇰🇪' },
        { code: 'MA', name: 'Morocco', flag: '🇲🇦' },
        { code: 'TZ', name: 'Tanzania', flag: '🇹🇿' },
        { code: 'NG', name: 'Nigeria', flag: '🇳🇬' },
      ],
    },
    {
      name: 'Middle East',
      countries: [
        { code: 'AE', name: 'UAE', flag: '🇦🇪' },
        { code: 'SA', name: 'Saudi Arabia', flag: '🇸🇦' },
        { code: 'TR', name: 'Turkey', flag: '🇹🇷' },
        { code: 'IL', name: 'Israel', flag: '🇮🇱' },
        { code: 'JO', name: 'Jordan', flag: '🇯🇴' },
      ],
    },
    {
      name: 'Oceania',
      countries: [
        { code: 'AU', name: 'Australia', flag: '🇦🇺' },
        { code: 'NZ', name: 'New Zealand', flag: '🇳🇿' },
        { code: 'FJ', name: 'Fiji', flag: '🇫🇯' },
      ],
    },
  ];

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="space-y-6">
        {continents.map((continent) => (
          <div key={continent.name}>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">{continent.name}</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
              {continent.countries.map((country) => {
                const status = visitedCountries[country.code];
                return (
                  <button
                    key={country.code}
                    onClick={() => onCountryClick(country.code)}
                    className={`relative flex items-center gap-2 p-3 rounded-lg border-2 transition-all hover:shadow-md ${
                      status
                        ? `${getStatusColor(status)} text-white ${getStatusBorder(status)}`
                        : 'bg-white border-gray-200 hover:border-gray-300 text-gray-900'
                    }`}
                  >
                    <span className="text-2xl">{country.flag}</span>
                    <span className="text-sm font-medium truncate flex-1 text-left">
                      {country.name}
                    </span>
                    {status && (
                      <Check className="h-4 w-4 flex-shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Instructions */}
      <div className="mt-6 pt-6 border-t border-gray-200 text-center">
        <p className="text-sm text-gray-600">
          Click on any country to mark your visit status
        </p>
      </div>
    </div>
  );
};

export default WorldMap;
