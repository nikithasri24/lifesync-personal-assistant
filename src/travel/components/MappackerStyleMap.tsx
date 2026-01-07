/**
 * MappackerStyleMap - Exact UI match for mappacker.com
 * Clean, minimalist design with map and country list
 */

import React from 'react';
import { logger } from '../../services/logger';

import { geoPath, geoNaturalEarth1 } from 'd3-geo';
import type { VisitStatus } from '../types';

type MappackerStyleMapProps = {
  visitedCountries: Record<string, VisitStatus>;
  onCountryClick: (countryCode: string) => void;
};

interface CountryProperties {
  name: string;
  iso_a2: string;
  iso_a3: string;
}

interface GeoJSONGeometry {
  type: string;
  coordinates: unknown;
}

interface CountryFeature {
  type: 'Feature';
  id: string;
  properties: CountryProperties;
  geometry: GeoJSONGeometry;
}

interface RawGeoJSONFeature {
  id?: string;
  properties?: {
    ISO_A2?: string;
    iso_a2?: string;
    ISO_A3?: string;
    iso_a3?: string;
    NAME?: string;
    name?: string;
    ADMIN?: string;
  };
  geometry?: {
    type?: string;
    coordinates?: unknown;
  };
}

interface RawGeoJSONData {
  features?: RawGeoJSONFeature[];
}

