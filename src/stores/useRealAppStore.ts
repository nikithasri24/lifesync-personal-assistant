import { create } from 'zustand';
import {
  Goal,
  Dream,
  Habit,
  HabitCategory,
  JournalEntry,
  MealColumn,
  MealPlanWeek,
  MoodEntry,
  Note,
  PantryItem,
  PlannedMeal,
  Recipe,
  TodoItem,
  UserStats,
} from '../types';
import { addDays, startOfWeek } from 'date-fns';

const createId = () => Math.random().toString(36).slice(2, 10);

const DEFAULT_MEAL_COLUMNS: MealColumn[] = [
  { id: 'breakfast', name: 'Breakfast', defaultServings: 2, defaultPeopleCount: 2, color: '#f97316', icon: '☀️', order: 1 },
  { id: 'lunch', name: 'Lunch', defaultServings: 2, defaultPeopleCount: 2, color: '#10b981', icon: '🥗', order: 2 },
  { id: 'dinner', name: 'Dinner', defaultServings: 4, defaultPeopleCount: 4, color: '#8b5cf6', icon: '🍽️', order: 3 },
  { id: 'snack', name: 'Snacks', defaultServings: 1, defaultPeopleCount: 1, color: '#6b7280', icon: '🍿', order: 4 },
];

type ViewKey =
  | 'dashboard'
  | 'calendar'
  | 'focus'
  | 'habits'
  | 'mood'
  | 'period'
  | 'todos'
  | 'notes'
  | 'projects'
  | 'journal'
  | 'goals'
  | 'travel'
  | 'finances'
  | 'shopping'
  | 'meals'
  | 'shared'
  | 'personal'
  | 'seventy-five-hard';

interface RealAppState {
  loading: boolean;
  tasksLoading: boolean;
  mealPlansLoading: boolean;
  activeView: ViewKey;
  sidebarCollapsed: boolean;

  tasks: TodoItem[];
  habits: Habit[];
  habitCategories: HabitCategory[];
  notes: Note[];
  journalEntries: JournalEntry[];
  goals: Goal[];
  dreams: Dream[];
  recipes: Recipe[];
  pantryItems: PantryItem[];
  mealPlans: MealPlanWeek[];
  moodEntries: MoodEntry[];
  userStats: UserStats;

  initializeData: () => Promise<void>;
  setActiveView: (view: ViewKey) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;

