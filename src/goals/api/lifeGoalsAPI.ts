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
  GoalCategory,
  GoalPriority,
  GoalStatus,
  GoalDifficulty,
  StreakFrequency,
  DreamCategory,
  DreamPriority,
  DreamStatus,
  LifeGoalTemplate,
  MilestoneTemplate,
} from '../types/lifeGoals';

// Database row types
interface LifeGoalRow {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  category: GoalCategory;
  priority: GoalPriority;
  status: GoalStatus;
  progress: number;
  target_value: number | null;
  current_value: number | null;
  unit: string | null;
  start_date: string | null;
  target_date: string | null;
  completed_date: string | null;
  difficulty: GoalDifficulty;
  xp_reward: number;
  streak_days: number;
  longest_streak: number;
  current_streak: number;
  streak_enabled: boolean;
  streak_frequency: StreakFrequency;
  streak_target: number | null;
  last_streak_update: string | null;
  tags: string[];
  is_public: boolean;
  template_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface LifeGoalMilestoneRow {
  id: string;
  goal_id: string;
  title: string;
  description: string | null;
  order_index: number;
  is_completed: boolean;
  completed_date: string | null;
  target_date: string | null;
  xp_reward: number;
  created_at: string;
}

interface LifeGoalCheckinRow {
  id: string;
  goal_id: string;
  check_in_date: string;
  progress_update: number | null;
  notes: string | null;
  blockers: string | null;
  wins: string | null;
  next_actions: string | null;
  created_at: string;
}

interface LifeGoalStreakEntryRow {
  id: string;
  goal_id: string;
  date: string;
  completed: boolean;
  notes: string | null;
  created_at: string;
}

interface LifeDreamRow {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  category: DreamCategory;
  priority: DreamPriority;
  status: DreamStatus;
  estimated_cost: number | null;
  estimated_timeframe: string | null;
  required_resources: string[];
  inspiration_sources: string[];
  achieved_at: string | null;
  tags: string[];
  is_public: boolean;
  vision_board_images: string[];
  vision_board_notes: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface LifeGoalTemplateRow {
  id: string;
  name: string;
  description: string | null;
  category: GoalCategory;
  difficulty: GoalDifficulty;
  estimated_duration_days: number | null;
  default_milestones: unknown;
  suggested_tags: string[];
  tips: string | null;
  resources: string[];
  is_public: boolean;
  created_by: string | null;
  usage_count: number;
  created_at: string;
}

interface UpdateLifeGoalData {
  title?: string;
  description?: string;
  category?: GoalCategory;
  priority?: GoalPriority;
  status?: GoalStatus;
  progress?: number;
  target_value?: number;
  current_value?: number;
  unit?: string;
  target_date?: string;
  completed_date?: string;
  tags?: string[];
  notes?: string;
}

interface UpdateMilestoneData {
  is_completed?: boolean;
  completed_date?: string;
  title?: string;
  description?: string;
  target_date?: string;
}

interface UpdateLifeDreamData {
  title?: string;
  description?: string;
  category?: DreamCategory;
  priority?: DreamPriority;
  status?: DreamStatus;
  estimated_cost?: number;
  estimated_timeframe?: string;
  required_resources?: string[];
  inspiration_sources?: string[];
  achieved_at?: string;
  tags?: string[];
  vision_board_images?: string[];
  vision_board_notes?: string;
  notes?: string;
}

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

  return (data ?? []).map((row) => mapDbToLifeGoal(row as LifeGoalRow));
}

/**
 * Get life goal by ID with milestones
 */
export async function getLifeGoalById(goalId: string): Promise<LifeGoalWithMilestones | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const goalResult = await supabase
    .from('life_goals')
    .select('*')
    .eq('id', goalId)
    .eq('user_id', user.id)
    .single();

  if (goalResult.error) throw goalResult.error;
  if (!goalResult.data) return null;

  const milestonesResult = await supabase
    .from('life_goal_milestones')
    .select('*')
    .eq('goal_id', goalId)
    .order('order_index', { ascending: true });

  if (milestonesResult.error) throw milestonesResult.error;

