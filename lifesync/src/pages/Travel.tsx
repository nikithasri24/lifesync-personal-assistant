import React, { useState } from 'react';
import { useAppStore } from '../stores/useAppStore';
import type { TravelTrip, TravelItineraryItem, NationalPark, CreditCardTrip, PTOEntry, WorldProgress, MoonPhase, CalendarEvent, TravelStats, Country, USState, IndiaState } from '../types';
import {
  MapPin,
  Calendar,
  Plane,
  Car,
  Train,
  Hotel,
  Camera,
  Star,
  Clock,
  DollarSign,
  Plus,
  Edit,
  Trash2,
  Map,
  Navigation,
  Compass,
  Luggage,
  Ticket,
  Globe,
  CreditCard,
  Trophy,
  Target,
  BarChart3,
  Mountain,
  Trees,
  Award,
  Bookmark,
  TrendingUp,
  Calendar as CalendarIcon,
  CheckCircle,
  Flag,
  Route,
  Moon,
  Sun,
  CalendarDays,
  Sunset,
  Sunrise
} from 'lucide-react';
import NationalParksMap from '../components/NationalParksMap';
import '../styles/leaflet-custom.css';


const TRIP_TYPES = [
  { value: 'vacation', label: 'Vacation', color: '#10B981', icon: '🏖️' },
  { value: 'business', label: 'Business', color: '#3B82F6', icon: '💼' },
  { value: 'weekend', label: 'Weekend', color: '#F59E0B', icon: '🎉' },
  { value: 'adventure', label: 'Adventure', color: '#EF4444', icon: '🏔️' }
];


