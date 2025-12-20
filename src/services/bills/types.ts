/**
 * Recurring Bills Types
 * Type definitions for bill tracking and subscription management
 */

export type BillFrequency = 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'semi_annual' | 'annual';

export type BillCategory = 
  | 'housing' 
  | 'utilities' 
  | 'insurance' 
  | 'subscriptions' 
  | 'loans' 
  | 'credit_cards' 
  | 'memberships' 
  | 'services' 
  | 'other';

export type PaymentStatus = 'paid' | 'pending' | 'late' | 'skipped';

export interface RecurringBill {
  id: string;
  user_id: string;
  
  // Bill details
  name: string;
  description?: string | null;
  amount: number;
  currency: string;
  
  // Frequency and timing
  frequency: BillFrequency;
  due_day?: number | null;
  due_date?: string | null;
  
  // Category
  category: BillCategory;
  
  // Payment info
  is_auto_pay: boolean;
  payment_method?: string | null;
  account_number_last4?: string | null;
  
  // Subscription-specific
  is_subscription: boolean;
  subscription_service?: string | null;
  cancellation_url?: string | null;
  
  // Reminders
  reminder_days_before: number[];
  
  // Status
  is_active: boolean;
  
  // Timestamps
  created_at: string;
  updated_at: string;
}

export interface BillPayment {
  id: string;
  user_id: string;
  bill_id: string;
  
  amount_paid: number;
  paid_date: string;
  due_date: string;
  
  status: PaymentStatus;
  notes?: string | null;
  
  created_at: string;
}

export interface CreateBillInput {
  name: string;
  description?: string;
  amount: number;
  currency?: string;
  frequency: BillFrequency;
  due_day?: number;
  due_date?: string;
  category?: BillCategory;
  is_auto_pay?: boolean;
  payment_method?: string;
  is_subscription?: boolean;
  subscription_service?: string;
  cancellation_url?: string;
  reminder_days_before?: number[];
}

export interface UpdateBillInput {
  name?: string;
  description?: string;
  amount?: number;
  frequency?: BillFrequency;
  due_day?: number;
  due_date?: string;
  category?: BillCategory;
  is_auto_pay?: boolean;
  payment_method?: string;
  is_subscription?: boolean;
  subscription_service?: string;
  cancellation_url?: string;
  reminder_days_before?: number[];
  is_active?: boolean;
}

export interface RecordPaymentInput {
  bill_id: string;
  amount_paid: number;
  paid_date: string;
  due_date: string;
  status?: PaymentStatus;
  notes?: string;
}

export interface BillSummary {
  totalMonthly: number;
  totalAnnual: number;
  upcomingThisWeek: RecurringBill[];
  overdueCount: number;
  subscriptionTotal: number;
  byCategory: Record<BillCategory, number>;
}

