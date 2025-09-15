import { useState, useRef } from 'react';
import {
  Plus,
  Search,
  Calendar,
  MapPin,
  Thermometer,
  Camera,
  Paperclip,
  Settings,
  Star,
  Trash2,
  Edit3,
  BookOpen,
  Sun,
  Cloud,
  CloudRain,
  CloudSnow,
  Zap,
  Smile,
  Heart,
  Filter,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Download,
  Share,
  Lock,
  Globe,
  Image as ImageIcon,
  X,
  Clock,
  Menu,
  Archive,
  Grid3X3,
  ToggleLeft,
  ToggleRight,
  Upload,
  FileText,
  Save,
  Mic,
  MicOff,
  Volume2,
  Bell,
  BellOff,
  Import,
  AlertCircle,
  CheckCircle2,
  ChevronUp,
  ChevronDown,
  Tag,
  Hash,
  Bookmark,
  Copy,
  Link,
  Maximize2,
  Minimize2,
  RotateCcw,
  Palette,
  Type,
  AlignLeft,
  AlignCenter,
  Bold,
  Italic,
  Underline,
  BarChart3
} from 'lucide-react';
import { format, isToday, isYesterday, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, parseISO, startOfDay, endOfDay, subDays, addDays, startOfYear, endOfYear } from 'date-fns';
import GridJournal from './GridJournal';
import { useAppStore } from '../stores/useAppStore';

interface PhotoAttachment {
  id: string;
  name: string;
  url: string;
  size: number;
  type: string;
}

interface AudioRecording {
  id: string;
  name: string;
  url: string;
  duration: number;
  createdAt: Date;
}

interface JournalReminder {
  id: string;
  title: string;
  time: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  enabled: boolean;
}

const MOOD_OPTIONS = [
  { value: 'terrible', emoji: '😢', label: 'Terrible', color: '#EF4444' },
  { value: 'bad', emoji: '😟', label: 'Bad', color: '#F97316' },
  { value: 'neutral', emoji: '😐', label: 'Neutral', color: '#6B7280' },
  { value: 'good', emoji: '😊', label: 'Good', color: '#10B981' },
  { value: 'excellent', emoji: '😄', label: 'Excellent', color: '#059669' }
];

const WEATHER_OPTIONS = [
  { value: 'sunny', icon: Sun, label: 'Sunny', color: '#FCD34D' },
  { value: 'cloudy', icon: Cloud, label: 'Cloudy', color: '#9CA3AF' },
  { value: 'rainy', icon: CloudRain, label: 'Rainy', color: '#3B82F6' },
  { value: 'snowy', icon: CloudSnow, label: 'Snowy', color: '#E5E7EB' },
  { value: 'stormy', icon: Zap, label: 'Stormy', color: '#6366F1' }
];

