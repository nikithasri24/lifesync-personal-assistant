import type { SupabaseClient } from '@supabase/supabase-js';
import type { FinanceAPI } from './api';
import type {
  Institution,
  Account,
  Transaction,
  Budget,
  BudgetTemplate,
  BudgetTemplateInput,
  Category,
  NetPoint,
  Goal,
  TxnQuery,
  Paginated,
  TransactionInput,
  GoalInput,
  GoalProgressPoint,
  CardBenefit,
  CardBenefitInput,
  CardCategoryBonus,
  CardCategoryBonusInput,
  WelcomeBonus,
  WelcomeBonusInput,
  CardOffer,
  CardOfferInput,
  Loan,
  LoanInput,
  LoanPayment,
  LoanPaymentInput,
  RetirementAccountWithStats,
  RetirementAccountMetadataInput,
  RetirementContribution,
  RetirementContributionInput,
  RetirementPerformance,
  RetirementPerformanceInput,
  ContributionRoom,
} from '../types';

/**
 * Supabase implementation of FinanceAPI
 */
export class SupabaseApi implements FinanceAPI {
  private client: SupabaseClient;

  constructor(client: SupabaseClient) {
    this.client = client;
  }

  private async getUserId(): Promise<string> {
    const { data: { user }, error } = await this.client.auth.getUser();
    if (error || !user) throw new Error('Not authenticated');
    return user.id;
  }

  // =====================================================
  // INSTITUTIONS
  // =====================================================

  async listInstitutions(): Promise<Institution[]> {
    const userId = await this.getUserId();
    const { data, error } = await this.client
      .from('finance_institutions')
      .select('*')
      .eq('user_id', userId)
      .order('name');

    if (error) throw error;
    return (data || []).map(row => ({
      id: row.id,
      userId: row.user_id,
      name: row.name,
      logoUrl: row.logo_url,
    }));
  }

  // =====================================================
  // ACCOUNTS
  // =====================================================

  async listAccounts(): Promise<Account[]> {
    // Don't filter by user_id - let RLS handle access control
    // This allows viewing partner's accounts in merged mode
    const { data, error } = await this.client
      .from('finance_accounts')
      .select('*')
      .order('name');

    if (error) throw error;
    return (data || []).map(row => ({
      id: row.id,
      userId: row.user_id,
      institutionId: row.institution_id,
      name: row.name,
      type: row.type,
      balance: parseFloat(row.balance),
      lastUpdatedISO: row.last_updated_at,
      liability: row.liability,
      creditLimit: row.credit_limit ? parseFloat(row.credit_limit) : undefined,
      apr: row.apr ? parseFloat(row.apr) : undefined,
      paymentDueDay: row.payment_due_day,
      minimumPayment: row.minimum_payment ? parseFloat(row.minimum_payment) : undefined,
      statementBalance: row.statement_balance ? parseFloat(row.statement_balance) : undefined,
      statementDate: row.statement_date,
      annualFee: row.annual_fee ? parseFloat(row.annual_fee) : undefined,
      annualFeeDueDate: row.annual_fee_due_date,
      rewardsBalance: row.rewards_balance ? parseFloat(row.rewards_balance) : undefined,
      rewardsType: row.rewards_type,
      baseRewardsRate: row.base_rewards_rate ? parseFloat(row.base_rewards_rate) : undefined,
    }));
  }

