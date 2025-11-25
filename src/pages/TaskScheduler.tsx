/**
 * TaskScheduler - Modern Professional Task Scheduling System
 * Inspired by Asana, ClickUp, and Monday.com
 *
 * Features:
 * - Board View (Kanban with drag-and-drop)
 * - Timeline View (Gantt chart with dependencies)
 * - List View (Spreadsheet-style)
 * - Task Dependencies
 * - Time Tracking
 * - Team Collaboration
 * - Milestones & Sprints
 * - Auto-scheduling
 * - Recurring Tasks
 * - Advanced Filtering
 */

import React, { useState, useMemo } from 'react';
import {
  LayoutGrid,
  List,
  Calendar,
  Search,
  Filter,
  Plus,
  Settings,
  Users,
  Target,
  Zap,
  Clock,
} from 'lucide-react';

// Import components
import { BoardView } from '../scheduler/components/BoardView';
import { TimelineView } from '../scheduler/components/TimelineView';
import { ListView } from '../scheduler/components/ListView';

// Import types
import type {
  ViewMode,
  ScheduledTask,
  BoardColumn,
  TimelineConfig,
  ListConfig,
  TaskFilters,
  DragDropResult,
  TeamMember,
  Milestone,
  Sprint,
} from '../scheduler/types';

// Import hooks
import { useTasks, useProjects } from '../hooks/useTasksQuery';
import { SkeletonCard } from '../components/LoadingSpinner';

