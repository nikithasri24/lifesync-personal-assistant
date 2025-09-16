/**
 * Task Focus Integration
 * 
 * Complete task management system integrated with focus sessions.
 * Link tasks to focus sessions, track time spent, estimate vs actual,
 * project organization, and productivity analytics.
 */

import React, { useState, useEffect } from 'react';
import {
  CheckSquare,
  Clock,
  Calendar,
  Target,
  Folder,
  Plus,
  Edit,
  Trash2,
  Play,
  Pause,
  BarChart3,
  Filter,
  Search,
  Tag,
  Star,
  AlertCircle,
  CheckCircle,
  Timer,
  Brain,
  TrendingUp,
  Archive,
  RotateCw,
  Book,
  Code,
  Briefcase,
  Heart,
  Lightbulb
} from 'lucide-react';
import { format, isToday, isPast, addDays } from 'date-fns';

interface Task {
  id: string;
  title: string;
  description?: string;
  projectId?: string;
  status: 'todo' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  estimatedTime: number; // minutes
  actualTime: number; // minutes from focus sessions
  dueDate?: Date;
  tags: string[];
  focusSessions: string[]; // session IDs
  createdAt: Date;
  completedAt?: Date;
  difficulty: 1 | 2 | 3 | 4 | 5;
  category: 'work' | 'personal' | 'learning' | 'creative' | 'health' | 'other';
  subtasks: SubTask[];
  attachments: string[];
  notes: string;
}

interface SubTask {
  id: string;
  title: string;
  completed: boolean;
  estimatedTime?: number;
  actualTime?: number;
}

interface Project {
  id: string;
  name: string;
  description?: string;
  color: string;
  status: 'active' | 'completed' | 'on_hold' | 'cancelled';
  startDate: Date;
  endDate?: Date;
  estimatedHours: number;
  actualHours: number;
  tasks: string[]; // task IDs
  team?: string[]; // user IDs
  progress: number; // 0-100
  category: string;
  icon: string;
}

interface FocusSession {
  id: string;
  taskId?: string;
  projectId?: string;
  duration: number;
  actualDuration: number;
  startTime: Date;
  endTime: Date;
  productivity: number; // 1-5 rating
  notes?: string;
}

interface Props {
  onStartFocusSession: (taskId: string, estimatedDuration: number) => void;
  onTaskComplete: (taskId: string) => void;
  activeFocusSession?: FocusSession;
}

