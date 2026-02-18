/**
 * AllLocationsListCard Component
 * Displays a searchable list of all locations with checkboxes for visited/unvisited
 * Supports category filtering (Mine, Partner, Both) in merged mode
 */

import React from 'react';
import { X } from 'lucide-react';
import { useThemeColors } from '@/hooks/useThemeColors';
import type { CategorizedLocation, LocationVisitCategory } from '../types';

interface AllLocationsListCardProps<T> {
  title: string;
  allItems: T[];
  visitedLocations: CategorizedLocation[];
  onToggle: (item: T, visitedByUserIds?: string[]) => void;
  getItemKey: (item: T) => string;
  getItemName: (item: T) => string;
  getVisitedKey: (location: CategorizedLocation) => string;
  currentUserId?: string;
  partnerId?: string | null;
}

export function AllLocationsListCard<T>({
  title,
  allItems,
  visitedLocations,
  onToggle,
  getItemKey,
  getItemName,
  getVisitedKey,
  currentUserId,
  partnerId,
}: AllLocationsListCardProps<T>) {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [contextMenu, setContextMenu] = React.useState<{ itemKey: string; x: number; y: number } | null>(null);

  // Filter items by search term
  const filteredItems = React.useMemo(() => {
    if (!searchTerm) return allItems;
    const lowerSearch = searchTerm.toLowerCase();
    return allItems.filter(item =>
      getItemName(item).toLowerCase().includes(lowerSearch)
    );
  }, [allItems, searchTerm, getItemName]);

  // Check if an item is visited
  const isVisited = (item: T): CategorizedLocation | undefined => {
    const itemKey = getItemKey(item);
    return visitedLocations.find(loc => getVisitedKey(loc) === itemKey);
  };

  const getCategoryStyle = (category: LocationVisitCategory) => {
    switch (category) {
      case 'mine':
        return {
          backgroundColor: '#F5EBE0',
          borderColor: '#E8D9CE',
          color: '#8B6F47',
        };
      case 'partner':
        return {
          backgroundColor: '#F3E8FF',
          borderColor: '#D8B4FE',
          color: '#7E22CE',
        };
      case 'both':
        return {
          backgroundColor: '#FCE7F3',
          borderColor: '#FBCFE8',
          color: '#BE185D',
        };
      default:
        return {
          backgroundColor: '#F9FAFB',
          borderColor: '#E5E7EB',
          color: '#374151',
        };
    }
  };

  const getCategoryBadge = (category: LocationVisitCategory) => {
    switch (category) {
      case 'mine':
        return <span className="text-xs font-medium" style={{ color: '#C18B5E' }}>Me</span>;
      case 'partner':
        return <span className="text-xs font-medium" style={{ color: '#7E22CE' }}>Partner</span>;
      case 'both':
        return <span className="text-xs font-medium" style={{ color: '#BE185D' }}>Both</span>;
      default:
        return null;
    }
  };

  const visitedCount = visitedLocations.length;
  const colors = useThemeColors();

  return (
    <div className="rounded-xl shadow-sm border p-4"
      style={{
        backgroundColor: colors.bg.white,
        borderColor: colors.border.light,
      }}
    >
      <h3 className="text-lg font-semibold mb-3" style={{ color: colors.text.primary }}>
        {title} ({visitedCount}/{allItems.length})
      </h3>

      {/* Search box */}
      <input
        type="text"
        placeholder={`Search ${title.toLowerCase()}...`}
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full px-3 py-2 mb-3 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300"
        style={{
          borderColor: colors.border.medium,
        }}
      />

      {/* List */}
      <div className="space-y-1 max-h-96 overflow-y-auto">
        {filteredItems.length === 0 ? (
          <p className="text-sm italic" style={{ color: colors.text.secondary }}>No matches found</p>
        ) : (
          filteredItems.map((item) => {
            const visitedLocation = isVisited(item);
            const visited = !!visitedLocation;
            const itemKey = getItemKey(item);
            const categoryStyle = visited ? getCategoryStyle(visitedLocation.visitCategory) : null;

            return (
              <div
                key={itemKey}
                className="group flex items-center gap-2 p-2 rounded-lg border hover:shadow-sm transition-shadow"
                style={
                  visited && categoryStyle
                    ? categoryStyle
                    : {
                        backgroundColor: colors.bg.white,
                        borderColor: colors.border.light,
                      }
                }
                onContextMenu={(e) => {
                  if (!visited && partnerId && currentUserId) {
                    e.preventDefault();
                    setContextMenu({ itemKey, x: e.clientX, y: e.clientY });
                  }
                }}
              >
                {/* Checkbox */}
                <input
                  type="checkbox"
                  checked={visited}
                  onChange={(e) => {
                    e.stopPropagation();
                    if (visited) {
                      // If already visited, toggle to remove
                      onToggle(item);
                    } else {
                      // Default: mark as "Both of Us" if partner exists, otherwise "Me Only"
                      if (partnerId && currentUserId) {
                        onToggle(item, [currentUserId, partnerId]);
                      } else {
                        onToggle(item, currentUserId ? [currentUserId] : undefined);
                      }
                    }
                  }}
                  className="h-4 w-4 text-terracotta-400 rounded focus:ring-terracotta-300 cursor-pointer"
                />

                {/* Name */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate font-medium">
                    {getItemName(item)}
                  </p>
                </div>

                {/* Remove button for visited items */}
                {visited && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggle(item);
                    }}
                    className="flex-shrink-0 p-1 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ color: colors.text.secondary }}
                    aria-label={`Remove ${getItemName(item)}`}
                  >
                    <X size={16} />
                  </button>
                )}

                {/* Category badge */}
                {visited && visitedLocation && (
                  <div className="flex-shrink-0">
                    {getCategoryBadge(visitedLocation.visitCategory)}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <>
          {/* Backdrop to close menu */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setContextMenu(null)}
          />

          {/* Menu */}
          <div
            className="fixed z-50 shadow-lg rounded-xl border py-1 min-w-[160px]"
            style={{
              left: contextMenu.x,
              top: contextMenu.y,
              backgroundColor: colors.bg.white,
              borderColor: colors.border.light,
            }}
          >
            <button
              onClick={() => {
                const item = filteredItems.find(i => getItemKey(i) === contextMenu.itemKey);
                if (item && currentUserId) {
                  onToggle(item, [currentUserId]);
                  setContextMenu(null);
                }
              }}
              className="w-full px-4 py-2 text-left text-sm hover:bg-terracotta-50 font-medium flex items-center gap-2"
              style={{ color: '#8B6F47' }}
              aria-label="Mark as visited by me only"
            >
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: '#CD9D6F' }}></span>
              Me Only
            </button>
            <button
              onClick={() => {
                const item = filteredItems.find(i => getItemKey(i) === contextMenu.itemKey);
                if (item && partnerId) {
                  onToggle(item, [partnerId]);
                  setContextMenu(null);
                }
              }}
              className="w-full px-4 py-2 text-left text-sm hover:bg-purple-50 font-medium flex items-center gap-2"
              style={{ color: '#7E22CE' }}
              aria-label="Mark as visited by partner only"
            >
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: '#A855F7' }}></span>
              Partner Only
            </button>
            <button
              onClick={() => {
                const item = filteredItems.find(i => getItemKey(i) === contextMenu.itemKey);
                if (item && currentUserId && partnerId) {
                  onToggle(item, [currentUserId, partnerId]);
                  setContextMenu(null);
                }
              }}
              className="w-full px-4 py-2 text-left text-sm hover:bg-pink-50 font-medium flex items-center gap-2"
              style={{ color: '#BE185D' }}
              aria-label="Mark as visited by both"
            >
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: '#EC4899' }}></span>
              Both of Us
            </button>
          </div>
        </>
      )}
    </div>
  );
}
