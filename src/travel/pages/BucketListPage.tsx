/**
 * BucketListPage - Manage dream travel destinations
 * Following Together pattern with V2 components
 */

import React, { useState, useEffect } from 'react';
import { Plus, MapPin } from 'lucide-react';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useToast } from '@/hooks/useToast';
import { useCurrentUserId, useMergedConnection, usePartnerName } from '@/hooks/useOwnerInfo';
import { usePagination } from '@/hooks/utilities/usePagination';
import { PaginationV2 } from '@/components/ui/PaginationV2';
import { DEFAULT_PAGE_SIZE } from '@/types/pagination';
import { logger } from '@/services/logger';
import {
  useBucketListDestinations,
  useCreateBucketListDestination,
  useUpdateBucketListDestination,
  useDeleteBucketListDestination,
  useMarkDestinationAsVisited,
  useMarkDestinationAsNotVisited,
} from '../hooks/useBucketListQuery';
import {
  BucketListDestinationCardV2,
  BucketListFormModalV2,
  type BucketListFormData,
} from '../components/v2';
import type { CategorizedBucketListDestination, BucketListCategory_Ownership } from '../types';

type FilterView = 'all' | 'wishlist' | 'visited';

const BucketListPage: React.FC = () => {
  const colors = useThemeColors();
  const { showToast } = useToast();

  // Modal state
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingDestination, setEditingDestination] = useState<CategorizedBucketListDestination | undefined>();

  // Filter state
  const [filterView, setFilterView] = useState<FilterView>('wishlist');
  const [ownershipFilter, setOwnershipFilter] = useState<BucketListCategory_Ownership | 'all'>('all');

  // Pagination
  const { page, setPage, resetPage } = usePagination();
  useEffect(() => { resetPage(); }, [filterView, ownershipFilter, resetPage]);

  // User info
  const { data: currentUserId } = useCurrentUserId();
  const { data: mergedConnection } = useMergedConnection('travel');
  const { data: partnerName } = usePartnerName('travel');
  const partnerId = mergedConnection?.partnerId ?? null;

  // Data & mutations
  const { data: destinations = [], isLoading } = useBucketListDestinations();
  const createMutation = useCreateBucketListDestination();
  const updateMutation = useUpdateBucketListDestination();
  const deleteMutation = useDeleteBucketListDestination();
  const markVisitedMutation = useMarkDestinationAsVisited();
  const markNotVisitedMutation = useMarkDestinationAsNotVisited();

  // Filter destinations
  const filteredDestinations = React.useMemo(() => {
    let filtered = destinations;

    // Filter by visited status
    if (filterView === 'wishlist') {
      filtered = filtered.filter(d => !d.isVisited);
    } else if (filterView === 'visited') {
      filtered = filtered.filter(d => d.isVisited);
    }

    // Filter by ownership
    if (ownershipFilter !== 'all') {
      filtered = filtered.filter(d => d.ownershipCategory === ownershipFilter);
    }

    return filtered;
  }, [destinations, filterView, ownershipFilter]);

  // Count by ownership
  const ownershipCounts = React.useMemo(() => {
    const wishlist = destinations.filter(d => !d.isVisited);
    return {
      all: wishlist.length,
      mine: wishlist.filter(d => d.ownershipCategory === 'mine').length,
      partner: wishlist.filter(d => d.ownershipCategory === 'partner').length,
      shared: wishlist.filter(d => d.ownershipCategory === 'shared').length,
    };
  }, [destinations]);

  const visitedCount = destinations.filter(d => d.isVisited).length;

  // Handlers
  const handleAdd = () => {
    setEditingDestination(undefined);
    setShowFormModal(true);
  };

  const handleEdit = (destination: CategorizedBucketListDestination) => {
    setEditingDestination(destination);
    setShowFormModal(true);
  };

  const handleSubmit = async (data: Partial<BucketListFormData>) => {
    try {
      if (editingDestination) {
        // Update existing
        await updateMutation.mutateAsync({
          id: editingDestination.id,
          updates: data,
        });
        showToast('Destination updated! 🗺️', 'success');
      } else {
        // Create new
        await createMutation.mutateAsync({
          input: data as any,
          sharedWith: partnerId && currentUserId ? [partnerId] : undefined,
        });
        showToast('Added to bucket list! ✈️', 'success');
      }
      setShowFormModal(false);
      setEditingDestination(undefined);
    } catch (error) {
      logger.error('Travel', error as Error, { context: 'save bucket list destination' });
      showToast('Failed to save destination. Please try again.', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Remove this destination from your bucket list?')) return;

    try {
      await deleteMutation.mutateAsync(id);
      showToast('Destination removed', 'success');
    } catch (error) {
      logger.error('Travel', error as Error, { context: 'delete bucket list destination' });
      showToast('Failed to delete destination', 'error');
    }
  };

  const handleToggleVisited = async (destination: CategorizedBucketListDestination) => {
    try {
      if (destination.isVisited) {
        await markNotVisitedMutation.mutateAsync(destination.id);
        showToast('Moved back to bucket list', 'success');
      } else {
        await markVisitedMutation.mutateAsync(destination.id);
        showToast('Marked as visited! 🎉', 'success');
      }
    } catch (error) {
      logger.error('Travel', error as Error, { context: 'toggle visited status' });
      showToast('Failed to update status', 'error');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Filter tabs skeleton */}
        <div className="h-12 bg-gray-200 rounded-xl animate-pulse" />

        {/* Cards skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-64 bg-gray-200 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Filter Tabs - Wishlist / All / Visited */}
      <div className="mb-6 p-1 rounded-xl flex gap-1" style={{ backgroundColor: colors.bg.secondary }}>
        <button
          onClick={() => setFilterView('wishlist')}
          className={`flex-1 px-4 py-3 rounded-lg font-semibold transition-all ${
            filterView === 'wishlist' ? 'bg-white shadow-sm' : ''
          }`}
          style={{
            color: filterView === 'wishlist' ? colors.accent.end : colors.text.secondary,
          }}
          aria-label="Show wishlist"
        >
          Bucket List ({ownershipCounts.all})
        </button>
        <button
          onClick={() => setFilterView('all')}
          className={`flex-1 px-4 py-3 rounded-lg font-semibold transition-all ${
            filterView === 'all' ? 'bg-white shadow-sm' : ''
          }`}
          style={{
            color: filterView === 'all' ? colors.accent.end : colors.text.secondary,
          }}
          aria-label="Show all destinations"
        >
          All ({destinations.length})
        </button>
        <button
          onClick={() => setFilterView('visited')}
          className={`flex-1 px-4 py-3 rounded-lg font-semibold transition-all ${
            filterView === 'visited' ? 'bg-white shadow-sm' : ''
          }`}
          style={{
            color: filterView === 'visited' ? colors.accent.end : colors.text.secondary,
          }}
          aria-label="Show visited destinations"
        >
          Visited ({visitedCount})
        </button>
      </div>

      {/* Ownership filter (if merged mode) */}
      {mergedConnection && filterView === 'wishlist' && (
        <div className="mb-6 p-1 rounded-xl flex gap-1" style={{ backgroundColor: colors.bg.secondary }}>
          <button
            onClick={() => setOwnershipFilter('all')}
            className={`flex-1 px-4 py-2 rounded-lg font-semibold transition-all text-sm ${
              ownershipFilter === 'all' ? 'bg-white shadow-sm' : ''
            }`}
            style={{
              color: ownershipFilter === 'all' ? colors.accent.end : colors.text.secondary,
            }}
          >
            All ({ownershipCounts.all})
          </button>
          <button
            onClick={() => setOwnershipFilter('mine')}
            className={`flex-1 px-4 py-2 rounded-lg font-semibold transition-all text-sm ${
              ownershipFilter === 'mine' ? 'bg-white shadow-sm' : ''
            }`}
            style={{
              color: ownershipFilter === 'mine' ? colors.accent.end : colors.text.secondary,
            }}
          >
            Mine ({ownershipCounts.mine})
          </button>
          <button
            onClick={() => setOwnershipFilter('partner')}
            className={`flex-1 px-4 py-2 rounded-lg font-semibold transition-all text-sm ${
              ownershipFilter === 'partner' ? 'bg-white shadow-sm' : ''
            }`}
            style={{
              color: ownershipFilter === 'partner' ? colors.accent.end : colors.text.secondary,
            }}
          >
            {partnerName || 'Partner'} ({ownershipCounts.partner})
          </button>
          <button
            onClick={() => setOwnershipFilter('shared')}
            className={`flex-1 px-4 py-2 rounded-lg font-semibold transition-all text-sm ${
              ownershipFilter === 'shared' ? 'bg-white shadow-sm' : ''
            }`}
            style={{
              color: ownershipFilter === 'shared' ? colors.accent.end : colors.text.secondary,
            }}
          >
            Shared ({ownershipCounts.shared})
          </button>
        </div>
      )}

      {/* Add button */}
      <button
        onClick={handleAdd}
        className="w-full mb-6 transition-all hover:opacity-90"
        style={{
          padding: '12px',
          background: 'linear-gradient(135deg, #D4A574 0%, #C18B5E 100%)',
          border: 'none',
          borderRadius: '12px',
          fontSize: '14px',
          fontWeight: '600',
          color: 'white',
          cursor: 'pointer',
        }}
      >
        + Add Dream Destination
      </button>

      {/* Destinations grid */}
      {filteredDestinations.length === 0 ? (
        <div
          className="p-8 rounded-xl border-2 border-dashed text-center"
          style={{ borderColor: colors.border.medium }}
        >
          <div className="text-4xl mb-3">
            {filterView === 'visited' ? '✈️' : '🗺️'}
          </div>
          <p className="font-medium mb-2" style={{ color: colors.text.primary }}>
            {filterView === 'visited' ? 'No destinations visited yet' : 'No bucket list destinations yet'}
          </p>
          <p className="text-sm mb-4" style={{ color: colors.text.secondary }}>
            {filterView === 'visited'
              ? 'Mark destinations as visited when you complete them!'
              : 'Add your dream destinations to start planning your adventures'}
          </p>
          {filterView !== 'visited' && (
            <button
              onClick={handleAdd}
              className="px-4 py-2 rounded-lg font-semibold text-white"
              style={{
                background: 'linear-gradient(135deg, #D4A574 0%, #C18B5E 100%)',
              }}
            >
              Add First Destination
            </button>
          )}
        </div>
      ) : (
        <>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDestinations.slice((page - 1) * DEFAULT_PAGE_SIZE, page * DEFAULT_PAGE_SIZE).map((destination) => {
            const isOwnDestination = destination.userId === currentUserId;
            const ownerDisplayName =
              destination.ownershipCategory === 'mine'
                ? 'Me'
                : destination.ownershipCategory === 'partner'
                ? partnerName || 'Partner'
                : 'Shared';

            return (
              <BucketListDestinationCardV2
                key={destination.id}
                id={destination.id}
                name={destination.name}
                description={destination.description}
                countryName={destination.countryName}
                cityName={destination.cityName}
                priority={destination.priority}
                category={destination.category}
                estimatedBudget={destination.estimatedBudget}
                currency={destination.currency}
                targetYear={destination.targetYear}
                targetSeason={destination.targetSeason}
                isVisited={destination.isVisited}
                mustDo={destination.mustDo}
                onClick={() => handleEdit(destination)}
                showOwnerBadge={!!mergedConnection}
                owner={{
                  isOwner: isOwnDestination,
                  displayName: ownerDisplayName,
                }}
              />
            );
          })}
        </div>
        {filteredDestinations.length > DEFAULT_PAGE_SIZE && (
          <PaginationV2
            currentPage={page}
            totalPages={Math.ceil(filteredDestinations.length / DEFAULT_PAGE_SIZE)}
            totalItems={filteredDestinations.length}
            pageSize={DEFAULT_PAGE_SIZE}
            onPageChange={setPage}
          />
        )}
        </>
      )}

      {/* Form Modal */}
      <BucketListFormModalV2
        isOpen={showFormModal}
        onClose={() => {
          setShowFormModal(false);
          setEditingDestination(undefined);
        }}
        destination={
          editingDestination
            ? {
                id: editingDestination.id,
                name: editingDestination.name,
                description: editingDestination.description,
                countryName: editingDestination.countryName,
                cityName: editingDestination.cityName,
                priority: editingDestination.priority,
                category: editingDestination.category,
                estimatedBudget: editingDestination.estimatedBudget,
                currency: editingDestination.currency,
                targetYear: editingDestination.targetYear,
                targetSeason: editingDestination.targetSeason,
                isVisited: editingDestination.isVisited,
                visitedDate: editingDestination.visitedDate,
                notes: editingDestination.notes,
                inspirationUrl: editingDestination.inspirationUrl,
                tags: editingDestination.tags,
                mustDo: editingDestination.mustDo,
                mustEat: editingDestination.mustEat,
                mustSee: editingDestination.mustSee,
              }
            : undefined
        }
        isEditing={!!editingDestination}
        onSubmit={handleSubmit}
        isPending={createMutation.isPending || updateMutation.isPending}
      />
    </div>
  );
};

export default BucketListPage;
