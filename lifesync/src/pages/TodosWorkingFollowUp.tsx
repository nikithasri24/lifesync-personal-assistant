import React, { useState, useEffect } from 'react';
import {
  Plus,
  CheckSquare,
  Calendar,
  Search,
  MoreHorizontal,
  Edit,
  CheckCircle2,
  Timer,
  Inbox,
  Sun,
  ArrowRight,
  CalendarDays,
  Grid,
  Clock,
  ChevronLeft,
  ChevronRight,
  Link,
  AlertCircle,
  CheckCircle,
  ArrowDown,
  X,
  Trash2,
  Copy,
  Archive,
  Flag,
  Tag,
  User,
  Settings,
  Filter,
  SortAsc,
  List,
  RefreshCw,
  Bell,
  Pause,
  Play,
  Square,
  BookOpen,
  Star,
  Paperclip,
  MessageSquare,
  Share2,
  Download,
  Upload,
  FileText,
  Zap,
  Target,
  GripVertical,
  Edit3
} from 'lucide-react';
import {
  DndContext,
  closestCenter,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  type DragEndEvent,
  type CollisionDetection,
  rectIntersection,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { format, isToday, addDays, isPast, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth } from 'date-fns';
import { useApiTasks } from '../hooks/useApiTasks';
import type { TaskData, ProjectData } from '../services/api';

interface Task {
  id: string;
  title: string;
  description?: string;
  projectId?: string;
  status: 'todo' | 'done' | 'waiting' | 'scheduled' | 'in_progress';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  estimatedTime: number;
  actualTime: number;
  dueDate?: Date;
  tags: string[];
  createdAt: Date;
  completedAt?: Date;
  category: 'work' | 'personal' | 'learning' | 'creative' | 'health' | 'other';
  notes?: string;
  starred?: boolean;
  archived?: boolean;
  deleted?: boolean;
  followUpTasks?: FollowUpTask[];
}

interface FollowUpTask {
  id: string;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  daysAfter?: number;
  triggerCondition?: 'immediate' | 'delayed' | 'manual';
  category: 'work' | 'personal' | 'learning' | 'creative' | 'health' | 'other';
  estimatedTime: number;
  tags: string[];
}

interface Project {
  id: string;
  name: string;
  description?: string;
  color: string;
  status: 'active' | 'completed' | 'on_hold';
  icon: string;
  createdAt: Date;
}

// Droppable Calendar Date Component
interface DroppableCalendarDateProps {
  id: string;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  style?: React.CSSProperties;
}

function DroppableCalendarDate({ id, children, className, onClick, style }: DroppableCalendarDateProps) {
  const { setNodeRef, isOver } = useDroppable({
    id,
    data: {
      type: 'calendar-date',
    },
  });

  return (
    <div
      ref={setNodeRef}
      className={`${className} ${isOver ? 'bg-blue-100 border-blue-300' : ''}`}
      onClick={onClick}
      style={style}
    >
      {children}
    </div>
  );
}

// Draggable Task Item Component for Calendar Sidebar
interface DraggableTaskItemProps {
  task: Task;
  id: string;
  onEdit: () => void;
  onToggle: () => void;
  isEditing?: boolean;
  onSave?: (updates: Partial<Task>) => void;
  onCancel?: () => void;
}

function DraggableTaskItem({ task, id, onEdit, onToggle }: DraggableTaskItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useSortable({
    id,
    data: {
      type: 'task',
      task,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 border-red-300 text-red-900';
      case 'high': return 'bg-orange-100 border-orange-300 text-orange-900';
      case 'medium': return 'bg-blue-100 border-blue-300 text-blue-900';
      default: return 'bg-gray-100 border-gray-300 text-gray-900';
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`p-3 rounded-lg border-l-4 cursor-grab active:cursor-grabbing transition-all duration-200 hover:shadow-md ${
        isDragging ? 'opacity-50 scale-105 shadow-lg' : ''
      } ${getPriorityColor(task.priority)} ${
        task.status === 'done' ? 'opacity-60 line-through' : ''
      }`}
    >
      <div className="flex items-start space-x-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggle();
          }}
          className={`flex-shrink-0 w-4 h-4 rounded-sm border-2 transition-colors mt-0.5 ${
            task.status === 'done'
              ? 'bg-green-500 border-green-500'
              : 'border-gray-400 hover:border-green-500 hover:bg-green-50'
          }`}
        >
          {task.status === 'done' && (
            <CheckCircle2 size={10} className="text-white m-0.5" />
          )}
        </button>
        
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm truncate">{task.title}</div>
          {task.description && (
            <div className="text-xs mt-1 opacity-75 line-clamp-2">{task.description}</div>
          )}
          <div className="flex items-center space-x-2 mt-2">
            {task.estimatedTime && (
              <span className="text-xs opacity-60 flex items-center">
                <Clock size={10} className="mr-1" />
                {task.estimatedTime}m
              </span>
            )}
            {task.tags && task.tags.length > 0 && (
              <span className="text-xs opacity-60">
                #{task.tags[0]}
              </span>
            )}
          </div>
        </div>
        
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-gray-600 transition-opacity"
        >
          <Edit3 size={12} />
        </button>
      </div>
    </div>
  );
}

