/* eslint-disable max-lines */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { supabase } from '../../../lib/supabase';
import {
  getUserLifeGoals,
  getLifeGoalById,
  createLifeGoal,
  updateLifeGoal,
  deleteLifeGoal,
  addMilestone,
  updateMilestone,
  deleteMilestone,
  createCheckin,
  getGoalCheckins,
  recordStreak,
  getStreakHistory,
  getUserLifeDreams,
  createLifeDream,
  updateLifeDream,
  deleteLifeDream,
  getGoalTemplates,
  createGoalFromTemplate,
} from '../lifeGoalsAPI';

// Mock Supabase
vi.mock('../../../lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(),
    },
    from: vi.fn(),
  },
}));

// Type definition for mocked methods
type MockFn = ReturnType<typeof vi.fn>;
type MockQuery = {
  select: MockFn;
  eq: MockFn;
  order: MockFn;
  insert: MockFn;
  update: MockFn;
  single: MockFn;
  limit: MockFn;
  delete: MockFn;
};

describe('lifeGoalsAPI', () => {
  const mockUser = { id: 'test-user-life-goals-123' };

  const mockLifeGoal = {
    id: 'goal-1',
    user_id: 'test-user-life-goals-123',
    title: 'Run a Marathon',
    description: 'Complete a full 42km marathon',
    category: 'fitness',
    priority: 'high',
    status: 'in-progress',
    progress: 35,
    target_value: 42,
    current_value: 15,
    unit: 'km',
    start_date: '2025-11-01',
    target_date: '2026-06-01',
    completed_date: null,
    difficulty: 'hard',
    xp_reward: 300,
    streak_days: 45,
    longest_streak: 45,
    current_streak: 10,
    streak_enabled: true,
    streak_frequency: 'daily',
    streak_target: 100,
    last_streak_update: '2025-11-18',
    tags: ['fitness', 'endurance'],
    is_public: false,
    template_id: null,
    notes: 'Training 5 days a week',
    created_at: '2025-11-01T08:00:00Z',
    updated_at: '2025-11-19T09:00:00Z',
  };

  const mockMilestone = {
    id: 'milestone-1',
    goal_id: 'goal-1',
    title: 'Run 5km non-stop',
    description: 'First milestone',
    order_index: 1,
    is_completed: true,
    completed_date: '2025-11-15',
    target_date: '2025-11-30',
    xp_reward: 50,
    created_at: '2025-11-01T08:00:00Z',
  };

  const mockCheckin = {
    id: 'checkin-1',
    goal_id: 'goal-1',
    check_in_date: '2025-11-19T10:00:00Z',
    progress_update: 40,
    notes: 'Feeling strong today',
    mood: 'great',
    blockers: null,
    wins: 'Ran 10km without stopping',
    next_actions: 'Increase distance by 2km',
    created_at: '2025-11-19T10:00:00Z',
  };

  const mockStreakEntry = {
    id: 'streak-1',
    goal_id: 'goal-1',
    date: '2025-11-19',
    completed: true,
    notes: 'Morning run completed',
    created_at: '2025-11-19T07:00:00Z',
  };

  const mockLifeDream = {
    id: 'dream-1',
    user_id: 'test-user-life-goals-123',
    title: 'Travel to Japan',
    description: 'Experience cherry blossom season in Kyoto',
    category: 'travel',
    priority: 'within-5-years',
    status: 'planning',
    estimated_cost: 5000,
    estimated_timeframe: '2-3 weeks',
    required_resources: ['passport', 'savings', 'language basics'],
    inspiration_sources: ['travel blog', 'instagram'],
    achieved_at: null,
    tags: ['travel', 'asia'],
    is_public: false,
    vision_board_images: ['image1.jpg', 'image2.jpg'],
    vision_board_notes: 'Spring 2027',
    notes: 'Save $500 per month',
    created_at: '2025-10-15T10:00:00Z',
    updated_at: '2025-11-19T11:00:00Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (supabase.auth.getUser as MockFn).mockResolvedValue({
      data: { user: mockUser },
    });
  });

  describe('Life Goals', () => {
    describe('getUserLifeGoals', () => {
      it('should fetch all life goals for authenticated user', async () => {
        const mockQuery: MockQuery = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockResolvedValue({
            data: [mockLifeGoal],
            error: null,
          }),
          // Add dummy implementations for other methods to satisfy type
          insert: vi.fn(),
          update: vi.fn(),
          single: vi.fn(),
          limit: vi.fn(),
          delete: vi.fn(),
        };

        (supabase.from as MockFn).mockReturnValue(mockQuery);

        const result = await getUserLifeGoals();

        // eslint-disable-next-line @typescript-eslint/unbound-method
        expect(supabase.from).toHaveBeenCalledWith('life_goals');
        expect(mockQuery.select).toHaveBeenCalledWith('*');
        expect(mockQuery.eq).toHaveBeenCalledWith('user_id', mockUser.id);
        expect(mockQuery.order).toHaveBeenCalledWith('created_at', { ascending: false });
        expect(result).toHaveLength(1);
        expect(result[0].id).toBe('goal-1');
        expect(result[0].title).toBe('Run a Marathon');
        expect(result[0].userId).toBe(mockUser.id);
      });

      it('should throw error when not authenticated', async () => {
        (supabase.auth.getUser as MockFn).mockResolvedValue({
          data: { user: null },
        });

        await expect(getUserLifeGoals()).rejects.toThrow('Not authenticated');
      });

      it('should handle empty results', async () => {
        const mockQuery: MockQuery = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
          // Add dummy implementations for other methods to satisfy type
          insert: vi.fn(),
          update: vi.fn(),
          single: vi.fn(),
          limit: vi.fn(),
          delete: vi.fn(),
        };

        (supabase.from as MockFn).mockReturnValue(mockQuery);

        const result = await getUserLifeGoals();
        expect(result).toEqual([]);
      });
    });

    describe('getLifeGoalById', () => {
      it('should fetch life goal with milestones', async () => {
        const mockGoalQuery = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: mockLifeGoal,
            error: null,
          }),
        };

        const mockMilestonesQuery = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockResolvedValue({
            data: [mockMilestone],
            error: null,
          }),
        };

        (supabase.from as any)
          .mockReturnValueOnce(mockGoalQuery)
          .mockReturnValueOnce(mockMilestonesQuery);

        const result = await getLifeGoalById('goal-1');

        // eslint-disable-next-line @typescript-eslint/unbound-method
        expect(supabase.from).toHaveBeenCalledWith('life_goals');
        // eslint-disable-next-line @typescript-eslint/unbound-method
        expect(supabase.from).toHaveBeenCalledWith('life_goal_milestones');
        expect(result).not.toBeNull();
        expect(result?.id).toBe('goal-1');
        expect(result?.milestones).toHaveLength(1);
        expect(result?.milestones[0].title).toBe('Run 5km non-stop');
      });

      it('should return null when goal not found', async () => {
        const mockQuery = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: null,
            error: null,
          }),
        };

        (supabase.from as any).mockReturnValue(mockQuery);

        const result = await getLifeGoalById('nonexistent');
        expect(result).toBeNull();
      });
    });

    describe('createLifeGoal', () => {
      it('should create a new life goal with all fields', async () => {
        const mockQuery = {
          insert: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: mockLifeGoal,
            error: null,
          }),
        };

        (supabase.from as any).mockReturnValue(mockQuery);

        const result = await createLifeGoal({
          title: 'Run a Marathon',
          description: 'Complete a full 42km marathon',
          category: 'fitness',
          priority: 'high',
          targetValue: 42,
          currentValue: 0,
          unit: 'km',
          startDate: '2025-11-01',
          targetDate: '2026-06-01',
          difficulty: 'hard',
          tags: ['fitness', 'endurance'],
          streakEnabled: true,
          streakFrequency: 'daily',
          streakTarget: 100,
        });

        expect(mockQuery.insert).toHaveBeenCalledWith(
          expect.objectContaining({
            user_id: mockUser.id,
            title: 'Run a Marathon',
            description: 'Complete a full 42km marathon',
            category: 'fitness',
            priority: 'high',
            target_value: 42,
            current_value: 0,
            unit: 'km',
            start_date: '2025-11-01',
            target_date: '2026-06-01',
            difficulty: 'hard',
            tags: ['fitness', 'endurance'],
            streak_enabled: true,
            streak_frequency: 'daily',
            streak_target: 100,
          })
        );
        expect(result.title).toBe('Run a Marathon');
      });

      it('should create goal with default values for optional fields', async () => {
        const mockQuery = {
          insert: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: { ...mockLifeGoal, difficulty: 'medium', current_value: 0 },
            error: null,
          }),
        };

        (supabase.from as any).mockReturnValue(mockQuery);

        await createLifeGoal({
          title: 'Simple Goal',
          category: 'personal',
          priority: 'medium',
        });

        const insertCall = mockQuery.insert.mock.calls[0][0];
        expect(insertCall.current_value).toBe(0);
        expect(insertCall.difficulty).toBe('medium');
        expect(insertCall.tags).toEqual([]);
        expect(insertCall.streak_enabled).toBe(false);
        expect(insertCall.streak_frequency).toBe('daily');
      });
    });

    describe('updateLifeGoal', () => {
      it('should update life goal fields', async () => {
        const mockQuery = {
          update: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: { ...mockLifeGoal, progress: 50, status: 'in-progress' },
            error: null,
          }),
        };

        (supabase.from as any).mockReturnValue(mockQuery);

        const result = await updateLifeGoal('goal-1', {
          progress: 50,
          status: 'in-progress',
          currentValue: 20,
        });

        expect(mockQuery.update).toHaveBeenCalledWith({
          progress: 50,
          status: 'in-progress',
          current_value: 20,
        });
        expect(mockQuery.eq).toHaveBeenCalledWith('id', 'goal-1');
        expect(mockQuery.eq).toHaveBeenCalledWith('user_id', mockUser.id);
        expect(result.progress).toBe(50);
      });

      it('should only update provided fields', async () => {
        const mockQuery = {
          update: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: mockLifeGoal,
            error: null,
          }),
        };

        (supabase.from as any).mockReturnValue(mockQuery);

        await updateLifeGoal('goal-1', { title: 'Updated Title' });

        const updateCall = mockQuery.update.mock.calls[0][0];
        expect(updateCall).toEqual({ title: 'Updated Title' });
        expect(updateCall).not.toHaveProperty('description');
      });
    });

    describe('deleteLifeGoal', () => {
      it('should delete a life goal', async () => {
        const mockDelete = vi.fn().mockReturnThis();
        const mockEq1 = vi.fn().mockReturnThis();
        const mockEq2 = vi.fn().mockResolvedValue({ error: null });

        const mockQuery = { delete: mockDelete };
        mockDelete.mockReturnValue({ eq: mockEq1 });
        mockEq1.mockReturnValue({ eq: mockEq2 });

        (supabase.from as any).mockReturnValue(mockQuery);

        await deleteLifeGoal('goal-1');

        expect(mockDelete).toHaveBeenCalled();
        expect(mockEq1).toHaveBeenCalledWith('id', 'goal-1');
        expect(mockEq2).toHaveBeenCalledWith('user_id', mockUser.id);
      });
    });
  });

  describe('Milestones', () => {
    describe('addMilestone', () => {
      it('should create a new milestone', async () => {
        const mockQuery = {
          insert: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: mockMilestone,
            error: null,
          }),
        };

        (supabase.from as any).mockReturnValue(mockQuery);

        const result = await addMilestone({
          goalId: 'goal-1',
          title: 'Run 5km non-stop',
          description: 'First milestone',
          orderIndex: 1,
          targetDate: '2025-11-30',
        });

        // eslint-disable-next-line @typescript-eslint/unbound-method
        expect(supabase.from).toHaveBeenCalledWith('life_goal_milestones');
        expect(mockQuery.insert).toHaveBeenCalledWith({
          goal_id: 'goal-1',
          title: 'Run 5km non-stop',
          description: 'First milestone',
          order_index: 1,
          target_date: '2025-11-30',
        });
        expect(result.title).toBe('Run 5km non-stop');
      });
    });

    describe('updateMilestone', () => {
      it('should update milestone and set completed date', async () => {
        const mockQuery = {
          update: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: { ...mockMilestone, is_completed: true },
            error: null,
          }),
        };

        (supabase.from as any).mockReturnValue(mockQuery);

        const result = await updateMilestone('milestone-1', {
          isCompleted: true,
        });

        const updateCall = mockQuery.update.mock.calls[0][0];
        expect(updateCall.is_completed).toBe(true);
        expect(updateCall.completed_date).toBeDefined();
        expect(result.isCompleted).toBe(true);
      });

      it('should update milestone fields without completion', async () => {
        const mockQuery = {
          update: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: mockMilestone,
            error: null,
          }),
        };

        (supabase.from as any).mockReturnValue(mockQuery);

        await updateMilestone('milestone-1', {
          title: 'Updated Title',
          description: 'Updated Description',
        });

        const updateCall = mockQuery.update.mock.calls[0][0];
        expect(updateCall).toEqual({
          title: 'Updated Title',
          description: 'Updated Description',
        });
        expect(updateCall).not.toHaveProperty('is_completed');
      });
    });

    describe('deleteMilestone', () => {
      it('should delete a milestone', async () => {
        const mockDelete = vi.fn().mockReturnThis();
        const mockEq = vi.fn().mockResolvedValue({ error: null });

        const mockQuery = { delete: mockDelete };
        mockDelete.mockReturnValue({ eq: mockEq });

        (supabase.from as any).mockReturnValue(mockQuery);

        await deleteMilestone('milestone-1');

        // eslint-disable-next-line @typescript-eslint/unbound-method
        expect(supabase.from).toHaveBeenCalledWith('life_goal_milestones');
        expect(mockDelete).toHaveBeenCalled();
        expect(mockEq).toHaveBeenCalledWith('id', 'milestone-1');
      });
    });
  });

  describe('Check-ins', () => {
    describe('createCheckin', () => {
      it('should create a new check-in', async () => {
        const mockQuery = {
          insert: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: mockCheckin,
            error: null,
          }),
        };

        (supabase.from as any).mockReturnValue(mockQuery);

        const result = await createCheckin({
          goalId: 'goal-1',
          progressUpdate: 40,
          notes: 'Feeling strong today',
          mood: 'great',
          wins: 'Ran 10km without stopping',
          nextActions: 'Increase distance by 2km',
        });

        // eslint-disable-next-line @typescript-eslint/unbound-method
        expect(supabase.from).toHaveBeenCalledWith('life_goal_checkins');
        expect(mockQuery.insert).toHaveBeenCalledWith({
          goal_id: 'goal-1',
          progress_update: 40,
          notes: 'Feeling strong today',
          mood: 'great',
          blockers: undefined,
          wins: 'Ran 10km without stopping',
          next_actions: 'Increase distance by 2km',
        });
        expect(result.mood).toBe('great');
      });
    });

    describe('getGoalCheckins', () => {
      it('should fetch all check-ins for a goal', async () => {
        const mockQuery = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockResolvedValue({
            data: [mockCheckin],
            error: null,
          }),
        };

        (supabase.from as any).mockReturnValue(mockQuery);

        const result = await getGoalCheckins('goal-1');

        // eslint-disable-next-line @typescript-eslint/unbound-method
        expect(supabase.from).toHaveBeenCalledWith('life_goal_checkins');
        expect(mockQuery.eq).toHaveBeenCalledWith('goal_id', 'goal-1');
        expect(mockQuery.order).toHaveBeenCalledWith('check_in_date', { ascending: false });
        expect(result).toHaveLength(1);
        expect(result[0].goalId).toBe('goal-1');
      });
    });
  });

  describe('Streak Tracking', () => {
    describe('recordStreak', () => {
      it('should record a streak entry', async () => {
        const mockQuery = {
          upsert: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: mockStreakEntry,
            error: null,
          }),
        };

        (supabase.from as any).mockReturnValue(mockQuery);

        const result = await recordStreak('goal-1', '2025-11-19', true, 'Morning run completed');

        // eslint-disable-next-line @typescript-eslint/unbound-method
        expect(supabase.from).toHaveBeenCalledWith('life_goal_streak_history');
        expect(mockQuery.upsert).toHaveBeenCalledWith({
          goal_id: 'goal-1',
          date: '2025-11-19',
          completed: true,
          notes: 'Morning run completed',
        });
        expect(result.completed).toBe(true);
      });
    });

    describe('getStreakHistory', () => {
      const MAX_DEFAULT_LIMIT = 30;

      it('should fetch streak history with default limit', async () => {
        const mockQuery = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue({
            data: [mockStreakEntry],
            error: null,
          }),
        };

        (supabase.from as any).mockReturnValue(mockQuery);

        const result = await getStreakHistory('goal-1');

        // eslint-disable-next-line @typescript-eslint/unbound-method
        expect(supabase.from).toHaveBeenCalledWith('life_goal_streak_history');
        expect(mockQuery.eq).toHaveBeenCalledWith('goal_id', 'goal-1');
        expect(mockQuery.order).toHaveBeenCalledWith('date', { ascending: false });
        expect(mockQuery.limit).toHaveBeenCalledWith(MAX_DEFAULT_LIMIT);
        expect(result).toHaveLength(1);
      });

      it('should fetch streak history with custom limit', async () => {
        const customLimit = 50;
        const mockQuery = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        };

        (supabase.from as any).mockReturnValue(mockQuery);

        await getStreakHistory('goal-1', customLimit);

        expect(mockQuery.limit).toHaveBeenCalledWith(customLimit);
      });
    });
  });

  describe('Life Dreams', () => {
    describe('getUserLifeDreams', () => {
      it('should fetch all life dreams for authenticated user', async () => {
        const mockQuery = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockResolvedValue({
            data: [mockLifeDream],
            error: null,
          }),
        };

        (supabase.from as any).mockReturnValue(mockQuery);

        const result = await getUserLifeDreams();

        // eslint-disable-next-line @typescript-eslint/unbound-method
        expect(supabase.from).toHaveBeenCalledWith('life_dreams');
        expect(mockQuery.eq).toHaveBeenCalledWith('user_id', mockUser.id);
        expect(mockQuery.order).toHaveBeenCalledWith('created_at', { ascending: false });
        expect(result).toHaveLength(1);
        expect(result[0].title).toBe('Travel to Japan');
      });
    });

    describe('createLifeDream', () => {
      it('should create a new life dream with all fields', async () => {
        const mockQuery = {
          insert: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: mockLifeDream,
            error: null,
          }),
        };

        (supabase.from as any).mockReturnValue(mockQuery);

        const result = await createLifeDream({
          title: 'Travel to Japan',
          description: 'Experience cherry blossom season in Kyoto',
          category: 'travel',
          priority: 'within-5-years',
          estimatedCost: 5000,
          estimatedTimeframe: '2-3 weeks',
          requiredResources: ['passport', 'savings', 'language basics'],
          inspirationSources: ['travel blog', 'instagram'],
          tags: ['travel', 'asia'],
          visionBoardImages: ['image1.jpg', 'image2.jpg'],
          visionBoardNotes: 'Spring 2027',
        });

        expect(mockQuery.insert).toHaveBeenCalledWith(
          expect.objectContaining({
            user_id: mockUser.id,
            title: 'Travel to Japan',
            description: 'Experience cherry blossom season in Kyoto',
            category: 'travel',
            priority: 'within-5-years',
            estimated_cost: 5000,
            estimated_timeframe: '2-3 weeks',
            required_resources: ['passport', 'savings', 'language basics'],
            inspiration_sources: ['travel blog', 'instagram'],
            tags: ['travel', 'asia'],
            vision_board_images: ['image1.jpg', 'image2.jpg'],
            vision_board_notes: 'Spring 2027',
          })
        );
        expect(result.title).toBe('Travel to Japan');
      });

      it('should create dream with default values for optional fields', async () => {
        const mockQuery = {
          insert: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: { ...mockLifeDream, required_resources: [], tags: [] },
            error: null,
          }),
        };

        (supabase.from as any).mockReturnValue(mockQuery);

        await createLifeDream({
          title: 'Simple Dream',
          category: 'experiences',
          priority: 'someday',
        });

        const insertCall = mockQuery.insert.mock.calls[0][0];
        expect(insertCall.required_resources).toEqual([]);
        expect(insertCall.inspiration_sources).toEqual([]);
        expect(insertCall.tags).toEqual([]);
        expect(insertCall.vision_board_images).toEqual([]);
      });
    });

    describe('updateLifeDream', () => {
      it('should update life dream fields', async () => {
        const mockQuery = {
          update: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: { ...mockLifeDream, status: 'in-progress' },
            error: null,
          }),
        };

        (supabase.from as any).mockReturnValue(mockQuery);

        const result = await updateLifeDream('dream-1', {
          status: 'in-progress',
          estimatedCost: 6000,
        });

        expect(mockQuery.update).toHaveBeenCalledWith({
          status: 'in-progress',
          estimated_cost: 6000,
        });
        expect(mockQuery.eq).toHaveBeenCalledWith('id', 'dream-1');
        expect(mockQuery.eq).toHaveBeenCalledWith('user_id', mockUser.id);
        expect(result.status).toBe('in-progress');
      });
    });

    describe('deleteLifeDream', () => {
      it('should delete a life dream', async () => {
        const mockDelete = vi.fn().mockReturnThis();
        const mockEq1 = vi.fn().mockReturnThis();
        const mockEq2 = vi.fn().mockResolvedValue({ error: null });

        const mockQuery = { delete: mockDelete };
        mockDelete.mockReturnValue({ eq: mockEq1 });
        mockEq1.mockReturnValue({ eq: mockEq2 });

        (supabase.from as any).mockReturnValue(mockQuery);

        await deleteLifeDream('dream-1');

        expect(mockDelete).toHaveBeenCalled();
        expect(mockEq1).toHaveBeenCalledWith('id', 'dream-1');
        expect(mockEq2).toHaveBeenCalledWith('user_id', mockUser.id);
      });
    });
  });

  describe('Goal Templates', () => {
    describe('getGoalTemplates', () => {
      it('should fetch all public goal templates', async () => {
        const mockTemplates = [
          {
            id: 'template-1',
            name: 'Run a 5K',
            description: 'Complete your first 5K race',
            category: 'fitness',
            difficulty: 'medium',
            estimated_duration_days: 60,
            is_public: true,
            usage_count: 150,
          },
        ];

        const mockQuery = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockResolvedValue({
            data: mockTemplates,
            error: null,
          }),
        };

        (supabase.from as any).mockReturnValue(mockQuery);

        const result = await getGoalTemplates();

        // eslint-disable-next-line @typescript-eslint/unbound-method
        expect(supabase.from).toHaveBeenCalledWith('life_goal_templates');
        expect(mockQuery.eq).toHaveBeenCalledWith('is_public', true);
        expect(mockQuery.order).toHaveBeenCalledWith('usage_count', { ascending: false });
        expect(result).toHaveLength(1);
        expect(result[0].name).toBe('Run a 5K');
      });
    });

    describe('createGoalFromTemplate', () => {
      it('should create goal from template with milestones', async () => {
        const mockTemplate = {
          id: 'template-1',
          name: 'Run a 5K',
          description: 'Complete your first 5K race',
          category: 'fitness',
          difficulty: 'medium',
          estimated_duration_days: 60,
          default_milestones: [
            {
              title: 'Run 1km without stopping',
              description: 'First milestone',
              orderIndex: 1,
              estimatedDays: 14,
            },
          ],
          suggested_tags: ['fitness', 'running'],
          usage_count: 150,
        };

        const mockTemplateQuery = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: mockTemplate,
            error: null,
          }),
        };

        const mockGoalQuery = {
          insert: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: mockLifeGoal,
            error: null,
          }),
        };

        const mockMilestoneQuery = {
          insert: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: mockMilestone,
            error: null,
          }),
        };

        const mockUpdateQuery = {
          update: vi.fn().mockReturnThis(),
          eq: vi.fn().mockResolvedValue({ error: null }),
        };

        (supabase.from as any)
          .mockReturnValueOnce(mockTemplateQuery) // Template fetch
          .mockReturnValueOnce(mockGoalQuery) // Goal creation
          .mockReturnValueOnce(mockMilestoneQuery) // Milestone creation
          .mockReturnValueOnce(mockUpdateQuery); // Template usage count update

        const result = await createGoalFromTemplate('template-1', 'My Custom 5K Goal');

        // eslint-disable-next-line @typescript-eslint/unbound-method
        expect(supabase.from).toHaveBeenCalledWith('life_goal_templates');
        // eslint-disable-next-line @typescript-eslint/unbound-method
        expect(supabase.from).toHaveBeenCalledWith('life_goals');
        // eslint-disable-next-line @typescript-eslint/unbound-method
        expect(supabase.from).toHaveBeenCalledWith('life_goal_milestones');

        expect(mockGoalQuery.insert).toHaveBeenCalledWith(
          expect.objectContaining({
            user_id: mockUser.id,
            title: 'My Custom 5K Goal',
            description: 'Complete your first 5K race',
            category: 'fitness',
            difficulty: 'medium',
            tags: ['fitness', 'running'],
            template_id: 'template-1',
            xp_reward: 200, // medium difficulty
          })
        );

        expect(mockUpdateQuery.update).toHaveBeenCalledWith({ usage_count: 151 });
        expect(result.title).toBe('Run a Marathon');
        expect(result.milestones).toHaveLength(1);
      });

      it('should use template name when custom title not provided', async () => {
        const mockTemplate = {
          id: 'template-1',
          name: 'Run a 5K',
          description: 'Complete your first 5K race',
          category: 'fitness',
          difficulty: 'medium',
          default_milestones: [],
          usage_count: 150,
        };

        const mockTemplateQuery = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: mockTemplate,
            error: null,
          }),
        };

        const mockGoalQuery = {
          insert: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: mockLifeGoal,
            error: null,
          }),
        };

        const mockUpdateQuery = {
          update: vi.fn().mockReturnThis(),
          eq: vi.fn().mockResolvedValue({ error: null }),
        };

        (supabase.from as any)
          .mockReturnValueOnce(mockTemplateQuery)
          .mockReturnValueOnce(mockGoalQuery)
          .mockReturnValueOnce(mockUpdateQuery);

        await createGoalFromTemplate('template-1');

        const insertCall = mockGoalQuery.insert.mock.calls[0][0];
        expect(insertCall.title).toBe('Run a 5K');
      });

      it('should throw error when template not found', async () => {
        const mockQuery = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: null,
            error: null,
          }),
        };

        (supabase.from as any).mockReturnValue(mockQuery);

        await expect(
          createGoalFromTemplate('nonexistent')
        ).rejects.toThrow('Template not found');
      });
    });
  });
});
