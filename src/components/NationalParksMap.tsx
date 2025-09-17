import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Trees, MapPin, Info, Calendar, Users, Award, Menu, X, Search } from 'lucide-react';
import nationalParksData from '../data/nationalParks.json';
import useResponsiveMap from '../hooks/useResponsiveMap';

// Type assertion to ensure proper typing
const nationalParks = nationalParksData as Park[];

// Custom tree icon for markers
const createTreeIcon = (size: number = 24) => {
  return L.divIcon({
    html: `
      <div class="flex items-center justify-center w-${size / 4} h-${size / 4} bg-green-600 rounded-full border-2 border-white shadow-lg">
        <svg width="${size * 0.6}" height="${size * 0.6}" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 2v20"/>
          <path d="m15 5-3-3-3 3"/>
          <path d="m20 15-3-3-3 3"/>
          <path d="m4 9 3-3 3 3"/>
        </svg>
      </div>
    `,
    className: 'custom-tree-marker',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2]
  });
};

// Park data interface
interface Park {
  id: string;
  name: string;
  state: string;
  coordinates: [number, number];
  established: string;
  description: string;
  visitors: string;
  features: string[];
}

// Map bounds for US (including Alaska and Hawaii)
const US_BOUNDS: [[number, number], [number, number]] = [
  [18.91, -179.13], // Southwest corner (includes Hawaii and western Alaska)
  [71.35, -66.96]   // Northeast corner
];

// Custom hook for map bounds
const MapBounds: React.FC = () => {
  const map = useMap();
  
  useEffect(() => {
    map.fitBounds(US_BOUNDS, { padding: [20, 20] });
  }, [map]);
  
  return null;
};

// Park Modal Component
interface ParkModalProps {
  park: Park | null;
  onClose: () => void;
}

