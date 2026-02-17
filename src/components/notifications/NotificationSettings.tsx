/**
 * NotificationSettings Component
 * User preferences for notifications and reminders
 */

import React, { useState, useEffect } from 'react';
import {
  Bell,
  BellOff,
  Clock,
  Moon,
  ListTodo,
  Calendar,
  Target,
  Sun,
  Volume2,
  VolumeX,
  Smartphone,
  X,
  Check,
  Loader2,
  Save,
} from 'lucide-react';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useReminderPreferences, useUpdateReminderPreferences } from '@/hooks/useReminderPreferences';
import { DEFAULT_REMINDER_PREFS, type ReminderPreferences } from '@/services/reminders';

interface NotificationSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

function ToggleSwitch({ 
  enabled, 
  onChange, 
  disabled = false 
}: { 
  enabled: boolean; 
  onChange: (enabled: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={() => onChange(!enabled)}
      disabled={disabled}
      className={`relative w-11 h-6 rounded-full transition-colors ${
        enabled ? 'bg-[#C18B5E]' : 'bg-slate-300'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
        enabled ? 'translate-x-5' : 'translate-x-0'
      }`} />
    </button>
  );
}

function SettingRow({ 
  icon, 
  label, 
  description, 
  enabled, 
  onChange,
  disabled = false,
}: { 
  icon: React.ReactNode;
  label: string;
  description?: string;
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-3">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-slate-100 rounded-lg text-slate-600">
          {icon}
        </div>
        <div>
          <p className="text-sm font-medium text-slate-800">{label}</p>
          {description && <p className="text-xs text-slate-500">{description}</p>}
        </div>
      </div>
      <ToggleSwitch enabled={enabled} onChange={onChange} disabled={disabled} />
    </div>
  );
}

export function NotificationSettings({ isOpen, onClose }: NotificationSettingsProps) {
  const { isSubscribed, isSupported, subscribe, unsubscribe, isLoading, showTestNotification } = usePushNotifications();
  const { data: savedPrefs, isLoading: isLoadingPrefs } = useReminderPreferences();
  const updatePrefs = useUpdateReminderPreferences();
  const [prefs, setPrefs] = useState<ReminderPreferences>(DEFAULT_REMINDER_PREFS);
  const [hasChanges, setHasChanges] = useState(false);

  // Load saved preferences when they're fetched
  useEffect(() => {
    if (savedPrefs) {
      setPrefs(savedPrefs);
    }
  }, [savedPrefs]);

  const updatePref = <K extends keyof ReminderPreferences>(key: K, value: ReminderPreferences[K]) => {
    setPrefs(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleTogglePush = async () => {
    if (isSubscribed) {
      await unsubscribe();
    } else {
      await subscribe('LifeSync Web');
    }
  };

  const handleSave = async () => {
    await updatePrefs.mutateAsync(prefs);
    setHasChanges(false);
  };

  const handleClose = () => {
    // Reset to saved if there are unsaved changes
    if (hasChanges && savedPrefs) {
      setPrefs(savedPrefs);
      setHasChanges(false);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="w-full max-w-md bg-white rounded-xl shadow-2xl max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-[#C18B5E]" />
            <h2 className="font-semibold text-slate-800">Notification Settings</h2>
            {isLoadingPrefs && <Loader2 className="w-4 h-4 animate-spin text-slate-400" />}
          </div>
          <div className="flex items-center gap-2">
            {hasChanges && (
              <button
                onClick={handleSave}
                disabled={updatePrefs.isPending}
                className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-white bg-[#C18B5E] hover:bg-[#B5795A] rounded-lg disabled:opacity-50"
              >
                {updatePrefs.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Save
              </button>
            )}
            <button
              onClick={handleClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Push Notifications */}
          <div>
            <h3 className="text-xs font-semibold text-slate-500 uppercase mb-2">Push Notifications</h3>
            <div className="bg-slate-50 rounded-lg p-3">
              <SettingRow
                icon={<Smartphone className="w-4 h-4" />}
                label="Push Notifications"
                description={isSupported ? (isSubscribed ? 'Enabled' : 'Disabled') : 'Not supported'}
                enabled={isSubscribed}
                onChange={handleTogglePush}
                disabled={!isSupported || isLoading}
              />
              {isSubscribed && (
                <button
                  onClick={showTestNotification}
                  className="w-full mt-2 px-3 py-2 text-sm text-[#C18B5E] bg-[#F5EBE0] rounded-lg hover:bg-[#F9F3ED]"
                >
                  Send Test Notification
                </button>
              )}
            </div>
          </div>
          
          {/* Reminder Types */}
          <div>
            <h3 className="text-xs font-semibold text-slate-500 uppercase mb-2">Reminder Types</h3>
            <div className="bg-slate-50 rounded-lg px-3 divide-y divide-slate-200">
              <SettingRow
                icon={<ListTodo className="w-4 h-4" />}
                label="Task Reminders"
                description="15 minutes before scheduled tasks"
                enabled={prefs.taskRemindersEnabled}
                onChange={(v) => updatePref('taskRemindersEnabled', v)}
              />
              <SettingRow
                icon={<Calendar className="w-4 h-4" />}
                label="Event Reminders"
                description="15 minutes before calendar events"
                enabled={prefs.eventRemindersEnabled}
                onChange={(v) => updatePref('eventRemindersEnabled', v)}
              />
              <SettingRow
                icon={<Target className="w-4 h-4" />}
                label="Habit Reminders"
                description="Reminders for daily habits"
                enabled={prefs.habitRemindersEnabled}
                onChange={(v) => updatePref('habitRemindersEnabled', v)}
              />
              <SettingRow
                icon={<Sun className="w-4 h-4" />}
                label="Morning Briefing"
                description={`Daily briefing at ${prefs.morningBriefingTime}`}
                enabled={prefs.morningBriefingEnabled}
                onChange={(v) => updatePref('morningBriefingEnabled', v)}
              />
            </div>
          </div>

          {/* Quiet Hours */}
          <div>
            <h3 className="text-xs font-semibold text-slate-500 uppercase mb-2">Quiet Hours</h3>
            <div className="bg-slate-50 rounded-lg px-3 divide-y divide-slate-200">
              <SettingRow
                icon={<Moon className="w-4 h-4" />}
                label="Quiet Hours"
                description={prefs.quietHoursEnabled
                  ? `${prefs.quietHoursStart} - ${prefs.quietHoursEnd}`
                  : 'No restrictions'}
                enabled={prefs.quietHoursEnabled}
                onChange={(v) => updatePref('quietHoursEnabled', v)}
              />
            </div>
            {prefs.quietHoursEnabled && (
              <div className="mt-2 flex items-center gap-2">
                <div className="flex-1">
                  <label className="text-xs text-slate-500">Start</label>
                  <input
                    type="time"
                    value={prefs.quietHoursStart}
                    onChange={(e) => updatePref('quietHoursStart', e.target.value)}
                    className="w-full px-2 py-1.5 text-sm border border-slate-300 rounded-lg"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-xs text-slate-500">End</label>
                  <input
                    type="time"
                    value={prefs.quietHoursEnd}
                    onChange={(e) => updatePref('quietHoursEnd', e.target.value)}
                    className="w-full px-2 py-1.5 text-sm border border-slate-300 rounded-lg"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-[#C18B5E] text-white font-medium rounded-lg hover:bg-[#B5795A]"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

