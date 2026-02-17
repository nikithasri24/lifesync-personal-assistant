/**
 * TasksHeaderV2 Component
 * Page header with terracotta gradient title and iOS-style design
 */

import React from 'react';
import { Search, Filter } from 'lucide-react';
import { useThemeColors } from '../../../hooks/useThemeColors';
import { gradients } from '../../../styles/colors';

export interface TasksHeaderV2Props {
  title: string;
  subtitle: string;
  onSearchClick?: () => void;
  onFilterClick?: () => void;
  className?: string;
}

export const TasksHeaderV2: React.FC<TasksHeaderV2Props> = ({
  title,
  subtitle,
  onSearchClick,
  onFilterClick,
  className = '',
}) => {
  const colors = useThemeColors();

  return (
    <div
      className={`sticky top-0 z-10 px-5 py-4 pb-3 ${className}`}
      style={{
        backgroundColor: colors.bg.white,
        boxShadow: '0 1px 3px rgba(139, 111, 71, 0.08)',
      }}
    >
      <div className="relative">
        <h1
          className="text-3xl font-bold mb-1"
          style={{
            background: gradients.text,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          {title}
        </h1>
        <p
          className="text-sm"
          style={{ color: colors.text.tertiary }}
        >
          {subtitle}
        </p>

        {/* Header Action Buttons */}
        <div className="absolute top-0 right-0 flex gap-3">
          {onSearchClick && (
            <button
              type="button"
              onClick={onSearchClick}
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:scale-105"
              style={{ backgroundColor: colors.badge.bg }}
              aria-label="Search tasks"
            >
              <Search className="w-4 h-4" style={{ color: colors.badge.text }} />
            </button>
          )}
          {onFilterClick && (
            <button
              type="button"
              onClick={onFilterClick}
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:scale-105"
              style={{ backgroundColor: colors.badge.bg }}
              aria-label="Filter tasks"
            >
              <Filter className="w-4 h-4" style={{ color: colors.badge.text }} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TasksHeaderV2;
