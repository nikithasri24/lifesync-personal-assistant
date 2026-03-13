/**
 * CommandCenterV2
 *
 * Replaces the static BriefingCardV2 with three live, cross-module sections:
 *
 *   🔴 URGENT  — PredictionService high/medium predictions (bills, streaks, deadlines)
 *   💡 INSIGHTS — Budget overruns with cross-module action suggestions
 *   📊 SNAPSHOT — Net worth delta, goals on track, habit completion trend
 *
 * Each section degrades gracefully when data is unavailable.
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, ChevronRight, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useThemeColors } from '@/hooks/useThemeColors';
import { usePredictionsQuery } from '@/hooks/usePredictionsQuery';
import { useDashboardSnapshot } from '@/dashboard/hooks/useDashboardSnapshot';
import type { Prediction } from '@/services/ai/PredictionService';
import type { BudgetOverrun } from '@/dashboard/hooks/useDashboardSnapshot';

// ── Helpers ───────────────────────────────────────────────────────────────

function formatCurrency(n: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}

function predictionEmoji(type: Prediction['type']): string {
  const map: Record<string, string> = {
    bill_due: '💳',
    streak_at_risk: '🔥',
    goal_deadline: '🎯',
    busy_period: '📅',
    birthday_upcoming: '🎂',
    low_energy_predicted: '😴',
    routine_reminder: '⏰',
  };
  return map[type] ?? '⚠️';
}

function predictionRoute(prediction: Prediction): string {
  const routes: Record<string, string> = {
    bill_due: '/finances',
    streak_at_risk: '/habits',
    goal_deadline: '/goals',
    busy_period: '/calendar',
    birthday_upcoming: '/together',
  };
  return routes[prediction.type] ?? '/';
}

// ── Sub-components ────────────────────────────────────────────────────────

interface PredictionRowProps {
  prediction: Prediction;
  onNavigate: (route: string) => void;
}

const PredictionRow: React.FC<PredictionRowProps> = ({ prediction, onNavigate }) => {
  const colors = useThemeColors();
  const isHigh = prediction.priority === 'high';

  return (
    <button
      type="button"
      onClick={() => onNavigate(predictionRoute(prediction))}
      className="w-full flex items-start gap-3 py-2.5 text-left transition-colors hover:bg-gray-50 rounded-lg px-2 -mx-2"
      aria-label={prediction.title}
    >
      <span className="text-lg flex-shrink-0 mt-0.5">{predictionEmoji(prediction.type)}</span>
      <div className="flex-1 min-w-0">
        <p
          className="text-sm font-semibold"
          style={{ color: isHigh ? '#DC2626' : colors.text.primary }}
        >
          {prediction.title}
        </p>
        <p className="text-xs mt-0.5" style={{ color: colors.text.secondary }}>
          {prediction.message}
        </p>
      </div>
      <ChevronRight className="w-4 h-4 flex-shrink-0 mt-1" style={{ color: colors.text.tertiary }} />
    </button>
  );
};

interface BudgetOverrunRowProps {
  overrun: BudgetOverrun;
  onNavigate: (route: string) => void;
}

const BudgetOverrunRow: React.FC<BudgetOverrunRowProps> = ({ overrun, onNavigate }) => {
  const colors = useThemeColors();

  return (
    <div className="py-2.5">
      <div className="flex items-start gap-3">
        <span className="text-lg flex-shrink-0 mt-0.5">💰</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold" style={{ color: colors.text.primary }}>
            {overrun.categoryName} over budget by {formatCurrency(overrun.overage)}
          </p>
          <p className="text-xs mt-0.5" style={{ color: colors.text.secondary }}>
            Spent {formatCurrency(overrun.spent)} of {formatCurrency(overrun.limit)} budget this month
          </p>
          {overrun.isGrocery && (
            <button
              type="button"
              onClick={() => onNavigate('/shopping')}
              className="mt-1.5 inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full transition-colors"
              style={{ backgroundColor: 'rgba(212,165,116,0.15)', color: '#C18B5E' }}
              aria-label="View shopping list for budget savings"
            >
              🛒 Review shopping list to save
            </button>
          )}
          {!overrun.isGrocery && (
            <button
              type="button"
              onClick={() => onNavigate('/finances')}
              className="mt-1.5 inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full transition-colors"
              style={{ backgroundColor: 'rgba(212,165,116,0.15)', color: '#C18B5E' }}
              aria-label="View finance budgets"
            >
              📊 View budget breakdown
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// ── Main Component ────────────────────────────────────────────────────────

interface SectionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  colors: ReturnType<typeof useThemeColors>;
}

const CollapsibleSection: React.FC<SectionProps> = ({ title, children, defaultOpen = true, colors }) => {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="mb-4">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between mb-2 group"
        aria-label={open ? `Collapse ${title}` : `Expand ${title}`}
      >
        <span className="text-xs font-bold tracking-wider uppercase" style={{ color: colors.text.tertiary }}>
          {title}
        </span>
        {open
          ? <ChevronDown className="w-3.5 h-3.5" style={{ color: colors.text.tertiary }} />
          : <ChevronRight className="w-3.5 h-3.5" style={{ color: colors.text.tertiary }} />
        }
      </button>
      {open && <div>{children}</div>}
    </div>
  );
};

// ── Export ────────────────────────────────────────────────────────────────

export const CommandCenterV2: React.FC = () => {
  const colors = useThemeColors();
  const navigate = useNavigate();
  const { data: predictions = [], isLoading: predictionsLoading } = usePredictionsQuery();
  const snapshot = useDashboardSnapshot();

  const highPredictions = predictions.filter(p => p.priority === 'high');
  const mediumPredictions = predictions.filter(p => p.priority === 'medium');
  const hasUrgent = highPredictions.length > 0 || mediumPredictions.length > 0;
  const hasInsights = snapshot.budgetOverruns.length > 0;
  const hasSnapshot = snapshot.netWorth || snapshot.goals || snapshot.habits;

  // Nothing to show at all
  if (!predictionsLoading && !hasUrgent && !hasInsights && !hasSnapshot) {
    return (
      <div
        className="rounded-xl p-4 mb-6 text-sm"
        style={{ backgroundColor: colors.bg.white, color: colors.text.secondary }}
      >
        <span className="text-base font-bold" style={{ color: colors.text.primary }}>
          All clear! You're on track today.
        </span>
        <p className="mt-1">No urgent items, no budget overruns. Keep it up!</p>
      </div>
    );
  }

  return (
    <div
      className="rounded-xl p-4 mb-6"
      style={{ backgroundColor: colors.bg.white, border: `1px solid ${colors.border.light}` }}
    >
      {/* URGENT */}
      {(hasUrgent || predictionsLoading) && (
        <CollapsibleSection title="Urgent" colors={colors}>
          {predictionsLoading ? (
            <div className="space-y-3 animate-pulse">
              {[1, 2].map(i => (
                <div key={i} className="h-10 rounded-lg bg-gray-100" />
              ))}
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {highPredictions.map(p => (
                <PredictionRow key={p.id} prediction={p} onNavigate={navigate} />
              ))}
              {mediumPredictions.map(p => (
                <PredictionRow key={p.id} prediction={p} onNavigate={navigate} />
              ))}
            </div>
          )}
        </CollapsibleSection>
      )}

      {/* Divider between sections */}
      {hasUrgent && (hasInsights || hasSnapshot) && (
        <div className="border-t my-3" style={{ borderColor: colors.border.light }} />
      )}

      {/* INSIGHTS */}
      {hasInsights && (
        <CollapsibleSection title="Insights" colors={colors}>
          <div className="divide-y divide-gray-50">
            {snapshot.budgetOverruns.map(overrun => (
              <BudgetOverrunRow
                key={overrun.categoryName}
                overrun={overrun}
                onNavigate={navigate}
              />
            ))}
          </div>
        </CollapsibleSection>
      )}

      {/* Divider */}
      {(hasUrgent || hasInsights) && hasSnapshot && (
        <div className="border-t my-3" style={{ borderColor: colors.border.light }} />
      )}

      {/* MONTHLY SNAPSHOT */}
      {hasSnapshot && (
        <CollapsibleSection title="Monthly snapshot" defaultOpen colors={colors}>
          <div className="grid grid-cols-3 gap-3">
            {/* Net Worth */}
            {snapshot.netWorth && (
              <button
                type="button"
                onClick={() => navigate('/finances?tab=networth')}
                className="rounded-xl p-3 text-left hover:opacity-90 transition-opacity"
                style={{ backgroundColor: colors.bg.secondary }}
                aria-label="View net worth details"
              >
                <p className="text-xs font-semibold mb-1" style={{ color: colors.text.tertiary }}>
                  Net Worth
                </p>
                <p className="text-base font-bold" style={{ color: colors.text.primary }}>
                  {formatCurrency(snapshot.netWorth.currentNetWorth)}
                </p>
                <div className="flex items-center gap-1 mt-0.5">
                  {snapshot.netWorth.delta >= 0
                    ? <TrendingUp className="w-3 h-3 text-green-600" />
                    : <TrendingDown className="w-3 h-3 text-red-500" />
                  }
                  <span
                    className="text-xs font-semibold"
                    style={{ color: snapshot.netWorth.delta >= 0 ? '#059669' : '#DC2626' }}
                  >
                    {snapshot.netWorth.delta >= 0 ? '+' : ''}{formatCurrency(snapshot.netWorth.delta)}
                  </span>
                </div>
              </button>
            )}

            {/* Goals */}
            {snapshot.goals && (
              <button
                type="button"
                onClick={() => navigate('/goals')}
                className="rounded-xl p-3 text-left hover:opacity-90 transition-opacity"
                style={{ backgroundColor: colors.bg.secondary }}
                aria-label="View goals"
              >
                <p className="text-xs font-semibold mb-1" style={{ color: colors.text.tertiary }}>
                  Goals
                </p>
                <p className="text-base font-bold" style={{ color: colors.text.primary }}>
                  {snapshot.goals.onTrack}/{snapshot.goals.total - snapshot.goals.completed}
                </p>
                <p className="text-xs mt-0.5" style={{ color: colors.text.secondary }}>
                  on track
                </p>
              </button>
            )}

            {/* Habits */}
            {snapshot.habits && (
              <button
                type="button"
                onClick={() => navigate('/habits')}
                className="rounded-xl p-3 text-left hover:opacity-90 transition-opacity"
                style={{ backgroundColor: colors.bg.secondary }}
                aria-label="View habits"
              >
                <p className="text-xs font-semibold mb-1" style={{ color: colors.text.tertiary }}>
                  Habits
                </p>
                <p className="text-base font-bold" style={{ color: colors.text.primary }}>
                  {snapshot.habits.completionRateThisWeek}%
                </p>
                <div className="flex items-center gap-1 mt-0.5">
                  {snapshot.habits.trend === 'up'
                    ? <TrendingUp className="w-3 h-3 text-green-600" />
                    : snapshot.habits.trend === 'down'
                    ? <TrendingDown className="w-3 h-3 text-red-500" />
                    : <Minus className="w-3 h-3" style={{ color: colors.text.tertiary }} />
                  }
                  <span
                    className="text-xs font-semibold"
                    style={{
                      color: snapshot.habits.trend === 'up'
                        ? '#059669'
                        : snapshot.habits.trend === 'down'
                        ? '#DC2626'
                        : colors.text.tertiary,
                    }}
                  >
                    {snapshot.habits.trend === 'up'
                      ? `↑ ${snapshot.habits.completionRateThisWeek - snapshot.habits.completionRatePrevWeek}pp`
                      : snapshot.habits.trend === 'down'
                      ? `↓ ${snapshot.habits.completionRatePrevWeek - snapshot.habits.completionRateThisWeek}pp`
                      : 'stable'}
                  </span>
                </div>
              </button>
            )}
          </div>
        </CollapsibleSection>
      )}
    </div>
  );
};

export default CommandCenterV2;
