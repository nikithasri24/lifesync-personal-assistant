/**
 * InsuranceCard Component
 * Displays individual insurance policy details with status, coverage, and renewal information
 */

import React from 'react';
import {
  Shield,
  Car,
  Home,
  Heart,
  Umbrella,
  PawPrint,
  Plane,
  Calendar,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Clock,
  FileText,
} from 'lucide-react';
import type { InsurancePolicy } from '../../types';
import { formatCurrency } from '../../utils/currency';
import { OwnerBadge } from '../../../components/common/OwnerBadge';

interface InsuranceCardProps {
  policy: InsurancePolicy;
  onClick?: () => void;
  className?: string;
  currentUserId?: string;
  partnerName?: string;
}

export const InsuranceCard = React.memo<InsuranceCardProps>(function InsuranceCard({
  policy,
  onClick,
  className = '',
  currentUserId,
  partnerName,
}) {
  // Get icon for policy type
  const getTypeIcon = (type: string): React.ComponentType<{ className?: string }> => {
    switch (type) {
      case 'auto':
        return Car;
      case 'home':
        return Home;
      case 'health':
        return Heart;
      case 'life':
        return Shield;
      case 'umbrella':
        return Umbrella;
      case 'pet':
        return PawPrint;
      case 'travel':
        return Plane;
      default:
        return Shield;
    }
  };

  const TypeIcon = getTypeIcon(policy.type);

  // Get status configuration
  const getStatusConfig = (): {
    color: string;
    bgColor: string;
    borderColor: string;
    icon: React.ComponentType<{ className?: string }>;
    label: string;
  } => {
    switch (policy.status) {
      case 'active':
        return {
          color: 'text-emerald-600',
          bgColor: 'bg-emerald-50',
          borderColor: 'border-emerald-200',
          icon: CheckCircle,
          label: 'Active',
        };
      case 'expired':
        return {
          color: 'text-rose-600',
          bgColor: 'bg-rose-50',
          borderColor: 'border-rose-200',
          icon: AlertTriangle,
          label: 'Expired',
        };
      case 'pending':
        return {
          color: 'text-amber-600',
          bgColor: 'bg-amber-50',
          borderColor: 'border-amber-200',
          icon: Clock,
          label: 'Pending',
        };
      default: // cancelled
        return {
          color: 'text-gray-600',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          icon: AlertTriangle,
          label: 'Cancelled',
        };
    }
  };

  const statusConfig = getStatusConfig();
  const StatusIcon = statusConfig.icon;

  // Calculate days until renewal
  const getDaysUntilRenewal = (): number | null => {
    if (!policy.renewalDate) return null;
    const now = new Date();
    const renewal = new Date(policy.renewalDate);
    const diff = Math.ceil((renewal.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const daysUntilRenewal = getDaysUntilRenewal();
  const isRenewalSoon = daysUntilRenewal !== null && daysUntilRenewal <= policy.renewalReminderDays;

  // Calculate annual cost
  const getAnnualCost = (): number => {
    switch (policy.premiumFrequency) {
      case 'monthly':
        return policy.premiumAmount * 12;
      case 'quarterly':
        return policy.premiumAmount * 4;
      case 'semi-annual':
        return policy.premiumAmount * 2;
      default: // annual
        return policy.premiumAmount;
    }
  };

  const annualCost = getAnnualCost();

  return (
    <div
      onClick={onClick}
      className={`rounded-2xl bg-primary/30 backdrop-blur-sm shadow-sm ring-1 border-primary/20 p-5 ${
        onClick ? 'cursor-pointer transition-all hover:shadow-md hover:scale-[1.02]' : ''
      } ${className}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`rounded-lg ${statusConfig.bgColor} p-2.5`}>
            <TypeIcon className={`h-5 w-5 ${statusConfig.color}`} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-lg font-semibold text-primary">{policy.policyName}</h3>
              {currentUserId && (
                <OwnerBadge
                  userId={policy.userId}
                  currentUserId={currentUserId}
                  partnerName={partnerName}
                  size="sm"
                />
              )}
            </div>
            <p className="text-xs text-primary opacity-60 mt-0.5">{policy.provider}</p>
          </div>
        </div>
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full ${statusConfig.bgColor} border ${statusConfig.borderColor}`}>
          <StatusIcon className={`h-3.5 w-3.5 ${statusConfig.color}`} />
          <span className={`text-xs font-medium ${statusConfig.color}`}>{statusConfig.label}</span>
        </div>
      </div>

      {/* Renewal Warning */}
      {isRenewalSoon && policy.status === 'active' && (
        <div className="mb-4 p-3 rounded-lg bg-amber-50 border border-amber-200">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <p className="text-sm font-medium text-amber-700">
              Renews in {daysUntilRenewal} {daysUntilRenewal === 1 ? 'day' : 'days'}
            </p>
          </div>
          {policy.renewalDate && (
            <p className="text-xs text-amber-600 mt-1 ml-6">
              {new Date(policy.renewalDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
          )}
        </div>
      )}

      {/* Coverage Details */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        {policy.coverageAmount && (
          <div>
            <p className="text-xs font-medium text-primary opacity-70 mb-1">Coverage</p>
            <p className="text-lg font-bold text-primary">{formatCurrency(policy.coverageAmount)}</p>
          </div>
        )}
        {policy.deductible && (
          <div>
            <p className="text-xs font-medium text-primary opacity-70 mb-1">Deductible</p>
            <p className="text-lg font-bold text-primary">{formatCurrency(policy.deductible)}</p>
          </div>
        )}
      </div>

      {/* Premium Information */}
      <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 mb-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-medium text-primary opacity-70">Premium</p>
          <p className="text-xs text-primary opacity-60 capitalize">{policy.premiumFrequency}</p>
        </div>
        <div className="flex items-baseline gap-2">
          <p className="text-2xl font-bold text-primary">{formatCurrency(policy.premiumAmount)}</p>
          <p className="text-xs text-primary opacity-60">per {policy.premiumFrequency === 'monthly' ? 'month' : 'period'}</p>
        </div>
        <p className="text-xs text-primary opacity-60 mt-1">
          ~{formatCurrency(annualCost)} annually
        </p>
      </div>

      {/* Policy Details */}
      <div className="space-y-2">
        {policy.policyNumber && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5 text-primary opacity-60" />
              <span className="text-xs font-medium text-primary opacity-70">Policy Number</span>
            </div>
            <span className="text-xs font-semibold text-primary">{policy.policyNumber}</span>
          </div>
        )}

        {policy.nextPaymentDate && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-primary opacity-60" />
              <span className="text-xs font-medium text-primary opacity-70">Next Payment</span>
            </div>
            <span className="text-xs font-semibold text-primary">
              {new Date(policy.nextPaymentDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
          </div>
        )}

        {policy.claimCount !== undefined && policy.claimCount > 0 && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <DollarSign className="h-3.5 w-3.5 text-primary opacity-60" />
              <span className="text-xs font-medium text-primary opacity-70">Claims</span>
            </div>
            <span className="text-xs font-semibold text-primary">
              {policy.claimCount} ({formatCurrency(policy.totalClaimsPaid ?? 0)} paid)
            </span>
          </div>
        )}
      </div>

      {/* Auto-Renew Badge */}
      {policy.autoRenew && (
        <div className="mt-3 pt-3 border-t border-primary/20">
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs text-primary opacity-70">Auto-renew enabled</span>
          </div>
        </div>
      )}
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom equality check - only re-render if these specific props change
  return (
    prevProps.policy.id === nextProps.policy.id &&
    prevProps.policy.policyName === nextProps.policy.policyName &&
    prevProps.policy.provider === nextProps.policy.provider &&
    prevProps.policy.type === nextProps.policy.type &&
    prevProps.policy.status === nextProps.policy.status &&
    prevProps.policy.premiumAmount === nextProps.policy.premiumAmount &&
    prevProps.policy.premiumFrequency === nextProps.policy.premiumFrequency &&
    prevProps.policy.coverageAmount === nextProps.policy.coverageAmount &&
    prevProps.policy.deductible === nextProps.policy.deductible &&
    prevProps.policy.renewalDate === nextProps.policy.renewalDate &&
    prevProps.policy.userId === nextProps.policy.userId &&
    prevProps.policy.autoRenew === nextProps.policy.autoRenew &&
    prevProps.className === nextProps.className &&
    prevProps.currentUserId === nextProps.currentUserId &&
    prevProps.partnerName === nextProps.partnerName
  );
});

export default InsuranceCard;
