/**
 * Journal Feature Module
 *
 * Public exports for the journal feature.
 */

// Pages
export { default as JournalPage } from './JournalPage';

// Container
export { JournalContainer } from './JournalContainer';

// Components
export { JournalHeader } from './components/JournalHeader';
export { JournalSearchBar } from './components/JournalSearchBar';
export { JournalEntryForm, type JournalDraft } from './components/JournalEntryForm';
export { JournalEntriesList } from './components/JournalEntriesList';
export { JournalDetailView } from './components/JournalDetailView';
export { JournalCalendarView } from './components/JournalCalendarView';
export { JournalPagination } from './components/JournalPagination';
export { JournalAttachmentList } from './components/JournalAttachmentList';
export { JournalAttachmentUpload } from './components/JournalAttachmentUpload';

// Hooks
export { useJournalFilters } from './hooks/useJournalFilters';
export { useVoiceToText } from './hooks/useVoiceToText';

// Utilities
export { sanitizeHtml } from './utils/sanitizeHtml';
