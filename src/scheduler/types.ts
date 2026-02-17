/**
 * Scheduler Types
 *
 * Type definitions for scheduling and task management.
 */

export interface ScheduledTask {
  id: string;
  title: string;
  description?: string;
  status: 'todo' | 'in-progress' | 'done' | 'scheduled' | 'blocked';
  priority: 'urgent' | 'high' | 'medium' | 'low';
  due_date?: string;
  estimated_time?: number;
  scheduled_start?: string;
  scheduled_end?: string;
  category?: 'work' | 'personal' | 'urgent' | 'learning' | 'health' | 'errands' | 'other';
  created_at: string;
  updated_at: string;
  project_id?: string;
  tags?: string[];
  depends_on?: string[];
}