  return {
    ...mapDbToLifeGoal(goalResult.data as LifeGoalRow),
    milestones: (milestonesResult.data ?? []).map((row) => mapDbToMilestone(row as LifeGoalMilestoneRow)),
  };
}

/**
 * Create a new life goal
 */
export async function createLifeGoal(input: CreateLifeGoalInput): Promise<LifeGoal> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const result = await supabase
    .from('life_goals')
    .insert({
      user_id: user.id,
      title: input.title,
      description: input.description,
      category: input.category,
      priority: input.priority,
      target_value: input.targetValue,
      current_value: input.currentValue ?? 0,
      unit: input.unit,
      start_date: input.startDate,
      target_date: input.targetDate,
      difficulty: input.difficulty ?? 'medium',
      tags: input.tags ?? [],
      template_id: input.templateId,
      streak_enabled: input.streakEnabled ?? false,
      streak_frequency: input.streakFrequency ?? 'daily',
      streak_target: input.streakTarget,
    })
    .select()
    .single();

  if (result.error) throw result.error;
  return mapDbToLifeGoal(result.data as LifeGoalRow);
}

/**
 * Update a life goal
 */
export async function updateLifeGoal(goalId: string, input: UpdateLifeGoalInput): Promise<LifeGoal> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const updateData: UpdateLifeGoalData = {};
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

  const result = await supabase
    .from('life_goals')
    .update(updateData)
    .eq('id', goalId)
    .eq('user_id', user.id)
    .select()
    .single();

  if (result.error) throw result.error;
  return mapDbToLifeGoal(result.data as LifeGoalRow);
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

  const result = await supabase
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

  if (result.error) throw result.error;
  return mapDbToMilestone(result.data as LifeGoalMilestoneRow);
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

  const updateData: UpdateMilestoneData = {};
  if (updates.isCompleted !== undefined) {
    updateData.is_completed = updates.isCompleted;
    if (updates.isCompleted) {
      updateData.completed_date = new Date().toISOString();
    }
  }
  if (updates.title !== undefined) updateData.title = updates.title;
  if (updates.description !== undefined) updateData.description = updates.description;
  if (updates.targetDate !== undefined) updateData.target_date = updates.targetDate;

  const result = await supabase
    .from('life_goal_milestones')
    .update(updateData)
    .eq('id', milestoneId)
    .select()
    .single();

  if (result.error) throw result.error;
  return mapDbToMilestone(result.data as LifeGoalMilestoneRow);
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

  const result = await supabase
    .from('life_goal_checkins')
    .insert({
      goal_id: input.goalId,
      progress_update: input.progressUpdate,
      notes: input.notes,
      blockers: input.blockers,
      wins: input.wins,
      next_actions: input.nextActions,
    })
    .select()
    .single();

  if (result.error) throw result.error;
  return mapDbToCheckin(result.data as LifeGoalCheckinRow);
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
  return (data ?? []).map((row) => mapDbToCheckin(row as LifeGoalCheckinRow));
}

/**
 * Record streak for goal
 */
export async function recordStreak(goalId: string, date: string, completed: boolean, notes?: string): Promise<LifeGoalStreakEntry> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const result = await supabase
    .from('life_goal_streak_history')
    .upsert({
      goal_id: goalId,
      date,
      completed,
      notes,
    })
    .select()
    .single();

  if (result.error) throw result.error;
  return mapDbToStreakEntry(result.data as LifeGoalStreakEntryRow);
}

/**
 * Get streak history for goal
 */
export async function getStreakHistory(goalId: string, limit = 30): Promise<LifeGoalStreakEntry[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('life_goal_streak_history')
    .select('*')
    .eq('goal_id', goalId)
    .order('date', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data ?? []).map((row) => mapDbToStreakEntry(row as LifeGoalStreakEntryRow));
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
  return (data ?? []).map((row) => mapDbToLifeDream(row as LifeDreamRow));
}

/**
 * Create a new life dream
 */
