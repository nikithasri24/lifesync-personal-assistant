/**
 * Food Log Item Component
 * Displays a single food log entry with nutrition info
 */

import React from 'react';
import { Trash2, Sparkles, ImageIcon } from 'lucide-react';
import type { FoodLogEntry } from '@/api/nutritionAPI';

interface FoodLogItemProps {
  entry: FoodLogEntry;
  onDelete?: (id: string) => void;
}

export function FoodLogItem({ entry, onDelete }: FoodLogItemProps): React.ReactElement {
  const displayName = entry.custom_food_name || 'Food item';

  return (
    <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-100 hover:border-gray-200 transition-colors">
      {/* Image thumbnail or placeholder */}
      {entry.image_url ? (
        <img
          src={entry.image_url}
          alt={displayName}
          className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
        />
      ) : (
        <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
          <ImageIcon className="w-5 h-5 text-gray-400" />
        </div>
      )}

      {/* Food info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-900 truncate">{displayName}</span>
          {entry.ai_analyzed && (
            <span className="flex items-center gap-1 px-1.5 py-0.5 text-xs font-medium text-purple-700 bg-purple-50 rounded-full">
              <Sparkles className="w-3 h-3" />
              AI
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span>{entry.quantity}x</span>
          <span>•</span>
          <span>{entry.calories} cal</span>
          {entry.ai_confidence && (
            <>
              <span>•</span>
              <span>{Math.round(entry.ai_confidence * 100)}% confident</span>
            </>
          )}
        </div>
      </div>

      {/* Macros */}
      <div className="hidden sm:flex items-center gap-3 text-xs text-gray-600">
        <div className="text-center">
          <div className="font-semibold text-gray-900">{Math.round(entry.protein_g)}g</div>
          <div>Protein</div>
        </div>
        <div className="text-center">
          <div className="font-semibold text-gray-900">{Math.round(entry.carbs_g)}g</div>
          <div>Carbs</div>
        </div>
        <div className="text-center">
          <div className="font-semibold text-gray-900">{Math.round(entry.fat_g)}g</div>
          <div>Fat</div>
        </div>
      </div>

      {/* Delete button */}
      {onDelete && (
        <button
          onClick={() => onDelete(entry.id)}
          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
          title="Delete entry"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