export const TaskFocusIntegration: React.FC<Props> = ({
  onStartFocusSession,
  onTaskComplete,
  activeFocusSession
}) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeTab, setActiveTab] = useState<'tasks' | 'projects' | 'analytics'>('tasks');
  const [filter, setFilter] = useState<'all' | 'today' | 'overdue' | 'completed'>('all');
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'priority' | 'dueDate' | 'estimatedTime' | 'createdAt'>('priority');

  const [newTask, setNewTask] = useState<Partial<Task>>({
    title: '',
    priority: 'medium',
    estimatedTime: 25,
    tags: [],
    difficulty: 3,
    category: 'work',
    subtasks: [],
    notes: ''
  });

  const [newProject, setNewProject] = useState<Partial<Project>>({
    name: '',
    color: '#6366f1',
    category: 'work',
    icon: '📁',
    estimatedHours: 10
  });

  // Mock data
  useEffect(() => {
    const mockProjects: Project[] = [
      {
        id: '1',
        name: 'Website Redesign',
        description: 'Complete overhaul of company website',
        color: '#6366f1',
        status: 'active',
        startDate: new Date(),
        estimatedHours: 120,
        actualHours: 45,
        tasks: ['1', '2', '3'],
        progress: 35,
        category: 'work',
        icon: '💻'
      },
      {
        id: '2',
        name: 'Learning React',
        description: 'Master React framework',
        color: '#10b981',
        status: 'active',
        startDate: new Date(),
        estimatedHours: 80,
        actualHours: 25,
        tasks: ['4', '5'],
        progress: 60,
        category: 'learning',
        icon: '📚'
      },
      {
        id: '3',
        name: 'Fitness Goals',
        description: 'Health and wellness objectives',
        color: '#f59e0b',
        status: 'active',
        startDate: new Date(),
        estimatedHours: 40,
        actualHours: 12,
        tasks: ['6'],
        progress: 20,
        category: 'health',
        icon: '💪'
      }
    ];

    const mockTasks: Task[] = [
      {
        id: '1',
        title: 'Design homepage mockups',
        description: 'Create wireframes and visual designs for the new homepage',
        projectId: '1',
        status: 'in_progress',
        priority: 'high',
        estimatedTime: 180,
        actualTime: 75,
        dueDate: addDays(new Date(), 2),
        tags: ['design', 'ui', 'homepage'],
        focusSessions: ['session1', 'session2'],
        createdAt: new Date(),
        difficulty: 4,
        category: 'work',
        subtasks: [
          { id: 'st1', title: 'Research competitor designs', completed: true, estimatedTime: 60, actualTime: 45 },
          { id: 'st2', title: 'Create wireframes', completed: true, estimatedTime: 90, actualTime: 120 },
          { id: 'st3', title: 'Design visual mockups', completed: false, estimatedTime: 120 }
        ],
        attachments: [],
        notes: 'Focus on mobile-first approach'
      },
      {
        id: '2',
        title: 'Implement responsive navigation',
        description: 'Code the new navigation component with mobile responsiveness',
        projectId: '1',
        status: 'todo',
        priority: 'medium',
        estimatedTime: 120,
        actualTime: 0,
        dueDate: addDays(new Date(), 5),
        tags: ['frontend', 'react', 'responsive'],
        focusSessions: [],
        createdAt: new Date(),
        difficulty: 3,
        category: 'work',
        subtasks: [],
        attachments: [],
        notes: ''
      },
      {
        id: '3',
        title: 'Set up analytics tracking',
        description: 'Implement Google Analytics and custom event tracking',
        projectId: '1',
        status: 'todo',
        priority: 'low',
        estimatedTime: 90,
        actualTime: 0,
        dueDate: addDays(new Date(), 10),
        tags: ['analytics', 'tracking'],
        focusSessions: [],
        createdAt: new Date(),
        difficulty: 2,
        category: 'work',
        subtasks: [],
        attachments: [],
        notes: ''
      },
      {
        id: '4',
        title: 'Complete React Hooks tutorial',
        description: 'Go through the official React Hooks documentation and examples',
        projectId: '2',
        status: 'completed',
        priority: 'medium',
        estimatedTime: 180,
        actualTime: 165,
        dueDate: new Date(),
        tags: ['react', 'hooks', 'tutorial'],
        focusSessions: ['session3', 'session4'],
        createdAt: new Date(),
        completedAt: new Date(),
        difficulty: 3,
        category: 'learning',
        subtasks: [],
        attachments: [],
        notes: 'Great resource for understanding useEffect'
      },
      {
        id: '5',
        title: 'Build a todo app with React',
        description: 'Practice React skills by building a functional todo application',
        projectId: '2',
        status: 'in_progress',
        priority: 'high',
        estimatedTime: 240,
        actualTime: 120,
        dueDate: addDays(new Date(), 3),
        tags: ['react', 'project', 'practice'],
        focusSessions: ['session5'],
        createdAt: new Date(),
        difficulty: 4,
        category: 'learning',
        subtasks: [
          { id: 'st4', title: 'Set up project structure', completed: true, estimatedTime: 30, actualTime: 25 },
          { id: 'st5', title: 'Implement basic CRUD operations', completed: false, estimatedTime: 120 },
          { id: 'st6', title: 'Add local storage persistence', completed: false, estimatedTime: 60 },
          { id: 'st7', title: 'Style with CSS', completed: false, estimatedTime: 90 }
        ],
        attachments: [],
        notes: 'Focus on clean, reusable components'
      },
      {
        id: '6',
        title: 'Morning workout routine',
        description: '30-minute morning exercise routine',
        projectId: '3',
        status: 'todo',
        priority: 'medium',
        estimatedTime: 30,
        actualTime: 0,
        dueDate: new Date(),
        tags: ['exercise', 'morning', 'routine'],
        focusSessions: [],
        createdAt: new Date(),
        difficulty: 2,
        category: 'health',
        subtasks: [],
        attachments: [],
        notes: 'Start with light stretching'
      }
    ];

    setProjects(mockProjects);
    setTasks(mockTasks);
  }, []);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-600 bg-red-100 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-100 border-orange-200';
      case 'medium': return 'text-yellow-600 bg-yellow-100 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-100 border-green-200';
      default: return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100';
      case 'in_progress': return 'text-blue-600 bg-blue-100';
      case 'cancelled': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'work': return <Briefcase className="w-4 h-4" />;
      case 'personal': return <Heart className="w-4 h-4" />;
      case 'learning': return <Book className="w-4 h-4" />;
      case 'creative': return <Lightbulb className="w-4 h-4" />;
      case 'health': return <Target className="w-4 h-4" />;
      default: return <CheckSquare className="w-4 h-4" />;
    }
  };

  const filteredTasks = tasks.filter(task => {
    // Filter by status/date
    if (filter === 'today' && (!task.dueDate || !isToday(task.dueDate))) return false;
    if (filter === 'overdue' && (!task.dueDate || !isPast(task.dueDate) || task.status === 'completed')) return false;
    if (filter === 'completed' && task.status !== 'completed') return false;

    // Filter by project
    if (selectedProject !== 'all' && task.projectId !== selectedProject) return false;

    // Filter by search query
    if (searchQuery && !task.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;

    return true;
  }).sort((a, b) => {
    switch (sortBy) {
      case 'priority':
        const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      case 'dueDate':
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return a.dueDate.getTime() - b.dueDate.getTime();
      case 'estimatedTime':
        return b.estimatedTime - a.estimatedTime;
      case 'createdAt':
        return b.createdAt.getTime() - a.createdAt.getTime();
      default:
        return 0;
    }
  });

  const getTaskProgress = (task: Task) => {
    if (task.subtasks.length === 0) {
      return task.status === 'completed' ? 100 : task.actualTime > 0 ? 50 : 0;
    }
    const completed = task.subtasks.filter(st => st.completed).length;
    return (completed / task.subtasks.length) * 100;
  };

  const createTask = () => {
    if (newTask.title) {
      const task: Task = {
        id: `task_${Date.now()}`,
        title: newTask.title,
        description: newTask.description,
        projectId: newTask.projectId,
        status: 'todo',
        priority: newTask.priority as any,
        estimatedTime: newTask.estimatedTime || 25,
        actualTime: 0,
        dueDate: newTask.dueDate,
        tags: newTask.tags || [],
        focusSessions: [],
        createdAt: new Date(),
        difficulty: newTask.difficulty || 3,
        category: newTask.category as any,
        subtasks: newTask.subtasks || [],
        attachments: [],
        notes: newTask.notes || ''
      };

      setTasks(prev => [...prev, task]);
      setNewTask({
        title: '',
        priority: 'medium',
        estimatedTime: 25,
        tags: [],
        difficulty: 3,
        category: 'work',
        subtasks: [],
        notes: ''
      });
      setShowCreateTask(false);
    }
  };

  const createProject = () => {
    if (newProject.name) {
      const project: Project = {
        id: `project_${Date.now()}`,
        name: newProject.name,
        description: newProject.description,
        color: newProject.color || '#6366f1',
        status: 'active',
        startDate: new Date(),
        endDate: newProject.endDate,
        estimatedHours: newProject.estimatedHours || 10,
        actualHours: 0,
        tasks: [],
        progress: 0,
        category: newProject.category || 'work',
        icon: newProject.icon || '📁'
      };

      setProjects(prev => [...prev, project]);
      setNewProject({
        name: '',
        color: '#6366f1',
        category: 'work',
        icon: '📁',
        estimatedHours: 10
      });
      setShowCreateProject(false);
    }
  };

  const toggleTaskStatus = (taskId: string) => {
    setTasks(prev => prev.map(task => {
      if (task.id === taskId) {
        const newStatus = task.status === 'completed' ? 'todo' : 'completed';
        if (newStatus === 'completed') {
          onTaskComplete(taskId);
        }
        return {
          ...task,
          status: newStatus as any,
          completedAt: newStatus === 'completed' ? new Date() : undefined
        };
      }
      return task;
    }));
  };

  const addSubtask = (taskId: string, subtaskTitle: string) => {
    setTasks(prev => prev.map(task => {
      if (task.id === taskId) {
        return {
          ...task,
          subtasks: [...task.subtasks, {
            id: `st_${Date.now()}`,
            title: subtaskTitle,
            completed: false
          }]
        };
      }
      return task;
    }));
  };

  const toggleSubtask = (taskId: string, subtaskId: string) => {
    setTasks(prev => prev.map(task => {
      if (task.id === taskId) {
        return {
          ...task,
          subtasks: task.subtasks.map(st => 
            st.id === subtaskId ? { ...st, completed: !st.completed } : st
          )
        };
      }
      return task;
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Task Management</h2>
          <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
            Organize your work and track focus time
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowCreateTask(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-colors"
          >
            <Plus size={16} />
            <span>Add Task</span>
          </button>
          <button
            onClick={() => setShowCreateProject(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors"
          >
            <Folder size={16} />
            <span>New Project</span>
          </button>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex space-x-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
        {[
          { key: 'tasks', label: 'Tasks', icon: CheckSquare },
          { key: 'projects', label: 'Projects', icon: Folder },
          { key: 'analytics', label: 'Analytics', icon: BarChart3 }
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === tab.key
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <tab.icon size={16} />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tasks Tab */}
      {activeTab === 'tasks' && (
        <div className="space-y-6">
          {/* Filters and Search */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center space-x-2">
              <Search className="w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm"
              />
            </div>
            
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm"
            >
              <option value="all">All Tasks</option>
              <option value="today">Due Today</option>
              <option value="overdue">Overdue</option>
              <option value="completed">Completed</option>
            </select>

            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm"
            >
              <option value="all">All Projects</option>
              {projects.map(project => (
                <option key={project.id} value={project.id}>{project.name}</option>
              ))}
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm"
            >
              <option value="priority">Sort by Priority</option>
              <option value="dueDate">Sort by Due Date</option>
              <option value="estimatedTime">Sort by Time</option>
              <option value="createdAt">Sort by Created</option>
            </select>
          </div>

          {/* Active Focus Session */}
          {activeFocusSession && (
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold mb-1">Active Focus Session</h3>
                  <p className="text-indigo-100">
                    {activeFocusSession.taskId ? 
                      `Working on: ${tasks.find(t => t.id === activeFocusSession.taskId)?.title}` :
                      'General focus session'
                    }
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold">{Math.floor(activeFocusSession.duration / 60)}:{(activeFocusSession.duration % 60).toString().padStart(2, '0')}</div>
                  <div className="text-sm text-indigo-200">Time elapsed</div>
                </div>
              </div>
            </div>
          )}

          {/* Task List */}
          <div className="space-y-4">
            {filteredTasks.map((task) => {
              const project = projects.find(p => p.id === task.projectId);
              const progress = getTaskProgress(task);
              const isOverdue = task.dueDate && isPast(task.dueDate) && task.status !== 'completed';
              
              return (
                <div key={task.id} className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700 hover:shadow-lg transition-all">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start space-x-4 flex-1">
                      <button
                        onClick={() => toggleTaskStatus(task.id)}
                        className={`mt-1 w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                          task.status === 'completed'
                            ? 'bg-green-500 border-green-500 text-white'
                            : 'border-slate-300 dark:border-slate-600 hover:border-green-400'
                        }`}
                      >
                        {task.status === 'completed' && <CheckCircle size={14} />}
                      </button>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className={`font-semibold ${task.status === 'completed' ? 'line-through text-slate-500' : 'text-slate-900 dark:text-white'}`}>
                            {task.title}
                          </h3>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getPriorityColor(task.priority)}`}>
                            {task.priority}
                          </span>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(task.status)}`}>
                            {task.status.replace('_', ' ')}
                          </span>
                          {isOverdue && (
                            <span className="flex items-center space-x-1 text-red-500 text-xs">
                              <AlertCircle size={12} />
                              <span>Overdue</span>
                            </span>
                          )}
                        </div>
                        
                        {task.description && (
                          <p className="text-sm text-slate-600 dark:text-slate-300 mb-2">{task.description}</p>
                        )}
                        
                        <div className="flex items-center space-x-4 text-xs text-slate-500 dark:text-slate-400">
                          {project && (
                            <span className="flex items-center space-x-1">
                              <span style={{ color: project.color }}>{project.icon}</span>
                              <span>{project.name}</span>
                            </span>
                          )}
                          
                          <span className="flex items-center space-x-1">
                            {getCategoryIcon(task.category)}
                            <span>{task.category}</span>
                          </span>
                          
                          <span className="flex items-center space-x-1">
                            <Clock size={12} />
                            <span>{task.actualTime}m / {task.estimatedTime}m</span>
                          </span>
                          
                          {task.dueDate && (
                            <span className="flex items-center space-x-1">
                              <Calendar size={12} />
                              <span>{format(task.dueDate, 'MMM d')}</span>
                            </span>
                          )}
                          
                          <span className="flex items-center space-x-1">
                            <Star size={12} />
                            <span>Difficulty: {task.difficulty}/5</span>
                          </span>
                        </div>
                        
                        {task.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {task.tags.map((tag, index) => (
                              <span key={index} className="px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs rounded">
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}
                        
                        {/* Subtasks */}
                        {task.subtasks.length > 0 && (
                          <div className="mt-3 space-y-1">
                            {task.subtasks.map((subtask) => (
                              <div key={subtask.id} className="flex items-center space-x-2">
                                <button
                                  onClick={() => toggleSubtask(task.id, subtask.id)}
                                  className={`w-3 h-3 rounded border flex items-center justify-center ${
                                    subtask.completed
                                      ? 'bg-green-400 border-green-400 text-white'
                                      : 'border-slate-300 dark:border-slate-600'
                                  }`}
                                >
                                  {subtask.completed && <CheckCircle size={8} />}
                                </button>
                                <span className={`text-sm ${subtask.completed ? 'line-through text-slate-500' : 'text-slate-700 dark:text-slate-300'}`}>
                                  {subtask.title}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                        
                        {/* Progress Bar */}
                        {progress > 0 && (
                          <div className="mt-3">
                            <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
                              <span>Progress</span>
                              <span>{Math.round(progress)}%</span>
                            </div>
                            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                              <div
                                className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full transition-all duration-500"
                                style={{ width: `${progress}%` }}
                              ></div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => onStartFocusSession(task.id, task.estimatedTime)}
                        disabled={!!activeFocusSession}
                        className="flex items-center space-x-1 px-3 py-1 bg-indigo-500 hover:bg-indigo-600 disabled:bg-gray-400 text-white rounded-lg text-sm transition-colors"
                      >
                        <Play size={14} />
                        <span>Focus</span>
                      </button>
                      
                      <button
                        onClick={() => setSelectedTask(task)}
                        className="p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                      >
                        <Edit size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
            
            {filteredTasks.length === 0 && (
              <div className="text-center py-12">
                <CheckSquare className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">No tasks found</h3>
                <p className="text-slate-600 dark:text-slate-300 mb-4">
                  {searchQuery ? 'Try adjusting your search or filters' : 'Create your first task to get started'}
                </p>
                <button
                  onClick={() => setShowCreateTask(true)}
                  className="inline-flex items-center space-x-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-colors"
                >
                  <Plus size={16} />
                  <span>Add Task</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Projects Tab */}
      {activeTab === 'projects' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => {
            const projectTasks = tasks.filter(t => t.projectId === project.id);
            const completedTasks = projectTasks.filter(t => t.status === 'completed').length;
            const progress = projectTasks.length > 0 ? (completedTasks / projectTasks.length) * 100 : 0;
            
            return (
              <div key={project.id} className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="text-2xl">{project.icon}</div>
                    <div>
                      <h3 className="font-semibold text-slate-900 dark:text-white">{project.name}</h3>
                      {project.description && (
                        <p className="text-sm text-slate-600 dark:text-slate-300">{project.description}</p>
                      )}
                    </div>
                  </div>
                  
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(project.status)}`}>
                    {project.status.replace('_', ' ')}
                  </span>
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600 dark:text-slate-300">Tasks</span>
                    <span className="font-medium text-slate-900 dark:text-white">
                      {completedTasks}/{projectTasks.length}
                    </span>
                  </div>
                  
                  <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                    <div
                      className="h-2 rounded-full transition-all duration-500"
                      style={{ 
                        width: `${progress}%`,
                        backgroundColor: project.color
                      }}
                    ></div>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600 dark:text-slate-300">Time</span>
                    <span className="font-medium text-slate-900 dark:text-white">
                      {project.actualHours}h / {project.estimatedHours}h
                    </span>
                  </div>
                  
                  <div className="pt-3 border-t border-slate-200 dark:border-slate-700">
                    <button
                      onClick={() => setSelectedProject(project.id)}
                      className="w-full px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                    >
                      View Tasks
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Task Modal */}
      {showCreateTask && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-2xl border border-white/20 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Create New Task</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Task Title
                </label>
                <input
                  type="text"
                  value={newTask.title || ''}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                  placeholder="Enter task title"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Description
                </label>
                <textarea
                  value={newTask.description || ''}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                  rows={3}
                  placeholder="Describe the task..."
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Project
                  </label>
                  <select
                    value={newTask.projectId || ''}
                    onChange={(e) => setNewTask({ ...newTask, projectId: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                  >
                    <option value="">No Project</option>
                    {projects.map(project => (
                      <option key={project.id} value={project.id}>{project.name}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Priority
                  </label>
                  <select
                    value={newTask.priority}
                    onChange={(e) => setNewTask({ ...newTask, priority: e.target.value as any })}
                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Estimated Time (min)
                  </label>
                  <input
                    type="number"
                    value={newTask.estimatedTime || ''}
                    onChange={(e) => setNewTask({ ...newTask, estimatedTime: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                    min="1"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Difficulty (1-5)
                  </label>
                  <select
                    value={newTask.difficulty}
                    onChange={(e) => setNewTask({ ...newTask, difficulty: parseInt(e.target.value) as any })}
                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                  >
                    <option value={1}>1 - Very Easy</option>
                    <option value={2}>2 - Easy</option>
                    <option value={3}>3 - Medium</option>
                    <option value={4}>4 - Hard</option>
                    <option value={5}>5 - Very Hard</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Category
                  </label>
                  <select
                    value={newTask.category}
                    onChange={(e) => setNewTask({ ...newTask, category: e.target.value as any })}
                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                  >
                    <option value="work">Work</option>
                    <option value="personal">Personal</option>
                    <option value="learning">Learning</option>
                    <option value="creative">Creative</option>
                    <option value="health">Health</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Due Date
                </label>
                <input
                  type="date"
                  value={newTask.dueDate ? format(newTask.dueDate, 'yyyy-MM-dd') : ''}
                  onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value ? new Date(e.target.value) : undefined })}
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                />
              </div>
              
              <div className="flex space-x-4">
                <button
                  onClick={() => setShowCreateTask(false)}
                  className="flex-1 px-6 py-3 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={createTask}
                  disabled={!newTask.title}
                  className="flex-1 px-6 py-3 bg-indigo-500 hover:bg-indigo-600 disabled:bg-gray-400 text-white rounded-lg transition-colors"
                >
                  Create Task
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};