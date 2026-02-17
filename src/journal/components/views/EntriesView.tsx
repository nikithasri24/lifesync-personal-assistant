/**
 * Entries View Component
 * List of journal entries with search, filters, and pagination
 */

import React from 'react';
import type { JournalEntry } from '../../../types';
import type { JournalDraft } from '../JournalEntryForm';
import { JournalSearchBar } from '../JournalSearchBar';
import { JournalEntryForm } from '../JournalEntryForm';
import { JournalEntriesList } from '../JournalEntriesList';
import { JournalPagination } from '../JournalPagination';

interface EntriesViewProps {
  // Data
  paginatedEntries: JournalEntry[];
  isLoading: boolean;

  // Search & Filters
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  showFilters: boolean;
  setShowFilters: (show: boolean) => void;
  selectedTags: string[];
  hasActiveFilters: boolean;
  availableTags: string[];
  toggleTagFilter: (tag: string) => void;
  clearFilters: () => void;
  dateRange: { start: string; end: string } | null;
  setDateRange: (range: { start: string; end: string } | null) => void;

  // Form
  showForm: boolean;
  draft: JournalDraft;
  onDraftChange: (draft: JournalDraft) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onClear: () => void;
  onCancelEdit: () => void;
  editingId: string | null;
  isSubmitting: boolean;
  hasError: boolean;

  // Entry actions
  deleteConfirm: string | null;
  onEdit: (entry: JournalEntry) => void;
  onDeleteStart: (id: string) => void;
  onDeleteConfirm: (id: string) => void;
  onDeleteCancel: () => void;

  // Pagination
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function EntriesView({
  paginatedEntries,
  isLoading,
  searchQuery,
  setSearchQuery,
  showFilters,
  setShowFilters,
  selectedTags,
  hasActiveFilters,
  availableTags,
  toggleTagFilter,
  clearFilters,
  dateRange,
  setDateRange,
  showForm,
  draft,
  onDraftChange,
  onSubmit,
  onClear,
  onCancelEdit,
  editingId,
  isSubmitting,
  hasError,
  deleteConfirm,
  onEdit,
  onDeleteStart,
  onDeleteConfirm,
  onDeleteCancel,
  currentPage,
  totalPages,
  onPageChange,
}: EntriesViewProps) {
  return (
    <div className="flex flex-col gap-6">
      {/* Search and Filter Bar */}
      <JournalSearchBar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        showFilters={showFilters}
        setShowFilters={setShowFilters}
        selectedTags={selectedTags}
        hasActiveFilters={hasActiveFilters}
        availableTags={availableTags}
        toggleTagFilter={toggleTagFilter}
        clearFilters={clearFilters}
        dateRange={dateRange}
        setDateRange={setDateRange}
      />

      {/* Entry Form (when showForm is true or editing) */}
      {(showForm || editingId) && (
        <JournalEntryForm
          draft={draft}
          onDraftChange={onDraftChange}
          onSubmit={onSubmit}
          onClear={onClear}
          onCancelEdit={onCancelEdit}
          editingId={editingId}
          isSubmitting={isSubmitting}
          hasError={hasError}
        />
      )}

      {/* Entries List */}
      <JournalEntriesList
        entries={paginatedEntries}
        isLoading={isLoading}
        hasActiveFilters={hasActiveFilters}
        deleteConfirm={deleteConfirm}
        onEdit={onEdit}
        onDeleteStart={onDeleteStart}
        onDeleteConfirm={onDeleteConfirm}
        onDeleteCancel={onDeleteCancel}
      />

      {/* Pagination */}
      <JournalPagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={onPageChange}
      />
    </div>
  );
}
