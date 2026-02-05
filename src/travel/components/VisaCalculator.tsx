/**
 * Visa Calculator Component
 * Allows users to input their passport and visas to calculate visa-free travel access
 * Supports merged mode to show combined passport/visa data from both users
 */

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import {
  getVisaRequirement,
  getAccessibleDestinations,
  getVisaAccessSummary,
  getAvailablePassportCountries
} from '../data/visaRequirements';
import { getPassportRanking } from '../data/passportPower';
import { getAdditionalAccessFromVisas } from '../data/visaBasedAccess';
import {
  getPrimaryPassport,
  getUserVisas,
  getUserPassports,
  addPassport,
  addVisa,
  deleteVisa,
  updatePassport,
  getVisaMergedConnection
} from '../api/passportAPI';
import type { VisaRequirement, UserPassport, UserVisa } from '../types/visa';
import VisaMap from './VisaMap';

interface DestinationRequirement {
  country: string;
  requirement: VisaRequirement;
  daysAllowed?: number;
  accessVia: 'passport' | 'visa';
  visaCountry?: string;
}

const VisaCalculator: React.FC = () => {
  const [passport, setPassport] = React.useState<UserPassport | null>(null);
  const [allPassports, setAllPassports] = React.useState<UserPassport[]>([]);
  const [userVisas, setUserVisas] = React.useState<UserVisa[]>([]);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [showAddVisa, setShowAddVisa] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [currentUserId, setCurrentUserId] = React.useState<string | null>(null);

  // Add visa form state
  const [newVisaCountry, setNewVisaCountry] = React.useState('');
  const [newVisaExpiry, setNewVisaExpiry] = React.useState('');
  const [newVisaMultipleEntry, setNewVisaMultipleEntry] = React.useState(true);

  // Passport selection state (for changing passport)
  const [showPassportSelector, setShowPassportSelector] = React.useState(false);
  const [selectedPassportCountry, setSelectedPassportCountry] = React.useState('');

  // Bonus countries expansion state
  const [showAllBonus, setShowAllBonus] = React.useState(false);

  // Travel date state (shared with VisaMap)
  const [travelDate, setTravelDate] = React.useState<string>(() => {
    // Default to today
    return new Date().toISOString().split('T')[0];
  });

  // Passport owner filter state (shared with VisaMap)
  type PassportOwnerFilter = 'me' | 'partner' | 'both';
  const [passportOwnerFilter, setPassportOwnerFilter] = React.useState<PassportOwnerFilter>('me');

  const availableCountries = React.useMemo(() => getAvailablePassportCountries(), []);

  // Check for merged connection
  const { data: mergedConnection } = useQuery({
    queryKey: ['visa', 'mergedConnection'],
    queryFn: getVisaMergedConnection,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Helper to get ownership label for passports/visas
  const getOwnershipLabel = (userId: string): string => {
    if (!mergedConnection || !currentUserId) return '';
    if (userId === currentUserId) return 'Me';
    return mergedConnection.partnerName || 'Partner';
  };

  // Helper to get ownership color
  const getOwnershipColor = (userId: string): string => {
    if (!mergedConnection || !currentUserId) return '';
    if (userId === currentUserId) return 'bg-blue-100 text-blue-800';
    return 'bg-purple-100 text-purple-800';
  };

  // Load passport and visas on mount
  React.useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        // Get current user ID
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setCurrentUserId(user.id);
        }

        const [passportData, allPassportsData, visasData] = await Promise.all([
          getPrimaryPassport(),
          getUserPassports(), // Get all passports (includes partner's in merged mode)
          getUserVisas(), // Get all visas (includes partner's in merged mode)
        ]);

        setPassport(passportData);
        setAllPassports(allPassportsData);
        setUserVisas(visasData);
      } catch (error) {
        console.error('Error loading passport/visa data:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Get summary for selected passport
  const passportSummary = React.useMemo(() => {
    if (!passport) return null;
    return getVisaAccessSummary(passport.countryName);
  }, [passport]);

  // Get passport ranking
  const passportRanking = React.useMemo(() => {
    if (!passport) return null;
    return getPassportRanking(passport.countryCode);
  }, [passport]);

  // Get additional access from visas (for bonus countries section)
  // Only consider visas that are valid on the travel date AND belong to selected passport owner(s)
  const additionalAccessFromVisas = React.useMemo(() => {
    const checkDate = new Date(travelDate);

    // Filter visas by owner selection
    let filteredVisas = userVisas;
    if (mergedConnection && currentUserId) {
      if (passportOwnerFilter === 'me') {
        filteredVisas = userVisas.filter(v => v.userId === currentUserId);
      } else if (passportOwnerFilter === 'partner') {
        filteredVisas = userVisas.filter(v => v.userId === mergedConnection.partnerId);
      }
      // If 'both', use all visas (no filtering)
    }

    const validVisaCountries = filteredVisas
      .filter(v => {
        const isValid = new Date(v.expiryDate) >= checkDate;
        console.log(`[VisaCalculator] Visa ${v.countryName} (owner: ${v.userId}) expiry: ${v.expiryDate}, travel date: ${travelDate}, valid: ${isValid}, owner filter: ${passportOwnerFilter}`);
        return isValid;
      })
      .map(v => v.countryName);
    console.log(`[VisaCalculator] Valid visa countries for ${travelDate} (filter: ${passportOwnerFilter}):`, validVisaCountries);
    return getAdditionalAccessFromVisas(validVisaCountries);
  }, [userVisas, travelDate, passportOwnerFilter, mergedConnection, currentUserId]);

  // Calculate all destinations with access
  const destinationRequirements = React.useMemo((): DestinationRequirement[] => {
    if (!passport) return [];

    const results: DestinationRequirement[] = [];

    // Check if user has a valid visa for countries based on travel date
    const checkDate = new Date(travelDate);

    // Filter visas by owner selection (same logic as additionalAccessFromVisas)
    let filteredVisas = userVisas;
    if (mergedConnection && currentUserId) {
      if (passportOwnerFilter === 'me') {
        filteredVisas = userVisas.filter(v => v.userId === currentUserId);
      } else if (passportOwnerFilter === 'partner') {
        filteredVisas = userVisas.filter(v => v.userId === mergedConnection.partnerId);
      }
      // If 'both', use all visas (no filtering)
    }

    const activeVisasMap = new Map<string, { daysAllowed?: number; expiryDate: string; visaType: string }>();
    filteredVisas.forEach(visa => {
      const expiryDate = new Date(visa.expiryDate);
      if (expiryDate >= checkDate) {
        activeVisasMap.set(visa.countryName, {
          daysAllowed: visa.maxStayDays,
          expiryDate: visa.expiryDate,
          visaType: visa.visaType || 'visa',
        });
      }
    });

    // Get additional access from existing visas (H1B, Schengen, etc.)
    // Only consider visas that are valid on the travel date
    const validVisaCountries = filteredVisas
      .filter(v => new Date(v.expiryDate) >= checkDate)
      .map(v => v.countryName);
    const additionalAccess = getAdditionalAccessFromVisas(validVisaCountries);

    // Create a map of countries with visa-based access
    const visaAccessMap = new Map<string, { viaVisa: string; accessType: 'visa-free' | 'visa-on-arrival' | 'eta'; daysAllowed?: number; conditions?: string }>();
    additionalAccess.forEach(access => {
      visaAccessMap.set(access.country, {
        viaVisa: access.viaVisa,
        accessType: access.accessType,
        daysAllowed: access.daysAllowed,
        conditions: access.conditions,
      });
    });

    // Get all countries and their requirements from passport
    availableCountries.forEach(country => {
      const req = getVisaRequirement(passport.countryName, country);

      if (req) {
        // Check if user has a valid visa for this country
        const activeVisa = activeVisasMap.get(country);

        if (activeVisa) {
          // User has a valid visa for this country - show as accessible
          results.push({
            country,
            requirement: 'visa-free',
            daysAllowed: activeVisa.daysAllowed,
            accessVia: 'visa',
            visaCountry: `Valid ${activeVisa.visaType} until ${new Date(activeVisa.expiryDate).toLocaleDateString()}`,
          });
          return; // Skip other checks for this country
        }

        const visaAccess = visaAccessMap.get(country);

        // Determine if we should use visa-based access
        // Only use visa if it provides BETTER access than passport
        let shouldUseVisaAccess = false;

        if (visaAccess) {
          // Passport requires visa, but visa-holder gets visa-free/visa-on-arrival
          if (req.requirement === 'visa-required' || req.requirement === 'no-admission') {
            shouldUseVisaAccess = true;
          }
          // Both grant visa-free, but visa grants MORE days
          else if (req.requirement === 'visa-free' && visaAccess.accessType === 'visa-free') {
            const passportDays = req.daysAllowed || Infinity;
            const visaDays = visaAccess.daysAllowed || Infinity;
            shouldUseVisaAccess = visaDays > passportDays;
          }
          // Passport requires e-visa/eta, but visa grants visa-free
          else if (req.requirement === 'e-visa' || req.requirement === 'eta') {
            if (visaAccess.accessType === 'visa-free' || visaAccess.accessType === 'visa-on-arrival') {
              shouldUseVisaAccess = true;
            }
          }
          // Passport grants visa-on-arrival, but visa grants visa-free
          else if (req.requirement === 'visa-on-arrival' && visaAccess.accessType === 'visa-free') {
            shouldUseVisaAccess = true;
          }
        }

        if (shouldUseVisaAccess && visaAccess) {
          // Use visa-based access (better than passport)
          results.push({
            country,
            requirement: visaAccess.accessType,
            daysAllowed: visaAccess.daysAllowed,
            accessVia: 'visa',
            visaCountry: visaAccess.viaVisa,
          });
        } else {
          // Use passport-based access (better or equal)
          results.push({
            country,
            requirement: req.requirement,
            daysAllowed: req.daysAllowed,
            accessVia: 'passport',
            visaCountry: undefined,
          });
        }
      }
    });

    return results.sort((a, b) => a.country.localeCompare(b.country));
  }, [passport, userVisas, availableCountries, travelDate, passportOwnerFilter, mergedConnection, currentUserId]);

  // Filter destinations by search term
  const filteredDestinations = React.useMemo(() => {
    if (!searchTerm) return destinationRequirements;
    const lower = searchTerm.toLowerCase();
    return destinationRequirements.filter(d => d.country.toLowerCase().includes(lower));
  }, [destinationRequirements, searchTerm]);

  // Group destinations by requirement type
  const groupedDestinations = React.useMemo(() => {
    const groups: Record<VisaRequirement, DestinationRequirement[]> = {
      'visa-free': [],
      'visa-on-arrival': [],
      'eta': [],
      'e-visa': [],
      'visa-required': [],
      'no-admission': [],
    };

    filteredDestinations.forEach(dest => {
      groups[dest.requirement].push(dest);
    });

    return groups;
  }, [filteredDestinations]);

  const handleSetPassport = async () => {
    if (!selectedPassportCountry) return;

    try {
      const newPassport = await addPassport({
        countryCode: selectedPassportCountry.substring(0, 2).toUpperCase(),
        countryName: selectedPassportCountry,
        isPrimary: true,
      });
      setPassport(newPassport);
      setShowPassportSelector(false);
      setSelectedPassportCountry('');
    } catch (error) {
      console.error('Error adding passport:', error);
      alert('Failed to save passport. Please try again.');
    }
  };

  const handleAddVisa = async () => {
    if (!newVisaCountry || !newVisaExpiry) return;

    try {
      const newVisa = await addVisa({
        countryCode: newVisaCountry.substring(0, 2).toUpperCase(),
        countryName: newVisaCountry,
        expiryDate: newVisaExpiry,
        multipleEntry: newVisaMultipleEntry,
      });

      setUserVisas(prev => [...prev, newVisa]);
      setNewVisaCountry('');
      setNewVisaExpiry('');
      setNewVisaMultipleEntry(true);
      setShowAddVisa(false);
    } catch (error) {
      console.error('Error adding visa:', error);
      alert('Failed to save visa. Please try again.');
    }
  };

  const handleRemoveVisa = async (visaId: string) => {
    try {
      await deleteVisa(visaId);
      setUserVisas(prev => prev.filter(v => v.id !== visaId));
    } catch (error) {
      console.error('Error removing visa:', error);
      alert('Failed to remove visa. Please try again.');
    }
  };

  const getRequirementColor = (req: VisaRequirement): string => {
    switch (req) {
      case 'visa-free': return 'bg-green-100 text-green-800 border-green-300';
      case 'visa-on-arrival': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'eta': return 'bg-cyan-100 text-cyan-800 border-cyan-300';
      case 'e-visa': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'visa-required': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'no-admission': return 'bg-red-100 text-red-800 border-red-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getRequirementLabel = (req: VisaRequirement): string => {
    switch (req) {
      case 'visa-free': return 'Visa Free';
      case 'visa-on-arrival': return 'Visa on Arrival';
      case 'eta': return 'ETA Required';
      case 'e-visa': return 'E-Visa';
      case 'visa-required': return 'Visa Required';
      case 'no-admission': return 'No Admission';
      default: return req;
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent mx-auto mb-4" />
            <p className="text-gray-600">Loading your passport and visa information...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Visa-Free Travel Calculator</h1>
        <p className="text-gray-600">
          {passport ? 'Manage your passport and visas to see where you can travel' : 'Add your passport to get started'}
        </p>
      </div>

      {/* Passport Selection */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">
            {mergedConnection && allPassports.length > 1 ? 'Passports' : 'Your Passport'}
          </h2>
          {passport && !showPassportSelector && (
            <button
              onClick={() => setShowPassportSelector(true)}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              {allPassports.length > 0 ? 'Manage Passports' : 'Change Passport'}
            </button>
          )}
        </div>

        {!passport && !showPassportSelector ? (
          <button
            onClick={() => setShowPassportSelector(true)}
            className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-500 hover:text-blue-600 transition-colors"
          >
            + Add Your Passport
          </button>
        ) : showPassportSelector ? (
          <div className="max-w-md space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              Select Passport Country
            </label>
            <select
              value={selectedPassportCountry}
              onChange={(e) => setSelectedPassportCountry(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">-- Select a country --</option>
              {availableCountries.map(country => (
                <option key={country} value={country}>{country}</option>
              ))}
            </select>
            <div className="flex gap-2">
              <button
                onClick={handleSetPassport}
                disabled={!selectedPassportCountry}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Save Passport
              </button>
              {passport && (
                <button
                  onClick={() => {
                    setShowPassportSelector(false);
                    setSelectedPassportCountry('');
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        ) : (
          <>
            {/* Show all passports in merged mode, or just the primary one otherwise */}
            {mergedConnection && allPassports.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {allPassports.map((p) => {
                  const ownerLabel = getOwnershipLabel(p.userId);
                  const ownerColor = getOwnershipColor(p.userId);
                  const summary = getVisaAccessSummary(p.countryName);
                  const ranking = getPassportRanking(p.countryCode);

                  return (
                    <div key={p.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="text-4xl">{p.countryCode === 'US' ? '🇺🇸' : p.countryCode === 'IN' ? '🇮🇳' : '🌍'}</div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-gray-900">{p.countryName}</span>
                            {ownerLabel && (
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${ownerColor}`}>
                                {ownerLabel}
                              </span>
                            )}
                          </div>
                          {p.expiryDate && (
                            <div className="text-sm text-gray-600">
                              Expires: {new Date(p.expiryDate).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Mini summary for each passport */}
                      {summary && (
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="bg-green-50 rounded p-2">
                            <div className="font-bold text-green-700">{summary.visaFree}</div>
                            <div className="text-green-600">Visa Free</div>
                          </div>
                          <div className="bg-blue-50 rounded p-2">
                            <div className="font-bold text-blue-700">{summary.visaOnArrival}</div>
                            <div className="text-blue-600">On Arrival</div>
                          </div>
                        </div>
                      )}

                      {ranking && (
                        <div className="mt-2 text-xs text-gray-600">
                          Rank #{ranking.rank} globally
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              /* Single passport view for non-merged mode */
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="text-4xl">{passport?.countryCode === 'US' ? '🇺🇸' : passport?.countryCode === 'IN' ? '🇮🇳' : '🌍'}</div>
                <div>
                  <div className="font-semibold text-gray-900">{passport?.countryName}</div>
                  {passport?.expiryDate && (
                    <div className="text-sm text-gray-600">
                      Expires: {new Date(passport.expiryDate).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}

        {/* Passport Summary - Only show in non-merged mode (merged mode shows mini summaries on each card) */}
        {!mergedConnection && passportSummary && (
          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-green-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-green-700">{passportSummary.visaFree}</div>
              <div className="text-sm text-green-600">Visa Free</div>
            </div>
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-blue-700">{passportSummary.visaOnArrival}</div>
              <div className="text-sm text-blue-600">Visa on Arrival</div>
            </div>
            <div className="bg-cyan-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-cyan-700">{passportSummary.eta}</div>
              <div className="text-sm text-cyan-600">ETA Required</div>
            </div>
            <div className="bg-yellow-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-yellow-700">{passportSummary.eVisa}</div>
              <div className="text-sm text-yellow-600">E-Visa</div>
            </div>
          </div>
        )}

        {/* Passport Ranking - Only show in non-merged mode */}
        {!mergedConnection && passportRanking && (
          <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-blue-900">Passport Power Ranking</div>
                <div className="text-xs text-blue-600 mt-1">
                  {passportRanking.mobility} Mobility • {passportRanking.visaFreeScore} visa-free destinations
                </div>
              </div>
              <div className="text-3xl font-bold text-blue-700">#{passportRanking.rank}</div>
            </div>
          </div>
        )}
      </div>

      {/* Visa Map Visualization */}
      {passport && (
        <div className="mb-6">
          <VisaMap
            passportCountry={passport.countryName}
            userVisas={userVisas}
            allPassports={allPassports}
            currentUserId={currentUserId}
            mergedConnection={mergedConnection}
            travelDate={travelDate}
            onTravelDateChange={setTravelDate}
            passportOwnerFilter={passportOwnerFilter}
            onPassportOwnerFilterChange={setPassportOwnerFilter}
          />
        </div>
      )}

      {/* Existing Visas */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Your Existing Visas</h2>
          <button
            onClick={() => setShowAddVisa(!showAddVisa)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            {showAddVisa ? 'Cancel' : '+ Add Visa'}
          </button>
        </div>

        {/* Add Visa Form */}
        {showAddVisa && (
          <div className="bg-gray-50 rounded-lg p-4 mb-4 border border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                <select
                  value={newVisaCountry}
                  onChange={(e) => setNewVisaCountry(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="">-- Select country --</option>
                  {availableCountries.map(country => (
                    <option key={country} value={country}>{country}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
                <input
                  type="date"
                  value={newVisaExpiry}
                  onChange={(e) => setNewVisaExpiry(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
              <div className="flex items-end">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newVisaMultipleEntry}
                    onChange={(e) => setNewVisaMultipleEntry(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span className="text-sm text-gray-700">Multiple Entry</span>
                </label>
              </div>
            </div>
            <button
              onClick={handleAddVisa}
              disabled={!newVisaCountry || !newVisaExpiry}
              className="mt-3 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Add Visa
            </button>
          </div>
        )}

        {/* Visa List */}
        {userVisas.length === 0 ? (
          <p className="text-gray-500 text-sm">No visas added yet. Click "Add Visa" to get started.</p>
        ) : (
          <>
            <div className="space-y-2">
              {userVisas.map(visa => {
                const ownerLabel = getOwnershipLabel(visa.userId);
                const ownerColor = getOwnershipColor(visa.userId);
                const isOwnVisa = !mergedConnection || visa.userId === currentUserId;

                return (
                  <div key={visa.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="text-2xl">{visa.countryCode === 'US' ? '🇺🇸' : visa.countryCode === 'IN' ? '🇮🇳' : '🌍'}</div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900">{visa.countryName}</span>
                          {mergedConnection && ownerLabel && (
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${ownerColor}`}>
                              {ownerLabel}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-600">
                          Expires: {new Date(visa.expiryDate).toLocaleDateString()}
                          {visa.multipleEntry && ' • Multiple Entry'}
                        </div>
                      </div>
                    </div>
                    {isOwnVisa && (
                      <button
                        onClick={() => handleRemoveVisa(visa.id)}
                        className="text-red-600 hover:text-red-800 text-sm font-medium"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Bonus Access from Visas */}
            {additionalAccessFromVisas.length > 0 && (
              <div className="mt-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">✨</span>
                  <h3 className="font-semibold text-purple-900">Bonus Access from Your Visas</h3>
                </div>
                <p className="text-sm text-purple-700 mb-3">
                  Your visas grant you access to <strong>{additionalAccessFromVisas.length}</strong> additional {additionalAccessFromVisas.length === 1 ? 'country' : 'countries'}!
                </p>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                  {(showAllBonus ? additionalAccessFromVisas : additionalAccessFromVisas.slice(0, 8)).map(access => (
                    <div key={access.country} className="text-xs bg-white rounded px-2 py-1.5 border border-purple-100">
                      <div className="font-medium text-gray-900">{access.country}</div>
                      <div className="text-purple-600 text-xs">via {access.viaVisa}</div>
                      {access.daysAllowed && (
                        <div className="text-gray-600 text-xs mt-0.5">{access.daysAllowed} days</div>
                      )}
                    </div>
                  ))}
                </div>

                {additionalAccessFromVisas.length > 8 && (
                  <button
                    onClick={() => setShowAllBonus(!showAllBonus)}
                    className="mt-3 text-sm text-purple-700 hover:text-purple-900 font-medium underline"
                  >
                    {showAllBonus ? 'Show less' : `Show all ${additionalAccessFromVisas.length} countries`}
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Destination Requirements */}
      {passport && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Destination Requirements</h2>
            <input
              type="text"
              placeholder="Search countries..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Requirement Type Tabs */}
          <div className="space-y-6">
            {(['visa-free', 'visa-on-arrival', 'eta', 'e-visa', 'visa-required', 'no-admission'] as VisaRequirement[]).map(reqType => {
              const destinations = groupedDestinations[reqType];
              if (destinations.length === 0) return null;

              return (
                <div key={reqType}>
                  <div className={`flex items-center gap-2 mb-3 px-3 py-2 rounded-lg ${getRequirementColor(reqType)} border`}>
                    <h3 className="font-semibold">{getRequirementLabel(reqType)}</h3>
                    <span className="text-sm">({destinations.length})</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {destinations.map(dest => (
                      <div key={dest.country} className={`p-3 rounded-lg border ${dest.accessVia === 'visa' ? 'bg-purple-50 border-purple-200' : 'bg-gray-50 border-gray-200'}`}>
                        <div className="flex items-start justify-between">
                          <div className="font-medium text-gray-900">{dest.country}</div>
                          {dest.accessVia === 'visa' && (
                            <span className="text-xs px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded font-medium">VISA</span>
                          )}
                        </div>
                        {dest.daysAllowed && (
                          <div className="text-xs text-gray-600 mt-1">📅 Stay: {dest.daysAllowed} days</div>
                        )}
                        {dest.accessVia === 'visa' && dest.visaCountry && (
                          <div className="text-xs text-purple-700 mt-1 font-medium">
                            ✨ Via {dest.visaCountry} visa
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default VisaCalculator;
