/**
 * Journal Container
 *
 * Updated with V2 components to match journal-design-spec.html
 * Uses React Query for server state management with automatic caching
 * Supports entries and calendar views with terracotta theme
 */

import React, { useMemo, useState, useEffect, type FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, Search, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import { logger } from '../services/logger';
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
import { SegmentedControlV2, FABV2, BadgeV2, InputV2 } from '@/components/v2';
import {
  JournalHeaderV2,
  JournalEntryCardV2,
  JournalCalendarViewV2,
  JournalEntryModalV2,
} from './components/v2';

// Pagination constant
const ENTRIES_PER_PAGE = 10;

export const JournalContainer: React.FC = () => {
  const colors = useThemeColors();

  // Tab navigation
  const { activeTab, setActiveTab } = useJournalState();

  // Pagination and selected date from Zustand
  const {
    journalSelectedDate,
    journalCurrentPage,
    setJournalSelectedDate,
    setJournalCurrentPage,
  } = useComposedStore(
    useShallow((state) => ({
      journalSelectedDate: state.journalSelectedDate,
      journalCurrentPage: state.journalCurrentPage,
      setJournalSelectedDate: state.setJournalSelectedDate,
      setJournalCurrentPage: state.setJournalCurrentPage,
    }))
  );

  // Modal state
  const [showEntryModal, setShowEntryModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);

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

  // Pagination logic
  const totalPages = Math.ceil(typedEntries.length / ENTRIES_PER_PAGE);
  const paginatedEntries = useMemo(() => {
    const startIndex = journalCurrentPage * ENTRIES_PER_PAGE;
    return typedEntries.slice(startIndex, startIndex + ENTRIES_PER_PAGE);
  }, [typedEntries, journalCurrentPage]);

  // Available tags
  const availableTags = useMemo(() => getAvailableTags(typedEntries), [typedEntries, getAvailableTags]);

  // Calculate stats
  const entriesThisMonth = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    return typedEntries.filter((entry) => {
      const entryDate = new Date(entry.created_at);
      return entryDate.getMonth() === currentMonth && entryDate.getFullYear() === currentYear;
    }).length;
  }, [typedEntries]);

  // Handle ?edit=<id> query parameter
  const [searchParams, setSearchParams] = useSearchParams();
  useEffect(() => {
    const editId = searchParams.get('edit');
    if (editId && typedEntries.length > 0 && !editingEntry) {
      const entryToEdit = typedEntries.find((e) => e.id === editId);
      if (entryToEdit) {
        setEditingEntry(entryToEdit);
        setShowEntryModal(true);
        setSearchParams({}, { replace: true });
      }
    }
  }, [searchParams, typedEntries, editingEntry, setSearchParams]);

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const handleSubmit = (data: {
    title: string;
    content: string;
    tags: string[];
    attachments?: string[];
  }) => {
    if (editingEntry) {
      updateMutation.mutate(
        {
          id: editingEntry.id,
          updates: {
            title: data.title || undefined,
            content: data.content,
            tags: data.tags,
            attachments: data.attachments || [],
          },
        },
        {
          onSuccess: () => {
            setShowEntryModal(false);
            setEditingEntry(null);
          },
        }
      );
    } else {
      createMutation.mutate(
        {
          title: data.title || undefined,
          content: data.content,
          tags: data.tags,
          attachments: data.attachments || [],
        },
        {
          onSuccess: () => {
            setShowEntryModal(false);
          },
        }
      );
    }
  };

  const handleEditEntry = (entry: JournalEntry) => {
    setEditingEntry(entry);
    setShowEntryModal(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this entry?')) {
      deleteMutation.mutate(id);
    }
  };

  // Error state
  if (error) {
    const errorMessage = error instanceof Error ? error.message : 'An error occurred';
    return (
      <div
        className="min-h-screen"
        style={{ backgroundColor: colors.bg.primary }}
      >
        <JournalHeaderV2 entriesThisMonth={0} />
        <div className="p-6">
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

  return (
    <div
      className="min-h-screen pb-24"
      style={{ backgroundColor: colors.bg.primary }}
      data-testid="journal-container"
    >
      {/* Header */}
      <JournalHeaderV2 entriesThisMonth={entriesThisMonth} />

      {/* Tab Navigation */}
      <div
        className="px-5 py-4 sticky top-0 z-10"
        style={{ backgroundColor: colors.bg.primary }}
      >
        <SegmentedControlV2
          segments={[
            { value: 'entries', label: '📄 List' },
            { value: 'calendar', label: '📅 Calendar' },
          ]}
          value={activeTab}
          onChange={(value) => setActiveTab(value as JournalTabView)}
          size="md"
        />
      </div>

      {/* Tab Content */}
      <div className="px-5">
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

            {/* Filter Toggle */}
            <div className="flex items-center justify-between mb-4">
              <button
                type="button"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold transition-colors"
                style={{
                  backgroundColor: showFilters ? 'rgba(212, 165, 116, 0.15)' : colors.bg.secondary,
                  color: showFilters ? '#C18B5E' : colors.text.primary,
                }}
              >
                <Filter className="w-4 h-4" />
                <span>Filters</span>
                {hasActiveFilters && (
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: '#C18B5E' }}
                  />
                )}
              </button>

              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="text-sm font-semibold"
                  style={{ color: '#C18B5E' }}
                >
                  Clear all
                </button>
              )}
            </div>

            {/* Tag Filters */}
            {showFilters && availableTags.length > 0 && (
              <div className="flex gap-2 flex-wrap mb-4 p-4 rounded-xl" style={{ backgroundColor: colors.bg.secondary }}>
                <div className="w-full text-xs font-semibold mb-2" style={{ color: colors.text.secondary }}>
                  Filter by tags:
                </div>
                {availableTags.map((tag) => {
                  const isSelected = selectedTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTagFilter(tag)}
                      className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
                      style={{
                        backgroundColor: isSelected ? 'rgba(212, 165, 116, 0.3)' : colors.bg.tertiary,
                        color: isSelected ? '#C18B5E' : colors.text.primary,
                        border: isSelected ? '2px solid #C18B5E' : '2px solid transparent',
                      }}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Entries List */}
            {isLoading ? (
              <div className="text-center py-12" style={{ color: colors.text.secondary }}>
                Loading entries...
              </div>
            ) : paginatedEntries.length === 0 ? (
              <div className="text-center py-20">
                <div className="text-6xl mb-4 opacity-50">📓</div>
                <h3 className="text-lg font-bold mb-2" style={{ color: colors.text.primary }}>
                  {hasActiveFilters ? 'No matching entries' : 'Start journaling'}
                </h3>
                <p className="text-sm" style={{ color: colors.text.secondary }}>
                  {hasActiveFilters
                    ? 'Try adjusting your filters'
                    : 'Capture your thoughts, memories, and daily reflections'}
                </p>
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
                    tags={entry.tags}
                    createdAt={entry.created_at}
                    attachmentCount={entry.attachments?.length || 0}
                    onClick={() => handleEditEntry(entry)}
                  />
                ))}

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-4 mt-6">
                    <button
                      type="button"
                      onClick={() => setJournalCurrentPage(Math.max(0, journalCurrentPage - 1))}
                      disabled={journalCurrentPage === 0}
                      className="w-9 h-9 rounded-lg flex items-center justify-center font-bold transition-all disabled:opacity-30"
                      style={{
                        backgroundColor: 'rgba(212, 165, 116, 0.1)',
                        color: '#C18B5E',
                      }}
                      aria-label="Previous page"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>

                    <span className="text-sm font-semibold" style={{ color: colors.text.secondary }}>
                      Page {journalCurrentPage + 1} of {totalPages}
                    </span>

                    <button
                      type="button"
                      onClick={() => setJournalCurrentPage(Math.min(totalPages - 1, journalCurrentPage + 1))}
                      disabled={journalCurrentPage >= totalPages - 1}
                      className="w-9 h-9 rounded-lg flex items-center justify-center font-bold transition-all disabled:opacity-30"
                      style={{
                        backgroundColor: 'rgba(212, 165, 116, 0.1)',
                        color: '#C18B5E',
                      }}
                      aria-label="Next page"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
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
            {selectedDate && (
              <div className="mt-6">
                <h3 className="text-lg font-bold mb-3" style={{ color: colors.text.primary }}>
                  {selectedDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </h3>

                {typedEntries
                  .filter((entry) => {
                    const entryDate = new Date(entry.created_at);
                    entryDate.setHours(0, 0, 0, 0);
                    const selected = new Date(selectedDate);
                    selected.setHours(0, 0, 0, 0);
                    return entryDate.getTime() === selected.getTime();
                  })
                  .map((entry) => (
                    <JournalEntryCardV2
                      key={entry.id}
                      id={entry.id}
                      title={entry.title}
                      content={entry.content}
                      tags={entry.tags}
                      createdAt={entry.created_at}
                      attachmentCount={entry.attachments?.length || 0}
                      onClick={() => handleEditEntry(entry)}
                    />
                  ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* FAB (Floating Action Button) */}
      <FABV2
        icon={Plus}
        onClick={() => {
          setEditingEntry(null);
          setShowEntryModal(true);
        }}
        position="bottom-right"
        size="md"
        label="New entry"
      />

      {/* Entry Modal */}
      <JournalEntryModalV2
        isOpen={showEntryModal}
        onClose={() => {
          setShowEntryModal(false);
          setEditingEntry(null);
        }}
        onSubmit={handleSubmit}
        initialData={
          editingEntry
            ? {
                title: editingEntry.title,
                content: editingEntry.content,
                tags: editingEntry.tags,
                attachments: editingEntry.attachments || [],
              }
            : undefined
        }
        isEditing={!!editingEntry}
        isPending={isSubmitting}
      />
    </div>
  );
};

export default JournalContainer;
