/**
 * LeafletTravelMapV2 - Clean implementation with proper state-level tracking
 * Properly handles click events for both countries and states
 */

import React from 'react';
import { MapContainer, TileLayer, GeoJSON, useMapEvents, Marker, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { VisitStatus } from '../types';
import { nationalParks } from '../data/nationalParks';
import { islands } from '../data/islands';
import { logger } from '../../services/logger';

// Fix Leaflet default marker icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom icons for national parks and islands
const createParkIcon = (visited: boolean) => {
  return L.divIcon({
    className: 'custom-park-icon',
    html: `<div style="
      background-color: ${visited ? '#10B981' : '#6B7280'};
      width: 24px;
      height: 24px;
      border-radius: 50%;
      border: 2px solid white;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
    ">🌲</div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
};

const createIslandIcon = (visited: boolean) => {
  return L.divIcon({
    className: 'custom-island-icon',
    html: `<div style="
      background-color: ${visited ? '#3B82F6' : '#9CA3AF'};
      width: 24px;
      height: 24px;
      border-radius: 50%;
      border: 2px solid white;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
    ">🏝️</div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
};

type LeafletTravelMapV2Props = {
  visitedCountries: Record<string, VisitStatus>;
  onCountryClick: (countryCode: string) => void;
  visitedStates?: Record<string, VisitStatus>;
  onStateClick?: (stateCode: string, countryCode: string) => void;
  visitedParks?: Record<string, VisitStatus>; // Key is park ID
  onParkClick?: (parkId: string) => void;
  visitedIslands?: Record<string, VisitStatus>; // Key is island ID
  onIslandClick?: (islandId: string) => void;
};

interface CountryFeature {
  type: 'Feature';
  id: string;
  properties: {
    name: string;
    iso_a2: string;
    iso_a3: string;
  };
  geometry: any;
}

// Component to track zoom level
function ZoomTracker({ onZoomChange }: { onZoomChange: (zoom: number) => void }) {
  const map = useMapEvents({
    zoomend: () => {
      onZoomChange(map.getZoom());
    },
  });

  React.useEffect(() => {
    onZoomChange(map.getZoom());
  }, []);

  return null;
}

const LeafletTravelMapV2: React.FC<LeafletTravelMapV2Props> = ({
  visitedCountries,
  onCountryClick,
  visitedStates = {},
  onStateClick,
  visitedParks = {},
  onParkClick,
  visitedIslands = {},
  onIslandClick,
}) => {
  const [countries, setCountries] = React.useState<CountryFeature[]>([]);
  const [states, setStates] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [currentZoom, setCurrentZoom] = React.useState(2);
  const [showStatesAsCountries, setShowStatesAsCountries] = React.useState(true);
  const [showNationalParks, setShowNationalParks] = React.useState(false);
  const [showIslands, setShowIslands] = React.useState(false);

  const countryLayerRef = React.useRef<L.GeoJSON | null>(null);
  const stateLayerRef = React.useRef<L.GeoJSON | null>(null);

  // Load countries data
  React.useEffect(() => {
    const loadMapData = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_admin_0_countries.geojson'
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch map data: ${response.status}`);
        }

        const geoJsonData: any = await response.json();

        const countryFeatures = geoJsonData.features
          .map((f: any) => ({
            type: 'Feature' as const,
            id: f.id || f.properties?.ISO_A2 || `country-${Math.random()}`,
            properties: {
              name: f.properties?.NAME || f.properties?.name || 'Unknown',
              iso_a2: f.properties?.ISO_A2 || f.properties?.iso_a2 || '',
              iso_a3: f.properties?.ISO_A3 || f.properties?.iso_a3 || '',
            },
            geometry: f.geometry,
          }))
          .filter((f: any) => {
            const hasValidCode = f.properties.iso_a2 && f.properties.iso_a2.length === 2 && f.properties.iso_a2 !== '-99';
            const hasValidGeometry = f.geometry && (f.geometry.type === 'Polygon' || f.geometry.type === 'MultiPolygon');
            return hasValidCode && hasValidGeometry;
          });

        setCountries(countryFeatures);
        setError(null);
        setLoading(false);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load map data';
        logger.error('Error loading map data:', { err });
        setError(errorMessage);
        setLoading(false);
      }
    };

    loadMapData();
  }, []);

  // Load state/province boundaries when zoomed in OR when checkbox is unchecked
  React.useEffect(() => {
    const shouldLoadStates = currentZoom >= 5 || !showStatesAsCountries;

    if (!shouldLoadStates || states.length > 0) {
      return; // Don't load if not needed or already loaded
    }

    const loadStateData = async () => {
      try {
        const response = await fetch(
          'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_admin_1_states_provinces.geojson'
        );

        if (response.ok) {
          const data = await response.json();
          setStates(data.features || []);
        }
      } catch (err) {
        logger.error('Error loading state boundaries:', { err });
      }
    };

    loadStateData();
  }, [currentZoom, showStatesAsCountries, states.length]);

  // Country style function
  const getCountryStyle = (countryCode: string): L.PathOptions => {
    const hasVisitedCountry = visitedCountries[countryCode];

    // Check if any states from this country are visited (only if mode enabled)
    const hasVisitedStates = showStatesAsCountries && Object.keys(visitedStates).some(stateCode =>
      stateCode.startsWith(`${countryCode}-`)
    );

    const isVisited = hasVisitedCountry || hasVisitedStates;

    return {
      fillColor: isVisited ? '#86EFAC' : 'transparent',
      fillOpacity: isVisited ? 0.4 : 0,
      color: '#D4D2C5',
      weight: 1,
    };
  };

  // State style function
  const getStateStyle = (stateCode: string): L.PathOptions => {
    const hasVisited = visitedStates[stateCode];

    return {
      fillColor: hasVisited ? '#34D399' : 'transparent',
      fillOpacity: hasVisited ? 0.5 : 0,
      color: '#9CA3AF',
      weight: 0.8,
      dashArray: '3, 3',
    };
  };

  // Country layer setup
  const onEachCountry = React.useCallback((feature: any, layer: L.Layer) => {
    const countryCode = feature.properties.iso_a2;
    const countryName = feature.properties.name;

    if (layer instanceof L.Path) {
      layer.setStyle(getCountryStyle(countryCode));
    }

    layer.bindPopup(`
      <div class="p-2">
        <h3 class="font-semibold text-gray-900">${countryName}</h3>
        <p class="text-sm text-gray-600">
          ${visitedCountries[countryCode] ? `✓ ${visitedCountries[countryCode]}` : 'Click to mark as visited'}
        </p>
      </div>
    `);

    layer.on({
      click: () => {
        // Only handle country clicks when not zoomed into states
        if (currentZoom < 5) {
          onCountryClick(countryCode);
        }
      },
    });
  }, [visitedCountries, visitedStates, showStatesAsCountries, currentZoom, onCountryClick]);

  // State layer setup
  const onEachState = (feature: any, layer: L.Layer) => {
    const stateName = feature.properties.name || feature.properties.NAME;
    const stateCode = feature.properties.iso_3166_2 || feature.properties.code_hasc;
    const countryCode = feature.properties.iso_a2 || feature.properties.adm0_a3;

    if (!stateCode) return;

    if (layer instanceof L.Path) {
      layer.setStyle(getStateStyle(stateCode));

      // Make state layer interactive with higher priority
      layer.options.interactive = true;
      (layer as any).bringToFront();
    }

    layer.bindPopup(`
      <div class="p-2">
        <h3 class="font-semibold text-gray-900">${stateName}</h3>
        <p class="text-sm text-gray-600">
          ${visitedStates[stateCode] ? `✓ ${visitedStates[stateCode]}` : 'Click to mark as visited'}
        </p>
      </div>
    `);

    layer.on({
      click: (e: L.LeafletMouseEvent) => {
        L.DomEvent.stopPropagation(e);
        if (onStateClick && currentZoom >= 5) {
          onStateClick(stateCode, countryCode);
        }
      },
    });
  };

  const visitedCount = Object.keys(visitedCountries).length;
  const visitedStatesCount = Object.keys(visitedStates).length;

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
          <div className="flex items-center gap-3">
            {/* View Mode Toggle */}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-200">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showStatesAsCountries}
                  onChange={(e) => setShowStatesAsCountries(e.target.checked)}
                  className="w-4 h-4 text-green-600 rounded"
                />
                <span className="text-xs font-medium text-gray-700">
                  States count as country visits
                </span>
              </label>
            </div>

            {/* Layer Toggles */}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-200">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showNationalParks}
                  onChange={(e) => setShowNationalParks(e.target.checked)}
                  className="w-4 h-4 text-green-600 rounded"
                />
                <span className="text-xs font-medium text-gray-700">🌲 Parks</span>
              </label>
              <div className="w-px h-4 bg-gray-300"></div>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showIslands}
                  onChange={(e) => setShowIslands(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <span className="text-xs font-medium text-gray-700">🏝️ Islands</span>
              </label>
            </div>

            <div className="text-sm text-gray-600">
              {currentZoom < 5 ? (
                `Zoom in to see states (current: ${currentZoom})`
              ) : (
                `${visitedStatesCount} states visited`
              )}
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
          <ZoomTracker onZoomChange={setCurrentZoom} />

          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            maxZoom={19}
          />

          {/* Country layer - always show for borders and country clicks */}
          {currentZoom < 5 && (
            <GeoJSON
              ref={countryLayerRef}
              data={{
                type: 'FeatureCollection',
                features: countries,
              }}
              onEachFeature={onEachCountry}
              key={`countries-${JSON.stringify(visitedCountries)}-${JSON.stringify(visitedStates)}-${showStatesAsCountries}`}
            />
          )}

          {/* State layer - show when zoomed in OR when checkbox is unchecked (to show state-level detail) */}
          {(currentZoom >= 5 || !showStatesAsCountries) && states.length > 0 && (
            <GeoJSON
              ref={stateLayerRef}
              data={{
                type: 'FeatureCollection',
                features: states,
              }}
              onEachFeature={onEachState}
              key={`states-${JSON.stringify(visitedStates)}-${currentZoom}-${showStatesAsCountries}`}
            />
          )}

          {/* National Parks markers */}
          {showNationalParks && nationalParks.map(park => {
            const isVisited = !!visitedParks[park.id];
            return (
              <Marker
                key={park.id}
                position={[park.lat, park.lon]}
                icon={createParkIcon(isVisited)}
                eventHandlers={{
                  click: () => onParkClick?.(park.id),
                }}
              >
                <Tooltip direction="top" offset={[0, -10]} opacity={1}>
                  <div style={{ padding: '8px', minWidth: '250px', maxWidth: '300px' }}>
                    <h3 style={{
                      fontWeight: 'bold',
                      color: '#111827',
                      fontSize: '15px',
                      marginBottom: '6px',
                      lineHeight: '1.3'
                    }}>
                      {park.name}
                    </h3>
                    {park.established && (
                      <p style={{
                        fontSize: '13px',
                        color: '#374151',
                        fontWeight: '500',
                        margin: '3px 0'
                      }}>
                        Est. {park.established}
                      </p>
                    )}
                    {park.unesco && (
                      <p style={{
                        fontSize: '12px',
                        color: '#1d4ed8',
                        fontWeight: 'bold',
                        margin: '4px 0'
                      }}>
                        UNESCO World Heritage Site
                      </p>
                    )}
                    {park.description && (
                      <p style={{
                        fontSize: '13px',
                        color: '#1f2937',
                        marginTop: '6px',
                        lineHeight: '1.4'
                      }}>
                        {park.description}
                      </p>
                    )}
                    <p style={{
                      fontSize: '13px',
                      marginTop: '8px',
                      fontWeight: '600'
                    }}>
                      {isVisited ? (
                        <span style={{ color: '#15803d' }}>✓ Visited</span>
                      ) : (
                        <span style={{ color: '#6b7280' }}>Click to mark as visited</span>
                      )}
                    </p>
                  </div>
                </Tooltip>
              </Marker>
            );
          })}

          {/* Islands markers */}
          {showIslands && islands.map(island => {
            const isVisited = !!visitedIslands[island.id];
            return (
              <Marker
                key={island.id}
                position={[island.lat, island.lon]}
                icon={createIslandIcon(isVisited)}
                eventHandlers={{
                  click: () => onIslandClick?.(island.id),
                }}
              >
                <Tooltip direction="top" offset={[0, -10]} opacity={1}>
                  <div style={{ padding: '8px', minWidth: '250px', maxWidth: '300px' }}>
                    <h3 style={{
                      fontWeight: 'bold',
                      color: '#111827',
                      fontSize: '15px',
                      marginBottom: '6px',
                      lineHeight: '1.3'
                    }}>
                      {island.name}
                    </h3>
                    {island.islandGroup && (
                      <p style={{
                        fontSize: '13px',
                        color: '#374151',
                        fontWeight: '500',
                        margin: '3px 0'
                      }}>
                        {island.islandGroup}
                      </p>
                    )}
                    {island.description && (
                      <p style={{
                        fontSize: '13px',
                        color: '#1f2937',
                        marginTop: '6px',
                        lineHeight: '1.4'
                      }}>
                        {island.description}
                      </p>
                    )}
                    <p style={{
                      fontSize: '13px',
                      marginTop: '8px',
                      fontWeight: '600'
                    }}>
                      {isVisited ? (
                        <span style={{ color: '#1d4ed8' }}>✓ Visited</span>
                      ) : (
                        <span style={{ color: '#6b7280' }}>Click to mark as visited</span>
                      )}
                    </p>
                  </div>
                </Tooltip>
              </Marker>
            );
          })}
        </MapContainer>
      </div>

      {/* Legend */}
      <div className="fixed bottom-4 right-4 bg-white rounded-lg border border-gray-200 p-4 shadow-lg">
        <h4 className="text-sm font-semibold text-gray-700 mb-2">Legend</h4>
        <div className="space-y-2">
          {currentZoom < 5 ? (
            <>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded border border-gray-300 bg-green-300"></div>
                <span className="text-xs text-gray-700 font-medium">Visited Country</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded border border-gray-300 bg-white"></div>
                <span className="text-xs text-gray-700 font-medium">Not Visited</span>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded border border-gray-300 bg-emerald-400"></div>
                <span className="text-xs text-gray-700 font-medium">Visited State</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded border border-gray-300 bg-white"></div>
                <span className="text-xs text-gray-700 font-medium">Not Visited</span>
              </div>
            </>
          )}

          {/* Park and Island markers */}
          {(showNationalParks || showIslands) && (
            <div className="border-t border-gray-200 mt-2 pt-2">
              {showNationalParks && (
                <>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full border-2 border-white bg-green-600 flex items-center justify-center text-xs shadow">
                      🌲
                    </div>
                    <span className="text-xs text-gray-700 font-medium">Visited Park</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="w-6 h-6 rounded-full border-2 border-white bg-gray-500 flex items-center justify-center text-xs shadow">
                      🌲
                    </div>
                    <span className="text-xs text-gray-700 font-medium">Not Visited Park</span>
                  </div>
                </>
              )}
              {showIslands && (
                <>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="w-6 h-6 rounded-full border-2 border-white bg-blue-600 flex items-center justify-center text-xs shadow">
                      🏝️
                    </div>
                    <span className="text-xs text-gray-700 font-medium">Visited Island</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="w-6 h-6 rounded-full border-2 border-white bg-gray-400 flex items-center justify-center text-xs shadow">
                      🏝️
                    </div>
                    <span className="text-xs text-gray-700 font-medium">Not Visited Island</span>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
        <p className="text-xs text-gray-500 mt-3">
          {currentZoom < 5 ? 'Zoom in (5+) to see & click states' : 'Click states to mark as visited'}
        </p>
      </div>
    </div>
  );
};

export default LeafletTravelMapV2;
