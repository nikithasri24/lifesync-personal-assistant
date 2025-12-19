/**
 * NotificationCenter Component
 * Shows upcoming reminders and notification history
 */

import React, { useState } from 'react';
import { format, formatDistanceToNow } from 'date-fns';
import {
  Bell,
  BellOff,
  Clock,
  CheckCircle2,
  Calendar,
  ListTodo,
  Target,
  X,
  Loader2,
  Settings,
} from 'lucide-react';
import { useUpcomingReminders, useCancelReminder } from '@/hooks/useReminders';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import type { NotificationQueueItem } from '@/services/reminders';

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSettings?: () => void;
}

function ReminderIcon({ type }: { type: string }) {
  switch (type) {
    case 'task_due':
    case 'task_overdue':
      return <ListTodo className="w-4 h-4" />;
    case 'calendar_event':
      return <Calendar className="w-4 h-4" />;
    case 'habit_reminder':
      return <Target className="w-4 h-4" />;
    default:
      return <Bell className="w-4 h-4" />;
  }
}

function ReminderItem({ 
  reminder, 
  onDismiss 
}: { 
  reminder: NotificationQueueItem; 
  onDismiss: (id: string) => void;
}) {
  const scheduledFor = new Date(reminder.scheduled_for);
  const timeFromNow = formatDistanceToNow(scheduledFor, { addSuffix: true });
  const isPast = scheduledFor < new Date();
  
  return (
    <div className={`flex items-start gap-3 p-3 rounded-lg transition-colors ${
      isPast ? 'bg-amber-50 border border-amber-200' : 'bg-white border border-slate-200 hover:border-slate-300'
    }`}>
      <div className={`p-2 rounded-lg ${
        reminder.priority === 'urgent' ? 'bg-red-100 text-red-600' :
        reminder.priority === 'high' ? 'bg-orange-100 text-orange-600' :
        'bg-blue-100 text-blue-600'
      }`}>
        <ReminderIcon type={reminder.type} />
      </div>
      
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-800 truncate">
          {reminder.payload.title}
        </p>
        <p className="text-xs text-slate-600 truncate">
          {reminder.payload.body}
        </p>
        <div className="flex items-center gap-2 mt-1">
          <Clock className="w-3 h-3 text-slate-400" />
          <span className={`text-xs ${isPast ? 'text-amber-600 font-medium' : 'text-slate-500'}`}>
            {isPast ? 'Overdue • ' : ''}{timeFromNow}
          </span>
        </div>
      </div>
      
      <button
        onClick={() => onDismiss(reminder.id)}
        className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded"
        title="Dismiss"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

export function NotificationCenter({ isOpen, onClose, onOpenSettings }: NotificationCenterProps) {
  const { grouped, reminders, isLoading } = useUpcomingReminders();
  const cancelReminder = useCancelReminder();
  const { isSubscribed, isSupported, subscribe, isLoading: pushLoading } = usePushNotifications();
  
  const handleDismiss = (reminderId: string) => {
    cancelReminder.mutate(reminderId);
  };
  
  const handleEnableNotifications = async () => {
    await subscribe('LifeSync Web');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end p-4 pointer-events-none">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 pointer-events-auto"
        onClick={onClose}
      />
      
      {/* Panel */}
      <div className="relative w-full max-w-sm bg-white rounded-xl shadow-2xl border border-slate-200 pointer-events-auto mt-16 mr-4 max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-blue-600" />
            <h2 className="font-semibold text-slate-800">Notifications</h2>
            {reminders.length > 0 && (
              <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
                {reminders.length}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {onOpenSettings && (
              <button
                onClick={onOpenSettings}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"
                title="Notification Settings"
              >
                <Settings className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Push notification prompt */}
          {isSupported && !isSubscribed && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-3">
                <BellOff className="w-5 h-5 text-blue-600 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-blue-800">Enable Push Notifications</p>
                  <p className="text-xs text-blue-600 mt-1">Get reminders even when the app is closed</p>
                  <button
                    onClick={handleEnableNotifications}
                    disabled={pushLoading}
                    className="mt-2 px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {pushLoading ? 'Enabling...' : 'Enable Notifications'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
            </div>
          ) : reminders.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto mb-3" />
              <p className="text-sm font-medium text-slate-600">All caught up!</p>
              <p className="text-xs text-slate-500 mt-1">No pending reminders</p>
            </div>
          ) : (
            <>
              {/* Soon (< 30 min) */}
              {grouped.soon.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-slate-500 uppercase mb-2">Coming Up</h3>
                  <div className="space-y-2">
                    {grouped.soon.map(r => (
                      <ReminderItem key={r.id} reminder={r} onDismiss={handleDismiss} />
                    ))}
                  </div>
                </div>
              )}

              {/* Next hour */}
              {grouped.nextHour.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-slate-500 uppercase mb-2">In About an Hour</h3>
                  <div className="space-y-2">
                    {grouped.nextHour.map(r => (
                      <ReminderItem key={r.id} reminder={r} onDismiss={handleDismiss} />
                    ))}
                  </div>
                </div>
              )}

              {/* Later today */}
              {grouped.today.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-slate-500 uppercase mb-2">Later Today</h3>
                  <div className="space-y-2">
                    {grouped.today.map(r => (
                      <ReminderItem key={r.id} reminder={r} onDismiss={handleDismiss} />
                    ))}
                  </div>
                </div>
              )}

              {/* Future */}
              {grouped.later.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-slate-500 uppercase mb-2">Upcoming</h3>
                  <div className="space-y-2">
                    {grouped.later.map(r => (
                      <ReminderItem key={r.id} reminder={r} onDismiss={handleDismiss} />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

