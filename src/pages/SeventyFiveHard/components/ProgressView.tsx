/**
 * Progress View Component
 *
 * Displays historical data, statistics, and trends for the 75 Hard challenge.
 * Shows weight charts, photo gallery, and detailed day-by-day progress.
 *
 * Features:
 * - Real-time statistics (completion rate, streak, days remaining)
 * - Weight tracking chart with trend visualization
 * - Photo gallery with clickable thumbnails
 * - Detailed day view with tasks, weight, notes, and photos
 * - Fully responsive with dark mode support
 * - Keyboard navigation (arrow keys, ESC)
 *
 * @component
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  Camera,
  Scale,
  TrendingUp,
  Calendar,
  Flame,
  CheckCircle2,
  ImageIcon
} from 'lucide-react';
import {
  _areAllTasksComplete,
  calculateStats,
  type SeventyFiveHardChallenge,
  type DailyCheckIn
} from '../../../types/seventyFiveHard';
import { MetricCard } from '../../../components/DataVisualization';

// Import sub-components
import WeightChart from './WeightChart';
import PhotoGallery from './PhotoGallery';
import DailyDetailsModal from './DailyDetailsModal';

interface ProgressViewProps {
  challenge: SeventyFiveHardChallenge;
  checkIns: DailyCheckIn[];
}

/**
 * Main Progress View Component
 * Orchestrates the display of all progress tracking features
 */
export default function ProgressView({ challenge, checkIns }: ProgressViewProps) {
  // ==================== State Management ====================

  const [selectedCheckIn, setSelectedCheckIn] = useState<DailyCheckIn | null>(null);
  const [showModal, setShowModal] = useState(false);

  // ==================== Computed Values ====================

  /**
   * Calculate comprehensive statistics using the built-in helper
   */
  const stats = useMemo(() => {
    return calculateStats(challenge, checkIns);
  }, [challenge, checkIns]);

  /**
   * Calculate additional metrics specific to progress view
   */
  const additionalMetrics = useMemo(() => {
    const photosCount = checkIns.filter(ci => ci.photo).length;
    const notesCount = checkIns.filter(ci => ci.notes && ci.notes.trim().length > 0).length;

    // Weight tracking metrics
    const weightsData = checkIns
      .filter(ci => ci.weight !== undefined && ci.weight !== null)
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    const weightChange = weightsData.length >= 2
      ? weightsData[weightsData.length - 1].weight! - weightsData[0].weight!
      : null;

    const hasWeightData = weightsData.length > 0;
    const startWeight = weightsData.length > 0 ? weightsData[0].weight : null;
    const currentWeight = weightsData.length > 0 ? weightsData[weightsData.length - 1].weight : null;

    return {
      photosCount,
      notesCount,
      weightChange,
      hasWeightData,
      startWeight,
      currentWeight,
      weightDataPoints: weightsData.length
    };
  }, [checkIns]);

  // ==================== Event Handlers ====================

  /**
   * Handle photo click - opens detail modal
   */
  const handlePhotoClick = useCallback((checkIn: DailyCheckIn) => {
    setSelectedCheckIn(checkIn);
    setShowModal(true);
  }, []);

  /**
   * Handle modal close
   */
  const handleCloseModal = useCallback(() => {
    setShowModal(false);
    setSelectedCheckIn(null);
  }, []);

  /**
   * Navigate between days in modal
   */
  const handleNavigate = useCallback((direction: 'prev' | 'next') => {
    if (!selectedCheckIn) return;

    const currentIndex = checkIns.findIndex(ci => ci.id === selectedCheckIn.id);
    if (currentIndex === -1) return;

    const newIndex = direction === 'prev' ? currentIndex + 1 : currentIndex - 1;

    if (newIndex >= 0 && newIndex < checkIns.length) {
      setSelectedCheckIn(checkIns[newIndex]);
    }
  }, [selectedCheckIn, checkIns]);

  // ==================== Empty State ====================

  if (checkIns.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4">
        <ImageIcon className="w-16 h-16 text-gray-400 dark:text-gray-600 mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          No Progress Data Yet
        </h3>
        <p className="text-gray-600 dark:text-gray-400 text-center max-w-md">
          Complete your daily tasks to start tracking your progress. Your weight charts,
          photos, and statistics will appear here.
        </p>
      </div>
    );
  }

  // ==================== Main Render ====================

  return (
    <div className="space-y-6">
      {/* Statistics Panel */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <MetricCard
          title="Days Completed"
          value={stats.totalDaysCompleted}
          icon={CheckCircle2}
          color="green"
          animated
        />

        <MetricCard
          title="Completion Rate"
          value={`${stats.completionRate}%`}
          icon={TrendingUp}
          color="blue"
          animated
        />

        <MetricCard
          title="Current Streak"
          value={stats.currentStreak}
          icon={Flame}
          color="purple"
          animated
        />

        <MetricCard
          title="Days Remaining"
          value={stats.daysRemaining}
          icon={Calendar}
          color="gray"
          animated
        />

        <MetricCard
          title="Photos"
          value={additionalMetrics.photosCount}
          icon={Camera}
          color="purple"
          animated
        />

        {additionalMetrics.weightChange !== null && (
          <MetricCard
            title="Weight Change"
            value={`${additionalMetrics.weightChange > 0 ? '+' : ''}${additionalMetrics.weightChange.toFixed(1)} kg`}
            icon={Scale}
            color={additionalMetrics.weightChange < 0 ? 'green' : 'red'}
            animated
          />
        )}
      </div>

      {/* Weight Chart */}
      <WeightChart checkIns={checkIns} />

      {/* Photo Gallery */}
      <PhotoGallery checkIns={checkIns} onPhotoClick={handlePhotoClick} />

      {/* Daily Details Modal */}
      {showModal && selectedCheckIn && (
        <DailyDetailsModal
          checkIn={selectedCheckIn}
          challenge={challenge}
          onClose={handleCloseModal}
          onNavigate={handleNavigate}
          canNavigatePrev={checkIns.findIndex(ci => ci.id === selectedCheckIn.id) < checkIns.length - 1}
          canNavigateNext={checkIns.findIndex(ci => ci.id === selectedCheckIn.id) > 0}
        />
      )}
    </div>
  );
}
