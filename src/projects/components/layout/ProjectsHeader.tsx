import React from 'react';
import { useThemeColors } from '@/hooks/useThemeColors';

interface ProjectsHeaderProps {
  stats: {
    total: number;
    active: number;
    completed: number;
    onHold: number;
  };
  onCreateClick: () => void;
}

/**
 * Header for Projects page with terracotta gradient theme and stats
 */
export function ProjectsHeader({
  stats,
  onCreateClick,
}: ProjectsHeaderProps): React.ReactElement {
  const colors = useThemeColors();

  return (
    <header
      className="rounded-2xl p-6 mb-6"
      style={{
        background: `linear-gradient(135deg, ${colors.accent.start} 0%, ${colors.accent.end} 100%)`,
      }}
    >
      <h1 className="text-3xl font-bold text-white mb-4">📋 Projects</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-3">
        <div
          className="rounded-xl p-3 text-center backdrop-blur-sm"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
          }}
        >
          <div className="text-2xl font-bold text-white">{stats.total}</div>
          <div className="text-xs text-white/90">Total</div>
        </div>
        <div
          className="rounded-xl p-3 text-center backdrop-blur-sm"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
          }}
        >
          <div className="text-2xl font-bold text-white">{stats.active}</div>
          <div className="text-xs text-white/90">Active</div>
        </div>
        <div
          className="rounded-xl p-3 text-center backdrop-blur-sm"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
          }}
        >
          <div className="text-2xl font-bold text-white">
            {stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}%
          </div>
          <div className="text-xs text-white/90">Done</div>
        </div>
      </div>
    </header>
  );
}
