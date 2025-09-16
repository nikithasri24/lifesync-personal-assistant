import React, { useState, useEffect } from 'react';
import { useRealAppStore } from '../stores/useRealAppStore';
import { 
  Plus, 
  Target, 
  Edit3,
  Trash2,
  Check,
  ChevronDown,
  ChevronRight,
  Clock,
  Bell,
  Calendar,
  MoreVertical,
  Settings,
  X
} from 'lucide-react';
import { format, isToday, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, startOfMonth, endOfMonth, isSameMonth, addMonths, subMonths } from 'date-fns';

const HABIT_COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#eab308',
  '#84cc16', '#22c55e', '#10b981', '#14b8a6',
  '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1',
  '#8b5cf6', '#a855f7', '#d946ef', '#ec4899'
];

interface HabitFormData {
  name: string;
  description: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'custom';
  customFrequency?: {
    type: 'every-x-days' | 'specific-days' | 'x-times-per-week' | 'x-times-per-month';
    interval?: number;
    daysOfWeek?: number[];
    timesPerPeriod?: number;
  };
  targetCount: number;
  goalMode: 'daily-target' | 'total-goal' | 'course-completion';
  goalTarget?: number;
  goalUnit?: string;
  categoryId: string;
  color: string;
  reminder?: {
    enabled: boolean;
    time: string;
    days: number[];
    title: string;
    message?: string;
    sound?: boolean;
  };
}

interface CategoryFormData {
  name: string;
  description: string;
  color: string;
  icon: string;
}

