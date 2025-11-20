/**
 * Permission Manager Component
 * Manage granular permissions for each module in a connection
 */

import React, { useState, useEffect } from 'react';
import { Shield, Lock, Eye, Users, Sparkles } from 'lucide-react';
import {
  getConnectionPermissions,
  setModulePermission,
} from '../api/connectionsAPI';
import type {
  ConnectionWithUser,
  ModulePermission,
  ShareableModule,
  ModulePermissionLevel,
} from '../types/connections';
import { MODULE_CONFIGS, PERMISSION_LEVEL_INFO } from '../types/connections';

interface PermissionManagerProps {
  connection: ConnectionWithUser;
}

const PermissionManager: React.FC<PermissionManagerProps> = ({ connection }) => {
  const [myPermissions, setMyPermissions] = useState<ModulePermission[]>([]);
  const [theirPermissions, setTheirPermissions] = useState<ModulePermission[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    loadPermissions();
  }, [connection.id]);

  const loadPermissions = async () => {
    try {
      setLoading(true);
      const { myPermissions: mine, theirPermissions: theirs } = await getConnectionPermissions(connection.id);
      setMyPermissions(mine);
      setTheirPermissions(theirs);
    } catch (error) {
      console.error('Error loading permissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePermissionChange = async (
    module: ShareableModule,
    level: ModulePermissionLevel
  ) => {
    try {
      setUpdating(module);
      await setModulePermission({
        connectionId: connection.id,
        module,
        permissionLevel: level,
      });
      await loadPermissions();
    } catch (error) {
      console.error('Error updating permission:', error);
      alert('Failed to update permission');
    } finally {
      setUpdating(null);
    }
  };

  const getMyPermissionLevel = (module: ShareableModule): ModulePermissionLevel => {
    const permission = myPermissions.find(p => p.module === module);
    return permission?.permissionLevel || 'none';
  };

  const getTheirPermissionLevel = (module: ShareableModule): ModulePermissionLevel => {
    const permission = theirPermissions.find(p => p.module === module);
    return permission?.permissionLevel || 'none';
  };

  const getLevelIcon = (level: ModulePermissionLevel) => {
    switch (level) {
      case 'none':
        return <Lock className="h-4 w-4" />;
      case 'view':
        return <Eye className="h-4 w-4" />;
      case 'collaborate':
        return <Users className="h-4 w-4" />;
      case 'merged':
        return <Sparkles className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  const displayName = connection.myLabel || connection.otherUser.fullName || connection.otherUser.email;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Shield className="h-5 w-5 text-indigo-600" />
        <h4 className="text-sm font-semibold text-slate-900">
          Module Permissions
        </h4>
      </div>

      <p className="text-xs text-slate-600 mb-4">
        Control what {displayName} can access in each module. Changes take effect immediately.
      </p>

      <div className="space-y-2">
        {Object.values(MODULE_CONFIGS).map((config) => {
          const myLevel = getMyPermissionLevel(config.module);
          const theirLevel = getTheirPermissionLevel(config.module);
          const isUpdating = updating === config.module;

          return (
            <div
              key={config.module}
              className="bg-white border border-slate-200 rounded-lg p-4"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h5 className="text-sm font-semibold text-slate-900">{config.label}</h5>
                  <p className="text-xs text-slate-500 mt-0.5">{config.description}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* What I'm sharing with them */}
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-2">
                    You → {displayName}
                  </label>
                  <div className="space-y-1">
                    {config.supportedLevels.map((level) => {
                      const levelInfo = PERMISSION_LEVEL_INFO[level];
                      const isSelected = myLevel === level;

                      return (
                        <button
                          key={level}
                          onClick={() => handlePermissionChange(config.module, level)}
                          disabled={isUpdating}
                          className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-all ${
                            isSelected
                              ? `bg-${levelInfo.color}-50 border-2 border-${levelInfo.color}-300 text-${levelInfo.color}-900`
                              : 'bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100'
                          } ${isUpdating ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          <div className={isSelected ? `text-${levelInfo.color}-600` : 'text-slate-400'}>
                            {getLevelIcon(level)}
                          </div>
                          <div className="flex-1">
                            <p className="text-xs font-medium">{levelInfo.label}</p>
                          </div>
                          {isSelected && (
                            <div className={`w-2 h-2 rounded-full bg-${levelInfo.color}-600`} />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* What they're sharing with me */}
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-2">
                    {displayName} → You
                  </label>
                  <div className={`px-3 py-2 rounded-lg bg-${PERMISSION_LEVEL_INFO[theirLevel].color}-50 border border-${PERMISSION_LEVEL_INFO[theirLevel].color}-200`}>
                    <div className="flex items-center gap-2">
                      <div className={`text-${PERMISSION_LEVEL_INFO[theirLevel].color}-600`}>
                        {getLevelIcon(theirLevel)}
                      </div>
                      <div>
                        <p className={`text-xs font-medium text-${PERMISSION_LEVEL_INFO[theirLevel].color}-900`}>
                          {PERMISSION_LEVEL_INFO[theirLevel].label}
                        </p>
                        <p className={`text-xs text-${PERMISSION_LEVEL_INFO[theirLevel].color}-700 mt-0.5`}>
                          {PERMISSION_LEVEL_INFO[theirLevel].description}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PermissionManager;
