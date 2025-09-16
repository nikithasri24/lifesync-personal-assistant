import React, { useState } from 'react';
import { useAppStore } from '../stores/useAppStore';
import { 
  Trophy, 
  Calendar,
  Target,
  Camera,
  Edit3,
  Plus,
  CheckSquare,
  X,
  Play,
  Pause,
  RotateCcw,
  TrendingUp,
  Scale,
  Ruler
} from 'lucide-react';
import { format, differenceInDays, addDays, isToday } from 'date-fns';
import type { SeventyFiveHardChallenge, SeventyFiveHardRule, SeventyFiveHardEntry, RuleCompletion } from '../types';

const DEFAULT_RULES: Omit<SeventyFiveHardRule, 'id'>[] = [
  {
    title: 'Follow a Diet',
    description: 'Stick to a chosen diet with NO cheat meals or alcohol',
    isRequired: true,
    isCustom: false
  },
  {
    title: 'Workout Twice Daily',
    description: 'Complete two 45-minute workouts (one must be outdoors)',
    isRequired: true,
    isCustom: false
  },
  {
    title: 'Drink 1 Gallon of Water',
    description: 'Drink at least 1 gallon (3.8L) of water daily',
    isRequired: true,
    isCustom: false
  },
  {
    title: 'Read 10 Pages',
    description: 'Read at least 10 pages of non-fiction/personal development',
    isRequired: true,
    isCustom: false
  },
  {
    title: 'Take Progress Photo',
    description: 'Take a daily progress photo to track your transformation',
    isRequired: true,
    isCustom: false
  }
];

