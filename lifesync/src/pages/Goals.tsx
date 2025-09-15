import React, { useState, useEffect, useRef } from 'react';
import { useAppStore } from '../stores/useAppStore';
import {
  Plus,
  Target,
  Trophy,
  Star,
  Zap,
  TrendingUp,
  Calendar,
  DollarSign,
  Heart,
  User,
  Briefcase,
  Dumbbell,
  CheckCircle2,
  Circle,
  Play,
  Pause,
  RotateCcw,
  Edit3,
  Trash2,
  Award,
  Crown,
  Flame,
  Medal,
  Gift,
  BarChart3,
  Clock,
  Flag,
  ArrowUp,
  ArrowDown,
  Filter,
  Search,
  Settings,
  Share2,
  Download,
  ChevronRight,
  ChevronDown,
  X,
  AlertCircle,
  CheckCircle,
  XCircle,
  Users,
  Globe,
  Lock,
  Unlock,
  Bookmark,
  BookmarkCheck,
  Timer,
  Calendar as CalendarIcon,
  MapPin,
  Image as ImageIcon,
  Link,
  MessageSquare,
  ThumbsUp,
  Eye,
  EyeOff,
  AlignLeft,
  Camera
} from 'lucide-react';
import { format, differenceInDays, addDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isAfter, isBefore, isToday } from 'date-fns';

interface Goal {
  id: string;
  title: string;
  description: string;
  category: 'financial' | 'health' | 'personal' | 'career' | 'fitness';
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'not-started' | 'in-progress' | 'paused' | 'completed' | 'failed';
  progress: number; // 0-100
  targetValue?: number;
  currentValue?: number;
  unit?: string; // '$', 'lbs', 'hours', etc.
  startDate: Date;
  targetDate: Date;
  completedDate?: Date;
  milestones: Milestone[];
  tags: string[];
  isPublic: boolean;
  difficulty: 'easy' | 'medium' | 'hard' | 'legendary';
  xpReward: number;
  streakDays: number;
  lastUpdated: Date;
  createdAt: Date;
  notes: string;
  attachments: Attachment[];
  subGoals: SubGoal[];
}

interface Milestone {
  id: string;
  title: string;
  description: string;
  targetValue: number;
  isCompleted: boolean;
  completedDate?: Date;
  xpReward: number;
}

interface SubGoal {
  id: string;
  title: string;
  isCompleted: boolean;
  completedDate?: Date;
}

interface Attachment {
  id: string;
  name: string;
  type: 'image' | 'file' | 'link';
  url: string;
  size?: number;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  xpReward: number;
  unlockedAt?: Date;
  isUnlocked: boolean;
  category: 'streak' | 'completion' | 'progress' | 'milestone' | 'special';
}

interface UserStats {
  level: number;
  xp: number;
  xpToNextLevel: number;
  totalGoalsCompleted: number;
  currentStreak: number;
  longestStreak: number;
  achievements: Achievement[];
  totalXpEarned: number;
}

const GOAL_CATEGORIES = [
  {
    id: 'financial',
    name: 'Financial',
    icon: DollarSign,
    color: '#10B981',
    description: 'Money, savings, investments, and financial freedom'
  },
  {
    id: 'health',
    name: 'Health',
    icon: Heart,
    color: '#EF4444',
    description: 'Physical and mental wellbeing'
  },
  {
    id: 'personal',
    name: 'Personal',
    icon: User,
    color: '#8B5CF6',
    description: 'Self-improvement and personal development'
  },
  {
    id: 'career',
    name: 'Career',
    icon: Briefcase,
    color: '#F59E0B',
    description: 'Professional growth and career advancement'
  },
  {
    id: 'fitness',
    name: 'Fitness',
    icon: Dumbbell,
    color: '#3B82F6',
    description: 'Physical fitness and athletic performance'
  }
];

const DIFFICULTY_CONFIG = {
  easy: { xp: 100, color: '#10B981', icon: '🟢' },
  medium: { xp: 250, color: '#F59E0B', icon: '🟡' },
  hard: { xp: 500, color: '#EF4444', icon: '🔴' },
  legendary: { xp: 1000, color: '#8B5CF6', icon: '🟣' }
};

const DREAM_CATEGORIES = [
  {
    id: 'travel',
    name: 'Travel',
    icon: Globe,
    color: '#3B82F6',
    description: 'Places to visit, cultures to experience',
    defaultImage: '🌍'
  },
  {
    id: 'experiences',
    name: 'Experiences',
    icon: Star,
    color: '#F59E0B',
    description: 'Once-in-a-lifetime adventures and moments',
    defaultImage: '✨'
  },
  {
    id: 'possessions',
    name: 'Possessions',
    icon: Gift,
    color: '#8B5CF6',
    description: 'Things you\'d love to own someday',
    defaultImage: '🎁'
  },
  {
    id: 'achievements',
    name: 'Achievements',
    icon: Trophy,
    color: '#10B981',
    description: 'Major accomplishments and recognitions',
    defaultImage: '🏆'
  },
  {
    id: 'relationships',
    name: 'Relationships',
    icon: Heart,
    color: '#EF4444',
    description: 'People to meet, connections to make',
    defaultImage: '💝'
  },
  {
    id: 'lifestyle',
    name: 'Lifestyle',
    icon: Crown,
    color: '#6366F1',
    description: 'Ways of living and being',
    defaultImage: '👑'
  }
];

const DREAM_TEMPLATES = {
  travel: [
    { title: 'Backpack Through Europe', description: 'Spend 3 months exploring European cities and cultures', estimatedCost: 15000, timeframe: 'Within 5 years', resources: ['Save money', 'Get passport', 'Plan itinerary'] },
    { title: 'Safari in Africa', description: 'Experience wildlife in their natural habitat', estimatedCost: 8000, timeframe: 'Within 10 years', resources: ['Save money', 'Research tours', 'Get vaccinations'] },
    { title: 'Northern Lights in Iceland', description: 'Witness the aurora borealis in person', estimatedCost: 5000, timeframe: 'Within 5 years', resources: ['Save money', 'Plan winter trip', 'Book tours'] },
    { title: 'Japanese Culture Immersion', description: 'Live in Japan for a month, learn language and culture', estimatedCost: 10000, timeframe: 'Within 10 years', resources: ['Learn Japanese', 'Save money', 'Research housing'] }
  ],
  experiences: [
    { title: 'Learn to Fly a Plane', description: 'Get a pilot license and experience flight', estimatedCost: 12000, timeframe: 'Within 10 years', resources: ['Find flight school', 'Save money', 'Pass medical exam'] },
    { title: 'Write and Publish a Novel', description: 'Complete a full-length book and see it published', estimatedCost: 2000, timeframe: 'Within 5 years', resources: ['Develop writing skills', 'Complete manuscript', 'Find publisher'] },
    { title: 'Perform on Stage', description: 'Act, sing, or speak in front of a large audience', estimatedCost: 500, timeframe: 'Within 5 years', resources: ['Join theater group', 'Build confidence', 'Practice performing'] },
    { title: 'Learn a Martial Art', description: 'Master a martial art and earn a black belt', estimatedCost: 3000, timeframe: 'Within 10 years', resources: ['Find dojo', 'Commit to training', 'Stay disciplined'] }
  ],
  possessions: [
    { title: 'Dream House', description: 'Own a beautiful home with all desired features', estimatedCost: 500000, timeframe: 'Within 15 years', resources: ['Save for down payment', 'Improve credit', 'Research locations'] },
    { title: 'Classic Car Collection', description: 'Own vintage automobiles as a hobby', estimatedCost: 100000, timeframe: 'When retired', resources: ['Learn about cars', 'Save money', 'Find storage space'] },
    { title: 'High-End Audio System', description: 'Professional-grade music setup for perfect sound', estimatedCost: 25000, timeframe: 'Within 10 years', resources: ['Research equipment', 'Save money', 'Prepare room'] },
    { title: 'Art Collection', description: 'Curate original artwork from favorite artists', estimatedCost: 50000, timeframe: 'Over lifetime', resources: ['Study art', 'Save money', 'Network with galleries'] }
  ],
  achievements: [
    { title: 'Run a Marathon', description: 'Complete a 26.2 mile race', estimatedCost: 500, timeframe: 'Within 5 years', resources: ['Train consistently', 'Build endurance', 'Register for race'] },
    { title: 'Start a Successful Business', description: 'Build a company that makes a positive impact', estimatedCost: 50000, timeframe: 'Within 10 years', resources: ['Develop business plan', 'Save capital', 'Build network'] },
    { title: 'Speak at a Conference', description: 'Share expertise with industry professionals', estimatedCost: 1000, timeframe: 'Within 5 years', resources: ['Build expertise', 'Create presentation', 'Apply to speak'] },
    { title: 'Earn an Advanced Degree', description: 'Complete graduate education in field of interest', estimatedCost: 75000, timeframe: 'Within 10 years', resources: ['Research programs', 'Save money', 'Prepare applications'] }
  ],
  relationships: [
    { title: 'Meet a Celebrity', description: 'Have a meaningful conversation with someone famous', estimatedCost: 1000, timeframe: 'Someday', resources: ['Attend events', 'Network actively', 'Be prepared'] },
    { title: 'Reconnect with Old Friends', description: 'Rebuild relationships from the past', estimatedCost: 2000, timeframe: 'Within 5 years', resources: ['Find contact info', 'Plan meetings', 'Travel if needed'] },
    { title: 'Mentor Someone', description: 'Guide and support someone in their journey', estimatedCost: 0, timeframe: 'Within 5 years', resources: ['Develop expertise', 'Find mentee', 'Commit time'] },
    { title: 'Build a Strong Community', description: 'Create or join a close-knit group', estimatedCost: 500, timeframe: 'Within 5 years', resources: ['Identify interests', 'Organize events', 'Invest time'] }
  ],
  lifestyle: [
    { title: 'Live Minimally', description: 'Embrace a simple, clutter-free existence', estimatedCost: 0, timeframe: 'Within 5 years', resources: ['Declutter possessions', 'Change mindset', 'Find new habits'] },
    { title: 'Digital Nomad Life', description: 'Work remotely while traveling the world', estimatedCost: 30000, timeframe: 'Within 5 years', resources: ['Build remote career', 'Save money', 'Plan logistics'] },
    { title: 'Live Off-Grid', description: 'Self-sufficient lifestyle away from urban areas', estimatedCost: 100000, timeframe: 'When retired', resources: ['Learn skills', 'Buy land', 'Build infrastructure'] },
    { title: 'Master Work-Life Balance', description: 'Achieve harmony between career and personal life', estimatedCost: 0, timeframe: 'Within 5 years', resources: ['Set boundaries', 'Prioritize health', 'Manage time'] }
  ]
};

const GOAL_TEMPLATES = {
  financial: [
    { title: 'Emergency Fund', description: 'Save 3-6 months of expenses', targetValue: 10000, unit: '$' },
    { title: 'Investment Portfolio', description: 'Build a diversified investment portfolio', targetValue: 50000, unit: '$' },
    { title: 'Debt Free', description: 'Pay off all credit card debt', targetValue: 0, unit: '$' },
    { title: 'House Down Payment', description: 'Save for house down payment', targetValue: 50000, unit: '$' }
  ],
  health: [
    { title: 'Drink More Water', description: 'Drink 8 glasses of water daily', targetValue: 8, unit: 'glasses' },
    { title: 'Meditation Streak', description: 'Meditate for 30 days straight', targetValue: 30, unit: 'days' },
    { title: 'Sleep Quality', description: 'Get 7-8 hours of sleep nightly', targetValue: 8, unit: 'hours' },
    { title: 'Annual Checkup', description: 'Complete annual health checkup', targetValue: 1, unit: 'visit' }
  ],
  personal: [
    { title: 'Read Books', description: 'Read 12 books this year', targetValue: 12, unit: 'books' },
    { title: 'Learn New Language', description: 'Achieve conversational fluency', targetValue: 100, unit: 'lessons' },
    { title: 'Journaling Habit', description: 'Journal daily for 3 months', targetValue: 90, unit: 'days' },
    { title: 'Skill Development', description: 'Master a new skill or hobby', targetValue: 100, unit: 'hours' }
  ],
  career: [
    { title: 'Salary Increase', description: 'Negotiate a 20% salary increase', targetValue: 20, unit: '%' },
    { title: 'Professional Certification', description: 'Complete industry certification', targetValue: 1, unit: 'cert' },
    { title: 'Network Building', description: 'Connect with 50 professionals', targetValue: 50, unit: 'contacts' },
    { title: 'Side Hustle', description: 'Earn $1000/month from side project', targetValue: 1000, unit: '$' }
  ],
  fitness: [
    { title: 'Weight Loss', description: 'Lose 20 pounds healthily', targetValue: 20, unit: 'lbs' },
    { title: 'Run Marathon', description: 'Complete a 26.2 mile marathon', targetValue: 26.2, unit: 'miles' },
    { title: 'Gym Consistency', description: 'Go to gym 4x per week', targetValue: 4, unit: 'sessions' },
    { title: 'Strength Goals', description: 'Bench press body weight', targetValue: 150, unit: 'lbs' }
  ]
};

