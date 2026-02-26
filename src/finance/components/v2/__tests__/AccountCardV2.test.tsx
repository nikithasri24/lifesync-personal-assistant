/**
 * Unit tests for AccountCardV2 component
 * Tests account card rendering, account types, balance display, and credit utilization
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AccountCardV2 } from '../AccountCardV2';

describe('AccountCardV2', () => {
  const mockOnClick = vi.fn();

  const baseAccount = {
    id: '1',
    name: 'Checking Account',
    type: 'checking',
    balance: 5000,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render account name', () => {
      render(<AccountCardV2 account={baseAccount} onClick={mockOnClick} />);

      expect(screen.getByText(/Checking Account/i)).toBeInTheDocument();
    });

    it('should render account type', () => {
      const { container } = render(<AccountCardV2 account={baseAccount} onClick={mockOnClick} />);

      expect(container.textContent).toContain('CHECKING');
    });

    it('should render balance', () => {
      const { container } = render(<AccountCardV2 account={baseAccount} onClick={mockOnClick} />);

      expect(container.textContent).toMatch(/\$5,000/);
    });

    it('should format balance as currency', () => {
      const account = { ...baseAccount, balance: 1234.56 };
      const { container } = render(<AccountCardV2 account={account} onClick={mockOnClick} />);

      expect(container.textContent).toMatch(/\$1,234\.56/);
    });

    it('should handle negative balance', () => {
      const account = { ...baseAccount, balance: -500 };
      const { container } = render(<AccountCardV2 account={account} onClick={mockOnClick} />);

      expect(container.textContent).toMatch(/-\$500/);
    });
  });

  describe('Account Type Icons', () => {
    const accountTypes = [
      { type: 'checking', icon: '💳' },
      { type: 'savings', icon: '🏦' },
      { type: 'credit', icon: '💳' },
      { type: 'brokerage', icon: '📈' },
      { type: 'investment', icon: '📊' },
      { type: '401k', icon: '🏢' },
      { type: '403b', icon: '🏢' },
      { type: 'traditional_ira', icon: '🎯' },
      { type: 'roth_ira', icon: '🎯' },
      { type: 'sep_ira', icon: '🎯' },
      { type: 'simple_ira', icon: '🎯' },
      { type: 'hsa', icon: '🏥' },
      { type: 'loan', icon: '🏠' },
    ];

    accountTypes.forEach(({ type, icon }) => {
      it(`should display ${type} account icon`, () => {
        const account = { ...baseAccount, type };
        const { container } = render(<AccountCardV2 account={account} onClick={mockOnClick} />);

        expect(container.textContent).toContain(icon);
      });
    });

    it('should display default icon for unknown type', () => {
      const account = { ...baseAccount, type: 'unknown' };
      const { container } = render(<AccountCardV2 account={account} onClick={mockOnClick} />);

      expect(container.textContent).toContain('💰');
    });
  });

  describe('Institution Display', () => {
    it('should display institution name when provided', () => {
      render(
        <AccountCardV2
          account={baseAccount}
          onClick={mockOnClick}
          institutionName="Chase Bank"
        />
      );

      expect(screen.getByText('Chase Bank')).toBeInTheDocument();
    });

    it('should not display institution when not provided', () => {
      const { container } = render(<AccountCardV2 account={baseAccount} onClick={mockOnClick} />);

      expect(container.textContent).not.toContain('Chase');
      expect(container.textContent).not.toContain('Bank');
    });
  });

  describe('Credit Card Utilization', () => {
    it('should display utilization for credit accounts', () => {
      const creditAccount = {
        ...baseAccount,
        type: 'credit',
        balance: -500,
        creditLimit: 1000,
      };
      render(<AccountCardV2 account={creditAccount} onClick={mockOnClick} />);

      expect(screen.getByText(/Utilization: 50%/i)).toBeInTheDocument();
    });

    it('should display progress bar for credit utilization', () => {
      const creditAccount = {
        ...baseAccount,
        type: 'credit',
        balance: -750,
        creditLimit: 1000,
      };
      const { container } = render(<AccountCardV2 account={creditAccount} onClick={mockOnClick} />);

      // Check for progress bar existence
      const progressBars = container.querySelectorAll('div[style*="width: 75%"]');
      expect(progressBars.length).toBeGreaterThan(0);
    });

    it('should not display utilization for non-credit accounts', () => {
      render(<AccountCardV2 account={baseAccount} onClick={mockOnClick} />);

      expect(screen.queryByText(/Utilization/i)).not.toBeInTheDocument();
    });

    it('should handle 0% utilization', () => {
      const creditAccount = {
        ...baseAccount,
        type: 'credit',
        balance: 0,
        creditLimit: 1000,
      };
      render(<AccountCardV2 account={creditAccount} onClick={mockOnClick} />);

      expect(screen.getByText(/Utilization: 0%/i)).toBeInTheDocument();
    });

    it('should handle 100% utilization', () => {
      const creditAccount = {
        ...baseAccount,
        type: 'credit',
        balance: -1000,
        creditLimit: 1000,
      };
      render(<AccountCardV2 account={creditAccount} onClick={mockOnClick} />);

      expect(screen.getByText(/Utilization: 100%/i)).toBeInTheDocument();
    });

    it('should cap utilization at 100% for over-limit', () => {
      const creditAccount = {
        ...baseAccount,
        type: 'credit',
        balance: -1500,
        creditLimit: 1000,
      };
      const { container } = render(<AccountCardV2 account={creditAccount} onClick={mockOnClick} />);

      // Should show 100% not 150%
      expect(container.textContent).toMatch(/Utilization: 100%/i);
    });

    it('should not show utilization if no credit limit', () => {
      const creditAccount = {
        ...baseAccount,
        type: 'credit',
        balance: -500,
      };
      render(<AccountCardV2 account={creditAccount} onClick={mockOnClick} />);

      expect(screen.queryByText(/Utilization/i)).not.toBeInTheDocument();
    });
  });

  describe('Owner Badge', () => {
    it('should not show owner badge by default', () => {
      render(<AccountCardV2 account={baseAccount} onClick={mockOnClick} />);

      expect(screen.queryByText(/Sarah|John/)).not.toBeInTheDocument();
    });

    it('should show owner badge when showOwnerBadge is true and owner provided', () => {
      render(
        <AccountCardV2
          account={baseAccount}
          onClick={mockOnClick}
          showOwnerBadge={true}
          owner={{ isOwner: false, displayName: 'Sarah' }}
        />
      );

      expect(screen.getByText('Sarah')).toBeInTheDocument();
    });

    it('should not show owner badge when showOwnerBadge is false', () => {
      render(
        <AccountCardV2
          account={baseAccount}
          onClick={mockOnClick}
          showOwnerBadge={false}
          owner={{ isOwner: false, displayName: 'John' }}
        />
      );

      expect(screen.queryByText('John')).not.toBeInTheDocument();
    });

    it('should handle isOwner true', () => {
      render(
        <AccountCardV2
          account={baseAccount}
          onClick={mockOnClick}
          showOwnerBadge={true}
          owner={{ isOwner: true, displayName: 'Me' }}
        />
      );

      expect(screen.getByText('Me')).toBeInTheDocument();
    });
  });

  describe('Interactions', () => {
    it('should call onClick when card is clicked', async () => {
      const user = userEvent.setup();
      render(<AccountCardV2 account={baseAccount} onClick={mockOnClick} />);

      const card = screen.getByText(/Checking Account/i).closest('div');
      if (card) {
        await user.click(card);
        expect(mockOnClick).toHaveBeenCalledTimes(1);
      }
    });

    it('should have cursor-pointer class', () => {
      const { container } = render(<AccountCardV2 account={baseAccount} onClick={mockOnClick} />);

      const card = container.firstChild as HTMLElement;
      expect(card.className).toContain('cursor-pointer');
    });

    it('should have hover scale effect', () => {
      const { container } = render(<AccountCardV2 account={baseAccount} onClick={mockOnClick} />);

      const card = container.firstChild as HTMLElement;
      expect(card.className).toContain('hover:scale-[1.01]');
    });
  });

  describe('Edge Cases', () => {
    it('should handle very large balance', () => {
      const account = { ...baseAccount, balance: 1234567.89 };
      const { container } = render(<AccountCardV2 account={account} onClick={mockOnClick} />);

      expect(container.textContent).toMatch(/\$1,234,567\.89/);
    });

    it('should handle zero balance', () => {
      const account = { ...baseAccount, balance: 0 };
      const { container } = render(<AccountCardV2 account={account} onClick={mockOnClick} />);

      expect(container.textContent).toMatch(/\$0\.00/);
    });

    it('should handle account type with underscore', () => {
      const account = { ...baseAccount, type: 'traditional_ira' };
      const { container } = render(<AccountCardV2 account={account} onClick={mockOnClick} />);

      // Should display as "TRADITIONAL IRA"
      expect(container.textContent).toContain('TRADITIONAL');
      expect(container.textContent).toContain('IRA');
    });

    it('should handle very long account name', () => {
      const account = {
        ...baseAccount,
        name: 'A'.repeat(100),
      };
      const { container } = render(<AccountCardV2 account={account} onClick={mockOnClick} />);

      expect(container.textContent).toContain('A'.repeat(100));
    });
  });
});
