import React from 'react';
import { Users, UserPlus } from 'lucide-react';

interface SharedHeaderProps {
  onAddConnectionClick: () => void;
}

/**
 * Header for Shared/Connections page
 */
export function SharedHeader({ onAddConnectionClick }: SharedHeaderProps): React.ReactElement {
  return (
    <header className="flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 flex items-center gap-2">
          <Users className="h-6 w-6 text-indigo-600" />
          Connections & Sharing
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Connect with others and share your data with granular permissions
        </p>
      </div>
      <button
        type="button"
        onClick={onAddConnectionClick}
        className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-500"
      >
        <UserPlus className="h-4 w-4" />
        Add Connection
      </button>
    </header>
  );
}
