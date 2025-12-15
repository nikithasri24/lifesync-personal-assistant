/**
 * CardBenefitsPanel Component
 * Displays and tracks credit card benefits, category bonuses, welcome bonuses, and offers
 */

import React from 'react';
import { Gift, TrendingUp, Target, Tag, Calendar, Award, Plane, Coffee } from 'lucide-react';
import type { CardBenefit, CardCategoryBonus, WelcomeBonus, CardOffer } from '../../types';
import { formatCurrency } from '../../utils/currency';

interface CardBenefitsPanelProps {
  accountId: string;
  benefits: CardBenefit[];
  categoryBonuses: CardCategoryBonus[];
  welcomeBonuses: WelcomeBonus[];
  offers: CardOffer[];
  className?: string;
}

export const CardBenefitsPanel: React.FC<CardBenefitsPanelProps> = ({
  benefits,
  categoryBonuses,
  welcomeBonuses,
  offers,
  className = '',
}) => {
  // Group benefits by type
  const benefitsByType = benefits.reduce((acc, benefit) => {
    if (!acc[benefit.benefitType]) {
      acc[benefit.benefitType] = [];
    }
    acc[benefit.benefitType].push(benefit);
    return acc;
  }, {} as Record<string, CardBenefit[]>);

  // Get benefit type icon and label
  const getBenefitTypeConfig = (type: string): { icon: React.ComponentType<{ className?: string }>; label: string; color: string } => {
    switch (type) {
      case 'travel_credit':
        return { icon: Plane, label: 'Travel Credits', color: 'text-blue-600' };
      case 'recurring_credit':
        return { icon: Calendar, label: 'Recurring Credits', color: 'text-purple-600' };
      case 'lounge_access':
        return { icon: Coffee, label: 'Lounge Access', color: 'text-amber-600' };
      case 'protection':
        return { icon: Award, label: 'Protection Benefits', color: 'text-emerald-600' };
      default:
        return { icon: Gift, label: 'Other Benefits', color: 'text-gray-600' };
    }
  };

  // Calculate welcome bonus progress
  const getWelcomeBonusProgress = (bonus: WelcomeBonus): { progress: number; remaining: number; daysRemaining: number; isUrgent: boolean; isCompleted: boolean } => {
    const progress = (bonus.currentSpend / bonus.requiredSpend) * 100;
    const remaining = bonus.requiredSpend - bonus.currentSpend;
    const daysRemaining = Math.ceil((new Date(bonus.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

    return {
      progress: Math.min(100, progress),
      remaining,
      daysRemaining,
      isUrgent: daysRemaining <= 30,
      isCompleted: bonus.completed,
    };
  };

  // Calculate benefit usage progress
  const getBenefitProgress = (benefit: CardBenefit): { progress: number; remaining: number; isFullyUsed: boolean } | null => {
    if (!benefit.value) return null;
    const progress = (benefit.usedAmount / benefit.value) * 100;
    return {
      progress: Math.min(100, progress),
      remaining: benefit.value - benefit.usedAmount,
      isFullyUsed: benefit.usedAmount >= benefit.value,
    };
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Welcome Bonuses Section */}
      {welcomeBonuses.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-rose-600" />
            <h3 className="text-lg font-semibold text-primary">Welcome Bonus</h3>
          </div>

          {welcomeBonuses.map((bonus) => {
            const progress = getWelcomeBonusProgress(bonus);
            return (
              <div
                key={bonus.id}
                className={`rounded-xl p-4 border ${
                  progress.isCompleted
                    ? 'bg-emerald-50 border-emerald-200'
                    : progress.isUrgent
                    ? 'bg-rose-50 border-rose-200'
                    : 'bg-blue-50 border-blue-200'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-semibold text-primary">
                      {bonus.bonusAmount.toLocaleString()} Points
                    </h4>
                    <p className="text-sm text-primary opacity-70">
                      Spend {formatCurrency(bonus.requiredSpend)} by {new Date(bonus.deadline).toLocaleDateString()}
                    </p>
                  </div>
                  {progress.isCompleted ? (
                    <span className="text-2xl">✅</span>
                  ) : progress.isUrgent ? (
                    <span className="text-2xl">⏰</span>
                  ) : (
                    <span className="text-2xl">🎯</span>
                  )}
                </div>

                {!progress.isCompleted && (
                  <>
                    <div className="mb-2">
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-primary opacity-70">Progress</span>
                        <span className="font-semibold text-primary">
                          {formatCurrency(bonus.currentSpend)} / {formatCurrency(bonus.requiredSpend)}
                        </span>
                      </div>
                      <div className="h-2.5 w-full rounded-full bg-white/50 overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${
                            progress.isUrgent ? 'bg-rose-500' : 'bg-blue-500'
                          }`}
                          style={{ width: `${progress.progress}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className={progress.isUrgent ? 'text-rose-700 font-medium' : 'text-primary opacity-70'}>
                        {formatCurrency(progress.remaining)} remaining
                      </span>
                      <span className={progress.isUrgent ? 'text-rose-700 font-medium' : 'text-primary opacity-70'}>
                        {progress.daysRemaining} days left
                      </span>
                    </div>
                  </>
                )}

                {progress.isCompleted && bonus.completedDate && (
                  <p className="text-sm text-emerald-700">
                    Completed on {new Date(bonus.completedDate).toLocaleDateString()}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Category Bonuses Section */}
      {categoryBonuses.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-600" />
            <h3 className="text-lg font-semibold text-primary">Earning Rates</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {categoryBonuses.map((bonus) => (
              <div
                key={bonus.id}
                className={`rounded-lg p-3 border ${
                  bonus.isRotating
                    ? 'bg-amber-50 border-amber-200'
                    : 'bg-green-50 border-green-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-primary capitalize">
                      {bonus.category}
                    </p>
                    {bonus.isRotating && bonus.endDate && (
                      <p className="text-xs text-primary opacity-60">
                        Until {new Date(bonus.endDate).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className={`text-lg font-bold ${bonus.isRotating ? 'text-amber-700' : 'text-green-700'}`}>
                      {bonus.rewardsRate}x
                    </p>
                    <p className="text-xs text-primary opacity-60">points</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Benefits Section - Grouped by Type */}
      {Object.keys(benefitsByType).length > 0 && (
        <div className="space-y-4">
          {Object.entries(benefitsByType).map(([type, typeBenefits]) => {
            const config = getBenefitTypeConfig(type);
            const Icon = config.icon;

            return (
              <div key={type} className="space-y-3">
                <div className="flex items-center gap-2">
                  <Icon className={`h-5 w-5 ${config.color}`} />
                  <h3 className="text-lg font-semibold text-primary">{config.label}</h3>
                </div>

                <div className="space-y-2">
                  {typeBenefits.map((benefit) => {
                    const progress = getBenefitProgress(benefit);

                    return (
                      <div
                        key={benefit.id}
                        className={`rounded-lg p-3 border transition-all ${
                          !benefit.active
                            ? 'bg-gray-50 border-gray-200 opacity-50'
                            : progress?.isFullyUsed
                            ? 'bg-gray-50 border-gray-300'
                            : 'bg-primary/5 border-primary/20 hover:bg-primary/10'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold text-primary">{benefit.name}</h4>
                              {!benefit.active && (
                                <span className="text-xs px-2 py-0.5 rounded-full bg-gray-200 text-gray-600">
                                  Inactive
                                </span>
                              )}
                            </div>
                            {benefit.description && (
                              <p className="text-sm text-primary opacity-70 mt-1">
                                {benefit.description}
                              </p>
                            )}
                          </div>
                          {benefit.value && (
                            <div className="text-right ml-3">
                              <p className="text-lg font-bold text-primary">
                                {formatCurrency(benefit.value)}
                              </p>
                              {benefit.frequency && (
                                <p className="text-xs text-primary opacity-60 capitalize">
                                  {benefit.frequency}
                                </p>
                              )}
                            </div>
                          )}
                        </div>

                        {progress && benefit.value && (
                          <div>
                            <div className="flex items-center justify-between text-sm mb-1">
                              <span className="text-primary opacity-70">Used</span>
                              <span className="font-semibold text-primary">
                                {formatCurrency(benefit.usedAmount)} / {formatCurrency(benefit.value)}
                              </span>
                            </div>
                            <div className="h-2 w-full rounded-full bg-primary/20 overflow-hidden">
                              <div
                                className={`h-full transition-all duration-300 ${
                                  progress.isFullyUsed ? 'bg-gray-400' : 'bg-blue-500'
                                }`}
                                style={{ width: `${progress.progress}%` }}
                              />
                            </div>
                            {progress.remaining > 0 && benefit.resetDate && (
                              <p className="text-xs text-primary opacity-60 mt-1">
                                {formatCurrency(progress.remaining)} remaining • Resets {new Date(benefit.resetDate).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Card Offers Section */}
      {offers.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Tag className="h-5 w-5 text-indigo-600" />
            <h3 className="text-lg font-semibold text-primary">Card Offers</h3>
          </div>

          <div className="space-y-2">
            {offers.map((offer) => {
              const isExpired = offer.expirationDate && new Date(offer.expirationDate) < new Date();
              const isRedeemed = offer.redeemed;

              return (
                <div
                  key={offer.id}
                  className={`rounded-lg p-3 border ${
                    isRedeemed
                      ? 'bg-emerald-50 border-emerald-200'
                      : isExpired
                      ? 'bg-gray-50 border-gray-200 opacity-50'
                      : offer.activated
                      ? 'bg-blue-50 border-blue-200'
                      : 'bg-indigo-50 border-indigo-200'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-primary">{offer.merchant}</h4>
                        {!offer.activated && !isExpired && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-200 text-indigo-700">
                            Not Activated
                          </span>
                        )}
                        {isRedeemed && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-700">
                            Redeemed
                          </span>
                        )}
                        {isExpired && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-200 text-gray-600">
                            Expired
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-primary opacity-70 capitalize">
                        {offer.offerType}: {formatCurrency(offer.offerAmount)}
                        {offer.requiredSpend && ` (Spend ${formatCurrency(offer.requiredSpend)})`}
                      </p>
                      {offer.expirationDate && !isExpired && (
                        <p className="text-xs text-primary opacity-60 mt-1">
                          Expires {new Date(offer.expirationDate).toLocaleDateString()}
                        </p>
                      )}
                      {isRedeemed && offer.redeemedDate && (
                        <p className="text-xs text-emerald-700 mt-1">
                          Redeemed on {new Date(offer.redeemedDate).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <span className="text-2xl ml-3">
                      {isRedeemed ? '✅' : offer.activated ? '🔵' : '💰'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty State */}
      {benefits.length === 0 && categoryBonuses.length === 0 && welcomeBonuses.length === 0 && offers.length === 0 && (
        <div className="text-center py-12">
          <Gift className="h-12 w-12 text-primary opacity-30 mx-auto mb-3" />
          <p className="text-primary opacity-70">No benefits tracked for this card</p>
          <p className="text-sm text-primary opacity-50 mt-1">
            Add benefits manually or select a card template
          </p>
        </div>
      )}
    </div>
  );
};

export default CardBenefitsPanel;
