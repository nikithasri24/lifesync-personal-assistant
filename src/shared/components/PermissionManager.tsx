/**
 * PermissionManager Component
 *
 * Allows users to configure per-module sharing permissions for a connection.
 * Used in the Shared page to control what data is shared with each connection.
 */

import React, { useState } from 'react';
import { Check, X, Eye, Edit, Merge, Lock } from 'lucide-react';
import {
  type ShareableModule,
  type ModulePermissionLevel,
  MODULE_CONFIGS,
} from '../types/connections';
import { useUpdatePermissionMutation } from '@/hooks/useConnectionsQuery';

interface PermissionManagerProps {
  connectionId: string;
  connectionName: string;
  currentPermissions: Record<ShareableModule, ModulePermissionLevel>;
  onClose?: () => void;
}

const PERMISSION_ICONS: Record<ModulePermissionLevel, React.ReactNode> = {
  none: <Lock className="w-4 h-4" />,
  view: <Eye className="w-4 h-4" />,
  collaborate: <Edit className="w-4 h-4" />,
  merged: <Merge className="w-4 h-4" />,
};

const PERMISSION_LABELS: Record<ModulePermissionLevel, string> = {
  none: 'No Access',
  view: 'View Only',
  collaborate: 'Can Edit',
  merged: 'Merged',
};

const PERMISSION_COLORS: Record<ModulePermissionLevel, string> = {
  none: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400',
  view: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  collaborate: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  merged: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
};

export function PermissionManager({
  connectionId,
  connectionName,
  currentPermissions,
  onClose,
}: PermissionManagerProps): React.ReactElement {
  const [permissions, setPermissions] = useState(currentPermissions);
  const [hasChanges, setHasChanges] = useState(false);
  const { mutate: updatePermission, isPending } = useUpdatePermissionMutation();

  const handlePermissionChange = (
    module: ShareableModule,
    level: ModulePermissionLevel
  ) => {
    setPermissions(prev => ({ ...prev, [module]: level }));
    setHasChanges(true);
  };

  const handleSave = () => {
    // Update each changed permission
    Object.entries(permissions).forEach(([module, level]) => {
      if (currentPermissions[module as ShareableModule] !== level) {
        updatePermission({
          connectionId,
          module: module as ShareableModule,
          permissionLevel: level,
        });
      }
    });
    setHasChanges(false);
    onClose?.();
  };

  // Group modules by category
  const modulesByCategory = {
    productivity: Object.values(MODULE_CONFIGS).filter(m =>
      ['habits', 'todos', 'notes', 'projects'].includes(m.module)
    ),
    wellbeing: Object.values(MODULE_CONFIGS).filter(m =>
      ['journal', 'mood', 'skincare', 'nutrition'].includes(m.module)
    ),
    personal: Object.values(MODULE_CONFIGS).filter(m =>
      ['travel', 'visa', 'trip-planner', 'finances', 'shopping', 'meals', 'goals'].includes(m.module)
    ),
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 max-w-2xl w-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
            Sharing with {connectionName}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Control what data {connectionName} can access
          </p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2">
        {Object.entries(modulesByCategory).map(([category, modules]) => (
          <div key={category}>
            <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 px-1">
              {category === 'productivity' && '📊 Productivity'}
              {category === 'wellbeing' && '💚 Wellbeing'}
              {category === 'personal' && '🌟 Personal'}
            </h3>
            <div className="space-y-2">
              {modules.map(config => (
                <div
                  key={config.module}
                  className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >
                  <div className="flex-1 min-w-0 mr-4">
                    <h4 className="font-medium text-slate-900 dark:text-white text-sm">
                      {config.label}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                      {config.description}
                    </p>
                  </div>

                  <div className="flex gap-1 flex-shrink-0">
                    {config.supportedLevels.map(level => (
                      <button
                        key={level}
                        onClick={() => handlePermissionChange(config.module, level)}
                        className={`
                          px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5
                          transition-all duration-200
                          ${permissions[config.module] === level
                            ? PERMISSION_COLORS[level]
                            : 'bg-slate-100 text-slate-400 dark:bg-slate-600 dark:text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-500'
                          }
                        `}
                        title={PERMISSION_LABELS[level]}
                      >
                        {PERMISSION_ICONS[level]}
                        <span className="hidden sm:inline">{PERMISSION_LABELS[level]}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {hasChanges && (
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-200 dark:border-slate-600">
          <button
            onClick={() => {
              setPermissions(currentPermissions);
              setHasChanges(false);
            }}
            className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isPending}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg flex items-center gap-2 disabled:opacity-50"
          >
            <Check className="w-4 h-4" />
            Save Changes
          </button>
        </div>
      )}
    </div>
  );
}

export default PermissionManager;
