// LifeSync REST API Client
// Simple HTTP client to communicate with our PostgreSQL backend

const API_BASE = 'http://10.247.209.223:3001/api';

export interface TaskData {
  id?: string;
  title: string;
  description?: string;
  project_id?: string;
  status?: 'todo' | 'done' | 'waiting' | 'scheduled' | 'in_progress';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  estimated_time?: number;
  actual_time?: number;
  due_date?: string;
  tags?: string[];
  category?: 'work' | 'personal' | 'learning' | 'creative' | 'health' | 'other';
  notes?: string;
  starred?: boolean;
  archived?: boolean;
  deleted?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ProjectData {
  id?: string;
  name: string;
  description?: string;
  color?: string;
  status?: 'active' | 'completed' | 'on_hold';
  icon?: string;
  created_at?: string;
  updated_at?: string;
}

class ApiClient {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE}${endpoint}`;
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API Request failed: ${endpoint}`, error);
      throw error;
    }
  }

  // Task operations
  async getTasks(): Promise<TaskData[]> {
    return this.request<TaskData[]>('/tasks');
  }

  async createTask(task: Omit<TaskData, 'id' | 'created_at' | 'updated_at'>): Promise<TaskData> {
    return this.request<TaskData>('/tasks', {
      method: 'POST',
      body: JSON.stringify(task),
    });
  }

  async updateTask(id: string, updates: Partial<TaskData>): Promise<TaskData> {
    return this.request<TaskData>(`/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteTask(id: string): Promise<TaskData> {
    return this.request<TaskData>(`/tasks/${id}`, {
      method: 'DELETE',
    });
  }

  async restoreTask(id: string): Promise<TaskData> {
    return this.request<TaskData>(`/tasks/${id}/restore`, {
      method: 'POST',
    });
  }

  async permanentlyDeleteTask(id: string): Promise<{ message: string; task: TaskData }> {
    return this.request<{ message: string; task: TaskData }>(`/tasks/${id}/permanent`, {
      method: 'DELETE',
    });
  }

  // Project operations
  async getProjects(): Promise<ProjectData[]> {
    return this.request<ProjectData[]>('/projects');
  }

  async createProject(project: Omit<ProjectData, 'id' | 'created_at' | 'updated_at'>): Promise<ProjectData> {
    return this.request<ProjectData>('/projects', {
      method: 'POST',
      body: JSON.stringify(project),
    });
  }

  async updateProject(id: string, updates: Partial<ProjectData>): Promise<ProjectData> {
    return this.request<ProjectData>(`/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteProject(id: string): Promise<{ message: string; project: ProjectData }> {
    return this.request<{ message: string; project: ProjectData }>(`/projects/${id}`, {
      method: 'DELETE',
    });
  }

  // Health check
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    return this.request<{ status: string; timestamp: string }>('/health');
  }
}

export const apiClient = new ApiClient();