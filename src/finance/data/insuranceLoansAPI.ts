/**
 * Finance Insurance & Loans API
 * Handles insurance policies, loans, loan payments, and retirement accounts
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { AuthenticationError } from '@/lib/errors';
import type {
  Loan,
  LoanInput,
  LoanPayment,
  LoanPaymentInput,
  InsurancePolicy,
  InsurancePolicyInput,
  RetirementAccountWithStats,
  RetirementAccountMetadataInput,
  RetirementContribution,
  RetirementContributionInput,
  RetirementPerformance,
  RetirementPerformanceInput,
  ContributionRoom,
} from '../types';

export class InsuranceLoansAPI {
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

    const rawRow = {
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

    // Strip undefined values so partial updates don't null out existing DB columns
    const row = Object.fromEntries(Object.entries(rawRow).filter(([, v]) => v !== undefined));

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
  // INSURANCE TRACKING
  // =====================================================

  async listInsurancePolicies(): Promise<InsurancePolicy[]> {
    const { data, error } = await this.client
      .from('finance_insurance_policies')
      .select('*')
      .order('policy_name');

    if (error) throw error;

    return (data || []).map(row => ({
      id: row.id,
      userId: row.user_id,
      policyName: row.policy_name,
      policyNumber: row.policy_number || undefined,
      provider: row.provider,
      type: row.type,
      status: row.status,
      coverageAmount: row.coverage_amount ? parseFloat(row.coverage_amount) : undefined,
      deductible: row.deductible ? parseFloat(row.deductible) : undefined,
      premiumAmount: parseFloat(row.premium_amount),
      premiumFrequency: row.premium_frequency,
      startDate: row.start_date,
      endDate: row.end_date || undefined,
      renewalDate: row.renewal_date || undefined,
      nextPaymentDate: row.next_payment_date || undefined,
      agentName: row.agent_name || undefined,
      agentPhone: row.agent_phone || undefined,
      agentEmail: row.agent_email || undefined,
      notes: row.notes || undefined,
      documents: row.documents || undefined,
      autoRenew: row.auto_renew,
      renewalReminderDays: row.renewal_reminder_days,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      claimCount: row.claim_count,
      totalClaimsPaid: row.total_claims_paid ? parseFloat(row.total_claims_paid) : undefined,
      beneficiaryCount: row.beneficiary_count,
      lastPaymentDate: row.last_payment_date || undefined,
    }));
  }

  async upsertInsurancePolicy(policy: InsurancePolicyInput): Promise<void> {
    const userId = await this.getUserId();

    const row = {
      id: policy.id,
      user_id: userId,
      policy_name: policy.policyName,
      policy_number: policy.policyNumber,
      provider: policy.provider,
      type: policy.type,
      status: policy.status,
      coverage_amount: policy.coverageAmount,
      deductible: policy.deductible,
      premium_amount: policy.premiumAmount,
      premium_frequency: policy.premiumFrequency,
      start_date: policy.startDate,
      end_date: policy.endDate,
      renewal_date: policy.renewalDate,
      next_payment_date: policy.nextPaymentDate,
      agent_name: policy.agentName,
      agent_phone: policy.agentPhone,
      agent_email: policy.agentEmail,
      notes: policy.notes,
      documents: policy.documents,
      auto_renew: policy.autoRenew,
      renewal_reminder_days: policy.renewalReminderDays,
    };

    const { error } = await this.client
      .from('finance_insurance_policies')
      .upsert(row);

    if (error) throw error;
  }

  async deleteInsurancePolicy(policyId: string): Promise<void> {
    const userId = await this.getUserId();
    const { error } = await this.client
      .from('finance_insurance_policies')
      .delete()
      .eq('id', policyId)
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

  async upsertRetirementAccountMetadata(metadata: RetirementAccountMetadataInput): Promise<void> {
    const row = {
      id: metadata.id,
      account_id: metadata.accountId,
      tax_treatment: metadata.taxTreatment,
      annual_contribution_limit: metadata.annualContributionLimit,
      catch_up_limit: metadata.catchUpLimit,
      current_year_contributions: metadata.currentYearContributions,
      contribution_year: metadata.contributionYear,
      has_employer_match: metadata.hasEmployerMatch,
      employer_match_percentage: metadata.employerMatchPercentage,
      employer_match_limit: metadata.employerMatchLimit,
      employer_match_type: metadata.employerMatchType,
      employer_contributions_ytd: metadata.employerContributionsYTD,
      has_vesting_schedule: metadata.hasVestingSchedule,
      vesting_schedule_type: metadata.vestingScheduleType,
      vesting_cliff_years: metadata.vestingCliffYears,
      vesting_graded_years: metadata.vestingGradedYears,
      vesting_percentage: metadata.vestingPercentage,
      unvested_balance: metadata.unvestedBalance,
      allocation: metadata.allocation,
      is_family_coverage: metadata.isFamilyCoverage,
      notes: metadata.notes,
    };

    const { error } = await this.client
      .from('finance_retirement_account_metadata')
      .upsert(row);

    if (error) throw error;
  }

  async deleteRetirementAccountMetadata(accountId: string): Promise<void> {
    const { error } = await this.client
      .from('finance_retirement_account_metadata')
      .delete()
      .eq('account_id', accountId);

    if (error) throw error;
  }

  async listRetirementContributions(retirementAccountId: string): Promise<RetirementContribution[]> {
    const { data, error } = await this.client
      .from('finance_retirement_contributions')
      .select('*')
      .eq('retirement_account_id', retirementAccountId)
      .order('contribution_date', { ascending: false });

    if (error) throw error;

    return (data || []).map(row => ({
      id: row.id,
      retirementAccountId: row.retirement_account_id,
      contributionDate: row.contribution_date,
      amount: parseFloat(row.amount),
      contributionType: row.contribution_type,
      contributionYear: row.contribution_year,
      transactionId: row.transaction_id || undefined,
      notes: row.notes || undefined,
      createdAt: row.created_at,
    }));
  }

  async addRetirementContribution(contribution: RetirementContributionInput): Promise<void> {
    const row = {
      id: contribution.id,
      retirement_account_id: contribution.retirementAccountId,
      contribution_date: contribution.contributionDate,
      amount: contribution.amount,
      contribution_type: contribution.contributionType,
      contribution_year: contribution.contributionYear,
      transaction_id: contribution.transactionId,
      notes: contribution.notes,
    };

    const { error } = await this.client
      .from('finance_retirement_contributions')
      .insert(row);

    if (error) throw error;
  }

  async deleteRetirementContribution(contributionId: string): Promise<void> {
    const { error } = await this.client
      .from('finance_retirement_contributions')
      .delete()
      .eq('id', contributionId);

    if (error) throw error;
  }

  async calculateContributionRoom(_retirementAccountId: string, _annualIncome: number): Promise<ContributionRoom> {
    return {
      employeeRoom: 0,
      employerRoom: 0,
      totalLimit: 0,
      isOver50: false,
    };
  }

  async listRetirementPerformance(retirementAccountId: string): Promise<RetirementPerformance[]> {
    const { data, error } = await this.client
      .from('finance_retirement_performance')
      .select('*')
      .eq('retirement_account_id', retirementAccountId)
      .order('snapshot_date', { ascending: false });

    if (error) throw error;

    return (data || []).map(row => ({
      id: row.id,
      retirementAccountId: row.retirement_account_id,
      snapshotDate: row.snapshot_date,
      balance: parseFloat(row.balance),
      totalContributions: parseFloat(row.total_contributions),
      totalGains: parseFloat(row.total_gains),
      rateOfReturn: row.rate_of_return ? parseFloat(row.rate_of_return) : undefined,
      allocationSnapshot: row.allocation_snapshot || undefined,
      createdAt: row.created_at,
    }));
  }

  async recordRetirementPerformance(performance: RetirementPerformanceInput): Promise<void> {
    const row = {
      id: performance.id,
      retirement_account_id: performance.retirementAccountId,
      snapshot_date: performance.snapshotDate,
      balance: performance.balance,
      total_contributions: performance.totalContributions,
      total_gains: performance.totalGains,
      rate_of_return: performance.rateOfReturn,
      allocation_snapshot: performance.allocationSnapshot,
    };

    const { error } = await this.client
      .from('finance_retirement_performance')
      .insert(row);

    if (error) throw error;
  }

  async calculateVestedBalance(_retirementAccountId: string, _employmentYears: number): Promise<number> {
    return 0;
  }
}
