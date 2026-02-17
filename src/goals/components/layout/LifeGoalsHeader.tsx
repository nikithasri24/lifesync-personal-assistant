import React from 'react';
import { Plus, Sparkles, Lightbulb } from 'lucide-react';
import { useThemeColors } from '@/hooks/useThemeColors';

interface LifeGoalsHeaderProps {
  onShowTemplates: () => void;
  onNewGoal: () => void;
  onNewDream: () => void;
}

/**
 * Header for Goals & Dreams page with terracotta gradient theme
 */
export function LifeGoalsHeader({
  onShowTemplates,
  onNewGoal,
  onNewDream,
}: LifeGoalsHeaderProps): React.ReactElement {
  const colors = useThemeColors();

  return (
    <header
      className="rounded-2xl p-6 mb-6"
      style={{
        background: `linear-gradient(135deg, ${colors.accent.start} 0%, ${colors.accent.end} 100%)`,
      }}
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">🎯 Life Goals</h1>
          <p className="text-sm text-white/90">Track your aspirations and celebrate achievements</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onShowTemplates}
            className="inline-flex items-center gap-2 rounded-full bg-white/20 backdrop-blur-sm px-4 py-2 text-sm font-medium text-white transition hover:bg-white/30"
            aria-label="Browse goal templates"
          >
            <Lightbulb className="h-4 w-4" />
            Templates
          </button>
          <button
            type="button"
            onClick={onNewGoal}
            className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold transition hover:bg-white/90"
            style={{ color: colors.text.primary }}
            aria-label="Create new goal"
          >
            <Plus className="h-4 w-4" />
            New Goal
          </button>
          <button
            type="button"
            onClick={onNewDream}
            className="inline-flex items-center gap-2 rounded-full bg-white/20 backdrop-blur-sm px-4 py-2 text-sm font-medium text-white transition hover:bg-white/30"
            aria-label="Create new dream"
          >
            <Sparkles className="h-4 w-4" />
            New Dream
          </button>
        </div>
      </div>
    </header>
  );
}
