import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  Account,
  Budget,
  BudgetTemplate,
  BudgetTemplateInput,
  CardBenefit,
  CardBenefitInput,
  CardCategoryBonus,
  CardCategoryBonusInput,
  CardOffer,
  CardOfferInput,
  Category,
  Goal,
  GoalInput,
  GoalProgressPoint,
  Institution,
  NetPoint,
  Paginated,
  Transaction,
  TransactionInput,
  TxnQuery,
  WelcomeBonus,
  WelcomeBonusInput,
  Loan,
  LoanInput,
  LoanPayment,
  LoanPaymentInput,
  RecurringTransaction,
  RecurringTransactionInput,
  PendingTransaction,
  PendingTransactionInput,
  RetirementAccountWithStats,
  RetirementAccountMetadataInput,
  RetirementContribution,
  RetirementContributionInput,
  RetirementPerformance,
  RetirementPerformanceInput,
  ContributionRoom,
  TaxTreatment,
  EmployerMatchType,
  VestingScheduleType,
  ContributionType,
  InvestmentAllocation,
} from '../types';
import type { FinanceAPI } from './api';
import { validateGoalInput, validateTransactionInput } from '../utils/validate';
import { logger } from '../../services/logger';

// Database row type definitions
interface InstitutionRow {
  id: string;
  name: string;
  logo_url: string | null;
}

interface AccountRow {
  id: string;
  name: string;
  type: string;
  balance: string | number;
  liability: boolean;
  last_updated: string;
  institution_id: string | null;
  credit_limit: string | number | null;
  apr: string | number | null;
  payment_due_day: number | null;
  minimum_payment: string | number | null;
  statement_balance: string | number | null;
  statement_date: string | null;
  annual_fee: string | number | null;
  annual_fee_due_date: string | null;
  rewards_balance: string | number | null;
  rewards_type: string | null;
  base_rewards_rate: string | number | null;
}

interface TransactionRow {
  id: string;
  account_id: string;
  date: string;
  description: string;
  category_id: string | null;
  amount: string | number;
  type: string;
  notes: string | null;
  merchant_name: string | null;
  confidence_score: string | number | null;
  suggested_category_id: string | null;
  categorization_rule_id: string | null;
}

interface BudgetRow {
  id: string;
  category_id: string;
  month: string;
  limit_amount: string | number;
}

interface BudgetTemplateRow {
  id: string;
  category_id: string;
  default_amount: string | number;
}

interface CategoryRow {
  id: string;
  name: string;
  parent_id: string | null;
  icon: string | null;
  color: string | null;
}

interface NetWorthRow {
  month: string;
  assets: string | number;
  liabilities: string | number;
}

interface GoalRow {
  id: string;
  name: string;
  target_amount: string | number;
  current_amount: string | number;
  starting_amount: string | number | null;
  due_date: string;
  type: string;
  linked_category_id: string | null;
  linked_account_id: string | null;
  track_networth: boolean | null;
  created_at: string | null;
  updated_at: string | null;
}

interface GoalProgressRow {
  recorded_at: string;
  amount: string | number;
  note: string | null;
}

interface CardBenefitRow {
  id: string;
  account_id: string;
  benefit_type: string;
  name: string;
  description: string | null;
  value: string | number | null;
  frequency: string | null;
  used_amount: string | number;
  reset_date: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

interface CardCategoryBonusRow {
  id: string;
  account_id: string;
  category: string;
  rewards_rate: string | number;
  is_rotating: boolean;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
}

interface WelcomeBonusRow {
  id: string;
  account_id: string;
  bonus_amount: string | number;
  required_spend: string | number;
  current_spend: string | number;
  deadline: string;
  completed: boolean;
  completed_date: string | null;
  created_at: string;
  updated_at: string;
}

interface CardOfferRow {
  id: string;
  account_id: string;
  merchant: string;
  offer_type: string;
  offer_amount: string | number;
  required_spend: string | number | null;
  expiration_date: string | null;
  activated: boolean;
  activated_date: string | null;
  redeemed: boolean;
  redeemed_date: string | null;
  created_at: string;
}

interface TransactionUpdateRow {
  user_id: string;
  account_id: string;
  date: string;
  description: string;
  category_id: string | null;
  amount: number;
  type: string;
  notes: string | null;
  merchant_name: string;
  id?: string;
}

interface BudgetUpdateRow {
  user_id: string;
  category_id: string;
  month: string;
  limit_amount: number;
}

interface BudgetTemplateUpdateRow {
  user_id: string;
  category_id: string;
  default_amount: number;
  id?: string;
}

interface GoalUpdateRow {
  user_id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  starting_amount: number;
  due_date: string;
  type: string;
  linked_category_id: string | null;
  linked_account_id: string | null;
  track_networth: boolean;
  id?: string;
}

interface CardBenefitUpdateRow {
  user_id: string;
  account_id: string;
  benefit_type: string;
  name: string;
  description: string | undefined;
  value: number | undefined;
  frequency: string | undefined;
  used_amount: number | undefined;
  reset_date: string | undefined;
  active: boolean | undefined;
  id?: string;
}

interface CardCategoryBonusUpdateRow {
  user_id: string;
  account_id: string;
  category: string;
  rewards_rate: number;
  is_rotating: boolean;
  start_date: string | undefined;
  end_date: string | undefined;
  id?: string;
}

interface WelcomeBonusUpdateRow {
  user_id: string;
  account_id: string;
  bonus_amount: number;
  required_spend: number;
  current_spend: number;
  deadline: string;
  completed: boolean;
  completed_date: string | undefined;
  id?: string;
}

interface CardOfferUpdateRow {
  user_id: string;
  account_id: string;
  merchant: string;
  offer_type: string;
  offer_amount: number;
  required_spend: number | undefined;
  expiration_date: string | undefined;
  activated: boolean;
  activated_date: string | undefined;
  redeemed: boolean;
  redeemed_date: string | undefined;
  id?: string;
}

interface LoanRow {
  id: string;
  account_id: string | null;
  loan_name: string;
  loan_type: string;
  status: string;
  principal_amount: string | number;
  current_balance: string | number;
  interest_rate: string | number;
  monthly_payment: string | number;
  extra_payment: string | number;
  target_payoff_date: string;
  start_date: string;
  first_payment_date: string;
  lender: string | null;
  loan_number: string | null;
  term_months: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  total_paid?: string | number;
  interest_paid?: string | number;
  principal_paid?: string | number;
  payment_count?: number;
  remaining_payments?: number;
  projected_payoff_date?: string;
}

interface LoanPaymentRow {
  id: string;
  loan_id: string;
  payment_date: string;
  amount: string | number;
  principal_amount: string | number;
  interest_amount: string | number;
  extra_amount: string | number;
  balance_after: string | number;
  transaction_id: string | null;
  notes: string | null;
  created_at: string;
}

interface RecurringTransactionRow {
  id: string;
  description: string;
  amount: string | number;
  type: string;
  category_id: string | null;
  account_id: string | null;
  frequency: string;
  start_date: string;
  end_date: string | null;
  day_of_month: number | null;
  day_of_week: number | null;
  auto_create: boolean;
  require_approval: boolean;
  days_before: number;
  active: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
  last_generated_date: string | null;
  next_occurrence_date?: string | null;
  pending_count?: number;
}

interface PendingTransactionRow {
  id: string;
  recurring_transaction_id: string | null;
  description: string;
  amount: string | number;
  type: string;
  category_id: string | null;
  account_id: string | null;
  scheduled_date: string;
  status: string;
  transaction_id: string | null;
  notes: string | null;
  created_at: string;
  reviewed_at: string | null;
}

interface RecurringTransactionUpdateRow {
  id?: string;
  user_id: string;
  description: string;
  amount: number;
  type: string;
  category_id: string | null;
  account_id: string | null;
  frequency: string;
  start_date: string;
  end_date: string | null;
  day_of_month: number | null;
  day_of_week: number | null;
  auto_create: boolean;
  require_approval: boolean;
  days_before: number;
  active: boolean;
  notes: string | null;
}

interface LoanUpdateRow {
  user_id: string;
  account_id: string | undefined;
  loan_name: string;
  loan_type: string;
  status: string;
  principal_amount: number;
  current_balance: number;
  interest_rate: number;
  monthly_payment: number;
  extra_payment: number;
  target_payoff_date: string;
  start_date: string;
  first_payment_date: string;
  lender: string | undefined;
  loan_number: string | undefined;
  term_months: number | undefined;
  notes: string | undefined;
  id?: string;
}

interface LoanPaymentUpdateRow {
  user_id: string;
  loan_id: string;
  payment_date: string;
  amount: number;
  principal_amount: number;
  interest_amount: number;
  extra_amount: number;
  balance_after: number;
  transaction_id: string | undefined;
  notes: string | undefined;
  id?: string;
}

// Retirement Account Row Interfaces
interface RetirementAccountRow {
  id: string;
  user_id: string;
  account_id: string;
  tax_treatment: string;
  annual_contribution_limit: string | number;
  catch_up_limit: string | number | null;
  current_year_contributions: string | number;
  contribution_year: number;
  has_employer_match: boolean;
  employer_match_percentage: string | number | null;
  employer_match_limit: string | number | null;
  employer_match_type: string | null;
  employer_contributions_ytd: string | number;
  has_vesting_schedule: boolean;
  vesting_schedule_type: string | null;
  vesting_cliff_years: string | number | null;
  vesting_graded_years: string | number | null;
  vesting_percentage: string | number;
  unvested_balance: string | number;
  allocation: unknown;
  is_family_coverage: boolean | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // From view
  account_name?: string;
  account_balance?: string | number;
  remaining_employee_room?: string | number;
  total_ytd_contributions?: string | number;
  vested_balance?: string | number;
  latest_gains?: string | number | null;
  latest_return_rate?: string | number | null;
}

interface RetirementContributionRow {
  id: string;
  user_id: string;
  retirement_account_id: string;
  contribution_date: string;
  amount: string | number;
  contribution_type: string;
  contribution_year: number;
  transaction_id: string | null;
  notes: string | null;
  created_at: string;
}

interface RetirementPerformanceRow {
  id: string;
  user_id: string;
  retirement_account_id: string;
  snapshot_date: string;
  balance: string | number;
  total_contributions: string | number;
  total_gains: string | number;
  rate_of_return: string | number | null;
  allocation_snapshot: unknown;
  created_at: string;
}

async function getUid(client: SupabaseClient): Promise<string> {
  const { data, error } = await client.auth.getUser();
  if (error) throw error;
  const uid = data.user?.id;
  if (!uid) throw new Error('No authenticated user');
  return uid;
}

export class SupabaseApi implements FinanceAPI {
  private client: SupabaseClient;

