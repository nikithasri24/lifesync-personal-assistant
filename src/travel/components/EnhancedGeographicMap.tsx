/**
 * EnhancedGeographicMap - Map with mountains, rivers, terrain, and administrative boundaries
 * Includes toggleable layers for enhanced geographic visualization
 */

import React from 'react';
import { geoPath, geoNaturalEarth1 } from 'd3-geo';
import { Mountain, Waves, MapPin, Layers, Droplets, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import type { VisitStatus } from '../types';
import { worldRivers, worldMountains, worldLakes, worldDeserts } from '../data/comprehensiveGeography';
import { logger } from '../../services/logger';

type EnhancedGeographicMapProps = {
  visitedCountries: Record<string, VisitStatus>;
  onCountryClick: (countryCode: string) => void;
};

interface CountryProperties {
  name: string;
  iso_a2: string;
  iso_a3: string;
}

interface CountryFeature {
  type: 'Feature';
  id: string;
  properties: CountryProperties;
  geometry: {
    type: string;
    coordinates: unknown;
  };
}

interface LayerToggles {
  showRivers: boolean;
  showMountains: boolean;
  showLakes: boolean;
  showDeserts: boolean;
  showTerrain: boolean;
  showStates: boolean;
  showLabels: boolean;
}

const EnhancedGeographicMap: React.FC<EnhancedGeographicMapProps> = ({
  visitedCountries,
  onCountryClick,
}) => {
  const [countries, setCountries] = React.useState<CountryFeature[]>([]);
  const [statesData, setStatesData] = React.useState<Array<{ geometry: unknown; properties?: Record<string, unknown> }>>([]);
  const [loading, setLoading] = React.useState(true);
  const [loadingStates, setLoadingStates] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [hoveredCountry, setHoveredCountry] = React.useState<string | null>(null);
  const [showList, setShowList] = React.useState(false);
  const [showLayerPanel, setShowLayerPanel] = React.useState(true);
  const [zoom, setZoom] = React.useState(1);
  const [pan, setPan] = React.useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = React.useState(false);
  const [dragStart, setDragStart] = React.useState({ x: 0, y: 0 });
  const [layers, setLayers] = React.useState<LayerToggles>({
    showRivers: true,
    showMountains: true,
    showLakes: true,
    showDeserts: true,
    showTerrain: false,
    showStates: false,
    showLabels: true,
  });
  const svgRef = React.useRef<SVGSVGElement>(null);

  const width = 960;
  const height = 500;

  // Natural Earth projection with zoom and pan
  const projection = geoNaturalEarth1()
    .scale((width / 6.5) * zoom)
    .translate([width / 2 + pan.x, height / 2 + pan.y]);

  const pathGenerator = geoPath().projection(projection);

  // Load countries data
  React.useEffect(() => {
    const loadMapData = async (): Promise<void> => {
      try {
        setLoading(true);
        const response = await fetch('https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_admin_0_countries.geojson');

        if (!response.ok) {
          throw new Error(`Failed to fetch map data: ${response.status}`);
        }

        const geoJsonData: { features?: Array<{ id?: string; properties?: Record<string, unknown>; geometry?: unknown }> } = await response.json() as { features?: Array<{ id?: string; properties?: Record<string, unknown>; geometry?: unknown }> };

        if (!geoJsonData?.features) {
          throw new Error('Invalid GeoJSON data');
        }

        const countryFeatures = geoJsonData.features
          .map((f: { id?: string; properties?: Record<string, unknown>; geometry?: unknown }) => {
            const iso_a2 = (f.properties?.ISO_A2 ?? f.properties?.iso_a2 ?? '') as string;
            const iso_a3 = (f.properties?.ISO_A3 ?? f.properties?.iso_a3 ?? '') as string;
            const name = (f.properties?.NAME ?? f.properties?.name ?? f.properties?.ADMIN ?? 'Unknown') as string;

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
          .filter((f: { properties: { iso_a2: string }; geometry?: unknown }) => {
            const hasValidCode = f.properties.iso_a2 &&
                                 f.properties.iso_a2.length === 2 &&
                                 f.properties.iso_a2 !== '-99';
            const geometryObj = f.geometry as { type?: string } | undefined;
            const hasValidGeometry = geometryObj &&
                                    (geometryObj.type === 'Polygon' || geometryObj.type === 'MultiPolygon');
            return hasValidCode && hasValidGeometry;
          }) as CountryFeature[];

        setCountries(countryFeatures.sort((a, b) =>
          a.properties.name.localeCompare(b.properties.name)
        ));
        setError(null);
        setLoading(false);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load map data';
        logger.error('Error loading map data:', { err });
        setError(errorMessage);
        setLoading(false);
      }
    };

    void loadMapData();
  }, []);

  // Load US states and province boundaries
  React.useEffect(() => {
    const loadStateBoundaries = async (): Promise<void> => {
      if (!layers.showStates || statesData.length > 0 || loadingStates) return;

      try {
        setLoadingStates(true);
        // Load US states GeoJSON from Natural Earth
        const response = await fetch('https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_admin_1_states_provinces.geojson');

        if (response.ok) {
          const data = await response.json() as { features?: Array<{ geometry: unknown; properties?: Record<string, unknown> }> };
          setStatesData(data.features ?? []);
          logger.debug('EnhancedGeographicMap', `Loaded ${data.features?.length ?? 0} state/province boundaries`);
        }
      } catch (err) {
        logger.error('Error loading state boundaries:', { err });
      } finally {
        setLoadingStates(false);
      }
    };

    void loadStateBoundaries();
  }, [layers.showStates, statesData.length, loadingStates]);

  const toggleLayer = (layer: keyof LayerToggles): void => {
    setLayers(prev => ({ ...prev, [layer]: !prev[layer] }));
  };

  // Zoom controls
  const handleZoomIn = React.useCallback((): void => setZoom(prev => Math.min(prev * 1.5, 8)), []);
  const handleZoomOut = React.useCallback((): void => setZoom(prev => Math.max(prev / 1.5, 1)), []);
  const handleReset = React.useCallback((): void => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  // Pan controls
  const handleMouseDown = (e: React.MouseEvent): void => {
    if (e.button === 0 && (e.target as HTMLElement).tagName === 'rect') {
      setIsDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent): void => {
    if (isDragging) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = (): void => setIsDragging(false);

  // Keyboard shortcuts for zoom
  React.useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent): void => {
      if (e.key === '=' || e.key === '+') {
        handleZoomIn();
      } else if (e.key === '-' || e.key === '_') {
        handleZoomOut();
      } else if (e.key === '0') {
        handleReset();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return (): void => window.removeEventListener('keydown', handleKeyPress);
  }, [handleZoomIn, handleZoomOut, handleReset]);

  // Mouse wheel zoom handler with zoom to cursor position
  const handleWheel = (e: React.WheelEvent<SVGSVGElement>): void => {
    e.preventDefault();
    e.stopPropagation();

    const svg = svgRef.current;
    if (!svg) return;

    // Get mouse position relative to SVG
    const rect = svg.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Calculate the point in the map coordinates (before zoom)
    const pointX = (mouseX - width / 2 - pan.x) / zoom;
    const pointY = (mouseY - height / 2 - pan.y) / zoom;

    // Calculate new zoom level
    const zoomFactor = e.deltaY < 0 ? 1.5 : 1 / 1.5;
    const newZoom = e.deltaY < 0
      ? Math.min(zoom * zoomFactor, 8)
      : Math.max(zoom * zoomFactor, 1);

    // Calculate new pan to keep the point under the mouse
    const newPanX = mouseX - width / 2 - pointX * newZoom;
    const newPanY = mouseY - height / 2 - pointY * newZoom;

    setZoom(newZoom);
    setPan({ x: newPanX, y: newPanY });
  };

  const getCountryFill = (countryCode: string, isHovered: boolean): string => {
    const hasVisited = visitedCountries[countryCode];

    if (isHovered) {
      // Highlighted state: darker green for visited, light gray for unvisited
      return hasVisited ? '#16A34A' : '#9CA3AF';
    }

    // Google Maps style: soft green for visited, very light beige/tan for unvisited
    return hasVisited ? '#86EFAC' : '#F3F1E8';
  };

  // Project lat/lon to screen coordinates
  const project = (lat: number, lon: number): [number, number] | null => {
    const coords = projection([lon, lat]);
    return coords ?? null;
  };

  const visitedCount = Object.keys(visitedCountries).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[500px] bg-white">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent mx-auto mb-4" />
          <p className="text-gray-600">Loading enhanced map...</p>
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
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Travel Map - Enhanced</h1>
          <div className="flex items-center gap-3">
            <div className="text-lg font-semibold text-blue-600">
              {visitedCount} {visitedCount === 1 ? 'country' : 'countries'} visited
            </div>

            {/* Zoom Controls */}
            <div className="flex items-center gap-1 border border-gray-300 rounded-lg p-1">
              <button
                onClick={handleZoomOut}
                className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                title="Zoom Out (-)"
              >
                <ZoomOut className="h-4 w-4 text-gray-700" />
              </button>
              <div className="px-2 py-1 text-xs font-medium text-gray-700 min-w-[50px] text-center">
                {Math.round(zoom * 100)}%
              </div>
              <button
                onClick={handleZoomIn}
                className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                title="Zoom In (+)"
              >
                <ZoomIn className="h-4 w-4 text-gray-700" />
              </button>
              <button
                onClick={handleReset}
                className="p-1.5 hover:bg-gray-100 rounded transition-colors border-l border-gray-300"
                title="Reset View (0)"
              >
                <Maximize2 className="h-4 w-4 text-gray-700" />
              </button>
            </div>

            <button
              onClick={() => setShowLayerPanel(!showLayerPanel)}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors flex items-center gap-2"
            >
              <Layers className="h-4 w-4" />
              Layers
            </button>
            <button
              onClick={() => setShowList(!showList)}
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
            <div className="bg-white rounded-lg border border-gray-200 p-4 relative">
              {/* Layer Panel */}
              {showLayerPanel && (
                <div className="absolute top-4 right-4 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-10 w-72">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-gray-900">Geographic Layers</h3>
                    <button
                      onClick={() => setShowLayerPanel(false)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      ×
                    </button>
                  </div>
                  <div className="space-y-2.5">
                    <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1.5 rounded">
                      <input
                        type="checkbox"
                        checked={layers.showRivers}
                        onChange={() => toggleLayer('showRivers')}
                        className="w-4 h-4 text-blue-600 rounded"
                      />
                      <Waves className="h-4 w-4 text-blue-500" />
                      <span className="text-sm font-medium">Rivers ({worldRivers.length})</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1.5 rounded">
                      <input
                        type="checkbox"
                        checked={layers.showMountains}
                        onChange={() => toggleLayer('showMountains')}
                        className="w-4 h-4 text-blue-600 rounded"
                      />
                      <Mountain className="h-4 w-4 text-amber-800" />
                      <span className="text-sm font-medium">Mountains ({worldMountains.reduce((sum, r) => sum + (r.peaks?.length ?? 0), 0)} peaks)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1.5 rounded">
                      <input
                        type="checkbox"
                        checked={layers.showLakes}
                        onChange={() => toggleLayer('showLakes')}
                        className="w-4 h-4 text-blue-600 rounded"
                      />
                      <Droplets className="h-4 w-4 text-cyan-500" />
                      <span className="text-sm font-medium">Lakes ({worldLakes.length})</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1.5 rounded">
                      <input
                        type="checkbox"
                        checked={layers.showDeserts}
                        onChange={() => toggleLayer('showDeserts')}
                        className="w-4 h-4 text-blue-600 rounded"
                      />
                      <div className="h-4 w-4 bg-yellow-200 rounded"></div>
                      <span className="text-sm font-medium">Deserts ({worldDeserts.length})</span>
                    </label>
                    <div className="border-t border-gray-200 my-2"></div>
                    <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1.5 rounded">
                      <input
                        type="checkbox"
                        checked={layers.showStates}
                        onChange={() => toggleLayer('showStates')}
                        className="w-4 h-4 text-blue-600 rounded"
                      />
                      <MapPin className="h-4 w-4 text-gray-500" />
                      <span className="text-sm font-medium">States/Provinces</span>
                      {loadingStates && <span className="text-xs text-gray-400">(loading...)</span>}
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1.5 rounded">
                      <input
                        type="checkbox"
                        checked={layers.showTerrain}
                        onChange={() => toggleLayer('showTerrain')}
                        className="w-4 h-4 text-blue-600 rounded"
                      />
                      <div className="h-4 w-4 bg-gradient-to-b from-green-200 to-amber-200 rounded"></div>
                      <span className="text-sm font-medium">Terrain Relief</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1.5 rounded">
                      <input
                        type="checkbox"
                        checked={layers.showLabels}
                        onChange={() => toggleLayer('showLabels')}
                        className="w-4 h-4 text-blue-600 rounded"
                      />
                      <span className="text-sm font-medium">Feature Labels</span>
                    </label>
                  </div>
                </div>
              )}

              <svg
                ref={svgRef}
                viewBox={`0 0 ${width} ${height}`}
                className={`w-full h-auto ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
                style={{ maxHeight: '600px' }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onWheel={handleWheel}
              >
                {/* Ocean - Google Maps style */}
                <rect
                  width={width}
                  height={height}
                  fill="#A8C5DD"
                  className="pointer-events-all"
                />

                {/* Ocean gradient for depth effect */}
                <defs>
                  <radialGradient id="oceanGradient" cx="50%" cy="50%">
                    <stop offset="0%" stopColor="#B8D4E8" />
                    <stop offset="100%" stopColor="#A8C5DD" />
                  </radialGradient>
                </defs>

                {/* Terrain Relief (if enabled) */}
                {layers.showTerrain && (
                  <g opacity="0.3">
                    {/* Add terrain shading here - would use DEM data in production */}
                  </g>
                )}

                {/* Countries with Google Maps styling */}
                <g>
                  {countries.map((country, idx) => {
                    const countryCode = country.properties.iso_a2;
                    const isHovered = hoveredCountry === countryCode;

                    try {
                      const path = pathGenerator(country.geometry as Parameters<typeof pathGenerator>[0]);
                      if (!path) return null;

                      return (
                        <g key={`${country.id}-${idx}`}>
                          {/* Country fill */}
                          <path
                            d={path}
                            fill={getCountryFill(countryCode, isHovered)}
                            stroke="#E5E3D8"
                            strokeWidth={0.5}
                            className="cursor-pointer transition-colors duration-200"
                            onClick={(): void => onCountryClick(countryCode)}
                            onMouseEnter={(): void => setHoveredCountry(countryCode)}
                            onMouseLeave={(): void => setHoveredCountry(null)}
                          />
                          {/* Country border - thicker for visual clarity */}
                          <path
                            d={path}
                            fill="none"
                            stroke="#D4D2C5"
                            strokeWidth={0.8}
                            opacity={0.7}
                            className="pointer-events-none"
                          />
                        </g>
                      );
                    } catch (_err) {
                      return null;
                    }
                  })}
                </g>

                {/* Country Labels */}
                {layers.showLabels && (
                  <g className="country-labels">
                    {countries.map((country, idx) => {
                      try {
                        // Calculate centroid of the country for label placement
                        const bounds = pathGenerator.bounds(country.geometry as Parameters<typeof pathGenerator.bounds>[0]);
                        if (!bounds || bounds[0][0] === Infinity) return null;

                        const centerX = (bounds[0][0] + bounds[1][0]) / 2;
                        const centerY = (bounds[0][1] + bounds[1][1]) / 2;

                        // Calculate area to determine font size
                        const area = pathGenerator.area(country.geometry as Parameters<typeof pathGenerator.area>[0]);
                        const isLarge = area > 5000;
                        const isMedium = area > 1000;
                        const isSmall = area > 200;

                        // Only show labels for countries with reasonable size
                        if (area < 100) return null;

                        const fontSize = isLarge ? 11 : isMedium ? 9 : isSmall ? 7 : 6;
                        const fontWeight = isLarge ? '700' : '600';

                        return (
                          <text
                            key={`label-${country.id}-${idx}`}
                            x={centerX}
                            y={centerY}
                            fontSize={fontSize}
                            fontWeight={fontWeight}
                            fill="#5A5A5A"
                            textAnchor="middle"
                            dominantBaseline="middle"
                            className="pointer-events-none select-none"
                            stroke="#FFFFFF"
                            strokeWidth="0.5"
                            paintOrder="stroke"
                            style={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}
                          >
                            {country.properties.name}
                          </text>
                        );
                      } catch (_err) {
                        return null;
                      }
                    })}
                  </g>
                )}

                {/* State/Province Boundaries (if enabled) - Google Maps style */}
                {layers.showStates && statesData.length > 0 && (
                  <g className="states">
                    {statesData.map((state, idx) => {
                      try {
                        const path = pathGenerator(state.geometry as Parameters<typeof pathGenerator>[0]);
                        if (!path) return null;

                        return (
                          <path
                            key={`state-${idx}`}
                            d={path}
                            fill="none"
                            stroke="#C4C2B8"
                            strokeWidth="0.4"
                            strokeDasharray="3,2"
                            opacity="0.6"
                          />
                        );
                      } catch (_err) {
                        return null;
                      }
                    })}
                  </g>
                )}

                {/* Deserts (if enabled) - Google Maps terrain style */}
                {layers.showDeserts && (
                  <g className="deserts" opacity="0.35">
                    {worldDeserts.map((desert, idx) => {
                      const coords = project(desert.lat, desert.lon);
                      if (!coords) return null;

                      // Draw desert as a shaded circle with terrain colors
                      const radius = Math.sqrt(desert.area) / 1500; // Scale based on area

                      return (
                        <g key={`desert-${idx}`}>
                          <circle
                            cx={coords[0]}
                            cy={coords[1]}
                            r={radius}
                            fill="#F5E6D3"
                            stroke="#E8D4B8"
                            strokeWidth="0.8"
                            opacity="0.6"
                          />
                          {layers.showLabels && desert.area > 500000 && (
                            <text
                              x={coords[0]}
                              y={coords[1]}
                              fontSize="7"
                              fill="#A67C52"
                              fontWeight="600"
                              textAnchor="middle"
                              stroke="#FFFFFF"
                              strokeWidth="0.3"
                              paintOrder="stroke"
                            >
                              {desert.name}
                            </text>
                          )}
                        </g>
                      );
                    })}
                  </g>
                )}

                {/* Lakes (if enabled) - Google Maps style */}
                {layers.showLakes && (
                  <g className="lakes">
                    {worldLakes.map((lake, idx) => {
                      const coords = project(lake.lat, lake.lon);
                      if (!coords) return null;

                      // Scale lake size based on area
                      const radius = Math.sqrt(lake.area) / 200;

                      return (
                        <g key={`lake-${idx}`}>
                          {/* Lake water with realistic blue */}
                          <circle
                            cx={coords[0]}
                            cy={coords[1]}
                            r={radius}
                            fill="#A8C5DD"
                            stroke="#8FA9C4"
                            strokeWidth="0.5"
                            opacity="0.9"
                          />
                          {/* Water shimmer effect */}
                          <circle
                            cx={coords[0] - radius * 0.2}
                            cy={coords[1] - radius * 0.2}
                            r={radius * 0.3}
                            fill="#B8D4E8"
                            opacity="0.3"
                          />
                          {layers.showLabels && lake.area > 30000 && (
                            <text
                              x={coords[0]}
                              y={coords[1] + radius + 8}
                              fontSize="7"
                              fill="#4A6A86"
                              fontWeight="600"
                              textAnchor="middle"
                              stroke="#FFFFFF"
                              strokeWidth="0.3"
                              paintOrder="stroke"
                            >
                              {lake.name}
                            </text>
                          )}
                        </g>
                      );
                    })}
                  </g>
                )}

                {/* Rivers (if enabled) - Google Maps style */}
                {layers.showRivers && (
                  <g className="rivers">
                    {worldRivers.map((river, idx) => {
                      const pathPoints = river.path
                        .map(point => project(point.lat, point.lon))
                        .filter((p): p is [number, number] => p !== null);

                      if (pathPoints.length < 2) return null;

                      const riverPath = `M ${pathPoints.map(p => `${p[0]},${p[1]}`).join(' L ')}`;

                      // Scale river width based on length (major rivers are wider)
                      const riverWidth = river.length > 5000 ? 2.8 : river.length > 3000 ? 2.0 : 1.4;

                      return (
                        <g key={`river-${idx}`}>
                          {/* River border/outline */}
                          <path
                            d={riverPath}
                            stroke="#8FA9C4"
                            strokeWidth={riverWidth + 0.6}
                            fill="none"
                            opacity="0.4"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          {/* Main river body - realistic water blue */}
                          <path
                            d={riverPath}
                            stroke="#A8C5DD"
                            strokeWidth={riverWidth}
                            fill="none"
                            opacity="0.85"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          {layers.showLabels && river.length > 3000 && pathPoints.length > 0 && (
                            <text
                              x={pathPoints[Math.floor(pathPoints.length / 2)][0]}
                              y={pathPoints[Math.floor(pathPoints.length / 2)][1] - 5}
                              fontSize="7"
                              fill="#4A6A86"
                              fontWeight="600"
                              textAnchor="middle"
                              stroke="#FFFFFF"
                              strokeWidth="0.4"
                              paintOrder="stroke"
                            >
                              {river.name}
                            </text>
                          )}
                        </g>
                      );
                    })}
                  </g>
                )}

                {/* Mountains (if enabled) - Enhanced with 3D relief */}
                {layers.showMountains && (
                  <g className="mountains">
                    {worldMountains.flatMap((range, rangeIdx) =>
                      range.peaks?.map((peak: { lat: number; lon: number; elevation: number; name: string }, peakIdx: number) => {
                        const coords = project(peak.lat, peak.lon);
                        if (!coords) return null;

                        // Scale mountain size based on elevation
                        const baseSize = peak.elevation > 8000 ? 8 :
                                        peak.elevation > 7000 ? 6.5 :
                                        peak.elevation > 5000 ? 5 :
                                        peak.elevation > 3000 ? 4 : 3;

                        const size = baseSize * (zoom > 1 ? Math.min(zoom * 0.8, 1.5) : 1);

                        // Color gradients for realistic terrain
                        const isSnowCapped = peak.elevation > 7000;
                        const isMajor = peak.elevation > 5000;

                        return (
                          <g key={`peak-${rangeIdx}-${peakIdx}`}>
                            {/* Mountain shadow base */}
                            <path
                              d={`M ${coords[0]},${coords[1] - size} L ${coords[0] - size * 1.2},${coords[1] + size} L ${coords[0] + size * 1.2},${coords[1] + size} Z`}
                              fill="#4A3F35"
                              opacity="0.3"
                            />

                            {/* Mountain body - dark side (left) */}
                            <path
                              d={`M ${coords[0]},${coords[1] - size} L ${coords[0] - size},${coords[1] + size} L ${coords[0]},${coords[1] + size * 0.5} Z`}
                              fill={isSnowCapped ? '#E0E7EF' : isMajor ? '#6B5D52' : '#8B7355'}
                              stroke="#3D342D"
                              strokeWidth="0.3"
                            />

                            {/* Mountain body - light side (right) */}
                            <path
                              d={`M ${coords[0]},${coords[1] - size} L ${coords[0]},${coords[1] + size * 0.5} L ${coords[0] + size},${coords[1] + size} Z`}
                              fill={isSnowCapped ? '#F8FAFC' : isMajor ? '#9B8B7E' : '#B5A088'}
                              stroke="#3D342D"
                              strokeWidth="0.3"
                            />

                            {/* Snow cap for high peaks */}
                            {isSnowCapped && (
                              <path
                                d={`M ${coords[0]},${coords[1] - size} L ${coords[0] - size * 0.4},${coords[1] - size * 0.3} L ${coords[0]},${coords[1]} L ${coords[0] + size * 0.4},${coords[1] - size * 0.3} Z`}
                                fill="#FFFFFF"
                                opacity="0.9"
                              />
                            )}

                            {/* Highlight edge */}
                            <line
                              x1={coords[0]}
                              y1={coords[1] - size}
                              x2={coords[0] + size * 0.7}
                              y2={coords[1] + size * 0.3}
                              stroke={isSnowCapped ? '#FFFFFF' : '#D4C4B0'}
                              strokeWidth="0.5"
                              opacity="0.6"
                            />

                            {layers.showLabels && peak.elevation > 6000 && (
                              <text
                                x={coords[0]}
                                y={coords[1] - size - 4}
                                fontSize="7"
                                fill="#3D342D"
                                fontWeight="700"
                                textAnchor="middle"
                                stroke="#FFFFFF"
                                strokeWidth="0.4"
                                paintOrder="stroke"
                              >
                                {peak.name}
                              </text>
                            )}
                          </g>
                        );
                      })
                    )}
                  </g>
                )}
              </svg>

              {/* Hover info */}
              {hoveredCountry && (
                <div className="mt-4 text-center">
                  <div className="inline-block bg-gray-100 rounded px-4 py-2">
                    <p className="text-lg font-medium text-gray-900">
                      {countries.find(c => c.properties.iso_a2 === hoveredCountry)?.properties.name}
                    </p>
                    <p className="text-sm text-gray-600">
                      {visitedCountries[hoveredCountry] !== undefined && visitedCountries[hoveredCountry] !== null
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
                  {countries.map((country, idx) => {
                    const countryCode = country.properties.iso_a2;
                    const isVisited = !!visitedCountries[countryCode];

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
          <h4 className="text-sm font-semibold text-gray-700 mb-3 text-center">Map Legend</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded border border-gray-300" style={{ backgroundColor: '#86EFAC' }}></div>
              <span className="text-xs text-gray-700 font-medium">Visited</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded border border-gray-300" style={{ backgroundColor: '#F3F1E8' }}></div>
              <span className="text-xs text-gray-700 font-medium">Not Visited</span>
            </div>
            {layers.showRivers && (
              <div className="flex items-center gap-2">
                <Waves className="h-5 w-5 text-blue-600" />
                <span className="text-xs text-gray-700 font-medium">{worldRivers.length} Rivers</span>
              </div>
            )}
            {layers.showMountains && (
              <div className="flex items-center gap-2">
                <Mountain className="h-5 w-5 text-amber-800" />
                <span className="text-xs text-gray-700 font-medium">{worldMountains.reduce((s, r) => s + (r.peaks?.length ?? 0), 0)} Peaks</span>
              </div>
            )}
            {layers.showLakes && (
              <div className="flex items-center gap-2">
                <Droplets className="h-5 w-5 text-cyan-500" />
                <span className="text-xs text-gray-700 font-medium">{worldLakes.length} Lakes</span>
              </div>
            )}
            {layers.showDeserts && (
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-yellow-100 border border-yellow-400"></div>
                <span className="text-xs text-gray-700 font-medium">{worldDeserts.length} Deserts</span>
              </div>
            )}
            {layers.showStates && statesData.length > 0 && (
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-gray-500" />
                <span className="text-xs text-gray-700 font-medium">{statesData.length} States</span>
              </div>
            )}
          </div>
        </div>

        {/* Statistics */}
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-blue-700">{visitedCount}</div>
            <div className="text-xs text-blue-600 font-medium">Countries Visited</div>
          </div>
          <div className="bg-gradient-to-br from-cyan-50 to-cyan-100 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-cyan-700">{worldRivers.length}</div>
            <div className="text-xs text-cyan-600 font-medium">Major Rivers</div>
          </div>
          <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-amber-700">{worldMountains.reduce((s, r) => s + (r.peaks?.length ?? 0), 0)}</div>
            <div className="text-xs text-amber-600 font-medium">Mountain Peaks</div>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-green-700">{countries.length}</div>
            <div className="text-xs text-green-600 font-medium">Total Countries</div>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-4 text-center text-sm text-gray-600">
          Click countries to mark as visited • Toggle layers to explore geographic features • Hover for details
        </div>
      </div>
    </div>
  );
};

export default EnhancedGeographicMap;