const ParkModal: React.FC<ParkModalProps> = ({ park, onClose }) => {
  if (!park) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[10000] p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 rounded-t-xl">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{park.name}</h2>
              <div className="flex items-center text-gray-600 space-x-4">
                <div className="flex items-center">
                  <MapPin size={16} className="mr-1" />
                  <span className="text-sm">{park.state}</span>
                </div>
                <div className="flex items-center">
                  <Calendar size={16} className="mr-1" />
                  <span className="text-sm">Est. {park.established}</span>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-lg"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="flex items-center p-4 bg-blue-50 rounded-lg">
              <Users className="w-8 h-8 text-blue-600 mr-3" />
              <div>
                <div className="text-sm text-gray-600">Annual Visitors</div>
                <div className="font-semibold text-gray-900">{park.visitors}</div>
              </div>
            </div>
            <div className="flex items-center p-4 bg-green-50 rounded-lg">
              <Award className="w-8 h-8 text-green-600 mr-3" />
              <div>
                <div className="text-sm text-gray-600">Established</div>
                <div className="font-semibold text-gray-900">{park.established}</div>
              </div>
            </div>
          </div>
          
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">About</h3>
            <p className="text-gray-700 leading-relaxed">{park.description}</p>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Key Features</h3>
            <div className="flex flex-wrap gap-2">
              {park.features.map((feature, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium"
                >
                  {feature}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Main National Parks Map Component
const NationalParksMap: React.FC = () => {
  const [selectedPark, setSelectedPark] = useState<Park | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const mapRef = useRef<L.Map | null>(null);
  const { isMobile, markerSize, popupMaxWidth, zoomLevel } = useResponsiveMap();

  useEffect(() => {
    // Simulate loading time for better UX
    const timer = setTimeout(() => setIsLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  const filteredParks = nationalParks.filter(park =>
    park.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    park.state.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleMarkerClick = (park: Park) => {
    setSelectedPark(park);
  };

  const flyToPark = (park: Park) => {
    if (mapRef.current) {
      mapRef.current.flyTo(park.coordinates, isMobile ? 6 : 8, {
        animate: true,
        duration: 1.5
      });
    }
    setSelectedPark(park);
    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading National Parks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-[1000]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
                National Parks of the United States of America
              </h1>
              <div className="flex items-center text-gray-600 space-x-6">
                <div className="flex items-center">
                  <Trees className="w-5 h-5 mr-2 text-green-600" />
                  <span className="text-sm font-medium">{nationalParks.length} National Parks</span>
                </div>
                <div className="flex items-center">
                  <MapPin className="w-5 h-5 mr-2 text-blue-600" />
                  <span className="text-sm font-medium">Interactive Map</span>
                </div>
              </div>
            </div>
            
            {/* Search Bar and Mobile Menu */}
            <div className="flex items-center space-x-4">
              {/* Search Bar */}
              <div className="relative max-w-md w-full">
                <input
                  type="text"
                  placeholder={isMobile ? "Search parks..." : "Search parks by name or state..."}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
                <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              </div>
              
              {/* Mobile Menu Button */}
              {isMobile && (
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors lg:hidden"
                >
                  {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row h-[calc(100vh-120px)] relative">
        {/* Map Container */}
        <div className="flex-1 relative">
          <MapContainer
            center={[39.8283, -98.5795]} // Geographic center of US
            zoom={zoomLevel}
            className="h-full w-full"
            ref={mapRef}
            zoomControl={false}
            scrollWheelZoom={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapBounds />
            
            {filteredParks.map((park) => (
              <Marker
                key={park.id}
                position={park.coordinates}
                icon={createTreeIcon(markerSize)}
                eventHandlers={{
                  click: () => handleMarkerClick(park),
                }}
              >
                <Popup className="custom-popup" maxWidth={popupMaxWidth}>
                  <div className={`p-2 ${isMobile ? 'min-w-[180px]' : 'min-w-[200px]'}`}>
                    <h3 className={`font-semibold text-gray-900 mb-1 ${isMobile ? 'text-sm' : 'text-base'}`}>{park.name}</h3>
                    <p className={`text-gray-600 mb-2 ${isMobile ? 'text-xs' : 'text-sm'}`}>{park.state}</p>
                    <p className={`text-gray-500 mb-3 line-clamp-2 ${isMobile ? 'text-xs' : 'text-xs'}`}>{park.description}</p>
                    <button
                      onClick={() => setSelectedPark(park)}
                      className={`w-full px-3 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center ${isMobile ? 'text-xs' : 'text-sm'}`}
                    >
                      <Info size={isMobile ? 12 : 14} className="mr-1" />
                      Learn More
                    </button>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>

          {/* Map Legend */}
          <div className={`absolute bottom-4 left-4 bg-white rounded-lg shadow-lg border border-gray-200 z-[1000] ${isMobile ? 'p-3' : 'p-4'}`}>
            <h4 className={`font-semibold text-gray-900 mb-3 ${isMobile ? 'text-xs' : 'text-sm'}`}>Legend</h4>
            <div className="space-y-2">
              <div className="flex items-center">
                <div className={`flex items-center justify-center bg-green-600 rounded-full border-2 border-white shadow-sm mr-3 ${isMobile ? 'w-5 h-5' : 'w-6 h-6'}`}>
                  <Trees size={isMobile ? 10 : 12} className="text-white" />
                </div>
                <span className={`text-gray-700 ${isMobile ? 'text-xs' : 'text-xs'}`}>National Park</span>
              </div>
            </div>
            <div className={`mt-3 pt-3 border-t border-gray-200 text-gray-500 ${isMobile ? 'text-xs' : 'text-xs'}`}>
              {isMobile ? 'Tap markers' : 'Click markers for details'}
            </div>
          </div>

          {/* Zoom Controls */}
          <div className={`absolute top-4 right-4 bg-white rounded-lg shadow-lg border border-gray-200 z-[1000] ${isMobile ? 'hidden' : 'block'}`}>
            <button
              onClick={() => mapRef.current?.zoomIn()}
              className="block px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-t-lg transition-colors"
            >
              +
            </button>
            <div className="border-t border-gray-200"></div>
            <button
              onClick={() => mapRef.current?.zoomOut()}
              className="block px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-b-lg transition-colors"
            >
              −
            </button>
          </div>
        </div>

        {/* Mobile Sidebar Backdrop */}
        {isMobile && sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-[1000]"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar - Parks List */}
        <div 
          className={`
            ${isMobile 
              ? `fixed inset-y-0 right-0 w-80 max-w-[90vw] bg-white shadow-2xl border-l border-gray-200 overflow-y-auto z-[1001] transform transition-transform duration-300 ease-in-out ${
                  sidebarOpen ? 'translate-x-0' : 'translate-x-full'
                }`
              : 'w-full lg:w-80 bg-white shadow-lg border-l border-gray-200 overflow-y-auto'
            }
          `}
        >
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">Parks Directory</h3>
                <p className="text-sm text-gray-600 mt-1">
                  {filteredParks.length} park{filteredParks.length !== 1 ? 's' : ''}
                  {searchTerm && ' found'}
                </p>
              </div>
              {isMobile && (
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              )}
            </div>
          </div>
          
          <div className="divide-y divide-gray-200">
            {filteredParks.map((park) => (
              <div
                key={park.id}
                className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => flyToPark(park)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 text-sm mb-1">{park.name}</h4>
                    <div className="flex items-center text-xs text-gray-500 mb-2">
                      <MapPin size={12} className="mr-1" />
                      {park.state}
                      <span className="mx-2">•</span>
                      <Calendar size={12} className="mr-1" />
                      Est. {park.established}
                    </div>
                    <p className="text-xs text-gray-600 line-clamp-2">{park.description}</p>
                  </div>
                  <Trees size={16} className="text-green-600 ml-2 flex-shrink-0" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Park Modal */}
      <ParkModal park={selectedPark} onClose={() => setSelectedPark(null)} />
    </div>
  );
};

export default NationalParksMap;