export default function SeventyFiveHard() {
  const generateId = () => Math.random().toString(36).substr(2, 9);

  const { 
    seventyFiveHardChallenges = [],
    addSeventyFiveHardChallenge,
    updateSeventyFiveHardChallenge,
    deleteSeventyFiveHardChallenge,
    addSeventyFiveHardEntry,
    updateSeventyFiveHardEntry
  } = useAppStore();

  const [showChallengeForm, setShowChallengeForm] = useState(false);
  const [editingChallenge, setEditingChallenge] = useState<string | null>(null);
  const [showDayForm, setShowDayForm] = useState(false);
  const [selectedChallenge, setSelectedChallenge] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const [challengeFormData, setChallengeFormData] = useState({
    name: '',
    startDate: format(new Date(), 'yyyy-MM-dd'),
    customRules: [] as string[],
    notes: '',
    defaultRules: DEFAULT_RULES.map(rule => ({
      ...rule,
      id: generateId()
    }))
  });

  const [dayFormData, setDayFormData] = useState({
    weight: '',
    measurements: {
      chest: '',
      waist: '',
      hips: '',
      arms: '',
      thighs: ''
    },
    notes: '',
    progressPhotoUrl: ''
  });

  const activeChallenge = seventyFiveHardChallenges.find(c => c.isActive);

  const handleCreateChallenge = (e: React.FormEvent) => {
    e.preventDefault();
    
    const startDate = new Date(challengeFormData.startDate);
    const endDate = addDays(startDate, 74); // 75 days total
    
    const rules: SeventyFiveHardRule[] = [
      ...challengeFormData.defaultRules,
      ...challengeFormData.customRules.map(title => ({
        id: generateId(),
        title,
        description: 'Custom rule',
        isRequired: false,
        isCustom: true
      }))
    ];

    const newChallenge: SeventyFiveHardChallenge = {
      id: generateId(),
      name: challengeFormData.name || '75 Hard Challenge',
      startDate,
      endDate,
      isActive: true,
      currentDay: 1,
      rules,
      dailyEntries: [],
      notes: challengeFormData.notes,
      createdAt: new Date()
    };

    // Deactivate any existing active challenges
    seventyFiveHardChallenges.forEach(challenge => {
      if (challenge.isActive) {
        updateSeventyFiveHardChallenge?.(challenge.id, { isActive: false });
      }
    });

    addSeventyFiveHardChallenge?.(newChallenge);
    setShowChallengeForm(false);
    resetChallengeForm();
  };

  const resetChallengeForm = () => {
    setChallengeFormData({
      name: '',
      startDate: format(new Date(), 'yyyy-MM-dd'),
      customRules: [],
      notes: '',
      defaultRules: DEFAULT_RULES.map(rule => ({
        ...rule,
        id: generateId()
      }))
    });
  };

  const addCustomRule = () => {
    setChallengeFormData(prev => ({
      ...prev,
      customRules: [...prev.customRules, '']
    }));
  };

  const updateCustomRule = (index: number, value: string) => {
    setChallengeFormData(prev => ({
      ...prev,
      customRules: prev.customRules.map((rule, i) => i === index ? value : rule)
    }));
  };

  const removeCustomRule = (index: number) => {
    setChallengeFormData(prev => ({
      ...prev,
      customRules: prev.customRules.filter((_, i) => i !== index)
    }));
  };

  const updateDefaultRule = (ruleId: string, field: 'title' | 'description', value: string) => {
    setChallengeFormData(prev => ({
      ...prev,
      defaultRules: prev.defaultRules.map(rule =>
        rule.id === ruleId ? { ...rule, [field]: value } : rule
      )
    }));
  };

  const toggleDefaultRuleRequired = (ruleId: string) => {
    setChallengeFormData(prev => ({
      ...prev,
      defaultRules: prev.defaultRules.map(rule =>
        rule.id === ruleId ? { ...rule, isRequired: !rule.isRequired } : rule
      )
    }));
  };

  const addDefaultRule = () => {
    setChallengeFormData(prev => ({
      ...prev,
      defaultRules: [...prev.defaultRules, {
        id: generateId(),
        title: 'New Rule',
        description: 'Add your custom rule description',
        isRequired: true,
        isCustom: true
      }]
    }));
  };

  const removeDefaultRule = (ruleId: string) => {
    setChallengeFormData(prev => ({
      ...prev,
      defaultRules: prev.defaultRules.filter(rule => rule.id !== ruleId)
    }));
  };

  const getCurrentDayEntry = (challenge: SeventyFiveHardChallenge, date: Date = new Date()) => {
    const dayNumber = differenceInDays(date, challenge.startDate) + 1;
    return challenge.dailyEntries.find(entry => entry.day === dayNumber);
  };

  const toggleRuleCompletion = (challengeId: string, ruleId: string, date: Date = new Date()) => {
    const challenge = seventyFiveHardChallenges.find(c => c.id === challengeId);
    if (!challenge) return;

    const dayNumber = differenceInDays(date, challenge.startDate) + 1;
    if (dayNumber < 1 || dayNumber > 75) return;

    let entry = challenge.dailyEntries.find(e => e.day === dayNumber);
    
    if (!entry) {
      // Create new entry
      entry = {
        id: generateId(),
        challengeId,
        date,
        day: dayNumber,
        ruleCompletions: challenge.rules.map(rule => ({
          ruleId: rule.id,
          completed: rule.id === ruleId,
          completedAt: rule.id === ruleId ? new Date() : undefined
        })),
        notes: '',
        progressPhotoUrl: '',
        weight: undefined,
        measurements: {}
      };
      
      addSeventyFiveHardEntry?.(entry);
    } else {
      // Update existing entry
      const updatedCompletions = entry.ruleCompletions.map(completion => 
        completion.ruleId === ruleId 
          ? { 
              ...completion, 
              completed: !completion.completed,
              completedAt: !completion.completed ? new Date() : undefined
            }
          : completion
      );
      
      updateSeventyFiveHardEntry?.(entry.id, { ruleCompletions: updatedCompletions });
    }
  };

  const getDayProgress = (challenge: SeventyFiveHardChallenge, dayNumber: number) => {
    const entry = challenge.dailyEntries.find(e => e.day === dayNumber);
    if (!entry) return { completed: 0, total: challenge.rules.length };
    
    const completed = entry.ruleCompletions.filter(c => c.completed).length;
    return { completed, total: challenge.rules.length };
  };

  const getChallengeProgress = (challenge: SeventyFiveHardChallenge) => {
    const totalDays = Math.min(challenge.currentDay, 75);
    let completedDays = 0;
    
    for (let day = 1; day <= totalDays; day++) {
      const progress = getDayProgress(challenge, day);
      if (progress.completed === progress.total) {
        completedDays++;
      }
    }
    
    return { completedDays, totalDays: 75 };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center space-x-3">
            <Trophy className="text-yellow-500" size={28} />
            <span>75 Hard Challenge</span>
          </h1>
          <p className="text-gray-600">Transform your life in 75 days with mental toughness</p>
        </div>
        
        {!activeChallenge && (
          <button
            onClick={() => setShowChallengeForm(true)}
            className="btn-primary flex items-center space-x-2"
          >
            <Play size={20} />
            <span>Start Challenge</span>
          </button>
        )}
      </div>

      {/* Active Challenge */}
      {activeChallenge && (
        <div className="space-y-6">
          {/* Challenge Header */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">{activeChallenge.name}</h2>
                <p className="text-sm text-gray-600">
                  Day {activeChallenge.currentDay} of 75 • Started {format(activeChallenge.startDate, 'MMM dd, yyyy')}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <button 
                  onClick={() => {
                    updateSeventyFiveHardChallenge?.(activeChallenge.id, { isActive: false });
                  }}
                  className="btn-secondary text-sm flex items-center space-x-1"
                >
                  <Pause size={16} />
                  <span>Pause</span>
                </button>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Overall Progress</span>
                <span className="text-sm text-gray-600">
                  {getChallengeProgress(activeChallenge).completedDays} / 75 days
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-gradient-to-r from-green-500 to-emerald-600 h-3 rounded-full transition-all duration-300"
                  style={{ 
                    width: `${(getChallengeProgress(activeChallenge).completedDays / 75) * 100}%` 
                  }}
                />
              </div>
            </div>

            {/* Today's Rules */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                <Calendar size={20} />
                <span>Today - Day {activeChallenge.currentDay}</span>
              </h3>
              
              <div className="grid gap-3">
                {activeChallenge.rules.map((rule) => {
                  const entry = getCurrentDayEntry(activeChallenge);
                  const completion = entry?.ruleCompletions.find(c => c.ruleId === rule.id);
                  const isCompleted = completion?.completed || false;
                  
                  return (
                    <div
                      key={rule.id}
                      className={`flex items-center justify-between p-4 rounded-lg border-2 transition-all duration-200 $${
                        isCompleted 
                          ? 'border-green-200 bg-green-50' 
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center space-x-4">
                        <button
                          onClick={() => toggleRuleCompletion(activeChallenge.id, rule.id)}
                          className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-all duration-200 $${
                            isCompleted
                              ? 'border-green-500 bg-green-500 text-white'
                              : 'border-gray-300 hover:border-green-400'
                          }`}
                        >
                          {isCompleted && <CheckSquare size={14} />}
                        </button>
                        <div>
                          <h4 className={`font-medium $${isCompleted ? 'text-green-800' : 'text-gray-900'}`}>
                            {rule.title}
                          </h4>
                          <p className={`text-sm $${isCompleted ? 'text-green-600' : 'text-gray-600'}`}>
                            {rule.description}
                          </p>
                        </div>
                      </div>
                      
                      {completion?.completedAt && (
                        <span className="text-xs text-green-600">
                          {format(completion.completedAt, 'HH:mm')}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Week View */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">This Week</h3>
            <div className="grid grid-cols-7 gap-2">
              {Array.from({ length: 7 }, (_, i) => {
                const date = addDays(new Date(), i - 3); // 3 days before to 3 days after today
                const dayNumber = differenceInDays(date, activeChallenge.startDate) + 1;
                const progress = getDayProgress(activeChallenge, dayNumber);
                const isToday_ = isToday(date);
                const isValidDay = dayNumber >= 1 && dayNumber <= 75;
                
                return (
                  <div
                    key={i}
                    className={`p-3 rounded-lg text-center border-2 transition-all duration-200 $${
                      isToday_ 
                        ? 'border-blue-300 bg-blue-50' 
                        : isValidDay
                        ? progress.completed === progress.total
                          ? 'border-green-200 bg-green-50'
                          : 'border-gray-200 bg-white'
                        : 'border-gray-100 bg-gray-50'
                    }`}
                  >
                    <div className={`text-xs font-medium $${isToday_ ? 'text-blue-600' : 'text-gray-600'}`}>
                      {format(date, 'EEE')}
                    </div>
                    <div className={`text-lg font-bold $${isToday_ ? 'text-blue-800' : 'text-gray-900'}`}>
                      {format(date, 'd')}
                    </div>
                    {isValidDay && (
                      <div className="text-xs text-gray-500 mt-1">
                        Day {dayNumber}
                      </div>
                    )}
                    {isValidDay && (
                      <div className="flex justify-center mt-2">
                        <div className={`w-2 h-2 rounded-full $${
                          progress.completed === progress.total ? 'bg-green-500' : 'bg-gray-300'
                        }`} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* No Active Challenge */}
      {!activeChallenge && seventyFiveHardChallenges.length === 0 && (
        <div className="text-center py-12">
          <Trophy className="mx-auto h-16 w-16 text-gray-400 mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Ready for the Ultimate Challenge?</h3>
          <p className="text-gray-600 mb-8 max-w-md mx-auto">
            75 Hard is a mental toughness program that will transform your life. 
            Are you ready to commit to 75 days of discipline?
          </p>
          <button
            onClick={() => setShowChallengeForm(true)}
            className="btn-primary flex items-center space-x-2 mx-auto"
          >
            <Play size={20} />
            <span>Start Your 75 Hard Journey</span>
          </button>
        </div>
      )}

      {/* Previous Challenges */}
      {seventyFiveHardChallenges.length > 0 && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Challenge History</h3>
          <div className="space-y-3">
            {seventyFiveHardChallenges.map((challenge) => {
              const progress = getChallengeProgress(challenge);
              return (
                <div key={challenge.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-900">{challenge.name}</h4>
                    <p className="text-sm text-gray-600">
                      {format(challenge.startDate, 'MMM dd, yyyy')} - {format(challenge.endDate, 'MMM dd, yyyy')}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900">
                      {progress.completedDays} / 75 days
                    </div>
                    <div className="text-xs text-gray-600">
                      {challenge.isActive ? 'Active' : 'Completed'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Challenge Form Modal */}
      {showChallengeForm && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 p-4 overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowChallengeForm(false);
              resetChallengeForm();
            }
          }}
        >
          <div 
            className="bg-white rounded-xl w-full max-w-2xl my-8 flex flex-col shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Fixed Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-white rounded-t-xl flex-shrink-0">
              <h3 className="text-lg font-semibold text-gray-900">Start 75 Hard Challenge</h3>
              <button
                onClick={() => {
                  setShowChallengeForm(false);
                  resetChallengeForm();
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200 flex-shrink-0 text-gray-600 hover:text-gray-900"
                aria-label="Close modal"
                title="Close"
              >
                <X size={24} className="text-gray-600" />
              </button>
            </div>
            
            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 max-h-[60vh]">

            <form id="challenge-form" onSubmit={handleCreateChallenge} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Challenge Name
                </label>
                <input
                  type="text"
                  value={challengeFormData.name}
                  onChange={(e) => setChallengeFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="input-field"
                  placeholder="My 75 Hard Challenge"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={challengeFormData.startDate}
                  onChange={(e) => setChallengeFormData(prev => ({ ...prev, startDate: e.target.value }))}
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Default Rules (Editable)
                </label>
                <div className="space-y-3">
                  {challengeFormData.defaultRules.map((rule) => (
                    <div key={rule.id} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center space-x-2 flex-1">
                          <button
                            type="button"
                            onClick={() => toggleDefaultRuleRequired(rule.id)}
                            className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all duration-200 flex-shrink-0 ${
                              rule.isRequired
                                ? 'border-green-500 bg-green-500 text-white'
                                : 'border-gray-300 hover:border-green-400'
                            }`}
                          >
                            {rule.isRequired && <CheckSquare size={12} />}
                          </button>
                          <input
                            type="text"
                            value={rule.title}
                            onChange={(e) => updateDefaultRule(rule.id, 'title', e.target.value)}
                            className="input-field text-sm font-medium flex-1"
                            placeholder="Rule title..."
                          />
                        </div>
                        {rule.isCustom && (
                          <button
                            type="button"
                            onClick={() => removeDefaultRule(rule.id)}
                            className="p-1 text-red-500 hover:bg-red-50 rounded-md ml-2"
                            title="Remove rule"
                          >
                            <X size={16} />
                          </button>
                        )}
                      </div>
                      <div className="ml-7">
                        <textarea
                          value={rule.description}
                          onChange={(e) => updateDefaultRule(rule.id, 'description', e.target.value)}
                          className="input-field text-xs resize-none w-full"
                          rows={2}
                          placeholder="Rule description..."
                        />
                      </div>
                      <div className="ml-7 mt-2">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          rule.isRequired 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {rule.isRequired ? 'Required' : 'Optional'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between mt-3">
                  <p className="text-xs text-gray-500">
                    Click the checkbox to make a rule required or optional. Edit the title and description as needed.
                  </p>
                  <button
                    type="button"
                    onClick={addDefaultRule}
                    className="btn-secondary text-sm flex items-center space-x-1"
                  >
                    <Plus size={16} />
                    <span>Add Rule</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Custom Rules (Optional)
                </label>
                {challengeFormData.customRules.map((rule, index) => (
                  <div key={index} className="flex items-center space-x-2 mb-2">
                    <input
                      type="text"
                      value={rule}
                      onChange={(e) => updateCustomRule(index, e.target.value)}
                      className="input-field flex-1"
                      placeholder="Add custom rule..."
                    />
                    <button
                      type="button"
                      onClick={() => removeCustomRule(index)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-md"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addCustomRule}
                  className="btn-secondary text-sm flex items-center space-x-1"
                >
                  <Plus size={16} />
                  <span>Add Custom Rule</span>
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes (Optional)
                </label>
                <textarea
                  value={challengeFormData.notes}
                  onChange={(e) => setChallengeFormData(prev => ({ ...prev, notes: e.target.value }))}
                  className="input-field"
                  rows={3}
                  placeholder="Add your motivation, goals, or notes..."
                />
              </div>
            </form>
            </div>
            
            {/* Fixed Footer */}
            <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50 rounded-b-xl flex-shrink-0">
              <button
                type="button"
                onClick={() => {
                  setShowChallengeForm(false);
                  resetChallengeForm();
                }}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                form="challenge-form"
                className="btn-primary"
              >
                Start Challenge
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}