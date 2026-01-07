import React from 'react';

type TabView = 'connections' | 'invitations' | 'add';

interface ConnectionsTabsProps {
  activeTab: TabView;
  onTabChange: (tab: TabView) => void;
  connectionsCount: number;
  invitationsCount: number;
}

/**
 * Tab navigation for connections page
 */
export function ConnectionsTabs({
  activeTab,
  onTabChange,
  connectionsCount,
  invitationsCount,
}: ConnectionsTabsProps): React.ReactElement {
  return (
    <div className="flex gap-2 border-b border-slate-200">
      <button
        type="button"
        onClick={() => onTabChange('connections')}
        className={`px-4 py-2 text-sm font-medium transition border-b-2 ${
          activeTab === 'connections'
            ? 'border-indigo-600 text-indigo-600'
            : 'border-transparent text-slate-600 hover:text-slate-900'
        }`}
      >
        Connections ({connectionsCount})
      </button>
      <button
        type="button"
        onClick={() => onTabChange('invitations')}
        className={`px-4 py-2 text-sm font-medium transition border-b-2 relative ${
          activeTab === 'invitations'
            ? 'border-indigo-600 text-indigo-600'
            : 'border-transparent text-slate-600 hover:text-slate-900'
        }`}
      >
        Invitations
        {invitationsCount > 0 && (
          <span className="absolute -top-1 -right-1 h-4 w-4 bg-orange-500 text-white text-xs rounded-full flex items-center justify-center">
            {invitationsCount}
          </span>
        )}
      </button>
      <button
        type="button"
        onClick={() => onTabChange('add')}
        className={`px-4 py-2 text-sm font-medium transition border-b-2 ${
          activeTab === 'add'
            ? 'border-indigo-600 text-indigo-600'
            : 'border-transparent text-slate-600 hover:text-slate-900'
        }`}
      >
        Add New
      </button>
    </div>
  );
}
