import React, { useState } from 'react';
import { useAppStore } from '../stores/useAppStore';
import { 
  Smile, 
  Plus, 
  TrendingUp,
  Calendar,
  Battery,
  Zap,
  Activity,
  Sun,
  Moon,
  Users,
  Edit,
  Trash2
} from 'lucide-react';
import { format, subDays, isToday, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns';
import type { MoodEntry } from '../types';

const moodEmojis = {
  1: { emoji: '😢', label: 'Terrible', color: '#ef4444' },
  2: { emoji: '😕', label: 'Bad', color: '#f97316' },
  3: { emoji: '😐', label: 'Neutral', color: '#eab308' },
  4: { emoji: '🙂', label: 'Good', color: '#22c55e' },
  5: { emoji: '😊', label: 'Excellent', color: '#16a34a' }
};

const moodFactors = [
  'Good Sleep', 'Exercise', 'Healthy Food', 'Social Time', 'Work Stress', 
  'Weather', 'Health Issues', 'Family Time', 'Achievement', 'Relaxation',
  'Travel', 'Learning', 'Creative Work', 'Conflict', 'Financial Stress'
];

export default function Mood() {
  const { 
    moodEntries, 
    addMoodEntry,
    updateMoodEntry,
    deleteMoodEntry,
    getTodayMood
  } = useAppStore();

  const [showMoodModal, setShowMoodModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState<MoodEntry | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());

  const todayMood = getTodayMood();
  const weekStart = startOfWeek(new Date());
  const weekEnd = endOfWeek(new Date());
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const recentEntries = moodEntries
    .filter(entry => new Date(entry.date) >= subDays(new Date(), 30))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const weekEntries = moodEntries.filter(entry => {
    const entryDate = new Date(entry.date);
    return entryDate >= weekStart && entryDate <= weekEnd;
  });

  const averageMood = recentEntries.length > 0 
    ? recentEntries.reduce((sum, entry) => sum + entry.mood, 0) / recentEntries.length
    : 0;

  const getEntryForDate = (date: Date) => {
    return moodEntries.find(entry => 
      format(new Date(entry.date), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
    );
  };

  const handleCreateEntry = () => {
    setEditingEntry(null);
    setShowMoodModal(true);
  };

  const handleEditEntry = (entry: MoodEntry) => {
    setEditingEntry(entry);
    setShowMoodModal(true);
  };

  const handleDeleteEntry = (entryId: string) => {
    if (confirm('Are you sure you want to delete this mood entry?')) {
      deleteMoodEntry(entryId);
    }
  };

  const MoodModal = () => {
    const [moodData, setMoodData] = useState({
      date: editingEntry ? format(new Date(editingEntry.date), 'yyyy-MM-dd') : format(selectedDate, 'yyyy-MM-dd'),
      mood: editingEntry?.mood || 3,
      energy: editingEntry?.energy || 3,
      stress: editingEntry?.stress || 3,
      sleep: editingEntry?.sleep || 8,
      exercise: editingEntry?.exercise || false,
      socialTime: editingEntry?.socialTime || false,
      notes: editingEntry?.notes || '',
      factors: editingEntry?.factors || []
    });

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      
      const entryPayload = {
        ...moodData,
        date: new Date(moodData.date),
        mood: moodData.mood as 1 | 2 | 3 | 4 | 5,
        energy: moodData.energy as 1 | 2 | 3 | 4 | 5,
        stress: moodData.stress as 1 | 2 | 3 | 4 | 5
      };

      if (editingEntry) {
        updateMoodEntry(editingEntry.id, entryPayload);
      } else {
        addMoodEntry(entryPayload);
      }

      setShowMoodModal(false);
      setEditingEntry(null);
    };

    const toggleFactor = (factor: string) => {
      setMoodData(prev => ({
        ...prev,
        factors: prev.factors.includes(factor)
          ? prev.factors.filter(f => f !== factor)
          : [...prev.factors, factor]
      }));
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-primary rounded-2xl p-8 w-full max-w-2xl mx-4 shadow-xl max-h-[90vh] overflow-y-auto">
          <h3 className="text-xl font-bold text-primary mb-6 font-display">
            {editingEntry ? 'Edit Mood Entry' : 'Daily Check-in'}
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-secondary mb-2">Date</label>
              <input
                type="date"
                value={moodData.date}
                onChange={(e) => setMoodData(prev => ({ ...prev, date: e.target.value }))}
                className="input-field"
                required
              />
            </div>

            {/* Mood Rating */}
            <div>
              <label className="block text-sm font-medium text-secondary mb-4">Overall Mood</label>
              <div className="flex justify-between items-center bg-tertiary rounded-xl p-4">
                {[1, 2, 3, 4, 5].map(rating => (
                  <button
                    key={rating}
                    type="button"
                    onClick={() => setMoodData(prev => ({ ...prev, mood: rating as 1 | 2 | 3 | 4 | 5 }))}
                    className={`flex flex-col items-center space-y-2 p-3 rounded-lg transition-all duration-200 ${
                      moodData.mood === rating 
                        ? 'bg-accent text-white scale-110' 
                        : 'hover:bg-secondary'
                    }`}
                  >
                    <span className="text-2xl">{moodEmojis[rating as keyof typeof moodEmojis].emoji}</span>
                    <span className="text-xs font-medium">{moodEmojis[rating as keyof typeof moodEmojis].label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Energy & Stress */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-secondary mb-2">Energy Level</label>
                <div className="flex items-center space-x-2">
                  <Battery size={16} className="text-muted" />
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={moodData.energy}
                    onChange={(e) => setMoodData(prev => ({ ...prev, energy: parseInt(e.target.value) as 1 | 2 | 3 | 4 | 5 }))}
                    className="flex-1"
                  />
                  <span className="text-sm font-medium w-8">{moodData.energy}/5</span>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-secondary mb-2">Stress Level</label>
                <div className="flex items-center space-x-2">
                  <Zap size={16} className="text-muted" />
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={moodData.stress}
                    onChange={(e) => setMoodData(prev => ({ ...prev, stress: parseInt(e.target.value) as 1 | 2 | 3 | 4 | 5 }))}
                    className="flex-1"
                  />
                  <span className="text-sm font-medium w-8">{moodData.stress}/5</span>
                </div>
              </div>
            </div>

            {/* Sleep & Activities */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-secondary mb-2">Sleep (hours)</label>
                <input
                  type="number"
                  min="0"
                  max="24"
                  step="0.5"
                  value={moodData.sleep}
                  onChange={(e) => setMoodData(prev => ({ ...prev, sleep: parseFloat(e.target.value) }))}
                  className="input-field"
                />
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="exercise"
                  checked={moodData.exercise}
                  onChange={(e) => setMoodData(prev => ({ ...prev, exercise: e.target.checked }))}
                  className="mr-2"
                />
                <label htmlFor="exercise" className="text-sm font-medium text-secondary flex items-center space-x-2">
                  <Activity size={16} />
                  <span>Exercise</span>
                </label>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="socialTime"
                  checked={moodData.socialTime}
                  onChange={(e) => setMoodData(prev => ({ ...prev, socialTime: e.target.checked }))}
                  className="mr-2"
                />
                <label htmlFor="socialTime" className="text-sm font-medium text-secondary flex items-center space-x-2">
                  <Users size={16} />
                  <span>Social Time</span>
                </label>
              </div>
            </div>

            {/* Mood Factors */}
            <div>
              <label className="block text-sm font-medium text-secondary mb-4">What influenced your mood?</label>
              <div className="flex flex-wrap gap-2">
                {moodFactors.map(factor => (
                  <button
                    key={factor}
                    type="button"
                    onClick={() => toggleFactor(factor)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      moodData.factors.includes(factor)
                        ? 'bg-accent text-white'
                        : 'bg-tertiary text-secondary hover:bg-secondary'
                    }`}
                  >
                    {factor}
                  </button>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-secondary mb-2">Notes</label>
              <textarea
                value={moodData.notes}
                onChange={(e) => setMoodData(prev => ({ ...prev, notes: e.target.value }))}
                className="input-field"
                rows={3}
                placeholder="How was your day? Any thoughts or reflections..."
              />
            </div>

            <div className="flex space-x-4 pt-4">
              <button
                type="button"
                onClick={() => setShowMoodModal(false)}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary flex-1"
              >
                {editingEntry ? 'Update' : 'Save'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-primary uppercase font-display leading-none tracking-tight">
            MOOD TRACKER
          </h1>
          <div className="flex items-center space-x-3 mt-2">
            <div className="h-0.5 w-12 bg-accent-secondary"></div>
            <span className="text-xs text-muted font-mono font-bold tracking-wider uppercase">
              Daily Check-ins & Patterns
            </span>
          </div>
        </div>
        <button
          onClick={handleCreateEntry}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus size={20} />
          <span>Daily Check-in</span>
        </button>
      </div>

      {/* Today's Mood */}
      {!todayMood ? (
        <div className="bg-accent rounded-2xl p-8 text-white text-center shadow-xl">
          <Smile size={48} className="mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">How are you feeling today?</h2>
          <p className="text-lg opacity-90 mb-6">Take a moment to check in with yourself</p>
          <button
            onClick={handleCreateEntry}
            className="bg-white text-accent px-8 py-3 rounded-xl font-bold hover:shadow-lg transition-all duration-200"
          >
            Daily Check-in
          </button>
        </div>
      ) : (
        <div className="bg-primary rounded-2xl p-6 shadow-lg border border-primary">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="text-center">
                <div className="text-4xl mb-2">{moodEmojis[todayMood.mood].emoji}</div>
                <div className="text-sm font-medium text-secondary">{moodEmojis[todayMood.mood].label}</div>
              </div>
              
              <div className="grid grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="flex items-center justify-center space-x-1 mb-1">
                    <Battery size={16} className="text-accent" />
                    <span className="text-sm font-medium text-secondary">Energy</span>
                  </div>
                  <div className="text-lg font-bold text-primary">{todayMood.energy}/5</div>
                </div>
                
                <div className="text-center">
                  <div className="flex items-center justify-center space-x-1 mb-1">
                    <Zap size={16} className="text-warning" />
                    <span className="text-sm font-medium text-secondary">Stress</span>
                  </div>
                  <div className="text-lg font-bold text-primary">{todayMood.stress}/5</div>
                </div>
                
                <div className="text-center">
                  <div className="flex items-center justify-center space-x-1 mb-1">
                    <Moon size={16} className="text-info" />
                    <span className="text-sm font-medium text-secondary">Sleep</span>
                  </div>
                  <div className="text-lg font-bold text-primary">{todayMood.sleep}h</div>
                </div>
              </div>
            </div>
            
            <button
              onClick={() => handleEditEntry(todayMood)}
              className="btn-secondary"
            >
              <Edit size={16} />
            </button>
          </div>
          
          {todayMood.notes && (
            <div className="mt-4 p-4 bg-tertiary rounded-xl">
              <p className="text-sm text-secondary">{todayMood.notes}</p>
            </div>
          )}
          
          {todayMood.factors && todayMood.factors.length > 0 && (
            <div className="mt-4">
              <div className="flex flex-wrap gap-2">
                {todayMood.factors.map(factor => (
                  <span
                    key={factor}
                    className="px-3 py-1 bg-accent-soft text-accent rounded-full text-xs font-medium"
                  >
                    {factor}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Week Overview */}
      <div className="card">
        <h3 className="text-lg font-bold text-primary mb-4 font-display">This Week</h3>
        
        <div className="grid grid-cols-7 gap-2">
          {weekDays.map(day => {
            const entry = getEntryForDate(day);
            const isCurrentDay = isToday(day);
            
            return (
              <div
                key={day.toISOString()}
                className={`text-center p-4 rounded-xl transition-all duration-200 ${
                  isCurrentDay 
                    ? 'bg-accent text-white' 
                    : entry 
                      ? 'bg-tertiary hover:bg-secondary cursor-pointer'
                      : 'bg-secondary'
                }`}
                onClick={() => entry && handleEditEntry(entry)}
              >
                <div className="text-sm font-medium mb-2">
                  {format(day, 'EEE')}
                </div>
                <div className="text-lg font-bold mb-2">
                  {format(day, 'd')}
                </div>
                {entry ? (
                  <div className="text-2xl">
                    {moodEmojis[entry.mood].emoji}
                  </div>
                ) : (
                  <div className="text-2xl text-muted">-</div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-secondary mb-1">Average Mood</p>
              <p className="text-2xl font-bold text-primary font-display">
                {averageMood.toFixed(1)}/5
              </p>
            </div>
            <div className="text-3xl">
              {averageMood >= 4 ? '😊' : averageMood >= 3 ? '🙂' : averageMood >= 2 ? '😐' : '😕'}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-secondary mb-1">Check-in Streak</p>
              <p className="text-2xl font-bold text-primary font-display">
                {weekEntries.length} days
              </p>
            </div>
            <div className="p-3 bg-success rounded-xl">
              <Calendar className="text-white" size={24} />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-secondary mb-1">Total Entries</p>
              <p className="text-2xl font-bold text-primary font-display">{moodEntries.length}</p>
            </div>
            <div className="p-3 bg-info rounded-xl">
              <TrendingUp className="text-white" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Recent Entries */}
      <div className="card">
        <h3 className="text-lg font-bold text-primary mb-4 font-display">Recent Entries</h3>
        
        {recentEntries.length === 0 ? (
          <div className="text-center py-8">
            <Smile size={48} className="text-muted mx-auto mb-3" />
            <p className="text-muted">No mood entries yet</p>
            <button
              onClick={handleCreateEntry}
              className="btn-primary mt-4"
            >
              Start Your First Check-in
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {recentEntries.slice(0, 10).map(entry => (
              <div key={entry.id} className="p-4 bg-tertiary rounded-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="text-2xl">{moodEmojis[entry.mood].emoji}</div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-primary">
                          {format(new Date(entry.date), 'MMM d, yyyy')}
                        </span>
                        <span className="text-sm text-secondary">
                          {moodEmojis[entry.mood].label}
                        </span>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-secondary mt-1">
                        <span>Energy: {entry.energy}/5</span>
                        <span>Stress: {entry.stress}/5</span>
                        {entry.sleep && <span>Sleep: {entry.sleep}h</span>}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleEditEntry(entry)}
                      className="p-2 hover:bg-secondary rounded-lg transition-colors"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteEntry(entry.id)}
                      className="p-2 hover:bg-error-light hover:text-error rounded-lg transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                
                {entry.notes && (
                  <p className="text-sm text-secondary mt-3 pl-10">{entry.notes}</p>
                )}
                
                {entry.factors && entry.factors.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3 pl-10">
                    {entry.factors.map(factor => (
                      <span
                        key={factor}
                        className="px-2 py-1 bg-accent-soft text-accent rounded-full text-xs"
                      >
                        {factor}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Mood Modal */}
      {showMoodModal && <MoodModal />}
    </div>
  );
}