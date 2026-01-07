import React from 'react';
import { Plus, Map, Calendar } from 'lucide-react';
import {
  getUserTrips,
  getTripById,
  createTrip,
  deleteTrip,
  addDestination,
  removeDestination,
  saveVisaRequirement,
} from '../api/tripAPI';
import { getPrimaryPassport, getUserVisas } from '../api/passportAPI';
import { getVisaRequirement } from '../data/visaRequirements';
import { getAdditionalAccessFromVisas } from '../data/visaBasedAccess';
import { getAvailablePassportCountries } from '../data/visaRequirements';
import {
  calculateTripSummary,
  estimateVisaCost,
  estimateProcessingTime,
  calculateTripDuration,
  getTripStatus,
} from '../utils/tripPlannerUtils';
import type { Trip, TripWithDestinations } from '../types/trip';
import type { UserPassport, UserVisa } from '../types/visa';
import { logger } from '../../services/logger';
import { useToast } from '../../hooks/useToast';
import Toast from '../../components/Toast';
import ConfirmDialog from './ConfirmDialog';
import TripListItem from './TripListItem';
import DestinationItem from './DestinationItem';
import TripSummaryStats from './TripSummaryStats';
import NewTripForm from './NewTripForm';
import AddDestinationForm from './AddDestinationForm';

