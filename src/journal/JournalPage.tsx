import React from 'react';
import { JournalContainer } from './JournalContainer';

/**
 * Journal Page
 * 
 * Entry point for the journal feature.
 * Uses JournalContainer for the main functionality with database persistence,
 * edit functionality, delete confirmation, and search/filter capabilities.
 */
const JournalPage: React.FC = () => {
  return <JournalContainer />;
};

export default JournalPage;