  async updateAccount(accountId: string, updates: Partial<Account>): Promise<void> {
    const userId = await this.getUserId();
    const dbUpdates: any = {};

    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.balance !== undefined) dbUpdates.balance = updates.balance;
    if (updates.institutionId !== undefined) dbUpdates.institution_id = updates.institutionId;
    if (updates.userId !== undefined) dbUpdates.user_id = updates.userId; // Allow ownership transfer
    if (updates.creditLimit !== undefined) dbUpdates.credit_limit = updates.creditLimit;
    if (updates.apr !== undefined) dbUpdates.apr = updates.apr;
    if (updates.paymentDueDay !== undefined) dbUpdates.payment_due_day = updates.paymentDueDay;
    if (updates.minimumPayment !== undefined) dbUpdates.minimum_payment = updates.minimumPayment;
    if (updates.statementBalance !== undefined) dbUpdates.statement_balance = updates.statementBalance;
    if (updates.statementDate !== undefined) dbUpdates.statement_date = updates.statementDate;
    if (updates.annualFee !== undefined) dbUpdates.annual_fee = updates.annualFee;
    if (updates.annualFeeDueDate !== undefined) dbUpdates.annual_fee_due_date = updates.annualFeeDueDate;
    if (updates.rewardsBalance !== undefined) dbUpdates.rewards_balance = updates.rewardsBalance;
    if (updates.rewardsType !== undefined) dbUpdates.rewards_type = updates.rewardsType;
    if (updates.baseRewardsRate !== undefined) dbUpdates.base_rewards_rate = updates.baseRewardsRate;

    dbUpdates.updated_at = new Date().toISOString();

    // Don't filter by user_id when updating - allow updating partner's accounts in merged mode
    // RLS will handle access control
    const { error } = await this.client
      .from('finance_accounts')
      .update(dbUpdates)
      .eq('id', accountId);

