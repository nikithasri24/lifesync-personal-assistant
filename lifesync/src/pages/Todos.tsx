import React, { useState, useEffect } from 'react';
import { useAppStore } from '../stores/useAppStore';
import {
  Plus,
  CheckSquare,
  Calendar,
  Archive,
  Search,
  MoreHorizontal,
  Edit,
  Play,
  CheckCircle2,
  Star,
  Clock,
  ChevronDown,
  Bell,
  Settings,
  Filter,
  User,
  Home,
  Briefcase,
  Book,
  Coffee,
  Target,
  Heart,
  List,
  Grid3X3,
  BarChart3,
  Inbox,
  Sun,
  ArrowRight,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Grid,
  Timer,
  Layers,
  Pause,
  Square,
  IndentIncrease
} from 'lucide-react';
import { format, isToday, isPast, addDays, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, isSameMonth, startOfDay, endOfDay, addWeeks, subWeeks, addMonths, subMonths } from 'date-fns';

interface Task {
  id: string;
  title: string;
  description?: string;
  projectId?: string;
  status: 'todo' | 'done';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  estimatedTime: number; // minutes
  actualTime: number; // minutes from focus sessions
  dueDate?: Date;
  tags: string[];
  createdAt: Date;
  completedAt?: Date;
  category: 'work' | 'personal' | 'learning' | 'creative' | 'health' | 'other';
  parentId?: string; // For subtasks
  subtasks?: Task[];
  isRecurring?: boolean;
  recurringPattern?: {
    type: 'daily' | 'weekly' | 'monthly';
    interval: number;
    daysOfWeek?: number[];
  };
  attachments?: {
    id: string;
    name: string;
    url: string;
    type: string;
  }[];
  notes?: string;
}

interface Project {
  id: string;
  name: string;
  description?: string;
  color: string;
  status: 'active' | 'completed' | 'on_hold';
  icon: string;
}

