/**
 * Tasks Component - Migrated to React Query
 *
 * Before: Used hybrid approach with useAppStore + useApiTasks
 * After: Uses React Query hooks for all server state
 *
 * Server State (React Query):
 * - Tasks data loading and caching
 * - Projects data loading and caching
 * - Create/Update/Delete mutations
 *
 * Client State (useState):
 * - UI state (current view, search, filters)
 * - Form state (quick add, editing)
 * - Ephemeral state (expanded tasks, pomodoro timer)
 */

import React, { useState, useMemo } from 'react';
import { useApiHealth } from '../hooks/useApiHealth';
import {
  useTasks,
  useProjects,
  useCreateTask,
  useUpdateTask,
  useDeleteTask,
} from '../hooks/useTasksQuery';
import type { TaskData } from '../services/types';
import {
  Plus,
  CheckSquare,
  Archive,
  Search,
  MoreHorizontal,
  Edit,
  Play,
  CheckCircle2,
  ChevronDown,
  Filter,
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
  IndentIncrease,
  ChevronRight as ChevronRightIcon
} from 'lucide-react';
import { format, isToday, isPast, addDays, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, isSameMonth, addWeeks, subWeeks, addMonths, subMonths } from 'date-fns';
import { SkeletonCard } from '../components/LoadingSpinner';
import type { Task, Project, Filters, PomodoroTimer, ViewType } from '../todos/types';
import { THEMES, PRIORITY_FLAGS, DEFAULT_TASK_ESTIMATED_TIME, POMODORO_WORK_TIME, POMODORO_BREAK_TIME } from '../todos/constants';
import { applyFilters } from '../todos/services/taskFilters';
import {
  isSFHTask,
  getTodayTasks,
  getUpcomingTasks,
  getInboxTasks,
  isOverdue,
  getSubtasks,
  getMainTasks,
  parseQuickAdd,
  formatTime
} from '../todos/services/taskHelpers';
import { TaskItem } from '../todos/components/TaskItem';
import { KanbanView } from '../todos/components/KanbanView';
import { MatrixView } from '../todos/components/MatrixView';

