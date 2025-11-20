import React from 'react';
import GridJournalEnhanced from './GridJournalEnhanced';

// The dedicated journal view uses the enhanced grid journal with database persistence,
// edit functionality, delete confirmation, and search/filter capabilities.
const Journal: React.FC = () => {
  return <GridJournalEnhanced />;
};

export default Journal;
