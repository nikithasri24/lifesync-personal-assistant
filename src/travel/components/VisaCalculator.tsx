/**
 * Visa Calculator Component
 * Allows users to input their passport and visas to calculate visa-free travel access
 * Supports merged mode to show combined passport/visa data from both users
 */

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { logger } from '../../services/logger';
import { supabase } from '../../lib/supabase';
import { useToast } from '@/hooks/useToast';
import ConfirmDialog from '../../components/DebtPayoffCalculator/ConfirmDialog';
import {
  getVisaRequirement,
  getAccessibleDestinations,
  getVisaAccessSummary,
  getAvailablePassportCountries
} from '../api/visaRequirementsAPI';
import { useAvailablePassportCountries, usePassportVisaData, useVisaAccessSummary } from '../hooks/useVisaRequirements';
import { getPassportRanking } from '../data/passportPower';
import { getAdditionalAccessFromVisas } from '../data/visaBasedAccess';
import {
  getPrimaryPassport,
  getUserVisas,
  getUserPassports,
  addPassport,
  addVisa,
  deleteVisa,
  deletePassport,
  updatePassport,
  updateVisa,
  getVisaMergedConnection
} from '../api/passportAPI';
import type { VisaRequirement, UserPassport, UserVisa } from '../types/visa';
import VisaMap from './VisaMap';
import PassportEditor from './PassportEditor';
import VisaEditor from './VisaEditor';
import { PassportSummaryCard } from './PassportSummaryCard';
import { VisaItemCardV2, VisaFormModalV2 } from './v2';

interface DestinationRequirement {
  country: string;
  requirement: VisaRequirement;
  daysAllowed?: number;
  accessVia: 'passport' | 'visa';
  visaCountry?: string;
}

