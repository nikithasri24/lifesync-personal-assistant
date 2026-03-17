/**
 * Journal Container
 *
 * Updated with V2 components to match journal-design-spec.html
 * Uses React Query for server state management with automatic caching
 * Supports entries and calendar views with terracotta theme
 * Enhanced with Together tab UI/UX patterns
 */

import React, { useMemo, useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, Search, Filter } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import type { JournalEntry } from '../types';
import {
  useJournalEntries,
  useCreateJournalEntry,
  useUpdateJournalEntry,
  useDeleteJournalEntry,
} from '../hooks/useJournalQuery';
import { useJournalFilters } from './hooks/useJournalFilters';
import { useJournalState, type JournalTabView } from './hooks';
import { useComposedStore } from '@/stores/useComposedStore';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useModalState } from '@/hooks/useModalState';
import { useToast } from '@/hooks/useToast';
import { isSameDay } from '@/utils/dateUtils';
import { SegmentedControlV2, FABV2, InputV2 } from '@/components/v2';
import { usePagination } from '@/hooks/utilities/usePagination';
import { PaginationV2 } from '@/components/ui/PaginationV2';
import { DEFAULT_PAGE_SIZE } from '@/types/pagination';
import {
  JournalHeaderV2,
  JournalEntryCardV2,
  JournalCalendarViewV2,
  JournalEntryModalV2,
} from './components/v2';

