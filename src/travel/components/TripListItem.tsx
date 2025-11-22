import React from 'react';
import { Trash2 } from 'lucide-react';
import type { Trip } from '../types/trip';

interface TripListItemProps {
  trip: Trip;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: (e: React.MouseEvent) => void;
}

const TripListItem: React.FC<TripListItemProps> = ({ trip, isSelected, onSelect, onDelete }) => {
  return (
    <div
      onClick={onSelect}
      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
        isSelected
          ? 'bg-blue-50 border-blue-300'
          : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="font-medium text-gray-900 text-sm">{trip.name}</div>
          {trip.description && (
            <div className="text-xs text-gray-600 mt-1 line-clamp-2">
              {trip.description}
            </div>
          )}
          {trip.startDate && (
            <div className="text-xs text-gray-500 mt-1">
              {new Date(trip.startDate).toLocaleDateString()}
              {trip.endDate && ` - ${new Date(trip.endDate).toLocaleDateString()}`}
            </div>
          )}
        </div>
        <button
          onClick={onDelete}
          className="text-red-600 hover:text-red-800 ml-2"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default TripListItem;