const VisaCalculator: React.FC = () => {
  const { showToast } = useToast();
  const [passport, setPassport] = React.useState<UserPassport | null>(null);
  const [allPassports, setAllPassports] = React.useState<UserPassport[]>([]);
  const [userVisas, setUserVisas] = React.useState<UserVisa[]>([]);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [loading, setLoading] = React.useState(true);
  const [currentUserId, setCurrentUserId] = React.useState<string | null>(null);

  // Modal state
  const [isPassportEditorOpen, setIsPassportEditorOpen] = React.useState(false);
  const [editingPassport, setEditingPassport] = React.useState<UserPassport | undefined>(undefined);
  const [isVisaEditorOpen, setIsVisaEditorOpen] = React.useState(false);
  const [editingVisa, setEditingVisa] = React.useState<UserVisa | undefined>(undefined);
  const [passportToDelete, setPassportToDelete] = React.useState<string | null>(null);

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

  // State for visa deletion confirmation
  const [visaToDelete, setVisaToDelete] = React.useState<string | null>(null);

  // Use hook to get available passport countries
  const { data: availableCountries = [] } = useAvailablePassportCountries();

  // Fetch all visa data for the selected passport (cached by React Query)
  const { data: passportVisaData = {} } = usePassportVisaData(passport?.countryName || '');

  // Use hook for passport summary
  const { data: passportSummaryData } = useVisaAccessSummary(passport?.countryName || '');

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
        logger.error('Travel', error instanceof Error ? error : new Error(String(error)), { context: 'loadPassportVisaData' });
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Get summary for selected passport (from hook data)
  const passportSummary = passportSummaryData || null;

  // Get passport ranking
  const passportRanking = React.useMemo(() => {
    if (!passport) return null;
    return getPassportRanking(passport.countryCode);
  }, [passport?.id, passport?.countryCode]);

  // Filter visas by owner selection and validity (computed once, used in multiple places)
  const { filteredVisas, validVisas, validVisaCountries } = React.useMemo(() => {
    const checkDate = new Date(travelDate);

    // Filter by owner selection
    let ownerFiltered = userVisas;
    if (mergedConnection && currentUserId) {
      if (passportOwnerFilter === 'me') {
        ownerFiltered = userVisas.filter(v => v.userId === currentUserId);
      } else if (passportOwnerFilter === 'partner') {
        ownerFiltered = userVisas.filter(v => v.userId === mergedConnection.partnerId);
      }
      // If 'both', use all visas (no filtering)
    }

    // Filter by validity
    const valid = ownerFiltered.filter(v => new Date(v.expiryDate) >= checkDate);

    const countries = valid.map(v => v.countryName);

    return {
      filteredVisas: ownerFiltered,
      validVisas: valid,
      validVisaCountries: countries,
    };
  }, [userVisas, travelDate, passportOwnerFilter, mergedConnection, currentUserId]);

  // Get additional access from visas (for bonus countries section)
  const additionalAccessFromVisas = React.useMemo(() => {
    return getAdditionalAccessFromVisas(validVisaCountries);
  }, [validVisaCountries]);

  // Calculate all destinations with access
  const destinationRequirements = React.useMemo((): DestinationRequirement[] => {
    if (!passport) return [];

    const results: DestinationRequirement[] = [];
    const checkDate = new Date(travelDate);

    // Use pre-filtered visas from above (no need to filter again)
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
    // Use pre-computed additionalAccessFromVisas (already filtered for validity)

    // Create a map of countries with visa-based access
    const visaAccessMap = new Map<string, { viaVisa: string; accessType: 'visa-free' | 'visa-on-arrival' | 'eta'; daysAllowed?: number; conditions?: string }>();
    additionalAccessFromVisas.forEach(access => {
      visaAccessMap.set(access.country, {
        viaVisa: access.viaVisa,
        accessType: access.accessType,
        daysAllowed: access.daysAllowed,
        conditions: access.conditions,
      });
    });

    // Get all countries and their requirements from passport (use cached data)
    availableCountries.forEach(country => {
      const req = passportVisaData[country];

      if (!req) {
        // Skip countries without data (expected for some pairs)
        return;
        return; // Skip this country gracefully
      }

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

  // Passport handlers
  const handleCreatePassport = () => {
    setEditingPassport(undefined);
    setIsPassportEditorOpen(true);
  };

  const handleEditPassport = (passport: UserPassport) => {
    logger.debug('Travel', 'Opening passport editor', { passportId: passport.id });
    setEditingPassport(passport);
    setIsPassportEditorOpen(true);
  };

  const handleSavePassport = async (updates: Partial<UserPassport>) => {
    try {
      if (editingPassport) {
        // Edit mode
        const updated = await updatePassport(editingPassport.id, updates);
        setAllPassports(prev => prev.map(p => p.id === updated.id ? updated : p));
        if (updated.isPrimary) setPassport(updated);
        logger.info('Travel', 'Passport updated', { passportId: updated.id });
        showToast('Passport updated successfully', 'success');
      } else {
        // Create mode
        const newPassport = await addPassport({
          countryCode: updates.countryCode!,
          countryName: updates.countryName!,
          passportNumber: updates.passportNumber,
          issueDate: updates.issueDate,
          expiryDate: updates.expiryDate,
          isPrimary: updates.isPrimary ?? true,
        });
        setAllPassports(prev => [...prev, newPassport]);
        if (newPassport.isPrimary) setPassport(newPassport);
        logger.info('Travel', 'Passport created', { passportId: newPassport.id });
        showToast('Passport added successfully', 'success');
      }
      setIsPassportEditorOpen(false);
      setEditingPassport(undefined);
    } catch (error) {
      logger.error('Travel', error instanceof Error ? error : new Error(String(error)), { context: 'savePassport' });
      showToast('Failed to save passport. Please try again.', 'error');
    }
  };

  const handleDeletePassport = async (passportId: string) => {
    try {
      await deletePassport(passportId);
      setAllPassports(prev => prev.filter(p => p.id !== passportId));
      // If deleted passport was primary, set another as primary or clear
      if (passport?.id === passportId) {
        const newPrimary = allPassports.find(p => p.id !== passportId);
        setPassport(newPrimary || null);
      }
      setPassportToDelete(null);
      logger.info('Travel', 'Passport deleted', { passportId });
      showToast('Passport deleted successfully', 'success');
    } catch (error) {
      logger.error('Travel', error instanceof Error ? error : new Error(String(error)), { context: 'deletePassport' });
      showToast('Failed to delete passport. Please try again.', 'error');
    }
  };

  const handleSetPrimaryPassport = async (passportId: string) => {
    try {
      const updated = await updatePassport(passportId, { isPrimary: true });
      setAllPassports(prev => prev.map(p => p.id === updated.id ? updated : p));
      setPassport(updated);
      logger.info('Travel', 'Primary passport updated', { passportId });
      showToast('Primary passport updated successfully', 'success');
    } catch (error) {
      logger.error('Travel', error instanceof Error ? error : new Error(String(error)), { context: 'setPrimaryPassport' });
      showToast('Failed to set primary passport. Please try again.', 'error');
    }
  };

  // Visa handlers
  const handleCreateVisa = () => {
    setEditingVisa(undefined);
    setIsVisaEditorOpen(true);
  };

  const handleEditVisa = (visa: UserVisa) => {
    logger.debug('Travel', 'Opening visa editor', { visaId: visa.id });
    setEditingVisa(visa);
    setIsVisaEditorOpen(true);
  };

  const handleSaveVisa = async (updates: Partial<UserVisa>) => {
    try {
      if (editingVisa) {
        // Edit mode
        const updated = await updateVisa(editingVisa.id, updates);
        setUserVisas(prev => prev.map(v => v.id === updated.id ? updated : v));
        logger.info('Travel', 'Visa updated', { visaId: updated.id });
        showToast('Visa updated successfully', 'success');
      } else {
        // Create mode
        const newVisa = await addVisa({
          countryCode: updates.countryCode!,
          countryName: updates.countryName!,
          visaType: updates.visaType || '',
          issueDate: updates.issueDate,
          expiryDate: updates.expiryDate!,
          multipleEntry: updates.multipleEntry ?? true,
          maxStayDays: updates.maxStayDays,
          notes: updates.notes,
        });
        setUserVisas(prev => [...prev, newVisa]);
        logger.info('Travel', 'Visa created', { visaId: newVisa.id });
        showToast('Visa added successfully', 'success');
      }
      setIsVisaEditorOpen(false);
      setEditingVisa(undefined);
    } catch (error) {
      logger.error('Travel', error instanceof Error ? error : new Error(String(error)), { context: 'saveVisa' });
      showToast('Failed to save visa. Please try again.', 'error');
    }
  };

  const handleDeleteVisa = async (visaId: string) => {
    try {
      await deleteVisa(visaId);
      setUserVisas(prev => prev.filter(v => v.id !== visaId));
      setVisaToDelete(null);
      logger.info('Travel', 'Visa deleted', { visaId });
      showToast('Visa deleted successfully', 'success');
    } catch (error) {
      logger.error('Travel', error instanceof Error ? error : new Error(String(error)), { context: 'deleteVisa' });
      showToast('Failed to delete visa. Please try again.', 'error');
    }
  };

  const handleRemoveVisa = handleDeleteVisa; // Keep for backward compatibility

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
          <button
            onClick={handleCreatePassport}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            + Add Passport
          </button>
        </div>

        {!passport && allPassports.length === 0 ? (
          <button
            onClick={handleCreatePassport}
            className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-[#CD9D6F] hover:text-[#C18B5E] transition-colors"
          >
            + Add Your Passport
          </button>
        ) : (
          <>
            {/* Show all passports in merged mode, or just the primary one otherwise */}
            {mergedConnection && allPassports.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {allPassports.map((p) => (
                  <PassportSummaryCard
                    key={p.id}
                    passport={p}
                    ownerLabel={getOwnershipLabel(p.userId)}
                    ownerColor={getOwnershipColor(p.userId)}
                    currentUserId={currentUserId}
                    onEdit={handleEditPassport}
                    onSetPrimary={handleSetPrimaryPassport}
                    onDelete={setPassportToDelete}
                  />
                ))}
              </div>
            ) : (
              /* Single passport view for non-merged mode */
              <div>
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="text-4xl">{passport?.countryCode === 'US' ? '🇺🇸' : passport?.countryCode === 'IN' ? '🇮🇳' : '🌍'}</div>
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900">{passport?.countryName}</div>
                    {passport?.expiryDate && (
                      <div className="text-sm text-gray-600">
                        Expires: {new Date(passport.expiryDate).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                  {passport && currentUserId && passport.userId === currentUserId && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditPassport(passport)}
                        className="text-sm text-[#C18B5E] hover:text-[#8B6F47] font-medium"
                        aria-label={`Edit ${passport.countryName} passport`}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setPassportToDelete(passport.id)}
                        className="text-sm text-red-600 hover:text-red-700 font-medium"
                        aria-label={`Delete ${passport.countryName} passport`}
                      >
                        Delete
                      </button>
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
            <div className="bg-[#F5EBE0] rounded-lg p-4">
              <div className="text-2xl font-bold text-[#8B6F47]">{passportSummary.visaOnArrival}</div>
              <div className="text-sm text-[#C18B5E]">Visa on Arrival</div>
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
          <div className="mt-4 p-4 bg-[#F5EBE0] rounded-lg border border-[#E8D9CE]">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-[#8B6F47]">Passport Power Ranking</div>
                <div className="text-xs text-[#C18B5E] mt-1">
                  {passportRanking.mobility} Mobility • {passportRanking.visaFreeScore} visa-free destinations
                </div>
              </div>
              <div className="text-3xl font-bold text-[#8B6F47]">#{passportRanking.rank}</div>
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
            onClick={handleCreateVisa}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            + Add Visa
          </button>
        </div>

        {/* Visa List */}
        {userVisas.length === 0 ? (
          <p className="text-gray-500 text-sm">No visas added yet. Click "Add Visa" to get started.</p>
        ) : (
          <>
            <div className="space-y-2">
              {userVisas.map(visa => {
                // Get country flag
                const getCountryFlag = (countryCode: string): string => {
                  const flagMap: Record<string, string> = {
                    'US': '🇺🇸', 'GB': '🇬🇧', 'JP': '🇯🇵', 'FR': '🇫🇷', 'DE': '🇩🇪',
                    'IT': '🇮🇹', 'ES': '🇪🇸', 'CA': '🇨🇦', 'AU': '🇦🇺', 'NZ': '🇳🇿',
                    'CN': '🇨🇳', 'IN': '🇮🇳', 'BR': '🇧🇷', 'MX': '🇲🇽', 'ZA': '🇿🇦',
                    'AE': '🇦🇪', 'SG': '🇸🇬', 'TH': '🇹🇭', 'KR': '🇰🇷', 'RU': '🇷🇺',
                  };
                  return flagMap[countryCode] || '🌍';
                };

                return (
                  <VisaItemCardV2
                    key={visa.id}
                    country={visa.countryName}
                    flag={getCountryFlag(visa.countryCode)}
                    visaType={visa.visaType || 'visa'}
                    issueDate={visa.issueDate}
                    expiryDate={visa.expiryDate}
                    onClick={() => handleEditVisa(visa)}
                  />
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
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#CD9D6F] focus:border-blue-500"
            />
          </div>

          {/* Requirement Type Tabs */}
          <div className="space-y-6">
            {filteredDestinations.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <p className="text-lg mb-2">No destination data available</p>
                <p className="text-sm">Try a different search term or check back later.</p>
              </div>
            ) : (
              (['visa-free', 'visa-on-arrival', 'eta', 'e-visa', 'visa-required', 'no-admission'] as VisaRequirement[]).map(reqType => {
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
              })
            )}
          </div>
        </div>
      )}

      {/* Passport Editor Modal */}
      <PassportEditor
        isOpen={isPassportEditorOpen}
        onClose={() => {
          setIsPassportEditorOpen(false);
          setEditingPassport(undefined);
        }}
        onSave={handleSavePassport}
        onDelete={handleDeletePassport}
        passport={editingPassport}
        availableCountries={availableCountries}
      />

      {/* Visa Editor Modal - V2 */}
      <VisaFormModalV2
        isOpen={isVisaEditorOpen}
        onClose={() => {
          setIsVisaEditorOpen(false);
          setEditingVisa(undefined);
        }}
        visa={editingVisa ? {
          id: editingVisa.id,
          country: editingVisa.countryCode,
          visaType: (editingVisa.visaType || 'tourist') as any,
          issueDate: editingVisa.issueDate,
          expiryDate: editingVisa.expiryDate,
          visaNumber: editingVisa.visaNumber,
          entryType: editingVisa.multipleEntry ? 'multiple' : 'single',
          notes: editingVisa.notes,
        } : undefined}
        isEditing={!!editingVisa}
        onSubmit={handleSaveVisa}
      />

      {/* Passport deletion confirmation dialog */}
      {passportToDelete && (
        <ConfirmDialog
          title="Delete Passport"
          message="Are you sure you want to delete this passport? This action cannot be undone."
          onConfirm={() => {
            handleDeletePassport(passportToDelete);
          }}
          onCancel={() => setPassportToDelete(null)}
        />
      )}

      {/* Visa deletion confirmation dialog */}
      {visaToDelete && (
        <ConfirmDialog
          title="Remove Visa"
          message="Are you sure you want to remove this visa? This action cannot be undone."
          onConfirm={() => {
            handleRemoveVisa(visaToDelete);
            setVisaToDelete(null);
          }}
          onCancel={() => setVisaToDelete(null)}
        />
      )}
    </div>
  );
};

export default VisaCalculator;
