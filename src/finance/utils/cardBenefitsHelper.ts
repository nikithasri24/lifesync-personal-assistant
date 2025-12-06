/**
 * Card Benefits Helper
 * Utilities for automatically populating benefits from templates
 */

import type { FinanceAPI } from '../data/api';
import { findCardTemplate, CREDIT_CARD_TEMPLATES } from './creditCardTemplates';
import type { CardBenefitInput, CardCategoryBonusInput, WelcomeBonusInput } from '../types';

/**
 * Automatically populate benefits for a credit card based on its name
 * Returns the number of benefits added
 */
export async function populateBenefitsFromTemplate(
  api: FinanceAPI,
  accountId: string,
  cardName: string
): Promise<{ benefitsAdded: number; bonusesAdded: number; welcomeBonusAdded: boolean }> {
  const template = findCardTemplate(cardName);

  if (!template) {
    return { benefitsAdded: 0, bonusesAdded: 0, welcomeBonusAdded: false };
  }

  let benefitsAdded = 0;
  let bonusesAdded = 0;
  let welcomeBonusAdded = false;

  try {
    // Add benefits
    if (template.benefits && template.benefits.length > 0) {
      for (const benefit of template.benefits) {
        await api.upsertCardBenefit(accountId, benefit as CardBenefitInput);
        benefitsAdded++;
      }
    }

    // Add category bonuses
    if (template.categoryBonuses && template.categoryBonuses.length > 0) {
      for (const bonus of template.categoryBonuses) {
        await api.upsertCategoryBonus(accountId, bonus as CardCategoryBonusInput);
        bonusesAdded++;
      }
    }

    // Add welcome bonus
    if (template.welcomeBonus) {
      await api.upsertWelcomeBonus(accountId, template.welcomeBonus as WelcomeBonusInput);
      welcomeBonusAdded = true;
    }

    return { benefitsAdded, bonusesAdded, welcomeBonusAdded };
  } catch (error) {
    console.error('Failed to populate benefits from template:', error);
    throw error;
  }
}

/**
 * Get a list of all available card templates for selection
 */
export function getAvailableCardTemplates() {
  return CREDIT_CARD_TEMPLATES.map((template) => ({
    id: template.id,
    name: template.name,
    issuer: template.issuer,
    annualFee: template.annualFee,
    rewardsType: template.rewardsType,
    baseRewardsRate: template.baseRewardsRate,
    benefitsCount: template.benefits.length,
    bonusesCount: template.categoryBonuses.length,
    hasWelcomeBonus: !!template.welcomeBonus,
  }));
}

/**
 * Get template by ID
 */
export function getTemplateById(id: string) {
  return CREDIT_CARD_TEMPLATES.find((t) => t.id === id);
}

/**
 * Suggest card templates based on partial name match
 */
export function suggestCardTemplates(partialName: string, limit = 5) {
  const normalized = partialName.toLowerCase().trim();

  if (!normalized) {
    return CREDIT_CARD_TEMPLATES.slice(0, limit);
  }

  const matches = CREDIT_CARD_TEMPLATES.filter((template) => {
    const templateName = template.name.toLowerCase();
    const issuerName = template.issuer.replace('_', ' ');
    return templateName.includes(normalized) || issuerName.includes(normalized);
  });

  return matches.slice(0, limit);
}

/**
 * Calculate total annual value of benefits for a template
 */
export function calculateAnnualBenefitValue(templateId: string): number {
  const template = getTemplateById(templateId);
  if (!template) return 0;

  let total = 0;

  template.benefits.forEach((benefit) => {
    if (benefit.value) {
      // Convert to annual value based on frequency
      switch (benefit.frequency) {
        case 'monthly':
          total += benefit.value; // Value is already annual (e.g., $15/mo = $180 stored)
          break;
        case 'quarterly':
          total += benefit.value; // Value is already annual
          break;
        case 'annual':
          total += benefit.value;
          break;
        case 'once':
          // One-time benefits don't count toward annual value
          break;
        default:
          break;
      }
    }
  });

  // Add welcome bonus value (estimated at 1 cent per point/mile)
  if (template.welcomeBonus) {
    total += template.welcomeBonus.bonusAmount * 0.01;
  }

  return total;
}

/**
 * Get net annual value after fee
 */
export function getNetAnnualValue(templateId: string): number {
  const template = getTemplateById(templateId);
  if (!template) return 0;

  const benefitValue = calculateAnnualBenefitValue(templateId);
  return benefitValue - template.annualFee;
}

/**
 * Recommend best cards for a user based on spending categories
 */
export function recommendCardsForCategories(
  categories: string[]
): Array<{ template: typeof CREDIT_CARD_TEMPLATES[0]; score: number; reason: string }> {
  const recommendations = CREDIT_CARD_TEMPLATES.map((template) => {
    let score = 0;
    const reasons: string[] = [];

    // Check category bonuses
    categories.forEach((category) => {
      const bonus = template.categoryBonuses.find((b) => b.category === category);
      if (bonus) {
        score += bonus.rewardsRate * 10; // Weight by earning rate
        reasons.push(`${bonus.rewardsRate}x on ${category}`);
      }
    });

    // Add base rewards
    score += template.baseRewardsRate;

    // Factor in annual fee (negative impact)
    score -= template.annualFee / 100;

    // Factor in benefits value
    const benefitValue = calculateAnnualBenefitValue(template.id);
    score += benefitValue / 100;

    return {
      template,
      score,
      reason: reasons.length > 0 ? reasons.join(', ') : `${template.baseRewardsRate}x on all purchases`,
    };
  });

  return recommendations.sort((a, b) => b.score - a.score);
}
