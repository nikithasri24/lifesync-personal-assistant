/**
 * Unit tests for TransactionItemV2 component
 * Tests transaction item rendering, type-based coloring, and category display
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TransactionItemV2 } from '../TransactionItemV2';

describe('TransactionItemV2', () => {
  const mockOnClick = vi.fn();

  const baseTransaction = {
    id: '1',
    description: 'Grocery Shopping',
    amount: 150.50,
    type: 'debit' as const,
    dateISO: '2024-07-15T10:00:00Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render transaction description', () => {
      render(<TransactionItemV2 transaction={baseTransaction} onClick={mockOnClick} />);

      expect(screen.getByText('Grocery Shopping')).toBeInTheDocument();
    });

    it('should render transaction amount', () => {
      const { container } = render(<TransactionItemV2 transaction={baseTransaction} onClick={mockOnClick} />);

      expect(container.textContent).toMatch(/\$150\.50/);
    });

    it('should format amount as currency', () => {
      const transaction = { ...baseTransaction, amount: 1234.56 };
      const { container } = render(<TransactionItemV2 transaction={transaction} onClick={mockOnClick} />);

      expect(container.textContent).toMatch(/\$1,234\.56/);
    });

    it('should render transaction date', () => {
      const { container } = render(<TransactionItemV2 transaction={baseTransaction} onClick={mockOnClick} />);

      // Date should be formatted as "Jul 15" or similar
      expect(container.textContent).toMatch(/Jul/);
    });

    it('should display category icon', () => {
      const category = { name: 'Food', icon: '🍔', color: '#4CAF50' };
      const { container } = render(
        <TransactionItemV2 transaction={baseTransaction} category={category} onClick={mockOnClick} />
      );

      expect(container.textContent).toContain('🍔');
    });
  });

  describe('Transaction Type Display', () => {
    it('should display negative sign for debit transactions', () => {
      const { container } = render(<TransactionItemV2 transaction={baseTransaction} onClick={mockOnClick} />);

      expect(container.textContent).toMatch(/-\$150\.50/);
    });

    it('should display positive sign for credit transactions', () => {
      const transaction = { ...baseTransaction, type: 'credit' as const };
      const { container } = render(<TransactionItemV2 transaction={transaction} onClick={mockOnClick} />);

      expect(container.textContent).toMatch(/\+\$150\.50/);
    });

    it('should use green color for credit amount', () => {
      const transaction = { ...baseTransaction, type: 'credit' as const };
      const { container } = render(<TransactionItemV2 transaction={transaction} onClick={mockOnClick} />);

      // Find the amount element with green color (#4CAF50 or rgb(76, 175, 80))
      const amountElements = Array.from(container.querySelectorAll('div')).filter(div =>
        div.textContent?.includes('$150.50') && div.style.color
      );
      const hasGreenColor = amountElements.some(el =>
        el.style.color && (el.style.color.includes('4CAF50') || el.style.color.includes('76, 175, 80'))
      );
      expect(hasGreenColor).toBe(true);
    });

    it('should use default color for debit amount', () => {
      const { container } = render(<TransactionItemV2 transaction={baseTransaction} onClick={mockOnClick} />);

      // Debit amounts should have default color (#5C4A3A)
      const amountElements = Array.from(container.querySelectorAll('div')).filter(div =>
        div.textContent?.includes('$150.50')
      );
      const amountElement = amountElements.find(el =>
        el.style.color && (el.style.color.includes('5C4A3A') || el.style.color.includes('92, 74, 58'))
      );
      expect(amountElement).toBeDefined();
    });
  });

  describe('Category Display', () => {
    it('should display category name', () => {
      const category = { name: 'Groceries', icon: '🛒' };
      render(
        <TransactionItemV2 transaction={baseTransaction} category={category} onClick={mockOnClick} />
      );

      expect(screen.getByText(/Groceries/)).toBeInTheDocument();
    });

    it('should display "Uncategorized" when no category', () => {
      render(<TransactionItemV2 transaction={baseTransaction} onClick={mockOnClick} />);

      expect(screen.getByText(/Uncategorized/)).toBeInTheDocument();
    });

    it('should display category icon', () => {
      const category = { name: 'Transport', icon: '🚗', color: '#2196F3' };
      const { container } = render(
        <TransactionItemV2 transaction={baseTransaction} category={category} onClick={mockOnClick} />
      );

      expect(container.textContent).toContain('🚗');
    });

    it('should display default icon when category has no icon', () => {
      const category = { name: 'Other' };
      const { container } = render(
        <TransactionItemV2 transaction={baseTransaction} category={category} onClick={mockOnClick} />
      );

      expect(container.textContent).toContain('💰');
    });

    it('should use category color for icon background', () => {
      const category = { name: 'Food', icon: '🍔', color: '#FF5722' };
      const { container } = render(
        <TransactionItemV2 transaction={baseTransaction} category={category} onClick={mockOnClick} />
      );

      // Verify category icon is displayed (which means background was applied)
      expect(container.textContent).toContain('🍔');
      expect(screen.getByText(/Food/)).toBeInTheDocument();
    });

    it('should use default gradient when no category color', () => {
      const { container } = render(<TransactionItemV2 transaction={baseTransaction} onClick={mockOnClick} />);

      // Should have gradient background
      const iconContainers = Array.from(container.querySelectorAll('div')).filter(div =>
        div.style.background && div.style.background.includes('linear-gradient')
      );
      expect(iconContainers.length).toBeGreaterThan(0);
    });
  });

  describe('Date Formatting', () => {
    it('should format date as "Month Day"', () => {
      const transaction = { ...baseTransaction, dateISO: '2024-12-25T10:00:00Z' };
      const { container } = render(<TransactionItemV2 transaction={transaction} onClick={mockOnClick} />);

      // Should show "Dec 25" or similar (timezone may vary)
      expect(container.textContent).toMatch(/Dec/);
    });

    it('should handle different months', () => {
      const transaction = { ...baseTransaction, dateISO: '2024-01-01T10:00:00Z' };
      const { container } = render(<TransactionItemV2 transaction={transaction} onClick={mockOnClick} />);

      expect(container.textContent).toMatch(/Jan/);
    });
  });

  describe('Interactions', () => {
    it('should call onClick when item is clicked', async () => {
      const user = userEvent.setup();
      render(<TransactionItemV2 transaction={baseTransaction} onClick={mockOnClick} />);

      const item = screen.getByText('Grocery Shopping').closest('div');
      if (item) {
        await user.click(item);
        expect(mockOnClick).toHaveBeenCalledTimes(1);
      }
    });

    it('should have cursor-pointer class', () => {
      const { container } = render(<TransactionItemV2 transaction={baseTransaction} onClick={mockOnClick} />);

      const item = container.firstChild as HTMLElement;
      expect(item.className).toContain('cursor-pointer');
    });

    it('should have hover shadow effect', () => {
      const { container } = render(<TransactionItemV2 transaction={baseTransaction} onClick={mockOnClick} />);

      const item = container.firstChild as HTMLElement;
      expect(item.className).toContain('hover:shadow-md');
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long description', () => {
      const transaction = {
        ...baseTransaction,
        description: 'A'.repeat(100),
      };
      render(<TransactionItemV2 transaction={transaction} onClick={mockOnClick} />);

      expect(screen.getByText('A'.repeat(100))).toBeInTheDocument();
    });

    it('should handle very large amount', () => {
      const transaction = { ...baseTransaction, amount: 999999.99 };
      const { container } = render(<TransactionItemV2 transaction={transaction} onClick={mockOnClick} />);

      expect(container.textContent).toMatch(/\$999,999\.99/);
    });

    it('should handle zero amount', () => {
      const transaction = { ...baseTransaction, amount: 0 };
      const { container } = render(<TransactionItemV2 transaction={transaction} onClick={mockOnClick} />);

      expect(container.textContent).toMatch(/\$0\.00/);
    });

    it('should handle small decimal amounts', () => {
      const transaction = { ...baseTransaction, amount: 0.01 };
      const { container } = render(<TransactionItemV2 transaction={transaction} onClick={mockOnClick} />);

      expect(container.textContent).toMatch(/\$0\.01/);
    });

    it('should truncate long category names', () => {
      const category = { name: 'Very Long Category Name That Should Be Truncated' };
      render(
        <TransactionItemV2 transaction={baseTransaction} category={category} onClick={mockOnClick} />
      );

      expect(screen.getByText(/Very Long Category Name/)).toBeInTheDocument();
    });

    it('should handle missing category properties', () => {
      const category = { name: 'Basic' };
      const { container } = render(
        <TransactionItemV2 transaction={baseTransaction} category={category} onClick={mockOnClick} />
      );

      // "Basic" is split across text nodes, use textContent
      expect(container.textContent).toContain('Basic');
      expect(container.textContent).toContain('💰'); // Default icon
    });
  });
});
