import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { apiClient } from '../services/apiClient';
import type { TaskData, ProjectData, HabitData, FinancialTransactionData, ShoppingListData, FocusSessionData, RecipeData } from '../services/apiClient';
import type { 
  TodoItem,
  Project, 
  Habit,
  FinancialRecord, 
  Budget,
  CalendarEvent,
  Calendar,
  FocusSession,
  MoodEntry,
  Goal,
  Milestone,
  Achievement,
  UserStats,
  Dream,
  DreamVisual,
  StreakEntry,
  RelationshipGoal,
  BucketListItem,
  LoveLanguage,
  ConflictResolution,
  SharedItem,
  GiftIdea,
  RecurringPattern,
  PeriodCycle,
  PeriodSettings,
  PeriodPrediction,
  PeriodInsights,
  HealthSyncStatus,
  NationalPark,
  TravelTrip,
  TravelItineraryItem,
  CreditCardTrip,
  PTOEntry,
  Country,
  USState,
  IndiaState,
  Note,
  HabitCategory,
  TodoCategory,
  JournalEntry,
  ShoppingItem,
  Recipe,
  SeventyFiveHardChallenge,
  SeventyFiveHardEntry
} from '../types';

interface RealAppState {
  // Loading states
  loading: boolean;
  tasksLoading: boolean;
  projectsLoading: boolean;
  habitsLoading: boolean;
  financialLoading: boolean;
  
  // Data from database
  tasks: TodoItem[];
  projects: Project[];
  habits: Habit[];
  financialRecords: FinancialRecord[];
  focusSessions: FocusSession[];
  shoppingLists: ShoppingListData[];
  recipes: Recipe[];
  
  // Local-only data (not yet in database)
  notes: Note[];
  journalEntries: JournalEntry[];
  goals: Goal[];
  dreams: Dream[];
  moodEntries: MoodEntry[];
  relationshipGoals: RelationshipGoal[];
  bucketList: BucketListItem[];
  loveLanguages: LoveLanguage;
  conflictResolutions: ConflictResolution[];
  sharedItems: SharedItem[];
  giftIdeas: GiftIdea[];
  seventyFiveHardChallenges: SeventyFiveHardChallenge[];
  
  // Categories
  habitCategories: HabitCategory[];
  todoCategories: TodoCategory[];
  
  // Achievement system
  userStats: UserStats;
  achievements: Achievement[];
  stackedGoals: string[];
  
  // Travel data
  nationalParks: NationalPark[];
  travelTrips: TravelTrip[];
  creditCardTrips: CreditCardTrip[];
  ptoEntries: PTOEntry[];
  countries: Country[];
  usStates: USState[];
  indiaStates: IndiaState[];
  
  // Period tracking
  periodCycles: PeriodCycle[];
  periodSettings: PeriodSettings;
  periodPredictions: PeriodPrediction[];
  periodInsights: PeriodInsights | null;
  healthSyncStatus: HealthSyncStatus | null;
  
  // Calendar
  calendars: Calendar[];
  calendarEvents: CalendarEvent[];
  
  // Shopping
  shoppingItems: ShoppingItem[];
  budgets: Budget[];
  activeFocusSession: FocusSession | null;
  
  // UI State
  activeView: 'dashboard' | 'habits' | 'notes' | 'todos' | 'projects' | 'journal' | 'personal' | 'calendar' | 'focus' | 'mood' | 'goals' | 'shared' | 'period' | 'shopping' | 'meals' | 'travel' | 'finances' | 'seventy-five-hard';
  setActiveView: (view: RealAppState['activeView']) => void;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;

  // ==================== API ACTIONS ====================
  
  // Initialize data from database
  initializeData: () => Promise<void>;
  