export const JournalContainer: React.FC = () => {
  const colors = useThemeColors();
  const { showToast } = useToast();

  // Tab navigation
  const { activeTab, setActiveTab } = useJournalState();

  // Selected date from Zustand (pagination replaced with local hook)
  const {
    journalSelectedDate,
    setJournalSelectedDate,
  } = useComposedStore(
    useShallow((state) => ({
      journalSelectedDate: state.journalSelectedDate,
      setJournalSelectedDate: state.setJournalSelectedDate,
    }))
  );

  // Pagination state
  const { page, setPage, resetPage } = usePagination();

  // Modal state using useModalState hook
  const modals = useModalState({
    showForm: false,
    editingEntryId: null as string | null,
  });

  // Filter state from custom hook
  const {
    searchQuery,
    selectedTags,
    showFilters,
    hasActiveFilters,
    filters,
    setSearchQuery,
    toggleTagFilter,
    setShowFilters,
    clearFilters,
    getAvailableTags,
  } = useJournalFilters();

  // React Query hooks
  const { data: entries = [], isLoading, error } = useJournalEntries(filters);
  const createMutation = useCreateJournalEntry();
  const updateMutation = useUpdateJournalEntry();
  const deleteMutation = useDeleteJournalEntry();

  const typedEntries = entries as JournalEntry[];

  // Client-side pagination of fetched entries
  const totalEntryPages = Math.ceil(typedEntries.length / DEFAULT_PAGE_SIZE);
  const paginatedEntries = useMemo(() => {
    const startIndex = (page - 1) * DEFAULT_PAGE_SIZE;
    return typedEntries.slice(startIndex, startIndex + DEFAULT_PAGE_SIZE);
  }, [typedEntries, page]);

  // Available tags
  const availableTags = useMemo(() => getAvailableTags(typedEntries), [typedEntries, getAvailableTags]);

  // Reset to page 1 when filters change
  useEffect(() => {
    resetPage();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, selectedTags, filters?.startDate, filters?.endDate]);

  // Handle ?edit=<id> query parameter
  const [searchParams, setSearchParams] = useSearchParams();
  useEffect(() => {
    const editId = searchParams.get('edit');
    if (editId && typedEntries.length > 0 && !modals.state.editingEntryId) {
      const entryToEdit = typedEntries.find((e) => e.id === editId);
      if (entryToEdit) {
        modals.set('editingEntryId', entryToEdit.id);
        modals.open('showForm');
        setSearchParams({}, { replace: true });
      }
    }
  }, [searchParams, typedEntries, modals, setSearchParams]);

  const isSubmitting = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending;

  const handleSubmit = (data: {
    title: string;
    content: string;
  }) => {
    if (modals.state.editingEntryId) {
      // UPDATE
      updateMutation.mutate(
        {
          id: modals.state.editingEntryId,
          updates: {
            title: data.title || undefined,
            content: data.content,
          },
        },
        {
          onSuccess: () => {
            showToast('Entry updated! ✏️', 'success');
            modals.close('showForm');
            modals.set('editingEntryId', null);
          },
        }
      );
    } else {
      // CREATE
      createMutation.mutate(
        {
          title: data.title || undefined,
          content: data.content,
        },
        {
          onSuccess: () => {
            showToast('Entry created! 📔', 'success');
            modals.close('showForm');
          },
        }
      );
    }
  };

  const handleDelete = () => {
    if (modals.state.editingEntryId) {
      deleteMutation.mutate(modals.state.editingEntryId, {
        onSuccess: () => {
          showToast('Entry deleted! 🗑️', 'success');
          modals.close('showForm');
          modals.set('editingEntryId', null);
        },
      });
    }
  };

  const handleEditEntry = (entry: JournalEntry) => {
    modals.set('editingEntryId', entry.id);
    modals.open('showForm');
  };

  // Error state
  if (error) {
    const errorMessage = error instanceof Error ? error.message : 'An error occurred';
    return (
      <div style={{ backgroundColor: colors.bg.primary, minHeight: '100vh' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '1.5rem', paddingBottom: '5rem' }}>
          <JournalHeaderV2 />
          <div
            className="rounded-xl p-4 text-center"
            style={{
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              color: '#DC2626',
            }}
          >
            <p className="font-semibold">Unable to load journal entries</p>
            <p className="text-sm mt-1 opacity-80">{errorMessage}</p>
          </div>
        </div>
      </div>
    );
  }

  // Parse selected date from string
  const selectedDate = journalSelectedDate ? new Date(journalSelectedDate) : null;
  const handleSelectDate = (date: Date | null) => {
    setJournalSelectedDate(date ? date.toISOString() : null);
  };

  // Get editing entry data
  const editingEntry = modals.state.editingEntryId
    ? typedEntries.find(e => e.id === modals.state.editingEntryId)
    : null;

  return (
    <div style={{ backgroundColor: colors.bg.primary, minHeight: '100vh' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '1.5rem', paddingBottom: '5rem' }}>
        {/* Header */}
        <JournalHeaderV2
          onNewEntry={() => {
            modals.set('editingEntryId', null);
            modals.open('showForm');
          }}
        />

        {/* Tab Navigation */}
        <div className="mb-6 p-1 rounded-xl flex gap-1" style={{ backgroundColor: colors.bg.secondary }}>
          <button
            onClick={() => setActiveTab('entries')}
            className={`flex-1 px-4 py-3 rounded-lg font-semibold transition-all ${
              activeTab === 'entries' ? 'bg-white shadow-sm' : ''
            }`}
            style={{
              color: activeTab === 'entries' ? '#C18B5E' : colors.text.secondary,
            }}
            aria-label="List view"
          >
            📄 List
          </button>
          <button
            onClick={() => setActiveTab('calendar')}
            className={`flex-1 px-4 py-3 rounded-lg font-semibold transition-all ${
              activeTab === 'calendar' ? 'bg-white shadow-sm' : ''
            }`}
            style={{
              color: activeTab === 'calendar' ? '#C18B5E' : colors.text.secondary,
            }}
            aria-label="Calendar view"
          >
            📅 Calendar
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'entries' && (
          <div>
            {/* Search Bar */}
            <div className="mb-4 relative">
              <Search
                className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4"
                style={{ color: colors.text.tertiary }}
              />
              <InputV2
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search entries..."
                className="pl-11"
              />
            </div>

            {/* Entries List */}
            {isLoading ? (
              <div className="text-center py-12" style={{ color: colors.text.secondary }}>
                Loading entries...
              </div>
            ) : paginatedEntries.length === 0 ? (
              <div
                className="p-8 rounded-xl border-2 border-dashed text-center"
                style={{ borderColor: colors.border.medium }}
              >
                <div className="text-4xl mb-3">📓</div>
                <p className="font-medium mb-2" style={{ color: colors.text.primary }}>
                  {hasActiveFilters ? 'No matching entries' : 'Start journaling'}
                </p>
                <p className="text-sm mb-4" style={{ color: colors.text.secondary }}>
                  {hasActiveFilters
                    ? 'Try adjusting your filters'
                    : 'Capture your thoughts, memories, and daily reflections'}
                </p>
                {!hasActiveFilters && (
                  <button
                    onClick={() => {
                      modals.set('editingEntryId', null);
                      modals.open('showForm');
                    }}
                    className="px-4 py-2 rounded-lg font-semibold text-white"
                    style={{ background: 'linear-gradient(135deg, #D4A574 0%, #C18B5E 100%)' }}
                  >
                    Write First Entry
                  </button>
                )}
              </div>
            ) : (
              <>
                <div className="mb-4">
                  <h2 className="text-lg font-bold" style={{ color: colors.text.primary }}>
                    Recent Entries ({typedEntries.length})
                  </h2>
                </div>

                {paginatedEntries.map((entry) => (
                  <JournalEntryCardV2
                    key={entry.id}
                    id={entry.id}
                    title={entry.title}
                    content={entry.content}
                    tags={[]}
                    createdAt={entry.createdAt}
                    attachmentCount={entry.attachments?.length || 0}
                    onClick={() => handleEditEntry(entry)}
                  />
                ))}

                {/* Pagination */}
                {totalEntryPages > 1 && (
                  <PaginationV2
                    currentPage={page}
                    totalPages={totalEntryPages}
                    totalItems={typedEntries.length}
                    pageSize={DEFAULT_PAGE_SIZE}
                    onPageChange={setPage}
                  />
                )}
              </>
            )}
          </div>
        )}

        {activeTab === 'calendar' && (
          <div>
            <JournalCalendarViewV2
              entries={typedEntries}
              selectedDate={selectedDate}
              onSelectDate={handleSelectDate}
            />

            {/* Selected Date Entries */}
            {selectedDate && (() => {
              const selectedEntries = typedEntries.filter((entry) =>
                isSameDay(entry.createdAt, selectedDate)
              );

              return (
                <div>
                  <h3 className="text-lg font-bold mb-4" style={{ color: colors.text.primary }}>
                    {selectedDate.toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </h3>

                  {selectedEntries.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="text-5xl mb-3 opacity-50">📅</div>
                      <p className="text-sm font-semibold mb-1" style={{ color: colors.text.primary }}>
                        No entries on this date
                      </p>
                      <p className="text-xs" style={{ color: colors.text.secondary }}>
                        Click the + button to create one
                      </p>
                    </div>
                  ) : (
                    selectedEntries.map((entry) => (
                      <JournalEntryCardV2
                        key={entry.id}
                        id={entry.id}
                        title={entry.title}
                        content={entry.content}
                        tags={[]}
                        createdAt={entry.createdAt}
                        attachmentCount={entry.attachments?.length || 0}
                        onClick={() => handleEditEntry(entry)}
                      />
                    ))
                  )}
                </div>
              );
            })()}
          </div>
        )}

        {/* FAB (Floating Action Button) */}
        <button
          onClick={() => {
            modals.set('editingEntryId', null);
            modals.open('showForm');
          }}
          className="fixed w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-white text-2xl transition-transform active:scale-95"
          style={{
            bottom: '88px',
            right: '24px',
            background: 'linear-gradient(135deg, #D4A574 0%, #C18B5E 100%)',
            boxShadow: '0 4px 16px rgba(193, 139, 94, 0.4)',
            zIndex: 50,
          }}
          aria-label="Create new entry"
        >
          +
        </button>

        {/* Entry Modal */}
        <JournalEntryModalV2
          isOpen={modals.state.showForm}
          onClose={() => {
            modals.close('showForm');
            modals.set('editingEntryId', null);
          }}
          onSubmit={handleSubmit}
          onDelete={handleDelete}
          initialData={
            editingEntry
              ? {
                  title: editingEntry.title,
                  content: editingEntry.content,
                  attachments: editingEntry.attachments || [],
                }
              : undefined
          }
          isEditing={!!modals.state.editingEntryId}
          isPending={isSubmitting}
        />
      </div>
    </div>
  );
};

export default JournalContainer;
