/**
 * Finance Credit Cards API
 * Handles credit card benefits, bonuses, and offers tracking
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { AuthenticationError } from '@/lib/errors';
import type {
  CardBenefit,
  CardBenefitInput,
  CardCategoryBonus,
  CardCategoryBonusInput,
  WelcomeBonus,
  WelcomeBonusInput,
  CardOffer,
  CardOfferInput,
} from '../types';

export class CreditCardsAPI {
  private client: SupabaseClient;

  constructor(client: SupabaseClient) {
    this.client = client;
  }

  private async getUserId(): Promise<string> {
    const { data: { user }, error } = await this.client.auth.getUser();
    if (error || !user) throw new AuthenticationError('Not authenticated', { error });
    return user.id;
  }

  // =====================================================
  // CREDIT CARD FEATURES
  // =====================================================

  async listCardBenefits(accountId: string): Promise<CardBenefit[]> {
    const userId = await this.getUserId();
    const { data, error } = await this.client
      .from('finance_card_benefits')
      .select('*')
      .eq('account_id', accountId)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map(row => ({
      id: row.id,
      userId: row.user_id,
      accountId: row.account_id,
      benefitType: row.benefit_type,
      name: row.name,
      description: row.description,
      value: row.value ? parseFloat(row.value) : undefined,
      frequency: row.frequency,
      usedAmount: row.used_amount ? parseFloat(row.used_amount) : 0,
      resetDate: row.reset_date,
      active: row.active,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  }

  async upsertCardBenefit(accountId: string, benefit: CardBenefitInput): Promise<void> {
    const userId = await this.getUserId();

    const row = {
      id: benefit.id,
      user_id: userId,
      account_id: accountId,
      benefit_type: benefit.benefitType,
      name: benefit.name,
      description: benefit.description,
      value: benefit.value,
      frequency: benefit.frequency,
      used_amount: benefit.usedAmount,
      reset_date: benefit.resetDate,
      active: benefit.active,
    };

    const { error } = await this.client
      .from('finance_card_benefits')
      .upsert(row);

    if (error) throw error;
  }

  async deleteCardBenefit(benefitId: string): Promise<void> {
    const userId = await this.getUserId();
    const { error } = await this.client
      .from('finance_card_benefits')
      .delete()
      .eq('id', benefitId)
      .eq('user_id', userId);

    if (error) throw error;
  }

  async listCategoryBonuses(accountId: string): Promise<CardCategoryBonus[]> {
    const userId = await this.getUserId();
    const { data, error } = await this.client
      .from('finance_card_category_bonuses')
      .select('*')
      .eq('account_id', accountId)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map(row => ({
      id: row.id,
      userId: row.user_id,
      accountId: row.account_id,
      category: row.category,
      rewardsRate: parseFloat(row.rewards_rate),
      isRotating: row.is_rotating,
      startDate: row.start_date,
      endDate: row.end_date,
      createdAt: row.created_at,
    }));
  }

  async upsertCategoryBonus(accountId: string, bonus: CardCategoryBonusInput): Promise<void> {
    const userId = await this.getUserId();

    const row = {
      id: bonus.id,
      user_id: userId,
      account_id: accountId,
      category: bonus.category,
      rewards_rate: bonus.rewardsRate,
      is_rotating: bonus.isRotating,
      start_date: bonus.startDate,
      end_date: bonus.endDate,
    };

    const { error } = await this.client
      .from('finance_card_category_bonuses')
      .upsert(row);

    if (error) throw error;
  }

  async listWelcomeBonuses(accountId: string): Promise<WelcomeBonus[]> {
    const userId = await this.getUserId();
    const { data, error } = await this.client
      .from('finance_welcome_bonuses')
      .select('*')
      .eq('account_id', accountId)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map(row => ({
      id: row.id,
      userId: row.user_id,
      accountId: row.account_id,
      bonusAmount: parseFloat(row.bonus_amount),
      requiredSpend: parseFloat(row.required_spend),
      currentSpend: parseFloat(row.current_spend),
      deadline: row.deadline,
      completed: row.completed,
      completedDate: row.completed_date,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  }

  async upsertWelcomeBonus(accountId: string, bonus: WelcomeBonusInput): Promise<void> {
    const userId = await this.getUserId();

    const row = {
      id: bonus.id,
      user_id: userId,
      account_id: accountId,
      bonus_amount: bonus.bonusAmount,
      required_spend: bonus.requiredSpend,
      current_spend: bonus.currentSpend,
      deadline: bonus.deadline,
      completed: bonus.completed,
      completed_date: bonus.completedDate,
    };

    const { error } = await this.client
      .from('finance_welcome_bonuses')
      .upsert(row);

    if (error) throw error;
  }

  async listCardOffers(accountId: string): Promise<CardOffer[]> {
    const userId = await this.getUserId();
    const { data, error } = await this.client
      .from('finance_card_offers')
      .select('*')
      .eq('account_id', accountId)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map(row => ({
      id: row.id,
      userId: row.user_id,
      accountId: row.account_id,
      merchant: row.merchant,
      offerType: row.offer_type,
      offerAmount: parseFloat(row.offer_amount),
      requiredSpend: row.required_spend ? parseFloat(row.required_spend) : undefined,
      expirationDate: row.expiration_date,
      activated: row.activated,
      activatedDate: row.activated_date,
      redeemed: row.redeemed,
      redeemedDate: row.redeemed_date,
      createdAt: row.created_at,
    }));
  }

  async upsertCardOffer(accountId: string, offer: CardOfferInput): Promise<void> {
    const userId = await this.getUserId();

    const row = {
      id: offer.id,
      user_id: userId,
      account_id: accountId,
      merchant: offer.merchant,
      offer_type: offer.offerType,
      offer_amount: offer.offerAmount,
      required_spend: offer.requiredSpend,
      expiration_date: offer.expirationDate,
      activated: offer.activated,
      activated_date: offer.activatedDate,
      redeemed: offer.redeemed,
      redeemed_date: offer.redeemedDate,
    };

    const { error } = await this.client
      .from('finance_card_offers')
      .upsert(row);

    if (error) throw error;
  }
}
