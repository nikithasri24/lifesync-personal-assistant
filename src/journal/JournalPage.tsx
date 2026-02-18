import React from 'react';
import { JournalContainer } from './JournalContainer';
import { FeatureErrorBoundary } from '../components/FeatureErrorBoundary';

/**
 * Journal Page
 *
 * Entry point for the journal feature.
 * Uses JournalContainer for the main functionality with database persistence,
 * edit functionality, delete confirmation, and search/filter capabilities.
 * Wrapped in error boundary for crash protection.
 */
const JournalPage: React.FC = () => {
  return (
    <FeatureErrorBoundary feature="Journal">
      <JournalContainer />
    </FeatureErrorBoundary>
  );
};

export default JournalPage;

