/**
 * Shared Data Integration Tests
 * Validates shared dashboard data aggregation
 */

import { describe, test, expect, beforeEach, vi } from 'vitest';
import { supabase } from '../../lib/supabase';
import { fetchSharedDashboardData } from '../../shared/services/SharedDataProvider';

vi.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(),
    },
    from: vi.fn(),
  },
}));

describe('Shared Data Integration', () => {
  const mockUser = {
    id: 'user-1',
    email: 'owner@example.com',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (supabase.auth.getUser as any).mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });
  });

  test('fetchSharedDashboardData aggregates shared module items from permissions', async () => {
    const connections = [
      {
        id: 'conn-1',
        requester_id: mockUser.id,
        receiver_id: 'user-2',
        requester_user: null,
        receiver_user: {
          id: 'user-2',
          email: 'friend@example.com',
          full_name: 'Friend User',
          avatar_url: null,
        },
      },
    ];

    const permissions = [
      {
        connection_id: 'conn-1',
        module: 'todos',
        permission_level: 'view',
        user_id: 'user-2',
        settings: { includeIds: ['task-1'] },
      },
      {
        connection_id: 'conn-1',
        module: 'meals',
        permission_level: 'view',
        user_id: 'user-2',
      },
      {
        connection_id: 'conn-1',
        module: 'goals',
        permission_level: 'view',
        user_id: mockUser.id,
      },
    ];

    const tableData: Record<string, unknown[]> = {
      profile_connections: connections,
      module_permissions: permissions,
      tasks: [
        { id: 'task-1', title: 'Shared task' },
        { id: 'task-2', title: 'Hidden task' },
      ],
      meal_plans: [{ id: 'meal-1', name: 'Shared meal' }],
      goals: [{ id: 'goal-1', title: 'Owner goal' }],
    };

    const createQuery = (table: string) => {
      const query = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        neq: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        then: (resolve: (value: { data: unknown[]; error: null }) => void) =>
          resolve({ data: tableData[table] ?? [], error: null }),
      };
      return query;
    };

    (supabase.from as any).mockImplementation((table: string) => createQuery(table));

    const result = await fetchSharedDashboardData();

    expect(result.todos?.[0]?.title).toBe('Shared task');
    expect(result.todos?.find((item) => item.title === 'Hidden task')).toBeUndefined();
    expect(result.todos?.[0]?.sharedBy.name).toBe('Friend User');
    expect(result.meals?.[0]?.name).toBe('Shared meal');
    expect(result.meals?.[0]?.sharedBy.name).toBe('Friend User');
    expect(result.goals).toBeUndefined();
  });
});