  constructor(client: SupabaseClient) {
    this.client = client;
  }

  async listInstitutions(): Promise<Institution[]> {
    const uid = await getUid(this.client);
    const { data, error } = await this.client
      .from('institutions')
      .select('id,name,logo_url')
      .eq('user_id', uid);
    if (error) throw error;
    return (data ?? []).map((r: InstitutionRow) => ({ id: r.id, name: r.name, logoUrl: r.logo_url ?? undefined }));
  }

  async updateAccount(accountId: string, updates: Partial<Account>): Promise<void> {
    const uid = await getUid(this.client);
    const { error } = await this.client
      .from('accounts')
      .update({
        rewards_balance: updates.rewardsBalance,
        rewards_type: updates.rewardsType,
        base_rewards_rate: updates.baseRewardsRate,
        annual_fee: updates.annualFee,
        annual_fee_due_date: updates.annualFeeDueDate,
      })
      .eq('id', accountId)
      .eq('user_id', uid);
    if (error) throw error;
  }

  async upsertAccount(account: { id?: string; name: string; type: string; balance: number; institutionId?: string }): Promise<void> {
    const uid = await getUid(this.client);

    // Determine if this is a credit card (liability account)
    const isLiability = account.type === 'credit';

    const row: Record<string, unknown> = {
      user_id: uid,
      name: account.name,
      type: account.type,
      balance: account.balance,
      liability: isLiability,
      institution_id: account.institutionId ?? null,
      last_updated: new Date().toISOString(),
    };

    if (account.id) {
      row.id = account.id;
    }

    const { error } = await this.client
      .from('accounts')
      .upsert(row)
      .select('id')
      .single();

    if (error) throw error;
  }

  async deleteAccount(accountId: string): Promise<void> {
    const uid = await getUid(this.client);
    const { error } = await this.client
      .from('accounts')
      .delete()
      .eq('id', accountId)
      .eq('user_id', uid);

    if (error) throw error;
  }

  async listAccounts(): Promise<Account[]> {
    const uid = await getUid(this.client);
    const { data, error } = await this.client
      .from('accounts')
      .select('id,name,type,balance,liability,last_updated,institution_id,credit_limit,apr,payment_due_day,minimum_payment,statement_balance,statement_date,annual_fee,annual_fee_due_date,rewards_balance,rewards_type,base_rewards_rate')
      .eq('user_id', uid);
    if (error) throw error;
    return (data ?? []).map((r: AccountRow) => ({
      id: r.id,
      name: r.name,
      type: r.type,
      balance: Number(r.balance),
      liability: !!r.liability,
      lastUpdatedISO: new Date(r.last_updated).toISOString(),
      institutionId: r.institution_id ?? undefined,
      creditLimit: r.credit_limit ? Number(r.credit_limit) : undefined,
      apr: r.apr ? Number(r.apr) : undefined,
      paymentDueDay: r.payment_due_day ?? undefined,
      minimumPayment: r.minimum_payment ? Number(r.minimum_payment) : undefined,
      statementBalance: r.statement_balance ? Number(r.statement_balance) : undefined,
      statementDate: r.statement_date ? new Date(r.statement_date).toISOString().split('T')[0] : undefined,
      annualFee: r.annual_fee ? Number(r.annual_fee) : undefined,
      annualFeeDueDate: r.annual_fee_due_date ? new Date(r.annual_fee_due_date).toISOString().split('T')[0] : undefined,
      rewardsBalance: r.rewards_balance ? Number(r.rewards_balance) : undefined,
      rewardsType: r.rewards_type ?? undefined,
      baseRewardsRate: r.base_rewards_rate ? Number(r.base_rewards_rate) : undefined,
    }));
  }

