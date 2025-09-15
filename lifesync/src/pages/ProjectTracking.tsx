import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { 
  CheckCircle, 
  Circle, 
  Play, 
  Pause, 
  Zap, 
  Plus, 
  Search,
  BarChart3,
  Target,
  CheckSquare,
  Timer,
  FileText,
  Calendar as CalendarIcon,
  Heart,
  BookOpen,
  ShoppingCart,
  Users,
  Activity,
  Code,
  Edit3,
  Trash2,
  Check,
  X,
  GripVertical,
  FolderOpen,
  ChevronDown,
  ChevronUp,
  UserPlus,
  Save,
  UserX,
  MoreHorizontal,
  Paperclip,
  Download,
  Image,
  File,
  Upload,
  StickyNote,
  MessageSquare,
  Edit2
} from 'lucide-react';
import {
  DndContext,
  closestCenter,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  useDroppable,
  pointerWithin,
  rectIntersection,
} from '@dnd-kit/core';
import type { DragEndEvent, DragStartEvent, DragOverEvent } from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface Attachment {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  uploadedBy: string;
  uploadedAt: string;
  thumbnail?: string;
}

interface Note {
  id: string;
  content: string;
  updatedBy: string;
  updatedAt: string;
  isPrivate?: boolean;
}

interface Subtask {
  id: string;
  title: string;
  completed: boolean;
  assignees?: string[];
  status: 'todo' | 'inprogress' | 'done';
  dueDate?: string;
  estimatedHours?: number;
  description?: string;
  attachments?: Attachment[];
  notes?: Note;
}

interface ProjectColumn {
  id: string;
  name: string;
  color: string;
  order: number;
}

interface UndoAction {
  id: string;
  type: 'feature_create' | 'feature_update' | 'feature_delete' | 'feature_move' | 'subtask_add' | 'subtask_delete' | 'subtask_toggle' | 'project_create' | 'project_update' | 'column_create' | 'column_update' | 'column_delete';
  description: string;
  timestamp: number;
  revert: () => void;
  projectId: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  color: string;
  role: 'owner' | 'admin' | 'member' | 'viewer';
}

interface Project {
  id: string;
  name: string;
  description: string;
  color: string;
  deadline?: string;
  releaseDate?: string;
  features: Feature[];
  columns?: ProjectColumn[];
  collaborators?: User[];
  owner: string; // User ID
}

interface Feature {
  id: string;
  title: string;
  description: string;
  status: string; // Now references column ID
  priority: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  icon: string; // Icon name as string instead of React element
  assignees?: string[]; // Array of User IDs
  dueDate?: string;
  completedDate?: string;
  estimatedHours?: number;
  actualHours?: number;
  blockedReason?: string;
  subtasks?: Subtask[];
  projectId: string;
  attachments?: Attachment[];
  watchers?: string[]; // Array of User IDs watching this task
  notes?: Note;
}

// Icon renderer function
const renderIcon = (iconName: string, size: number = 16) => {
  const iconProps = { size };
  
  switch (iconName) {
    case 'FolderOpen': return <FolderOpen {...iconProps} />;
    case 'Target': return <Target {...iconProps} />;
    case 'CheckSquare': return <CheckSquare {...iconProps} />;
    case 'Timer': return <Timer {...iconProps} />;
    case 'FileText': return <FileText {...iconProps} />;
    case 'CalendarIcon': return <CalendarIcon {...iconProps} />;
    case 'BookOpen': return <BookOpen {...iconProps} />;
    case 'Heart': return <Heart {...iconProps} />;
    case 'ShoppingCart': return <ShoppingCart {...iconProps} />;
    case 'Users': return <Users {...iconProps} />;
    case 'BarChart3': return <BarChart3 {...iconProps} />;
    default: return <FileText {...iconProps} />;
  }
};

