import React, { useState, useEffect } from 'react';
import { useAppStore } from '../stores/useAppStore';
import { 
  Plus, 
  Calendar,
  ChefHat,
  Clock,
  Users,
  ShoppingCart,
  Utensils,
  Coffee,
  Sunset,
  Moon,
  Edit3,
  Trash2,
  Star,
  Search,
  Filter,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  BookOpen,
  Heart,
  Zap,
  Target,
  Globe,
  Leaf,
  Award,
  Timer,
  TrendingUp,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Link,
  Download,
  Play,
  Youtube,
  Instagram,
  Loader,
  CheckCircle2,
  XCircle,
  Eye,
  Share2,
  ArrowDown,
  ArrowUp,
  MoreVertical,
  Workflow,
  Settings
} from 'lucide-react';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, addDays, isToday, isSameDay } from 'date-fns';

interface Recipe {
  id: string;
  name: string;
  description?: string;
  cuisine: 'american' | 'italian' | 'mexican' | 'asian' | 'indian' | 'mediterranean' | 'other';
  difficulty: 'easy' | 'medium' | 'hard';
  prepTime: number; // minutes
  cookTime: number; // minutes
  servings: number;
  ingredients: Ingredient[];
  instructions: string[];
  tags: string[];
  rating?: number;
  nutritionInfo?: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber?: number;
  };
  dietaryRestrictions: string[]; // 'vegetarian', 'vegan', 'gluten-free', 'dairy-free', 'keto', 'paleo'
  image?: string;
  source?: string;
  sourceUrl?: string; // YouTube/Instagram URL
  sourceType?: 'youtube' | 'instagram' | 'manual';
  videoThumbnail?: string;
  authorName?: string;
  authorImage?: string;
  notes?: string;
  flowChart?: RecipeFlowStep[]; // Visual cooking flow
  createdAt: Date;
  lastMade?: Date;
}

interface RecipeFlowStep {
  id: string;
  step: number;
  title: string;
  description: string;
  duration?: number; // minutes
  temperature?: string;
  tips?: string;
  ingredients?: string[]; // Ingredient IDs used in this step
  equipment?: string[];
  image?: string;
  isParallel?: boolean; // Can be done simultaneously with other steps
  dependencies?: string[]; // Step IDs that must be completed first
}

interface Ingredient {
  name: string;
  amount: number;
  unit: string;
  category: 'produce' | 'dairy' | 'meat' | 'pantry' | 'frozen' | 'bakery' | 'deli' | 'household' | 'personal' | 'other';
  optional?: boolean;
  notes?: string;
}

interface MealPlan {
  id: string;
  date: Date;
  mealType: string; // Now customizable
  recipeId?: string;
  customMeal?: string;
  servings: number;
  peopleCount?: number; // Number of people this meal serves
  notes?: string;
  status: 'planned' | 'prepped' | 'cooked' | 'eaten';
  prepTime?: Date;
  cookTime?: Date;
}

interface WeeklyPlan {
  id: string;
  weekStartDate: Date;
  meals: MealPlan[];
  shoppingListGenerated: boolean;
  totalEstimatedCost?: number;
  mealColumns: MealColumn[]; // Customizable columns
  createdAt: Date;
  updatedAt: Date;
}

interface MealColumn {
  id: string;
  name: string;
  defaultServings: number;
  defaultPeopleCount: number;
  color: string;
  icon?: string;
  order: number;
}

const DEFAULT_MEAL_COLUMNS: MealColumn[] = [
  {
    id: 'breakfast',
    name: 'Breakfast',
    defaultServings: 2,
    defaultPeopleCount: 2,
    color: '#f97316', // orange
    icon: '☀️',
    order: 1
  },
  {
    id: 'lunch',
    name: 'Lunch',
    defaultServings: 2,
    defaultPeopleCount: 2,
    color: '#10b981', // green
    icon: '🥗',
    order: 2
  },
  {
    id: 'dinner',
    name: 'Dinner',
    defaultServings: 4,
    defaultPeopleCount: 4,
    color: '#8b5cf6', // purple
    icon: '🍽️',
    order: 3
  },
  {
    id: 'snack',
    name: 'Snacks',
    defaultServings: 1,
    defaultPeopleCount: 1,
    color: '#6b7280', // gray
    icon: '🍿',
    order: 4
  }
];

const WEEKDAYS = [
  'Sunday',
  'Monday', 
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday'
];

const CUISINE_ICONS = {
  american: '🇺🇸',
  italian: '🇮🇹',
  mexican: '🇲🇽',
  asian: '🥢',
  indian: '🇮🇳',
  mediterranean: '🫒',
  other: '🌍'
};

const DIFFICULTY_COLORS = {
  easy: 'bg-green-100 text-green-800 border-green-200',
  medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  hard: 'bg-red-100 text-red-800 border-red-200'
};

