import React, { useMemo, useState } from 'react';
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
import { isSupabaseConfigured } from '../lib/supabase';
import { apiClient } from '../services/apiClient';
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
    isCustom: false,
    dailyTarget: 2
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
    updateSeventyFiveHardEntry,
    initializeData,
    ensureSFHTasksForToday,
    showSFHTasksInTasks,
    setShowSFHTasksInTasks,
    resetSFHChallengeStart,
    showGlobalToast,
    sfhLastSynced,
    purgeSFHDuplicateTasks,
    purgeNonSFHDuplicateTasks,
    updateActiveChallengesDays,
  } = useAppStore();

  const [showChallengeForm, setShowChallengeForm] = useState(false);
  const [editingChallenge, setEditingChallenge] = useState<string | null>(null);
  const [showEditChallengeForm, setShowEditChallengeForm] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetDate, setResetDate] = useState<string>('');
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

  // Helper: derive daily target with sensible fallback for existing data
  const getRuleDailyTarget = (rule: SeventyFiveHardRule) => {
    if (rule.dailyTarget && rule.dailyTarget > 1) return rule.dailyTarget;
    const title = (rule.title || '').toLowerCase();
    if (title.includes('twice')) return 2; // fallback for "Workout Twice Daily"
    return 1;
  };

  const activeChallenge = seventyFiveHardChallenges.find(c => c.isActive);
  const latestPausedChallenge = React.useMemo(() => {
    const paused = seventyFiveHardChallenges.filter(c => !c.isActive)
    if (!paused.length) return null
    return [...paused].sort((a, b) => b.startDate.getTime() - a.startDate.getTime())[0]
  }, [seventyFiveHardChallenges])
  const activeChallengeRules = useMemo(() => activeChallenge?.rules ?? [], [activeChallenge?.id, seventyFiveHardChallenges.length]);

  // Edit modal state
  const [editForm, setEditForm] = useState({
    name: '',
    notes: '',
    rules: [] as { id: string; title: string; description: string; isRequired: boolean; isCustom: boolean; dailyTarget?: number; segmentLabels?: string[] }[],
  });

  const openEditChallenge = () => {
    if (!activeChallenge) return;
    setEditForm({
      name: activeChallenge.name,
      notes: activeChallenge.notes || '',
      rules: activeChallenge.rules.map(r => ({ id: r.id, title: r.title, description: r.description, isRequired: r.isRequired, isCustom: r.isCustom, dailyTarget: r.dailyTarget, segmentLabels: r.segmentLabels })),
  });
    setShowEditChallengeForm(true);
  };

  const applyEditChallenge = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeChallenge) return;
    updateSeventyFiveHardChallenge?.(activeChallenge.id, {
      name: editForm.name,
      notes: editForm.notes,
      rules: editForm.rules.map(r => ({ id: r.id, title: r.title, description: r.description, isRequired: r.isRequired, isCustom: r.isCustom, dailyTarget: r.dailyTarget, segmentLabels: r.segmentLabels } as any)),
  });
    setShowEditChallengeForm(false);
  };

  // Update current day for active challenges when component mounts or challenges change
  React.useEffect(() => {
    updateActiveChallengesDays?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Ensure tasks exist for today's uncompleted 75 Hard items
  React.useEffect(() => {
    ensureSFHTasksForToday?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeChallenge?.id, activeChallenge?.currentDay, seventyFiveHardChallenges.length]);

  const exportChallenges = () => {
    try {
      const data = JSON.stringify(seventyFiveHardChallenges, null, 2);
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = '75hard-export.json';
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('[75Hard] Export failed', e);
    }
  };

  const importChallenges = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const text = String(reader.result || '');
        const imported = JSON.parse(text) as SeventyFiveHardChallenge[];
        // Merge: append imported challenges
        imported.forEach((c) => addSeventyFiveHardChallenge?.(c));
      } catch (e) {
        console.error('[75Hard] Import failed', e);
      }
    };
    reader.readAsText(file);
  };

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

  const toggleRuleCompletion = (challengeId: string, ruleId: string, date: Date = new Date(), segmentIndex?: number) => {
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
        ruleCompletions: challenge.rules.map(rule => {
          const target = getRuleDailyTarget(rule);
          if (rule.id === ruleId && target > 1) {
            const segs = Array.from({ length: target }, (_v, i) => i === (segmentIndex ?? 0));
            const done = segs.every(Boolean);
            return { ruleId: rule.id, completed: done, completedAt: done ? new Date() : undefined, segments: segs } as RuleCompletion;
          }
          if (rule.id === ruleId) {
            return { ruleId: rule.id, completed: true, completedAt: new Date() } as RuleCompletion;
          }
          return { ruleId: rule.id, completed: false } as RuleCompletion;
        }),
        notes: '',
        progressPhotoUrl: '',
        weight: undefined,
        measurements: {}
      };
      
      addSeventyFiveHardEntry?.(entry);
    } else {
      // Update existing entry
      const updatedCompletions = entry.ruleCompletions.map(completion => {
        if (completion.ruleId !== ruleId) return completion;
        const rule = challenge.rules.find(r => r.id === ruleId);
        const target = rule ? getRuleDailyTarget(rule) : 1;
        if (target > 1) {
          const segs = Array.isArray(completion.segments)
            ? [...completion.segments]
            : Array.from({ length: target }, () => false);
          const idx = segmentIndex ?? 0;
          if (idx >= 0 && idx < segs.length) segs[idx] = !segs[idx];
          const done = segs.every(Boolean);
          return {
            ...completion,
            segments: segs,
            completed: done,
            completedAt: done ? new Date() : undefined,
          } as RuleCompletion;
        }
        // single-target toggle
        return {
          ...completion,
          completed: !completion.completed,
          completedAt: !completion.completed ? new Date() : undefined,
        } as RuleCompletion;
      });
      
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

  // Small inline SVG sparkline for weight trend
  const WeightSparkline: React.FC<{ values: number[]; width?: number; height?: number }>
    = ({ values, width = 260, height = 80 }) => {
    if (!values.length) return <div className="text-xs text-gray-500">No weight data yet</div>;
    const min = Math.min(...values);
    const max = Math.max(...values);
    const span = Math.max(1, max - min);
    const padX = 4;
    const padY = 6;
    const innerW = width - padX * 2;
    const innerH = height - padY * 2;
    const step = values.length > 1 ? innerW / (values.length - 1) : innerW;
    const points = values.map((v, i) => {
      const x = padX + i * step;
      const y = padY + innerH - ((v - min) / span) * innerH;
      return `${x},${y}`;
    }).join(' ');
    const d = values.map((v, i) => {
      const x = padX + i * step;
      const y = padY + innerH - ((v - min) / span) * innerH;
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');
    return (
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="block">
        <polyline points={`${padX},${padY + innerH} ${points} ${padX + innerW},${padY + innerH}`} fill="none" stroke="none" />
        <path d={d} fill="none" stroke="#10b981" strokeWidth={2} />
        {values.map((v, i) => {
          const x = padX + i * step;
          const y = padY + innerH - ((v - min) / span) * innerH;
          return <circle key={i} cx={x} cy={y} r={2} fill="#10b981" />
        })}
      </svg>
    );
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
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowChallengeForm(true)}
              className="btn-primary flex items-center space-x-2"
            >
              <Play size={20} />
              <span>Start Challenge</span>
            </button>
            {latestPausedChallenge && (
              <button
                type="button"
                onClick={() => {
                  updateSeventyFiveHardChallenge?.(latestPausedChallenge.id, { isActive: true })
                }}
                className="btn-secondary flex items-center space-x-2"
                title={`Resume ${latestPausedChallenge.name}`}
              >
                <Play size={20} />
                <span>Resume</span>
              </button>
            )}
          </div>
        )}
        <div className="flex items-center gap-3">
          {sfhLastSynced && (
            <span className="text-xs text-gray-500">Last synced: {format(sfhLastSynced, 'MMM dd, HH:mm')}</span>
          )}
          <button onClick={exportChallenges} className="btn-secondary text-sm">Export</button>
          <label className="btn-secondary text-sm cursor-pointer">
            Import
            <input
              type="file"
              accept="application/json"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) importChallenges(f);
                e.currentTarget.value = '';
              }}
            />
          </label>
          {isSupabaseConfigured && (
            <button
              className={`btn-secondary text-sm ${syncing ? 'opacity-60 cursor-not-allowed' : ''}`}
              disabled={syncing}
              onClick={async () => {
                try {
                  setSyncing(true);
                  showGlobalToast?.('Syncing 75 Hard to cloud...', 'info');
                  const remote = await apiClient.getSFHChallenges();
                  const remoteKey = new Map(remote.map(c => [`${c.name}|${c.start_date}`, c] as const));
                  for (const c of seventyFiveHardChallenges) {
                    const key = `${c.name}|${format(c.startDate, 'yyyy-MM-dd')}`;
                    let remoteChallenge = remoteKey.get(key) || null;
                    if (!remoteChallenge) {
                      const created = await apiClient.createSFHChallenge({
                        name: c.name,
                        start_date: format(c.startDate, 'yyyy-MM-dd'),
                        end_date: format(c.endDate, 'yyyy-MM-dd'),
                        is_active: c.isActive,
                        current_day: c.currentDay,
                        rules: c.rules.map(r => ({ id: r.id, title: r.title, description: r.description, is_required: r.isRequired, is_custom: r.isCustom, daily_target: r.dailyTarget, segment_labels: r.segmentLabels })),
                        notes: c.notes || null,
                      });
                      remoteChallenge = created;
                      remoteKey.set(key, created);
                    }
                    const remoteEntries = await apiClient.getSFHEntries([remoteChallenge.id!]);
                    const remoteDates = new Set(remoteEntries.map(e => e.date));
                    for (const e of (c.dailyEntries || [])) {
                      const d = format(e.date, 'yyyy-MM-dd');
                      if (!remoteDates.has(d)) {
                        await apiClient.createSFHEntry({
                          challenge_id: remoteChallenge.id!,
                          date: d,
                          day: e.day,
                          rule_completions: e.ruleCompletions.map(rc => ({ rule_id: rc.ruleId, completed: rc.completed, completed_at: rc.completedAt ? rc.completedAt.toISOString() : null, segments: rc.segments })),
                          notes: e.notes || null,
                          progress_photo_url: e.progressPhotoUrl || null,
                          weight: e.weight ?? null,
                          measurements: e.measurements ?? null,
                        });
                      }
                    }
                  }
                  await initializeData?.();
                  showGlobalToast?.('Synced 75 Hard to cloud', 'success');
                } catch (err) {
                  console.error('[75Hard] Sync failed', err);
                  showGlobalToast?.('Sync failed', 'error');
                } finally {
                  setSyncing(false);
                }
              }}
            >
              {syncing ? 'Syncing...' : 'Sync to Cloud'}
            </button>
          )}
          <button
            className="btn-secondary text-sm"
            onClick={async () => { await purgeSFHDuplicateTasks?.() }}
          >
            Clean Duplicates
          </button>
          <button
            className="btn-secondary text-sm"
            onClick={async () => { await purgeNonSFHDuplicateTasks?.() }}
          >
            Clean All Task Duplicates
          </button>
          <label className="inline-flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={!!showSFHTasksInTasks}
              onChange={(e) => setShowSFHTasksInTasks?.(e.target.checked)}
            />
            <span>Show in Tasks</span>
          </label>
        </div>
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
                  Day {activeChallenge.currentDay} of 75 • Started {format(activeChallenge.startDate, 'MMM dd, yyyy')} • Ends {format(activeChallenge.endDate, 'MMM dd, yyyy')} • {
                    Math.max(0, differenceInDays(activeChallenge.endDate, new Date()) + 1)
                  } days remaining
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <button 
                  type="button"
                  onClick={() => {
                    updateSeventyFiveHardChallenge?.(activeChallenge.id, { isActive: false });
                  }}
                  className="btn-secondary text-sm flex items-center space-x-1 relative z-10 pointer-events-auto"
                >
                  <Pause size={16} />
                  <span>Pause</span>
                </button>
                <button
                  type="button"
                  onClick={openEditChallenge}
                  className="btn-secondary text-sm flex items-center space-x-1"
                >
                  <Edit3 size={16} />
                  <span>Edit</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setResetDate(format(new Date(), 'yyyy-MM-dd')); setShowResetModal(true); }}
                  className="btn-secondary text-sm"
                >
                  Reset Start
                </button>
              </div>
            </div>

            {/* Progress Bar */
            }
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

            {/* Progress Charts */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <TrendingUp size={18} /> Progress Charts
              </h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="p-4 rounded-lg border border-gray-200 bg-white">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700 flex items-center gap-2"><Scale size={16} /> Weight</span>
                    {(() => {
                      const weights = activeChallenge.dailyEntries
                        .filter(e => typeof e.weight === 'number')
                        .sort((a, b) => a.day - b.day)
                        .map(e => e.weight!)
                      const latest = weights.length ? weights[weights.length - 1] : undefined
                      return <span className="text-xs text-gray-500">{latest !== undefined ? `${latest} lbs` : '—'}</span>
                    })()}
                  </div>
                  {(() => {
                    const weights = activeChallenge.dailyEntries
                      .filter(e => typeof e.weight === 'number')
                      .sort((a, b) => a.day - b.day)
                      .map(e => e.weight!)
                    return <WeightSparkline values={weights} />
                  })()}
                </div>
                <div className="p-4 rounded-lg border border-gray-200 bg-white">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700 flex items-center gap-2"><Ruler size={16} /> Measurements</span>
                    <span className="text-xs text-gray-500">Chest/Waist (sum)</span>
                  </div>
                  {(() => {
                    const series = activeChallenge.dailyEntries
                      .filter(e => e.measurements && (e.measurements.chest || e.measurements.waist))
                      .sort((a, b) => a.day - b.day)
                      .map(e => (Number(e.measurements.chest || 0) + Number(e.measurements.waist || 0)))
                    return <WeightSparkline values={series} />
                  })()}
                </div>
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
                      className={`flex items-center justify-between p-4 rounded-lg border-2 transition-all duration-200 ${
                        isCompleted 
                          ? 'border-green-200 bg-green-50' 
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center space-x-4">
                        {(() => {
                          const target = getRuleDailyTarget(rule);
                          if (target > 1) {
                            const segs = completion?.segments || Array.from({ length: target }, () => false);
                            return (
                              <div className="flex items-center gap-2">
                                {segs.map((v, i) => (
                                  <button
                                    key={i}
                                    onClick={() => toggleRuleCompletion(activeChallenge.id, rule.id, new Date(), i)}
                                    className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-all duration-200 ${
                                      v ? 'border-green-500 bg-green-500 text-white' : 'border-gray-300 hover:border-green-400'
                                    }`}
                                    title={`Workout ${i + 1}`}
                                  >
                                    {v && <CheckSquare size={12} />}
                                  </button>
                                ))}
                              </div>
                            );
                          }
                          return (
                            <button
                              onClick={() => toggleRuleCompletion(activeChallenge.id, rule.id)}
                              className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-all duration-200 ${
                                isCompleted ? 'border-green-500 bg-green-500 text-white' : 'border-gray-300 hover:border-green-400'
                              }`}
                            >
                              {isCompleted && <CheckSquare size={14} />}
                            </button>
                          );
                        })()}
                        <div>
                          <h4 className={`font-medium ${isCompleted ? 'text-green-800' : 'text-gray-900'}`}>
                            {rule.title}
                          </h4>
                          <p className={`text-sm ${isCompleted ? 'text-green-600' : 'text-gray-600'}`}>
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
                <p className="mt-1 text-xs text-gray-500">
                  Ends on {(() => {
                    const sd = new Date(challengeFormData.startDate);
                    const ed = addDays(sd, 74);
                    return format(ed, 'MMM dd, yyyy');
                  })()}
                </p>
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

  {/* Edit Challenge Modal */}
  {showEditChallengeForm && activeChallenge && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 p-4 overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowEditChallengeForm(false);
            }
          }}
        >
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <Edit3 size={20} className="text-gray-700" />
                <h3 className="text-lg font-semibold text-gray-900">Edit Challenge</h3>
              </div>
              <button onClick={() => setShowEditChallengeForm(false)} className="p-2 hover:bg-gray-100 rounded-lg" aria-label="Close">
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 max-h-[60vh]">
              <form id="edit-challenge-form" onSubmit={applyEditChallenge} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Challenge Name</label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea
                    value={editForm.notes}
                    onChange={(e) => setEditForm(prev => ({ ...prev, notes: e.target.value }))}
                    className="input-field"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Rules</label>
                  <div className="space-y-3">
                    {editForm.rules.map((rule, idx) => (
                      <div key={rule.id} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center space-x-2 flex-1">
                            <button
                              type="button"
                              onClick={() => setEditForm(prev => ({ ...prev, rules: prev.rules.map((r, i) => i === idx ? { ...r, isRequired: !r.isRequired } : r) }))}
                              className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all duration-200 flex-shrink-0 ${rule.isRequired ? 'border-green-500 bg-green-500 text-white' : 'border-gray-300 hover:border-green-400'}`}
                            >
                              {rule.isRequired && <CheckSquare size={12} />}
                            </button>
                            <input
                              type="text"
                              value={rule.title}
                              onChange={(e) => setEditForm(prev => ({ ...prev, rules: prev.rules.map((r, i) => i === idx ? { ...r, title: e.target.value } : r) }))}
                              className="input-field text-sm font-medium flex-1"
                              placeholder="Rule title..."
                            />
                          </div>
                          {rule.isCustom && (
                            <button
                              type="button"
                              onClick={() => setEditForm(prev => ({ ...prev, rules: prev.rules.filter((_, i) => i !== idx) }))}
                              className="p-1 text-red-500 hover:bg-red-50 rounded-md ml-2"
                              title="Remove rule"
                            >
                              <X size={16} />
                            </button>
  )}

  {/* Reset Start Modal */}
  {showResetModal && activeChallenge && (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 p-4 overflow-y-auto"
      onClick={(e) => { if (e.target === e.currentTarget) setShowResetModal(false) }}
    >
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Reset Challenge Start</h3>
          <button onClick={() => setShowResetModal(false)} className="p-2 hover:bg-gray-100 rounded-lg" aria-label="Close">
            <X size={20} />
          </button>
        </div>
        <div className="p-6 space-y-3">
          <p className="text-sm text-gray-700">Pick a new start date. This will reset your day count and clear previous daily entries.</p>
          <label className="block text-sm font-medium text-gray-700">New Start Date</label>
          <input type="date" value={resetDate} onChange={(e) => setResetDate(e.target.value)} className="input-field" />
          <p className="text-xs text-gray-500">New end date will be {(() => { try { const sd = new Date(resetDate); return format(addDays(sd, 74), 'MMM dd, yyyy'); } catch { return '—' } })()}</p>
        </div>
        <div className="flex justify-end space-x-3 p-4 border-t border-gray-200 bg-gray-50 rounded-b-xl">
          <button onClick={() => setShowResetModal(false)} className="btn-secondary">Cancel</button>
          <button
            onClick={async () => {
              try {
                if (resetDate) await resetSFHChallengeStart?.(activeChallenge.id, new Date(resetDate));
                setShowResetModal(false);
              } catch (e) { console.error(e); }
            }}
            className="btn-primary"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  )}
                        </div>
                        <div className="ml-7">
                          <textarea
                            value={rule.description}
                            onChange={(e) => setEditForm(prev => ({ ...prev, rules: prev.rules.map((r, i) => i === idx ? { ...r, description: e.target.value } : r) }))}
                            className="input-field text-xs resize-none w-full"
                            rows={2}
                            placeholder="Rule description..."
                          />
                        </div>
                        <div className="ml-7 mt-2 flex items-center gap-2">
                          <label className="text-xs text-gray-600">Daily Target</label>
                          <input
                            type="number"
                            min={1}
                            value={rule.dailyTarget ?? 1}
                            onChange={(e) => {
                              const v = Math.max(1, Number(e.target.value) || 1)
                              setEditForm(prev => ({ ...prev, rules: prev.rules.map((r, i) => i === idx ? { ...r, dailyTarget: v } : r) }))
                            }}
                            className="w-20 input-field text-xs"
                          />
                        </div>
                        {(rule.dailyTarget ?? 1) > 1 && (
                          <div className="ml-7 mt-2">
                            <label className="block text-xs text-gray-600 mb-1">Segment Labels</label>
                            <div className="flex gap-2 flex-wrap">
                              {Array.from({ length: Math.max(1, rule.dailyTarget || 1) }).map((_, sIdx) => (
                                <input
                                  key={sIdx}
                                  type="text"
                                  placeholder={`Label #${sIdx + 1}`}
                                  value={rule.segmentLabels?.[sIdx] ?? ''}
                                  onChange={(e) => {
                                    const val = e.target.value
                                    setEditForm(prev => ({
                                      ...prev,
                                      rules: prev.rules.map((r, i) => {
                                        if (i !== idx) return r
                                        const labels = Array.from({ length: Math.max(1, r.dailyTarget || 1) }, (_v, ii) => r.segmentLabels?.[ii] ?? '')
                                        labels[sIdx] = val
                                        return { ...r, segmentLabels: labels }
                                      })
                                    }))
                                  }}
                                  className="input-field text-xs w-28"
                                />
                              ))}
                            </div>
                          </div>
                        )}
                        <div className="ml-7 mt-2">
                          <span className={`text-xs px-2 py-1 rounded-full ${rule.isRequired ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                            {rule.isRequired ? 'Required' : 'Optional'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <button
                      type="button"
                      onClick={() => setEditForm(prev => ({ ...prev, rules: [...prev.rules, { id: generateId(), title: 'New Rule', description: 'Custom rule', isRequired: true, isCustom: true }] }))}
                      className="btn-secondary text-sm flex items-center space-x-1"
                    >
                      <Plus size={16} />
                      <span>Add Rule</span>
                    </button>
                  </div>
                </div>
              </form>
            </div>
            <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50 rounded-b-xl">
              <button onClick={() => setShowEditChallengeForm(false)} className="btn-secondary">Cancel</button>
              <button type="submit" form="edit-challenge-form" className="btn-primary">Save Changes</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
