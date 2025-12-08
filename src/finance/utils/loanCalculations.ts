/**
 * Loan calculation utilities
 */

import type { Loan } from '../types';

export interface LoanAmortizationSchedule {
  paymentNumber: number;
  paymentDate: string;
  paymentAmount: number;
  principalAmount: number;
  interestAmount: number;
  remainingBalance: number;
}

/**
 * Calculate the total interest paid so far based on loan parameters
 */
export function calculateInterestPaidToDate(loan: Loan): number {
  const schedule = generateAmortizationSchedule(loan);
  const today = new Date();

  // Sum up interest from all payments that should have been made by now
  let totalInterest = 0;
  for (const payment of schedule) {
    const paymentDate = new Date(payment.paymentDate);
    if (paymentDate <= today) {
      totalInterest += payment.interestAmount;
    } else {
      break; // Stop when we reach future payments
    }
  }

  return totalInterest;
}

/**
 * Calculate the total principal paid so far based on loan parameters
 */
export function calculatePrincipalPaidToDate(loan: Loan): number {
  const schedule = generateAmortizationSchedule(loan);
  const today = new Date();

  let totalPrincipal = 0;
  for (const payment of schedule) {
    const paymentDate = new Date(payment.paymentDate);
    if (paymentDate <= today) {
      totalPrincipal += payment.principalAmount;
    } else {
      break;
    }
  }

  return totalPrincipal;
}

/**
 * Generate full amortization schedule for a loan
 */
export function generateAmortizationSchedule(loan: Loan): LoanAmortizationSchedule[] {
  const schedule: LoanAmortizationSchedule[] = [];

  const monthlyRate = loan.interestRate / 100 / 12;
  const totalPayment = loan.monthlyPayment + loan.extraPayment;
  let remainingBalance = loan.principalAmount;

  // Start from first payment date
  const currentDate = new Date(loan.firstPaymentDate);
  let paymentNumber = 1;

  // Generate schedule until loan is paid off or we reach 600 payments (50 years max)
  while (remainingBalance > 0.01 && paymentNumber <= 600) {
    // Calculate interest for this month
    const interestAmount = remainingBalance * monthlyRate;

    // Calculate principal payment (total payment minus interest)
    let principalAmount = totalPayment - interestAmount;

    // Ensure we don't overpay on the last payment
    if (principalAmount > remainingBalance) {
      principalAmount = remainingBalance;
    }

    // Update remaining balance
    remainingBalance -= principalAmount;

    // Add to schedule
    schedule.push({
      paymentNumber,
      paymentDate: currentDate.toISOString().split('T')[0],
      paymentAmount: principalAmount + interestAmount,
      principalAmount,
      interestAmount,
      remainingBalance: Math.max(0, remainingBalance),
    });

    // Move to next month
    currentDate.setMonth(currentDate.getMonth() + 1);
    paymentNumber++;
  }

  return schedule;
}

/**
 * Calculate total interest that will be paid over the life of the loan
 */
export function calculateTotalInterest(loan: Loan): number {
  const schedule = generateAmortizationSchedule(loan);
  return schedule.reduce((sum, payment) => sum + payment.interestAmount, 0);
}

/**
 * Calculate the number of payments made so far
 */
export function calculatePaymentsMade(loan: Loan): number {
  const firstPayment = new Date(loan.firstPaymentDate);
  const today = new Date();

  if (today < firstPayment) {
    return 0;
  }

  // Calculate months difference
  const yearsDiff = today.getFullYear() - firstPayment.getFullYear();
  const monthsDiff = today.getMonth() - firstPayment.getMonth();
  const totalMonths = yearsDiff * 12 + monthsDiff;

  // Add 1 because the first payment counts
  return totalMonths + 1;
}

/**
 * Calculate the expected current balance based on scheduled payments
 */
export function calculateExpectedBalance(loan: Loan): number {
  const schedule = generateAmortizationSchedule(loan);
  const paymentsMade = calculatePaymentsMade(loan);

  if (paymentsMade === 0) {
    return loan.principalAmount;
  }

  if (paymentsMade >= schedule.length) {
    return 0; // Loan should be paid off
  }

  return schedule[paymentsMade - 1]?.remainingBalance || 0;
}

/**
 * Check if the loan is on track (actual balance vs expected balance)
 */
export function isLoanOnTrack(loan: Loan): boolean {
  const expectedBalance = calculateExpectedBalance(loan);

  // Allow 1% tolerance for rounding
  const tolerance = loan.principalAmount * 0.01;

  return loan.currentBalance <= expectedBalance + tolerance;
}