const MappackerStyleMap: React.FC<MappackerStyleMapProps> = ({
  visitedCountries,
  onCountryClick,
}) => {
  const [countries, setCountries] = React.useState<CountryFeature[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [hoveredCountry, setHoveredCountry] = React.useState<string | null>(null);
  const [showList, setShowList] = React.useState(false);
  const svgRef = React.useRef<SVGSVGElement>(null);

  const width = 960;
  const height = 500;

  // Natural Earth projection
  const projection = geoNaturalEarth1()
    .scale(width / 6.5)
    .translate([width / 2, height / 2]);

  const pathGenerator = geoPath().projection(projection);

  // Load real world map data
  React.useEffect(() => {
    const loadMapData = async (): Promise<void> => {
      try {
        setLoading(true);
        // Use Natural Earth data with full country properties
        const response = await fetch('https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_admin_0_countries.geojson');

        if (!response.ok) {
          throw new Error(`Failed to fetch map data: ${response.status}`);
        }

        const geoJsonData = await response.json() as RawGeoJSONData;

        if (!geoJsonData?.features) {
          throw new Error('Invalid GeoJSON data');
        }

        // Debug: Check what properties are available
        logger.info('MappackerStyleMap', 'Sample feature properties', { properties: geoJsonData.features[0]?.properties ?? null });

        // Convert and filter features
        const countryFeatures = geoJsonData.features
          .map((f: RawGeoJSONFeature): CountryFeature => {
            // Natural Earth GeoJSON uses ISO_A2 and NAME
            const iso_a2 = f.properties?.ISO_A2 ?? f.properties?.iso_a2 ?? '';
            const iso_a3 = f.properties?.ISO_A3 ?? f.properties?.iso_a3 ?? '';
            const name = f.properties?.NAME ?? f.properties?.name ?? f.properties?.ADMIN ?? 'Unknown';

            const geom = f.geometry ?? { type: 'Polygon', coordinates: [] };
            // Filter out GeometryCollection as it doesn't have coordinates
            const validGeom = (geom && 'type' in geom && geom.type !== 'GeometryCollection')
              ? geom
              : { type: 'Polygon', coordinates: [] };

            return {
              type: 'Feature' as const,
              id: f.id ?? iso_a2 ?? `country-${Math.random()}`,
              properties: {
                name: name,
                iso_a2: iso_a2,
                iso_a3: iso_a3,
              },
              geometry: validGeom as GeoJSONGeometry,
            };
          })
          .filter((f): boolean => {
            // Only include countries with:
            // 1. Valid 2-letter ISO code (not -99 or empty)
            // 2. Valid geometry
            const hasValidCode = Boolean(f.properties.iso_a2) &&
                                 f.properties.iso_a2.length === 2 &&
                                 f.properties.iso_a2 !== '-99';
            const hasValidGeometry = Boolean(f.geometry) &&
                                    (f.geometry.type === 'Polygon' || f.geometry.type === 'MultiPolygon');
            return hasValidCode && hasValidGeometry;
          });

        logger.debug('MappackerStyleMap', `Loaded ${countryFeatures.length} valid countries from ${geoJsonData.features.length} total features`);
        logger.info('MappackerStyleMap', 'First 3 countries', {
          countries: countryFeatures.slice(0, 3).map((c): { name: string; code: string; id: string } => ({
            name: c.properties.name,
            code: c.properties.iso_a2,
            id: c.id
          }))
        });

        if (countryFeatures.length === 0) {
          throw new Error('No valid countries found in map data');
        }

        setCountries(countryFeatures.sort((a, b): number =>
          a.properties.name.localeCompare(b.properties.name)
        ));
        setError(null);
        setLoading(false);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load map data';
        logger.error('MappackerStyleMap', 'Error loading map data', { error: err instanceof Error ? err.message : String(err) });
        setError(errorMessage);
        setLoading(false);
      }
    };

    void loadMapData();
  }, []);

  const getCountryFill = (countryCode: string, isHovered: boolean): string => {
    const hasVisited = visitedCountries[countryCode];

    if (isHovered) {
      return hasVisited ? '#1E40AF' : '#94A3B8';
    }

    return hasVisited ? '#3B82F6' : '#CBD5E1';
  };

  const visitedCount = Object.keys(visitedCountries).length;

  // Debug: log countries when they change
  React.useEffect(() => {
    if (countries.length > 0) {
      logger.debug('MappackerStyleMap', `Rendering map with ${countries.length} countries`);
      logger.info('MappackerStyleMap', 'First 3 countries', {
        countries: countries.slice(0, 3).map((c): { name: string; code: string } => ({ name: c.properties.name, code: c.properties.iso_a2 }))
      });
    }
  }, [countries]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[500px] bg-white">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent mx-auto mb-4" />
          <p className="text-gray-600">Loading map...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[500px] bg-white">
        <div className="text-center max-w-md">
          <div className="text-red-500 text-4xl mb-4">⚠️</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Failed to Load Map</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={(): void => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }

  if (countries.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[500px] bg-white">
        <div className="text-center">
          <p className="text-gray-600">No countries data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen">
      {/* Simple Header */}
      <div className="bg-white border-b border-gray-200 py-4 px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Travel Map</h1>
          <div className="flex items-center gap-6">
            <div className="text-lg font-semibold text-blue-600">
              {visitedCount} {visitedCount === 1 ? 'country' : 'countries'} visited
            </div>
            <button
              onClick={(): void => setShowList(!showList)}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              {showList ? 'Hide List' : 'Show List'}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex gap-6">
          {/* Map Container */}
          <div className={`${showList ? 'w-4/5' : 'w-full'} transition-all duration-300`}>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <svg
                ref={svgRef}
                viewBox={`0 0 ${width} ${height}`}
                className="w-full h-auto"
                style={{ maxHeight: '600px' }}
              >
                {/* Ocean */}
                <rect width={width} height={height} fill="#BFDBFE" />

                {/* Countries */}
                <g>
                  {countries.map((country, idx): React.JSX.Element | null => {
                    const countryCode = country.properties.iso_a2;
                    const isHovered = hoveredCountry === countryCode;

                    try {
                      const path = pathGenerator(country.geometry as GeoJSON.Geometry);

                      // Skip if path generation failed
                      if (!path) {
                        return null;
                      }

                      return (
                        <path
                          key={`${country.id}-${idx}`}
                          d={path}
                          fill={getCountryFill(countryCode, isHovered)}
                          stroke="#FFFFFF"
                          strokeWidth={1}
                          className="cursor-pointer transition-colors duration-150"
                          onClick={(): void => onCountryClick(countryCode)}
                          onMouseEnter={(): void => setHoveredCountry(countryCode)}
                          onMouseLeave={(): void => setHoveredCountry(null)}
                        />
                      );
                    } catch (err) {
                      logger.error('MappackerStyleMap', err as Error, { context: 'renderCountry', country: country.properties.name });
                      return null;
                    }
                  })}
                </g>
              </svg>

              {/* Hover info */}
              {hoveredCountry !== null && (
                <div className="mt-4 text-center">
                  <div className="inline-block bg-gray-100 rounded px-4 py-2">
                    <p className="text-lg font-medium text-gray-900">
                      {countries.find((c): boolean => c.properties.iso_a2 === hoveredCountry)?.properties.name}
                    </p>
                    <p className="text-sm text-gray-600">
                      {visitedCountries[hoveredCountry] !== undefined
                        ? `✓ ${visitedCountries[hoveredCountry].charAt(0).toUpperCase() + visitedCountries[hoveredCountry].slice(1)}`
                        : 'Click to mark as visited'
                      }
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Country List Sidebar */}
          {showList && (
            <div className="w-1/5 min-w-[250px]">
              <div className="bg-white rounded-lg border border-gray-200 p-4 sticky top-6 max-h-[calc(100vh-8rem)] overflow-y-auto">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Countries</h3>
                <div className="space-y-1">
                  {countries.map((country, idx): React.JSX.Element => {
                    const countryCode = country.properties.iso_a2;
                    const isVisited = Boolean(visitedCountries[countryCode]);

                    return (
                      <label
                        key={`${country.id}-${idx}`}
                        className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-gray-50 cursor-pointer transition-colors"
                        onMouseEnter={(): void => setHoveredCountry(countryCode)}
                        onMouseLeave={(): void => setHoveredCountry(null)}
                      >
                        <input
                          type="checkbox"
                          checked={isVisited}
                          onChange={(): void => onCountryClick(countryCode)}
                          className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">
                          {country.properties.name}
                        </span>
                        {isVisited && (
                          <span className="ml-auto text-xs text-blue-600 font-medium">
                            {visitedCountries[countryCode]}
                          </span>
                        )}
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="mt-6 bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-center gap-8">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded border border-gray-300" style={{ backgroundColor: '#3B82F6' }}></div>
              <span className="text-sm text-gray-700 font-medium">Visited</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded border border-gray-300" style={{ backgroundColor: '#CBD5E1' }}></div>
              <span className="text-sm text-gray-700 font-medium">Not Visited</span>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-4 text-center text-sm text-gray-600">
          Click on countries to mark them as visited • Click "Show List" to see all countries
        </div>
      </div>
    </div>
  );
};

export default MappackerStyleMap;
