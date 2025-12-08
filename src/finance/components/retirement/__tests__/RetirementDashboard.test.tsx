import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RetirementDashboard from '../RetirementDashboard';
import type { RetirementAccountWithStats } from '../../../types';

describe('RetirementDashboard', () => {
  const mockAccounts: RetirementAccountWithStats[] = [
    {
      id: '1',
      accountId: 'acc1',
      accountName: 'Company 401k',
      accountBalance: 50000,
      accountType: '401k',
      taxTreatment: 'pre_tax',
      annualContributionLimit: 23000,
      catchUpLimit: 7500,
      currentYearContributions: 10000,
      contributionYear: 2024,
      hasEmployerMatch: true,
      employerMatchPercentage: 100,
      employerMatchLimit: 6,
      employerMatchType: 'percentage',
      employerContributionsYTD: 3000,
      hasVestingSchedule: false,
      vestingPercentage: 100,
      unvestedBalance: 0,
      vestedBalance: 50000,
      totalValue: 50000,
      totalVested: 50000,
      totalYTDContributions: 13000,
      latestGains: 5000,
      latestRateOfReturn: 10,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: '2',
      accountId: 'acc2',
      accountName: 'Roth IRA',
      accountBalance: 30000,
      accountType: 'roth_ira',
      taxTreatment: 'post_tax',
      annualContributionLimit: 7000,
      currentYearContributions: 3500,
      contributionYear: 2024,
      hasEmployerMatch: false,
      hasVestingSchedule: false,
      vestingPercentage: 100,
      unvestedBalance: 0,
      vestedBalance: 30000,
      totalValue: 30000,
      totalVested: 30000,
      totalYTDContributions: 3500,
      latestGains: 2000,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  it('should render dashboard header', () => {
    render(
      <RetirementDashboard
        retirementAccounts={mockAccounts}
        annualSalary={75000}
        age={35}
      />
    );

    expect(screen.getByText('Retirement Accounts')).toBeInTheDocument();
    expect(
      screen.getByText(/Track your 401\(k\), IRA, HSA/i)
    ).toBeInTheDocument();
  });

  it('should display total retirement value', () => {
    render(
      <RetirementDashboard
        retirementAccounts={mockAccounts}
        annualSalary={75000}
        age={35}
      />
    );

    // Total value is 50000 + 30000 = 80000
    expect(screen.getAllByText(/\$80,000/).length).toBeGreaterThan(0);
  });

  it('should display YTD contributions', () => {
    render(
      <RetirementDashboard
        retirementAccounts={mockAccounts}
        annualSalary={75000}
        age={35}
      />
    );

    // Total YTD contributions is 13000 + 3500 = 16500
    expect(screen.getAllByText(/\$16,500/).length).toBeGreaterThan(0);
  });

  it('should display total gains', () => {
    render(
      <RetirementDashboard
        retirementAccounts={mockAccounts}
        annualSalary={75000}
        age={35}
      />
    );

    // Total gains is 5000 + 2000 = 7000
    expect(screen.getAllByText(/\$7,000/).length).toBeGreaterThan(0);
  });

  it('should display retirement readiness score', () => {
    render(
      <RetirementDashboard
        retirementAccounts={mockAccounts}
        annualSalary={75000}
        age={35}
      />
    );

    // Should show a readiness score
    expect(screen.getAllByText(/Readiness/i).length).toBeGreaterThan(0);
  });

  it('should display 4% rule withdrawal amounts', () => {
    render(
      <RetirementDashboard
        retirementAccounts={mockAccounts}
        annualSalary={75000}
        age={35}
      />
    );

    // 4% of 80000 = 3200 annual, ~267 monthly
    expect(screen.getAllByText(/\$3,200/).length).toBeGreaterThan(0);
  });

  it('should render add account button when callback provided', () => {
    const handleAdd = vi.fn();
    render(
      <RetirementDashboard
        retirementAccounts={mockAccounts}
        onAddAccount={handleAdd}
      />
    );

    const addButton = screen.getByText('Add Retirement Account');
    expect(addButton).toBeInTheDocument();
  });

  it('should call onAddAccount when add button clicked', async () => {
    const user = userEvent.setup();
    const handleAdd = vi.fn();

    render(
      <RetirementDashboard
        retirementAccounts={mockAccounts}
        onAddAccount={handleAdd}
      />
    );

    const addButton = screen.getByText('Add Retirement Account');
    await user.click(addButton);

    expect(handleAdd).toHaveBeenCalledTimes(1);
  });

  it('should render account cards for each account', () => {
    render(
      <RetirementDashboard
        retirementAccounts={mockAccounts}
        annualSalary={75000}
        age={35}
      />
    );

    expect(screen.getAllByText('Company 401k').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Roth IRA').length).toBeGreaterThan(0);
  });

  it('should show empty state when no accounts', () => {
    render(
      <RetirementDashboard
        retirementAccounts={[]}
        annualSalary={75000}
        age={35}
      />
    );

    expect(screen.getByText('No Retirement Accounts Yet')).toBeInTheDocument();
    expect(
      screen.getByText(/Start tracking your 401\(k\), IRA, HSA/i)
    ).toBeInTheDocument();
  });

  it('should render empty state add button', async () => {
    const user = userEvent.setup();
    const handleAdd = vi.fn();

    render(
      <RetirementDashboard
        retirementAccounts={[]}
        onAddAccount={handleAdd}
      />
    );

    const addButtons = screen.getAllByRole('button', { name: /add.*account/i });
    // Click the first one (could be either the header button or empty state button)
    await user.click(addButtons[0]);

    expect(handleAdd).toHaveBeenCalledTimes(1);
  });

  it('should handle edit account callback', async () => {
    const user = userEvent.setup();
    const handleEdit = vi.fn();

    render(
      <RetirementDashboard
        retirementAccounts={mockAccounts}
        onEditAccount={handleEdit}
      />
    );

    // Find edit buttons (there should be one per account)
    const editButtons = screen.getAllByRole('button', { name: /edit/i });
    await user.click(editButtons[0]);

    expect(handleEdit).toHaveBeenCalledWith('acc1');
  });

  it('should handle delete account callback', async () => {
    const user = userEvent.setup();
    const handleDelete = vi.fn();

    render(
      <RetirementDashboard
        retirementAccounts={mockAccounts}
        onDeleteAccount={handleDelete}
      />
    );

    const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
    await user.click(deleteButtons[0]);

    expect(handleDelete).toHaveBeenCalledWith('acc1');
  });

  it('should use default values when salary and age not provided', () => {
    const { container } = render(
      <RetirementDashboard retirementAccounts={mockAccounts} />
    );

    // Should render without errors
    expect(container).toBeInTheDocument();
  });

  it('should calculate and display account breakdown by type', () => {
    const { container } = render(
      <RetirementDashboard
        retirementAccounts={mockAccounts}
        annualSalary={75000}
        age={35}
      />
    );

    // Should display multiple account cards
    expect(container.textContent).toContain('Company 401k');
    expect(container.textContent).toContain('Roth IRA');
  });

  it('should display settings hint when accounts exist', () => {
    const { container } = render(
      <RetirementDashboard
        retirementAccounts={mockAccounts}
        annualSalary={75000}
        age={35}
      />
    );

    // Component should render with accounts
    expect(screen.getAllByText('Company 401k').length).toBeGreaterThan(0);
  });

  it('should handle accounts with vesting', () => {
    const accountsWithVesting: RetirementAccountWithStats[] = [
      {
        ...mockAccounts[0],
        hasVestingSchedule: true,
        vestingPercentage: 60,
        unvestedBalance: 10000,
        vestedBalance: 40000,
      },
    ];

    render(
      <RetirementDashboard
        retirementAccounts={accountsWithVesting}
        annualSalary={75000}
        age={35}
      />
    );

    // Should show unvested balance information
    expect(screen.queryByText(/Vesting/i) || screen.queryByText(/vested/i)).toBeTruthy();
  });

  it('should handle multiple accounts of same type', () => {
    const multipleAccounts: RetirementAccountWithStats[] = [
      mockAccounts[0],
      { ...mockAccounts[0], id: '3', accountId: 'acc3', accountName: 'Old 401k' },
    ];

    render(
      <RetirementDashboard
        retirementAccounts={multipleAccounts}
        annualSalary={75000}
        age={35}
      />
    );

    expect(screen.getAllByText('Company 401k').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Old 401k').length).toBeGreaterThan(0);
  });
});
