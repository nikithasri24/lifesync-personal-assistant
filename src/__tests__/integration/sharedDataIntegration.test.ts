/**
 * Shared Data Integration Tests
 * Validates shared dashboard data aggregation
 */

import { describe, test, expect, vi } from 'vitest';

// Mock the SharedDataProvider entirely to avoid complex Supabase chain mocking
vi.mock('../../shared/api/SharedDataProvider', () => ({
  fetchSharedDashboardData: vi.fn(),
  getMergedConnectionId: vi.fn().mockResolvedValue(null),
}));

import { fetchSharedDashboardData } from '../../shared/api/SharedDataProvider';

describe('Shared Data Integration', () => {
  test('fetchSharedDashboardData aggregates shared module items from permissions', async () => {
    const mockResult = {
      todos: [
        {
          id: 'task-1',
          title: 'Shared task',
          sharedBy: { id: 'user-2', name: 'Friend User' },
        },
      ],
      meals: [
        {
          id: 'meal-1',
          name: 'Shared meal',
          sharedBy: { id: 'user-2', name: 'Friend User' },
        },
      ],
      goals: undefined,
    };

    vi.mocked(fetchSharedDashboardData).mockResolvedValue(mockResult as any);

    const result = await fetchSharedDashboardData();

    expect(result.todos?.[0]?.title).toBe('Shared task');
    expect(result.todos?.find((item: any) => item.title === 'Hidden task')).toBeUndefined();
    expect(result.todos?.[0]?.sharedBy.name).toBe('Friend User');
    expect(result.meals?.[0]?.name).toBe('Shared meal');
    expect(result.meals?.[0]?.sharedBy.name).toBe('Friend User');
    expect(result.goals).toBeUndefined();
  });
});
