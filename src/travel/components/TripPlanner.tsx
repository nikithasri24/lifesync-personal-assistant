/**
 * Trip Planner Component
 * Plan multi-country trips and calculate visa requirements
 */

import React from 'react';
import { Plus, Trash2, Save, Map, Calendar, DollarSign, Clock, Globe } from 'lucide-react';
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
  getVisaRequirementColor,
  getVisaRequirementLabel,
  estimateVisaCost,
  estimateProcessingTime,
  calculateTripDuration,
  getTripStatus,
} from '../utils/tripPlannerUtils';
import type { Trip, TripWithDestinations } from '../types/trip';
import type { UserPassport, UserVisa } from '../types/visa';

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

  const availableCountries = React.useMemo(() => getAvailablePassportCountries(), []);

  // Load data on mount
  React.useEffect(() => {
    const loadData = async () => {
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
        console.error('Error loading trip planner data:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Load selected trip details
  const loadTripDetails = async (tripId: string) => {
    try {
      const trip = await getTripById(tripId);
      setSelectedTrip(trip);
    } catch (error) {
      console.error('Error loading trip details:', error);
    }
  };

  // Create new trip
  const handleCreateTrip = async () => {
    if (!newTripName.trim()) return;

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
    } catch (error) {
      console.error('Error creating trip:', error);
      alert('Failed to create trip. Please try again.');
    }
  };

  // Delete trip
  const handleDeleteTrip = async (tripId: string) => {
    if (!confirm('Are you sure you want to delete this trip?')) return;

    try {
      await deleteTrip(tripId);
      setTrips(prev => prev.filter(t => t.id !== tripId));
      if (selectedTrip?.id === tripId) {
        setSelectedTrip(null);
      }
    } catch (error) {
      console.error('Error deleting trip:', error);
      alert('Failed to delete trip. Please try again.');
    }
  };

  // Add destination to trip
  const handleAddDestination = async () => {
    if (!selectedTrip || !newDestCountry) return;
    if (!passport) {
      alert('Please add your passport first in the Visa Calculator page.');
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
        alert('No visa data available for this country.');
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
      console.error('Error adding destination:', error);
      alert('Failed to add destination. Please try again.');
    }
  };

  // Remove destination
  const handleRemoveDestination = async (destId: string) => {
    if (!selectedTrip) return;

    try {
      await removeDestination(destId);
      await loadTripDetails(selectedTrip.id);
    } catch (error) {
      console.error('Error removing destination:', error);
      alert('Failed to remove destination. Please try again.');
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
              <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <input
                  type="text"
                  placeholder="Trip name"
                  value={newTripName}
                  onChange={(e) => setNewTripName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm mb-2"
                />
                <textarea
                  placeholder="Description (optional)"
                  value={newTripDescription}
                  onChange={(e) => setNewTripDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm mb-2"
                  rows={2}
                />
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <input
                    type="date"
                    placeholder="Start date"
                    value={newTripStartDate}
                    onChange={(e) => setNewTripStartDate(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                  <input
                    type="date"
                    placeholder="End date"
                    value={newTripEndDate}
                    onChange={(e) => setNewTripEndDate(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleCreateTrip}
                    disabled={!newTripName.trim()}
                    className="flex-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium disabled:bg-gray-300"
                  >
                    Create
                  </button>
                  <button
                    onClick={() => setShowNewTripForm(false)}
                    className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Trips list */}
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {trips.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-8">
                  No trips yet. Create your first trip!
                </p>
              ) : (
                trips.map(trip => (
                  <div
                    key={trip.id}
                    onClick={() => loadTripDetails(trip.id)}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedTrip?.id === trip.id
                        ? 'bg-blue-50 border-blue-300'
                        : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 text-sm">{trip.name}</div>
                        {trip.description && (
                          <div className="text-xs text-gray-600 mt-1 line-clamp-2">
                            {trip.description}
                          </div>
                        )}
                        {trip.startDate && (
                          <div className="text-xs text-gray-500 mt-1">
                            {new Date(trip.startDate).toLocaleDateString()}
                            {trip.endDate && ` - ${new Date(trip.endDate).toLocaleDateString()}`}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteTrip(trip.id);
                        }}
                        className="text-red-600 hover:text-red-800 ml-2"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
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
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-blue-50 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Globe className="w-4 h-4 text-blue-600" />
                        <span className="text-xs text-blue-600 font-medium">Countries</span>
                      </div>
                      <div className="text-2xl font-bold text-blue-700">{tripSummary.totalCountries}</div>
                    </div>
                    <div className="bg-green-50 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Globe className="w-4 h-4 text-green-600" />
                        <span className="text-xs text-green-600 font-medium">Visa Free</span>
                      </div>
                      <div className="text-2xl font-bold text-green-700">{tripSummary.visaFreeCount}</div>
                    </div>
                    <div className="bg-orange-50 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <DollarSign className="w-4 h-4 text-orange-600" />
                        <span className="text-xs text-orange-600 font-medium">Est. Cost</span>
                      </div>
                      <div className="text-2xl font-bold text-orange-700">
                        ${tripSummary.totalEstimatedCost}
                      </div>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Clock className="w-4 h-4 text-purple-600" />
                        <span className="text-xs text-purple-600 font-medium">Processing</span>
                      </div>
                      <div className="text-2xl font-bold text-purple-700">
                        {tripSummary.totalProcessingDays}d
                      </div>
                    </div>
                  </div>
                )}

                {/* Schengen Optimization Notice */}
                {tripSummary && tripSummary.canUseSchengenVisa && (
                  <div className="mt-4 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                    <div className="flex items-start gap-2">
                      <span className="text-lg">💡</span>
                      <div>
                        <h4 className="font-semibold text-purple-900 text-sm">Schengen Visa Optimization</h4>
                        <p className="text-sm text-purple-700 mt-1">
                          You're visiting {tripSummary.schengenCountries.length} Schengen countries.
                          You only need ONE Schengen visa for: {tripSummary.schengenCountries.join(', ')}
                        </p>
                      </div>
                    </div>
                  </div>
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
                  <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <select
                      value={newDestCountry}
                      onChange={(e) => setNewDestCountry(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm mb-2"
                    >
                      <option value="">-- Select country --</option>
                      {availableCountries.map(country => (
                        <option key={country} value={country}>{country}</option>
                      ))}
                    </select>
                    <div className="flex gap-2">
                      <button
                        onClick={handleAddDestination}
                        disabled={!newDestCountry}
                        className="flex-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium disabled:bg-gray-300"
                      >
                        Add Destination
                      </button>
                      <button
                        onClick={() => {
                          setShowAddDestination(false);
                          setNewDestCountry('');
                        }}
                        className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* Destinations */}
                {selectedTrip.destinations.length === 0 ? (
                  <p className="text-gray-500 text-sm text-center py-8">
                    No destinations yet. Add countries to start planning!
                  </p>
                ) : (
                  <div className="space-y-3">
                    {selectedTrip.destinations.map((dest, index) => (
                      <div key={dest.id} className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="font-semibold text-gray-900">{dest.countryName}</div>
                              {dest.visaRequirement && (
                                <div className="mt-2 space-y-1">
                                  <span className={`inline-block px-2 py-1 rounded text-xs font-medium border ${
                                    getVisaRequirementColor(dest.visaRequirement.visaType)
                                  }`}>
                                    {getVisaRequirementLabel(dest.visaRequirement.visaType)}
                                  </span>
                                  {dest.visaRequirement.accessVia !== 'passport' && (
                                    <div className="text-xs text-purple-700 font-medium">
                                      ✨ Via {dest.visaRequirement.accessVia}
                                    </div>
                                  )}
                                  <div className="flex items-center gap-4 text-xs text-gray-600 mt-1">
                                    {dest.visaRequirement.daysAllowed && (
                                      <span>📅 {dest.visaRequirement.daysAllowed} days</span>
                                    )}
                                    {dest.visaRequirement.estimatedCost ? (
                                      <span>💰 ${dest.visaRequirement.estimatedCost}</span>
                                    ) : null}
                                    {dest.visaRequirement.processingDays ? (
                                      <span>⏱️ {dest.visaRequirement.processingDays} days</span>
                                    ) : null}
                                  </div>
                                </div>
                              )}
                            </div>
                            <button
                              onClick={() => handleRemoveDestination(dest.id)}
                              className="text-red-600 hover:text-red-800"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TripPlanner;