    if (error) throw error;
  }

  async upsertAccount(account: { id?: string; name: string; type: string; balance: number; institutionId?: string; userId?: string }): Promise<void> {
    const currentUserId = await this.getUserId();

    if (account.id) {
      // Update existing
      await this.updateAccount(account.id, {
        name: account.name,
        balance: account.balance,
        institutionId: account.institutionId,
        userId: account.userId, // Allow ownership transfer
      });
    } else {
      // Insert new - use provided userId or default to current user
      const { error } = await this.client
        .from('finance_accounts')
        .insert({
          user_id: account.userId ?? currentUserId,
          name: account.name,
          type: account.type,
          balance: account.balance,
          institution_id: account.institutionId,
        });

      if (error) throw error;
    }
  }

  async deleteAccount(accountId: string): Promise<void> {
    const userId = await this.getUserId();
    const { error } = await this.client
      .from('finance_accounts')
      .delete()
      .eq('id', accountId)
      .eq('user_id', userId);

    if (error) throw error;
  }

  // =====================================================
  // TRANSACTIONS
  // =====================================================

  async listTransactions(params: TxnQuery): Promise<Paginated<Transaction>> {
    // Don't filter by user_id - let RLS handle access control
    // This allows viewing partner's transactions in merged mode
    let query = this.client
      .from('finance_transactions')
      .select('*');

    if (params.fromISO) query = query.gte('date', params.fromISO);
    if (params.toISO) query = query.lte('date', params.toISO);
    if (params.accountIds?.length) query = query.in('account_id', params.accountIds);
    if (params.categoryIds?.length) query = query.in('category_id', params.categoryIds);
    if (params.type) query = query.eq('type', params.type);
    if (params.text) query = query.ilike('description', `%${params.text}%`);

    query = query.order('date', { ascending: false });

    const limit = params.limit || 100;
    query = query.limit(limit);

    const { data, error } = await query;
    if (error) throw error;

    const items = (data || []).map(row => ({
      id: row.id,
      userId: row.user_id,
      accountId: row.account_id,
      dateISO: row.date,
      description: row.description,
      categoryId: row.category_id,
      amount: parseFloat(row.amount),
      type: row.type,
      notes: row.notes,
      merchantName: row.merchant_name,
      confidenceScore: row.confidence_score ? parseFloat(row.confidence_score) : undefined,
      suggestedCategoryId: row.suggested_category_id,
      categorizationRuleId: row.categorization_rule_id,
    }));

    return { items, nextCursor: undefined };
  }

  async upsertTransaction(txn: TransactionInput): Promise<void> {
    const userId = await this.getUserId();

    if (txn.id) {
      // Update existing
      const { error } = await this.client
        .from('finance_transactions')
        .update({
          account_id: txn.accountId,
          date: txn.dateISO,
          description: txn.description,
          category_id: txn.categoryId,
          amount: txn.amount,
          type: txn.type,
          notes: txn.notes,
          merchant_name: txn.merchantName,
          confidence_score: txn.confidenceScore,
          suggested_category_id: txn.suggestedCategoryId,
          categorization_rule_id: txn.categorizationRuleId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', txn.id)
        .eq('user_id', userId);

      if (error) throw error;
    } else {
      // Insert new
      const { error } = await this.client
        .from('finance_transactions')
        .insert({
          user_id: userId,
          account_id: txn.accountId,
          date: txn.dateISO,
          description: txn.description,
          category_id: txn.categoryId,
          amount: txn.amount,
          type: txn.type,
          notes: txn.notes,
          merchant_name: txn.merchantName,
          confidence_score: txn.confidenceScore,
          suggested_category_id: txn.suggestedCategoryId,
          categorization_rule_id: txn.categorizationRuleId,
        });

      if (error) throw error;
    }
  }

  async deleteTransaction(id: string): Promise<void> {
    const userId = await this.getUserId();
    const { error } = await this.client
      .from('finance_transactions')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw error;
  }

  // =====================================================
  // BUDGETS
  // =====================================================

  async listBudgets(monthISO: string): Promise<Budget[]> {
    const userId = await this.getUserId();
    const month = monthISO.slice(0, 7); // YYYY-MM

    const { data, error } = await this.client
      .from('finance_budgets')
      .select('*')
      .eq('user_id', userId)
      .eq('month', month);

    if (error) throw error;
    return (data || []).map(row => ({
      id: row.id,
      userId: row.user_id,
      categoryId: row.category_id,
      month: row.month,
      limit: parseFloat(row.limit_amount),
    }));
  }

  async upsertBudget(budget: { categoryId: string; month: string; limit: number }): Promise<void> {
    const userId = await this.getUserId();
    const month = budget.month.slice(0, 7); // YYYY-MM

    const { error } = await this.client
      .from('finance_budgets')
      .upsert({
        user_id: userId,
        category_id: budget.categoryId,
        month,
        limit_amount: budget.limit,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,category_id,month',
      });

    if (error) throw error;
  }

  async deleteBudget(categoryId: string, month: string): Promise<void> {
    const userId = await this.getUserId();
    const monthStr = month.slice(0, 7); // YYYY-MM

    const { error } = await this.client
      .from('finance_budgets')
      .delete()
      .eq('user_id', userId)
      .eq('category_id', categoryId)
      .eq('month', monthStr);

    if (error) throw error;
  }

  async listBudgetTemplates(): Promise<BudgetTemplate[]> {
    const userId = await this.getUserId();
    const { data, error } = await this.client
      .from('finance_budget_templates')
      .select('*')
      .eq('user_id', userId);

    if (error) throw error;
    return (data || []).map(row => ({
      id: row.id,
      userId: row.user_id,
      categoryId: row.category_id,
      defaultAmount: parseFloat(row.default_amount),
    }));
  }

  async upsertBudgetTemplate(template: BudgetTemplateInput): Promise<void> {
    const userId = await this.getUserId();

    const { error } = await this.client
      .from('finance_budget_templates')
      .upsert({
        id: template.id,
        user_id: userId,
        category_id: template.categoryId,
        default_amount: template.defaultAmount,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,category_id',
      });

    if (error) throw error;
  }

  async deleteBudgetTemplate(categoryId: string): Promise<void> {
    const userId = await this.getUserId();
    const { error} = await this.client
      .from('finance_budget_templates')
      .delete()
      .eq('user_id', userId)
      .eq('category_id', categoryId);

    if (error) throw error;
  }

  async initializeBudgetsFromTemplates(month: string): Promise<number> {
    const templates = await this.listBudgetTemplates();
    const monthStr = month.slice(0, 7); // YYYY-MM

    let count = 0;
    for (const template of templates) {
      try {
        await this.upsertBudget({
          categoryId: template.categoryId,
          month: monthStr,
          limit: template.defaultAmount,
        });
        count++;
      } catch (error) {
        // Skip if budget already exists
      }
    }

    return count;
  }

  // =====================================================
  // CATEGORIES
  // =====================================================

  async listCategories(): Promise<Category[]> {
    const userId = await this.getUserId();
    const { data, error } = await this.client
      .from('finance_categories')
      .select('*')
      .eq('user_id', userId)
      .order('name');

    if (error) throw error;
    return (data || []).map(row => ({
      id: row.id,
      userId: row.user_id,
      name: row.name,
      parentId: row.parent_id,
      icon: row.icon,
      color: row.color,
    }));
  }

  // =====================================================
  // NET WORTH
  // =====================================================

  async listNetWorth(): Promise<NetPoint[]> {
    // Calculate net worth from accounts
    const accounts = await this.listAccounts();

    // Group by month and calculate assets/liabilities
    const monthMap = new Map<string, { assets: number; liabilities: number }>();

    for (const account of accounts) {
      const month = account.lastUpdatedISO.slice(0, 7); // YYYY-MM
      const existing = monthMap.get(month) || { assets: 0, liabilities: 0 };

      if (account.liability) {
        existing.liabilities += account.balance;
      } else {
        existing.assets += account.balance;
      }

      monthMap.set(month, existing);
    }

    return Array.from(monthMap.entries())
      .map(([month, values]) => ({
        month,
        assets: values.assets,
        liabilities: values.liabilities,
      }))
      .sort((a, b) => a.month.localeCompare(b.month));
  }

  // =====================================================
  // GOALS
  // =====================================================

  async listGoals(): Promise<Goal[]> {
    // Don't filter by user_id - let RLS handle access control
    // This allows viewing partner's goals in merged mode
    const { data, error } = await this.client
      .from('finance_goals')
      .select('*')
      .order('due_date');

    if (error) throw error;
    return (data || []).map(row => ({
      id: row.id,
      userId: row.user_id,
      name: row.name,
      targetAmount: parseFloat(row.target_amount),
      currentAmount: parseFloat(row.current_amount),
      startingAmount: parseFloat(row.starting_amount),
      dueDateISO: row.due_date,
      type: row.type,
      linkedCategoryId: row.linked_category_id,
      linkedAccountId: row.linked_account_id,
      trackNetworth: row.track_networth,
      createdAtISO: row.created_at,
      updatedAtISO: row.updated_at,
    }));
  }

  async upsertGoal(goal: GoalInput): Promise<void> {
    const userId = await this.getUserId();

    if (goal.id) {
      // Update existing
      const { error } = await this.client
        .from('finance_goals')
        .update({
          name: goal.name,
          target_amount: goal.targetAmount,
          current_amount: goal.currentAmount,
          starting_amount: goal.startingAmount,
          due_date: goal.dueDateISO,
          type: goal.type,
          linked_category_id: goal.linkedCategoryId,
          linked_account_id: goal.linkedAccountId,
          track_networth: goal.trackNetworth,
          updated_at: new Date().toISOString(),
        })
        .eq('id', goal.id)
        .eq('user_id', userId);

      if (error) throw error;
    } else {
      // Insert new
      const { error } = await this.client
        .from('finance_goals')
        .insert({
          user_id: userId,
          name: goal.name,
          target_amount: goal.targetAmount,
          current_amount: goal.currentAmount,
          starting_amount: goal.startingAmount,
          due_date: goal.dueDateISO,
          type: goal.type,
          linked_category_id: goal.linkedCategoryId,
          linked_account_id: goal.linkedAccountId,
          track_networth: goal.trackNetworth,
        });

      if (error) throw error;
    }
  }

  async deleteGoal(goalId: string): Promise<void> {
    const userId = await this.getUserId();
    const { error } = await this.client
      .from('finance_goals')
      .delete()
      .eq('id', goalId)
      .eq('user_id', userId);

    if (error) throw error;
  }

  async getGoalProgressHistory(goalId: string): Promise<GoalProgressPoint[]> {
    const userId = await this.getUserId();
    const { data, error } = await this.client
      .from('finance_goal_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('goal_id', goalId)
      .order('date', { ascending: true });

    if (error) throw error;
    return (data || []).map(row => ({
      dateISO: row.date,
      amount: parseFloat(row.amount),
      note: row.note,
    }));
  }

  async syncGoalFromAccount(goalId: string): Promise<void> {
    const userId = await this.getUserId();

    // Get goal
    const { data: goalData, error: goalError } = await this.client
      .from('finance_goals')
      .select('*')
      .eq('id', goalId)
      .eq('user_id', userId)
      .single();

    if (goalError) throw goalError;
    if (!goalData.linked_account_id) return;

    // Get account balance
    const { data: accountData, error: accountError } = await this.client
      .from('finance_accounts')
      .select('balance')
      .eq('id', goalData.linked_account_id)
      .eq('user_id', userId)
      .single();

    if (accountError) throw accountError;

    // Update goal
    const { error: updateError } = await this.client
      .from('finance_goals')
      .update({
        current_amount: accountData.balance,
        updated_at: new Date().toISOString(),
      })
      .eq('id', goalId)
      .eq('user_id', userId);

    if (updateError) throw updateError;
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

  // =====================================================
  // LOANS
  // =====================================================

  async listLoans(): Promise<Loan[]> {
    // Don't filter by user_id - let RLS handle access control
    // This allows viewing partner's loans in merged mode
    const { data, error } = await this.client
      .from('finance_loans_with_stats')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map(row => ({
      id: row.id,
      userId: row.user_id,
      accountId: row.account_id,
      loanName: row.loan_name,
      loanType: row.loan_type,
      status: row.status,
      principalAmount: parseFloat(row.principal_amount),
      currentBalance: parseFloat(row.current_balance),
      interestRate: parseFloat(row.interest_rate),
      monthlyPayment: parseFloat(row.monthly_payment),
      extraPayment: parseFloat(row.extra_payment),
      targetPayoffDate: row.target_payoff_date,
      startDate: row.start_date,
      firstPaymentDate: row.first_payment_date,
      lender: row.lender,
      loanNumber: row.loan_number,
      termMonths: row.term_months,
      notes: row.notes,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      // Calculated fields from the view
      totalPaid: row.total_paid ? parseFloat(row.total_paid) : undefined,
      interestPaid: row.interest_paid ? parseFloat(row.interest_paid) : undefined,
      principalPaid: row.principal_paid ? parseFloat(row.principal_paid) : undefined,
      remainingPayments: row.remaining_payments || undefined,
      projectedPayoffDate: row.projected_payoff_date || undefined,
    }));
  }

  async upsertLoan(loan: LoanInput): Promise<void> {
    const userId = await this.getUserId();

    const row = {
      id: loan.id,
      user_id: userId,
      account_id: loan.accountId,
      loan_name: loan.loanName,
      loan_type: loan.loanType,
      status: loan.status,
      principal_amount: loan.principalAmount,
      current_balance: loan.currentBalance,
      interest_rate: loan.interestRate,
      monthly_payment: loan.monthlyPayment,
      extra_payment: loan.extraPayment,
      target_payoff_date: loan.targetPayoffDate,
      start_date: loan.startDate,
      first_payment_date: loan.firstPaymentDate,
      lender: loan.lender,
      loan_number: loan.loanNumber,
      term_months: loan.termMonths,
      notes: loan.notes,
    };

    const { error } = await this.client
      .from('finance_loans')
      .upsert(row);

    if (error) throw error;
  }

  async deleteLoan(loanId: string): Promise<void> {
    const userId = await this.getUserId();
    const { error } = await this.client
      .from('finance_loans')
      .delete()
      .eq('id', loanId)
      .eq('user_id', userId);

    if (error) throw error;
  }

  async listLoanPayments(loanId: string): Promise<LoanPayment[]> {
    const userId = await this.getUserId();
    const { data, error } = await this.client
      .from('finance_loan_payments')
      .select('*')
      .eq('loan_id', loanId)
      .eq('user_id', userId)
      .order('payment_date', { ascending: false });

    if (error) throw error;

    return (data || []).map(row => ({
      id: row.id,
      loanId: row.loan_id,
      paymentDate: row.payment_date,
      amount: parseFloat(row.amount),
      principalAmount: parseFloat(row.principal_amount),
      interestAmount: parseFloat(row.interest_amount),
      extraAmount: parseFloat(row.extra_amount),
      balanceAfter: parseFloat(row.balance_after),
      transactionId: row.transaction_id,
      notes: row.notes,
      createdAt: row.created_at,
    }));
  }

  async upsertLoanPayment(loanId: string, payment: LoanPaymentInput): Promise<void> {
    const userId = await this.getUserId();

    const row = {
      id: payment.id,
      user_id: userId,
      loan_id: loanId,
      payment_date: payment.paymentDate,
      amount: payment.amount,
      principal_amount: payment.principalAmount,
      interest_amount: payment.interestAmount,
      extra_amount: payment.extraAmount,
      balance_after: payment.balanceAfter,
      transaction_id: payment.transactionId,
      notes: payment.notes,
    };

    const { error } = await this.client
      .from('finance_loan_payments')
      .upsert(row);

    if (error) throw error;
  }

  async deleteLoanPayment(paymentId: string): Promise<void> {
    const userId = await this.getUserId();
    const { error } = await this.client
      .from('finance_loan_payments')
      .delete()
      .eq('id', paymentId)
      .eq('user_id', userId);

    if (error) throw error;
  }

  // =====================================================
  // RETIREMENT ACCOUNTS (Stub implementations - to be completed later)
  // =====================================================

  async listRetirementAccounts(): Promise<RetirementAccountWithStats[]> {
    return [];
  }

  async getRetirementAccount(_accountId: string): Promise<RetirementAccountWithStats | null> {
    return null;
  }

  async upsertRetirementAccountMetadata(_metadata: RetirementAccountMetadataInput): Promise<void> {
    // TODO: Implement when needed
  }

  async deleteRetirementAccountMetadata(_accountId: string): Promise<void> {
    // TODO: Implement when needed
  }

  async listRetirementContributions(_retirementAccountId: string): Promise<RetirementContribution[]> {
    return [];
  }

  async addRetirementContribution(_contribution: RetirementContributionInput): Promise<void> {
    // TODO: Implement when needed
  }

  async deleteRetirementContribution(_contributionId: string): Promise<void> {
    // TODO: Implement when needed
  }

  async calculateContributionRoom(_retirementAccountId: string, _annualIncome: number): Promise<ContributionRoom> {
    return {
      employeeRoom: 0,
      employerRoom: 0,
      totalLimit: 0,
      isOver50: false,
    };
  }

  async listRetirementPerformance(_retirementAccountId: string): Promise<RetirementPerformance[]> {
    return [];
  }

  async recordRetirementPerformance(_performance: RetirementPerformanceInput): Promise<void> {
    // TODO: Implement when needed
  }

  async calculateVestedBalance(_retirementAccountId: string, _employmentYears: number): Promise<number> {
    return 0;
  }
}