const TripPlanner: React.FC = () => {
  const [trips, setTrips] = React.useState<Trip[]>([]);
  const [selectedTrip, setSelectedTrip] = React.useState<TripWithDestinations | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [passport, setPassport] = React.useState<UserPassport | null>(null);
  const [userVisas, setUserVisas] = React.useState<UserVisa[]>([]);

  // New trip form state
  const [showNewTripForm, setShowNewTripForm] = React.useState(false);
  const [newTripName, setNewTripName] = React.useState('');
  const [newTripDescription, setNewTripDescription] = React.useState('');
  const [newTripStartDate, setNewTripStartDate] = React.useState('');
  const [newTripEndDate, setNewTripEndDate] = React.useState('');

  // Add destination form state
  const [showAddDestination, setShowAddDestination] = React.useState(false);
  const [newDestCountry, setNewDestCountry] = React.useState('');

  // Confirmation dialog state
  const [confirmDialog, setConfirmDialog] = React.useState<{
    show: boolean;
    message: string;
    onConfirm: () => void;
  }>({ show: false, message: '', onConfirm: () => void 0 });

  // Toast notifications
  const { toast, showToast, dismissToast } = useToast();

  const availableCountries = React.useMemo(() => getAvailablePassportCountries(), []);

  // Load data on mount
  React.useEffect(() => {
    const loadData = async (): Promise<void> => {
      try {
        setLoading(true);
        const [tripsData, passportData, visasData] = await Promise.all([
          getUserTrips(),
          getPrimaryPassport(),
          getUserVisas(),
        ]);
        setTrips(tripsData);
        setPassport(passportData);
        setUserVisas(visasData);
      } catch (error) {
        void logger.error('TripPlanner', error as Error, { context: 'loadData' });
      } finally {
        setLoading(false);
      }
    };
    void loadData();
  }, []);

  // Load selected trip details
  const loadTripDetails = async (tripId: string): Promise<void> => {
    try {
      const trip = await getTripById(tripId);
      setSelectedTrip(trip);
    } catch (error) {
      void logger.error('TripPlanner', error as Error, { context: 'loadTripDetails', tripId });
    }
  };

  // Create new trip
  const handleCreateTrip = async (): Promise<Trip | undefined> => {
    if (!newTripName.trim()) return undefined;

    try {
      const trip = await createTrip({
        name: newTripName,
        description: newTripDescription,
        startDate: newTripStartDate || undefined,
        endDate: newTripEndDate || undefined,
      });

      setTrips(prev => [trip, ...prev]);
      setNewTripName('');
      setNewTripDescription('');
      setNewTripStartDate('');
      setNewTripEndDate('');
      setShowNewTripForm(false);

      // Load the new trip
      await loadTripDetails(trip.id);

      return trip;
    } catch (error) {
      void logger.error('TripPlanner', error as Error, { context: 'handleCreateTrip' });
      showToast('Failed to create trip. Please try again.', 'error');
      return undefined;
    }
  };

  // Delete trip
  const handleDeleteTrip = (tripId: string): void => {
    setConfirmDialog({
      show: true,
      message: 'Are you sure you want to delete this trip?',
      onConfirm: () => {
        void (async () => {
          try {
            await deleteTrip(tripId);
            setTrips(prev => prev.filter(t => t.id !== tripId));
            if (selectedTrip?.id === tripId) {
              setSelectedTrip(null);
            }
            setConfirmDialog({ show: false, message: '', onConfirm: () => void 0 });
          } catch (error) {
            void logger.error('TripPlanner', error as Error, { context: 'handleDeleteTrip', tripId });
            showToast('Failed to delete trip. Please try again.', 'error');
            setConfirmDialog({ show: false, message: '', onConfirm: () => void 0 });
          }
        })();
      },
    });
  };

  // Add destination to trip
  const handleAddDestination = async (): Promise<void> => {
    if (!selectedTrip || !newDestCountry) return;
    if (!passport) {
      showToast('Please add your passport first in the Visa Calculator page.', 'error');
      return;
    }

    try {
      const orderIndex = selectedTrip.destinations.length;

      // Add destination
      const destination = await addDestination({
        tripId: selectedTrip.id,
        countryCode: newDestCountry.substring(0, 2).toUpperCase(),
        countryName: newDestCountry,
        orderIndex,
      });

      // Calculate visa requirement
      const visaReq = getVisaRequirement(passport.countryName, newDestCountry);

      if (!visaReq) {
        showToast('No visa data available for this country.', 'error');
        return;
      }

      // Check if user has better access via existing visas
      const visaCountries = userVisas.map(v => v.countryName);
      const additionalAccess = getAdditionalAccessFromVisas(visaCountries);
      const visaAccess = additionalAccess.find(a => a.country === newDestCountry);

      let finalReq = visaReq.requirement;
      let accessVia = 'passport';

      // Use visa-based access if better
      if (visaAccess) {
        if (visaReq.requirement === 'visa-required' || visaReq.requirement === 'no-admission') {
          finalReq = visaAccess.accessType;
          accessVia = visaAccess.viaVisa;
        }
      }

      // Save visa requirement with estimated cost/time
      const estimatedCost = estimateVisaCost(finalReq, newDestCountry);
      const processingDays = estimateProcessingTime(finalReq, newDestCountry);

      await saveVisaRequirement(selectedTrip.id, destination.id, {
        visaType: finalReq,
        daysAllowed: visaReq.daysAllowed,
        estimatedCost,
        processingDays,
        accessVia,
      });

      // Reload trip
      await loadTripDetails(selectedTrip.id);
      setNewDestCountry('');
      setShowAddDestination(false);
    } catch (error) {
      void logger.error('TripPlanner', error as Error, { context: 'handleAddDestination' });
      showToast('Failed to add destination. Please try again.', 'error');
    }
  };

  // Remove destination
  const handleRemoveDestination = async (destId: string): Promise<void> => {
    if (!selectedTrip) return;

    try {
      await removeDestination(destId);
      await loadTripDetails(selectedTrip.id);
    } catch (error) {
      void logger.error('TripPlanner', error as Error, { context: 'handleRemoveDestination', destId });
      showToast('Failed to remove destination. Please try again.', 'error');
    }
  };

  // Calculate trip summary
  const tripSummary = React.useMemo(() => {
    if (!selectedTrip) return null;
    return calculateTripSummary(selectedTrip);
  }, [selectedTrip]);

  const tripDuration = React.useMemo(() => {
    if (!selectedTrip) return null;
    return calculateTripDuration(selectedTrip.startDate, selectedTrip.endDate);
  }, [selectedTrip]);

  const tripStatus = React.useMemo(() => {
    if (!selectedTrip) return null;
    return getTripStatus(selectedTrip);
  }, [selectedTrip]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent mx-auto mb-4" />
            <p className="text-gray-600">Loading trip planner...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Trip Planner</h1>
        <p className="text-gray-600">
          Plan multi-country trips and calculate visa requirements and costs
        </p>
      </div>

      {!passport && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-yellow-800">
            Please add your passport in the Visa Calculator page to use the trip planner.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trips List - Left Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Your Trips</h2>
              <button
                onClick={() => setShowNewTripForm(!showNewTripForm)}
                className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center gap-1"
              >
                <Plus className="w-4 h-4" />
                New Trip
              </button>
            </div>

            {/* New trip form */}
            {showNewTripForm && (
              <NewTripForm
                tripName={newTripName}
                description={newTripDescription}
                startDate={newTripStartDate}
                endDate={newTripEndDate}
                onTripNameChange={setNewTripName}
                onDescriptionChange={setNewTripDescription}
                onStartDateChange={setNewTripStartDate}
                onEndDateChange={setNewTripEndDate}
                onCreate={() => void handleCreateTrip()}
                onCancel={() => setShowNewTripForm(false)}
              />
            )}

            {/* Trips list */}
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {trips.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-8">
                  No trips yet. Create your first trip!
                </p>
              ) : (
                trips.map(trip => (
                  <TripListItem
                    key={trip.id}
                    trip={trip}
                    isSelected={selectedTrip?.id === trip.id}
                    onSelect={() => void loadTripDetails(trip.id)}
                    onDelete={(e) => {
                      e.stopPropagation();
                      handleDeleteTrip(trip.id);
                    }}
                  />
                ))
              )}
            </div>
          </div>
        </div>

        {/* Trip Details - Main Area */}
        <div className="lg:col-span-2">
          {!selectedTrip ? (
            <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
              <Map className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Trip Selected</h3>
              <p className="text-gray-600">
                Select a trip from the list or create a new one to get started
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Trip Header */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{selectedTrip.name}</h2>
                    {selectedTrip.description && (
                      <p className="text-gray-600 mt-1">{selectedTrip.description}</p>
                    )}
                  </div>
                  {tripStatus && (
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      tripStatus === 'upcoming' ? 'bg-blue-100 text-blue-800' :
                      tripStatus === 'ongoing' ? 'bg-green-100 text-green-800' :
                      tripStatus === 'past' ? 'bg-gray-100 text-gray-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {tripStatus.charAt(0).toUpperCase() + tripStatus.slice(1)}
                    </span>
                  )}
                </div>

                {/* Trip Dates */}
                {selectedTrip.startDate && selectedTrip.endDate && (
                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>
                        {new Date(selectedTrip.startDate).toLocaleDateString()} - {new Date(selectedTrip.endDate).toLocaleDateString()}
                      </span>
                    </div>
                    {tripDuration && (
                      <span className="text-gray-500">({tripDuration} days)</span>
                    )}
                  </div>
                )}

                {/* Trip Summary Stats */}
                {tripSummary && selectedTrip.destinations.length > 0 && (
                  <TripSummaryStats summary={tripSummary} />
                )}
              </div>

              {/* Destinations List */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Destinations</h3>
                  <button
                    onClick={() => setShowAddDestination(!showAddDestination)}
                    disabled={!passport}
                    className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center gap-1 disabled:bg-gray-300"
                  >
                    <Plus className="w-4 h-4" />
                    Add Country
                  </button>
                </div>

                {/* Add destination form */}
                {showAddDestination && (
                  <AddDestinationForm
                    selectedCountry={newDestCountry}
                    availableCountries={availableCountries}
                    onCountryChange={setNewDestCountry}
                    onAdd={() => void handleAddDestination()}
                    onCancel={() => {
                      setShowAddDestination(false);
                      setNewDestCountry('');
                    }}
                  />
                )}

                {/* Destinations */}
                {selectedTrip.destinations.length === 0 ? (
                  <p className="text-gray-500 text-sm text-center py-8">
                    No destinations yet. Add countries to start planning!
                  </p>
                ) : (
                  <div className="space-y-3">
                    {selectedTrip.destinations.map((dest, index) => (
                      <DestinationItem
                        key={dest.id}
                        destination={dest}
                        index={index}
                        onRemove={() => void handleRemoveDestination(dest.id)}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Toast Notifications */}
      <Toast toast={toast} onDismiss={dismissToast} />

      {/* Confirmation Dialog */}
      <ConfirmDialog
        show={confirmDialog.show}
        message={confirmDialog.message}
        onConfirm={() => void confirmDialog.onConfirm()}
        onCancel={() => setConfirmDialog({ show: false, message: '', onConfirm: () => void 0 })}
      />
    </div>
  );
};

export default TripPlanner;