  // Task operations
  loadTasks: () => Promise<void>;
  addTodo: (todo: Omit<TodoItem, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateTodo: (id: string, updates: Partial<TodoItem>) => Promise<void>;
  deleteTodo: (id: string) => Promise<void>;
  toggleTodo: (id: string) => Promise<void>;
  
  // Project operations
  loadProjects: () => Promise<void>;
  addProject: (project: Omit<Project, 'id' | 'createdAt' | 'progress'>) => Promise<void>;
  updateProject: (id: string, updates: Partial<Project>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  
  // Habit operations
  loadHabits: () => Promise<void>;
  addHabit: (habit: Omit<Habit, 'id' | 'createdAt' | 'completions'>) => Promise<void>;
  updateHabit: (habitId: string, updates: Partial<Habit>) => Promise<void>;
  deleteHabit: (habitId: string) => Promise<void>;
  completeHabit: (habitId: string, notes?: string) => Promise<void>;
  
  // Financial operations
  loadFinancialData: () => Promise<void>;
  addFinancialRecord: (record: Omit<FinancialRecord, 'id'>) => Promise<void>;
  
  // Focus session operations
  loadFocusSessions: () => Promise<void>;
  startFocusSession: (session: Omit<FocusSession, 'id' | 'startTime'>) => Promise<void>;
  completeFocusSession: (notes?: string, interruptions?: number) => Promise<void>;
  
  // Shopping operations
  loadShoppingData: () => Promise<void>;
  
  // Recipe operations
  loadRecipes: () => Promise<void>;
  addRecipe: (recipe: Omit<Recipe, 'id' | 'createdAt'>) => Promise<void>;
  
  // Local operations (for data not yet in database)
  addNote: (note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateNote: (id: string, updates: Partial<Note>) => void;
  deleteNote: (id: string) => void;
  addJournalEntry: (entry: Omit<JournalEntry, 'id' | 'createdAt'>) => void;
  updateJournalEntry: (id: string, updates: Partial<JournalEntry>) => void;
  deleteJournalEntry: (id: string) => void;
  
  // 75 Hard Challenge operations
  addSeventyFiveHardChallenge: (challenge: SeventyFiveHardChallenge) => void;
  updateSeventyFiveHardChallenge: (id: string, updates: Partial<SeventyFiveHardChallenge>) => void;
  deleteSeventyFiveHardChallenge: (id: string) => void;
  addSeventyFiveHardEntry: (entry: SeventyFiveHardEntry) => void;
  updateSeventyFiveHardEntry: (id: string, updates: Partial<SeventyFiveHardEntry>) => void;
}

const generateId = () => Math.random().toString(36).substr(2, 9);

// Map database data to application types
const mapTaskToTodoItem = (task: TaskData): TodoItem => ({
  id: task.id || '',
  title: task.title,
  description: task.description || '',
  status: (task.status as TodoItem['status']) || 'need-to-start',
  priority: (task.priority as TodoItem['priority']) || 'medium',
  categoryId: 'personal',
  tags: task.tags || [],
  createdAt: new Date(task.created_at || Date.now()),
  updatedAt: new Date(task.updated_at || Date.now()),
  completed: task.status === 'done',
  estimatedTime: task.estimated_time,
  dueDate: task.due_date ? new Date(task.due_date) : undefined,
  notes: task.notes,
  starred: task.starred || false,
  archived: task.archived || false,
  projectId: task.project_id
});

const mapProjectToProject = (project: ProjectData): Project => ({
  id: project.id || '',
  name: project.name,
  description: project.description || '',
  color: project.color || '#6366f1',
  icon: project.icon || '📁',
  status: (project.status as Project['status']) || 'active',
  createdAt: new Date(project.created_at || Date.now()),
  todos: [],
  progress: 0
});

const mapHabitToHabit = (habit: HabitData): Habit => ({
  id: habit.id || '',
  name: habit.name,
  description: habit.description || '',
  categoryId: habit.category || 'general',
  frequency: (habit.frequency as Habit['frequency']) || 'daily',
  targetCount: habit.target_value || 1,
  goalMode: habit.goal_mode || 'daily-target',
  goalTarget: habit.goal_target,
  goalUnit: habit.goal_unit,
  currentProgress: habit.current_progress || 0,
  color: habit.color || '#10b981',
  streak: habit.streak_count || 0,
  reminder: habit.reminder_enabled ? {
    enabled: habit.reminder_enabled,
    time: habit.reminder_time || '09:00',
    days: [1, 2, 3, 4, 5, 6, 7],
    title: `${habit.name} reminder`
  } : undefined,
  createdAt: new Date(habit.created_at || Date.now()),
  completions: []
});

export const useRealAppStore = create<RealAppState>()(
  persist(
    (set, get) => ({
      // Initial loading states
      loading: false,
      tasksLoading: false,
      projectsLoading: false,
      habitsLoading: false,
      financialLoading: false,
      
      // Initial data
      tasks: [],
      projects: [],
      habits: [],
      financialRecords: [],
      focusSessions: [],
      shoppingLists: [],
      recipes: [],
      
      // Local-only data with defaults
      notes: [],
      journalEntries: [],
      goals: [],
      dreams: [],
      moodEntries: [],
      relationshipGoals: [],
      bucketList: [],
      loveLanguages: {
        primary: 'quality-time',
        preferences: {
          'quality-time': ['One-on-one conversations', 'Shared activities', 'Undivided attention'],
          'words-of-affirmation': ['Verbal appreciation', 'Written notes', 'Public recognition'],
          'acts-of-service': ['Help with tasks', 'Thoughtful gestures', 'Taking care of responsibilities'],
          'receiving-gifts': ['Thoughtful presents', 'Surprise gifts', 'Meaningful tokens'],
          'physical-touch': ['Hugs', 'Hand-holding', 'Affectionate gestures']
        },
        reminders: {
          frequency: 'weekly',
          suggestions: []
        }
      },
      conflictResolutions: [],
      sharedItems: [],
      giftIdeas: [],
      seventyFiveHardChallenges: [],
      
      // Categories
      habitCategories: [
        {
          id: 'general',
          name: 'General',
          description: 'General habits and activities',
          color: '#6b7280',
          icon: '🎯',
          habits: [],
          collapsed: false,
          createdAt: new Date()
        },
        {
          id: 'supplements',
          name: 'Supplements',
          description: 'Daily and weekly vitamin supplements',
          color: '#22c55e',
          icon: '💊',
          habits: [],
          collapsed: false,
          createdAt: new Date()
        },
        {
          id: 'workouts',
          name: 'Workouts',
          description: 'Physical exercise and fitness routines',
          color: '#f59e0b',
          icon: '💪',
          habits: [],
          collapsed: false,
          createdAt: new Date()
        },
        {
          id: 'reading',
          name: 'Reading',
          description: 'Books, articles, and learning materials',
          color: '#3b82f6',
          icon: '📚',
          habits: [],
          collapsed: false,
          createdAt: new Date()
        }
      ],
      todoCategories: [
        {
          id: 'personal',
          name: 'Personal',
          description: 'Personal tasks and activities',
          color: '#3b82f6',
          icon: '👤',
          todos: [],
          createdAt: new Date()
        },
        {
          id: 'work',
          name: 'Work',
          description: 'Professional and career tasks',
          color: '#f59e0b',
          icon: '💼',
          todos: [],
          createdAt: new Date()
        }
      ],
      
      // Achievement system
      userStats: {
        level: 1,
        xp: 0,
        xpToNextLevel: 1000,
        totalGoalsCompleted: 0,
        totalDreamsCompleted: 0,
        currentStreak: 0,
        longestStreak: 0,
        achievements: [],
        totalXpEarned: 0
      },
      achievements: [],
      stackedGoals: [],
      
      // Travel data (keep existing mock data)
      nationalParks: [],
      travelTrips: [],
      creditCardTrips: [],
      ptoEntries: [],
      countries: [],
      usStates: [],
      indiaStates: [],
      
      // Period tracking
      periodCycles: [],
      periodSettings: {
        trackingEnabled: false,
        appleHealthSyncEnabled: false,
        googleFitSyncEnabled: false,
        notificationsEnabled: true,
        reminderDays: 2,
        averageCycleLength: 28,
        averagePeriodLength: 5,
        privacyMode: false
      },
      periodPredictions: [],
      periodInsights: null,
      healthSyncStatus: null,
      
      // Calendar
      calendars: [
        {
          id: 'default',
          name: 'Personal Calendar',
          description: 'Default personal calendar',
          color: '#3b82f6',
          source: 'internal',
          syncEnabled: false,
          isDefault: true
        }
      ],
      calendarEvents: [],
      shoppingItems: [],
      budgets: [],
      activeFocusSession: null,
      
      // UI State
      activeView: 'dashboard',
      sidebarCollapsed: false,

      // UI Actions
      setActiveView: (view) => set({ activeView: view }),
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),

      // ==================== API ACTIONS ====================

      // Initialize all data from database
      initializeData: async () => {
        set({ loading: true });
        
        // Set a timeout to prevent infinite loading
        const timeoutId = setTimeout(() => {
          console.log('⏰ Database initialization timeout - continuing with empty state');
          set({ loading: false });
        }, 5000); // 5 second timeout
        
        try {
          // Try to initialize from database, but continue with empty state if it fails
          const results = await Promise.allSettled([
            get().loadTasks(),
            get().loadProjects(),
            get().loadHabits(),
            get().loadFinancialData(),
            get().loadFocusSessions(),
            get().loadShoppingData(),
            get().loadRecipes()
          ]);
          
          const failed = results.filter(r => r.status === 'rejected').length;
          const succeeded = results.filter(r => r.status === 'fulfilled').length;
          
          console.log(`✅ Database initialization completed: ${succeeded} succeeded, ${failed} failed`);
          if (failed > 0) {
            console.log('🔄 Some endpoints failed - app will work with available data');
          }
        } catch (error) {
          console.error('❌ Error initializing data:', error);
          console.log('🔄 Continuing with empty state - database integration will work once backend is fully connected');
        } finally {
          clearTimeout(timeoutId);
          set({ loading: false });
        }
      },

      // Task operations
      loadTasks: async () => {
        set({ tasksLoading: true });
        try {
          const tasks = await apiClient.getTasks();
          const mappedTasks = tasks.map(mapTaskToTodoItem);
          set({ tasks: mappedTasks });
        } catch (error) {
          console.error('Error loading tasks:', error);
        } finally {
          set({ tasksLoading: false });
        }
      },

      addTodo: async (todo) => {
        try {
          const taskData: Omit<TaskData, 'id' | 'created_at' | 'updated_at'> = {
            title: todo.title,
            description: todo.description,
            status: todo.status === 'need-to-start' ? 'todo' : todo.status as any,
            priority: todo.priority as any,
            estimated_time: todo.estimatedTime,
            due_date: todo.dueDate?.toISOString(),
            tags: todo.tags,
            category: 'other',
            notes: todo.notes,
            starred: todo.starred,
            archived: todo.archived,
            project_id: todo.projectId
          };
          
          const newTask = await apiClient.createTask(taskData);
          const mappedTask = mapTaskToTodoItem(newTask);
          set((state) => ({ tasks: [...state.tasks, mappedTask] }));
        } catch (error) {
          console.error('Error adding task:', error);
        }
      },

      updateTodo: async (id, updates) => {
        try {
          const taskUpdates: Partial<TaskData> = {
            title: updates.title,
            description: updates.description,
            status: updates.status === 'need-to-start' ? 'todo' : updates.status as any,
            priority: updates.priority as any,
            estimated_time: updates.estimatedTime,
            due_date: updates.dueDate?.toISOString(),
            tags: updates.tags,
            notes: updates.notes,
            starred: updates.starred,
            archived: updates.archived,
            project_id: updates.projectId
          };
          
          const updatedTask = await apiClient.updateTask(id, taskUpdates);
          const mappedTask = mapTaskToTodoItem(updatedTask);
          set((state) => ({
            tasks: state.tasks.map(task => task.id === id ? mappedTask : task)
          }));
        } catch (error) {
          console.error('Error updating task:', error);
        }
      },

      deleteTodo: async (id) => {
        try {
          await apiClient.deleteTask(id);
          set((state) => ({
            tasks: state.tasks.filter(task => task.id !== id)
          }));
        } catch (error) {
          console.error('Error deleting task:', error);
        }
      },

      toggleTodo: async (id) => {
        const task = get().tasks.find(t => t.id === id);
        if (task) {
          await get().updateTodo(id, {
            completed: !task.completed,
            status: !task.completed ? 'done' : 'need-to-start',
            completedAt: !task.completed ? new Date() : undefined
          });
        }
      },

      // Project operations
      loadProjects: async () => {
        set({ projectsLoading: true });
        try {
          const projects = await apiClient.getProjects();
          const mappedProjects = projects.map(mapProjectToProject);
          set({ projects: mappedProjects });
        } catch (error) {
          console.error('Error loading projects:', error);
        } finally {
          set({ projectsLoading: false });
        }
      },

      addProject: async (project) => {
        try {
          const projectData: Omit<ProjectData, 'id' | 'created_at' | 'updated_at'> = {
            name: project.name,
            description: project.description,
            color: project.color,
            status: project.status as any,
            icon: project.icon
          };
          
          const newProject = await apiClient.createProject(projectData);
          const mappedProject = mapProjectToProject(newProject);
          set((state) => ({ projects: [...state.projects, mappedProject] }));
        } catch (error) {
          console.error('Error adding project:', error);
        }
      },

      updateProject: async (id, updates) => {
        try {
          const projectUpdates: Partial<ProjectData> = {
            name: updates.name,
            description: updates.description,
            color: updates.color,
            status: updates.status as any,
            icon: updates.icon
          };
          
          const updatedProject = await apiClient.updateProject(id, projectUpdates);
          const mappedProject = mapProjectToProject(updatedProject);
          set((state) => ({
            projects: state.projects.map(project => project.id === id ? mappedProject : project)
          }));
        } catch (error) {
          console.error('Error updating project:', error);
        }
      },

      deleteProject: async (id) => {
        try {
          await apiClient.deleteProject(id);
          set((state) => ({
            projects: state.projects.filter(project => project.id !== id)
          }));
        } catch (error) {
          console.error('Error deleting project:', error);
        }
      },

      // Habit operations
      loadHabits: async () => {
        set({ habitsLoading: true });
        try {
          const habits = await apiClient.getHabits();
          const mappedHabits = habits.map(mapHabitToHabit);
          set({ habits: mappedHabits });
        } catch (error) {
          console.error('Error loading habits:', error);
        } finally {
          set({ habitsLoading: false });
        }
      },

      addHabit: async (habit) => {
        try {
          const habitData: Omit<HabitData, 'id' | 'created_at' | 'updated_at'> = {
            name: habit.name,
            description: habit.description,
            category: habit.categoryId,
            frequency: habit.frequency as any,
            target_value: habit.targetCount,
            goal_mode: habit.goalMode || 'daily-target',
            goal_target: habit.goalTarget,
            goal_unit: habit.goalUnit,
            current_progress: 0,
            color: habit.color,
            reminder_time: habit.reminder?.time,
            reminder_enabled: habit.reminder?.enabled || false
          };
          
          const newHabit = await apiClient.createHabit(habitData);
          const mappedHabit = mapHabitToHabit(newHabit);
          set((state) => ({ habits: [...state.habits, mappedHabit] }));
          
          // Refresh habits from server to ensure consistency
          get().loadHabits();
        } catch (error) {
          console.error('Error adding habit:', error);
        }
      },

      completeHabit: async (habitId, notes) => {
        try {
          const habit = get().habits.find(h => h.id === habitId);
          if (!habit) return;

          // Determine completion value based on habit type
          let completionValue = 1;
          if (habit.goalMode === 'course-completion') {
            completionValue = 1; // Always increment by 1 for course goals
          } else if (habit.goalMode === 'total-goal') {
            completionValue = habit.targetCount || 1; // Use per-session count for total goals
          }

          await apiClient.addHabitEntry(habitId, {
            date: new Date().toISOString().split('T')[0],
            value: completionValue,
            notes
          });
          
          // Update local habit state
          set((state) => ({
            habits: state.habits.map(h => 
              h.id === habitId 
                ? {
                    ...h,
                    currentProgress: (h.goalMode === 'total-goal' || h.goalMode === 'course-completion') 
                      ? (h.currentProgress || 0) + completionValue
                      : h.currentProgress,
                    streak: (h.streak || 0) + 1,
                    completions: [...h.completions, {
                      id: generateId(),
                      habitId,
                      completedAt: new Date(),
                      notes
                    }]
                  }
                : h
            )
          }));
        } catch (error) {
          console.error('Error completing habit:', error);
        }
      },

      updateHabit: async (habitId, updates) => {
        try {
          // Create habit updates in API format
          const habitUpdates: Partial<HabitData> = {
            name: updates.name,
            description: updates.description,
            category: updates.categoryId,
            frequency: updates.frequency as any,
            target_value: updates.targetCount,
            goal_mode: updates.goalMode,
            goal_target: updates.goalTarget,
            goal_unit: updates.goalUnit,
            color: updates.color,
            reminder_time: updates.reminder?.time,
            reminder_enabled: updates.reminder?.enabled
          };
          
          // Update in API
          const updatedHabit = await apiClient.updateHabit(habitId, habitUpdates);
          
          // Update local state
          const mappedHabit = mapHabitToHabit(updatedHabit);
          set((state) => ({
            habits: state.habits.map(habit => 
              habit.id === habitId ? { ...habit, ...mappedHabit } : habit
            )
          }));
        } catch (error) {
          console.error('Error updating habit:', error);
        }
      },

      deleteHabit: async (habitId) => {
        try {
          await apiClient.deleteHabit(habitId);
          set((state) => ({
            habits: state.habits.filter(habit => habit.id !== habitId)
          }));
        } catch (error) {
          console.error('Error deleting habit:', error);
        }
      },

      // Financial operations
      loadFinancialData: async () => {
        set({ financialLoading: true });
        try {
          const transactions = await apiClient.getFinancialTransactions();
          // Map to FinancialRecord format
          const mappedRecords: FinancialRecord[] = transactions.map(t => ({
            id: t.id || generateId(),
            type: t.type as FinancialRecord['type'],
            amount: Number(t.amount),
            description: t.description || '',
            category: t.category_id || 'other',
            date: new Date(t.date),
            account: t.account_id || 'default',
            tags: t.tags || [],
            notes: t.notes
          }));
          set({ financialRecords: mappedRecords });
        } catch (error) {
          console.error('Error loading financial data:', error);
        } finally {
          set({ financialLoading: false });
        }
      },

      addFinancialRecord: async (record) => {
        try {
          const transactionData: Omit<FinancialTransactionData, 'id' | 'created_at' | 'updated_at'> = {
            type: record.type,
            amount: record.amount,
            description: record.description,
            payee: record.description,
            date: record.date.toISOString().split('T')[0],
            tags: record.tags
          };
          
          const newTransaction = await apiClient.createFinancialTransaction(transactionData);
          const mappedRecord: FinancialRecord = {
            id: newTransaction.id || generateId(),
            type: newTransaction.type as FinancialRecord['type'],
            amount: Number(newTransaction.amount),
            description: newTransaction.description || '',
            category: 'other',
            date: new Date(newTransaction.date),
            account: 'default',
            tags: newTransaction.tags || []
          };
          
          set((state) => ({ financialRecords: [...state.financialRecords, mappedRecord] }));
        } catch (error) {
          console.error('Error adding financial record:', error);
        }
      },

      // Focus session operations
      loadFocusSessions: async () => {
        try {
          const sessions = await apiClient.getFocusSessions();
          // Map to FocusSession format
          const mappedSessions: FocusSession[] = sessions.map(s => ({
            id: s.id || generateId(),
            todoId: s.task_id,
            type: 'pomodoro', // Default type since it's required
            duration: s.duration,
            actualDuration: s.actual_duration,
            startTime: new Date(s.start_time),
            endTime: s.end_time ? new Date(s.end_time) : undefined,
            completed: s.status === 'completed',
            interruptions: s.distractions || 0,
            notes: s.notes
          }));
          set({ focusSessions: mappedSessions });
        } catch (error) {
          console.error('Error loading focus sessions:', error);
        }
      },

      startFocusSession: async (session) => {
        try {
          const sessionData: Omit<FocusSessionData, 'id' | 'created_at' | 'updated_at'> = {
            task_id: session.todoId,
            preset: 'pomodoro', // Default preset
            duration: session.duration,
            start_time: new Date().toISOString(),
            notes: session.notes
          };
          
          const newSession = await apiClient.createFocusSession(sessionData);
          const mappedSession: FocusSession = {
            id: newSession.id || generateId(),
            todoId: newSession.task_id,
            type: 'pomodoro',
            duration: newSession.duration,
            startTime: new Date(newSession.start_time),
            completed: false,
            interruptions: 0,
            notes: newSession.notes
          };
          
          set((state) => ({
            focusSessions: [...state.focusSessions, mappedSession],
            activeFocusSession: mappedSession
          }));
        } catch (error) {
          console.error('Error starting focus session:', error);
        }
      },

      completeFocusSession: async (notes, interruptions) => {
        const activeSession = get().activeFocusSession;
        if (!activeSession) return;

        try {
          const updates = {
            end_time: new Date().toISOString(),
            status: 'completed' as const,
            actual_duration: Math.floor((new Date().getTime() - activeSession.startTime.getTime()) / 60000),
            distractions: interruptions || 0,
            notes: notes || activeSession.notes
          };
          
          await apiClient.updateFocusSession(activeSession.id, updates);
          
          set((state) => ({
            focusSessions: state.focusSessions.map(session =>
              session.id === activeSession.id
                ? {
                    ...session,
                    endTime: new Date(),
                    completed: true,
                    actualDuration: updates.actual_duration,
                    interruptions: updates.distractions,
                    notes: updates.notes
                  }
                : session
            ),
            activeFocusSession: null
          }));
        } catch (error) {
          console.error('Error completing focus session:', error);
        }
      },

      // Shopping operations
      loadShoppingData: async () => {
        try {
          const lists = await apiClient.getShoppingLists();
          set({ shoppingLists: lists });
        } catch (error) {
          console.error('Error loading shopping data:', error);
        }
      },

      // Recipe operations
      loadRecipes: async () => {
        try {
          const recipes = await apiClient.getRecipes();
          // Map to Recipe format
          const mappedRecipes: Recipe[] = recipes.map(r => ({
            id: r.id || generateId(),
            name: r.name,
            description: r.description || '',
            cuisine: r.cuisine || '',
            difficulty: (r.difficulty as Recipe['difficulty']) || 'medium',
            prepTime: r.prep_time || 0,
            cookTime: r.cook_time || 0,
            servings: r.servings || 4,
            calories: r.calories_per_serving,
            instructions: r.instructions ? [r.instructions] : [],
            ingredients: [],
            tags: r.tags || [],
            rating: 0,
            isFavorite: r.is_favorite || false,
            createdAt: new Date(r.created_at || Date.now()),
            nutritionInfo: {}
          }));
          set({ recipes: mappedRecipes });
        } catch (error) {
          console.error('Error loading recipes:', error);
        }
      },

      addRecipe: async (recipe) => {
        try {
          const recipeData: Omit<RecipeData, 'id' | 'created_at' | 'updated_at'> = {
            name: recipe.name,
            description: recipe.description,
            cuisine: recipe.cuisine,
            difficulty: recipe.difficulty as any,
            prep_time: recipe.prepTime,
            cook_time: recipe.cookTime,
            servings: recipe.servings,
            calories_per_serving: recipe.calories,
            instructions: recipe.instructions.join('\n\n'),
            tags: recipe.tags,
            is_favorite: recipe.isFavorite
          };
          
          const newRecipe = await apiClient.createRecipe(recipeData);
          const mappedRecipe: Recipe = {
            id: newRecipe.id || generateId(),
            name: newRecipe.name,
            description: newRecipe.description || '',
            cuisine: newRecipe.cuisine || '',
            difficulty: (newRecipe.difficulty as Recipe['difficulty']) || 'medium',
            prepTime: newRecipe.prep_time || 0,
            cookTime: newRecipe.cook_time || 0,
            servings: newRecipe.servings || 4,
            calories: newRecipe.calories_per_serving,
            instructions: newRecipe.instructions ? newRecipe.instructions.split('\n\n') : [],
            ingredients: [],
            tags: newRecipe.tags || [],
            rating: 0,
            isFavorite: newRecipe.is_favorite || false,
            createdAt: new Date(),
            nutritionInfo: {}
          };
          
          set((state) => ({ recipes: [...state.recipes, mappedRecipe] }));
        } catch (error) {
          console.error('Error adding recipe:', error);
        }
      },

      // Local-only operations (for data not yet in database)
      addNote: (note) => set((state) => ({
        notes: [...state.notes, {
          ...note,
          id: generateId(),
          createdAt: new Date(),
          updatedAt: new Date()
        }]
      })),

      updateNote: (id, updates) => set((state) => ({
        notes: state.notes.map(note => 
          note.id === id 
            ? { ...note, ...updates, updatedAt: new Date() } 
            : note
        )
      })),

      deleteNote: (id) => set((state) => ({
        notes: state.notes.filter(note => note.id !== id)
      })),

      addJournalEntry: (entry) => set((state) => ({
        journalEntries: [...state.journalEntries, {
          ...entry,
          id: generateId(),
          createdAt: new Date()
        }]
      })),

      updateJournalEntry: (id, updates) => set((state) => ({
        journalEntries: state.journalEntries.map(entry => 
          entry.id === id ? { ...entry, ...updates } : entry
        )
      })),

      deleteJournalEntry: (id) => set((state) => ({
        journalEntries: state.journalEntries.filter(entry => entry.id !== id)
      })),

      // 75 Hard Challenge operations
      addSeventyFiveHardChallenge: (challenge) => set((state) => ({
        seventyFiveHardChallenges: [...state.seventyFiveHardChallenges, challenge]
      })),

      updateSeventyFiveHardChallenge: (id, updates) => set((state) => ({
        seventyFiveHardChallenges: state.seventyFiveHardChallenges.map(challenge =>
          challenge.id === id ? { ...challenge, ...updates } : challenge
        )
      })),

      deleteSeventyFiveHardChallenge: (id) => set((state) => ({
        seventyFiveHardChallenges: state.seventyFiveHardChallenges.filter(challenge => challenge.id !== id)
      })),

      addSeventyFiveHardEntry: (entry) => set((state) => ({
        seventyFiveHardChallenges: state.seventyFiveHardChallenges.map(challenge =>
          challenge.id === entry.challengeId
            ? { ...challenge, dailyEntries: [...challenge.dailyEntries, entry] }
            : challenge
        )
      })),

      updateSeventyFiveHardEntry: (id, updates) => set((state) => ({
        seventyFiveHardChallenges: state.seventyFiveHardChallenges.map(challenge => ({
          ...challenge,
          dailyEntries: challenge.dailyEntries.map(entry =>
            entry.id === id ? { ...entry, ...updates } : entry
          )
        }))
      }))
    }),
    {
      name: 'lifesync-real-storage-v2',
      partialize: (state) => ({
        // Don't persist loading states or temporary data
        notes: state.notes,
        journalEntries: state.journalEntries,
        goals: state.goals,
        dreams: state.dreams,
        userStats: state.userStats,
        achievements: state.achievements,
        stackedGoals: state.stackedGoals,
        habitCategories: state.habitCategories,
        todoCategories: state.todoCategories,
        loveLanguages: state.loveLanguages,
        conflictResolutions: state.conflictResolutions,
        sharedItems: state.sharedItems,
        giftIdeas: state.giftIdeas,
        seventyFiveHardChallenges: state.seventyFiveHardChallenges,
        periodCycles: state.periodCycles,
        periodSettings: state.periodSettings,
        periodPredictions: state.periodPredictions,
        periodInsights: state.periodInsights,
        nationalParks: state.nationalParks,
        travelTrips: state.travelTrips,
        creditCardTrips: state.creditCardTrips,
        ptoEntries: state.ptoEntries,
        countries: state.countries,
        usStates: state.usStates,
        indiaStates: state.indiaStates,
        calendars: state.calendars,
        calendarEvents: state.calendarEvents,
        shoppingItems: state.shoppingItems,
        budgets: state.budgets,
        activeView: state.activeView,
        sidebarCollapsed: state.sidebarCollapsed
      })
    }
  )
);