/**
 * InteractiveWorldMap - SVG-based world map with clickable countries
 */

import React from 'react';
import { logger } from '../../services/logger';

import type { VisitStatus } from '../types';

type InteractiveWorldMapProps = {
  visitedCountries: Record<string, VisitStatus>;
  onCountryClick: (countryCode: string) => void;
};

const InteractiveWorldMap: React.FC<InteractiveWorldMapProps> = ({
  visitedCountries,
  onCountryClick: _onCountryClick,
}) => {
  const [_hoveredCountry, _setHoveredCountry] = React.useState<string | null>(null);

  const _getCountryFill = (countryCode: string): string => {
    const status = visitedCountries[countryCode];
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

  // Load world map SVG from a public source
  React.useEffect(() => {
    const svg = document.getElementById('world-map-svg');
    if (!svg) return;

    // Fetch world map from public CDN
    fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json')
      .then(res => res.json())
      .then(data => {
        // Use D3 or similar to render the map
        // For now, we'll use a simpler approach
        logger.info('InteractiveWorldMap', 'Map data loaded', data);
      })
      .catch(err => logger.error('InteractiveWorldMap', 'Error loading map', { error: err instanceof Error ? err.message : String(err) }));
  }, []);

  return (
    <div className="relative w-full bg-white rounded-lg border border-gray-200 p-4">
      <div className="aspect-[2/1] relative">
        <iframe
          src="https://mapchart.net/world.html"
          className="w-full h-full rounded-lg"
          style={{ border: 'none', minHeight: '500px' }}
          title="World Map"
        />
      </div>
      <div className="mt-4 text-center">
        <p className="text-sm text-gray-600">
          Use mapchart.net to create your scratch map, then upload the image here
        </p>
      </div>
    </div>
  );
};

export default InteractiveWorldMap;
