/**
 * Point/mile valuations in cents per point
 * Used to estimate dollar value of rewards balances and earn rates.
 * Based on widely-used industry estimates (TPG, NerdWallet).
 */

import type { Account, RewardsType } from '../types';

/** Returns estimated cents-per-point for a given rewards program. */
export function getPointValuation(account: Account): number {
  const name = (account.name || '').toLowerCase();

  // Cashback is always 1¢ per point
  if (account.rewardsType === 'cashback') return 1.0;

  // Match by program name keywords first
  if (name.includes('chase') || name.includes('sapphire') || name.includes('freedom')) return 2.0;
  if (name.includes('amex') || name.includes('american express') || name.includes('gold') || name.includes('platinum') || name.includes('green')) return 1.8;
  if (name.includes('bilt')) return 2.0;
  if (name.includes('capital one') || name.includes('venture')) return 1.7;
  if (name.includes('citi') || name.includes('thankyou') || name.includes('strata')) return 1.6;
  if (name.includes('wells fargo') || name.includes('autograph')) return 1.5;
  if (name.includes('bank of america') || name.includes('boa')) return 1.0;
  if (name.includes('discover')) return 1.0;
  if (name.includes('us bank') || name.includes('altitude')) return 1.5;

  // Fall back to rewards type
  if (account.rewardsType === 'miles') return 1.5;
  if (account.rewardsType === 'points') return 1.5;

  return 1.0;
}

/**
 * Compute estimated dollar value of a card's rewards balance.
 * Returns total cents (divide by 100 for dollars).
 */
export function estimateRewardsValue(account: Account): number {
  const balance = account.rewardsBalance ?? 0;
  return balance * getPointValuation(account);
}

/**
 * Compute earn rate for a category in ¢ per dollar spent.
 * rate: multiplier (e.g., 4 for 4x)
 */
export function earnRateDisplay(rate: number, account: Account): string {
  const centsPerDollar = rate * getPointValuation(account);
  return `${centsPerDollar.toFixed(1)}¢/$`;
}

/** Human-readable program name for a card */
export function getProgramName(account: Account): string {
  const name = (account.name || '').toLowerCase();

  if (name.includes('chase') || name.includes('sapphire') || name.includes('freedom')) return 'Chase UR';
  if (name.includes('amex') || name.includes('american express') || name.includes('gold') || name.includes('platinum')) return 'Amex MR';
  if (name.includes('bilt')) return 'Bilt Points';
  if (name.includes('capital one') || name.includes('venture')) return 'C1 Miles';
  if (name.includes('citi') || name.includes('strata')) return 'Citi TYP';
  if (name.includes('discover')) return 'Cashback';

  const rewardsTypeLabel: Record<RewardsType, string> = {
    cashback: 'Cashback',
    miles: 'Miles',
    points: 'Points',
  };
  return account.rewardsType ? rewardsTypeLabel[account.rewardsType] : 'Rewards';
}