  addTodo: (todo: Omit<TodoItem, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  toggleTodo: (id: string) => Promise<void>;

  addHabit: (habit: Omit<Habit, 'id' | 'createdAt' | 'completions'>) => Promise<void>;
  updateHabit: (id: string, updates: Partial<Habit>) => Promise<void>;
  deleteHabit: (id: string) => Promise<void>;
  completeHabit: (id: string) => Promise<void>;

  addNote: (note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateNote: (id: string, updates: Partial<Note>) => void;
  deleteNote: (id: string) => void;

  addJournalEntry: (entry: Omit<JournalEntry, 'id' | 'createdAt'>) => void;
  deleteJournalEntry: (id: string) => void;

  addGoal: (goal: Omit<Goal, 'id' | 'createdAt'>) => void;
  updateGoal: (id: string, updates: Partial<Goal>) => void;
  deleteGoal: (id: string) => void;

  addDream: (dream: Omit<Dream, 'id' | 'createdAt' | 'lastUpdated'>) => void;
  updateDream: (id: string, updates: Partial<Dream>) => void;
  deleteDream: (id: string) => void;

  loadRecipes: () => Promise<void>;
  addRecipe: (recipe: Omit<Recipe, 'id' | 'createdAt'>) => Promise<Recipe>;

  loadMealPlans: () => Promise<void>;
  ensureMealPlanForWeek: (weekStartDate: Date) => Promise<MealPlanWeek>;
  addPlannedMeal: (
    planId: string,
    meal: Omit<PlannedMeal, 'id' | 'mealPlanId' | 'createdAt'>
  ) => Promise<PlannedMeal>;
  deletePlannedMeal: (mealId: string) => Promise<void>;

  addMoodEntry: (entry: Omit<MoodEntry, 'id' | 'createdAt'>) => void;
  deleteMoodEntry: (id: string) => void;
}

const sampleTasks: TodoItem[] = [
  {
    id: createId(),
    title: 'Plan weekly meals',
    description: 'Pick recipes and prepare shopping list',
    status: 'todo',
    priority: 'medium',
    tags: ['planning'],
    estimatedTime: 45,
    actualTime: undefined,
    dueDate: new Date(),
    completed: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    deleted: false,
  },
  {
    id: createId(),
    title: '30-minute workout',
    description: 'Strength and cardio mix',
    status: 'todo',
    priority: 'high',
    tags: ['health'],
    estimatedTime: 30,
    dueDate: addDays(new Date(), 1),
    completed: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    deleted: false,
  },
  {
    id: createId(),
    title: 'Review project roadmap',
    status: 'done',
    priority: 'medium',
    tags: ['work'],
    estimatedTime: 60,
    actualTime: 50,
    dueDate: addDays(new Date(), -2),
    completed: true,
    completedAt: addDays(new Date(), -1),
    createdAt: addDays(new Date(), -7),
    updatedAt: addDays(new Date(), -1),
    deleted: false,
  },
];

const sampleHabits: Habit[] = [
  {
    id: createId(),
    name: 'Morning stretch',
    description: '10-minute stretch routine',
    frequency: 'daily',
    targetCount: 1,
    goalMode: 'daily-target',
    currentProgress: 0,
    color: '#22c55e',
    categoryId: 'wellness',
    reminder: { enabled: true, time: '08:00', days: [1, 2, 3, 4, 5, 6, 7], title: 'Stretch' },
    completions: [],
    createdAt: new Date(),
    streak: 0,
  },
  {
    id: createId(),
    name: 'Drink water',
    description: 'Drink eight glasses of water',
    frequency: 'daily',
    targetCount: 8,
    goalMode: 'daily-target',
    currentProgress: 0,
    color: '#0ea5e9',
    categoryId: 'wellness',
    reminder: { enabled: true, time: '10:00', days: [1, 2, 3, 4, 5, 6, 7], title: 'Hydrate' },
    completions: [],
    createdAt: new Date(),
    streak: 0,
  },
];

const sampleHabitCategories: HabitCategory[] = [
  { id: 'wellness', name: 'Wellness', description: 'Mind & body routines', color: '#22c55e', icon: '🧘' },
  { id: 'growth', name: 'Personal Growth', description: 'Learning and skills', color: '#f97316', icon: '📚' },
];

const sampleNotes: Note[] = [
  {
    id: createId(),
    title: 'Meeting recap',
    content: 'Summary of product sync and next steps.',
    tags: ['work'],
    createdAt: addDays(new Date(), -2),
    updatedAt: addDays(new Date(), -1),
  },
  {
    id: createId(),
    title: 'Weekend ideas',
    content: 'Visit farmers market, hike, try a new recipe.',
    tags: ['personal'],
    createdAt: addDays(new Date(), -5),
    updatedAt: addDays(new Date(), -3),
  },
];

const sampleJournalEntries: JournalEntry[] = [
  {
    id: createId(),
    title: 'Grateful for the little wins',
    content: 'Wrapped up sprint goals and enjoyed a relaxed evening walk.',
    mood: 'good',
    tags: ['gratitude'],
    attachments: [],
    createdAt: addDays(new Date(), -1),
  },
];

const sampleGoals: Goal[] = [
  {
    id: createId(),
    title: 'Launch personal website',
    description: 'Publish a polished portfolio with recent projects.',
    category: 'career',
    priority: 'high',
    status: 'in-progress',
    progress: 60,
    startDate: addDays(new Date(), -30),
    targetDate: addDays(new Date(), 30),
    tags: ['portfolio'],
    isPublic: false,
    difficulty: 'medium',
    xpReward: 200,
    notes: '',
    createdAt: addDays(new Date(), -35),
  },
];

const sampleDreams: Dream[] = [
  {
    id: createId(),
    title: 'Visit Iceland',
    description: 'See the northern lights and explore Reykjavik.',
    category: 'travel',
    priority: 'within-5-years',
    status: 'planning',
    estimatedCost: 4500,
    estimatedTimeframe: 'Within 3 years',
    tags: ['adventure'],
    isPublic: false,
    createdAt: addDays(new Date(), -120),
    lastUpdated: addDays(new Date(), -10),
    notes: '',
  },
];

const sampleRecipes: Recipe[] = [
  {
    id: createId(),
    name: 'Roasted vegetable pasta',
    description: 'Hearty pasta with seasonal vegetables and garlic.',
    ingredients: [
      { name: 'Pasta', amount: '12 oz' },
      { name: 'Cherry tomatoes', amount: '2 cups' },
      { name: 'Olive oil', amount: '2 tbsp' },
    ],
    instructions: [
      'Preheat oven to 400°F and roast vegetables until tender.',
      'Cook pasta according to package directions.',
      'Toss pasta with roasted vegetables and finish with olive oil.',
    ],
    prepTime: 15,
    cookTime: 25,
    servings: 4,
    difficulty: 'medium',
    tags: ['vegetarian'],
    createdAt: addDays(new Date(), -7),
  },
];

const sampleMealPlan: MealPlanWeek = {
  id: createId(),
  name: 'This week',
  weekStartDate: startOfWeek(new Date(), { weekStartsOn: 1 }),
  mealColumns: DEFAULT_MEAL_COLUMNS,
  meals: [],
  createdAt: new Date(),
  updatedAt: new Date(),
};

const samplePantry: PantryItem[] = [
  { id: createId(), name: 'Brown rice', quantity: 2, unit: 'lbs', category: 'pantry', updatedAt: new Date() },
  { id: createId(), name: 'Olive oil', quantity: 1, unit: 'bottle', category: 'pantry', updatedAt: new Date() },
];

const sampleMoodEntries: MoodEntry[] = [
  {
    id: createId(),
    mood: 'good',
    energy: 'medium',
    notes: 'Productive day with solid focus sessions.',
    createdAt: new Date(),
  },
];

export const useRealAppStore = create<RealAppState>((set, get) => ({
  loading: false,
  tasksLoading: false,
  mealPlansLoading: false,
  activeView: 'dashboard',
  sidebarCollapsed: false,

  tasks: sampleTasks,
  habits: sampleHabits,
  habitCategories: sampleHabitCategories,
  notes: sampleNotes,
  journalEntries: sampleJournalEntries,
  goals: sampleGoals,
  dreams: sampleDreams,
  recipes: sampleRecipes,
  pantryItems: samplePantry,
  mealPlans: [sampleMealPlan],
  moodEntries: sampleMoodEntries,
  userStats: {
    level: 3,
    xp: 1200,
    xpToNextLevel: 300,
    totalGoalsCompleted: 4,
  },

  initializeData: async () => {
    set({ loading: false });
  },

  setActiveView: (view) => set({ activeView: view }),
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),

  addTodo: async (todo) => {
    const newTask: TodoItem = {
      ...todo,
      id: createId(),
      createdAt: new Date(),
      updatedAt: new Date(),
      completed: false,
      status: todo.status ?? 'todo',
      priority: todo.priority ?? 'medium',
      tags: todo.tags ?? [],
      deleted: false,
    };
    set((state) => ({ tasks: [...state.tasks, newTask] }));
  },

  toggleTodo: async (id) => {
    set((state) => ({
      tasks: state.tasks.map((task) =>
        task.id === id
          ? {
              ...task,
              completed: !task.completed,
              status: task.completed ? 'todo' : 'done',
              completedAt: task.completed ? undefined : new Date(),
              updatedAt: new Date(),
            }
          : task,
      ),
    }));
  },

  addHabit: async (habit) => {
    const newHabit: Habit = {
      ...habit,
      id: createId(),
      createdAt: new Date(),
      completions: [],
      currentProgress: habit.currentProgress ?? 0,
      streak: habit.streak ?? 0,
    };
    set((state) => ({ habits: [...state.habits, newHabit] }));
  },

  updateHabit: async (id, updates) => {
    set((state) => ({
      habits: state.habits.map((habit) =>
        habit.id === id ? { ...habit, ...updates, updatedAt: new Date() } : habit,
      ),
    }));
  },

  deleteHabit: async (id) => {
    set((state) => ({ habits: state.habits.filter((habit) => habit.id !== id) }));
  },

  completeHabit: async (id) => {
    set((state) => ({
      habits: state.habits.map((habit) =>
        habit.id === id
          ? {
              ...habit,
              completions: [
                ...habit.completions,
                { id: createId(), completedAt: new Date() },
              ],
              currentProgress: habit.currentProgress + 1,
              streak: habit.streak + 1,
            }
          : habit,
      ),
    }));
  },

  addNote: (note) => {
    const newNote: Note = {
      ...note,
      id: createId(),
      createdAt: new Date(),
      updatedAt: new Date(),
      tags: note.tags ?? [],
    };
    set((state) => ({ notes: [newNote, ...state.notes] }));
  },

  updateNote: (id, updates) => {
    set((state) => ({
      notes: state.notes.map((note) =>
        note.id === id ? { ...note, ...updates, updatedAt: new Date() } : note,
      ),
    }));
  },

  deleteNote: (id) => {
    set((state) => ({ notes: state.notes.filter((note) => note.id !== id) }));
  },

  addJournalEntry: (entry) => {
    const newEntry: JournalEntry = {
      ...entry,
      id: createId(),
      createdAt: new Date(),
      attachments: entry.attachments ?? [],
      tags: entry.tags ?? [],
    };
    set((state) => ({ journalEntries: [newEntry, ...state.journalEntries] }));
  },

  deleteJournalEntry: (id) => {
    set((state) => ({ journalEntries: state.journalEntries.filter((entry) => entry.id !== id) }));
  },

  addGoal: (goal) => {
    const newGoal: Goal = {
      ...goal,
      id: createId(),
      createdAt: new Date(),
    };
    set((state) => ({ goals: [...state.goals, newGoal] }));
  },

  updateGoal: (id, updates) => {
    set((state) => ({
      goals: state.goals.map((goal) =>
        goal.id === id ? { ...goal, ...updates, updatedAt: new Date() as Date | undefined } : goal,
      ),
    }));
  },

  deleteGoal: (id) => {
    set((state) => ({ goals: state.goals.filter((goal) => goal.id !== id) }));
  },

  addDream: (dream) => {
    const newDream: Dream = {
      ...dream,
      id: createId(),
      createdAt: new Date(),
      lastUpdated: new Date(),
      notes: dream.notes ?? '',
    };
    set((state) => ({ dreams: [...state.dreams, newDream] }));
  },

  updateDream: (id, updates) => {
    set((state) => ({
      dreams: state.dreams.map((dream) =>
        dream.id === id ? { ...dream, ...updates, lastUpdated: new Date() } : dream,
      ),
    }));
  },

  deleteDream: (id) => {
    set((state) => ({ dreams: state.dreams.filter((dream) => dream.id !== id) }));
  },

  loadRecipes: async () => {
    set({ recipes: get().recipes });
  },

  addRecipe: async (recipe) => {
    const newRecipe: Recipe = {
      ...recipe,
      id: createId(),
      createdAt: new Date(),
    };
    set((state) => ({ recipes: [...state.recipes, newRecipe] }));
    return newRecipe;
  },

  loadMealPlans: async () => {
    set({ mealPlansLoading: false });
  },

  ensureMealPlanForWeek: async (weekStartDate) => {
    const { mealPlans } = get();
    const normalized = startOfWeek(weekStartDate, { weekStartsOn: 1 }).getTime();
    const existing = mealPlans.find(
      (plan) => startOfWeek(plan.weekStartDate, { weekStartsOn: 1 }).getTime() === normalized,
    );

    if (existing) {
      return existing;
    }

    const newPlan: MealPlanWeek = {
      id: createId(),
      name: 'Meal plan',
      weekStartDate: startOfWeek(weekStartDate, { weekStartsOn: 1 }),
      mealColumns: DEFAULT_MEAL_COLUMNS,
      meals: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    set((state) => ({ mealPlans: [...state.mealPlans, newPlan] }));
    return newPlan;
  },

  addPlannedMeal: async (planId, meal) => {
    const mealPlan = get().mealPlans.find((plan) => plan.id === planId);
    if (!mealPlan) {
      throw new Error('Meal plan not found');
    }

    const newMeal: PlannedMeal = {
      ...meal,
      id: createId(),
      mealPlanId: planId,
      createdAt: new Date(),
    };

    set((state) => ({
      mealPlans: state.mealPlans.map((plan) =>
        plan.id === planId
          ? {
              ...plan,
              meals: [...plan.meals, newMeal],
              updatedAt: new Date(),
            }
          : plan,
      ),
    }));

    return newMeal;
  },

  deletePlannedMeal: async (mealId) => {
    set((state) => ({
      mealPlans: state.mealPlans.map((plan) => ({
        ...plan,
        meals: plan.meals.filter((meal) => meal.id !== mealId),
      })),
    }));
  },

  addMoodEntry: (entry) => {
    const newEntry: MoodEntry = {
      ...entry,
      id: createId(),
      createdAt: new Date(),
    };
    set((state) => ({ moodEntries: [newEntry, ...state.moodEntries] }));
  },

  deleteMoodEntry: (id) => {
    set((state) => ({ moodEntries: state.moodEntries.filter((entry) => entry.id !== id) }));
  },
}));
