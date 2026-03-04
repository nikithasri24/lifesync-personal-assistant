/**
 * Component tests for SpendOptimizer.tsx (commit 5cdf2be — CC dashboard rebuild)
 *
 * Verifies category selection, card ranking logic, and edge cases (null base
 * rate, empty cards array).
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SpendOptimizer } from '../components/creditCards/SpendOptimizer';
import type { Account, CardCategoryBonus } from '../types';

// ─── Mock useThemeColors ──────────────────────────────────────────────────────

vi.mock('@/hooks/useThemeColors', () => ({
  useThemeColors: () => ({
    bg: { white: '#fff', secondary: '#f8f8f8', primary: '#faf9f8' },
    text: { primary: '#1a1a1a', secondary: '#666' },
    border: { light: '#e5e7eb', medium: '#d1d5db' },
  }),
}));

// ─── Fixtures ─────────────────────────────────────────────────────────────────

function makeCard(overrides: Partial<Account> = {}): Account {
  return {
    id: 'card-1',
    userId: 'u1',
    name: 'Test Card',
    type: 'credit',
    balance: -200,
    lastUpdatedISO: '2026-03-01',
    creditLimit: 5000,
    baseRewardsRate: 1.0,
    rewardsType: 'points',
    ...overrides,
  };
}

function makeBonus(overrides: Partial<CardCategoryBonus> = {}): CardCategoryBonus {
  return {
    id: 'bonus-1',
    userId: 'u1',
    accountId: 'card-1',
    category: 'dining',
    rewardsRate: 3.0,
    isRotating: false,
    createdAt: '2026-01-01',
    ...overrides,
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('SpendOptimizer', () => {
  it('renders all 6 category buttons', () => {
    render(<SpendOptimizer cards={[makeCard()]} bonusesByCard={{}} />);
    const expected = ['Dining', 'Groceries', 'Gas', 'Travel', 'Online Shopping', 'Everything Else'];
    for (const label of expected) {
      expect(screen.getByRole('button', { name: new RegExp(label, 'i') })).toBeInTheDocument();
    }
  });

  it('shows hint text before any category is selected', () => {
    render(<SpendOptimizer cards={[makeCard()]} bonusesByCard={{}} />);
    expect(screen.getByText(/select a category/i)).toBeInTheDocument();
  });

  it('shows ranked list after clicking a category', () => {
    const card = makeCard({ id: 'card-1', name: 'Chase Sapphire' });
    const bonuses: Record<string, CardCategoryBonus[]> = {
      'card-1': [makeBonus({ accountId: 'card-1', category: 'dining', rewardsRate: 3.0 })],
    };
    render(<SpendOptimizer cards={[card]} bonusesByCard={bonuses} />);

    fireEvent.click(screen.getByRole('button', { name: /dining/i }));
    // Card name should appear in the ranking
    expect(screen.getAllByText(/Chase Sapphire/).length).toBeGreaterThan(0);
  });

  it('ranks card with dining bonus above card with only base rate for Dining', () => {
    const bonusCard = makeCard({ id: 'bonus-card', name: 'Bonus Card', baseRewardsRate: 1.0 });
    const baseCard  = makeCard({ id: 'base-card',  name: 'Base Card',  baseRewardsRate: 1.0 });
    const bonuses: Record<string, CardCategoryBonus[]> = {
      'bonus-card': [makeBonus({ accountId: 'bonus-card', category: 'dining', rewardsRate: 4.0 })],
      'base-card': [],
    };

    render(<SpendOptimizer cards={[baseCard, bonusCard]} bonusesByCard={bonuses} />);
    fireEvent.click(screen.getByRole('button', { name: /dining/i }));

    const items = screen.getAllByText(/Card/);
    // Bonus Card should appear before Base Card in the list
    const bonusIdx = items.findIndex(el => el.textContent?.includes('Bonus Card'));
    const baseIdx  = items.findIndex(el => el.textContent?.includes('Base Card'));
    expect(bonusIdx).toBeLessThan(baseIdx);
  });

  it('does not crash when a card has baseRewardsRate=null', () => {
    const cardWithNullRate = makeCard({ id: 'null-rate', name: 'Null Rate Card', baseRewardsRate: undefined });
    render(<SpendOptimizer cards={[cardWithNullRate]} bonusesByCard={{}} />);
    fireEvent.click(screen.getByRole('button', { name: /groceries/i }));
    // Should not throw — card should be listed with fallback rate
    expect(screen.queryByText(/Something went wrong/i)).not.toBeInTheDocument();
  });

  it('shows no ranking when cards array is empty', () => {
    render(<SpendOptimizer cards={[]} bonusesByCard={{}} />);
    fireEvent.click(screen.getByRole('button', { name: /dining/i }));
    // No card items should be rendered in the ranking list
    expect(screen.queryByText(/1\./)).not.toBeInTheDocument();
    // But no crash either
    expect(screen.queryByText(/Something went wrong/i)).not.toBeInTheDocument();
  });

  it('deselects category when clicking the same button again', () => {
    render(<SpendOptimizer cards={[makeCard()]} bonusesByCard={{}} />);
    fireEvent.click(screen.getByRole('button', { name: /dining/i }));
    fireEvent.click(screen.getByRole('button', { name: /dining/i }));
    // Hint text should reappear after deselect
    expect(screen.getByText(/select a category/i)).toBeInTheDocument();
  });
});
