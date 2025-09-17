import { supabase, Task, Project } from '../lib/supabase'
import { RealtimeChannel } from '@supabase/supabase-js'

export class DatabaseService {
  private taskSubscription: RealtimeChannel | null = null
  private projectSubscription: RealtimeChannel | null = null

  // Tasks CRUD Operations
  async getTasks(userId: string): Promise<Task[]> {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching tasks:', error)
      throw error
    }

    return data || []
  }

  async createTask(task: Omit<Task, 'id' | 'created_at'>): Promise<Task> {
    const { data, error } = await supabase
      .from('tasks')
      .insert([task])
      .select()
      .single()

    if (error) {
      console.error('Error creating task:', error)
      throw error
    }

    return data
  }

  async updateTask(id: string, updates: Partial<Task>): Promise<Task> {
    const { data, error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating task:', error)
      throw error
    }

    return data
  }

  async deleteTask(id: string): Promise<void> {
    const { error } = await supabase
      .from('tasks')
      .update({ deleted: true, deleted_at: new Date().toISOString() })
      .eq('id', id)

    if (error) {
      console.error('Error deleting task:', error)
      throw error
    }
  }

  async restoreTask(id: string): Promise<Task> {
    const { data, error } = await supabase
      .from('tasks')
      .update({ deleted: false, deleted_at: null })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error restoring task:', error)
      throw error
    }

    return data
  }

  async permanentlyDeleteTask(id: string): Promise<void> {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error permanently deleting task:', error)
      throw error
    }
  }

  // Projects CRUD Operations
  async getProjects(userId: string): Promise<Project[]> {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching projects:', error)
      throw error
    }

    return data || []
  }

  async createProject(project: Omit<Project, 'id' | 'created_at'>): Promise<Project> {
    const { data, error } = await supabase
      .from('projects')
      .insert([project])
      .select()
      .single()

    if (error) {
      console.error('Error creating project:', error)
      throw error
    }

    return data
  }

  async updateProject(id: string, updates: Partial<Project>): Promise<Project> {
    const { data, error } = await supabase
      .from('projects')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating project:', error)
      throw error
    }

    return data
  }

  async deleteProject(id: string): Promise<void> {
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting project:', error)
      throw error
    }
  }

  // Real-time Subscriptions
  subscribeToTasks(
    userId: string,
    onTaskChange: (payload: any) => void
  ): void {
    this.taskSubscription = supabase
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
    this.projectSubscription = supabase
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
      supabase.removeChannel(this.taskSubscription)
      this.taskSubscription = null
    }
  }

  unsubscribeFromProjects(): void {
    if (this.projectSubscription) {
      supabase.removeChannel(this.projectSubscription)
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
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .eq('project_id', projectId)
      .eq('deleted', false)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching tasks by project:', error)
      throw error
    }

    return data || []
  }

  async getTasksByStatus(userId: string, status: string): Promise<Task[]> {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .eq('status', status)
      .eq('deleted', false)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching tasks by status:', error)
      throw error
    }

    return data || []
  }

  async getTasksDueToday(userId: string): Promise<Task[]> {
    const today = new Date()
    const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString()
    const endOfDay = new Date(today.setHours(23, 59, 59, 999)).toISOString()

    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .gte('due_date', startOfDay)
      .lte('due_date', endOfDay)
      .eq('deleted', false)
      .neq('status', 'done')
      .order('due_date', { ascending: true })

    if (error) {
      console.error('Error fetching tasks due today:', error)
      throw error
    }

    return data || []
  }

  async searchTasks(userId: string, query: string): Promise<Task[]> {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .eq('deleted', false)
      .or(`title.ilike.%${query}%,description.ilike.%${query}%,notes.ilike.%${query}%`)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error searching tasks:', error)
      throw error
    }

    return data || []
  }
}

// Singleton instance
export const db = new DatabaseService()