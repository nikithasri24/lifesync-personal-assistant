/**
 * TravelPage - Interactive travel tracking with full OpenStreetMap integration
 * Shows cities, states, roads, and all geographic details
 */

import React from 'react';
import { X } from 'lucide-react';
import LeafletTravelMapV2 from '../components/LeafletTravelMapV2';
import { travelAPI } from '../api/data';
import type { VisitStatus, CategorizedLocation, LocationVisitCategory } from '../types';
import { nationalParks, getParksByState } from '../data/nationalParks';
import { islands, getIslandsByState } from '../data/islands';
import { getEnhancedCountries } from '../components/countryData';
import { usStates } from '../data/geographicFeatures';
import { supabase } from '../../lib/supabase';
import { logger } from '@/services/logger';

const TravelPage: React.FC = () => {
  const [loading, setLoading] = React.useState(true);
  const [visitedLocations, setVisitedLocations] = React.useState<CategorizedLocation[]>([]);
  const [categoryFilter, setCategoryFilter] = React.useState<LocationVisitCategory | 'all'>('all');
  const [currentUserId, setCurrentUserId] = React.useState<string | null>(null);
  const [partnerId, setPartnerId] = React.useState<string | null>(null);

  // Load data
  React.useEffect(() => {
    loadData();
    loadUserInfo();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const locations = await travelAPI.listVisitedLocations();
      setVisitedLocations(locations);
    } catch (error) {
      logger.error('Travel', 'Error loading travel data', { error });
    } finally {
      setLoading(false);
    }
  };

  const loadUserInfo = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
      }
      // Import getTravelPartner from the API
      const { getTravelPartner } = await import('../api/data');
      const partner = await getTravelPartner();
      setPartnerId(partner);
    } catch (error) {
      logger.error('Travel', 'Error loading user info', { error });
    }
  };

  // Filter locations by category
  const filteredLocations = React.useMemo(() => {
    if (categoryFilter === 'all') return visitedLocations;
    return visitedLocations.filter(loc => loc.visitCategory === categoryFilter);
  }, [visitedLocations, categoryFilter]);

  // Get visited countries map
  const visitedCountriesMap = React.useMemo(() => {
    const map: Record<string, VisitStatus> = {};
    filteredLocations
      .filter(loc => loc.locationType === 'country')
      .forEach(loc => {
        map[loc.countryCode] = loc.status;
      });
    return map;
  }, [filteredLocations]);

  // Get visited countries categories (for map coloring)
  const visitedCountriesCategories = React.useMemo(() => {
    const map: Record<string, LocationVisitCategory> = {};
    visitedLocations
      .filter(loc => loc.locationType === 'country')
      .forEach(loc => {
        map[loc.countryCode] = loc.visitCategory;
      });
    return map;
  }, [visitedLocations]);

  // Get visited states map
  const visitedStatesMap = React.useMemo(() => {
    const map: Record<string, VisitStatus> = {};
    filteredLocations
      .filter(loc => loc.locationType === 'state' && loc.stateCode)
      .forEach(loc => {
        map[loc.stateCode!] = loc.status;
      });
    return map;
  }, [filteredLocations]);

  // Get visited states categories (for map coloring)
  const visitedStatesCategories = React.useMemo(() => {
    const map: Record<string, LocationVisitCategory> = {};
    visitedLocations
      .filter(loc => loc.locationType === 'state' && loc.stateCode)
      .forEach(loc => {
        map[loc.stateCode!] = loc.visitCategory;
      });
    return map;
  }, [visitedLocations]);

  // Get visited parks map
  const visitedParksMap = React.useMemo(() => {
    const map: Record<string, VisitStatus> = {};
    filteredLocations
      .filter(loc => loc.locationType === 'national_park' && loc.nationalParkId)
      .forEach(loc => {
        map[loc.nationalParkId!] = loc.status;
      });
    return map;
  }, [filteredLocations]);

  // Get visited parks categories (for map coloring)
  const visitedParksCategories = React.useMemo(() => {
    const map: Record<string, LocationVisitCategory> = {};
    visitedLocations
      .filter(loc => loc.locationType === 'national_park' && loc.nationalParkId)
      .forEach(loc => {
        map[loc.nationalParkId!] = loc.visitCategory;
      });
    return map;
  }, [visitedLocations]);

  // Get visited islands map
  const visitedIslandsMap = React.useMemo(() => {
    const map: Record<string, VisitStatus> = {};
    filteredLocations
      .filter(loc => loc.locationType === 'island' && loc.islandName)
      .forEach(loc => {
        // Use a composite key: countryCode-islandName or just the island ID if available
        const key = loc.nationalParkId || `${loc.countryCode}-${loc.islandName}`;
        map[key] = loc.status;
      });
    return map;
  }, [filteredLocations]);

  // Get visited islands categories (for map coloring)
  const visitedIslandsCategories = React.useMemo(() => {
    const map: Record<string, LocationVisitCategory> = {};
    visitedLocations
      .filter(loc => loc.locationType === 'island' && loc.islandName)
      .forEach(loc => {
        const key = loc.nationalParkId || `${loc.countryCode}-${loc.islandName}`;
        map[key] = loc.visitCategory;
      });
    return map;
  }, [visitedLocations]);

  // Count locations by category
  const categoryCounts = React.useMemo(() => {
    return {
      all: visitedLocations.length,
      mine: visitedLocations.filter(loc => loc.visitCategory === 'mine').length,
      partner: visitedLocations.filter(loc => loc.visitCategory === 'partner').length,
      both: visitedLocations.filter(loc => loc.visitCategory === 'both').length,
    };
  }, [visitedLocations]);

  const handleCountryClick = async (countryCode: string, visitedByUserIds?: string[]) => {
    // Validate country code
    if (!countryCode || countryCode.length !== 2) {
      logger.error('Travel', 'Invalid country code', { countryCode });
      return;
    }

    try {
      // Check if country is already visited
      const existingLocation = visitedLocations.find(
        loc => loc.countryCode === countryCode && loc.locationType === 'country'
      );

      if (existingLocation) {
        // Optimistically remove from UI
        setVisitedLocations(prev => prev.filter(loc => loc.id !== existingLocation.id));

        // Remove from server
        await travelAPI.deleteLocation(existingLocation.id);
      } else {
        // Add to server
        const newLocation = await travelAPI.markLocation({
          locationType: 'country',
          countryCode,
          countryName: countryCode, // Will be enriched with proper name from API
          status: 'visited',
          visitCount: 1,
        }, visitedByUserIds);

        // Import categorizeLocation to add visitCategory
        const { categorizeLocation } = await import('../api/data');
        const categorizedLocation: CategorizedLocation = {
          ...newLocation,
          visitCategory: categorizeLocation(newLocation, currentUserId!, partnerId)
        };

        // Optimistically add to UI with proper category
        setVisitedLocations(prev => [...prev, categorizedLocation]);
      }
    } catch (error) {
      logger.error('Travel', 'Error toggling country', { error });
      alert('Failed to update country. Please try again.');
      // Reload data to sync with server on error
      await loadData();
    }
  };

  const handleStateClick = async (stateCode: string, countryCode: string, visitedByUserIds?: string[]) => {
    // Validate codes
    if (!stateCode || !countryCode) {
      logger.error('Travel', 'Invalid state or country code', { stateCode, countryCode });
      return;
    }

    try {
      // Check if state is already visited
      const existingLocation = visitedLocations.find(
        loc => loc.stateCode === stateCode && loc.locationType === 'state'
      );

      if (existingLocation) {
        // Optimistically remove from UI
        setVisitedLocations(prev => prev.filter(loc => loc.id !== existingLocation.id));

        // Remove from server
        await travelAPI.deleteLocation(existingLocation.id);
      } else {
        // Add to server
        const newLocation = await travelAPI.markLocation({
          locationType: 'state',
          countryCode,
          countryName: countryCode, // Will be enriched
          stateCode,
          stateName: stateCode, // Will be enriched
          status: 'visited',
          visitCount: 1,
        }, visitedByUserIds);

        // Import categorizeLocation to add visitCategory
        const { categorizeLocation } = await import('../api/data');
        const categorizedLocation: CategorizedLocation = {
          ...newLocation,
          visitCategory: categorizeLocation(newLocation, currentUserId!, partnerId)
        };

        // Optimistically add to UI with proper category
        setVisitedLocations(prev => [...prev, categorizedLocation]);
      }
    } catch (error) {
      logger.error('Travel', 'Error toggling state', { error });
      alert('Failed to update state. Please try again.');
      // Reload data to sync with server on error
      await loadData();
    }
  };

  const handleParkClick = async (parkId: string, visitedByUserIds?: string[]) => {
    // Find park details
    const park = nationalParks.find(p => p.id === parkId);
    if (!park) {
      logger.error('Travel', 'Park not found', { parkId });
      return;
    }

    try {
      // Check if park is already visited
      const existingLocation = visitedLocations.find(
        loc => loc.nationalParkId === parkId && loc.locationType === 'national_park'
      );

      if (existingLocation) {
        // Optimistically remove from UI
        setVisitedLocations(prev => prev.filter(loc => loc.id !== existingLocation.id));

        // Remove from server
        await travelAPI.deleteLocation(existingLocation.id);
      } else {
        // Add to server
        const newLocation = await travelAPI.markLocation({
          locationType: 'national_park',
          countryCode: park.countryCode,
          countryName: park.countryCode, // Will be enriched
          stateCode: park.stateCode,
          stateName: park.stateCode,
          nationalParkId: park.id,
          nationalParkName: park.name,
          status: 'visited',
          visitCount: 1,
        }, visitedByUserIds);

        // Import categorizeLocation to add visitCategory
        const { categorizeLocation } = await import('../api/data');
        const categorizedLocation: CategorizedLocation = {
          ...newLocation,
          visitCategory: categorizeLocation(newLocation, currentUserId!, partnerId)
        };

        // Optimistically add to UI with proper category
        setVisitedLocations(prev => [...prev, categorizedLocation]);
      }
    } catch (error) {
      logger.error('Travel', 'Error toggling park', { error });
      alert('Failed to update park. Please try again.');
      // Reload data to sync with server on error
      await loadData();
    }
  };

  const handleIslandClick = async (islandId: string, visitedByUserIds?: string[]) => {
    // Find island details
    const island = islands.find(i => i.id === islandId);
    if (!island) {
      logger.error('Travel', 'Island not found', { islandId });
      return;
    }

    try {
      // Check if island is already visited (match by island ID using the key format)
      const existingLocation = visitedLocations.find(
        loc => loc.locationType === 'island' &&
        (loc.nationalParkId === islandId || `${loc.countryCode}-${loc.islandName}` === islandId)
      );

      if (existingLocation) {
        // Optimistically remove from UI
        setVisitedLocations(prev => prev.filter(loc => loc.id !== existingLocation.id));

        // Remove from server
        await travelAPI.deleteLocation(existingLocation.id);
      } else {
        // Add to server
        const newLocation = await travelAPI.markLocation({
          locationType: 'island',
          countryCode: island.countryCode,
          countryName: island.countryCode, // Will be enriched
          stateCode: island.stateCode,
          stateName: island.stateCode,
          islandName: island.name,
          nationalParkId: island.id, // Store island ID here for easy lookup
          status: 'visited',
          visitCount: 1,
        }, visitedByUserIds);

        // Import categorizeLocation to add visitCategory
        const { categorizeLocation } = await import('../api/data');
        const categorizedLocation: CategorizedLocation = {
          ...newLocation,
          visitCategory: categorizeLocation(newLocation, currentUserId!, partnerId)
        };

        // Optimistically add to UI with proper category
        setVisitedLocations(prev => [...prev, categorizedLocation]);
      }
    } catch (error) {
      logger.error('Travel', 'Error toggling island', { error });
      alert('Failed to update island. Please try again.');
      // Reload data to sync with server on error
      await loadData();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent mx-auto mb-4" />
          <p className="text-gray-600">Loading travel data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Category Filter Tabs */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-1 py-3 overflow-x-auto">
            <button
              onClick={() => setCategoryFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-colors ${
                categoryFilter === 'all'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              All Travels ({categoryCounts.all})
            </button>
            <button
              onClick={() => setCategoryFilter('mine')}
              className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-colors ${
                categoryFilter === 'mine'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              My Travels ({categoryCounts.mine})
            </button>
            <button
              onClick={() => setCategoryFilter('partner')}
              className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-colors ${
                categoryFilter === 'partner'
                  ? 'bg-purple-100 text-purple-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Partner's Travels ({categoryCounts.partner})
            </button>
            <button
              onClick={() => setCategoryFilter('both')}
              className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-colors ${
                categoryFilter === 'both'
                  ? 'bg-pink-100 text-pink-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Our Travels ({categoryCounts.both})
            </button>
          </div>
        </div>
      </div>

      {/* Map */}
      <div className="h-[60vh]">
        <LeafletTravelMapV2
          visitedCountries={visitedCountriesMap}
          onCountryClick={handleCountryClick}
          visitedStates={visitedStatesMap}
          onStateClick={handleStateClick}
          visitedParks={visitedParksMap}
          onParkClick={handleParkClick}
          visitedIslands={visitedIslandsMap}
          onIslandClick={handleIslandClick}
          visitedCountriesCategories={visitedCountriesCategories}
          visitedStatesCategories={visitedStatesCategories}
          visitedParksCategories={visitedParksCategories}
          visitedIslandsCategories={visitedIslandsCategories}
        />
      </div>

      {/* Location Lists */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Track Your Travels</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Countries List */}
          <AllLocationsListCard
            title="Countries"
            allItems={getEnhancedCountries()}
            visitedLocations={filteredLocations.filter(loc => loc.locationType === 'country')}
            onToggle={(item, visitedByUserIds) => handleCountryClick(item.code, visitedByUserIds)}
            getItemKey={(item) => item.code}
            getItemName={(item) => item.name}
            getVisitedKey={(loc) => loc.countryCode}
            currentUserId={currentUserId || undefined}
            partnerId={partnerId}
          />

          {/* States List */}
          <AllLocationsListCard
            title="US States"
            allItems={usStates}
            visitedLocations={filteredLocations.filter(loc => loc.locationType === 'state')}
            onToggle={(item, visitedByUserIds) => handleStateClick(`US-${item.code}`, 'US', visitedByUserIds)}
            getItemKey={(item) => `US-${item.code}`}
            getItemName={(item) => item.name}
            getVisitedKey={(loc) => loc.stateCode!}
            currentUserId={currentUserId || undefined}
            partnerId={partnerId}
          />

          {/* National Parks List */}
          <AllLocationsListCard
            title="National Parks"
            allItems={nationalParks}
            visitedLocations={filteredLocations.filter(loc => loc.locationType === 'national_park')}
            onToggle={(item, visitedByUserIds) => handleParkClick(item.id, visitedByUserIds)}
            getItemKey={(item) => item.id}
            getItemName={(item) => item.name}
            getVisitedKey={(loc) => loc.nationalParkId!}
            currentUserId={currentUserId || undefined}
            partnerId={partnerId}
          />

          {/* Islands List */}
          <AllLocationsListCard
            title="Islands"
            allItems={islands}
            visitedLocations={filteredLocations.filter(loc => loc.locationType === 'island')}
            onToggle={(item, visitedByUserIds) => handleIslandClick(item.id, visitedByUserIds)}
            getItemKey={(item) => item.id}
            getItemName={(item) => item.name}
            getVisitedKey={(loc) => loc.nationalParkId || `${loc.countryCode}-${loc.islandName}`}
            currentUserId={currentUserId || undefined}
            partnerId={partnerId}
          />
        </div>
      </div>
    </div>
  );
};

// Helper component for showing all available locations with checkboxes
interface AllLocationsListCardProps<T> {
  title: string;
  allItems: T[];
  visitedLocations: CategorizedLocation[];
  onToggle: (item: T, visitedByUserIds?: string[]) => void;
  getItemKey: (item: T) => string;
  getItemName: (item: T) => string;
  getVisitedKey: (location: CategorizedLocation) => string;
  currentUserId?: string;
  partnerId?: string | null;
}

function AllLocationsListCard<T>({
  title,
  allItems,
  visitedLocations,
  onToggle,
  getItemKey,
  getItemName,
  getVisitedKey,
  currentUserId,
  partnerId,
}: AllLocationsListCardProps<T>) {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [contextMenu, setContextMenu] = React.useState<{ itemKey: string; x: number; y: number } | null>(null);

  // Filter items by search term
  const filteredItems = React.useMemo(() => {
    if (!searchTerm) return allItems;
    const lowerSearch = searchTerm.toLowerCase();
    return allItems.filter(item =>
      getItemName(item).toLowerCase().includes(lowerSearch)
    );
  }, [allItems, searchTerm, getItemName]);

  // Check if an item is visited
  const isVisited = (item: T): CategorizedLocation | undefined => {
    const itemKey = getItemKey(item);
    return visitedLocations.find(loc => getVisitedKey(loc) === itemKey);
  };

  const getCategoryColor = (category: LocationVisitCategory) => {
    switch (category) {
      case 'mine':
        return 'bg-blue-100 border-blue-300 text-blue-900';
      case 'partner':
        return 'bg-purple-100 border-purple-300 text-purple-900';
      case 'both':
        return 'bg-pink-100 border-pink-300 text-pink-900';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-700';
    }
  };

  const getCategoryBadge = (category: LocationVisitCategory) => {
    switch (category) {
      case 'mine':
        return <span className="text-xs text-blue-600 font-medium">Me</span>;
      case 'partner':
        return <span className="text-xs text-purple-600 font-medium">Partner</span>;
      case 'both':
        return <span className="text-xs text-pink-600 font-medium">Both</span>;
      default:
        return null;
    }
  };

  const visitedCount = visitedLocations.length;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-3">
        {title} ({visitedCount}/{allItems.length})
      </h3>

      {/* Search box */}
      <input
        type="text"
        placeholder={`Search ${title.toLowerCase()}...`}
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full px-3 py-2 mb-3 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      {/* List */}
      <div className="space-y-1 max-h-96 overflow-y-auto">
        {filteredItems.length === 0 ? (
          <p className="text-sm text-gray-500 italic">No matches found</p>
        ) : (
          filteredItems.map((item) => {
            const visitedLocation = isVisited(item);
            const visited = !!visitedLocation;
            const itemKey = getItemKey(item);

            return (
              <div
                key={itemKey}
                className={`group flex items-center gap-2 p-2 rounded border hover:shadow-sm transition-shadow ${
                  visited
                    ? getCategoryColor(visitedLocation.visitCategory)
                    : 'bg-white border-gray-200 hover:bg-gray-50'
                }`}
                onContextMenu={(e) => {
                  if (!visited && partnerId && currentUserId) {
                    e.preventDefault();
                    setContextMenu({ itemKey, x: e.clientX, y: e.clientY });
                  }
                }}
              >
                {/* Checkbox */}
                <input
                  type="checkbox"
                  checked={visited}
                  onChange={(e) => {
                    e.stopPropagation();
                    if (visited) {
                      // If already visited, toggle to remove
                      onToggle(item);
                    } else {
                      // Default: mark as "Both of Us" if partner exists, otherwise "Me Only"
                      if (partnerId && currentUserId) {
                        onToggle(item, [currentUserId, partnerId]);
                      } else {
                        onToggle(item, currentUserId ? [currentUserId] : undefined);
                      }
                    }
                  }}
                  className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500 cursor-pointer"
                />

                {/* Name */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate font-medium">
                    {getItemName(item)}
                  </p>
                </div>

                {/* Remove button for visited items */}
                {visited && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggle(item);
                    }}
                    className="flex-shrink-0 p-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label={`Remove ${getItemName(item)}`}
                  >
                    <X size={16} />
                  </button>
                )}

                {/* Category badge */}
                {visited && visitedLocation && (
                  <div className="flex-shrink-0">
                    {getCategoryBadge(visitedLocation.visitCategory)}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <>
          {/* Backdrop to close menu */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setContextMenu(null)}
          />

          {/* Menu */}
          <div
            className="fixed z-50 bg-white shadow-lg rounded-lg border border-gray-200 py-1 min-w-[160px]"
            style={{ left: contextMenu.x, top: contextMenu.y }}
          >
            <button
              onClick={() => {
                const item = filteredItems.find(i => getItemKey(i) === contextMenu.itemKey);
                if (item && currentUserId) {
                  onToggle(item, [currentUserId]);
                  setContextMenu(null);
                }
              }}
              className="w-full px-4 py-2 text-left text-sm hover:bg-blue-50 text-blue-700 font-medium flex items-center gap-2"
            >
              <span className="w-3 h-3 rounded-full bg-blue-500"></span>
              Me Only
            </button>
            <button
              onClick={() => {
                const item = filteredItems.find(i => getItemKey(i) === contextMenu.itemKey);
                if (item && partnerId) {
                  onToggle(item, [partnerId]);
                  setContextMenu(null);
                }
              }}
              className="w-full px-4 py-2 text-left text-sm hover:bg-purple-50 text-purple-700 font-medium flex items-center gap-2"
            >
              <span className="w-3 h-3 rounded-full bg-purple-500"></span>
              Partner Only
            </button>
            <button
              onClick={() => {
                const item = filteredItems.find(i => getItemKey(i) === contextMenu.itemKey);
                if (item && currentUserId && partnerId) {
                  onToggle(item, [currentUserId, partnerId]);
                  setContextMenu(null);
                }
              }}
              className="w-full px-4 py-2 text-left text-sm hover:bg-pink-50 text-pink-700 font-medium flex items-center gap-2"
            >
              <span className="w-3 h-3 rounded-full bg-pink-500"></span>
              Both of Us
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default TravelPage;
