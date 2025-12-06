/* eslint-disable max-lines */
/**
 * LeafletTravelMap - Full-featured interactive map using OpenStreetMap tiles
 * Shows cities, states, roads, and all geographic details with zoom levels
 */

import React from 'react';
import { logger } from '../../services/logger';

import { MapContainer, TileLayer, GeoJSON, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { VisitStatus } from '../types';

// Component to track zoom level
function ZoomTracker({ onZoomChange }: { onZoomChange: (zoom: number) => void }): null {
  const map = useMapEvents({
    zoomend: () => {
      onZoomChange(map.getZoom());
    },
  });
  return null;
}

// Fix Leaflet default marker icon issue
// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

type LeafletTravelMapProps = {
  visitedCountries: Record<string, VisitStatus>;
  onCountryClick: (countryCode: string) => void;
  visitedStates?: Record<string, VisitStatus>;
  onStateClick?: (stateCode: string, countryCode: string) => void;
};

interface CountryFeature {
  type: 'Feature';
  id: string;
  properties: {
    name: string;
    iso_a2: string;
    iso_a3: string;
  };
  geometry: unknown;
}

interface StateFeature {
  type: 'Feature';
  id?: string;
  properties: {
    name?: string;
    NAME?: string;
    iso_3166_2?: string;
    code_hasc?: string;
    iso_a2?: string;
    adm0_a3?: string;
  };
  geometry: unknown;
}

interface GeoJSONData {
  features?: Array<{
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
    geometry?: unknown;
  }>;
}

const LeafletTravelMap: React.FC<LeafletTravelMapProps> = ({
  visitedCountries,
  onCountryClick,
  visitedStates = {},
  onStateClick,
}) => {
  const [countries, setCountries] = React.useState<CountryFeature[]>([]);
  const [states, setStates] = React.useState<StateFeature[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [loadingStates, setLoadingStates] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [currentZoom, setCurrentZoom] = React.useState(2);
  const zoomRef = React.useRef(2);

  // Debug: Log when component mounts
  React.useEffect(() => {
    logger.info('LeafletTravelMap', '🗺️ LeafletTravelMap mounted');
    logger.info('LeafletTravelMap', 'Visited states:', visitedStates);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update zoom ref when zoom changes
  React.useEffect(() => {
    zoomRef.current = currentZoom;
  }, [currentZoom]);

  // Load countries data
  React.useEffect(() => {
    const loadMapData = async (): Promise<void> => {
      try {
        setLoading(true);
        const response = await fetch(
          'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_admin_0_countries.geojson'
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch map data: ${response.status}`);
        }

        const geoJsonData = await response.json() as GeoJSONData;

        if (!geoJsonData?.features) {
          throw new Error('Invalid GeoJSON data');
        }

        const countryFeatures = geoJsonData.features
          .map((f) => {
            const iso_a2 = f.properties?.ISO_A2 ?? f.properties?.iso_a2 ?? '';
            const iso_a3 = f.properties?.ISO_A3 ?? f.properties?.iso_a3 ?? '';
            const name = f.properties?.NAME ?? f.properties?.name ?? f.properties?.ADMIN ?? 'Unknown';

            return {
              type: 'Feature' as const,
              id: f.id ?? iso_a2 ?? `country-${Math.random()}`,
              properties: {
                name: name,
                iso_a2: iso_a2,
                iso_a3: iso_a3,
              },
              geometry: f.geometry,
            };
          })
          .filter((f): f is CountryFeature => {
            const hasValidCode =
              f.properties.iso_a2 && f.properties.iso_a2.length === 2 && f.properties.iso_a2 !== '-99';
            const hasValidGeometry =
              f.geometry && (typeof f.geometry === 'object' && f.geometry !== null &&
                ('type' in f.geometry && (f.geometry.type === 'Polygon' || f.geometry.type === 'MultiPolygon')));
            return hasValidCode && hasValidGeometry;
          });

        setCountries(countryFeatures);
        setError(null);
        setLoading(false);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load map data';
        logger.error('LeafletTravelMap', 'Error loading map data:', err);
        setError(errorMessage);
        setLoading(false);
      }
    };

    void loadMapData();
  }, []);

  // Load state/province boundaries
  React.useEffect(() => {
    const loadStateData = async (): Promise<void> => {
      if (loadingStates || states.length > 0) {
        logger.info('LeafletTravelMap', 'Skipping state load:', { loadingStates, statesCount: states.length });
        return;
      }

      try {
        logger.info('LeafletTravelMap', 'Starting to load state boundaries...');
        setLoadingStates(true);
        const response = await fetch(
          'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_admin_1_states_provinces.geojson'
        );

        if (response.ok) {
          const data = await response.json() as { features?: StateFeature[] };
          setStates(data.features ?? []);
          logger.debug('LeafletTravelMap', `✅ Loaded ${data.features?.length ?? 0} state/province boundaries`);
          if (data.features && data.features.length > 0) {
            logger.info('LeafletTravelMap', 'Sample state:', data.features[0].properties);
          }
        } else {
          logger.error('LeafletTravelMap', 'Failed to fetch states:', response.status);
        }
      } catch (err) {
        logger.error('LeafletTravelMap', 'Error loading state boundaries:', err);
      } finally {
        setLoadingStates(false);
      }
    };

    // Only load states when zoomed in enough
    logger.info('LeafletTravelMap', 'Current zoom level:', currentZoom);
    if (currentZoom >= 5) {
      logger.info('LeafletTravelMap', 'Zoom level >= 5, loading states...');
      void loadStateData();
    } else {
      logger.info('LeafletTravelMap', 'Zoom level < 5, not loading states yet');
    }
  }, [currentZoom, loadingStates, states.length]);

  const getCountryStyle = (countryCode: string, isHovered: boolean = false): L.PathOptions => {
    const hasVisited = visitedCountries[countryCode];

    if (isHovered) {
      return {
        fillColor: hasVisited ? '#16A34A' : '#9CA3AF',
        fillOpacity: 0.5,
        color: '#2D3748',
        weight: 2,
      };
    }

    return {
      fillColor: hasVisited ? '#86EFAC' : 'transparent',
      fillOpacity: hasVisited ? 0.4 : 0,
      color: '#D4D2C5',
      weight: 1,
    };
  };

  const getStateStyle = (stateCode: string, isHovered: boolean = false): L.PathOptions => {
    const hasVisited = visitedStates[stateCode];

    if (isHovered) {
      return {
        fillColor: hasVisited ? '#059669' : '#6B7280',
        fillOpacity: 0.6,
        color: '#1F2937',
        weight: 2,
      };
    }

    return {
      fillColor: hasVisited ? '#34D399' : 'transparent',
      fillOpacity: hasVisited ? 0.5 : 0,
      color: '#9CA3AF',
      weight: 0.8,
      dashArray: '3, 3',
    };
  };

  const onEachCountry = (feature: GeoJSON.Feature, layer: L.Layer): void => {
    const countryCode = (feature.properties as { iso_a2: string }).iso_a2;
    const countryName = (feature.properties as { name: string }).name;

    // Style the country
    if (layer instanceof L.Path) {
      layer.setStyle(getCountryStyle(countryCode));
    }

    // Bind popup
    layer.bindPopup(`
      <div class="p-2">
        <h3 class="font-semibold text-gray-900">${countryName}</h3>
        <p class="text-sm text-gray-600">
          ${visitedCountries[countryCode] ? `✓ ${visitedCountries[countryCode]}` : 'Click to mark as visited'}
        </p>
      </div>
    `);

    // Event handlers
    layer.on({
      mouseover: (e: L.LeafletMouseEvent) => {
        const target = e.target as L.Layer;
        if (target instanceof L.Path) {
          target.setStyle(getCountryStyle(countryCode, true));
        }
      },
      mouseout: (e: L.LeafletMouseEvent) => {
        const target = e.target as L.Layer;
        if (target instanceof L.Path) {
          target.setStyle(getCountryStyle(countryCode, false));
        }
      },
      click: (_e: L.LeafletMouseEvent) => {
        // Only handle country clicks when zoomed out (not looking at states)
        logger.info('LeafletTravelMap', 'Country clicked, current zoom:', zoomRef.current);
        if (zoomRef.current < 5) {
          logger.info('LeafletTravelMap', '✓ Processing country click:', countryCode);
          onCountryClick(countryCode);
        } else {
          logger.info('LeafletTravelMap', '✗ Country click ignored (zoom >= 5, expecting state click)');
        }
      },
    });
  };

  const onEachState = (feature: GeoJSON.Feature, layer: L.Layer): void => {
    const props = feature.properties as {
      name?: string;
      NAME?: string;
      iso_3166_2?: string;
      code_hasc?: string;
      iso_a2?: string;
      adm0_a3?: string;
    };

    const stateName = props.name ?? props.NAME;
    const stateCode = props.iso_3166_2 ?? props.code_hasc;
    const countryCode = props.iso_a2 ?? props.adm0_a3;

    if (!stateCode) {
      logger.info('LeafletTravelMap', 'State without code:', feature.properties);
      return;
    }

    logger.info('LeafletTravelMap', 'Processing state:', { stateName, stateCode, countryCode });

    // Style the state
    if (layer instanceof L.Path) {
      layer.setStyle(getStateStyle(stateCode));
    }

    // Bind popup
    layer.bindPopup(`
      <div class="p-2">
        <h3 class="font-semibold text-gray-900">${stateName ?? 'Unknown'}</h3>
        <p class="text-sm text-gray-600">
          ${visitedStates[stateCode] ? `✓ ${visitedStates[stateCode]}` : 'Click to mark as visited'}
        </p>
      </div>
    `);

    // Event handlers
    layer.on({
      mouseover: (e: L.LeafletMouseEvent) => {
        const target = e.target as L.Layer;
        if (target instanceof L.Path) {
          target.setStyle(getStateStyle(stateCode, true));
        }
      },
      mouseout: (e: L.LeafletMouseEvent) => {
        const target = e.target as L.Layer;
        if (target instanceof L.Path) {
          target.setStyle(getStateStyle(stateCode, false));
        }
      },
      click: (e: L.LeafletMouseEvent) => {
        L.DomEvent.stopPropagation(e);
        logger.info('LeafletTravelMap', '🎯 State clicked:', { stateName, stateCode, countryCode });
        if (onStateClick && countryCode) {
          logger.info('LeafletTravelMap', 'Calling onStateClick...');
          onStateClick(stateCode, countryCode);
        } else {
          logger.info('LeafletTravelMap', '⚠️ onStateClick is not defined!');
        }
      },
    });
  };

  const visitedCount = Object.keys(visitedCountries).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent mx-auto mb-4" />
          <p className="text-gray-600">Loading map...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="text-center max-w-md">
          <div className="text-red-500 text-4xl mb-4">⚠️</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Failed to Load Map</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 py-4 px-6">
        <div className="max-w-full mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Travel Map</h1>
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-600">
              Zoom: {currentZoom} | States: {states.length} loaded
            </div>
            <div className="text-lg font-semibold text-green-600">
              {visitedCount} {visitedCount === 1 ? 'country' : 'countries'} visited
            </div>
          </div>
        </div>
      </div>

      {/* Map Container */}
      <div className="w-full" style={{ height: 'calc(100vh - 80px)' }}>
        <MapContainer
          center={[20, 0]}
          zoom={2}
          style={{ height: '100%', width: '100%' }}
          zoomControl={true}
          scrollWheelZoom={true}
          maxBounds={[[-90, -180], [90, 180]]}
          maxBoundsViscosity={1.0}
          minZoom={2}
        >
          {/* OpenStreetMap Tile Layer - Shows cities, roads, everything! */}
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            maxZoom={19}
          />

          {/* Zoom tracker */}
          <ZoomTracker onZoomChange={setCurrentZoom} />

          {/* Country overlays for visited tracking */}
          <GeoJSON
            data={{
              type: 'FeatureCollection',
              features: countries,
            }}
            onEachFeature={onEachCountry}
            key={JSON.stringify(visitedCountries)}
          />

          {/* State/Province overlays - shown when zoomed in */}
          {currentZoom >= 5 && states.length > 0 && (
            <GeoJSON
              data={{
                type: 'FeatureCollection',
                features: states,
              }}
              onEachFeature={onEachState}
              key={`states-${JSON.stringify(visitedStates)}`}
              style={{ zIndex: 1000 }}
              pane="overlayPane"
            />
          )}
        </MapContainer>
      </div>

      {/* Legend */}
      <div className="fixed bottom-4 right-4 bg-white rounded-lg border border-gray-200 p-4 shadow-lg">
        <h4 className="text-sm font-semibold text-gray-700 mb-2">Legend</h4>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded border border-gray-300 bg-green-300"></div>
            <span className="text-xs text-gray-700 font-medium">Visited Country</span>
          </div>
          {currentZoom >= 5 && (
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded border border-gray-300 bg-emerald-400"></div>
              <span className="text-xs text-gray-700 font-medium">Visited State</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded border border-gray-300 bg-white"></div>
            <span className="text-xs text-gray-700 font-medium">Not Visited</span>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-3">
          {currentZoom < 5 ? 'Zoom in to see states & provinces' : 'Click states to mark as visited'}
        </p>
      </div>
    </div>
  );
};

export default LeafletTravelMap;
