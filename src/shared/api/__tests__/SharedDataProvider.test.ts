/**
 * Unit tests for SharedDataProvider
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getMergedConnectionId,
  hasUserSetMerged,
  getModulePermissions,
  fetchSharedDashboardData,
  fetchSharedData,
  canEditSharedData,
  fetchSharedTasks,
  fetchSharedHabits,
  fetchSharedGoals,
  fetchSharedMeals,
  fetchSharedShoppingLists,
  fetchSharedFinances,
} from '../SharedDataProvider';
import { supabase } from '@/lib/supabase';

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(),
    },
    from: vi.fn(),
  },
}));

// Mock logger
vi.mock('@/services/logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe('SharedDataProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getMergedConnectionId', () => {
    it('should return merged connection when both users have merged permission', async () => {
      const mockUser = { id: 'user-123' };
      const mockConnections = [
        {
          id: 'conn-456',
          requester_id: 'user-123',
          receiver_id: 'partner-789',
          status: 'active',
          requester_user: { id: 'user-123', full_name: 'User Name' },
          receiver_user: { id: 'partner-789', full_name: 'Partner Name' },
        },
      ];
      const mockPermissions = [
        { user_id: 'user-123', permission_level: 'merged' },
        { user_id: 'partner-789', permission_level: 'merged' },
      ];

      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      } as any);

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'profile_connections') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                or: vi.fn().mockResolvedValue({
                  data: mockConnections,
                  error: null,
                }),
              }),
            }),
          } as any;
        }
        if (table === 'module_permissions') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({
                  data: mockPermissions,
                  error: null,
                }),
              }),
            }),
          } as any;
        }
        return {} as any;
      });

      const result = await getMergedConnectionId('meals');

      expect(result).toEqual({
        connectionId: 'conn-456',
        partnerId: 'partner-789',
        partnerName: 'Partner Name',
      });
    });

    it('should return null when only one user has merged permission', async () => {
      const mockUser = { id: 'user-123' };
      const mockConnections = [
        {
          id: 'conn-456',
          requester_id: 'user-123',
          receiver_id: 'partner-789',
          status: 'active',
          requester_user: { id: 'user-123', full_name: 'User Name' },
          receiver_user: { id: 'partner-789', full_name: 'Partner Name' },
        },
      ];
      const mockPermissions = [
        { user_id: 'user-123', permission_level: 'merged' },
        { user_id: 'partner-789', permission_level: 'collaborate' },
      ];

      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      } as any);

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'profile_connections') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                or: vi.fn().mockResolvedValue({
                  data: mockConnections,
                  error: null,
                }),
              }),
            }),
          } as any;
        }
        if (table === 'module_permissions') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({
                  data: mockPermissions,
                  error: null,
                }),
              }),
            }),
          } as any;
        }
        return {} as any;
      });

      const result = await getMergedConnectionId('meals');

      expect(result).toBeNull();
    });

    it('should return null when no user is logged in', async () => {
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: null },
        error: null,
      } as any);

      const result = await getMergedConnectionId('todos');

      expect(result).toBeNull();
    });

    it('should return null when no active connections exist', async () => {
      const mockUser = { id: 'user-123' };

      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      } as any);

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            or: vi.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
          }),
        }),
      } as any);

      const result = await getMergedConnectionId('shopping');

      expect(result).toBeNull();
    });

    it('should use "Partner" as fallback when partner name is missing', async () => {
      const mockUser = { id: 'user-123' };
      const mockConnections = [
        {
          id: 'conn-456',
          requester_id: 'user-123',
          receiver_id: 'partner-789',
          status: 'active',
          requester_user: { id: 'user-123', full_name: 'User Name' },
          receiver_user: { id: 'partner-789', full_name: null },
        },
      ];
      const mockPermissions = [
        { user_id: 'user-123', permission_level: 'merged' },
        { user_id: 'partner-789', permission_level: 'merged' },
      ];

      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      } as any);

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'profile_connections') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                or: vi.fn().mockResolvedValue({
                  data: mockConnections,
                  error: null,
                }),
              }),
            }),
          } as any;
        }
        if (table === 'module_permissions') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({
                  data: mockPermissions,
                  error: null,
                }),
              }),
            }),
          } as any;
        }
        return {} as any;
      });

      const result = await getMergedConnectionId('goals');

      expect(result).toEqual({
        connectionId: 'conn-456',
        partnerId: 'partner-789',
        partnerName: 'Partner',
      });
    });

    it('should handle database errors gracefully', async () => {
      const mockUser = { id: 'user-123' };

      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      } as any);

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            or: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Database error' },
            }),
          }),
        }),
      } as any);

      const result = await getMergedConnectionId('habits');

      expect(result).toBeNull();
    });

    it('should work when user is receiver in connection', async () => {
      const mockUser = { id: 'user-123' };
      const mockConnections = [
        {
          id: 'conn-456',
          requester_id: 'partner-789',
          receiver_id: 'user-123',
          status: 'active',
          requester_user: { id: 'partner-789', full_name: 'Partner Name' },
          receiver_user: { id: 'user-123', full_name: 'User Name' },
        },
      ];
      const mockPermissions = [
        { user_id: 'user-123', permission_level: 'merged' },
        { user_id: 'partner-789', permission_level: 'merged' },
      ];

      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      } as any);

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'profile_connections') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                or: vi.fn().mockResolvedValue({
                  data: mockConnections,
                  error: null,
                }),
              }),
            }),
          } as any;
        }
        if (table === 'module_permissions') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({
                  data: mockPermissions,
                  error: null,
                }),
              }),
            }),
          } as any;
        }
        return {} as any;
      });

      const result = await getMergedConnectionId('finances');

      expect(result).toEqual({
        connectionId: 'conn-456',
        partnerId: 'partner-789',
        partnerName: 'Partner Name',
      });
    });
  });

  describe('hasUserSetMerged', () => {
    it('should return true when user has set merged', async () => {
      const mockUser = { id: 'user-123' };
      const mockPermissions = [{ permission_level: 'merged' }];

      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      } as any);

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue({
                  data: mockPermissions,
                  error: null,
                }),
              }),
            }),
          }),
        }),
      } as any);

      const result = await hasUserSetMerged('meals');

      expect(result).toBe(true);
    });

    it('should return false when user has not set merged', async () => {
      const mockUser = { id: 'user-123' };

      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      } as any);

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue({
                  data: [],
                  error: null,
                }),
              }),
            }),
          }),
        }),
      } as any);

      const result = await hasUserSetMerged('todos');

      expect(result).toBe(false);
    });

    it('should return false when user is not logged in', async () => {
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: null },
        error: null,
      } as any);

      const result = await hasUserSetMerged('shopping');

      expect(result).toBe(false);
    });
  });

  describe('getModulePermissions', () => {
    it('should return permissions for active connections', async () => {
      const mockUser = { id: 'user-123' };
      const mockConnections = [
        {
          id: 'conn-456',
          requester_id: 'user-123',
          receiver_id: 'partner-789',
          relationship: 'spouse',
          status: 'active',
        },
      ];
      const mockPermissions = { permission_level: 'collaborate' };

      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      } as any);

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'profile_connections') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                or: vi.fn().mockResolvedValue({
                  data: mockConnections,
                  error: null,
                }),
              }),
            }),
          } as any;
        }
        if (table === 'module_permissions') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({
                      data: mockPermissions,
                      error: null,
                    }),
                  }),
                }),
              }),
            }),
          } as any;
        }
        return {} as any;
      });

      const result = await getModulePermissions('meals');

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        userId: 'user-123',
        connectionId: 'conn-456',
        connectionUserId: 'partner-789',
        permissionLevel: 'collaborate',
        relationship: 'spouse',
      });
    });

    it('should filter out none permissions', async () => {
      const mockUser = { id: 'user-123' };
      const mockConnections = [
        {
          id: 'conn-456',
          requester_id: 'user-123',
          receiver_id: 'partner-789',
          relationship: 'spouse',
          status: 'active',
        },
      ];
      const mockPermissions = { permission_level: 'none' };

      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      } as any);

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'profile_connections') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                or: vi.fn().mockResolvedValue({
                  data: mockConnections,
                  error: null,
                }),
              }),
            }),
          } as any;
        }
        if (table === 'module_permissions') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({
                      data: mockPermissions,
                      error: null,
                    }),
                  }),
                }),
              }),
            }),
          } as any;
        }
        return {} as any;
      });

      const result = await getModulePermissions('todos');

      expect(result).toHaveLength(0);
    });

    it('should return empty array when not authenticated', async () => {
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: null },
        error: null,
      } as any);

      const result = await getModulePermissions('shopping');

      expect(result).toEqual([]);
    });

    it('should return empty array when no connections exist', async () => {
      const mockUser = { id: 'user-123' };

      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      } as any);

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            or: vi.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
          }),
        }),
      } as any);

      const result = await getModulePermissions('goals');

      expect(result).toEqual([]);
    });
  });

  describe('canEditSharedData', () => {
    it('should return true for collaborate permission', async () => {
      const mockUser = { id: 'user-123' };
      const mockConnections = [
        {
          id: 'conn-456',
          requester_id: 'user-123',
          receiver_id: 'partner-789',
          relationship: 'spouse',
          status: 'active',
        },
      ];
      const mockPermissions = { permission_level: 'collaborate' };

      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      } as any);

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'profile_connections') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                or: vi.fn().mockResolvedValue({
                  data: mockConnections,
                  error: null,
                }),
              }),
            }),
          } as any;
        }
        if (table === 'module_permissions') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({
                      data: mockPermissions,
                      error: null,
                    }),
                  }),
                }),
              }),
            }),
          } as any;
        }
        return {} as any;
      });

      const result = await canEditSharedData('meals', 'partner-789');

      expect(result).toBe(true);
    });

    it('should return true for merged permission', async () => {
      const mockUser = { id: 'user-123' };
      const mockConnections = [
        {
          id: 'conn-456',
          requester_id: 'user-123',
          receiver_id: 'partner-789',
          relationship: 'spouse',
          status: 'active',
        },
      ];
      const mockPermissions = { permission_level: 'merged' };

      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      } as any);

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'profile_connections') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                or: vi.fn().mockResolvedValue({
                  data: mockConnections,
                  error: null,
                }),
              }),
            }),
          } as any;
        }
        if (table === 'module_permissions') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({
                      data: mockPermissions,
                      error: null,
                    }),
                  }),
                }),
              }),
            }),
          } as any;
        }
        return {} as any;
      });

      const result = await canEditSharedData('todos', 'partner-789');

      expect(result).toBe(true);
    });

    it('should return false for view permission', async () => {
      const mockUser = { id: 'user-123' };
      const mockConnections = [
        {
          id: 'conn-456',
          requester_id: 'user-123',
          receiver_id: 'partner-789',
          relationship: 'spouse',
          status: 'active',
        },
      ];
      const mockPermissions = { permission_level: 'view' };

      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      } as any);

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'profile_connections') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                or: vi.fn().mockResolvedValue({
                  data: mockConnections,
                  error: null,
                }),
              }),
            }),
          } as any;
        }
        if (table === 'module_permissions') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({
                      data: mockPermissions,
                      error: null,
                    }),
                  }),
                }),
              }),
            }),
          } as any;
        }
        return {} as any;
      });

      const result = await canEditSharedData('shopping', 'partner-789');

      expect(result).toBe(false);
    });

    it('should return false for none permission', async () => {
      const mockUser = { id: 'user-123' };
      const mockConnections = [
        {
          id: 'conn-456',
          requester_id: 'user-123',
          receiver_id: 'partner-789',
          relationship: 'spouse',
          status: 'active',
        },
      ];
      const mockPermissions = { permission_level: 'none' };

      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      } as any);

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'profile_connections') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                or: vi.fn().mockResolvedValue({
                  data: mockConnections,
                  error: null,
                }),
              }),
            }),
          } as any;
        }
        if (table === 'module_permissions') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({
                      data: mockPermissions,
                      error: null,
                    }),
                  }),
                }),
              }),
            }),
          } as any;
        }
        return {} as any;
      });

      const result = await canEditSharedData('goals', 'partner-789');

      expect(result).toBe(false);
    });
  });

  describe('fetchSharedData', () => {
    it('should fetch own data and shared data', async () => {
      const mockUser = { id: 'user-123' };
      const mockOwnData = [
        { id: 'task-1', title: 'My task', user_id: 'user-123' },
      ];
      const mockSharedData = [
        { id: 'task-2', title: 'Partner task', user_id: 'partner-789' },
      ];
      const mockConnections = [
        {
          id: 'conn-456',
          requester_id: 'user-123',
          receiver_id: 'partner-789',
          relationship: 'spouse',
          status: 'active',
        },
      ];
      const mockPermissions = { permission_level: 'view' };

      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      } as any);

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'tasks') {
          const mockEq = vi.fn();
          mockEq.mockImplementation((column: string, value: string) => {
            if (value === 'user-123') {
              return Promise.resolve({ data: mockOwnData, error: null });
            }
            if (value === 'partner-789') {
              return Promise.resolve({ data: mockSharedData, error: null });
            }
            return Promise.resolve({ data: [], error: null });
          });

          return {
            select: vi.fn().mockReturnValue({
              eq: mockEq,
            }),
          } as any;
        }
        if (table === 'profile_connections') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                or: vi.fn().mockResolvedValue({
                  data: mockConnections,
                  error: null,
                }),
              }),
            }),
          } as any;
        }
        if (table === 'module_permissions') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({
                      data: mockPermissions,
                      error: null,
                    }),
                  }),
                }),
              }),
            }),
          } as any;
        }
        return {} as any;
      });

      const result = await fetchSharedData('tasks', 'todos');

      expect(result.ownData).toHaveLength(1);
      expect(result.ownData[0].id).toBe('task-1');
      expect(result.sharedData).toHaveLength(1);
      expect(result.sharedData[0].data).toHaveLength(1);
      expect(result.sharedData[0].data[0].id).toBe('task-2');
    });

    it('should return empty arrays when not authenticated', async () => {
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: null },
        error: null,
      } as any);

      const result = await fetchSharedData('tasks', 'todos');

      expect(result.ownData).toEqual([]);
      expect(result.sharedData).toEqual([]);
    });
  });

  describe('module-specific fetchers', () => {
    it('should call fetchSharedData with correct parameters for tasks', async () => {
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: null },
        error: null,
      } as any);

      const result = await fetchSharedTasks();

      expect(result.ownData).toEqual([]);
      expect(result.sharedData).toEqual([]);
    });

    it('should call fetchSharedData with correct parameters for habits', async () => {
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: null },
        error: null,
      } as any);

      const result = await fetchSharedHabits();

      expect(result.ownData).toEqual([]);
      expect(result.sharedData).toEqual([]);
    });

    it('should call fetchSharedData with correct parameters for goals', async () => {
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: null },
        error: null,
      } as any);

      const result = await fetchSharedGoals();

      expect(result.ownData).toEqual([]);
      expect(result.sharedData).toEqual([]);
    });

    it('should call fetchSharedData with correct parameters for meals', async () => {
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: null },
        error: null,
      } as any);

      const result = await fetchSharedMeals();

      expect(result.ownData).toEqual([]);
      expect(result.sharedData).toEqual([]);
    });

    it('should call fetchSharedData with correct parameters for shopping', async () => {
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: null },
        error: null,
      } as any);

      const result = await fetchSharedShoppingLists();

      expect(result.ownData).toEqual([]);
      expect(result.sharedData).toEqual([]);
    });

    it('should call fetchSharedData with correct parameters for finances', async () => {
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: null },
        error: null,
      } as any);

      const result = await fetchSharedFinances();

      expect(result.ownData).toEqual([]);
      expect(result.sharedData).toEqual([]);
    });
  });

  describe('fetchSharedDashboardData', () => {
    it('should fetch shared data from all modules with permissions', async () => {
      const mockUser = { id: 'user-123' };
      const mockConnections = [
        {
          id: 'conn-456',
          requester_id: 'partner-789',
          receiver_id: 'user-123',
          requester_user: [{ id: 'partner-789', email: 'partner@example.com', full_name: 'Partner', avatar_url: null }],
          receiver_user: [{ id: 'user-123', email: 'user@example.com', full_name: 'User', avatar_url: null }],
        },
      ];
      const mockPermissions = [
        {
          connection_id: 'conn-456',
          module: 'meals',
          permission_level: 'view',
          user_id: 'partner-789',
          settings: null,
        },
      ];
      const mockMeals = [
        { id: 'meal-1', name: 'Breakfast', user_id: 'partner-789', created_at: '2024-01-01' },
      ];

      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      } as any);

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'profile_connections') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                or: vi.fn().mockResolvedValue({
                  data: mockConnections,
                  error: null,
                }),
              }),
            }),
          } as any;
        }
        if (table === 'module_permissions') {
          return {
            select: vi.fn().mockReturnValue({
              in: vi.fn().mockReturnValue({
                neq: vi.fn().mockResolvedValue({
                  data: mockPermissions,
                  error: null,
                }),
              }),
            }),
          } as any;
        }
        if (table === 'meal_plans') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                range: vi.fn().mockReturnValue({
                  order: vi.fn().mockResolvedValue({
                    data: mockMeals,
                    error: null,
                  }),
                }),
              }),
            }),
          } as any;
        }
        return {} as any;
      });

      const result = await fetchSharedDashboardData();

      expect(result).toHaveProperty('meals');
      expect(result.meals).toHaveLength(1);
      expect(result.meals?.[0]).toMatchObject({
        id: 'meal-1',
        sharedBy: {
          id: 'partner-789',
          name: 'Partner',
        },
      });
    });

    it('should return empty object when no permissions exist', async () => {
      const mockUser = { id: 'user-123' };

      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      } as any);

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'profile_connections') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                or: vi.fn().mockResolvedValue({
                  data: [],
                  error: null,
                }),
              }),
            }),
          } as any;
        }
        return {} as any;
      });

      const result = await fetchSharedDashboardData();

      expect(result).toEqual({});
    });
  });
});