export default function Travel() {
  // Get data from store
  const { 
    travelTrips: trips, 
    nationalParks, 
    creditCardTrips, 
    ptoEntries,
    countries,
    usStates,
    indiaStates,
    addTravelTrip,
    updateTravelTrip,
    deleteTravelTrip,
    updateNationalPark,
    markParkAsVisited,
    markParkAsUnvisited,
    addCreditCardTrip,
    updateCreditCardTrip,
    deleteCreditCardTrip,
    addPTOEntry,
    updatePTOEntry,
    deletePTOEntry,
    markCountryAsVisited,
    markCountryAsUnvisited,
    updateCountry,
    markUSStateAsVisited,
    markUSStateAsUnvisited,
    updateUSState,
    markIndiaStateAsVisited,
    markIndiaStateAsUnvisited,
    updateIndiaState
  } = useAppStore();
  
  // Local UI state
  const [showTripModal, setShowTripModal] = useState(false);
  const [editingTrip, setEditingTrip] = useState<TravelTrip | null>(null);
  const [view, setView] = useState<'trips' | 'history' | 'cards' | 'parks' | 'parksMap' | 'world' | 'analytics' | 'calendar'>('trips');
  const [worldProgress, setWorldProgress] = useState<WorldProgress>({
    countries: { total: 195, visited: 0, list: [] },
    states: { total: 50, visited: 0, list: [] },
    continents: { northAmerica: 0, southAmerica: 0, europe: 0, asia: 0, africa: 0, oceania: 0, antarctica: 0 }
  });
  const [moonCalendar, setMoonCalendar] = useState<MoonPhase[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [showPTOModal, setShowPTOModal] = useState(false);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [showParkModal, setShowParkModal] = useState(false);
  const [editingPark, setEditingPark] = useState<NationalPark | null>(null);
  const [parkForm, setParkForm] = useState({
    rating: '',
    visitDate: '',
    notes: '',
    photos: [] as string[]
  });
  const [parkFilter, setParkFilter] = useState<'all' | 'visited' | 'unvisited' | 'wishlist'>('all');
  const [parkSort, setParkSort] = useState<'name' | 'state' | 'visitDate' | 'rating'>('name');
  const [searchPark, setSearchPark] = useState('');
  
  // Map-related state
  const [selectedMapType, setSelectedMapType] = useState<'world' | 'us' | 'india'>('world');
  const [mapViewType, setMapViewType] = useState<'list' | 'map'>('list');
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Country | USState | IndiaState | null>(null);
  const [locationForm, setLocationForm] = useState({
    rating: '',
    visitDate: '',
    notes: '',
    photos: [] as string[]
  });
  
  // Form state
  const [tripForm, setTripForm] = useState({
    title: '',
    destination: '',
    startDate: '',
    endDate: '',
    type: 'vacation' as const,
    budget: '',
    notes: ''
  });

  const handleCreateTrip = () => {
    setEditingTrip(null);
    setTripForm({
      title: '',
      destination: '',
      startDate: '',
      endDate: '',
      type: 'vacation',
      budget: '',
      notes: ''
    });
    setShowTripModal(true);
  };

  const handleEditTrip = (trip: TravelTrip) => {
    setEditingTrip(trip);
    setTripForm({
      title: trip.title,
      destination: trip.destination,
      startDate: trip.startDate.toISOString().split('T')[0],
      endDate: trip.endDate.toISOString().split('T')[0],
      type: trip.type,
      budget: trip.budget?.toString() || '',
      notes: trip.notes || ''
    });
    setShowTripModal(true);
  };

  const handleSaveTrip = () => {
    if (!tripForm.title || !tripForm.destination) return;

    const tripData = {
      title: tripForm.title,
      destination: tripForm.destination,
      startDate: new Date(tripForm.startDate),
      endDate: new Date(tripForm.endDate),
      type: tripForm.type,
      status: 'planning' as const,
      budget: tripForm.budget ? parseFloat(tripForm.budget) : undefined,
      notes: tripForm.notes,
      itinerary: editingTrip?.itinerary || []
    };

    if (editingTrip) {
      updateTravelTrip(editingTrip.id, tripData);
    } else {
      addTravelTrip(tripData);
    }

    setShowTripModal(false);
    setEditingTrip(null);
  };

  const handleDeleteTrip = (tripId: string) => {
    if (confirm('Are you sure you want to delete this trip?')) {
      deleteTravelTrip(tripId);
    }
  };

  const getTripTypeInfo = (type: string) => {
    return TRIP_TYPES.find(t => t.value === type) || TRIP_TYPES[0];
  };

  const getDaysUntilTrip = (startDate: Date) => {
    const today = new Date();
    const diffTime = startDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const formatDateRange = (startDate: Date, endDate: Date) => {
    const start = startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const end = endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    return `${start} - ${end}`;
  };

  const renderViewContent = () => {
    switch (view) {
      case 'trips':
        return renderTripsView();
      case 'history':
        return renderHistoryView();
      case 'cards':
        return renderCreditCardsView();
      case 'parks':
        return renderNationalParksView();
      case 'parksMap':
        return renderInteractiveParksMap();
      case 'world':
        return renderWorldProgressView();
      case 'analytics':
        return renderAnalyticsView();
      case 'calendar':
        return renderCalendarView();
      default:
        return renderTripsView();
    }
  };

  // Moon phase calculation (simplified)
  const getMoonPhase = (date: Date): MoonPhase => {
    const lunarCycle = 29.53058867; // days
    const knownNewMoon = new Date('2024-01-11'); // Known new moon date
    const daysSinceKnownNewMoon = (date.getTime() - knownNewMoon.getTime()) / (1000 * 60 * 60 * 24);
    const cyclePosition = ((daysSinceKnownNewMoon % lunarCycle) + lunarCycle) % lunarCycle;
    const illumination = Math.abs(Math.cos((cyclePosition / lunarCycle) * 2 * Math.PI)) * 100;
    
    let phase: MoonPhase['phase'];
    let quality: MoonPhase['quality'];
    
    if (cyclePosition < 1 || cyclePosition > 28.5) {
      phase = 'new';
      quality = 'excellent';
    } else if (cyclePosition < 7.4) {
      phase = 'waxing-crescent';
      quality = 'good';
    } else if (cyclePosition < 8.4) {
      phase = 'first-quarter';
      quality = 'fair';
    } else if (cyclePosition < 14.8) {
      phase = 'waxing-gibbous';
      quality = 'poor';
    } else if (cyclePosition < 15.8) {
      phase = 'full';
      quality = 'poor';
    } else if (cyclePosition < 22.1) {
      phase = 'waning-gibbous';
      quality = 'poor';
    } else if (cyclePosition < 23.1) {
      phase = 'last-quarter';
      quality = 'fair';
    } else {
      phase = 'waning-crescent';
      quality = 'good';
    }
    
    return {
      date,
      phase,
      illumination,
      isNewMoon: phase === 'new',
      quality
    };
  };

  // Generate moon calendar for the year
  const generateMoonCalendar = (year: number): MoonPhase[] => {
    const calendar: MoonPhase[] = [];
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31);
    
    for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
      const moonPhase = getMoonPhase(new Date(date));
      calendar.push(moonPhase);
    }
    
    return calendar;
  };

  // Get optimal stargazing weekends (new moon weekends)
  const getStargazingWeekends = (year: number) => {
    const moonCalendar = generateMoonCalendar(year);
    const weekends: { start: Date; end: Date; quality: string }[] = [];
    
    // Find Fridays
    for (let date = new Date(year, 0, 1); date.getFullYear() === year; date.setDate(date.getDate() + 1)) {
      if (date.getDay() === 5) { // Friday
        const friday = new Date(date);
        const saturday = new Date(date.getTime() + 24 * 60 * 60 * 1000);
        const sunday = new Date(date.getTime() + 2 * 24 * 60 * 60 * 1000);
        
        const fridayMoon = moonCalendar.find(m => m.date.toDateString() === friday.toDateString());
        const saturdayMoon = moonCalendar.find(m => m.date.toDateString() === saturday.toDateString());
        const sundayMoon = moonCalendar.find(m => m.date.toDateString() === sunday.toDateString());
        
        const avgIllumination = ((fridayMoon?.illumination || 0) + (saturdayMoon?.illumination || 0) + (sundayMoon?.illumination || 0)) / 3;
        
        let quality: string;
        if (avgIllumination < 10) quality = 'excellent';
        else if (avgIllumination < 25) quality = 'good';
        else if (avgIllumination < 50) quality = 'fair';
        else quality = 'poor';
        
        weekends.push({
          start: friday,
          end: sunday,
          quality
        });
      }
    }
    
    return weekends.filter(w => w.quality === 'excellent' || w.quality === 'good');
  };

  const renderCalendarView = () => {
    const stargazingWeekends = getStargazingWeekends(currentYear);
    const upcomingPTO = ptoEntries.filter(pto => 
      pto.startDate.getFullYear() >= new Date().getFullYear() && 
      pto.startDate >= new Date()
    ).sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
    
    return (
      <div className="space-y-6">
        {/* Calendar Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Travel Planning Calendar</h3>
            <div className="flex items-center space-x-4">
              <select 
                value={currentYear} 
                onChange={(e) => setCurrentYear(parseInt(e.target.value))}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {[2024, 2025, 2026].map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
              <button
                onClick={() => setShowPTOModal(true)}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                <Plus size={16} className="mr-2" />
                Add PTO
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <CalendarDays className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-blue-600">
                {ptoEntries.reduce((sum, pto) => sum + pto.days, 0)}
              </div>
              <div className="text-sm text-gray-600">Total PTO Days</div>
            </div>
            
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <Moon className="w-8 h-8 text-purple-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-purple-600">{stargazingWeekends.length}</div>
              <div className="text-sm text-gray-600">Stargazing Weekends</div>
            </div>
            
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <Plane className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-green-600">
                {trips.filter(t => t.startDate.getFullYear() === currentYear).length}
              </div>
              <div className="text-sm text-gray-600">Planned Trips</div>
            </div>
          </div>
        </div>

        {/* PTO Overview */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h4 className="font-medium text-gray-900 mb-4">Upcoming PTO</h4>
          {upcomingPTO.length === 0 ? (
            <div className="text-center py-8">
              <CalendarDays className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-600">No PTO planned</p>
              <button
                onClick={() => setShowPTOModal(true)}
                className="mt-3 text-blue-600 hover:text-blue-700 font-medium"
              >
                Add your first PTO entry
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingPTO.slice(0, 5).map((pto) => (
                <div key={pto.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium text-gray-900">
                      {pto.reason || 'PTO'} ({pto.days} days)
                    </div>
                    <div className="text-sm text-gray-600">
                      {formatDateRange(pto.startDate, pto.endDate)}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      pto.type === 'approved' ? 'bg-green-100 text-green-800' :
                      pto.type === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      pto.type === 'planned' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {pto.type}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Stargazing Weekends */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h4 className="font-medium text-gray-900 mb-4">Optimal Stargazing Weekends ({currentYear})</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stargazingWeekends.slice(0, 9).map((weekend, index) => {
              const moonPhase = getMoonPhase(weekend.start);
              return (
                <div key={index} className={`p-4 rounded-lg border-2 ${
                  weekend.quality === 'excellent' ? 'border-purple-200 bg-purple-50' : 'border-blue-200 bg-blue-50'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <Moon className={`w-5 h-5 ${
                        weekend.quality === 'excellent' ? 'text-purple-600' : 'text-blue-600'
                      }`} />
                      <span className="font-medium text-gray-900">
                        {weekend.start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                      weekend.quality === 'excellent' 
                        ? 'bg-purple-100 text-purple-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {weekend.quality}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 mb-3">
                    {weekend.start.toLocaleDateString('en-US', { weekday: 'short' })} - 
                    {weekend.end.toLocaleDateString('en-US', { weekday: 'short' })}
                  </div>
                  <div className="text-xs text-gray-500">
                    Moon: {moonPhase.illumination.toFixed(0)}% illuminated
                  </div>
                  <button className="mt-3 w-full py-2 px-3 bg-gray-100 text-gray-700 rounded text-sm font-medium hover:bg-gray-200 transition-colors">
                    Plan Stargazing Trip
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Monthly Calendar View */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h4 className="font-medium text-gray-900 mb-4">Monthly Overview</h4>
          <div className="bg-gray-100 rounded-lg h-64 flex items-center justify-center">
            <div className="text-center">
              <CalendarDays className="w-16 h-16 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600">Interactive monthly calendar coming soon</p>
              <p className="text-sm text-gray-500">View PTO, trips, and moon phases in calendar format</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderTripsView = () => {
    if (trips.length === 0) {
      return (
        <div className="text-center py-12">
          <Globe className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No trips planned yet</h3>
          <p className="text-gray-600 mb-6">Start planning your next adventure!</p>
          <button
            onClick={handleCreateTrip}
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            <Plus size={20} className="mr-2" />
            Plan Your First Trip
          </button>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {trips.map((trip) => {
          const typeInfo = getTripTypeInfo(trip.type);
          const daysUntil = getDaysUntilTrip(trip.startDate);
          const isUpcoming = daysUntil > 0;
          const isOngoing = daysUntil <= 0 && getDaysUntilTrip(trip.endDate) >= 0;

          return (
            <div
              key={trip.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-lg">{typeInfo.icon}</span>
                      <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                        {typeInfo.label}
                      </span>
                      {trip.creditCardTrip && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          <CreditCard size={12} className="mr-1" />
                          Points
                        </span>
                      )}
                      {isOngoing && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Ongoing
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">{trip.title}</h3>
                    <div className="flex items-center text-gray-600 mb-2">
                      <MapPin size={14} className="mr-1" />
                      <span className="text-sm">{trip.destination}</span>
                    </div>
                    <div className="flex items-center text-gray-600 mb-3">
                      <Calendar size={14} className="mr-1" />
                      <span className="text-sm">{formatDateRange(trip.startDate, trip.endDate)}</span>
                    </div>
                    {isUpcoming && (
                      <div className="flex items-center text-blue-600 mb-3">
                        <Clock size={14} className="mr-1" />
                        <span className="text-sm font-medium">
                          {daysUntil === 1 ? 'Tomorrow!' : `${daysUntil} days away`}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex space-x-1">
                    <button
                      onClick={() => handleEditTrip(trip)}
                      className="p-2 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-gray-100"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteTrip(trip.id)}
                      className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-gray-100"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {trip.budget && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Budget:</span>
                    <span className="font-medium text-gray-900">${trip.budget.toLocaleString()}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderHistoryView = () => {
    const completedTrips = trips.filter(trip => trip.status === 'completed');
    
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Trip History</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{completedTrips.length}</div>
              <div className="text-sm text-gray-600">Completed Trips</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {completedTrips.reduce((sum, trip) => {
                  const days = Math.ceil((trip.endDate.getTime() - trip.startDate.getTime()) / (1000 * 60 * 60 * 24));
                  return sum + days;
                }, 0)}
              </div>
              <div className="text-sm text-gray-600">Total Days</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {new Set(completedTrips.map(t => t.country)).size}
              </div>
              <div className="text-sm text-gray-600">Countries</div>
            </div>
          </div>
        </div>

        {completedTrips.length === 0 ? (
          <div className="text-center py-12">
            <Camera className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No trip history yet</h3>
            <p className="text-gray-600">Complete some trips to see your travel history here</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {completedTrips
              .sort((a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime())
              .map((trip) => {
                const typeInfo = getTripTypeInfo(trip.type);
                return (
                  <div key={trip.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    <div className="p-6">
                      <div className="flex items-center space-x-2 mb-3">
                        <span className="text-lg">{typeInfo.icon}</span>
                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                          {typeInfo.label}
                        </span>
                        {trip.rating && (
                          <div className="flex items-center">
                            {[...Array(5)].map((_, i) => (
                              <Star 
                                key={i} 
                                size={12} 
                                className={i < trip.rating! ? 'text-yellow-400 fill-current' : 'text-gray-300'}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">{trip.title}</h3>
                      <div className="flex items-center text-gray-600 mb-2">
                        <MapPin size={14} className="mr-1" />
                        <span className="text-sm">{trip.destination}</span>
                      </div>
                      <div className="flex items-center text-gray-600 mb-3">
                        <Calendar size={14} className="mr-1" />
                        <span className="text-sm">{formatDateRange(trip.startDate, trip.endDate)}</span>
                      </div>
                      {trip.memories && trip.memories.length > 0 && (
                        <div className="text-sm text-gray-600 italic">
                          "{trip.memories[0]}"
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </div>
    );
  };

  const renderCreditCardsView = () => {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Credit Card Travel Rewards</h3>
            <button className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors">
              <Plus size={16} className="mr-2" />
              Add Card Trip
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {creditCardTrips.reduce((sum, card) => sum + card.pointsEarned, 0).toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">Total Points Earned</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {creditCardTrips.reduce((sum, card) => sum + card.pointsUsed, 0).toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">Points Redeemed</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {creditCardTrips.filter(card => card.redeemedDate).length}
              </div>
              <div className="text-sm text-gray-600">Trips Funded</div>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">
                {new Set(creditCardTrips.map(card => card.cardName)).size}
              </div>
              <div className="text-sm text-gray-600">Active Cards</div>
            </div>
          </div>
        </div>

        {creditCardTrips.length === 0 ? (
          <div className="text-center py-12">
            <CreditCard className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No credit card trips tracked</h3>
            <p className="text-gray-600">Start tracking your travel rewards and point redemptions</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="divide-y divide-gray-200">
              {creditCardTrips.map((cardTrip) => (
                <div key={cardTrip.id} className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{cardTrip.description}</h4>
                      <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600">
                        <span>{cardTrip.cardName}</span>
                        <span>•</span>
                        <span>{cardTrip.earnedDate.toLocaleDateString()}</span>
                        {cardTrip.bonusCategory && (
                          <>
                            <span>•</span>
                            <span className="text-purple-600">{cardTrip.bonusCategory}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-semibold text-purple-600">
                        +{cardTrip.pointsEarned.toLocaleString()} pts
                      </div>
                      {cardTrip.pointsUsed > 0 && (
                        <div className="text-sm text-blue-600">
                          -{cardTrip.pointsUsed.toLocaleString()} used
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const handleParkEdit = (park: NationalPark) => {
    setEditingPark(park);
    setParkForm({
      rating: park.rating?.toString() || '',
      visitDate: park.visitDate ? new Date(park.visitDate).toISOString().split('T')[0] : '',
      notes: park.notes || '',
      photos: park.photos || []
    });
    setShowParkModal(true);
  };

  const handleParkSave = () => {
    if (!editingPark || !parkForm.visitDate) return;

    const visitData = {
      visitDate: new Date(parkForm.visitDate),
      rating: parkForm.rating ? parseInt(parkForm.rating) : undefined,
      notes: parkForm.notes,
      photos: parkForm.photos
    };

    markParkAsVisited(editingPark.id, visitData);

    setShowParkModal(false);
    setEditingPark(null);
    setParkForm({ rating: '', visitDate: '', notes: '', photos: [] });
  };

  const handleParkUnvisit = (parkId: string) => {
    if (confirm('Mark this park as unvisited? This will remove all visit data.')) {
      markParkAsUnvisited(parkId);
    }
  };

  // Location editing handlers
  const handleLocationEdit = (location: Country | USState | IndiaState) => {
    setEditingLocation(location);
    setLocationForm({
      rating: location.rating?.toString() || '',
      visitDate: location.visitDate ? new Date(location.visitDate).toISOString().split('T')[0] : '',
      notes: location.notes || '',
      photos: location.photos || []
    });
    setShowLocationModal(true);
  };

  const handleLocationSave = () => {
    if (!editingLocation || !locationForm.visitDate) return;

    const visitData = {
      visitDate: new Date(locationForm.visitDate),
      rating: locationForm.rating ? parseInt(locationForm.rating) : undefined,
      notes: locationForm.notes,
      photos: locationForm.photos
    };

    // Determine which type of location we're editing
    if ('continent' in editingLocation) {
      // Country
      markCountryAsVisited(editingLocation.id, visitData);
    } else if ('nationalParks' in editingLocation) {
      // US State
      markUSStateAsVisited(editingLocation.id, visitData);
    } else {
      // India State
      markIndiaStateAsVisited(editingLocation.id, visitData);
    }

    setShowLocationModal(false);
    setEditingLocation(null);
    setLocationForm({ rating: '', visitDate: '', notes: '', photos: [] });
  };

  const handleLocationUnvisit = (location: Country | USState | IndiaState) => {
    if (confirm(`Mark ${location.name} as unvisited? This will remove all visit data.`)) {
      if ('continent' in location) {
        markCountryAsUnvisited(location.id);
      } else if ('nationalParks' in location) {
        markUSStateAsUnvisited(location.id);
      } else {
        markIndiaStateAsUnvisited(location.id);
      }
    }
  };

  const getFilteredAndSortedParks = () => {
    let filtered = nationalParks;
    
    // Apply search filter
    if (searchPark) {
      filtered = filtered.filter(park => 
        park.name.toLowerCase().includes(searchPark.toLowerCase()) ||
        park.state.toLowerCase().includes(searchPark.toLowerCase())
      );
    }
    
    // Apply status filter
    switch (parkFilter) {
      case 'visited':
        filtered = filtered.filter(park => park.visited);
        break;
      case 'unvisited':
        filtered = filtered.filter(park => !park.visited);
        break;
      case 'wishlist':
        // Could add a wishlist property later
        break;
    }
    
    // Apply sorting
    switch (parkSort) {
      case 'name':
        filtered = filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'state':
        filtered = filtered.sort((a, b) => a.state.localeCompare(b.state));
        break;
      case 'visitDate':
        filtered = filtered.sort((a, b) => {
          if (!a.visitDate && !b.visitDate) return 0;
          if (!a.visitDate) return 1;
          if (!b.visitDate) return -1;
          return new Date(b.visitDate).getTime() - new Date(a.visitDate).getTime();
        });
        break;
      case 'rating':
        filtered = filtered.sort((a, b) => {
          if (!a.rating && !b.rating) return 0;
          if (!a.rating) return 1;
          if (!b.rating) return -1;
          return b.rating - a.rating;
        });
        break;
    }
    
    return filtered;
  };

  const renderInteractiveParksMap = () => {
    return (
      <div className="h-[calc(100vh-200px)] rounded-lg overflow-hidden border border-gray-200">
        <NationalParksMap />
      </div>
    );
  };

  const renderNationalParksView = () => {
    const visitedParks = nationalParks.filter(park => park.visited);
    const progressPercentage = (visitedParks.length / nationalParks.length) * 100;
    const averageRating = visitedParks.length > 0 
      ? visitedParks.reduce((sum, park) => sum + (park.rating || 0), 0) / visitedParks.filter(p => p.rating).length
      : 0;
    const filteredParks = getFilteredAndSortedParks();
    const statesVisited = new Set(visitedParks.map(p => p.state)).size;
    const totalStates = new Set(nationalParks.map(p => p.state)).size;
    
    return (
      <div className="space-y-6">
        {/* Enhanced Progress Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">US National Parks Progress</h3>
              <p className="text-sm text-gray-600 mt-1">
                Track your journey through America's most treasured landscapes
              </p>
            </div>
            <button
              onClick={() => {
                setEditingPark(nationalParks.find(p => !p.visited) || nationalParks[0]);
                setParkForm({ rating: '', visitDate: new Date().toISOString().split('T')[0], notes: '', photos: [] });
                setShowParkModal(true);
              }}
              className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
            >
              <Plus size={16} className="mr-2" />
              Add Visit
            </button>
          </div>
          
          {/* Main Progress Bar */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-lg font-medium text-gray-900">Overall Progress</span>
              <span className="text-lg text-gray-600">
                {visitedParks.length} of {nationalParks.length} parks visited
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4 relative overflow-hidden">
              <div 
                className="bg-gradient-to-r from-green-500 to-green-600 h-4 rounded-full transition-all duration-500 ease-out" 
                style={{ width: `${progressPercentage}%` }}
              ></div>
              <div className="absolute inset-0 flex items-center justify-center text-sm font-medium text-white">
                {progressPercentage.toFixed(1)}%
              </div>
            </div>
          </div>

          {/* Detailed Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <Mountain className="w-6 h-6 text-green-600 mx-auto mb-2" />
              <div className="text-xl font-bold text-green-600">{visitedParks.length}</div>
              <div className="text-xs text-gray-600">Parks Visited</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <Flag className="w-6 h-6 text-blue-600 mx-auto mb-2" />
              <div className="text-xl font-bold text-blue-600">{statesVisited}/{totalStates}</div>
              <div className="text-xs text-gray-600">States/Territories</div>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <Star className="w-6 h-6 text-yellow-600 mx-auto mb-2" />
              <div className="text-xl font-bold text-yellow-600">
                {averageRating > 0 ? averageRating.toFixed(1) : '—'}
              </div>
              <div className="text-xs text-gray-600">Avg Rating</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <Trophy className="w-6 h-6 text-purple-600 mx-auto mb-2" />
              <div className="text-xl font-bold text-purple-600">
                {visitedParks.filter(p => p.rating && p.rating >= 4).length}
              </div>
              <div className="text-xs text-gray-600">Highly Rated</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <Camera className="w-6 h-6 text-orange-600 mx-auto mb-2" />
              <div className="text-xl font-bold text-orange-600">
                {visitedParks.reduce((sum, park) => sum + (park.photos?.length || 0), 0)}
              </div>
              <div className="text-xs text-gray-600">Photos</div>
            </div>
            <div className="text-center p-4 bg-indigo-50 rounded-lg">
              <Map className="w-6 h-6 text-indigo-600 mx-auto mb-2" />
              <div className="text-xl font-bold text-indigo-600">
                {visitedParks.length > 0 ? 
                  Math.round(visitedParks.reduce((sum, park) => {
                    if (!park.coordinates) return sum;
                    // Simple distance calculation for total "distance covered"
                    return sum + Math.abs(park.coordinates.lat) + Math.abs(park.coordinates.lng);
                  }, 0)) 
                  : 0
                }
              </div>
              <div className="text-xs text-gray-600">Exploration Score</div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search parks..."
                  value={searchPark}
                  onChange={(e) => setSearchPark(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
                  <Compass className="h-5 w-5 text-gray-400" />
                </div>
              </div>
              
              <select
                value={parkFilter}
                onChange={(e) => setParkFilter(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
              >
                <option value="all">All Parks</option>
                <option value="visited">Visited</option>
                <option value="unvisited">Not Visited</option>
              </select>
              
              <select
                value={parkSort}
                onChange={(e) => setParkSort(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
              >
                <option value="name">Sort by Name</option>
                <option value="state">Sort by State</option>
                <option value="visitDate">Sort by Visit Date</option>
                <option value="rating">Sort by Rating</option>
              </select>
            </div>
            
            <div className="text-sm text-gray-600">
              Showing {filteredParks.length} of {nationalParks.length} parks
            </div>
          </div>
        </div>

        {/* Parks Grid */}
        {filteredParks.length === 0 ? (
          <div className="text-center py-12">
            <Mountain className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No parks found</h3>
            <p className="text-gray-600">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredParks.map((park) => (
              <div key={park.id} className={`bg-white rounded-lg shadow-sm border-2 overflow-hidden transition-all hover:shadow-md ${
                park.visited ? 'border-green-200 bg-green-50' : 'border-gray-200'
              }`}>
                <div className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 text-lg mb-1">{park.name}</h4>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600">{park.state}</span>
                        {park.visited && (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {park.visited ? (
                    <div className="space-y-3">
                      {park.visitDate && (
                        <div className="flex items-center text-sm text-gray-600">
                          <Calendar size={14} className="mr-2" />
                          <span>{new Date(park.visitDate).toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'short', 
                            day: 'numeric' 
                          })}</span>
                        </div>
                      )}
                      
                      {park.rating && (
                        <div className="flex items-center space-x-1">
                          {[...Array(5)].map((_, i) => (
                            <Star 
                              key={i} 
                              size={16} 
                              className={i < park.rating! ? 'text-yellow-400 fill-current' : 'text-gray-300'}
                            />
                          ))}
                          <span className="text-sm text-gray-600 ml-2">({park.rating}/5)</span>
                        </div>
                      )}
                      
                      {park.photos && park.photos.length > 0 && (
                        <div className="flex items-center text-sm text-gray-600">
                          <Camera size={14} className="mr-2" />
                          <span>{`${park.photos.length} photo${park.photos.length !== 1 ? 's' : ''}`}</span>
                        </div>
                      )}
                      
                      {park.notes && (
                        <p className="text-sm text-gray-600 italic bg-white p-3 rounded-lg border">
                          "{park.notes}"
                        </p>
                      )}
                      
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => handleParkEdit(park)}
                          className="flex-1 py-2 px-3 bg-green-100 text-green-700 rounded-lg text-sm font-medium hover:bg-green-200 transition-colors"
                        >
                          <Edit size={14} className="inline mr-1" />
                          Edit Visit
                        </button>
                        <button 
                          onClick={() => handleParkUnvisit(park.id)}
                          className="py-2 px-3 bg-red-100 text-red-700 rounded-lg text-sm font-medium hover:bg-red-200 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-sm text-gray-500">Not yet visited</p>
                      <button 
                        onClick={() => handleParkEdit(park)}
                        className="w-full py-2 px-4 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
                      >
                        <CheckCircle size={14} className="inline mr-1" />
                        Mark as Visited
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Quick Stats Summary */}
        <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-6 border border-green-200">
          <h4 className="font-medium text-gray-900 mb-4">Your National Parks Journey</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-green-600">
                {visitedParks.length > 0 ? Math.round((visitedParks.length / nationalParks.length) * 100) : 0}%
              </div>
              <div className="text-sm text-gray-600">Complete</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {nationalParks.length - visitedParks.length}
              </div>
              <div className="text-sm text-gray-600">Parks Remaining</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">
                {visitedParks.length > 0 ? 
                  `${visitedParks.filter(p => p.visitDate && new Date(p.visitDate).getFullYear() === new Date().getFullYear()).length} this year` 
                  : '0 this year'
                }
              </div>
              <div className="text-sm text-gray-600">Recent Visits</div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderWorldProgressView = () => {
    const visitedCountries = countries.filter(c => c.visited);
    const visitedUSStates = usStates.filter(s => s.visited);
    const visitedIndiaStates = indiaStates.filter(s => s.visited);
    
    const countryProgressPercentage = (visitedCountries.length / countries.length) * 100;
    const usStateProgressPercentage = (visitedUSStates.length / usStates.length) * 100;
    const indiaStateProgressPercentage = (visitedIndiaStates.length / indiaStates.length) * 100;
    
    return (
      <div className="space-y-6">
        {/* Progress Stats */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">World Exploration Progress</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Countries Progress */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-gray-900">Countries Visited</h4>
                <span className="text-sm text-gray-600">
                  {visitedCountries.length} / {countries.length}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 mb-3">
                <div 
                  className="bg-blue-600 h-3 rounded-full transition-all duration-300" 
                  style={{ width: `${countryProgressPercentage}%` }}
                ></div>
              </div>
              <div className="text-center">
                <span className="text-xl font-bold text-blue-600">{countryProgressPercentage.toFixed(1)}%</span>
              </div>
            </div>

            {/* US States Progress */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-gray-900">US States Visited</h4>
                <span className="text-sm text-gray-600">
                  {visitedUSStates.length} / {usStates.length}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 mb-3">
                <div 
                  className="bg-green-600 h-3 rounded-full transition-all duration-300" 
                  style={{ width: `${usStateProgressPercentage}%` }}
                ></div>
              </div>
              <div className="text-center">
                <span className="text-xl font-bold text-green-600">{usStateProgressPercentage.toFixed(1)}%</span>
              </div>
            </div>

            {/* India States Progress */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-gray-900">India States Visited</h4>
                <span className="text-sm text-gray-600">
                  {visitedIndiaStates.length} / {indiaStates.length}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 mb-3">
                <div 
                  className="bg-orange-600 h-3 rounded-full transition-all duration-300" 
                  style={{ width: `${indiaStateProgressPercentage}%` }}
                ></div>
              </div>
              <div className="text-center">
                <span className="text-xl font-bold text-orange-600">{indiaStateProgressPercentage.toFixed(1)}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Interactive Map Selector */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h4 className="font-medium text-gray-900">Interactive Maps</h4>
            <div className="flex items-center space-x-4">
              {/* View Type Toggle */}
              <div className="flex border border-gray-300 rounded-lg">
                <button
                  onClick={() => setMapViewType('list')}
                  className={`px-3 py-2 text-sm font-medium transition-colors ${
                    mapViewType === 'list' ? 'bg-gray-100 text-gray-700' : 'text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  📋 List
                </button>
                <button
                  onClick={() => setMapViewType('map')}
                  className={`px-3 py-2 text-sm font-medium border-l border-gray-300 transition-colors ${
                    mapViewType === 'map' ? 'bg-gray-100 text-gray-700' : 'text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  🗺️ Map
                </button>
              </div>
              
              {/* Map Type Selector */}
              <div className="flex border border-gray-300 rounded-lg">
                <button
                  onClick={() => setSelectedMapType('world')}
                  className={`px-4 py-2 text-sm font-medium transition-colors ${
                    selectedMapType === 'world' ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  🌍 World
                </button>
                <button
                  onClick={() => setSelectedMapType('us')}
                  className={`px-4 py-2 text-sm font-medium border-l border-gray-300 transition-colors ${
                    selectedMapType === 'us' ? 'bg-green-100 text-green-700' : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  🇺🇸 USA
                </button>
                <button
                  onClick={() => setSelectedMapType('india')}
                  className={`px-4 py-2 text-sm font-medium border-l border-gray-300 transition-colors ${
                    selectedMapType === 'india' ? 'bg-orange-100 text-orange-700' : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  🇮🇳 India
                </button>
              </div>
            </div>
          </div>
          
          {/* Interactive Map */}
          <div className="bg-gray-50 rounded-lg min-h-96 border border-gray-200">
            {selectedMapType === 'world' && renderWorldMap()}
            {selectedMapType === 'us' && renderUSMap()}
            {selectedMapType === 'india' && renderIndiaMap()}
          </div>
        </div>

        {/* Continents Summary */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h4 className="font-medium text-gray-900 mb-4">Travel Summary by Continent</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            {Object.entries({
              'North America': visitedCountries.filter(c => c.continent === 'North America').length,
              'South America': visitedCountries.filter(c => c.continent === 'South America').length,
              'Europe': visitedCountries.filter(c => c.continent === 'Europe').length,
              'Asia': visitedCountries.filter(c => c.continent === 'Asia').length,
              'Africa': visitedCountries.filter(c => c.continent === 'Africa').length,
              'Oceania': visitedCountries.filter(c => c.continent === 'Oceania').length,
              'Antarctica': visitedCountries.filter(c => c.continent === 'Antarctica').length
            }).map(([continent, count]) => (
              <div key={continent} className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-lg font-bold text-gray-900">{count}</div>
                <div className="text-xs text-gray-600">{continent}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderAnalyticsView = () => {
    const totalDays = trips.reduce((sum, trip) => {
      const days = Math.ceil((trip.endDate.getTime() - trip.startDate.getTime()) / (1000 * 60 * 60 * 24));
      return sum + days;
    }, 0);
    
    const totalSpent = trips.reduce((sum, trip) => sum + (trip.spent || 0), 0);
    const averageTripLength = trips.length > 0 ? totalDays / trips.length : 0;
    
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Travel Analytics</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <TrendingUp className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-blue-600">{totalDays}</div>
              <div className="text-sm text-gray-600">Total Travel Days</div>
            </div>
            
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <DollarSign className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-green-600">${totalSpent.toLocaleString()}</div>
              <div className="text-sm text-gray-600">Total Spent</div>
            </div>
            
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <BarChart3 className="w-8 h-8 text-purple-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-purple-600">{averageTripLength.toFixed(1)}</div>
              <div className="text-sm text-gray-600">Avg Trip Length</div>
            </div>
            
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <Award className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-yellow-600">
                {Math.max(...trips.map(trip => 
                  Math.ceil((trip.endDate.getTime() - trip.startDate.getTime()) / (1000 * 60 * 60 * 24))
                ), 0)}
              </div>
              <div className="text-sm text-gray-600">Longest Trip</div>
            </div>
          </div>
        </div>

        {/* Travel Trends Charts Placeholder */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h4 className="font-medium text-gray-900 mb-4">Travel Frequency by Month</h4>
            <div className="bg-gray-100 rounded-lg h-48 flex items-center justify-center">
              <div className="text-center">
                <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600">Chart coming soon</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h4 className="font-medium text-gray-900 mb-4">Spending by Trip Type</h4>
            <div className="bg-gray-100 rounded-lg h-48 flex items-center justify-center">
              <div className="text-center">
                <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600">Chart coming soon</p>
              </div>
            </div>
          </div>
        </div>

        {/* Travel Goals */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h4 className="font-medium text-gray-900 mb-4">Travel Goals</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Visit 50 Countries</span>
                <Target className="w-4 h-4 text-blue-600" />
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full" 
                  style={{ width: `${(worldProgress.countries.visited / 50) * 100}%` }}
                ></div>
              </div>
              <div className="text-xs text-gray-600 mt-1">
                {worldProgress.countries.visited} / 50 countries
              </div>
            </div>
            
            <div className="p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">All US National Parks</span>
                <Mountain className="w-4 h-4 text-green-600" />
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-600 h-2 rounded-full" 
                  style={{ width: `${(nationalParks.filter(p => p.visited).length / nationalParks.length) * 100}%` }}
                ></div>
              </div>
              <div className="text-xs text-gray-600 mt-1">
                {nationalParks.filter(p => p.visited).length} / {nationalParks.length} parks
              </div>
            </div>
            
            <div className="p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">All 7 Continents</span>
                <Globe className="w-4 h-4 text-purple-600" />
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-purple-600 h-2 rounded-full" 
                  style={{ width: `${(Object.values(worldProgress.continents).filter(count => count > 0).length / 7) * 100}%` }}
                ></div>
              </div>
              <div className="text-xs text-gray-600 mt-1">
                {Object.values(worldProgress.continents).filter(count => count > 0).length} / 7 continents
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // CSS for world map SVG
  const worldMapCSS = `
    /* Ocean and Background */
    .world-ocean {
      fill: url(#oceanGradient);
      animation: gentle-wave 8s ease-in-out infinite;
    }
    
    /* Country Base Styles */
    .world-country {
      stroke: rgba(255, 255, 255, 0.8);
      stroke-width: 0.5;
      cursor: pointer;
      transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
      filter: url(#countryDropShadow);
    }
    
    /* Visited Countries */
    .world-country-visited {
      fill: url(#visitedCountryGradient);
      stroke-width: 1.2;
      stroke: rgba(16, 185, 129, 0.8);
    }
    
    /* Unvisited Countries */
    .world-country-unvisited {
      fill: url(#unvisitedCountryGradient);
      stroke: rgba(203, 213, 225, 0.6);
    }
    
    /* Planned/Next Destinations */
    .world-country-planned {
      fill: url(#plannedCountryGradient);
      stroke: rgba(245, 158, 11, 0.8);
      stroke-width: 1;
      animation: pulse-glow 2s ease-in-out infinite;
    }
    
    /* Enhanced Hover Effects */
    .world-country:hover {
      transform: scale(1.05);
      transform-origin: center;
      filter: url(#glowEffect) url(#countryDropShadow);
      stroke-width: 2;
      z-index: 10;
    }
    
    .world-country-visited:hover {
      stroke: #047857;
      fill: url(#visitedCountryGradient);
      filter: brightness(1.1) url(#glowEffect);
    }
    
    .world-country-unvisited:hover {
      stroke: #64748b;
      fill: #f1f5f9;
    }
    
    /* Travel Route Lines */
    .travel-route {
      stroke: #10b981;
      stroke-width: 2;
      fill: none;
      stroke-dasharray: 5,5;
      animation: dash-flow 3s linear infinite;
      opacity: 0.7;
    }
    
    /* Travel Pins */
    .travel-pin {
      transform-origin: center bottom;
      animation: pin-bounce 2s ease-in-out infinite;
    }
    
    /* Animations */
    @keyframes gentle-wave {
      0%, 100% { 
        fill-opacity: 0.8; 
      }
      50% { 
        fill-opacity: 0.9; 
      }
    }
    
    @keyframes pulse-glow {
      0%, 100% { 
        stroke-opacity: 0.6;
        filter: url(#countryDropShadow);
      }
      50% { 
        stroke-opacity: 1;
        filter: url(#glowEffect) url(#countryDropShadow);
      }
    }
    
    @keyframes dash-flow {
      to {
        stroke-dashoffset: -10;
      }
    }
    
    @keyframes pin-bounce {
      0%, 100% { 
        transform: translateY(0px) scale(1); 
      }
      50% { 
        transform: translateY(-5px) scale(1.1); 
      }
    }
    
    /* Tooltip Enhancements */
    .world-tooltip {
      opacity: 0;
      pointer-events: none;
      transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
      transform: translateY(10px);
    }
    
    .world-country:hover ~ .world-tooltip {
      opacity: 1;
      transform: translateY(0px);
    }
  `;

  // CSS for US map SVG
  const usMapCSS = `
    .us-state {
      stroke: #ffffff;
      stroke-width: 1.2;
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      filter: url(#usMapShadow);
    }
    .us-state:hover {
      stroke: #1e40af;
      stroke-width: 2.5;
      filter: url(#usMapShadow) brightness(1.1);
      transform: scale(1.03);
      transform-origin: center;
    }
    .us-state-visited {
      fill: url(#usVisitedGradient);
    }
    .us-state-unvisited {
      fill: url(#usUnvisitedGradient);
    }
    .us-ocean {
      fill: url(#usOceanGradient);
    }
    .national-park {
      fill: #059669;
      stroke: #ffffff;
      stroke-width: 1.5;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .national-park:hover {
      fill: #047857;
      transform: scale(1.2);
    }
  `;

  // CSS for India map SVG
  const indiaMapCSS = `
    .india-state {
      stroke: #ffffff;
      stroke-width: 1.2;
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      filter: url(#indiaMapShadow);
    }
    .india-state:hover {
      stroke: #ea580c;
      stroke-width: 2.5;
      filter: url(#indiaMapShadow) brightness(1.1);
      transform: scale(1.03);
      transform-origin: center;
    }
    .india-state-visited {
      fill: url(#indiaVisitedGradient);
    }
    .india-state-unvisited {
      fill: url(#indiaUnvisitedGradient);
    }
    .india-union-territory {
      stroke-dasharray: 4,4;
      stroke-width: 2;
      animation: dash 2s linear infinite;
    }
    .india-union-territory-visited {
      fill: url(#indiaUTVisitedGradient);
      stroke: #dc2626;
    }
    .india-union-territory-unvisited {
      fill: url(#indiaUTUnvisitedGradient);
      stroke: #fca5a5;
    }
    .india-ocean {
      fill: url(#indiaOceanGradient);
    }
    @keyframes dash {
      to {
        stroke-dashoffset: -8;
      }
    }
  `;

  // Map rendering functions
  const renderWorldMap = () => {
    return (
      <div className="relative">
        <div className="flex items-center justify-between mb-6 px-6">
          <div>
            <h5 className="text-xl font-semibold text-gray-900">World Map</h5>
            <p className="text-sm text-gray-500 mt-1">
              {countries.filter(c => c.visited).length} of {countries.length} countries visited
            </p>
          </div>
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full shadow-sm"></div>
              <span className="text-sm font-medium text-gray-700">Visited</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-gradient-to-br from-slate-200 to-slate-300 rounded-full shadow-sm"></div>
              <span className="text-sm font-medium text-gray-700">Not Visited</span>
            </div>
          </div>
        </div>
        
        {mapViewType === 'map' && (
          <div className="relative bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-100 rounded-2xl shadow-xl overflow-hidden">
            {/* Modern Map Controls */}
            <div className="absolute top-6 right-6 z-20 flex flex-col space-y-3">
              <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 p-2">
                <button
                  onClick={() => {
                    const mapElement = document.getElementById('world-map-svg');
                    if (mapElement) {
                      const currentTransform = mapElement.style.transform || 'scale(1)';
                      const currentScale = parseFloat(currentTransform.match(/scale\(([\d.]+)\)/)?.[1] || '1');
                      const newScale = Math.min(currentScale * 1.3, 4);
                      mapElement.style.transform = `scale(${newScale})`;
                      mapElement.style.transition = 'transform 0.3s ease';
                    }
                  }}
                  className="w-10 h-10 flex items-center justify-center text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 group"
                  title="Zoom In"
                >
                  <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
                  </svg>
                </button>
                <button
                  onClick={() => {
                    const mapElement = document.getElementById('world-map-svg');
                    if (mapElement) {
                      const currentTransform = mapElement.style.transform || 'scale(1)';
                      const currentScale = parseFloat(currentTransform.match(/scale\(([\d.]+)\)/)?.[1] || '1');
                      const newScale = Math.max(currentScale / 1.3, 0.7);
                      mapElement.style.transform = `scale(${newScale})`;
                      mapElement.style.transition = 'transform 0.3s ease';
                    }
                  }}
                  className="w-10 h-10 flex items-center justify-center text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 group"
                  title="Zoom Out"
                >
                  <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
                  </svg>
                </button>
                <button
                  onClick={() => {
                    const mapElement = document.getElementById('world-map-svg');
                    if (mapElement) {
                      mapElement.style.transform = 'scale(1)';
                      mapElement.style.transition = 'transform 0.5s ease';
                    }
                  }}
                  className="w-10 h-10 flex items-center justify-center text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 group"
                  title="Reset View"
                >
                  <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Wanderlog-Inspired Interactive World Map */}
            <div className="h-[700px] w-full relative overflow-hidden bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl shadow-xl">
              {/* Map Legend */}
              <div className="absolute top-4 left-4 z-20 bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-4 border border-white/20">
                <h4 className="text-sm font-semibold text-gray-800 mb-3">Travel Progress</h4>
                <div className="space-y-2">
                  <div className="flex items-center space-x-3">
                    <div className="w-4 h-4 bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full shadow-sm"></div>
                    <span className="text-xs text-gray-700">Visited ({countries.filter(c => c.visited).length})</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-4 h-4 bg-gradient-to-r from-amber-300 to-amber-500 rounded-full shadow-sm"></div>
                    <span className="text-xs text-gray-700">Next destinations</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-4 h-4 bg-gradient-to-r from-slate-200 to-slate-300 rounded-full shadow-sm"></div>
                    <span className="text-xs text-gray-700">Unvisited</span>
                  </div>
                </div>
              </div>

              {/* Interactive Map Container */}
              <div className="absolute inset-0 overflow-hidden rounded-2xl">
                <div className="w-full h-full flex items-center justify-center bg-blue-100">
                  <p className="text-gray-600">Interactive World Map Coming Soon</p>
                </div>

                {/* Interactive Tooltip */}
                <div id="map-tooltip" className="absolute hidden bg-white/95 backdrop-blur-sm px-3 py-2 rounded-lg shadow-lg border border-white/20 text-sm font-medium text-gray-900 pointer-events-none z-10">
                  <div id="tooltip-content"></div>
                </div>
              </div>
            </div>

            {/* Interactive Map Controls */}
            <div className="absolute bottom-4 right-4 z-20 flex flex-col space-y-2">
              <button className="bg-white/90 backdrop-blur-sm hover:bg-white rounded-lg shadow-lg border border-white/20 p-3 transition-all hover:scale-105 group">
                <Globe size={18} className="text-gray-600 group-hover:text-blue-600" />
              </button>
              <button className="bg-white/90 backdrop-blur-sm hover:bg-white rounded-lg shadow-lg border border-white/20 p-3 transition-all hover:scale-105 group">
                <Plus size={18} className="text-gray-600 group-hover:text-green-600" />
              </button>
              <button className="bg-white/90 backdrop-blur-sm hover:bg-white rounded-lg shadow-lg border border-white/20 p-3 transition-all hover:scale-105 group">
                <Navigation size={18} className="text-gray-600 group-hover:text-purple-600" />
              </button>
            </div>
          </div>
        )}
        
        {mapViewType === 'list' && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-80 overflow-y-auto">
            {countries.map((country) => (
              <div
                key={country.id}
                onClick={() => handleLocationEdit(country)}
                className="p-3 rounded-lg border-2 cursor-pointer transition-all hover:shadow-md border-gray-200 bg-white hover:bg-gray-50"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900">{country.name}</div>
                    <div className="text-xs text-gray-500">{country.continent}</div>
                    {country.visited && country.visitDate && (
                      <div className="text-xs text-green-600 mt-1">
                        {new Date(country.visitDate).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col items-end">
                    {country.visited && (
                      <>
                        <div className="w-3 h-3 bg-green-500 rounded-full mb-1"></div>
                        {country.rating && (
                          <div className="text-xs text-yellow-600">
                            {'★'.repeat(country.rating)}
                          </div>
                        )}
                      </>
                    )}
                    {country.tripCount > 0 && (
                      <div className="text-xs text-gray-500 mt-1">
                        {`${country.tripCount} trip${country.tripCount > 1 ? 's' : ''}`}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderUSMap = () => {
    return (
      <div className="relative">
        <div className="flex items-center justify-between mb-6 px-6">
          <div>
            <h5 className="text-xl font-semibold text-gray-900">United States Map</h5>
            <p className="text-sm text-gray-500 mt-1">
              {usStates.filter(s => s.visited).length} of {usStates.length} states visited • {nationalParks.filter(p => p.visited).length} national parks explored
            </p>
          </div>
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full shadow-sm"></div>
              <span className="text-sm font-medium text-gray-700">Visited States</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-gradient-to-br from-slate-200 to-slate-300 rounded-full shadow-sm"></div>
              <span className="text-sm font-medium text-gray-700">Not Visited</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-full shadow-sm"></div>
              <span className="text-sm font-medium text-gray-700">National Parks</span>
            </div>
          </div>
        </div>
        
        {mapViewType === 'map' ? (
          <div className="relative bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-2xl shadow-xl overflow-hidden">
            {/* Modern Map Controls */}
            <div className="absolute top-6 right-6 z-20 flex flex-col space-y-3">
              <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 p-2">
                <button
                  onClick={() => {
                    const mapElement = document.getElementById('us-map-svg');
                    if (mapElement) {
                      const currentTransform = mapElement.style.transform || 'scale(1)';
                      const currentScale = parseFloat(currentTransform.match(/scale\(([\d.]+)\)/)?.[1] || '1');
                      const newScale = Math.min(currentScale * 1.3, 4);
                      mapElement.style.transform = `scale(${newScale})`;
                      mapElement.style.transition = 'transform 0.3s ease';
                    }
                  }}
                  className="w-10 h-10 flex items-center justify-center text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 group"
                  title="Zoom In"
                >
                  <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
                  </svg>
                </button>
                <button
                  onClick={() => {
                    const mapElement = document.getElementById('us-map-svg');
                    if (mapElement) {
                      const currentTransform = mapElement.style.transform || 'scale(1)';
                      const currentScale = parseFloat(currentTransform.match(/scale\(([\d.]+)\)/)?.[1] || '1');
                      const newScale = Math.max(currentScale / 1.3, 0.7);
                      mapElement.style.transform = `scale(${newScale})`;
                      mapElement.style.transition = 'transform 0.3s ease';
                    }
                  }}
                  className="w-10 h-10 flex items-center justify-center text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 group"
                  title="Zoom Out"
                >
                  <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
                  </svg>
                </button>
                <button
                  onClick={() => {
                    const mapElement = document.getElementById('us-map-svg');
                    if (mapElement) {
                      mapElement.style.transform = 'scale(1)';
                      mapElement.style.transition = 'transform 0.5s ease';
                    }
                  }}
                  className="w-10 h-10 flex items-center justify-center text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 group"
                  title="Reset View"
                >
                  <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Premium SVG US Map */}
            <div className="h-[600px] w-full relative overflow-hidden">
              <svg
                id="us-map-svg"
                viewBox="0 0 1000 600"
                className="w-full h-full cursor-grab active:cursor-grabbing transition-transform duration-300"
                style={{ transformOrigin: 'center center' }}
              >
                <defs>
                  <filter id="usMapShadow" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="rgba(0,0,0,0.1)"/>
                  </filter>
                  <linearGradient id="usVisitedGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#3b82f6" />
                    <stop offset="100%" stopColor="#1d4ed8" />
                  </linearGradient>
                  <linearGradient id="usUnvisitedGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#f1f5f9" />
                    <stop offset="100%" stopColor="#e2e8f0" />
                  </linearGradient>
                  <linearGradient id="usOceanGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#dbeafe" />
                    <stop offset="50%" stopColor="#bfdbfe" />
                    <stop offset="100%" stopColor="#93c5fd" />
                  </linearGradient>
                  <style>{usMapCSS}</style>
                </defs>

                {/* Ocean Background */}
                <rect x="0" y="0" width="1000" height="600" className="us-ocean"/>

                {/* Accurate US States with Professional Styling */}
                
                {/* California - More accurate Pacific coast shape */}
                <path
                  className={`us-state ${usStates.find(s => s.code === 'CA')?.visited ? 'us-state-visited' : 'us-state-unvisited'}`}
                  d="M 50 250 C 50 245 52 240 56 238 C 62 235 70 235 78 238 C 88 242 98 248 106 256 C 112 262 116 269 118 277 C 120 285 120 293 118 301 C 116 309 112 317 106 324 C 98 332 88 338 78 342 C 70 345 62 346 56 344 C 52 342 50 337 50 332 Z M 60 350 C 60 345 62 340 66 338 C 72 335 80 335 88 338 C 98 342 108 348 116 356 C 122 362 126 369 128 377 C 130 385 130 393 128 401 C 126 409 122 417 116 424 C 108 432 98 438 88 442 C 80 445 72 446 66 444 C 62 442 60 437 60 432 Z"
                  onClick={() => {
                    const state = usStates.find(s => s.code === 'CA');
                    if (state) handleLocationEdit(state);
                  }}
                >
                  <title>California ({usStates.find(s => s.code === 'CA')?.nationalParks?.length || 0} National Parks)</title>
                </path>

                {/* Texas - More accurate large state shape */}
                <path
                  className={`us-state ${usStates.find(s => s.code === 'TX')?.visited ? 'us-state-visited' : 'us-state-unvisited'}`}
                  d="M 350 360 C 350 355 355 350 365 348 C 380 345 400 345 425 348 C 455 352 485 358 510 366 C 530 372 545 380 555 389 C 565 398 570 408 570 418 C 570 428 565 438 555 447 C 545 456 530 464 510 470 C 485 478 455 484 425 488 C 400 491 380 492 365 490 C 355 489 350 484 350 478 Z"
                  onClick={() => {
                    const state = usStates.find(s => s.code === 'TX');
                    if (state) handleLocationEdit(state);
                  }}
                >
                  <title>Texas ({usStates.find(s => s.code === 'TX')?.nationalParks?.length || 0} National Parks)</title>
                </path>

                {/* Florida - Distinctive peninsula shape */}
                <path
                  className={`us-state ${usStates.find(s => s.code === 'FL')?.visited ? 'us-state-visited' : 'us-state-unvisited'}`}
                  d="M 650 420 C 650 415 653 412 658 410 C 665 407 675 407 685 410 C 695 413 705 418 713 424 C 718 428 720 433 719 438 C 718 443 714 447 707 450 C 698 454 686 457 673 458 C 660 459 647 458 636 455 C 628 453 622 450 619 446 C 616 442 616 437 619 432 C 622 427 628 423 636 421 Z M 665 465 C 665 460 667 457 671 455 C 676 452 683 452 690 455 C 697 458 703 463 707 469 C 709 473 709 477 707 481 C 705 485 701 488 695 490 C 688 493 679 494 670 493 C 663 492 657 490 653 486 C 651 483 651 479 653 475 C 655 471 659 468 664 467 Z"
                  onClick={() => {
                    const state = usStates.find(s => s.code === 'FL');
                    if (state) handleLocationEdit(state);
                  }}
                >
                  <title>Florida ({usStates.find(s => s.code === 'FL')?.nationalParks?.length || 0} National Parks)</title>
                </path>

                {/* New York */}
                <path
                  className={`us-state ${usStates.find(s => s.code === 'NY')?.visited ? 'state-visited' : 'state-unvisited'}`}
                  d="M 700 200 L 780 190 L 790 230 L 780 250 L 720 260 L 700 240 Z"
                  onClick={() => {
                    const state = usStates.find(s => s.code === 'NY');
                    if (state) handleLocationEdit(state);
                  }}
                >
                  <title>New York ({usStates.find(s => s.code === 'NY')?.nationalParks?.length || 0} National Parks)</title>
                </path>

                {/* Colorado */}
                <path
                  className={`us-state ${usStates.find(s => s.code === 'CO')?.visited ? 'state-visited' : 'state-unvisited'}`}
                  d="M 350 250 L 420 240 L 430 290 L 420 320 L 350 310 Z"
                  onClick={() => {
                    const state = usStates.find(s => s.code === 'CO');
                    if (state) handleLocationEdit(state);
                  }}
                >
                  <title>Colorado ({usStates.find(s => s.code === 'CO')?.nationalParks?.length || 0} National Parks)</title>
                </path>

                {/* Utah */}
                <path
                  className={`us-state ${usStates.find(s => s.code === 'UT')?.visited ? 'state-visited' : 'state-unvisited'}`}
                  d="M 280 250 L 350 240 L 360 310 L 350 340 L 280 330 Z"
                  onClick={() => {
                    const state = usStates.find(s => s.code === 'UT');
                    if (state) handleLocationEdit(state);
                  }}
                >
                  <title>Utah ({usStates.find(s => s.code === 'UT')?.nationalParks?.length || 0} National Parks)</title>
                </path>

                {/* Arizona */}
                <path
                  className={`us-state ${usStates.find(s => s.code === 'AZ')?.visited ? 'state-visited' : 'state-unvisited'}`}
                  d="M 200 320 L 280 310 L 290 380 L 280 410 L 200 400 Z"
                  onClick={() => {
                    const state = usStates.find(s => s.code === 'AZ');
                    if (state) handleLocationEdit(state);
                  }}
                >
                  <title>Arizona ({usStates.find(s => s.code === 'AZ')?.nationalParks?.length || 0} National Parks)</title>
                </path>

                {/* Nevada */}
                <path
                  className={`us-state ${usStates.find(s => s.code === 'NV')?.visited ? 'state-visited' : 'state-unvisited'}`}
                  d="M 160 250 L 220 240 L 230 330 L 220 360 L 160 350 Z"
                  onClick={() => {
                    const state = usStates.find(s => s.code === 'NV');
                    if (state) handleLocationEdit(state);
                  }}
                >
                  <title>Nevada ({usStates.find(s => s.code === 'NV')?.nationalParks?.length || 0} National Parks)</title>
                </path>

                {/* Washington */}
                <path
                  className={`us-state ${usStates.find(s => s.code === 'WA')?.visited ? 'state-visited' : 'state-unvisited'}`}
                  d="M 100 120 L 200 110 L 210 160 L 200 180 L 100 170 Z"
                  onClick={() => {
                    const state = usStates.find(s => s.code === 'WA');
                    if (state) handleLocationEdit(state);
                  }}
                >
                  <title>Washington ({usStates.find(s => s.code === 'WA')?.nationalParks?.length || 0} National Parks)</title>
                </path>

                {/* Oregon */}
                <path
                  className={`us-state ${usStates.find(s => s.code === 'OR')?.visited ? 'state-visited' : 'state-unvisited'}`}
                  d="M 100 180 L 200 170 L 210 220 L 200 240 L 100 230 Z"
                  onClick={() => {
                    const state = usStates.find(s => s.code === 'OR');
                    if (state) handleLocationEdit(state);
                  }}
                >
                  <title>Oregon ({usStates.find(s => s.code === 'OR')?.nationalParks?.length || 0} National Parks)</title>
                </path>

                {/* Alaska */}
                <path
                  className={`us-state ${usStates.find(s => s.code === 'AK')?.visited ? 'state-visited' : 'state-unvisited'}`}
                  d="M 50 450 L 150 440 L 160 480 L 150 500 L 50 490 Z"
                  onClick={() => {
                    const state = usStates.find(s => s.code === 'AK');
                    if (state) handleLocationEdit(state);
                  }}
                >
                  <title>Alaska ({usStates.find(s => s.code === 'AK')?.nationalParks?.length || 0} National Parks)</title>
                </path>

                {/* Hawaii */}
                <g>
                  <circle
                    className={`us-state ${usStates.find(s => s.code === 'HI')?.visited ? 'state-visited' : 'state-unvisited'}`}
                    cx="250" cy="480" r="8"
                    onClick={() => {
                      const state = usStates.find(s => s.code === 'HI');
                      if (state) handleLocationEdit(state);
                    }}
                  >
                    <title>Hawaii ({usStates.find(s => s.code === 'HI')?.nationalParks?.length || 0} National Parks)</title>
                  </circle>
                  <circle
                    className={`us-state ${usStates.find(s => s.code === 'HI')?.visited ? 'state-visited' : 'state-unvisited'}`}
                    cx="260" cy="485" r="6"
                    onClick={() => {
                      const state = usStates.find(s => s.code === 'HI');
                      if (state) handleLocationEdit(state);
                    }}
                  />
                  <circle
                    className={`us-state ${usStates.find(s => s.code === 'HI')?.visited ? 'state-visited' : 'state-unvisited'}`}
                    cx="270" cy="475" r="4"
                    onClick={() => {
                      const state = usStates.find(s => s.code === 'HI');
                      if (state) handleLocationEdit(state);
                    }}
                  />
                </g>

                {/* Wyoming */}
                <path
                  className={`us-state ${usStates.find(s => s.code === 'WY')?.visited ? 'state-visited' : 'state-unvisited'}`}
                  d="M 300 200 L 380 190 L 390 240 L 380 270 L 300 260 Z"
                  onClick={() => {
                    const state = usStates.find(s => s.code === 'WY');
                    if (state) handleLocationEdit(state);
                  }}
                >
                  <title>Wyoming ({usStates.find(s => s.code === 'WY')?.nationalParks?.length || 0} National Parks)</title>
                </path>

                {/* Montana */}
                <path
                  className={`us-state ${usStates.find(s => s.code === 'MT')?.visited ? 'state-visited' : 'state-unvisited'}`}
                  d="M 300 140 L 480 130 L 490 180 L 480 200 L 300 190 Z"
                  onClick={() => {
                    const state = usStates.find(s => s.code === 'MT');
                    if (state) handleLocationEdit(state);
                  }}
                >
                  <title>Montana ({usStates.find(s => s.code === 'MT')?.nationalParks?.length || 0} National Parks)</title>
                </path>

                {/* Maine */}
                <path
                  className={`us-state ${usStates.find(s => s.code === 'ME')?.visited ? 'state-visited' : 'state-unvisited'}`}
                  d="M 850 180 L 880 170 L 890 210 L 880 230 L 850 220 Z"
                  onClick={() => {
                    const state = usStates.find(s => s.code === 'ME');
                    if (state) handleLocationEdit(state);
                  }}
                >
                  <title>Maine ({usStates.find(s => s.code === 'ME')?.nationalParks?.length || 0} National Parks)</title>
                </path>

                {/* National Parks Overlay */}
                {nationalParks.filter(park => park.visited).map((park, index) => {
                  // Position parks based on their state locations (simplified positioning)
                  const statePositions: { [key: string]: { x: number; y: number } } = {
                    'CA': { x: 85, y: 300 },
                    'TX': { x: 400, y: 385 },
                    'FL': { x: 710, y: 425 },
                    'NY': { x: 740, y: 220 },
                    'CO': { x: 385, y: 275 },
                    'UT': { x: 315, y: 285 },
                    'AZ': { x: 240, y: 365 },
                    'WA': { x: 155, y: 145 },
                    'OR': { x: 155, y: 205 },
                    'AK': { x: 100, y: 470 },
                    'HI': { x: 260, y: 480 },
                    'WY': { x: 340, y: 215 },
                    'MT': { x: 390, y: 165 },
                    'ME': { x: 865, y: 200 }
                  };
                  
                  const position = statePositions[park.state];
                  if (!position) return null;
                  
                  return (
                    <circle
                      key={park.id}
                      className="national-park"
                      cx={position.x + (index % 3) * 10 - 10}
                      cy={position.y + Math.floor(index / 3) * 8 - 8}
                      r="3"
                      onClick={() => handleParkEdit(park)}
                    >
                      <title>{park.name} - {park.state}</title>
                    </circle>
                  );
                })}

                {/* Additional states outline for context */}
                <path
                  className="state-unvisited"
                  d="M 450 200 L 650 190 L 680 250 L 650 350 L 500 360 L 450 300 Z"
                  style={{ fill: '#f9fafb', pointerEvents: 'none', opacity: 0.7 }}
                />
              </svg>

              {/* Interactive Tooltip */}
              <div id="us-map-tooltip" className="absolute hidden bg-white/95 backdrop-blur-sm px-3 py-2 rounded-lg shadow-lg border border-white/20 text-sm font-medium text-gray-900 pointer-events-none z-10">
                <div id="us-tooltip-content"></div>
              </div>
            </div>

            {/* Modern Legend */}
            <div className="absolute bottom-6 left-6 bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 p-4">
              <div className="text-sm font-semibold text-gray-800 mb-3">US Map Legend</div>
              <div className="space-y-2">
                <div className="flex items-center space-x-3">
                  <div className="w-4 h-4 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full shadow-sm"></div>
                  <span className="text-sm text-gray-700">Visited States</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-4 h-4 bg-gradient-to-br from-slate-200 to-slate-300 rounded-full shadow-sm"></div>
                  <span className="text-sm text-gray-700">Unvisited States</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-emerald-600 rounded-full shadow-sm"></div>
                  <span className="text-sm text-gray-700">National Parks</span>
                </div>
              </div>
              <div className="text-xs text-gray-500 mt-3 border-t border-gray-200 pt-2">
                Click states or parks to track visits
              </div>

              {/* National Parks Info */}
              <div className="absolute top-6 left-6 bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 p-3">
                <div className="text-sm font-semibold text-gray-800 mb-1">
                  National Parks Progress
                </div>
                <div className="text-xs text-emerald-600 font-medium">
                  {nationalParks.filter(p => p.visited).length} of {nationalParks.length} parks visited
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Emerald dots mark visited parks
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 max-h-80 overflow-y-auto">
            {usStates.map((state) => (
              <div
                key={state.id}
                onClick={() => handleLocationEdit(state)}
                className="p-3 rounded-lg border-2 cursor-pointer transition-all hover:shadow-md border-gray-200 bg-white hover:bg-gray-50"
              >
                <div className="flex flex-col">
                  <div className="font-medium text-gray-900 text-sm">{state.name}</div>
                  <div className="text-xs text-gray-500">{state.code}</div>
                  {state.visited && state.visitDate && (
                    <div className="text-xs text-green-600 mt-1">
                      {new Date(state.visitDate).toLocaleDateString()}
                    </div>
                  )}
                  <div className="flex items-center justify-between mt-2">
                    {state.visited && (
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    )}
                    {state.nationalParks && state.nationalParks.length > 0 && (
                      <div className="text-xs text-blue-600">
                        {`${state.nationalParks.length} park${state.nationalParks.length > 1 ? 's' : ''}`}
                      </div>
                    )}
                  </div>
                  {state.rating && (
                    <div className="text-xs text-yellow-600 mt-1">
                      {'★'.repeat(state.rating)}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderIndiaMap = () => {
    return (
      <div className="relative">
        <div className="flex items-center justify-between mb-6 px-6">
          <div>
            <h5 className="text-xl font-semibold text-gray-900">India Map</h5>
            <p className="text-sm text-gray-500 mt-1">
              {indiaStates.filter(s => s.visited).length} of {indiaStates.length} states & territories visited • Rich cultural diversity explored
            </p>
          </div>
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full shadow-sm"></div>
              <span className="text-sm font-medium text-gray-700">Visited States</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-gradient-to-br from-slate-200 to-slate-300 rounded-full shadow-sm"></div>
              <span className="text-sm font-medium text-gray-700">Not Visited</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-gradient-to-br from-red-500 to-red-700 rounded-full shadow-sm border-2 border-dashed border-red-300"></div>
              <span className="text-sm font-medium text-gray-700">Union Territories</span>
            </div>
          </div>
        </div>
        
        {mapViewType === 'map' ? (
          <div className="relative bg-gradient-to-br from-orange-50 via-amber-50 to-orange-100 rounded-2xl shadow-xl overflow-hidden">
            {/* Modern Map Controls */}
            <div className="absolute top-6 right-6 z-20 flex flex-col space-y-3">
              <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 p-2">
                <button
                  onClick={() => {
                    const mapElement = document.getElementById('india-map-svg');
                    if (mapElement) {
                      const currentTransform = mapElement.style.transform || 'scale(1)';
                      const currentScale = parseFloat(currentTransform.match(/scale\(([\d.]+)\)/)?.[1] || '1');
                      const newScale = Math.min(currentScale * 1.3, 4);
                      mapElement.style.transform = `scale(${newScale})`;
                      mapElement.style.transition = 'transform 0.3s ease';
                    }
                  }}
                  className="w-10 h-10 flex items-center justify-center text-gray-600 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-all duration-200 group"
                  title="Zoom In"
                >
                  <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
                  </svg>
                </button>
                <button
                  onClick={() => {
                    const mapElement = document.getElementById('india-map-svg');
                    if (mapElement) {
                      const currentTransform = mapElement.style.transform || 'scale(1)';
                      const currentScale = parseFloat(currentTransform.match(/scale\(([\d.]+)\)/)?.[1] || '1');
                      const newScale = Math.max(currentScale / 1.3, 0.7);
                      mapElement.style.transform = `scale(${newScale})`;
                      mapElement.style.transition = 'transform 0.3s ease';
                    }
                  }}
                  className="w-10 h-10 flex items-center justify-center text-gray-600 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-all duration-200 group"
                  title="Zoom Out"
                >
                  <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
                  </svg>
                </button>
                <button
                  onClick={() => {
                    const mapElement = document.getElementById('india-map-svg');
                    if (mapElement) {
                      mapElement.style.transform = 'scale(1)';
                      mapElement.style.transition = 'transform 0.5s ease';
                    }
                  }}
                  className="w-10 h-10 flex items-center justify-center text-gray-600 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-all duration-200 group"
                  title="Reset View"
                >
                  <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Premium SVG India Map */}
            <div className="h-[700px] w-full relative overflow-hidden">
              <svg
                id="india-map-svg"
                viewBox="0 0 800 1000"
                className="w-full h-full cursor-grab active:cursor-grabbing transition-transform duration-300"
                style={{ transformOrigin: 'center center' }}
              >
                <defs>
                  <filter id="indiaMapShadow" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="rgba(0,0,0,0.1)"/>
                  </filter>
                  <linearGradient id="indiaVisitedGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#ea580c" />
                    <stop offset="100%" stopColor="#c2410c" />
                  </linearGradient>
                  <linearGradient id="indiaUnvisitedGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#fed7aa" />
                    <stop offset="100%" stopColor="#fdba74" />
                  </linearGradient>
                  <linearGradient id="indiaUTVisitedGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#dc2626" />
                    <stop offset="100%" stopColor="#b91c1c" />
                  </linearGradient>
                  <linearGradient id="indiaUTUnvisitedGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#fecaca" />
                    <stop offset="100%" stopColor="#fca5a5" />
                  </linearGradient>
                  <linearGradient id="indiaOceanGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#fed7aa" />
                    <stop offset="50%" stopColor="#fdba74" />
                    <stop offset="100%" stopColor="#fb923c" />
                  </linearGradient>
                  <style>{indiaMapCSS}</style>
                </defs>

                {/* Ocean Background */}
                <rect x="0" y="0" width="800" height="1000" className="india-ocean"/>

                {/* Accurate Indian States with Cultural Styling */}
                
                {/* Rajasthan */}
                <path
                  className={`india-state ${indiaStates.find(s => s.code === 'RJ')?.visited ? 'india-state-visited' : 'india-state-unvisited'}`}
                  d="M 200 300 L 320 290 L 340 350 L 320 420 L 250 430 L 200 380 Z"
                  onClick={() => {
                    const state = indiaStates.find(s => s.code === 'RJ');
                    if (state) handleLocationEdit(state);
                  }}
                >
                  <title>Rajasthan - {indiaStates.find(s => s.code === 'RJ')?.capital}</title>
                </path>

                {/* Maharashtra */}
                <path
                  className={`india-state ${indiaStates.find(s => s.code === 'MH')?.visited ? 'india-state-visited' : 'india-state-unvisited'}`}
                  d="M 250 450 L 350 440 L 380 500 L 360 550 L 280 560 L 250 510 Z"
                  onClick={() => {
                    const state = indiaStates.find(s => s.code === 'MH');
                    if (state) handleLocationEdit(state);
                  }}
                >
                  <title>Maharashtra - {indiaStates.find(s => s.code === 'MH')?.capital}</title>
                </path>

                {/* Karnataka */}
                <path
                  className={`india-state ${indiaStates.find(s => s.code === 'KA')?.visited ? 'india-state-visited' : 'india-state-unvisited'}`}
                  d="M 280 580 L 380 570 L 400 630 L 380 680 L 300 690 L 280 640 Z"
                  onClick={() => {
                    const state = indiaStates.find(s => s.code === 'KA');
                    if (state) handleLocationEdit(state);
                  }}
                >
                  <title>Karnataka - {indiaStates.find(s => s.code === 'KA')?.capital}</title>
                </path>

                {/* Tamil Nadu */}
                <path
                  className={`india-state ${indiaStates.find(s => s.code === 'TN')?.visited ? 'india-state-visited' : 'india-state-unvisited'}`}
                  d="M 320 700 L 420 690 L 450 750 L 430 800 L 350 810 L 320 760 Z"
                  onClick={() => {
                    const state = indiaStates.find(s => s.code === 'TN');
                    if (state) handleLocationEdit(state);
                  }}
                >
                  <title>Tamil Nadu - {indiaStates.find(s => s.code === 'TN')?.capital}</title>
                </path>

                {/* Kerala */}
                <path
                  className={`india-state ${indiaStates.find(s => s.code === 'KL')?.visited ? 'india-state-visited' : 'india-state-unvisited'}`}
                  d="M 250 700 L 290 690 L 300 750 L 290 800 L 250 810 L 240 760 Z"
                  onClick={() => {
                    const state = indiaStates.find(s => s.code === 'KL');
                    if (state) handleLocationEdit(state);
                  }}
                >
                  <title>Kerala - {indiaStates.find(s => s.code === 'KL')?.capital}</title>
                </path>

                {/* Uttar Pradesh */}
                <path
                  className={`india-state ${indiaStates.find(s => s.code === 'UP')?.visited ? 'india-state-visited' : 'india-state-unvisited'}`}
                  d="M 350 250 L 480 240 L 500 300 L 480 350 L 400 360 L 350 310 Z"
                  onClick={() => {
                    const state = indiaStates.find(s => s.code === 'UP');
                    if (state) handleLocationEdit(state);
                  }}
                >
                  <title>Uttar Pradesh - {indiaStates.find(s => s.code === 'UP')?.capital}</title>
                </path>

                {/* Madhya Pradesh */}
                <path
                  className={`india-state ${indiaStates.find(s => s.code === 'MP')?.visited ? 'india-state-visited' : 'india-state-unvisited'}`}
                  d="M 320 370 L 450 360 L 470 420 L 450 470 L 380 480 L 320 430 Z"
                  onClick={() => {
                    const state = indiaStates.find(s => s.code === 'MP');
                    if (state) handleLocationEdit(state);
                  }}
                >
                  <title>Madhya Pradesh - {indiaStates.find(s => s.code === 'MP')?.capital}</title>
                </path>

                {/* Gujarat */}
                <path
                  className={`india-state ${indiaStates.find(s => s.code === 'GJ')?.visited ? 'india-state-visited' : 'india-state-unvisited'}`}
                  d="M 150 380 L 250 370 L 270 430 L 250 480 L 180 490 L 150 440 Z"
                  onClick={() => {
                    const state = indiaStates.find(s => s.code === 'GJ');
                    if (state) handleLocationEdit(state);
                  }}
                >
                  <title>Gujarat - {indiaStates.find(s => s.code === 'GJ')?.capital}</title>
                </path>

                {/* West Bengal */}
                <path
                  className={`india-state ${indiaStates.find(s => s.code === 'WB')?.visited ? 'india-state-visited' : 'india-state-unvisited'}`}
                  d="M 550 380 L 620 370 L 640 430 L 620 480 L 570 490 L 550 440 Z"
                  onClick={() => {
                    const state = indiaStates.find(s => s.code === 'WB');
                    if (state) handleLocationEdit(state);
                  }}
                >
                  <title>West Bengal - {indiaStates.find(s => s.code === 'WB')?.capital}</title>
                </path>

                {/* Bihar */}
                <path
                  className={`india-state ${indiaStates.find(s => s.code === 'BR')?.visited ? 'india-state-visited' : 'india-state-unvisited'}`}
                  d="M 480 320 L 550 310 L 570 360 L 550 390 L 500 400 L 480 360 Z"
                  onClick={() => {
                    const state = indiaStates.find(s => s.code === 'BR');
                    if (state) handleLocationEdit(state);
                  }}
                >
                  <title>Bihar - {indiaStates.find(s => s.code === 'BR')?.capital}</title>
                </path>

                {/* Odisha */}
                <path
                  className={`india-state ${indiaStates.find(s => s.code === 'OR')?.visited ? 'india-state-visited' : 'india-state-unvisited'}`}
                  d="M 500 450 L 570 440 L 590 500 L 570 550 L 520 560 L 500 510 Z"
                  onClick={() => {
                    const state = indiaStates.find(s => s.code === 'OR');
                    if (state) handleLocationEdit(state);
                  }}
                >
                  <title>Odisha - {indiaStates.find(s => s.code === 'OR')?.capital}</title>
                </path>

                {/* Andhra Pradesh */}
                <path
                  className={`india-state ${indiaStates.find(s => s.code === 'AP')?.visited ? 'india-state-visited' : 'india-state-unvisited'}`}
                  d="M 400 550 L 500 540 L 520 600 L 500 650 L 420 660 L 400 610 Z"
                  onClick={() => {
                    const state = indiaStates.find(s => s.code === 'AP');
                    if (state) handleLocationEdit(state);
                  }}
                >
                  <title>Andhra Pradesh - {indiaStates.find(s => s.code === 'AP')?.capital}</title>
                </path>

                {/* Telangana */}
                <path
                  className={`india-state ${indiaStates.find(s => s.code === 'TG')?.visited ? 'india-state-visited' : 'india-state-unvisited'}`}
                  d="M 420 500 L 480 490 L 500 530 L 480 560 L 440 570 L 420 540 Z"
                  onClick={() => {
                    const state = indiaStates.find(s => s.code === 'TG');
                    if (state) handleLocationEdit(state);
                  }}
                >
                  <title>Telangana - {indiaStates.find(s => s.code === 'TG')?.capital}</title>
                </path>

                {/* Punjab */}
                <path
                  className={`india-state ${indiaStates.find(s => s.code === 'PB')?.visited ? 'india-state-visited' : 'india-state-unvisited'}`}
                  d="M 280 200 L 340 190 L 360 230 L 340 260 L 300 270 L 280 240 Z"
                  onClick={() => {
                    const state = indiaStates.find(s => s.code === 'PB');
                    if (state) handleLocationEdit(state);
                  }}
                >
                  <title>Punjab - {indiaStates.find(s => s.code === 'PB')?.capital}</title>
                </path>

                {/* Haryana */}
                <path
                  className={`india-state ${indiaStates.find(s => s.code === 'HR')?.visited ? 'india-state-visited' : 'india-state-unvisited'}`}
                  d="M 320 220 L 380 210 L 400 250 L 380 280 L 340 290 L 320 260 Z"
                  onClick={() => {
                    const state = indiaStates.find(s => s.code === 'HR');
                    if (state) handleLocationEdit(state);
                  }}
                >
                  <title>Haryana - {indiaStates.find(s => s.code === 'HR')?.capital}</title>
                </path>

                {/* Himachal Pradesh */}
                <path
                  className={`india-state ${indiaStates.find(s => s.code === 'HP')?.visited ? 'india-state-visited' : 'india-state-unvisited'}`}
                  d="M 320 150 L 400 140 L 420 180 L 400 210 L 360 220 L 320 190 Z"
                  onClick={() => {
                    const state = indiaStates.find(s => s.code === 'HP');
                    if (state) handleLocationEdit(state);
                  }}
                >
                  <title>Himachal Pradesh - {indiaStates.find(s => s.code === 'HP')?.capital}</title>
                </path>

                {/* Uttarakhand */}
                <path
                  className={`india-state ${indiaStates.find(s => s.code === 'UT')?.visited ? 'india-state-visited' : 'india-state-unvisited'}`}
                  d="M 420 170 L 480 160 L 500 200 L 480 230 L 440 240 L 420 210 Z"
                  onClick={() => {
                    const state = indiaStates.find(s => s.code === 'UT');
                    if (state) handleLocationEdit(state);
                  }}
                >
                  <title>Uttarakhand - {indiaStates.find(s => s.code === 'UT')?.capital}</title>
                </path>

                {/* Assam */}
                <path
                  className={`india-state ${indiaStates.find(s => s.code === 'AS')?.visited ? 'india-state-visited' : 'india-state-unvisited'}`}
                  d="M 600 250 L 680 240 L 700 280 L 680 320 L 620 330 L 600 290 Z"
                  onClick={() => {
                    const state = indiaStates.find(s => s.code === 'AS');
                    if (state) handleLocationEdit(state);
                  }}
                >
                  <title>Assam - {indiaStates.find(s => s.code === 'AS')?.capital}</title>
                </path>

                {/* Jharkhand */}
                <path
                  className={`india-state ${indiaStates.find(s => s.code === 'JH')?.visited ? 'india-state-visited' : 'india-state-unvisited'}`}
                  d="M 520 380 L 580 370 L 600 410 L 580 440 L 540 450 L 520 420 Z"
                  onClick={() => {
                    const state = indiaStates.find(s => s.code === 'JH');
                    if (state) handleLocationEdit(state);
                  }}
                >
                  <title>Jharkhand - {indiaStates.find(s => s.code === 'JH')?.capital}</title>
                </path>

                {/* Chhattisgarh */}
                <path
                  className={`india-state ${indiaStates.find(s => s.code === 'CT')?.visited ? 'india-state-visited' : 'india-state-unvisited'}`}
                  d="M 450 420 L 520 410 L 540 460 L 520 500 L 470 510 L 450 470 Z"
                  onClick={() => {
                    const state = indiaStates.find(s => s.code === 'CT');
                    if (state) handleLocationEdit(state);
                  }}
                >
                  <title>Chhattisgarh - {indiaStates.find(s => s.code === 'CT')?.capital}</title>
                </path>

                {/* Goa */}
                <path
                  className={`india-state ${indiaStates.find(s => s.code === 'GA')?.visited ? 'india-state-visited' : 'india-state-unvisited'}`}
                  d="M 230 550 L 260 540 L 270 570 L 260 590 L 240 600 L 230 580 Z"
                  onClick={() => {
                    const state = indiaStates.find(s => s.code === 'GA');
                    if (state) handleLocationEdit(state);
                  }}
                >
                  <title>Goa - {indiaStates.find(s => s.code === 'GA')?.capital}</title>
                </path>

                {/* Union Territories (with special styling) */}

                {/* Delhi */}
                <circle
                  className={`india-state india-union-territory ${indiaStates.find(s => s.code === 'DL')?.visited ? 'india-union-territory-visited' : 'india-union-territory-unvisited'}`}
                  cx="380" cy="250" r="8"
                  onClick={() => {
                    const state = indiaStates.find(s => s.code === 'DL');
                    if (state) handleLocationEdit(state);
                  }}
                >
                  <title>Delhi (UT) - {indiaStates.find(s => s.code === 'DL')?.capital}</title>
                </circle>

                {/* Chandigarh */}
                <circle
                  className={`india-state india-union-territory ${indiaStates.find(s => s.code === 'CH')?.visited ? 'india-union-territory-visited' : 'india-union-territory-unvisited'}`}
                  cx="350" cy="220" r="6"
                  onClick={() => {
                    const state = indiaStates.find(s => s.code === 'CH');
                    if (state) handleLocationEdit(state);
                  }}
                >
                  <title>Chandigarh (UT) - {indiaStates.find(s => s.code === 'CH')?.capital}</title>
                </circle>

                {/* Puducherry */}
                <circle
                  className={`india-state india-union-territory ${indiaStates.find(s => s.code === 'PY')?.visited ? 'india-union-territory-visited' : 'india-union-territory-unvisited'}`}
                  cx="400" cy="720" r="5"
                  onClick={() => {
                    const state = indiaStates.find(s => s.code === 'PY');
                    if (state) handleLocationEdit(state);
                  }}
                >
                  <title>Puducherry (UT) - {indiaStates.find(s => s.code === 'PY')?.capital}</title>
                </circle>

                {/* Jammu and Kashmir */}
                <path
                  className={`india-state india-union-territory ${indiaStates.find(s => s.code === 'JK')?.visited ? 'india-union-territory-visited' : 'india-union-territory-unvisited'}`}
                  d="M 300 100 L 380 90 L 400 130 L 380 160 L 320 170 L 300 140 Z"
                  onClick={() => {
                    const state = indiaStates.find(s => s.code === 'JK');
                    if (state) handleLocationEdit(state);
                  }}
                >
                  <title>Jammu and Kashmir (UT) - {indiaStates.find(s => s.code === 'JK')?.capital}</title>
                </path>

                {/* Ladakh */}
                <path
                  className={`india-state india-union-territory ${indiaStates.find(s => s.code === 'LA')?.visited ? 'india-union-territory-visited' : 'india-union-territory-unvisited'}`}
                  d="M 400 80 L 480 70 L 500 110 L 480 140 L 420 150 L 400 120 Z"
                  onClick={() => {
                    const state = indiaStates.find(s => s.code === 'LA');
                    if (state) handleLocationEdit(state);
                  }}
                >
                  <title>Ladakh (UT) - {indiaStates.find(s => s.code === 'LA')?.capital}</title>
                </path>

                {/* Andaman and Nicobar Islands */}
                <g>
                  <circle
                    className={`india-state india-union-territory ${indiaStates.find(s => s.code === 'AN')?.visited ? 'india-union-territory-visited' : 'india-union-territory-unvisited'}`}
                    cx="650" cy="650" r="4"
                    onClick={() => {
                      const state = indiaStates.find(s => s.code === 'AN');
                      if (state) handleLocationEdit(state);
                    }}
                  >
                    <title>Andaman and Nicobar Islands (UT) - {indiaStates.find(s => s.code === 'AN')?.capital}</title>
                  </circle>
                  <circle
                    className={`india-state india-union-territory ${indiaStates.find(s => s.code === 'AN')?.visited ? 'india-union-territory-visited' : 'india-union-territory-unvisited'}`}
                    cx="655" cy="680" r="3"
                    onClick={() => {
                      const state = indiaStates.find(s => s.code === 'AN');
                      if (state) handleLocationEdit(state);
                    }}
                  />
                  <circle
                    className={`india-state india-union-territory ${indiaStates.find(s => s.code === 'AN')?.visited ? 'india-union-territory-visited' : 'india-union-territory-unvisited'}`}
                    cx="660" cy="720" r="2"
                    onClick={() => {
                      const state = indiaStates.find(s => s.code === 'AN');
                      if (state) handleLocationEdit(state);
                    }}
                  />
                </g>

                {/* Lakshadweep */}
                <g>
                  <circle
                    className={`india-state india-union-territory ${indiaStates.find(s => s.code === 'LD')?.visited ? 'india-union-territory-visited' : 'india-union-territory-unvisited'}`}
                    cx="180" cy="700" r="3"
                    onClick={() => {
                      const state = indiaStates.find(s => s.code === 'LD');
                      if (state) handleLocationEdit(state);
                    }}
                  >
                    <title>Lakshadweep (UT) - {indiaStates.find(s => s.code === 'LD')?.capital}</title>
                  </circle>
                  <circle
                    className={`india-state india-union-territory ${indiaStates.find(s => s.code === 'LD')?.visited ? 'india-union-territory-visited' : 'india-union-territory-unvisited'}`}
                    cx="175" cy="720" r="2"
                    onClick={() => {
                      const state = indiaStates.find(s => s.code === 'LD');
                      if (state) handleLocationEdit(state);
                    }}
                  />
                </g>

                {/* Additional northeastern states for context */}
                <path
                  className="india-state-unvisited"
                  d="M 680 200 L 720 190 L 740 240 L 720 280 L 700 290 L 680 250 Z"
                  style={{ fill: '#fef3c7', pointerEvents: 'none', opacity: 0.7 }}
                />
              </svg>

              {/* Interactive Tooltip */}
              <div id="india-map-tooltip" className="absolute hidden bg-white/95 backdrop-blur-sm px-3 py-2 rounded-lg shadow-lg border border-white/20 text-sm font-medium text-gray-900 pointer-events-none z-10">
                <div id="india-tooltip-content"></div>
              </div>
            </div>

            {/* Modern Legend */}
            <div className="absolute bottom-6 left-6 bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 p-4">
              <div className="text-sm font-semibold text-gray-800 mb-3">India Map Legend</div>
              <div className="space-y-2">
                <div className="flex items-center space-x-3">
                  <div className="w-4 h-4 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full shadow-sm"></div>
                  <span className="text-sm text-gray-700">Visited States</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-4 h-4 bg-gradient-to-br from-orange-200 to-orange-300 rounded-full shadow-sm"></div>
                  <span className="text-sm text-gray-700">Unvisited States</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-4 h-4 bg-gradient-to-br from-red-500 to-red-700 rounded-full shadow-sm border-2 border-dashed border-red-300"></div>
                  <span className="text-sm text-gray-700">Union Territories</span>
                </div>
              </div>
              <div className="text-xs text-gray-500 mt-3 border-t border-gray-200 pt-2">
                Click any state or UT to track visits
              </div>

              {/* States & UTs Info */}
              <div className="absolute top-6 left-6 bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 p-3">
                <div className="text-sm font-semibold text-gray-800 mb-2">
                  Incredible India Progress
                </div>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-600">States:</span>
                    <span className="font-medium text-orange-600">
                      {indiaStates.filter(s => s.visited && !['DL', 'CH', 'PY', 'JK', 'LA', 'AN', 'LD', 'DN'].includes(s.code)).length} visited
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Union Territories:</span>
                    <span className="font-medium text-red-600">
                      {indiaStates.filter(s => s.visited && ['DL', 'CH', 'PY', 'JK', 'LA', 'AN', 'LD', 'DN'].includes(s.code)).length} visited
                    </span>
                  </div>
                </div>
                <div className="text-xs text-gray-500 mt-2 pt-2 border-t border-gray-200">
                  Animated dashed borders mark UTs
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 max-h-80 overflow-y-auto">
            {indiaStates.map((state) => (
              <div
                key={state.id}
                onClick={() => handleLocationEdit(state)}
                className="p-3 rounded-lg border-2 cursor-pointer transition-all hover:shadow-md border-gray-200 bg-white hover:bg-gray-50"
              >
                <div className="flex flex-col">
                  <div className="font-medium text-gray-900 text-sm">{state.name}</div>
                  <div className="text-xs text-gray-500">{state.capital}</div>
                  {state.visited && state.visitDate && (
                    <div className="text-xs text-orange-600 mt-1">
                      {new Date(state.visitDate).toLocaleDateString()}
                    </div>
                  )}
                  <div className="flex items-center justify-between mt-2">
                    {state.visited && (
                      <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                    )}
                    {state.tripCount > 0 && (
                      <div className="text-xs text-gray-500">
                        {`${state.tripCount} trip${state.tripCount > 1 ? 's' : ''}`}
                      </div>
                    )}
                  </div>
                  {state.rating && (
                    <div className="text-xs text-yellow-600 mt-1">
                      {'★'.repeat(state.rating)}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Travel Hub</h2>
          <p className="text-gray-600">Comprehensive travel planning, tracking, and scheduling</p>
        </div>

        <div className="flex items-center space-x-3">
          {/* Enhanced View Toggle with Sliding Indicator */}
          <div className="relative flex bg-gray-100 rounded-xl p-1 shadow-inner">
            <div 
              className="absolute top-1 bottom-1 bg-white rounded-lg shadow-sm transition-all duration-300 ease-out"
              style={{
                left: `${view === 'trips' ? '4px' : 
                       view === 'history' ? 'calc(12.5% + 4px)' : 
                       view === 'cards' ? 'calc(25% + 4px)' :
                       view === 'parks' ? 'calc(37.5% + 4px)' :
                       view === 'parksMap' ? 'calc(50% + 4px)' :
                       view === 'world' ? 'calc(62.5% + 4px)' :
                       view === 'analytics' ? 'calc(75% + 4px)' : 'calc(87.5% + 4px)'}`,
                width: 'calc(12.5% - 8px)'
              }}
            />
            <button
              onClick={() => setView('trips')}
              className={`relative z-10 px-4 py-2 text-sm font-medium transition-all duration-200 rounded-lg ${
                view === 'trips' ? 'text-blue-700' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Luggage size={16} className="inline mr-1.5" />
              Trips
            </button>
            <button
              onClick={() => setView('history')}
              className={`relative z-10 px-4 py-2 text-sm font-medium transition-all duration-200 rounded-lg ${
                view === 'history' ? 'text-blue-700' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Clock size={16} className="inline mr-1.5" />
              History
            </button>
            <button
              onClick={() => setView('cards')}
              className={`relative z-10 px-4 py-2 text-sm font-medium transition-all duration-200 rounded-lg ${
                view === 'cards' ? 'text-blue-700' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <CreditCard size={16} className="inline mr-1.5" />
              Cards
            </button>
            <button
              onClick={() => setView('parks')}
              className={`relative z-10 px-4 py-2 text-sm font-medium transition-all duration-200 rounded-lg ${
                view === 'parks' ? 'text-blue-700' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Trees size={16} className="inline mr-1.5" />
              Parks
            </button>
            <button
              onClick={() => setView('parksMap')}
              className={`relative z-10 px-4 py-2 text-sm font-medium transition-all duration-200 rounded-lg ${
                view === 'parksMap' ? 'text-blue-700' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Map size={16} className="inline mr-1.5" />
              Map
            </button>
            <button
              onClick={() => setView('world')}
              className={`relative z-10 px-4 py-2 text-sm font-medium transition-all duration-200 rounded-lg ${
                view === 'world' ? 'text-blue-700' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Globe size={16} className="inline mr-1.5" />
              World
            </button>
            <button
              onClick={() => setView('analytics')}
              className={`relative z-10 px-4 py-2 text-sm font-medium transition-all duration-200 rounded-lg ${
                view === 'analytics' ? 'text-blue-700' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <BarChart3 size={16} className="inline mr-1.5" />
              Analytics
            </button>
            <button
              onClick={() => setView('calendar')}
              className={`relative z-10 px-4 py-2 text-sm font-medium transition-all duration-200 rounded-lg ${
                view === 'calendar' ? 'text-blue-700' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <CalendarIcon size={16} className="inline mr-1.5" />
              Calendar
            </button>
          </div>

          <button
            onClick={handleCreateTrip}
            className="group inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 transform hover:scale-105 active:scale-95 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            <Plus size={20} className="mr-2 group-hover:rotate-90 transition-transform duration-200" />
            New Trip
          </button>
        </div>
      </div>

      {/* Enhanced Stats Cards with Smooth Animations */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="group bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg hover:border-blue-200 transition-all duration-300 hover:-translate-y-1">
          <div className="flex items-center">
            <div className="p-3 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl group-hover:scale-110 transition-transform duration-200">
              <Plane className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 group-hover:text-gray-700 transition-colors">Total Trips</p>
              <p className="text-2xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{trips.length}</p>
            </div>
          </div>
        </div>

        <div className="group bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg hover:border-green-200 transition-all duration-300 hover:-translate-y-1">
          <div className="flex items-center">
            <div className="p-3 bg-gradient-to-br from-green-100 to-green-200 rounded-xl group-hover:scale-110 transition-transform duration-200">
              <Globe className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 group-hover:text-gray-700 transition-colors">Countries Visited</p>
              <p className="text-2xl font-bold text-gray-900 group-hover:text-green-600 transition-colors">
                {worldProgress.countries.visited} / {worldProgress.countries.total}
              </p>
            </div>
          </div>
        </div>

        <div className="group bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg hover:border-yellow-200 transition-all duration-300 hover:-translate-y-1">
          <div className="flex items-center">
            <div className="p-3 bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-xl group-hover:scale-110 transition-transform duration-200">
              <Mountain className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 group-hover:text-gray-700 transition-colors">National Parks</p>
              <p className="text-2xl font-bold text-gray-900 group-hover:text-yellow-600 transition-colors">
                {nationalParks.filter(p => p.visited).length} / {nationalParks.length}
              </p>
            </div>
          </div>
        </div>

        <div className="group bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg hover:border-purple-200 transition-all duration-300 hover:-translate-y-1">
          <div className="flex items-center">
            <div className="p-3 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl group-hover:scale-110 transition-transform duration-200">
              <CreditCard className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 group-hover:text-gray-700 transition-colors">Points Earned</p>
              <p className="text-2xl font-bold text-gray-900 group-hover:text-purple-600 transition-colors">
                {creditCardTrips.reduce((sum, card) => sum + card.pointsEarned, 0).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Dynamic Content Based on View with Smooth Transitions */}
      <div className="transition-all duration-500 ease-in-out transform">
        <div 
          key={view}
          className="animate-in fade-in-0 slide-in-from-right-4 duration-300"
        >
          {renderViewContent()}
        </div>
      </div>

      {/* Trip Creation Modal with Enhanced Animations */}
      {showTripModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-in fade-in-0 duration-200">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingTrip ? 'Edit Trip' : 'New Trip'}
              </h3>
              <button
                onClick={() => setShowTripModal(false)}
                className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-lg transition-all duration-200 hover:scale-110"
              >
                <Trash2 size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Trip Title
                </label>
                <input
                  type="text"
                  value={tripForm.title}
                  onChange={(e) => setTripForm({ ...tripForm, title: e.target.value })}
                  placeholder="Weekend in Paris"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Destination
                </label>
                <input
                  type="text"
                  value={tripForm.destination}
                  onChange={(e) => setTripForm({ ...tripForm, destination: e.target.value })}
                  placeholder="Paris, France"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={tripForm.startDate}
                    onChange={(e) => setTripForm({ ...tripForm, startDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={tripForm.endDate}
                    onChange={(e) => setTripForm({ ...tripForm, endDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Trip Type
                </label>
                <select
                  value={tripForm.type}
                  onChange={(e) => setTripForm({ ...tripForm, type: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {TRIP_TYPES.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.icon} {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Budget (optional)
                </label>
                <input
                  type="number"
                  value={tripForm.budget}
                  onChange={(e) => setTripForm({ ...tripForm, budget: e.target.value })}
                  placeholder="2000"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes (optional)
                </label>
                <textarea
                  value={tripForm.notes}
                  onChange={(e) => setTripForm({ ...tripForm, notes: e.target.value })}
                  placeholder="Special notes about this trip..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
              <button
                onClick={() => setShowTripModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveTrip}
                disabled={!tripForm.title || !tripForm.destination}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-lg transition-colors"
              >
                {editingTrip ? 'Update Trip' : 'Create Trip'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* National Park Visit Modal */}
      {showParkModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {editingPark?.visited ? 'Edit Visit' : 'Mark as Visited'}
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  {editingPark?.name}, {editingPark?.state}
                </p>
              </div>
              <button
                onClick={() => setShowParkModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <Trash2 size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Visit Date
                </label>
                <input
                  type="date"
                  value={parkForm.visitDate}
                  onChange={(e) => setParkForm({ ...parkForm, visitDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rating
                </label>
                <div className="flex items-center space-x-1 mb-2">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <button
                      key={rating}
                      onClick={() => setParkForm({ ...parkForm, rating: rating.toString() })}
                      className={`p-1 rounded ${
                        parseInt(parkForm.rating) >= rating
                          ? 'text-yellow-400 hover:text-yellow-500'
                          : 'text-gray-300 hover:text-gray-400'
                      }`}
                    >
                      <Star size={24} className={parseInt(parkForm.rating) >= rating ? 'fill-current' : ''} />
                    </button>
                  ))}
                </div>
                <select
                  value={parkForm.rating}
                  onChange={(e) => setParkForm({ ...parkForm, rating: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                >
                  <option value="">Select rating</option>
                  <option value="1">1 - Poor</option>
                  <option value="2">2 - Fair</option>
                  <option value="3">3 - Good</option>
                  <option value="4">4 - Very Good</option>
                  <option value="5">5 - Excellent</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes & Memories
                </label>
                <textarea
                  value={parkForm.notes}
                  onChange={(e) => setParkForm({ ...parkForm, notes: e.target.value })}
                  placeholder="Share your experience, favorite spots, hiking trails, wildlife sightings, or tips for future visitors..."
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Photos
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <Camera className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600 mb-2">Photo upload coming soon</p>
                  <p className="text-xs text-gray-500">Add your favorite park photos and memories</p>
                </div>
                {parkForm.photos.length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm text-gray-600">{parkForm.photos.length} photo(s) added</p>
                  </div>
                )}
              </div>

              {editingPark && (
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex items-center space-x-2 text-sm text-green-700">
                    <CheckCircle size={16} />
                    <span>This will mark {editingPark.name} as visited</span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
              <button
                onClick={() => setShowParkModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleParkSave}
                disabled={!parkForm.visitDate}
                className="px-6 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-lg transition-colors"
              >
                {editingPark?.visited ? 'Update Visit' : 'Mark as Visited'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PTO Modal */}
      {showPTOModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Add PTO</h3>
              <button
                onClick={() => setShowPTOModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <Trash2 size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  PTO Reason (optional)
                </label>
                <input
                  type="text"
                  placeholder="Vacation, Personal, etc."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                  <option value="planned">Planned</option>
                  <option value="pending">Pending Approval</option>
                  <option value="approved">Approved</option>
                  <option value="used">Used</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes (optional)
                </label>
                <textarea
                  placeholder="Additional notes..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
              <button
                onClick={() => setShowPTOModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => setShowPTOModal(false)}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
              >
                Add PTO
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Location Edit Modal */}
      {showLocationModal && editingLocation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {editingLocation.visited ? 'Edit Visit' : 'Mark as Visited'}
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  {editingLocation.name}
                  {'continent' in editingLocation ? 
                    `, ${editingLocation.continent}` : 
                    'capital' in editingLocation ? 
                      `, ${editingLocation.capital}` : 
                      `, ${editingLocation.code}`
                  }
                </p>
              </div>
              <button
                onClick={() => setShowLocationModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <Trash2 size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Visit Date
                </label>
                <input
                  type="date"
                  value={locationForm.visitDate}
                  onChange={(e) => setLocationForm({ ...locationForm, visitDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rating
                </label>
                <div className="flex items-center space-x-1 mb-2">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <button
                      key={rating}
                      onClick={() => setLocationForm({ ...locationForm, rating: rating.toString() })}
                      className={`p-1 rounded ${
                        parseInt(locationForm.rating) >= rating
                          ? 'text-yellow-400 hover:text-yellow-500'
                          : 'text-gray-300 hover:text-gray-400'
                      }`}
                    >
                      <Star size={24} className={parseInt(locationForm.rating) >= rating ? 'fill-current' : ''} />
                    </button>
                  ))}
                </div>
                <select
                  value={locationForm.rating}
                  onChange={(e) => setLocationForm({ ...locationForm, rating: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select rating</option>
                  <option value="1">1 - Poor</option>
                  <option value="2">2 - Fair</option>
                  <option value="3">3 - Good</option>
                  <option value="4">4 - Very Good</option>
                  <option value="5">5 - Excellent</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes & Memories
                </label>
                <textarea
                  value={locationForm.notes}
                  onChange={(e) => setLocationForm({ ...locationForm, notes: e.target.value })}
                  placeholder="Share your experience, favorite places, cultural insights, or travel tips..."
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Photos
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <Camera className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600 mb-2">Photo upload coming soon</p>
                  <p className="text-xs text-gray-500">Add your favorite travel photos and memories</p>
                </div>
                {locationForm.photos.length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm text-gray-600">{locationForm.photos.length} photo(s) added</p>
                  </div>
                )}
              </div>

              {editingLocation && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center space-x-2 text-sm text-blue-700">
                    <CheckCircle size={16} />
                    <span>
                      This will mark {editingLocation.name} as visited
                      {editingLocation.visited && ' and update visit details'}
                    </span>
                  </div>
                  {editingLocation.visited && (
                    <div className="mt-2">
                      <button
                        onClick={() => handleLocationUnvisit(editingLocation)}
                        className="text-sm text-red-600 hover:text-red-700 font-medium"
                      >
                        Mark as unvisited instead
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
              <button
                onClick={() => setShowLocationModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleLocationSave}
                disabled={!locationForm.visitDate}
                className="px-6 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-lg transition-colors"
              >
                {editingLocation?.visited ? 'Update Visit' : 'Mark as Visited'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}