export default function Todos() {
  // React Query hooks - automatic loading and caching
  const { data: apiTasks = [], isLoading: tasksLoading, error: tasksError } = useTasks();
  const { data: apiProjects = [], isLoading: projectsLoading } = useProjects();

  const createTaskMutation = useCreateTask();
  const updateTaskMutation = useUpdateTask();
  const deleteTaskMutation = useDeleteTask();

  // Enhanced API health monitoring
  const apiHealth = useApiHealth(15000); // Check every 15 seconds

  // State - All UI state (not server state)
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
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  const [activeSubtaskForm, setActiveSubtaskForm] = useState<string | null>(null);
  const [subtaskDrafts, setSubtaskDrafts] = useState<Record<string, string>>({});
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    priority: 'all',
    status: 'all',
    dueDate: 'all',
    project: 'all'
  });
  const [currentTheme, setCurrentTheme] = useState('blue');

  // Transform API tasks to local Task format, excluding 75 Hard tasks
  const tasks: Task[] = useMemo(() => {
    return apiTasks
      .filter(task => !isSFHTask(task))
      .map(task => ({
        id: task.id!,
        title: task.title,
        description: task.description || undefined,
        priority: task.priority,
        status: task.status,
        estimatedTime: task.estimated_time || 30,
        actualTime: task.actual_time || 0,
        dueDate: task.due_date ? new Date(task.due_date) : undefined,
        projectId: task.project_id || undefined,
        tags: task.tags || [],
        category: task.category,
        createdAt: new Date(task.created_at!),
        completedAt: task.completed_at ? new Date(task.completed_at) : undefined,
        parentId: task.parent_id || undefined
      }));
  }, [apiTasks]);

  // Transform API projects to local Project format
  const projects: Project[] = useMemo(() => {
    return apiProjects.map(project => ({
      id: project.id!,
      name: project.name,
      description: project.description || undefined,
      color: project.color || '#3b82f6',
      status: project.status
    }));
  }, [apiProjects]);

  // Helper functions
  const quickAddTask = async () => {
    if (!quickAddText.trim()) return;

    const parsed = parseQuickAdd(quickAddText, projects);

    createTaskMutation.mutate({
      title: parsed.title,
      description: '',
      priority: parsed.priority,
      status: 'todo',
      estimated_time: 25,
      actual_time: 0,
      due_date: parsed.dueDate ? parsed.dueDate.toISOString() : null,
      project_id: parsed.projectId || null,
      tags: parsed.tags,
      category: 'work'
    }, {
      onSuccess: () => {
        setQuickAddText('');
        setShowQuickAdd(false);
      }
    });
  };

  const toggleTaskStatus = async (taskId: string) => {
    const task = apiTasks.find(t => t.id === taskId);
    if (task) {
      updateTaskMutation.mutate({
        id: taskId,
        updates: {
          status: task.status === 'done' ? 'todo' : 'done',
          completed_at: task.status === 'done' ? null : new Date().toISOString()
        }
      });
    }
  };

  const startEditingTask = (task: Task) => {
    setEditingTask(task.id);
    setEditTaskText(task.title);
  };

  const saveTaskEdit = async (taskId: string) => {
    if (editTaskText.trim()) {
      const parsed = parseQuickAdd(editTaskText);
      const currentTask = apiTasks.find(t => t.id === taskId);
      if (currentTask) {
        updateTaskMutation.mutate({
          id: taskId,
          updates: {
            title: parsed.title,
            priority: parsed.priority,
            due_date: parsed.dueDate ? parsed.dueDate.toISOString() : currentTask.due_date,
            project_id: parsed.projectId || currentTask.project_id,
            tags: parsed.tags.length > 0 ? parsed.tags : currentTask.tags
          }
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

  const startPomodoro = (taskId: string) => {
    setPomodoroTimer({ taskId, timeLeft: POMODORO_WORK_TIME, isActive: true, isBreak: false });
  };

  const resetPomodoro = () => {
    setPomodoroTimer({ taskId: null, timeLeft: POMODORO_WORK_TIME, isActive: false, isBreak: false });
  };

  React.useEffect(() => {
    let interval: NodeJS.Timeout;
    if (pomodoroTimer.isActive && pomodoroTimer.timeLeft > 0) {
      interval = setInterval(() => {
        setPomodoroTimer(prev => ({ ...prev, timeLeft: prev.timeLeft - 1 }));
      }, 1000);
    } else if (pomodoroTimer.isActive && pomodoroTimer.timeLeft === 0) {
      if (!pomodoroTimer.isBreak) {
        setPomodoroTimer(prev => ({ ...prev, timeLeft: POMODORO_BREAK_TIME, isBreak: true }));
      } else {
        setPomodoroTimer({ taskId: null, timeLeft: POMODORO_WORK_TIME, isActive: false, isBreak: false });
      }
    }
    return () => clearInterval(interval);
  }, [pomodoroTimer.isActive, pomodoroTimer.timeLeft, pomodoroTimer.isBreak]);

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

  const addSubtask = async (parentId: string) => {
    const draft = (subtaskDrafts[parentId] || '').trim();
    if (!draft) return;

    createTaskMutation.mutate({
      title: draft,
      description: '',
      priority: 'medium',
      status: 'todo',
      estimated_time: 25,
      actual_time: 0,
      tags: [],
      category: 'work',
      parent_id: parentId,
      due_date: null,
      project_id: null
    }, {
      onSuccess: () => {
        setSubtaskDrafts(prev => ({ ...prev, [parentId]: '' }));
        setActiveSubtaskForm(null);
      }
    });
  };


  // Show loading state
  if (tasksLoading || projectsLoading) {
    return (
      <div className="h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="space-y-4 w-full max-w-2xl px-6">
          <SkeletonCard className="h-32" />
          <SkeletonCard className="h-24" />
          <SkeletonCard className="h-24" />
        </div>
      </div>
    );
  }

  // Show error state
  if (tasksError) {
    return (
      <div className="h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 max-w-md">
          <h3 className="text-lg font-semibold text-red-900 mb-2">Error Loading Tasks</h3>
          <p className="text-sm text-red-700 mb-4">
            Unable to load your tasks. Please try refreshing the page.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

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
                disabled={createTaskMutation.isPending}
                autoFocus
              />
              <div className="flex space-x-2">
                <button
                  onClick={quickAddTask}
                  disabled={createTaskMutation.isPending}
                  className="px-4 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-md text-sm transition-colors font-medium disabled:opacity-50"
                >
                  {createTaskMutation.isPending ? 'Adding...' : 'Add'}
                </button>
                <button
                  onClick={() => { setShowQuickAdd(false); setQuickAddText(''); }}
                  disabled={createTaskMutation.isPending}
                  className="px-4 py-1.5 text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-md text-sm transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
              {createTaskMutation.isError && (
                <p className="text-xs text-red-600">Failed to create task. Please try again.</p>
              )}
            </div>
          ) : (
            <button
              onClick={() => setShowQuickAdd(true)}
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
                  {getInboxTasks(tasks).length}
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
                  {getTodayTasks(tasks).length}
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
                  {getUpcomingTasks(tasks).length}
                </span>
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
                {currentView === 'kanban' && (
                  <>
                    <Grid className="w-6 h-6 text-indigo-500" />
                    <span>Kanban</span>
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
                {currentView === 'kanban' && 'Organize tasks in columns by status'}
                {currentView === 'matrix' && 'Prioritize tasks using the Eisenhower Matrix'}
                {selectedProject !== 'all' && projects.find(p => p.id === selectedProject)?.description}
              </p>
            </div>

            <div className="flex items-center space-x-4">
              {/* API Status Indicator */}
              <div className="flex items-center space-x-2" title={`Last checked: ${apiHealth.lastChecked?.toLocaleTimeString() || 'Never'}`}>
                <div className={`w-2 h-2 rounded-full ${
                  !apiHealth.isOnline ? 'bg-red-500' : tasksLoading ? 'bg-yellow-500' : 'bg-green-500'
                }`}></div>
                <span className={`text-xs font-medium ${
                  !apiHealth.isOnline ? 'text-red-600' : tasksLoading ? 'text-yellow-600' : 'text-green-600'
                }`}>
                  {!apiHealth.isOnline
                    ? 'API Offline'
                    : tasksLoading
                      ? 'Loading...'
                      : `API Online ${apiHealth.responseTime ? `(${apiHealth.responseTime}ms)` : ''}`
                  }
                </span>
              </div>

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
            </div>
          </div>
        </div>

        {/* Task List - Due to length, I'll show only the main list view, kanban, and matrix views */}
        <div className="flex-1 overflow-y-auto bg-white dark:bg-slate-900">
          <div className="max-w-4xl mx-auto">
            {(() => {
              let tasksToShow = [];
              if (currentView === 'today') tasksToShow = applyFilters(getTodayTasks(tasks), filters, searchQuery);
              else if (currentView === 'inbox') tasksToShow = applyFilters(getInboxTasks(tasks), filters, searchQuery);
              else if (currentView === 'upcoming') tasksToShow = applyFilters(getUpcomingTasks(tasks), filters, searchQuery);
              else if (currentView === 'kanban') {
                return (
                  <KanbanView
                    tasks={tasks}
                    projects={projects}
                    selectedProject={selectedProject}
                    onToggleStatus={toggleTaskStatus}
                    isUpdating={updateTaskMutation.isPending}
                  />
                );
              }
              else if (currentView === 'matrix') {
                return (
                  <MatrixView
                    tasks={tasks}
                    projects={projects}
                    selectedProject={selectedProject}
                    onToggleStatus={toggleTaskStatus}
                    isUpdating={updateTaskMutation.isPending}
                  />
                );
              }
              else if (selectedProject !== 'all') tasksToShow = applyFilters(tasks.filter(t => t.projectId === selectedProject && t.status !== 'done'), filters, searchQuery);

              return (
                <div className="py-4">
                  {getMainTasks(tasksToShow).map((task) => {
                    const project = projects.find(p => p.id === task.projectId);
                    const taskIsOverdue = task.dueDate && isOverdue(task.dueDate, task.status);
                    const subtasks = getSubtasks(tasks, task.id);
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
                              {isExpanded ? <ChevronDown size={16} /> : <ChevronRightIcon size={16} />}
                            </button>
                          )}
                          {subtasks.length === 0 && <div className="w-6"></div>}
                        {/* Checkbox */}
                        <button
                          onClick={() => toggleTaskStatus(task.id)}
                          disabled={updateTaskMutation.isPending}
                          className={`mt-1 mr-4 w-5 h-5 rounded border-2 flex items-center justify-center transition-all disabled:opacity-50 ${
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
                                disabled={updateTaskMutation.isPending}
                                className="flex-1 text-sm bg-transparent border-none outline-none focus:bg-white dark:focus:bg-slate-700 rounded px-2 py-1 disabled:opacity-50"
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
                            {task.priority !== 'low' && PRIORITY_FLAGS[task.priority]}
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
                              onClick={() => {
                                setActiveSubtaskForm(task.id);
                                setSubtaskDrafts(prev => ({ ...prev, [task.id]: prev[task.id] || '' }));
                              }}
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
                        {activeSubtaskForm === task.id && (
                          <div className="px-6 pb-3">
                            <div className="ml-10 flex items-center space-x-2">
                              <input
                                type="text"
                                value={subtaskDrafts[task.id] || ''}
                                onChange={(e) => setSubtaskDrafts(prev => ({ ...prev, [task.id]: e.target.value }))}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') addSubtask(task.id);
                                  if (e.key === 'Escape') { setActiveSubtaskForm(null); setSubtaskDrafts(prev => ({ ...prev, [task.id]: '' })); }
                                }}
                                placeholder="Subtask name"
                                disabled={createTaskMutation.isPending}
                                className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white disabled:opacity-50"
                                autoFocus
                              />
                              <button
                                onClick={() => addSubtask(task.id)}
                                disabled={createTaskMutation.isPending}
                                className="px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md text-sm transition-colors disabled:opacity-50"
                              >
                                {createTaskMutation.isPending ? 'Adding...' : 'Add'}
                              </button>
                              <button
                                onClick={() => { setActiveSubtaskForm(null); setSubtaskDrafts(prev => ({ ...prev, [task.id]: '' })); }}
                                disabled={createTaskMutation.isPending}
                                className="px-3 py-2 text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-md text-sm transition-colors disabled:opacity-50"
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
                              return (
                                <div key={subtask.id} className="group flex items-start py-2 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors rounded-md px-2">
                                  <button
                                    onClick={() => toggleTaskStatus(subtask.id)}
                                    disabled={updateTaskMutation.isPending}
                                    className={`mt-1 mr-3 w-4 h-4 rounded border-2 flex items-center justify-center transition-all disabled:opacity-50 ${
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
                      </div>
                    </div>
                  )}

                  {/* Quick add at bottom */}
                  <div className="px-6 py-4 border-t border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-800">
                    {!showQuickAdd ? (
                      <button
                        onClick={() => setShowQuickAdd(true)}
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
                          disabled={createTaskMutation.isPending}
                          className="w-full px-4 py-3 text-sm border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-white disabled:opacity-50"
                          autoFocus
                        />
                        <div className="flex items-center space-x-3">
                          <button
                            onClick={quickAddTask}
                            disabled={createTaskMutation.isPending}
                            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-colors font-medium disabled:opacity-50"
                          >
                            {createTaskMutation.isPending ? 'Adding...' : 'Add task'}
                          </button>
                          <button
                            onClick={() => { setShowQuickAdd(false); setQuickAddText(''); }}
                            disabled={createTaskMutation.isPending}
                            className="px-4 py-2 text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-md transition-colors disabled:opacity-50"
                          >
                            Cancel
                          </button>
                          <span className="text-gray-500 dark:text-slate-400 text-xs">
                            Try natural language like "Call mom today"
                          </span>
                        </div>
                        {createTaskMutation.isError && (
                          <p className="text-xs text-red-600">Failed to create task. Please try again.</p>
                        )}
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
