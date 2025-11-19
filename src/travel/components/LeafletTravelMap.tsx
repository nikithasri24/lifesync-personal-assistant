/**
 * LeafletTravelMap - Full-featured interactive map using OpenStreetMap tiles
 * Shows cities, states, roads, and all geographic details with zoom levels
 */

import React from 'react';
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { VisitStatus } from '../types';

// Fix Leaflet default marker icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

type LeafletTravelMapProps = {
  visitedCountries: Record<string, VisitStatus>;
  onCountryClick: (countryCode: string) => void;
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

const LeafletTravelMap: React.FC<LeafletTravelMapProps> = ({
  visitedCountries,
  onCountryClick,
}) => {
  const [countries, setCountries] = React.useState<CountryFeature[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

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

        if (!geoJsonData || !geoJsonData.features) {
          throw new Error('Invalid GeoJSON data');
        }

        const countryFeatures = geoJsonData.features
          .map((f: any) => {
            const iso_a2 = f.properties?.ISO_A2 || f.properties?.iso_a2 || '';
            const iso_a3 = f.properties?.ISO_A3 || f.properties?.iso_a3 || '';
            const name = f.properties?.NAME || f.properties?.name || f.properties?.ADMIN || 'Unknown';

            return {
              type: 'Feature' as const,
              id: f.id || iso_a2 || `country-${Math.random()}`,
              properties: {
                name: name,
                iso_a2: iso_a2,
                iso_a3: iso_a3,
              },
              geometry: f.geometry,
            };
          })
          .filter((f: any) => {
            const hasValidCode =
              f.properties.iso_a2 && f.properties.iso_a2.length === 2 && f.properties.iso_a2 !== '-99';
            const hasValidGeometry =
              f.geometry && (f.geometry.type === 'Polygon' || f.geometry.type === 'MultiPolygon');
            return hasValidCode && hasValidGeometry;
          });

        setCountries(countryFeatures);
        setError(null);
        setLoading(false);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load map data';
        console.error('Error loading map data:', err);
        setError(errorMessage);
        setLoading(false);
      }
    };

    loadMapData();
  }, []);

  const getCountryStyle = (countryCode: string, isHovered: boolean = false) => {
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

  const onEachCountry = (feature: any, layer: L.Layer) => {
    const countryCode = feature.properties.iso_a2;
    const countryName = feature.properties.name;

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
        const target = e.target;
        if (target instanceof L.Path) {
          target.setStyle(getCountryStyle(countryCode, true));
        }
      },
      mouseout: (e: L.LeafletMouseEvent) => {
        const target = e.target;
        if (target instanceof L.Path) {
          target.setStyle(getCountryStyle(countryCode, false));
        }
      },
      click: () => {
        onCountryClick(countryCode);
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
          <div className="text-lg font-semibold text-green-600">
            {visitedCount} {visitedCount === 1 ? 'country' : 'countries'} visited
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
        >
          {/* OpenStreetMap Tile Layer - Shows cities, roads, everything! */}
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            maxZoom={19}
          />

          {/* Country overlays for visited tracking */}
          <GeoJSON
            data={{
              type: 'FeatureCollection',
              features: countries,
            }}
            onEachFeature={onEachCountry}
            key={JSON.stringify(visitedCountries)}
          />
        </MapContainer>
      </div>

      {/* Legend */}
      <div className="fixed bottom-4 right-4 bg-white rounded-lg border border-gray-200 p-4 shadow-lg">
        <h4 className="text-sm font-semibold text-gray-700 mb-2">Legend</h4>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded border border-gray-300 bg-green-300"></div>
            <span className="text-xs text-gray-700 font-medium">Visited</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded border border-gray-300 bg-white"></div>
            <span className="text-xs text-gray-700 font-medium">Not Visited</span>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-3">
          Zoom in to see cities, roads & more
        </p>
      </div>
    </div>
  );
};

export default LeafletTravelMap;
