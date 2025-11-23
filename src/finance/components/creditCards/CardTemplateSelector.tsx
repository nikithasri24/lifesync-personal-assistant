/**
 * CardTemplateSelector Component
 * Allows users to select a credit card template to auto-populate benefits
 */

import React, { useState } from 'react';
import { Search, CreditCard, Award, Gift, DollarSign, CheckCircle } from 'lucide-react';
import { getAvailableCardTemplates, calculateAnnualBenefitValue, getNetAnnualValue } from '../../utils/cardBenefitsHelper';
import { formatCurrency } from '../../utils/currency';
import type { CreditCardTemplate } from '../../utils/creditCardTemplates';

interface CardTemplateSelectorProps {
  onSelect: (template: CreditCardTemplate | null) => void;
  selectedTemplateId?: string;
  className?: string;
}

export const CardTemplateSelector: React.FC<CardTemplateSelectorProps> = ({
  onSelect,
  selectedTemplateId,
  className = '',
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const templates = getAvailableCardTemplates();

  const filteredTemplates = templates.filter((template) => {
    if (!searchTerm) return true;
    const normalized = searchTerm.toLowerCase();
    return (
      template.name.toLowerCase().includes(normalized) ||
      template.issuer.toLowerCase().includes(normalized)
    );
  });

  const getIssuerColor = (issuer: string): string => {
    switch (issuer) {
      case 'amex':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'chase':
        return 'bg-indigo-100 text-indigo-700 border-indigo-200';
      case 'capital_one':
        return 'bg-rose-100 text-rose-700 border-rose-200';
      case 'citi':
        return 'bg-cyan-100 text-cyan-700 border-cyan-200';
      case 'discover':
        return 'bg-orange-100 text-orange-700 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getIssuerName = (issuer: string): string => {
    return issuer.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary opacity-40" />
        <input
          type="text"
          placeholder="Search for a credit card..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-primary/20 bg-white text-primary placeholder:text-primary placeholder:opacity-40 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
        />
      </div>

      {/* Manual Entry Option */}
      <button
        onClick={() => onSelect(null)}
        className={`w-full rounded-lg border-2 border-dashed p-4 text-left transition-all hover:bg-primary/5 ${
          !selectedTemplateId
            ? 'border-blue-500 bg-blue-50'
            : 'border-primary/20 bg-white'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2">
              <CreditCard className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-primary">Enter Manually</p>
              <p className="text-sm text-primary opacity-60">Custom card without template</p>
            </div>
          </div>
          {!selectedTemplateId && (
            <CheckCircle className="h-5 w-5 text-blue-600" />
          )}
        </div>
      </button>

      {/* Template Grid */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {filteredTemplates.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-primary opacity-60">No cards found</p>
            <p className="text-sm text-primary opacity-40 mt-1">Try a different search term</p>
          </div>
        ) : (
          filteredTemplates.map((template) => {
            const isSelected = selectedTemplateId === template.id;
            const annualValue = calculateAnnualBenefitValue(template.id);
            const netValue = getNetAnnualValue(template.id);

            return (
              <button
                key={template.id}
                onClick={() => {
                  // Need to import full template
                  void import('../../utils/creditCardTemplates').then((module) => {
                    const fullTemplate = module.getCardTemplateById(template.id);
                    if (fullTemplate) {
                      onSelect(fullTemplate);
                    }
                  });
                }}
                className={`w-full rounded-lg border p-4 text-left transition-all ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-500/30'
                    : 'border-primary/20 bg-white hover:bg-primary/5'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-primary">{template.name}</h4>
                      {isSelected && <CheckCircle className="h-4 w-4 text-blue-600" />}
                    </div>
                    <span
                      className={`inline-block text-xs px-2 py-0.5 rounded-full border ${getIssuerColor(
                        template.issuer
                      )}`}
                    >
                      {getIssuerName(template.issuer)}
                    </span>
                  </div>
                  <div className="text-right ml-3">
                    <p className="text-sm font-semibold text-primary">
                      {template.annualFee > 0 ? formatCurrency(template.annualFee) : 'No fee'}
                    </p>
                    <p className="text-xs text-primary opacity-60">Annual Fee</p>
                  </div>
                </div>

                {/* Benefits Summary */}
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div className="flex items-center gap-1.5">
                    <Award className="h-3.5 w-3.5 text-primary opacity-60" />
                    <span className="text-xs text-primary opacity-70">
                      {template.baseRewardsRate}x {template.rewardsType}
                    </span>
                  </div>
                  {template.benefitsCount > 0 && (
                    <div className="flex items-center gap-1.5">
                      <Gift className="h-3.5 w-3.5 text-primary opacity-60" />
                      <span className="text-xs text-primary opacity-70">
                        {template.benefitsCount} benefits
                      </span>
                    </div>
                  )}
                  {template.bonusesCount > 0 && (
                    <div className="flex items-center gap-1.5">
                      <DollarSign className="h-3.5 w-3.5 text-primary opacity-60" />
                      <span className="text-xs text-primary opacity-70">
                        {template.bonusesCount}x categories
                      </span>
                    </div>
                  )}
                  {template.hasWelcomeBonus && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs">🎯</span>
                      <span className="text-xs text-primary opacity-70">Welcome bonus</span>
                    </div>
                  )}
                </div>

                {/* Value Proposition */}
                {annualValue > 0 && (
                  <div className="pt-3 border-t border-primary/10">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-primary opacity-70">Annual value:</span>
                      <span className="font-semibold text-primary">
                        {formatCurrency(annualValue)}
                      </span>
                    </div>
                    {netValue !== 0 && (
                      <div className="flex items-center justify-between text-sm mt-1">
                        <span className="text-primary opacity-70">Net value:</span>
                        <span
                          className={`font-semibold ${
                            netValue > 0 ? 'text-emerald-600' : 'text-rose-600'
                          }`}
                        >
                          {netValue > 0 ? '+' : ''}
                          {formatCurrency(netValue)}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </button>
            );
          })
        )}
      </div>

      {filteredTemplates.length > 0 && (
        <p className="text-xs text-primary opacity-50 text-center">
          {filteredTemplates.length} card{filteredTemplates.length !== 1 ? 's' : ''} available
        </p>
      )}
    </div>
  );
};

export default CardTemplateSelector;
