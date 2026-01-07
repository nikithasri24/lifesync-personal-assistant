/**
 * NotificationBell Component
 * Bell icon with badge for header/navbar
 */

import React, { useState } from 'react';
import { Bell } from 'lucide-react';
import { usePendingReminders } from '@/hooks/useReminders';
import { NotificationCenter } from './NotificationCenter';
import { NotificationSettings } from './NotificationSettings';

export function NotificationBell() {
  const [showCenter, setShowCenter] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const { data: reminders = [] } = usePendingReminders();
  
  const pendingCount = reminders.length;
  const hasUrgent = reminders.some(r => r.priority === 'urgent' || r.priority === 'high');

  return (
    <>
      <button
        onClick={() => setShowCenter(true)}
        className="relative p-2 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
        title="Notifications"
      >
        <Bell className="w-5 h-5" />
        
        {/* Badge */}
        {pendingCount > 0 && (
          <span className={`absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center text-xs font-bold text-white rounded-full px-1 ${
            hasUrgent ? 'bg-red-500 animate-pulse' : 'bg-blue-500'
          }`}>
            {pendingCount > 9 ? '9+' : pendingCount}
          </span>
        )}
      </button>
      
      {/* Notification Center */}
      <NotificationCenter
        isOpen={showCenter}
        onClose={() => setShowCenter(false)}
        onOpenSettings={() => {
          setShowCenter(false);
          setShowSettings(true);
        }}
      />
      
      {/* Settings Modal */}
      <NotificationSettings
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />
    </>
  );
}