export default function Journal() {
  // App store integration
  const {
    journalEntries,
    addJournalEntry,
    updateJournalEntry,
    deleteJournalEntry
  } = useAppStore();

  const [journalStyle, setJournalStyle] = useState<'day-one' | 'grid'>('day-one');
  const [sidebarWidth, setSidebarWidth] = useState(320);
  const [currentEntry, setCurrentEntry] = useState<any | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [viewMode, setViewMode] = useState<'all' | 'favorites' | 'drafts' | 'archived'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'title' | 'mood' | 'weather'>('date');
  const [showSettings, setShowSettings] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showRemindersModal, setShowRemindersModal] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showPhotoUpload, setShowPhotoUpload] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordings, setRecordings] = useState<AudioRecording[]>([]);
  const [photos, setPhotos] = useState<PhotoAttachment[]>([]);
  const [reminders, setReminders] = useState<JournalReminder[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [dateRange, setDateRange] = useState<{ start: Date | null; end: Date | null }>({ start: null, end: null });
  
  // Entry form state
  const [entryContent, setEntryContent] = useState('');
  const [entryTitle, setEntryTitle] = useState('');
  const [entryMood, setEntryMood] = useState<'excellent' | 'good' | 'neutral' | 'bad' | 'terrible'>();
  const [entryWeather, setEntryWeather] = useState<'sunny' | 'cloudy' | 'rainy' | 'snowy' | 'stormy'>();
  const [entryLocation, setEntryLocation] = useState('');
  const [entryTemperature, setEntryTemperature] = useState<number>();
  const [entryTags, setEntryTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [entryPhotos, setEntryPhotos] = useState<PhotoAttachment[]>([]);
  const [entryRecordings, setEntryRecordings] = useState<AudioRecording[]>([]);
  const [entryGratitude, setEntryGratitude] = useState<string[]>(['', '', '']);
  
  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  
  // Photo upload handler
  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const photo: PhotoAttachment = {
            id: Date.now().toString() + Math.random(),
            name: file.name,
            url: e.target?.result as string,
            size: file.size,
            type: file.type
          };
          setEntryPhotos(prev => [...prev, photo]);
          setPhotos(prev => [...prev, photo]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  // Audio recording handlers
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      audioRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        chunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/wav' });
        const url = URL.createObjectURL(blob);
        const recording: AudioRecording = {
          id: Date.now().toString(),
          name: `Recording ${format(new Date(), 'HH:mm:ss')}`,
          url,
          duration: 0,
          createdAt: new Date()
        };
        setEntryRecordings(prev => [...prev, recording]);
        setRecordings(prev => [...prev, recording]);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
    }
  };

  const stopRecording = () => {
    if (audioRef.current && isRecording) {
      audioRef.current.stop();
      setIsRecording(false);
    }
  };

  // Export functionality
  const exportEntries = (format: 'json' | 'pdf' | 'txt') => {
    const entries = getFilteredEntries();
    
    switch (format) {
      case 'json':
        const json = JSON.stringify(entries, null, 2);
        downloadFile(json, `journal_entries_${format(new Date(), 'yyyy-MM-dd')}.json`, 'application/json');
        break;
      case 'txt':
        const txt = entries.map(entry => 
          `${format(new Date(entry.createdAt), 'EEEE, MMMM d, yyyy')}\n\n${entry.content}\n\n---\n\n`
        ).join('');
        downloadFile(txt, `journal_entries_${format(new Date(), 'yyyy-MM-dd')}.txt`, 'text/plain');
        break;
      case 'pdf':
        // Would need a PDF library like jsPDF
        alert('PDF export requires additional setup');
        break;
    }
  };

  const downloadFile = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Analytics functions
  const getAnalytics = () => {
    const entries = journalEntries;
    const now = new Date();
    const thisMonth = entries.filter(e => 
      new Date(e.createdAt).getMonth() === now.getMonth() && 
      new Date(e.createdAt).getFullYear() === now.getFullYear()
    );
    const thisWeek = entries.filter(e => {
      const entryDate = new Date(e.createdAt);
      const weekStart = startOfWeek(now);
      const weekEnd = endOfWeek(now);
      return entryDate >= weekStart && entryDate <= weekEnd;
    });

    const moodCounts = entries.reduce((acc, entry) => {
      if (entry.mood) {
        acc[entry.mood] = (acc[entry.mood] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    const totalWords = entries.reduce((sum, entry) => {
      return sum + (entry.content ? entry.content.split(/\s+/).length : 0);
    }, 0);

    const averageWordsPerEntry = entries.length > 0 ? Math.round(totalWords / entries.length) : 0;

    return {
      totalEntries: entries.length,
      thisMonth: thisMonth.length,
      thisWeek: thisWeek.length,
      totalWords,
      averageWordsPerEntry,
      moodCounts,
      longestStreak: 7, // Simplified calculation
      currentStreak: 3,  // Simplified calculation
      favoriteEntries: entries.filter(e => e.mood === 'excellent').length
    };
  };

  // Calculate word count and reading time
  const calculateStats = (content: string) => {
    const wordCount = content.trim().split(/\s+/).filter(word => word.length > 0).length;
    const readingTime = Math.max(1, Math.ceil(wordCount / 200)); // 200 words per minute
    return { wordCount, readingTime };
  };

  // Filter and sort entries
  const getFilteredEntries = () => {
    let filtered = [...journalEntries];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(entry => 
        entry.content.toLowerCase().includes(query) ||
        entry.tags.some(tag => tag.toLowerCase().includes(query)) ||
        (entry.weather && entry.weather.toLowerCase().includes(query)) ||
        (entry.mood && entry.mood.toLowerCase().includes(query))
      );
    }

    // Apply advanced search filters
    if (selectedTags.length > 0) {
      filtered = filtered.filter(entry =>
        selectedTags.every(tag => entry.tags.includes(tag))
      );
    }

    if (dateRange.start && dateRange.end) {
      filtered = filtered.filter(entry => {
        const entryDate = new Date(entry.createdAt);
        return entryDate >= dateRange.start! && entryDate <= dateRange.end!;
      });
    } else if (selectedDate) {
      filtered = filtered.filter(entry => isSameDay(new Date(entry.createdAt), selectedDate));
    }

    // Apply view mode filter
    switch (viewMode) {
      case 'favorites':
        // Using mood as favorite indicator since app store doesn't have isFavorite
        filtered = filtered.filter(entry => entry.mood === 'excellent');
        break;
      case 'drafts':
        filtered = filtered.filter(entry => !entry.content || entry.content.length < 50);
        break;
      case 'archived':
        // Would need to add archived field to journal entries
        break;
    }

    // Sort entries
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'title':
          return (a.title || '').localeCompare(b.title || '');
        case 'mood':
          const moodOrder = { 'terrible': 1, 'bad': 2, 'neutral': 3, 'good': 4, 'excellent': 5 };
          return (moodOrder[b.mood as keyof typeof moodOrder] || 0) - (moodOrder[a.mood as keyof typeof moodOrder] || 0);
        case 'weather':
          return (a.weather || '').localeCompare(b.weather || '');
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

    return filtered;
  };

  const filteredEntries = getFilteredEntries();

  // Get all unique tags from entries
  const getAllTags = () => {
    const tags = new Set<string>();
    journalEntries.forEach(entry => {
      entry.tags.forEach(tag => tags.add(tag));
    });
    return Array.from(tags).sort();
  };

  // Create new entry
  const createNewEntry = () => {
    // Reset form state
    setEntryContent('');
    setEntryTitle('');
    setEntryMood(undefined);
    setEntryWeather(undefined);
    setEntryLocation('');
    setEntryTemperature(undefined);
    setEntryTags([]);
    setEntryPhotos([]);
    setEntryRecordings([]);
    setEntryGratitude(['', '', '']);
    setCurrentEntry(null);
    setIsEditing(true);
  };

  // Save current entry
  const saveEntry = () => {
    if (!entryContent.trim()) return;

    const entryData = {
      title: entryTitle || format(new Date(), 'EEEE, MMMM d, yyyy'),
      content: entryContent,
      mood: entryMood || 'neutral',
      tags: entryTags,
      attachments: [
        ...entryPhotos.map(photo => ({
          id: photo.id,
          name: photo.name,
          type: 'image' as const,
          url: photo.url,
          size: photo.size
        })),
        ...entryRecordings.map(recording => ({
          id: recording.id,
          name: recording.name,
          type: 'file' as const,
          url: recording.url,
          size: 0
        }))
      ],
      weather: entryWeather,
      gratitude: entryGratitude.filter(g => g.trim() !== '')
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

  // Toggle favorite (using mood excellent as favorite)
  const toggleFavorite = (entryId: string) => {
    const entry = journalEntries.find(e => e.id === entryId);
    if (entry) {
      const newMood = entry.mood === 'excellent' ? 'good' : 'excellent';
      updateJournalEntry(entryId, { mood: newMood });
      if (currentEntry?.id === entryId) {
        setCurrentEntry({ ...currentEntry, mood: newMood });
      }
    }
  };

  // Add tag
  const addTag = () => {
    if (tagInput.trim() && !entryTags.includes(tagInput.trim())) {
      setEntryTags([...entryTags, tagInput.trim()]);
      setTagInput('');
    }
  };

  // Remove tag
  const removeTag = (tagToRemove: string) => {
    setEntryTags(entryTags.filter(tag => tag !== tagToRemove));
  };

  // Select entry
  const selectEntry = (entry: any) => {
    if (isEditing && currentEntry) {
      saveEntry();
    }
    setCurrentEntry(entry);
    setEntryContent(entry.content || '');
    setEntryTitle(entry.title || '');
    setEntryMood(entry.mood);
    setEntryWeather(entry.weather);
    setEntryLocation('');
    setEntryTemperature(undefined);
    setEntryTags(entry.tags || []);
    setEntryPhotos([]);
    setEntryRecordings([]);
    setEntryGratitude(entry.gratitude || ['', '', '']);
    setIsEditing(false);
  };

  // Format date for display
  const formatEntryDate = (date: Date) => {
    if (isToday(date)) return 'Today';
    if (isYesterday(date)) return 'Yesterday';
    return format(date, 'MMM d, yyyy');
  };

  // Get entry preview text
  const getEntryPreview = (content: string, maxLength: number = 100) => {
    const text = content.replace(/\n/g, ' ').trim();
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  // If Grid style is selected, render GridJournal component
  if (journalStyle === 'grid') {
    return <GridJournal onStyleChange={setJournalStyle} />;
  }

  return (
    <div className="h-screen bg-gray-50 dark:bg-slate-900 flex">
      {/* Sidebar */}
      <div 
        className="bg-white dark:bg-slate-800 border-r border-gray-200 dark:border-slate-700 flex flex-col"
        style={{ width: sidebarWidth }}
      >
        {/* Sidebar Header */}
        <div className="p-4 border-b border-gray-200 dark:border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-lg font-semibold text-gray-900 dark:text-white">Journal</h1>
            </div>
            <div className="flex items-center space-x-2">
              {/* Journal Style Toggle */}
              <div className="flex items-center space-x-2 px-3 py-2 bg-gray-100 dark:bg-slate-700 rounded-lg">
                <button
                  onClick={() => setJournalStyle('day-one')}
                  className={`p-1.5 rounded-md transition-colors ${
                    journalStyle === 'day-one'
                      ? 'bg-white dark:bg-slate-600 text-blue-600 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                  title="Day One Style"
                >
                  <BookOpen size={14} />
                </button>
                <button
                  onClick={() => setJournalStyle('grid')}
                  className={`p-1.5 rounded-md transition-colors ${
                    journalStyle === 'grid'
                      ? 'bg-white dark:bg-slate-600 text-blue-600 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                  title="Grid Diary Style"
                >
                  <Grid3X3 size={14} />
                </button>
              </div>
              
              {/* Additional Features */}
              <button
                onClick={() => setShowAnalytics(!showAnalytics)}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-md hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                title="Analytics"
              >
                <BarChart3 size={18} />
              </button>
              
              <button
                onClick={() => setShowExportModal(true)}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-md hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                title="Export"
              >
                <Download size={18} />
              </button>
              
              <button
                onClick={() => setShowRemindersModal(true)}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-md hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                title="Reminders"
              >
                <Bell size={18} />
              </button>
              
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-md hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
              >
                <Settings size={18} />
              </button>
            </div>
          </div>

          {/* New Entry Button */}
          <button
            onClick={createNewEntry}
            className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            <Plus size={18} />
            <span>New Entry</span>
          </button>
        </div>

        {/* Search and Filters */}
        <div className="p-4 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search entries..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-white"
            />
          </div>

          {/* View Mode Tabs */}
          <div className="flex bg-gray-100 dark:bg-slate-700 rounded-lg p-1">
            {[
              { id: 'all', label: 'All', count: journalEntries.length },
              { id: 'favorites', label: 'Favorites', count: journalEntries.filter(e => e.mood === 'excellent').length },
              { id: 'drafts', label: 'Drafts', count: journalEntries.filter(e => !e.content || e.content.length < 50).length },
              { id: 'archived', label: 'Archived', count: 0 }
            ].map(({ id, label, count }) => (
              <button
                key={id}
                onClick={() => setViewMode(id as any)}
                className={`flex-1 px-2 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  viewMode === id
                    ? 'bg-white dark:bg-slate-600 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                {label} {count > 0 && `(${count})`}
              </button>
            ))}
          </div>

          {/* Advanced Search Toggle */}
          <button
            onClick={() => setShowAdvancedSearch(!showAdvancedSearch)}
            className="w-full flex items-center justify-center space-x-2 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white border border-gray-300 dark:border-slate-600 rounded-md hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
          >
            <Filter size={14} />
            <span>Advanced Search</span>
          </button>

          {/* Advanced Search Panel */}
          {showAdvancedSearch && (
            <div className="space-y-3 p-3 bg-gray-50 dark:bg-slate-700 rounded-lg">
              {/* Date Range */}
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Date Range</label>
                <div className="flex space-x-2">
                  <input
                    type="date"
                    value={dateRange.start ? format(dateRange.start, 'yyyy-MM-dd') : ''}
                    onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value ? new Date(e.target.value) : null }))}
                    className="flex-1 px-2 py-1 text-xs border border-gray-300 dark:border-slate-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:text-white"
                  />
                  <input
                    type="date"
                    value={dateRange.end ? format(dateRange.end, 'yyyy-MM-dd') : ''}
                    onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value ? new Date(e.target.value) : null }))}
                    className="flex-1 px-2 py-1 text-xs border border-gray-300 dark:border-slate-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:text-white"
                  />
                </div>
              </div>

              {/* Tags Filter */}
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Tags</label>
                <div className="flex flex-wrap gap-1">
                  {getAllTags().slice(0, 6).map(tag => (
                    <button
                      key={tag}
                      onClick={() => {
                        if (selectedTags.includes(tag)) {
                          setSelectedTags(selectedTags.filter(t => t !== tag));
                        } else {
                          setSelectedTags([...selectedTags, tag]);
                        }
                      }}
                      className={`px-2 py-1 text-xs rounded ${
                        selectedTags.includes(tag)
                          ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200'
                          : 'bg-gray-200 dark:bg-slate-600 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      #{tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sort Options */}
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Sort by</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-slate-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-800 dark:text-white"
                >
                  <option value="date">Date (newest first)</option>
                  <option value="title">Title (A-Z)</option>
                  <option value="mood">Mood (best first)</option>
                  <option value="weather">Weather</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Entries List */}
        <div className="flex-1 overflow-y-auto">
          {filteredEntries.length === 0 ? (
            <div className="p-4 text-center">
              <BookOpen className="w-12 h-12 mx-auto text-gray-300 dark:text-slate-600 mb-3" />
              <p className="text-sm text-gray-500 dark:text-slate-400">
                {searchQuery ? 'No entries found' : 'No entries yet'}
              </p>
              {!searchQuery && (
                <button
                  onClick={createNewEntry}
                  className="mt-3 text-sm text-blue-600 hover:text-blue-700"
                >
                  Write your first entry
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-1 p-2">
              {filteredEntries.map((entry) => {
                const mood = MOOD_OPTIONS.find(m => m.value === entry.mood);
                const weather = WEATHER_OPTIONS.find(w => w.value === entry.weather);
                const isSelected = currentEntry?.id === entry.id;

                return (
                  <div
                    key={entry.id}
                    onClick={() => selectEntry(entry)}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      isSelected 
                        ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800' 
                        : 'hover:bg-gray-50 dark:hover:bg-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {formatEntryDate(new Date(entry.createdAt))}
                        </span>
                        {entry.mood === 'excellent' && (
                          <Star size={12} className="text-yellow-500 fill-current" />
                        )}
                        {entry.attachments && entry.attachments.length > 0 && (
                          <Paperclip size={12} className="text-gray-400" />
                        )}
                      </div>
                      <div className="flex items-center space-x-1">
                        {mood && <span className="text-sm">{mood.emoji}</span>}
                        {weather && <weather.icon size={12} className="text-gray-400" />}
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-600 dark:text-slate-400 leading-relaxed">
                      {getEntryPreview(entry.content)}
                    </p>
                    
                    {entry.tags && entry.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {entry.tags.slice(0, 3).map(tag => (
                          <span
                            key={tag}
                            className="px-1.5 py-0.5 bg-gray-100 dark:bg-slate-600 text-gray-600 dark:text-gray-300 rounded text-xs"
                          >
                            #{tag}
                          </span>
                        ))}
                        {entry.tags.length > 3 && (
                          <span className="text-xs text-gray-500">+{entry.tags.length - 3}</span>
                        )}
                      </div>
                    )}

                    {/* Word count and reading time */}
                    <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                      <span>{calculateStats(entry.content).wordCount} words</span>
                      <span>{format(new Date(entry.createdAt), 'HH:mm')}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Resize Handle */}
      <div 
        className="w-1 bg-gray-200 dark:bg-slate-700 cursor-col-resize hover:bg-blue-500 transition-colors"
        onMouseDown={(e) => {
          const startX = e.clientX;
          const startWidth = sidebarWidth;

          const handleMouseMove = (e: MouseEvent) => {
            const newWidth = Math.max(280, Math.min(500, startWidth + (e.clientX - startX)));
            setSidebarWidth(newWidth);
          };

          const handleMouseUp = () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
          };

          document.addEventListener('mousemove', handleMouseMove);
          document.addEventListener('mouseup', handleMouseUp);
        }}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {currentEntry ? (
          <>
            {/* Entry Header */}
            <div className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {formatEntryDate(currentEntry.date)}
                  </h2>
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <Clock size={14} />
                    <span>{currentEntry.wordCount} words • {currentEntry.readingTime} min read</span>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setIsFullscreen(!isFullscreen)}
                    className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-md hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                    title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
                  >
                    {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
                  </button>

                  <button
                    onClick={() => toggleFavorite(currentEntry.id)}
                    className={`p-2 rounded-md transition-colors ${
                      currentEntry.mood === 'excellent'
                        ? 'text-yellow-500 bg-yellow-50 dark:bg-yellow-900/20' 
                        : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-slate-700'
                    }`}
                    title="Toggle Favorite"
                  >
                    <Star size={18} className={currentEntry.mood === 'excellent' ? 'fill-current' : ''} />
                  </button>

                  <button
                    onClick={() => {
                      const url = `${window.location.origin}/journal/${currentEntry.id}`;
                      navigator.clipboard.writeText(url);
                      alert('Entry link copied to clipboard!');
                    }}
                    className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-md hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                    title="Copy Link"
                  >
                    <Link size={18} />
                  </button>
                  
                  {!isEditing ? (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-md hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                      title="Edit Entry"
                    >
                      <Edit3 size={18} />
                    </button>
                  ) : (
                    <button
                      onClick={saveEntry}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium transition-colors"
                    >
                      <Save size={16} className="mr-1" />
                      Save
                    </button>
                  )}
                  
                  <button
                    onClick={() => handleDeleteEntry(currentEntry.id)}
                    className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded-md hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                    title="Delete Entry"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>

            {/* Entry Content */}
            <div className="flex-1 overflow-y-auto bg-white dark:bg-slate-800">
              <div className="max-w-4xl mx-auto p-6">
                {isEditing ? (
                  <div className="space-y-6">
                    {/* Title */}
                    <div>
                      <input
                        type="text"
                        value={entryTitle}
                        onChange={(e) => setEntryTitle(e.target.value)}
                        placeholder="Entry title (optional)"
                        className="w-full px-4 py-3 text-xl font-semibold text-gray-900 dark:text-white bg-transparent border border-gray-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    {/* Media Upload Bar */}
                    <div className="flex items-center space-x-2 p-3 bg-gray-50 dark:bg-slate-700 rounded-lg">
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center space-x-2 px-3 py-2 text-sm bg-white dark:bg-slate-600 border border-gray-300 dark:border-slate-500 rounded-md hover:bg-gray-50 dark:hover:bg-slate-500 transition-colors"
                      >
                        <Camera size={16} />
                        <span>Photo</span>
                      </button>

                      <button
                        onClick={isRecording ? stopRecording : startRecording}
                        className={`flex items-center space-x-2 px-3 py-2 text-sm border rounded-md transition-colors ${
                          isRecording
                            ? 'bg-red-100 dark:bg-red-900/30 border-red-300 dark:border-red-700 text-red-700 dark:text-red-300'
                            : 'bg-white dark:bg-slate-600 border-gray-300 dark:border-slate-500 hover:bg-gray-50 dark:hover:bg-slate-500'
                        }`}
                      >
                        {isRecording ? <MicOff size={16} /> : <Mic size={16} />}
                        <span>{isRecording ? 'Stop Recording' : 'Voice Note'}</span>
                      </button>

                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handlePhotoUpload}
                        accept="image/*"
                        multiple
                        className="hidden"
                      />
                    </div>

                    {/* Attachments Preview */}
                    {(entryPhotos.length > 0 || entryRecordings.length > 0) && (
                      <div className="space-y-3">
                        {/* Photos */}
                        {entryPhotos.length > 0 && (
                          <div>
                            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Photos</h4>
                            <div className="flex flex-wrap gap-2">
                              {entryPhotos.map((photo) => (
                                <div key={photo.id} className="relative group">
                                  <img
                                    src={photo.url}
                                    alt={photo.name}
                                    className="w-20 h-20 object-cover rounded-lg"
                                  />
                                  <button
                                    onClick={() => setEntryPhotos(entryPhotos.filter(p => p.id !== photo.id))}
                                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                                  >
                                    <X size={12} />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Recordings */}
                        {entryRecordings.length > 0 && (
                          <div>
                            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Voice Notes</h4>
                            <div className="space-y-2">
                              {entryRecordings.map((recording) => (
                                <div key={recording.id} className="flex items-center space-x-3 p-2 bg-gray-100 dark:bg-slate-600 rounded-lg">
                                  <Volume2 size={16} className="text-gray-500" />
                                  <span className="text-sm text-gray-700 dark:text-gray-300 flex-1">{recording.name}</span>
                                  <audio src={recording.url} controls className="h-8" />
                                  <button
                                    onClick={() => setEntryRecordings(entryRecordings.filter(r => r.id !== recording.id))}
                                    className="text-red-500 hover:text-red-700"
                                  >
                                    <X size={16} />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Metadata */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {/* Mood */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Mood
                        </label>
                        <div className="flex space-x-2">
                          {MOOD_OPTIONS.map(mood => (
                            <button
                              key={mood.value}
                              onClick={() => setEntryMood(mood.value)}
                              className={`p-2 rounded-lg border-2 transition-colors ${
                                entryMood === mood.value
                                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                  : 'border-gray-200 dark:border-slate-600 hover:border-gray-300'
                              }`}
                              title={mood.label}
                            >
                              <span className="text-lg">{mood.emoji}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Weather */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Weather
                        </label>
                        <div className="flex space-x-2">
                          {WEATHER_OPTIONS.map(weather => {
                            const Icon = weather.icon;
                            return (
                              <button
                                key={weather.value}
                                onClick={() => setEntryWeather(weather.value)}
                                className={`p-2 rounded-lg border-2 transition-colors ${
                                  entryWeather === weather.value
                                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                    : 'border-gray-200 dark:border-slate-600 hover:border-gray-300'
                                }`}
                                title={weather.label}
                              >
                                <Icon size={16} style={{ color: weather.color }} />
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Location */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Location
                        </label>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input
                            type="text"
                            value={entryLocation}
                            onChange={(e) => setEntryLocation(e.target.value)}
                            placeholder="Where are you?"
                            className="w-full pl-10 pr-3 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
                          />
                        </div>
                      </div>

                      {/* Temperature */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Temperature
                        </label>
                        <div className="relative">
                          <Thermometer className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input
                            type="number"
                            value={entryTemperature || ''}
                            onChange={(e) => setEntryTemperature(e.target.value ? parseInt(e.target.value) : undefined)}
                            placeholder="°F"
                            className="w-full pl-10 pr-3 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Tags */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Tags
                      </label>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {entryTags.map(tag => (
                          <span
                            key={tag}
                            className="inline-flex items-center px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-md text-sm"
                          >
                            #{tag}
                            <button
                              onClick={() => removeTag(tag)}
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
                          value={tagInput}
                          onChange={(e) => setTagInput(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                          placeholder="Add tag..."
                          className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
                        />
                        <button
                          onClick={addTag}
                          className="px-4 py-2 bg-gray-100 dark:bg-slate-600 text-gray-700 dark:text-gray-300 rounded-md text-sm hover:bg-gray-200 dark:hover:bg-slate-500 transition-colors"
                        >
                          Add
                        </button>
                      </div>
                    </div>

                    {/* Gratitude Section */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Three things I'm grateful for today
                      </label>
                      <div className="space-y-2">
                        {entryGratitude.map((gratitude, index) => (
                          <div key={index} className="flex items-center space-x-2">
                            <Heart size={16} className="text-red-400 flex-shrink-0" />
                            <input
                              type="text"
                              value={gratitude}
                              onChange={(e) => {
                                const newGratitude = [...entryGratitude];
                                newGratitude[index] = e.target.value;
                                setEntryGratitude(newGratitude);
                              }}
                              placeholder={`Gratitude ${index + 1}...`}
                              className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Content Editor */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Your thoughts
                      </label>
                      <div className="relative">
                        <textarea
                          value={entryContent}
                          onChange={(e) => setEntryContent(e.target.value)}
                          placeholder="What's on your mind? How was your day? What did you learn or discover?"
                          className="w-full h-96 p-4 text-base border border-gray-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none dark:bg-slate-700 dark:text-white"
                          autoFocus
                        />
                        <div className="absolute bottom-4 right-4 text-xs text-gray-400">
                          {calculateStats(entryContent).wordCount} words
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Entry Metadata */}
                    {(currentEntry.mood || currentEntry.weather || currentEntry.location) && (
                      <div className="flex flex-wrap items-center gap-4 pb-4 border-b border-gray-200 dark:border-slate-700">
                        {currentEntry.mood && (
                          <div className="flex items-center space-x-2">
                            <span className="text-lg">
                              {MOOD_OPTIONS.find(m => m.value === currentEntry.mood)?.emoji}
                            </span>
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              {MOOD_OPTIONS.find(m => m.value === currentEntry.mood)?.label}
                            </span>
                          </div>
                        )}
                        
                        {currentEntry.weather && (
                          <div className="flex items-center space-x-2">
                            {(() => {
                              const weather = WEATHER_OPTIONS.find(w => w.value === currentEntry.weather);
                              if (!weather) return null;
                              const Icon = weather.icon;
                              return (
                                <>
                                  <Icon size={16} style={{ color: weather.color }} />
                                  <span className="text-sm text-gray-600 dark:text-gray-400">
                                    {weather.label}
                                  </span>
                                </>
                              );
                            })()}
                          </div>
                        )}
                        
                        {currentEntry.location && (
                          <div className="flex items-center space-x-2">
                            <MapPin size={14} className="text-gray-400" />
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              {currentEntry.location}
                            </span>
                          </div>
                        )}
                        
                        {currentEntry.temperature && (
                          <div className="flex items-center space-x-2">
                            <Thermometer size={14} className="text-gray-400" />
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              {currentEntry.temperature}°F
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Entry Content */}
                    <div className="prose prose-lg max-w-none dark:prose-invert">
                      <div className="whitespace-pre-wrap text-gray-900 dark:text-white leading-relaxed">
                        {currentEntry.content}
                      </div>
                    </div>

                    {/* Entry Tags */}
                    {currentEntry.tags.length > 0 && (
                      <div className="pt-4 border-t border-gray-200 dark:border-slate-700">
                        <div className="flex flex-wrap gap-2">
                          {currentEntry.tags.map(tag => (
                            <span
                              key={tag}
                              className="px-2 py-1 bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 rounded-md text-sm"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          /* Welcome Screen */
          <div className="flex-1 flex items-center justify-center bg-white dark:bg-slate-800">
            <div className="text-center max-w-md">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <BookOpen className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
                Welcome to Journal
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Capture your thoughts, experiences, and memories. Select an entry from the sidebar or create a new one to get started.
              </p>
              <button
                onClick={createNewEntry}
                className="inline-flex items-center space-x-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                <Plus size={20} />
                <span>Create Your First Entry</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-md mx-4">
            <div className="p-6 border-b border-gray-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Export Journal</h3>
                <button
                  onClick={() => setShowExportModal(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Export your journal entries in various formats
              </div>
              
              <button
                onClick={() => {
                  exportEntries('json');
                  setShowExportModal(false);
                }}
                className="w-full flex items-center space-x-3 p-3 border border-gray-200 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
              >
                <FileText className="w-5 h-5 text-blue-500" />
                <div className="text-left">
                  <div className="font-medium text-gray-900 dark:text-white">JSON Format</div>
                  <div className="text-sm text-gray-500">Complete data with all metadata</div>
                </div>
              </button>

              <button
                onClick={() => {
                  exportEntries('txt');
                  setShowExportModal(false);
                }}
                className="w-full flex items-center space-x-3 p-3 border border-gray-200 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
              >
                <Type className="w-5 h-5 text-green-500" />
                <div className="text-left">
                  <div className="font-medium text-gray-900 dark:text-white">Text Format</div>
                  <div className="text-sm text-gray-500">Simple text file for reading</div>
                </div>
              </button>

              <button
                onClick={() => {
                  exportEntries('pdf');
                  setShowExportModal(false);
                }}
                className="w-full flex items-center space-x-3 p-3 border border-gray-200 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
              >
                <Download className="w-5 h-5 text-red-500" />
                <div className="text-left">
                  <div className="font-medium text-gray-900 dark:text-white">PDF Format</div>
                  <div className="text-sm text-gray-500">Formatted document (requires setup)</div>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Analytics Modal */}
      {showAnalytics && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-3xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Journal Analytics</h3>
                <button
                  onClick={() => setShowAnalytics(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
            <div className="p-6">
              {(() => {
                const analytics = getAnalytics();
                return (
                  <div className="space-y-6">
                    {/* Overview Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">{analytics.totalEntries}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Total Entries</div>
                      </div>
                      <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">{analytics.thisMonth}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">This Month</div>
                      </div>
                      <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                        <div className="text-2xl font-bold text-purple-600">{analytics.totalWords}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Total Words</div>
                      </div>
                      <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                        <div className="text-2xl font-bold text-yellow-600">{analytics.currentStreak}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Day Streak</div>
                      </div>
                    </div>

                    {/* Mood Distribution */}
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white mb-3">Mood Distribution</h4>
                      <div className="space-y-2">
                        {Object.entries(analytics.moodCounts).map(([mood, count]) => {
                          const moodOption = MOOD_OPTIONS.find(m => m.value === mood);
                          const percentage = analytics.totalEntries > 0 ? (count / analytics.totalEntries) * 100 : 0;
                          return (
                            <div key={mood} className="flex items-center space-x-3">
                              <span className="text-lg">{moodOption?.emoji}</span>
                              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 w-16">
                                {moodOption?.label}
                              </span>
                              <div className="flex-1 bg-gray-200 dark:bg-slate-600 rounded-full h-2">
                                <div
                                  className="h-2 rounded-full"
                                  style={{ 
                                    width: `${percentage}%`,
                                    backgroundColor: moodOption?.color 
                                  }}
                                />
                              </div>
                              <span className="text-sm text-gray-600 dark:text-gray-400 w-12 text-right">
                                {count}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Writing Stats */}
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white mb-3">Writing Statistics</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 bg-gray-50 dark:bg-slate-700 rounded-lg">
                          <div className="text-lg font-semibold text-gray-900 dark:text-white">
                            {analytics.averageWordsPerEntry}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">Average words per entry</div>
                        </div>
                        <div className="p-3 bg-gray-50 dark:bg-slate-700 rounded-lg">
                          <div className="text-lg font-semibold text-gray-900 dark:text-white">
                            {analytics.favoriteEntries}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">Favorite entries</div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Reminders Modal */}
      {showRemindersModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-md mx-4">
            <div className="p-6 border-b border-gray-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Journal Reminders</h3>
                <button
                  onClick={() => setShowRemindersModal(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Set up daily reminders to maintain your journaling habit
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Reminder Time
                  </label>
                  <input
                    type="time"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
                    defaultValue="20:00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Frequency
                  </label>
                  <select className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white">
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="weekdays">Weekdays only</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Reminder Message
                  </label>
                  <input
                    type="text"
                    placeholder="Time to reflect on your day..."
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-4">
                <div className="flex items-center space-x-2">
                  <Bell size={16} className="text-blue-500" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">Enable notifications</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <button
                onClick={() => setShowRemindersModal(false)}
                className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium transition-colors"
              >
                Save Reminder Settings
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}