/**
 * Unit tests for ownerFilter.ts
 *
 * Tests the merged-mode owner filtering utilities used across all Finance pages.
 * A bug here would show wrong items to users in merged mode.
 */

import { describe, it, expect } from 'vitest';
import { filterByOwner, getOwnerCounts } from '../utils/ownerFilter';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const MY_ID      = 'user-me';
const PARTNER_ID = 'user-partner';

const myItem      = { userId: MY_ID,      name: 'My Account' };
const partnerItem = { userId: PARTNER_ID, name: 'Partner Account' };
const items = [myItem, partnerItem];

// ─── filterByOwner ────────────────────────────────────────────────────────────

describe('filterByOwner', () => {
  it('"all" returns all items unchanged', () => {
    expect(filterByOwner(items, 'all', MY_ID)).toHaveLength(2);
  });

  it('"mine" returns only items matching userId', () => {
    const result = filterByOwner(items, 'mine', MY_ID);
    expect(result).toHaveLength(1);
    expect(result[0].userId).toBe(MY_ID);
  });

  it('"partner" returns only items not matching userId', () => {
    const result = filterByOwner(items, 'partner', MY_ID);
    expect(result).toHaveLength(1);
    expect(result[0].userId).toBe(PARTNER_ID);
  });

  it('returns all items when currentUserId is undefined (no filter)', () => {
    expect(filterByOwner(items, 'mine', undefined)).toHaveLength(2);
    expect(filterByOwner(items, 'partner', undefined)).toHaveLength(2);
  });

  it('returns all items when currentUserId is undefined and filter is "all"', () => {
    expect(filterByOwner(items, 'all', undefined)).toHaveLength(2);
  });

  it('works with empty items array', () => {
    expect(filterByOwner([], 'mine', MY_ID)).toHaveLength(0);
    expect(filterByOwner([], 'all', MY_ID)).toHaveLength(0);
  });

  it('"mine" returns all if every item belongs to current user', () => {
    const myItems = [
      { userId: MY_ID, name: 'A' },
      { userId: MY_ID, name: 'B' },
    ];
    expect(filterByOwner(myItems, 'mine', MY_ID)).toHaveLength(2);
  });

  it('"partner" returns empty if all items belong to current user', () => {
    const myItems = [{ userId: MY_ID, name: 'A' }];
    expect(filterByOwner(myItems, 'partner', MY_ID)).toHaveLength(0);
  });
});

// ─── getOwnerCounts ───────────────────────────────────────────────────────────

describe('getOwnerCounts', () => {
  it('returns correct mine/partner/all counts', () => {
    const counts = getOwnerCounts(items, MY_ID);
    expect(counts).toEqual({ mine: 1, partner: 1, all: 2 });
  });

  it('returns mine=0, partner=0, all=length when userId is undefined', () => {
    const counts = getOwnerCounts(items, undefined);
    expect(counts).toEqual({ mine: 0, partner: 0, all: items.length });
  });

  it('handles empty array', () => {
    const counts = getOwnerCounts([], MY_ID);
    expect(counts).toEqual({ mine: 0, partner: 0, all: 0 });
  });

  it('handles array where all items belong to current user', () => {
    const myItems = [
      { userId: MY_ID, name: 'A' },
      { userId: MY_ID, name: 'B' },
    ];
    const counts = getOwnerCounts(myItems, MY_ID);
    expect(counts).toEqual({ mine: 2, partner: 0, all: 2 });
  });

  it('handles array where all items belong to partner', () => {
    const partnerItems = [
      { userId: PARTNER_ID, name: 'A' },
      { userId: PARTNER_ID, name: 'B' },
    ];
    const counts = getOwnerCounts(partnerItems, MY_ID);
    expect(counts).toEqual({ mine: 0, partner: 2, all: 2 });
  });
});
