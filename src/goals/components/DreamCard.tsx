import React from 'react';
import { Edit3, Trash2, Sparkles, Undo2 } from 'lucide-react';
import type { LifeDream } from '../types/lifeGoals';
import { BadgeV2 } from '@/components/v2/BadgeV2';
import { useThemeColors } from '@/hooks/useThemeColors';

interface DreamCardProps {
  dream: LifeDream;
  onEdit: (dream: LifeDream) => void;
  onMarkAchieved: (dreamId: string, previousStatus: LifeDream['status']) => void;
  onUndoAchieved: (dreamId: string) => void;
  onDelete: (dreamId: string) => void;
  isPartner?: boolean;
}

/**
 * Modern dream card with emoji visual, status badge, and terracotta theme
 */
export function DreamCard({
  dream,
  onEdit,
  onMarkAchieved,
  onUndoAchieved,
  onDelete,
  isPartner = false,
}: DreamCardProps): React.ReactElement {
  const colors = useThemeColors();
  const isAchieved = dream.status === 'achieved';

  // Status badge variant mapping
  const getStatusVariant = (): 'success' | 'info' | 'warning' | 'default' => {
    switch (dream.status) {
      case 'achieved':
        return 'success';
      case 'in-progress':
        return 'warning';
      case 'planning':
        return 'info';
      case 'dreaming':
        return 'default';
      default:
        return 'default';
    }
  };
  const statusVariant = getStatusVariant();

  // Status badge label
  const getStatusLabel = (): string => {
    switch (dream.status) {
      case 'achieved':
        return '✓ Achieved';
      case 'in-progress':
        return 'In Progress';
      case 'planning':
        return 'Planning';
      case 'dreaming':
        return 'Dreaming';
      default:
        return 'Dreaming';
    }
  };
  const statusLabel = getStatusLabel();

  // Get emoji from vision board images or use default based on category
  const getEmoji = (): string => {
    const categoryEmojis: Record<string, string> = {
      travel: '✈️',
      experiences: '🎭',
      possessions: '🏠',
      achievements: '🏆',
      relationships: '❤️',
      lifestyle: '🌟',
    };
    return categoryEmojis[dream.category] || '✨';
  };

  return (
    <div
      className="dream-card rounded-2xl overflow-hidden shadow-sm transition-all hover:shadow-md"
      style={{
        backgroundColor: colors.bg.white,
        borderWidth: '1px',
        borderColor: colors.border.light,
      }}
    >
      {/* Visual Section with Emoji */}
      <div
        className="dream-visual h-36 flex items-center justify-center relative px-4"
        style={{
          background: `linear-gradient(135deg, ${colors.accent.start}15 0%, ${colors.accent.end}15 100%)`,
        }}
      >
        <div className="text-5xl">
          {getEmoji()}
        </div>
      </div>

      {/* Content Section */}
      <div className="dream-content p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3
            className="dream-title text-base font-semibold flex-1"
            style={{ color: colors.text.primary }}
          >
            {dream.title}
          </h3>
          <BadgeV2 variant={statusVariant} size="sm">
            {statusLabel}
          </BadgeV2>
        </div>

        {dream.description && (
          <p
            className="dream-description text-sm mb-3"
            style={{
              color: colors.text.secondary,
              lineHeight: '1.5',
            }}
          >
            {dream.description}
          </p>
        )}

        {/* Metadata Grid */}
        {(dream.estimatedCost || dream.estimatedTimeframe) && (
          <div className="dream-meta-grid grid grid-cols-2 gap-2 mb-3">
            {typeof dream.estimatedCost === 'number' && (
              <div className="text-xs">
                <strong style={{ color: colors.accent.end }}>Est. Cost:</strong>{' '}
                <span style={{ color: colors.text.secondary }}>
                  ${dream.estimatedCost.toLocaleString()}
                </span>
              </div>
            )}
            {dream.estimatedTimeframe && (
              <div className="text-xs">
                <strong style={{ color: colors.accent.end }}>Timeline:</strong>{' '}
                <span style={{ color: colors.text.secondary }}>
                  {dream.estimatedTimeframe}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Category Tag */}
        <div className="mb-3">
          <BadgeV2 variant="default" size="sm">
            {getEmoji()} {dream.category}
          </BadgeV2>
        </div>

        {/* Achievement Date */}
        {isAchieved && dream.achievedAt && (
          <div
            className="mb-3 text-xs font-semibold"
            style={{ color: '#059669' }}
          >
            🎉 Achieved on {new Date(dream.achievedAt).toLocaleDateString()}
          </div>
        )}

        {/* Action Buttons */}
        {!isPartner && (
          <div className="flex items-center gap-2 pt-3" style={{ borderTop: `1px solid ${colors.border.light}` }}>
            {isAchieved ? (
              <button
                type="button"
                onClick={() => onUndoAchieved(dream.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors"
                style={{
                  backgroundColor: 'rgba(251, 191, 36, 0.15)',
                  color: '#D97706',
                }}
                aria-label="Undo achievement"
              >
                <Undo2 className="h-3.5 w-3.5" />
                Undo
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onMarkAchieved(dream.id, dream.status)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors"
                style={{
                  background: `linear-gradient(135deg, ${colors.accent.start} 0%, ${colors.accent.end} 100%)`,
                  color: '#FFFFFF',
                }}
                aria-label="Mark as achieved"
              >
                <Sparkles className="h-3.5 w-3.5" />
                Achieved
              </button>
            )}
            <button
              type="button"
              onClick={() => onEdit(dream)}
              className="p-1.5 rounded-full transition-colors"
              style={{
                backgroundColor: colors.bg.secondary,
                color: colors.text.tertiary,
              }}
              aria-label="Edit dream"
            >
              <Edit3 className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onDelete(dream.id)}
              className="p-1.5 rounded-full transition-colors"
              style={{
                backgroundColor: colors.bg.secondary,
                color: colors.text.tertiary,
              }}
              aria-label="Delete dream"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
