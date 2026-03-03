/**
 * Credit Cards Page — Dashboard Style
 * Single scrollable page with 4 intelligence sections:
 * 1. Portfolio header (total balance, utilization, estimated rewards value)
 * 2. Spend Optimizer — ranked cards by category
 * 3. Benefits Tracker — grouped by urgency
 * 4. Active Bonuses — rotating + welcome bonus progress
 * 5. My Cards — compact list with edit
 */

import React from 'react';
import { Loader2 } from 'lucide-react';
import { useAccountsQuery, useFinanceMergedConnectionQuery } from '@/hooks/useFinanceQuery';
import {
  useAllCardsBenefitsQuery,
  useAllCardsCategoryBonusesQuery,
  useAllCardsWelcomeBonusesQuery,
} from '../hooks/useCreditCardsQuery';
import { useAuth } from '@/hooks/useAuth';
import { useThemeColors } from '@/hooks/useThemeColors';
import { formatCurrency } from '../utils/currency';
import { estimateRewardsValue } from '../utils/pointValuations';
import { SpendOptimizer } from '../components/creditCards/SpendOptimizer';
import { BenefitsTracker } from '../components/creditCards/BenefitsTracker';
import { CategoryBonusTracker } from '../components/creditCards/CategoryBonusTracker';
import { CardsList } from '../components/creditCards/CardsList';

const CreditCardsPage: React.FC = () => {
  const colors = useThemeColors();
  const { user } = useAuth();

  const { data: mergedConnection } = useFinanceMergedConnectionQuery();
  const partnerName = React.useMemo(() => mergedConnection?.partnerName, [mergedConnection]);

  const { data: accounts = [], isLoading, error } = useAccountsQuery();
  const creditCards = accounts.filter((a) => a.type === 'credit');

  // Aggregate queries — fetch data for all cards in parallel
  const { data: benefitsByCard, isLoading: benefitsLoading } = useAllCardsBenefitsQuery(creditCards);
  const { data: bonusesByCard, isLoading: bonusesLoading } = useAllCardsCategoryBonusesQuery(creditCards);
  const { data: welcomeBonusesByCard, isLoading: welcomeLoading } = useAllCardsWelcomeBonusesQuery(creditCards);

  // Summary stats
  const totalBalance = creditCards.reduce((sum, c) => sum + Math.abs(c.balance), 0);
  const totalLimit = creditCards.reduce((sum, c) => sum + (c.creditLimit ?? 0), 0);
  const utilPct = totalLimit > 0 ? (totalBalance / totalLimit) * 100 : 0;

  // Portfolio rewards value estimate
  const totalRewardsCents = creditCards.reduce((sum, c) => sum + estimateRewardsValue(c), 0);
  const totalRewardsDollars = totalRewardsCents / 100;

  const anyLoading = isLoading || benefitsLoading || bonusesLoading || welcomeLoading;

  if (isLoading) {
    return (
      <div style={{ backgroundColor: colors.bg.primary, minHeight: '100vh' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '1.5rem', paddingBottom: '5rem' }}>
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" style={{ color: '#C18B5E' }} />
              <p className="text-sm" style={{ color: colors.text.secondary }}>
                Loading credit cards...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ backgroundColor: colors.bg.primary, minHeight: '100vh' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '1.5rem', paddingBottom: '5rem' }}>
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <p className="text-red-500 mb-1">Error loading credit cards</p>
              <p className="text-sm" style={{ color: colors.text.secondary }}>
                {error.message}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: colors.bg.primary, minHeight: '100vh' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '1.5rem', paddingBottom: '5rem' }}>
        {/* ── Page Header ── */}
        <div className="mb-6">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h1 className="text-3xl font-bold flex items-center gap-3" style={{ color: colors.text.primary }}>
              <span className="text-4xl">💳</span>
              Credit Cards
            </h1>
            {totalRewardsDollars > 0 && (
              <span
                className="text-sm font-semibold px-3 py-1.5 rounded-full"
                style={{ background: 'linear-gradient(135deg, #D4A574 0%, #C18B5E 100%)', color: '#fff' }}
              >
                Portfolio: ~{formatCurrency(totalRewardsDollars)} rewards
              </span>
            )}
          </div>

          {/* Summary stats row */}
          {creditCards.length > 0 && (
            <div className="flex flex-wrap gap-4 mt-3 text-sm" style={{ color: colors.text.secondary }}>
              <span>
                <strong style={{ color: colors.text.primary }}>{formatCurrency(totalBalance)}</strong>{' '}
                balance
              </span>
              <span>·</span>
              <span>
                <strong
                  style={{
                    color: utilPct >= 75 ? '#EF4444' : utilPct >= 30 ? '#F59E0B' : '#10B981',
                  }}
                >
                  {utilPct.toFixed(1)}%
                </strong>{' '}
                utilization
              </span>
              <span>·</span>
              <span>
                <strong style={{ color: colors.text.primary }}>{formatCurrency(totalLimit)}</strong>{' '}
                total limit
              </span>
              <span>·</span>
              <span>
                <strong style={{ color: colors.text.primary }}>{creditCards.length}</strong>{' '}
                card{creditCards.length !== 1 ? 's' : ''}
              </span>
            </div>
          )}
        </div>

        {creditCards.length === 0 ? (
          <div
            className="p-8 rounded-xl border-2 border-dashed text-center"
            style={{ borderColor: colors.border.medium }}
          >
            <div className="text-4xl mb-3">💳</div>
            <p className="font-medium mb-2" style={{ color: colors.text.primary }}>
              No credit cards yet
            </p>
            <p className="text-sm mb-4" style={{ color: colors.text.secondary }}>
              Add your credit cards via the Accounts page to track balances, rewards, and benefits
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* 1. Spend Optimizer */}
            <SpendOptimizer cards={creditCards} bonusesByCard={bonusesByCard} />

            {/* 2. Benefits Tracker */}
            <BenefitsTracker
              cards={creditCards}
              benefitsByCard={benefitsByCard}
            />

            {/* 3. Active Bonuses (rotating + welcome) */}
            <CategoryBonusTracker
              cards={creditCards}
              bonusesByCard={bonusesByCard}
              welcomeBonusesByCard={welcomeBonusesByCard}
            />

            {/* 4. My Cards list */}
            <CardsList
              cards={creditCards}
              partnerName={partnerName}
            />
          </div>
        )}

        {/* Loading overlay for sub-data (non-blocking) */}
        {!isLoading && anyLoading && creditCards.length > 0 && (
          <div className="flex items-center gap-2 mt-3" style={{ color: colors.text.secondary }}>
            <Loader2 className="w-3 h-3 animate-spin" />
            <span className="text-xs">Loading card details...</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreditCardsPage;
