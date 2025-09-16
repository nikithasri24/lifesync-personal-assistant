import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Calendar,
  Settings,
  ChevronLeft,
  ChevronRight,
  Edit3,
  Trash2,
  Star,
  Copy,
  Download,
  Share2,
  Grid3X3,
  BookOpen,
  Clock,
  TrendingUp,
  Target,
  Heart,
  Smile,
  Coffee,
  Home,
  Briefcase,
  Users,
  Lightbulb,
  Activity,
  Moon,
  Sun,
  CheckCircle,
  X,
  MoreHorizontal,
  Filter,
  RotateCcw,
  Archive,
  Eye,
  EyeOff,
  Bell,
  BarChart3
} from 'lucide-react';
import { format, isToday, isYesterday, addDays, subDays, startOfWeek, endOfWeek, isSameDay } from 'date-fns';
import { useAppStore } from '../stores/useAppStore';

interface GridEntry {
  id: string;
  date: Date;
  prompts: {
    [key: string]: string;
  };
  mood?: number; // 1-5 scale
  completedPrompts: number;
  totalPrompts: number;
  createdAt: Date;
  updatedAt: Date;
  isCompleted: boolean;
  isFavorite: boolean;
}

interface GridTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: React.ComponentType<any>;
  color: string;
  prompts: {
    id: string;
    question: string;
    placeholder: string;
    required?: boolean;
    type?: 'text' | 'number' | 'scale';
    maxLength?: number;
  }[];
}

const GRID_TEMPLATES: GridTemplate[] = [
  {
    id: 'daily-reflection',
    name: 'Daily Reflection',
    description: 'Reflect on your day with guided questions',
    category: 'Personal',
    icon: BookOpen,
    color: '#3B82F6',
    prompts: [
      { id: '1', question: 'What was the best part of your day?', placeholder: 'The highlight that made you smile...', required: true },
      { id: '2', question: 'What challenged you today?', placeholder: 'Something that pushed you out of your comfort zone...' },
      { id: '3', question: 'What are you grateful for?', placeholder: 'Three things you appreciate today...' },
      { id: '4', question: 'How did you grow today?', placeholder: 'What did you learn or improve...' },
      { id: '5', question: 'What would you do differently?', placeholder: 'If you could replay today...' },
      { id: '6', question: 'Tomorrow, I want to...', placeholder: 'Your intention for tomorrow...' }
    ]
  },
  {
    id: 'productivity',
    name: 'Productivity Tracker',
    description: 'Track your daily productivity and achievements',
    category: 'Work',
    icon: Target,
    color: '#10B981',
    prompts: [
      { id: '1', question: 'Top 3 accomplishments today:', placeholder: 'What did you complete or achieve?', required: true },
      { id: '2', question: 'Biggest challenge faced:', placeholder: 'What obstacle did you encounter?' },
      { id: '3', question: 'Time wasted on:', placeholder: 'What distracted you or wasn\'t productive?' },
      { id: '4', question: 'Energy level (1-10):', placeholder: '1 = exhausted, 10 = energized', type: 'scale' },
      { id: '5', question: 'Focus quality (1-10):', placeholder: '1 = scattered, 10 = laser focused', type: 'scale' },
      { id: '6', question: 'Tomorrow\'s priority:', placeholder: 'Most important task for tomorrow' }
    ]
  },
  {
    id: 'wellness',
    name: 'Wellness Check',
    description: 'Monitor your physical and mental well-being',
    category: 'Health',
    icon: Heart,
    color: '#EF4444',
    prompts: [
      { id: '1', question: 'How did you nourish your body?', placeholder: 'Food, water, exercise, rest...', required: true },
      { id: '2', question: 'How did you move today?', placeholder: 'Exercise, walks, stretching...' },
      { id: '3', question: 'Stress level (1-10):', placeholder: '1 = completely calm, 10 = overwhelmed', type: 'scale' },
      { id: '4', question: 'Sleep quality last night:', placeholder: 'How well did you sleep?' },
      { id: '5', question: 'Mental state right now:', placeholder: 'How are you feeling emotionally?' },
      { id: '6', question: 'Self-care activity:', placeholder: 'How did you take care of yourself?' }
    ]
  },
  {
    id: 'relationships',
    name: 'Relationship Log',
    description: 'Reflect on your connections with others',
    category: 'Social',
    icon: Users,
    color: '#8B5CF6',
    prompts: [
      { id: '1', question: 'Meaningful conversation with:', placeholder: 'Who did you connect with today?', required: true },
      { id: '2', question: 'How did you help someone?', placeholder: 'Acts of kindness or support...' },
      { id: '3', question: 'Who inspired you today?', placeholder: 'Someone who motivated or impressed you...' },
      { id: '4', question: 'Relationship that needs attention:', placeholder: 'Someone you should reach out to...' },
      { id: '5', question: 'How did you show love?', placeholder: 'Ways you expressed care today...' },
      { id: '6', question: 'Social energy level:', placeholder: 'Did interactions energize or drain you?' }
    ]
  },
  {
    id: 'creativity',
    name: 'Creative Flow',
    description: 'Track your creative activities and inspiration',
    category: 'Creative',
    icon: Lightbulb,
    color: '#F59E0B',
    prompts: [
      { id: '1', question: 'Creative activity today:', placeholder: 'What did you create or imagine?', required: true },
      { id: '2', question: 'Source of inspiration:', placeholder: 'What sparked your creativity?' },
      { id: '3', question: 'New idea or insight:', placeholder: 'What interesting thought did you have?' },
      { id: '4', question: 'Creative challenge faced:', placeholder: 'What artistic obstacle did you encounter?' },
      { id: '5', question: 'Favorite creation today:', placeholder: 'What are you most proud of making?' },
      { id: '6', question: 'Tomorrow\'s creative goal:', placeholder: 'What do you want to create next?' }
    ]
  },
  {
    id: 'simple-daily',
    name: 'Simple Daily',
    description: 'Quick and easy daily check-in',
    category: 'Minimal',
    icon: CheckCircle,
    color: '#6B7280',
    prompts: [
      { id: '1', question: 'Today in one word:', placeholder: 'Describe your day...', required: true, maxLength: 20 },
      { id: '2', question: 'Best moment:', placeholder: 'What made you happy?', maxLength: 100 },
      { id: '3', question: 'Lesson learned:', placeholder: 'What did you discover?', maxLength: 100 },
      { id: '4', question: 'Mood (1-10):', placeholder: '1 = terrible, 10 = amazing', type: 'scale' }
    ]
  }
];

