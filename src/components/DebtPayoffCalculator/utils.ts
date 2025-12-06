import type { DebtAccount } from '../../types/finance';
import type { DebtPaymentPlan, StrategyComparison } from './types';
import { DEBT_TYPES } from './constants';

export const calculatePaymentSchedule = (debt: DebtAccount, monthlyPayment: number): DebtPaymentPlan[] => {
  const schedule: DebtPaymentPlan[] = [];
  let remainingBalance = debt.balance;
  let month = 1;
  const monthlyRate = debt.interestRate / 100 / 12;

  while (remainingBalance > 0.01 && month <= 360) {
    const interestPayment = remainingBalance * monthlyRate;
    const principalPayment = Math.min(monthlyPayment - interestPayment, remainingBalance);

    if (principalPayment <= 0) break;

    remainingBalance -= principalPayment;

    schedule.push({
      month,
      payment: monthlyPayment,
      principal: principalPayment,
      interest: interestPayment,
      balance: Math.max(0, remainingBalance)
    });

    month++;
  }

  return schedule;
};

export const calculateDebtStrategy = (
  debts: DebtAccount[],
  extraPayment: number,
  strategy: 'snowball' | 'avalanche' | 'custom'
): StrategyComparison => {
  const totalMinimums = debts.reduce((sum, debt) => sum + debt.minimumPayment, 0);
  const totalExtraPayment = extraPayment;
  const _totalAvailable = totalMinimums + totalExtraPayment;

  const sortedDebts = [...debts];

  if (strategy === 'snowball') {
    sortedDebts.sort((a, b) => a.balance - b.balance);
  } else if (strategy === 'avalanche') {
    sortedDebts.sort((a, b) => b.interestRate - a.interestRate);
  }

  let totalInterestPaid = 0;
  let totalPayments = 0;
  let maxMonths = 0;
  let remainingExtra = totalExtraPayment;

  const _debtPayoffs = sortedDebts.map(debt => {
    let paymentAmount = debt.minimumPayment;

    if (remainingExtra > 0) {
      paymentAmount += remainingExtra;
      remainingExtra = 0;
    }

    const schedule = calculatePaymentSchedule(debt, paymentAmount);
    const totalInterest = schedule.reduce((sum, payment) => sum + payment.interest, 0);
    const totalPaid = schedule.reduce((sum, payment) => sum + payment.payment, 0);

    totalInterestPaid += totalInterest;
    totalPayments += totalPaid;
    maxMonths = Math.max(maxMonths, schedule.length);

    return { debt, schedule, totalInterest, totalPaid };
  });

  return {
    name: strategy === 'snowball' ? 'Debt Snowball' :
          strategy === 'avalanche' ? 'Debt Avalanche' : 'Custom Strategy',
    totalPayments,
    totalInterest: totalInterestPaid,
    monthsToPayoff: maxMonths,
    monthlySavings: 0
  };
};

export const getDebtTypeInfo = (type: string): { value: string, label: string, icon: string, color: string } => {
  return DEBT_TYPES.find(t => t.value === type) ?? DEBT_TYPES[0];
};

export const getCreditUtilization = (debt: DebtAccount): number => {
  if (debt.creditLimit && debt.creditLimit > 0) {
    return (debt.balance / debt.creditLimit) * 100;
  }
  return 0;
};
