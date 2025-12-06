/**
 * InsurancePage - Track all insurance policies with coverage, premiums, and renewals
 * Comprehensive insurance management dashboard
 */

import React from 'react';
import {
  Shield,
  Plus,
  AlertTriangle,
  TrendingUp,
  Calendar,
  DollarSign,
  FileText,
} from 'lucide-react';
import type { InsurancePolicy, InsurancePolicyInput } from '../types';
import { formatCurrency } from '../utils/currency';
import { InsuranceCard } from '../components/insurance/InsuranceCard';
import { InsurancePolicyForm } from '../components/insurance/InsurancePolicyForm';
import { logger } from '../../services/logger';

const InsurancePage: React.FC = () => {
  const [policies, setPolicies] = React.useState<InsurancePolicy[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [_selectedPolicyId, _setSelectedPolicyId] = React.useState<string | null>(null);
  const [filterType, setFilterType] = React.useState<string>('all');
  const [showForm, setShowForm] = React.useState(false);
  const [editingPolicy, setEditingPolicy] = React.useState<InsurancePolicy | undefined>(undefined);

  React.useEffect(() => {
    // TODO: Load from API
    // For now, using mock data
    setLoading(false);
    setPolicies([]);
  }, []);

  const handleAddPolicy = (): void => {
    logger.debug('Insurance', 'Add Policy button clicked');
    setEditingPolicy(undefined);
    setShowForm(true);
  };

  const handleEditPolicy = (policy: InsurancePolicy): void => {
    setEditingPolicy(policy);
    setShowForm(true);
  };

  const handleSavePolicy = (policyInput: InsurancePolicyInput): void => {
    // TODO: Save to API
    if (editingPolicy) {
      // Update existing policy
      setPolicies(prev =>
        prev.map(p =>
          p.id === editingPolicy.id
            ? {
                ...policyInput,
                id: editingPolicy.id,
                createdAt: editingPolicy.createdAt,
                updatedAt: new Date().toISOString(),
              } as InsurancePolicy
            : p
        )
      );
    } else {
      // Add new policy
      const newPolicy: InsurancePolicy = {
        ...policyInput,
        id: `policy-${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setPolicies(prev => [...prev, newPolicy]);
    }
    setShowForm(false);
    setEditingPolicy(undefined);
  };

  const handleCancelForm = (): void => {
    setShowForm(false);
    setEditingPolicy(undefined);
  };

  // Calculate summary metrics
  const activePolicies = policies.filter(p => p.status === 'active');
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

  const totalCoverage = activePolicies
    .filter(p => p.coverageAmount)
    .reduce((sum, p) => sum + (p.coverageAmount ?? 0), 0);

  // Get upcoming renewals (next 60 days)
  const upcomingRenewals = activePolicies
    .filter(p => {
      if (!p.renewalDate) return false;
      const daysUntil = Math.ceil(
        (new Date(p.renewalDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      );
      return daysUntil > 0 && daysUntil <= 60;
    })
    .sort((a, b) => {
      const aRenewalDate = a.renewalDate ? new Date(a.renewalDate).getTime() : Infinity;
      const bRenewalDate = b.renewalDate ? new Date(b.renewalDate).getTime() : Infinity;
      return aRenewalDate - bRenewalDate;
    })
    .slice(0, 3);

  // Get policies requiring attention
  const policiesNeedingAttention = policies.filter(p => {
    if (p.status === 'expired') return true;
    if (p.status === 'pending') return true;
    if (!p.renewalDate) return false;
    const daysUntil = Math.ceil(
      (new Date(p.renewalDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );
    return daysUntil <= 30 && daysUntil > 0;
  });

  // Group policies by type
  const policiesByType = activePolicies.reduce((acc, policy) => {
    if (!acc[policy.type]) {
      acc[policy.type] = [];
    }
    acc[policy.type].push(policy);
    return acc;
  }, {} as Record<string, InsurancePolicy[]>);

  // Filter policies
  const filteredPolicies = filterType === 'all'
    ? policies
    : policies.filter(p => p.type === filterType);

  const policyTypes = [
    { value: 'all', label: 'All Policies', icon: Shield },
    { value: 'health', label: 'Health', icon: Shield },
    { value: 'auto', label: 'Auto', icon: Shield },
    { value: 'home', label: 'Home', icon: Shield },
    { value: 'life', label: 'Life', icon: Shield },
    { value: 'disability', label: 'Disability', icon: Shield },
    { value: 'umbrella', label: 'Umbrella', icon: Shield },
    { value: 'pet', label: 'Pet', icon: Shield },
    { value: 'travel', label: 'Travel', icon: Shield },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent mx-auto mb-2" />
          <p className="text-sm text-primary opacity-60">Loading insurance policies...</p>
        </div>
      </div>
    );
  }

  if (policies.length === 0) {
    return (
      <>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center max-w-md">
            <Shield className="h-16 w-16 text-primary opacity-40 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-primary mb-2">No Insurance Policies Yet</h3>
            <p className="text-sm text-primary opacity-70 mb-6">
              Track all your insurance policies in one place. Monitor premiums, coverage, renewals, and claims.
            </p>
            <button
              onClick={handleAddPolicy}
              className="px-4 py-2 rounded-lg bg-blue-500 text-white font-medium hover:bg-blue-600 transition-colors inline-flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Insurance Policy
            </button>
          </div>
        </div>

        {/* Form Modal */}
        {showForm && (
          <InsurancePolicyForm
            policy={editingPolicy}
            onSave={handleSavePolicy}
            onCancel={handleCancelForm}
          />
        )}
      </>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Active Policies */}
        <div className="rounded-2xl bg-primary/30 backdrop-blur-sm shadow-sm ring-1 border-emerald-500/30 p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="rounded-lg bg-emerald-500/10 p-2">
              <Shield className="h-4 w-4 text-emerald-600" />
            </div>
            <h3 className="text-sm font-medium text-primary opacity-70">Active Policies</h3>
          </div>
          <p className="text-2xl font-bold text-primary">{activePolicies.length}</p>
          <p className="text-xs text-primary opacity-60 mt-1">
            {Object.keys(policiesByType).length} types
          </p>
        </div>

        {/* Total Annual Premium */}
        <div className="rounded-2xl bg-primary/30 backdrop-blur-sm shadow-sm ring-1 border-blue-500/30 p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="rounded-lg bg-blue-500/10 p-2">
              <DollarSign className="h-4 w-4 text-blue-600" />
            </div>
            <h3 className="text-sm font-medium text-primary opacity-70">Annual Premium</h3>
          </div>
          <p className="text-2xl font-bold text-primary">{formatCurrency(totalAnnualPremium)}</p>
          <p className="text-xs text-primary opacity-60 mt-1">
            {formatCurrency(totalAnnualPremium / 12)}/mo avg
          </p>
        </div>

        {/* Total Coverage */}
        <div className="rounded-2xl bg-primary/30 backdrop-blur-sm shadow-sm ring-1 border-purple-500/30 p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="rounded-lg bg-purple-500/10 p-2">
              <TrendingUp className="h-4 w-4 text-purple-600" />
            </div>
            <h3 className="text-sm font-medium text-primary opacity-70">Total Coverage</h3>
          </div>
          <p className="text-2xl font-bold text-primary">{formatCurrency(totalCoverage)}</p>
          <p className="text-xs text-primary opacity-60 mt-1">Combined protection</p>
        </div>

        {/* Needs Attention */}
        <div className={`rounded-2xl bg-primary/30 backdrop-blur-sm shadow-sm ring-1 ${
          policiesNeedingAttention.length > 0 ? 'border-amber-500/30' : 'border-primary/20'
        } p-4`}>
          <div className="flex items-center gap-2 mb-2">
            <div className={`rounded-lg ${
              policiesNeedingAttention.length > 0 ? 'bg-amber-500/10' : 'bg-primary/10'
            } p-2`}>
              <AlertTriangle className={`h-4 w-4 ${
                policiesNeedingAttention.length > 0 ? 'text-amber-600' : 'text-primary opacity-60'
              }`} />
            </div>
            <h3 className="text-sm font-medium text-primary opacity-70">Needs Attention</h3>
          </div>
          <p className="text-2xl font-bold text-primary">{policiesNeedingAttention.length}</p>
          <p className="text-xs text-primary opacity-60 mt-1">
            {policiesNeedingAttention.length === 0 ? 'All up to date' : 'policies require action'}
          </p>
        </div>
      </div>

      {/* Upcoming Renewals */}
      {upcomingRenewals.length > 0 && (
        <div className="rounded-2xl bg-primary/30 backdrop-blur-sm shadow-sm ring-1 border-primary/20 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-primary">Upcoming Renewals</h3>
          </div>
          <div className="space-y-3">
            {upcomingRenewals.map(policy => {
              const renewalDate = policy.renewalDate ? new Date(policy.renewalDate) : null;
              const daysUntil = renewalDate
                ? Math.ceil(
                    (renewalDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
                  )
                : 0;
              const isUrgent = daysUntil <= 14;

              return (
                <div
                  key={policy.id}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    isUrgent
                      ? 'bg-amber-50 border-amber-200'
                      : 'bg-blue-50 border-blue-200'
                  }`}
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium text-primary">{policy.policyName}</p>
                    <p className="text-xs text-primary opacity-60 mt-0.5 capitalize">
                      {policy.type} • {policy.provider}
                    </p>
                  </div>
                  <div className="text-right">
                    {renewalDate && (
                      <>
                        <p className={`text-sm font-semibold ${
                          isUrgent ? 'text-amber-700' : 'text-blue-700'
                        }`}>
                          {renewalDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </p>
                        <p className="text-xs text-primary opacity-60">
                          {daysUntil} {daysUntil === 1 ? 'day' : 'days'}
                        </p>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {policyTypes.map(type => {
          const count = type.value === 'all'
            ? policies.length
            : policies.filter(p => p.type === type.value).length;

          if (count === 0 && type.value !== 'all') return null;

          return (
            <button
              key={type.value}
              onClick={() => setFilterType(type.value)}
              className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all ${
                filterType === type.value
                  ? 'bg-blue-500 text-white'
                  : 'bg-primary/20 text-primary hover:bg-primary/30'
              }`}
            >
              {type.label} {count > 0 && `(${count})`}
            </button>
          );
        })}
      </div>

      {/* Policies Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-primary">Your Policies</h3>
          <button
            onClick={handleAddPolicy}
            className="px-3 py-1.5 rounded-lg bg-blue-500 text-white text-sm font-medium hover:bg-blue-600 transition-colors inline-flex items-center gap-1.5"
          >
            <Plus className="h-4 w-4" />
            Add Policy
          </button>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredPolicies.map(policy => (
            <InsuranceCard
              key={policy.id}
              policy={policy}
              onClick={() => handleEditPolicy(policy)}
            />
          ))}
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <InsurancePolicyForm
          policy={editingPolicy}
          onSave={handleSavePolicy}
          onCancel={handleCancelForm}
        />
      )}
    </div>
  );
};

export default InsurancePage;