export default function Goals() {
  // App store integration
  const {
    goals,
    dreams,
    userStats,
    achievements,
    stackedGoals,
    addGoal,
    updateGoal,
    deleteGoal,
    updateGoalProgress,
    completeGoal,
    addDream,
    updateDream,
    deleteDream,
    achieveDream,
    addGoalToStack,
    removeGoalFromStack,
    reorderStackedGoals,
    isGoalLocked,
    updateGoalStreak,
    enableGoalStreak,
    disableGoalStreak,
    getGoalStreakStatus
  } = useAppStore();

  const [activeSection, setActiveSection] = useState<'goals' | 'dreams'>('goals');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'kanban'>('grid');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showAchievements, setShowAchievements] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'priority' | 'progress' | 'deadline' | 'created'>('priority');
  const [showCompleted, setShowCompleted] = useState(true);
  const [draggedItem, setDraggedItem] = useState<any>(null);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
  const [contextMenuItem, setContextMenuItem] = useState<any>(null);
  const [selectedDream, setSelectedDream] = useState<any>(null);
  const [showDreamModal, setShowDreamModal] = useState(false);
  const [uploadingDreamId, setUploadingDreamId] = useState<string | null>(null);
  const dreamPhotoInputRef = useRef<HTMLInputElement>(null);

  // Form state for creating/editing goals
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'personal' as Goal['category'],
    priority: 'medium' as Goal['priority'],
    difficulty: 'medium' as Goal['difficulty'],
    status: 'not-started' as Goal['status'],
    targetValue: 0,
    currentValue: 0,
    unit: '',
    targetDate: format(addDays(new Date(), 30), 'yyyy-MM-dd'),
    tags: [] as string[],
    isPublic: false,
    notes: '',
    streakEnabled: false,
    streakFrequency: 'daily' as Goal['streakFrequency'],
    streakTarget: undefined as number | undefined
  });

  const [tagInput, setTagInput] = useState('');
  const [formDreamPhotos, setFormDreamPhotos] = useState<any[]>([]);
  const createDreamPhotoInputRef = useRef<HTMLInputElement>(null);
  const [editingDream, setEditingDream] = useState<string | null>(null);
  const [editDreamTitle, setEditDreamTitle] = useState('');
  const [editDreamCost, setEditDreamCost] = useState('');
  const [editingExistingDream, setEditingExistingDream] = useState<any | null>(null);
  const [editingExistingGoal, setEditingExistingGoal] = useState<Goal | null>(null);
  const [dreamPriority, setDreamPriority] = useState<'someday' | 'within-5-years' | 'within-10-years' | 'lifetime'>('someday');
  const [dreamStatus, setDreamStatus] = useState<'dreaming' | 'planning' | 'in-progress' | 'achieved' | 'no-longer-interested'>('dreaming');
  const [dreamTimeframe, setDreamTimeframe] = useState('');
  const [dreamResources, setDreamResources] = useState<string[]>([]);
  const [dreamInspiration, setDreamInspiration] = useState<string[]>([]);
  const [resourceInput, setResourceInput] = useState('');
  const [inspirationInput, setInspirationInput] = useState('');
  
  // Milestone management
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [newMilestone, setNewMilestone] = useState({
    title: '',
    description: '',
    targetValue: 0,
    xpReward: 50
  });

  // Sub-goal management
  const [subGoals, setSubGoals] = useState<SubGoal[]>([]);
  const [newSubGoal, setNewSubGoal] = useState({
    title: ''
  });

  // Goal stacking system
  const [showStackingModal, setShowStackingModal] = useState(false);
  const [selectedStackGoal, setSelectedStackGoal] = useState<Goal | null>(null);

  // Progress update
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [progressGoal, setProgressGoal] = useState<Goal | null>(null);
  const [progressInput, setProgressInput] = useState('');
  const [currentValueInput, setCurrentValueInput] = useState('');

  // Attachment management
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const attachmentInputRef = useRef<HTMLInputElement>(null);

  // Calculate level from XP
  const calculateLevel = (xp: number) => {
    return Math.floor(xp / 1000) + 1;
  };

  // Calculate XP needed for next level
  const calculateXpToNextLevel = (xp: number) => {
    const currentLevel = calculateLevel(xp);
    return (currentLevel * 1000) - xp;
  };

  // Get filtered items (goals or dreams)
  const getFilteredItems = () => {
    let filtered = activeSection === 'goals' ? [...goals] : [...dreams];

    // Category filter
    if (activeCategory !== 'all') {
      filtered = filtered.filter(item => item.category === activeCategory);
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item =>
        item.title.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query) ||
        item.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Completed filter for goals
    if (activeSection === 'goals' && !showCompleted) {
      filtered = filtered.filter(goal => goal.status !== 'completed');
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'priority':
          if (activeSection === 'goals') {
            const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
            return priorityOrder[b.priority] - priorityOrder[a.priority];
          } else {
            const dreamPriorityOrder = { 'lifetime': 1, 'within-10-years': 2, 'within-5-years': 3, 'someday': 4 };
            return dreamPriorityOrder[b.priority] - dreamPriorityOrder[a.priority];
          }
        case 'progress':
          if (activeSection === 'goals') {
            return b.progress - a.progress;
          }
          return 0;
        case 'deadline':
          if (activeSection === 'goals') {
            return new Date(a.targetDate).getTime() - new Date(b.targetDate).getTime();
          }
          return 0;
        case 'created':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        default:
          return 0;
      }
    });

    return filtered;
  };

  // Create new goal or dream
  const createGoal = () => {
    // Validate required fields
    if (!formData.title.trim()) {
      return;
    }

    // For dreams, don't allow "all" as a category
    if (activeSection === 'dreams' && formData.category === 'all') {
      return;
    }

    if (editingExistingDream) {
      // Update existing dream
      const updatedDreamData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        category: formData.category,
        priority: dreamPriority,
        status: dreamStatus,
        estimatedCost: formData.targetValue || undefined,
        estimatedTimeframe: dreamTimeframe.trim() || undefined,
        requiredResources: dreamResources,
        inspirationSources: dreamInspiration,
        tags: formData.tags,
        isPublic: formData.isPublic,
        notes: formData.notes.trim(),
        visualBoard: formDreamPhotos
      };

      updateDream(editingExistingDream.id, updatedDreamData);
      setEditingExistingDream(null);
    } else if (editingExistingGoal) {
      // Update existing goal
      const updatedGoalData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        category: formData.category,
        priority: formData.priority,
        status: formData.status || 'not-started',
        targetValue: formData.targetValue,
        currentValue: formData.currentValue,
        unit: formData.unit,
        targetDate: new Date(formData.targetDate),
        tags: formData.tags,
        isPublic: formData.isPublic,
        difficulty: formData.difficulty,
        xpReward: DIFFICULTY_CONFIG[formData.difficulty].xp,
        notes: formData.notes.trim(),
        milestones: milestones,
        subGoals: subGoals,
        attachments: attachments,
        streakEnabled: formData.streakEnabled,
        streakFrequency: formData.streakFrequency,
        streakTarget: formData.streakTarget
      };

      updateGoal(editingExistingGoal.id, updatedGoalData);
      setEditingExistingGoal(null);
    } else if (activeSection === 'goals') {
      const goalData = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        priority: formData.priority,
        status: 'not-started' as const,
        targetValue: formData.targetValue,
        currentValue: formData.currentValue,
        unit: formData.unit,
        startDate: new Date(),
        targetDate: new Date(formData.targetDate),
        milestones: milestones,
        tags: formData.tags,
        isPublic: formData.isPublic,
        difficulty: formData.difficulty,
        xpReward: DIFFICULTY_CONFIG[formData.difficulty].xp,
        notes: formData.notes,
        attachments: attachments,
        subGoals: subGoals,
        streakEnabled: formData.streakEnabled,
        streakFrequency: formData.streakFrequency,
        streakTarget: formData.streakTarget
      };

      addGoal(goalData);
    } else {
      // Create dream
      const dreamData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        category: formData.category,
        priority: dreamPriority,
        status: dreamStatus,
        estimatedCost: formData.targetValue || undefined,
        estimatedTimeframe: dreamTimeframe.trim() || 'Someday',
        requiredResources: dreamResources,
        inspirationSources: dreamInspiration,
        tags: formData.tags,
        isPublic: formData.isPublic,
        notes: formData.notes.trim(),
        attachments: [],
        relatedGoals: [],
        visualBoard: formDreamPhotos
      };

      addDream(dreamData);
    }

    setShowCreateModal(false);
    resetForm();
  };

  // Delete goal (using store function with confirmation)
  const handleDeleteGoal = (goalId: string) => {
    if (confirm('Are you sure you want to delete this goal?')) {
      deleteGoal(goalId);
      if (selectedGoal?.id === goalId) {
        setSelectedGoal(null);
      }
    }
  };

  // Update goal progress (using store function)
  const handleUpdateProgress = (goalId: string, newProgress: number, newCurrentValue?: number) => {
    updateGoalProgress(goalId, newProgress, newCurrentValue);
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      category: activeSection === 'dreams' ? 'travel' : 'personal',
      priority: 'medium',
      difficulty: 'medium',
      status: 'not-started',
      targetValue: 0,
      currentValue: 0,
      unit: '',
      targetDate: format(addDays(new Date(), 30), 'yyyy-MM-dd'),
      tags: [],
      isPublic: false,
      notes: '',
      streakEnabled: false,
      streakFrequency: 'daily',
      streakTarget: undefined
    });
    setTagInput('');
    setFormDreamPhotos([]);
    setEditingExistingDream(null);
    setEditingExistingGoal(null);
    setDreamPriority('someday');
    setDreamStatus('dreaming');
    setDreamTimeframe('');
    setDreamResources([]);
    setDreamInspiration([]);
    setResourceInput('');
    setInspirationInput('');
    setMilestones([]);
    setNewMilestone({
      title: '',
      description: '',
      targetValue: 0,
      xpReward: 50
    });
    setSubGoals([]);
    setNewSubGoal({ title: '' });
    setAttachments([]);
  };

  // Add tag
  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, tagInput.trim()]
      });
      setTagInput('');
    }
  };

  // Remove tag
  const removeTag = (tagToRemove: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(tag => tag !== tagToRemove)
    });
  };

  // Add resource
  const addResource = () => {
    if (resourceInput.trim() && !dreamResources.includes(resourceInput.trim())) {
      setDreamResources([...dreamResources, resourceInput.trim()]);
      setResourceInput('');
    }
  };

  // Remove resource
  const removeResource = (resourceToRemove: string) => {
    setDreamResources(dreamResources.filter(resource => resource !== resourceToRemove));
  };

  // Add inspiration
  const addInspiration = () => {
    if (inspirationInput.trim() && !dreamInspiration.includes(inspirationInput.trim())) {
      setDreamInspiration([...dreamInspiration, inspirationInput.trim()]);
      setInspirationInput('');
    }
  };

  // Remove inspiration
  const removeInspiration = (inspirationToRemove: string) => {
    setDreamInspiration(dreamInspiration.filter(inspiration => inspiration !== inspirationToRemove));
  };

  // Add milestone
  const addMilestone = () => {
    if (!newMilestone.title.trim()) return;
    
    const milestone: Milestone = {
      id: Date.now().toString(),
      title: newMilestone.title.trim(),
      description: newMilestone.description.trim(),
      targetValue: newMilestone.targetValue,
      isCompleted: false,
      xpReward: newMilestone.xpReward
    };
    
    setMilestones([...milestones, milestone]);
    setNewMilestone({
      title: '',
      description: '',
      targetValue: 0,
      xpReward: 50
    });
  };

  // Remove milestone
  const removeMilestone = (milestoneId: string) => {
    setMilestones(milestones.filter(m => m.id !== milestoneId));
  };

  // Toggle milestone completion
  const toggleMilestone = (milestoneId: string) => {
    setMilestones(milestones.map(m => 
      m.id === milestoneId 
        ? { ...m, isCompleted: !m.isCompleted, completedDate: !m.isCompleted ? new Date() : undefined }
        : m
    ));
  };

  // Add sub-goal
  const addSubGoal = () => {
    if (!newSubGoal.title.trim()) return;
    
    const subGoal: SubGoal = {
      id: Date.now().toString(),
      title: newSubGoal.title.trim(),
      isCompleted: false
    };
    
    setSubGoals([...subGoals, subGoal]);
    setNewSubGoal({ title: '' });
  };

  // Remove sub-goal
  const removeSubGoal = (subGoalId: string) => {
    setSubGoals(subGoals.filter(sg => sg.id !== subGoalId));
  };

  // Toggle sub-goal completion
  const toggleSubGoal = (subGoalId: string) => {
    setSubGoals(subGoals.map(sg => 
      sg.id === subGoalId 
        ? { ...sg, isCompleted: !sg.isCompleted, completedDate: !sg.isCompleted ? new Date() : undefined }
        : sg
    ));
  };

  // Open progress update modal
  const openProgressUpdate = (goal: Goal) => {
    setProgressGoal(goal);
    setProgressInput(goal.progress.toString());
    setCurrentValueInput((goal.currentValue || 0).toString());
    setShowProgressModal(true);
  };

  // Save progress update
  const saveProgressUpdate = () => {
    if (!progressGoal) return;
    
    const newProgress = Math.min(100, Math.max(0, parseFloat(progressInput) || 0));
    const newCurrentValue = parseFloat(currentValueInput) || 0;
    
    handleUpdateProgress(progressGoal.id, newProgress, newCurrentValue);
    setShowProgressModal(false);
    setProgressGoal(null);
    setProgressInput('');
    setCurrentValueInput('');
  };

  // Attachment management functions
  const handleAttachmentUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type.startsWith('image/')) {
        // Handle image files
        const reader = new FileReader();
        reader.onload = (e) => {
          const attachment: Attachment = {
            id: Date.now().toString(),
            name: file.name,
            type: 'image',
            url: e.target?.result as string,
            size: file.size
          };
          setAttachments(prev => [...prev, attachment]);
        };
        reader.readAsDataURL(file);
      } else {
        // Handle other file types
        const attachment: Attachment = {
          id: Date.now().toString(),
          name: file.name,
          type: 'file',
          url: URL.createObjectURL(file),
          size: file.size
        };
        setAttachments(prev => [...prev, attachment]);
      }
    }
  };

  const addLinkAttachment = (url: string, name?: string) => {
    if (!url.trim()) return;
    
    const attachment: Attachment = {
      id: Date.now().toString(),
      name: name || 'Link',
      type: 'link',
      url: url.trim(),
      size: 0
    };
    setAttachments(prev => [...prev, attachment]);
  };

  const removeAttachment = (attachmentId: string) => {
    setAttachments(prev => prev.filter(a => a.id !== attachmentId));
  };

  const triggerAttachmentUpload = () => {
    attachmentInputRef.current?.click();
  };

  // Goal stacking helper functions
  const getUnlockedGoals = () => {
    return goals.filter(goal => !isGoalLocked(goal.id));
  };

  const getNextLockedGoal = (completedGoalId: string) => {
    const goalIndex = stackedGoals.indexOf(completedGoalId);
    if (goalIndex !== -1 && goalIndex < stackedGoals.length - 1) {
      return stackedGoals[goalIndex + 1];
    }
    return null;
  };

  // Create goal from template
  const createFromTemplate = (template: any, category: string) => {
    setFormData({
      ...formData,
      title: template.title,
      description: template.description,
      category: category as Goal['category'],
      targetValue: template.targetValue,
      unit: template.unit
    });
    setShowTemplates(false);
    setShowCreateModal(true);
  };

  // Get progress color
  const getProgressColor = (progress: number) => {
    if (progress >= 75) return '#10B981';
    if (progress >= 50) return '#F59E0B';
    if (progress >= 25) return '#3B82F6';
    return '#6B7280';
  };

  // Get days until deadline
  const getDaysUntilDeadline = (targetDate: Date) => {
    return differenceInDays(targetDate, new Date());
  };

  const filteredItems = getFilteredItems();

  // Move item between goals and dreams
  const moveItemToSection = (item: any, targetSection: 'goals' | 'dreams') => {
    if (activeSection === targetSection) return;

    if (activeSection === 'goals' && targetSection === 'dreams') {
      // Convert goal to dream - preserve photos from attachments to visualBoard
      const convertedPhotos = (item.attachments || [])
        .filter((attachment: any) => attachment.type === 'image')
        .map((attachment: any) => ({
          id: attachment.id,
          type: 'image',
          title: attachment.name || 'Dream Photo',
          url: attachment.url,
          addedAt: new Date()
        }));

      const dreamData = {
        title: item.title,
        description: item.description,
        category: item.category, // Will need to map if categories don't match
        priority: 'someday' as const,
        status: 'dreaming' as const,
        estimatedCost: item.targetValue || undefined,
        estimatedTimeframe: 'Someday',
        requiredResources: item.notes ? [item.notes] : [],
        inspirationSources: [],
        tags: item.tags,
        isPublic: item.isPublic,
        notes: item.notes,
        attachments: item.attachments,
        relatedGoals: [],
        visualBoard: convertedPhotos
      };
      
      addDream(dreamData);
      deleteGoal(item.id);
    } else if (activeSection === 'dreams' && targetSection === 'goals') {
      // Convert dream to goal - preserve photos from visualBoard to attachments
      const convertedAttachments = [
        ...(item.attachments || []),
        ...(item.visualBoard || [])
          .filter((visual: any) => visual.type === 'image')
          .map((visual: any) => ({
            id: visual.id,
            name: visual.title || 'Goal Photo',
            type: 'image',
            url: visual.url,
            size: 0
          }))
      ];

      const goalData = {
        title: item.title,
        description: item.description,
        category: item.category,
        priority: 'medium' as const,
        status: 'not-started' as const,
        targetValue: item.estimatedCost || 0,
        currentValue: 0,
        unit: item.estimatedCost ? '$' : '',
        startDate: new Date(),
        targetDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
        milestones: [],
        tags: item.tags,
        isPublic: item.isPublic,
        difficulty: 'medium' as const,
        xpReward: 250,
        notes: item.notes,
        attachments: convertedAttachments,
        subGoals: []
      };
      
      addGoal(goalData);
      deleteDream(item.id);
    }
    
    setShowContextMenu(false);
    setContextMenuItem(null);
  };

  // Handle drag start
  const handleDragStart = (e: React.DragEvent, item: any) => {
    setDraggedItem(item);
    e.dataTransfer.effectAllowed = 'move';
  };

  // Handle drag over
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  // Handle drop on section toggle
  const handleDropOnSection = (e: React.DragEvent, targetSection: 'goals' | 'dreams') => {
    e.preventDefault();
    if (draggedItem && activeSection !== targetSection) {
      moveItemToSection(draggedItem, targetSection);
    }
    setDraggedItem(null);
  };

  // Handle context menu
  const handleRightClick = (e: React.MouseEvent, item: any) => {
    e.preventDefault();
    setContextMenuPosition({ x: e.clientX, y: e.clientY });
    setContextMenuItem(item);
    setShowContextMenu(true);
  };

  // Close context menu when clicking elsewhere
  const handleClickOutside = () => {
    setShowContextMenu(false);
    setContextMenuItem(null);
  };

  // Handle ESC key to close modals
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (showDreamModal) {
          setShowDreamModal(false);
        } else if (showCreateModal) {
          setShowCreateModal(false);
        } else if (showTemplates) {
          setShowTemplates(false);
        } else if (showStackingModal) {
          setShowStackingModal(false);
        } else if (showProgressModal) {
          setShowProgressModal(false);
        }
      }
    };

    document.addEventListener('keydown', handleEscKey);
    return () => document.removeEventListener('keydown', handleEscKey);
  }, [showDreamModal, showCreateModal, showTemplates, showStackingModal, showProgressModal]);

  // Handle goal completion notifications for stacking
  useEffect(() => {
    // Check if any goals in the stack were just completed and show a notification
    const justCompletedGoals = goals.filter(goal => 
      stackedGoals.includes(goal.id) && 
      goal.status === 'completed' && 
      goal.completedDate && 
      new Date().getTime() - new Date(goal.completedDate).getTime() < 5000 // Within last 5 seconds
    );

    justCompletedGoals.forEach(completedGoal => {
      const nextGoalId = getNextLockedGoal(completedGoal.id);
      if (nextGoalId) {
        const nextGoal = goals.find(g => g.id === nextGoalId);
        if (nextGoal) {
          // Could show a toast notification here in a real app
          console.log(`🎉 Goal "${completedGoal.title}" completed! "${nextGoal.title}" is now unlocked!`);
        }
      }
    });
  }, [goals, stackedGoals]);

  // Handle dream click
  const handleDreamClick = (dream: any) => {
    setSelectedDream(dream);
    setShowDreamModal(true);
  };

  // Handle photo upload for dreams
  const handleDreamPhotoUpload = (dreamId: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const photoUrl = e.target?.result as string;
        updateDream(dreamId, { 
          visualBoard: [
            ...(dreams.find(d => d.id === dreamId)?.visualBoard || []),
            {
              id: Date.now().toString(),
              type: 'image',
              title: 'Dream Photo',
              url: photoUrl,
              addedAt: new Date()
            }
          ]
        });
      };
      reader.readAsDataURL(file);
    }
    setUploadingDreamId(null);
  };

  // Trigger photo upload
  const triggerPhotoUpload = (dreamId: string) => {
    setUploadingDreamId(dreamId);
    dreamPhotoInputRef.current?.click();
  };

  // Handle photo upload for create dream modal
  const handleCreateDreamPhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const photoUrl = e.target?.result as string;
        const newPhoto = {
          id: Date.now().toString(),
          type: 'image',
          title: 'Dream Photo',
          url: photoUrl,
          addedAt: new Date()
        };
        setFormDreamPhotos(prev => [...prev, newPhoto]);
      };
      reader.readAsDataURL(file);
    }
  };

  // Trigger create dream photo upload
  const triggerCreateDreamPhotoUpload = () => {
    createDreamPhotoInputRef.current?.click();
  };

  // Start editing dream
  const startEditingDream = (dream: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingDream(dream.id);
    setEditDreamTitle(dream.title);
    setEditDreamCost(dream.estimatedCost ? dream.estimatedCost.toString() : '');
  };

  // Save dream edit
  const saveDreamEdit = (dreamId: string) => {
    const updates: any = {
      title: editDreamTitle
    };
    
    if (editDreamCost.trim() !== '') {
      updates.estimatedCost = parseInt(editDreamCost) || 0;
    }

    updateDream(dreamId, updates);
    setEditingDream(null);
    setEditDreamTitle('');
    setEditDreamCost('');
  };

  // Cancel dream edit
  const cancelDreamEdit = () => {
    setEditingDream(null);
    setEditDreamTitle('');
    setEditDreamCost('');
  };

  return (
    <div 
      className="min-h-full bg-gray-50 dark:bg-slate-900 flex flex-col"
      onClick={handleClickOutside}
    >
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
              <Target className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-4">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {activeSection === 'goals' ? 'Goals' : 'Dreams'}
                </h1>
                {/* Section Toggle */}
                <div className="flex bg-gray-100 dark:bg-slate-700 rounded-lg p-1">
                  <button
                    onClick={() => setActiveSection('goals')}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDropOnSection(e, 'goals')}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                      activeSection === 'goals'
                        ? 'bg-white dark:bg-slate-600 text-gray-900 dark:text-white shadow-sm'
                        : 'text-black dark:text-white hover:text-gray-900 dark:hover:text-white'
                    } ${draggedItem && activeSection !== 'goals' ? 'ring-2 ring-green-400 bg-green-50 dark:bg-green-900/20' : ''}`}
                  >
                    <Target size={16} className="mr-2 inline" />
                    Goals ({goals.length})
                  </button>
                  <button
                    onClick={() => setActiveSection('dreams')}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDropOnSection(e, 'dreams')}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                      activeSection === 'dreams'
                        ? 'bg-white dark:bg-slate-600 text-gray-900 dark:text-white shadow-sm'
                        : 'text-black dark:text-white hover:text-gray-900 dark:hover:text-white'
                    } ${draggedItem && activeSection !== 'dreams' ? 'ring-2 ring-purple-400 bg-purple-50 dark:bg-purple-900/20' : ''}`}
                  >
                    <Star size={16} className="mr-2 inline" />
                    Dreams ({dreams.length})
                  </button>
                </div>
              </div>
              <p className="text-sm text-gray-900 dark:text-white">
                Level {userStats.level} • {userStats.xp} XP • {userStats.totalGoalsCompleted} goals completed • {userStats.totalDreamsCompleted} dreams achieved
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Level Progress */}
            <div className="hidden md:flex items-center space-x-3 px-4 py-2 bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 rounded-lg">
              <Crown className="w-5 h-5 text-purple-600" />
              <div className="text-sm">
                <div className="font-medium text-purple-900 dark:text-purple-100">Level {userStats.level}</div>
                <div className="w-24 h-1.5 bg-purple-200 dark:bg-purple-800 rounded-full mt-1">
                  <div 
                    className="h-1.5 bg-purple-600 rounded-full transition-all"
                    style={{ width: `${((userStats.xp % 1000) / 1000) * 100}%` }}
                  />
                </div>
              </div>
              <div className="text-xs text-purple-900 dark:text-purple-100 font-medium">
                {userStats.xpToNextLevel} XP to next level
              </div>
            </div>

            {/* Action Buttons */}
            <button
              onClick={() => setShowStats(!showStats)}
              className="p-2 text-gray-700 hover:text-black dark:text-gray-200 dark:hover:text-white rounded-md hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
              title="Statistics"
            >
              <BarChart3 size={20} />
            </button>

            <button
              onClick={() => setShowAchievements(!showAchievements)}
              className="p-2 text-gray-700 hover:text-black dark:text-gray-200 dark:hover:text-white rounded-md hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
              title="Achievements"
            >
              <Trophy size={20} />
            </button>

            <button
              onClick={() => setShowTemplates(true)}
              className="px-4 py-2 text-sm text-black dark:text-white border border-gray-300 dark:border-slate-600 rounded-md hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
            >
              Templates
            </button>

            {activeSection === 'goals' && (
              <button
                onClick={() => setShowStackingModal(true)}
                className="flex items-center space-x-2 px-4 py-2 text-sm text-black dark:text-white border border-gray-300 dark:border-slate-600 rounded-md hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                title="Manage Goal Sequences"
              >
                <Target size={16} />
                <span>Stack Goals</span>
              </button>
            )}

            <button
              onClick={() => {
                resetForm();
                setShowCreateModal(true);
              }}
              className="flex items-center space-x-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md font-medium transition-colors"
            >
              <Plus size={18} />
              <span>{activeSection === 'goals' ? 'New Goal' : 'New Dream'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stats Panel */}
      {showStats && (
        <div className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 p-6">
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{userStats.totalGoalsCompleted}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Completed</div>
            </div>
            <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{goals.filter(g => g.status === 'in-progress').length}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">In Progress</div>
            </div>
            <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{userStats.totalXpEarned}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Total XP</div>
            </div>
            <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">{userStats.currentStreak}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Current Streak</div>
            </div>
            <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{userStats.longestStreak}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Longest Streak</div>
            </div>
            <div className="text-center p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
              <div className="text-2xl font-bold text-indigo-600">{userStats.achievements.filter(a => a.isUnlocked).length}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Achievements</div>
            </div>
          </div>
        </div>
      )}

      {/* Filters & Categories */}
      <div className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 p-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          {/* Categories */}
          <div className="flex space-x-2 overflow-x-auto">
            <button
              onClick={() => setActiveCategory('all')}
              className={`px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-colors ${
                activeCategory === 'all'
                  ? 'bg-purple-600 text-white border border-purple-700 shadow-md'
                  : 'text-black dark:text-white hover:bg-gray-100 dark:hover:bg-slate-700 border border-gray-200 dark:border-slate-600'
              }`}
            >
              All ({activeSection === 'goals' ? goals.length : dreams.length})
            </button>
            {(activeSection === 'goals' ? GOAL_CATEGORIES : DREAM_CATEGORIES).map(category => {
              const Icon = category.icon;
              const count = activeSection === 'goals' 
                ? goals.filter(g => g.category === category.id).length
                : dreams.filter(d => d.category === category.id).length;
              return (
                <button
                  key={category.id}
                  onClick={() => setActiveCategory(category.id)}
                  className={`flex items-center space-x-2 px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-colors ${
                    activeCategory === category.id
                      ? 'text-white shadow-md'
                      : 'text-black dark:text-white hover:bg-gray-100 dark:hover:bg-slate-700 border border-gray-200 dark:border-slate-600'
                  }`}
                  style={{
                    backgroundColor: activeCategory === category.id ? category.color : undefined
                  }}
                >
                  <Icon size={16} />
                  <span>{category.name} ({count})</span>
                </button>
              );
            })}
          </div>

          {/* Search & Filters */}
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder={`Search ${activeSection}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-slate-700 dark:text-white"
              />
            </div>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-slate-700 dark:text-white"
            >
              <option value="priority">Sort by Priority</option>
              <option value="progress">Sort by Progress</option>
              <option value="deadline">Sort by Deadline</option>
              <option value="created">Sort by Created</option>
            </select>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="showCompleted"
                checked={showCompleted}
                onChange={(e) => setShowCompleted(e.target.checked)}
                className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
              />
              <label htmlFor="showCompleted" className="text-sm text-gray-600 dark:text-gray-400">
                Show completed
              </label>
            </div>

            {/* View Mode */}
            <div className="flex bg-gray-100 dark:bg-slate-700 rounded-lg p-1">
              {[
                { id: 'grid', icon: Target, label: 'Grid' },
                { id: 'list', icon: AlignLeft, label: 'List' },
                { id: 'kanban', icon: BarChart3, label: 'Kanban' }
              ].map(({ id, icon: Icon, label }) => (
                <button
                  key={id}
                  onClick={() => setViewMode(id as any)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center space-x-1 ${
                    viewMode === id
                      ? 'bg-white dark:bg-slate-600 text-gray-900 dark:text-white shadow-sm'
                      : 'text-black dark:text-white hover:text-gray-900 dark:hover:text-white'
                  }`}
                  title={label}
                >
                  <Icon size={14} />
                  <span className="hidden sm:inline">{label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {filteredItems.length === 0 ? (
          <div className="text-center py-16">
            {activeSection === 'goals' ? (
              <Target className="w-16 h-16 mx-auto text-gray-300 dark:text-slate-600 mb-4" />
            ) : (
              <Star className="w-16 h-16 mx-auto text-gray-300 dark:text-slate-600 mb-4" />
            )}
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {searchQuery ? `No ${activeSection} found` : `No ${activeSection} yet`}
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              {searchQuery 
                ? 'Try adjusting your search or filters'
                : activeSection === 'goals' 
                ? 'Set your first goal and start your journey to success!'
                : 'Add your first dream and start planning your aspirations!'
              }
            </p>
            {!searchQuery && (
              <div className="space-x-3">
                <button
                  onClick={() => setShowTemplates(true)}
                  className="px-4 py-2 text-purple-600 border border-purple-600 rounded-md hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors"
                >
                  Browse Templates
                </button>
                <button
                  onClick={() => {
                    resetForm();
                    setShowCreateModal(true);
                  }}
                  className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
                >
                  {activeSection === 'goals' ? 'Create Goal' : 'Add Dream'}
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 justify-items-center">
            {filteredItems.map((item) => {
              if (activeSection === 'goals') {
                // Goals view - Instax photo style (similar to dreams)
                const goal = item;
                const category = GOAL_CATEGORIES.find(c => c.id === goal.category);
                const daysLeft = getDaysUntilDeadline(goal.targetDate);
                const goalPhoto = goal.attachments?.find(a => a.type === 'image'); // Get first image if available
                const isLocked = isGoalLocked(goal.id);
                const stackIndex = stackedGoals.indexOf(goal.id);
                const isInStack = stackIndex !== -1;

                return (
                  <div
                    key={goal.id}
                    draggable={!isLocked}
                    onDragStart={(e) => !isLocked && handleDragStart(e, goal)}
                    onContextMenu={(e) => handleRightClick(e, goal)}
                    onClick={() => {
                      if (!isLocked) {
                        setSelectedGoal(goal);
                        setShowGoalModal(true);
                      }
                    }}
                    className={`group rounded-lg shadow-lg transition-all duration-300 select-none ${
                      isLocked 
                        ? 'opacity-50 cursor-not-allowed bg-gray-200 dark:bg-gray-600' 
                        : 'cursor-pointer hover:shadow-xl transform hover:scale-105 hover:rotate-1 bg-white dark:bg-slate-100'
                    }`}
                    style={{ 
                      aspectRatio: '3/4',
                      width: '240px',
                      padding: '16px',
                      background: isLocked 
                        ? 'linear-gradient(145deg, #e5e7eb 0%, #d1d5db 100%)' 
                        : 'linear-gradient(145deg, #ffffff 0%, #f8f8f8 100%)'
                    }}
                  >
                    {/* Instax Photo */}
                    <div className="h-full flex flex-col">
                      {/* Photo Area */}
                      <div 
                        className="flex-1 bg-gray-100 dark:bg-gray-200 rounded-sm mb-4 relative overflow-hidden group/photo"
                        style={{ minHeight: '180px' }}
                      >
                        {goalPhoto ? (
                          <img 
                            src={goalPhoto.url} 
                            alt={goal.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div 
                            className="w-full h-full flex flex-col items-center justify-center relative p-4"
                            style={{ 
                              background: `linear-gradient(135deg, ${category?.color}15, ${category?.color}25)`,
                            }}
                          >
                            {/* Category Icon */}
                            <div 
                              className="w-12 h-12 rounded-full flex items-center justify-center mb-3"
                              style={{ backgroundColor: category?.color }}
                            >
                              {(() => {
                                const Icon = category?.icon || Target;
                                return <Icon className="w-6 h-6 text-white" />;
                              })()}
                            </div>
                            
                            {/* Progress Circle */}
                            <div className="relative w-16 h-16 mb-2">
                              <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 64 64">
                                <circle
                                  cx="32"
                                  cy="32"
                                  r="28"
                                  fill="none"
                                  stroke="#e5e7eb"
                                  strokeWidth="4"
                                />
                                <circle
                                  cx="32"
                                  cy="32"
                                  r="28"
                                  fill="none"
                                  stroke={getProgressColor(goal.progress)}
                                  strokeWidth="4"
                                  strokeDasharray={`${2 * Math.PI * 28}`}
                                  strokeDashoffset={`${2 * Math.PI * 28 * (1 - goal.progress / 100)}`}
                                  className="transition-all duration-500"
                                />
                              </svg>
                              <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-lg font-bold" style={{ color: category?.color }}>
                                  {goal.progress}%
                                </span>
                              </div>
                            </div>
                            
                            {/* Difficulty & XP */}
                            <div className="text-xs text-gray-600 text-center">
                              {DIFFICULTY_CONFIG[goal.difficulty].icon} +{goal.xpReward} XP
                            </div>
                            
                            {/* Streak Indicator */}
                            {goal.streakEnabled && (
                              <div className="text-xs text-center mt-1">
                                <div className="flex items-center justify-center space-x-1">
                                  <span>🔥</span>
                                  <span className="font-medium text-orange-600">
                                    {goal.currentStreak || 0}
                                    {(goal.streakFrequency || 'daily') === 'daily' ? 'd' : 
                                     (goal.streakFrequency || 'daily') === 'weekly' ? 'w' : 'm'}
                                  </span>
                                  {goal.streakTarget && (
                                    <span className="text-gray-500">
                                      /{goal.streakTarget}
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                        
                        {/* Status and Priority Overlays */}
                        <div className="absolute top-2 left-2 flex items-center space-x-1">
                          <div className={`w-2 h-2 rounded-full ${
                            goal.priority === 'low' ? 'bg-gray-400' :
                            goal.priority === 'medium' ? 'bg-blue-400' :
                            goal.priority === 'high' ? 'bg-yellow-400' :
                            'bg-red-400'
                          }`} />
                          {isInStack && (
                            <div className="bg-purple-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold">
                              {stackIndex + 1}
                            </div>
                          )}
                        </div>
                        
                        {/* Lock Overlay for Locked Goals */}
                        {isLocked && (
                          <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center rounded-sm">
                            <div className="bg-white bg-opacity-90 rounded-full p-2">
                              <Lock size={20} className="text-gray-600" />
                            </div>
                          </div>
                        )}
                        
                        <div className="absolute top-2 right-2 flex items-center space-x-1">
                          {!isLocked && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openProgressUpdate(goal);
                              }}
                              className="opacity-0 group-hover:opacity-100 bg-white bg-opacity-90 rounded-full p-1.5 transition-all duration-200 hover:bg-opacity-100 shadow-md"
                              title="Update Progress"
                            >
                              <TrendingUp size={12} className="text-gray-700" />
                            </button>
                          )}
                          {!isLocked && goal.streakEnabled && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                const streakStatus = getGoalStreakStatus(goal.id);
                                const isCompletedToday = streakStatus.isActiveToday;
                                updateGoalStreak(goal.id, !isCompletedToday);
                              }}
                              className={`opacity-0 group-hover:opacity-100 rounded-full p-1.5 transition-all duration-200 shadow-md ${
                                getGoalStreakStatus(goal.id).isActiveToday
                                  ? 'bg-orange-500 hover:bg-orange-600'
                                  : 'bg-white bg-opacity-90 hover:bg-opacity-100'
                              }`}
                              title={getGoalStreakStatus(goal.id).isActiveToday ? "Completed Today" : "Mark as Done Today"}
                            >
                              <Flame size={12} className={getGoalStreakStatus(goal.id).isActiveToday ? "text-white" : "text-orange-500"} />
                            </button>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedGoal(goal);
                              setEditingExistingGoal(goal);
                              setFormData({
                                title: goal.title,
                                description: goal.description,
                                category: goal.category,
                                priority: goal.priority,
                                difficulty: goal.difficulty,
                                status: goal.status,
                                targetValue: goal.targetValue || 0,
                                currentValue: goal.currentValue || 0,
                                unit: goal.unit || '',
                                targetDate: format(goal.targetDate, 'yyyy-MM-dd'),
                                tags: goal.tags || [],
                                isPublic: goal.isPublic || false,
                                notes: goal.notes || '',
                                streakEnabled: goal.streakEnabled || false,
                                streakFrequency: goal.streakFrequency || 'daily',
                                streakTarget: goal.streakTarget
                              });
                              setMilestones(goal.milestones || []);
                              setSubGoals(goal.subGoals || []);
                              setAttachments(goal.attachments || []);
                              setActiveSection('goals');
                              setShowCreateModal(true);
                            }}
                            className="opacity-0 group-hover:opacity-100 bg-white bg-opacity-90 rounded-full p-1.5 transition-all duration-200 hover:bg-opacity-100 shadow-md"
                            title="Edit Goal"
                          >
                            <Edit3 size={12} className="text-gray-700" />
                          </button>
                          <div className={`w-2 h-2 rounded-full ${
                            goal.status === 'completed' ? 'bg-green-500' :
                            goal.status === 'in-progress' ? 'bg-blue-500' :
                            goal.status === 'paused' ? 'bg-yellow-500' :
                            'bg-gray-500'
                          }`} />
                        </div>

                        {/* Photo Upload Overlay (if no photo) */}
                        {!goalPhoto && (
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover/photo:bg-opacity-20 transition-all duration-200 flex items-center justify-center">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                // TODO: Add photo upload for goals
                              }}
                              className="opacity-0 group-hover/photo:opacity-100 bg-white bg-opacity-90 rounded-full p-2 transition-all duration-200 hover:bg-opacity-100"
                            >
                              <Camera size={16} className="text-gray-700" />
                            </button>
                          </div>
                        )}
                      </div>

                      {/* White Description Area (Instax bottom) */}
                      <div className="bg-white rounded-sm p-3 min-h-[60px] flex flex-col justify-center">
                        {/* Title in handwritten style */}
                        <h3 
                          className="text-gray-800 text-sm font-medium mb-1 line-clamp-2 text-center"
                          style={{ 
                            fontFamily: 'cursive',
                            lineHeight: '1.2'
                          }}
                        >
                          {goal.title}
                        </h3>
                        
                        {/* Category and progress in small text */}
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span style={{ fontFamily: 'cursive' }}>
                            {category?.name}
                          </span>
                          <div className="flex items-center space-x-2">
                            {goal.targetValue && (
                              <span style={{ fontFamily: 'cursive' }}>
                                {goal.currentValue || 0}/{goal.targetValue} {goal.unit}
                              </span>
                            )}
                            <span 
                              className={`${
                                daysLeft < 0 ? 'text-red-500' :
                                daysLeft < 7 ? 'text-yellow-500' :
                                'text-gray-500'
                              }`}
                              style={{ fontFamily: 'cursive' }}
                            >
                              {daysLeft < 0 
                                ? `${Math.abs(daysLeft)}d over`
                                : daysLeft === 0
                                ? 'Due today'
                                : `${daysLeft}d left`
                              }
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              } else {
                // Dreams view - Instax photo style
                const dream = item;
                const category = DREAM_CATEGORIES.find(c => c.id === dream.category);
                const dreamPhoto = dream.visualBoard?.[0]; // Get first photo if available

                return (
                  <div
                    key={dream.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, dream)}
                    onContextMenu={(e) => handleRightClick(e, dream)}
                    onClick={() => handleDreamClick(dream)}
                    className="group bg-white dark:bg-slate-100 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer select-none transform hover:scale-105 hover:rotate-1"
                    style={{ 
                      aspectRatio: '3/4',
                      width: '240px',
                      padding: '16px',
                      background: 'linear-gradient(145deg, #ffffff 0%, #f8f8f8 100%)'
                    }}
                  >
                    {/* Instax Photo */}
                    <div className="h-full flex flex-col">
                      {/* Photo Area */}
                      <div 
                        className="flex-1 bg-gray-100 dark:bg-gray-200 rounded-sm mb-4 relative overflow-hidden group/photo"
                        style={{ minHeight: '180px' }}
                      >
                        {dreamPhoto ? (
                          <img 
                            src={dreamPhoto.url} 
                            alt={dream.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div 
                            className="w-full h-full flex items-center justify-center relative"
                            style={{ 
                              background: `linear-gradient(135deg, ${category?.color}15, ${category?.color}25)`,
                            }}
                          >
                            <div className="text-4xl opacity-60">
                              {category?.defaultImage || '✨'}
                            </div>
                          </div>
                        )}
                        
                        {/* Status and Priority Overlays */}
                        <div className="absolute top-2 left-2">
                          <div className={`w-2 h-2 rounded-full ${
                            dream.priority === 'someday' ? 'bg-gray-400' :
                            dream.priority === 'within-5-years' ? 'bg-yellow-400' :
                            dream.priority === 'within-10-years' ? 'bg-blue-400' :
                            'bg-purple-400'
                          }`} />
                        </div>
                        
                        <div className="absolute top-2 right-2 flex items-center space-x-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingExistingDream(dream);
                              setFormData({
                                ...formData,
                                title: dream.title,
                                description: dream.description,
                                category: dream.category,
                                targetValue: dream.estimatedCost || 0,
                                tags: dream.tags || [],
                                notes: dream.notes || '',
                                isPublic: dream.isPublic || false
                              });
                              setFormDreamPhotos(dream.visualBoard || []);
                              setDreamPriority(dream.priority || 'someday');
                              setDreamStatus(dream.status || 'dreaming');
                              setDreamTimeframe(dream.estimatedTimeframe || '');
                              setDreamResources(dream.requiredResources || []);
                              setDreamInspiration(dream.inspirationSources || []);
                              setActiveSection('dreams');
                              setShowCreateModal(true);
                            }}
                            className="opacity-0 group-hover:opacity-100 bg-white bg-opacity-90 rounded-full p-1.5 transition-all duration-200 hover:bg-opacity-100 shadow-md"
                            title="Edit Dream"
                          >
                            <Edit3 size={12} className="text-gray-700" />
                          </button>
                          <div className={`w-2 h-2 rounded-full ${
                            dream.status === 'achieved' ? 'bg-green-500' :
                            dream.status === 'in-progress' ? 'bg-blue-500' :
                            dream.status === 'planning' ? 'bg-yellow-500' :
                            'bg-gray-500'
                          }`} />
                        </div>

                        {/* Photo Upload Overlay */}
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover/photo:bg-opacity-20 transition-all duration-200 flex items-center justify-center">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              triggerPhotoUpload(dream.id);
                            }}
                            className="opacity-0 group-hover/photo:opacity-100 bg-white bg-opacity-90 rounded-full p-2 transition-all duration-200 hover:bg-opacity-100"
                          >
                            <Camera size={16} className="text-gray-700" />
                          </button>
                        </div>
                      </div>

                      {/* White Description Area (Instax bottom) */}
                      <div className="bg-white rounded-sm p-3 min-h-[60px] flex flex-col justify-center">
                        {editingDream === dream.id ? (
                          // Edit mode
                          <div className="space-y-2">
                            <input
                              type="text"
                              value={editDreamTitle}
                              onChange={(e) => setEditDreamTitle(e.target.value)}
                              className="w-full text-sm font-medium text-center bg-transparent border-none outline-none text-gray-800"
                              style={{ 
                                fontFamily: 'cursive',
                                lineHeight: '1.2'
                              }}
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  saveDreamEdit(dream.id);
                                } else if (e.key === 'Escape') {
                                  cancelDreamEdit();
                                }
                              }}
                            />
                            
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-gray-500" style={{ fontFamily: 'cursive' }}>
                                {category?.name}
                              </span>
                              <div className="flex items-center space-x-1">
                                <span className="text-gray-500" style={{ fontFamily: 'cursive' }}>$</span>
                                <input
                                  type="number"
                                  value={editDreamCost}
                                  onChange={(e) => setEditDreamCost(e.target.value)}
                                  placeholder="0"
                                  className="w-12 text-xs bg-transparent border-none outline-none text-gray-500 text-right"
                                  style={{ fontFamily: 'cursive' }}
                                />
                              </div>
                            </div>
                            
                            {/* Save/Cancel buttons */}
                            <div className="flex items-center justify-center space-x-2 mt-2">
                              <button
                                onClick={() => saveDreamEdit(dream.id)}
                                className="px-2 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600 transition-colors"
                              >
                                ✓
                              </button>
                              <button
                                onClick={cancelDreamEdit}
                                className="px-2 py-1 bg-gray-500 text-white rounded text-xs hover:bg-gray-600 transition-colors"
                              >
                                ✕
                              </button>
                            </div>
                          </div>
                        ) : (
                          // View mode
                          <>
                            {/* Title in handwritten style */}
                            <h3 
                              className="text-gray-800 text-sm font-medium mb-1 line-clamp-2 text-center cursor-pointer hover:bg-gray-50 rounded px-1 py-0.5 transition-colors"
                              style={{ 
                                fontFamily: 'cursive',
                                lineHeight: '1.2'
                              }}
                              onClick={(e) => startEditingDream(dream, e)}
                              title="Click to edit"
                            >
                              {dream.title}
                            </h3>
                            
                            {/* Category and cost in small text */}
                            <div className="flex items-center justify-between text-xs text-gray-500">
                              <span style={{ fontFamily: 'cursive' }}>
                                {category?.name}
                              </span>
                              <span 
                                className="cursor-pointer hover:bg-gray-50 rounded px-1 py-0.5 transition-colors"
                                style={{ fontFamily: 'cursive' }}
                                onClick={(e) => startEditingDream(dream, e)}
                                title="Click to edit cost"
                              >
                                {dream.estimatedCost ? `$${dream.estimatedCost.toLocaleString()}` : dream.estimatedTimeframe || '∞'}
                              </span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              }
            })}
          </div>
        )}
      </div>

      {/* Hidden File Input for Dream Photo Upload */}
      <input
        type="file"
        ref={dreamPhotoInputRef}
        onChange={(e) => uploadingDreamId && handleDreamPhotoUpload(uploadingDreamId, e)}
        accept="image/*"
        className="hidden"
      />

      {/* Hidden File Input for Create Dream Modal */}
      <input
        type="file"
        ref={createDreamPhotoInputRef}
        onChange={handleCreateDreamPhotoUpload}
        accept="image/*"
        className="hidden"
      />

      {/* Create Goal Modal */}
      {showCreateModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowCreateModal(false);
            }
          }}
        >
          <div 
            className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md h-[85vh] overflow-hidden flex flex-col relative"
            onClick={(e) => e.stopPropagation()}
            style={{ maxHeight: '85vh', height: '85vh' }}
          >
            {/* Floating Close Button */}
            <button
              onClick={() => setShowCreateModal(false)}
              className="absolute top-2 right-2 z-50 w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg transition-colors"
              title="Close Modal"
            >
              <X size={16} />
            </button>
            <div className="p-4 border-b border-gray-200 dark:border-slate-700 flex-shrink-0">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {editingExistingDream 
                      ? 'Edit Dream'
                      : editingExistingGoal
                      ? 'Edit Goal'
                      : activeSection === 'goals' 
                      ? 'Create Goal' 
                      : 'Create Dream'
                    }
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Scroll down to see more fields
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowCreateModal(false);
                  }}
                  className="w-8 h-8 bg-gray-100 hover:bg-gray-200 dark:bg-slate-600 dark:hover:bg-slate-500 rounded-full flex items-center justify-center transition-colors"
                  title="Close"
                >
                  <X size={16} className="text-gray-600 dark:text-gray-300" />
                </button>
              </div>
            </div>
            <div 
              className="flex-1 overflow-y-scroll p-4 space-y-4 bg-gray-50 dark:bg-slate-700" 
              style={{ 
                maxHeight: 'calc(85vh - 120px)', 
                overflowY: 'scroll',
                scrollbarWidth: 'auto'
              }}
            >
              {/* Basic Info */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {activeSection === 'goals' ? 'Goal Title' : 'Dream Title'} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder={activeSection === 'goals' ? 'Enter your goal title...' : 'Enter your dream title...'}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-slate-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder={activeSection === 'goals' ? 'Describe your goal...' : 'Describe your dream...'}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-slate-700 dark:text-white"
                  />
                </div>

                {/* Photo Upload Section - Only for Dreams */}
                {activeSection === 'dreams' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Dream Visualization
                    </label>
                    <div className="flex items-center space-x-4">
                      <button
                        type="button"
                        onClick={triggerCreateDreamPhotoUpload}
                        className="flex items-center space-x-2 px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-md hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                      >
                        <Camera size={20} className="text-gray-500" />
                        <span className="text-sm text-gray-700 dark:text-gray-300">Upload Photo</span>
                      </button>
                      {formDreamPhotos.length > 0 && (
                        <span className="text-sm text-gray-500">
                          {formDreamPhotos.length} photo{formDreamPhotos.length > 1 ? 's' : ''} added
                        </span>
                      )}
                    </div>
                    
                    {/* Photo Preview */}
                    {formDreamPhotos.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {formDreamPhotos.map((photo, index) => (
                          <div key={photo.id} className="relative group">
                            <img
                              src={photo.url}
                              alt={`Dream photo ${index + 1}`}
                              className="w-20 h-20 object-cover rounded-lg border border-gray-200 dark:border-slate-600"
                            />
                            <button
                              type="button"
                              onClick={() => setFormDreamPhotos(prev => prev.filter(p => p.id !== photo.id))}
                              className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-xs"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Category
                  </label>
                  {activeSection === 'goals' ? (
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value as Goal['category'] })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-slate-700 dark:text-white"
                    >
                      {GOAL_CATEGORIES.map(category => {
                        const count = goals.filter(g => g.category === category.id).length;
                        return (
                          <option key={category.id} value={category.id}>
                            {category.name} ({count})
                          </option>
                        );
                      })}
                    </select>
                  ) : (
                    <div className="space-y-2">
                      {/* All Option */}
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, category: 'travel' })}
                        className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-md border transition-colors ${
                          formData.category === 'all'
                            ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-900 dark:text-purple-100 border-purple-200 dark:border-purple-700'
                            : 'bg-gray-50 dark:bg-slate-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-slate-600 hover:bg-gray-100 dark:hover:bg-slate-600'
                        }`}
                      >
                        <span>All ({dreams.length})</span>
                        <span className="text-xs text-gray-500">Choose a specific category</span>
                      </button>
                      
                      {/* Category Grid */}
                      <div className="grid grid-cols-2 gap-2">
                        {DREAM_CATEGORIES.map(category => {
                          const count = dreams.filter(d => d.category === category.id).length;
                          const Icon = category.icon;
                          return (
                            <button
                              key={category.id}
                              type="button"
                              onClick={() => setFormData({ ...formData, category: category.id })}
                              className={`flex items-center space-x-2 px-3 py-2 text-sm rounded-md border transition-colors ${
                                formData.category === category.id
                                  ? 'text-white border-transparent shadow-sm'
                                  : 'bg-white dark:bg-slate-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-600'
                              }`}
                              style={{
                                backgroundColor: formData.category === category.id ? category.color : undefined
                              }}
                            >
                              <Icon size={14} />
                              <span className="flex-1 text-left">{category.name}</span>
                              <span className="text-xs opacity-75">({count})</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {activeSection === 'goals' ? (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Priority
                      </label>
                      <select
                        value={formData.priority}
                        onChange={(e) => setFormData({ ...formData, priority: e.target.value as Goal['priority'] })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-slate-700 dark:text-white"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="critical">Critical</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Status
                      </label>
                      <select
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value as Goal['status'] })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-slate-700 dark:text-white"
                      >
                        <option value="not-started">Not Started</option>
                        <option value="in-progress">In Progress</option>
                        <option value="paused">Paused</option>
                        <option value="completed">Completed</option>
                        <option value="failed">Failed</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Difficulty
                      </label>
                      <select
                        value={formData.difficulty}
                        onChange={(e) => setFormData({ ...formData, difficulty: e.target.value as Goal['difficulty'] })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-slate-700 dark:text-white"
                      >
                        {Object.entries(DIFFICULTY_CONFIG).map(([key, config]) => (
                          <option key={key} value={key}>
                            {config.icon} {key.charAt(0).toUpperCase() + key.slice(1)} (+{config.xp} XP)
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Streak Configuration */}
                    <div className="space-y-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="streakEnabled"
                          checked={formData.streakEnabled}
                          onChange={(e) => setFormData({ ...formData, streakEnabled: e.target.checked })}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <label htmlFor="streakEnabled" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          🔥 Enable Streak Tracking
                        </label>
                      </div>
                      
                      {formData.streakEnabled && (
                        <div className="space-y-3 pl-6">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Streak Frequency
                            </label>
                            <select
                              value={formData.streakFrequency}
                              onChange={(e) => setFormData({ ...formData, streakFrequency: e.target.value as Goal['streakFrequency'] })}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
                            >
                              <option value="daily">Daily (track every day)</option>
                              <option value="weekly">Weekly (track weekly progress)</option>
                              <option value="monthly">Monthly (track monthly progress)</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Streak Target (Optional)
                            </label>
                            <input
                              type="number"
                              value={formData.streakTarget || ''}
                              onChange={(e) => setFormData({ ...formData, streakTarget: e.target.value ? parseInt(e.target.value) : undefined })}
                              placeholder={formData.streakFrequency === 'daily' ? 'e.g., 21 days' : formData.streakFrequency === 'weekly' ? 'e.g., 12 weeks' : 'e.g., 6 months'}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
                            />
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              Set a target streak length for extra motivation
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Target Date
                      </label>
                      <input
                        type="date"
                        value={formData.targetDate}
                        onChange={(e) => setFormData({ ...formData, targetDate: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-slate-700 dark:text-white"
                      />
                    </div>
                  </>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Estimated Cost (Optional)
                    </label>
                    <input
                      type="number"
                      value={formData.targetValue || ''}
                      onChange={(e) => setFormData({ ...formData, targetValue: parseFloat(e.target.value) || 0 })}
                      placeholder="Enter estimated cost..."
                      className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-slate-700 dark:text-white"
                    />
                  </div>
                )}
              </div>

              {/* Target Value - Only for Goals */}
              {activeSection === 'goals' && (
                <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Target Value
                  </label>
                  <input
                    type="number"
                    value={formData.targetValue}
                    onChange={(e) => setFormData({ ...formData, targetValue: parseFloat(e.target.value) || 0 })}
                    placeholder="100"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-slate-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Current Value
                  </label>
                  <input
                    type="number"
                    value={formData.currentValue}
                    onChange={(e) => setFormData({ ...formData, currentValue: parseFloat(e.target.value) || 0 })}
                    placeholder="0"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-slate-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Unit
                  </label>
                  <input
                    type="text"
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    placeholder="lbs, $, hours..."
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-slate-700 dark:text-white"
                  />
                </div>
                </div>
              )}

              {/* Dream-Specific Fields */}
              {activeSection === 'dreams' && (
                <div className="space-y-4">
                  {/* Priority and Status */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Priority
                      </label>
                      <select
                        value={dreamPriority}
                        onChange={(e) => setDreamPriority(e.target.value as any)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-slate-700 dark:text-white"
                      >
                        <option value="someday">Someday</option>
                        <option value="within-5-years">Within 5 Years</option>
                        <option value="within-10-years">Within 10 Years</option>
                        <option value="lifetime">Lifetime Goal</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Status
                      </label>
                      <select
                        value={dreamStatus}
                        onChange={(e) => setDreamStatus(e.target.value as any)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-slate-700 dark:text-white"
                      >
                        <option value="dreaming">Dreaming</option>
                        <option value="planning">Planning</option>
                        <option value="in-progress">In Progress</option>
                        <option value="achieved">Achieved</option>
                        <option value="no-longer-interested">No Longer Interested</option>
                      </select>
                    </div>
                  </div>

                  {/* Timeframe */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Estimated Timeframe
                    </label>
                    <input
                      type="text"
                      value={dreamTimeframe}
                      onChange={(e) => setDreamTimeframe(e.target.value)}
                      placeholder="e.g., 2 years, when I retire, by age 40"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-slate-700 dark:text-white"
                    />
                  </div>

                  {/* Required Resources */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Required Resources
                    </label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {dreamResources.map(resource => (
                        <span
                          key={resource}
                          className="inline-flex items-center px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-md text-sm"
                        >
                          {resource}
                          <button
                            onClick={() => removeResource(resource)}
                            className="ml-1 text-blue-600 hover:text-blue-800"
                          >
                            <X size={12} />
                          </button>
                        </span>
                      ))}
                    </div>
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={resourceInput}
                        onChange={(e) => setResourceInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addResource())}
                        placeholder="Add required resource..."
                        className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-slate-700 dark:text-white"
                      />
                      <button
                        onClick={addResource}
                        className="px-4 py-2 bg-gray-100 dark:bg-slate-600 text-gray-700 dark:text-gray-300 rounded-md text-sm hover:bg-gray-200 dark:hover:bg-slate-500 transition-colors"
                      >
                        Add
                      </button>
                    </div>
                  </div>

                  {/* Inspiration Sources */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Inspiration Sources
                    </label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {dreamInspiration.map(inspiration => (
                        <span
                          key={inspiration}
                          className="inline-flex items-center px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 rounded-md text-sm"
                        >
                          {inspiration}
                          <button
                            onClick={() => removeInspiration(inspiration)}
                            className="ml-1 text-green-600 hover:text-green-800"
                          >
                            <X size={12} />
                          </button>
                        </span>
                      ))}
                    </div>
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={inspirationInput}
                        onChange={(e) => setInspirationInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addInspiration())}
                        placeholder="Add inspiration source..."
                        className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-slate-700 dark:text-white"
                      />
                      <button
                        onClick={addInspiration}
                        className="px-4 py-2 bg-gray-100 dark:bg-slate-600 text-gray-700 dark:text-gray-300 rounded-md text-sm hover:bg-gray-200 dark:hover:bg-slate-500 transition-colors"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Milestones - Only for Goals */}
              {activeSection === 'goals' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Milestones
                  </label>
                  
                  {/* Existing Milestones */}
                  {milestones.length > 0 && (
                    <div className="space-y-2 mb-4">
                      {milestones.map((milestone) => (
                        <div key={milestone.id} className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-slate-700 rounded-lg">
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center cursor-pointer ${
                            milestone.isCompleted 
                              ? 'bg-green-500 text-white' 
                              : 'bg-gray-300 dark:bg-gray-600 hover:bg-gray-400'
                          }`}
                          onClick={() => toggleMilestone(milestone.id)}
                          >
                            {milestone.isCompleted && <CheckCircle2 size={12} />}
                          </div>
                          <div className="flex-1">
                            <div className={`text-sm font-medium ${
                              milestone.isCompleted 
                                ? 'line-through text-gray-500' 
                                : 'text-gray-900 dark:text-white'
                            }`}>
                              {milestone.title}
                            </div>
                            {milestone.description && (
                              <div className="text-xs text-gray-600 dark:text-gray-400">
                                {milestone.description}
                              </div>
                            )}
                            <div className="text-xs text-gray-500">
                              Target: {milestone.targetValue} • +{milestone.xpReward} XP
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeMilestone(milestone.id)}
                            className="text-red-500 hover:text-red-700 p-1"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add New Milestone */}
                  <div className="space-y-3 p-3 bg-gray-50 dark:bg-slate-700 rounded-lg">
                    <h5 className="text-sm font-medium text-gray-900 dark:text-white">Add Milestone</h5>
                    
                    <div className="grid grid-cols-1 gap-3">
                      <input
                        type="text"
                        value={newMilestone.title}
                        onChange={(e) => setNewMilestone({ ...newMilestone, title: e.target.value })}
                        placeholder="Milestone title..."
                        className="px-3 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-slate-800 dark:text-white"
                      />
                      
                      <input
                        type="text"
                        value={newMilestone.description}
                        onChange={(e) => setNewMilestone({ ...newMilestone, description: e.target.value })}
                        placeholder="Description (optional)..."
                        className="px-3 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-slate-800 dark:text-white"
                      />
                      
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="number"
                          value={newMilestone.targetValue}
                          onChange={(e) => setNewMilestone({ ...newMilestone, targetValue: parseInt(e.target.value) || 0 })}
                          placeholder="Target value"
                          className="px-3 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-slate-800 dark:text-white"
                        />
                        
                        <input
                          type="number"
                          value={newMilestone.xpReward}
                          onChange={(e) => setNewMilestone({ ...newMilestone, xpReward: parseInt(e.target.value) || 50 })}
                          placeholder="XP reward"
                          className="px-3 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-slate-800 dark:text-white"
                        />
                      </div>
                    </div>
                    
                    <button
                      type="button"
                      onClick={addMilestone}
                      disabled={!newMilestone.title.trim()}
                      className="w-full px-4 py-2 bg-purple-600 text-white rounded-md text-sm font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Add Milestone
                    </button>
                  </div>
                </div>
              )}

              {/* Sub-Goals - Only for Goals */}
              {activeSection === 'goals' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Sub-Goals
                  </label>
                  
                  {/* Existing Sub-Goals */}
                  {subGoals.length > 0 && (
                    <div className="space-y-2 mb-4">
                      {subGoals.map((subGoal) => (
                        <div key={subGoal.id} className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-slate-700 rounded-lg">
                          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center cursor-pointer ${ 
                            subGoal.isCompleted 
                              ? 'bg-green-500 border-green-500 text-white' 
                              : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                          }`}
                          onClick={() => toggleSubGoal(subGoal.id)}
                          >
                            {subGoal.isCompleted && <CheckCircle2 size={12} />}
                          </div>
                          <div className="flex-1">
                            <div className={`text-sm font-medium ${
                              subGoal.isCompleted 
                                ? 'line-through text-gray-500' 
                                : 'text-gray-900 dark:text-white'
                            }`}>
                              {subGoal.title}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeSubGoal(subGoal.id)}
                            className="text-red-500 hover:text-red-700 p-1"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add New Sub-Goal */}
                  <div className="space-y-3 p-3 bg-gray-50 dark:bg-slate-700 rounded-lg">
                    <h5 className="text-sm font-medium text-gray-900 dark:text-white">Add Sub-Goal</h5>
                    
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={newSubGoal.title}
                        onChange={(e) => setNewSubGoal({ ...newSubGoal, title: e.target.value })}
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSubGoal())}
                        placeholder="Sub-goal title..."
                        className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-slate-800 dark:text-white"
                      />
                      <button
                        type="button"
                        onClick={addSubGoal}
                        disabled={!newSubGoal.title.trim()}
                        className="px-4 py-2 bg-purple-600 text-white rounded-md text-sm font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tags
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {formData.tags.map(tag => (
                    <span
                      key={tag}
                      className="inline-flex items-center px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200 rounded-md text-sm"
                    >
                      #{tag}
                      <button
                        onClick={() => removeTag(tag)}
                        className="ml-1 text-purple-600 hover:text-purple-800"
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                    placeholder="Add tag..."
                    className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-slate-700 dark:text-white"
                  />
                  <button
                    onClick={addTag}
                    className="px-4 py-2 bg-gray-100 dark:bg-slate-600 text-gray-700 dark:text-gray-300 rounded-md text-sm hover:bg-gray-200 dark:hover:bg-slate-500 transition-colors"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Additional notes about your goal..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-slate-700 dark:text-white"
                />
              </div>

              {/* Attachments - Only for Goals */}
              {activeSection === 'goals' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Attachments
                  </label>
                  
                  {/* Existing Attachments */}
                  {attachments.length > 0 && (
                    <div className="space-y-2 mb-4">
                      {attachments.map((attachment) => (
                        <div key={attachment.id} className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-slate-700 rounded-lg">
                          <div className="flex-shrink-0">
                            {attachment.type === 'image' ? (
                              <ImageIcon size={20} className="text-blue-500" />
                            ) : attachment.type === 'link' ? (
                              <Link size={20} className="text-green-500" />
                            ) : (
                              <Download size={20} className="text-gray-500" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                              {attachment.name}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {attachment.type === 'link' ? 'Link' : 
                               attachment.size ? `${(attachment.size / 1024).toFixed(1)} KB` : 'File'}
                            </div>
                          </div>
                          {attachment.type === 'image' && (
                            <div className="flex-shrink-0">
                              <img 
                                src={attachment.url} 
                                alt={attachment.name}
                                className="w-10 h-10 object-cover rounded-md"
                              />
                            </div>
                          )}
                          <button
                            type="button"
                            onClick={() => removeAttachment(attachment.id)}
                            className="text-red-500 hover:text-red-700 p-1"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add Attachments */}
                  <div className="space-y-3">
                    <div className="flex space-x-2">
                      <button
                        type="button"
                        onClick={triggerAttachmentUpload}
                        className="flex items-center space-x-2 px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-md hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                      >
                        <Download size={16} className="text-gray-500" />
                        <span className="text-sm text-gray-700 dark:text-gray-300">Upload File</span>
                      </button>
                      
                      <button
                        type="button"
                        onClick={() => {
                          const url = prompt('Enter link URL:');
                          const name = prompt('Enter link name (optional):') || 'Link';
                          if (url) addLinkAttachment(url, name);
                        }}
                        className="flex items-center space-x-2 px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-md hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                      >
                        <Link size={16} className="text-gray-500" />
                        <span className="text-sm text-gray-700 dark:text-gray-300">Add Link</span>
                      </button>
                    </div>
                    
                    <input
                      type="file"
                      ref={attachmentInputRef}
                      onChange={handleAttachmentUpload}
                      className="hidden"
                      accept="*/*"
                    />
                  </div>
                </div>
              )}

              {/* Settings */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isPublic"
                    checked={formData.isPublic}
                    onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
                    className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                  <label htmlFor="isPublic" className="text-sm text-gray-600 dark:text-gray-400">
                    Make this goal public
                  </label>
                </div>
              </div>
            </div>

            {/* Compact Footer */}
            <div className="p-4 border-t border-gray-200 dark:border-slate-700 flex justify-center space-x-3 flex-shrink-0">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-3 py-2 text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors text-sm"
              >
                Cancel
              </button>
              <button
                onClick={createGoal}
                disabled={!formData.title.trim()}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
              >
                {editingExistingDream 
                  ? 'Update Dream'
                  : editingExistingGoal
                  ? 'Update Goal'
                  : activeSection === 'goals' 
                  ? 'Create Goal' 
                  : 'Create Dream'
                }
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Templates Modal */}
      {showTemplates && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowTemplates(false)}
        >
          <div 
            className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Fixed Header */}
            <div className="p-6 border-b border-gray-200 dark:border-slate-700 flex-shrink-0">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{activeSection === 'goals' ? 'Goal Templates' : 'Dream Templates'}</h3>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-900 dark:text-white">Click outside to close</span>
                  <button
                    onClick={() => setShowTemplates(false)}
                    className="p-2 text-gray-700 hover:text-black dark:text-gray-200 dark:hover:text-white rounded-md hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                    title="Close"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>
            </div>
            
            {/* Scrollable Content */}
            <div 
              className="flex-1 overflow-y-auto overscroll-contain"
              style={{ 
                scrollbarWidth: 'thin', 
                scrollbarColor: '#64748b #e2e8f0',
                maxHeight: 'calc(90vh - 120px)' 
              }}
            >
              <div className="p-6 pb-8">
                {(activeSection === 'goals' ? GOAL_CATEGORIES : DREAM_CATEGORIES).map(category => {
                  const Icon = category.icon;
                  const templates = activeSection === 'goals' 
                    ? GOAL_TEMPLATES[category.id as keyof typeof GOAL_TEMPLATES] || []
                    : DREAM_TEMPLATES[category.id as keyof typeof DREAM_TEMPLATES] || [];
                  
                  return (
                    <div key={category.id} className="mb-8 last:mb-0">
                      <div className="flex items-center space-x-3 mb-4">
                        <div 
                          className="w-8 h-8 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: category.color }}
                        >
                          <Icon className="w-4 h-4 text-white" />
                        </div>
                        <h4 className="text-lg font-medium text-gray-900 dark:text-white">{category.name}</h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{category.description}</p>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {templates.map((template, index) => (
                          <button
                            key={index}
                            onClick={() => createFromTemplate(template, category.id)}
                            className="p-4 border border-gray-200 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors text-left bg-white dark:bg-slate-800"
                          >
                            <h5 className="font-medium text-gray-900 dark:text-white mb-1">{template.title}</h5>
                            <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">{template.description}</p>
                            {activeSection === 'goals' ? (
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                Target: {template.targetValue} {template.unit}
                              </div>
                            ) : (
                              <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                                <span>Cost: ${template.estimatedCost?.toLocaleString()}</span>
                                <span>{template.timeframe}</span>
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Context Menu */}
      {showContextMenu && contextMenuItem && (
        <div
          className="fixed bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg shadow-xl z-50 py-2 min-w-48"
          style={{
            left: contextMenuPosition.x,
            top: contextMenuPosition.y,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-3 py-2 border-b border-gray-100 dark:border-slate-600">
            <div className="font-medium text-gray-900 dark:text-white text-sm">
              {contextMenuItem.title}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {activeSection === 'goals' ? 'Goal' : 'Dream'}
            </div>
          </div>
          
          <button
            onClick={() => moveItemToSection(contextMenuItem, activeSection === 'goals' ? 'dreams' : 'goals')}
            className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700 flex items-center space-x-2"
          >
            {activeSection === 'goals' ? (
              <>
                <Star size={16} className="text-purple-500" />
                <span>Move to Dreams</span>
              </>
            ) : (
              <>
                <Target size={16} className="text-green-500" />
                <span>Move to Goals</span>
              </>
            )}
          </button>

          <div className="px-3 py-2 border-t border-gray-100 dark:border-slate-600">
            <div className="text-xs text-gray-500 dark:text-gray-400">
              💡 Tip: You can also drag and drop items between sections
            </div>
          </div>
        </div>
      )}

      {/* Dream Detail Modal */}
      {showDreamModal && selectedDream && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowDreamModal(false);
            }
          }}
        >
          <div 
            className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-96 max-h-[600px] overflow-hidden flex flex-col relative transform transition-all duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header with Hero Image */}
            <div className="relative">
              {/* Cute Mini Header */}
              <div 
                className="h-24 w-full bg-gradient-to-br from-purple-400 via-pink-400 to-blue-400 relative"
                style={{
                  background: selectedDream.visualBoard?.[0]?.url 
                    ? `linear-gradient(rgba(0,0,0,0.2), rgba(0,0,0,0.4)), url(${selectedDream.visualBoard[0].url})`
                    : `linear-gradient(135deg, ${DREAM_CATEGORIES.find(c => c.id === selectedDream.category)?.color || '#8B5CF6'}60, ${DREAM_CATEGORIES.find(c => c.id === selectedDream.category)?.color || '#8B5CF6'}90)`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }}
              >
                {/* Cute Close Button */}
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowDreamModal(false);
                  }}
                  className="absolute top-2 right-2 w-6 h-6 bg-white bg-opacity-90 hover:bg-opacity-100 rounded-full flex items-center justify-center shadow-md transition-all duration-200 z-20 hover:scale-110"
                  title="Close"
                >
                  <X size={14} className="text-gray-600" />
                </button>
                
                {/* Mini Category Icon */}
                <div className="absolute bottom-2 left-3">
                  <div className="w-8 h-8 bg-white bg-opacity-90 rounded-lg flex items-center justify-center shadow-md">
                    <div className="text-lg">
                      {DREAM_CATEGORIES.find(c => c.id === selectedDream.category)?.defaultImage || '✨'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Compact Header */}
              <div className="p-4">
                <div className="text-center">
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1 line-clamp-2">
                    {selectedDream.title}
                  </h2>
                  <div className="flex items-center justify-center space-x-2 mb-3">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {DREAM_CATEGORIES.find(c => c.id === selectedDream.category)?.name}
                    </span>
                    <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      selectedDream.status === 'achieved' 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                        : selectedDream.status === 'in-progress'
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                        : selectedDream.status === 'planning'
                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                    }`}>
                      {selectedDream.status.replace('-', ' ')}
                    </div>
                  </div>
                  
                  {/* Cute Edit Button */}
                  <button
                    onClick={() => {
                      setShowDreamModal(false);
                      setEditingExistingDream(selectedDream);
                      setFormData({
                        ...formData,
                        title: selectedDream.title,
                        description: selectedDream.description,
                        category: selectedDream.category,
                        targetValue: selectedDream.estimatedCost || 0,
                        tags: selectedDream.tags || [],
                        notes: selectedDream.notes || '',
                        isPublic: selectedDream.isPublic || false
                      });
                      setFormDreamPhotos(selectedDream.visualBoard || []);
                      setDreamPriority(selectedDream.priority || 'someday');
                      setDreamStatus(selectedDream.status || 'dreaming');
                      setDreamTimeframe(selectedDream.estimatedTimeframe || '');
                      setDreamResources(selectedDream.requiredResources || []);
                      setDreamInspiration(selectedDream.inspirationSources || []);
                      setActiveSection('dreams');
                      setShowCreateModal(true);
                    }}
                    className="inline-flex items-center space-x-1 px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-full text-sm font-medium transition-all duration-200 shadow-md hover:shadow-lg"
                    title="Edit Dream"
                  >
                    <Edit3 size={14} />
                    <span>Edit</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Compact Content */}
            <div className="flex-1 overflow-y-auto max-h-80">
              <div className="p-4 space-y-4">
                {/* Description */}
                {selectedDream.description && (
                  <div className="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-3">
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Description</h4>
                    <p className="text-gray-700 dark:text-gray-300 text-sm line-clamp-3">
                      {selectedDream.description}
                    </p>
                  </div>
                )}

                {/* Cute Key Details */}
                <div className="space-y-3">
                  {selectedDream.estimatedCost && (
                    <div className="flex items-center justify-between bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
                      <div className="flex items-center space-x-2">
                        <DollarSign size={16} className="text-green-600" />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Cost</span>
                      </div>
                      <span className="text-lg font-bold text-green-600">
                        ${selectedDream.estimatedCost.toLocaleString()}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                    <div className="flex items-center space-x-2">
                      <Clock size={16} className="text-blue-600" />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Timeline</span>
                    </div>
                    <span className="text-sm font-semibold text-blue-600">
                      {selectedDream.estimatedTimeframe || selectedDream.priority.replace('-', ' ')}
                    </span>
                  </div>

                  <div className="flex items-center justify-between bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3">
                    <div className="flex items-center space-x-2">
                      <Flag size={16} className="text-purple-600" />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Priority</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className={`w-3 h-3 rounded-full ${
                        selectedDream.priority === 'someday' ? 'bg-gray-400' :
                        selectedDream.priority === 'within-5-years' ? 'bg-yellow-400' :
                        selectedDream.priority === 'within-10-years' ? 'bg-blue-400' :
                        'bg-purple-400'
                      }`} />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">
                        {selectedDream.priority.replace('-', ' ')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Tags */}
                {selectedDream.tags && selectedDream.tags.length > 0 && (
                  <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-3">
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Tags</h4>
                    <div className="flex flex-wrap gap-1">
                      {selectedDream.tags.slice(0, 4).map((tag: string) => (
                        <span
                          key={tag}
                          className="px-2 py-1 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-800 dark:text-indigo-200 rounded-full text-xs font-medium"
                        >
                          #{tag}
                        </span>
                      ))}
                      {selectedDream.tags.length > 4 && (
                        <span className="text-xs text-gray-500">+{selectedDream.tags.length - 4}</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Cute Footer */}
            <div className="p-3 border-t border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/50 flex-shrink-0">
              <div className="flex items-center justify-center space-x-2">
                <button
                  onClick={() => moveItemToSection(selectedDream, 'goals')}
                  className="flex items-center space-x-1 px-3 py-2 text-green-600 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 dark:bg-green-900/20 dark:border-green-800 transition-all duration-200 text-sm font-medium"
                >
                  <Target size={14} />
                  <span>To Goal</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Goal Detail Modal */}
      {showGoalModal && selectedGoal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowGoalModal(false);
            }
          }}
        >
          <div 
            className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col relative transform transition-all duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header with Progress */}
            <div className="relative">
              <div 
                className="h-32 w-full bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 relative"
                style={{
                  background: `linear-gradient(135deg, ${GOAL_CATEGORIES.find(c => c.id === selectedGoal.category)?.color || '#8B5CF6'}60, ${GOAL_CATEGORIES.find(c => c.id === selectedGoal.category)?.color || '#8B5CF6'}90)`
                }}
              >
                {/* Close Button */}
                <button
                  onClick={() => setShowGoalModal(false)}
                  className="absolute top-3 right-3 w-8 h-8 bg-white bg-opacity-90 hover:bg-opacity-100 rounded-full flex items-center justify-center shadow-md transition-all duration-200 z-20 hover:scale-110"
                  title="Close"
                >
                  <X size={16} className="text-gray-600" />
                </button>
                
                {/* Category Icon */}
                <div className="absolute bottom-3 left-4">
                  <div 
                    className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg"
                    style={{ backgroundColor: GOAL_CATEGORIES.find(c => c.id === selectedGoal.category)?.color }}
                  >
                    {(() => {
                      const category = GOAL_CATEGORIES.find(c => c.id === selectedGoal.category);
                      const Icon = category?.icon || Target;
                      return <Icon className="w-6 h-6 text-white" />;
                    })()}
                  </div>
                </div>

                {/* Difficulty Badge */}
                <div className="absolute top-3 left-4 flex items-center space-x-2">
                  <div className="flex items-center space-x-1 px-2 py-1 bg-white bg-opacity-90 rounded-full text-xs font-medium">
                    <span>{DIFFICULTY_CONFIG[selectedGoal.difficulty].icon}</span>
                    <span className="capitalize">{selectedGoal.difficulty}</span>
                    <span className="text-green-600">+{selectedGoal.xpReward} XP</span>
                  </div>
                  
                  {/* Streak Badge */}
                  {selectedGoal.streakEnabled && (
                    <div className="flex items-center space-x-1 px-2 py-1 bg-orange-500 bg-opacity-90 rounded-full text-xs font-medium text-white">
                      <span>🔥</span>
                      <span>{selectedGoal.currentStreak || 0}</span>
                      <span>{(selectedGoal.streakFrequency || 'daily') === 'daily' ? 'd' : (selectedGoal.streakFrequency || 'daily') === 'weekly' ? 'w' : 'm'}</span>
                      {selectedGoal.streakTarget && (
                        <>
                          <span>/</span>
                          <span>{selectedGoal.streakTarget}</span>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Goal Info */}
              <div className="p-6 pb-4">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                      {selectedGoal.title}
                    </h2>
                    <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                      <span className="flex items-center space-x-1">
                        <Calendar size={14} />
                        <span>Due {format(selectedGoal.targetDate, 'MMM d, yyyy')}</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <Clock size={14} />
                        <span>{getDaysUntilDeadline(selectedGoal.targetDate)} days left</span>
                      </span>
                    </div>
                  </div>
                  
                  <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                    selectedGoal.status === 'completed' 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                      : selectedGoal.status === 'in-progress'
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                      : selectedGoal.status === 'paused'
                      ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                  }`}>
                    {selectedGoal.status.replace('-', ' ')}
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Progress</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{selectedGoal.progress}%</span>
                  </div>
                  <div className="w-full h-3 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div 
                      className="h-3 rounded-full transition-all duration-500"
                      style={{ 
                        width: `${selectedGoal.progress}%`,
                        backgroundColor: getProgressColor(selectedGoal.progress)
                      }}
                    />
                  </div>
                </div>

                {/* Value Progress */}
                {selectedGoal.targetValue && (
                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-700 rounded-lg mb-4">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Target</span>
                    <span className="font-medium">
                      {selectedGoal.currentValue || 0} / {selectedGoal.targetValue} {selectedGoal.unit}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 pb-4">
              {/* Description */}
              {selectedGoal.description && (
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Description</h4>
                  <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                    {selectedGoal.description}
                  </p>
                </div>
              )}

              {/* Milestones */}
              {selectedGoal.milestones && selectedGoal.milestones.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Milestones</h4>
                  <div className="space-y-2">
                    {selectedGoal.milestones.map((milestone) => (
                      <div key={milestone.id} className="flex items-center space-x-3 p-2 bg-gray-50 dark:bg-slate-700 rounded-lg">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                          milestone.isCompleted 
                            ? 'bg-green-500 text-white' 
                            : 'bg-gray-300 dark:bg-gray-600'
                        }`}>
                          {milestone.isCompleted && <CheckCircle2 size={12} />}
                        </div>
                        <div className="flex-1">
                          <div className={`text-sm font-medium ${
                            milestone.isCompleted 
                              ? 'line-through text-gray-500' 
                              : 'text-gray-900 dark:text-white'
                          }`}>
                            {milestone.title}
                          </div>
                          {milestone.description && (
                            <div className="text-xs text-gray-600 dark:text-gray-400">
                              {milestone.description}
                            </div>
                          )}
                        </div>
                        <div className="text-xs text-green-600 font-medium">
                          +{milestone.xpReward} XP
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Sub-Goals */}
              {selectedGoal.subGoals && selectedGoal.subGoals.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Sub-Goals</h4>
                  <div className="space-y-2">
                    {selectedGoal.subGoals.map((subGoal) => (
                      <div key={subGoal.id} className="flex items-center space-x-3 p-2 bg-gray-50 dark:bg-slate-700 rounded-lg">
                        <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                          subGoal.isCompleted 
                            ? 'bg-green-500 border-green-500 text-white' 
                            : 'border-gray-300 dark:border-gray-600'
                        }`}>
                          {subGoal.isCompleted && <CheckCircle2 size={10} />}
                        </div>
                        <span className={`text-sm ${
                          subGoal.isCompleted 
                            ? 'line-through text-gray-500' 
                            : 'text-gray-900 dark:text-white'
                        }`}>
                          {subGoal.title}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Streak Section */}
              {selectedGoal.streakEnabled && (
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Streak Progress</h4>
                  <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <span className="text-xl">🔥</span>
                        <div>
                          <div className="text-lg font-bold text-orange-600">
                            {selectedGoal.currentStreak || 0} {(selectedGoal.streakFrequency || 'daily') === 'daily' ? 'Days' : (selectedGoal.streakFrequency || 'daily') === 'weekly' ? 'Weeks' : 'Months'}
                          </div>
                          <div className="text-xs text-gray-600 dark:text-gray-400">
                            Current Streak
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-lg font-bold text-gray-600 dark:text-gray-400">
                          {selectedGoal.longestStreak || 0}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                          Best Streak
                        </div>
                      </div>
                    </div>
                    
                    {selectedGoal.streakTarget && (
                      <div className="mb-3">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span>Progress to Target</span>
                          <span>{selectedGoal.currentStreak || 0}/{selectedGoal.streakTarget}</span>
                        </div>
                        <div className="w-full h-2 bg-orange-200 dark:bg-orange-800 rounded-full">
                          <div 
                            className="h-2 bg-orange-500 rounded-full transition-all duration-300"
                            style={{ width: `${Math.min(100, ((selectedGoal.currentStreak || 0) / selectedGoal.streakTarget) * 100)}%` }}
                          />
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const streakStatus = getGoalStreakStatus(selectedGoal.id);
                          updateGoalStreak(selectedGoal.id, !streakStatus.isActiveToday);
                        }}
                        className={`flex items-center space-x-1 px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                          getGoalStreakStatus(selectedGoal.id).isActiveToday
                            ? 'bg-orange-500 text-white hover:bg-orange-600'
                            : 'bg-white text-orange-600 border border-orange-300 hover:bg-orange-50'
                        }`}
                      >
                        <Flame size={14} />
                        <span>
                          {getGoalStreakStatus(selectedGoal.id).isActiveToday ? 'Completed Today' : 'Mark Complete Today'}
                        </span>
                      </button>
                      
                      <div className="text-xs text-gray-500">
                        Frequency: {(selectedGoal.streakFrequency || 'daily').charAt(0).toUpperCase() + (selectedGoal.streakFrequency || 'daily').slice(1)}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tags */}
              {selectedGoal.tags && selectedGoal.tags.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Tags</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedGoal.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-md text-xs font-medium"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes */}
              {selectedGoal.notes && (
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Notes</h4>
                  <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
                    {selectedGoal.notes}
                  </p>
                </div>
              )}

              {/* Attachments */}
              {selectedGoal.attachments && selectedGoal.attachments.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Attachments</h4>
                  <div className="space-y-2">
                    {selectedGoal.attachments.map((attachment) => (
                      <div key={attachment.id} className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-slate-700 rounded-lg">
                        <div className="flex-shrink-0">
                          {attachment.type === 'image' ? (
                            <ImageIcon size={20} className="text-blue-500" />
                          ) : attachment.type === 'link' ? (
                            <Link size={20} className="text-green-500" />
                          ) : (
                            <Download size={20} className="text-gray-500" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {attachment.name}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {attachment.type === 'link' ? 'Link' : 
                             attachment.size ? `${(attachment.size / 1024).toFixed(1)} KB` : 'File'}
                          </div>
                        </div>
                        {attachment.type === 'image' && (
                          <div className="flex-shrink-0">
                            <img 
                              src={attachment.url} 
                              alt={attachment.name}
                              className="w-12 h-12 object-cover rounded-md cursor-pointer"
                              onClick={() => window.open(attachment.url, '_blank')}
                            />
                          </div>
                        )}
                        {attachment.type === 'link' && (
                          <button
                            onClick={() => window.open(attachment.url, '_blank')}
                            className="text-blue-500 hover:text-blue-700 p-1"
                            title="Open Link"
                          >
                            <Share2 size={16} />
                          </button>
                        )}
                        {attachment.type === 'file' && (
                          <button
                            onClick={() => {
                              const link = document.createElement('a');
                              link.href = attachment.url;
                              link.download = attachment.name;
                              link.click();
                            }}
                            className="text-gray-500 hover:text-gray-700 p-1"
                            title="Download File"
                          >
                            <Download size={16} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="p-4 border-t border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/50 flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => {
                      setShowGoalModal(false);
                      setEditingExistingGoal(selectedGoal);
                      setFormData({
                        title: selectedGoal.title,
                        description: selectedGoal.description,
                        category: selectedGoal.category,
                        priority: selectedGoal.priority,
                        difficulty: selectedGoal.difficulty,
                        status: selectedGoal.status,
                        targetValue: selectedGoal.targetValue || 0,
                        currentValue: selectedGoal.currentValue || 0,
                        unit: selectedGoal.unit || '',
                        targetDate: format(selectedGoal.targetDate, 'yyyy-MM-dd'),
                        tags: selectedGoal.tags || [],
                        isPublic: selectedGoal.isPublic || false,
                        notes: selectedGoal.notes || '',
                        streakEnabled: selectedGoal.streakEnabled || false,
                        streakFrequency: selectedGoal.streakFrequency || 'daily',
                        streakTarget: selectedGoal.streakTarget
                      });
                      setMilestones(selectedGoal.milestones || []);
                      setSubGoals(selectedGoal.subGoals || []);
                      setAttachments(selectedGoal.attachments || []);
                      setActiveSection('goals');
                      setShowCreateModal(true);
                    }}
                    className="flex items-center space-x-1 px-3 py-2 text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 dark:bg-blue-900/20 dark:border-blue-800 transition-all duration-200 text-sm font-medium"
                  >
                    <Edit3 size={14} />
                    <span>Edit</span>
                  </button>
                  
                  <button
                    onClick={() => moveItemToSection(selectedGoal, 'dreams')}
                    className="flex items-center space-x-1 px-3 py-2 text-purple-600 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 dark:bg-purple-900/20 dark:border-purple-800 transition-all duration-200 text-sm font-medium"
                  >
                    <Star size={14} />
                    <span>To Dream</span>
                  </button>
                </div>

                <button
                  onClick={() => handleDeleteGoal(selectedGoal.id)}
                  className="flex items-center space-x-1 px-3 py-2 text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 dark:bg-red-900/20 dark:border-red-800 transition-all duration-200 text-sm font-medium"
                >
                  <Trash2 size={14} />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Goal Stacking Modal */}
      {showStackingModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowStackingModal(false)}
        >
          <div 
            className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-6 border-b border-gray-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Goal Sequences</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Create sequences where goals unlock after completing previous ones
                  </p>
                </div>
                <button
                  onClick={() => setShowStackingModal(false)}
                  className="p-2 text-gray-700 hover:text-black dark:text-gray-200 dark:hover:text-white rounded-md hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Current Stack */}
              {stackedGoals.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-md font-medium text-gray-900 dark:text-white mb-3">Current Sequence</h4>
                  <div className="space-y-3">
                    {stackedGoals.map((goalId, index) => {
                      const goal = goals.find(g => g.id === goalId);
                      if (!goal) return null;
                      
                      const isCurrentlyLocked = isGoalLocked(goalId);
                      const category = GOAL_CATEGORIES.find(c => c.id === goal.category);
                      
                      return (
                        <div 
                          key={goalId}
                          className={`flex items-center space-x-4 p-4 rounded-lg border ${
                            isCurrentlyLocked 
                              ? 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 opacity-60' 
                              : 'bg-white dark:bg-slate-700 border-gray-200 dark:border-slate-600'
                          }`}
                        >
                          {/* Position */}
                          <div className="flex items-center space-x-3">
                            <div className="bg-purple-500 text-white text-sm rounded-full w-6 h-6 flex items-center justify-center font-bold">
                              {index + 1}
                            </div>
                            {isCurrentlyLocked && <Lock size={16} className="text-gray-400" />}
                          </div>
                          
                          {/* Goal Info */}
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <div 
                                className="w-4 h-4 rounded-full flex items-center justify-center"
                                style={{ backgroundColor: category?.color }}
                              >
                                {(() => {
                                  const Icon = category?.icon || Target;
                                  return <Icon className="w-2 h-2 text-white" />;
                                })()}
                              </div>
                              <h5 className="font-medium text-gray-900 dark:text-white">{goal.title}</h5>
                              <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                                goal.status === 'completed' 
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                                  : goal.status === 'in-progress'
                                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                                  : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                              }`}>
                                {goal.status.replace('-', ' ')}
                              </div>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{goal.description}</p>
                          </div>
                          
                          {/* Actions */}
                          <div className="flex items-center space-x-2">
                            {index > 0 && (
                              <button
                                onClick={() => {
                                  const newStack = [...stackedGoals];
                                  [newStack[index], newStack[index - 1]] = [newStack[index - 1], newStack[index]];
                                  reorderStackedGoals(newStack);
                                }}
                                className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                                title="Move Up"
                              >
                                <ArrowUp size={16} />
                              </button>
                            )}
                            {index < stackedGoals.length - 1 && (
                              <button
                                onClick={() => {
                                  const newStack = [...stackedGoals];
                                  [newStack[index], newStack[index + 1]] = [newStack[index + 1], newStack[index]];
                                  reorderStackedGoals(newStack);
                                }}
                                className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                                title="Move Down"
                              >
                                <ArrowDown size={16} />
                              </button>
                            )}
                            <button
                              onClick={() => removeGoalFromStack(goalId)}
                              className="p-1 text-red-500 hover:text-red-700"
                              title="Remove from Sequence"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Available Goals */}
              <div>
                <h4 className="text-md font-medium text-gray-900 dark:text-white mb-3">Available Goals</h4>
                <div className="grid grid-cols-1 gap-3">
                  {goals
                    .filter(goal => !stackedGoals.includes(goal.id) && goal.status !== 'completed')
                    .map(goal => {
                      const category = GOAL_CATEGORIES.find(c => c.id === goal.category);
                      return (
                        <div 
                          key={goal.id}
                          className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-700 rounded-lg"
                        >
                          <div className="flex items-center space-x-3">
                            <div 
                              className="w-4 h-4 rounded-full flex items-center justify-center"
                              style={{ backgroundColor: category?.color }}
                            >
                              {(() => {
                                const Icon = category?.icon || Target;
                                return <Icon className="w-2 h-2 text-white" />;
                              })()}
                            </div>
                            <div>
                              <h5 className="font-medium text-gray-900 dark:text-white">{goal.title}</h5>
                              <p className="text-sm text-gray-600 dark:text-gray-400">{goal.description}</p>
                            </div>
                          </div>
                          <button
                            onClick={() => addGoalToStack(goal.id)}
                            className="flex items-center space-x-1 px-3 py-1 bg-purple-500 hover:bg-purple-600 text-white rounded-md text-sm transition-colors"
                          >
                            <Plus size={14} />
                            <span>Add to Sequence</span>
                          </button>
                        </div>
                      );
                    })}
                </div>
                
                {goals.filter(goal => !stackedGoals.includes(goal.id) && goal.status !== 'completed').length === 0 && (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <Target className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No available goals to add to sequence</p>
                    <p className="text-sm">Create some goals first or complete stacked goals to free them up</p>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/50">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  💡 Tip: Goals will unlock automatically when the previous goal is completed
                </div>
                <button
                  onClick={() => setShowStackingModal(false)}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md text-sm font-medium transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Progress Update Modal */}
      {showProgressModal && progressGoal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowProgressModal(false)}
        >
          <div 
            className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-6 border-b border-gray-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Update Progress</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {progressGoal.title}
                  </p>
                </div>
                <button
                  onClick={() => setShowProgressModal(false)}
                  className="p-2 text-gray-700 hover:text-black dark:text-gray-200 dark:hover:text-white rounded-md hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              {/* Current Progress */}
              <div className="bg-gray-50 dark:bg-slate-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Current Progress</span>
                  <span className="text-lg font-bold text-purple-600">{progressGoal.progress}%</span>
                </div>
                <div className="w-full h-2 bg-gray-200 dark:bg-slate-600 rounded-full">
                  <div 
                    className="h-2 bg-purple-600 rounded-full transition-all duration-300"
                    style={{ width: `${progressGoal.progress}%` }}
                  />
                </div>
              </div>

              {/* Progress Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  New Progress (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={progressInput}
                  onChange={(e) => setProgressInput(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-slate-700 dark:text-white"
                  placeholder="Enter progress percentage"
                />
              </div>

              {/* Current Value Input - Only show if goal has target value */}
              {progressGoal.targetValue && progressGoal.targetValue > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Current Value
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      value={currentValueInput}
                      onChange={(e) => setCurrentValueInput(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-slate-700 dark:text-white"
                      placeholder="Enter current value"
                    />
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      / {progressGoal.targetValue} {progressGoal.unit}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      if (progressGoal.targetValue && parseFloat(currentValueInput) > 0) {
                        const calculatedProgress = Math.min(100, (parseFloat(currentValueInput) / progressGoal.targetValue) * 100);
                        setProgressInput(calculatedProgress.toFixed(1));
                      }
                    }}
                    className="mt-2 text-sm text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300"
                  >
                    Calculate progress from value
                  </button>
                </div>
              )}

              {/* Quick Progress Buttons */}
              <div>
                <span className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Quick Update
                </span>
                <div className="grid grid-cols-4 gap-2">
                  {[25, 50, 75, 100].map(percent => (
                    <button
                      key={percent}
                      onClick={() => setProgressInput(percent.toString())}
                      className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                        progressInput === percent.toString()
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'
                      }`}
                    >
                      {percent}%
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/50 flex items-center justify-between">
              <button
                onClick={() => setShowProgressModal(false)}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveProgressUpdate}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
              >
                Update Progress
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}