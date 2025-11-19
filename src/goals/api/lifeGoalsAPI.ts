/**
 * Life Goals API
 * CRUD operations for life goals, dreams, milestones, and check-ins
 */

import { supabase } from '../../lib/supabase';
import type {
  LifeGoal,
  LifeGoalWithMilestones,
  LifeGoalMilestone,
  LifeGoalCheckin,
  LifeDream,
  CreateLifeGoalInput,
  UpdateLifeGoalInput,
  CreateMilestoneInput,
  CreateCheckinInput,
  CreateLifeDreamInput,
  UpdateLifeDreamInput,
  LifeGoalStreakEntry,
} from '../types/lifeGoals';

/**
 * Get all life goals for current user
 */
export async function getUserLifeGoals(): Promise<LifeGoal[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('life_goals')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (data || []).map(mapDbToLifeGoal);
}

/**
 * Get life goal by ID with milestones
 */
export async function getLifeGoalById(goalId: string): Promise<LifeGoalWithMilestones | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data: goalData, error: goalError } = await supabase
    .from('life_goals')
    .select('*')
    .eq('id', goalId)
    .eq('user_id', user.id)
    .single();

  if (goalError) throw goalError;
  if (!goalData) return null;

  const { data: milestonesData, error: milestonesError } = await supabase
    .from('life_goal_milestones')
    .select('*')
    .eq('goal_id', goalId)
    .order('order_index', { ascending: true });

  if (milestonesError) throw milestonesError;

  return {
    ...mapDbToLifeGoal(goalData),
    milestones: (milestonesData || []).map(mapDbToMilestone),
  };
}

/**
 * Create a new life goal
 */
export async function createLifeGoal(input: CreateLifeGoalInput): Promise<LifeGoal> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('life_goals')
    .insert({
      user_id: user.id,
      title: input.title,
      description: input.description,
      category: input.category,
      priority: input.priority,
      target_value: input.targetValue,
      current_value: input.currentValue || 0,
      unit: input.unit,
      start_date: input.startDate,
      target_date: input.targetDate,
      difficulty: input.difficulty || 'medium',
      tags: input.tags || [],
      template_id: input.templateId,
      streak_enabled: input.streakEnabled || false,
      streak_frequency: input.streakFrequency || 'daily',
      streak_target: input.streakTarget,
    })
    .select()
    .single();

  if (error) throw error;
  return mapDbToLifeGoal(data);
}

/**
 * Update a life goal
 */
export async function updateLifeGoal(goalId: string, input: UpdateLifeGoalInput): Promise<LifeGoal> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const updateData: any = {};
  if (input.title !== undefined) updateData.title = input.title;
  if (input.description !== undefined) updateData.description = input.description;
  if (input.category !== undefined) updateData.category = input.category;
  if (input.priority !== undefined) updateData.priority = input.priority;
  if (input.status !== undefined) updateData.status = input.status;
  if (input.progress !== undefined) updateData.progress = input.progress;
  if (input.targetValue !== undefined) updateData.target_value = input.targetValue;
  if (input.currentValue !== undefined) updateData.current_value = input.currentValue;
  if (input.unit !== undefined) updateData.unit = input.unit;
  if (input.targetDate !== undefined) updateData.target_date = input.targetDate;
  if (input.completedDate !== undefined) updateData.completed_date = input.completedDate;
  if (input.tags !== undefined) updateData.tags = input.tags;
  if (input.notes !== undefined) updateData.notes = input.notes;

  const { data, error } = await supabase
    .from('life_goals')
    .update(updateData)
    .eq('id', goalId)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) throw error;
  return mapDbToLifeGoal(data);
}

/**
 * Delete a life goal
 */
export async function deleteLifeGoal(goalId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('life_goals')
    .delete()
    .eq('id', goalId)
    .eq('user_id', user.id);

  if (error) throw error;
}

/**
 * Add milestone to goal
 */
export async function addMilestone(input: CreateMilestoneInput): Promise<LifeGoalMilestone> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('life_goal_milestones')
    .insert({
      goal_id: input.goalId,
      title: input.title,
      description: input.description,
      order_index: input.orderIndex,
      target_date: input.targetDate,
    })
    .select()
    .single();

  if (error) throw error;
  return mapDbToMilestone(data);
}

/**
 * Update milestone
 */
export async function updateMilestone(
  milestoneId: string,
  updates: { isCompleted?: boolean; title?: string; description?: string; targetDate?: string }
): Promise<LifeGoalMilestone> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const updateData: any = {};
  if (updates.isCompleted !== undefined) {
    updateData.is_completed = updates.isCompleted;
    if (updates.isCompleted) {
      updateData.completed_date = new Date().toISOString();
    }
  }
  if (updates.title !== undefined) updateData.title = updates.title;
  if (updates.description !== undefined) updateData.description = updates.description;
  if (updates.targetDate !== undefined) updateData.target_date = updates.targetDate;

  const { data, error } = await supabase
    .from('life_goal_milestones')
    .update(updateData)
    .eq('id', milestoneId)
    .select()
    .single();

  if (error) throw error;
  return mapDbToMilestone(data);
}