interface GridJournalProps {
  onStyleChange?: (style: 'day-one' | 'grid') => void;
}

export default function GridJournal({ onStyleChange }: GridJournalProps) {
  // App store integration
  const {
    journalEntries,
    addJournalEntry,
    updateJournalEntry,
    deleteJournalEntry
  } = useAppStore();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedTemplate, setSelectedTemplate] = useState<GridTemplate>(GRID_TEMPLATES[0]);
  const [currentEntry, setCurrentEntry] = useState<any | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'calendar' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [showStats, setShowStats] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  
  // Entry form state
  const [entryPrompts, setEntryPrompts] = useState<{[key: string]: string}>({});
  const [entryMood, setEntryMood] = useState<number>(5);

  // Mock data - in real app this would come from a store/API
  const [entries, setEntries] = useState<GridEntry[]>([
    {
      id: '1',
      date: new Date(),
      prompts: {
        '1': 'Finally completed the big presentation I\'ve been working on for weeks. The client loved it!',
        '2': 'Time management during the presentation prep - almost ran out of time.',
        '3': 'My supportive team, good coffee, and the beautiful weather today.',
        '4': 'Learned to better structure my presentations and be more concise.',
        '5': 'Would have started preparing earlier to reduce last-minute stress.',
        '6': 'Celebrate this win and start planning the next project phase.'
      },
      mood: 4,
      completedPrompts: 6,
      totalPrompts: 6,
      createdAt: new Date(),
      updatedAt: new Date(),
      isCompleted: true,
      isFavorite: true
    },
    {
      id: '2',
      date: new Date(Date.now() - 24 * 60 * 60 * 1000),
      prompts: {
        '1': 'Had a quiet morning reading in the park with a great book.',
        '2': 'Dealing with some technical issues at work that took longer than expected.',
        '3': 'Good health, peaceful moments, and inspiring books.',
        '4': 'Sometimes slowing down helps me think more clearly.',
        '5': 'Would have asked for help with the technical issues sooner.',
        '6': 'Focus on one important task at a time.'
      },
      mood: 3,
      completedPrompts: 6,
      totalPrompts: 6,
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      isCompleted: true,
      isFavorite: false
    },
    {
      id: '3',
      date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      prompts: {
        '1': 'Team building lunch with my colleagues - great conversations.',
        '2': 'Difficult conversation with a client about project changes.',
        '3': 'Amazing teammates who always support each other.'
      },
      mood: 3,
      completedPrompts: 3,
      totalPrompts: 6,
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      isCompleted: false,
      isFavorite: false
    }
  ]);

  // Get entry for current date and template
  const getCurrentEntry = () => {
    return entries.find(entry => 
      isSameDay(entry.date, currentDate) && 
      // In a real app, you'd also match template ID
      true
    );
  };

  // Create new entry
  const createNewEntry = () => {
    const existingEntry = getCurrentEntry();
    if (existingEntry) {
      setCurrentEntry(existingEntry);
      setEntryPrompts(existingEntry.prompts);
      setEntryMood(existingEntry.mood || 5);
    } else {
      const newEntry: GridEntry = {
        id: Date.now().toString(),
        date: currentDate,
        prompts: {},
        mood: 5,
        completedPrompts: 0,
        totalPrompts: selectedTemplate.prompts.length,
        createdAt: new Date(),
        updatedAt: new Date(),
        isCompleted: false,
        isFavorite: false
      };
      setCurrentEntry(newEntry);
      setEntryPrompts({});
      setEntryMood(5);
    }
    setIsEditing(true);
  };

  // Save entry
  const saveEntry = () => {
    const completedPrompts = Object.keys(entryPrompts).filter(key => entryPrompts[key].trim() !== '').length;
    
    // Convert grid entry to journal entry format
    const entryData = {
      title: `${selectedTemplate.name} - ${format(currentDate, 'EEEE, MMMM d, yyyy')}`,
      content: Object.entries(entryPrompts).map(([promptId, response]) => {
        const prompt = selectedTemplate.prompts.find(p => p.id === promptId);
        return `**${prompt?.question}**\n${response}`;
      }).join('\n\n'),
      mood: entryMood === 5 ? 'excellent' : entryMood === 4 ? 'good' : entryMood === 3 ? 'neutral' : entryMood === 2 ? 'bad' : 'terrible',
      tags: [selectedTemplate.name.toLowerCase().replace(/\s+/g, '-'), 'grid-journal'],
      attachments: []
    };

    if (currentEntry) {
      updateJournalEntry(currentEntry.id, entryData);
    } else {
      addJournalEntry(entryData);
    }

    setIsEditing(false);
    setCurrentEntry(null);
  };

  // Delete entry
  const handleDeleteEntry = (entryId: string) => {
    if (confirm('Are you sure you want to delete this entry?')) {
      deleteJournalEntry(entryId);
      if (currentEntry?.id === entryId) {
        setCurrentEntry(null);
        setIsEditing(false);
      }
    }
  };

  // Toggle favorite
  const toggleFavorite = (entryId: string) => {
    setEntries(entries.map(entry => 
      entry.id === entryId ? { ...entry, isFavorite: !entry.isFavorite } : entry
    ));
    if (currentEntry?.id === entryId) {
      setCurrentEntry({ ...currentEntry, isFavorite: !currentEntry.isFavorite });
    }
  };

  // Update prompt response
  const updatePromptResponse = (promptId: string, value: string) => {
    setEntryPrompts(prev => ({
      ...prev,
      [promptId]: value
    }));
  };

  // Calculate completion percentage
  const getCompletionPercentage = (entry: GridEntry) => {
    return Math.round((entry.completedPrompts / entry.totalPrompts) * 100);
  };

  // Get mood emoji
  const getMoodEmoji = (mood: number) => {
    const moodEmojis = ['😢', '😟', '😐', '😊', '😄'];
    return moodEmojis[mood - 1] || '😐';
  };

  // Format date
  const formatEntryDate = (date: Date) => {
    if (isToday(date)) return 'Today';
    if (isYesterday(date)) return 'Yesterday';
    return format(date, 'MMM d, yyyy');
  };

  // Get entries for current week
  const getWeekEntries = () => {
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 }); // Start from Monday
    const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
    const weekDays = [];
    
    for (let i = 0; i < 7; i++) {
      const day = addDays(weekStart, i);
      const entry = entries.find(e => isSameDay(e.date, day));
      weekDays.push({ date: day, entry });
    }
    
    return weekDays;
  };

  // Calculate stats
  const getStats = () => {
    const totalEntries = entries.length;
    const completedEntries = entries.filter(e => e.isCompleted).length;
    const favoriteEntries = entries.filter(e => e.isFavorite).length;
    const averageMood = entries.reduce((sum, e) => sum + (e.mood || 0), 0) / totalEntries || 0;
    const currentStreak = entries.length > 0 ? Math.min(7, entries.length) : 0; // Simplified streak calculation
    
    return {
      totalEntries,
      completedEntries,
      favoriteEntries,
      averageMood: Math.round(averageMood * 10) / 10,
      currentStreak,
      completionRate: totalEntries > 0 ? Math.round((completedEntries / totalEntries) * 100) : 0
    };
  };

  const stats = getStats();
  const weekEntries = getWeekEntries();

  useEffect(() => {
    const entry = getCurrentEntry();
    if (entry) {
      setCurrentEntry(entry);
      setEntryPrompts(entry.prompts);
      setEntryMood(entry.mood || 5);
    } else {
      setCurrentEntry(null);
      setEntryPrompts({});
      setEntryMood(5);
    }
    setIsEditing(false);
  }, [currentDate, selectedTemplate]);

  return (
    <div className="h-screen bg-gray-50 dark:bg-slate-900 flex flex-col">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: selectedTemplate.color }}>
                <selectedTemplate.icon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">Grid Journal</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">{selectedTemplate.name}</p>
              </div>
            </div>
            
            {/* Date Navigation */}
            <div className="flex items-center space-x-3 ml-8">
              <button
                onClick={() => setCurrentDate(subDays(currentDate, 1))}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-md hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
              >
                <ChevronLeft size={20} />
              </button>
              
              <div className="text-center min-w-32">
                <div className="text-lg font-semibold text-gray-900 dark:text-white">
                  {formatEntryDate(currentDate)}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {format(currentDate, 'EEEE')}
                </div>
              </div>
              
              <button
                onClick={() => setCurrentDate(addDays(currentDate, 1))}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-md hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                disabled={isToday(currentDate)}
              >
                <ChevronRight size={20} />
              </button>
              
              <button
                onClick={() => setCurrentDate(new Date())}
                className="px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white border border-gray-300 dark:border-slate-600 rounded-md hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
              >
                Today
              </button>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Journal Style Toggle */}
            {onStyleChange && (
              <div className="flex items-center space-x-2 px-3 py-2 bg-gray-100 dark:bg-slate-700 rounded-lg">
                <button
                  onClick={() => onStyleChange('day-one')}
                  className="p-1.5 rounded-md transition-colors text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                  title="Day One Style"
                >
                  <BookOpen size={14} />
                </button>
                <button
                  onClick={() => onStyleChange('grid')}
                  className="p-1.5 rounded-md transition-colors bg-white dark:bg-slate-600 text-blue-600 shadow-sm"
                  title="Grid Diary Style"
                >
                  <Grid3X3 size={14} />
                </button>
              </div>
            )}

            {/* View Mode Toggle */}
            <div className="flex bg-gray-100 dark:bg-slate-700 rounded-lg p-1">
              {[
                { id: 'grid', icon: Grid3X3, label: 'Grid' },
                { id: 'calendar', icon: Calendar, label: 'Calendar' },
                { id: 'list', icon: BookOpen, label: 'List' }
              ].map(({ id, icon: Icon, label }) => (
                <button
                  key={id}
                  onClick={() => setViewMode(id as any)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center space-x-1 ${
                    viewMode === id
                      ? 'bg-white dark:bg-slate-600 text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                  title={label}
                >
                  <Icon size={14} />
                  <span className="hidden sm:inline">{label}</span>
                </button>
              ))}
            </div>

            {/* Template Selector */}
            <button
              onClick={() => setShowTemplateSelector(!showTemplateSelector)}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-md hover:bg-gray-50 dark:hover:bg-slate-600 transition-colors"
            >
              Templates
            </button>

            {/* Stats Toggle */}
            <button
              onClick={() => setShowStats(!showStats)}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-md hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
              title="Show Statistics"
            >
              <TrendingUp size={20} />
            </button>

            {/* Settings */}
            <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-md hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors">
              <Settings size={20} />
            </button>
          </div>
        </div>

        {/* Stats Bar */}
        {showStats && (
          <div className="mt-4 grid grid-cols-2 md:grid-cols-6 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalEntries}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Total Entries</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.completionRate}%</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Completion Rate</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.currentStreak}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Current Streak</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{stats.favoriteEntries}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Favorites</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{stats.averageMood}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Avg Mood</div>
            </div>
            <div className="text-center">
              <div className="text-2xl">{getMoodEmoji(Math.round(stats.averageMood))}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Mood Trend</div>
            </div>
          </div>
        )}
      </div>

      {/* Template Selector Modal */}
      {showTemplateSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-4xl mx-4 max-h-96 overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Choose a Template</h3>
                <button
                  onClick={() => setShowTemplateSelector(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {GRID_TEMPLATES.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => {
                      setSelectedTemplate(template);
                      setShowTemplateSelector(false);
                    }}
                    className={`p-4 border-2 rounded-xl text-left transition-all hover:shadow-md ${
                      selectedTemplate.id === template.id
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-slate-600 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div 
                        className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: template.color }}
                      >
                        <template.icon className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 dark:text-white">{template.name}</h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{template.description}</p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-gray-400 bg-gray-100 dark:bg-slate-700 px-2 py-1 rounded">
                            {template.category}
                          </span>
                          <span className="text-xs text-gray-500">
                            {template.prompts.length} prompts
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        {viewMode === 'grid' && (
          <div className="max-w-6xl mx-auto p-6">
            {currentEntry || isEditing ? (
              <div className="space-y-6">
                {/* Entry Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                      {formatEntryDate(currentDate)}
                    </h2>
                    {currentEntry && (
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-1">
                          <span className="text-sm text-gray-500">Progress:</span>
                          <div className="w-24 h-2 bg-gray-200 dark:bg-slate-700 rounded-full">
                            <div 
                              className="h-2 rounded-full transition-all"
                              style={{ 
                                width: `${getCompletionPercentage(currentEntry)}%`,
                                backgroundColor: selectedTemplate.color
                              }}
                            />
                          </div>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {getCompletionPercentage(currentEntry)}%
                          </span>
                        </div>
                        {currentEntry.mood && (
                          <div className="flex items-center space-x-1">
                            <span className="text-lg">{getMoodEmoji(currentEntry.mood)}</span>
                            <span className="text-sm text-gray-500">Mood</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {currentEntry && (
                      <>
                        <button
                          onClick={() => toggleFavorite(currentEntry.id)}
                          className={`p-2 rounded-md transition-colors ${
                            currentEntry.isFavorite 
                              ? 'text-yellow-500 bg-yellow-50 dark:bg-yellow-900/20' 
                              : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-slate-700'
                          }`}
                        >
                          <Star size={18} className={currentEntry.isFavorite ? 'fill-current' : ''} />
                        </button>
                        
                        <button
                          onClick={() => deleteEntry(currentEntry.id)}
                          className="p-2 text-gray-400 hover:text-red-600 rounded-md hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                      </>
                    )}
                    
                    {!isEditing ? (
                      <button
                        onClick={createNewEntry}
                        className="px-4 py-2 text-white rounded-md text-sm font-medium transition-colors"
                        style={{ backgroundColor: selectedTemplate.color }}
                      >
                        {currentEntry ? 'Edit Entry' : 'Start Writing'}
                      </button>
                    ) : (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setIsEditing(false)}
                          className="px-4 py-2 text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-slate-700 rounded-md text-sm font-medium hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={saveEntry}
                          className="px-4 py-2 text-white rounded-md text-sm font-medium transition-colors"
                          style={{ backgroundColor: selectedTemplate.color }}
                        >
                          Save Entry
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Mood Selector (only in editing mode) */}
                {isEditing && (
                  <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-gray-200 dark:border-slate-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">How are you feeling?</h3>
                    <div className="flex items-center justify-center space-x-4">
                      {[1, 2, 3, 4, 5].map((mood) => (
                        <button
                          key={mood}
                          onClick={() => setEntryMood(mood)}
                          className={`p-3 rounded-xl border-2 transition-all ${
                            entryMood === mood
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 scale-110'
                              : 'border-gray-200 dark:border-slate-600 hover:border-gray-300 hover:scale-105'
                          }`}
                        >
                          <span className="text-2xl">{getMoodEmoji(mood)}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Grid Prompts */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {selectedTemplate.prompts.map((prompt, index) => (
                    <div
                      key={prompt.id}
                      className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-gray-200 dark:border-slate-700 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <h4 className="font-medium text-gray-900 dark:text-white leading-snug">
                          {prompt.question}
                        </h4>
                        <div className="text-xs text-gray-400 ml-2 flex-shrink-0">
                          {index + 1}
                        </div>
                      </div>
                      
                      {isEditing ? (
                        <div>
                          {prompt.type === 'scale' ? (
                            <div className="space-y-2">
                              <input
                                type="range"
                                min="1"
                                max="10"
                                value={entryPrompts[prompt.id] || '5'}
                                onChange={(e) => updatePromptResponse(prompt.id, e.target.value)}
                                className="w-full"
                                style={{ accentColor: selectedTemplate.color }}
                              />
                              <div className="flex justify-between text-xs text-gray-500">
                                <span>1</span>
                                <span className="font-medium">{entryPrompts[prompt.id] || '5'}</span>
                                <span>10</span>
                              </div>
                            </div>
                          ) : (
                            <textarea
                              value={entryPrompts[prompt.id] || ''}
                              onChange={(e) => updatePromptResponse(prompt.id, e.target.value)}
                              placeholder={prompt.placeholder}
                              className="w-full h-24 p-3 text-sm border border-gray-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent resize-none dark:bg-slate-700 dark:text-white"
                              style={{ focusRingColor: selectedTemplate.color }}
                              maxLength={prompt.maxLength}
                            />
                          )}
                          {prompt.maxLength && (
                            <div className="text-xs text-gray-400 mt-1 text-right">
                              {(entryPrompts[prompt.id] || '').length}/{prompt.maxLength}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="min-h-24">
                          {currentEntry?.prompts[prompt.id] ? (
                            <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
                              {currentEntry.prompts[prompt.id]}
                            </p>
                          ) : (
                            <p className="text-gray-400 text-sm italic">
                              {prompt.placeholder}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              /* Empty State */
              <div className="text-center py-16">
                <div 
                  className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6"
                  style={{ backgroundColor: selectedTemplate.color }}
                >
                  <selectedTemplate.icon className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
                  Ready to reflect?
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                  Start your daily {selectedTemplate.name.toLowerCase()} for {formatEntryDate(currentDate)}. 
                  Answer structured prompts to build a meaningful journal habit.
                </p>
                <button
                  onClick={createNewEntry}
                  className="inline-flex items-center space-x-2 px-6 py-3 text-white rounded-lg font-medium transition-colors"
                  style={{ backgroundColor: selectedTemplate.color }}
                >
                  <Plus size={20} />
                  <span>Start {formatEntryDate(currentDate)}'s Entry</span>
                </button>
              </div>
            )}
          </div>
        )}

        {viewMode === 'calendar' && (
          <div className="max-w-4xl mx-auto p-6">
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700">
              {/* Week View */}
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">This Week</h3>
                <div className="grid grid-cols-7 gap-4">
                  {weekEntries.map(({ date, entry }, index) => (
                    <div
                      key={index}
                      onClick={() => setCurrentDate(date)}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        isSameDay(date, currentDate)
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : entry
                          ? 'border-green-200 bg-green-50 dark:bg-green-900/20 hover:border-green-300'
                          : 'border-gray-200 dark:border-slate-600 hover:border-gray-300'
                      }`}
                    >
                      <div className="text-center">
                        <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                          {format(date, 'EEE')}
                        </div>
                        <div className={`text-lg font-semibold mb-2 ${
                          isSameDay(date, currentDate) ? 'text-blue-600' : 'text-gray-900 dark:text-white'
                        }`}>
                          {format(date, 'd')}
                        </div>
                        {entry ? (
                          <div className="space-y-1">
                            <div className="w-full h-1.5 bg-gray-200 dark:bg-slate-700 rounded-full">
                              <div 
                                className="h-1.5 rounded-full transition-all"
                                style={{ 
                                  width: `${getCompletionPercentage(entry)}%`,
                                  backgroundColor: selectedTemplate.color
                                }}
                              />
                            </div>
                            <div className="text-xs text-gray-600 dark:text-gray-400">
                              {getCompletionPercentage(entry)}%
                            </div>
                            {entry.mood && (
                              <div className="text-sm">{getMoodEmoji(entry.mood)}</div>
                            )}
                          </div>
                        ) : (
                          <div className="text-xs text-gray-400">No entry</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {viewMode === 'list' && (
          <div className="max-w-4xl mx-auto p-6">
            <div className="space-y-4">
              {entries.length === 0 ? (
                <div className="text-center py-16">
                  <BookOpen className="w-16 h-16 mx-auto text-gray-300 dark:text-slate-600 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No entries yet</h3>
                  <p className="text-gray-500 dark:text-gray-400">Start journaling to see your entries here.</p>
                </div>
              ) : (
                entries.map((entry) => (
                  <div
                    key={entry.id}
                    onClick={() => setCurrentDate(entry.date)}
                    className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-gray-200 dark:border-slate-700 hover:shadow-md transition-shadow cursor-pointer"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-4">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {formatEntryDate(entry.date)}
                        </h3>
                        <div className="flex items-center space-x-2">
                          <div className="w-20 h-2 bg-gray-200 dark:bg-slate-700 rounded-full">
                            <div 
                              className="h-2 rounded-full transition-all"
                              style={{ 
                                width: `${getCompletionPercentage(entry)}%`,
                                backgroundColor: selectedTemplate.color
                              }}
                            />
                          </div>
                          <span className="text-sm text-gray-500">{getCompletionPercentage(entry)}%</span>
                        </div>
                        {entry.mood && (
                          <span className="text-lg">{getMoodEmoji(entry.mood)}</span>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {entry.isFavorite && (
                          <Star size={16} className="text-yellow-500 fill-current" />
                        )}
                        {entry.isCompleted && (
                          <CheckCircle size={16} className="text-green-500" />
                        )}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {selectedTemplate.prompts.slice(0, 3).map((prompt) => (
                        <div key={prompt.id} className="space-y-1">
                          <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400">
                            {prompt.question}
                          </h4>
                          <p className="text-sm text-gray-800 dark:text-gray-200 line-clamp-2">
                            {entry.prompts[prompt.id] || 'No response'}
                          </p>
                        </div>
                      ))}
                      {Object.keys(entry.prompts).length > 3 && (
                        <div className="flex items-center justify-center text-gray-500 dark:text-gray-400">
                          <span className="text-sm">+{Object.keys(entry.prompts).length - 3} more responses</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}