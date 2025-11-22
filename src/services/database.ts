import { ensureSupabase, isSupabaseConfigured } from '../lib/supabase'
import type { Task, Project } from '../lib/supabase'
import { type RealtimeChannel, type SupabaseClient } from '@supabase/supabase-js'
import { logger } from './logger'

export class DatabaseService {
  private taskSubscription: RealtimeChannel | null = null
  private projectSubscription: RealtimeChannel | null = null

  private get client(): SupabaseClient {
    return ensureSupabase()
  }

  // Tasks CRUD Operations
  async getTasks(userId: string): Promise<Task[]> {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase is not configured. Tasks cannot be loaded.')
    }

    const { data, error } = await this.client
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      logger.error('DatabaseService', error, { operation: 'getTasks', userId })
      throw error
    }

    return (data ?? []) as Task[]
  }

  async createTask(task: Omit<Task, 'id' | 'created_at'>): Promise<Task> {
    const result = await this.client
      .from('tasks')
      .insert([task])
      .select()
      .single()

    if (result.error) {
      logger.error('DatabaseService', result.error, { operation: 'createTask' })
      throw result.error
    }

    return result.data as Task
  }

  async updateTask(id: string, updates: Partial<Task>): Promise<Task> {
    const result = await this.client
      .from('tasks')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (result.error) {
      logger.error('DatabaseService', result.error, { operation: 'updateTask', taskId: id })
      throw result.error
    }

    return result.data as Task
  }

  async deleteTask(id: string): Promise<void> {
    const { error } = await this.client
      .from('tasks')
      .update({ deleted: true, deleted_at: new Date().toISOString() })
      .eq('id', id)

    if (error) {
      logger.error('DatabaseService', error, { operation: 'deleteTask', taskId: id })
      throw error
    }
  }

  async restoreTask(id: string): Promise<Task> {
    const result = await this.client
      .from('tasks')
      .update({ deleted: false, deleted_at: null })
      .eq('id', id)
      .select()
      .single()

    if (result.error) {
      logger.error('DatabaseService', result.error, { operation: 'restoreTask', taskId: id })
      throw result.error
    }

    if (!result.data) {
      throw new Error('No data returned after restoring task')
    }

    return result.data as Task
  }

  async permanentlyDeleteTask(id: string): Promise<void> {
    const { error } = await this.client
      .from('tasks')
      .delete()
      .eq('id', id)

    if (error) {
      logger.error('DatabaseService', error, { operation: 'permanentlyDeleteTask', taskId: id })
      throw error
    }
  }

  // Projects CRUD Operations
  async getProjects(userId: string): Promise<Project[]> {
    const { data, error } = await this.client
      .from('projects')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      logger.error('DatabaseService', error, { operation: 'getProjects', userId })
      throw error
    }

    return (data ?? []) as Task[]
  }

  async createProject(project: Omit<Project, 'id' | 'created_at'>): Promise<Project> {
    const result = await this.client
      .from('projects')
      .insert([project])
      .select()
      .single()

    if (result.error) {
      logger.error('DatabaseService', result.error, { operation: 'createProject' })
      throw result.error
    }

    return result.data as Project
  }

  async updateProject(id: string, updates: Partial<Project>): Promise<Project> {
    const result = await this.client
      .from('projects')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (result.error) {
      logger.error('DatabaseService', result.error, { operation: 'updateProject', projectId: id })
      throw result.error
    }

    return result.data as Project
  }

  async deleteProject(id: string): Promise<void> {
    const { error } = await this.client
      .from('projects')
      .delete()
      .eq('id', id)

    if (error) {
      logger.error('DatabaseService', error, { operation: 'deleteProject', projectId: id })
      throw error
    }
  }

  // Real-time Subscriptions
  subscribeToTasks(
    userId: string,
    onTaskChange: (payload: { eventType: string; new: Task; old?: Task }) => void
  ): void {
    this.taskSubscription = this.client
      .channel('tasks')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks',
          filter: `user_id=eq.${userId}`
        },
        onTaskChange as (payload: { eventType: string; new: unknown; old?: unknown }) => void
      )
      .subscribe()
  }

  subscribeToProjects(
    userId: string,
    onProjectChange: (payload: { eventType: string; new: Project; old?: Project }) => void
  ): void {
    this.projectSubscription = this.client
      .channel('projects')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'projects',
          filter: `user_id=eq.${userId}`
        },
        onProjectChange as (payload: { eventType: string; new: unknown; old?: unknown }) => void
      )
      .subscribe()
  }

  // Cleanup subscriptions
  unsubscribeFromTasks(): void {
    if (this.taskSubscription) {
      void this.client.removeChannel(this.taskSubscription)
      this.taskSubscription = null
    }
  }

  unsubscribeFromProjects(): void {
    if (this.projectSubscription) {
      void this.client.removeChannel(this.projectSubscription)
      this.projectSubscription = null
    }
  }

  unsubscribeAll(): void {
    this.unsubscribeFromTasks()
    this.unsubscribeFromProjects()
  }

  // Batch operations for better performance
  async batchUpdateTasks(updates: Array<{ id: string; updates: Partial<Task> }>): Promise<Task[]> {
    const promises = updates.map(({ id, updates: taskUpdates }) =>
      this.updateTask(id, taskUpdates)
    )

    return Promise.all(promises)
  }

  // Advanced queries
  async getTasksByProject(userId: string, projectId: string): Promise<Task[]> {
    const { data, error } = await this.client
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .eq('project_id', projectId)
      .eq('deleted', false)
      .order('created_at', { ascending: false })

    if (error) {
      logger.error('DatabaseService', error, { operation: 'getTasksByProject', userId, projectId })
      throw error
    }

    return (data ?? []) as Task[]
  }

  async getTasksByStatus(userId: string, status: string): Promise<Task[]> {
    const { data, error } = await this.client
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .eq('status', status)
      .eq('deleted', false)
      .order('created_at', { ascending: false })

    if (error) {
      logger.error('DatabaseService', error, { operation: 'getTasksByStatus', userId, status })
      throw error
    }

    return (data ?? []) as Task[]
  }

  async getTasksDueToday(userId: string): Promise<Task[]> {
    const today = new Date()
    const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString()
    const endOfDay = new Date(today.setHours(23, 59, 59, 999)).toISOString()

    const { data, error } = await this.client
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .gte('due_date', startOfDay)
      .lte('due_date', endOfDay)
      .eq('deleted', false)
      .neq('status', 'done')
      .order('due_date', { ascending: true })

    if (error) {
      logger.error('DatabaseService', error, { operation: 'getTasksDueToday', userId })
      throw error
    }

    return (data ?? []) as Task[]
  }

  async searchTasks(userId: string, query: string): Promise<Task[]> {
    const { data, error } = await this.client
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .eq('deleted', false)
      .or(`title.ilike.%${query}%,description.ilike.%${query}%,notes.ilike.%${query}%`)
      .order('created_at', { ascending: false })

    if (error) {
      logger.error('DatabaseService', error, { operation: 'searchTasks', userId, query })
      throw error
    }

    return (data ?? []) as Task[]
  }
}

// Singleton instance
export const db = new DatabaseService()