/**
 * Delete milestone
 */
export async function deleteMilestone(milestoneId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('life_goal_milestones')
    .delete()
    .eq('id', milestoneId);

  if (error) throw error;
}

/**
 * Create check-in for goal
 */
export async function createCheckin(input: CreateCheckinInput): Promise<LifeGoalCheckin> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('life_goal_checkins')
    .insert({
      goal_id: input.goalId,
      progress_update: input.progressUpdate,
      notes: input.notes,
      mood: input.mood,
      blockers: input.blockers,
      wins: input.wins,
      next_actions: input.nextActions,
    })
    .select()
    .single();

  if (error) throw error;
  return mapDbToCheckin(data);
}

/**
 * Get check-ins for goal
 */
export async function getGoalCheckins(goalId: string): Promise<LifeGoalCheckin[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('life_goal_checkins')
    .select('*')
    .eq('goal_id', goalId)
    .order('check_in_date', { ascending: false });

  if (error) throw error;
  return (data || []).map(mapDbToCheckin);
}

/**
 * Record streak for goal
 */
export async function recordStreak(goalId: string, date: string, completed: boolean, notes?: string): Promise<LifeGoalStreakEntry> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('life_goal_streak_history')
    .upsert({
      goal_id: goalId,
      date,
      completed,
      notes,
    })
    .select()
    .single();

  if (error) throw error;
  return mapDbToStreakEntry(data);
}

/**
 * Get streak history for goal
 */
export async function getStreakHistory(goalId: string, limit: number = 30): Promise<LifeGoalStreakEntry[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('life_goal_streak_history')
    .select('*')
    .eq('goal_id', goalId)
    .order('date', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data || []).map(mapDbToStreakEntry);
}

/**
 * Get all life dreams for current user
 */
export async function getUserLifeDreams(): Promise<LifeDream[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('life_dreams')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []).map(mapDbToLifeDream);
}

/**
 * Create a new life dream
 */
export async function createLifeDream(input: CreateLifeDreamInput): Promise<LifeDream> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('life_dreams')
    .insert({
      user_id: user.id,
      title: input.title,
      description: input.description,
      category: input.category,
      priority: input.priority,
      estimated_cost: input.estimatedCost,
      estimated_timeframe: input.estimatedTimeframe,
      required_resources: input.requiredResources || [],
      inspiration_sources: input.inspirationSources || [],
      tags: input.tags || [],
      vision_board_images: input.visionBoardImages || [],
      vision_board_notes: input.visionBoardNotes,
    })
    .select()
    .single();

  if (error) throw error;
  return mapDbToLifeDream(data);
}

/**
 * Update a life dream
 */
export async function updateLifeDream(dreamId: string, input: UpdateLifeDreamInput): Promise<LifeDream> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const updateData: any = {};
  if (input.title !== undefined) updateData.title = input.title;
  if (input.description !== undefined) updateData.description = input.description;
  if (input.category !== undefined) updateData.category = input.category;
  if (input.priority !== undefined) updateData.priority = input.priority;
  if (input.status !== undefined) updateData.status = input.status;
  if (input.estimatedCost !== undefined) updateData.estimated_cost = input.estimatedCost;
  if (input.estimatedTimeframe !== undefined) updateData.estimated_timeframe = input.estimatedTimeframe;
  if (input.requiredResources !== undefined) updateData.required_resources = input.requiredResources;
  if (input.inspirationSources !== undefined) updateData.inspiration_sources = input.inspirationSources;
  if (input.achievedAt !== undefined) updateData.achieved_at = input.achievedAt;
  if (input.tags !== undefined) updateData.tags = input.tags;
  if (input.visionBoardImages !== undefined) updateData.vision_board_images = input.visionBoardImages;
  if (input.visionBoardNotes !== undefined) updateData.vision_board_notes = input.visionBoardNotes;
  if (input.notes !== undefined) updateData.notes = input.notes;

  const { data, error } = await supabase
    .from('life_dreams')
    .update(updateData)
    .eq('id', dreamId)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) throw error;
  return mapDbToLifeDream(data);
}

/**
 * Delete a life dream
 */
export async function deleteLifeDream(dreamId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('life_dreams')
    .delete()
    .eq('id', dreamId)
    .eq('user_id', user.id);

  if (error) throw error;
}

/**
 * Get all public goal templates
 */