  async listTransactions(params: TxnQuery): Promise<Paginated<Transaction>> {
    const uid = await getUid(this.client);
    const limit = params.limit ?? 50;
    let q = this.client.from('transactions').select('*').eq('user_id', uid).order('date', { ascending: false }).limit(limit);
    if (params.fromISO) q = q.gte('date', params.fromISO);
    if (params.toISO) q = q.lte('date', params.toISO);
    if (params.type) q = q.eq('type', params.type);
    if (params.accountIds?.length) q = q.in('account_id', params.accountIds);
    if (params.categoryIds?.length) q = q.in('category_id', params.categoryIds);
    if (params.text) q = q.ilike('description', `%${params.text}%`);
    if (params.cursor) q = q.lt('id', params.cursor); // simple keyset; assumes uuid sort by date desc not ideal
    const { data, error } = await q;
    if (error) throw error;
    const items = (data ?? []).map((r: TransactionRow) => ({
      id: r.id,
      accountId: r.account_id,
      dateISO: new Date(r.date).toISOString(),
      description: r.description,
      categoryId: r.category_id ?? undefined,
      amount: Number(r.amount),
      type: r.type,
      notes: r.notes ?? undefined,
      merchantName: r.merchant_name ?? undefined,
      confidenceScore: r.confidence_score ? Number(r.confidence_score) : undefined,
      suggestedCategoryId: r.suggested_category_id ?? undefined,
      categorizationRuleId: r.categorization_rule_id ?? undefined,
    }));
    const nextCursor = items.length === limit ? items[items.length - 1]?.id : undefined;
    return { items, nextCursor };
  }

  async upsertTransaction(txn: TransactionInput): Promise<void> {
    txn = await validateTransactionInput(txn);
    const uid = await getUid(this.client);

    // Extract merchant name from description
    const merchantName = this.extractMerchantName(txn.description);

    const row: TransactionUpdateRow = {
      user_id: uid,
      account_id: txn.accountId,
      date: txn.dateISO,
      description: txn.description,
      category_id: txn.categoryId ?? null,
      amount: txn.amount,
      type: txn.type,
      notes: txn.notes ?? null,
      merchant_name: merchantName,
    };
    if (txn.id) {
      row.id = txn.id;
    }
    const { error } = await this.client.from('transactions').upsert(row).select('id').single();
    if (error) throw error;
  }

  /**
   * Bulk update transactions with categorization results
   */
  async bulkCategorizeTransactions(
    updates: Array<{
      id: string;
      categoryId: string;
      confidence: number;
      ruleId: string | null;
      merchantName: string | null;
    }>
  ): Promise<void> {
    const uid = await getUid(this.client);

    // Update each transaction
    for (const update of updates) {
      const { error } = await this.client
        .from('transactions')
        .update({
          category_id: update.categoryId,
          confidence_score: update.confidence,
          categorization_rule_id: update.ruleId,
          merchant_name: update.merchantName,
        })
        .eq('id', update.id)
        .eq('user_id', uid);

      if (error) throw error;
    }
  }

  /**
   * Extract merchant name from transaction description
   */
  private extractMerchantName(description: string): string {
    let normalized = description.trim().toUpperCase();

    // Remove common prefixes
    normalized = normalized.replace(/^(DEBIT|CREDIT|PURCHASE|POS|CARD|PAYMENT|PAYPAL|SQ\s+\*|TST\s+\*)\s+/i, '');

    // Remove trailing numbers
    normalized = normalized.replace(/\s+\d+$/, '');

    // Remove company suffixes
    normalized = normalized.replace(/\s+(LLC|INC|CORP|CO|LTD)\.?$/i, '');

    return normalized.trim();
  }

  async deleteTransaction(id: string): Promise<void> {
    const uid = await getUid(this.client);
    const { error } = await this.client.from('transactions').delete().eq('id', id).eq('user_id', uid);
    if (error) throw error;
  }

  async listBudgets(monthISO: string): Promise<Budget[]> {
    const uid = await getUid(this.client);
    // Ensure month is in YYYY-MM format for query
    const monthDate = monthISO.length === 7 ? monthISO : monthISO.slice(0, 7);

    const { data, error } = await this.client
      .from('budgets')
      .select('id,category_id,month,limit_amount')
      .eq('user_id', uid)
      .eq('month', monthDate);

    if (error) throw error;
    return (data ?? []).map((r: BudgetRow) => ({
      id: r.id,
      categoryId: r.category_id,
      month: r.month,
      limit: Number(r.limit_amount)
    }));
  }

  async upsertBudget(budget: { categoryId: string; month: string; limit: number }): Promise<void> {
    const uid = await getUid(this.client);

    // Validate inputs
    if (!budget.categoryId) {
      throw new Error('Category ID is required');
    }
    if (!budget.month) {
      throw new Error('Month is required');
    }
    if (typeof budget.limit !== 'number' || budget.limit < 0) {
      throw new Error('Budget limit must be a positive number');
    }

    // Ensure month is in YYYY-MM format
    const monthDate = budget.month.length === 7 ? budget.month : budget.month.slice(0, 7);

    // Validate month format
    if (!/^\d{4}-\d{2}$/.test(monthDate)) {
      throw new Error('Invalid month format. Expected YYYY-MM');
    }

    /**
     * Clean database schema (after migration):
     * - id: uuid PRIMARY KEY
     * - user_id: uuid NOT NULL
     * - category_id: uuid NOT NULL REFERENCES categories(id)
     * - month: char(7) NOT NULL (format: YYYY-MM)
     * - limit_amount: numeric NOT NULL (the budget limit)
     *
     * UNIQUE constraint on (user_id, category_id, month)
     */
    const row: BudgetUpdateRow = {
      user_id: uid,
      category_id: budget.categoryId,
      month: monthDate,
      limit_amount: budget.limit,
    };

    // Use upsert with the unique constraint on (user_id, category_id, month)
    const { error } = await this.client
      .from('budgets')
      .upsert(row, {
        onConflict: 'user_id,category_id,month'
      });

    if (error) {
      logger.error('Budget upsert error:', { error });
      logger.error('Row data:', { row });
      throw new Error(`Failed to save budget: ${error.message}`);
    }
  }

