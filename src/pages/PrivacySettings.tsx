/**
 * Privacy Settings Page
 * Configure default privacy levels for each module/tab
 */

import React, { useState, useEffect } from 'react';
import { Shield, Lock, Eye, Users, Globe, Info, Save, Check, Loader2 } from 'lucide-react';
import { MODULE_CONFIGS, PERMISSION_LEVEL_INFO, type ShareableModule, type ModulePermissionLevel } from '@/shared/types/connections';
import { useToast } from '@/hooks/useToast';
import { usePrivacyPreferences, useUpdatePrivacyPreferences } from '@/hooks/usePrivacySettings';
import LoadingSpinner from '@/components/LoadingSpinner';

// Map navigation sections to shareable modules
const NAVIGATION_MODULES: Array<{
  section: string;
  modules: Array<{ module: ShareableModule; navName: string }>;
}> = [
  {
    section: 'Productivity',
    modules: [
      { module: 'habits', navName: 'Habits' },
      { module: 'todos', navName: 'Tasks' },
      { module: 'notes', navName: 'Notes' },
      { module: 'projects', navName: 'Projects' },
    ],
  },
  {
    section: 'Wellbeing',
    modules: [
      { module: 'journal', navName: 'Journal' },
      { module: 'skincare', navName: 'Skincare' },
      { module: 'mood', navName: 'Mood' },
    ],
  },
  {
    section: 'Personal',
    modules: [
      { module: 'travel', navName: 'Travel' },
      { module: 'trip-planner', navName: 'Trip Planner' },
      { module: 'finances', navName: 'Finances' },
      { module: 'shopping', navName: 'Shopping' },
      { module: 'meals', navName: 'Meals' },
      { module: 'goals', navName: 'Goals' },
    ],
  },
];

const PrivacySettings: React.FC = () => {
  const { showToast } = useToast();
  const [hasChanges, setHasChanges] = useState(false);

  // Fetch current privacy preferences
  const { data: savedPreferences, isLoading } = usePrivacyPreferences();
  const updateMutation = useUpdatePrivacyPreferences();

  // Local state for editing
  const [privacySettings, setPrivacySettings] = useState<Record<ShareableModule, ModulePermissionLevel>>(
    Object.fromEntries(
      Object.entries(MODULE_CONFIGS).map(([module, config]) => [module, config.defaultLevel])
    ) as Record<ShareableModule, ModulePermissionLevel>
  );

  // Load saved preferences when they arrive
  useEffect(() => {
    if (savedPreferences) {
      setPrivacySettings(savedPreferences);
      setHasChanges(false);
    }
  }, [savedPreferences]);

  const handlePrivacyChange = (module: ShareableModule, level: ModulePermissionLevel) => {
    setPrivacySettings(prev => ({ ...prev, [module]: level }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    try {
      await updateMutation.mutateAsync(privacySettings);
      showToast('Privacy settings saved successfully', 'success');
      setHasChanges(false);
    } catch (error) {
      showToast('Failed to save privacy settings', 'error');
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  const getPermissionIcon = (level: ModulePermissionLevel) => {
    switch (level) {
      case 'none': return <Lock className="w-4 h-4" />;
      case 'view': return <Eye className="w-4 h-4" />;
      case 'collaborate': return <Users className="w-4 h-4" />;
      case 'merged': return <Globe className="w-4 h-4" />;
    }
  };

  const getPermissionColor = (level: ModulePermissionLevel) => {
    const info = PERMISSION_LEVEL_INFO[level];
    return info.color;
  };

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Shield className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Privacy Settings</h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Control who can see your data when you connect with others
          </p>
        </div>

        {hasChanges && (
          <button
            onClick={handleSave}
            disabled={updateMutation.isPending}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
          >
            {updateMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Changes
              </>
            )}
          </button>
        )}
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex gap-3">
          <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-900 dark:text-blue-300">
            <p className="font-semibold mb-1">How Privacy Settings Work</p>
            <p>
              These are your <strong>default privacy levels</strong> for new connections. When someone connects with you,
              they'll get these permission levels by default. You can always customize permissions for individual connections later.
            </p>
          </div>
        </div>
      </div>

      {/* Privacy Controls by Section */}
      {NAVIGATION_MODULES.map(({ section, modules }) => (
        <div key={section} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          {/* Section Header */}
          <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{section}</h2>
          </div>

          {/* Module List */}
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {modules.map(({ module, navName }) => {
              const config = MODULE_CONFIGS[module];
              const currentLevel = privacySettings[module];
              const levelInfo = PERMISSION_LEVEL_INFO[currentLevel];

              return (
                <div key={module} className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-900/30 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    {/* Module Info */}
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 dark:text-white mb-1">{navName}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{config.description}</p>
                    </div>

                    {/* Privacy Level Selector */}
                    <div className="flex items-center gap-2">
                      {config.supportedLevels.map(level => {
                        const info = PERMISSION_LEVEL_INFO[level];
                        const isSelected = currentLevel === level;
                        const colorClass = isSelected
                          ? `bg-${info.color}-100 dark:bg-${info.color}-900/30 border-${info.color}-500 text-${info.color}-700 dark:text-${info.color}-300`
                          : 'bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600';

                        return (
                          <button
                            key={level}
                            onClick={() => handlePrivacyChange(module, level)}
                            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border-2 transition-all ${colorClass}`}
                            title={info.description}
                          >
                            {getPermissionIcon(level)}
                            <span className="text-sm font-medium">{info.label}</span>
                            {isSelected && <Check className="w-4 h-4" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* Legend */}
      <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Permission Levels Explained</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(PERMISSION_LEVEL_INFO).map(([level, info]) => (
            <div key={level} className="flex items-start gap-3">
              <div className={`p-2 bg-${info.color}-100 dark:bg-${info.color}-900/30 rounded-lg`}>
                {getPermissionIcon(level as ModulePermissionLevel)}
              </div>
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">{info.label}</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">{info.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PrivacySettings;

