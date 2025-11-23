export interface DebtPaymentPlan {
  month: number;
  payment: number;
  principal: number;
  interest: number;
  balance: number;
}

export interface StrategyComparison {
  name: string;
  totalPayments: number;
  totalInterest: number;
  monthsToPayoff: number;
  monthlySavings?: number;
}