export default function ProjectTracking() {
  const [projects, setProjects] = useState<Project[]>([
    {
      id: 'lifesync',
      name: 'PersonalAssistant - LifeSync',
      description: 'Personal productivity & life management suite',
      color: 'blue',
      deadline: '2024-11-28',
      releaseDate: '2024-12-15',
      features: [],
      columns: [
        { id: 'ideas', name: 'Ideas', color: 'purple', order: 0 },
        { id: 'working', name: 'Working', color: 'blue', order: 1 },
        { id: 'pending', name: 'Pending', color: 'yellow', order: 2 },
        { id: 'done', name: 'Done', color: 'emerald', order: 3 }
      ],
      owner: 'user-current',
      collaborators: [
        { id: 'user-alice', name: 'Alice Smith', email: 'alice@example.com', color: 'purple', role: 'admin' },
        { id: 'user-bob', name: 'Bob Johnson', email: 'bob@example.com', color: 'green', role: 'member' },
        { id: 'user-carol', name: 'Carol Davis', email: 'carol@example.com', color: 'orange', role: 'member' }
      ]
    }
  ]);
  
  const [activeProjectId, setActiveProjectId] = useState('lifesync');
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showEditProjectModal, setShowEditProjectModal] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [viewMode, setViewMode] = useState<'vertical' | 'horizontal'>('vertical');
  const [showColumnModal, setShowColumnModal] = useState(false);
  const [editingColumn, setEditingColumn] = useState<ProjectColumn | null>(null);
  const [newColumn, setNewColumn] = useState({
    name: '',
    color: 'blue'
  });
  const [editingTitleId, setEditingTitleId] = useState<string | null>(null);
  const [editingTitleValue, setEditingTitleValue] = useState('');
  const [editingSubtaskId, setEditingSubtaskId] = useState<string | null>(null);
  const [editingSubtaskValue, setEditingSubtaskValue] = useState('');
  const [showSubtaskModal, setShowSubtaskModal] = useState(false);
  const [selectedSubtaskForEdit, setSelectedSubtaskForEdit] = useState<{feature: Feature, subtask: Subtask} | null>(null);
  const [bulkAssignMode, setBulkAssignMode] = useState(false);
  const [selectedSubtasks, setSelectedSubtasks] = useState<Set<string>>(new Set());
  const [showAttachmentModal, setShowAttachmentModal] = useState(false);
  const [selectedItemForAttachment, setSelectedItemForAttachment] = useState<{type: 'feature' | 'subtask', featureId: string, subtaskId?: string} | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [expandedNotes, setExpandedNotes] = useState<Set<string>>(new Set());
  const [notesContent, setNotesContent] = useState<Record<string, string>>({});
  const [autoSaveTimeouts, setAutoSaveTimeouts] = useState<Record<string, NodeJS.Timeout>>({});
  
  // User and collaboration state
  const [currentUser] = useState<User>({
    id: 'user-current',
    name: 'You',
    email: 'you@example.com',
    color: 'blue',
    role: 'owner'
  });
  
  const [allUsers] = useState<User[]>([
    { id: 'user-current', name: 'You', email: 'you@example.com', color: 'blue', role: 'owner' },
    { id: 'user-alice', name: 'Alice Smith', email: 'alice@example.com', color: 'purple', role: 'admin' },
    { id: 'user-bob', name: 'Bob Johnson', email: 'bob@example.com', color: 'green', role: 'member' },
    { id: 'user-carol', name: 'Carol Davis', email: 'carol@example.com', color: 'orange', role: 'member' },
    { id: 'user-david', name: 'David Wilson', email: 'david@example.com', color: 'red', role: 'viewer' }
  ]);
  
  const [showCollaborationModal, setShowCollaborationModal] = useState(false);
  const [selectedTaskForAssignment, setSelectedTaskForAssignment] = useState<Feature | null>(null);
  const [filterByUser, setFilterByUser] = useState<string | null>(null);
  const [hasLoadedFromStorage, setHasLoadedFromStorage] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(new Set());
  const [showColumnVisibilityModal, setShowColumnVisibilityModal] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draggedFeature, setDraggedFeature] = useState<Feature | null>(null);
  const [recentlyAssignedUsers, setRecentlyAssignedUsers] = useState<Set<string>>(new Set());
  const [newProject, setNewProject] = useState({
    name: '',
    description: '',
    color: 'blue',
    deadline: '',
    releaseDate: '',
    collaborators: [] as string[]
  });
  const [showProjectDropdown, setShowProjectDropdown] = useState(false);
  const projectDropdownRef = useRef<HTMLDivElement>(null);

  // Undo system state
  const [undoStack, setUndoStack] = useState<UndoAction[]>([]);

  // Get current project and its features
  const activeProject = projects.find(p => p.id === activeProjectId);
  const features = activeProject?.features || [];
  
  const setFeatures = (updater: (prev: Feature[]) => Feature[]) => {
    setProjects(prev => prev.map(project => 
      project.id === activeProjectId 
        ? { ...project, features: updater(project.features) }
        : project
    ));
  };

  // Undo system utilities
  const addToUndoStack = useCallback((action: Omit<UndoAction, 'id' | 'timestamp'>) => {
    const undoAction: UndoAction = {
      ...action,
      id: `undo-${Date.now()}-${Math.random()}`,
      timestamp: Date.now(),
    };
    
    console.log('Adding to undo stack:', undoAction.description);
    setUndoStack(prev => [...prev.slice(-9), undoAction]); // Keep last 10 actions
  }, []);

  // Visual feedback utility for assignments
  const addAssignmentFeedback = useCallback((userId: string) => {
    setRecentlyAssignedUsers(prev => new Set([...prev, userId]));
    // Remove the feedback after 2 seconds
    setTimeout(() => {
      setRecentlyAssignedUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    }, 2000);
  }, []);

  const performUndo = useCallback(() => {
    console.log('Perform undo called');
    if (undoStack.length > 0) {
      const lastAction = undoStack[undoStack.length - 1];
      console.log('Reverting action:', lastAction.description);
      lastAction.revert();
      setUndoStack(prev => prev.slice(0, -1)); // Remove the last action
    } else {
      console.log('No action to undo');
    }
  }, [undoStack]);


  // Persistence utilities
  const saveToLocalStorage = useCallback(() => {
    try {
      const dataToSave = {
        projects,
        activeProjectId,
        viewMode,
        visibleColumns: Array.from(visibleColumns),
        filterByUser,
        timestamp: Date.now()
      };
      localStorage.setItem('projectTracking', JSON.stringify(dataToSave));
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
    }
  }, [projects, activeProjectId, viewMode, visibleColumns, filterByUser]);

  const loadFromLocalStorage = useCallback(() => {
    try {
      const saved = localStorage.getItem('projectTracking');
      if (saved) {
        const data = JSON.parse(saved);
        // Only load if data is recent (within 30 days)
        if (data.timestamp && Date.now() - data.timestamp < 30 * 24 * 60 * 60 * 1000) {
          if (data.projects) setProjects(data.projects);
          if (data.activeProjectId) setActiveProjectId(data.activeProjectId);
          if (data.viewMode) setViewMode(data.viewMode);
          if (data.visibleColumns) setVisibleColumns(new Set(data.visibleColumns));
          if (data.filterByUser) setFilterByUser(data.filterByUser);
          return true;
        }
      }
    } catch (error) {
      console.error('Failed to load from localStorage:', error);
    }
    return false;
  }, []);

  // Load data on component mount
  useEffect(() => {
    const loaded = loadFromLocalStorage();
    setHasLoadedFromStorage(true);
    if (loaded) {
      console.log('Loaded project data from localStorage');
    }
  }, [loadFromLocalStorage]);

  // Auto-save on data changes
  useEffect(() => {
    const timeoutId = setTimeout(saveToLocalStorage, 1000); // Debounce saves
    return () => clearTimeout(timeoutId);
  }, [saveToLocalStorage]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Undo shortcut (Ctrl+Z)
      if ((event.ctrlKey || event.metaKey) && event.key === 'z' && !event.shiftKey) {
        console.log('Ctrl+Z pressed, calling performUndo');
        event.preventDefault();
        performUndo();
      }
      
      // Number keys 1-4 for adding items to columns
      if (['1', '2', '3', '4'].includes(event.key) && !event.ctrlKey && !event.metaKey && !event.altKey) {
        const columnIndex = parseInt(event.key) - 1;
        const visibleColumnsArray = getVisibleColumns();
        if (columnIndex < visibleColumnsArray.length) {
          event.preventDefault();
          openCreateModal(visibleColumnsArray[columnIndex].id);
        }
      }
      
      // Reload shortcuts (Cmd+R, F5)
      if (((event.metaKey || event.ctrlKey) && event.key === 'r') || event.key === 'F5') {
        // Allow the reload but save data first
        saveToLocalStorage();
        console.log('Page reload detected, data saved');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [performUndo, saveToLocalStorage]);

  // Handle page unload (browser close, navigation, etc.)
  useEffect(() => {
    const handleBeforeUnload = () => {
      saveToLocalStorage();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [saveToLocalStorage]);

  // Close project dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (projectDropdownRef.current && !projectDropdownRef.current.contains(event.target as Node)) {
        setShowProjectDropdown(false);
      }
    };

    if (showProjectDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showProjectDropdown]);

  // Create new project
  const handleCreateProject = () => {
    if (!newProject.name.trim()) return;

    const project: Project = {
      id: `project-${Date.now()}`,
      name: newProject.name,
      description: newProject.description,
      color: newProject.color,
      deadline: newProject.deadline || undefined,
      releaseDate: newProject.releaseDate || undefined,
      features: [],
      columns: [
        { id: 'ideas', name: 'Ideas', color: 'purple', order: 0 },
        { id: 'working', name: 'Working', color: 'blue', order: 1 },
        { id: 'pending', name: 'Pending', color: 'yellow', order: 2 },
        { id: 'done', name: 'Done', color: 'emerald', order: 3 }
      ],
      collaborators: newProject.collaborators.map(userId => allUsers.find(u => u.id === userId)).filter(Boolean) as User[],
      owner: currentUser.id
    };

    setProjects(prev => [...prev, project]);
    setActiveProjectId(project.id);
    
    setNewProject({ name: '', description: '', color: 'blue', deadline: '', releaseDate: '', collaborators: [] });
    setShowProjectModal(false);
  };

  // Edit existing project
  const openEditProject = (project: Project) => {
    setEditingProject(project);
    setNewProject({
      name: project.name,
      description: project.description,
      color: project.color,
      deadline: project.deadline || '',
      releaseDate: project.releaseDate || '',
      collaborators: project.collaborators?.map(user => user.id) || []
    });
    setShowEditProjectModal(true);
  };

  const handleUpdateProject = () => {
    if (!editingProject || !newProject.name.trim()) return;

    const updatedProject: Project = {
      ...editingProject,
      name: newProject.name,
      description: newProject.description,
      color: newProject.color,
      deadline: newProject.deadline || undefined,
      releaseDate: newProject.releaseDate || undefined,
      collaborators: newProject.collaborators.map(userId => allUsers.find(u => u.id === userId)).filter(Boolean) as User[]
    };

    setProjects(prev => prev.map(p => p.id === editingProject.id ? updatedProject : p));
    
    setNewProject({ name: '', description: '', color: 'blue', deadline: '', releaseDate: '', collaborators: [] });
    setEditingProject(null);
    setShowEditProjectModal(false);
  };

  // Initialize with existing features for LifeSync project
  useEffect(() => {
    if (hasLoadedFromStorage && activeProject?.id === 'lifesync' && activeProject.features.length === 0) {
      // Add comprehensive features to LifeSync project
      const sampleFeatures: Feature[] = [
        // WORKING - Project Tracking Features
        {
          id: 'project-tracking-core',
          title: 'Project Tracking Core Features',
          description: 'Kanban board, drag & drop, feature management',
          status: 'working',
          priority: 'high',
          category: 'Project Management',
          icon: 'FolderOpen',
          estimatedHours: 40,
          projectId: 'lifesync',
          assignees: ['user-current', 'user-alice'],
          subtasks: [
            { id: 'pt-1', title: 'Jira-style board layout', completed: true, status: 'done', assignees: ['user-current'] },
            { id: 'pt-2', title: 'Drag and drop functionality', completed: true, status: 'done', assignees: ['user-alice'] },
            { id: 'pt-3', title: 'Feature CRUD operations', completed: true, status: 'done', assignees: ['user-current'] },
            { id: 'pt-4', title: 'Undo functionality', completed: false, status: 'inprogress', assignees: ['user-current'], notes: { id: 'note-pt-4', content: 'Need to implement undo stack for drag operations. Considering using a command pattern.', updatedBy: 'user-current', updatedAt: '2024-01-17T14:30:00Z', isPrivate: false } },
            { id: 'pt-5', title: 'Multi-user collaboration', completed: false, status: 'todo', assignees: ['user-alice'] }
          ],
          attachments: [
            {
              id: 'att-1',
              name: 'wireframes.png',
              size: 245760,
              type: 'image/png',
              url: 'demo-wireframes.png',
              uploadedBy: 'user-current',
              uploadedAt: '2024-01-15T10:30:00Z',
              thumbnail: 'demo-wireframes-thumb.png'
            },
            {
              id: 'att-2', 
              name: 'project-spec.pdf',
              size: 1048576,
              type: 'application/pdf',
              url: 'demo-spec.pdf',
              uploadedBy: 'user-alice',
              uploadedAt: '2024-01-16T14:22:00Z'
            }
          ],
          notes: {
            id: 'note-project-tracking-core',
            content: 'Working on drag & drop - getting some performance issues with large boards. Need to investigate throttling the update events.\n\nAlso need to test with multiple users to ensure real-time sync works properly.',
            updatedBy: 'user-current',
            updatedAt: '2024-01-18T09:15:00Z',
            isPrivate: false
          }
        },
        {
          id: 'project-tracking-advanced',
          title: 'Advanced Project Features',
          description: 'Timeline tracking, user assignment, task views',
          status: 'working',
          priority: 'medium',
          category: 'Project Management',
          icon: 'Target',
          estimatedHours: 24,
          projectId: 'lifesync',
          assignees: ['user-bob'],
          subtasks: [
            { id: 'pta-1', title: 'Timeline & deadline tracking', completed: true, status: 'done', assignees: ['user-bob'] },
            { id: 'pta-2', title: 'Column customization', completed: true, status: 'done', assignees: ['user-bob'] },
            { id: 'pta-3', title: 'User-specific task views', completed: false, status: 'inprogress', assignees: ['user-bob'] },
            { id: 'pta-4', title: 'Task assignment system', completed: false, status: 'todo', assignees: [] }
          ]
        },

        // IDEAS - All other features
        {
          id: 'dashboard',
          title: 'Dashboard & Overview',
          description: 'Main dashboard with stats, quick access, and daily overview',
          status: 'ideas',
          priority: 'high',
          category: 'Core',
          icon: 'BarChart3',
          estimatedHours: 16,
          projectId: 'lifesync',
          subtasks: [
            { id: 'dash-1', title: 'Create main layout', completed: false, status: 'todo', assignees: [] },
            { id: 'dash-2', title: 'Add stats widgets', completed: false, status: 'todo', assignees: [] },
            { id: 'dash-3', title: 'Implement quick actions', completed: false, status: 'todo', assignees: [] },
            { id: 'dash-4', title: 'Add responsive design', completed: false, status: 'todo', assignees: [] }
          ]
        },
        {
          id: 'habits-system',
          title: 'Habit Tracking System',
          description: 'Categories, frequency patterns, reminders, calendar view',
          status: 'ideas',
          priority: 'high',
          category: 'Productivity',
          icon: 'Target',
          estimatedHours: 24,
          projectId: 'lifesync',
          assignees: ['user-carol'],
          subtasks: [
            { id: 'habit-1', title: 'Design habit categories', completed: false, status: 'todo', assignees: [] },
            { id: 'habit-2', title: 'Build frequency selector', completed: false, status: 'todo', assignees: [] },
            { id: 'habit-3', title: 'Add reminder system', completed: false, status: 'todo', assignees: [] }
          ]
        },
        {
          id: 'tasks-todos',
          title: 'Tasks & Todo Management',
          description: 'Advanced task management with priorities, deadlines, categories',
          status: 'ideas',
          priority: 'high',
          category: 'Productivity',
          icon: 'CheckSquare',
          estimatedHours: 20,
          projectId: 'lifesync',
          subtasks: [
            { id: 'todo-1', title: 'Task prioritization', completed: false, status: 'todo', assignees: [] },
            { id: 'todo-2', title: 'Due date management', completed: false, status: 'todo', assignees: [] },
            { id: 'todo-3', title: 'Task categories', completed: false, status: 'todo', assignees: [] }
          ]
        },
        {
          id: 'calendar-integration',
          title: 'Calendar & Scheduling',
          description: 'Event management, time blocking, calendar views',
          status: 'ideas',
          priority: 'medium',
          category: 'Productivity',
          icon: 'CalendarIcon',
          estimatedHours: 18,
          projectId: 'lifesync',
          subtasks: [
            { id: 'cal-1', title: 'Event creation and editing', completed: false, status: 'todo', assignees: [] },
            { id: 'cal-2', title: 'Time blocking interface', completed: false, status: 'todo', assignees: [] },
            { id: 'cal-3', title: 'Multiple calendar views', completed: false, status: 'todo', assignees: [] }
          ]
        },
        {
          id: 'focus-timer',
          title: 'Focus & Time Management',
          description: 'Pomodoro timer, focus sessions, productivity tracking',
          status: 'ideas',
          priority: 'medium',
          category: 'Productivity',
          icon: 'Timer',
          estimatedHours: 14,
          projectId: 'lifesync',
          subtasks: [
            { id: 'focus-1', title: 'Pomodoro timer', completed: false, status: 'todo', assignees: [] },
            { id: 'focus-2', title: 'Focus session tracking', completed: false, status: 'todo', assignees: [] },
            { id: 'focus-3', title: 'Distraction blocking', completed: false, status: 'todo', assignees: [] }
          ]
        },
        {
          id: 'notes-system',
          title: 'Notes & Documentation',
          description: 'Rich text editor, organization, search, and tagging',
          status: 'ideas',
          priority: 'medium',
          category: 'Productivity',
          icon: 'FileText',
          estimatedHours: 22,
          projectId: 'lifesync',
          subtasks: [
            { id: 'notes-1', title: 'Rich text editor', completed: false, status: 'todo', assignees: [] },
            { id: 'notes-2', title: 'Note organization', completed: false, status: 'todo', assignees: [] },
            { id: 'notes-3', title: 'Search and tagging', completed: false, status: 'todo', assignees: [] }
          ]
        },
        {
          id: 'journal-wellbeing',
          title: 'Digital Journal & Wellbeing',
          description: 'Daily journaling, mood tracking, reflection prompts',
          status: 'ideas',
          priority: 'medium',
          category: 'Wellbeing',
          icon: 'BookOpen',
          estimatedHours: 16,
          projectId: 'lifesync',
          subtasks: [
            { id: 'journal-1', title: 'Daily journal entries', completed: false, status: 'todo', assignees: [] },
            { id: 'journal-2', title: 'Mood tracking', completed: false, status: 'todo', assignees: [] },
            { id: 'journal-3', title: 'Reflection prompts', completed: false, status: 'todo', assignees: [] }
          ]
        },
        {
          id: 'health-tracking',
          title: 'Health & Fitness Tracking',
          description: 'Activity logging, health metrics, wellness goals',
          status: 'ideas',
          priority: 'low',
          category: 'Wellbeing',
          icon: 'Heart',
          estimatedHours: 20,
          projectId: 'lifesync',
          subtasks: [
            { id: 'health-1', title: 'Activity tracking', completed: false, status: 'todo', assignees: [] },
            { id: 'health-2', title: 'Health metrics dashboard', completed: false, status: 'todo', assignees: [] },
            { id: 'health-3', title: 'Wellness goal setting', completed: false, status: 'todo', assignees: [] }
          ]
        },
        {
          id: 'shopping-meals',
          title: 'Shopping & Meal Planning',
          description: 'Smart grocery lists, meal planning, recipe management',
          status: 'ideas',
          priority: 'low',
          category: 'Personal',
          icon: 'ShoppingCart',
          estimatedHours: 18,
          projectId: 'lifesync',
          subtasks: [
            { id: 'shop-1', title: 'Smart grocery lists', completed: false, status: 'todo', assignees: [] },
            { id: 'shop-2', title: 'Meal planning calendar', completed: false, status: 'todo', assignees: [] },
            { id: 'shop-3', title: 'Recipe management', completed: false, status: 'todo', assignees: [] }
          ]
        },
        {
          id: 'collaboration',
          title: 'Sharing & Collaboration',
          description: 'Share lists, collaborate on projects, family coordination',
          status: 'ideas',
          priority: 'low',
          category: 'Personal',
          icon: 'Users',
          estimatedHours: 25,
          projectId: 'lifesync',
          subtasks: [
            { id: 'collab-1', title: 'User management system', completed: false, status: 'todo', assignees: [] },
            { id: 'collab-2', title: 'Shared project spaces', completed: false, status: 'todo', assignees: [] },
            { id: 'collab-3', title: 'Real-time collaboration', completed: false, status: 'todo', assignees: [] }
          ]
        }
      ];

      setProjects(prev => prev.map(p => 
        p.id === 'lifesync' ? { ...p, features: sampleFeatures } : p
      ));
    }
  }, [activeProject, hasLoadedFromStorage]);

  // Initialize visible columns when active project changes
  useEffect(() => {
    if (activeProject?.columns) {
      setVisibleColumns(new Set(activeProject.columns.map(col => col.id)));
    }
  }, [activeProject]);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingFeature, setEditingFeature] = useState<Feature | null>(null);
  const [targetColumn, setTargetColumn] = useState<Feature['status']>('ideas');
  const [newFeature, setNewFeature] = useState({
    title: '',
    description: '',
    priority: 'medium' as Feature['priority'],
    category: '',
    estimatedHours: '',
    dueDate: '',
    assignees: [] as string[]
  });
  const [subtaskInputs, setSubtaskInputs] = useState<Record<string, string>>({});

  const getFeaturesByStatus = (status: Feature['status']) => {
    let filteredFeatures = features.filter(feature => feature.status === status);
    
    // Apply user filter if active
    if (filterByUser) {
      filteredFeatures = filteredFeatures.filter(feature => 
        feature.assignees?.includes(filterByUser)
      );
    }
    
    return filteredFeatures;
  };

  // User helper functions
  const getUserById = (userId: string): User | undefined => {
    return allUsers.find(user => user.id === userId);
  };

  const getAssigneeAvatars = (assignees?: string[]) => {
    if (!assignees || assignees.length === 0) return [];
    return assignees.map(getUserById).filter(Boolean) as User[];
  };

  const toggleProjectCollaborator = (userId: string) => {
    const isSelected = newProject.collaborators.includes(userId);
    const updatedCollaborators = isSelected 
      ? newProject.collaborators.filter(id => id !== userId)
      : [...newProject.collaborators, userId];
    
    setNewProject(prev => ({ ...prev, collaborators: updatedCollaborators }));
  };

  const toggleTaskAssignment = (featureId: string, userId: string) => {
    console.log('🔥 toggleTaskAssignment called:', { featureId, userId });
    
    // Validate inputs
    if (!featureId || !userId) {
      console.error('❌ Invalid parameters:', { featureId, userId });
      return;
    }
    
    const feature = features.find(f => f.id === featureId);
    if (!feature) {
      console.error('❌ Feature not found:', featureId, 'Available features:', features.map(f => f.id));
      return;
    }

    const user = getUserById(userId);
    if (!user) {
      console.error('❌ User not found:', userId, 'Available users:', allUsers.map(u => u.id));
      return;
    }

    const currentAssignees = feature.assignees || [];
    const isAssigned = currentAssignees.includes(userId);
    console.log('📋 Current state:', { 
      featureTitle: feature.title,
      userName: user.name,
      currentAssignees, 
      isAssigned 
    });
    
    const newAssignees = isAssigned 
      ? currentAssignees.filter(id => id !== userId)
      : [...currentAssignees, userId];

    console.log('✅ Assignment change:', {
      action: isAssigned ? 'UNASSIGN' : 'ASSIGN',
      user: user.name,
      newAssignees,
      assigneeNames: newAssignees.map(id => getUserById(id)?.name).filter(Boolean)
    });

    // Update the features state
    setFeatures(prev => {
      const updated = prev.map(f => 
        f.id === featureId 
          ? { ...f, assignees: newAssignees }
          : f
      );
      console.log('🔄 Features updated, new feature:', updated.find(f => f.id === featureId)?.assignees);
      return updated;
    });

    // Add to undo stack
    addToUndoStack({
      type: 'feature_update',
      description: isAssigned 
        ? `Unassigned ${user.name} from "${feature.title}"`
        : `Assigned ${user.name} to "${feature.title}"`,
      projectId: activeProjectId,
      revert: () => {
        console.log('🔙 Reverting assignment for:', feature.title, 'back to:', currentAssignees);
        setFeatures(prev => prev.map(f => 
          f.id === featureId 
            ? { ...f, assignees: currentAssignees }
            : f
        ));
      }
    });

    // Success feedback
    console.log(`✅ Successfully ${isAssigned ? 'unassigned' : 'assigned'} ${user.name} ${isAssigned ? 'from' : 'to'} "${feature.title}"`);
    addAssignmentFeedback(userId);
  };

  // Subtask assignment function
  const toggleSubtaskAssignment = (featureId: string, subtaskId: string, userId: string) => {
    console.log('🔥 toggleSubtaskAssignment called:', { featureId, subtaskId, userId });
    
    // Validate inputs
    if (!featureId || !subtaskId || !userId) {
      console.error('❌ Invalid subtask assignment parameters:', { featureId, subtaskId, userId });
      return;
    }
    
    const feature = features.find(f => f.id === featureId);
    if (!feature) {
      console.error('❌ Feature not found for subtask assignment:', featureId);
      return;
    }
    
    const subtask = feature.subtasks?.find(st => st.id === subtaskId);
    if (!subtask) {
      console.error('❌ Subtask not found:', subtaskId, 'in feature:', feature.title);
      return;
    }
    
    const user = getUserById(userId);
    if (!user) {
      console.error('❌ User not found for subtask assignment:', userId);
      return;
    }
    
    const currentAssignees = subtask.assignees || [];
    const isCurrentlyAssigned = currentAssignees.includes(userId);
    
    console.log('📋 Subtask assignment state:', {
      featureTitle: feature.title,
      subtaskTitle: subtask.title,
      userName: user.name,
      currentAssignees,
      isCurrentlyAssigned
    });
    
    setFeatures(prev => prev.map(feature => {
      if (feature.id !== featureId) return feature;
      
      return {
        ...feature,
        subtasks: feature.subtasks?.map(subtask => {
          if (subtask.id !== subtaskId) return subtask;
          
          const currentAssignees = subtask.assignees || [];
          const isAssigned = currentAssignees.includes(userId);
          const newAssignees = isAssigned 
            ? currentAssignees.filter(id => id !== userId)
            : [...currentAssignees, userId];
          
          console.log('✅ Subtask assignment change:', {
            action: isAssigned ? 'UNASSIGN' : 'ASSIGN',
            subtaskTitle: subtask.title,
            user: user.name,
            newAssignees,
            assigneeNames: newAssignees.map(id => getUserById(id)?.name).filter(Boolean)
          });
          
          return {
            ...subtask,
            assignees: newAssignees
          };
        })
      };
    }));

    // Add to undo stack
    addToUndoStack({
      type: 'subtask_add', // Using existing type
      description: isCurrentlyAssigned 
        ? `Unassigned ${user.name} from subtask "${subtask.title}"`
        : `Assigned ${user.name} to subtask "${subtask.title}"`,
      projectId: activeProjectId,
      revert: () => {
        console.log('🔙 Reverting subtask assignment for:', subtask.title, 'back to:', currentAssignees);
        setFeatures(prev => prev.map(feature => {
          if (feature.id !== featureId) return feature;
          return {
            ...feature,
            subtasks: feature.subtasks?.map(st => {
              if (st.id !== subtaskId) return st;
              const revertedAssignees = isCurrentlyAssigned 
                ? [...currentAssignees, userId]
                : currentAssignees.filter(id => id !== userId);
              return { ...st, assignees: revertedAssignees };
            })
          };
        }));
      }
    });

    // Success feedback
    console.log(`✅ Successfully ${isCurrentlyAssigned ? 'unassigned' : 'assigned'} ${user.name} ${isCurrentlyAssigned ? 'from' : 'to'} subtask "${subtask.title}"`);
    addAssignmentFeedback(userId);
  };

  // Column management functions
  const openCreateColumnModal = () => {
    setEditingColumn(null);
    setNewColumn({ name: '', color: 'blue' });
    setShowColumnModal(true);
  };

  const openEditColumnModal = (column: ProjectColumn) => {
    setEditingColumn(column);
    setNewColumn({ name: column.name, color: column.color });
    setShowColumnModal(true);
  };

  const handleCreateColumn = () => {
    if (!newColumn.name.trim() || !activeProject) return;

    const column: ProjectColumn = {
      id: `column-${Date.now()}`,
      name: newColumn.name,
      color: newColumn.color,
      order: (activeProject.columns?.length || 0)
    };

    setProjects(prev => prev.map(project => 
      project.id === activeProjectId 
        ? { ...project, columns: [...(project.columns || []), column] }
        : project
    ));
    
    setNewColumn({ name: '', color: 'blue' });
    setShowColumnModal(false);
  };

  const handleUpdateColumn = () => {
    if (!editingColumn || !newColumn.name.trim() || !activeProject) return;

    setProjects(prev => prev.map(project => 
      project.id === activeProjectId 
        ? { 
            ...project, 
            columns: project.columns?.map(col => 
              col.id === editingColumn.id 
                ? { ...col, name: newColumn.name, color: newColumn.color }
                : col
            ) 
          }
        : project
    ));
    
    setNewColumn({ name: '', color: 'blue' });
    setEditingColumn(null);
    setShowColumnModal(false);
  };

  const handleDeleteColumn = (columnId: string) => {
    if (!activeProject || !activeProject.columns) return;
    
    // Don't allow deleting if it's the last column
    if (activeProject.columns.length <= 1) {
      alert('Cannot delete the last column. At least one column must exist.');
      return;
    }

    // Check if any features use this column
    const featuresInColumn = features.filter(f => f.status === columnId);
    if (featuresInColumn.length > 0) {
      const confirmDelete = confirm(`This column contains ${featuresInColumn.length} feature(s). Delete anyway? Features will be moved to the first available column.`);
      if (!confirmDelete) return;

      // Move features to the first remaining column
      const remainingColumns = activeProject.columns.filter(c => c.id !== columnId);
      const firstColumnId = remainingColumns[0]?.id;

      if (firstColumnId) {
        setFeatures(prev => prev.map(feature => 
          feature.status === columnId 
            ? { ...feature, status: firstColumnId }
            : feature
        ));
      }
    }

    setProjects(prev => prev.map(project => 
      project.id === activeProjectId 
        ? { 
            ...project, 
            columns: project.columns?.filter(col => col.id !== columnId) 
          }
        : project
    ));
  };

  // Inline title editing functions
  const startEditingTitle = (featureId: string, currentTitle: string) => {
    setEditingTitleId(featureId);
    setEditingTitleValue(currentTitle);
  };

  const saveInlineTitle = () => {
    if (!editingTitleId || !editingTitleValue.trim()) {
      cancelEditingTitle();
      return;
    }

    const featureToUpdate = features.find(f => f.id === editingTitleId);
    if (!featureToUpdate) return;
    
    const previousTitle = featureToUpdate.title;
    const newTitle = editingTitleValue.trim();
    
    if (previousTitle === newTitle) {
      cancelEditingTitle();
      return;
    }

    setFeatures(prev => prev.map(feature => 
      feature.id === editingTitleId 
        ? { ...feature, title: newTitle }
        : feature
    ));
    
    // Add to undo stack
    addToUndoStack({
      type: 'feature_update',
      description: `Changed title from "${previousTitle}" to "${newTitle}"`,
      projectId: activeProjectId,
      revert: () => {
        setFeatures(prev => prev.map(feature => 
          feature.id === editingTitleId 
            ? { ...feature, title: previousTitle }
            : feature
        ));
      }
    });
    
    setEditingTitleId(null);
    setEditingTitleValue('');
  };

  const cancelEditingTitle = () => {
    setEditingTitleId(null);
    setEditingTitleValue('');
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      saveInlineTitle();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      cancelEditingTitle();
    }
  };

  // Inline subtask editing functions
  const startEditingSubtask = (subtaskId: string, currentTitle: string) => {
    setEditingSubtaskId(subtaskId);
    setEditingSubtaskValue(currentTitle);
  };

  const saveInlineSubtask = () => {
    if (!editingSubtaskId || !editingSubtaskValue.trim()) {
      cancelEditingSubtask();
      return;
    }

    const newSubtaskTitle = editingSubtaskValue.trim();
    let previousSubtaskTitle = '';
    let featureId = '';

    // Find the feature and subtask
    const feature = features.find(f => 
      f.subtasks?.some(st => st.id === editingSubtaskId)
    );
    
    if (!feature) {
      cancelEditingSubtask();
      return;
    }

    const subtask = feature.subtasks?.find(st => st.id === editingSubtaskId);
    if (!subtask) {
      cancelEditingSubtask();
      return;
    }

    previousSubtaskTitle = subtask.title;
    featureId = feature.id;

    if (previousSubtaskTitle === newSubtaskTitle) {
      cancelEditingSubtask();
      return;
    }

    setFeatures(prev => prev.map(f => 
      f.id === featureId 
        ? { 
            ...f, 
            subtasks: f.subtasks?.map(st => 
              st.id === editingSubtaskId ? { ...st, title: newSubtaskTitle } : st
            ) 
          }
        : f
    ));

    // Add to undo stack
    addToUndoStack({
      type: 'subtask_add', // Using add type since we don't have subtask_update
      description: `Changed subtask from "${previousSubtaskTitle}" to "${newSubtaskTitle}"`,
      projectId: activeProjectId,
      revert: () => {
        setFeatures(prev => prev.map(f => 
          f.id === featureId 
            ? { 
                ...f, 
                subtasks: f.subtasks?.map(st => 
                  st.id === editingSubtaskId ? { ...st, title: previousSubtaskTitle } : st
                ) 
              }
            : f
        ));
      }
    });

    setEditingSubtaskId(null);
    setEditingSubtaskValue('');
  };

  const cancelEditingSubtask = () => {
    setEditingSubtaskId(null);
    setEditingSubtaskValue('');
  };

  const handleSubtaskKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      saveInlineSubtask();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      cancelEditingSubtask();
    }
  };

  // Column visibility functions
  const toggleColumnVisibility = (columnId: string) => {
    setVisibleColumns(prev => {
      const newSet = new Set(prev);
      if (newSet.has(columnId)) {
        // Don't allow hiding the last visible column
        if (newSet.size <= 1) {
          alert('At least one column must be visible.');
          return prev;
        }
        newSet.delete(columnId);
      } else {
        newSet.add(columnId);
      }
      return newSet;
    });
  };

  const showAllColumns = () => {
    if (activeProject?.columns) {
      setVisibleColumns(new Set(activeProject.columns.map(col => col.id)));
    }
  };

  const hideAllButOneColumn = (columnId: string) => {
    setVisibleColumns(new Set([columnId]));
  };

  // Get only visible columns
  const getVisibleColumns = () => {
    return activeProject?.columns?.filter(col => visibleColumns.has(col.id)).sort((a, b) => a.order - b.order) || [];
  };

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

  // Custom collision detection that prioritizes column detection
  const customCollisionDetection = (args: any) => {
    // First try pointer within detection for columns
    const pointerCollisions = pointerWithin(args);
    
    // If we have pointer collisions, prioritize column droppables
    if (pointerCollisions.length > 0) {
      const columnCollisions = pointerCollisions.filter((collision: any) => 
        activeProject?.columns?.some(col => col.id === collision.id)
      );
      
      if (columnCollisions.length > 0) {
        console.log('🎯 Custom collision detection found column:', columnCollisions[0].id);
        return columnCollisions;
      }
    }
    
    // Fallback to closest corners
    const cornerCollisions = closestCorners(args);
    if (cornerCollisions.length > 0) {
      console.log('🎯 Custom collision detection fallback to corners:', cornerCollisions[0].id);
    }
    
    return cornerCollisions;
  };

  // Drag and drop handlers
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id as string);
    
    // Find the feature being dragged
    const feature = features.find(f => f.id === active.id);
    setDraggedFeature(feature || null);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    
    if (!over) return;
    
    const activeId = active.id as string;
    const overId = over.id as string;
    
    // Don't do anything in drag over, just show visual feedback
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    setActiveId(null);
    setDraggedFeature(null);
    
    console.log('=== DRAG END DEBUG ===');
    console.log('Active:', active);
    console.log('Over:', over);
    console.log('Active ID:', active.id);
    console.log('Over ID:', over?.id);
    
    if (!over) {
      console.log('❌ Drag ended: No valid drop target');
      return;
    }
    
    const activeId = active.id as string;
    const overId = over.id as string;
    
    console.log('🎯 Drag ended:', { activeId, overId });
    console.log('📋 Available columns:', activeProject?.columns?.map(col => ({ id: col.id, name: col.name })));
    console.log('👀 Visible columns:', getVisibleColumns().map(col => ({ id: col.id, name: col.name })));
    
    // Find the column ID from the drop target
    let targetColumn = null;
    
    // Check if dropping directly on a column (including 'pending')
    const isColumnDrop = activeProject?.columns?.some(col => col.id === overId);
    console.log('🏛️ Is column drop?', isColumnDrop, 'for overId:', overId);
    
    if (isColumnDrop) {
      targetColumn = overId;
      console.log('✅ Dropped directly on column:', targetColumn);
    } else {
      // Check if dropping on another feature - get its column
      const targetFeature = features.find(f => f.id === overId);
      console.log('🎨 Target feature:', targetFeature);
      if (targetFeature) {
        targetColumn = targetFeature.status;
        console.log('✅ Dropped on feature, target column:', targetColumn);
      }
    }
    
    // Extra check specifically for pending column
    if (!targetColumn && overId === 'pending') {
      targetColumn = 'pending';
      console.log('🟡 Special case: Detected pending column drop');
    }
    
    console.log('🎯 Final target column:', targetColumn);
    
    if (targetColumn) {
      const feature = features.find(f => f.id === activeId);
      console.log('📦 Dragged feature:', feature);
      
      if (feature && feature.status !== targetColumn) {
        const previousStatus = feature.status;
        const targetColumnName = activeProject?.columns?.find(col => col.id === targetColumn)?.name || targetColumn;
        const previousColumnName = activeProject?.columns?.find(col => col.id === previousStatus)?.name || previousStatus;
        
        console.log('🚀 Moving feature:', feature.title, 'from', previousStatus, 'to', targetColumn);
        setFeatures(prev => prev.map(f => 
          f.id === activeId ? { ...f, status: targetColumn } : f
        ));
        
        // Add to undo stack
        addToUndoStack({
          type: 'feature_move',
          description: `Moved "${feature.title}" from ${previousColumnName} to ${targetColumnName}`,
          projectId: activeProjectId,
          revert: () => {
            setFeatures(prev => prev.map(f => 
              f.id === activeId ? { ...f, status: previousStatus } : f
            ));
          }
        });
      } else if (feature) {
        console.log('⚠️ Feature already in target column:', targetColumn);
      } else {
        console.log('❌ Feature not found for activeId:', activeId);
      }
    } else {
      console.log('❌ No valid target column found');
      console.log('🔍 Debugging: overId was:', overId);
      console.log('🔍 All droppable column IDs:', activeProject?.columns?.map(col => col.id));
      console.log('🔍 All feature IDs:', features.map(f => f.id));
    }
    console.log('=== END DRAG DEBUG ===');
  };

  const handleCreateFeature = () => {
    if (!newFeature.title.trim()) return;

    // Use assignees from form, fallback to project owner if none selected
    const selectedAssignees = newFeature.assignees && newFeature.assignees.length > 0 
      ? newFeature.assignees 
      : (activeProject?.owner ? [activeProject.owner] : []);

    const feature: Feature = {
      id: `feature-${Date.now()}`,
      title: newFeature.title,
      description: newFeature.description,
      status: targetColumn,
      priority: newFeature.priority,
      category: newFeature.category || 'General',
      icon: 'FileText',
      estimatedHours: newFeature.estimatedHours ? parseInt(newFeature.estimatedHours) : undefined,
      dueDate: newFeature.dueDate || undefined,
      projectId: activeProjectId,
      assignees: selectedAssignees
    };

    setFeatures(prev => [...prev, feature]);
    
    // Add to undo stack
    addToUndoStack({
      type: 'feature_create',
      description: `Created feature "${feature.title}"`,
      projectId: activeProjectId,
      revert: () => {
        setFeatures(prev => prev.filter(f => f.id !== feature.id));
      }
    });
    
    // Reset form
    setNewFeature({
      title: '',
      description: '',
      priority: 'medium',
      category: '',
      estimatedHours: '',
      dueDate: '',
      assignees: []
    });
    setShowCreateModal(false);
  };

  const openCreateModal = (status: Feature['status'] = 'ideas') => {
    setTargetColumn(status);
    
    // Reset form with project collaborator inheritance
    setNewFeature({
      title: '',
      description: '',
      priority: 'medium',
      category: '',
      estimatedHours: '',
      dueDate: '',
      assignees: []
    });
    
    setShowCreateModal(true);
  };

  const openEditModal = (feature: Feature) => {
    setEditingFeature(feature);
    setNewFeature({
      title: feature.title,
      description: feature.description,
      priority: feature.priority,
      category: feature.category,
      estimatedHours: feature.estimatedHours?.toString() || '',
      dueDate: feature.dueDate || '',
      assignees: feature.assignees || []
    });
    setShowEditModal(true);
  };

  const handleUpdateFeature = () => {
    if (!editingFeature || !newFeature.title.trim()) return;

    const previousFeature = { ...editingFeature };
    const updatedFeature: Feature = {
      ...editingFeature,
      title: newFeature.title,
      description: newFeature.description,
      priority: newFeature.priority,
      category: newFeature.category || 'General',
      estimatedHours: newFeature.estimatedHours ? parseInt(newFeature.estimatedHours) : undefined,
      dueDate: newFeature.dueDate || undefined,
      assignees: newFeature.assignees
    };

    setFeatures(prev => prev.map(f => f.id === editingFeature.id ? updatedFeature : f));
    
    // Add to undo stack
    addToUndoStack({
      type: 'feature_update',
      description: `Updated feature "${updatedFeature.title}"`,
      projectId: activeProjectId,
      revert: () => {
        setFeatures(prev => prev.map(f => f.id === previousFeature.id ? previousFeature : f));
      }
    });
    
    // Reset form
    setNewFeature({
      title: '',
      description: '',
      priority: 'medium',
      category: '',
      estimatedHours: '',
      dueDate: '',
      assignees: []
    });
    setEditingFeature(null);
    setShowEditModal(false);
  };

  const handleDeleteFeature = (featureId: string) => {
    const featureToDelete = features.find(f => f.id === featureId);
    if (!featureToDelete) return;
    
    if (confirm('Are you sure you want to delete this feature?')) {
      setFeatures(prev => prev.filter(f => f.id !== featureId));
      
      // Add to undo stack
      addToUndoStack({
        type: 'feature_delete',
        description: `Deleted feature "${featureToDelete.title}"`,
        projectId: activeProjectId,
        revert: () => {
          setFeatures(prev => [...prev, featureToDelete]);
        }
      });
    }
  };

  const addSubtask = useCallback((featureId: string) => {
    const inputValue = subtaskInputs[featureId];
    if (!inputValue || inputValue.trim() === '') return;

    const subtask: Subtask = {
      id: `subtask-${Date.now()}`,
      title: inputValue.trim(),
      completed: false,
      status: 'todo',
      assignees: []
    };

    setFeatures(prev => prev.map(f => 
      f.id === featureId 
        ? { ...f, subtasks: [...(f.subtasks || []), subtask] }
        : f
    ));
    
    // Clear only this feature's input
    setSubtaskInputs(prev => ({ ...prev, [featureId]: '' }));
  }, [subtaskInputs]);

  // Enhanced subtask management functions
  const updateSubtaskStatus = useCallback((featureId: string, subtaskId: string, newStatus: Subtask['status']) => {
    setFeatures(prev => prev.map(feature => 
      feature.id === featureId 
        ? {
            ...feature,
            subtasks: feature.subtasks?.map(subtask =>
              subtask.id === subtaskId 
                ? { 
                    ...subtask, 
                    status: newStatus,
                    completed: newStatus === 'done'
                  }
                : subtask
            )
          }
        : feature
    ));
  }, []);

  const updateSubtaskAssignees = useCallback((featureId: string, subtaskId: string, assignees: string[]) => {
    setFeatures(prev => prev.map(feature => 
      feature.id === featureId 
        ? {
            ...feature,
            subtasks: feature.subtasks?.map(subtask =>
              subtask.id === subtaskId 
                ? { ...subtask, assignees }
                : subtask
            )
          }
        : feature
    ));
  }, []);

  const bulkAssignSubtasks = useCallback((subtaskIds: string[], assignees: string[]) => {
    setFeatures(prev => prev.map(feature => ({
      ...feature,
      subtasks: feature.subtasks?.map(subtask =>
        subtaskIds.includes(subtask.id)
          ? { ...subtask, assignees }
          : subtask
      )
    })));
    setSelectedSubtasks(new Set());
    setBulkAssignMode(false);
  }, []);

  // Attachment management functions
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <Image size={16} className="text-green-500" />;
    if (type.includes('pdf')) return <File size={16} className="text-red-500" />;
    if (type.includes('document') || type.includes('word')) return <File size={16} className="text-blue-500" />;
    if (type.includes('spreadsheet') || type.includes('excel')) return <File size={16} className="text-green-600" />;
    return <File size={16} className="text-gray-500" />;
  };

  const handleFileUpload = useCallback((files: FileList, featureId: string, subtaskId?: string) => {
    Array.from(files).forEach(file => {
      // Create a mock URL for demo purposes (in real app, upload to server)
      const mockUrl = URL.createObjectURL(file);
      
      const attachment: Attachment = {
        id: `attachment-${Date.now()}-${Math.random()}`,
        name: file.name,
        size: file.size,
        type: file.type,
        url: mockUrl,
        uploadedBy: currentUser.id,
        uploadedAt: new Date().toISOString(),
        thumbnail: file.type.startsWith('image/') ? mockUrl : undefined
      };

      setFeatures(prev => prev.map(feature => {
        if (feature.id === featureId) {
          if (subtaskId) {
            // Add to subtask
            return {
              ...feature,
              subtasks: feature.subtasks?.map(subtask =>
                subtask.id === subtaskId
                  ? { ...subtask, attachments: [...(subtask.attachments || []), attachment] }
                  : subtask
              )
            };
          } else {
            // Add to feature
            return {
              ...feature,
              attachments: [...(feature.attachments || []), attachment]
            };
          }
        }
        return feature;
      }));
    });
  }, [currentUser.id]);

  const removeAttachment = useCallback((attachmentId: string, featureId: string, subtaskId?: string) => {
    setFeatures(prev => prev.map(feature => {
      if (feature.id === featureId) {
        if (subtaskId) {
          // Remove from subtask
          return {
            ...feature,
            subtasks: feature.subtasks?.map(subtask =>
              subtask.id === subtaskId
                ? { ...subtask, attachments: subtask.attachments?.filter(att => att.id !== attachmentId) }
                : subtask
            )
          };
        } else {
          // Remove from feature
          return {
            ...feature,
            attachments: feature.attachments?.filter(att => att.id !== attachmentId)
          };
        }
      }
      return feature;
    }));
  }, []);

  // Notes management functions
  const updateNotes = useCallback((itemId: string, content: string, isSubtask: boolean = false, featureId?: string) => {
    const note: Note = {
      id: `note-${itemId}`,
      content,
      updatedBy: currentUser.id,
      updatedAt: new Date().toISOString(),
      isPrivate: false
    };

    setFeatures(prev => prev.map(feature => {
      if (isSubtask && feature.id === featureId) {
        return {
          ...feature,
          subtasks: feature.subtasks?.map(subtask =>
            subtask.id === itemId ? { ...subtask, notes: note } : subtask
          )
        };
      } else if (!isSubtask && feature.id === itemId) {
        return { ...feature, notes: note };
      }
      return feature;
    }));
  }, [currentUser.id]);

  const handleNotesChange = useCallback((itemId: string, content: string, isSubtask: boolean = false, featureId?: string) => {
    // Update local state immediately
    setNotesContent(prev => ({ ...prev, [itemId]: content }));

    // Clear existing timeout
    if (autoSaveTimeouts[itemId]) {
      clearTimeout(autoSaveTimeouts[itemId]);
    }

    // Set new auto-save timeout
    const timeoutId = setTimeout(() => {
      updateNotes(itemId, content, isSubtask, featureId);
      setAutoSaveTimeouts(prev => {
        const newTimeouts = { ...prev };
        delete newTimeouts[itemId];
        return newTimeouts;
      });
    }, 1000); // Auto-save after 1 second of inactivity

    setAutoSaveTimeouts(prev => ({ ...prev, [itemId]: timeoutId }));
  }, [autoSaveTimeouts, updateNotes]);

  const toggleNotesExpansion = useCallback((itemId: string) => {
    setExpandedNotes(prev => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(itemId)) {
        newExpanded.delete(itemId);
      } else {
        newExpanded.add(itemId);
      }
      return newExpanded;
    });
  }, []);

  // Initialize notes content from features
  useEffect(() => {
    const initialContent: Record<string, string> = {};
    features.forEach(feature => {
      if (feature.notes?.content) {
        initialContent[feature.id] = feature.notes.content;
      }
      feature.subtasks?.forEach(subtask => {
        if (subtask.notes?.content) {
          initialContent[subtask.id] = subtask.notes.content;
        }
      });
    });
    setNotesContent(initialContent);
  }, [features]);

  const toggleSubtask = (featureId: string, subtaskId: string) => {
    const feature = features.find(f => f.id === featureId);
    const subtask = feature?.subtasks?.find(st => st.id === subtaskId);
    if (!feature || !subtask) return;
    
    const wasCompleted = subtask.completed;
    
    setFeatures(prev => prev.map(f => 
      f.id === featureId 
        ? { 
            ...f, 
            subtasks: f.subtasks?.map(st => 
              st.id === subtaskId ? { ...st, completed: !st.completed } : st
            ) 
          }
        : f
    ));
    
    // Add to undo stack
    addToUndoStack({
      type: 'subtask_toggle',
      description: `${wasCompleted ? 'Unchecked' : 'Checked'} subtask "${subtask.title}"`,
      projectId: activeProjectId,
      revert: () => {
        setFeatures(prev => prev.map(f => 
          f.id === featureId 
            ? { 
                ...f, 
                subtasks: f.subtasks?.map(st => 
                  st.id === subtaskId ? { ...st, completed: wasCompleted } : st
                ) 
              }
            : f
        ));
      }
    });
  };

  const deleteSubtask = (featureId: string, subtaskId: string) => {
    const feature = features.find(f => f.id === featureId);
    const subtaskToDelete = feature?.subtasks?.find(st => st.id === subtaskId);
    if (!feature || !subtaskToDelete) return;
    
    setFeatures(prev => prev.map(f => 
      f.id === featureId 
        ? { ...f, subtasks: f.subtasks?.filter(st => st.id !== subtaskId) }
        : f
    ));
    
    // Add to undo stack
    addToUndoStack({
      type: 'subtask_delete',
      description: `Deleted subtask "${subtaskToDelete.title}"`,
      projectId: activeProjectId,
      revert: () => {
        setFeatures(prev => prev.map(f => 
          f.id === featureId 
            ? { ...f, subtasks: [...(f.subtasks || []), subtaskToDelete] }
            : f
        ));
      }
    });
  };

  const getPriorityColor = (priority: Feature['priority']) => {
    switch (priority) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  // Subtask input with Enter key to save
  const SimpleSubtaskInput = ({ featureId }: { featureId: string }) => {
    const [localValue, setLocalValue] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);
    
    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setLocalValue(e.target.value);
    }, []);

    const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' && localValue.trim()) {
        e.preventDefault();
        e.stopPropagation();
        
        // Add the subtask
        const subtask: Subtask = {
          id: `subtask-${Date.now()}`,
          title: localValue.trim(),
          completed: false,
          status: 'todo',
          assignees: []
        };

        setFeatures(prev => prev.map(f => 
          f.id === featureId 
            ? { ...f, subtasks: [...(f.subtasks || []), subtask] }
            : f
        ));
        
        // Add to undo stack
        addToUndoStack({
          type: 'subtask_add',
          description: `Added subtask "${subtask.title}"`,
          projectId: activeProjectId,
          revert: () => {
            setFeatures(prev => prev.map(f => 
              f.id === featureId 
                ? { ...f, subtasks: f.subtasks?.filter(st => st.id !== subtask.id) }
                : f
            ));
          }
        });
        
        // Clear the input
        setLocalValue('');
        
        // Keep focus on input for more entries
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }
    }, [localValue, featureId]);

    const handleFocus = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
      e.stopPropagation();
      // Prevent any scroll behavior
      if (inputRef.current) {
        inputRef.current.scrollIntoView = () => {};
      }
    }, []);
    
    return (
      <div 
        className="mt-2 bg-gray-50 p-1.5 rounded"
        style={{ 
          height: '36px', 
          minHeight: '36px', 
          maxHeight: '36px', 
          overflow: 'hidden',
          position: 'relative'
        }}
      >
        <input
          ref={inputRef}
          type="text"
          placeholder="Add subtask..."
          value={localValue}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          onBlur={(e) => e.stopPropagation()}
          className="w-full border border-gray-300 rounded px-2 py-1 text-xs"
          style={{ 
            height: '24px',
            minHeight: '24px',
            maxHeight: '24px',
            boxSizing: 'border-box',
            position: 'relative'
          }}
          autoComplete="off"
          spellCheck="false"
        />
      </div>
    );
  };

  // Draggable Feature Component for Vertical View
  const DraggableFeature = ({ feature, column }: { feature: Feature, column: ProjectColumn }) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id: feature.id });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.5 : 1,
    };

    // Get color classes safely
    const bgClass = column.color === 'blue' ? 'bg-blue-50' : 
                    column.color === 'purple' ? 'bg-purple-50' : 
                    column.color === 'yellow' ? 'bg-yellow-50' : 
                    column.color === 'emerald' ? 'bg-emerald-50' : 
                    column.color === 'green' ? 'bg-green-50' : 
                    column.color === 'orange' ? 'bg-orange-50' : 'bg-gray-50';
    
    const borderClass = column.color === 'blue' ? 'border-blue-200' : 
                        column.color === 'purple' ? 'border-purple-200' : 
                        column.color === 'yellow' ? 'border-yellow-200' : 
                        column.color === 'emerald' ? 'border-emerald-200' : 
                        column.color === 'green' ? 'border-green-200' : 
                        column.color === 'orange' ? 'border-orange-200' : 'border-gray-200';

    return (
      <div
        ref={setNodeRef}
        style={style}
        className={`border rounded-md p-3 hover:shadow-sm transition-shadow relative ${bgClass} ${borderClass} ${
          isDragging ? 'shadow-lg z-50' : ''
        } ${dragOver ? 'ring-2 ring-blue-400 bg-blue-100' : ''}`}
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setDragOver(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setDragOver(false);
        }}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setDragOver(false);
          
          if (e.dataTransfer.files.length > 0) {
            handleFileUpload(e.dataTransfer.files, feature.id);
          }
        }}
      >
        <div className="flex items-start space-x-2 mb-2">
          {/* Drag Handle */}
          <div 
            {...attributes}
            {...listeners}
            className="flex-shrink-0 pt-1 opacity-70 hover:opacity-100 cursor-grab active:cursor-grabbing bg-gray-100 hover:bg-gray-200 rounded p-1 transition-all"
            title="🎯 DRAG ME to move between columns"
          >
            <GripVertical size={16} className="text-gray-600 hover:text-blue-600" />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              {editingTitleId === feature.id ? (
            <input
              type="text"
              value={editingTitleValue}
              onChange={(e) => setEditingTitleValue(e.target.value)}
              onKeyDown={handleTitleKeyDown}
              onBlur={saveInlineTitle}
              className="flex-1 text-sm font-medium text-gray-900 bg-transparent border-none outline-none focus:bg-white focus:border focus:border-blue-500 focus:rounded px-1 py-0.5 mr-2"
              autoFocus
            />
          ) : (
            <h4 
              className="text-sm font-medium text-gray-900 line-clamp-2 cursor-pointer hover:bg-white hover:bg-opacity-50 px-1 py-0.5 rounded flex-1"
              onClick={() => startEditingTitle(feature.id, feature.title)}
              title="Click to edit title"
            >
              {feature.title}
            </h4>
          )}
          <div className="flex items-center space-x-1 ml-2">
            {column.id === 'working' && getFeaturesByStatus('working').length > 0 && (
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            )}
            <button 
              onClick={(e) => {
                e.stopPropagation();
                openEditModal(feature);
              }} 
              className="text-gray-400 hover:text-gray-600"
            >
              <Edit3 size={12} />
            </button>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteFeature(feature.id);
              }} 
              className="text-gray-400 hover:text-red-600"
            >
              <Trash2 size={12} />
            </button>
          </div>
        </div>
        </div>
        </div>
        <p className="text-xs text-gray-600 mb-2 line-clamp-1">{feature.description}</p>
        
        {/* Enhanced Jira-style Subtasks for Vertical View */}
        {feature.subtasks && feature.subtasks.length > 0 && (
          <div className="mb-2">
            <div className="flex items-center justify-between text-xs font-medium text-gray-700 mb-2">
              <span>Subtasks ({feature.subtasks.filter(st => st.status === 'done').length}/{feature.subtasks.length})</span>
              <div className="flex items-center space-x-1">
                {bulkAssignMode && (
                  <button
                    onClick={() => setBulkAssignMode(false)}
                    className="text-gray-400 hover:text-gray-600"
                    title="Exit bulk assign mode"
                  >
                    <X size={12} />
                  </button>
                )}
                <button
                  onClick={() => setBulkAssignMode(!bulkAssignMode)}
                  className="text-blue-500 hover:text-blue-700"
                  title="Bulk assign mode"
                >
                  <UserPlus size={12} />
                </button>
              </div>
            </div>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {feature.subtasks.map((subtask) => (
                <div key={subtask.id} className="flex items-center space-x-2 p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  {bulkAssignMode && (
                    <input
                      type="checkbox"
                      checked={selectedSubtasks.has(subtask.id)}
                      onChange={(e) => {
                        const newSelected = new Set(selectedSubtasks);
                        if (e.target.checked) {
                          newSelected.add(subtask.id);
                        } else {
                          newSelected.delete(subtask.id);
                        }
                        setSelectedSubtasks(newSelected);
                      }}
                      className="w-3 h-3"
                    />
                  )}
                  
                  {/* Status Indicator */}
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const nextStatus = subtask.status === 'todo' ? 'inprogress' : 
                                         subtask.status === 'inprogress' ? 'done' : 'todo';
                        updateSubtaskStatus(feature.id, subtask.id, nextStatus);
                      }}
                      className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                        subtask.status === 'done' 
                          ? 'bg-green-500 border-green-500 text-white' 
                          : subtask.status === 'inprogress'
                          ? 'bg-blue-500 border-blue-500 text-white'
                          : 'border-gray-300 hover:border-blue-400'
                      }`}
                      title={`Status: ${subtask.status}`}
                    >
                      {subtask.status === 'done' && <Check size={10} />}
                      {subtask.status === 'inprogress' && <Play size={8} />}
                    </button>
                  </div>
                  
                  {editingSubtaskId === subtask.id ? (
                    <input
                      type="text"
                      value={editingSubtaskValue}
                      onChange={(e) => setEditingSubtaskValue(e.target.value)}
                      onKeyDown={handleSubtaskKeyDown}
                      onBlur={saveInlineSubtask}
                      className="text-xs flex-1 bg-white text-gray-900 border border-blue-500 rounded px-2 py-1 outline-none focus:ring-2 focus:ring-blue-300"
                      autoFocus
                    />
                  ) : (
                    <span 
                      className={`text-xs flex-1 cursor-pointer hover:bg-white hover:bg-opacity-50 px-1 py-0.5 rounded ${subtask.completed ? 'line-through text-gray-400' : 'text-gray-600'}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        startEditingSubtask(subtask.id, subtask.title);
                      }}
                      title="Click to edit subtask"
                    >
                      {subtask.title}
                    </span>
                  )}

                  {/* Subtask Assignee Avatars */}
                  <div className="flex items-center space-x-0.5">
                    {getAssigneeAvatars(subtask.assignees).slice(0, 2).map((user, index) => (
                      <div
                        key={user.id}
                        className={`relative w-4 h-4 rounded-full bg-${user.color}-500 text-white text-xs flex items-center justify-center font-medium group cursor-pointer hover:scale-110 transition-transform`}
                        title={`${user.name} - Click to unassign from subtask`}
                        style={{ marginLeft: index > 0 ? '-2px' : '0' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSubtaskAssignment(feature.id, subtask.id, user.id);
                        }}
                      >
                        {user.name.charAt(0)}
                        <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <X size={4} className="text-white" />
                        </div>
                      </div>
                    ))}
                    {subtask.assignees && subtask.assignees.length > 2 && (
                      <div className="w-4 h-4 rounded-full bg-gray-400 text-white text-xs flex items-center justify-center font-medium" style={{ marginLeft: '-2px' }}>
                        +{subtask.assignees.length - 2}
                      </div>
                    )}
                    
                    {/* Quick Assign to Subtask */}
                    {activeProject?.collaborators && activeProject.collaborators.length > 0 && (
                      <div className="relative group">
                        <button
                          className="w-4 h-4 rounded-full border border-dashed border-gray-300 text-gray-400 text-xs flex items-center justify-center hover:border-blue-400 hover:text-blue-600 transition-all"
                          title="Assign to subtask"
                        >
                          +
                        </button>
                        <div className="absolute top-5 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-1 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-opacity">
                          {activeProject.collaborators.slice(0, 3).map((user) => {
                            const isAssigned = subtask.assignees?.includes(user.id);
                            return (
                              <button
                                key={user.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleSubtaskAssignment(feature.id, subtask.id, user.id);
                                }}
                                className={`flex items-center space-x-1 w-full text-left px-1 py-0.5 rounded text-xs hover:bg-gray-100 ${
                                  isAssigned ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                                }`}
                              >
                                <div className={`w-3 h-3 rounded-full bg-${user.color}-500 text-white text-xs flex items-center justify-center`}>
                                  {user.name.charAt(0)}
                                </div>
                                <span className="text-xs">{user.name}</span>
                                {isAssigned && <Check size={8} className="text-blue-600" />}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Subtask Notes Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleNotesExpansion(subtask.id);
                    }}
                    className={`text-yellow-500 hover:text-yellow-700 ${
                      subtask.notes?.content || notesContent[subtask.id] ? 'opacity-100' : 'opacity-50'
                    }`}
                    title="Add notes"
                  >
                    <StickyNote size={8} />
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteSubtask(feature.id, subtask.id);
                    }}
                    className="text-red-400 hover:text-red-600"
                  >
                    <X size={8} />
                  </button>
                </div>
              ))}
            </div>
            
            {/* Expanded Subtask Notes */}
            {feature.subtasks?.map((subtask) => (
              expandedNotes.has(subtask.id) && (
                <div key={`notes-${subtask.id}`} className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
                  <div className="flex items-center space-x-1 mb-1">
                    <StickyNote size={10} className="text-yellow-500" />
                    <span className="text-xs font-medium text-gray-700">Notes for: {subtask.title}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleNotesExpansion(subtask.id);
                      }}
                      className="text-gray-400 hover:text-gray-600 ml-auto"
                    >
                      <X size={10} />
                    </button>
                  </div>
                  <textarea
                    value={notesContent[subtask.id] || subtask.notes?.content || ''}
                    onChange={(e) => {
                      e.stopPropagation();
                      handleNotesChange(subtask.id, e.target.value, true, feature.id);
                    }}
                    placeholder="Add notes for this subtask..."
                    className="w-full text-xs bg-white border border-yellow-300 rounded p-2 resize-none focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                    rows={3}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div className="flex items-center justify-between mt-1 text-xs text-gray-500">
                    <span>Auto-saves after 1 second</span>
                    {autoSaveTimeouts[subtask.id] && (
                      <span className="text-yellow-600 flex items-center space-x-1">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                        <span>Saving...</span>
                      </span>
                    )}
                  </div>
                </div>
              )
            ))}
            
            {/* Bulk Assignment Panel */}
            {bulkAssignMode && selectedSubtasks.size > 0 && (
              <div className="mt-2 p-2 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-blue-700">
                    Bulk Assign {selectedSubtasks.size} subtask{selectedSubtasks.size !== 1 ? 's' : ''}
                  </span>
                  <button
                    onClick={() => {
                      setSelectedSubtasks(new Set());
                      setBulkAssignMode(false);
                    }}
                    className="text-blue-400 hover:text-blue-600"
                  >
                    <X size={12} />
                  </button>
                </div>
                <div className="flex items-center space-x-2">
                  {activeProject?.collaborators.map(collaborator => (
                    <button
                      key={collaborator.id}
                      onClick={() => bulkAssignSubtasks(Array.from(selectedSubtasks), [collaborator.id])}
                      className="flex items-center space-x-1 bg-white hover:bg-blue-100 border border-blue-300 rounded px-2 py-1 transition-colors"
                      title={`Assign all selected subtasks to ${collaborator.name}`}
                    >
                      <div className={`w-4 h-4 rounded-full bg-${collaborator.color}-500 text-white text-xs flex items-center justify-center font-medium`}>
                        {collaborator.name.charAt(0)}
                      </div>
                      <span className="text-xs text-blue-700">{collaborator.name}</span>
                    </button>
                  ))}
                  <button
                    onClick={() => bulkAssignSubtasks(Array.from(selectedSubtasks), [])}
                    className="flex items-center space-x-1 bg-white hover:bg-red-100 border border-red-300 rounded px-2 py-1 transition-colors"
                    title="Unassign all selected subtasks"
                  >
                    <UserX size={12} className="text-red-500" />
                    <span className="text-xs text-red-700">Unassign</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Feature Attachments */}
        {feature.attachments && feature.attachments.length > 0 && (
          <div className="mb-2">
            <div className="text-xs font-medium text-gray-700 mb-1">
              Attachments ({feature.attachments.length})
            </div>
            <div className="grid grid-cols-2 gap-1">
              {feature.attachments.slice(0, 4).map((attachment) => (
                <div key={attachment.id} className="flex items-center space-x-1 p-1 bg-gray-50 rounded text-xs hover:bg-gray-100 transition-colors group">
                  {getFileIcon(attachment.type)}
                  <span className="truncate flex-1" title={attachment.name}>
                    {attachment.name}
                  </span>
                  <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(attachment.url, '_blank');
                      }}
                      className="text-blue-500 hover:text-blue-700"
                      title="Download"
                    >
                      <Download size={10} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeAttachment(attachment.id, feature.id);
                      }}
                      className="text-red-500 hover:text-red-700"
                      title="Remove"
                    >
                      <X size={10} />
                    </button>
                  </div>
                </div>
              ))}
              {feature.attachments.length > 4 && (
                <div className="text-xs text-gray-500 p-1">
                  +{feature.attachments.length - 4} more
                </div>
              )}
            </div>
          </div>
        )}

        {/* Feature Notes - Scratch Pad */}
        <div className="mb-2">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center space-x-1">
              <StickyNote size={12} className="text-yellow-500" />
              <span className="text-xs font-medium text-gray-700">Notes</span>
              {feature.notes?.content && (
                <span className="text-xs text-gray-500">
                  • Last updated {new Date(feature.notes.updatedAt).toLocaleDateString()}
                </span>
              )}
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleNotesExpansion(feature.id);
              }}
              className="text-xs text-gray-500 hover:text-gray-700 flex items-center space-x-1"
            >
              {expandedNotes.has(feature.id) ? (
                <>
                  <span>Collapse</span>
                  <ChevronUp size={12} />
                </>
              ) : (
                <>
                  <span>Expand</span>
                  <ChevronDown size={12} />
                </>
              )}
            </button>
          </div>
          
          {/* Collapsed View - Show preview */}
          {!expandedNotes.has(feature.id) && (
            <div 
              className="text-xs text-gray-600 bg-yellow-50 border border-yellow-200 rounded p-2 cursor-pointer hover:bg-yellow-100 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                toggleNotesExpansion(feature.id);
              }}
            >
              {notesContent[feature.id] || feature.notes?.content ? (
                <div className="truncate">
                  {(notesContent[feature.id] || feature.notes?.content || '').slice(0, 60)}
                  {(notesContent[feature.id] || feature.notes?.content || '').length > 60 && '...'}
                </div>
              ) : (
                <div className="text-gray-400 italic">Click to add notes...</div>
              )}
            </div>
          )}
          
          {/* Expanded View - Full textarea */}
          {expandedNotes.has(feature.id) && (
            <div className="bg-yellow-50 border border-yellow-200 rounded p-2">
              <textarea
                value={notesContent[feature.id] || feature.notes?.content || ''}
                onChange={(e) => {
                  e.stopPropagation();
                  handleNotesChange(feature.id, e.target.value);
                }}
                placeholder="Add your notes, thoughts, blockers, or any updates here..."
                className="w-full text-xs bg-white border border-yellow-300 rounded p-2 resize-none focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                rows={4}
                onClick={(e) => e.stopPropagation()}
              />
              <div className="flex items-center justify-between mt-1 text-xs text-gray-500">
                <span>Auto-saves after 1 second</span>
                {autoSaveTimeouts[feature.id] && (
                  <span className="text-yellow-600 flex items-center space-x-1">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                    <span>Saving...</span>
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Add subtask input for vertical view */}
        <div className="mb-2">
          <SimpleSubtaskInput featureId={feature.id} />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(feature.priority)}`}>
              {feature.priority}
            </span>
            <span className="text-xs text-gray-500">{feature.category}</span>
          </div>
          
          {/* Dynamic Assignee Management */}
          <div className="flex items-center space-x-1">
            {getAssigneeAvatars(feature.assignees).slice(0, 3).map((user, index) => (
              <div
                key={user.id}
                className={`relative w-6 h-6 rounded-full bg-${user.color}-500 text-white text-xs flex items-center justify-center font-medium border-2 border-white shadow-sm group cursor-pointer hover:scale-110 transition-transform ${
                  recentlyAssignedUsers.has(user.id) ? 'animate-pulse ring-2 ring-blue-400' : ''
                }`}
                title={`${user.name} - Click to unassign`}
                style={{ marginLeft: index > 0 ? '-8px' : '0' }}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleTaskAssignment(feature.id, user.id);
                }}
              >
                {user.name.charAt(0)}
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <X size={8} className="text-white" />
                </div>
              </div>
            ))}
            {feature.assignees && feature.assignees.length > 3 && (
              <div 
                className="w-6 h-6 rounded-full bg-gray-400 text-white text-xs flex items-center justify-center font-medium border-2 border-white shadow-sm cursor-pointer hover:bg-gray-500 transition-colors" 
                style={{ marginLeft: '-8px' }}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedTaskForAssignment(feature);
                  setShowCollaborationModal(true);
                }}
                title="View all assignees"
              >
                +{feature.assignees.length - 3}
              </div>
            )}
            
            {/* Quick Add Assignee */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSelectedTaskForAssignment(feature);
                setShowCollaborationModal(true);
              }}
              className="w-6 h-6 rounded-full border-2 border-dashed border-gray-300 text-gray-400 text-xs flex items-center justify-center hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-all"
              title="Add assignee"
            >
              +
            </button>
            
            {/* Quick Assign Project Collaborators */}
            {activeProject?.collaborators && activeProject.collaborators.length > 0 && (
              <div className="relative group">
                <button
                  className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-xs flex items-center justify-center hover:bg-blue-200 transition-colors"
                  title="Quick assign project collaborators"
                >
                  👥
                </button>
                <div className="absolute top-8 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-2 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-opacity">
                  <div className="text-xs font-medium text-gray-700 mb-1">Quick Assign:</div>
                  {activeProject.collaborators.slice(0, 3).map((user) => {
                    const isAssigned = feature.assignees?.includes(user.id);
                    return (
                      <button
                        key={user.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleTaskAssignment(feature.id, user.id);
                        }}
                        className={`flex items-center space-x-1 w-full text-left px-2 py-1 rounded text-xs hover:bg-gray-100 ${
                          isAssigned ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                        }`}
                      >
                        <div className={`w-4 h-4 rounded-full bg-${user.color}-500 text-white text-xs flex items-center justify-center`}>
                          {user.name.charAt(0)}
                        </div>
                        <span>{user.name}</span>
                        {isAssigned && <Check size={10} className="text-blue-600" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            
            {/* Attachment Button */}
            <div className="relative">
              <input
                type="file"
                multiple
                onChange={(e) => {
                  if (e.target.files) {
                    handleFileUpload(e.target.files, feature.id);
                    e.target.value = '';
                  }
                }}
                className="hidden"
                id={`file-upload-${feature.id}`}
              />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  document.getElementById(`file-upload-${feature.id}`)?.click();
                }}
                className="w-6 h-6 rounded-full border-2 border-dashed border-gray-300 text-gray-400 text-xs flex items-center justify-center hover:border-green-400 hover:text-green-600 hover:bg-green-50 transition-all"
                title="Add attachment"
              >
                <Paperclip size={12} />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };


  // Enhanced Feature Card Component (Draggable for Horizontal View)
  const FeatureCard = ({ feature }: { feature: Feature }) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id: feature.id });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.5 : 1,
    };
    const handleSubtaskChange = useCallback((featureId: string, value: string) => {
      setSubtaskInputs(prev => ({ ...prev, [featureId]: value }));
    }, []);

    const isCurrentlyWorking = feature.status === 'working';
    const completedSubtasks = feature.subtasks?.filter(st => st.completed).length || 0;
    const totalSubtasks = feature.subtasks?.length || 0;
    const progressPercentage = totalSubtasks > 0 ? (completedSubtasks / totalSubtasks) * 100 : 0;

    return (
    <div 
      ref={setNodeRef}
      className={`bg-white border rounded-lg p-4 hover:shadow-md transition-all relative ${
        isCurrentlyWorking 
          ? 'border-blue-300 shadow-sm ring-1 ring-blue-100' 
          : 'border-gray-200'
      } ${isDragging ? 'shadow-lg' : ''} ${dragOver ? 'ring-2 ring-blue-400 bg-blue-50' : ''}`}
      style={{ 
        minHeight: '200px',
        maxWidth: '100%',
        overflow: 'hidden',
        ...style
      }}
      onDragOver={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragOver(true);
      }}
      onDragLeave={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragOver(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragOver(false);
        
        if (e.dataTransfer.files.length > 0) {
          handleFileUpload(e.dataTransfer.files, feature.id);
        }
      }}
    >
      <div className="flex items-start space-x-3">
        {/* Drag Handle */}
        <div 
          {...attributes}
          {...listeners}
          className="flex-shrink-0 pt-1 opacity-70 hover:opacity-100 cursor-grab active:cursor-grabbing bg-gray-100 hover:bg-gray-200 rounded p-1 transition-all"
          title="🎯 DRAG ME to move between columns"
        >
          <GripVertical size={16} className="text-gray-600 hover:text-blue-600" />
        </div>
        <div className="flex-shrink-0 p-2 bg-gray-100 rounded-lg">
          {renderIcon(feature.icon, 16)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {editingTitleId === feature.id ? (
              <input
                type="text"
                value={editingTitleValue}
                onChange={(e) => setEditingTitleValue(e.target.value)}
                onKeyDown={handleTitleKeyDown}
                onBlur={saveInlineTitle}
                className="flex-1 text-sm font-medium text-gray-900 bg-transparent border-none outline-none focus:bg-white focus:border focus:border-blue-500 focus:rounded px-1 py-0.5"
                autoFocus
              />
            ) : (
              <h3 
                className="text-sm font-medium text-gray-900 cursor-pointer hover:bg-gray-50 px-1 py-0.5 rounded flex-1"
                onClick={() => startEditingTitle(feature.id, feature.title)}
                title="Click to edit title"
              >
                {feature.title}
              </h3>
            )}
            {isCurrentlyWorking && (
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                <span className="text-xs text-blue-600 font-medium">ACTIVE</span>
              </div>
            )}
          </div>
          <p className="text-xs text-gray-600 mb-2 line-clamp-2">{feature.description}</p>
          
          {/* Progress Bar for Currently Working Tasks */}
          {isCurrentlyWorking && totalSubtasks > 0 && (
            <div className="mb-2">
              <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                <span>Progress</span>
                <span>{completedSubtasks}/{totalSubtasks} subtasks</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progressPercentage}%` }}
                ></div>
              </div>
            </div>
          )}
          
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(feature.priority)}`}>
                {feature.priority}
              </span>
              <span className="text-xs text-gray-500">{feature.category}</span>
            </div>
            
            {/* Dynamic Assignee Management */}
            <div className="flex items-center space-x-1">
              {getAssigneeAvatars(feature.assignees).slice(0, 4).map((user, index) => (
                <div
                  key={user.id}
                  className={`relative w-7 h-7 rounded-full bg-${user.color}-500 text-white text-xs flex items-center justify-center font-medium border-2 border-white shadow-sm group cursor-pointer hover:scale-110 transition-transform ${
                    recentlyAssignedUsers.has(user.id) ? 'animate-pulse ring-2 ring-blue-400' : ''
                  }`}
                  title={`${user.name} - Click to unassign`}
                  style={{ marginLeft: index > 0 ? '-10px' : '0' }}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleTaskAssignment(feature.id, user.id);
                  }}
                >
                  {user.name.charAt(0)}
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <X size={8} className="text-white" />
                  </div>
                </div>
              ))}
              {feature.assignees && feature.assignees.length > 4 && (
                <div 
                  className="w-7 h-7 rounded-full bg-gray-400 text-white text-xs flex items-center justify-center font-medium border-2 border-white shadow-sm cursor-pointer hover:bg-gray-500 transition-colors" 
                  style={{ marginLeft: '-10px' }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedTaskForAssignment(feature);
                    setShowCollaborationModal(true);
                  }}
                  title="View all assignees"
                >
                  +{feature.assignees.length - 4}
                </div>
              )}
              
              {/* Quick Add Assignee */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedTaskForAssignment(feature);
                  setShowCollaborationModal(true);
                }}
                className="w-7 h-7 rounded-full border-2 border-dashed border-gray-300 text-gray-400 text-xs flex items-center justify-center hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-all"
                title="Add assignee"
              >
                +
              </button>
              
              {/* Quick Assign Dropdown */}
              {activeProject?.collaborators && activeProject.collaborators.length > 0 && (
                <div className="relative group">
                  <button
                    className="w-7 h-7 rounded-full bg-blue-100 text-blue-600 text-xs flex items-center justify-center hover:bg-blue-200 transition-colors"
                    title="Quick assign project collaborators"
                  >
                    👥
                  </button>
                  <div className="absolute top-8 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-2 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-opacity">
                    <div className="text-xs font-medium text-gray-700 mb-1">Quick Assign:</div>
                    {activeProject.collaborators.slice(0, 3).map((user) => {
                      const isAssigned = feature.assignees?.includes(user.id);
                      return (
                        <button
                          key={user.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleTaskAssignment(feature.id, user.id);
                          }}
                          className={`flex items-center space-x-1 w-full text-left px-2 py-1 rounded text-xs hover:bg-gray-100 ${
                            isAssigned ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                          }`}
                        >
                          <div className={`w-4 h-4 rounded-full bg-${user.color}-500 text-white text-xs flex items-center justify-center`}>
                            {user.name.charAt(0)}
                          </div>
                          <span>{user.name}</span>
                          {isAssigned && <Check size={10} className="text-blue-600" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-1 text-xs text-gray-500">
            {feature.estimatedHours && (
              <div>⏱️ {feature.estimatedHours}h estimated</div>
            )}
            {feature.actualHours && (
              <div>✅ {feature.actualHours}h actual</div>
            )}
            {feature.dueDate && (
              <div>📅 Due: {feature.dueDate}</div>
            )}
            {feature.assignee && (
              <div>👤 {feature.assignee}</div>
            )}
            {feature.blockedReason && (
              <div className="text-red-600 font-medium">🚫 {feature.blockedReason}</div>
            )}
          </div>

          {/* Subtasks */}
          {feature.subtasks && feature.subtasks.length > 0 && (
            <div className="mt-3 space-y-2">
              <div className="text-xs font-medium text-gray-700">
                Subtasks ({feature.subtasks.filter(st => st.completed).length}/{feature.subtasks.length})
              </div>
              {feature.subtasks.map((subtask) => (
                <div key={subtask.id} className="flex items-center space-x-2">
                  <button
                    onClick={() => toggleSubtask(feature.id, subtask.id)}
                    className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                      subtask.completed 
                        ? 'bg-green-500 border-green-500 text-white' 
                        : 'border-gray-300 hover:border-green-400'
                    }`}
                  >
                    {subtask.completed && <Check size={10} />}
                  </button>
                  {editingSubtaskId === subtask.id ? (
                    <input
                      type="text"
                      value={editingSubtaskValue}
                      onChange={(e) => setEditingSubtaskValue(e.target.value)}
                      onKeyDown={handleSubtaskKeyDown}
                      onBlur={saveInlineSubtask}
                      className="text-xs flex-1 bg-white text-gray-900 border border-blue-500 rounded px-2 py-1 outline-none focus:ring-2 focus:ring-blue-300"
                      autoFocus
                    />
                  ) : (
                    <span 
                      className={`text-xs flex-1 cursor-pointer hover:bg-white hover:bg-opacity-50 px-1 py-0.5 rounded ${subtask.completed ? 'line-through text-gray-400' : 'text-gray-600'}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        startEditingSubtask(subtask.id, subtask.title);
                      }}
                      title="Click to edit subtask"
                    >
                      {subtask.title}
                    </span>
                  )}

                  {/* Subtask Assignee Avatars */}
                  <div className="flex items-center space-x-0.5">
                    {getAssigneeAvatars(subtask.assignees).slice(0, 2).map((user, index) => (
                      <div
                        key={user.id}
                        className={`relative w-4 h-4 rounded-full bg-${user.color}-500 text-white text-xs flex items-center justify-center font-medium group cursor-pointer hover:scale-110 transition-transform`}
                        title={`${user.name} - Click to unassign from subtask`}
                        style={{ marginLeft: index > 0 ? '-2px' : '0' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSubtaskAssignment(feature.id, subtask.id, user.id);
                        }}
                      >
                        {user.name.charAt(0)}
                        <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <X size={4} className="text-white" />
                        </div>
                      </div>
                    ))}
                    {subtask.assignees && subtask.assignees.length > 2 && (
                      <div className="w-4 h-4 rounded-full bg-gray-400 text-white text-xs flex items-center justify-center font-medium" style={{ marginLeft: '-2px' }}>
                        +{subtask.assignees.length - 2}
                      </div>
                    )}
                    
                    {/* Quick Assign to Subtask */}
                    {activeProject?.collaborators && activeProject.collaborators.length > 0 && (
                      <div className="relative group">
                        <button
                          className="w-4 h-4 rounded-full border border-dashed border-gray-300 text-gray-400 text-xs flex items-center justify-center hover:border-blue-400 hover:text-blue-600 transition-all"
                          title="Assign to subtask"
                        >
                          +
                        </button>
                        <div className="absolute top-5 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-1 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-opacity">
                          {activeProject.collaborators.slice(0, 3).map((user) => {
                            const isAssigned = subtask.assignees?.includes(user.id);
                            return (
                              <button
                                key={user.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleSubtaskAssignment(feature.id, subtask.id, user.id);
                                }}
                                className={`flex items-center space-x-1 w-full text-left px-1 py-0.5 rounded text-xs hover:bg-gray-100 ${
                                  isAssigned ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                                }`}
                              >
                                <div className={`w-3 h-3 rounded-full bg-${user.color}-500 text-white text-xs flex items-center justify-center`}>
                                  {user.name.charAt(0)}
                                </div>
                                <span className="text-xs">{user.name}</span>
                                {isAssigned && <Check size={8} className="text-blue-600" />}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Subtask Notes Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleNotesExpansion(subtask.id);
                    }}
                    className={`text-yellow-500 hover:text-yellow-700 p-1 ${
                      subtask.notes?.content || notesContent[subtask.id] ? 'opacity-100' : 'opacity-50'
                    }`}
                    title="Add notes"
                  >
                    <StickyNote size={10} />
                  </button>

                  <button
                    onClick={() => deleteSubtask(feature.id, subtask.id)}
                    className="text-red-400 hover:text-red-600 p-1"
                  >
                    <X size={10} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Feature Notes - Horizontal View */}
          <div className="mt-2">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center space-x-1">
                <StickyNote size={12} className="text-yellow-500" />
                <span className="text-xs font-medium text-gray-700">Notes</span>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleNotesExpansion(feature.id);
                }}
                className="text-xs text-gray-500 hover:text-gray-700"
              >
                {expandedNotes.has(feature.id) ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              </button>
            </div>
            
            {/* Notes Content */}
            {expandedNotes.has(feature.id) ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded p-2">
                <textarea
                  value={notesContent[feature.id] || feature.notes?.content || ''}
                  onChange={(e) => {
                    e.stopPropagation();
                    handleNotesChange(feature.id, e.target.value);
                  }}
                  placeholder="Add your notes, thoughts, blockers, or updates..."
                  className="w-full text-xs bg-white border border-yellow-300 rounded p-2 resize-none focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                  rows={3}
                  onClick={(e) => e.stopPropagation()}
                />
                <div className="flex items-center justify-between mt-1 text-xs text-gray-500">
                  <span>Auto-saves</span>
                  {autoSaveTimeouts[feature.id] && (
                    <span className="text-yellow-600 flex items-center space-x-1">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                      <span>Saving...</span>
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <div 
                className="text-xs text-gray-600 bg-yellow-50 border border-yellow-200 rounded p-2 cursor-pointer hover:bg-yellow-100 transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleNotesExpansion(feature.id);
                }}
              >
                {notesContent[feature.id] || feature.notes?.content ? (
                  <div className="truncate">
                    {(notesContent[feature.id] || feature.notes?.content || '').slice(0, 50)}...
                  </div>
                ) : (
                  <div className="text-gray-400 italic">Click to add notes...</div>
                )}
              </div>
            )}
          </div>

          {/* Add subtask - TEST VERSION */}
          <SimpleSubtaskInput featureId={feature.id} />
        </div>
        
        {/* Edit/Delete buttons */}
        <div className="flex flex-col space-y-1">
          <button 
            onClick={(e) => {
              e.stopPropagation();
              openEditModal(feature);
            }}
            className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-blue-600"
            title="Edit feature"
          >
            <Edit3 size={14} />
          </button>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteFeature(feature.id);
            }}
            className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-red-600"
            title="Delete feature"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
    );
  };

  // Calculate stats dynamically based on project columns
  const getColumnStats = () => {
    const columns = activeProject?.columns || [];
    const stats: Record<string, number> = { total: features.length };
    
    columns.forEach(column => {
      stats[column.id] = getFeaturesByStatus(column.id).length;
    });
    
    return stats;
  };

  const stats = getColumnStats();
  const visibleColumnsArray = getVisibleColumns();

  // Calculate project progress
  const totalFeatures = features.length;
  const completedFeatures = stats.done || 0;
  const inProgressFeatures = stats.working || 0;
  const progressPercentage = totalFeatures > 0 ? (completedFeatures / totalFeatures) * 100 : 0;
  const inProgressPercentage = totalFeatures > 0 ? (inProgressFeatures / totalFeatures) * 100 : 0;

  // Calculate deadline and release date progress
  const getProjectTimeline = () => {
    const now = new Date();
    const projectStart = new Date('2024-01-01'); // Assume project started Jan 1
    
    let deadlineInfo = null;
    let releaseInfo = null;
    
    if (activeProject?.deadline) {
      const deadline = new Date(activeProject.deadline);
      const totalTime = deadline.getTime() - projectStart.getTime();
      const timeLeft = deadline.getTime() - now.getTime();
      const timeUsed = totalTime - timeLeft;
      const timeProgress = Math.max(0, Math.min(100, (timeUsed / totalTime) * 100));
      const daysLeft = Math.ceil(timeLeft / (1000 * 60 * 60 * 24));
      
      deadlineInfo = {
        date: deadline,
        daysLeft,
        timeProgress,
        isOverdue: daysLeft < 0,
        label: 'Development Deadline'
      };
    }
    
    if (activeProject?.releaseDate) {
      const releaseDate = new Date(activeProject.releaseDate);
      const releaseDaysLeft = Math.ceil((releaseDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      releaseInfo = {
        date: releaseDate,
        daysLeft: releaseDaysLeft,
        isOverdue: releaseDaysLeft < 0,
        label: 'Product Release'
      };
    }
    
    return { deadlineInfo, releaseInfo };
  };

  const { deadlineInfo, releaseInfo } = getProjectTimeline();

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={customCollisionDetection}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="space-y-6">
      {/* Project Header with Selector */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Project Tracking</h1>
            <p className="text-gray-600">{activeProject?.description || 'Manage your projects'}</p>
          </div>
          
          {/* Project Selector */}
          <div className="flex items-center space-x-3">
            <div className="relative" ref={projectDropdownRef}>
              <button
                onClick={() => setShowProjectDropdown(!showProjectDropdown)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white flex items-center justify-between min-w-48 hover:bg-gray-50 hover:border-gray-400 transition-colors group"
              >
                <span className="flex items-center space-x-2">
                  <FolderOpen size={16} className="text-gray-500 group-hover:text-blue-600 transition-colors" />
                  <span className="text-gray-900 group-hover:text-blue-700 transition-colors">{activeProject?.name || 'Select Project'}</span>
                </span>
                <ChevronDown size={16} className={`text-gray-400 group-hover:text-blue-600 transition-all ${showProjectDropdown ? 'rotate-180' : ''}`} />
              </button>
              
              {showProjectDropdown && (
                <div className="absolute top-full left-0 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                  <div className="py-1">
                    {projects.map(project => (
                      <button
                        key={project.id}
                        onClick={() => {
                          setActiveProjectId(project.id);
                          setShowProjectDropdown(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-sm flex items-center space-x-2 transition-colors group ${
                          project.id === activeProjectId 
                            ? 'bg-blue-50 text-blue-700' 
                            : 'text-gray-900 hover:bg-blue-50 hover:text-blue-700'
                        }`}
                      >
                        <FolderOpen size={14} className={`transition-colors ${
                          project.id === activeProjectId 
                            ? 'text-blue-500' 
                            : 'text-gray-400 group-hover:text-blue-500'
                        }`} />
                        <span className="transition-colors">{project.name}</span>
                        {project.id === activeProjectId && <Check size={14} className="ml-auto text-blue-600" />}
                      </button>
                    ))}
                    <div className="border-t border-gray-100 my-1"></div>
                    {activeProject && (
                      <button
                        onClick={() => {
                          openEditProject(activeProject);
                          setShowProjectDropdown(false);
                        }}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 hover:text-gray-900 flex items-center space-x-2 text-gray-700 transition-colors group"
                      >
                        <Edit3 size={14} className="text-gray-500 group-hover:text-gray-700 transition-colors" />
                        <span className="transition-colors">Edit Project</span>
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setShowProjectModal(true);
                        setShowProjectDropdown(false);
                      }}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-green-50 hover:text-green-800 flex items-center space-x-2 text-green-700 transition-colors group"
                    >
                      <Plus size={14} className="text-green-600 group-hover:text-green-700 transition-colors" />
                      <span className="transition-colors">New Project</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            {activeProject && (
              <>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Target & Tracking Bar */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <div>
              <h3 className="text-lg font-bold text-gray-900">{activeProject?.name || 'Project'}</h3>
              <p className="text-sm text-gray-600">Project Progress & Timeline</p>
            </div>
            
            <div className="flex items-center space-x-2">
              {deadlineInfo && (
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                  deadlineInfo.isOverdue 
                    ? 'bg-indigo-100 text-indigo-700' 
                    : deadlineInfo.daysLeft <= 7 
                      ? 'bg-orange-100 text-orange-700'
                      : 'bg-blue-100 text-blue-700'
                }`}>
                  🎯 {deadlineInfo.isOverdue 
                    ? `${Math.abs(deadlineInfo.daysLeft)} days overdue`
                    : `${deadlineInfo.daysLeft} days to deadline`
                  }
                </div>
              )}
              
              {releaseInfo && (
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                  releaseInfo.isOverdue 
                    ? 'bg-emerald-100 text-emerald-700' 
                    : releaseInfo.daysLeft <= 14 
                      ? 'bg-purple-100 text-purple-700'
                      : 'bg-green-100 text-green-700'
                }`}>
                  🚀 {releaseInfo.isOverdue 
                    ? `Release ${Math.abs(releaseInfo.daysLeft)} days overdue`
                    : `${releaseInfo.daysLeft} days to release`
                  }
                </div>
              )}
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-2xl font-bold text-gray-900">
              {Math.round(progressPercentage)}%
            </div>
            <div className="text-sm text-gray-600">Complete</div>
          </div>
        </div>

        {/* Progress Bars */}
        <div className="space-y-4">
          {/* Feature Progress */}
          <div>
            <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
              <span>Features Progress</span>
              <span>{completedFeatures}/{totalFeatures} features completed</span>
            </div>
            <div className="relative w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div 
                className="absolute top-0 left-0 h-full bg-green-500 transition-all duration-500 rounded-full"
                style={{ width: `${progressPercentage}%` }}
              ></div>
              <div 
                className="absolute top-0 h-full bg-blue-400 transition-all duration-500 rounded-full"
                style={{ 
                  left: `${progressPercentage}%`,
                  width: `${inProgressPercentage}%` 
                }}
              ></div>
            </div>
            <div className="flex items-center justify-between text-xs text-gray-500 mt-1">
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                Completed ({completedFeatures})
              </span>
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                In Progress ({inProgressFeatures})
              </span>
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                Remaining ({totalFeatures - completedFeatures - inProgressFeatures})
              </span>
            </div>
          </div>

          {/* Timeline Progress */}
          {(deadlineInfo || releaseInfo) && (
            <div className="space-y-3">
              {deadlineInfo && (
                <div>
                  <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                    <span>Development Timeline</span>
                    <span>🎯 Deadline: {deadlineInfo.date.toLocaleDateString()}</span>
                  </div>
                  <div className="relative w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div 
                      className={`absolute top-0 left-0 h-full transition-all duration-500 rounded-full ${
                        deadlineInfo.isOverdue ? 'bg-red-500' : 'bg-blue-500'
                      }`}
                      style={{ width: `${Math.min(100, deadlineInfo.timeProgress)}%` }}
                    ></div>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-500 mt-1">
                    <span>Started</span>
                    <span className={deadlineInfo.isOverdue ? 'text-red-600 font-medium' : 'text-blue-600'}>
                      {deadlineInfo.isOverdue ? 'OVERDUE' : 'On Track'}
                    </span>
                    <span>Dev Complete</span>
                  </div>
                </div>
              )}
              
              {releaseInfo && (
                <div>
                  <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                    <span>Release Timeline</span>
                    <span>🚀 Release: {releaseInfo.date.toLocaleDateString()}</span>
                  </div>
                  <div className="relative w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div 
                      className={`absolute top-0 left-0 h-full transition-all duration-500 rounded-full ${
                        releaseInfo.isOverdue ? 'bg-red-500' : 'bg-purple-500'
                      }`}
                      style={{ 
                        width: deadlineInfo 
                          ? `${Math.min(100, (deadlineInfo.timeProgress || 0) + 20)}%` 
                          : '60%' 
                      }}
                    ></div>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-500 mt-1">
                    <span>Development</span>
                    <span className={releaseInfo.isOverdue ? 'text-red-600 font-medium' : 'text-purple-600'}>
                      {releaseInfo.isOverdue ? 'DELAYED' : 'Scheduled'}
                    </span>
                    <span>Public Release</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Quick Stats */}
        <div className={`grid gap-4 mt-4 pt-4 border-t border-gray-100`} style={{ gridTemplateColumns: `repeat(${visibleColumnsArray.length}, minmax(0, 1fr))` }}>
          {visibleColumnsArray.map((column) => (
            <div key={column.id} className="text-center">
              <div className={`text-lg font-bold text-${column.color}-600`}>{stats[column.id] || 0}</div>
              <div className="text-xs text-gray-600">{column.name}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Active Work Summary */}
      {getFeaturesByStatus('working').length > 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-500 rounded-lg">
                <Play size={20} className="text-white" />
              </div>
              <div>
                <h3 className="font-bold text-blue-900">Currently Active</h3>
                <p className="text-sm text-blue-700">
                  {getFeaturesByStatus('working').length} task{getFeaturesByStatus('working').length !== 1 ? 's' : ''} in progress
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {getFeaturesByStatus('working').map((feature, index) => (
                <div key={feature.id} className="text-right">
                  <div className="text-sm font-medium text-blue-900 truncate max-w-32">{feature.title}</div>
                  <div className="text-xs text-blue-600">
                    {feature.subtasks?.filter(st => st.completed).length || 0}/{feature.subtasks?.length || 0} subtasks
                  </div>
                </div>
              ))}
              <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>
      )}


      {/* Project Board Controls */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* View Toggle */}
            <button
              onClick={() => setViewMode(viewMode === 'vertical' ? 'horizontal' : 'vertical')}
              className="flex items-center space-x-2 bg-gray-100 hover:bg-gray-200 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-all"
              title={`Switch to ${viewMode === 'vertical' ? 'horizontal' : 'vertical'} view`}
            >
              {viewMode === 'vertical' ? (
                <>
                  <div className="flex space-x-0.5">
                    <div className="w-1 h-4 bg-current rounded-full"></div>
                    <div className="w-1 h-4 bg-current rounded-full"></div>
                    <div className="w-1 h-4 bg-current rounded-full"></div>
                    <div className="w-1 h-4 bg-current rounded-full"></div>
                  </div>
                  <span>Vertical</span>
                </>
              ) : (
                <>
                  <div className="flex flex-col space-y-0.5">
                    <div className="w-4 h-1 bg-current rounded-full"></div>
                    <div className="w-4 h-1 bg-current rounded-full"></div>
                    <div className="w-4 h-1 bg-current rounded-full"></div>
                    <div className="w-4 h-1 bg-current rounded-full"></div>
                  </div>
                  <span>Horizontal</span>
                </>
              )}
            </button>

            {/* Combined Column Management */}
            <button
              onClick={() => setShowColumnVisibilityModal(true)}
              className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded-lg flex items-center space-x-2 transition-colors text-sm"
            >
              <CheckSquare size={14} />
              <span>Manage Columns</span>
            </button>

            {/* Quick Add Buttons for Testing */}
            <div className="flex items-center space-x-2">
              <span className="text-xs text-gray-500">Quick Add:</span>
              {getVisibleColumns().map((column, index) => {
                // Use fixed classes to avoid Tailwind purging issues
                const getColumnClasses = (color: string) => {
                  switch (color) {
                    case 'blue': return 'bg-blue-100 hover:bg-blue-200 text-blue-700';
                    case 'purple': return 'bg-purple-100 hover:bg-purple-200 text-purple-700';
                    case 'yellow': return 'bg-yellow-100 hover:bg-yellow-200 text-yellow-700';
                    case 'emerald': return 'bg-emerald-100 hover:bg-emerald-200 text-emerald-700';
                    case 'green': return 'bg-green-100 hover:bg-green-200 text-green-700';
                    case 'orange': return 'bg-orange-100 hover:bg-orange-200 text-orange-700';
                    case 'red': return 'bg-red-100 hover:bg-red-200 text-red-700';
                    default: return 'bg-gray-100 hover:bg-gray-200 text-gray-700';
                  }
                };
                
                return (
                  <button
                    key={column.id}
                    onClick={() => openCreateModal(column.id)}
                    className={`${getColumnClasses(column.color)} px-2 py-1 rounded text-xs transition-colors flex items-center space-x-1`}
                    title={`Add to ${column.name} (Press ${index + 1})`}
                  >
                    <Plus size={12} />
                    <span>{column.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* User Filter */}
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Filter by:</span>
              <select
                value={filterByUser || ''}
                onChange={(e) => setFilterByUser(e.target.value || null)}
                className="border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">All Users</option>
                {allUsers.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Keyboard Shortcuts Info */}
            <div className="text-xs text-gray-500 bg-gray-50 px-3 py-2 rounded-lg border">
              Press <kbd className="bg-gray-200 px-1.5 py-0.5 rounded text-xs font-mono">1-4</kbd> to add items to columns
            </div>
          </div>
        </div>
      </div>

      {/* Columns Layout */}
      {viewMode === 'vertical' ? (
        /* Jira-style Board Layout */
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden w-full">
          {/* Board Header */}
          <div className="grid border-b border-gray-200 overflow-x-auto" style={{ gridTemplateColumns: `repeat(${visibleColumnsArray.length}, minmax(280px, 1fr))` }}>
            {visibleColumnsArray.map((column, index) => (
              <div key={column.id} className={`p-4 ${index < visibleColumnsArray.length - 1 ? 'border-r border-gray-200' : ''}`}>
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-gray-900">{column.name.toUpperCase()}</h3>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-500">{getFeaturesByStatus(column.id).length}</span>
                    <div className="flex space-x-1">
                      <button 
                        onClick={() => openEditColumnModal(column)}
                        className="text-gray-400 hover:text-gray-600 p-1"
                        title="Edit column"
                      >
                        <Edit3 size={12} />
                      </button>
                      <button 
                        onClick={() => handleDeleteColumn(column.id)}
                        className="text-gray-400 hover:text-red-600 p-1"
                        title="Delete column"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Board Content */}
          <div className="grid overflow-x-auto" style={{ gridTemplateColumns: `repeat(${visibleColumnsArray.length}, minmax(280px, 1fr))` }}>
            {visibleColumnsArray.map((column, index) => {
              const DroppableColumn = () => {
                const { setNodeRef, isOver } = useDroppable({
                  id: column.id,
                });

                // Debug logging for droppable state
                console.log(`🔵 Column ${column.id} (${column.name}) - isOver:`, isOver);
                
                // Log when droppable is created
                console.log(`📋 Created droppable for column:`, {
                  id: column.id,
                  name: column.name,
                  color: column.color,
                  order: column.order
                });

                return (
                  <div 
                    ref={setNodeRef}
                    className={`relative ${index < visibleColumnsArray.length - 1 ? 'border-r border-gray-200' : ''} ${
                      isOver ? 'bg-blue-50 ring-2 ring-blue-300' : ''
                    } transition-all duration-200`}
                    style={{ minHeight: '60vh' }}
                    data-column-id={column.id}
                    data-droppable="true"
                    data-testid={`droppable-column-${column.id}`}
                    onMouseEnter={() => console.log(`🎯 Mouse entered column ${column.id}`)}
                    onMouseLeave={() => console.log(`❌ Mouse left column ${column.id}`)}
                    onDragEnter={() => console.log(`🟡 Drag entered column ${column.id}`)}
                    onDragOver={(e) => {
                      e.preventDefault();
                      console.log(`🟡 Drag over column ${column.id}`);
                    }}
                    onDrop={() => console.log(`🟡 Drop event on column ${column.id}`)}
                  >
                    {/* Main column content */}
                    <div className="p-3 h-full">
                      <SortableContext
                        items={getFeaturesByStatus(column.id).map(f => f.id)}
                        strategy={verticalListSortingStrategy}
                      >
                        <div className="space-y-3 min-h-full">
                          {getFeaturesByStatus(column.id).map((feature) => (
                            <DraggableFeature key={feature.id} feature={feature} column={column} />
                          ))}
                          {getFeaturesByStatus(column.id).length === 0 && (
                            <div className="text-center py-8 text-gray-400">
                              <div className="text-sm">No items yet</div>
                              <div className="text-xs mt-1">Press {visibleColumnsArray.findIndex(col => col.id === column.id) + 1} to add items</div>
                            </div>
                          )}
                          
                          {/* Extra drop space for easier targeting */}
                          <div className={`min-h-32 rounded-lg border-2 border-dashed ${
                            isOver ? 'border-blue-400 bg-blue-100' : 'border-gray-200'
                          } flex items-center justify-center transition-all`}>
                            <div className="text-center text-gray-400 text-sm">
                              {isOver ? '📦 Drop here!' : 'Drop tasks here'}
                            </div>
                          </div>
                        </div>
                      </SortableContext>
                    </div>
                  </div>
                );
              };

              return <DroppableColumn key={column.id} />;
            })}
          </div>
        </div>
      ) : (
        /* Horizontal View - Stacked Rows */
        <div className="space-y-6">
          {visibleColumnsArray.map((column) => {
            const DroppableHorizontalColumn = () => {
              const { setNodeRef, isOver } = useDroppable({
                id: column.id,
              });

              // Get safe CSS classes for the column color
              const getColumnBgClasses = (color: string) => {
                switch (color) {
                  case 'blue': return 'bg-blue-50 border-blue-200';
                  case 'purple': return 'bg-purple-50 border-purple-200';
                  case 'yellow': return 'bg-yellow-50 border-yellow-200';
                  case 'emerald': return 'bg-emerald-50 border-emerald-200';
                  case 'green': return 'bg-green-50 border-green-200';
                  case 'orange': return 'bg-orange-50 border-orange-200';
                  case 'red': return 'bg-red-50 border-red-200';
                  default: return 'bg-gray-50 border-gray-200';
                }
              };

              return (
                <div 
                  ref={setNodeRef}
                  className={`relative ${getColumnBgClasses(column.color)} rounded-xl ${
                    isOver ? 'ring-2 ring-blue-400 bg-blue-50' : ''
                  } transition-all`}
                  data-column-id={column.id}
                  data-droppable-column={column.id}
                  data-testid={`droppable-horizontal-${column.id}`}
                  style={{ minHeight: '200px' }}
                >
                  {/* Full droppable background */}
                  <div className="absolute inset-0 rounded-xl z-0" />
                  
                  <div className="relative z-10 p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 ${getColumnBgClasses(column.color).split(' ')[0].replace('50', '100')} rounded-lg`}>
                          {column.id === 'ideas' && <Zap size={18} className={`text-${column.color}-600`} />}
                          {column.id === 'working' && <Play size={18} className={`text-${column.color}-600`} />}
                          {column.id === 'pending' && <Pause size={18} className={`text-${column.color}-600`} />}
                          {column.id === 'done' && <CheckCircle size={18} className={`text-${column.color}-600`} />}
                          {!['ideas', 'working', 'pending', 'done'].includes(column.id) && <FileText size={18} className={`text-${column.color}-600`} />}
                        </div>
                        <div>
                          <h2 className="font-bold text-gray-900">
                            {column.id === 'ideas' && '💡 '}
                            {column.id === 'working' && '⚡ '}
                            {column.id === 'pending' && '⏸️ '}
                            {column.id === 'done' && '✅ '}
                            {column.name} ({stats[column.id] || 0})
                          </h2>
                          <p className="text-xs text-gray-600">
                            {column.id === 'ideas' && 'Brain dump & inspiration'}
                            {column.id === 'working' && 'In active development'}
                            {column.id === 'pending' && 'Blocked or waiting'}
                            {column.id === 'done' && 'Completed features'}
                            {!['ideas', 'working', 'pending', 'done'].includes(column.id) && 'Custom column'}
                          </p>
                        </div>
                        {column.id === 'working' && (stats.working || 0) > 0 && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <button 
                          onClick={() => openEditColumnModal(column)}
                          className="p-2 hover:bg-gray-100 hover:shadow-sm rounded-lg transition-all"
                          title="Edit column"
                        >
                          <Edit3 size={16} className="text-gray-400 hover:text-gray-600" />
                        </button>
                      </div>
                    </div>
                    <SortableContext
                      items={getFeaturesByStatus(column.id).map(f => f.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 min-h-[100px]">
                        {getFeaturesByStatus(column.id).map((feature) => (
                          <FeatureCard key={feature.id} feature={feature} />
                        ))}
                        {getFeaturesByStatus(column.id).length === 0 && (
                          <div className="col-span-full text-center py-8 text-gray-400">
                            <div className="text-sm font-medium">No {column.name.toLowerCase()} yet</div>
                            <div className="text-xs mt-1">Press {visibleColumnsArray.findIndex(col => col.id === column.id) + 1} to add items or drag items here</div>
                          </div>
                        )}
                        {/* Extra drop space */}
                        <div className="col-span-full h-16" />
                      </div>
                    </SortableContext>
                  </div>
                </div>
              );
            };

            return <DroppableHorizontalColumn key={column.id} />;
          })}
        </div>
      )}

      {/* Create Feature Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">
                Add New Feature to {activeProject?.columns?.find(col => col.id === targetColumn)?.name || 'Column'}
              </h2>
              <button 
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  value={newFeature.title}
                  onChange={(e) => setNewFeature({...newFeature, title: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Feature title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={newFeature.description}
                  onChange={(e) => setNewFeature({...newFeature, description: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Feature description"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Priority
                  </label>
                  <select
                    value={newFeature.priority}
                    onChange={(e) => setNewFeature({...newFeature, priority: e.target.value as Feature['priority']})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <input
                    type="text"
                    value={newFeature.category}
                    onChange={(e) => setNewFeature({...newFeature, category: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. Enhancement"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Estimated Hours
                  </label>
                  <input
                    type="number"
                    value={newFeature.estimatedHours}
                    onChange={(e) => setNewFeature({...newFeature, estimatedHours: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="8"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={newFeature.dueDate}
                    onChange={(e) => setNewFeature({...newFeature, dueDate: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* User Assignment Section */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  👥 Assign to Team Members
                </label>
                <p className="text-xs text-gray-500 mb-3">Select team members to work on this feature</p>
                
                {/* Project Collaborators */}
                {activeProject?.collaborators && activeProject.collaborators.length > 0 && (
                  <div className="mb-3">
                    <h5 className="text-xs font-medium text-blue-700 mb-2">Project Collaborators</h5>
                    <div className="grid grid-cols-1 gap-2 max-h-24 overflow-y-auto">
                      {activeProject.collaborators.map((user) => {
                        const isSelected = newFeature.assignees?.includes(user.id) || false;
                        return (
                          <label key={user.id} className="flex items-center space-x-2 p-2 bg-blue-50 border border-blue-200 rounded cursor-pointer hover:bg-blue-100">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {
                                const currentAssignees = newFeature.assignees || [];
                                const updatedAssignees = isSelected 
                                  ? currentAssignees.filter(id => id !== user.id)
                                  : [...currentAssignees, user.id];
                                setNewFeature(prev => ({ ...prev, assignees: updatedAssignees }));
                              }}
                              className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                            />
                            <div className={`w-6 h-6 rounded-full bg-${user.color}-500 text-white text-xs flex items-center justify-center font-medium`}>
                              {user.name.charAt(0)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-xs font-medium text-gray-900">{user.name}</div>
                              <div className="text-xs text-blue-600">{user.role}</div>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}
                
                {/* Other Team Members */}
                <div>
                  {activeProject?.collaborators && activeProject.collaborators.length > 0 && (
                    <h5 className="text-xs font-medium text-gray-600 mb-2">Other Team Members</h5>
                  )}
                  <div className="grid grid-cols-1 gap-2 max-h-24 overflow-y-auto">
                    {allUsers.filter(user => !activeProject?.collaborators?.some(collab => collab.id === user.id)).map((user) => {
                      const isSelected = newFeature.assignees?.includes(user.id) || false;
                      return (
                        <label key={user.id} className="flex items-center space-x-2 p-2 bg-gray-50 rounded cursor-pointer hover:bg-gray-100">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {
                              const currentAssignees = newFeature.assignees || [];
                              const updatedAssignees = isSelected 
                                ? currentAssignees.filter(id => id !== user.id)
                                : [...currentAssignees, user.id];
                              setNewFeature(prev => ({ ...prev, assignees: updatedAssignees }));
                            }}
                            className="w-4 h-4 text-gray-600 rounded border-gray-300 focus:ring-gray-500"
                          />
                          <div className={`w-6 h-6 rounded-full bg-${user.color}-500 text-white text-xs flex items-center justify-center font-medium`}>
                            {user.name.charAt(0)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-medium text-gray-900">{user.name}</div>
                            <div className="text-xs text-gray-500">{user.role}</div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 mt-6">
              <button 
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleCreateFeature}
                disabled={!newFeature.title.trim()}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-md transition-colors"
              >
                Create Feature
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Feature Modal */}
      {showEditModal && editingFeature && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">Edit Feature</h2>
              <button 
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  value={newFeature.title}
                  onChange={(e) => setNewFeature({...newFeature, title: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Feature title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={newFeature.description}
                  onChange={(e) => setNewFeature({...newFeature, description: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Feature description"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Priority
                  </label>
                  <select
                    value={newFeature.priority}
                    onChange={(e) => setNewFeature({...newFeature, priority: e.target.value as Feature['priority']})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <input
                    type="text"
                    value={newFeature.category}
                    onChange={(e) => setNewFeature({...newFeature, category: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. Enhancement"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Estimated Hours
                  </label>
                  <input
                    type="number"
                    value={newFeature.estimatedHours}
                    onChange={(e) => setNewFeature({...newFeature, estimatedHours: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="8"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={newFeature.dueDate}
                    onChange={(e) => setNewFeature({...newFeature, dueDate: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* User Assignment Section */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  👥 Assign to Team Members
                </label>
                <p className="text-xs text-gray-500 mb-3">Update team member assignments for this feature</p>
                
                {/* Project Collaborators */}
                {activeProject?.collaborators && activeProject.collaborators.length > 0 && (
                  <div className="mb-3">
                    <h5 className="text-xs font-medium text-blue-700 mb-2">Project Collaborators</h5>
                    <div className="grid grid-cols-1 gap-2 max-h-24 overflow-y-auto">
                      {activeProject.collaborators.map((user) => {
                        const isSelected = newFeature.assignees?.includes(user.id) || false;
                        return (
                          <label key={user.id} className="flex items-center space-x-2 p-2 bg-blue-50 border border-blue-200 rounded cursor-pointer hover:bg-blue-100">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {
                                const currentAssignees = newFeature.assignees || [];
                                const updatedAssignees = isSelected 
                                  ? currentAssignees.filter(id => id !== user.id)
                                  : [...currentAssignees, user.id];
                                setNewFeature(prev => ({ ...prev, assignees: updatedAssignees }));
                              }}
                              className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                            />
                            <div className={`w-6 h-6 rounded-full bg-${user.color}-500 text-white text-xs flex items-center justify-center font-medium`}>
                              {user.name.charAt(0)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-xs font-medium text-gray-900">{user.name}</div>
                              <div className="text-xs text-blue-600">{user.role}</div>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}
                
                {/* Other Team Members */}
                <div>
                  {activeProject?.collaborators && activeProject.collaborators.length > 0 && (
                    <h5 className="text-xs font-medium text-gray-600 mb-2">Other Team Members</h5>
                  )}
                  <div className="grid grid-cols-1 gap-2 max-h-24 overflow-y-auto">
                    {allUsers.filter(user => !activeProject?.collaborators?.some(collab => collab.id === user.id)).map((user) => {
                      const isSelected = newFeature.assignees?.includes(user.id) || false;
                      return (
                        <label key={user.id} className="flex items-center space-x-2 p-2 bg-gray-50 rounded cursor-pointer hover:bg-gray-100">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {
                              const currentAssignees = newFeature.assignees || [];
                              const updatedAssignees = isSelected 
                                ? currentAssignees.filter(id => id !== user.id)
                                : [...currentAssignees, user.id];
                              setNewFeature(prev => ({ ...prev, assignees: updatedAssignees }));
                            }}
                            className="w-4 h-4 text-gray-600 rounded border-gray-300 focus:ring-gray-500"
                          />
                          <div className={`w-6 h-6 rounded-full bg-${user.color}-500 text-white text-xs flex items-center justify-center font-medium`}>
                            {user.name.charAt(0)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-medium text-gray-900">{user.name}</div>
                            <div className="text-xs text-gray-500">{user.role}</div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 mt-6">
              <button 
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleUpdateFeature}
                disabled={!newFeature.title.trim()}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-md transition-colors"
              >
                Update Feature
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Project Modal */}
      {showProjectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">Create New Project</h2>
              <button 
                onClick={() => setShowProjectModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Project Name *
                </label>
                <input
                  type="text"
                  value={newProject.name}
                  onChange={(e) => setNewProject({...newProject, name: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="My Awesome Project"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={newProject.description}
                  onChange={(e) => setNewProject({...newProject, description: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Project description"
                />
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Theme Color
                  </label>
                  <select
                    value={newProject.color}
                    onChange={(e) => setNewProject({...newProject, color: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="blue">Blue</option>
                    <option value="green">Green</option>
                    <option value="purple">Purple</option>
                    <option value="red">Red</option>
                    <option value="orange">Orange</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    🎯 Development Deadline
                  </label>
                  <input
                    type="date"
                    value={newProject.deadline}
                    onChange={(e) => setNewProject({...newProject, deadline: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Internal deadline"
                  />
                  <p className="text-xs text-gray-500 mt-1">When development should be complete</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    🚀 Product Release Date
                  </label>
                  <input
                    type="date"
                    value={newProject.releaseDate}
                    onChange={(e) => setNewProject({...newProject, releaseDate: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Public release date"
                  />
                  <p className="text-xs text-gray-500 mt-1">When product goes live to users</p>
                </div>
              </div>

              {/* Project Collaborators Section */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  👥 Project Collaborators
                </label>
                <p className="text-xs text-gray-500 mb-3">Add team members who can view and edit this project</p>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {allUsers.filter(user => user.id !== currentUser.id).map((user) => {
                    const isSelected = newProject.collaborators.includes(user.id);
                    return (
                      <div key={user.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <div className="flex items-center space-x-2">
                          <div className={`w-6 h-6 rounded-full bg-${user.color}-500 text-white text-xs flex items-center justify-center font-medium`}>
                            {user.name.charAt(0)}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{user.name}</div>
                            <div className="text-xs text-gray-500">{user.role}</div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => toggleProjectCollaborator(user.id)}
                          className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                            isSelected
                              ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                              : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                          }`}
                        >
                          {isSelected ? 'Added' : 'Add'}
                        </button>
                      </div>
                    );
                  })}
                </div>
                {newProject.collaborators.length > 0 && (
                  <div className="mt-2 text-xs text-green-600">
                    {newProject.collaborators.length} collaborator{newProject.collaborators.length !== 1 ? 's' : ''} selected
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 mt-6">
              <button 
                onClick={() => setShowProjectModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleCreateProject}
                disabled={!newProject.name.trim()}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-md transition-colors"
              >
                Create Project
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Project Modal */}
      {showEditProjectModal && editingProject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">Edit Project</h2>
              <button 
                onClick={() => setShowEditProjectModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Project Name *
                </label>
                <input
                  type="text"
                  value={newProject.name}
                  onChange={(e) => setNewProject({...newProject, name: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="My Awesome Project"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={newProject.description}
                  onChange={(e) => setNewProject({...newProject, description: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Project description"
                />
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Theme Color
                  </label>
                  <select
                    value={newProject.color}
                    onChange={(e) => setNewProject({...newProject, color: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="blue">Blue</option>
                    <option value="green">Green</option>
                    <option value="purple">Purple</option>
                    <option value="red">Red</option>
                    <option value="orange">Orange</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    🎯 Development Deadline
                  </label>
                  <input
                    type="date"
                    value={newProject.deadline}
                    onChange={(e) => setNewProject({...newProject, deadline: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Internal deadline"
                  />
                  <p className="text-xs text-gray-500 mt-1">When development should be complete</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    🚀 Product Release Date
                  </label>
                  <input
                    type="date"
                    value={newProject.releaseDate}
                    onChange={(e) => setNewProject({...newProject, releaseDate: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Public release date"
                  />
                  <p className="text-xs text-gray-500 mt-1">When product goes live to users</p>
                </div>
              </div>

              {/* Project Collaborators Section */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  👥 Project Collaborators
                </label>
                <p className="text-xs text-gray-500 mb-3">Manage team members who can view and edit this project</p>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {allUsers.filter(user => user.id !== currentUser.id).map((user) => {
                    const isSelected = newProject.collaborators.includes(user.id);
                    return (
                      <div key={user.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <div className="flex items-center space-x-2">
                          <div className={`w-6 h-6 rounded-full bg-${user.color}-500 text-white text-xs flex items-center justify-center font-medium`}>
                            {user.name.charAt(0)}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{user.name}</div>
                            <div className="text-xs text-gray-500">{user.role}</div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => toggleProjectCollaborator(user.id)}
                          className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                            isSelected
                              ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                              : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                          }`}
                        >
                          {isSelected ? 'Added' : 'Add'}
                        </button>
                      </div>
                    );
                  })}
                </div>
                {newProject.collaborators.length > 0 && (
                  <div className="mt-2 text-xs text-green-600">
                    {newProject.collaborators.length} collaborator{newProject.collaborators.length !== 1 ? 's' : ''} selected
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 mt-6">
              <button 
                onClick={() => setShowEditProjectModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleUpdateProject}
                disabled={!newProject.name.trim()}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-md transition-colors"
              >
                Update Project
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Column Management Modal */}
      {showColumnModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">
                {editingColumn ? 'Edit Column' : 'Add New Column'}
              </h2>
              <button 
                onClick={() => setShowColumnModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Column Name *
                </label>
                <input
                  type="text"
                  value={newColumn.name}
                  onChange={(e) => setNewColumn({...newColumn, name: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. Review, Testing, Backlog"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Color Theme
                </label>
                <select
                  value={newColumn.color}
                  onChange={(e) => setNewColumn({...newColumn, color: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="blue">Blue</option>
                  <option value="green">Green</option>
                  <option value="purple">Purple</option>
                  <option value="red">Red</option>
                  <option value="orange">Orange</option>
                  <option value="yellow">Yellow</option>
                  <option value="indigo">Indigo</option>
                  <option value="pink">Pink</option>
                  <option value="gray">Gray</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 mt-6">
              <button 
                onClick={() => setShowColumnModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={editingColumn ? handleUpdateColumn : handleCreateColumn}
                disabled={!newColumn.name.trim()}
                className="px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-md transition-colors"
              >
                {editingColumn ? 'Update Column' : 'Create Column'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Column Visibility Modal */}
      {showColumnVisibilityModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">Manage Columns</h2>
              <button 
                onClick={() => setShowColumnVisibilityModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-gray-600">
                  {visibleColumns.size} of {activeProject?.columns?.length || 0} columns visible
                </span>
                <div className="flex space-x-2">
                  <button
                    onClick={openCreateColumnModal}
                    className="text-xs bg-purple-100 hover:bg-purple-200 text-purple-700 px-2 py-1 rounded transition-colors flex items-center space-x-1"
                  >
                    <Plus size={12} />
                    <span>New Column</span>
                  </button>
                  <button
                    onClick={showAllColumns}
                    className="text-xs bg-green-100 hover:bg-green-200 text-green-700 px-2 py-1 rounded transition-colors"
                  >
                    Show All
                  </button>
                </div>
              </div>

              <div className="space-y-3 max-h-60 overflow-y-auto">
                {activeProject?.columns?.sort((a, b) => a.order - b.order).map((column) => (
                  <div key={column.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className={`w-4 h-4 bg-${column.color}-500 rounded`}></div>
                      <span className="font-medium text-gray-900">{column.name}</span>
                      <span className="text-xs text-gray-500">({stats[column.id] || 0} items)</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => hideAllButOneColumn(column.id)}
                        className="text-xs text-blue-600 hover:text-blue-800 px-2 py-1 hover:bg-blue-50 rounded transition-colors"
                        title="Show only this column"
                      >
                        Only
                      </button>
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={visibleColumns.has(column.id)}
                          onChange={() => toggleColumnVisibility(column.id)}
                          className="form-checkbox h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                        />
                      </label>
                    </div>
                  </div>
                ))}
              </div>

              {visibleColumns.size === 0 && (
                <div className="text-center py-4 text-red-600 text-sm">
                  At least one column must be visible
                </div>
              )}
            </div>

            <div className="flex items-center justify-end space-x-3 mt-6">
              <button 
                onClick={() => setShowColumnVisibilityModal(false)}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Task Assignment Modal */}
      {showCollaborationModal && selectedTaskForAssignment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">Assign Task</h2>
              <button 
                onClick={() => {
                  setShowCollaborationModal(false);
                  setSelectedTaskForAssignment(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            <div className="mb-4">
              <h3 className="font-medium text-gray-900 mb-2">{selectedTaskForAssignment.title}</h3>
              <p className="text-sm text-gray-600">{selectedTaskForAssignment.description}</p>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium text-gray-900">Assign to team members:</h4>
              <p className="text-xs text-gray-500">💡 Project collaborators are shown first as they have full access to this project</p>
              
              {/* Project Collaborators Section */}
              {activeProject?.collaborators && activeProject.collaborators.length > 0 && (
                <div>
                  <h5 className="text-sm font-medium text-blue-700 mb-2 flex items-center gap-2">
                    <span>👥</span>
                    Project Collaborators
                  </h5>
                  {activeProject.collaborators.map((user) => {
                    const isAssigned = selectedTaskForAssignment.assignees?.includes(user.id) || false;
                    return (
                      <div key={user.id} className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg mb-2">
                        <div className="flex items-center space-x-3">
                          <div className={`w-8 h-8 rounded-full bg-${user.color}-500 text-white text-sm flex items-center justify-center font-medium`}>
                            {user.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{user.name}</div>
                            <div className="text-xs text-blue-600">{user.role} • Project Member</div>
                          </div>
                        </div>
                        <button
                          onClick={() => toggleTaskAssignment(selectedTaskForAssignment.id, user.id)}
                          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                            isAssigned
                              ? 'bg-green-100 text-green-700 hover:bg-green-200'
                              : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                          }`}
                        >
                          {isAssigned ? 'Assigned' : 'Assign'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
              
              {/* Other Users Section */}
              <div>
                {activeProject?.collaborators && activeProject.collaborators.length > 0 && (
                  <h5 className="text-sm font-medium text-gray-600 mb-2">Other Team Members</h5>
                )}
                {allUsers.filter(user => !activeProject?.collaborators?.some(collab => collab.id === user.id)).map((user) => {
                  const isAssigned = selectedTaskForAssignment.assignees?.includes(user.id) || false;
                  return (
                    <div key={user.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg mb-2">
                      <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 rounded-full bg-${user.color}-500 text-white text-sm flex items-center justify-center font-medium`}>
                          {user.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{user.name}</div>
                          <div className="text-xs text-gray-500">{user.role}</div>
                        </div>
                      </div>
                      <button
                        onClick={() => toggleTaskAssignment(selectedTaskForAssignment.id, user.id)}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                          isAssigned
                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {isAssigned ? 'Assigned' : 'Assign'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-end mt-6">
              <button 
                onClick={() => {
                  setShowCollaborationModal(false);
                  setSelectedTaskForAssignment(null);
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}


      {/* Drag Overlay */}
      <DragOverlay>
        {activeId && draggedFeature ? (
          <div className="bg-white border border-gray-300 rounded-lg p-3 shadow-lg opacity-90 transform rotate-2">
            <h4 className="text-sm font-medium text-gray-900">{draggedFeature.title}</h4>
            <p className="text-xs text-gray-600 mt-1">{draggedFeature.description}</p>
            <div className="flex items-center justify-between mt-2">
              <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(draggedFeature.priority)}`}>
                {draggedFeature.priority}
              </span>
              <span className="text-xs text-gray-500">{draggedFeature.category}</span>
            </div>
          </div>
        ) : null}
      </DragOverlay>
      
      {/* File Drag Overlay */}
      {dragOver && (
        <div className="fixed inset-0 bg-blue-600 bg-opacity-20 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl p-8 border-4 border-dashed border-blue-400 shadow-2xl">
            <div className="text-center">
              <Upload size={48} className="text-blue-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Drop files to attach</h3>
              <p className="text-sm text-gray-600">
                Files will be attached to the feature you're hovering over
              </p>
            </div>
          </div>
        </div>
      )}
      </div>
    </DndContext>
  );
}