export default function Habits() {
  const { 
    habitCategories, 
    habits, 
    addHabit, 
    updateHabit, 
    deleteHabit, 
    completeHabit
  } = useRealAppStore();

  const [showHabitForm, setShowHabitForm] = useState(false);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [editingHabit, setEditingHabit] = useState<string | null>(null);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const [habitFormData, setHabitFormData] = useState<HabitFormData>({
    name: '',
    description: '',
    frequency: 'daily',
    customFrequency: {
      type: 'every-x-days',
      interval: 1,
      daysOfWeek: [],
      timesPerPeriod: 1
    },
    targetCount: 1,
    goalMode: 'daily-target',
    goalTarget: undefined,
    goalUnit: 'tablets',
    categoryId: '',
    color: HABIT_COLORS[0],
    reminder: {
      enabled: false,
      time: '09:00',
      days: [1, 2, 3, 4, 5], // Monday to Friday
      title: '',
      message: '',
      sound: true
    }
  });

  const [categoryFormData, setCategoryFormData] = useState<CategoryFormData>({
    name: '',
    description: '',
    color: '#22c55e',
    icon: '💊'
  });

  // Handle escape key to close modals
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (showHabitForm) {
          setShowHabitForm(false);
          setEditingHabit(null);
          resetHabitForm();
        }
        if (showCategoryForm) {
          setShowCategoryForm(false);
          setEditingCategory(null);
          resetCategoryForm();
        }
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [showHabitForm, showCategoryForm]);

  // Week days for progress display
  const weekDays = eachDayOfInterval({
    start: startOfWeek(new Date()),
    end: endOfWeek(new Date())
  });

  const handleHabitSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingHabit) {
      // Convert form data to habit updates format
      const habitUpdates = {
        name: habitFormData.name,
        description: habitFormData.description,
        frequency: habitFormData.frequency,
        customFrequency: habitFormData.customFrequency,
        targetCount: habitFormData.targetCount,
        goalMode: habitFormData.goalMode,
        goalTarget: habitFormData.goalTarget,
        goalUnit: habitFormData.goalUnit,
        categoryId: habitFormData.categoryId,
        color: habitFormData.color,
        reminder: habitFormData.reminderEnabled ? {
          enabled: habitFormData.reminderEnabled,
          time: habitFormData.reminderTime,
          days: [1, 2, 3, 4, 5, 6, 7], // Default to all days
          title: `${habitFormData.name} reminder`
        } : undefined
      };
      updateHabit(editingHabit, habitUpdates);
      setEditingHabit(null);
    } else {
      addHabit(habitFormData);
    }
    setShowHabitForm(false);
    resetHabitForm();
  };

  const handleCategorySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement category functions in useRealAppStore
    // if (editingCategory) {
    //   updateHabitCategory(editingCategory, categoryFormData);
    //   setEditingCategory(null);
    // } else {
    //   addHabitCategory(categoryFormData);
    // }
    console.log('Category operations not yet implemented in real store');
    setShowCategoryForm(false);
    resetCategoryForm();
  };

  const resetHabitForm = () => {
    setHabitFormData({
      name: '',
      description: '',
      frequency: 'daily',
      customFrequency: {
        type: 'every-x-days',
        interval: 1,
        daysOfWeek: [],
        timesPerPeriod: 1
      },
      targetCount: 1,
      goalMode: 'daily-target',
      goalTarget: undefined,
      goalUnit: 'tablets',
      categoryId: '',
      color: HABIT_COLORS[0],
      reminder: {
        enabled: false,
        time: '09:00',
        days: [1, 2, 3, 4, 5],
        title: '',
        message: '',
        sound: true
      }
    });
  };

  const resetCategoryForm = () => {
    setCategoryFormData({
      name: '',
      description: '',
      color: '#22c55e',
      icon: '💊'
    });
  };

  const handleEditHabit = (habit: any) => {
    setHabitFormData({
      name: habit.name,
      description: habit.description || '',
      frequency: habit.frequency,
      customFrequency: habit.customFrequency || {
        type: 'every-x-days',
        interval: 1,
        daysOfWeek: [],
        timesPerPeriod: 1
      },
      targetCount: habit.targetCount,
      goalMode: habit.goalMode || 'daily-target',
      goalTarget: habit.goalTarget,
      goalUnit: habit.goalUnit || 'tablets',
      categoryId: habit.categoryId,
      color: habit.color,
      reminder: habit.reminder || {
        enabled: false,
        time: '09:00',
        days: [1, 2, 3, 4, 5],
        title: habit.name,
        message: `Time to ${habit.name.toLowerCase()}!`,
        sound: true
      }
    });
    setEditingHabit(habit.id);
    setShowHabitForm(true);
  };

  const handleEditCategory = (category: any) => {
    setCategoryFormData({
      name: category.name,
      description: category.description || '',
      color: category.color,
      icon: category.icon || '💊'
    });
    setEditingCategory(category.id);
    setShowCategoryForm(true);
  };

  const getHabitsInCategory = (categoryId: string) => {
    return habits.filter(habit => habit.categoryId === categoryId);
  };

  const getTodayCompletions = (habit: any) => {
    return habit.completions.filter((completion: any) =>
      isToday(new Date(completion.completedAt))
    ).length;
  };

  const isHabitCompleteToday = (habit: any) => {
    const todayCompletions = getTodayCompletions(habit);
    return todayCompletions >= habit.targetCount;
  };

  // Demo notification function
  const showNotification = (habit: any) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(`🔔 Habit Reminder: ${habit.name}`, {
        body: habit.reminder?.message || `Time to ${habit.name.toLowerCase()}!`,
        icon: '/favicon.ico'
      });
    }
  };

  const requestNotificationPermission = async () => {
    if ('Notification' in window && Notification.permission !== 'granted') {
      await Notification.requestPermission();
    }
  };

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Calendar view helpers
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const getHabitsForDate = (date: Date) => {
    return habits.filter(habit => {
      if (habit.frequency === 'daily') return true;
      if (habit.frequency === 'weekly') {
        // Simple weekly check - could be enhanced based on habit start date
        return true;
      }
      if (habit.frequency === 'monthly') {
        // Simple monthly check - could be enhanced
        return date.getDate() === 1; // Show on first day of month for simplicity
      }
      if (habit.frequency === 'custom' && habit.customFrequency) {
        const cf = habit.customFrequency;
        if (cf.type === 'specific-days') {
          return cf.daysOfWeek?.includes(date.getDay()) || false;
        }
        if (cf.type === 'every-x-days') {
          // Simplified - would need habit start date for proper calculation
          return true;
        }
        return true;
      }
      return false;
    });
  };

  const getCompletionsForDate = (habit: any, date: Date) => {
    return habit.completions.filter((completion: any) =>
      isSameDay(new Date(completion.completedAt), date)
    ).length;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Habits</h1>
          <p className="text-gray-600">Build consistent routines with organized categories</p>
        </div>
        <div className="flex space-x-3">
          {/* View Toggle */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'list'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              List
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'calendar'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Calendar
            </button>
          </div>
          
          <button
            onClick={() => setShowCategoryForm(true)}
            className="btn-secondary flex items-center space-x-2"
          >
            <Plus size={20} />
            <span>Add Category</span>
          </button>
          <button
            onClick={requestNotificationPermission}
            className="btn-secondary flex items-center space-x-2"
          >
            <Bell size={20} />
            <span>Enable Notifications</span>
          </button>
        </div>
      </div>

      {/* Content - List or Calendar View */}
      {viewMode === 'list' ? (
        /* List View */
        habitCategories.length === 0 ? (
          <div className="text-center py-12">
            <Target className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No habit categories yet</h3>
            <p className="mt-1 text-sm text-gray-500">Create your first category to organize your habits.</p>
            <div className="mt-6">
              <button
                onClick={() => setShowCategoryForm(true)}
                className="btn-primary"
              >
                <Plus className="mr-2" size={16} />
                Add your first category
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {habitCategories.map((category) => {
              const categoryHabits = getHabitsInCategory(category.id);
              
              return (
                <div key={category.id} className="card">
                  {/* Category Header */}
                  <div className="flex items-center justify-between pb-4 border-b border-gray-200">
                    <div className="flex items-center space-x-4">
                      <button
                        onClick={() => {
                          // TODO: Implement toggleCategoryCollapse in useRealAppStore
                          console.log('Toggle category collapse not yet implemented');
                        }}
                        className="p-1 hover:bg-gray-100 rounded-md transition-colors"
                      >
                        {category.collapsed ? 
                          <ChevronRight size={20} className="text-gray-500" /> : 
                          <ChevronDown size={20} className="text-gray-500" />
                        }
                      </button>
                      
                      <div className="flex items-center space-x-3">
                        <div 
                          className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-semibold text-lg"
                          style={{ backgroundColor: category.color }}
                        >
                          {category.icon}
                        </div>
                        <div>
                          <h2 className="text-lg font-semibold text-gray-900">{category.name}</h2>
                          <p className="text-sm text-gray-600">{category.description}</p>
                          <span className="text-xs text-gray-500">{categoryHabits.length} habits</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          setSelectedCategoryId(category.id);
                          setHabitFormData(prev => ({ ...prev, categoryId: category.id }));
                          setShowHabitForm(true);
                        }}
                        className="btn-secondary text-sm flex items-center space-x-1"
                      >
                        <Plus size={16} />
                        <span>Add Habit</span>
                      </button>
                      
                      <button
                        onClick={() => handleEditCategory(category)}
                        className="p-2 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100"
                      >
                        <Settings size={16} />
                      </button>

                      <button
                        onClick={() => {
                          // TODO: Implement deleteHabitCategory in useRealAppStore
                          console.log('Delete category not yet implemented');
                        }}
                        className="p-2 text-gray-400 hover:text-red-600 rounded-md hover:bg-gray-100"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Habits in Category */}
                  {!category.collapsed && (
                    <div className="pt-4">
                      {categoryHabits.length === 0 ? (
                        <div className="text-center py-8">
                          <Target className="mx-auto h-8 w-8 text-gray-400" />
                          <p className="mt-2 text-sm text-gray-500">No habits in this category yet</p>
                          <button
                            onClick={() => {
                              setSelectedCategoryId(category.id);
                              setHabitFormData(prev => ({ ...prev, categoryId: category.id }));
                              setShowHabitForm(true);
                            }}
                            className="mt-2 text-sm text-primary-600 hover:text-primary-700"
                          >
                            Add your first habit
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {categoryHabits.map((habit) => {
                            const todayCompletions = getTodayCompletions(habit);
                            const isComplete = isHabitCompleteToday(habit);
                            
                            return (
                              <div
                                key={habit.id}
                                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                              >
                                <div className="flex items-center space-x-4 flex-1">
                                  <div 
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: habit.color }}
                                  />
                                  
                                  <div className="flex-1">
                                    <div className="flex items-center space-x-3">
                                      <h3 className="font-medium text-gray-900">{habit.name}</h3>
                                      {habit.reminder?.enabled && (
                                        <div className="flex items-center space-x-1 text-xs text-gray-500">
                                          <Bell size={12} />
                                          <span>{habit.reminder.time}</span>
                                        </div>
                                      )}
                                    </div>
                                    
                                    {habit.description && (
                                      <p className="text-sm text-gray-600 mt-1">{habit.description}</p>
                                    )}
                                    
                                    <div className="flex items-center space-x-4 mt-2">
                                      <span className="text-xs text-gray-500 capitalize">
                                        {habit.frequency}
                                        {habit.goalMode === 'daily-target' && ` • Target: ${habit.targetCount}x`}
                                      </span>
                                      
                                      {habit.goalMode === 'daily-target' && (
                                        <span className="text-xs text-gray-600">
                                          Today: {todayCompletions}/{habit.targetCount}
                                        </span>
                                      )}
                                      
                                      {(habit.goalMode === 'total-goal' || habit.goalMode === 'course-completion') && (
                                        <span className="text-xs text-gray-600">
                                          Progress: {habit.currentProgress || 0}/{habit.goalTarget || 0} {habit.goalUnit || 'items'}
                                        </span>
                                      )}
                                    </div>
                                    
                                    {(habit.goalMode === 'total-goal' || habit.goalMode === 'course-completion') && (
                                      <div className="mt-2">
                                        <div className="flex items-center justify-between mb-1">
                                          <span className="text-xs text-gray-500">
                                            {Math.round(((habit.currentProgress || 0) / (habit.goalTarget || 1)) * 100)}% complete
                                          </span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                          <div 
                                            className="h-2 rounded-full transition-all duration-300"
                                            style={{ 
                                              backgroundColor: habit.color,
                                              width: `${Math.min(100, ((habit.currentProgress || 0) / (habit.goalTarget || 1)) * 100)}%`
                                            }}
                                          />
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* Week Progress */}
                                <div className="hidden md:flex space-x-1 mx-4">
                                  {weekDays.map((day, index) => {
                                    const dayCompletions = habit.completions.filter((completion: any) => {
                                      const completionDate = new Date(completion.completedAt);
                                      return isSameDay(completionDate, day);
                                    }).length;
                                    
                                    const dayCompleted = dayCompletions >= habit.targetCount;
                                    const isToday = isSameDay(day, new Date());
                                    const isFuture = day.getTime() > new Date().setHours(23, 59, 59, 999);
                                    
                                    return (
                                      <button
                                        key={index}
                                        onClick={() => {
                                          const today = new Date();
                                          today.setHours(23, 59, 59, 999); // End of today
                                          if (!dayCompleted && day.getTime() <= today.getTime()) {
                                            // Only allow completing today and previous days, not future days or already completed days
                                            completeHabitForDate(habit.id, day);
                                          }
                                        }}
                                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium border-2 transition-all ${
                                          dayCompleted
                                            ? 'border-green-500 text-green-700'
                                            : isFuture
                                            ? 'border-gray-200 text-gray-300 cursor-not-allowed'
                                            : isToday
                                            ? 'border-blue-400 text-blue-600 hover:border-blue-500 hover:bg-blue-50 cursor-pointer'
                                            : 'border-gray-200 text-gray-400 hover:border-gray-300 hover:bg-gray-50 cursor-pointer'
                                        }`}
                                        style={{
                                          backgroundColor: dayCompleted ? habit.color : 'transparent'
                                        }}
                                        title={`${format(day, 'MMM dd')} - ${dayCompletions} completions${!dayCompleted && !isFuture ? ' (click to mark complete)' : ''}`}
                                        disabled={dayCompleted || isFuture}
                                      >
                                        {dayCompleted && <Check size={12} className="text-white" />}
                                      </button>
                                    );
                                  })}
                                </div>

                                {/* Actions */}
                                <div className="flex items-center space-x-2">
                                  {habit.reminder?.enabled && (
                                    <button
                                      onClick={() => showNotification(habit)}
                                      className="p-2 text-gray-400 hover:text-blue-600 rounded-md hover:bg-blue-50"
                                      title="Test notification"
                                    >
                                      <Bell size={16} />
                                    </button>
                                  )}
                                  
                                  <button
                                    onClick={() => completeHabit(habit.id)}
                                    disabled={isComplete}
                                    className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                                      isComplete
                                        ? 'bg-green-100 text-green-800 cursor-not-allowed'
                                        : 'bg-primary-50 text-primary-700 hover:bg-primary-100'
                                    }`}
                                  >
                                    {isComplete ? 'Done!' : 'Complete'}
                                  </button>

                                  <button
                                    onClick={() => handleEditHabit(habit)}
                                    className="p-2 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100"
                                  >
                                    <Edit3 size={16} />
                                  </button>

                                  <button
                                    onClick={() => deleteHabit(habit.id)}
                                    className="p-2 text-gray-400 hover:text-red-600 rounded-md hover:bg-gray-100"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )
      ) : (
        /* Calendar View */
        <div className="card">
          {/* Calendar Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setCurrentDate(subMonths(currentDate, 1))}
                className="p-2 hover:bg-gray-100 rounded-md transition-colors"
              >
                <ChevronRight size={20} className="text-gray-500 transform rotate-180" />
              </button>
              
              <h2 className="text-xl font-semibold text-gray-900">
                {format(currentDate, 'MMMM yyyy')}
              </h2>
              
              <button
                onClick={() => setCurrentDate(addMonths(currentDate, 1))}
                className="p-2 hover:bg-gray-100 rounded-md transition-colors"
              >
                <ChevronRight size={20} className="text-gray-500" />
              </button>
            </div>
            
            <button
              onClick={() => setCurrentDate(new Date())}
              className="btn-secondary text-sm"
            >
              Today
            </button>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Day Headers */}
            {dayNames.map(day => (
              <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
                {day}
              </div>
            ))}
            
            {/* Calendar Days */}
            {calendarDays.map((day, index) => {
              const dayHabits = getHabitsForDate(day);
              const isCurrentMonth = isSameMonth(day, currentDate);
              const isDayToday = isToday(day);
              
              return (
                <div
                  key={index}
                  className={`p-1 min-h-[100px] border border-gray-100 ${
                    isCurrentMonth ? 'bg-white' : 'bg-gray-50'
                  } ${isDayToday ? 'bg-blue-50 border-blue-200' : ''}`}
                >
                  <div className={`text-sm font-medium mb-2 ${
                    isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
                  } ${isDayToday ? 'text-blue-600' : ''}`}>
                    {format(day, 'd')}
                  </div>
                  
                  <div className="space-y-1">
                    {dayHabits.slice(0, 3).map(habit => {
                      const completions = getCompletionsForDate(habit, day);
                      const isCompleted = completions >= habit.targetCount;
                      
                      return (
                        <div
                          key={habit.id}
                          className={`text-xs p-1 rounded truncate ${
                            isCompleted 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-600'
                          }`}
                          style={{
                            borderLeft: `3px solid ${habit.color}`
                          }}
                          title={`${habit.name} - ${completions}/${habit.targetCount}`}
                        >
                          {habit.name}
                        </div>
                      );
                    })}
                    
                    {dayHabits.length > 3 && (
                      <div className="text-xs text-gray-500 p-1">
                        +{dayHabits.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Habit Form Modal */}
      {showHabitForm && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowHabitForm(false);
              setEditingHabit(null);
              resetHabitForm();
            }
          }}
        >
          <div className="bg-white rounded-xl p-6 w-full max-w-lg max-h-[80vh] overflow-y-auto my-8 relative">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                {editingHabit ? 'Edit Habit' : 'Add New Habit'}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setShowHabitForm(false);
                  setEditingHabit(null);
                  resetHabitForm();
                }}
                className="p-2 hover:bg-gray-100 rounded-md transition-colors"
                aria-label="Close modal"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>
            <form onSubmit={handleHabitSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Habit Name
                </label>
                <input
                  type="text"
                  value={habitFormData.name}
                  onChange={(e) => setHabitFormData({ ...habitFormData, name: e.target.value })}
                  className="input-field"
                  placeholder="e.g., Vitamin B12, Daily Workout, Read 30 minutes"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description (Optional)
                </label>
                <textarea
                  value={habitFormData.description}
                  onChange={(e) => setHabitFormData({ ...habitFormData, description: e.target.value })}
                  className="input-field"
                  rows={2}
                  placeholder="Add more details about this habit..."
                />
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Frequency
                  </label>
                  <select
                    value={habitFormData.frequency}
                    onChange={(e) => setHabitFormData({ ...habitFormData, frequency: e.target.value as any })}
                    className="input-field"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>

                {/* Custom Frequency Options */}
                {habitFormData.frequency === 'custom' && (
                  <div className="bg-gray-50 p-4 rounded-lg space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Custom Pattern
                      </label>
                      <select
                        value={habitFormData.customFrequency?.type || 'every-x-days'}
                        onChange={(e) => setHabitFormData({
                          ...habitFormData,
                          customFrequency: {
                            ...habitFormData.customFrequency!,
                            type: e.target.value as any
                          }
                        })}
                        className="input-field"
                      >
                        <option value="every-x-days">Every X days</option>
                        <option value="specific-days">Specific days of week</option>
                        <option value="x-times-per-week">X times per week</option>
                        <option value="x-times-per-month">X times per month</option>
                      </select>
                    </div>

                    {/* Every X Days */}
                    {habitFormData.customFrequency?.type === 'every-x-days' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Every
                        </label>
                        <div className="flex items-center space-x-2">
                          <input
                            type="number"
                            value={habitFormData.customFrequency?.interval || 1}
                            onChange={(e) => setHabitFormData({
                              ...habitFormData,
                              customFrequency: {
                                ...habitFormData.customFrequency!,
                                interval: parseInt(e.target.value) || 1
                              }
                            })}
                            className="input-field w-20"
                            min="1"
                          />
                          <span className="text-sm text-gray-600">days</span>
                        </div>
                      </div>
                    )}

                    {/* Specific Days */}
                    {habitFormData.customFrequency?.type === 'specific-days' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Days of Week
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {dayNames.map((day, index) => (
                            <button
                              key={index}
                              type="button"
                              onClick={() => {
                                const days = habitFormData.customFrequency?.daysOfWeek || [];
                                const newDays = days.includes(index)
                                  ? days.filter(d => d !== index)
                                  : [...days, index];
                                setHabitFormData({
                                  ...habitFormData,
                                  customFrequency: {
                                    ...habitFormData.customFrequency!,
                                    daysOfWeek: newDays
                                  }
                                });
                              }}
                              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                                habitFormData.customFrequency?.daysOfWeek?.includes(index)
                                  ? 'bg-primary-100 text-primary-700 border border-primary-200'
                                  : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
                              }`}
                            >
                              {day}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* X Times Per Period */}
                    {(habitFormData.customFrequency?.type === 'x-times-per-week' || habitFormData.customFrequency?.type === 'x-times-per-month') && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Number of times
                        </label>
                        <div className="flex items-center space-x-2">
                          <input
                            type="number"
                            value={habitFormData.customFrequency?.timesPerPeriod || 1}
                            onChange={(e) => setHabitFormData({
                              ...habitFormData,
                              customFrequency: {
                                ...habitFormData.customFrequency!,
                                timesPerPeriod: parseInt(e.target.value) || 1
                              }
                            })}
                            className="input-field w-20"
                            min="1"
                          />
                          <span className="text-sm text-gray-600">
                            times per {habitFormData.customFrequency?.type === 'x-times-per-week' ? 'week' : 'month'}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Goal Type
                  </label>
                  <select
                    value={habitFormData.goalMode}
                    onChange={(e) => setHabitFormData({ ...habitFormData, goalMode: e.target.value as any })}
                    className="input-field mb-4"
                  >
                    <option value="daily-target">Daily Target (e.g., 1 vitamin per day)</option>
                    <option value="total-goal">Total Goal (e.g., 12 tablets total)</option>
                    <option value="course-completion">Course Completion (e.g., finish a course)</option>
                  </select>

                  {habitFormData.goalMode === 'daily-target' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Daily Target Count
                      </label>
                      <div className="flex items-center space-x-3">
                        <input
                          type="number"
                          value={habitFormData.targetCount}
                          onChange={(e) => setHabitFormData({ ...habitFormData, targetCount: parseInt(e.target.value) || 1 })}
                          className="input-field flex-1"
                          min="1"
                          max="20"
                        />
                        <div className="flex items-center border border-gray-200 rounded-lg">
                          <button
                            type="button"
                            onClick={() => setHabitFormData({ 
                              ...habitFormData, 
                              targetCount: Math.max(1, habitFormData.targetCount - 1) 
                            })}
                            className="p-2 hover:bg-gray-100 text-gray-600"
                          >
                            -
                          </button>
                          <span className="px-3 py-2 text-sm font-medium min-w-[3rem] text-center">
                            {habitFormData.targetCount}
                          </span>
                          <button
                            type="button"
                            onClick={() => setHabitFormData({ 
                              ...habitFormData, 
                              targetCount: Math.min(20, habitFormData.targetCount + 1) 
                            })}
                            className="p-2 hover:bg-gray-100 text-gray-600"
                          >
                            +
                          </button>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        How many times should this habit be completed each day?
                      </p>
                    </div>
                  )}

                  {(habitFormData.goalMode === 'total-goal' || habitFormData.goalMode === 'course-completion') && (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {habitFormData.goalMode === 'total-goal' ? 'Total Goal' : 'Course Goal'}
                        </label>
                        <div className="flex items-center space-x-2">
                          <input
                            type="number"
                            value={habitFormData.goalTarget ?? ''}
                            onChange={(e) => {
                              const value = e.target.value;
                              if (value === '') {
                                setHabitFormData({ ...habitFormData, goalTarget: undefined });
                              } else {
                                const numValue = parseInt(value);
                                if (!isNaN(numValue) && numValue >= 0) {
                                  setHabitFormData({ ...habitFormData, goalTarget: numValue });
                                }
                              }
                            }}
                            className="input-field w-24"
                            min="0"
                            max="999"
                            placeholder="0"
                          />
                          <input
                            type="text"
                            value={habitFormData.goalUnit || 'tablets'}
                            onChange={(e) => setHabitFormData({ ...habitFormData, goalUnit: e.target.value })}
                            className="input-field flex-1"
                            placeholder="tablets, sessions, chapters, etc."
                          />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {habitFormData.goalMode === 'total-goal' 
                            ? 'Total number to complete (e.g., 12 tablets for a vitamin course)'
                            : 'Total to complete for this course (e.g., 30 lessons, 10 chapters)'
                          }
                        </p>
                      </div>
                      
                      {habitFormData.frequency !== 'daily' && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Per Session Count
                          </label>
                          <input
                            type="number"
                            value={habitFormData.targetCount}
                            onChange={(e) => setHabitFormData({ ...habitFormData, targetCount: parseInt(e.target.value) || 1 })}
                            className="input-field w-24"
                            min="1"
                            max="20"
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            How many {habitFormData.goalUnit || 'items'} per session?
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  value={habitFormData.categoryId}
                  onChange={(e) => setHabitFormData({ ...habitFormData, categoryId: e.target.value })}
                  className="input-field"
                  required
                >
                  <option value="">Select a category</option>
                  {habitCategories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.icon} {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Color
                </label>
                <div className="flex flex-wrap gap-3">
                  {HABIT_COLORS.map(color => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setHabitFormData({ ...habitFormData, color })}
                      className={`w-10 h-10 rounded-xl border-2 transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent-primary ${
                        habitFormData.color === color 
                          ? 'border-gray-900 shadow-lg scale-110' 
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                      style={{ backgroundColor: color }}
                      title={`Select color: ${color}`}
                      aria-label={`Select color ${color}`}
                    >
                      {habitFormData.color === color && (
                        <div className="w-full h-full flex items-center justify-center">
                          <div className="w-3 h-3 bg-white rounded-full shadow-sm"></div>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Reminder Settings */}
              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium text-gray-700">
                    Daily Reminder
                  </label>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={habitFormData.reminder?.enabled || false}
                      onChange={(e) => setHabitFormData({
                        ...habitFormData,
                        reminder: {
                          ...habitFormData.reminder!,
                          enabled: e.target.checked,
                          title: habitFormData.reminder?.title || habitFormData.name
                        }
                      })}
                      className="sr-only"
                    />
                    <div className={`w-11 h-6 rounded-full transition-colors ${
                      habitFormData.reminder?.enabled ? 'bg-primary-600' : 'bg-gray-200'
                    }`}>
                      <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${
                        habitFormData.reminder?.enabled ? 'translate-x-5' : 'translate-x-0.5'
                      } mt-0.5`} />
                    </div>
                  </label>
                </div>

                {habitFormData.reminder?.enabled && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Reminder Time
                      </label>
                      <input
                        type="time"
                        value={habitFormData.reminder.time}
                        onChange={(e) => setHabitFormData({
                          ...habitFormData,
                          reminder: { ...habitFormData.reminder!, time: e.target.value }
                        })}
                        className="input-field"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Reminder Days
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {dayNames.map((day, index) => (
                          <button
                            key={index}
                            type="button"
                            onClick={() => {
                              const days = habitFormData.reminder?.days || [];
                              const newDays = days.includes(index)
                                ? days.filter(d => d !== index)
                                : [...days, index];
                              setHabitFormData({
                                ...habitFormData,
                                reminder: { ...habitFormData.reminder!, days: newDays }
                              });
                            }}
                            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                              habitFormData.reminder?.days?.includes(index)
                                ? 'bg-primary-100 text-primary-700 border border-primary-200'
                                : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
                            }`}
                          >
                            {day}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Custom Message (Optional)
                      </label>
                      <input
                        type="text"
                        value={habitFormData.reminder.message || ''}
                        onChange={(e) => setHabitFormData({
                          ...habitFormData,
                          reminder: { ...habitFormData.reminder!, message: e.target.value }
                        })}
                        className="input-field"
                        placeholder={`Time to ${habitFormData.name.toLowerCase()}!`}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowHabitForm(false);
                    setEditingHabit(null);
                    resetHabitForm();
                  }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {editingHabit ? 'Update' : 'Create'} Habit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Category Form Modal */}
      {showCategoryForm && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowCategoryForm(false);
              setEditingCategory(null);
              resetCategoryForm();
            }
          }}
        >
          <div className="bg-white rounded-xl p-6 w-full max-w-md max-h-[80vh] overflow-y-auto my-8 relative">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                {editingCategory ? 'Edit Category' : 'Add New Category'}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setShowCategoryForm(false);
                  setEditingCategory(null);
                  resetCategoryForm();
                }}
                className="p-2 hover:bg-gray-100 rounded-md transition-colors"
                aria-label="Close modal"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>
            <form onSubmit={handleCategorySubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category Name
                </label>
                <input
                  type="text"
                  value={categoryFormData.name}
                  onChange={(e) => setCategoryFormData({ ...categoryFormData, name: e.target.value })}
                  className="input-field"
                  placeholder="e.g., Supplements, Workouts, Reading"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={categoryFormData.description}
                  onChange={(e) => setCategoryFormData({ ...categoryFormData, description: e.target.value })}
                  className="input-field"
                  rows={2}
                  placeholder="Describe this category..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Icon (Emoji)
                </label>
                <input
                  type="text"
                  value={categoryFormData.icon}
                  onChange={(e) => setCategoryFormData({ ...categoryFormData, icon: e.target.value })}
                  className="input-field"
                  placeholder="💊"
                  maxLength={2}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Color
                </label>
                <div className="flex flex-wrap gap-3">
                  {HABIT_COLORS.map(color => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setCategoryFormData({ ...categoryFormData, color })}
                      className={`w-10 h-10 rounded-xl border-2 transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent-primary ${
                        categoryFormData.color === color 
                          ? 'border-gray-900 shadow-lg scale-110' 
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                      style={{ backgroundColor: color }}
                      title={`Select color: ${color}`}
                      aria-label={`Select color ${color}`}
                    >
                      {categoryFormData.color === color && (
                        <div className="w-full h-full flex items-center justify-center">
                          <div className="w-3 h-3 bg-white rounded-full shadow-sm"></div>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCategoryForm(false);
                    setEditingCategory(null);
                    resetCategoryForm();
                  }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {editingCategory ? 'Update' : 'Create'} Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}