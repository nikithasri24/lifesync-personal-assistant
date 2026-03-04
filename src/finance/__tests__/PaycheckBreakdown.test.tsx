/**
 * Component tests for PaycheckBreakdown.tsx (commit 5dc2808)
 *
 * Verifies that the component correctly renders gross pay, deductions,
 * take-home rate, and the net pay row.
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PaycheckBreakdown } from '../components/PaycheckBreakdown';
import type { Paystub } from '../data';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

function makePaystub(overrides: Partial<Paystub> = {}): Paystub {
  return {
    id: 'ps-1',
    userId: 'user-1',
    payPeriod: '2026-03',
    grossPay: 10000,
    netPay: 7200,
    deductions: [
      { name: '401(k)', amount: 1000, type: 'pretax' },
      { name: 'Federal Tax', amount: 1500, type: 'tax' },
      { name: 'Health Premium', amount: 300, type: 'posttax' },
    ],
    ...overrides,
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('PaycheckBreakdown', () => {
  it('renders gross pay formatted as currency', () => {
    render(<PaycheckBreakdown paystub={makePaystub()} />);
    // formatCurrency(10000) → "$10,000.00" or "$10,000"
    expect(screen.getByText(/10,000/)).toBeInTheDocument();
  });

  it('renders each deduction name', () => {
    render(<PaycheckBreakdown paystub={makePaystub()} />);
    expect(screen.getByText('401(k)')).toBeInTheDocument();
    expect(screen.getByText('Federal Tax')).toBeInTheDocument();
    expect(screen.getByText('Health Premium')).toBeInTheDocument();
  });

  it('renders deduction type badges (Pre-tax, Tax, Post-tax)', () => {
    render(<PaycheckBreakdown paystub={makePaystub()} />);
    expect(screen.getByText('Pre-tax')).toBeInTheDocument();
    expect(screen.getByText('Tax')).toBeInTheDocument();
    expect(screen.getByText('Post-tax')).toBeInTheDocument();
  });

  it('shows correct take-home percentage in the header', () => {
    // 7200 / 10000 = 72%
    render(<PaycheckBreakdown paystub={makePaystub()} />);
    expect(screen.getByText(/72%/)).toBeInTheDocument();
  });

  it('shows "Net Pay (take-home)" row', () => {
    render(<PaycheckBreakdown paystub={makePaystub()} />);
    expect(screen.getByText(/Net Pay \(take-home\)/i)).toBeInTheDocument();
  });

  it('renders net pay formatted as currency', () => {
    render(<PaycheckBreakdown paystub={makePaystub()} />);
    // formatCurrency(7200) → "$7,200.00" or "$7,200"
    expect(screen.getAllByText(/7,200/).length).toBeGreaterThan(0);
  });

  it('shows 0% take-home when grossPay is 0', () => {
    render(
      <PaycheckBreakdown
        paystub={makePaystub({ grossPay: 0, netPay: 0, deductions: [] })}
      />
    );
    expect(screen.getByText(/0%/)).toBeInTheDocument();
  });

  it('renders with empty deductions array without crashing', () => {
    render(
      <PaycheckBreakdown
        paystub={makePaystub({ deductions: [], netPay: 10000 })}
      />
    );
    expect(screen.getByText(/Net Pay \(take-home\)/i)).toBeInTheDocument();
  });

  it('does not produce Infinity% bar widths when grossPay is 0 but deductions exist', () => {
    // Regression test for division-by-zero on bar width (line 56)
    // grossPay=0 with non-empty deductions used to yield Infinity% CSS
    const { container } = render(
      <PaycheckBreakdown
        paystub={makePaystub({
          grossPay: 0,
          netPay: 0,
          deductions: [{ name: 'Fed Tax', amount: 500, type: 'tax' }],
        })}
      />
    );
    // No bar segment should have an Infinity width
    const barSegments = container.querySelectorAll('[style*="width"]');
    barSegments.forEach((el) => {
      expect((el as HTMLElement).style.width).not.toContain('Infinity');
      expect((el as HTMLElement).style.width).not.toContain('NaN');
    });
  });

  it('shows deduction amount with minus prefix', () => {
    render(<PaycheckBreakdown paystub={makePaystub()} />);
    // The component renders "−$1,000.00" style
    const minusSigns = screen.getAllByText(/−/);
    expect(minusSigns.length).toBeGreaterThan(0);
  });
});
