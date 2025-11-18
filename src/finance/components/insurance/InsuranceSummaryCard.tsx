/**
 * InsuranceSummaryCard Component
 * Compact summary of all insurance policies for dashboard display
 */

import React from 'react';
import { Shield, AlertTriangle, DollarSign, ChevronRight } from 'lucide-react';
import type { InsurancePolicy } from '../../types';
import { formatCurrency } from '../../utils/currency';

interface InsuranceSummaryCardProps {
  policies: InsurancePolicy[];
  onClick?: () => void;
  className?: string;
}

export const InsuranceSummaryCard: React.FC<InsuranceSummaryCardProps> = ({
  policies,
  onClick,
  className = '',
}) => {
  const activePolicies = policies.filter(p => p.status === 'active');

  // Calculate total annual premium
  const totalAnnualPremium = activePolicies.reduce((sum, policy) => {
    const annual = (() => {
      switch (policy.premiumFrequency) {
        case 'monthly': return policy.premiumAmount * 12;
        case 'quarterly': return policy.premiumAmount * 4;
        case 'semi-annual': return policy.premiumAmount * 2;
        default: return policy.premiumAmount;
      }
    })();
    return sum + annual;
  }, 0);

  // Get policies needing attention
  const needsAttention = policies.filter(p => {
    if (p.status === 'expired' || p.status === 'pending') return true;
    if (!p.renewalDate) return false;
    const daysUntil = Math.ceil(
      (new Date(p.renewalDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );
    return daysUntil <= 30 && daysUntil > 0;
  });

  // Group by type
  const typeBreakdown = activePolicies.reduce((acc, policy) => {
    const type = policy.type.charAt(0).toUpperCase() + policy.type.slice(1);
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  if (policies.length === 0) {
    return null;
  }

  return (
    <div
      onClick={onClick}
      className={`rounded-2xl bg-primary/30 backdrop-blur-sm shadow-sm ring-1 border-primary/20 p-5 ${
        onClick ? 'cursor-pointer transition-all hover:shadow-md hover:scale-[1.02]' : ''
      } ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-blue-50 p-2">
            <Shield className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-primary opacity-70">Insurance Coverage</h3>
            <p className="text-xs text-primary opacity-60">{activePolicies.length} active policies</p>
          </div>
        </div>
        {onClick && <ChevronRight className="h-5 w-5 text-primary opacity-40" />}
      </div>

      {/* Annual Premium */}
      <div className="mb-4">
        <p className="text-xs text-primary opacity-70 mb-1">Annual Premium</p>
        <div className="flex items-baseline gap-2">
          <p className="text-3xl font-bold text-blue-600">
            {formatCurrency(totalAnnualPremium)}
          </p>
          <p className="text-xs text-primary opacity-60">/year</p>
        </div>
        <p className="text-xs text-primary opacity-60 mt-1">
          {formatCurrency(totalAnnualPremium / 12)}/month average
        </p>
      </div>

      {/* Needs Attention */}
      {needsAttention.length > 0 && (
        <div className="mb-4 p-3 rounded-lg bg-amber-50 border border-amber-200">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <div className="flex-1">
              <p className="text-sm font-medium text-amber-700">
                {needsAttention.length} {needsAttention.length === 1 ? 'policy needs' : 'policies need'} attention
              </p>
              <p className="text-xs text-amber-600 mt-0.5">
                Renewal or action required soon
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Type Breakdown */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-primary opacity-70">Coverage by Type</p>
        {Object.entries(typeBreakdown).map(([type, count]) => (
          <div key={type} className="flex items-center justify-between p-2 rounded-lg bg-primary/10">
            <span className="text-xs font-medium text-primary capitalize">{type}</span>
            <span className="text-xs font-bold text-primary">
              {count} {count === 1 ? 'policy' : 'policies'}
            </span>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="mt-4 pt-3 border-t border-primary/20">
        <p className="text-xs text-primary opacity-60">
          💡 Keep all your insurance in one place
        </p>
      </div>
    </div>
  );
};

export default InsuranceSummaryCard;
