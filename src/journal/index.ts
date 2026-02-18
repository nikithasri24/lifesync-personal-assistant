/**
 * Journal Feature Module
 *
 * Public exports for the journal feature.
 * Updated to export only V2 components and actively used legacy components.
 */

// Pages
export { default as JournalPage } from './JournalPage';

// Container
export { JournalContainer } from './JournalContainer';

// Components (Legacy - only actively used)
export { JournalDetailView } from './components/JournalDetailView';
export { JournalAttachmentList } from './components/JournalAttachmentList';

// V2 Components
export { JournalHeaderV2, JournalEntryCardV2, JournalCalendarViewV2, JournalEntryModalV2 } from './components/v2';

// Hooks
export { useJournalFilters } from './hooks/useJournalFilters';
export { useJournalState } from './hooks/useJournalState';
export type { JournalTabView } from './hooks/useJournalState';

// Utilities
export { sanitizeHtml } from './utils/sanitizeHtml';
