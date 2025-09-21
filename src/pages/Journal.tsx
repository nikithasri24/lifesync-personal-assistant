import React from 'react';
import GridJournal from './GridJournal';

// The dedicated journal view reuses the grid journal experience for now.
// This keeps the UI consistent while we expand richer layouts later.
const Journal: React.FC = () => {
  return <GridJournal />;
};

export default Journal;