  async deleteBudget(categoryId: string, month: string): Promise<void> {
    const uid = await getUid(this.client);

    // Validate inputs
    if (!categoryId) {
      throw new Error('Category ID is required');
    }
    if (!month) {
      throw new Error('Month is required');
    }

    // Ensure month is in YYYY-MM format (database column is char(7))
    const monthDate = month.length === 7 ? month : month.slice(0, 7);

    // Validate month format
    if (!/^\d{4}-\d{2}$/.test(monthDate)) {
      throw new Error('Invalid month format. Expected YYYY-MM');
    }

    const { error } = await this.client
      .from('budgets')
      .delete()
      .eq('user_id', uid)
      .eq('category_id', categoryId)
      .eq('month', monthDate);

    if (error) {
      logger.error('Budget delete error:', { error });
      throw new Error(`Failed to delete budget: ${error.message}`);
    }
  }

  async listBudgetTemplates(): Promise<BudgetTemplate[]> {
    const uid = await getUid(this.client);
    const { data, error } = await this.client
      .from('budget_templates')
      .select('id,category_id,default_amount')
      .eq('user_id', uid);
    if (error) throw error;
    return (data ?? []).map((r: BudgetTemplateRow) => ({
      id: r.id,
      categoryId: r.category_id,
      defaultAmount: Number(r.default_amount),
    }));
  }

  async upsertBudgetTemplate(template: BudgetTemplateInput): Promise<void> {
    const uid = await getUid(this.client);

    // Validate inputs
    if (!template.categoryId) {
      throw new Error('Category ID is required');
    }
    if (typeof template.defaultAmount !== 'number' || template.defaultAmount < 0) {
      throw new Error('Default amount must be a positive number');
    }

    const row: BudgetTemplateUpdateRow = {
      user_id: uid,
      category_id: template.categoryId,
      default_amount: template.defaultAmount,
    };

    if (template.id) {
      row.id = template.id;
    }

    const { error } = await this.client
      .from('budget_templates')
      .upsert(row, {
        onConflict: 'user_id,category_id'
      });

    if (error) {
      logger.error('Budget template upsert error:', { error });
      throw new Error(`Failed to save budget template: ${error.message}`);
    }
  }

  async deleteBudgetTemplate(categoryId: string): Promise<void> {
    const uid = await getUid(this.client);

    if (!categoryId) {
      throw new Error('Category ID is required');
    }

    const { error } = await this.client
      .from('budget_templates')
      .delete()
      .eq('user_id', uid)
      .eq('category_id', categoryId);

    if (error) {
      logger.error('Budget template delete error:', { error });
      throw new Error(`Failed to delete budget template: ${error.message}`);
    }
  }

  async initializeBudgetsFromTemplates(month: string): Promise<number> {
    const uid = await getUid(this.client);

    // Validate inputs
    if (!month) {
      throw new Error('Month is required');
    }

    // Ensure month is in YYYY-MM format
    const monthDate = month.length === 7 ? month : month.slice(0, 7);

    // Validate month format
    if (!/^\d{4}-\d{2}$/.test(monthDate)) {
      throw new Error('Invalid month format. Expected YYYY-MM');
    }

    // Call the database function to initialize budgets from templates
    const result = await this.client.rpc('initialize_budgets_from_templates', {
      p_user_id: uid,
      p_month: monthDate,
    });

    if (result.error) {
      logger.error('Initialize budgets from templates error:', { error: result.error });
      throw new Error(`Failed to initialize budgets: ${result.error.message}`);
    }

    return Number(result.data ?? 0);
  }

  async listCategories(): Promise<Category[]> {
    const uid = await getUid(this.client);
    const { data, error } = await this.client
      .from('categories')
      .select('id,name,parent_id,icon,color')
      .eq('user_id', uid);
    if (error) throw error;
    return (data ?? []).map((r: CategoryRow) => ({ id: r.id, name: r.name, parentId: r.parent_id ?? undefined, icon: r.icon ?? undefined, color: r.color ?? undefined }));
  }

  async listNetWorth(): Promise<NetPoint[]> {
    const uid = await getUid(this.client);
    const { data, error } = await this.client
      .from('networth')
      .select('month,assets,liabilities')
      .eq('user_id', uid)
      .order('month', { ascending: true });
    if (error) throw error;
    return (data ?? []).map((r: NetWorthRow) => ({ month: r.month, assets: Number(r.assets), liabilities: Number(r.liabilities) }));
  }

  async listGoals(): Promise<Goal[]> {
    const uid = await getUid(this.client);
    const { data, error } = await this.client
      .from('goals')
      .select('id,name,target_amount,current_amount,starting_amount,due_date,type,linked_category_id,linked_account_id,track_networth,created_at,updated_at')
      .eq('user_id', uid);
    if (error) throw error;

    // Debug logging
    logger.debug('FinanceAPI', 'listGoals query completed', {
      userId: uid,
      rawDataCount: data?.length ?? 0
    });

    const goals = (data ?? []).map((r: GoalRow) => ({
      id: r.id,
      name: r.name,
      targetAmount: Number(r.target_amount),
      currentAmount: Number(r.current_amount),
      startingAmount: Number(r.starting_amount ?? 0),
      dueDateISO: new Date(r.due_date).toISOString(),
      type: r.type,
      linkedCategoryId: r.linked_category_id ?? undefined,
      linkedAccountId: r.linked_account_id ?? undefined,
      trackNetworth: r.track_networth ?? false,
      createdAtISO: r.created_at ? new Date(r.created_at).toISOString() : undefined,
      updatedAtISO: r.updated_at ? new Date(r.updated_at).toISOString() : undefined,
    }));

    logger.debug('FinanceAPI', 'Goals mapped successfully', { goalsCount: goals.length });
    return goals;
  }

  async upsertGoal(goal: GoalInput): Promise<void> {
    goal = await validateGoalInput(goal);
    const uid = await getUid(this.client);
    const row: GoalUpdateRow = {
      user_id: uid,
      name: goal.name,
      target_amount: goal.targetAmount,
      current_amount: goal.currentAmount,
      starting_amount: goal.startingAmount,
      due_date: goal.dueDateISO,
      type: goal.type,
      linked_category_id: goal.linkedCategoryId ?? null,
      linked_account_id: goal.linkedAccountId ?? null,
      track_networth: goal.trackNetworth ?? false,
    };
    if (goal.id) {
      row.id = goal.id;
    }
    const { error } = await this.client.from('goals').upsert(row).select('id').single();
    if (error) throw error;
  }

  async deleteGoal(goalId: string): Promise<void> {
    const uid = await getUid(this.client);
    const { error } = await this.client
      .from('goals')
      .delete()
      .eq('id', goalId)
      .eq('user_id', uid);
    if (error) throw error;
  }

  async getGoalProgressHistory(goalId: string): Promise<GoalProgressPoint[]> {
    const uid = await getUid(this.client);
    const { data, error } = await this.client
      .from('goal_progress_history')
      .select('recorded_at,amount,note')
      .eq('goal_id', goalId)
      .eq('user_id', uid)
      .order('recorded_at', { ascending: true });
    if (error) throw error;
    return (data ?? []).map((r: GoalProgressRow) => ({
      dateISO: new Date(r.recorded_at).toISOString(),
      amount: Number(r.amount),
      note: r.note ?? undefined,
    }));
  }