export async function getGoalTemplates(): Promise<any[]> {
  const { data, error } = await supabase
    .from('life_goal_templates')
    .select('*')
    .eq('is_public', true)
    .order('usage_count', { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Create goal from template
 */
export async function createGoalFromTemplate(templateId: string, customTitle?: string): Promise<LifeGoalWithMilestones> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Get template
  const { data: template, error: templateError } = await supabase
    .from('life_goal_templates')
    .select('*')
    .eq('id', templateId)
    .single();

  if (templateError) throw templateError;
  if (!template) throw new Error('Template not found');

  // Create goal from template
  const { data: goalData, error: goalError } = await supabase
    .from('life_goals')
    .insert({
      user_id: user.id,
      title: customTitle || template.name,
      description: template.description,
      category: template.category,
      priority: 'medium',
      difficulty: template.difficulty,
      tags: template.suggested_tags || [],
      template_id: templateId,
      xp_reward: template.difficulty === 'extreme' ? 500 : template.difficulty === 'hard' ? 300 : template.difficulty === 'medium' ? 200 : 100,
      target_date: template.estimated_duration_days
        ? new Date(Date.now() + template.estimated_duration_days * 24 * 60 * 60 * 1000).toISOString()
        : undefined,
      start_date: new Date().toISOString(),
    })
    .select()
    .single();

  if (goalError) throw goalError;

  const goal = mapDbToLifeGoal(goalData);

  // Create milestones from template
  const defaultMilestones = template.default_milestones as any[];
  const milestones: LifeGoalMilestone[] = [];

  if (defaultMilestones && defaultMilestones.length > 0) {
    for (const milestone of defaultMilestones) {
      const { data: milestoneData, error: milestoneError } = await supabase
        .from('life_goal_milestones')
        .insert({
          goal_id: goal.id,
          title: milestone.title,
          description: milestone.description,
          order_index: milestone.orderIndex,
          target_date: milestone.estimatedDays
            ? new Date(Date.now() + milestone.estimatedDays * 24 * 60 * 60 * 1000).toISOString()
            : undefined,
        })
        .select()
        .single();

      if (milestoneError) throw milestoneError;
      milestones.push(mapDbToMilestone(milestoneData));
    }
  }

  // Increment template usage count
  await supabase
    .from('life_goal_templates')
    .update({ usage_count: template.usage_count + 1 })
    .eq('id', templateId);

  return { ...goal, milestones };
}

// Mapper functions
function mapDbToLifeGoal(data: any): LifeGoal {
  return {
    id: data.id,
    userId: data.user_id,
    title: data.title,
    description: data.description,
    category: data.category,
    priority: data.priority,
    status: data.status,
    progress: data.progress,
    targetValue: data.target_value,
    currentValue: data.current_value,
    unit: data.unit,
    startDate: data.start_date,
    targetDate: data.target_date,
    completedDate: data.completed_date,
    difficulty: data.difficulty,
    xpReward: data.xp_reward,
    streakDays: data.streak_days,
    longestStreak: data.longest_streak,
    currentStreak: data.current_streak,
    streakEnabled: data.streak_enabled,
    streakFrequency: data.streak_frequency,
    streakTarget: data.streak_target,
    lastStreakUpdate: data.last_streak_update,
    tags: data.tags || [],
    isPublic: data.is_public,
    templateId: data.template_id,
    notes: data.notes,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

function mapDbToMilestone(data: any): LifeGoalMilestone {
  return {
    id: data.id,
    goalId: data.goal_id,
    title: data.title,
    description: data.description,
    orderIndex: data.order_index,
    isCompleted: data.is_completed,
    completedDate: data.completed_date,
    targetDate: data.target_date,
    xpReward: data.xp_reward,
    createdAt: data.created_at,
  };
}

function mapDbToCheckin(data: any): LifeGoalCheckin {
  return {
    id: data.id,
    goalId: data.goal_id,
    checkInDate: data.check_in_date,
    progressUpdate: data.progress_update,
    notes: data.notes,
    mood: data.mood,
    blockers: data.blockers,
    wins: data.wins,
    nextActions: data.next_actions,
    createdAt: data.created_at,
  };
}

function mapDbToStreakEntry(data: any): LifeGoalStreakEntry {
  return {
    id: data.id,
    goalId: data.goal_id,
    date: data.date,
    completed: data.completed,
    notes: data.notes,
    createdAt: data.created_at,
  };
}

function mapDbToLifeDream(data: any): LifeDream {
  return {
    id: data.id,
    userId: data.user_id,
    title: data.title,
    description: data.description,
    category: data.category,
    priority: data.priority,
    status: data.status,
    estimatedCost: data.estimated_cost,
    estimatedTimeframe: data.estimated_timeframe,
    requiredResources: data.required_resources || [],
    inspirationSources: data.inspiration_sources || [],
    achievedAt: data.achieved_at,
    tags: data.tags || [],
    isPublic: data.is_public,
    visionBoardImages: data.vision_board_images || [],
    visionBoardNotes: data.vision_board_notes,
    notes: data.notes,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}