export default function Todos() {
  const { todos, addTodo, updateTodo, deleteTodo, addSubtask: addSubtaskToStore } = useAppStore();

  // State
  const [currentView, setCurrentView] = useState<'today' | 'inbox' | 'upcoming' | 'calendar' | 'kanban' | 'timeline' | 'matrix' | 'filters'>('inbox');
  const [calendarView, setCalendarView] = useState<'month' | 'week' | 'day'>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [quickAddText, setQuickAddText] = useState('');
  const [editingTask, setEditingTask] = useState<string | null>(null);
  const [editTaskText, setEditTaskText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [pomodoroTimer, setPomodoroTimer] = useState<{ taskId: string | null; timeLeft: number; isActive: boolean; isBreak: boolean }>({ taskId: null, timeLeft: 25 * 60, isActive: false, isBreak: false });
  const [pomodoroMode, setPomodoroMode] = useState<'work' | 'shortBreak' | 'longBreak'>('work');
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  const [showSubtaskForm, setShowSubtaskForm] = useState<string | null>(null);
  const [subtaskText, setSubtaskText] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    priority: 'all',
    status: 'all',
    dueDate: 'all',
    project: 'all'
  });
  const [currentTheme, setCurrentTheme] = useState('blue');
  
  // Theme colors
  const themes = {
    blue: { primary: 'bg-blue-500', secondary: 'bg-blue-100' },
    green: { primary: 'bg-green-500', secondary: 'bg-green-100' },
    purple: { primary: 'bg-purple-500', secondary: 'bg-purple-100' },
    pink: { primary: 'bg-pink-500', secondary: 'bg-pink-100' },
    indigo: { primary: 'bg-indigo-500', secondary: 'bg-indigo-100' }
  };

  // Mock projects data
  const [projects] = useState<Project[]>([
    {
      id: '1',
      name: 'Personal',
      description: 'Personal tasks and goals',
      color: '#6366f1',
      status: 'active',
      icon: '👤'
    },
    {
      id: '2',
      name: 'Work',
      description: 'Work-related tasks',
      color: '#10b981',
      status: 'active',
      icon: '💼'
    },
    {
      id: '3',
      name: 'Learning',
      description: 'Learning and development',
      color: '#f59e0b',
      status: 'active',
      icon: '📚'
    },
    {
      id: '4',
      name: 'Health',
      description: 'Health and wellness',
      color: '#ef4444',
      status: 'active',
      icon: '❤️'
    }
  ]);

  // Debug: Log todos from store
  console.log('Todos loaded from store:', todos);

  // Use global store todos
  const tasks = todos.map(todo => ({
    id: todo.id,
    title: todo.title,
    description: todo.description,
    priority: todo.priority,
    status: todo.completed ? 'done' as const : 'todo' as const,
    estimatedTime: todo.estimatedTime || 30,
    actualTime: todo.actualTime || 0,
    dueDate: todo.dueDate,
    projectId: todo.projectId,
    tags: todo.tags || [],
    category: todo.categoryId || 'personal',
    createdAt: todo.createdAt,
    updatedAt: todo.updatedAt
  }));

  // Helper functions
  const getTodoistPriorityFlag = (priority: string) => {
    switch (priority) {
      case 'urgent': return (
        <svg width="12" height="12" viewBox="0 0 12 12" className="text-red-500">
          <path fill="currentColor" d="M2.5 1.5h7v9l-3.5-2-3.5 2v-9z"/>
        </svg>
      );
      case 'high': return (
        <svg width="12" height="12" viewBox="0 0 12 12" className="text-orange-500">
          <path fill="currentColor" d="M2.5 1.5h7v9l-3.5-2-3.5 2v-9z"/>
        </svg>
      );
      case 'medium': return (
        <svg width="12" height="12" viewBox="0 0 12 12" className="text-blue-500">
          <path fill="currentColor" d="M2.5 1.5h7v9l-3.5-2-3.5 2v-9z"/>
        </svg>
      );
      default: return null;
    }
  };

  const parseQuickAdd = (text: string) => {
    let title = text;
    let priority = 'medium';
    let dueDate = null;
    let projectId = '';
    let tags: string[] = [];

    // Extract priority flags (p1, p2, p3, p4)
    const priorityMatch = text.match(/p([1-4])/);
    if (priorityMatch) {
      const p = parseInt(priorityMatch[1]);
      priority = p === 1 ? 'urgent' : p === 2 ? 'high' : p === 3 ? 'medium' : 'low';
      title = title.replace(/p[1-4]/, '').trim();
    }

    // Extract project references (#project)
    const projectMatch = text.match(/#(\w+)/);
    if (projectMatch) {
      const projectName = projectMatch[1].toLowerCase();
      const project = projects.find(p => p.name.toLowerCase().includes(projectName));
      if (project) projectId = project.id;
      title = title.replace(/#\w+/, '').trim();
    }

    // Extract labels (@label)
    const labelMatches = text.match(/@(\w+)/g);
    if (labelMatches) {
      tags = labelMatches.map(match => match.slice(1));
      title = title.replace(/@\w+/g, '').trim();
    }

    // Extract dates (today, tomorrow, etc.)
    if (text.includes('today')) {
      dueDate = new Date();
      title = title.replace(/today/, '').trim();
    } else if (text.includes('tomorrow')) {
      dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 1);
      title = title.replace(/tomorrow/, '').trim();
    }

    return { title, priority, dueDate, projectId, tags };
  };

  const quickAddTask = () => {
    alert('quickAddTask called with text: ' + quickAddText);
    if (!quickAddText.trim()) return;
    
    const parsed = parseQuickAdd(quickAddText);
    const todoData = {
      title: parsed.title,
      description: '',
      priority: parsed.priority as any,
      completed: false,
      estimatedTime: 25,
      actualTime: 0,
      dueDate: parsed.dueDate,
      projectId: parsed.projectId,
      tags: parsed.tags,
      categoryId: 'work'
    };

    console.log('Adding todo:', todoData);
    addTodo(todoData);
    console.log('Current todos after adding:', todos);
    setQuickAddText('');
    setShowQuickAdd(false);
  };

  const toggleTaskStatus = (taskId: string) => {
    const task = todos.find(t => t.id === taskId);
    if (task) {
      updateTodo(taskId, { 
        completed: !task.completed,
        completedAt: !task.completed ? new Date() : undefined
      });
    }
  };

  const startEditingTask = (task: Task) => {
    setEditingTask(task.id);
    setEditTaskText(task.title);
  };

  const saveTaskEdit = (taskId: string) => {
    if (editTaskText.trim()) {
      const parsed = parseQuickAdd(editTaskText);
      const currentTodo = todos.find(t => t.id === taskId);
      if (currentTodo) {
        updateTodo(taskId, {
          title: parsed.title,
          priority: parsed.priority as any,
          dueDate: parsed.dueDate || currentTodo.dueDate,
          projectId: parsed.projectId || currentTodo.projectId,
          tags: parsed.tags.length > 0 ? parsed.tags : currentTodo.tags
        });
      }
    }
    setEditingTask(null);
    setEditTaskText('');
  };

  const cancelTaskEdit = () => {
    setEditingTask(null);
    setEditTaskText('');
  };

  const getTodayTasks = () => {
    return tasks.filter(task => 
      task.dueDate && isToday(task.dueDate) && task.status !== 'done'
    );
  };

  const getUpcomingTasks = () => {
    return tasks.filter(task => 
      task.dueDate && task.dueDate > new Date() && task.status !== 'done'
    ).sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime());
  };

  const getInboxTasks = () => {
    return tasks.filter(task => !task.projectId && task.status !== 'done');
  };

  const isOverdue = (date: Date, status: string) => {
    return date < new Date() && status !== 'done';
  };

  const startPomodoro = (taskId: string) => {
    setPomodoroTimer({ taskId, timeLeft: 25 * 60, isActive: true, isBreak: false });
  };

  const stopPomodoro = () => {
    setPomodoroTimer(prev => ({ ...prev, isActive: false }));
  };

  const resetPomodoro = () => {
    setPomodoroTimer({ taskId: null, timeLeft: 25 * 60, isActive: false, isBreak: false });
  };

  React.useEffect(() => {
    let interval: NodeJS.Timeout;
    if (pomodoroTimer.isActive && pomodoroTimer.timeLeft > 0) {
      interval = setInterval(() => {
        setPomodoroTimer(prev => ({ ...prev, timeLeft: prev.timeLeft - 1 }));
      }, 1000);
    } else if (pomodoroTimer.isActive && pomodoroTimer.timeLeft === 0) {
      // Timer finished
      if (!pomodoroTimer.isBreak) {
        // Work session finished, start break
        setPomodoroTimer(prev => ({ ...prev, timeLeft: 5 * 60, isBreak: true }));
      } else {
        // Break finished
        setPomodoroTimer({ taskId: null, timeLeft: 25 * 60, isActive: false, isBreak: false });
      }
    }
    return () => clearInterval(interval);
  }, [pomodoroTimer.isActive, pomodoroTimer.timeLeft, pomodoroTimer.isBreak]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleTaskExpansion = (taskId: string) => {
    setExpandedTasks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(taskId)) {
        newSet.delete(taskId);
      } else {
        newSet.add(taskId);
      }
      return newSet;
    });
  };

  const addSubtask = (parentId: string) => {
    if (!subtaskText.trim()) return;
    
    const subtaskData = {
      title: subtaskText,
      description: '',
      priority: 'medium' as const,
      completed: false,
      estimatedTime: 25,
      actualTime: 0,
      tags: [],
      categoryId: 'work'
    };

    addSubtaskToStore(parentId, subtaskData);
    setSubtaskText('');
    setShowSubtaskForm(null);
  };

  const getSubtasks = (parentId: string) => {
    return tasks.filter(task => task.parentId === parentId);
  };

  const getMainTasks = (taskList: Task[]) => {
    return taskList.filter(task => !task.parentId);
  };

  const applyFilters = (taskList: Task[]) => {
    let filtered = taskList;
    
    // Search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(task => 
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }
    
    // Priority filter
    if (filters.priority !== 'all') {
      filtered = filtered.filter(task => task.priority === filters.priority);
    }
    
    // Status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(task => task.status === filters.status);
    }
    
    // Due date filter
    if (filters.dueDate !== 'all') {
      const now = new Date();
      const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
      const endOfWeek = new Date(now.setDate(startOfWeek.getDate() + 6));
      
      filtered = filtered.filter(task => {
        if (!task.dueDate && filters.dueDate === 'none') return true;
        if (!task.dueDate) return false;
        
        switch (filters.dueDate) {
          case 'overdue': return isPast(task.dueDate) && task.status !== 'done';
          case 'today': return isToday(task.dueDate);
          case 'week': return task.dueDate >= startOfWeek && task.dueDate <= endOfWeek;
          default: return true;
        }
      });
    }
    
    return filtered;
  };

  return (
    <div className="h-screen bg-gray-50 dark:bg-slate-900 flex">
      {/* TickTick Sidebar */}
      <div className="w-72 bg-white dark:bg-slate-800 border-r border-gray-200 dark:border-slate-700 flex flex-col shadow-sm">
        {/* Sidebar Header */}
        <div className="p-4 border-b border-gray-100 dark:border-slate-700">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
              <CheckSquare className="w-5 h-5 text-white" />
            </div>
            <h2 className="font-semibold text-slate-900 dark:text-white text-lg">TickTick</h2>
          </div>
        </div>

        {/* Quick Add */}
        <div className="p-4">
          {showQuickAdd ? (
            <div className="space-y-3">
              <input
                type="text"
                value={quickAddText}
                onChange={(e) => setQuickAddText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') quickAddTask();
                  if (e.key === 'Escape') { setShowQuickAdd(false); setQuickAddText(''); }
                }}
                placeholder="What needs to be done?"
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-white"
                autoFocus
              />
              <div className="flex space-x-2">
                <button
                  onClick={quickAddTask}
                  className="px-4 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-md text-sm transition-colors font-medium"
                >
                  Add
                </button>
                <button
                  onClick={() => { setShowQuickAdd(false); setQuickAddText(''); }}
                  className="px-4 py-1.5 text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-md text-sm transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => {
                alert('Sidebar Add task clicked!');
                setShowQuickAdd(true);
              }}
              className="w-full flex items-center space-x-2 px-3 py-2.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-700 rounded-md transition-colors text-sm font-medium"
            >
              <Plus size={16} />
              <span>Add task</span>
            </button>
          )}
        </div>

        {/* Smart Lists */}
        <div className="flex-1 px-4 pb-4">
          <div className="mb-4">
            <h3 className="text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-2 px-3">Smart Lists</h3>
            <nav className="space-y-1">
              <button
                onClick={() => setCurrentView('inbox')}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md text-sm transition-colors ${
                  currentView === 'inbox' 
                    ? 'bg-blue-50 dark:bg-slate-700 text-blue-700 dark:text-blue-400' 
                    : 'text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700'
                }`}
              >
                <Inbox className="w-4 h-4" />
                <span>All</span>
                <span className="ml-auto text-xs bg-gray-200 dark:bg-slate-600 px-2 py-0.5 rounded-full">
                  {getInboxTasks().length}
                </span>
              </button>

              <button
                onClick={() => setCurrentView('today')}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md text-sm transition-colors ${
                  currentView === 'today' 
                    ? 'bg-blue-50 dark:bg-slate-700 text-blue-700 dark:text-blue-400' 
                    : 'text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700'
                }`}
              >
                <Sun className="w-4 h-4" />
                <span>Today</span>
                <span className="ml-auto text-xs bg-gray-200 dark:bg-slate-600 px-2 py-0.5 rounded-full">
                  {getTodayTasks().length}
                </span>
              </button>

              <button
                onClick={() => setCurrentView('upcoming')}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md text-sm transition-colors ${
                  currentView === 'upcoming' 
                    ? 'bg-blue-50 dark:bg-slate-700 text-blue-700 dark:text-blue-400' 
                    : 'text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700'
                }`}
              >
                <ArrowRight className="w-4 h-4" />
                <span>Next 7 days</span>
                <span className="ml-auto text-xs bg-gray-200 dark:bg-slate-600 px-2 py-0.5 rounded-full">
                  {getUpcomingTasks().length}
                </span>
              </button>
              
              <button
                onClick={() => setCurrentView('calendar')}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md text-sm transition-colors ${
                  currentView === 'calendar' 
                    ? 'bg-blue-50 dark:bg-slate-700 text-blue-700 dark:text-blue-400' 
                    : 'text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700'
                }`}
              >
                <CalendarDays className="w-4 h-4" />
                <span>Calendar</span>
              </button>
              
              <button
                onClick={() => setCurrentView('kanban')}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md text-sm transition-colors ${
                  currentView === 'kanban' 
                    ? 'bg-blue-50 dark:bg-slate-700 text-blue-700 dark:text-blue-400' 
                    : 'text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700'
                }`}
              >
                <Grid className="w-4 h-4" />
                <span>Kanban</span>
              </button>
              
              <button
                onClick={() => setCurrentView('timeline')}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md text-sm transition-colors ${
                  currentView === 'timeline' 
                    ? 'bg-blue-50 dark:bg-slate-700 text-blue-700 dark:text-blue-400' 
                    : 'text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700'
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                <span>Timeline</span>
              </button>
              
              <button
                onClick={() => setCurrentView('matrix')}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md text-sm transition-colors ${
                  currentView === 'matrix' 
                    ? 'bg-blue-50 dark:bg-slate-700 text-blue-700 dark:text-blue-400' 
                    : 'text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700'
                }`}
              >
                <Layers className="w-4 h-4" />
                <span>Matrix</span>
              </button>
            </nav>
          </div>

          {/* Lists Section */}
          <div className="mt-6">
            <div className="flex items-center justify-between mb-3 px-3">
              <h3 className="text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Lists</h3>
              <button className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-slate-300">
                <Plus size={12} />
              </button>
            </div>
            <div className="space-y-1">
              {projects.map((project) => (
                <button
                  key={project.id}
                  onClick={() => setSelectedProject(project.id)}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md text-sm transition-colors ${
                    selectedProject === project.id 
                      ? 'bg-blue-50 dark:bg-slate-700 text-blue-700 dark:text-blue-400' 
                      : 'text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700'
                  }`}
                >
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: project.color }}></div>
                  <span className="truncate">{project.name}</span>
                  <span className="ml-auto text-xs bg-gray-200 dark:bg-slate-600 px-2 py-0.5 rounded-full">
                    {tasks.filter(t => t.projectId === project.id && t.status !== 'done').length}
                  </span>
                </button>
              ))}
            </div>
          </div>
          
          {/* Theme Customization */}
          <div className="mt-6 px-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Themes</h3>
            </div>
            <div className="grid grid-cols-5 gap-2">
              {Object.entries(themes).map(([themeName, themeColors]) => (
                <button
                  key={themeName}
                  onClick={() => setCurrentTheme(themeName)}
                  className={`w-8 h-8 rounded-lg ${themeColors.primary} hover:scale-110 transition-transform ${
                    currentTheme === themeName ? 'ring-2 ring-gray-400' : ''
                  }`}
                  title={`${themeName.charAt(0).toUpperCase() + themeName.slice(1)} theme`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700 px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 dark:text-white flex items-center space-x-3">
                {currentView === 'today' && (
                  <>
                    <Sun className="w-6 h-6 text-orange-500" />
                    <span>Today</span>
                  </>
                )}
                {currentView === 'inbox' && (
                  <>
                    <Inbox className="w-6 h-6 text-blue-500" />
                    <span>All</span>
                  </>
                )}
                {currentView === 'upcoming' && (
                  <>
                    <ArrowRight className="w-6 h-6 text-green-500" />
                    <span>Next 7 days</span>
                  </>
                )}
                {currentView === 'calendar' && (
                  <>
                    <CalendarDays className="w-6 h-6 text-purple-500" />
                    <span>Calendar</span>
                  </>
                )}
                {currentView === 'kanban' && (
                  <>
                    <Grid className="w-6 h-6 text-indigo-500" />
                    <span>Kanban</span>
                  </>
                )}
                {currentView === 'timeline' && (
                  <>
                    <BarChart3 className="w-6 h-6 text-emerald-500" />
                    <span>Timeline</span>
                  </>
                )}
                {currentView === 'matrix' && (
                  <>
                    <Layers className="w-6 h-6 text-rose-500" />
                    <span>Eisenhower Matrix</span>
                  </>
                )}
                {selectedProject !== 'all' && projects.find(p => p.id === selectedProject) && (
                  <>
                    <div className="w-6 h-6 rounded-full" style={{ backgroundColor: projects.find(p => p.id === selectedProject)?.color }}></div>
                    <span>{projects.find(p => p.id === selectedProject)?.name}</span>
                  </>
                )}
              </h1>
              <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
                {currentView === 'today' && format(new Date(), 'EEEE, MMMM do')}
                {currentView === 'inbox' && 'Manage all your tasks in one place'}
                {currentView === 'upcoming' && 'Tasks due in the next 7 days'}
                {currentView === 'calendar' && 'View your tasks in calendar format'}
                {currentView === 'kanban' && 'Organize tasks in columns by status'}
                {currentView === 'timeline' && 'See your tasks timeline and duration'}
                {currentView === 'matrix' && 'Prioritize tasks using the Eisenhower Matrix'}
                {selectedProject !== 'all' && projects.find(p => p.id === selectedProject)?.description}
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search tasks..."
                  className="pl-10 pr-4 py-2 w-64 text-sm border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-white"
                />
              </div>
              
              {/* Filters */}
              <div className="relative">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`p-2 rounded-md transition-colors ${
                    showFilters ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                  } dark:hover:bg-slate-700`}
                >
                  <Filter size={18} />
                </button>
                
                {showFilters && (
                  <div className="absolute right-0 top-12 w-64 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg shadow-lg z-10 p-4">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Filter Tasks</h3>
                    
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Priority</label>
                        <select
                          value={filters.priority}
                          onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value }))}
                          className="w-full px-3 py-1 text-sm border border-gray-300 dark:border-slate-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
                        >
                          <option value="all">All Priorities</option>
                          <option value="urgent">Urgent</option>
                          <option value="high">High</option>
                          <option value="medium">Medium</option>
                          <option value="low">Low</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
                        <select
                          value={filters.status}
                          onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                          className="w-full px-3 py-1 text-sm border border-gray-300 dark:border-slate-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
                        >
                          <option value="all">All Status</option>
                          <option value="todo">To Do</option>
                          <option value="done">Done</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Due Date</label>
                        <select
                          value={filters.dueDate}
                          onChange={(e) => setFilters(prev => ({ ...prev, dueDate: e.target.value }))}
                          className="w-full px-3 py-1 text-sm border border-gray-300 dark:border-slate-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
                        >
                          <option value="all">All Dates</option>
                          <option value="overdue">Overdue</option>
                          <option value="today">Due Today</option>
                          <option value="week">This Week</option>
                          <option value="none">No Due Date</option>
                        </select>
                      </div>
                      
                      <button
                        onClick={() => setFilters({ priority: 'all', status: 'all', dueDate: 'all', project: 'all' })}
                        className="w-full px-3 py-2 text-sm text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded transition-colors"
                      >
                        Clear Filters
                      </button>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Pomodoro Timer */}
              {pomodoroTimer.taskId && (
                <div className="flex items-center space-x-3 px-4 py-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <Timer className={`w-5 h-5 ${pomodoroTimer.isBreak ? 'text-green-600' : 'text-red-600'}`} />
                  <div className="text-sm">
                    <div className={`font-mono font-bold ${pomodoroTimer.isBreak ? 'text-green-700' : 'text-red-700'}`}>
                      {formatTime(pomodoroTimer.timeLeft)}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      {pomodoroTimer.isBreak ? 'Break time' : tasks.find(t => t.id === pomodoroTimer.taskId)?.title || 'Focus session'}
                    </div>
                  </div>
                  <div className="flex space-x-1">
                    <button
                      onClick={() => setPomodoroTimer(prev => ({ ...prev, isActive: !prev.isActive }))}
                      className={`p-1 rounded ${pomodoroTimer.isActive ? 'bg-red-200 text-red-800 hover:bg-red-300' : 'bg-green-200 text-green-800 hover:bg-green-300'} transition-colors`}
                    >
                      {pomodoroTimer.isActive ? <Pause size={14} /> : <Play size={14} />}
                    </button>
                    <button
                      onClick={resetPomodoro}
                      className="p-1 bg-gray-200 text-gray-700 hover:bg-gray-300 rounded transition-colors"
                    >
                      <Square size={14} />
                    </button>
                  </div>
                </div>
              )}
              
              <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 transition-colors rounded-md hover:bg-gray-100 dark:hover:bg-slate-700">
                <List size={18} />
              </button>
              <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 transition-colors rounded-md hover:bg-gray-100 dark:hover:bg-slate-700">
                <Grid3X3 size={18} />
              </button>
              <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 transition-colors rounded-md hover:bg-gray-100 dark:hover:bg-slate-700">
                <MoreHorizontal size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* Task List */}
        <div className="flex-1 overflow-y-auto bg-white dark:bg-slate-900">
          <div className="max-w-4xl mx-auto">
            {(() => {
              let tasksToShow = [];
              if (currentView === 'today') tasksToShow = applyFilters(getTodayTasks());
              else if (currentView === 'inbox') tasksToShow = applyFilters(getInboxTasks());
              else if (currentView === 'upcoming') tasksToShow = applyFilters(getUpcomingTasks());
              else if (currentView === 'calendar') {
                return (
                  <div className="p-6">
                    {/* Calendar Controls */}
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center space-x-4">
                        <button
                          onClick={() => {
                            if (calendarView === 'month') setCurrentDate(subMonths(currentDate, 1));
                            else if (calendarView === 'week') setCurrentDate(subWeeks(currentDate, 1));
                            else setCurrentDate(addDays(currentDate, -1));
                          }}
                          className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-md transition-colors"
                        >
                          <ChevronLeft className="w-5 h-5" />
                        </button>
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {calendarView === 'month' && format(currentDate, 'MMMM yyyy')}
                          {calendarView === 'week' && `${format(startOfWeek(currentDate), 'MMM d')} - ${format(endOfWeek(currentDate), 'MMM d, yyyy')}`}
                          {calendarView === 'day' && format(currentDate, 'EEEE, MMMM d, yyyy')}
                        </h2>
                        <button
                          onClick={() => {
                            if (calendarView === 'month') setCurrentDate(addMonths(currentDate, 1));
                            else if (calendarView === 'week') setCurrentDate(addWeeks(currentDate, 1));
                            else setCurrentDate(addDays(currentDate, 1));
                          }}
                          className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-md transition-colors"
                        >
                          <ChevronRight className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => setCurrentDate(new Date())}
                          className="px-3 py-1 text-sm bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-md transition-colors"
                        >
                          Today
                        </button>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setCalendarView('month')}
                          className={`px-3 py-1 text-sm rounded-md transition-colors ${
                            calendarView === 'month' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          Month
                        </button>
                        <button
                          onClick={() => setCalendarView('week')}
                          className={`px-3 py-1 text-sm rounded-md transition-colors ${
                            calendarView === 'week' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          Week
                        </button>
                        <button
                          onClick={() => setCalendarView('day')}
                          className={`px-3 py-1 text-sm rounded-md transition-colors ${
                            calendarView === 'day' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          Day
                        </button>
                      </div>
                    </div>

                    {/* Calendar Grid */}
                    {calendarView === 'month' && (
                      <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 overflow-hidden">
                        {/* Month Header */}
                        <div className="grid grid-cols-7 bg-gray-50 dark:bg-slate-700">
                          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                            <div key={day} className="p-3 text-center text-sm font-medium text-gray-700 dark:text-gray-300">
                              {day}
                            </div>
                          ))}
                        </div>
                        {/* Month Grid */}
                        <div className="grid grid-cols-7">
                          {eachDayOfInterval({
                            start: startOfWeek(startOfMonth(currentDate)),
                            end: endOfWeek(endOfMonth(currentDate))
                          }).map((day) => {
                            const dayTasks = tasks.filter(task => 
                              task.dueDate && isSameDay(task.dueDate, day) && task.status !== 'done'
                            );
                            const isCurrentMonth = isSameMonth(day, currentDate);
                            const isToday = isSameDay(day, new Date());
                            
                            return (
                              <div 
                                key={day.toISOString()} 
                                className={`min-h-24 p-2 border-b border-r border-gray-200 dark:border-slate-700 ${
                                  isCurrentMonth ? 'bg-white dark:bg-slate-800' : 'bg-gray-50 dark:bg-slate-900'
                                } ${
                                  isToday ? 'ring-2 ring-blue-500 ring-inset' : ''
                                }`}
                              >
                                <div className={`text-sm font-medium mb-1 ${
                                  isCurrentMonth ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-slate-500'
                                } ${
                                  isToday ? 'text-blue-600 dark:text-blue-400' : ''
                                }`}>
                                  {format(day, 'd')}
                                </div>
                                <div className="space-y-1">
                                  {dayTasks.slice(0, 3).map((task) => (
                                    <div 
                                      key={task.id} 
                                      className={`text-xs p-1 rounded truncate ${
                                        task.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                                        task.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                                        task.priority === 'medium' ? 'bg-blue-100 text-blue-800' :
                                        'bg-gray-100 text-gray-800'
                                      }`}
                                    >
                                      {task.title}
                                    </div>
                                  ))}
                                  {dayTasks.length > 3 && (
                                    <div className="text-xs text-gray-500 dark:text-slate-400">
                                      +{dayTasks.length - 3} more
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Week View */}
                    {calendarView === 'week' && (
                      <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 overflow-hidden">
                        <div className="grid grid-cols-8">
                          <div className="p-3 bg-gray-50 dark:bg-slate-700 border-r border-gray-200 dark:border-slate-700">
                            <div className="text-sm font-medium text-gray-700 dark:text-gray-300">Time</div>
                          </div>
                          {eachDayOfInterval({
                            start: startOfWeek(currentDate),
                            end: endOfWeek(currentDate)
                          }).map((day) => (
                            <div key={day.toISOString()} className="p-3 bg-gray-50 dark:bg-slate-700 border-r border-gray-200 dark:border-slate-700">
                              <div className="text-center">
                                <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                  {format(day, 'EEE')}
                                </div>
                                <div className={`text-lg font-bold ${
                                  isSameDay(day, new Date()) ? 'text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-white'
                                }`}>
                                  {format(day, 'd')}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="grid grid-cols-8 min-h-96">
                          {/* Time slots */}
                          <div className="border-r border-gray-200 dark:border-slate-700">
                            {Array.from({ length: 24 }, (_, i) => (
                              <div key={i} className="h-12 p-2 border-b border-gray-200 dark:border-slate-700 text-xs text-gray-500">
                                {format(new Date().setHours(i, 0), 'HH:mm')}
                              </div>
                            ))}
                          </div>
                          {/* Day columns */}
                          {eachDayOfInterval({
                            start: startOfWeek(currentDate),
                            end: endOfWeek(currentDate)
                          }).map((day) => {
                            const dayTasks = tasks.filter(task => 
                              task.dueDate && isSameDay(task.dueDate, day) && task.status !== 'done'
                            );
                            return (
                              <div key={day.toISOString()} className="border-r border-gray-200 dark:border-slate-700">
                                {Array.from({ length: 24 }, (_, i) => (
                                  <div key={i} className="h-12 border-b border-gray-200 dark:border-slate-700 p-1">
                                    {dayTasks.map((task) => (
                                      <div 
                                        key={task.id}
                                        className={`text-xs p-1 rounded mb-1 truncate ${
                                          task.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                                          task.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                                          task.priority === 'medium' ? 'bg-blue-100 text-blue-800' :
                                          'bg-gray-100 text-gray-800'
                                        }`}
                                      >
                                        {task.title}
                                      </div>
                                    ))}
                                  </div>
                                ))}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Day View */}
                    {calendarView === 'day' && (
                      <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 overflow-hidden">
                        <div className="p-4 border-b border-gray-200 dark:border-slate-700">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {format(currentDate, 'EEEE, MMMM d, yyyy')}
                          </h3>
                        </div>
                        <div className="flex">
                          <div className="w-20 border-r border-gray-200 dark:border-slate-700">
                            {Array.from({ length: 24 }, (_, i) => (
                              <div key={i} className="h-16 p-2 border-b border-gray-200 dark:border-slate-700 text-xs text-gray-500">
                                {format(new Date().setHours(i, 0), 'HH:mm')}
                              </div>
                            ))}
                          </div>
                          <div className="flex-1">
                            {Array.from({ length: 24 }, (_, i) => {
                              const dayTasks = tasks.filter(task => 
                                task.dueDate && isSameDay(task.dueDate, currentDate) && task.status !== 'done'
                              );
                              return (
                                <div key={i} className="h-16 border-b border-gray-200 dark:border-slate-700 p-2">
                                  {dayTasks.map((task) => (
                                    <div 
                                      key={task.id}
                                      className={`text-sm p-2 rounded mb-2 ${
                                        task.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                                        task.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                                        task.priority === 'medium' ? 'bg-blue-100 text-blue-800' :
                                        'bg-gray-100 text-gray-800'
                                      }`}
                                    >
                                      <div className="font-medium">{task.title}</div>
                                      {task.description && (
                                        <div className="text-xs mt-1 opacity-75">{task.description}</div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              }
              else if (currentView === 'kanban') {
                const kanbanColumns = [
                  { id: 'todo', title: 'To Do', tasks: tasks.filter(t => t.status === 'todo' && (selectedProject === 'all' || t.projectId === selectedProject)) },
                  { id: 'in_progress', title: 'In Progress', tasks: [] }, // Add in_progress status later
                  { id: 'done', title: 'Done', tasks: tasks.filter(t => t.status === 'done' && (selectedProject === 'all' || t.projectId === selectedProject)) }
                ];
                
                return (
                  <div className="p-6">
                    <div className="grid grid-cols-3 gap-6 h-full">
                      {kanbanColumns.map((column) => (
                        <div key={column.id} className="bg-gray-50 dark:bg-slate-800 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold text-gray-900 dark:text-white">{column.title}</h3>
                            <span className="bg-gray-200 dark:bg-slate-600 text-gray-700 dark:text-gray-300 px-2 py-1 rounded-full text-xs font-medium">
                              {column.tasks.length}
                            </span>
                          </div>
                          <div className="space-y-3 max-h-96 overflow-y-auto">
                            {column.tasks.map((task) => {
                              const project = projects.find(p => p.id === task.projectId);
                              return (
                                <div 
                                  key={task.id}
                                  className="bg-white dark:bg-slate-700 p-3 rounded-lg shadow-sm border border-gray-200 dark:border-slate-600 cursor-pointer hover:shadow-md transition-shadow"
                                >
                                  <div className="flex items-start space-x-3">
                                    <button
                                      onClick={() => toggleTaskStatus(task.id)}
                                      className={`mt-0.5 w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${
                                        task.status === 'done'
                                          ? 'bg-blue-500 border-blue-500 text-white'
                                          : (() => {
                                              switch (task.priority) {
                                                case 'urgent': return 'border-red-400 hover:border-red-500';
                                                case 'high': return 'border-orange-400 hover:border-orange-500';
                                                case 'medium': return 'border-blue-400 hover:border-blue-500';
                                                default: return 'border-gray-300 hover:border-gray-400';
                                              }
                                            })()
                                      }`}
                                    >
                                      {task.status === 'done' && <CheckCircle2 size={10} />}
                                    </button>
                                    <div className="flex-1 min-w-0">
                                      <div className="font-medium text-gray-900 dark:text-white text-sm mb-1">
                                        {task.title}
                                      </div>
                                      {task.description && (
                                        <div className="text-xs text-gray-600 dark:text-slate-400 mb-2">
                                          {task.description}
                                        </div>
                                      )}
                                      <div className="flex items-center space-x-2 text-xs">
                                        {task.priority !== 'low' && (
                                          <span className={`px-2 py-0.5 rounded-full font-medium ${
                                            task.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                                            task.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                                            'bg-blue-100 text-blue-800'
                                          }`}>
                                            {task.priority}
                                          </span>
                                        )}
                                        {task.dueDate && (
                                          <span className={`flex items-center space-x-1 px-2 py-0.5 rounded ${
                                            isToday(task.dueDate) ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                                          }`}>
                                            <CalendarDays size={10} />
                                            <span>{isToday(task.dueDate) ? 'Today' : format(task.dueDate, 'MMM d')}</span>
                                          </span>
                                        )}
                                        {project && (
                                          <span className="flex items-center space-x-1 px-2 py-0.5 bg-gray-100 dark:bg-slate-600 rounded">
                                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: project.color }}></div>
                                            <span className="text-gray-700 dark:text-gray-300">{project.name}</span>
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                            {column.tasks.length === 0 && (
                              <div className="text-center py-8 text-gray-400 dark:text-slate-500">
                                <div className="text-3xl mb-2">📋</div>
                                <p className="text-sm">No tasks in {column.title.toLowerCase()}</p>
                              </div>
                            )}
                          </div>
                          {/* Add task button for each column */}
                          <div className="mt-4">
                            <button 
                              onClick={() => setShowQuickAdd(true)}
                              className="w-full flex items-center justify-center space-x-2 p-2 text-gray-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-700 rounded-lg border-2 border-dashed border-gray-300 dark:border-slate-600 transition-colors"
                            >
                              <Plus size={16} />
                              <span className="text-sm">Add task</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              }
              else if (currentView === 'timeline') {
                const timelineTasks = tasks.filter(t => t.dueDate && (selectedProject === 'all' || t.projectId === selectedProject))
                  .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime());
                
                const startDate = timelineTasks.length > 0 ? new Date(Math.min(...timelineTasks.map(t => new Date(t.dueDate!).getTime()))) : new Date();
                const endDate = timelineTasks.length > 0 ? new Date(Math.max(...timelineTasks.map(t => new Date(t.dueDate!).getTime()))) : addDays(new Date(), 30);
                const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
                
                return (
                  <div className="p-6">
                    <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 overflow-x-auto">
                      {/* Timeline Header */}
                      <div className="flex border-b border-gray-200 dark:border-slate-700">
                        <div className="w-64 p-4 bg-gray-50 dark:bg-slate-700 font-semibold text-gray-900 dark:text-white border-r border-gray-200 dark:border-slate-600">
                          Task
                        </div>
                        <div className="flex-1 flex">
                          {Array.from({ length: Math.min(totalDays, 30) }, (_, i) => {
                            const date = addDays(startDate, i);
                            return (
                              <div key={i} className="w-20 p-2 border-r border-gray-200 dark:border-slate-600 text-center">
                                <div className="text-xs text-gray-600 dark:text-slate-400">{format(date, 'MMM')}</div>
                                <div className={`text-sm font-medium ${
                                  isSameDay(date, new Date()) ? 'text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-white'
                                }`}>
                                  {format(date, 'd')}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                      
                      {/* Timeline Rows */}
                      <div className="divide-y divide-gray-200 dark:divide-slate-700">
                        {timelineTasks.map((task) => {
                          const project = projects.find(p => p.id === task.projectId);
                          const taskStart = new Date(task.dueDate!);
                          const dayOffset = Math.floor((taskStart.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
                          const estimatedDays = Math.ceil(task.estimatedTime / (8 * 60)); // 8 hours per day
                          
                          return (
                            <div key={task.id} className="flex items-center hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
                              <div className="w-64 p-4 border-r border-gray-200 dark:border-slate-600">
                                <div className="flex items-center space-x-3">
                                  <button
                                    onClick={() => toggleTaskStatus(task.id)}
                                    className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${
                                      task.status === 'done'
                                        ? 'bg-blue-500 border-blue-500 text-white'
                                        : (() => {
                                            switch (task.priority) {
                                              case 'urgent': return 'border-red-400 hover:border-red-500';
                                              case 'high': return 'border-orange-400 hover:border-orange-500';
                                              case 'medium': return 'border-blue-400 hover:border-blue-500';
                                              default: return 'border-gray-300 hover:border-gray-400';
                                            }
                                          })()
                                    }`}
                                  >
                                    {task.status === 'done' && <CheckCircle2 size={10} />}
                                  </button>
                                  <div className="flex-1 min-w-0">
                                    <div className="font-medium text-gray-900 dark:text-white text-sm truncate">{task.title}</div>
                                    {project && (
                                      <div className="flex items-center space-x-1 mt-1">
                                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: project.color }}></div>
                                        <span className="text-xs text-gray-500 dark:text-slate-400">{project.name}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="flex-1 relative h-16 flex items-center">
                                <div 
                                  className={`absolute h-6 rounded-md flex items-center px-2 text-xs font-medium text-white ${
                                    task.priority === 'urgent' ? 'bg-red-500' :
                                    task.priority === 'high' ? 'bg-orange-500' :
                                    task.priority === 'medium' ? 'bg-blue-500' :
                                    'bg-gray-500'
                                  } ${
                                    task.status === 'done' ? 'opacity-50' : ''
                                  }`}
                                  style={{
                                    left: `${Math.max(0, dayOffset * 80)}px`,
                                    width: `${Math.max(80, estimatedDays * 80)}px`
                                  }}
                                >
                                  <span className="truncate">{task.title}</span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                        {timelineTasks.length === 0 && (
                          <div className="text-center py-12">
                            <BarChart3 className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                            <p className="text-gray-500 dark:text-slate-400">No tasks with due dates to display</p>
                            <p className="text-sm text-gray-400 dark:text-slate-500 mt-1">Add due dates to your tasks to see them in timeline view</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              }
              else if (currentView === 'matrix') {
                const getMatrixCategory = (task: Task) => {
                  const isUrgent = task.priority === 'urgent' || (task.dueDate && isToday(task.dueDate)) || (task.dueDate && isPast(task.dueDate));
                  const isImportant = task.priority === 'urgent' || task.priority === 'high';
                  
                  if (isUrgent && isImportant) return 'do';
                  if (!isUrgent && isImportant) return 'schedule';
                  if (isUrgent && !isImportant) return 'delegate';
                  return 'eliminate';
                };
                
                const matrixTasks = tasks.filter(t => t.status !== 'done' && (selectedProject === 'all' || t.projectId === selectedProject));
                const matrix = {
                  do: { title: 'Do First', subtitle: 'Urgent & Important', color: 'bg-red-50 border-red-200', tasks: matrixTasks.filter(t => getMatrixCategory(t) === 'do') },
                  schedule: { title: 'Schedule', subtitle: 'Important, Not Urgent', color: 'bg-blue-50 border-blue-200', tasks: matrixTasks.filter(t => getMatrixCategory(t) === 'schedule') },
                  delegate: { title: 'Delegate', subtitle: 'Urgent, Not Important', color: 'bg-yellow-50 border-yellow-200', tasks: matrixTasks.filter(t => getMatrixCategory(t) === 'delegate') },
                  eliminate: { title: 'Eliminate', subtitle: 'Neither Urgent nor Important', color: 'bg-gray-50 border-gray-200', tasks: matrixTasks.filter(t => getMatrixCategory(t) === 'eliminate') }
                };
                
                return (
                  <div className="p-6">
                    <div className="mb-6">
                      <div className="bg-blue-50 dark:bg-slate-800 border border-blue-200 dark:border-slate-600 rounded-lg p-4">
                        <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">Eisenhower Matrix</h3>
                        <p className="text-blue-700 dark:text-blue-300 text-sm">
                          Organize your tasks by urgency and importance to prioritize what matters most.
                        </p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-6 h-96">
                      {Object.entries(matrix).map(([key, quadrant]) => (
                        <div key={key} className={`${quadrant.color} dark:bg-slate-800 dark:border-slate-600 border rounded-lg p-4 flex flex-col`}>
                          <div className="mb-4">
                            <h3 className="font-semibold text-gray-900 dark:text-white">{quadrant.title}</h3>
                            <p className="text-sm text-gray-600 dark:text-slate-400">{quadrant.subtitle}</p>
                            <span className="inline-block mt-2 bg-white dark:bg-slate-700 px-2 py-1 rounded-full text-xs font-medium text-gray-700 dark:text-gray-300">
                              {quadrant.tasks.length} tasks
                            </span>
                          </div>
                          
                          <div className="flex-1 space-y-3 overflow-y-auto">
                            {quadrant.tasks.map((task) => {
                              const project = projects.find(p => p.id === task.projectId);
                              return (
                                <div key={task.id} className="bg-white dark:bg-slate-700 p-3 rounded-lg shadow-sm border border-gray-200 dark:border-slate-600">
                                  <div className="flex items-start space-x-3">
                                    <button
                                      onClick={() => toggleTaskStatus(task.id)}
                                      className={`mt-0.5 w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${
                                        task.status === 'done'
                                          ? 'bg-blue-500 border-blue-500 text-white'
                                          : (() => {
                                              switch (task.priority) {
                                                case 'urgent': return 'border-red-400 hover:border-red-500';
                                                case 'high': return 'border-orange-400 hover:border-orange-500';
                                                case 'medium': return 'border-blue-400 hover:border-blue-500';
                                                default: return 'border-gray-300 hover:border-gray-400';
                                              }
                                            })()
                                      }`}
                                    >
                                      {task.status === 'done' && <CheckCircle2 size={10} />}
                                    </button>
                                    <div className="flex-1 min-w-0">
                                      <div className="font-medium text-gray-900 dark:text-white text-sm mb-1">
                                        {task.title}
                                      </div>
                                      {task.description && (
                                        <div className="text-xs text-gray-600 dark:text-slate-400 mb-2">
                                          {task.description}
                                        </div>
                                      )}
                                      <div className="flex items-center space-x-2 text-xs">
                                        {task.priority !== 'low' && (
                                          <span className={`px-2 py-0.5 rounded-full font-medium ${
                                            task.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                                            task.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                                            'bg-blue-100 text-blue-800'
                                          }`}>
                                            {task.priority}
                                          </span>
                                        )}
                                        {task.dueDate && (
                                          <span className={`flex items-center space-x-1 px-2 py-0.5 rounded ${
                                            isPast(task.dueDate) ? 'bg-red-100 text-red-800' :
                                            isToday(task.dueDate) ? 'bg-orange-100 text-orange-800' :
                                            'bg-gray-100 text-gray-600'
                                          }`}>
                                            <CalendarDays size={10} />
                                            <span>
                                              {isPast(task.dueDate) ? 'Overdue' :
                                               isToday(task.dueDate) ? 'Today' : 
                                               format(task.dueDate, 'MMM d')}
                                            </span>
                                          </span>
                                        )}
                                        {project && (
                                          <span className="flex items-center space-x-1 px-2 py-0.5 bg-gray-100 dark:bg-slate-600 rounded">
                                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: project.color }}></div>
                                            <span className="text-gray-700 dark:text-gray-300">{project.name}</span>
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                            {quadrant.tasks.length === 0 && (
                              <div className="text-center py-6 text-gray-400 dark:text-slate-500">
                                <div className="text-2xl mb-2">🎆</div>
                                <p className="text-sm">No tasks here</p>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              }
              else if (selectedProject !== 'all') tasksToShow = applyFilters(tasks.filter(t => t.projectId === selectedProject && t.status !== 'done'));
              
              return (
                <div className="py-4">
                  {getMainTasks(tasksToShow).map((task) => {
                    const project = projects.find(p => p.id === task.projectId);
                    const taskIsOverdue = task.dueDate && isOverdue(task.dueDate, task.status);
                    const subtasks = getSubtasks(task.id);
                    const isExpanded = expandedTasks.has(task.id);
                    
                    return (
                      <div key={task.id} className="mb-2">
                        <div className="group flex items-start px-6 py-3 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors">
                          {/* Expand/Collapse button for tasks with subtasks */}
                          {subtasks.length > 0 && (
                            <button
                              onClick={() => toggleTaskExpansion(task.id)}
                              className="p-1 mr-2 hover:bg-gray-200 dark:hover:bg-slate-600 rounded transition-colors"
                            >
                              {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                            </button>
                          )}
                          {subtasks.length === 0 && <div className="w-6"></div>}
                        {/* Checkbox */}
                        <button
                          onClick={() => toggleTaskStatus(task.id)}
                          className={`mt-1 mr-4 w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                            task.status === 'done'
                              ? 'bg-blue-500 border-blue-500 text-white'
                              : (() => {
                                  switch (task.priority) {
                                    case 'urgent': return 'border-red-400 hover:border-red-500 hover:bg-red-50 dark:hover:bg-red-900/20';
                                    case 'high': return 'border-orange-400 hover:border-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20';
                                    case 'medium': return 'border-blue-400 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20';
                                    default: return 'border-gray-300 hover:border-gray-400 hover:bg-gray-50 dark:border-slate-600 dark:hover:bg-slate-700';
                                  }
                                })()
                          }`}
                        >
                          {task.status === 'done' && <CheckCircle2 size={12} />}
                        </button>

                        {/* Task Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-2">
                            {editingTask === task.id ? (
                              <input
                                type="text"
                                value={editTaskText}
                                onChange={(e) => setEditTaskText(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') saveTaskEdit(task.id);
                                  if (e.key === 'Escape') cancelTaskEdit();
                                }}
                                onBlur={() => saveTaskEdit(task.id)}
                                className="flex-1 text-sm bg-transparent border-none outline-none focus:bg-white dark:focus:bg-slate-700 rounded px-2 py-1"
                                autoFocus
                              />
                            ) : (
                              <span 
                                className={`text-base cursor-pointer font-normal ${task.status === 'done' ? 'line-through text-gray-400' : 'text-gray-800 dark:text-white'} hover:bg-gray-100 dark:hover:bg-slate-700 rounded px-2 py-1 -mx-2`}
                                onClick={() => startEditingTask(task)}
                              >
                                {task.title}
                              </span>
                            )}
                            
                            {/* Priority flag */}
                            {task.priority !== 'low' && getTodoistPriorityFlag(task.priority)}
                          </div>
                          
                          {/* Task metadata */}
                          {(task.description || task.dueDate || project || task.tags.length > 0) && (
                            <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-slate-400 ml-2">
                              {task.description && (
                                <span className="truncate max-w-xs text-gray-600 dark:text-slate-400">{task.description}</span>
                              )}
                              
                              {task.dueDate && (
                                <span className={`flex items-center space-x-1.5 px-2 py-1 rounded ${taskIsOverdue ? 'text-red-600 bg-red-50' : 'text-green-600 bg-green-50'}`}>
                                  <CalendarDays size={12} />
                                  <span className="font-medium">
                                    {isToday(task.dueDate) ? 'Today' : 
                                     format(task.dueDate, 'MMM d')}
                                  </span>
                                </span>
                              )}
                              
                              {project && (
                                <span className="flex items-center space-x-1.5 px-2 py-1 bg-gray-100 dark:bg-slate-700 rounded">
                                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: project.color }}></div>
                                  <span className="text-gray-700 dark:text-gray-300 font-medium">{project.name}</span>
                                </span>
                              )}
                              
                              {task.tags.map((tag, index) => (
                                <span 
                                  key={index} 
                                  className="inline-flex items-center px-2 py-1 rounded bg-blue-50 dark:bg-slate-700 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-slate-600 transition-colors"
                                >
                                  <span className="text-blue-500 mr-1 text-xs">#</span>
                                  <span className="font-medium">{tag}</span>
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                          {/* Actions */}
                          <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity ml-3">
                            <button
                              onClick={() => setShowSubtaskForm(task.id)}
                              className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-md text-gray-400 hover:text-gray-600 dark:text-slate-400 transition-colors"
                              title="Add Subtask"
                            >
                              <IndentIncrease size={14} />
                            </button>
                            <button
                              onClick={() => startPomodoro(task.id)}
                              className={`p-1.5 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-md transition-colors ${
                                pomodoroTimer.taskId === task.id ? 'text-red-600 bg-red-100' : 'text-gray-400 hover:text-gray-600'
                              } dark:text-slate-400`}
                              title="Start Pomodoro"
                            >
                              <Timer size={14} />
                            </button>
                            <button
                              onClick={() => startEditingTask(task)}
                              className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-md text-gray-400 hover:text-gray-600 dark:text-slate-400 transition-colors"
                              title="Edit"
                            >
                              <Edit size={14} />
                            </button>
                            <button className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-md text-gray-400 hover:text-gray-600 dark:text-slate-400 transition-colors">
                              <MoreHorizontal size={14} />
                            </button>
                          </div>
                        </div>

                        {/* Subtask form */}
                        {showSubtaskForm === task.id && (
                          <div className="px-6 pb-3">
                            <div className="ml-10 flex items-center space-x-2">
                              <input
                                type="text"
                                value={subtaskText}
                                onChange={(e) => setSubtaskText(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') addSubtask(task.id);
                                  if (e.key === 'Escape') { setShowSubtaskForm(null); setSubtaskText(''); }
                                }}
                                placeholder="Subtask name"
                                className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
                                autoFocus
                              />
                              <button
                                onClick={() => addSubtask(task.id)}
                                className="px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md text-sm transition-colors"
                              >
                                Add
                              </button>
                              <button
                                onClick={() => { setShowSubtaskForm(null); setSubtaskText(''); }}
                                className="px-3 py-2 text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-md text-sm transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Subtasks */}
                        {isExpanded && subtasks.length > 0 && (
                          <div className="ml-10 border-l-2 border-gray-200 dark:border-slate-600 pl-4">
                            {subtasks.map((subtask) => {
                              const subtaskProject = projects.find(p => p.id === subtask.projectId);
                              return (
                                <div key={subtask.id} className="group flex items-start py-2 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors rounded-md px-2">
                                  <button
                                    onClick={() => toggleTaskStatus(subtask.id)}
                                    className={`mt-1 mr-3 w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${
                                      subtask.status === 'done'
                                        ? 'bg-blue-500 border-blue-500 text-white'
                                        : (() => {
                                            switch (subtask.priority) {
                                              case 'urgent': return 'border-red-400 hover:border-red-500';
                                              case 'high': return 'border-orange-400 hover:border-orange-500';
                                              case 'medium': return 'border-blue-400 hover:border-blue-500';
                                              default: return 'border-gray-300 hover:border-gray-400';
                                            }
                                          })()
                                    }`}
                                  >
                                    {subtask.status === 'done' && <CheckCircle2 size={8} />}
                                  </button>
                                  <div className="flex-1 min-w-0">
                                    <span className={`text-sm ${subtask.status === 'done' ? 'line-through text-gray-400' : 'text-gray-700 dark:text-gray-300'}`}>
                                      {subtask.title}
                                    </span>
                                  </div>
                                  <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                      onClick={() => startEditingTask(subtask)}
                                      className="p-1 hover:bg-gray-200 dark:hover:bg-slate-700 rounded text-gray-400 hover:text-gray-600 transition-colors"
                                    >
                                      <Edit size={12} />
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Empty state */}
                  {tasksToShow.length === 0 && (
                    <div className="text-center py-16 px-6">
                      <div className="text-gray-400 dark:text-slate-500 mb-6">
                        {currentView === 'today' && (
                          <div className="space-y-3">
                            <Sun className="w-12 h-12 mx-auto text-orange-300" />
                            <p className="text-lg font-medium">What do you need to get done today?</p>
                            <p className="text-sm">Add a task to get started</p>
                          </div>
                        )}
                        {currentView === 'inbox' && (
                          <div className="space-y-3">
                            <Inbox className="w-12 h-12 mx-auto text-blue-300" />
                            <p className="text-lg font-medium">All clear!</p>
                            <p className="text-sm">All your tasks are organized</p>
                          </div>
                        )}
                        {currentView === 'upcoming' && (
                          <div className="space-y-3">
                            <ArrowRight className="w-12 h-12 mx-auto text-green-300" />
                            <p className="text-lg font-medium">No upcoming tasks</p>
                            <p className="text-sm">Enjoy your free time!</p>
                          </div>
                        )}
                        {currentView === 'calendar' && (
                          <div className="space-y-3">
                            <CalendarDays className="w-12 h-12 mx-auto text-purple-300" />
                            <p className="text-lg font-medium">Calendar view</p>
                            <p className="text-sm">See your tasks in calendar format</p>
                          </div>
                        )}
                        {currentView === 'kanban' && (
                          <div className="space-y-3">
                            <Grid className="w-12 h-12 mx-auto text-indigo-300" />
                            <p className="text-lg font-medium">Kanban board</p>
                            <p className="text-sm">Organize tasks by status</p>
                          </div>
                        )}
                        {currentView === 'timeline' && (
                          <div className="space-y-3">
                            <BarChart3 className="w-12 h-12 mx-auto text-emerald-300" />
                            <p className="text-lg font-medium">Timeline view</p>
                            <p className="text-sm">Visualize task schedules</p>
                          </div>
                        )}
                        {currentView === 'matrix' && (
                          <div className="space-y-3">
                            <Layers className="w-12 h-12 mx-auto text-rose-300" />
                            <p className="text-lg font-medium">Eisenhower Matrix</p>
                            <p className="text-sm">Prioritize by urgency and importance</p>
                          </div>
                        )}
                        {selectedProject !== 'all' && (
                          <div className="space-y-3">
                            <List className="w-12 h-12 mx-auto text-gray-300" />
                            <p className="text-lg font-medium">This list is empty</p>
                            <p className="text-sm">Add a task to get started</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Quick add at bottom */}
                  <div className="px-6 py-4 border-t border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-800">
                    {!showQuickAdd ? (
                      <button
                        onClick={() => {
                          alert('Bottom Add task clicked!');
                          setShowQuickAdd(true);
                        }}
                        className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 transition-colors text-sm font-medium"
                      >
                        <Plus size={16} />
                        <span>Add task</span>
                      </button>
                    ) : (
                      <div className="space-y-3">
                        <input
                          type="text"
                          value={quickAddText}
                          onChange={(e) => setQuickAddText(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') quickAddTask();
                            if (e.key === 'Escape') { setShowQuickAdd(false); setQuickAddText(''); }
                          }}
                          placeholder="What needs to be done?"
                          className="w-full px-4 py-3 text-sm border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-white"
                          autoFocus
                        />
                        <div className="flex items-center space-x-3">
                          <button
                            onClick={() => {
                              alert('Button clicked!');
                              quickAddTask();
                            }}
                            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-colors font-medium"
                          >
                            Add task
                          </button>
                          <button
                            onClick={() => { setShowQuickAdd(false); setQuickAddText(''); }}
                            className="px-4 py-2 text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-md transition-colors"
                          >
                            Cancel
                          </button>
                          <span className="text-gray-500 dark:text-slate-400 text-xs">
                            Try natural language like "Call mom today"
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      </div>
    </div>
  );
}