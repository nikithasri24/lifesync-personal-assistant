/**
 * Photo Gallery Component
 *
 * Displays progress photos from the 75 Hard challenge in a grid layout.
 * Photos are clickable and open a detailed view modal.
 *
 * Features:
 * - Responsive grid layout (2-4 columns based on screen size)
 * - Photo thumbnails with day number and date overlay
 * - Click to view full details
 * - Empty state when no photos exist
 * - Loading state support
 * - Dark mode support
 *
 * @component
 */

import React from 'react';
import { Camera, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import type { DailyCheckIn } from '../../../types/seventyFiveHard';

interface PhotoGalleryProps {
  checkIns: DailyCheckIn[];
  onPhotoClick: (checkIn: DailyCheckIn) => void;
}

/**
 * Photo Gallery Component
 * Displays check-ins with photos in a responsive grid
 */
export default function PhotoGallery({ checkIns, onPhotoClick }: PhotoGalleryProps) {
  // ==================== Data Processing ====================

  /**
   * Filter check-ins that have photos and sort by date (newest first)
   */
  const photosCheckIns = checkIns
    .filter(ci => ci.photo)
    .sort((a, b) => b.date.getTime() - a.date.getTime());

  // ==================== Empty State ====================

  if (photosCheckIns.length === 0) {
    return (
      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700 p-8 text-center">
        <Camera className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-3" />
        <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-1">
          No Progress Photos Yet
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Upload photos from the Today tab to build your visual progress timeline
        </p>
      </div>
    );
  }

  // ==================== Gallery Grid ====================

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Progress Photos
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {photosCheckIns.length} {photosCheckIns.length === 1 ? 'photo' : 'photos'} uploaded
          </p>
        </div>
        <Camera className="w-8 h-8 text-purple-600" />
      </div>

      {/* Photo Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {photosCheckIns.map((checkIn) => (
          <button
            key={checkIn.id}
            onClick={() => onPhotoClick(checkIn)}
            className="relative group aspect-square rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700 transition-all duration-200 hover:ring-2 hover:ring-purple-500 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-purple-500"
            aria-label={`View photo from day ${checkIn.dayNumber}`}
          >
            {/* Photo Image */}
            <img
              src={checkIn.photo}
              alt={`Progress photo from day ${checkIn.dayNumber}`}
              className="w-full h-full object-cover"
              loading="lazy"
            />

            {/* Overlay on hover */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-200">
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <div className="text-white text-center">
                  <p className="text-sm font-medium">View Details</p>
                </div>
              </div>
            </div>

            {/* Day Number Badge */}
            <div className="absolute top-2 left-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
              Day {checkIn.dayNumber}
            </div>

            {/* Date Badge */}
            <div className="absolute bottom-2 left-2 right-2 bg-black/70 backdrop-blur-sm text-white px-2 py-1 rounded text-xs font-medium flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {format(checkIn.date, 'MMM d, yyyy')}
            </div>
          </button>
        ))}
      </div>

      {/* Photo count indicator at bottom */}
      {photosCheckIns.length > 12 && (
        <div className="mt-4 text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Showing all {photosCheckIns.length} photos
          </p>
        </div>
      )}
    </div>
  );
}
