/**
 * Zod validation schemas for Tasks
 * Runtime type safety for task management data
 */

import { z } from 'zod';

// =====================================================
// TASK SCHEMAS
// =====================================================

export const TaskStatusSchema = z.enum(['todo', 'done', 'waiting', 'scheduled', 'in_progress']);

export const TaskPrioritySchema = z.enum(['low', 'medium', 'high', 'urgent', 'important']);

export const TaskCategorySchema = z.enum(['work', 'personal', 'learning', 'creative', 'health', 'other']);

export const SidebarSectionSchema = z.enum(['todo', 'in_progress', 'backlog', 'scheduled']);

export const RecurrencePatternSchema = z.enum(['daily', 'weekly', 'monthly', 'yearly', 'custom']);

export const FollowUpTaskSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  daysAfterCompletion: z.number().int().min(0).optional(),
  priority: TaskPrioritySchema.optional(),
  category: TaskCategorySchema.optional(),
});

export const FollowUpTaskArraySchema = z.array(FollowUpTaskSchema);

export const LocationCoordinatesSchema = z.object({
  lat: z.number(),
  lng: z.number(),
});

export const TaskDataSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  title: z.string().min(1),
  description: z.string().nullable().optional(),
  project_id: z.string().nullable().optional(),
  status: z.string(),
  priority: z.string(),
  estimated_time: z.number().nullable().optional(),
  actual_time: z.number().nullable().optional(),
  due_date: z.string().nullable().optional(),
  scheduled_start: z.string().nullable().optional(),
  scheduled_end: z.string().nullable().optional(),
  scheduled_time: z.string().nullable().optional(),
  tags: z.array(z.string()).nullable().optional(),
  category: z.string(),
  notes: z.string().nullable().optional(),
  starred: z.boolean().nullable().optional(),
  archived: z.boolean().nullable().optional(),
  deleted: z.boolean().nullable().optional(),
  parent_id: z.string().nullable().optional(),
  deleted_at: z.string().nullable().optional(),
  completed_at: z.string().nullable().optional(),
  created_at: z.string().nullable().optional(),
  updated_at: z.string().nullable().optional(),
  sidebar_section: z.string().nullable().optional(),
  depends_on: z.array(z.string()).nullable().optional(),
  follow_up_tasks: z.unknown().nullable().optional(), // Json type
  is_waiting_for: z.string().nullable().optional(),
  trigger_date: z.string().nullable().optional(),
  is_blocked: z.boolean().nullable().optional(),
  is_errand: z.boolean().nullable().optional(),
  reminder: z.string().nullable().optional(),
  attachments: z.array(z.string()).nullable().optional(),
  assigned_to: z.string().nullable().optional(),
  assigned_by: z.string().nullable().optional(),
  assigned_at: z.string().nullable().optional(),
  // Recurrence fields
  recurrence_pattern: z.string().nullable().optional(),
  recurrence_interval: z.number().nullable().optional(),
  recurrence_days: z.array(z.number()).nullable().optional(),
  recurrence_end_date: z.string().nullable().optional(),
  recurrence_count: z.number().nullable().optional(),
  parent_recurring_id: z.string().nullable().optional(),
  // Location fields
  location_name: z.string().nullable().optional(),
  location_address: z.string().nullable().optional(),
  location_coordinates: z.unknown().nullable().optional(), // Json type
  // Computed field - position for custom sorting
  position: z.number().nullable().optional(),
});

export const TaskDataArraySchema = z.array(TaskDataSchema);

// =====================================================
// PROJECT SCHEMAS
// =====================================================

export const ProjectStatusSchema = z.enum(['active', 'completed', 'on_hold', 'archived']);

export const ProjectDataSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  name: z.string().min(1),
  description: z.string().nullable().optional(),
  color: z.string(),
  status: z.string(),
  icon: z.string().nullable().optional(),
  created_at: z.string(),
  updated_at: z.string(),
  connection_id: z.string().nullable().optional(),
});

export const ProjectDataArraySchema = z.array(ProjectDataSchema);