export default function MealPlanning() {
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [activeView, setActiveView] = useState<'calendar' | 'recipes' | 'shopping'>('calendar');
  const [showAddMeal, setShowAddMeal] = useState(false);
  const [showAddRecipe, setShowAddRecipe] = useState(false);
  const [showImportRecipe, setShowImportRecipe] = useState(false);
  const [showRecipeFlowChart, setShowRecipeFlowChart] = useState<string | null>(null);
  const [showColumnCustomization, setShowColumnCustomization] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedMealType, setSelectedMealType] = useState<string>('dinner');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCuisine, setFilterCuisine] = useState<string>('');
  const [filterDietary, setFilterDietary] = useState<string>('');
  const [importUrl, setImportUrl] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  
  // Editing and multi-day functionality
  const [editingMeal, setEditingMeal] = useState<MealPlan | null>(null);
  const [showMultiDay, setShowMultiDay] = useState(false);
  const [selectedDays, setSelectedDays] = useState<boolean[]>(new Array(7).fill(false));
  
  // Global store
  const { recipes, addRecipe, updateRecipe, deleteRecipe } = useAppStore();

  // Initialize sample recipes if store is empty
  useEffect(() => {
    if (recipes.length === 0) {
      const sampleRecipes = [
        {
          name: 'Spaghetti Carbonara',
          description: 'Classic Italian pasta with eggs, cheese, and pancetta',
          cuisine: 'italian',
          difficulty: 'medium',
          prepTime: 15,
          cookTime: 15,
          servings: 4,
          ingredients: [
            { name: 'Spaghetti', amount: '400g', category: 'pantry' },
            { name: 'Pancetta', amount: '150g', category: 'meat' },
            { name: 'Eggs', amount: '4 large', category: 'dairy' },
            { name: 'Parmesan cheese', amount: '100g', category: 'dairy' },
            { name: 'Black pepper', amount: 'to taste', category: 'spices' }
          ],
          instructions: [
            'Cook spaghetti according to package directions',
            'Fry pancetta until crispy',
            'Beat eggs and mix with grated parmesan',
            'Toss hot pasta with pancetta and egg mixture',
            'Season with black pepper and serve'
          ],
          tags: ['pasta', 'italian', 'quick'],
          nutritionInfo: {
            calories: 520,
            protein: 28,
            carbs: 48,
            fat: 22,
            fiber: 2
          },
          dietaryRestrictions: [],
          sourceType: 'manual',
          rating: 4.5
        }
      ];
      
      sampleRecipes.forEach(recipe => addRecipe(recipe));
    }
  }, [recipes, addRecipe]);

  // Sample recipes with flow charts - now in global store
  /*
  const [recipes, setRecipes] = useState<Recipe[]>([
    {
      id: '1',
      name: 'Spaghetti Carbonara',
      description: 'Classic Italian pasta with eggs, cheese, and pancetta',
      cuisine: 'italian',
      difficulty: 'medium',
      prepTime: 15,
      cookTime: 20,
      servings: 4,
      ingredients: [
        { name: 'Spaghetti', amount: 1, unit: 'lb', category: 'pantry' },
        { name: 'Eggs', amount: 4, unit: 'large', category: 'dairy' },
        { name: 'Parmesan Cheese', amount: 1, unit: 'cup', category: 'dairy' },
        { name: 'Pancetta', amount: 0.5, unit: 'lb', category: 'meat' },
        { name: 'Black Pepper', amount: 1, unit: 'tsp', category: 'pantry' }
      ],
      instructions: [
        'Cook spaghetti according to package directions',
        'Cook pancetta until crispy',
        'Whisk eggs with cheese and pepper',
        'Combine hot pasta with egg mixture',
        'Toss with pancetta and serve immediately'
      ],
      tags: ['quick', 'classic', 'comfort food'],
      rating: 4.5,
      nutritionInfo: {
        calories: 520,
        protein: 28,
        carbs: 45,
        fat: 22
      },
      dietaryRestrictions: [],
      flowChart: [
        {
          id: '1',
          step: 1,
          title: 'Boil Water & Cook Pasta',
          description: 'Bring large pot of salted water to boil, cook spaghetti al dente',
          duration: 12,
          ingredients: ['Spaghetti'],
          equipment: ['Large pot', 'Colander'],
          dependencies: []
        },
        {
          id: '2',
          step: 2,
          title: 'Cook Pancetta',
          description: 'Render pancetta in large pan until crispy',
          duration: 8,
          temperature: 'Medium heat',
          ingredients: ['Pancetta'],
          equipment: ['Large pan'],
          isParallel: true,
          dependencies: []
        },
        {
          id: '3',
          step: 3,
          title: 'Prepare Egg Mixture',
          description: 'Whisk eggs with grated Parmesan and black pepper',
          duration: 3,
          ingredients: ['Eggs', 'Parmesan Cheese', 'Black Pepper'],
          equipment: ['Bowl', 'Whisk'],
          dependencies: []
        },
        {
          id: '4',
          step: 4,
          title: 'Combine Everything',
          description: 'Add hot pasta to pan with pancetta, remove from heat, add egg mixture',
          duration: 2,
          tips: 'Work quickly to prevent eggs from scrambling',
          dependencies: ['1', '2', '3']
        }
      ],
      createdAt: new Date(),
      lastMade: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    },
    {
      id: '2',
      name: 'Buddha Bowl',
      description: 'Healthy quinoa bowl with roasted vegetables and tahini dressing',
      cuisine: 'mediterranean',
      difficulty: 'easy',
      prepTime: 20,
      cookTime: 30,
      servings: 2,
      ingredients: [
        { name: 'Quinoa', amount: 1, unit: 'cup', category: 'pantry' },
        { name: 'Sweet Potato', amount: 2, unit: 'medium', category: 'produce' },
        { name: 'Broccoli', amount: 1, unit: 'head', category: 'produce' },
        { name: 'Chickpeas', amount: 1, unit: 'can', category: 'pantry' },
        { name: 'Tahini', amount: 3, unit: 'tbsp', category: 'pantry' },
        { name: 'Spinach', amount: 2, unit: 'cups', category: 'produce' }
      ],
      instructions: [
        'Cook quinoa according to package directions',
        'Roast sweet potato and broccoli at 400°F for 25 minutes',
        'Heat chickpeas with spices',
        'Make tahini dressing with lemon and garlic',
        'Assemble bowls with quinoa, vegetables, and dressing'
      ],
      tags: ['healthy', 'vegetarian', 'meal prep'],
      rating: 4.8,
      nutritionInfo: {
        calories: 420,
        protein: 18,
        carbs: 65,
        fat: 12,
        fiber: 15
      },
      dietaryRestrictions: ['vegetarian', 'vegan', 'gluten-free'],
      createdAt: new Date()
    }
  ]);
  */

  // Sample meal plans with customizable columns
  const [weeklyPlans, setWeeklyPlans] = useState<WeeklyPlan[]>([
    {
      id: '1',
      weekStartDate: startOfWeek(new Date(), { weekStartsOn: 0 }),
      mealColumns: [...DEFAULT_MEAL_COLUMNS],
      meals: [
        {
          id: '1',
          date: new Date(),
          mealType: 'dinner',
          recipeId: '1',
          servings: 4,
          peopleCount: 4,
          status: 'planned'
        },
        {
          id: '2',
          date: addDays(new Date(), 1),
          mealType: 'dinner',
          recipeId: '2',
          servings: 2,
          peopleCount: 2,
          status: 'planned'
        }
      ],
      shoppingListGenerated: false,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ]);

  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 0 }); // Start on Sunday
  const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 0 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const currentWeekPlan = weeklyPlans.find(plan => 
    isSameDay(plan.weekStartDate, weekStart)
  );

  // Initialize meal columns for new plans
  useEffect(() => {
    if (!currentWeekPlan) {
      // Create a new plan with default columns if none exists
      const newPlan: WeeklyPlan = {
        id: Date.now().toString(),
        weekStartDate: weekStart,
        mealColumns: [...DEFAULT_MEAL_COLUMNS],
        meals: [],
        shoppingListGenerated: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      setWeeklyPlans([...weeklyPlans, newPlan]);
    }
  }, [weekStart]);

  const getMealsForDate = (date: Date) => {
    if (!currentWeekPlan) return [];
    return currentWeekPlan.meals.filter(meal => isSameDay(meal.date, date));
  };

  const getRecipeById = (id: string) => {
    return recipes.find(recipe => recipe.id === id);
  };

  // Get meal column defaults
  const getMealColumnDefaults = (mealType: string) => {
    const plan = currentWeekPlan;
    if (plan) {
      const column = plan.mealColumns.find(col => col.id === mealType);
      if (column) return column;
    }
    return DEFAULT_MEAL_COLUMNS.find(col => col.id === mealType) || DEFAULT_MEAL_COLUMNS[0];
  };

  // Update meal columns
  const updateMealColumns = (newColumns: MealColumn[]) => {
    if (!currentWeekPlan) return;
    
    setWeeklyPlans(weeklyPlans.map(plan => 
      plan.id === currentWeekPlan.id 
        ? { ...plan, mealColumns: newColumns, updatedAt: new Date() }
        : plan
    ));
  };

  // Add new meal column
  const addMealColumn = (column: Omit<MealColumn, 'id' | 'order'>) => {
    if (!currentWeekPlan) return;
    
    const newColumn: MealColumn = {
      ...column,
      id: Date.now().toString(),
      order: Math.max(...currentWeekPlan.mealColumns.map(c => c.order)) + 1
    };
    
    updateMealColumns([...currentWeekPlan.mealColumns, newColumn]);
  };

  // Remove meal column
  const removeMealColumn = (columnId: string) => {
    if (!currentWeekPlan) return;
    
    // Remove associated meals
    const updatedMeals = currentWeekPlan.meals.filter(meal => meal.mealType !== columnId);
    const updatedColumns = currentWeekPlan.mealColumns.filter(col => col.id !== columnId);
    
    setWeeklyPlans(weeklyPlans.map(plan => 
      plan.id === currentWeekPlan.id 
        ? { ...plan, meals: updatedMeals, mealColumns: updatedColumns, updatedAt: new Date() }
        : plan
    ));
  };

  // Edit existing meal
  const editMeal = (meal: MealPlan) => {
    setEditingMeal(meal);
    setSelectedDate(meal.date);
    setSelectedMealType(meal.mealType);
    setShowAddMeal(true);
  };

  // Delete meal
  const deleteMeal = (mealId: string) => {
    if (!currentWeekPlan) return;
    
    setWeeklyPlans(weeklyPlans.map(plan => 
      plan.id === currentWeekPlan.id 
        ? { 
            ...plan, 
            meals: plan.meals.filter(meal => meal.id !== mealId),
            updatedAt: new Date() 
          }
        : plan
    ));
  };

  // Apply meal to multiple days
  const applyMealToMultipleDays = (mealData: {
    mealType: string;
    recipeId?: string;
    customMeal?: string;
    peopleCount?: number;
  }, selectedDayIndices: number[]) => {
    if (!currentWeekPlan) return;

    const newMeals: MealPlan[] = [];
    
    selectedDayIndices.forEach(dayIndex => {
      const mealDate = addDays(weekStart, dayIndex);
      
      // Check if meal already exists for this day/type
      const existingMeal = currentWeekPlan.meals.find(m => 
        isSameDay(m.date, mealDate) && m.mealType === mealData.mealType
      );
      
      if (!existingMeal) {
        newMeals.push({
          id: `${Date.now()}-${dayIndex}`,
          date: mealDate,
          mealType: mealData.mealType,
          recipeId: mealData.recipeId,
          customMeal: mealData.customMeal,
          servings: mealData.recipeId ? getRecipeById(mealData.recipeId)?.servings || 4 : 1,
          peopleCount: mealData.peopleCount || getMealColumnDefaults(mealData.mealType).defaultPeopleCount,
          status: 'planned'
        });
      }
    });

    if (newMeals.length > 0) {
      setWeeklyPlans(weeklyPlans.map(plan => 
        plan.id === currentWeekPlan.id 
          ? { 
              ...plan, 
              meals: [...plan.meals, ...newMeals],
              updatedAt: new Date() 
            }
          : plan
      ));
    }
  };

  const addMealToPlan = (date: Date, mealType: string, recipeId?: string, customMeal?: string, peopleCount?: number) => {
    // If it's a custom meal, add it to recipe library first
    let finalRecipeId = recipeId;
    if (customMeal && !recipeId) {
      // Check if this custom meal already exists in recipes
      const existingCustomRecipe = recipes.find(r => 
        r.name.toLowerCase() === customMeal.toLowerCase() && r.sourceType === 'manual'
      );
      
      if (existingCustomRecipe) {
        finalRecipeId = existingCustomRecipe.id;
      } else {
        // Create new recipe for custom meal
        const newCustomRecipe: Recipe = {
          id: Date.now().toString(),
          name: customMeal,
          description: 'Custom meal added from meal planning',
          cuisine: 'other',
          difficulty: 'easy',
          prepTime: 15,
          cookTime: 15,
          servings: peopleCount || 2,
          ingredients: [],
          instructions: ['Prepare according to preference'],
          tags: ['custom', 'quick'],
          dietaryRestrictions: [],
          sourceType: 'manual',
          createdAt: new Date()
        };
        
        addRecipe(newCustomRecipe);
        finalRecipeId = newCustomRecipe.id;
      }
    }

    const mealData = {
      date,
      mealType,
      recipeId: finalRecipeId,
      customMeal: finalRecipeId ? undefined : customMeal, // Clear custom meal if we have recipe ID
      servings: finalRecipeId ? getRecipeById(finalRecipeId)?.servings || 4 : 1,
      peopleCount: peopleCount || getMealColumnDefaults(mealType).defaultPeopleCount,
      status: 'planned' as const
    };

    if (editingMeal) {
      // Update existing meal
      setWeeklyPlans(weeklyPlans.map(plan => 
        plan.id === currentWeekPlan?.id 
          ? { 
              ...plan, 
              meals: plan.meals.map(meal => 
                meal.id === editingMeal.id 
                  ? { ...meal, ...mealData }
                  : meal
              ),
              updatedAt: new Date() 
            }
          : plan
      ));
      setEditingMeal(null);
    } else {
      // Add new meal
      if (!currentWeekPlan) {
        // Create new weekly plan
        const newPlan: WeeklyPlan = {
          id: Date.now().toString(),
          weekStartDate: weekStart,
          mealColumns: [...DEFAULT_MEAL_COLUMNS],
          meals: [{
            id: Date.now().toString(),
            ...mealData
          }],
          shoppingListGenerated: false,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        setWeeklyPlans([...weeklyPlans, newPlan]);
      } else {
        // Add to existing plan
        const newMeal: MealPlan = {
          id: Date.now().toString(),
          ...mealData
        };
        
        setWeeklyPlans(weeklyPlans.map(plan => 
          plan.id === currentWeekPlan.id 
            ? { ...plan, meals: [...plan.meals, newMeal], updatedAt: new Date(), mealColumns: plan.mealColumns || [...DEFAULT_MEAL_COLUMNS] }
            : plan
        ));
      }
    }
  };

  // Import recipe from URL (YouTube/Instagram)
  const importRecipeFromUrl = async (url: string) => {
    setIsImporting(true);
    setImportError(null);
    
    try {
      // Detect platform
      const isYoutube = url.includes('youtube.com') || url.includes('youtu.be');
      const isInstagram = url.includes('instagram.com');
      
      if (!isYoutube && !isInstagram) {
        throw new Error('Please provide a YouTube or Instagram URL');
      }
      
      // In a real app, this would call an API to extract recipe data
      // For demo purposes, we'll simulate the import
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock imported recipe data
      const importedRecipe: Recipe = {
        id: Date.now().toString(),
        name: 'Imported ' + (isYoutube ? 'YouTube' : 'Instagram') + ' Recipe',
        description: 'Delicious recipe imported from social media',
        cuisine: 'other',
        difficulty: 'medium',
        prepTime: 20,
        cookTime: 30,
        servings: 4,
        ingredients: [
          { name: 'Chicken Breast', amount: 2, unit: 'lbs', category: 'meat' },
          { name: 'Rice', amount: 2, unit: 'cups', category: 'pantry' },
          { name: 'Mixed Vegetables', amount: 1, unit: 'bag', category: 'frozen' },
          { name: 'Soy Sauce', amount: 3, unit: 'tbsp', category: 'pantry' },
          { name: 'Garlic', amount: 3, unit: 'cloves', category: 'produce' }
        ],
        instructions: [
          'Season and cook chicken breast until golden',
          'Cook rice according to package directions',
          'Stir-fry vegetables until tender',
          'Combine everything with soy sauce and garlic',
          'Serve hot and enjoy!'
        ],
        tags: ['imported', 'social-media', 'quick'],
        sourceUrl: url,
        sourceType: isYoutube ? 'youtube' : 'instagram',
        videoThumbnail: 'https://via.placeholder.com/320x180/ff6b6b/ffffff?text=' + (isYoutube ? 'YouTube' : 'Instagram'),
        authorName: 'Recipe Creator',
        dietaryRestrictions: [],
        createdAt: new Date()
      };
      
      // Add to recipes list
      addRecipe(importedRecipe);
      setShowImportRecipe(false);
      setImportUrl('');
      
    } catch (error) {
      setImportError(error instanceof Error ? error.message : 'Failed to import recipe');
    } finally {
      setIsImporting(false);
    }
  };
  
  // Add recipe ingredients to shopping list
  const addRecipeToShoppingList = (recipeId: string) => {
    const recipe = getRecipeById(recipeId);
    if (!recipe) return;
    
    // In a real app, this would integrate with the shopping system
    // For now, we'll just show a success message
    alert(`Added ${recipe.ingredients.length} ingredients from "${recipe.name}" to shopping list!`);
  };

  const generateShoppingList = () => {
    if (!currentWeekPlan) return [];
    
    const ingredientMap = new Map<string, { amount: number; unit: string; category: string }>();
    
    currentWeekPlan.meals.forEach(meal => {
      if (meal.recipeId) {
        const recipe = getRecipeById(meal.recipeId);
        if (recipe) {
          const servingMultiplier = meal.servings / recipe.servings;
          
          recipe.ingredients.forEach(ingredient => {
            const key = ingredient.name.toLowerCase();
            const adjustedAmount = ingredient.amount * servingMultiplier;
            
            if (ingredientMap.has(key)) {
              const existing = ingredientMap.get(key)!;
              // Simple addition - in real app, would need unit conversion
              existing.amount += adjustedAmount;
            } else {
              ingredientMap.set(key, {
                amount: adjustedAmount,
                unit: ingredient.unit,
                category: ingredient.category
              });
            }
          });
        }
      }
    });
    
    return Array.from(ingredientMap.entries()).map(([name, details]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      quantity: Math.ceil(details.amount * 100) / 100, // Round to 2 decimal places
      unit: details.unit,
      category: details.category as any
    }));
  };

  const filteredRecipes = recipes.filter(recipe => {
    const matchesSearch = searchQuery === '' || 
      recipe.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      recipe.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCuisine = filterCuisine === '' || recipe.cuisine === filterCuisine;
    const matchesDietary = filterDietary === '' || recipe.dietaryRestrictions.includes(filterDietary);
    
    return matchesSearch && matchesCuisine && matchesDietary;
  });

  const weekStats = {
    totalMeals: currentWeekPlan?.meals.length || 0,
    plannedMeals: currentWeekPlan?.meals.filter(m => m.status === 'planned').length || 0,
    preparedMeals: currentWeekPlan?.meals.filter(m => m.status === 'prepped').length || 0,
    cookedMeals: currentWeekPlan?.meals.filter(m => m.status === 'cooked').length || 0
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl p-6 shadow-sm border">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Meal Planning</h1>
            <p className="text-gray-600">Simple weekly meal matrix with customizable columns</p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => setShowImportRecipe(true)}
              className="btn-secondary flex items-center space-x-2"
            >
              <Download size={16} />
              <span>Import Recipe</span>
            </button>
            <button
              onClick={() => setShowAddRecipe(true)}
              className="btn-secondary flex items-center space-x-2"
            >
              <BookOpen size={16} />
              <span>Add Recipe</span>
            </button>
            <button
              onClick={() => setShowAddMeal(true)}
              className="btn-primary flex items-center space-x-2"
            >
              <Plus size={16} />
              <span>Add Meal</span>
            </button>
          </div>
        </div>

        {/* Week Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-blue-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-blue-600">Total Meals</p>
                <p className="text-lg font-semibold text-blue-900">{weekStats.totalMeals}</p>
              </div>
            </div>
          </div>
          <div className="bg-yellow-50 rounded-lg p-4">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-yellow-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-yellow-600">Planned</p>
                <p className="text-lg font-semibold text-yellow-900">{weekStats.plannedMeals}</p>
              </div>
            </div>
          </div>
          <div className="bg-orange-50 rounded-lg p-4">
            <div className="flex items-center">
              <ChefHat className="h-8 w-8 text-orange-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-orange-600">Prepped</p>
                <p className="text-lg font-semibold text-orange-900">{weekStats.preparedMeals}</p>
              </div>
            </div>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-green-600">Cooked</p>
                <p className="text-lg font-semibold text-green-900">{weekStats.cookedMeals}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white rounded-xl shadow-sm border">
        <div className="border-b">
          <div className="flex space-x-1 p-1">
            <button
              onClick={() => setActiveView('calendar')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeView === 'calendar'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Calendar size={16} />
                <span>Weekly Matrix</span>
              </div>
            </button>
            <button
              onClick={() => setActiveView('recipes')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeView === 'recipes'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center space-x-2">
                <BookOpen size={16} />
                <span>Recipe Library</span>
                <span className="text-xs bg-gray-200 px-2 py-1 rounded-full">
                  {recipes.length}
                </span>
              </div>
            </button>
            <button
              onClick={() => setActiveView('shopping')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeView === 'shopping'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center space-x-2">
                <ShoppingCart size={16} />
                <span>Shopping List</span>
              </div>
            </button>
          </div>
        </div>

        {/* Simple 2D Matrix Calendar View */}
        {activeView === 'calendar' && (
          <div className="p-6">
            {/* Header with Week Navigation */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setCurrentWeek(addDays(currentWeek, -7))}
                  className="p-2 hover:bg-gray-100 rounded-md text-gray-600 hover:text-gray-900"
                >
                  <ChevronLeft size={20} />
                </button>
                <h3 className="text-xl font-semibold text-gray-900">
                  Week of {format(weekStart, 'MMM d, yyyy')}
                </h3>
                <button
                  onClick={() => setCurrentWeek(addDays(currentWeek, 7))}
                  className="p-2 hover:bg-gray-100 rounded-md text-gray-600 hover:text-gray-900"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
              
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setShowColumnCustomization(true)}
                  className="btn-secondary flex items-center space-x-2"
                >
                  <Settings size={16} />
                  <span>Customize Columns</span>
                </button>
                <button
                  onClick={() => setCurrentWeek(new Date())}
                  className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors font-medium"
                >
                  Today
                </button>
                <button
                  onClick={() => setShowAddMeal(true)}
                  className="btn-primary flex items-center space-x-2"
                >
                  <Plus size={16} />
                  <span>Add Meal</span>
                </button>
              </div>
            </div>

            {/* Simple 2D Matrix Table */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  {/* Header Row - Meal Columns */}
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                        Day
                      </th>
                      {(currentWeekPlan?.mealColumns || DEFAULT_MEAL_COLUMNS)
                        .sort((a, b) => a.order - b.order)
                        .map(column => (
                        <th 
                          key={column.id}
                          className="px-4 py-4 text-center text-sm font-medium text-gray-900 border-r border-gray-200 last:border-r-0 min-w-[200px]"
                          style={{ backgroundColor: `${column.color}15` }}
                        >
                          <div className="flex items-center justify-center space-x-2">
                            <span className="text-lg">{column.icon}</span>
                            <div>
                              <div className="font-semibold">{column.name}</div>
                              <div className="text-xs text-gray-500 font-normal">
                                Default: {column.defaultServings} servings • {column.defaultPeopleCount} people
                              </div>
                            </div>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  
                  {/* Body - Days and Meals */}
                  <tbody className="bg-white divide-y divide-gray-200">
                    {WEEKDAYS.map((dayName, dayIndex) => {
                      const currentDate = addDays(weekStart, dayIndex);
                      const dayMeals = getMealsForDate(currentDate);
                      const isCurrentDay = isToday(currentDate);
                      
                      return (
                        <tr key={dayName} className={isCurrentDay ? 'bg-blue-50/30' : 'hover:bg-gray-50'}>
                          {/* Day Column */}
                          <td className="px-6 py-4 border-r border-gray-200">
                            <div className={`text-center ${
                              isCurrentDay ? 'text-blue-700' : 'text-gray-900'
                            }`}>
                              <div className="font-semibold text-lg">{dayName}</div>
                              <div className={`text-sm ${
                                isCurrentDay ? 'text-blue-600' : 'text-gray-500'
                              }`}>
                                {format(currentDate, 'MMM d')}
                              </div>
                              {isCurrentDay && (
                                <div className="text-xs text-blue-600 font-medium mt-1">Today</div>
                              )}
                            </div>
                          </td>
                          
                          {/* Meal Columns */}
                          {(currentWeekPlan?.mealColumns || DEFAULT_MEAL_COLUMNS)
                            .sort((a, b) => a.order - b.order)
                            .map(column => {
                            const meal = dayMeals.find(m => m.mealType === column.id);
                            
                            return (
                              <td 
                                key={column.id}
                                className="px-4 py-4 border-r border-gray-200 last:border-r-0 vertical-align-top"
                              >
                                {meal ? (
                                  <div 
                                    className={`
                                      p-3 rounded-lg border-l-4 hover:shadow-sm transition-all relative group
                                      ${meal.status === 'planned' ? 'bg-blue-50 border-l-blue-400 hover:bg-blue-100' :
                                        meal.status === 'prepped' ? 'bg-yellow-50 border-l-yellow-400 hover:bg-yellow-100' :
                                        meal.status === 'cooked' ? 'bg-green-50 border-l-green-400 hover:bg-green-100' :
                                        'bg-gray-50 border-l-gray-400 hover:bg-gray-100'
                                      }
                                    `}
                                  >
                                    {/* Edit/Delete buttons - show on hover */}
                                    <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1">
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          editMeal(meal);
                                        }}
                                        className="p-1 text-gray-500 hover:text-blue-600 bg-white rounded shadow-sm"
                                        title="Edit meal"
                                      >
                                        <Edit3 size={12} />
                                      </button>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          deleteMeal(meal.id);
                                        }}
                                        className="p-1 text-gray-500 hover:text-red-600 bg-white rounded shadow-sm"
                                        title="Delete meal"
                                      >
                                        <Trash2 size={12} />
                                      </button>
                                    </div>
                                    {meal.recipeId ? (
                                      <div>
                                        <div className="font-medium text-sm text-gray-900 mb-1">
                                          {getRecipeById(meal.recipeId)?.name}
                                        </div>
                                        <div className="text-xs text-gray-600 space-y-1">
                                          <div>🍽️ {meal.servings} servings</div>
                                          {meal.peopleCount && (
                                            <div>👥 {meal.peopleCount} people</div>
                                          )}
                                        </div>
                                        {meal.status !== 'planned' && (
                                          <div className="mt-2">
                                            <span className={`
                                              inline-flex items-center px-2 py-1 rounded-full text-xs font-medium
                                              ${meal.status === 'prepped' ? 'bg-yellow-100 text-yellow-800' :
                                                meal.status === 'cooked' ? 'bg-green-100 text-green-800' :
                                                'bg-gray-100 text-gray-800'
                                              }
                                            `}>
                                              {meal.status === 'prepped' ? '🔪 Prepped' :
                                               meal.status === 'cooked' ? '🍳 Cooked' : '✅ Eaten'}
                                            </span>
                                          </div>
                                        )}
                                      </div>
                                    ) : (
                                      <div>
                                        <div className="font-medium text-sm text-gray-900 mb-1">{meal.customMeal}</div>
                                        <div className="text-xs text-gray-600 space-y-1">
                                          <div>🍽️ {meal.servings} servings</div>
                                          {meal.peopleCount && (
                                            <div>👥 {meal.peopleCount} people</div>
                                          )}
                                        </div>
                                        {meal.status !== 'planned' && (
                                          <div className="mt-2">
                                            <span className={`
                                              inline-flex items-center px-2 py-1 rounded-full text-xs font-medium
                                              ${meal.status === 'prepped' ? 'bg-yellow-100 text-yellow-800' :
                                                meal.status === 'cooked' ? 'bg-green-100 text-green-800' :
                                                'bg-gray-100 text-gray-800'
                                              }
                                            `}>
                                              {meal.status === 'prepped' ? '🔪 Prepped' :
                                               meal.status === 'cooked' ? '🍳 Cooked' : '✅ Eaten'}
                                            </span>
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => {
                                      setSelectedDate(currentDate);
                                      setSelectedMealType(column.id);
                                      setShowAddMeal(true);
                                    }}
                                    className="w-full h-20 border-2 border-dashed border-gray-300 rounded-lg text-gray-400 hover:border-gray-400 hover:bg-gray-50 hover:text-gray-600 transition-all text-sm font-medium flex items-center justify-center"
                                    style={{ borderColor: `${column.color}50` }}
                                  >
                                    <div className="text-center">
                                      <Plus size={16} className="mx-auto mb-1" />
                                      <div>Add {column.name}</div>
                                    </div>
                                  </button>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Recipe Library View */}
        {activeView === 'recipes' && (
          <div className="p-6">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-6">
              <div className="flex items-center space-x-4 flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type="text"
                    placeholder="Search recipes..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <select
                  value={filterCuisine}
                  onChange={(e) => setFilterCuisine(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="">All Cuisines</option>
                  {Object.entries(CUISINE_ICONS).map(([cuisine, icon]) => (
                    <option key={cuisine} value={cuisine}>
                      {icon} {cuisine.charAt(0).toUpperCase() + cuisine.slice(1)}
                    </option>
                  ))}
                </select>

                <select
                  value={filterDietary}
                  onChange={(e) => setFilterDietary(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="">All Diets</option>
                  <option value="vegetarian">Vegetarian</option>
                  <option value="vegan">Vegan</option>
                  <option value="gluten-free">Gluten Free</option>
                  <option value="dairy-free">Dairy Free</option>
                  <option value="keto">Keto</option>
                  <option value="paleo">Paleo</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredRecipes.map(recipe => (
                <RecipeCard
                  key={recipe.id}
                  recipe={recipe}
                  onAddToMealPlan={(recipeId) => {
                    setShowAddMeal(true);
                    // Could pre-select this recipe
                  }}
                  onViewFlowChart={(recipeId) => {
                    setShowRecipeFlowChart(recipeId);
                  }}
                  onAddToShoppingList={(recipeId) => {
                    addRecipeToShoppingList(recipeId);
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Shopping List View */}
        {activeView === 'shopping' && (
          <div className="p-6">
            <div className="max-w-2xl mx-auto">
              <div className="text-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Weekly Shopping List
                </h3>
                <p className="text-gray-600">
                  Auto-generated from your meal plan
                </p>
              </div>

              {currentWeekPlan && currentWeekPlan.meals.length > 0 ? (
                <div className="space-y-6">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h4 className="font-medium text-blue-900 mb-2">This Week's Meals</h4>
                    <div className="space-y-1">
                      {currentWeekPlan.meals.map(meal => {
                        const recipe = meal.recipeId ? getRecipeById(meal.recipeId) : null;
                        return (
                          <div key={meal.id} className="flex justify-between text-sm">
                            <span>{format(meal.date, 'EEE')}: {recipe?.name || meal.customMeal}</span>
                            <span className="text-blue-600">{meal.servings} servings</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="bg-white border rounded-lg">
                    <div className="p-4 border-b">
                      <h4 className="font-medium text-gray-900">Ingredients Needed</h4>
                    </div>
                    <div className="p-4">
                      <ShoppingListPreview ingredients={generateShoppingList()} />
                    </div>
                  </div>

                  <div className="text-center">
                    <button
                      onClick={() => {
                        // Here you would integrate with the shopping system
                        alert('Shopping list would be sent to Smart Shopping system');
                      }}
                      className="btn-primary flex items-center space-x-2 mx-auto"
                    >
                      <ShoppingCart size={16} />
                      <span>Send to Shopping List</span>
                      <ArrowRight size={16} />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <ChefHat className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No meals planned</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Add some meals to your weekly plan to generate a shopping list
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Column Customization Modal */}
      {showColumnCustomization && (
        <ColumnCustomizationModal
          isOpen={showColumnCustomization}
          columns={currentWeekPlan?.mealColumns || DEFAULT_MEAL_COLUMNS}
          onClose={() => {
            setShowColumnCustomization(false);
          }}
          onUpdateColumns={updateMealColumns}
          onAddColumn={addMealColumn}
          onRemoveColumn={removeMealColumn}
        />
      )}

      {/* Add Meal Modal */}
      {showAddMeal && (
        <AddMealModal
          selectedDate={selectedDate}
          selectedMealType={selectedMealType}
          recipes={recipes}
          mealColumns={currentWeekPlan?.mealColumns || DEFAULT_MEAL_COLUMNS}
          editingMeal={editingMeal}
          weekStart={weekStart}
          onClose={() => {
            setShowAddMeal(false);
            setSelectedDate(null);
            setEditingMeal(null);
          }}
          onAddMeal={addMealToPlan}
          onApplyMultipleDays={applyMealToMultipleDays}
        />
      )}
    </div>
  );
}

// Recipe Card Component
function RecipeCard({ 
  recipe, 
  onAddToMealPlan,
  onViewFlowChart,
  onAddToShoppingList
}: { 
  recipe: Recipe; 
  onAddToMealPlan: (recipeId: string) => void;
  onViewFlowChart?: (recipeId: string) => void;
  onAddToShoppingList?: (recipeId: string) => void;
}) {
  return (
    <div className="bg-white border rounded-lg overflow-hidden hover:shadow-md transition-shadow">
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-semibold text-gray-900">{recipe.name}</h3>
          <span className="text-lg">{CUISINE_ICONS[recipe.cuisine]}</span>
        </div>
        
        <p className="text-sm text-gray-600 mb-3">{recipe.description}</p>
        
        <div className="flex items-center space-x-4 text-xs text-gray-500 mb-3">
          <div className="flex items-center space-x-1">
            <Clock size={12} />
            <span>{recipe.prepTime + recipe.cookTime}min</span>
          </div>
          <div className="flex items-center space-x-1">
            <Users size={12} />
            <span>{recipe.servings} servings</span>
          </div>
          <span className={`px-2 py-1 rounded-full text-xs border ${DIFFICULTY_COLORS[recipe.difficulty]}`}>
            {recipe.difficulty}
          </span>
        </div>

        {/* Source indicator */}
        {recipe.sourceType && (
          <div className="flex items-center space-x-2 mb-3">
            {recipe.sourceType === 'youtube' && (
              <div className="flex items-center space-x-1 text-red-600">
                <Youtube size={12} />
                <span className="text-xs">YouTube</span>
              </div>
            )}
            {recipe.sourceType === 'instagram' && (
              <div className="flex items-center space-x-1 text-pink-600">
                <Instagram size={12} />
                <span className="text-xs">Instagram</span>
              </div>
            )}
            {recipe.authorName && (
              <span className="text-xs text-gray-500">by {recipe.authorName}</span>
            )}
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {recipe.rating && (
              <div className="flex items-center space-x-1">
                <Star size={12} className="text-yellow-400 fill-current" />
                <span className="text-xs text-gray-600">{recipe.rating}</span>
              </div>
            )}
            {recipe.dietaryRestrictions.length > 0 && (
              <div className="flex space-x-1">
                {recipe.dietaryRestrictions.slice(0, 2).map(restriction => (
                  <span key={restriction} className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                    {restriction}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
        
        {/* Action buttons */}
        <div className="flex items-center space-x-2 mt-3">
          <button
            onClick={() => onAddToMealPlan(recipe.id)}
            className="flex-1 text-xs btn-primary px-3 py-1"
          >
            Add to Plan
          </button>
          {recipe.flowChart && onViewFlowChart && (
            <button
              onClick={() => onViewFlowChart(recipe.id)}
              className="text-xs btn-secondary px-3 py-1 flex items-center space-x-1"
            >
              <Workflow size={12} />
              <span>Flow</span>
            </button>
          )}
          {onAddToShoppingList && (
            <button
              onClick={() => onAddToShoppingList(recipe.id)}
              className="text-xs btn-secondary px-3 py-1 flex items-center space-x-1"
            >
              <ShoppingCart size={12} />
              <span>Shop</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// Shopping List Preview Component
function ShoppingListPreview({ ingredients }: { ingredients: any[] }) {
  const [editableIngredients, setEditableIngredients] = useState(ingredients);
  const [editingIngredient, setEditingIngredient] = useState<string | null>(null);

  useEffect(() => {
    setEditableIngredients(ingredients);
  }, [ingredients]);

  const groupedIngredients = editableIngredients.reduce((acc, ingredient) => {
    if (!acc[ingredient.category]) {
      acc[ingredient.category] = [];
    }
    acc[ingredient.category].push(ingredient);
    return acc;
  }, {} as Record<string, any[]>);

  const categoryIcons = {
    produce: '🥬',
    dairy: '🥛',
    meat: '🥩',
    pantry: '🥫',
    frozen: '🧊',
    bakery: '🍞',
    deli: '🧀',
    household: '🧽',
    personal: '🧴',
    other: '📦'
  };

  const updateIngredient = (ingredientIndex: number, field: string, value: any) => {
    const newIngredients = [...editableIngredients];
    let globalIndex = 0;
    
    // Find the global index for this ingredient
    for (const [category, items] of Object.entries(groupedIngredients)) {
      for (let i = 0; i < items.length; i++) {
        if (globalIndex === ingredientIndex) {
          newIngredients[globalIndex] = { ...newIngredients[globalIndex], [field]: value };
          setEditableIngredients(newIngredients);
          return;
        }
        globalIndex++;
      }
    }
  };

  const removeIngredient = (ingredientIndex: number) => {
    const newIngredients = editableIngredients.filter((_, index) => index !== ingredientIndex);
    setEditableIngredients(newIngredients);
  };

  const addCustomIngredient = (category: string) => {
    const newIngredient = {
      name: 'New Item',
      quantity: 1,
      unit: 'pcs',
      category
    };
    setEditableIngredients([...editableIngredients, newIngredient]);
    setEditingIngredient(`${editableIngredients.length}`);
  };

  return (
    <div className="space-y-4">
      {Object.entries(groupedIngredients).map(([category, items]) => (
        <div key={category}>
          <div className="flex items-center justify-between mb-2">
            <h5 className="font-medium text-gray-900 flex items-center space-x-2">
              <span className="text-lg">{categoryIcons[category as keyof typeof categoryIcons]}</span>
              <span className="capitalize">{category}</span>
              <span className="text-sm text-gray-500">({items.length})</span>
            </h5>
            <button
              onClick={() => addCustomIngredient(category)}
              className="text-xs text-blue-600 hover:text-blue-800 flex items-center space-x-1"
            >
              <Plus size={12} />
              <span>Add Item</span>
            </button>
          </div>
          
          <div className="space-y-2">
            {items.map((ingredient, localIndex) => {
              // Calculate global index
              let globalIndex = 0;
              for (const [cat, catItems] of Object.entries(groupedIngredients)) {
                if (cat === category) {
                  globalIndex += localIndex;
                  break;
                }
                globalIndex += catItems.length;
              }
              
              const isEditing = editingIngredient === globalIndex.toString();
              
              return (
                <div key={globalIndex} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg group">
                  <div className="flex-1">
                    {isEditing ? (
                      <div className="grid grid-cols-3 gap-2">
                        <input
                          type="text"
                          value={ingredient.name}
                          onChange={(e) => updateIngredient(globalIndex, 'name', e.target.value)}
                          className="text-sm border rounded px-2 py-1"
                          placeholder="Item name"
                        />
                        <input
                          type="number"
                          value={ingredient.quantity}
                          onChange={(e) => updateIngredient(globalIndex, 'quantity', parseFloat(e.target.value) || 1)}
                          className="text-sm border rounded px-2 py-1"
                          min="0"
                          step="0.1"
                        />
                        <input
                          type="text"
                          value={ingredient.unit}
                          onChange={(e) => updateIngredient(globalIndex, 'unit', e.target.value)}
                          className="text-sm border rounded px-2 py-1"
                          placeholder="Unit"
                        />
                      </div>
                    ) : (
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">{ingredient.name}</span>
                        <span className="text-gray-500">{ingredient.quantity} {ingredient.unit}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {isEditing ? (
                      <button
                        onClick={() => setEditingIngredient(null)}
                        className="p-1 text-green-600 hover:text-green-800"
                        title="Save changes"
                      >
                        <CheckCircle size={14} />
                      </button>
                    ) : (
                      <button
                        onClick={() => setEditingIngredient(globalIndex.toString())}
                        className="p-1 text-blue-600 hover:text-blue-800"
                        title="Edit ingredient"
                      >
                        <Edit3 size={14} />
                      </button>
                    )}
                    <button
                      onClick={() => removeIngredient(globalIndex)}
                      className="p-1 text-red-600 hover:text-red-800"
                      title="Remove ingredient"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
      
      {editableIngredients.length === 0 && (
        <div className="text-center py-6 text-gray-500">
          <ShoppingCart className="h-8 w-8 mx-auto mb-2 text-gray-400" />
          <p className="text-sm">No ingredients needed</p>
        </div>
      )}
    </div>
  );
}

// Add Meal Modal Component
function AddMealModal({ 
  selectedDate, 
  selectedMealType, 
  recipes, 
  mealColumns,
  editingMeal,
  weekStart,
  onClose, 
  onAddMeal,
  onApplyMultipleDays
}: { 
  selectedDate: Date | null;
  selectedMealType: string;
  recipes: Recipe[];
  mealColumns: MealColumn[];
  editingMeal?: MealPlan | null;
  weekStart: Date;
  onClose: () => void;
  onAddMeal: (date: Date, mealType: any, recipeId?: string, customMeal?: string, peopleCount?: number) => void;
  onApplyMultipleDays?: (mealData: any, selectedDayIndices: number[]) => void;
}) {
  const [mealType, setMealType] = useState(selectedMealType);
  const [mealDate, setMealDate] = useState(selectedDate || new Date());
  const [selectedRecipe, setSelectedRecipe] = useState('');
  const [customMeal, setCustomMeal] = useState('');
  const [mealOption, setMealOption] = useState<'existing' | 'custom' | 'import'>('existing');
  const [peopleCount, setPeopleCount] = useState(4);
  const [searchQuery, setSearchQuery] = useState('');
  const [showImportOptions, setShowImportOptions] = useState(false);
  const [importSource, setImportSource] = useState<'youtube' | 'google' | 'chatgpt' | 'text'>('youtube');
  const [importUrl, setImportUrl] = useState('');
  const [importText, setImportText] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  
  // Multi-day selection
  const [showMultiDayOption, setShowMultiDayOption] = useState(false);
  const [selectedDays, setSelectedDays] = useState<boolean[]>(new Array(7).fill(false));

  // Initialize form with editing data
  useEffect(() => {
    if (editingMeal) {
      setMealType(editingMeal.mealType);
      setMealDate(editingMeal.date);
      setPeopleCount(editingMeal.peopleCount || 4);
      
      if (editingMeal.recipeId) {
        setSelectedRecipe(editingMeal.recipeId);
        setMealOption('existing');
      } else if (editingMeal.customMeal) {
        setCustomMeal(editingMeal.customMeal);
        setMealOption('custom');
      }
    } else {
      // Reset form for new meal
      setMealType(selectedMealType);
      setMealDate(selectedDate || new Date());
      setSelectedRecipe('');
      setCustomMeal('');
      setMealOption('existing');
      setPeopleCount(4);
      setShowMultiDayOption(false);
      setSelectedDays(new Array(7).fill(false));
    }
  }, [editingMeal, selectedMealType, selectedDate]);

  // Filter recipes based on search query
  const filteredRecipes = recipes.filter(recipe =>
    recipe.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    recipe.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())) ||
    recipe.cuisine.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Import recipe from external sources
  const handleImportRecipe = async () => {
    if (!importUrl.trim() && !importText.trim()) return;
    
    setIsImporting(true);
    
    try {
      let recipeData: any;
      
      if (importSource === 'text' && importText.trim()) {
        // Parse text recipe (simple implementation)
        recipeData = parseTextRecipe(importText);
      } else if (importUrl.trim()) {
        // Import from URL (YouTube, Google, or ChatGPT)
        recipeData = await importRecipeFromUrl(importUrl, importSource);
      }
      
      if (recipeData) {
        // Create new recipe and add to meal plan
        const newRecipe: Recipe = {
          id: Date.now().toString(),
          name: recipeData.name,
          description: recipeData.description || 'Imported recipe',
          cuisine: recipeData.cuisine || 'other',
          difficulty: recipeData.difficulty || 'medium',
          prepTime: recipeData.prepTime || 20,
          cookTime: recipeData.cookTime || 30,
          servings: recipeData.servings || 4,
          ingredients: recipeData.ingredients || [],
          instructions: recipeData.instructions || [],
          tags: recipeData.tags || ['imported'],
          dietaryRestrictions: recipeData.dietaryRestrictions || [],
          sourceUrl: importUrl || undefined,
          sourceType: importSource === 'text' ? 'manual' : importSource,
          createdAt: new Date()
        };
        
        // Add recipe to recipes list (would need to be passed as prop or context)
        // For now, we'll just add the meal with custom name
        onAddMeal(mealDate, mealType, undefined, newRecipe.name, peopleCount);
        onClose();
      }
    } catch (error) {
      console.error('Import failed:', error);
      alert('Failed to import recipe. Please try again.');
    } finally {
      setIsImporting(false);
    }
  };

  const parseTextRecipe = (text: string) => {
    // Simple text parsing - in a real app, this would be more sophisticated
    const lines = text.split('\n').filter(line => line.trim());
    const name = lines[0] || 'Custom Recipe';
    
    return {
      name,
      description: 'Recipe imported from text',
      ingredients: lines.slice(1, Math.ceil(lines.length / 2)).map((line, index) => ({
        name: line.replace(/^\d+\.?\s*/, ''), // Remove numbers
        amount: 1,
        unit: 'cup',
        category: 'other' as const
      })),
      instructions: lines.slice(Math.ceil(lines.length / 2)).map(line => 
        line.replace(/^\d+\.?\s*/, '') // Remove numbers
      )
    };
  };

  const importRecipeFromUrl = async (url: string, source: string) => {
    // Simulate API call - in real app, this would call backend services
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const urlName = url.includes('youtube') ? 'YouTube Recipe' : 
                   url.includes('google') ? 'Google Recipe' : 
                   'ChatGPT Recipe';
    
    return {
      name: `${urlName} ${Date.now().toString().slice(-4)}`,
      description: `Imported from ${source}`,
      cuisine: 'other',
      ingredients: [
        { name: 'Main Ingredient', amount: 2, unit: 'cups', category: 'other' },
        { name: 'Seasoning', amount: 1, unit: 'tsp', category: 'pantry' }
      ],
      instructions: [
        'Prepare ingredients',
        'Cook according to source',
        'Serve and enjoy'
      ],
      tags: ['imported', source]
    };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if multi-day option is selected
    if (showMultiDayOption && selectedDays.some(Boolean) && onApplyMultipleDays) {
      const selectedDayIndices = selectedDays.map((selected, index) => selected ? index : -1).filter(i => i !== -1);
      
      const mealData = {
        mealType,
        recipeId: mealOption === 'existing' ? selectedRecipe : undefined,
        customMeal: mealOption === 'custom' ? customMeal : undefined,
        peopleCount
      };
      
      onApplyMultipleDays(mealData, selectedDayIndices);
      onClose();
      return;
    }
    
    // Single day meal
    if (mealOption === 'custom' && customMeal.trim()) {
      onAddMeal(mealDate, mealType, undefined, customMeal, peopleCount);
      onClose();
    } else if (mealOption === 'existing' && selectedRecipe) {
      onAddMeal(mealDate, mealType, selectedRecipe, undefined, peopleCount);
      onClose();
    } else if (mealOption === 'import') {
      handleImportRecipe();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-6 w-full max-w-md max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">
            {editingMeal ? 'Edit Meal' : 'Add Meal'}
          </h3>
          <div className="flex items-center space-x-2">
            {!editingMeal && (
              <button
                type="button"
                onClick={() => setShowMultiDayOption(!showMultiDayOption)}
                className={`px-3 py-1 text-xs rounded-full transition-colors ${
                  showMultiDayOption 
                    ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {showMultiDayOption ? 'Single Day' : 'Multi-Day'}
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-md"
            >
              ×
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Date/Multi-day Selection */}
          {showMultiDayOption ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Days for This Week
              </label>
              <div className="grid grid-cols-7 gap-2">
                {WEEKDAYS.map((day, index) => {
                  const currentDate = addDays(weekStart, index);
                  const isTodayDate = isToday(currentDate);
                  
                  return (
                    <label key={day} className="flex flex-col items-center space-y-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedDays[index]}
                        onChange={(e) => {
                          const newSelectedDays = [...selectedDays];
                          newSelectedDays[index] = e.target.checked;
                          setSelectedDays(newSelectedDays);
                        }}
                        className="text-blue-600"
                      />
                      <div className={`text-xs text-center ${isTodayDate ? 'font-bold text-blue-600' : 'text-gray-600'}`}>
                        <div>{day.slice(0, 3)}</div>
                        <div>{format(currentDate, 'M/d')}</div>
                      </div>
                    </label>
                  );
                })}
              </div>
              {selectedDays.some(Boolean) && (
                <p className="text-xs text-gray-500 mt-2">
                  Selected: {selectedDays.reduce((count, selected) => selected ? count + 1 : count, 0)} days
                </p>
              )}
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date
              </label>
              <input
                type="date"
                value={format(mealDate, 'yyyy-MM-dd')}
                onChange={(e) => setMealDate(new Date(e.target.value))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={editingMeal !== null}
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Meal Type
              </label>
              <select
                value={mealType}
                onChange={(e) => setMealType(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {mealColumns.map(column => (
                  <option key={column.id} value={column.id}>
                    {column.icon} {column.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                People Count
              </label>
              <input
                type="number"
                min="1"
                max="20"
                value={peopleCount}
                onChange={(e) => setPeopleCount(parseInt(e.target.value) || 1)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Meal Options
            </label>
            <div className="space-y-3">
              {/* Meal Type Selection */}
              <div className="flex flex-wrap gap-2">
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    checked={mealOption === 'existing'}
                    onChange={() => setMealOption('existing')}
                    className="text-blue-600"
                  />
                  <span className="text-sm">Existing Recipe</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    checked={mealOption === 'custom'}
                    onChange={() => setMealOption('custom')}
                    className="text-blue-600"
                  />
                  <span className="text-sm">Custom Meal</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    checked={mealOption === 'import'}
                    onChange={() => setMealOption('import')}
                    className="text-blue-600"
                  />
                  <span className="text-sm">Import Recipe</span>
                </label>
              </div>

              {/* Existing Recipe Selection */}
              {mealOption === 'existing' && (
                <div className="space-y-3">
                  {/* Search existing recipes */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                    <input
                      type="text"
                      placeholder="Search your recipes..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                  </div>

                  {/* Recipe Selection */}
                  <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-lg">
                    {filteredRecipes.length > 0 ? (
                      <div className="space-y-1 p-2">
                        {filteredRecipes.map(recipe => (
                          <label key={recipe.id} className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer">
                            <input
                              type="radio"
                              name="recipe"
                              value={recipe.id}
                              checked={selectedRecipe === recipe.id}
                              onChange={(e) => setSelectedRecipe(e.target.value)}
                              className="text-blue-600"
                            />
                            <div className="flex-1">
                              <div className="text-sm font-medium text-gray-900">{recipe.name}</div>
                              <div className="text-xs text-gray-500">
                                {CUISINE_ICONS[recipe.cuisine]} {recipe.cuisine} • {recipe.cookTime + recipe.prepTime}min • {recipe.servings} servings
                              </div>
                            </div>
                          </label>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 text-center text-gray-500 text-sm">
                        {searchQuery ? 'No recipes found' : 'No recipes available'}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Custom Meal Input */}
              {mealOption === 'custom' && (
                <input
                  type="text"
                  value={customMeal}
                  onChange={(e) => setCustomMeal(e.target.value)}
                  placeholder="Enter custom meal name"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              )}

              {/* Recipe Import Options */}
              {mealOption === 'import' && (
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setImportSource('youtube')}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                        importSource === 'youtube'
                          ? 'bg-red-100 text-red-700 border border-red-200'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      <Youtube size={12} className="inline mr-1" />
                      YouTube
                    </button>
                    <button
                      type="button"
                      onClick={() => setImportSource('google')}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                        importSource === 'google'
                          ? 'bg-blue-100 text-blue-700 border border-blue-200'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      <Globe size={12} className="inline mr-1" />
                      Google
                    </button>
                    <button
                      type="button"
                      onClick={() => setImportSource('chatgpt')}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                        importSource === 'chatgpt'
                          ? 'bg-green-100 text-green-700 border border-green-200'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      <Zap size={12} className="inline mr-1" />
                      ChatGPT
                    </button>
                    <button
                      type="button"
                      onClick={() => setImportSource('text')}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                        importSource === 'text'
                          ? 'bg-purple-100 text-purple-700 border border-purple-200'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      <FileText size={12} className="inline mr-1" />
                      Text
                    </button>
                  </div>

                  {importSource === 'text' ? (
                    <textarea
                      value={importText}
                      onChange={(e) => setImportText(e.target.value)}
                      placeholder="Paste your recipe text here...&#10;Recipe Name&#10;Ingredients:&#10;- 2 cups flour&#10;- 1 tsp salt&#10;Instructions:&#10;1. Mix ingredients&#10;2. Bake at 350°F"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      rows={4}
                      required
                    />
                  ) : (
                    <input
                      type="url"
                      value={importUrl}
                      onChange={(e) => setImportUrl(e.target.value)}
                      placeholder={`Enter ${importSource} URL...`}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      required
                    />
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 btn-secondary"
              disabled={isImporting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={
                isImporting || 
                (mealOption === 'existing' && !selectedRecipe) || 
                (mealOption === 'custom' && !customMeal.trim()) || 
                (mealOption === 'import' && !importUrl.trim() && !importText.trim()) ||
                (showMultiDayOption && !selectedDays.some(Boolean))
              }
            >
              {isImporting ? (
                <div className="flex items-center space-x-2">
                  <Loader size={16} className="animate-spin" />
                  <span>Importing...</span>
                </div>
              ) : (
                <>
                  {editingMeal ? 'Update Meal' : 
                   showMultiDayOption ? `Add to ${selectedDays.reduce((count, selected) => selected ? count + 1 : count, 0)} Days` :
                   mealOption === 'import' ? 'Import & Add Meal' : 'Add Meal'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Column Customization Modal Component
function ColumnCustomizationModal({ 
  isOpen, 
  columns, 
  onClose, 
  onUpdateColumns, 
  onAddColumn, 
  onRemoveColumn 
}: { 
  isOpen: boolean;
  columns: MealColumn[];
  onClose: () => void;
  onUpdateColumns: (columns: MealColumn[]) => void;
  onAddColumn: (column: Omit<MealColumn, 'id' | 'order'>) => void;
  onRemoveColumn: (columnId: string) => void;
}) {
  const [editedColumns, setEditedColumns] = useState<MealColumn[]>(columns);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newColumn, setNewColumn] = useState({
    name: '',
    defaultServings: 2,
    defaultPeopleCount: 2,
    color: '#6b7280',
    icon: '🍽️'
  });

  useEffect(() => {
    setEditedColumns(columns);
  }, [columns]);

  const handleSave = () => {
    onUpdateColumns(editedColumns);
    onClose();
  };

  const handleAddColumn = () => {
    if (!newColumn.name.trim()) return;
    
    onAddColumn(newColumn);
    setNewColumn({
      name: '',
      defaultServings: 2,
      defaultPeopleCount: 2,
      color: '#6b7280',
      icon: '🍽️'
    });
    setShowAddForm(false);
  };

  const updateColumn = (columnId: string, updates: Partial<MealColumn>) => {
    setEditedColumns(editedColumns.map(col => 
      col.id === columnId ? { ...col, ...updates } : col
    ));
  };

  const moveColumn = (columnId: string, direction: 'up' | 'down') => {
    const sortedColumns = [...editedColumns].sort((a, b) => a.order - b.order);
    const index = sortedColumns.findIndex(col => col.id === columnId);
    
    if (direction === 'up' && index > 0) {
      [sortedColumns[index], sortedColumns[index - 1]] = [sortedColumns[index - 1], sortedColumns[index]];
    } else if (direction === 'down' && index < sortedColumns.length - 1) {
      [sortedColumns[index], sortedColumns[index + 1]] = [sortedColumns[index + 1], sortedColumns[index]];
    }
    
    // Update order values
    const updatedColumns = sortedColumns.map((col, idx) => ({ ...col, order: idx + 1 }));
    setEditedColumns(updatedColumns);
  };

  if (!isOpen) return null;

  const availableIcons = ['🍽️', '☀️', '🥗', '🍽️', '🍿', '🥪', '🍕', '🍜', '🥘', '🍱', '🧁', '☕', '🥤', '🍎', '🥐'];
  const availableColors = [
    '#f97316', // orange
    '#10b981', // green
    '#8b5cf6', // purple
    '#6b7280', // gray
    '#ef4444', // red
    '#3b82f6', // blue
    '#f59e0b', // amber
    '#ec4899', // pink
    '#06b6d4', // cyan
    '#84cc16'  // lime
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-3xl max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h3 className="text-lg font-semibold">Customize Meal Columns</h3>
            <p className="text-sm text-gray-600">Configure your meal planning columns</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-md"
          >
            ×
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(80vh-140px)]">
          <div className="space-y-4">
            {/* Existing Columns */}
            {editedColumns
              .sort((a, b) => a.order - b.order)
              .map((column, index) => (
              <div key={column.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="flex flex-col space-y-1">
                      <button
                        onClick={() => moveColumn(column.id, 'up')}
                        disabled={index === 0}
                        className="p-1 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ArrowUp size={12} />
                      </button>
                      <button
                        onClick={() => moveColumn(column.id, 'down')}
                        disabled={index === editedColumns.length - 1}
                        className="p-1 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ArrowDown size={12} />
                      </button>
                    </div>
                    
                    <div className="text-2xl">{column.icon}</div>
                    <div>
                      <h4 className="font-medium">{column.name}</h4>
                      <p className="text-sm text-gray-500">
                        {column.defaultServings} servings • {column.defaultPeopleCount} people
                      </p>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => onRemoveColumn(column.id)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-md"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Name
                    </label>
                    <input
                      type="text"
                      value={column.name}
                      onChange={(e) => updateColumn(column.id, { name: e.target.value })}
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Icon
                    </label>
                    <select
                      value={column.icon}
                      onChange={(e) => updateColumn(column.id, { icon: e.target.value })}
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                    >
                      {availableIcons.map(icon => (
                        <option key={icon} value={icon}>{icon}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Default Servings
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={column.defaultServings}
                      onChange={(e) => updateColumn(column.id, { defaultServings: parseInt(e.target.value) || 1 })}
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Default People
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={column.defaultPeopleCount}
                      onChange={(e) => updateColumn(column.id, { defaultPeopleCount: parseInt(e.target.value) || 1 })}
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                    />
                  </div>
                </div>
                
                <div className="mt-3">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Color
                  </label>
                  <div className="flex space-x-2">
                    {availableColors.map(color => (
                      <button
                        key={color}
                        onClick={() => updateColumn(column.id, { color })}
                        className={`w-6 h-6 rounded border-2 ${
                          column.color === color ? 'border-gray-900' : 'border-gray-300'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            ))}
            
            {/* Add New Column */}
            {showAddForm ? (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                <h4 className="font-medium mb-3">Add New Column</h4>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Name *
                    </label>
                    <input
                      type="text"
                      value={newColumn.name}
                      onChange={(e) => setNewColumn(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                      placeholder="e.g., Brunch"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Icon
                    </label>
                    <select
                      value={newColumn.icon}
                      onChange={(e) => setNewColumn(prev => ({ ...prev, icon: e.target.value }))}
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                    >
                      {availableIcons.map(icon => (
                        <option key={icon} value={icon}>{icon}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Default Servings
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={newColumn.defaultServings}
                      onChange={(e) => setNewColumn(prev => ({ ...prev, defaultServings: parseInt(e.target.value) || 1 }))}
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Default People
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={newColumn.defaultPeopleCount}
                      onChange={(e) => setNewColumn(prev => ({ ...prev, defaultPeopleCount: parseInt(e.target.value) || 1 }))}
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                    />
                  </div>
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Color
                  </label>
                  <div className="flex space-x-2">
                    {availableColors.map(color => (
                      <button
                        key={color}
                        onClick={() => setNewColumn(prev => ({ ...prev, color }))}
                        className={`w-6 h-6 rounded border-2 ${
                          newColumn.color === color ? 'border-gray-900' : 'border-gray-300'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
                
                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowAddForm(false)}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddColumn}
                    disabled={!newColumn.name.trim()}
                    className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Add Column
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowAddForm(true)}
                className="w-full border-2 border-dashed border-gray-300 rounded-lg p-4 text-gray-600 hover:border-gray-400 hover:text-gray-800 transition-colors"
              >
                <Plus size={20} className="mx-auto mb-2" />
                <div>Add New Meal Column</div>
              </button>
            )}
          </div>
        </div>

        <div className="flex space-x-3 p-6 border-t">
          <button
            onClick={onClose}
            className="flex-1 btn-secondary"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 btn-primary"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}