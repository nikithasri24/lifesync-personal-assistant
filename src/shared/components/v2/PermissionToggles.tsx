/**
 * Permission Toggles Component
 * UI for selecting sharing permissions per module
 */

import React from 'react';
import { useThemeColors } from '@/hooks/useThemeColors';
import type { ShareableModule, ModulePermissionLevel } from '@/shared/types/connections';

interface ModuleConfig {
  id: ShareableModule;
  icon: string;
  name: string;
  desc: string;
  modes: ModulePermissionLevel[];
}

const MODULES: ModuleConfig[] = [
  { id: 'meals', icon: '🍽️', name: 'Meals', desc: 'Meal planning & recipes', modes: ['none', 'merged'] },
  { id: 'shopping', icon: '🛒', name: 'Shopping', desc: 'Grocery lists', modes: ['none', 'merged'] },
  { id: 'todos', icon: '✓', name: 'Tasks', desc: 'Todo lists', modes: ['none', 'view', 'collaborate'] },
  { id: 'finances', icon: '💰', name: 'Finances', desc: 'Accounts & budgets', modes: ['none', 'view', 'collaborate'] },
  { id: 'habits', icon: '🎯', name: 'Habits', desc: 'Daily habits', modes: ['none', 'view'] },
  { id: 'goals', icon: '🏆', name: 'Goals', desc: 'Life goals & dreams', modes: ['none', 'view'] },
  { id: 'visa', icon: '✈️', name: 'Travel', desc: 'Travel planning', modes: ['none', 'merged'] },
  { id: 'projects', icon: '📋', name: 'Projects', desc: 'Project tracking', modes: ['none', 'view', 'collaborate', 'merged'] },
  { id: 'notes', icon: '📝', name: 'Notes', desc: 'Note taking', modes: ['none', 'view', 'collaborate'] },
];

interface PermissionTogglesProps {
  permissions: Record<string, ModulePermissionLevel>;
  onChange: (permissions: Record<string, ModulePermissionLevel>) => void;
}

export function PermissionToggles({ permissions, onChange }: PermissionTogglesProps) {
  const colors = useThemeColors();

  const handlePermissionChange = (moduleId: string, mode: ModulePermissionLevel) => {
    onChange({ ...permissions, [moduleId]: mode });
  };

  return (
    <div className="space-y-3">
      {MODULES.map((module) => (
        <div key={module.id} className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center text-lg flex-shrink-0"
              style={{
                background: 'linear-gradient(135deg, rgba(212, 165, 116, 0.2) 0%, rgba(193, 139, 94, 0.2) 100%)',
              }}
            >
              {module.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold" style={{ color: colors.text.primary }}>
                {module.name}
              </div>
              <div className="text-xs" style={{ color: colors.text.tertiary }}>
                {module.desc}
              </div>
            </div>
          </div>
          <ModulePermissionToggle
            modes={module.modes}
            value={permissions[module.id] || 'none'}
            onChange={(mode) => handlePermissionChange(module.id, mode)}
          />
        </div>
      ))}
    </div>
  );
}

interface ModulePermissionToggleProps {
  modes: ModulePermissionLevel[];
  value: ModulePermissionLevel;
  onChange: (mode: ModulePermissionLevel) => void;
}

function ModulePermissionToggle({ modes, value, onChange }: ModulePermissionToggleProps) {
  const getModeLabel = (mode: ModulePermissionLevel): string => {
    switch (mode) {
      case 'none':
        return 'Off';
      case 'view':
        return 'View';
      case 'collaborate':
        return 'Edit';
      case 'merged':
        return 'Merged';
      default:
        return mode;
    }
  };

  return (
    <div className="flex gap-1 p-1 bg-gray-200 rounded-lg flex-shrink-0">
      {modes.map((mode) => (
        <button
          key={mode}
          type="button"
          onClick={() => onChange(mode)}
          className={`px-2.5 py-1.5 rounded-md text-xs font-semibold transition-all whitespace-nowrap ${
            value === mode
              ? 'bg-white shadow-sm'
              : ''
          }`}
          style={{
            color: value === mode ? '#C18B5E' : '#6B5847',
          }}
        >
          {getModeLabel(mode)}
        </button>
      ))}
    </div>
  );
}
