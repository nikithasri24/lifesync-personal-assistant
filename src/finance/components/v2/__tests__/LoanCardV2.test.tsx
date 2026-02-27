/**
 * Unit tests for LoanCardV2 component
 * Tests loan cards with payment schedules, balances, and loan types
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoanCardV2 } from '../LoanCardV2';

describe('LoanCardV2', () => {
  const mockOnClick = vi.fn();

  const baseLoan = {
    id: '1',
    name: 'Home Mortgage',
    principalAmount: 300000,
    currentBalance: 250000,
    interestRate: 3.5,
    monthlyPayment: 1500,
    nextPaymentDate: '2026-03-15T00:00:00Z',
    loanType: 'mortgage',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render loan name', () => {
      render(<LoanCardV2 loan={baseLoan} onClick={mockOnClick} />);

      expect(screen.getByText('Home Mortgage')).toBeInTheDocument();
    });

    it('should render current balance', () => {
      const { container } = render(<LoanCardV2 loan={baseLoan} onClick={mockOnClick} />);

      expect(container.textContent).toMatch(/\$250,000/);
    });

    it('should render interest rate', () => {
      const { container } = render(<LoanCardV2 loan={baseLoan} onClick={mockOnClick} />);

      expect(container.textContent).toMatch(/3\.5% APR/);
    });

    it('should render monthly payment', () => {
      const { container } = render(<LoanCardV2 loan={baseLoan} onClick={mockOnClick} />);

      expect(container.textContent).toMatch(/\$1,500/);
    });

    it('should render next payment date when provided', () => {
      const { container } = render(<LoanCardV2 loan={baseLoan} onClick={mockOnClick} />);

      expect(container.textContent).toMatch(/Mar|March/i);
      expect(container.textContent).toMatch(/1[45]/); // 14 or 15 due to timezone
    });

    it('should not render next payment when not provided', () => {
      const loanNoPayment = { ...baseLoan, nextPaymentDate: undefined };
      const { container } = render(<LoanCardV2 loan={loanNoPayment} onClick={mockOnClick} />);

      expect(container.textContent).not.toMatch(/Next Payment/);
    });
  });

  describe('Loan Type Icons', () => {
    const loanTypes = [
      { loanType: 'mortgage', icon: '🏠' },
      { loanType: 'auto', icon: '🚗' },
      { loanType: 'student', icon: '🎓' },
      { loanType: 'personal', icon: '💳' },
      { loanType: 'business', icon: '🏢' },
    ];

    loanTypes.forEach(({ loanType, icon }) => {
      it(`should display ${loanType} loan icon`, () => {
        const loan = { ...baseLoan, loanType };
        const { container } = render(<LoanCardV2 loan={loan} onClick={mockOnClick} />);

        expect(container.textContent).toContain(icon);
      });
    });

    it('should display default icon for unknown loan type', () => {
      const loan = { ...baseLoan, loanType: 'unknown' };
      const { container } = render(<LoanCardV2 loan={loan} onClick={mockOnClick} />);

      expect(container.textContent).toContain('💰');
    });

    it('should display default icon when loan type not provided', () => {
      const loan = { ...baseLoan, loanType: undefined };
      const { container } = render(<LoanCardV2 loan={loan} onClick={mockOnClick} />);

      // Falls back to 'personal' which is 💳
      expect(container.textContent).toContain('💳');
    });
  });

  describe('Progress Calculation', () => {
    it('should calculate paid off amount correctly', () => {
      const { container } = render(<LoanCardV2 loan={baseLoan} onClick={mockOnClick} />);

      // Paid off: 300000 - 250000 = 50000
      expect(container.textContent).toMatch(/\$50,000/);
    });

    it('should calculate percentage correctly', () => {
      const { container } = render(<LoanCardV2 loan={baseLoan} onClick={mockOnClick} />);

      // 50000 / 300000 = 16.67%, rounded to 17%
      expect(container.textContent).toMatch(/17% paid off/);
    });

    it('should display progress bar with correct width', () => {
      const { container } = render(<LoanCardV2 loan={baseLoan} onClick={mockOnClick} />);

      // 50000 / 300000 = 16.67%
      const progressBar = container.querySelector('div[style*="width: 16"]');
      expect(progressBar).toBeTruthy();
    });

    it('should handle 0% paid off', () => {
      const loan = { ...baseLoan, currentBalance: 300000 };
      const { container } = render(<LoanCardV2 loan={loan} onClick={mockOnClick} />);

      expect(container.textContent).toMatch(/0% paid off/);
    });

    it('should handle 100% paid off', () => {
      const loan = { ...baseLoan, currentBalance: 0 };
      const { container } = render(<LoanCardV2 loan={loan} onClick={mockOnClick} />);

      expect(container.textContent).toMatch(/100% paid off/);
    });

    it('should handle 50% paid off', () => {
      const loan = { ...baseLoan, currentBalance: 150000 };
      const { container } = render(<LoanCardV2 loan={loan} onClick={mockOnClick} />);

      expect(container.textContent).toMatch(/50% paid off/);
    });

    it('should round percentage to nearest integer', () => {
      const loan = { ...baseLoan, principalAmount: 100000, currentBalance: 66789 };
      const { container } = render(<LoanCardV2 loan={loan} onClick={mockOnClick} />);

      // (100000 - 66789) / 100000 = 33.211%, rounded to 33%
      expect(container.textContent).toMatch(/33% paid off/);
    });
  });

  describe('Progress Bar Styling', () => {
    it('should use green gradient for progress bar', () => {
      const { container } = render(<LoanCardV2 loan={baseLoan} onClick={mockOnClick} />);

      const progressBar = container.querySelector('div[style*="width: 16"]');
      expect(progressBar?.getAttribute('style')).toMatch(/#4CAF50|#388E3C/);
    });

    it('should apply transition to progress bar', () => {
      const { container } = render(<LoanCardV2 loan={baseLoan} onClick={mockOnClick} />);

      const progressBar = container.querySelector('div[style*="width: 16"]');
      expect(progressBar?.getAttribute('style')).toContain('transition');
    });
  });

  describe('Date Formatting', () => {
    it('should format next payment date as "Month Day"', () => {
      const { container } = render(<LoanCardV2 loan={baseLoan} onClick={mockOnClick} />);

      expect(container.textContent).toMatch(/Mar|March/i);
      expect(container.textContent).toMatch(/1[45]/); // 14 or 15 due to timezone
    });

    it('should handle different months', () => {
      const loan = { ...baseLoan, nextPaymentDate: '2026-08-20T12:00:00Z' };
      const { container } = render(<LoanCardV2 loan={loan} onClick={mockOnClick} />);

      expect(container.textContent).toMatch(/Aug|August/i);
      expect(container.textContent).toMatch(/1[89]|20/); // Allow for timezone variation
    });

    it('should handle end of month dates', () => {
      const loan = { ...baseLoan, nextPaymentDate: '2026-02-28T12:00:00Z' };
      const { container } = render(<LoanCardV2 loan={loan} onClick={mockOnClick} />);

      expect(container.textContent).toMatch(/Feb|February/i);
      expect(container.textContent).toMatch(/2[78]/); // 27 or 28 due to timezone
    });
  });

  describe('Currency Formatting', () => {
    it('should format currency without decimals', () => {
      const { container } = render(<LoanCardV2 loan={baseLoan} onClick={mockOnClick} />);

      expect(container.textContent).toMatch(/\$250,000/);
      expect(container.textContent).toMatch(/\$1,500/);
      expect(container.textContent).not.toMatch(/\$250,000\.00/);
    });

    it('should handle large amounts with commas', () => {
      const loan = { ...baseLoan, principalAmount: 500000, currentBalance: 450000 };
      const { container } = render(<LoanCardV2 loan={loan} onClick={mockOnClick} />);

      expect(container.textContent).toMatch(/\$450,000/);
      expect(container.textContent).toMatch(/\$500,000/);
    });

    it('should format paid off amount', () => {
      const { container } = render(<LoanCardV2 loan={baseLoan} onClick={mockOnClick} />);

      expect(container.textContent).toMatch(/\$50,000 of \$300,000/);
    });
  });

  describe('Interest Rate Display', () => {
    it('should display interest rate with APR', () => {
      const { container } = render(<LoanCardV2 loan={baseLoan} onClick={mockOnClick} />);

      expect(container.textContent).toMatch(/3\.5% APR/);
    });

    it('should handle whole number interest rates', () => {
      const loan = { ...baseLoan, interestRate: 4 };
      const { container } = render(<LoanCardV2 loan={loan} onClick={mockOnClick} />);

      expect(container.textContent).toMatch(/4% APR/);
    });

    it('should handle decimal interest rates', () => {
      const loan = { ...baseLoan, interestRate: 3.875 };
      const { container } = render(<LoanCardV2 loan={loan} onClick={mockOnClick} />);

      expect(container.textContent).toMatch(/3\.875% APR/);
    });

    it('should handle low interest rates', () => {
      const loan = { ...baseLoan, interestRate: 0.5 };
      const { container } = render(<LoanCardV2 loan={loan} onClick={mockOnClick} />);

      expect(container.textContent).toMatch(/0\.5% APR/);
    });
  });

  describe('Payment Information', () => {
    it('should display monthly payment label', () => {
      render(<LoanCardV2 loan={baseLoan} onClick={mockOnClick} />);

      expect(screen.getByText('Monthly Payment')).toBeInTheDocument();
    });

    it('should display next payment label when date provided', () => {
      render(<LoanCardV2 loan={baseLoan} onClick={mockOnClick} />);

      expect(screen.getByText('Next Payment')).toBeInTheDocument();
    });

    it('should display balance label', () => {
      render(<LoanCardV2 loan={baseLoan} onClick={mockOnClick} />);

      expect(screen.getByText('Balance')).toBeInTheDocument();
    });
  });

  describe('Interactions', () => {
    it('should call onClick when card is clicked', async () => {
      const user = userEvent.setup();
      render(<LoanCardV2 loan={baseLoan} onClick={mockOnClick} />);

      const card = screen.getByText('Home Mortgage').closest('div');
      if (card) {
        await user.click(card);
        expect(mockOnClick).toHaveBeenCalledTimes(1);
      }
    });

    it('should have cursor-pointer class', () => {
      const { container } = render(<LoanCardV2 loan={baseLoan} onClick={mockOnClick} />);

      const card = container.firstChild as HTMLElement;
      expect(card.className).toContain('cursor-pointer');
    });

    it('should have hover scale effect', () => {
      const { container } = render(<LoanCardV2 loan={baseLoan} onClick={mockOnClick} />);

      const card = container.firstChild as HTMLElement;
      expect(card.className).toContain('hover:scale-[1.01]');
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero balance (fully paid)', () => {
      const loan = { ...baseLoan, currentBalance: 0 };
      const { container } = render(<LoanCardV2 loan={loan} onClick={mockOnClick} />);

      expect(container.textContent).toMatch(/\$0/);
      expect(container.textContent).toMatch(/100% paid off/);
    });

    it('should handle zero monthly payment', () => {
      const loan = { ...baseLoan, monthlyPayment: 0 };
      const { container } = render(<LoanCardV2 loan={loan} onClick={mockOnClick} />);

      expect(container.textContent).toMatch(/\$0/);
    });

    it('should handle very large loan amounts', () => {
      const loan = {
        ...baseLoan,
        principalAmount: 1000000,
        currentBalance: 800000,
        monthlyPayment: 5000,
      };
      const { container } = render(<LoanCardV2 loan={loan} onClick={mockOnClick} />);

      expect(container.textContent).toMatch(/\$800,000/);
      expect(container.textContent).toMatch(/\$1,000,000/);
      expect(container.textContent).toMatch(/\$5,000/);
    });

    it('should handle very long loan name', () => {
      const loan = { ...baseLoan, name: 'Primary Residence First Mortgage Refinance Loan' };
      render(<LoanCardV2 loan={loan} onClick={mockOnClick} />);

      expect(screen.getByText('Primary Residence First Mortgage Refinance Loan')).toBeInTheDocument();
    });

    it('should handle small loan amounts', () => {
      const loan = {
        ...baseLoan,
        principalAmount: 5000,
        currentBalance: 2500,
        monthlyPayment: 200,
      };
      const { container } = render(<LoanCardV2 loan={loan} onClick={mockOnClick} />);

      expect(container.textContent).toMatch(/\$2,500/);
      expect(container.textContent).toMatch(/\$5,000/);
    });

    it('should handle high interest rates', () => {
      const loan = { ...baseLoan, interestRate: 15.5 };
      const { container } = render(<LoanCardV2 loan={loan} onClick={mockOnClick} />);

      expect(container.textContent).toMatch(/15\.5% APR/);
    });

    it('should handle zero interest rate', () => {
      const loan = { ...baseLoan, interestRate: 0 };
      const { container } = render(<LoanCardV2 loan={loan} onClick={mockOnClick} />);

      expect(container.textContent).toMatch(/0% APR/);
    });

    it('should handle balance equal to principal (no payments made)', () => {
      const loan = { ...baseLoan, currentBalance: 300000 };
      const { container } = render(<LoanCardV2 loan={loan} onClick={mockOnClick} />);

      expect(container.textContent).toMatch(/0% paid off/);
      expect(container.textContent).toMatch(/\$0 of \$300,000/);
    });
  });
});
