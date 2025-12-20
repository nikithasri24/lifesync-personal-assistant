/**
 * SharedDashboard Component
 *
 * Family dashboard showing shared items from all connected users.
 * Displays meals, shopping lists, tasks, habits, and other shared data.
 */

import React, { useState } from 'react';
import {
  Users,
  Utensils,
  ShoppingCart,
  CheckSquare,
  Target,
  Calendar,
  Loader2,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import type { ConnectionWithUser, ShareableModule } from '../types/connections';
import { useSharedDataQuery } from '../hooks/useSharedDataQuery';

interface SharedDashboardProps {
  connections: ConnectionWithUser[];
}

interface ModuleSection {
  module: ShareableModule;
  label: string;
  icon: React.ReactNode;
  color: string;
}

const VISIBLE_MODULES: ModuleSection[] = [
  { module: 'meals', label: 'Meal Plans', icon: <Utensils className="w-5 h-5" />, color: 'text-orange-500' },
  { module: 'shopping', label: 'Shopping Lists', icon: <ShoppingCart className="w-5 h-5" />, color: 'text-green-500' },
  { module: 'todos', label: 'Tasks', icon: <CheckSquare className="w-5 h-5" />, color: 'text-blue-500' },
  { module: 'goals', label: 'Goals', icon: <Target className="w-5 h-5" />, color: 'text-purple-500' },
  { module: 'habits', label: 'Habits', icon: <Calendar className="w-5 h-5" />, color: 'text-indigo-500' },
];

export function SharedDashboard({ connections }: SharedDashboardProps): React.ReactElement {
  const [expandedModules, setExpandedModules] = useState<Set<ShareableModule>>(new Set(['meals', 'todos']));
  const { data: sharedData, isLoading } = useSharedDataQuery();

  const toggleModule = (module: ShareableModule) => {
    setExpandedModules(prev => {
      const next = new Set(prev);
      if (next.has(module)) {
        next.delete(module);
      } else {
        next.add(module);
      }
      return next;
    });
  };

  if (connections.length === 0) {
    return (
      <div className="text-center py-12">
        <Users className="w-16 h-16 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
        <h3 className="text-lg font-medium text-slate-700 dark:text-slate-300 mb-2">
          No shared data yet
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
          Connect with family or friends and configure sharing permissions to see their shared data here.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        <span className="ml-3 text-slate-600 dark:text-slate-400">Loading shared data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {connections.slice(0, 4).map((conn) => (
          <div
            key={conn.id}
            className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700"
          >
            <div className="flex items-center gap-3">
              {conn.otherUser.avatarUrl ? (
                <img
                  src={conn.otherUser.avatarUrl}
                  alt={conn.otherUser.fullName || 'User'}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-medium">
                  {(conn.otherUser.fullName || conn.otherUser.email || '?')[0].toUpperCase()}
                </div>
              )}
              <div className="min-w-0">
                <p className="font-medium text-slate-900 dark:text-white text-sm truncate">
                  {conn.myLabel || conn.otherUser.fullName || conn.otherUser.email?.split('@')[0]}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">
                  {conn.relationship}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Module sections */}
      {VISIBLE_MODULES.map(({ module, label, icon, color }) => {
        const isExpanded = expandedModules.has(module);
        const moduleData = sharedData?.[module] || [];

        return (
          <div
            key={module}
            className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden"
          >
            <button
              onClick={() => toggleModule(module)}
              className="w-full flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className={color}>{icon}</span>
                <span className="font-semibold text-slate-900 dark:text-white">{label}</span>
                <span className="text-xs px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 rounded-full">
                  {moduleData.length} shared
                </span>
              </div>
              {isExpanded ? (
                <ChevronDown className="w-5 h-5 text-slate-400" />
              ) : (
                <ChevronRight className="w-5 h-5 text-slate-400" />
              )}
            </button>

            {isExpanded && (
              <div className="border-t border-slate-200 dark:border-slate-700 p-4">
                {moduleData.length === 0 ? (
                  <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">
                    No shared {label.toLowerCase()} from your connections
                  </p>
                ) : (
                  <SharedModuleContent module={module} data={moduleData} />
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// Shared item type that includes the owner's info
interface SharedItem {
  id: string;
  name?: string;
  title?: string;
  description?: string;
  sharedBy: {
    id: string;
    name: string;
    avatarUrl?: string;
  };
  createdAt?: string;
  [key: string]: unknown;
}

interface SharedModuleContentProps {
  module: ShareableModule;
  data: SharedItem[];
}

function SharedModuleContent({ module, data }: SharedModuleContentProps): React.ReactElement {
  // Render different layouts based on module type
  switch (module) {
    case 'meals':
      return (
        <div className="grid gap-3 sm:grid-cols-2">
          {data.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg"
            >
              <Utensils className="w-5 h-5 text-orange-500 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-900 dark:text-white text-sm truncate">
                  {item.name || item.title || 'Meal'}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Shared by {item.sharedBy.name}
                </p>
              </div>
            </div>
          ))}
        </div>
      );

    case 'shopping':
      return (
        <div className="space-y-2">
          {data.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg"
            >
              <ShoppingCart className="w-5 h-5 text-green-500 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-900 dark:text-white text-sm truncate">
                  {item.name || 'Shopping List'}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {item.sharedBy.name} • {(item as SharedItem & { items_count?: number }).items_count || 0} items
                </p>
              </div>
            </div>
          ))}
        </div>
      );

    case 'todos':
      return (
        <div className="space-y-2">
          {data.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg"
            >
              <CheckSquare className="w-5 h-5 text-blue-500 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-900 dark:text-white text-sm truncate">
                  {item.title || item.name || 'Task'}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Assigned by {item.sharedBy.name}
                </p>
              </div>
            </div>
          ))}
        </div>
      );

    case 'goals':
      return (
        <div className="space-y-2">
          {data.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg"
            >
              <Target className="w-5 h-5 text-purple-500 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-900 dark:text-white text-sm truncate">
                  {item.title || item.name || 'Goal'}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {item.sharedBy.name}
                </p>
              </div>
            </div>
          ))}
        </div>
      );

    default:
      return (
        <div className="space-y-2">
          {data.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg"
            >
              <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-900 dark:text-white text-sm truncate">
                  {item.title || item.name || 'Item'}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Shared by {item.sharedBy.name}
                </p>
              </div>
            </div>
          ))}
        </div>
      );
  }
}

export default SharedDashboard;

