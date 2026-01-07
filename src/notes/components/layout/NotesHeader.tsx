import React from 'react';
import { FileText } from 'lucide-react';
import { PageHeaderV2 } from '../../../components/v2';

/**
 * Header for Notes page - V2 Design
 */
export function NotesHeader(): React.ReactElement {
  return (
    <PageHeaderV2
      title="Notes & Lists"
      subtitle="Capture quick notes or create trackable lists for movies, books, places, and more."
      icon={FileText}
    />
  );
}
