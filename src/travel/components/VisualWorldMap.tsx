import React from 'react';
import { ZoomIn, ZoomOut, Maximize2, Search, X } from 'lucide-react';
import type { VisitStatus } from '../types';
import { getEnhancedCountries, type Country } from './countryData';

type VisualWorldMapProps = {
  visitedCountries: Record<string, VisitStatus>;
  onCountryClick: (countryCode: string) => void;
};

const VisualWorldMap: React.FC<VisualWorldMapProps> = ({
  visitedCountries,
  onCountryClick,
}) => {
  const [hoveredCountry, setHoveredCountry] = React.useState<Country | null>(null);
  const [tooltip, setTooltip] = React.useState<{ x: number; y: number } | null>(null);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [zoom, setZoom] = React.useState(1);
  const [pan, setPan] = React.useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = React.useState(false);
  const [dragStart, setDragStart] = React.useState({ x: 0, y: 0 });
  const [highlightedCountry, setHighlightedCountry] = React.useState<string | null>(null);
  const svgRef = React.useRef<SVGSVGElement>(null);
  const searchInputRef = React.useRef<HTMLInputElement>(null);

  const width = 1000;
  const height = 600;
  const countries = getEnhancedCountries();
  const filteredCountries = React.useMemo(() => {
    if (!searchQuery.trim()) return countries;
    const query = searchQuery.toLowerCase();
    return countries.filter(c =>
      c.name.toLowerCase().includes(query) ||
      c.code.toLowerCase().includes(query)
    );
  }, [searchQuery, countries]);
  const handleSearch = (query: string): void => {
    setSearchQuery(query);
    if (query.trim() && filteredCountries.length > 0) {
      const firstMatch = filteredCountries[0];
      setHighlightedCountry(firstMatch.code);
      setTimeout(() => setHighlightedCountry(null), 3000);
    } else {
      setHighlightedCountry(null);
    }
  };
  const getCountryFill = (country: Country, isHovered: boolean): string => {
    const status = visitedCountries[country.code];
    if (highlightedCountry === country.code) {
      return '#F59E0B';
    }
    if (isHovered) {
      switch (status) {
        case 'visited': return '#2563EB';
        case 'lived': return '#059669';
        case 'transit': return '#D97706';
        case 'wishlist': return '#9333EA';
        default: return '#D1D5DB';
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
  const handleZoomIn = (): void => setZoom(prev => Math.min(prev * 1.4, 8));
  const handleZoomOut = (): void => setZoom(prev => Math.max(prev / 1.4, 0.8));
  const handleReset = (): void => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setSearchQuery('');
    setHighlightedCountry(null);
  };

  const handleMouseDown = (e: React.MouseEvent): void => {
    if (e.button === 0 && e.target === svgRef.current) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent): void => {
    if (isDragging) {
      setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
    }
  };

  const handleMouseUp = (): void => setIsDragging(false);
  const handleCountryMouseMove = (e: React.MouseEvent, _country: Country): void => {
    const svg = svgRef.current;
    if (svg) {
      const rect = svg.getBoundingClientRect();
      setTooltip({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    }
  };

  React.useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent): void => {
      if (e.key === '/' && e.metaKey) {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === 'Escape') {
        setSearchQuery('');
        setHighlightedCountry(null);
        searchInputRef.current?.blur();
      } else if (e.key === '=' || e.key === '+') {
        handleZoomIn();
      } else if (e.key === '-' || e.key === '_') {
        handleZoomOut();
      } else if (e.key === '0') {
        handleReset();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  const visitedCount = Object.keys(visitedCountries).length;
  const stats = {
    visited: Object.values(visitedCountries).filter(s => s === 'visited').length,
    lived: Object.values(visitedCountries).filter(s => s === 'lived').length,
    transit: Object.values(visitedCountries).filter(s => s === 'transit').length,
    wishlist: Object.values(visitedCountries).filter(s => s === 'wishlist').length,
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-cyan-50">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Search countries... (⌘/)"
                className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
              {searchQuery && (
                <button
                  onClick={() => handleSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            {searchQuery && filteredCountries.length > 0 && (
              <div className="mt-2 text-xs text-gray-600">
                Found {filteredCountries.length} {filteredCountries.length === 1 ? 'country' : 'countries'}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleZoomOut}
              className="p-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
              title="Zoom Out (-)"
            >
              <ZoomOut className="h-4 w-4 text-gray-700" />
            </button>
            <div className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-xs font-medium text-gray-700 min-w-[60px] text-center">
              {Math.round(zoom * 100)}%
            </div>
            <button
              onClick={handleZoomIn}
              className="p-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
              title="Zoom In (+)"
            >
              <ZoomIn className="h-4 w-4 text-gray-700" />
            </button>
            <button
              onClick={handleReset}
              className="p-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
              title="Reset View (0)"
            >
              <Maximize2 className="h-4 w-4 text-gray-700" />
            </button>
          </div>
        </div>

        {visitedCount > 0 && (
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

      <div className="relative bg-gradient-to-b from-blue-50 via-cyan-50 to-blue-100">
        <svg
          ref={svgRef}
          viewBox={`${-pan.x / zoom} ${-pan.y / zoom} ${width / zoom} ${height / zoom}`}
          className={`w-full h-auto ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
          style={{ maxHeight: '600px', minHeight: '400px' }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <defs>
            <linearGradient id="oceanGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#DBEAFE" />
              <stop offset="50%" stopColor="#BFDBFE" />
              <stop offset="100%" stopColor="#93C5FD" />
            </linearGradient>

            <filter id="countryDropShadow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceAlpha" stdDeviation="2"/>
              <feOffset dx="0" dy="1" result="offsetblur"/>
              <feComponentTransfer>
                <feFuncA type="linear" slope="0.15"/>
              </feComponentTransfer>
              <feMerge>
                <feMergeNode/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>

            <filter id="hoverGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceAlpha" stdDeviation="3"/>
              <feOffset dx="0" dy="0" result="offsetblur"/>
              <feComponentTransfer>
                <feFuncA type="linear" slope="0.4"/>
              </feComponentTransfer>
              <feMerge>
                <feMergeNode/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          <rect width={width} height={height} fill="url(#oceanGradient)" />
          <g opacity="0.06" stroke="#1E40AF" strokeWidth="0.5" fill="none">
            {Array.from({ length: 20 }).map((_, i) => (
              <line key={`lon-${i}`} x1={i * 50} y1="0" x2={i * 50} y2={height} />
            ))}
            {Array.from({ length: 13 }).map((_, i) => (
              <line key={`lat-${i}`} x1="0" y1={i * 50} x2={width} y2={i * 50} />
            ))}
          </g>
          <g>
            {countries.map((country) => {
              const isHovered = hoveredCountry?.code === country.code;
              const isHighlighted = highlightedCountry === country.code;
              const isSearchMatch = filteredCountries.some(c => c.code === country.code);
              return (
                <path
                  key={country.code}
                  d={country.path}
                  fill={getCountryFill(country, isHovered)}
                  stroke="#FFFFFF"
                  strokeWidth={isHovered || isHighlighted ? 2.5 : 1.2}
                  opacity={searchQuery && !isSearchMatch ? 0.3 : 1}
                  className="cursor-pointer transition-all duration-200"
                  onClick={(e) => {
                    e.stopPropagation();
                    onCountryClick(country.code);
                  }}
                  onMouseEnter={() => setHoveredCountry(country)}
                  onMouseLeave={() => {
                    setHoveredCountry(null);
                    setTooltip(null);
                  }}
                  onMouseMove={(e) => {
                    e.stopPropagation();
                    handleCountryMouseMove(e, country);
                  }}
                  style={{
                    filter: isHovered || isHighlighted ? 'url(#hoverGlow)' : 'url(#countryDropShadow)',
                  }}
                />
              );
            })}
          </g>
          {tooltip && hoveredCountry && (
            <g pointerEvents="none">
              <rect
                x={tooltip.x - 80}
                y={tooltip.y - 85}
                width="160"
                height="70"
                fill="#1F2937"
                rx="8"
                opacity="0.96"
                filter="url(#countryDropShadow)"
              />
              <text
                x={tooltip.x}
                y={tooltip.y - 60}
                fill="white"
                fontSize="14"
                fontWeight="700"
                textAnchor="middle"
              >
                {hoveredCountry.name}
              </text>
              {visitedCountries[hoveredCountry.code] && (
                <>
                  <rect
                    x={tooltip.x - 35}
                    y={tooltip.y - 45}
                    width="70"
                    height="18"
                    fill={getCountryFill(hoveredCountry, false)}
                    rx="9"
                    opacity="0.9"
                  />
                  <text
                    x={tooltip.x}
                    y={tooltip.y - 32}
                    fill="white"
                    fontSize="10"
                    fontWeight="600"
                    textAnchor="middle"
                  >
                    {visitedCountries[hoveredCountry.code].toUpperCase()}
                  </text>
                </>
              )}
              <text
                x={tooltip.x}
                y={tooltip.y - 20}
                fill="#D1D5DB"
                fontSize="10"
                textAnchor="middle"
              >
                {hoveredCountry.continent}
              </text>
              {hoveredCountry.capital && (
                <text
                  x={tooltip.x}
                  y={tooltip.y - 8}
                  fill="#D1D5DB"
                  fontSize="9"
                  textAnchor="middle"
                >
                  Capital: {hoveredCountry.capital}
                </text>
              )}
            </g>
          )}
        </svg>
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs text-gray-600 bg-white/90 px-3 py-1.5 rounded-full shadow-sm">
          Click to mark • Drag to pan • Scroll to zoom
        </div>
      </div>
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

export default VisualWorldMap;
