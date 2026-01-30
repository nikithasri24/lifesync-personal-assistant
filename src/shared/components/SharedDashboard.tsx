/**
 * SharedDashboard Component
 *
 * Family dashboard showing shared items from all connected users.
 * Displays meals, shopping lists, tasks, habits, and other shared data.
 */

import React, { useMemo, useState } from 'react';
import {
  Users,
  Utensils,
  ShoppingCart,
  CheckSquare,
  Target,
  BookOpen,
  FileText,
  FolderOpen,
  MapPin,
  Plane,
  Map,
  DollarSign,
  Trophy,
  Smile,
  Sparkles,
  Loader2,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import type { ConnectionWithUser, ShareableModule } from '../types/connections';
import { MODULE_CONFIGS } from '../types/connections';
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

const MODULE_ICONS: Record<ShareableModule, React.ReactNode> = {
  travel: <MapPin className="w-5 h-5" />,
  visa: <Plane className="w-5 h-5" />,
  'trip-planner': <Map className="w-5 h-5" />,
  finances: <DollarSign className="w-5 h-5" />,
  shopping: <ShoppingCart className="w-5 h-5" />,
  meals: <Utensils className="w-5 h-5" />,
  nutrition: <Utensils className="w-5 h-5" />,
  goals: <Trophy className="w-5 h-5" />,
  habits: <Target className="w-5 h-5" />,
  todos: <CheckSquare className="w-5 h-5" />,
  notes: <FileText className="w-5 h-5" />,
  projects: <FolderOpen className="w-5 h-5" />,
  journal: <BookOpen className="w-5 h-5" />,
  mood: <Smile className="w-5 h-5" />,
  skincare: <Sparkles className="w-5 h-5" />,
};

const MODULE_COLORS: Record<ShareableModule, string> = {
  meals: 'text-orange-500',
  shopping: 'text-green-500',
  todos: 'text-blue-500',
  goals: 'text-purple-500',
  habits: 'text-indigo-500',
  travel: 'text-emerald-500',
  visa: 'text-sky-500',
  'trip-planner': 'text-teal-500',
  finances: 'text-lime-500',
  nutrition: 'text-amber-500',
  notes: 'text-slate-500',
  projects: 'text-cyan-500',
  journal: 'text-rose-500',
  mood: 'text-yellow-500',
  skincare: 'text-pink-500',
};

export function SharedDashboard({ connections }: SharedDashboardProps): React.ReactElement {
  const [expandedModules, setExpandedModules] = useState<Set<ShareableModule>>(new Set(['meals', 'todos']));
  const { data: sharedData, isLoading } = useSharedDataQuery();
  const moduleSections = useMemo(() => {
    const data = sharedData ?? {};
    const availableModules = new Set(Object.keys(data) as ShareableModule[]);

    return Object.values(MODULE_CONFIGS)
      .filter((config) => availableModules.has(config.module))
      // Filter out 'goals' since they're now merged into the main Goals page
      .filter((config) => config.module !== 'goals')
      .map((config) => ({
        module: config.module,
        label: config.label,
        icon: MODULE_ICONS[config.module] ?? <Users className="w-5 h-5" />,
        color: MODULE_COLORS[config.module] ?? 'text-slate-500',
      }));
  }, [sharedData]);

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

  if (!sharedData || moduleSections.length === 0) {
    return (
      <div className="text-center py-12">
        <Users className="w-16 h-16 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
        <h3 className="text-lg font-medium text-slate-700 dark:text-slate-300 mb-2">
          No shared items yet
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
          Your connections haven't shared any items with you yet.
        </p>
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
      {moduleSections.map(({ module, label, icon, color }) => {
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
  const icon = MODULE_ICONS[module] ?? <Users className="w-5 h-5" />;
  const iconColor = MODULE_COLORS[module] ?? 'text-slate-500';

  const getTitle = (item: SharedItem): string => {
    const record = item as Record<string, unknown>;
    switch (module) {
      case 'travel':
        return (record.country_name as string) || (record.city_name as string) || (record.state_name as string) || (record.region_name as string) || (record.island_name as string) || item.title || item.name || 'Location';
      case 'visa':
        return (record.country_name as string) || item.title || item.name || 'Visa';
      case 'trip-planner':
        return (record.name as string) || item.title || 'Trip';
      case 'finances':
        return (record.description as string) || (record.merchant_name as string) || item.title || item.name || 'Transaction';
      case 'nutrition':
        return (record.custom_food_name as string) || item.title || item.name || 'Food Log';
      case 'skincare':
        return (record.name as string) || item.title || 'Skincare Item';
      case 'notes':
      case 'journal':
        return (record.title as string) || (record.content as string) || item.name || 'Entry';
      default:
        return item.title || item.name || 'Item';
    }
  };

  const getSubtitle = (item: SharedItem): string => {
    const record = item as Record<string, unknown>;
    if (module === 'shopping' && typeof record.items_count === 'number') {
      return `${item.sharedBy.name} • ${record.items_count} items`;
    }
    return `Shared by ${item.sharedBy.name}`;
  };

  return (
    <div className="space-y-2">
      {data.map((item) => (
        <div
          key={item.id}
          className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg"
        >
          <span className={`${iconColor} flex-shrink-0`}>{icon}</span>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-slate-900 dark:text-white text-sm truncate">
              {getTitle(item)}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {getSubtitle(item)}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

export default SharedDashboard;