export default function TodosWorkingFollowUp() {
  // API hook for tasks and projects
  const {
    tasks: apiTasks,
    projects: apiProjects,
    loading,
    error,
    createTask: apiCreateTask,
    updateTask: apiUpdateTask,
    deleteTask: apiDeleteTask,
    restoreTask: apiRestoreTask,
    permanentlyDeleteTask: apiPermanentlyDeleteTask,
    createProject: apiCreateProject,
    updateProject: apiUpdateProject,
    deleteProject: apiDeleteProject,
    refreshData
  } = useApiTasks();

  const [currentView, setCurrentView] = useState<'today' | 'inbox' | 'upcoming' | 'waiting' | 'scheduled' | 'completed' | 'starred' | 'calendar' | 'trash' | 'archived'>('inbox');
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [quickAddText, setQuickAddText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [showFollowUpForm, setShowFollowUpForm] = useState<string | null>(null);
  const [followUpText, setFollowUpText] = useState('');
  const [followUpDays, setFollowUpDays] = useState(0);
  
  // Task editing states
  const [editingTask, setEditingTask] = useState<string | null>(null);
  const [editTaskData, setEditTaskData] = useState<Partial<Task>>({});
  const [showTaskDetails, setShowTaskDetails] = useState<string | null>(null);
  const [editingFocusTime, setEditingFocusTime] = useState<string | null>(null);
  const [tempFocusTime, setTempFocusTime] = useState<number>(25);
  
  // Project management
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [newProjectData, setNewProjectData] = useState({ name: '', description: '', color: '#6366f1', icon: '📁' });
  
  // Filtering and sorting
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<'dueDate' | 'priority' | 'created' | 'title'>('dueDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  
  // Calendar view states
  const [calendarView, setCalendarView] = useState<'month' | 'week' | 'day'>('month');
  const [calendarDate, setCalendarDate] = useState(new Date());
  
  // Force month view on mount
  useEffect(() => {
    setCalendarView('month');
  }, []);
  const [filters, setFilters] = useState({
    priority: 'all',
    status: 'all',
    project: 'all',
    tags: [] as string[],
    dateRange: 'all'
  });
  
  // Pomodoro timer
  const [pomodoroTimer, setPomodoroTimer] = useState({
    taskId: null as string | null,
    timeLeft: 25 * 60,
    isActive: false,
    isBreak: false,
    completedSessions: 0
  });

  // Bulk operations
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());
  const [bulkMode, setBulkMode] = useState(false);

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Custom collision detection that prioritizes sidebar items
  const customCollisionDetection: CollisionDetection = (args) => {
    // First, check if we're colliding with any sidebar items
    const sidebarCollisions = rectIntersection({
      ...args,
      droppableContainers: args.droppableContainers.filter(container => 
        container.id.toString().startsWith('sidebar-')
      )
    });
    
    if (sidebarCollisions.length > 0) {
      return sidebarCollisions;
    }

    // Check for calendar date collisions
    const calendarCollisions = rectIntersection({
      ...args,
      droppableContainers: args.droppableContainers.filter(container => 
        container.id.toString().startsWith('calendar-date-') ||
        container.id.toString().startsWith('calendar-hour-')
      )
    });
    
    if (calendarCollisions.length > 0) {
      return calendarCollisions;
    }

    // If no special collisions, fall back to task reordering
    return closestCenter(args);
  };

  // Convert API data to component format
  const convertApiTaskToTask = (apiTask: TaskData): Task => {
    return {
      ...apiTask,
      id: apiTask.id!,
      dueDate: apiTask.due_date ? new Date(apiTask.due_date) : undefined,
      createdAt: new Date(apiTask.created_at!),
      completedAt: apiTask.completed_at ? new Date(apiTask.completed_at) : undefined,
      projectId: apiTask.project_id || undefined,
      estimatedTime: apiTask.estimated_time || 25,
      actualTime: apiTask.actual_time || 0,
      tags: apiTask.tags || [],
      followUpTasks: []
    };
  };

  const convertApiProjectToProject = (apiProject: ProjectData): Project => {
    return {
      ...apiProject,
      id: apiProject.id!,
      createdAt: new Date(apiProject.created_at!),
      color: apiProject.color || '#6366f1',
      icon: apiProject.icon || '📁'
    };
  };

  // Convert API data to component format
  const tasks = apiTasks.map(convertApiTaskToTask);
  const projects = apiProjects.map(convertApiProjectToProject);

  // Pomodoro timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (pomodoroTimer.isActive && pomodoroTimer.timeLeft > 0) {
      interval = setInterval(() => {
        setPomodoroTimer(prev => ({ ...prev, timeLeft: prev.timeLeft - 1 }));
      }, 1000);
    } else if (pomodoroTimer.isActive && pomodoroTimer.timeLeft === 0) {
      if (!pomodoroTimer.isBreak) {
        // Work session finished
        setPomodoroTimer(prev => ({ 
          ...prev, 
          timeLeft: 5 * 60, 
          isBreak: true,
          completedSessions: prev.completedSessions + 1
        }));
        // Update actual time for task
        if (pomodoroTimer.taskId) {
          const task = tasks.find(t => t.id === pomodoroTimer.taskId);
          if (task) {
            const focusTime = task.estimatedTime || 25;
            apiUpdateTask(pomodoroTimer.taskId, {
              actual_time: task.actualTime + focusTime
            }).catch(err => console.error('Failed to update task time:', err));
          }
        }
      } else {
        // Break finished - return to the task's custom focus time
        if (pomodoroTimer.taskId) {
          const task = tasks.find(t => t.id === pomodoroTimer.taskId);
          const focusTime = task?.estimatedTime || 25;
          setPomodoroTimer(prev => ({ 
            ...prev, 
            timeLeft: focusTime * 60, 
            isBreak: false 
          }));
        } else {
          setPomodoroTimer(prev => ({ 
            ...prev, 
            timeLeft: 25 * 60, 
            isBreak: false 
          }));
        }
      }
    }
    return () => clearInterval(interval);
  }, [pomodoroTimer.isActive, pomodoroTimer.timeLeft, pomodoroTimer.isBreak, pomodoroTimer.taskId, tasks]);

  // Drag and drop handlers
  const handleDragStart = (event: any) => {
    // console.log('Drag started:', event.active?.id);
  };

  const handleDragOver = (event: any) => {
    const overId = event.over?.id;
    // console.log('Drag over:', { active: event.active?.id, over: overId });
    if (overId && overId.startsWith('sidebar-')) {
      // console.log('Hovering over sidebar item:', overId);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    // console.log('Drag ended:', { active: active?.id, over: over?.id });

    if (!over) {
      console.log('No drop target found');
      return;
    }

    const overId = over.id as string;
    
    // Handle dropping on sidebar items (status/project changes)
    if (overId.startsWith('sidebar-')) {
      console.log('Dropping on sidebar item:', overId);
      const draggedId = active.id as string;
      const taskId = draggedId.startsWith('task-') ? draggedId.replace('task-', '') : draggedId;
      
      (async () => {
        try {
          if (overId === 'sidebar-waiting') {
            console.log('Moving task to Waiting status');
            await apiUpdateTask(taskId, { status: 'waiting' });
          } else if (overId === 'sidebar-scheduled') {
            console.log('Moving task to Scheduled status');
            await apiUpdateTask(taskId, { status: 'scheduled' });
          } else if (overId === 'sidebar-completed') {
            console.log('Moving task to Completed status');
            await apiUpdateTask(taskId, { status: 'done', completed_at: new Date().toISOString() });
          } else if (overId === 'sidebar-archived') {
            console.log('Archiving task');
            await apiUpdateTask(taskId, { archived: true });
          } else if (overId === 'sidebar-inbox') {
            console.log('Moving task to Inbox status');
            await apiUpdateTask(taskId, { status: 'todo' });
          } else if (overId === 'sidebar-today') {
            console.log('Setting task due date to today');
            await apiUpdateTask(taskId, { due_date: new Date().toISOString() });
          } else if (overId === 'sidebar-upcoming') {
            console.log('Setting task due date to next week');
            const nextWeek = new Date();
            nextWeek.setDate(nextWeek.getDate() + 7);
            await apiUpdateTask(taskId, { due_date: nextWeek.toISOString() });
          } else if (overId === 'sidebar-calendar') {
            console.log('Task moved to calendar - no action needed');
          } else if (overId === 'sidebar-starred') {
            console.log('Starring task');
            await apiUpdateTask(taskId, { starred: true });
          } else if (overId.startsWith('sidebar-project-')) {
            const projectId = overId.replace('sidebar-project-', '');
            console.log('Moving task to project:', projectId);
            await apiUpdateTask(taskId, { project_id: projectId === 'none' ? null : projectId });
          }
        } catch (err) {
          console.error('Failed to update task on drop:', err);
        }
      })();
      return;
    }

    // Handle dropping on calendar dates
    if (overId.startsWith('calendar-date-')) {
      console.log('Dropping on calendar date:', overId);
      const draggedId = active.id as string;
      const taskId = draggedId.startsWith('task-') ? draggedId.replace('task-', '') : draggedId;
      const dateStr = overId.replace('calendar-date-', '');
      
      (async () => {
        try {
          const newDueDate = new Date(dateStr);
          // Preserve the original time if the task had one
          const task = tasks.find(t => t.id === taskId);
          if (task?.dueDate) {
            const originalTime = new Date(task.dueDate);
            newDueDate.setHours(originalTime.getHours(), originalTime.getMinutes());
          }
          
          await apiUpdateTask(taskId, { 
            due_date: newDueDate.toISOString(),
            status: task?.status === 'scheduled' ? 'todo' : task?.status
          });
          console.log('Task moved to new date:', newDueDate.toISOString());
        } catch (err) {
          console.error('Failed to update task date on drop:', err);
        }
      })();
      return;
    }

    // Handle dropping on calendar dates (for month view)
    if (overId.startsWith('calendar-date-')) {
      console.log('Dropping on calendar date:', overId);
      const draggedId = active.id as string;
      const taskId = draggedId.startsWith('task-') ? draggedId.replace('task-', '') : draggedId;
      const dateStr = overId.replace('calendar-date-', '');
      
      (async () => {
        try {
          const newDueDate = new Date(dateStr);
          newDueDate.setHours(9, 0, 0, 0); // Default to 9 AM
          
          await apiUpdateTask(taskId, { 
            due_date: newDueDate.toISOString(),
            status: 'todo'
          });
          console.log('Task moved to new date:', newDueDate.toISOString());
        } catch (err) {
          console.error('Failed to update task date on drop:', err);
        }
      })();
      return;
    }

    // Handle dropping on calendar hours (for week/day view)
    if (overId.startsWith('calendar-hour-')) {
      console.log('Dropping on calendar hour:', overId);
      const draggedId = active.id as string;
      const taskId = draggedId.startsWith('task-') ? draggedId.replace('task-', '') : draggedId;
      const [, , dateStr, hourStr] = overId.split('-');
      
      (async () => {
        try {
          const newDueDate = new Date(dateStr);
          newDueDate.setHours(parseInt(hourStr), 0, 0, 0);
          
          await apiUpdateTask(taskId, { 
            due_date: newDueDate.toISOString(),
            status: 'todo'
          });
          console.log('Task moved to new date and time:', newDueDate.toISOString());
        } catch (err) {
          console.error('Failed to update task time on drop:', err);
        }
      })();
      return;
    }

    // Handle reordering within the task list (not implemented with database yet)
    if (active.id !== over.id) {
      console.log('Task reordering not implemented with database yet');
      // TODO: Implement task ordering with position field in database
    }
  };

  // Task management functions
  const quickAddTask = async () => {
    if (!quickAddText.trim()) return;
    
    try {
      const parsed = parseQuickAdd(quickAddText);
      await apiCreateTask({
        title: parsed.title,
        description: '',
        priority: parsed.priority as any,
        status: 'todo',
        estimated_time: 25,
        actual_time: 0,
        due_date: parsed.dueDate?.toISOString(),
        project_id: parsed.projectId || (selectedProject !== 'all' ? selectedProject : undefined),
        tags: parsed.tags,
        category: 'work'
      });
      setQuickAddText('');
      setShowQuickAdd(false);
    } catch (err) {
      console.error('Failed to create task:', err);
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

    // Extract tags (@tag)
    const tagMatches = text.match(/@(\w+)/g);
    if (tagMatches) {
      tags = tagMatches.map(match => match.slice(1));
      title = title.replace(/@\w+/g, '').trim();
    }

    // Extract dates
    if (text.includes('today')) {
      dueDate = new Date();
      title = title.replace(/today/, '').trim();
    } else if (text.includes('tomorrow')) {
      dueDate = addDays(new Date(), 1);
      title = title.replace(/tomorrow/, '').trim();
    }

    return { title, priority, dueDate, projectId, tags };
  };

  const toggleTaskStatus = async (taskId: string) => {
    try {
      const task = tasks.find(t => t.id === taskId);
      if (!task) return;
      
      const newStatus = task.status === 'done' ? 'todo' : 'done';
      await apiUpdateTask(taskId, {
        status: newStatus,
        completed_at: newStatus === 'done' ? new Date().toISOString() : undefined
      });
      
      // If task is completed and has follow-ups, create them
      if (newStatus === 'done' && task.followUpTasks) {
        for (const followUp of task.followUpTasks) {
          await apiCreateTask({
            title: followUp.title,
            description: followUp.description,
            priority: followUp.priority,
            status: followUp.triggerCondition === 'immediate' ? 'todo' : 'scheduled',
            estimated_time: followUp.estimatedTime,
            actual_time: 0,
            tags: followUp.tags,
            category: followUp.category,
            due_date: followUp.daysAfter ? addDays(new Date(), followUp.daysAfter).toISOString() : undefined,
            project_id: task.projectId
          });
        }
      }
    } catch (err) {
      console.error('Failed to toggle task status:', err);
    }
  };

  const deleteTask = async (taskId: string) => {
    try {
      await apiDeleteTask(taskId);
      setSelectedTasks(prev => {
        const newSet = new Set(prev);
        newSet.delete(taskId);
        return newSet;
      });
    } catch (err) {
      console.error('Failed to delete task:', err);
    }
  };

  const restoreTask = async (taskId: string) => {
    try {
      await apiRestoreTask(taskId);
    } catch (err) {
      console.error('Failed to restore task:', err);
    }
  };

  const permanentlyDeleteTask = async (taskId: string) => {
    try {
      await apiPermanentlyDeleteTask(taskId);
      setSelectedTasks(prev => {
        const newSet = new Set(prev);
        newSet.delete(taskId);
        return newSet;
      });
    } catch (err) {
      console.error('Failed to permanently delete task:', err);
    }
  };

  const duplicateTask = async (taskId: string) => {
    try {
      const task = tasks.find(t => t.id === taskId);
      if (task) {
        await apiCreateTask({
          title: `${task.title} (Copy)`,
          description: task.description,
          priority: task.priority,
          status: 'todo',
          estimated_time: task.estimatedTime,
          actual_time: 0,
          due_date: task.dueDate?.toISOString(),
          project_id: task.projectId,
          tags: task.tags,
          category: task.category,
          notes: task.notes
        });
      }
    } catch (err) {
      console.error('Failed to duplicate task:', err);
    }
  };

  const archiveTask = async (taskId: string) => {
    try {
      await apiUpdateTask(taskId, { archived: true });
    } catch (err) {
      console.error('Failed to archive task:', err);
    }
  };

  const unarchiveTask = async (taskId: string) => {
    try {
      await apiUpdateTask(taskId, { archived: false });
    } catch (err) {
      console.error('Failed to unarchive task:', err);
    }
  };

  const toggleStarTask = async (taskId: string) => {
    try {
      const task = tasks.find(t => t.id === taskId);
      if (task) {
        await apiUpdateTask(taskId, { starred: !task.starred });
      }
    } catch (err) {
      console.error('Failed to toggle star:', err);
    }
  };

  const startEditingTask = (task: Task) => {
    setEditingTask(task.id);
    setEditTaskData({
      title: task.title,
      description: task.description,
      priority: task.priority,
      dueDate: task.dueDate,
      projectId: task.projectId,
      tags: task.tags,
      estimatedTime: task.estimatedTime,
      notes: task.notes
    });
  };

  const saveTaskEdit = async () => {
    if (editingTask) {
      try {
        const updates: any = {};
        if (editTaskData.title !== undefined) updates.title = editTaskData.title;
        if (editTaskData.description !== undefined) updates.description = editTaskData.description;
        if (editTaskData.priority !== undefined) updates.priority = editTaskData.priority;
        if (editTaskData.dueDate !== undefined) updates.due_date = editTaskData.dueDate?.toISOString();
        if (editTaskData.projectId !== undefined) updates.project_id = editTaskData.projectId;
        if (editTaskData.tags !== undefined) updates.tags = editTaskData.tags;
        if (editTaskData.estimatedTime !== undefined) updates.estimated_time = editTaskData.estimatedTime;
        if (editTaskData.notes !== undefined) updates.notes = editTaskData.notes;
        
        await apiUpdateTask(editingTask, updates);
        setEditingTask(null);
        setEditTaskData({});
      } catch (err) {
        console.error('Failed to save task edit:', err);
      }
    }
  };

  const cancelTaskEdit = () => {
    setEditingTask(null);
    setEditTaskData({});
  };

  // Focus time management functions
  const startEditingFocusTime = (taskId: string, currentTime: number) => {
    console.log('Starting focus time edit for task:', taskId, 'current time:', currentTime);
    setEditingFocusTime(taskId);
    setTempFocusTime(currentTime);
  };

  const saveFocusTime = async (taskId: string) => {
    try {
      await apiUpdateTask(taskId, { estimated_time: tempFocusTime });
      setEditingFocusTime(null);
    } catch (err) {
      console.error('Failed to update focus time:', err);
    }
  };

  const cancelFocusTimeEdit = () => {
    setEditingFocusTime(null);
    setTempFocusTime(25);
  };

  // Project management functions
  const addProject = async () => {
    if (!newProjectData.name.trim()) return;
    
    try {
      await apiCreateProject({
        name: newProjectData.name,
        description: newProjectData.description,
        color: newProjectData.color,
        status: 'active',
        icon: newProjectData.icon
      });
      setNewProjectData({ name: '', description: '', color: '#6366f1', icon: '📁' });
      setShowProjectForm(false);
    } catch (err) {
      console.error('Failed to create project:', err);
    }
  };

  const deleteProject = async (projectId: string) => {
    try {
      await apiDeleteProject(projectId);
      // Update tasks that reference this project
      const tasksToUpdate = tasks.filter(task => task.projectId === projectId);
      for (const task of tasksToUpdate) {
        await apiUpdateTask(task.id, { project_id: null });
      }
    } catch (err) {
      console.error('Failed to delete project:', err);
    }
  };

  // Filtering and sorting functions
  const getFilteredAndSortedTasks = (taskList: Task[]) => {
    let filtered = taskList;

    // Apply search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(task => 
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Apply other filters
    if (filters.priority !== 'all') {
      filtered = filtered.filter(task => task.priority === filters.priority);
    }
    
    if (filters.status !== 'all') {
      filtered = filtered.filter(task => task.status === filters.status);
    }
    
    if (filters.project !== 'all') {
      filtered = filtered.filter(task => task.projectId === filters.project);
    }
    
    if (filters.tags.length > 0) {
      filtered = filtered.filter(task => 
        filters.tags.some(tag => task.tags.includes(tag))
      );
    }

    // Sort tasks
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'dueDate':
          aValue = a.dueDate?.getTime() || Infinity;
          bValue = b.dueDate?.getTime() || Infinity;
          break;
        case 'priority':
          const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
          aValue = priorityOrder[a.priority];
          bValue = priorityOrder[b.priority];
          break;
        case 'created':
          aValue = a.createdAt.getTime();
          bValue = b.createdAt.getTime();
          break;
        case 'title':
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        default:
          return 0;
      }
      
      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    return filtered;
  };

  // View-specific task getters
  const getTodayTasks = () => {
    return tasks.filter(task => 
      task.dueDate && isToday(task.dueDate) && task.status !== 'done' && !task.archived && !task.deleted
    );
  };

  const getUpcomingTasks = () => {
    return tasks.filter(task => 
      task.dueDate && task.dueDate > new Date() && task.status !== 'done' && !task.archived && !task.deleted
    ).sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime());
  };

  const getInboxTasks = () => {
    return tasks.filter(task => task.status !== 'done' && !task.archived && !task.deleted);
  };
  
  const getWaitingTasks = () => {
    return tasks.filter(task => task.status === 'waiting' && !task.archived && !task.deleted);
  };
  
  const getScheduledTasks = () => {
    return tasks.filter(task => task.status === 'scheduled' && !task.archived && !task.deleted);
  };

  const getCompletedTasks = () => {
    return tasks.filter(task => task.status === 'done' && !task.archived && !task.deleted);
  };

  const getStarredTasks = () => {
    return tasks.filter(task => task.starred && !task.archived && !task.deleted);
  };

  const getArchivedTasks = () => {
    return tasks.filter(task => task.archived && !task.deleted);
  };

  const getDeletedTasks = () => {
    return tasks.filter(task => task.deleted).sort((a, b) => new Date(b.deletedAt!).getTime() - new Date(a.deletedAt!).getTime());
  };

  const getTasksToShow = () => {
    let tasksToShow = [];
    switch (currentView) {
      case 'today': 
        tasksToShow = getTodayTasks();
        break;
      case 'upcoming': 
        tasksToShow = getUpcomingTasks();
        break;
      case 'waiting': 
        tasksToShow = getWaitingTasks();
        break;
      case 'scheduled': 
        tasksToShow = getScheduledTasks();
        break;
      case 'completed':
        tasksToShow = getCompletedTasks();
        break;
      case 'starred':
        tasksToShow = getStarredTasks();
        break;
      case 'trash':
        tasksToShow = getDeletedTasks();
        break;
      case 'archived':
        tasksToShow = getArchivedTasks();
        break;
      case 'inbox':
      default:
        tasksToShow = getInboxTasks();
        break;
    }
    
    if (selectedProject !== 'all') {
      tasksToShow = tasksToShow.filter(task => task.projectId === selectedProject);
    }
    
    return getFilteredAndSortedTasks(tasksToShow);
  };

  // Bulk operations
  const toggleTaskSelection = (taskId: string) => {
    setSelectedTasks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(taskId)) {
        newSet.delete(taskId);
      } else {
        newSet.add(taskId);
      }
      return newSet;
    });
  };

  const selectAllTasks = () => {
    const taskIds = getTasksToShow().map(task => task.id);
    setSelectedTasks(new Set(taskIds));
  };

  const clearSelection = () => {
    setSelectedTasks(new Set());
  };

  const bulkDeleteTasks = async () => {
    try {
      const promises = Array.from(selectedTasks).map(taskId => dbDeleteTask(taskId));
      await Promise.all(promises);
      setSelectedTasks(new Set());
    } catch (err) {
      console.error('Failed to bulk delete tasks:', err);
    }
  };

  const bulkArchiveTasks = async () => {
    try {
      const promises = Array.from(selectedTasks).map(taskId => apiUpdateTask(taskId, { archived: true }));
      await Promise.all(promises);
      setSelectedTasks(new Set());
    } catch (err) {
      console.error('Failed to bulk archive tasks:', err);
    }
  };

  const bulkUpdateProject = async (projectId: string) => {
    try {
      const promises = Array.from(selectedTasks).map(taskId => apiUpdateTask(taskId, { project_id: projectId }));
      await Promise.all(promises);
      setSelectedTasks(new Set());
    } catch (err) {
      console.error('Failed to bulk update project:', err);
    }
  };

  // Pomodoro functions
  const startPomodoro = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    const focusTime = task?.estimatedTime || 25;
    setPomodoroTimer(prev => ({ 
      ...prev, 
      taskId, 
      timeLeft: focusTime * 60, 
      isActive: true, 
      isBreak: false 
    }));
  };

  const togglePomodoro = () => {
    setPomodoroTimer(prev => ({ ...prev, isActive: !prev.isActive }));
  };

  const resetPomodoro = () => {
    setPomodoroTimer({
      taskId: null,
      timeLeft: 25 * 60,
      isActive: false,
      isBreak: false,
      completedSessions: 0
    });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Utility functions
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-600 bg-red-50 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'waiting': return 'text-orange-600 bg-orange-50';
      case 'scheduled': return 'text-purple-600 bg-purple-50';
      case 'in_progress': return 'text-blue-600 bg-blue-50';
      case 'done': return 'text-green-600 bg-green-50';
      default: return 'text-blue-600 bg-blue-50';
    }
  };

  const getDependencyStatus = (task: Task) => {
    if (!task.dependsOn) return null;
    
    const dependencies = tasks.filter(t => task.dependsOn?.includes(t.id));
    const completed = dependencies.filter(t => t.status === 'done');
    
    return {
      total: dependencies.length,
      completed: completed.length,
      isBlocked: completed.length < dependencies.length,
      dependencies
    };
  };

  // Droppable Sidebar Item Component
  const DroppableSidebarItem = ({ id, children, className, onClick }: {
    id: string;
    children: React.ReactNode;
    className?: string;
    onClick?: () => void;
  }) => {
    const { isOver, setNodeRef } = useDroppable({
      id: id,
    });

    // console.log('DroppableSidebarItem rendered with id:', id, 'isOver:', isOver);

    return (
      <div
        ref={setNodeRef}
        className={`${className} ${isOver ? 'bg-blue-100 dark:bg-blue-900 border-blue-300 dark:border-blue-700' : ''} transition-colors border-2 border-transparent relative z-50`}
        onClick={onClick}
        style={{ 
          minHeight: '40px',
          pointerEvents: 'auto',
          position: 'relative'
        }}
      >
        {children}
      </div>
    );
  };

  // Droppable Calendar Date Component
  const DroppableCalendarDate = ({ id, children, className, ...props }: {
    id: string;
    children: React.ReactNode;
    className?: string;
    [key: string]: any;
  }) => {
    const { isOver, setNodeRef } = useDroppable({
      id: id,
    });

    return (
      <div
        ref={setNodeRef}
        className={`${className} ${isOver ? 'bg-blue-50 dark:bg-blue-900/30 ring-2 ring-blue-300 dark:ring-blue-600' : ''} transition-all duration-200`}
        {...props}
      >
        {children}
      </div>
    );
  };

  // Droppable Calendar Hour Component
  const DroppableCalendarHour = ({ id, children, className, ...props }: {
    id: string;
    children: React.ReactNode;
    className?: string;
    [key: string]: any;
  }) => {
    const { isOver, setNodeRef } = useDroppable({
      id: id,
    });

    return (
      <div
        ref={setNodeRef}
        className={`${className} ${isOver ? 'bg-blue-50 dark:bg-blue-900/30 ring-1 ring-blue-300 dark:ring-blue-600' : ''} transition-all duration-200`}
        {...props}
      >
        {children}
      </div>
    );
  };

  // Sortable Task Item Component
  const SortableTaskItem = ({ task, project, dependencyStatus, isSelected }: {
    task: Task;
    project?: Project;
    dependencyStatus: any;
    isSelected: boolean;
  }) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ 
      id: task.id,
      data: {
        type: 'task',
        task: task
      }
    });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.5 : 1,
      zIndex: isDragging ? 100 : 1,
    };

    return (
      <div
        ref={setNodeRef}
        style={style}
        className="group px-6 py-4 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors border-b border-gray-100 dark:border-slate-700 relative"
      >
        <div className="flex items-start">
          {/* Drag Handle */}
          <div
            {...attributes}
            {...listeners}
            className="mt-2 mr-3 p-3 text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing hover:bg-gray-100 dark:hover:bg-slate-700 rounded transition-colors touch-none select-none bg-gray-50 dark:bg-slate-700"
            style={{ touchAction: 'none' }}
          >
            <GripVertical size={20} />
          </div>

          {/* Bulk selection checkbox */}
          {bulkMode && (
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => toggleTaskSelection(task.id)}
              className="mt-2 mr-3 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
          )}

          {/* Status Checkbox */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleTaskStatus(task.id);
            }}
            disabled={dependencyStatus?.isBlocked}
            className={`mt-1 mr-4 w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
              dependencyStatus?.isBlocked ? 'opacity-50 cursor-not-allowed border-gray-300' :
              task.status === 'done'
                ? 'bg-blue-500 border-blue-500 text-white'
                : task.status === 'waiting' 
                ? 'border-orange-400 bg-orange-50'
                : task.status === 'scheduled'
                ? 'border-purple-400 bg-purple-50'
                : task.status === 'in_progress'
                ? 'border-blue-400 bg-blue-50'
                : (() => {
                    switch (task.priority) {
                      case 'urgent': return 'border-red-400 hover:border-red-500 hover:bg-red-50';
                      case 'high': return 'border-orange-400 hover:border-orange-500 hover:bg-orange-50';
                      case 'medium': return 'border-blue-400 hover:border-blue-500 hover:bg-blue-50';
                      default: return 'border-gray-300 hover:border-gray-400 hover:bg-gray-50';
                    }
                  })()
            }`}
          >
            {task.status === 'done' && <CheckCircle size={12} />}
            {task.status === 'waiting' && <Clock size={12} className="text-orange-600" />}
            {task.status === 'scheduled' && <CalendarDays size={12} className="text-purple-600" />}
            {task.status === 'in_progress' && <Play size={12} className="text-blue-600" />}
            {dependencyStatus?.isBlocked && <AlertCircle size={12} className="text-gray-400" />}
          </button>

          {/* Task Content - Rest of the existing task content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-2">
              {editingTask === task.id ? (
                <input
                  type="text"
                  value={editTaskData.title || ''}
                  onChange={(e) => setEditTaskData(prev => ({ ...prev, title: e.target.value }))}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') saveTaskEdit();
                    if (e.key === 'Escape') cancelTaskEdit();
                  }}
                  className="flex-1 text-base font-normal border border-blue-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
              ) : (
                <span className={`text-base cursor-pointer font-normal ${
                  task.status === 'done' ? 'line-through text-gray-400' : 
                  dependencyStatus?.isBlocked ? 'text-gray-500' :
                  'text-gray-800 dark:text-white'
                }`}>
                  {task.title}
                </span>
              )}
              
              {/* Task badges and indicators */}
              {task.starred && (
                <Star className="w-4 h-4 text-yellow-500 fill-current" />
              )}
              
              {task.status !== 'todo' && task.status !== 'done' && (
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                  {task.status === 'waiting' ? 'Waiting' : 
                   task.status === 'scheduled' ? 'Scheduled' :
                   task.status === 'in_progress' ? 'In Progress' : task.status}
                </span>
              )}
              
              {task.priority !== 'low' && (
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                  {task.priority}
                </span>
              )}
            </div>

            {/* Rest of task content would go here - description, metadata, actions, etc. */}
            {/* For brevity, I'm including key elements */}
            
            {task.description && (
              <p className="text-sm text-gray-600 dark:text-slate-400 mb-2">{task.description}</p>
            )}
            
            {/* Task metadata */}
            <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-slate-400">
              {task.dueDate && (
                <span className={`flex items-center space-x-1.5 px-2 py-1 rounded ${
                  isPast(task.dueDate) && task.status !== 'done' ? 'text-red-600 bg-red-50' :
                  isToday(task.dueDate) ? 'text-green-600 bg-green-50' : 'text-gray-600 bg-gray-50'
                }`}>
                  <CalendarDays size={12} />
                  <span className="font-medium">
                    {isPast(task.dueDate) && task.status !== 'done' ? 'Overdue' :
                     isToday(task.dueDate) ? 'Today' : format(task.dueDate, 'MMM d')}
                  </span>
                </span>
              )}
              
              {project && (
                <span className="flex items-center space-x-1.5 px-2 py-1 bg-gray-100 dark:bg-slate-700 rounded">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: project.color }}></div>
                  <span className="text-gray-700 dark:text-gray-300 font-medium">{project.name}</span>
                </span>
              )}
              
              {/* Focus time setting */}
              {editingFocusTime === task.id ? (
                <div className="flex items-center space-x-2 px-2 py-1 bg-blue-50 dark:bg-blue-900 rounded">
                  <Timer size={12} className="text-blue-600" />
                  <input
                    type="number"
                    value={tempFocusTime}
                    onChange={(e) => setTempFocusTime(parseInt(e.target.value) || 25)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') saveFocusTime(task.id);
                      if (e.key === 'Escape') cancelFocusTimeEdit();
                    }}
                    className="w-16 text-xs bg-white dark:bg-slate-800 border border-blue-300 dark:border-blue-600 rounded px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    min="5"
                    max="120"
                    autoFocus
                  />
                  <span className="text-xs text-blue-700 dark:text-blue-300">min</span>
                  <button
                    onClick={() => saveFocusTime(task.id)}
                    className="p-0.5 text-green-600 hover:text-green-800 transition-colors"
                    title="Save"
                  >
                    <CheckCircle size={12} />
                  </button>
                  <button
                    onClick={cancelFocusTimeEdit}
                    className="p-0.5 text-gray-400 hover:text-gray-600 transition-colors"
                    title="Cancel"
                  >
                    <X size={12} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    console.log('Focus time button clicked for task:', task.id, 'current time:', task.estimatedTime);
                    startEditingFocusTime(task.id, task.estimatedTime);
                  }}
                  className="flex items-center space-x-1.5 px-2 py-1 bg-gray-100 dark:bg-slate-700 rounded hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors cursor-pointer"
                  title="Click to edit focus time"
                >
                  <Timer size={12} className="text-gray-600 dark:text-gray-300" />
                  <span className="font-medium text-gray-700 dark:text-gray-300">{task.estimatedTime}m</span>
                </button>
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
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity ml-3">
            {task.deleted ? (
              // Trash view actions
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    restoreTask(task.id);
                  }}
                  className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-md text-gray-400 hover:text-green-600 transition-colors"
                  title="Restore task"
                >
                  <RefreshCw size={14} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm(`Permanently delete "${task.title}"? This cannot be undone.`)) {
                      permanentlyDeleteTask(task.id);
                    }
                  }}
                  className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-md text-gray-400 hover:text-red-600 transition-colors"
                  title="Delete permanently"
                >
                  <X size={14} />
                </button>
              </>
            ) : task.archived ? (
              // Archive view actions
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    unarchiveTask(task.id);
                  }}
                  className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-md text-gray-400 hover:text-green-600 transition-colors"
                  title="Unarchive task"
                >
                  <RefreshCw size={14} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm(`Permanently delete "${task.title}"? This cannot be undone.`)) {
                      permanentlyDeleteTask(task.id);
                    }
                  }}
                  className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-md text-gray-400 hover:text-red-600 transition-colors"
                  title="Delete permanently"
                >
                  <Trash2 size={14} />
                </button>
              </>
            ) : (
              // Normal view actions
              <>
                <button
                  onClick={() => toggleStarTask(task.id)}
                  className={`p-1.5 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-md transition-colors ${
                    task.starred ? 'text-yellow-500' : 'text-gray-400 hover:text-gray-600'
                  }`}
                  title="Star task"
                >
                  <Star size={14} className={task.starred ? 'fill-current' : ''} />
                </button>
                <div className="flex items-center">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      startPomodoro(task.id);
                    }}
                    className={`p-1.5 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-md transition-colors ${
                      pomodoroTimer.taskId === task.id && pomodoroTimer.isActive
                        ? 'text-red-500 bg-red-50 dark:bg-red-900/20' 
                        : 'text-gray-400 hover:text-red-500'
                    }`}
                    title={`Start focus session (${task.estimatedTime}m)`}
                  >
                    <Timer size={14} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      startEditingFocusTime(task.id, task.estimatedTime);
                    }}
                    className="p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-md text-gray-400 hover:text-blue-500 transition-colors -ml-1"
                    title="Edit focus time"
                  >
                    <Edit3 size={10} />
                  </button>
                </div>
                <button
                  onClick={() => startEditingTask(task)}
                  className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-md text-gray-400 hover:text-gray-600 transition-colors"
                  title="Edit task"
                >
                  <Edit size={14} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteTask(task.id);
                  }}
                  className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-md text-gray-400 hover:text-red-600 transition-colors"
                  title="Delete task"
                >
                  <Trash2 size={14} />
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Show loading state
  if (loading) {
    return (
      <div className="h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-slate-400">Loading tasks...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-6 h-6 text-red-600" />
          </div>
          <p className="text-red-600 mb-4">Error loading tasks: {error}</p>
          <button
            onClick={refreshData}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={customCollisionDetection}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
    <div className="h-screen bg-gray-50 dark:bg-slate-900 flex" style={{ position: 'relative' }}>
      {/* Sidebar */}
      <div 
        className="w-72 bg-white dark:bg-slate-800 border-r border-gray-200 dark:border-slate-700 flex flex-col shadow-sm" 
        style={{ pointerEvents: 'auto', position: 'relative', zIndex: 10 }}
      >
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
              {selectedProject !== 'all' && (
                <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-slate-400 bg-gray-50 dark:bg-slate-700 px-3 py-2 rounded-md">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: projects.find(p => p.id === selectedProject)?.color }}></div>
                  <span>Adding to: {projects.find(p => p.id === selectedProject)?.name}</span>
                </div>
              )}
              <input
                type="text"
                value={quickAddText}
                onChange={(e) => setQuickAddText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') quickAddTask();
                  if (e.key === 'Escape') { setShowQuickAdd(false); setQuickAddText(''); }
                }}
                placeholder={selectedProject !== 'all' ? `Add task to ${projects.find(p => p.id === selectedProject)?.name}...` : "What needs to be done?"}
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
              onClick={() => setShowQuickAdd(true)}
              className="w-full flex items-center space-x-2 px-3 py-2.5 text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 rounded-md transition-colors text-sm font-medium"
            >
              <Plus size={16} />
              <span>{selectedProject !== 'all' ? `Add to ${projects.find(p => p.id === selectedProject)?.name}` : 'Add task'}</span>
            </button>
          )}
        </div>

        {/* Smart Lists */}
        <div className="flex-1 px-4 pb-4">
          <div className="mb-4">
            <h3 className="text-xs font-bold text-black dark:text-white uppercase tracking-wider mb-2 px-3">Smart Lists</h3>
            <nav className="space-y-1">
              {[
                { id: 'inbox', label: 'All', icon: Inbox, count: getInboxTasks().length },
                { id: 'today', label: 'Today', icon: Sun, count: getTodayTasks().length },
                { id: 'upcoming', label: 'Next 7 days', icon: ArrowRight, count: getUpcomingTasks().length },
                { id: 'calendar', label: 'Calendar', icon: Calendar, count: null },
                { id: 'waiting', label: 'Waiting For', icon: Clock, count: getWaitingTasks().length },
                { id: 'scheduled', label: 'Scheduled', icon: CalendarDays, count: getScheduledTasks().length },
                { id: 'starred', label: 'Starred', icon: Star, count: getStarredTasks().length },
                { id: 'completed', label: 'Completed', icon: CheckCircle, count: getCompletedTasks().length },
                { id: 'archived', label: 'Archived', icon: Archive, count: getArchivedTasks().length },
                { id: 'trash', label: 'Trash', icon: Trash2, count: getDeletedTasks().length }
              ].map(({ id, label, icon: Icon, count }) => (
                <DroppableSidebarItem
                  key={id}
                  id={`sidebar-${id}`}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md text-sm transition-colors cursor-pointer ${
                    currentView === id 
                      ? 'bg-blue-600 text-white dark:bg-blue-500 dark:text-white' 
                      : 'text-black dark:text-white hover:bg-gray-200 dark:hover:bg-slate-700'
                  }`}
                  onClick={() => setCurrentView(id as any)}
                >
                  <Icon className="w-4 h-4" />
                  <span>{label}</span>
                  {count !== null && (
                    <span className={`ml-auto text-xs px-2 py-0.5 rounded-full font-medium ${
                      currentView === id 
                        ? 'bg-white text-blue-600 dark:bg-white dark:text-blue-500' 
                        : 'bg-gray-200 text-black dark:bg-slate-600 dark:text-gray-300'
                    }`}>
                      {count}
                    </span>
                  )}
                </DroppableSidebarItem>
              ))}
            </nav>
          </div>

          {/* Projects Section */}
          <div className="mt-6">
            <div className="flex items-center justify-between mb-3 px-3">
              <h3 className="text-xs font-bold text-black dark:text-white uppercase tracking-wider">Projects</h3>
              <button 
                onClick={() => setShowProjectForm(true)}
                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-slate-300"
              >
                <Plus size={12} />
              </button>
            </div>
            <div className="space-y-1">
              {projects.map((project) => (
                <div key={project.id} className="group relative">
                  <DroppableSidebarItem
                    id={`sidebar-project-${project.id}`}
                    className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md text-sm transition-colors cursor-pointer ${
                      selectedProject === project.id 
                        ? 'bg-blue-600 text-white dark:bg-blue-500 dark:text-white' 
                        : 'text-black dark:text-white hover:bg-gray-200 dark:hover:bg-slate-700'
                    }`}
                    onClick={() => setSelectedProject(selectedProject === project.id ? 'all' : project.id)}
                  >
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: project.color }}></div>
                    <span className="truncate">{project.name}</span>
                    <span className={`ml-auto text-xs px-2 py-0.5 rounded-full font-medium ${
                      selectedProject === project.id 
                        ? 'bg-white text-blue-600 dark:bg-white dark:text-blue-500' 
                        : 'bg-gray-200 text-black dark:bg-slate-600 dark:text-gray-300'
                    }`}>
                      {tasks.filter(t => t.projectId === project.id && t.status !== 'done' && !t.archived).length}
                    </span>
                  </DroppableSidebarItem>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm('Delete this project?')) deleteProject(project.id);
                    }}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-600 z-10"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 dark:text-white flex items-center space-x-3">
                {currentView === 'today' && <><Sun className="w-6 h-6 text-orange-500" /><span>Today</span></>}
                {currentView === 'inbox' && <><Inbox className="w-6 h-6 text-blue-500" /><span>All</span></>}
                {currentView === 'upcoming' && <><ArrowRight className="w-6 h-6 text-green-500" /><span>Next 7 days</span></>}
                {currentView === 'waiting' && <><Clock className="w-6 h-6 text-orange-500" /><span>Waiting For</span></>}
                {currentView === 'scheduled' && <><CalendarDays className="w-6 h-6 text-purple-500" /><span>Scheduled</span></>}
                {currentView === 'calendar' && <><Calendar className="w-6 h-6 text-indigo-500" /><span>Calendar</span></>}
                {currentView === 'starred' && <><Star className="w-6 h-6 text-yellow-500" /><span>Starred</span></>}
                {currentView === 'completed' && <><CheckCircle className="w-6 h-6 text-green-500" /><span>Completed</span></>}
                {currentView === 'archived' && <><Archive className="w-6 h-6 text-gray-500" /><span>Archived</span></>}
                {currentView === 'trash' && <><Trash2 className="w-6 h-6 text-red-500" /><span>Trash</span></>}
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
                {currentView === 'waiting' && 'Tasks waiting for external events or responses'}
                {currentView === 'scheduled' && 'Tasks scheduled for future activation'}
                {currentView === 'calendar' && format(calendarDate, 'MMMM yyyy')}
                {currentView === 'starred' && 'Your starred tasks'}
                {currentView === 'completed' && 'Completed tasks'}
                {currentView === 'archived' && 'Archived tasks - can be unarchived or permanently deleted'}
                {currentView === 'trash' && 'Deleted tasks - can be restored or permanently deleted'}
                {selectedProject !== 'all' && projects.find(p => p.id === selectedProject)?.description}
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Bulk actions */}
              {selectedTasks.size > 0 && (
                <div className="flex items-center space-x-2 px-3 py-2 bg-blue-50 rounded-lg">
                  <span className="text-sm text-blue-700">{selectedTasks.size} selected</span>
                  <button
                    onClick={bulkArchiveTasks}
                    className="p-1 text-blue-600 hover:text-blue-800"
                    title="Archive selected"
                  >
                    <Archive size={16} />
                  </button>
                  <button
                    onClick={bulkDeleteTasks}
                    className="p-1 text-red-600 hover:text-red-800"
                    title="Delete selected"
                  >
                    <Trash2 size={16} />
                  </button>
                  <button
                    onClick={clearSelection}
                    className="p-1 text-gray-600 hover:text-gray-800"
                    title="Clear selection"
                  >
                    <X size={16} />
                  </button>
                </div>
              )}

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
              
              {/* Sort */}
              <div className="relative">
                <select
                  value={`${sortBy}-${sortOrder}`}
                  onChange={(e) => {
                    const [sort, order] = e.target.value.split('-');
                    setSortBy(sort as any);
                    setSortOrder(order as any);
                  }}
                  className="px-3 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
                >
                  <option value="dueDate-asc">Due Date ↑</option>
                  <option value="dueDate-desc">Due Date ↓</option>
                  <option value="priority-desc">Priority ↑</option>
                  <option value="priority-asc">Priority ↓</option>
                  <option value="title-asc">Title A-Z</option>
                  <option value="title-desc">Title Z-A</option>
                  <option value="created-desc">Newest</option>
                  <option value="created-asc">Oldest</option>
                </select>
              </div>

              {/* Filters */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`p-2 rounded-md transition-colors ${
                  showFilters ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                } dark:hover:bg-slate-700`}
              >
                <Filter size={18} />
              </button>

              {/* Bulk mode toggle */}
              <button
                onClick={() => setBulkMode(!bulkMode)}
                className={`p-2 rounded-md transition-colors ${
                  bulkMode ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                } dark:hover:bg-slate-700`}
                title="Bulk selection mode"
              >
                <CheckSquare size={18} />
              </button>

              {/* Bulk selection controls */}
              {bulkMode && (
                <div className="flex items-center space-x-2 px-3 py-2 bg-gray-50 dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700">
                  <span className="text-sm text-gray-600 dark:text-gray-300">Bulk:</span>
                  <button
                    onClick={selectAllTasks}
                    className="px-2 py-1 text-xs font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                    title="Select all visible tasks"
                  >
                    Select All
                  </button>
                  <button
                    onClick={clearSelection}
                    className="px-2 py-1 text-xs font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 dark:hover:bg-slate-700 rounded transition-colors"
                    title="Deselect all tasks"
                  >
                    Deselect All
                  </button>
                </div>
              )}

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
                      onClick={togglePomodoro}
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
                  <div className="text-xs text-gray-600">
                    Sessions: {pomodoroTimer.completedSessions}
                  </div>
                </div>
              )}

              <button
                onClick={() => setShowQuickAdd(true)}
                className="p-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-colors"
                title={selectedProject !== 'all' ? `Add task to ${projects.find(p => p.id === selectedProject)?.name}` : "Quick add task"}
              >
                <Plus size={18} />
              </button>
            </div>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className="mt-4 p-4 bg-gray-50 dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700">
              <div className="grid grid-cols-4 gap-4">
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
                    <option value="in_progress">In Progress</option>
                    <option value="waiting">Waiting</option>
                    <option value="scheduled">Scheduled</option>
                    <option value="done">Done</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Project</label>
                  <select
                    value={filters.project}
                    onChange={(e) => setFilters(prev => ({ ...prev, project: e.target.value }))}
                    className="w-full px-3 py-1 text-sm border border-gray-300 dark:border-slate-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
                  >
                    <option value="all">All Projects</option>
                    {projects.map(project => (
                      <option key={project.id} value={project.id}>{project.name}</option>
                    ))}
                  </select>
                </div>
                
                <div className="flex items-end">
                  <button
                    onClick={() => setFilters({ priority: 'all', status: 'all', project: 'all', tags: [], dateRange: 'all' })}
                    className="w-full px-3 py-2 text-sm text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded transition-colors"
                  >
                    Clear Filters
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Task List */}
        <div className="flex-1 overflow-hidden bg-white dark:bg-slate-900">
          <div className="h-full max-w-6xl mx-auto">
            {currentView === 'calendar' ? (
              // Google Calendar Implementation
              <div className="h-full flex flex-col">
                {/* Calendar Header - Google Calendar Style */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          if (calendarView === 'month') {
                            const newDate = new Date(calendarDate);
                            newDate.setMonth(newDate.getMonth() - 1);
                            setCalendarDate(newDate);
                          } else if (calendarView === 'week') {
                            const newDate = new Date(calendarDate);
                            newDate.setDate(newDate.getDate() - 7);
                            setCalendarDate(newDate);
                          } else {
                            const newDate = new Date(calendarDate);
                            newDate.setDate(newDate.getDate() - 1);
                            setCalendarDate(newDate);
                          }
                        }}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full transition-colors"
                      >
                        <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                      </button>
                      <button
                        onClick={() => {
                          if (calendarView === 'month') {
                            const newDate = new Date(calendarDate);
                            newDate.setMonth(newDate.getMonth() + 1);
                            setCalendarDate(newDate);
                          } else if (calendarView === 'week') {
                            const newDate = new Date(calendarDate);
                            newDate.setDate(newDate.getDate() + 7);
                            setCalendarDate(newDate);
                          } else {
                            const newDate = new Date(calendarDate);
                            newDate.setDate(newDate.getDate() + 1);
                            setCalendarDate(newDate);
                          }
                        }}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full transition-colors"
                      >
                        <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                      </button>
                    </div>
                    <button
                      onClick={() => setCalendarDate(new Date())}
                      className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-slate-700 rounded-md border border-gray-300 dark:border-slate-600 transition-colors"
                    >
                      Today
                    </button>
                    <h2 className="text-xl font-medium text-gray-900 dark:text-white">
                      {calendarView === 'month' && format(calendarDate, 'MMMM yyyy')}
                      {calendarView === 'week' && `${format(startOfWeek(calendarDate), 'MMM d')} - ${format(endOfWeek(calendarDate), 'MMM d, yyyy')}`}
                      {calendarView === 'day' && format(calendarDate, 'EEEE, MMMM d, yyyy')}
                    </h2>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <div className="flex bg-gray-100 dark:bg-slate-700 rounded-md p-1">
                      <button
                        onClick={() => setCalendarView('day')}
                        className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                          calendarView === 'day' 
                            ? 'bg-white dark:bg-slate-600 text-gray-900 dark:text-white shadow-sm' 
                            : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                        }`}
                      >
                        Day
                      </button>
                      <button
                        onClick={() => setCalendarView('week')}
                        className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                          calendarView === 'week' 
                            ? 'bg-white dark:bg-slate-600 text-gray-900 dark:text-white shadow-sm' 
                            : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                        }`}
                      >
                        Week
                      </button>
                      <button
                        onClick={() => setCalendarView('month')}
                        className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                          calendarView === 'month' 
                            ? 'bg-white dark:bg-slate-600 text-gray-900 dark:text-white shadow-sm' 
                            : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                        }`}
                      >
                        Month
                      </button>
                    </div>
                    <button className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-md transition-colors">
                      <Settings className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                    </button>
                  </div>
                </div>

                {/* Calendar Content */}
                <div className="flex-1 bg-white dark:bg-slate-900 flex">
                  {/* Task List Sidebar */}
                  <div className="w-64 border-r border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 flex flex-col">
                    <div className="p-4 border-b border-gray-200 dark:border-slate-700">
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Available Tasks</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Drag tasks to calendar dates to schedule them</p>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-4 space-y-2">
                      {getInboxTasks().filter(task => !task.dueDate || task.status === 'todo').map((task) => (
                        <DraggableTaskItem
                          key={task.id}
                          task={task}
                          id={`task-${task.id}`}
                          onEdit={() => startEditingTask(task)}
                          onToggle={() => toggleTaskStatus(task.id)}
                        />
                      ))}
                      
                      {getInboxTasks().filter(task => !task.dueDate || task.status === 'todo').length === 0 && (
                        <div className="text-center text-gray-500 dark:text-gray-400 text-sm py-8">
                          No unscheduled tasks
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Calendar Grid */}
                  <div className="flex-1">
                  {calendarView === 'month' && (
                    <div className="h-full flex flex-col">
                      {/* Day headers */}
                      <div className="flex border-b border-gray-200">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                          <div key={day} className="py-3 px-4 text-center border-r border-gray-200 last:border-r-0 bg-gray-50" style={{ 
                            width: 'calc(100% / 7)', 
                            minWidth: 'calc(100% / 7)', 
                            maxWidth: 'calc(100% / 7)',
                            flexShrink: 0,
                            flexGrow: 0
                          }}>
                            <div className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                              {day}
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      {/* Calendar rows */}
                      <div className="flex-1 flex flex-col">
                        {(() => {
                          const allDays = eachDayOfInterval({
                            start: startOfWeek(startOfMonth(calendarDate), { weekStartsOn: 0 }),
                            end: endOfWeek(endOfMonth(calendarDate), { weekStartsOn: 0 })
                          });
                          
                          // Split into weeks (6 rows of 7 days each)
                          const weeks = [];
                          for (let i = 0; i < 6; i++) {
                            weeks.push(allDays.slice(i * 7, (i + 1) * 7));
                          }
                          
                          return weeks.map((week, weekIndex) => (
                            <div key={weekIndex} className="relative flex h-32"> {/* Fixed height for uniform rows */}
                              {week.map((day, dayIndex) => {
                                const dayTasks = tasks.filter(task => 
                                  task.dueDate && isSameDay(task.dueDate, day)
                                );
                                const isCurrentMonth = isSameMonth(day, calendarDate);
                                const isToday = isSameDay(day, new Date());
                                
                                return (
                                  <DroppableCalendarDate
                                    key={dayIndex}
                                    id={`calendar-date-${day.toISOString().split('T')[0]}`}
                                    className={`border-r border-b border-gray-200 last:border-r-0 cursor-pointer hover:bg-blue-50 transition-colors flex flex-col ${
                                      !isCurrentMonth ? 'bg-gray-50' : 'bg-white'
                                    }`}
                                    onClick={() => setCalendarDate(day)}
                                    style={{ 
                                      height: '128px', 
                                      width: 'calc(100% / 7)', 
                                      minWidth: 'calc(100% / 7)', 
                                      maxWidth: 'calc(100% / 7)',
                                      flexShrink: 0,
                                      flexGrow: 0
                                    }} // Exact 1/7th width for precise alignment
                                  >
                                    <div className="p-2 h-full flex flex-col">
                                      {/* Day number */}
                                      <div className="flex-shrink-0 mb-2">
                                        <div className={`w-6 h-6 flex items-center justify-center text-sm font-medium rounded-full ${
                                          !isCurrentMonth ? 'text-gray-400' : 
                                          isToday ? 'bg-blue-600 text-white' : 
                                          'text-gray-900 hover:bg-gray-100'
                                        }`}>
                                          {format(day, 'd')}
                                        </div>
                                      </div>
                                    
                                    {/* Events area */}
                                    <div className="flex-1 overflow-hidden" style={{ height: 'calc(128px - 48px)' }}>
                                      <div className="space-y-1 h-full overflow-hidden">
                                        {dayTasks.slice(0, 3).map((task) => (
                                          <div 
                                            key={task.id}
                                            className="text-xs px-2 py-1 text-white rounded font-medium cursor-pointer hover:opacity-90 transition-opacity flex items-center overflow-hidden"
                                            style={{ 
                                              backgroundColor: task.priority === 'urgent' ? '#ef4444' :
                                                             task.priority === 'high' ? '#f97316' :
                                                             task.priority === 'medium' ? '#3b82f6' : '#6b7280',
                                              height: '20px', // Fixed height for uniform events
                                              minHeight: '20px',
                                              maxHeight: '20px',
                                              width: '100%'
                                            }}
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              startEditingTask(task);
                                            }}
                                          >
                                            <span className="truncate leading-none">
                                              {task.title}
                                            </span>
                                          </div>
                                        ))}
                                        {dayTasks.length > 3 && (
                                          <div className="text-xs text-gray-500 px-2 font-medium overflow-hidden" style={{ height: '20px', lineHeight: '20px', width: '100%' }}>
                                            +{dayTasks.length - 3} more
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                    </div>
                                  </DroppableCalendarDate>
                                );
                              })}
                            </div>
                          ));
                        })()}
                      </div>
                    </div>
                  )}

            {calendarView === 'week' && (
                    <div className="h-full flex flex-col bg-white dark:bg-slate-900">
                      {/* Google Calendar Style Week Header */}
                      <div className="grid grid-cols-8 border-b border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800">
                        <div className="p-3 border-r border-gray-200 dark:border-slate-700"></div>
                        {eachDayOfInterval({
                          start: startOfWeek(calendarDate),
                          end: endOfWeek(calendarDate)
                        }).map((day) => (
                          <div key={day.toISOString()} className="p-3 text-center border-r border-gray-200 dark:border-slate-700 last:border-r-0">
                            <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase mb-1">
                              {format(day, 'EEE')}
                            </div>
                            <div className={`text-lg font-medium ${
                              isSameDay(day, new Date()) ? 'text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-white'
                            }`}>
                              {format(day, 'd')}
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      {/* Week Grid */}
                      <div className="flex-1 grid grid-cols-8">
                        {/* Time Column */}
                        <div className="border-r border-gray-200 dark:border-slate-700">
                          {Array.from({ length: 24 }, (_, hour) => (
                            <div key={hour} className="h-16 border-b border-gray-200 dark:border-slate-700 px-2 py-1">
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {format(new Date().setHours(hour, 0), 'h a')}
                              </div>
                            </div>
                          ))}
                        </div>
                        
                        {/* Day Columns */}
                        {eachDayOfInterval({
                          start: startOfWeek(calendarDate),
                          end: endOfWeek(calendarDate)
                        }).map((day) => {
                          return (
                            <div key={day.toISOString()} className="border-r border-gray-200 dark:border-slate-700">
                              {Array.from({ length: 24 }, (_, hour) => (
                                <DroppableCalendarHour 
                                  key={hour}
                                  id={`calendar-hour-${day.toISOString().split('T')[0]}-${hour}`}
                                  className="h-16 border-b border-gray-200 dark:border-slate-700 p-1 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors group cursor-pointer overflow-hidden"
                                  onDoubleClick={(e) => {
                                    e.stopPropagation();
                                    setQuickAddText('');
                                    setShowQuickAdd(true);
                                  }}
                                >
                                  {tasks.filter(task => 
                                    task.dueDate && isSameDay(task.dueDate, day) &&
                                    ((task.dueDate ? new Date(task.dueDate).getHours() : 9) === hour ||
                                     (hour === 9 && task.dueDate && new Date(task.dueDate).getHours() === 0 && new Date(task.dueDate).getMinutes() === 0))
                                  ).length === 0 && (
                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center h-full">
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setQuickAddText(`Add task for ${format(day, 'MMM d')} at ${format(new Date().setHours(hour, 0), 'h a')}`);
                                          setShowQuickAdd(true);
                                        }}
                                        className="w-6 h-6 bg-blue-500 hover:bg-blue-600 text-white rounded-full flex items-center justify-center"
                                        title="Add task"
                                      >
                                        <Plus size={12} />
                                      </button>
                                    </div>
                                  )}
                                  {tasks.filter(task => 
                                    task.dueDate && isSameDay(task.dueDate, day) &&
                                    ((task.dueDate ? new Date(task.dueDate).getHours() : 9) === hour ||
                                     (hour === 9 && task.dueDate && new Date(task.dueDate).getHours() === 0 && new Date(task.dueDate).getMinutes() === 0))
                                  ).map((task, index) => (
                                    <div 
                                      key={task.id}
                                      className={`group text-xs p-1 rounded-md transition-all duration-200 hover:shadow-md ${
                                        task.priority === 'urgent' ? 'bg-gradient-to-r from-red-100 to-red-50 text-red-900 border-l-2 border-red-500' :
                                        task.priority === 'high' ? 'bg-gradient-to-r from-orange-100 to-orange-50 text-orange-900 border-l-2 border-orange-500' :
                                        task.priority === 'medium' ? 'bg-gradient-to-r from-blue-100 to-blue-50 text-blue-900 border-l-2 border-blue-500' :
                                        'bg-gradient-to-r from-gray-100 to-gray-50 text-gray-900 border-l-2 border-gray-400'
                                      } ${task.status === 'done' ? 'opacity-60 line-through' : ''}`}
                                      style={{ 
                                        marginTop: index > 0 ? '2px' : '0px'
                                      }}
                                    >
                                      <div className="flex items-center space-x-1">
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            toggleTaskStatus(task.id);
                                          }}
                                          className={`flex-shrink-0 w-3 h-3 rounded-sm border-2 transition-colors ${
                                            task.status === 'done'
                                              ? 'bg-green-500 border-green-500'
                                              : 'border-gray-400 hover:border-green-500 hover:bg-green-50'
                                          }`}
                                        >
                                          {task.status === 'done' && (
                                            <CheckCircle2 size={8} className="text-white m-0.5" />
                                          )}
                                        </button>
                                        <span 
                                          className="flex-1 truncate cursor-pointer text-xs"
                                          onClick={() => startEditingTask(task)}
                                        >
                                          {task.title}
                                        </span>
                                      </div>
                                    </div>
                                  ))}
                                </DroppableCalendarHour>
                              ))}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {calendarView === 'day' && (
                    <div className="h-full flex">
                      {/* Time Column */}
                      <div className="w-20 border-r border-gray-200 dark:border-slate-700">
                        {Array.from({ length: 24 }, (_, hour) => (
                          <div key={hour} className="h-16 border-b border-gray-200 dark:border-slate-700 px-2 py-2">
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {format(new Date().setHours(hour, 0), 'h a')}
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      {/* Day Content */}
                      <div className="flex-1">
                        <div className="bg-gray-50 dark:bg-slate-800 p-4 border-b border-gray-200 dark:border-slate-700">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {format(calendarDate, 'EEEE, MMMM d, yyyy')}
                          </h3>
                        </div>
                        
                        {Array.from({ length: 24 }, (_, hour) => {
                          const hourTasks = tasks.filter(task => 
                            task.dueDate && isSameDay(task.dueDate, calendarDate) &&
                            (new Date(task.dueDate).getHours() === hour || 
                             (hour === 9 && new Date(task.dueDate).getHours() === 0 && new Date(task.dueDate).getMinutes() === 0))
                          );
                          
                          return (
                            <DroppableCalendarHour 
                              key={hour}
                              id={`calendar-hour-${calendarDate.toISOString().split('T')[0]}-${hour}`}
                              className="h-16 border-b border-gray-200 dark:border-slate-700 p-2 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors group cursor-pointer overflow-hidden"
                              onDoubleClick={(e) => {
                                e.stopPropagation();
                                setQuickAddText('');
                                setShowQuickAdd(true);
                              }}
                            >
                              {hourTasks.length === 0 && (
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center h-full">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setQuickAddText(`Add task for ${format(calendarDate, 'MMM d')} at ${format(new Date().setHours(hour, 0), 'h a')}`);
                                      setShowQuickAdd(true);
                                    }}
                                    className="w-8 h-8 bg-blue-500 hover:bg-blue-600 text-white rounded-full flex items-center justify-center"
                                    title="Add task"
                                  >
                                    <Plus size={14} />
                                  </button>
                                </div>
                              )}
                              {hourTasks.map((task, index) => (
                                <div 
                                  key={task.id}
                                  className={`group text-xs p-2 rounded-lg mb-1 transition-all duration-200 hover:shadow-lg ${
                                    task.priority === 'urgent' ? 'bg-gradient-to-r from-red-100 to-red-50 text-red-900 border-l-4 border-red-500' :
                                    task.priority === 'high' ? 'bg-gradient-to-r from-orange-100 to-orange-50 text-orange-900 border-l-4 border-orange-500' :
                                    task.priority === 'medium' ? 'bg-gradient-to-r from-blue-100 to-blue-50 text-blue-900 border-l-4 border-blue-500' :
                                    'bg-gradient-to-r from-gray-100 to-gray-50 text-gray-900 border-l-4 border-gray-400'
                                  } ${task.status === 'done' ? 'opacity-60 line-through' : ''}`}
                                >
                                  <div className="flex items-center space-x-2">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        toggleTaskStatus(task.id);
                                      }}
                                      className={`flex-shrink-0 w-3 h-3 rounded-sm border-2 transition-colors ${
                                        task.status === 'done'
                                          ? 'bg-green-500 border-green-500'
                                          : 'border-gray-400 hover:border-green-500 hover:bg-green-50'
                                      }`}
                                    >
                                      {task.status === 'done' && (
                                        <CheckCircle2 size={8} className="text-white m-0.5" />
                                      )}
                                    </button>
                                    <div className="flex-1 cursor-pointer min-w-0" onClick={() => startEditingTask(task)}>
                                      <div className="font-medium truncate text-xs">{task.title}</div>
                                      <div className="flex items-center space-x-2 mt-1">
                                        {task.estimatedTime && (
                                          <span className="text-xs opacity-60 flex items-center">
                                            <Clock size={8} className="mr-1" />
                                            {task.estimatedTime}m
                                          </span>
                                        )}
                                        {task.tags && task.tags.length > 0 && (
                                          <span className="text-xs bg-white bg-opacity-60 px-1 py-0.5 rounded truncate">
                                            #{task.tags[0]}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </DroppableCalendarHour>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-4">
                  <SortableContext
                    items={getTasksToShow().map(task => task.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {getTasksToShow().map((task) => {
                      const project = projects.find(p => p.id === task.projectId);
                      const dependencyStatus = getDependencyStatus(task);
                      const isSelected = selectedTasks.has(task.id);

                      return (
                        <SortableTaskItem
                          key={task.id}
                          task={task}
                          project={project}
                          dependencyStatus={dependencyStatus}
                          isSelected={isSelected}
                        />
                      );
                    })}
                  </SortableContext>

                {/* Empty state */}
                {getTasksToShow().length === 0 && (
                  <div className="text-center py-16 px-6">
                    <p>No tasks to show</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Project Form Modal */}
      {showProjectForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 w-96 max-w-90vw">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Add New Project</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
                <input
                  type="text"
                  value={newProjectData.name}
                  onChange={(e) => setNewProjectData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
                  placeholder="Project name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                <textarea
                  value={newProjectData.description}
                  onChange={(e) => setNewProjectData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
                  placeholder="Project description"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Color</label>
                <div className="flex space-x-2">
                  {['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16', '#f97316'].map(color => (
                    <button
                      key={color}
                      onClick={() => setNewProjectData(prev => ({ ...prev, color }))}
                      className={`w-8 h-8 rounded-full border-2 ${newProjectData.color === color ? 'border-gray-400' : 'border-transparent'}`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Icon</label>
                <div className="flex space-x-2">
                  {['📁', '💼', '🎯', '📚', '❤️', '🏠', '🎨', '⚡'].map(icon => (
                    <button
                      key={icon}
                      onClick={() => setNewProjectData(prev => ({ ...prev, icon }))}
                      className={`w-8 h-8 flex items-center justify-center rounded border-2 ${newProjectData.icon === icon ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}`}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex space-x-3 mt-6">
              <button
                onClick={addProject}
                className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-colors"
              >
                Create Project
              </button>
              <button
                onClick={() => {
                  setShowProjectForm(false);
                  setNewProjectData({ name: '', description: '', color: '#6366f1', icon: '📁' });
                }}
                className="flex-1 px-4 py-2 text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-md transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Task Details Modal */}
      {showTaskDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 w-2xl max-w-90vw max-h-90vh overflow-y-auto">
            {(() => {
              const task = tasks.find(t => t.id === showTaskDetails);
              if (!task) return null;
              
              const project = projects.find(p => p.id === task.projectId);
              
              return (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Task Details</h3>
                    <button
                      onClick={() => setShowTaskDetails(null)}
                      className="p-2 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100"
                    >
                      <X size={20} />
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title</label>
                      <div className="text-lg font-medium text-gray-900 dark:text-white">{task.title}</div>
                    </div>
                    
                    {task.description && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                        <div className="text-gray-600 dark:text-gray-400">{task.description}</div>
                      </div>
                    )}
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                        {task.status === 'waiting' ? 'Waiting' : 
                         task.status === 'scheduled' ? 'Scheduled' :
                         task.status === 'in_progress' ? 'In Progress' : 
                         task.status === 'done' ? 'Completed' : 'To Do'}
                      </span>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Priority</label>
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                        {task.priority}
                      </span>
                    </div>
                    
                    {project && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Project</label>
                        <div className="flex items-center space-x-2">
                          <span style={{ color: project.color }}>{project.icon}</span>
                          <span className="text-gray-900 dark:text-white">{project.name}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
    </DndContext>
  );
}