export async function createLifeDream(input: CreateLifeDreamInput): Promise<LifeDream> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const result = await supabase
    .from('life_dreams')
    .insert({
      user_id: user.id,
      title: input.title,
      description: input.description,
      category: input.category,
      priority: input.priority,
      status: 'dreaming',
      estimated_cost: input.estimatedCost,
      estimated_timeframe: input.estimatedTimeframe,
      required_resources: input.requiredResources ?? [],
      inspiration_sources: input.inspirationSources ?? [],
      tags: input.tags ?? [],
      vision_board_images: input.visionBoardImages ?? [],
      vision_board_notes: input.visionBoardNotes,
    })
    .select()
    .single();

  if (result.error) throw result.error;
  return mapDbToLifeDream(result.data as LifeDreamRow);
}

/**
 * Update a life dream
 */
export async function updateLifeDream(dreamId: string, input: UpdateLifeDreamInput): Promise<LifeDream> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const updateData: UpdateLifeDreamData = {};
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

  const result = await supabase
    .from('life_dreams')
    .update(updateData)
    .eq('id', dreamId)
    .eq('user_id', user.id)
    .select()
    .single();

  if (result.error) throw result.error;
  return mapDbToLifeDream(result.data as LifeDreamRow);
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
export async function getGoalTemplates(): Promise<LifeGoalTemplate[]> {
  const { data, error } = await supabase
    .from('life_goal_templates')
    .select('*')
    .eq('is_public', true)
    .order('usage_count', { ascending: false });

  if (error) throw error;
  return (data ?? []).map((row) => mapDbToTemplate(row as LifeGoalTemplateRow));
}

/**
 * Create goal from template
 */