const TaskScheduler: React.FC = () => {
  // ============================================================================
  // State Management
  // ============================================================================

  const [viewMode, setViewMode] = useState<ViewMode>('board');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  // Fetch data
  const { data: apiTasks = [], isLoading: tasksLoading } = useTasks();
  const { data: projects = [], isLoading: projectsLoading } = useProjects();

  const isLoading = tasksLoading || projectsLoading;

  // ============================================================================
  // Board Configuration
  // ============================================================================

  const boardColumns: BoardColumn[] = [
    {
      id: 'backlog',
      title: 'Backlog',
      status: 'todo',
      color: '#94a3b8',
      taskIds: [],
      order: 0,
    },
    {
      id: 'todo',
      title: 'To Do',
      status: 'todo',
      color: '#3b82f6',
      taskIds: [],
      limit: 5,
      order: 1,
    },
    {
      id: 'in_progress',
      title: 'In Progress',
      status: 'in_progress',
      color: '#8b5cf6',
      taskIds: [],
      limit: 3,
      order: 2,
    },
    {
      id: 'review',
      title: 'Review',
      status: 'waiting',
      color: '#f59e0b',
      taskIds: [],
      order: 3,
    },
    {
      id: 'done',
      title: 'Done',
      status: 'done',
      color: '#10b981',
      taskIds: [],
      order: 4,
    },
  ];

  // ============================================================================
  // Timeline Configuration
  // ============================================================================

  const [timelineConfig, setTimelineConfig] = useState<TimelineConfig>({
    startDate: new Date(),
    endDate: new Date(),
    zoom: 'month',
    showDependencies: true,
    showMilestones: true,
    showWeekends: false,
    showCriticalPath: false,
  });

  // ============================================================================
  // List Configuration
  // ============================================================================

  const [listConfig, setListConfig] = useState<ListConfig>({
    columns: [
      { id: 'title', label: 'Task', field: 'title', sortable: true, width: 300 },
      { id: 'status', label: 'Status', field: 'status', sortable: true, width: 120 },
      { id: 'priority', label: 'Priority', field: 'priority', sortable: true, width: 100 },
      { id: 'assignees', label: 'Assignees', field: 'assignees', width: 150 },
      { id: 'dueDate', label: 'Due Date', field: 'dueDate', sortable: true, width: 130 },
      { id: 'estimatedTime', label: 'Estimate', field: 'estimatedTime', sortable: true, width: 100 },
      { id: 'progress', label: 'Progress', field: 'progress', sortable: true, width: 140 },
    ],
    sortBy: 'priority',
    sortDirection: 'desc',
    showSubtasks: false,
    compactMode: false,
  });

  // ============================================================================
  // Mock Data (In production, this would come from your API)
  // ============================================================================

  const teamMembers: TeamMember[] = [
    {
      id: '1',
      name: 'John Doe',
      email: 'john@example.com',
      avatar: '',
      role: 'Developer',
      workload: 32,
      capacity: 40,
    },
    {
      id: '2',
      name: 'Jane Smith',
      email: 'jane@example.com',
      avatar: '',
      role: 'Designer',
      workload: 28,
      capacity: 40,
    },
  ];

  const milestones: Milestone[] = [
    {
      id: '1',
      name: 'MVP Release',
      description: 'Initial product release',
      dueDate: '2025-12-31',
      status: 'active',
      color: '#3b82f6',
      progress: 45,
      createdAt: new Date().toISOString(),
    },
  ];

  // ============================================================================
  // Transform Tasks
  // ============================================================================

  const scheduledTasks: ScheduledTask[] = useMemo(() => {
    return apiTasks.map(task => ({
      ...task,
      // Add scheduling-specific fields
      progress: task.status === 'done' ? 100 : task.status === 'in_progress' ? 50 : 0,
      assignees: [],
      dependencies: [],
      timeEntries: [],
      comments: [],
      activity: [],
    }));
  }, [apiTasks]);

  // ============================================================================
  // Filtered Tasks
  // ============================================================================

  const filteredTasks = useMemo(() => {
    let filtered = scheduledTasks;

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(task =>
        task.title.toLowerCase().includes(query) ||
        task.description?.toLowerCase().includes(query)
      );
    }

    // Status filter (exclude deleted and archived by default)
    filtered = filtered.filter(task => !task.deleted && !task.archived);

    return filtered;
  }, [scheduledTasks, searchQuery]);

  // ============================================================================
  // Event Handlers
  // ============================================================================

  const handleTaskDrop = (result: DragDropResult) => {
    console.log('Task dropped:', result);
    // In production: Update task status via API
  };

  const handleTaskClick = (task: ScheduledTask) => {
    setSelectedTaskId(task.id);
    console.log('Task clicked:', task);
    // In production: Open task detail modal
  };

  const handleStartTimer = (taskId: string) => {
    console.log('Start timer for task:', taskId);
    // In production: Start time tracking
  };

  const handleCreateTask = (columnId?: string) => {
    console.log('Create task in column:', columnId);
    // In production: Open create task modal
  };

  // ============================================================================
  // Render
  // ============================================================================

  if (isLoading) {
    return (
      <div className="flex h-screen bg-white dark:bg-slate-900">
        <div className="flex-1 p-6">
          <SkeletonCard className="h-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-slate-100 dark:bg-slate-950">
      {/* Header */}
      <div className="flex-shrink-0 bg-white dark:bg-slate-900 border-b-2 border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between px-6 py-4">
          {/* Left Section */}
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              Task Scheduler
            </h1>

            {/* View Switcher */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-1 border border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setViewMode('board')}
                className={`
                  flex items-center gap-2 px-3 py-1.5 rounded transition-colors
                  ${viewMode === 'board'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 font-medium'
                  }
                `}
                title="Board View"
              >
                <LayoutGrid className="w-4 h-4" />
                <span className="text-sm">Board</span>
              </button>
              <button
                onClick={() => setViewMode('timeline')}
                className={`
                  flex items-center gap-2 px-3 py-1.5 rounded transition-colors
                  ${viewMode === 'timeline'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 font-medium'
                  }
                `}
                title="Timeline View"
              >
                <Calendar className="w-4 h-4" />
                <span className="text-sm">Timeline</span>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`
                  flex items-center gap-2 px-3 py-1.5 rounded transition-colors
                  ${viewMode === 'list'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 font-medium'
                  }
                `}
                title="List View"
              >
                <List className="w-4 h-4" />
                <span className="text-sm">List</span>
              </button>
            </div>
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 w-64 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
              />
            </div>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`
                p-2 rounded-lg transition-colors
                ${showFilters
                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                  : 'hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400'
                }
              `}
              title="Filters"
            >
              <Filter className="w-5 h-5" />
            </button>

            {/* Quick Actions */}
            <button
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors text-slate-600 dark:text-slate-400"
              title="Auto-schedule"
            >
              <Zap className="w-5 h-5" />
            </button>

            <button
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors text-slate-600 dark:text-slate-400"
              title="Team"
            >
              <Users className="w-5 h-5" />
            </button>

            <button
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors text-slate-600 dark:text-slate-400"
              title="Settings"
            >
              <Settings className="w-5 h-5" />
            </button>

            {/* Create Task Button */}
            <button
              onClick={() => handleCreateTask()}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              New Task
            </button>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="px-6 py-3 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-8 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-slate-600 dark:text-slate-300 font-medium">Total Tasks:</span>
              <span className="font-bold text-slate-900 dark:text-white px-2 py-0.5 bg-slate-200 dark:bg-slate-700 rounded">
                {filteredTasks.length}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-600 dark:text-slate-300 font-medium">In Progress:</span>
              <span className="font-bold text-blue-600 dark:text-blue-300 px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 rounded">
                {filteredTasks.filter(t => t.status === 'in_progress').length}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-600 dark:text-slate-300 font-medium">Completed:</span>
              <span className="font-bold text-green-600 dark:text-green-300 px-2 py-0.5 bg-green-100 dark:bg-green-900/30 rounded">
                {filteredTasks.filter(t => t.status === 'done').length}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-600 dark:text-slate-300 font-medium">Milestones:</span>
              <span className="font-bold text-purple-600 dark:text-purple-300 px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 rounded">
                {milestones.length}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        {viewMode === 'board' && (
          <BoardView
            tasks={filteredTasks}
            columns={boardColumns}
            teamMembers={teamMembers}
            onTaskClick={handleTaskClick}
            onTaskDrop={handleTaskDrop}
            onCreateTask={handleCreateTask}
            onStartTimer={handleStartTimer}
          />
        )}

        {viewMode === 'timeline' && (
          <TimelineView
            tasks={filteredTasks}
            config={timelineConfig}
            onConfigChange={setTimelineConfig}
            onTaskClick={handleTaskClick}
          />
        )}

        {viewMode === 'list' && (
          <ListView
            tasks={filteredTasks}
            config={listConfig}
            teamMembers={teamMembers}
            onTaskClick={handleTaskClick}
            onStartTimer={handleStartTimer}
          />
        )}
      </div>

      {/* Help Text */}
      <div className="flex-shrink-0 px-6 py-2.5 bg-blue-50 dark:bg-slate-800/80 border-t-2 border-blue-200 dark:border-blue-900/50">
        <p className="text-xs text-blue-900 dark:text-blue-200 font-medium">
          💡 <strong className="font-bold">Pro Tip:</strong> {' '}
          {viewMode === 'board' && 'Drag tasks between columns to change their status. Try it out!'}
          {viewMode === 'timeline' && 'Use the zoom controls (Day/Week/Month) to adjust your view. Click tasks to see details.'}
          {viewMode === 'list' && 'Select multiple tasks using checkboxes for bulk actions. Click column headers to sort.'}
        </p>
      </div>
    </div>
  );
};

export default TaskScheduler;
