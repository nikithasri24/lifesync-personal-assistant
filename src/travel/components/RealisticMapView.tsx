/**
 * RealisticMapView - Professional world map using real TopoJSON data
 * Similar to mappacker.com with accurate country boundaries
 */

import React from 'react';
import { geoPath, geoNaturalEarth1 } from 'd3-geo';
import { feature } from 'topojson-client';
import { ZoomIn, ZoomOut, Maximize2, Search, X } from 'lucide-react';
import type { VisitStatus } from '../types';
import type { Topology, GeometryCollection } from 'topojson-specification';
import { logger } from '../../services/logger';

type RealisticMapViewProps = {
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
  geometry: any;
}

const RealisticMapView: React.FC<RealisticMapViewProps> = ({
  visitedCountries,
  onCountryClick,
}) => {
  const [countries, setCountries] = React.useState<CountryFeature[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [hoveredCountry, setHoveredCountry] = React.useState<string | null>(null);
  const [tooltip, setTooltip] = React.useState<{ x: number; y: number; name: string } | null>(null);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [zoom, setZoom] = React.useState(1);
  const [pan, setPan] = React.useState({ x: 0, y: 0 });
  const svgRef = React.useRef<SVGSVGElement>(null);
  const searchInputRef = React.useRef<HTMLInputElement>(null);

  const width = 960;
  const height = 500;

  // Natural Earth projection for realistic appearance
  const projection = geoNaturalEarth1()
    .scale((width / 6.5) * zoom)
    .translate([width / 2 + pan.x, height / 2 + pan.y]);

  const pathGenerator = geoPath().projection(projection);

  // Load real world map data
  React.useEffect(() => {
    const loadMapData = async () => {
      try {
        setLoading(true);

        // Fetch TopoJSON data from Natural Earth via CDN
        const response = await fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json');
        const topology: Topology = await response.json();

        // Convert TopoJSON to GeoJSON features
        const countriesGeometry = topology.objects.countries as GeometryCollection;
        const geoJsonFeatures = feature(topology, countriesGeometry);

        // Type assertion for features
        const countryFeatures = geoJsonFeatures.features.map((f: any) => ({
          type: 'Feature' as const,
          id: f.id,
          properties: {
            name: f.properties.name || 'Unknown',
            iso_a2: f.properties.iso_a2 || '',
            iso_a3: f.properties.iso_a3 || '',
          },
          geometry: f.geometry,
        }));

        setCountries(countryFeatures);
        setLoading(false);
      } catch (error) {
        logger.error('Error loading map data:', { error });
        setLoading(false);
      }
    };

    loadMapData();
  }, []);

  // Filter for search
  const filteredCountries = React.useMemo(() => {
    if (!searchQuery.trim()) return countries;
    const query = searchQuery.toLowerCase();
    return countries.filter(c =>
      c.properties.name.toLowerCase().includes(query) ||
      c.properties.iso_a2.toLowerCase().includes(query)
    );
  }, [searchQuery, countries]);

  const getCountryFill = (countryCode: string, isHovered: boolean): string => {
    const status = visitedCountries[countryCode];

    if (isHovered) {
      switch (status) {
        case 'visited': return '#2563EB';
        case 'lived': return '#059669';
        case 'transit': return '#D97706';
        case 'wishlist': return '#9333EA';
        default: return '#CBD5E1';
      }
    }

    switch (status) {
      case 'visited': return '#3B82F6';
      case 'lived': return '#10B981';
      case 'transit': return '#F59E0B';
      case 'wishlist': return '#A855F7';
      default: return '#E5E7EB';
    }
  };

  const handleZoomIn = () => setZoom(prev => Math.min(prev * 1.5, 8));
  const handleZoomOut = () => setZoom(prev => Math.max(prev / 1.5, 1));
  const handleReset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setSearchQuery('');
  };

  const handleCountryMouseMove = (e: React.MouseEvent, countryName: string) => {
    const svg = svgRef.current;
    if (svg) {
      const rect = svg.getBoundingClientRect();
      setTooltip({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top - 10,
        name: countryName,
      });
    }
  };

  // Keyboard shortcuts
  React.useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === '/' && e.metaKey) {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === 'Escape') {
        setSearchQuery('');
      } else if (e.key === '=' || e.key === '+') {
        handleZoomIn();
      } else if (e.key === '-') {
        handleZoomOut();
      } else if (e.key === '0') {
        handleReset();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  const stats = {
    visited: Object.values(visitedCountries).filter(s => s === 'visited').length,
    lived: Object.values(visitedCountries).filter(s => s === 'lived').length,
    transit: Object.values(visitedCountries).filter(s => s === 'transit').length,
    wishlist: Object.values(visitedCountries).filter(s => s === 'wishlist').length,
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-center h-[500px]">
          <div className="text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent mx-auto mb-2" />
            <p className="text-sm text-gray-600">Loading world map...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-cyan-50">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search countries... (⌘/)"
                className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleZoomOut}
              className="p-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="h-4 w-4" />
            </button>
            <div className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-xs font-medium min-w-[60px] text-center">
              {Math.round(zoom * 100)}%
            </div>
            <button
              onClick={handleZoomIn}
              className="p-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="h-4 w-4" />
            </button>
            <button
              onClick={handleReset}
              className="p-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              title="Reset"
            >
              <Maximize2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Stats */}
        {(stats.visited + stats.lived + stats.transit + stats.wishlist) > 0 && (
          <div className="mt-3 flex items-center gap-4 text-xs">
            {stats.visited > 0 && (
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span className="text-gray-700 font-medium">{stats.visited} Visited</span>
              </div>
            )}
            {stats.lived > 0 && (
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="text-gray-700 font-medium">{stats.lived} Lived</span>
              </div>
            )}
            {stats.transit > 0 && (
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <span className="text-gray-700 font-medium">{stats.transit} Transit</span>
              </div>
            )}
            {stats.wishlist > 0 && (
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                <span className="text-gray-700 font-medium">{stats.wishlist} Wishlist</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Map */}
      <div className="relative bg-gradient-to-b from-blue-50 via-sky-50 to-cyan-50">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto"
          style={{ maxHeight: '600px', minHeight: '400px' }}
        >
          <defs>
            <filter id="dropShadow">
              <feGaussianBlur in="SourceAlpha" stdDeviation="1.5"/>
              <feOffset dx="0" dy="1" result="offsetblur"/>
              <feComponentTransfer>
                <feFuncA type="linear" slope="0.2"/>
              </feComponentTransfer>
              <feMerge>
                <feMergeNode/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>

          {/* Ocean */}
          <rect width={width} height={height} fill="#E0F2FE" />

          {/* Countries */}
          <g>
            {countries.map((country) => {
              const countryCode = country.properties.iso_a2;
              const isHovered = hoveredCountry === countryCode;
              const isSearchMatch = filteredCountries.some(c => c.properties.iso_a2 === countryCode);
              const path = pathGenerator(country.geometry);

              if (!path) return null;

              return (
                <path
                  key={country.id}
                  d={path}
                  fill={getCountryFill(countryCode, isHovered)}
                  stroke="#FFFFFF"
                  strokeWidth={isHovered ? 1.5 : 0.5}
                  opacity={searchQuery && !isSearchMatch ? 0.3 : 1}
                  className="cursor-pointer transition-all duration-200"
                  filter="url(#dropShadow)"
                  onClick={() => onCountryClick(countryCode)}
                  onMouseEnter={() => setHoveredCountry(countryCode)}
                  onMouseLeave={() => {
                    setHoveredCountry(null);
                    setTooltip(null);
                  }}
                  onMouseMove={(e) => handleCountryMouseMove(e, country.properties.name)}
                />
              );
            })}
          </g>

          {/* Tooltip */}
          {tooltip && hoveredCountry && (
            <g pointerEvents="none">
              <rect
                x={tooltip.x - 40}
                y={tooltip.y - 25}
                width={tooltip.name.length * 7 + 20}
                height="20"
                fill="#1F2937"
                rx="4"
                opacity="0.95"
              />
              <text
                x={tooltip.x - 30}
                y={tooltip.y - 12}
                fill="white"
                fontSize="12"
                fontWeight="600"
              >
                {tooltip.name}
              </text>
            </g>
          )}
        </svg>

        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs text-gray-600 bg-white/90 px-3 py-1.5 rounded-full shadow-sm">
          Click to mark • Hover for country name
        </div>
      </div>

      {/* Legend */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="flex items-center justify-center gap-6 text-sm flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-500 rounded shadow-sm"></div>
            <span className="text-gray-700 font-medium">Visited</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500 rounded shadow-sm"></div>
            <span className="text-gray-700 font-medium">Lived</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-yellow-500 rounded shadow-sm"></div>
            <span className="text-gray-700 font-medium">Transit</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-purple-500 rounded shadow-sm"></div>
            <span className="text-gray-700 font-medium">Wishlist</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RealisticMapView;
