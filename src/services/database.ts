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

    return data || []
  }

  async createTask(task: Omit<Task, 'id' | 'created_at'>): Promise<Task> {
    const { data, error } = await this.client
      .from('tasks')
      .insert([task])
      .select()
      .single()

    if (error) {
      logger.error('DatabaseService', error, { operation: 'createTask' })
      throw error
    }

    return data
  }

  async updateTask(id: string, updates: Partial<Task>): Promise<Task> {
    const { data, error } = await this.client
      .from('tasks')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      logger.error('DatabaseService', error, { operation: 'updateTask', taskId: id })
      throw error
    }

    return data
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
    const { data, error } = await this.client
      .from('tasks')
      .update({ deleted: false, deleted_at: null })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      logger.error('DatabaseService', error, { operation: 'restoreTask', taskId: id })
      throw error
    }

    return data
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

    return data || []
  }

  async createProject(project: Omit<Project, 'id' | 'created_at'>): Promise<Project> {
    const { data, error } = await this.client
      .from('projects')
      .insert([project])
      .select()
      .single()

    if (error) {
      logger.error('DatabaseService', error, { operation: 'createProject' })
      throw error
    }

    return data
  }

  async updateProject(id: string, updates: Partial<Project>): Promise<Project> {
    const { data, error } = await this.client
      .from('projects')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      logger.error('DatabaseService', error, { operation: 'updateProject', projectId: id })
      throw error
    }

    return data
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
    onTaskChange: (payload: any) => void
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
        onTaskChange
      )
      .subscribe()
  }

  subscribeToProjects(
    userId: string,
    onProjectChange: (payload: any) => void
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
        onProjectChange
      )
      .subscribe()
  }

  // Cleanup subscriptions
  unsubscribeFromTasks(): void {
    if (this.taskSubscription) {
      this.client.removeChannel(this.taskSubscription)
      this.taskSubscription = null
    }
  }

  unsubscribeFromProjects(): void {
    if (this.projectSubscription) {
      this.client.removeChannel(this.projectSubscription)
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

    return data || []
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

    return data || []
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

    return data || []
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

    return data || []
  }
}

// Singleton instance
export const db = new DatabaseService()
