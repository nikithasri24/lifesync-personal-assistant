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
  const [syncError, setSyncError] = useState<string | null>(null);
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetDate, setResetDate] = useState<string>('');
  const [showDayForm, setShowDayForm] = useState(false);
  const [selectedChallenge, setSelectedChallenge] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    show: boolean;
    title: string;
    message: string;
    confirmText: string;
    onConfirm: () => void;
    variant?: 'danger' | 'warning';
  }>({
    show: false,
    title: '',
    message: '',
    confirmText: 'Confirm',
    onConfirm: () => {},
    variant: 'warning'
  });

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

  const [photoPreview, setPhotoPreview] = useState<string>('');

  const handlePhotoUpload = (file: File) => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setDayFormData(prev => ({ ...prev, progressPhotoUrl: base64String }));
        setPhotoPreview(base64String);
      };
      reader.readAsDataURL(file);
    } else {
      showGlobalToast?.('Please select a valid image file', 'error');
    }
  };

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
      if (seventyFiveHardChallenges.length === 0) {
        showGlobalToast?.('No challenges to export', 'info');
        return;
      }

      const data = JSON.stringify(seventyFiveHardChallenges, null, 2);
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `75hard-export-${format(new Date(), 'yyyy-MM-dd')}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showGlobalToast?.(`Exported ${seventyFiveHardChallenges.length} challenge${seventyFiveHardChallenges.length > 1 ? 's' : ''}`, 'success');
    } catch (e) {
      console.error('[75Hard] Export failed', e);
      const errorMessage = e instanceof Error
        ? `Export failed: ${e.message}`
        : 'Export failed. Please try again.';
      showGlobalToast?.(errorMessage, 'error');
    }
  };

  const importChallenges = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const text = String(reader.result || '');
        const imported = JSON.parse(text) as SeventyFiveHardChallenge[];

        if (!Array.isArray(imported)) {
          showGlobalToast?.('Import failed: Invalid file format. Expected an array of challenges.', 'error');
          return;
        }

        // Merge: append imported challenges
        let importedCount = 0;
        imported.forEach((c) => {
          try {
            addSeventyFiveHardChallenge?.(c);
            importedCount++;
          } catch (err) {
            console.error('[75Hard] Failed to import challenge', c.name, err);
          }
        });

        if (importedCount > 0) {
          showGlobalToast?.(`Successfully imported ${importedCount} challenge${importedCount > 1 ? 's' : ''}`, 'success');
        } else {
          showGlobalToast?.('No challenges were imported', 'error');
        }
      } catch (e) {
        console.error('[75Hard] Import failed', e);
        const errorMessage = e instanceof Error
          ? `Import failed: ${e.message}`
          : 'Import failed. Please check the file format and try again.';
        showGlobalToast?.(errorMessage, 'error');
      }
    };
    reader.readAsText(file);
  };

  const handleCreateChallenge = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    const trimmedName = challengeFormData.name.trim();
    if (!trimmedName) {
      showGlobalToast?.('Please enter a challenge name', 'error');
      return;
    }

    if (!challengeFormData.startDate) {
      showGlobalToast?.('Please select a start date', 'error');
      return;
    }

    const startDate = new Date(challengeFormData.startDate);
    const today = new Date();
    const oneYearAgo = addDays(today, -365);
    const oneYearAhead = addDays(today, 365);

    if (startDate < oneYearAgo) {
      showGlobalToast?.('Start date cannot be more than 1 year in the past', 'error');
      return;
    }

    if (startDate > oneYearAhead) {
      showGlobalToast?.('Start date cannot be more than 1 year in the future', 'error');
      return;
    }

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

    if (rules.length === 0) {
      showGlobalToast?.('Please select at least one rule', 'error');
      return;
    }

    const newChallenge: SeventyFiveHardChallenge = {
      id: generateId(),
      name: trimmedName,
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

  const getStreakStats = (challenge: SeventyFiveHardChallenge) => {
    const totalDays = Math.min(challenge.currentDay, 75);
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;

    // Calculate streaks by iterating through days
    for (let day = 1; day <= totalDays; day++) {
      const progress = getDayProgress(challenge, day);
      const isDayComplete = progress.completed === progress.total && progress.total > 0;

      if (isDayComplete) {
        tempStreak++;
        longestStreak = Math.max(longestStreak, tempStreak);
      } else {
        tempStreak = 0;
      }
    }

    // Current streak is the temp streak if we're still on a streak
    const latestDayProgress = getDayProgress(challenge, totalDays);
    const isLatestDayComplete = latestDayProgress.completed === latestDayProgress.total && latestDayProgress.total > 0;
    currentStreak = isLatestDayComplete ? tempStreak : 0;

    return { currentStreak, longestStreak };
  };

  const getRuleCompletionStats = (challenge: SeventyFiveHardChallenge) => {
    const totalDays = Math.min(challenge.currentDay, 75);
    const ruleStats: Record<string, { completed: number; total: number; percentage: number }> = {};

    challenge.rules.forEach(rule => {
      let completedCount = 0;

      for (let day = 1; day <= totalDays; day++) {
        const entry = challenge.dailyEntries.find(e => e.day === day);
        const completion = entry?.ruleCompletions.find(c => c.ruleId === rule.id);

        if (completion?.completed) {
          completedCount++;
        }
      }

      ruleStats[rule.id] = {
        completed: completedCount,
        total: totalDays,
        percentage: totalDays > 0 ? Math.round((completedCount / totalDays) * 100) : 0
      };
    });

    return ruleStats;
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
          {syncError && (
            <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 px-2 py-1 rounded">
              <span>Sync error: {syncError}</span>
              <button
                onClick={async () => {
                  const syncButton = document.querySelector('[data-sync-button]') as HTMLButtonElement;
                  syncButton?.click();
                }}
                className="underline hover:no-underline"
              >
                Retry
              </button>
            </div>
          )}
          {!syncError && sfhLastSynced && (
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
              data-sync-button
              className={`btn-secondary text-sm flex items-center gap-2 ${syncing ? 'opacity-60 cursor-not-allowed' : ''}`}
              disabled={syncing}
              onClick={async () => {
                const performSync = async () => {
                  try {
                    setSyncing(true);
                    setSyncError(null);
                    showGlobalToast?.('Syncing 75 Hard to cloud...', 'info');
                    const remote = await apiClient.getSFHChallenges();
                    const remoteKey = new Map(remote.map(c => [`${c.name}|${c.start_date}` as const, c] as const));
                    for (const c of seventyFiveHardChallenges) {
                      const key = `${c.name}|${format(c.startDate, 'yyyy-MM-dd')}` as `${string}|${string}`;
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
                    setSyncError(null);
                    showGlobalToast?.('Synced 75 Hard to cloud successfully', 'success');
                  } catch (err) {
                    console.error('[75Hard] Sync failed', err);
                    const errorMessage = err instanceof Error
                      ? err.message
                      : 'Unknown error occurred';
                    setSyncError(errorMessage);
                    showGlobalToast?.(`Sync failed: ${errorMessage}. Click retry to try again.`, 'error');
                  } finally {
                    setSyncing(false);
                  }
                };
                await performSync();
              }}
            >
              {syncing && (
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              <span>{syncing ? 'Syncing...' : 'Sync to Cloud'}</span>
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
                    setConfirmDialog({
                      show: true,
                      title: 'Pause Challenge?',
                      message: 'Pausing will stop daily progress tracking. You can resume later, but your current day count will be preserved. Are you sure?',
                      confirmText: 'Pause Challenge',
                      variant: 'warning',
                      onConfirm: () => {
                        updateSeventyFiveHardChallenge?.(activeChallenge.id, { isActive: false });
                        setConfirmDialog(prev => ({ ...prev, show: false }));
                      }
                    });
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
                <button
                  type="button"
                  onClick={() => {
                    setConfirmDialog({
                      show: true,
                      title: 'Restart Challenge?',
                      message: 'This will create a fresh 75 Hard challenge with the same rules. Your current progress will be saved as a paused challenge for reference. Ready to start over?',
                      confirmText: 'Restart Challenge',
                      variant: 'warning',
                      onConfirm: () => {
                        // Pause the current challenge
                        updateSeventyFiveHardChallenge?.(activeChallenge.id, { isActive: false });

                        // Create a new challenge with the same rules
                        const newChallenge: SeventyFiveHardChallenge = {
                          id: generateId(),
                          name: `${activeChallenge.name} (Restart)`,
                          startDate: new Date(),
                          endDate: addDays(new Date(), 74),
                          isActive: true,
                          currentDay: 1,
                          rules: activeChallenge.rules.map(r => ({ ...r, id: generateId() })),
                          dailyEntries: [],
                          notes: activeChallenge.notes,
                          createdAt: new Date()
                        };

                        addSeventyFiveHardChallenge?.(newChallenge);
                        showGlobalToast?.('Challenge restarted! Your previous attempt has been saved.', 'success');
                        setConfirmDialog(prev => ({ ...prev, show: false }));
                      }
                    });
                  }}
                  className="btn-secondary text-sm flex items-center space-x-1"
                >
                  <RotateCcw size={16} />
                  <span>Restart</span>
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

            {/* Analytics Section */}
            {(() => {
              const streakStats = getStreakStats(activeChallenge);
              const ruleStats = getRuleCompletionStats(activeChallenge);

              return (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Target size={18} /> Analytics & Insights
                  </h3>

                  {/* Streak Stats */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="p-4 rounded-lg border border-gray-200 bg-gradient-to-br from-blue-50 to-blue-100">
                      <div className="text-3xl font-bold text-blue-600 mb-1">
                        {streakStats.currentStreak}
                      </div>
                      <div className="text-sm font-medium text-blue-800">Current Streak</div>
                      <div className="text-xs text-blue-600 mt-1">
                        {streakStats.currentStreak === 0 ? 'Complete today to start!' : 'consecutive days'}
                      </div>
                    </div>
                    <div className="p-4 rounded-lg border border-gray-200 bg-gradient-to-br from-purple-50 to-purple-100">
                      <div className="text-3xl font-bold text-purple-600 mb-1">
                        {streakStats.longestStreak}
                      </div>
                      <div className="text-sm font-medium text-purple-800">Longest Streak</div>
                      <div className="text-xs text-purple-600 mt-1">
                        {streakStats.longestStreak === 0 ? 'No streaks yet' : 'consecutive days'}
                      </div>
                    </div>
                  </div>

                  {/* Rule Completion Stats */}
                  <div className="p-4 rounded-lg border border-gray-200 bg-white">
                    <h4 className="text-sm font-semibold text-gray-900 mb-3">Rule Completion Rates</h4>
                    <div className="space-y-3">
                      {activeChallenge.rules.map((rule) => {
                        const stats = ruleStats[rule.id];
                        if (!stats) return null;

                        return (
                          <div key={rule.id}>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium text-gray-700">{rule.title}</span>
                              <span className="text-sm text-gray-600">
                                {stats.completed}/{stats.total} ({stats.percentage}%)
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full transition-all duration-300 ${
                                  stats.percentage === 100 ? 'bg-green-500' :
                                  stats.percentage >= 75 ? 'bg-blue-500' :
                                  stats.percentage >= 50 ? 'bg-yellow-500' :
                                  'bg-red-500'
                                }`}
                                style={{ width: `${stats.percentage}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })()}

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

            {/* Progress Photos Gallery */}
            {(() => {
              const photosWithDays = activeChallenge.dailyEntries
                .filter(e => e.progressPhotoUrl)
                .sort((a, b) => a.day - b.day);

              if (photosWithDays.length === 0) return null;

              return (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Camera size={18} /> Progress Photos ({photosWithDays.length})
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {photosWithDays.map((entry) => (
                      <div key={entry.id} className="relative group">
                        <img
                          src={entry.progressPhotoUrl}
                          alt={`Day ${entry.day} progress`}
                          className="w-full h-32 object-cover rounded-lg border border-gray-300 cursor-pointer hover:opacity-90 transition-opacity"
                          onClick={() => {
                            // Open in new tab for full view
                            window.open(entry.progressPhotoUrl, '_blank');
                          }}
                        />
                        <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded-b-lg">
                          Day {entry.day}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Calendar View */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Calendar size={18} /> 75-Day Calendar
                </h3>
                <button
                  onClick={() => setShowCalendar(!showCalendar)}
                  className="btn-secondary text-sm"
                >
                  {showCalendar ? 'Hide Calendar' : 'Show Calendar'}
                </button>
              </div>

              {showCalendar && (
                <div className="p-4 rounded-lg border border-gray-200 bg-white">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4 text-xs">
                      <div className="flex items-center gap-1">
                        <div className="w-4 h-4 rounded bg-green-500"></div>
                        <span>Complete</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-4 h-4 rounded bg-yellow-500"></div>
                        <span>Partial</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-4 h-4 rounded bg-gray-300"></div>
                        <span>Incomplete</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-4 h-4 rounded border-2 border-blue-500"></div>
                        <span>Today</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-7 sm:grid-cols-10 md:grid-cols-15 gap-2">
                    {Array.from({ length: 75 }, (_, i) => i + 1).map((dayNum) => {
                      const dayDate = addDays(activeChallenge.startDate, dayNum - 1);
                      const entry = activeChallenge.dailyEntries.find(e => e.day === dayNum);
                      const progress = entry
                        ? {
                            completed: entry.ruleCompletions.filter(c => c.completed).length,
                            total: entry.ruleCompletions.length
                          }
                        : { completed: 0, total: activeChallenge.rules.length };

                      const isComplete = progress.completed === progress.total && progress.total > 0;
                      const isPartial = progress.completed > 0 && progress.completed < progress.total;
                      const isToday = dayNum === activeChallenge.currentDay;
                      const isFuture = dayNum > activeChallenge.currentDay;

                      return (
                        <button
                          key={dayNum}
                          onClick={() => {
                            if (!isFuture) {
                              const entry = activeChallenge.dailyEntries.find(e => e.day === dayNum);
                              setDayFormData({
                                weight: entry?.weight?.toString() || '',
                                measurements: {
                                  chest: entry?.measurements?.chest?.toString() || '',
                                  waist: entry?.measurements?.waist?.toString() || '',
                                  hips: entry?.measurements?.hips?.toString() || '',
                                  arms: entry?.measurements?.arms?.toString() || '',
                                  thighs: entry?.measurements?.thighs?.toString() || ''
                                },
                                notes: entry?.notes || '',
                                progressPhotoUrl: entry?.progressPhotoUrl || ''
                              });
                              setPhotoPreview(entry?.progressPhotoUrl || '');
                              setSelectedChallenge(activeChallenge.id);
                              setSelectedDate(dayDate);
                              setShowDayForm(true);
                            }
                          }}
                          disabled={isFuture}
                          className={`
                            aspect-square rounded text-sm font-medium transition-all duration-200
                            ${isToday ? 'ring-2 ring-blue-500 ring-offset-2' : ''}
                            ${isComplete ? 'bg-green-500 text-white hover:bg-green-600' : ''}
                            ${isPartial ? 'bg-yellow-500 text-white hover:bg-yellow-600' : ''}
                            ${!isComplete && !isPartial && !isFuture ? 'bg-gray-300 text-gray-700 hover:bg-gray-400' : ''}
                            ${isFuture ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'cursor-pointer'}
                          `}
                          title={`Day ${dayNum} - ${format(dayDate, 'MMM dd')} - ${isComplete ? 'Complete' : isPartial ? 'Partial' : isFuture ? 'Future' : 'Incomplete'}`}
                        >
                          {dayNum}
                        </button>
                      );
                    })}
                  </div>

                  <p className="text-xs text-gray-500 mt-3">
                    Click on any past or current day to view or edit details
                  </p>
                </div>
              )}
            </div>

            {/* Today's Rules */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                  <Calendar size={20} />
                  <span>Today - Day {activeChallenge.currentDay}</span>
                </h3>
                <button
                  onClick={() => {
                    const entry = getCurrentDayEntry(activeChallenge);
                    setDayFormData({
                      weight: entry?.weight?.toString() || '',
                      measurements: {
                        chest: entry?.measurements?.chest?.toString() || '',
                        waist: entry?.measurements?.waist?.toString() || '',
                        hips: entry?.measurements?.hips?.toString() || '',
                        arms: entry?.measurements?.arms?.toString() || '',
                        thighs: entry?.measurements?.thighs?.toString() || ''
                      },
                      notes: entry?.notes || '',
                      progressPhotoUrl: entry?.progressPhotoUrl || ''
                    });
                    setPhotoPreview(entry?.progressPhotoUrl || '');
                    setSelectedChallenge(activeChallenge.id);
                    setSelectedDate(new Date());
                    setShowDayForm(true);
                  }}
                  className="btn-secondary text-sm flex items-center space-x-1"
                >
                  <Edit3 size={16} />
                  <span>Add Daily Details</span>
                </button>
              </div>

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
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3">
                <p className="text-sm text-red-800 font-medium">Warning: This action cannot be undone!</p>
                <p className="text-xs text-red-700 mt-1">Resetting will clear all your daily entries, progress photos, weight, and measurement data.</p>
              </div>
              <p className="text-sm text-gray-700">Pick a new start date. This will reset your day count to Day 1 and clear all progress.</p>
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

      {/* Daily Entry Modal */}
      {showDayForm && selectedChallenge && selectedDate && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 p-4 overflow-y-auto"
          onClick={(e) => { if (e.target === e.currentTarget) setShowDayForm(false) }}
        >
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl my-8 flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <Scale size={20} className="text-gray-700" />
                <h3 className="text-lg font-semibold text-gray-900">
                  Daily Entry - {format(selectedDate, 'MMM dd, yyyy')}
                </h3>
              </div>
              <button onClick={() => setShowDayForm(false)} className="p-2 hover:bg-gray-100 rounded-lg" aria-label="Close">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 max-h-[70vh]">
              <form
                id="day-entry-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  const challenge = seventyFiveHardChallenges.find(c => c.id === selectedChallenge);
                  if (!challenge) return;

                  const dayNumber = differenceInDays(selectedDate, challenge.startDate) + 1;
                  let entry = challenge.dailyEntries.find(e => e.day === dayNumber);

                  const measurementsRaw = {
                    chest: dayFormData.measurements.chest ? parseFloat(dayFormData.measurements.chest) : undefined,
                    waist: dayFormData.measurements.waist ? parseFloat(dayFormData.measurements.waist) : undefined,
                    hips: dayFormData.measurements.hips ? parseFloat(dayFormData.measurements.hips) : undefined,
                    arms: dayFormData.measurements.arms ? parseFloat(dayFormData.measurements.arms) : undefined,
                    thighs: dayFormData.measurements.thighs ? parseFloat(dayFormData.measurements.thighs) : undefined
                  };

                  // Filter out undefined values
                  const measurements: Record<string, number> = Object.entries(measurementsRaw)
                    .filter(([_, v]) => v !== undefined)
                    .reduce((acc, [k, v]) => ({ ...acc, [k]: v! }), {});

                  if (!entry) {
                    // Create new entry
                    const newEntry: SeventyFiveHardEntry = {
                      id: generateId(),
                      challengeId: selectedChallenge,
                      date: selectedDate,
                      day: dayNumber,
                      ruleCompletions: challenge.rules.map(rule => ({
                        ruleId: rule.id,
                        completed: false
                      })),
                      notes: dayFormData.notes,
                      progressPhotoUrl: dayFormData.progressPhotoUrl,
                      weight: dayFormData.weight ? parseFloat(dayFormData.weight) : undefined,
                      measurements
                    };
                    addSeventyFiveHardEntry?.(newEntry);
                  } else {
                    // Update existing entry
                    updateSeventyFiveHardEntry?.(entry.id, {
                      notes: dayFormData.notes,
                      progressPhotoUrl: dayFormData.progressPhotoUrl,
                      weight: dayFormData.weight ? parseFloat(dayFormData.weight) : undefined,
                      measurements
                    });
                  }

                  showGlobalToast?.('Daily entry saved successfully', 'success');
                  setShowDayForm(false);
                }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                    <Scale size={16} />
                    Weight (lbs)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={dayFormData.weight}
                    onChange={(e) => setDayFormData(prev => ({ ...prev, weight: e.target.value }))}
                    className="input-field"
                    placeholder="e.g., 185.5"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <Ruler size={16} />
                    Body Measurements (inches)
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Chest</label>
                      <input
                        type="number"
                        step="0.1"
                        value={dayFormData.measurements.chest}
                        onChange={(e) => setDayFormData(prev => ({
                          ...prev,
                          measurements: { ...prev.measurements, chest: e.target.value }
                        }))}
                        className="input-field text-sm"
                        placeholder="e.g., 42.0"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Waist</label>
                      <input
                        type="number"
                        step="0.1"
                        value={dayFormData.measurements.waist}
                        onChange={(e) => setDayFormData(prev => ({
                          ...prev,
                          measurements: { ...prev.measurements, waist: e.target.value }
                        }))}
                        className="input-field text-sm"
                        placeholder="e.g., 32.5"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Hips</label>
                      <input
                        type="number"
                        step="0.1"
                        value={dayFormData.measurements.hips}
                        onChange={(e) => setDayFormData(prev => ({
                          ...prev,
                          measurements: { ...prev.measurements, hips: e.target.value }
                        }))}
                        className="input-field text-sm"
                        placeholder="e.g., 38.0"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Arms</label>
                      <input
                        type="number"
                        step="0.1"
                        value={dayFormData.measurements.arms}
                        onChange={(e) => setDayFormData(prev => ({
                          ...prev,
                          measurements: { ...prev.measurements, arms: e.target.value }
                        }))}
                        className="input-field text-sm"
                        placeholder="e.g., 14.5"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Thighs</label>
                      <input
                        type="number"
                        step="0.1"
                        value={dayFormData.measurements.thighs}
                        onChange={(e) => setDayFormData(prev => ({
                          ...prev,
                          measurements: { ...prev.measurements, thighs: e.target.value }
                        }))}
                        className="input-field text-sm"
                        placeholder="e.g., 24.0"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <Camera size={16} />
                    Progress Photo
                  </label>

                  {photoPreview && (
                    <div className="mb-3 relative">
                      <img
                        src={photoPreview}
                        alt="Progress photo preview"
                        className="w-full max-w-md h-48 object-cover rounded-lg border border-gray-300"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setPhotoPreview('');
                          setDayFormData(prev => ({ ...prev, progressPhotoUrl: '' }));
                        }}
                        className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors"
                        title="Remove photo"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="btn-secondary text-sm cursor-pointer inline-flex items-center space-x-2">
                      <Camera size={16} />
                      <span>Upload Photo</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handlePhotoUpload(file);
                          e.currentTarget.value = '';
                        }}
                      />
                    </label>
                    <p className="text-xs text-gray-500">
                      Or enter a URL below
                    </p>
                    <input
                      type="text"
                      value={dayFormData.progressPhotoUrl.startsWith('data:') ? '' : dayFormData.progressPhotoUrl}
                      onChange={(e) => {
                        setDayFormData(prev => ({ ...prev, progressPhotoUrl: e.target.value }));
                        setPhotoPreview(e.target.value);
                      }}
                      className="input-field"
                      placeholder="https://example.com/photo.jpg"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Daily Notes
                  </label>
                  <textarea
                    value={dayFormData.notes}
                    onChange={(e) => setDayFormData(prev => ({ ...prev, notes: e.target.value }))}
                    className="input-field"
                    rows={4}
                    placeholder="How did today go? Any reflections or observations..."
                  />
                </div>
              </form>
            </div>

            <div className="flex justify-end space-x-3 p-4 border-t border-gray-200 bg-gray-50 rounded-b-xl">
              <button onClick={() => setShowDayForm(false)} className="btn-secondary">Cancel</button>
              <button type="submit" form="day-entry-form" className="btn-primary">Save Entry</button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      {confirmDialog.show && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setConfirmDialog(prev => ({ ...prev, show: false })) }}
        >
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{confirmDialog.title}</h3>
              <p className="text-sm text-gray-700 mb-6">{confirmDialog.message}</p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setConfirmDialog(prev => ({ ...prev, show: false }))}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDialog.onConfirm}
                  className={confirmDialog.variant === 'danger' ? 'bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors' : 'btn-primary'}
                >
                  {confirmDialog.confirmText}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
