/**
 * TravelPage - Interactive travel tracking with full OpenStreetMap integration
 * Shows cities, states, roads, and all geographic details
 */

import React from 'react';
import { X, Plus, Calendar, MapPin, Clock } from 'lucide-react';
import LeafletTravelMapV2 from '../components/LeafletTravelMapV2';
import { travelAPI, listTrips, createTrip, updateTrip, deleteTrip, categorizeTrip } from '../api/data';
import type { VisitStatus, CategorizedLocation, LocationVisitCategory, CategorizedTrip, Trip, TripInput } from '../types';
import { nationalParks, getParksByState } from '../data/nationalParks';
import { islands, getIslandsByState } from '../data/islands';
import { getEnhancedCountries } from '../components/countryData';
import { usStates } from '../data/geographicFeatures';
import { logger } from '@/services/logger';
import { useCurrentUserId, useMergedConnection, usePartnerName } from '@/hooks/useOwnerInfo';
import { useToast } from '@/hooks/useToast';
import TripEditor from '../components/TripEditor';
import ConfirmDialog from '../../components/DebtPayoffCalculator/ConfirmDialog';

type LocationTypeFilter = 'all' | 'countries' | 'states' | 'parks' | 'islands';

const TravelPage: React.FC = () => {
  const [loading, setLoading] = React.useState(true);
  const [visitedLocations, setVisitedLocations] = React.useState<CategorizedLocation[]>([]);
  const [trips, setTrips] = React.useState<CategorizedTrip[]>([]);
  const { showToast } = useToast();
  const [categoryFilter, setCategoryFilter] = React.useState<LocationVisitCategory | 'all'>('all');

  // Trip editor state
  const [isTripEditorOpen, setIsTripEditorOpen] = React.useState(false);
  const [editingTrip, setEditingTrip] = React.useState<Trip | undefined>(undefined);
  const [tripToDelete, setTripToDelete] = React.useState<string | null>(null);

  // Location type filter state (persisted in localStorage)
  const [locationTypeFilter, setLocationTypeFilter] = React.useState<LocationTypeFilter>(() => {
    const saved = localStorage.getItem('travel_location_type_filter');
    return (saved as LocationTypeFilter) || 'all';
  });

  // States count as countries toggle (persisted in localStorage)
  const [statesCountAsCountries, setStatesCountAsCountries] = React.useState(() => {
    const saved = localStorage.getItem('travel_states_count_as_countries');
    return saved === 'true';
  });

  // Use standardized hooks for merged mode support
  const { data: currentUserId } = useCurrentUserId();
  const { data: mergedConnection } = useMergedConnection('visa');
  const { data: partnerName } = usePartnerName('visa');
  const partnerId = mergedConnection?.partnerId ?? null;

  // Persist location type filter
  React.useEffect(() => {
    localStorage.setItem('travel_location_type_filter', locationTypeFilter);
  }, [locationTypeFilter]);

  // Persist states count toggle
  React.useEffect(() => {
    localStorage.setItem('travel_states_count_as_countries', String(statesCountAsCountries));
  }, [statesCountAsCountries]);

  // Load data
  React.useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [locations, tripsData] = await Promise.all([
        travelAPI.listVisitedLocations(),
        listTrips(),
      ]);
      setVisitedLocations(locations);
      setTrips(tripsData);
    } catch (error) {
      logger.error('Travel', 'Error loading travel data', { error });
    } finally {
      setLoading(false);
    }
  };

  // Filter locations by category and type
  const filteredLocations = React.useMemo(() => {
    let filtered = visitedLocations;

    // Filter by category (mine/partner/both/all)
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(loc => loc.visitCategory === categoryFilter);
    }

    // Filter by location type
    if (locationTypeFilter !== 'all') {
      switch (locationTypeFilter) {
        case 'countries':
          filtered = filtered.filter(loc => loc.locationType === 'country');
          break;
        case 'states':
          filtered = filtered.filter(loc => loc.locationType === 'state');
          break;
        case 'parks':
          filtered = filtered.filter(loc => loc.locationType === 'national_park');
          break;
        case 'islands':
          filtered = filtered.filter(loc => loc.locationType === 'island');
          break;
      }
    }

    return filtered;
  }, [visitedLocations, categoryFilter, locationTypeFilter]);

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
      showToast('Failed to update country. Please try again.', 'error');
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
      showToast('Failed to update state. Please try again.', 'error');
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
      showToast('Failed to update park. Please try again.', 'error');
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
      showToast('Failed to update island. Please try again.', 'error');
      // Reload data to sync with server on error
      await loadData();
    }
  };

  // Trip handlers
  const handleCreateTrip = () => {
    setEditingTrip(undefined);
    setIsTripEditorOpen(true);
  };

  const handleEditTrip = (trip: Trip) => {
    logger.debug('Travel', 'Opening trip editor', { tripId: trip.id });
    setEditingTrip(trip);
    setIsTripEditorOpen(true);
  };

  const handleSaveTrip = async (updates: Partial<Trip>) => {
    try {
      if (editingTrip) {
        // Edit mode
        const updated = await updateTrip(editingTrip.id, updates as TripInput);
        const categorized: CategorizedTrip = {
          ...updated,
          tripCategory: categorizeTrip(updated, currentUserId!, partnerId),
        };
        setTrips(prev => prev.map(t => t.id === updated.id ? categorized : t));
        logger.info('Travel', 'Trip updated', { tripId: updated.id });
        showToast('Trip updated successfully', 'success');
      } else {
        // Create mode
        const newTrip = await createTrip(
          updates as TripInput,
          partnerId && currentUserId ? [currentUserId, partnerId] : undefined
        );
        const categorized: CategorizedTrip = {
          ...newTrip,
          tripCategory: categorizeTrip(newTrip, currentUserId!, partnerId),
        };
        setTrips(prev => [categorized, ...prev]);
        logger.info('Travel', 'Trip created', { tripId: newTrip.id });
        showToast('Trip created successfully', 'success');
      }
      setIsTripEditorOpen(false);
      setEditingTrip(undefined);
    } catch (error) {
      logger.error('Travel', error instanceof Error ? error : new Error(String(error)), {
        context: 'saveTrip',
      });
      showToast('Failed to save trip. Please try again.', 'error');
    }
  };

  const handleDeleteTrip = async (tripId: string) => {
    try {
      await deleteTrip(tripId);
      setTrips(prev => prev.filter(t => t.id !== tripId));
      setTripToDelete(null);
      logger.info('Travel', 'Trip deleted', { tripId });
      showToast('Trip deleted successfully', 'success');
    } catch (error) {
      logger.error('Travel', error instanceof Error ? error : new Error(String(error)), {
        context: 'deleteTrip',
      });
      showToast('Failed to delete trip. Please try again.', 'error');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#CD9D6F] border-t-transparent mx-auto mb-4" />
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
                  ? 'bg-[#F5EBE0] text-[#8B6F47]'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              All Travels ({categoryCounts.all})
            </button>
            <button
              onClick={() => setCategoryFilter('mine')}
              className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-colors ${
                categoryFilter === 'mine'
                  ? 'bg-[#F5EBE0] text-[#8B6F47]'
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
              {partnerName ? `${partnerName}'s Travels` : "Partner's Travels"} ({categoryCounts.partner})
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

      {/* Location Type Filters and Settings */}
      <div className="bg-gray-50 border-b border-gray-200 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* Location Type Filter Buttons */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setLocationTypeFilter('all')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  locationTypeFilter === 'all'
                    ? 'bg-[#C18B5E] text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                All Locations
              </button>
              <button
                onClick={() => setLocationTypeFilter('countries')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  locationTypeFilter === 'countries'
                    ? 'bg-[#C18B5E] text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                Countries Only
              </button>
              <button
                onClick={() => setLocationTypeFilter('states')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  locationTypeFilter === 'states'
                    ? 'bg-[#C18B5E] text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                States Only
              </button>
              <button
                onClick={() => setLocationTypeFilter('parks')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  locationTypeFilter === 'parks'
                    ? 'bg-[#C18B5E] text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                Parks Only
              </button>
              <button
                onClick={() => setLocationTypeFilter('islands')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  locationTypeFilter === 'islands'
                    ? 'bg-[#C18B5E] text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                Islands Only
              </button>
            </div>

            {/* States Count as Countries Toggle */}
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-2 cursor-pointer bg-white px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors">
                <input
                  type="checkbox"
                  checked={statesCountAsCountries}
                  onChange={(e) => setStatesCountAsCountries(e.target.checked)}
                  className="h-4 w-4 text-[#C18B5E] rounded focus:ring-[#CD9D6F]"
                />
                <span className="text-sm font-medium text-gray-700">
                  States count as country visits
                </span>
              </label>
            </div>
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

      {/* Trips Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Your Trips</h2>
          <button
            onClick={handleCreateTrip}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#C18B5E] hover:bg-[#B5795A] text-white rounded-lg font-medium transition-colors"
          >
            <Plus className="h-5 w-5" />
            Add Trip
          </button>
        </div>

        {trips.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No trips yet</h3>
            <p className="text-gray-600 mb-4">Start planning your next adventure!</p>
            <button
              onClick={handleCreateTrip}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#C18B5E] hover:bg-[#B5795A] text-white rounded-lg font-medium transition-colors"
            >
              <Plus className="h-5 w-5" />
              Plan Your First Trip
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {trips.map((trip) => {
              const isOwnTrip = trip.userId === currentUserId;
              const startDate = new Date(trip.startDate);
              const endDate = new Date(trip.endDate);
              const duration = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

              // Determine status color
              const getStatusColor = (status: string) => {
                switch (status) {
                  case 'planning': return 'bg-gray-100 text-gray-800';
                  case 'upcoming': return 'bg-[#F5EBE0] text-[#8B6F47]';
                  case 'in_progress': return 'bg-green-100 text-green-800';
                  case 'completed': return 'bg-purple-100 text-purple-800';
                  case 'cancelled': return 'bg-red-100 text-red-800';
                  default: return 'bg-gray-100 text-gray-800';
                }
              };

              const getCategoryColor = (category: string) => {
                switch (category) {
                  case 'mine': return 'border-[#E8D9CE] bg-[#F9F3ED]';
                  case 'partner': return 'border-purple-300 bg-purple-50';
                  case 'both': return 'border-pink-300 bg-pink-50';
                  default: return 'border-gray-200 bg-white';
                }
              };

              return (
                <div
                  key={trip.id}
                  className={`bg-white rounded-lg border-2 ${getCategoryColor(trip.tripCategory)} shadow-sm hover:shadow-md transition-shadow overflow-hidden`}
                >
                  <div className="p-6">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-lg font-semibold text-gray-900 flex-1">{trip.name}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(trip.status)}`}>
                        {trip.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>

                    {/* Description */}
                    {trip.description && (
                      <p className="text-sm text-gray-600 mb-4 line-clamp-2">{trip.description}</p>
                    )}

                    {/* Dates */}
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {startDate.toLocaleDateString()} - {endDate.toLocaleDateString()}
                      </span>
                    </div>

                    {/* Duration */}
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                      <Clock className="h-4 w-4" />
                      <span>{duration} {duration === 1 ? 'day' : 'days'}</span>
                    </div>

                    {/* Budget */}
                    {trip.budget && (
                      <div className="text-sm text-gray-600 mb-3">
                        Budget: {trip.currency} {trip.budget.toLocaleString()}
                      </div>
                    )}

                    {/* Tags */}
                    {trip.tags && trip.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-4">
                        {trip.tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs"
                          >
                            {tag}
                          </span>
                        ))}
                        {trip.tags.length > 3 && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                            +{trip.tags.length - 3}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 pt-3 border-t border-gray-200">
                      <button
                        onClick={() => handleEditTrip(trip)}
                        className="flex-1 px-3 py-2 text-sm font-medium text-[#C18B5E] hover:bg-[#F9F3ED] rounded-lg transition-colors"
                      >
                        Edit
                      </button>
                      {isOwnTrip && (
                        <button
                          onClick={() => setTripToDelete(trip.id)}
                          className="flex-1 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Location Lists */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Track Your Locations</h2>

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

      {/* Trip Editor Modal */}
      <TripEditor
        isOpen={isTripEditorOpen}
        onClose={() => {
          setIsTripEditorOpen(false);
          setEditingTrip(undefined);
        }}
        onSave={handleSaveTrip}
        onDelete={handleDeleteTrip}
        trip={editingTrip}
      />

      {/* Trip Deletion Confirmation */}
      {tripToDelete && (
        <ConfirmDialog
          title="Delete Trip"
          message="Are you sure you want to delete this trip? This action cannot be undone."
          onConfirm={() => {
            handleDeleteTrip(tripToDelete);
          }}
          onCancel={() => setTripToDelete(null)}
        />
      )}
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
        return 'bg-[#F5EBE0] border-[#E8D9CE] text-[#8B6F47]';
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
        return <span className="text-xs text-[#C18B5E] font-medium">Me</span>;
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
        className="w-full px-3 py-2 mb-3 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#CD9D6F]"
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
                  className="h-4 w-4 text-[#C18B5E] rounded focus:ring-[#CD9D6F] cursor-pointer"
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
              className="w-full px-4 py-2 text-left text-sm hover:bg-[#F9F3ED] text-[#8B6F47] font-medium flex items-center gap-2"
            >
              <span className="w-3 h-3 rounded-full bg-[#CD9D6F]"></span>
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
