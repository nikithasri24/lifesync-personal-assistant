import { useState, useEffect, useCallback } from 'react'
import { db } from '../services/database'
import { Task, Project } from '../lib/supabase'

// Temporary user ID - in a real app, this would come from authentication
const TEMP_USER_ID = 'temp-user-123'

interface UseTasksReturn {
  tasks: Task[]
  projects: Project[]
  loading: boolean
  error: string | null
  
  // Task operations
  createTask: (task: Omit<Task, 'id' | 'created_at' | 'user_id'>) => Promise<void>
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>
  deleteTask: (id: string) => Promise<void>
  restoreTask: (id: string) => Promise<void>
  permanentlyDeleteTask: (id: string) => Promise<void>
  
  // Project operations
  createProject: (project: Omit<Project, 'id' | 'created_at' | 'user_id'>) => Promise<void>
  updateProject: (id: string, updates: Partial<Project>) => Promise<void>
  deleteProject: (id: string) => Promise<void>
  
  // Utility functions
  refreshData: () => Promise<void>
}

export const useTasks = (): UseTasksReturn => {
  const [tasks, setTasks] = useState<Task[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load initial data
  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const [tasksData, projectsData] = await Promise.all([
        db.getTasks(TEMP_USER_ID),
        db.getProjects(TEMP_USER_ID)
      ])
      
      setTasks(tasksData)
      setProjects(projectsData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data')
      console.error('Error loading data:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  // Handle real-time task updates
  const handleTaskChange = useCallback((payload: any) => {
    const { eventType, new: newRecord, old: oldRecord } = payload

    switch (eventType) {
      case 'INSERT':
        setTasks(prev => [newRecord, ...prev])
        break
      
      case 'UPDATE':
        setTasks(prev => prev.map(task => 
          task.id === newRecord.id ? newRecord : task
        ))
        break
      
      case 'DELETE':
        setTasks(prev => prev.filter(task => task.id !== oldRecord.id))
        break
    }
  }, [])

  // Handle real-time project updates
  const handleProjectChange = useCallback((payload: any) => {
    const { eventType, new: newRecord, old: oldRecord } = payload

    switch (eventType) {
      case 'INSERT':
        setProjects(prev => [newRecord, ...prev])
        break
      
      case 'UPDATE':
        setProjects(prev => prev.map(project => 
          project.id === newRecord.id ? newRecord : project
        ))
        break
      
      case 'DELETE':
        setProjects(prev => prev.filter(project => project.id !== oldRecord.id))
        break
    }
  }, [])

  // Setup real-time subscriptions
  useEffect(() => {
    loadData()

    // Subscribe to real-time updates
    db.subscribeToTasks(TEMP_USER_ID, handleTaskChange)
    db.subscribeToProjects(TEMP_USER_ID, handleProjectChange)

    // Cleanup on unmount
    return () => {
      db.unsubscribeAll()
    }
  }, [loadData, handleTaskChange, handleProjectChange])

  // Task operations
  const createTask = async (taskData: Omit<Task, 'id' | 'created_at' | 'user_id'>) => {
    try {
      await db.createTask({
        ...taskData,
        user_id: TEMP_USER_ID
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create task')
      throw err
    }
  }

  const updateTask = async (id: string, updates: Partial<Task>) => {
    try {
      await db.updateTask(id, updates)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update task')
      throw err
    }
  }

  const deleteTask = async (id: string) => {
    try {
      await db.deleteTask(id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete task')
      throw err
    }
  }

  const restoreTask = async (id: string) => {
    try {
      await db.restoreTask(id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to restore task')
      throw err
    }
  }

  const permanentlyDeleteTask = async (id: string) => {
    try {
      await db.permanentlyDeleteTask(id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to permanently delete task')
      throw err
    }
  }

  // Project operations
  const createProject = async (projectData: Omit<Project, 'id' | 'created_at' | 'user_id'>) => {
    try {
      await db.createProject({
        ...projectData,
        user_id: TEMP_USER_ID
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create project')
      throw err
    }
  }

  const updateProject = async (id: string, updates: Partial<Project>) => {
    try {
      await db.updateProject(id, updates)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update project')
      throw err
    }
  }

  const deleteProject = async (id: string) => {
    try {
      await db.deleteProject(id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete project')
      throw err
    }
  }

  const refreshData = async () => {
    await loadData()
  }

  return {
    tasks,
    projects,
    loading,
    error,
    createTask,
    updateTask,
    deleteTask,
    restoreTask,
    permanentlyDeleteTask,
    createProject,
    updateProject,
    deleteProject,
    refreshData
  }
}