  async syncGoalFromAccount(goalId: string): Promise<void> {
    const { error} = await this.client.rpc('sync_goal_from_account', {
      p_goal_id: goalId,
    });
    if (error) throw error;
  }

  // Credit Card Benefits API Methods
  async listCardBenefits(accountId: string): Promise<CardBenefit[]> {
    const uid = await getUid(this.client);
    const { data, error } = await this.client
      .from('card_benefits')
      .select('*')
      .eq('user_id', uid)
      .eq('account_id', accountId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []).map((r: CardBenefitRow) => ({
      id: r.id,
      accountId: r.account_id,
      benefitType: r.benefit_type,
      name: r.name,
      description: r.description ?? undefined,
      value: r.value ? Number(r.value) : undefined,
      frequency: r.frequency ?? undefined,
      usedAmount: Number(r.used_amount),
      resetDate: r.reset_date ? new Date(r.reset_date).toISOString().split('T')[0] : undefined,
      active: r.active,
      createdAt: new Date(r.created_at).toISOString(),
      updatedAt: new Date(r.updated_at).toISOString(),
    }));
  }

  async upsertCardBenefit(accountId: string, benefit: CardBenefitInput): Promise<void> {
    const uid = await getUid(this.client);
    const row: CardBenefitUpdateRow = {
      user_id: uid,
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
    if (benefit.id) {
      row.id = benefit.id;
    }

    const { error } = await this.client.from('card_benefits').upsert(row);
    if (error) throw error;
  }

  async deleteCardBenefit(benefitId: string): Promise<void> {
    const uid = await getUid(this.client);
    const { error } = await this.client
      .from('card_benefits')
      .delete()
      .eq('id', benefitId)
      .eq('user_id', uid);
    if (error) throw error;
  }

  async listCategoryBonuses(accountId: string): Promise<CardCategoryBonus[]> {
    const uid = await getUid(this.client);
    const { data, error } = await this.client
      .from('card_category_bonuses')
      .select('*')
      .eq('user_id', uid)
      .eq('account_id', accountId)
      .order('rewards_rate', { ascending: false });
    if (error) throw error;
    return (data ?? []).map((r: CardCategoryBonusRow) => ({
      id: r.id,
      accountId: r.account_id,
      category: r.category,
      rewardsRate: Number(r.rewards_rate),
      isRotating: r.is_rotating,
      startDate: r.start_date ? new Date(r.start_date).toISOString().split('T')[0] : undefined,
      endDate: r.end_date ? new Date(r.end_date).toISOString().split('T')[0] : undefined,
      createdAt: new Date(r.created_at).toISOString(),
    }));
  }

  async upsertCategoryBonus(accountId: string, bonus: CardCategoryBonusInput): Promise<void> {
    const uid = await getUid(this.client);
    const row: CardCategoryBonusUpdateRow = {
      user_id: uid,
      account_id: accountId,
      category: bonus.category,
      rewards_rate: bonus.rewardsRate,
      is_rotating: bonus.isRotating,
      start_date: bonus.startDate,
      end_date: bonus.endDate,
    };
    if (bonus.id) {
      row.id = bonus.id;
    }

    const { error } = await this.client.from('card_category_bonuses').upsert(row);
    if (error) throw error;
  }

  async listWelcomeBonuses(accountId: string): Promise<WelcomeBonus[]> {
    const uid = await getUid(this.client);
    const { data, error } = await this.client
      .from('card_welcome_bonuses')
      .select('*')
      .eq('user_id', uid)
      .eq('account_id', accountId)
      .order('deadline', { ascending: true });
    if (error) throw error;
    return (data ?? []).map((r: WelcomeBonusRow) => ({
      id: r.id,
      accountId: r.account_id,
      bonusAmount: Number(r.bonus_amount),
      requiredSpend: Number(r.required_spend),
      currentSpend: Number(r.current_spend),
      deadline: new Date(r.deadline).toISOString().split('T')[0],
      completed: r.completed,
      completedDate: r.completed_date ? new Date(r.completed_date).toISOString().split('T')[0] : undefined,
      createdAt: new Date(r.created_at).toISOString(),
      updatedAt: new Date(r.updated_at).toISOString(),
    }));
  }

  async upsertWelcomeBonus(accountId: string, bonus: WelcomeBonusInput): Promise<void> {
    const uid = await getUid(this.client);
    const row: WelcomeBonusUpdateRow = {
      user_id: uid,
      account_id: accountId,
      bonus_amount: bonus.bonusAmount,
      required_spend: bonus.requiredSpend,
      current_spend: bonus.currentSpend,
      deadline: bonus.deadline,
      completed: bonus.completed,
      completed_date: bonus.completedDate,
    };
    if (bonus.id) {
      row.id = bonus.id;
    }

    const { error } = await this.client.from('card_welcome_bonuses').upsert(row);
    if (error) throw error;
  }

  async listCardOffers(accountId: string): Promise<CardOffer[]> {
    const uid = await getUid(this.client);
    const { data, error } = await this.client
      .from('card_offers')
      .select('*')
      .eq('user_id', uid)
      .eq('account_id', accountId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []).map((r: CardOfferRow) => ({
      id: r.id,
      accountId: r.account_id,
      merchant: r.merchant,
      offerType: r.offer_type,
      offerAmount: Number(r.offer_amount),
      requiredSpend: r.required_spend ? Number(r.required_spend) : undefined,
      expirationDate: r.expiration_date ? new Date(r.expiration_date).toISOString().split('T')[0] : undefined,
      activated: r.activated,
      activatedDate: r.activated_date ? new Date(r.activated_date).toISOString().split('T')[0] : undefined,
      redeemed: r.redeemed,
      redeemedDate: r.redeemed_date ? new Date(r.redeemed_date).toISOString().split('T')[0] : undefined,
      createdAt: new Date(r.created_at).toISOString(),
    }));
  }

  async upsertCardOffer(accountId: string, offer: CardOfferInput): Promise<void> {
    const uid = await getUid(this.client);
    const row: CardOfferUpdateRow = {
      user_id: uid,
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
    if (offer.id) {
      row.id = offer.id;
    }

    const { error } = await this.client.from('card_offers').upsert(row);
    if (error) throw error;
  }

  // Loan tracking methods
  async listLoans(): Promise<Loan[]> {
    const uid = await getUid(this.client);
    const { data, error } = await this.client
      .from('loans_with_stats')
      .select('*')
      .eq('user_id', uid)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []).map((r: LoanRow) => ({
      id: r.id,
      accountId: r.account_id ?? undefined,
      loanName: r.loan_name,
      loanType: r.loan_type as Loan['loanType'],
      status: r.status as Loan['status'],
      principalAmount: Number(r.principal_amount),
      currentBalance: Number(r.current_balance),
      interestRate: Number(r.interest_rate),
      monthlyPayment: Number(r.monthly_payment),
      extraPayment: Number(r.extra_payment),
      targetPayoffDate: new Date(r.target_payoff_date).toISOString().split('T')[0],
      startDate: new Date(r.start_date).toISOString().split('T')[0],
      firstPaymentDate: new Date(r.first_payment_date).toISOString().split('T')[0],
      lender: r.lender ?? undefined,
      loanNumber: r.loan_number ?? undefined,
      termMonths: r.term_months ?? undefined,
      notes: r.notes ?? undefined,
      createdAt: new Date(r.created_at).toISOString(),
      updatedAt: new Date(r.updated_at).toISOString(),
      totalPaid: r.total_paid ? Number(r.total_paid) : undefined,
      interestPaid: r.interest_paid ? Number(r.interest_paid) : undefined,
      principalPaid: r.principal_paid ? Number(r.principal_paid) : undefined,
      remainingPayments: r.remaining_payments ?? undefined,
      projectedPayoffDate: r.projected_payoff_date ? new Date(r.projected_payoff_date).toISOString().split('T')[0] : undefined,
    }));
  }

  async upsertLoan(loan: LoanInput): Promise<void> {
    const uid = await getUid(this.client);
    const row: LoanUpdateRow = {
      user_id: uid,
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
    if (loan.id) {
      row.id = loan.id;
    }

    const { error } = await this.client.from('loans').upsert(row);
    if (error) throw error;
  }

  async deleteLoan(loanId: string): Promise<void> {
    const uid = await getUid(this.client);
    const { error } = await this.client
      .from('loans')
      .delete()
      .eq('id', loanId)
      .eq('user_id', uid);
    if (error) throw error;
  }

  async listLoanPayments(loanId: string): Promise<LoanPayment[]> {
    const uid = await getUid(this.client);
    const { data, error } = await this.client
      .from('loan_payments')
      .select('*')
      .eq('user_id', uid)
      .eq('loan_id', loanId)
      .order('payment_date', { ascending: false });
    if (error) throw error;
    return (data ?? []).map((r: LoanPaymentRow) => ({
      id: r.id,
      loanId: r.loan_id,
      paymentDate: new Date(r.payment_date).toISOString().split('T')[0],
      amount: Number(r.amount),
      principalAmount: Number(r.principal_amount),
      interestAmount: Number(r.interest_amount),
      extraAmount: Number(r.extra_amount),
      balanceAfter: Number(r.balance_after),
      transactionId: r.transaction_id ?? undefined,
      notes: r.notes ?? undefined,
      createdAt: new Date(r.created_at).toISOString(),
    }));
  }

  async upsertLoanPayment(loanId: string, payment: LoanPaymentInput): Promise<void> {
    const uid = await getUid(this.client);
    const row: LoanPaymentUpdateRow = {
      user_id: uid,
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
    if (payment.id) {
      row.id = payment.id;
    }

    const { error } = await this.client.from('loan_payments').upsert(row);
    if (error) throw error;
  }

  async deleteLoanPayment(paymentId: string): Promise<void> {
    const uid = await getUid(this.client);
    const { error} = await this.client
      .from('loan_payments')
      .delete()
      .eq('id', paymentId)
      .eq('user_id', uid);
    if (error) throw error;
  }

  // Recurring Transactions API Methods
  async listRecurringTransactions(): Promise<RecurringTransaction[]> {
    const uid = await getUid(this.client);
    const { data, error } = await this.client
      .from('recurring_transactions_upcoming')
      .select('*')
      .eq('user_id', uid)
      .order('next_occurrence_date', { ascending: true });
    if (error) throw error;
    return (data ?? []).map((r: RecurringTransactionRow) => ({
      id: r.id,
      description: r.description,
      amount: Number(r.amount),
      type: r.type,
      categoryId: r.category_id ?? undefined,
      accountId: r.account_id ?? undefined,
      frequency: r.frequency,
      startDate: new Date(r.start_date).toISOString().split('T')[0],
      endDate: r.end_date ? new Date(r.end_date).toISOString().split('T')[0] : undefined,
      dayOfMonth: r.day_of_month ?? undefined,
      dayOfWeek: r.day_of_week ?? undefined,
      autoCreate: r.auto_create,
      requireApproval: r.require_approval,
      daysBefore: r.days_before,
      active: r.active,
      notes: r.notes ?? undefined,
      createdAt: new Date(r.created_at).toISOString(),
      updatedAt: new Date(r.updated_at).toISOString(),
      lastGeneratedDate: r.last_generated_date ? new Date(r.last_generated_date).toISOString().split('T')[0] : undefined,
      nextOccurrenceDate: r.next_occurrence_date ? new Date(r.next_occurrence_date).toISOString().split('T')[0] : undefined,
      pendingCount: r.pending_count ?? 0,
    }));
  }

  async upsertRecurringTransaction(recurring: RecurringTransactionInput): Promise<void> {
    const uid = await getUid(this.client);
    const row: RecurringTransactionUpdateRow = {
      user_id: uid,
      description: recurring.description,
      amount: recurring.amount,
      type: recurring.type,
      category_id: recurring.categoryId ?? null,
      account_id: recurring.accountId ?? null,
      frequency: recurring.frequency,
      start_date: recurring.startDate,
      end_date: recurring.endDate ?? null,
      day_of_month: recurring.dayOfMonth ?? null,
      day_of_week: recurring.dayOfWeek ?? null,
      auto_create: recurring.autoCreate,
      require_approval: recurring.requireApproval,
      days_before: recurring.daysBefore,
      active: recurring.active,
      notes: recurring.notes ?? null,
    };
    if (recurring.id) {
      row.id = recurring.id;
    }

    const { error } = await this.client.from('recurring_transactions').upsert(row);
    if (error) throw error;
  }

  async deleteRecurringTransaction(recurringId: string): Promise<void> {
    const uid = await getUid(this.client);
    const { error } = await this.client
      .from('recurring_transactions')
      .delete()
      .eq('id', recurringId)
      .eq('user_id', uid);
    if (error) throw error;
  }

  async generatePendingTransactions(): Promise<void> {
    const uid = await getUid(this.client);
    const { error } = await this.client.rpc('generate_pending_transactions', {
      p_user_id: uid,
    });
    if (error) throw error;
  }

  async listPendingTransactions(): Promise<PendingTransaction[]> {
    const uid = await getUid(this.client);
    const { data, error } = await this.client
      .from('pending_transactions')
      .select('*')
      .eq('user_id', uid)
      .eq('status', 'pending')
      .order('scheduled_date', { ascending: true });
    if (error) throw error;
    return (data ?? []).map((r: PendingTransactionRow) => ({
      id: r.id,
      recurringTransactionId: r.recurring_transaction_id ?? undefined,
      description: r.description,
      amount: Number(r.amount),
      type: r.type,
      categoryId: r.category_id ?? undefined,
      accountId: r.account_id ?? undefined,
      scheduledDate: new Date(r.scheduled_date).toISOString().split('T')[0],
      status: r.status,
      transactionId: r.transaction_id ?? undefined,
      notes: r.notes ?? undefined,
      createdAt: new Date(r.created_at).toISOString(),
      reviewedAt: r.reviewed_at ? new Date(r.reviewed_at).toISOString() : undefined,
    }));
  }

  async approvePendingTransaction(pendingId: string, edits?: Partial<TransactionInput>): Promise<void> {
    const uid = await getUid(this.client);

    // Get the pending transaction
    const { data: pending, error: fetchError } = await this.client
      .from('pending_transactions')
      .select('*')
      .eq('id', pendingId)
      .eq('user_id', uid)
      .single();
    if (fetchError) throw fetchError;
    if (!pending) throw new Error('Pending transaction not found');

    // Create the actual transaction
    const txnInput: TransactionInput = {
      accountId: edits?.accountId ?? pending.account_id,
      dateISO: edits?.dateISO ?? pending.scheduled_date,
      description: edits?.description ?? pending.description,
      categoryId: edits?.categoryId ?? pending.category_id,
      amount: edits?.amount ?? Number(pending.amount),
      type: edits?.type ?? pending.type,
      notes: edits?.notes ?? pending.notes,
    };

    await this.upsertTransaction(txnInput);

    // Get the created transaction ID
    const { data: createdTxn, error: txnError } = await this.client
      .from('transactions')
      .select('id')
      .eq('user_id', uid)
      .eq('date', txnInput.dateISO)
      .eq('description', txnInput.description)
      .eq('amount', txnInput.amount)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    if (txnError) throw txnError;

    // Update pending transaction status
    const { error: updateError } = await this.client
      .from('pending_transactions')
      .update({
        status: edits ? 'edited' : 'approved',
        transaction_id: createdTxn?.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', pendingId)
      .eq('user_id', uid);
    if (updateError) throw updateError;
  }

  async skipPendingTransaction(pendingId: string): Promise<void> {
    const uid = await getUid(this.client);
    const { error } = await this.client
      .from('pending_transactions')
      .update({
        status: 'skipped',
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', pendingId)
      .eq('user_id', uid);
    if (error) throw error;
  }

  async deletePendingTransaction(pendingId: string): Promise<void> {
    const uid = await getUid(this.client);
    const { error} = await this.client
      .from('pending_transactions')
      .delete()
      .eq('id', pendingId)
      .eq('user_id', uid);
    if (error) throw error;
  }

  // ============================================================================
  // RETIREMENT ACCOUNT TRACKING METHODS
  // ============================================================================

  async listRetirementAccounts(): Promise<RetirementAccountWithStats[]> {
    const uid = await getUid(this.client);
    const { data, error } = await this.client
      .from('retirement_accounts_with_stats')
      .select('*')
      .eq('user_id', uid)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data ?? []).map((r: RetirementAccountRow) => ({
      id: r.id,
      accountId: r.account_id,
      taxTreatment: r.tax_treatment as TaxTreatment,
      annualContributionLimit: Number(r.annual_contribution_limit),
      catchUpLimit: r.catch_up_limit ? Number(r.catch_up_limit) : undefined,
      currentYearContributions: Number(r.current_year_contributions),
      contributionYear: r.contribution_year,
      hasEmployerMatch: r.has_employer_match,
      employerMatchPercentage: r.employer_match_percentage ? Number(r.employer_match_percentage) : undefined,
      employerMatchLimit: r.employer_match_limit ? Number(r.employer_match_limit) : undefined,
      employerMatchType: r.employer_match_type as EmployerMatchType | undefined,
      employerContributionsYTD: Number(r.employer_contributions_ytd),
      hasVestingSchedule: r.has_vesting_schedule,
      vestingScheduleType: r.vesting_schedule_type as VestingScheduleType | undefined,
      vestingCliffYears: r.vesting_cliff_years ? Number(r.vesting_cliff_years) : undefined,
      vestingGradedYears: r.vesting_graded_years ? Number(r.vesting_graded_years) : undefined,
      vestingPercentage: Number(r.vesting_percentage),
      unvestedBalance: Number(r.unvested_balance),
      allocation: r.allocation as InvestmentAllocation | undefined,
      isFamilyCoverage: r.is_family_coverage ?? undefined,
      notes: r.notes ?? undefined,
      createdAt: new Date(r.created_at).toISOString(),
      updatedAt: new Date(r.updated_at).toISOString(),
      // View fields
      accountName: r.account_name ?? '',
      accountBalance: r.account_balance ? Number(r.account_balance) : 0,
      remainingEmployeeRoom: r.remaining_employee_room ? Number(r.remaining_employee_room) : 0,
      totalYTDContributions: r.total_ytd_contributions ? Number(r.total_ytd_contributions) : 0,
      vestedBalance: r.vested_balance ? Number(r.vested_balance) : 0,
      latestGains: r.latest_gains ? Number(r.latest_gains) : undefined,
      latestReturnRate: r.latest_return_rate ? Number(r.latest_return_rate) : undefined,
    }));
  }

  async getRetirementAccount(accountId: string): Promise<RetirementAccountWithStats | null> {
    const uid = await getUid(this.client);
    const { data, error } = await this.client
      .from('retirement_accounts_with_stats')
      .select('*')
      .eq('user_id', uid)
      .eq('account_id', accountId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }

    if (!data) return null;

    const r = data as RetirementAccountRow;
    return {
      id: r.id,
      accountId: r.account_id,
      taxTreatment: r.tax_treatment as TaxTreatment,
      annualContributionLimit: Number(r.annual_contribution_limit),
      catchUpLimit: r.catch_up_limit ? Number(r.catch_up_limit) : undefined,
      currentYearContributions: Number(r.current_year_contributions),
      contributionYear: r.contribution_year,
      hasEmployerMatch: r.has_employer_match,
      employerMatchPercentage: r.employer_match_percentage ? Number(r.employer_match_percentage) : undefined,
      employerMatchLimit: r.employer_match_limit ? Number(r.employer_match_limit) : undefined,
      employerMatchType: r.employer_match_type as EmployerMatchType | undefined,
      employerContributionsYTD: Number(r.employer_contributions_ytd),
      hasVestingSchedule: r.has_vesting_schedule,
      vestingScheduleType: r.vesting_schedule_type as VestingScheduleType | undefined,
      vestingCliffYears: r.vesting_cliff_years ? Number(r.vesting_cliff_years) : undefined,
      vestingGradedYears: r.vesting_graded_years ? Number(r.vesting_graded_years) : undefined,
      vestingPercentage: Number(r.vesting_percentage),
      unvestedBalance: Number(r.unvested_balance),
      allocation: r.allocation as InvestmentAllocation | undefined,
      isFamilyCoverage: r.is_family_coverage ?? undefined,
      notes: r.notes ?? undefined,
      createdAt: new Date(r.created_at).toISOString(),
      updatedAt: new Date(r.updated_at).toISOString(),
      // View fields
      accountName: r.account_name ?? '',
      accountBalance: r.account_balance ? Number(r.account_balance) : 0,
      remainingEmployeeRoom: r.remaining_employee_room ? Number(r.remaining_employee_room) : 0,
      totalYTDContributions: r.total_ytd_contributions ? Number(r.total_ytd_contributions) : 0,
      vestedBalance: r.vested_balance ? Number(r.vested_balance) : 0,
      latestGains: r.latest_gains ? Number(r.latest_gains) : undefined,
      latestReturnRate: r.latest_return_rate ? Number(r.latest_return_rate) : undefined,
    };
  }

  async upsertRetirementAccountMetadata(metadata: RetirementAccountMetadataInput): Promise<void> {
    const uid = await getUid(this.client);

    const row = {
      user_id: uid,
      account_id: metadata.accountId,
      tax_treatment: metadata.taxTreatment,
      annual_contribution_limit: metadata.annualContributionLimit,
      catch_up_limit: metadata.catchUpLimit ?? null,
      current_year_contributions: metadata.currentYearContributions,
      contribution_year: metadata.contributionYear,
      has_employer_match: metadata.hasEmployerMatch,
      employer_match_percentage: metadata.employerMatchPercentage ?? null,
      employer_match_limit: metadata.employerMatchLimit ?? null,
      employer_match_type: metadata.employerMatchType ?? null,
      employer_contributions_ytd: metadata.employerContributionsYTD,
      has_vesting_schedule: metadata.hasVestingSchedule,
      vesting_schedule_type: metadata.vestingScheduleType ?? null,
      vesting_cliff_years: metadata.vestingCliffYears ?? null,
      vesting_graded_years: metadata.vestingGradedYears ?? null,
      vesting_percentage: metadata.vestingPercentage,
      unvested_balance: metadata.unvestedBalance,
      allocation: metadata.allocation ?? null,
      is_family_coverage: metadata.isFamilyCoverage ?? null,
      notes: metadata.notes ?? null,
      ...(metadata.id && { id: metadata.id }),
    };

    const { error } = await this.client
      .from('retirement_accounts')
      .upsert(row);

    if (error) throw error;
  }

  async deleteRetirementAccountMetadata(accountId: string): Promise<void> {
    const uid = await getUid(this.client);
    const { error } = await this.client
      .from('retirement_accounts')
      .delete()
      .eq('user_id', uid)
      .eq('account_id', accountId);

    if (error) throw error;
  }

  async listRetirementContributions(retirementAccountId: string): Promise<RetirementContribution[]> {
    const uid = await getUid(this.client);
    const { data, error } = await this.client
      .from('retirement_contributions')
      .select('*')
      .eq('user_id', uid)
      .eq('retirement_account_id', retirementAccountId)
      .order('contribution_date', { ascending: false });

    if (error) throw error;

    return (data ?? []).map((r: RetirementContributionRow) => ({
      id: r.id,
      retirementAccountId: r.retirement_account_id,
      contributionDate: r.contribution_date,
      amount: Number(r.amount),
      contributionType: r.contribution_type as ContributionType,
      contributionYear: r.contribution_year,
      transactionId: r.transaction_id ?? undefined,
      notes: r.notes ?? undefined,
      createdAt: new Date(r.created_at).toISOString(),
    }));
  }

  async addRetirementContribution(contribution: RetirementContributionInput): Promise<void> {
    const uid = await getUid(this.client);

    const row = {
      user_id: uid,
      retirement_account_id: contribution.retirementAccountId,
      contribution_date: contribution.contributionDate,
      amount: contribution.amount,
      contribution_type: contribution.contributionType,
      contribution_year: contribution.contributionYear,
      transaction_id: contribution.transactionId ?? null,
      notes: contribution.notes ?? null,
      ...(contribution.id && { id: contribution.id }),
    };

    const { error } = await this.client
      .from('retirement_contributions')
      .upsert(row);

    if (error) throw error;
  }

  async deleteRetirementContribution(contributionId: string): Promise<void> {
    const uid = await getUid(this.client);
    const { error } = await this.client
      .from('retirement_contributions')
      .delete()
      .eq('id', contributionId)
      .eq('user_id', uid);

    if (error) throw error;
  }

  async calculateContributionRoom(retirementAccountId: string, annualIncome: number): Promise<ContributionRoom> {
    const { data, error } = await this.client
      .rpc('calculate_contribution_room', {
        p_retirement_account_id: retirementAccountId,
        p_annual_income: annualIncome,
      });

    if (error) throw error;

    // RPC returns array with one result
    const result = data?.[0];
    if (!result) {
      throw new Error('Failed to calculate contribution room');
    }

    return {
      employeeRoom: Number(result.employee_room),
      employerRoom: Number(result.employer_room),
      totalLimit: Number(result.total_limit),
      isOver50: Boolean(result.is_over_50),
    };
  }

  async listRetirementPerformance(retirementAccountId: string): Promise<RetirementPerformance[]> {
    const uid = await getUid(this.client);
    const { data, error } = await this.client
      .from('retirement_performance')
      .select('*')
      .eq('user_id', uid)
      .eq('retirement_account_id', retirementAccountId)
      .order('snapshot_date', { ascending: false });

    if (error) throw error;

    return (data ?? []).map((r: RetirementPerformanceRow) => ({
      id: r.id,
      retirementAccountId: r.retirement_account_id,
      snapshotDate: r.snapshot_date,
      balance: Number(r.balance),
      totalContributions: Number(r.total_contributions),
      totalGains: Number(r.total_gains),
      rateOfReturn: r.rate_of_return ? Number(r.rate_of_return) : undefined,
      allocationSnapshot: r.allocation_snapshot as InvestmentAllocation | undefined,
      createdAt: new Date(r.created_at).toISOString(),
    }));
  }

  async recordRetirementPerformance(performance: RetirementPerformanceInput): Promise<void> {
    const uid = await getUid(this.client);

    const row = {
      user_id: uid,
      retirement_account_id: performance.retirementAccountId,
      snapshot_date: performance.snapshotDate,
      balance: performance.balance,
      total_contributions: performance.totalContributions,
      total_gains: performance.totalGains,
      rate_of_return: performance.rateOfReturn ?? null,
      allocation_snapshot: performance.allocationSnapshot ?? null,
      ...(performance.id && { id: performance.id }),
    };

    const { error } = await this.client
      .from('retirement_performance')
      .upsert(row);

    if (error) throw error;
  }

  async calculateVestedBalance(retirementAccountId: string, employmentYears: number): Promise<number> {
    const { data, error } = await this.client
      .rpc('calculate_vested_balance', {
        p_retirement_account_id: retirementAccountId,
        p_employment_years: employmentYears,
      });

    if (error) throw error;

    return Number(data ?? 0);
  }
}
