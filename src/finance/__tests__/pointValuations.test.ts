/**
 * Unit tests for pointValuations.ts
 *
 * This file was added in commit 5cdf2be (Credit Cards rebuild) with zero test coverage.
 * The card name matching logic is fragile; these tests lock in the expected behavior
 * and will catch regressions if card names or valuations change.
 */

import { describe, it, expect } from 'vitest';
import {
  getPointValuation,
  estimateRewardsValue,
  earnRateDisplay,
  getProgramName,
} from '../utils/pointValuations';
import type { Account } from '../types';

function makeCard(overrides: Partial<Account>): Account {
  return {
    id: 'acc-1',
    userId: 'user-1',
    name: 'Test Card',
    type: 'credit',
    balance: 0,
    institutionId: null,
    creditLimit: 10000,
    apr: 20,
    promoAprEndDate: null,
    isArchived: false,
    notes: null,
    rewardsType: null,
    rewardsBalance: null,
    baseRewardsRate: null,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

// ─── getPointValuation ────────────────────────────────────────────────────────

describe('getPointValuation', () => {
  it('always returns 1.0 for cashback cards regardless of name', () => {
    const card = makeCard({ name: 'Chase Freedom Unlimited', rewardsType: 'cashback' });
    expect(getPointValuation(card)).toBe(1.0);
  });

  it('returns 2.0 for Chase cards (UR points)', () => {
    expect(getPointValuation(makeCard({ name: 'Chase Sapphire Preferred', rewardsType: 'points' }))).toBe(2.0);
    expect(getPointValuation(makeCard({ name: 'Chase Sapphire Reserve', rewardsType: 'points'  }))).toBe(2.0);
    expect(getPointValuation(makeCard({ name: 'Chase Freedom Flex',     rewardsType: 'cashback' }))).toBe(1.0); // cashback wins
  });

  it('returns 2.0 for Bilt card', () => {
    expect(getPointValuation(makeCard({ name: 'Bilt Mastercard', rewardsType: 'points' }))).toBe(2.0);
  });

  it('returns 1.8 for Amex cards (MR points)', () => {
    expect(getPointValuation(makeCard({ name: 'Amex Gold Card',    rewardsType: 'points' }))).toBe(1.8);
    expect(getPointValuation(makeCard({ name: 'Amex Platinum',     rewardsType: 'points' }))).toBe(1.8);
    expect(getPointValuation(makeCard({ name: 'American Express Green', rewardsType: 'points' }))).toBe(1.8);
  });

  it('returns 1.7 for Capital One cards', () => {
    expect(getPointValuation(makeCard({ name: 'Capital One Venture X', rewardsType: 'miles' }))).toBe(1.7);
    expect(getPointValuation(makeCard({ name: 'Venture Rewards Card',  rewardsType: 'miles' }))).toBe(1.7);
  });

  it('returns 1.6 for Citi cards', () => {
    expect(getPointValuation(makeCard({ name: 'Citi Strata Premier', rewardsType: 'points' }))).toBe(1.6);
  });

  it('falls back to rewardsType valuation for unknown card name', () => {
    const unknownMiles  = makeCard({ name: 'My Unknown Miles Card', rewardsType: 'miles'  });
    const unknownPoints = makeCard({ name: 'My Unknown Points Card', rewardsType: 'points' });
    expect(getPointValuation(unknownMiles)).toBe(1.5);
    expect(getPointValuation(unknownPoints)).toBe(1.5);
  });

  it('returns 1.0 for completely unknown card with no rewardsType', () => {
    const card = makeCard({ name: 'Random Bank Card', rewardsType: null });
    expect(getPointValuation(card)).toBe(1.0);
  });

  it('is case-insensitive for card name matching', () => {
    expect(getPointValuation(makeCard({ name: 'CHASE SAPPHIRE PREFERRED', rewardsType: 'points' }))).toBe(2.0);
    expect(getPointValuation(makeCard({ name: 'amex gold',                rewardsType: 'points' }))).toBe(1.8);
  });

  it('handles empty card name gracefully', () => {
    const card = makeCard({ name: '', rewardsType: 'miles' });
    expect(getPointValuation(card)).toBe(1.5); // falls back to rewardsType
  });
});

// ─── estimateRewardsValue ─────────────────────────────────────────────────────

describe('estimateRewardsValue', () => {
  it('multiplies rewards balance by point valuation', () => {
    // Chase UR: 2¢/pt; 50,000 pts → 100,000 cents = $1,000 in cents
    const card = makeCard({ name: 'Chase Sapphire Reserve', rewardsType: 'points', rewardsBalance: 50000 });
    expect(estimateRewardsValue(card)).toBe(100000);
  });

  it('returns 0 when rewardsBalance is null', () => {
    const card = makeCard({ name: 'Chase Sapphire Reserve', rewardsType: 'points', rewardsBalance: null });
    expect(estimateRewardsValue(card)).toBe(0);
  });

  it('returns 0 when rewardsBalance is 0', () => {
    const card = makeCard({ name: 'Chase Sapphire Reserve', rewardsType: 'points', rewardsBalance: 0 });
    expect(estimateRewardsValue(card)).toBe(0);
  });

  it('calculates cashback value correctly (1¢ per point)', () => {
    // Cashback card, $500.00 = 500 points → 500 cents = $5
    const card = makeCard({ name: 'Any Cashback Card', rewardsType: 'cashback', rewardsBalance: 500 });
    expect(estimateRewardsValue(card)).toBe(500); // 500 × 1.0¢ = 500¢
  });
});

// ─── earnRateDisplay ──────────────────────────────────────────────────────────

describe('earnRateDisplay', () => {
  it('shows correct earn rate for Chase card at 3x on dining', () => {
    const card = makeCard({ name: 'Chase Sapphire Preferred', rewardsType: 'points' });
    // 3x UR at 2¢ = 6¢/$
    expect(earnRateDisplay(3, card)).toBe('6.0¢/$');
  });

  it('shows correct earn rate for cashback at 2x', () => {
    const card = makeCard({ name: 'Any Cashback Card', rewardsType: 'cashback' });
    // 2x cashback at 1¢ = 2¢/$
    expect(earnRateDisplay(2, card)).toBe('2.0¢/$');
  });

  it('handles 0x earn rate without negative display', () => {
    const card = makeCard({ name: 'Any Card', rewardsType: 'points' });
    expect(earnRateDisplay(0, card)).toBe('0.0¢/$');
  });

  it('formats to one decimal place', () => {
    // Amex: 1.8¢/pt; 1x = 1.8¢/$
    const card = makeCard({ name: 'Amex Platinum', rewardsType: 'points' });
    expect(earnRateDisplay(1, card)).toBe('1.8¢/$');
  });
});

// ─── getProgramName ───────────────────────────────────────────────────────────

describe('getProgramName', () => {
  it('returns Chase UR for Chase cards', () => {
    expect(getProgramName(makeCard({ name: 'Chase Sapphire Preferred', rewardsType: 'points' }))).toBe('Chase UR');
  });

  it('returns Amex MR for Amex cards', () => {
    expect(getProgramName(makeCard({ name: 'Amex Gold Card', rewardsType: 'points' }))).toBe('Amex MR');
  });

  it('returns Bilt Points for Bilt card', () => {
    expect(getProgramName(makeCard({ name: 'Bilt Mastercard', rewardsType: 'points' }))).toBe('Bilt Points');
  });

  it('returns C1 Miles for Capital One cards', () => {
    expect(getProgramName(makeCard({ name: 'Capital One Venture X', rewardsType: 'miles' }))).toBe('C1 Miles');
  });

  it('falls back to rewardsType label for unknown card', () => {
    expect(getProgramName(makeCard({ name: 'Random Card', rewardsType: 'miles'    }))).toBe('Miles');
    expect(getProgramName(makeCard({ name: 'Random Card', rewardsType: 'points'   }))).toBe('Points');
    expect(getProgramName(makeCard({ name: 'Random Card', rewardsType: 'cashback' }))).toBe('Cashback');
  });

  it('returns Rewards when rewardsType is null and name is unknown', () => {
    expect(getProgramName(makeCard({ name: 'Unknown Bank Card', rewardsType: null }))).toBe('Rewards');
  });
});
