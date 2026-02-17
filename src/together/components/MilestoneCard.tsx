/**
 * Milestone Card Component
 * Displays individual milestone with countdown and details
 */

import React from 'react';
import type { Milestone } from '../types';
import { MILESTONE_TYPE_ICONS } from '../types';
import {
  getCountdownText,
  getNextOccurrence,
  formatDateLong,
  getAgeText,
  getAnniversaryText,
} from '../utils/dateHelpers';
import { useThemeColors } from '@/hooks/useThemeColors';

interface MilestoneCardProps {
  milestone: Milestone;
  isPast?: boolean;
  onEdit: () => void;
}

export const MilestoneCard: React.FC<MilestoneCardProps> = ({
  milestone,
  isPast = false,
  onEdit,
}) => {
  const colors = useThemeColors();

  const icon = MILESTONE_TYPE_ICONS[milestone.milestone_type];
  const nextDate = milestone.recurring
    ? getNextOccurrence(milestone.milestone_date, true)
    : milestone.milestone_date;

  const countdownText = getCountdownText(nextDate);
  const dateText = formatDateLong(nextDate);

  // Special text for birthdays and anniversaries
  let specialText = '';
  if (milestone.milestone_type === 'birthday' && !isPast) {
    specialText = getAgeText(milestone.milestone_date);
  } else if (milestone.milestone_type === 'anniversary' && !isPast) {
    const { years, details } = getAnniversaryText(milestone.milestone_date);
    specialText = `${years}\n${details}`;
  }

  const bgColor = isPast ? colors.bg.secondary : colors.bg.white;
  const countdownColor = isPast ? colors.text.tertiary : '#D4A574';

  return (
    <div
      className="p-5 rounded-xl border hover:shadow-md transition-shadow cursor-pointer"
      style={{
        backgroundColor: bgColor,
        borderColor: colors.border.light,
      }}
      onClick={onEdit}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{icon}</span>
          <div>
            <h3 className="text-lg font-bold" style={{ color: colors.text.primary }}>
              {milestone.title}
            </h3>
            <p className="text-sm" style={{ color: colors.text.secondary }}>
              {dateText}
            </p>
          </div>
        </div>
        <div className="text-right">
          <div
            className="px-3 py-1 rounded-full"
            style={{ backgroundColor: countdownColor }}
          >
            <span className="text-white text-sm font-bold">{countdownText}</span>
          </div>
        </div>
      </div>

      {specialText && (
        <p
          className="mb-3 whitespace-pre-line"
          style={{ color: colors.text.primary }}
        >
          {specialText.split('\n').map((line, i) => (
            <span key={i} className={i === 0 ? 'font-semibold' : 'text-sm'}>
              {line}
              {i < specialText.split('\n').length - 1 && <br />}
            </span>
          ))}
        </p>
      )}

      {milestone.photo_urls && milestone.photo_urls.length > 0 && (
        <div className="flex items-center gap-2 text-sm" style={{ color: colors.text.secondary }}>
          <span>📷</span>
          <span>{milestone.photo_urls.length} photos</span>
        </div>
      )}
    </div>
  );
};