export async function createGoalFromTemplate(templateId: string, customTitle?: string): Promise<LifeGoalWithMilestones> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Get template
  const templateResult = await supabase
    .from('life_goal_templates')
    .select('*')
    .eq('id', templateId)
    .single();

  if (templateResult.error) throw templateResult.error;
  if (!templateResult.data) throw new Error('Template not found');

  const template = templateResult.data as LifeGoalTemplateRow;

  // Helper function to check if value is a milestone template array
  function isMilestoneTemplateArray(value: unknown): value is MilestoneTemplate[] {
    return (
      Array.isArray(value) &&
      value.every(
        (item): item is MilestoneTemplate =>
          typeof item === 'object' &&
          item !== null &&
          'title' in item &&
          typeof (item as Record<string, unknown>).title === 'string' &&
          'orderIndex' in item &&
          typeof (item as Record<string, unknown>).orderIndex === 'number'
      )
    );
  }

  // Calculate XP reward based on difficulty
  const difficultyXpMap: Record<GoalDifficulty, number> = {
    extreme: 500,
    hard: 300,
    medium: 200,
    easy: 100,
  };
  const xpReward = difficultyXpMap[template.difficulty];

  // Create goal from template
  const goalResult = await supabase
    .from('life_goals')
    .insert({
      user_id: user.id,
      title: customTitle ?? template.name,
      description: template.description,
      category: template.category,
      priority: 'medium',
      difficulty: template.difficulty,
      tags: template.suggested_tags ?? [],
      template_id: templateId,
      xp_reward: xpReward,
      target_date: template.estimated_duration_days
        ? new Date(Date.now() + template.estimated_duration_days * 24 * 60 * 60 * 1000).toISOString()
        : undefined,
      start_date: new Date().toISOString(),
    })
    .select()
    .single();

  if (goalResult.error) throw goalResult.error;

  const goal = mapDbToLifeGoal(goalResult.data as LifeGoalRow);

  // Create milestones from template
  const milestones: LifeGoalMilestone[] = [];

  if (isMilestoneTemplateArray(template.default_milestones)) {
    for (const milestoneTemplate of template.default_milestones) {
      const milestoneResult = await supabase
        .from('life_goal_milestones')
        .insert({
          goal_id: goal.id,
          title: milestoneTemplate.title,
          description: milestoneTemplate.description,
          order_index: milestoneTemplate.orderIndex,
          target_date: milestoneTemplate.estimatedDays
            ? new Date(Date.now() + milestoneTemplate.estimatedDays * 24 * 60 * 60 * 1000).toISOString()
            : undefined,
        })
        .select()
        .single();

      if (milestoneResult.error) throw milestoneResult.error;
      milestones.push(mapDbToMilestone(milestoneResult.data as LifeGoalMilestoneRow));
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
function mapDbToLifeGoal(data: LifeGoalRow): LifeGoal {
  return {
    id: data.id,
    userId: data.user_id,
    title: data.title,
    description: data.description ?? undefined,
    category: data.category,
    priority: data.priority,
    status: data.status,
    progress: data.progress,
    targetValue: data.target_value ?? undefined,
    currentValue: data.current_value ?? undefined,
    unit: data.unit ?? undefined,
    startDate: data.start_date ?? undefined,
    targetDate: data.target_date ?? undefined,
    completedDate: data.completed_date ?? undefined,
    difficulty: data.difficulty,
    xpReward: data.xp_reward,
    streakDays: data.streak_days,
    longestStreak: data.longest_streak,
    currentStreak: data.current_streak,
    streakEnabled: data.streak_enabled,
    streakFrequency: data.streak_frequency,
    streakTarget: data.streak_target ?? undefined,
    lastStreakUpdate: data.last_streak_update ?? undefined,
    tags: data.tags,
    isPublic: data.is_public,
    templateId: data.template_id ?? undefined,
    notes: data.notes ?? undefined,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

function mapDbToMilestone(data: LifeGoalMilestoneRow): LifeGoalMilestone {
  return {
    id: data.id,
    goalId: data.goal_id,
    title: data.title,
    description: data.description ?? undefined,
    orderIndex: data.order_index,
    isCompleted: data.is_completed,
    completedDate: data.completed_date ?? undefined,
    targetDate: data.target_date ?? undefined,
    xpReward: data.xp_reward,
    createdAt: data.created_at,
  };
}

function mapDbToCheckin(data: LifeGoalCheckinRow): LifeGoalCheckin {
  return {
    id: data.id,
    goalId: data.goal_id,
    checkInDate: data.check_in_date,
    progressUpdate: data.progress_update ?? undefined,
    notes: data.notes ?? undefined,
    blockers: data.blockers ?? undefined,
    wins: data.wins ?? undefined,
    nextActions: data.next_actions ?? undefined,
    createdAt: data.created_at,
  };
}

function mapDbToStreakEntry(data: LifeGoalStreakEntryRow): LifeGoalStreakEntry {
  return {
    id: data.id,
    goalId: data.goal_id,
    date: data.date,
    completed: data.completed,
    notes: data.notes ?? undefined,
    createdAt: data.created_at,
  };
}

function mapDbToLifeDream(data: LifeDreamRow): LifeDream {
  return {
    id: data.id,
    userId: data.user_id,
    title: data.title,
    description: data.description ?? undefined,
    category: data.category,
    priority: data.priority,
    status: data.status,
    estimatedCost: data.estimated_cost ?? undefined,
    estimatedTimeframe: data.estimated_timeframe ?? undefined,
    requiredResources: data.required_resources,
    inspirationSources: data.inspiration_sources,
    achievedAt: data.achieved_at ?? undefined,
    tags: data.tags,
    isPublic: data.is_public,
    visionBoardImages: data.vision_board_images,
    visionBoardNotes: data.vision_board_notes ?? undefined,
    notes: data.notes ?? undefined,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

function mapDbToTemplate(data: LifeGoalTemplateRow): LifeGoalTemplate {
  // Helper function to check if value is a milestone template array
  function isMilestoneTemplateArray(value: unknown): value is MilestoneTemplate[] {
    return (
      Array.isArray(value) &&
      value.every(
        (item): item is MilestoneTemplate =>
          typeof item === 'object' &&
          item !== null &&
          'title' in item &&
          typeof (item as Record<string, unknown>).title === 'string' &&
          'orderIndex' in item &&
          typeof (item as Record<string, unknown>).orderIndex === 'number'
      )
    );
  }

  return {
    id: data.id,
    name: data.name,
    description: data.description ?? undefined,
    category: data.category,
    difficulty: data.difficulty,
    estimatedDurationDays: data.estimated_duration_days ?? undefined,
    defaultMilestones: isMilestoneTemplateArray(data.default_milestones) ? data.default_milestones : [],
    suggestedTags: data.suggested_tags,
    tips: data.tips ?? undefined,
    resources: data.resources,
    isPublic: data.is_public,
    createdBy: data.created_by ?? undefined,
    usageCount: data.usage_count,
    createdAt: data.created_at,
  };
}
