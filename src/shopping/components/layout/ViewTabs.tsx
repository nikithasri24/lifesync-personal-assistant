/**
 * View Tabs Component
 * Navigation tabs for switching between different shopping views
 */

import React from 'react';
import { FileText, Shuffle, Store, Package } from 'lucide-react';
import type { ViewType } from '../../types/forms';

interface ViewTabsProps {
  activeView: ViewType;
  totalMasterItems: number;
  storeListsCount: number;
  onViewChange: (view: ViewType) => void;
}

export function ViewTabs({ activeView, totalMasterItems, storeListsCount, onViewChange }: ViewTabsProps) {
  return (
    <div className="border-b">
      <div className="flex space-x-1 p-1">
          <button
            onClick={() => onViewChange('master')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeView === 'master'
                ? 'bg-blue-100 text-blue-700'
                : 'text-black hover:bg-gray-100'
            }`}
          >
            <div className="flex items-center space-x-2">
              <FileText size={16} />
              <span>Master List</span>
              <span className="text-xs bg-gray-200 px-2 py-1 rounded-full">
                {totalMasterItems}
              </span>
            </div>
          </button>
          <button
            onClick={() => onViewChange('distribute')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeView === 'distribute'
                ? 'bg-blue-100 text-blue-700'
                : 'text-black hover:bg-gray-100'
            }`}
          >
            <div className="flex items-center space-x-2">
              <Shuffle size={16} />
              <span>Distribute</span>
            </div>
          </button>
          <button
            onClick={() => onViewChange('stores')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeView === 'stores'
                ? 'bg-blue-100 text-blue-700'
                : 'text-black hover:bg-gray-100'
            }`}
          >
            <div className="flex items-center space-x-2">
              <Store size={16} />
              <span>Store Lists</span>
              <span className="text-xs bg-gray-200 px-2 py-1 rounded-full">
                {storeListsCount}
              </span>
            </div>
          </button>
          <button
            onClick={() => onViewChange('pantry')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeView === 'pantry'
                ? 'bg-blue-100 text-blue-700'
                : 'text-black hover:bg-gray-100'
            }`}
          >
            <div className="flex items-center space-x-2">
              <Package size={16} />
              <span>Pantry</span>
            </div>
          </button>
        </div>
      </div>
  );
}
