import React, { useState } from 'react';
import {
  Users,
  Settings,
  Trash2,
  Heart,
  UserCircle,
  X
} from 'lucide-react';
import type {
  ConnectionWithUser,
  ShareableModule,
  ModulePermissionLevel,
  ConnectionRelationship
} from '../types/connections';
import { PermissionManager } from './PermissionManager';
import { MODULE_CONFIGS } from '../types/connections';

interface ConnectionsListProps {
  connections: ConnectionWithUser[];
  onConnectionDeleted?: (connectionId: string) => void;
}

const RELATIONSHIP_ICONS: Record<ConnectionRelationship, React.ReactNode> = {
  spouse: <Heart className="w-4 h-4 text-pink-500" />,
  partner: <Heart className="w-4 h-4 text-rose-400" />,
  friend: <Users className="w-4 h-4 text-blue-500" />,
  family: <Users className="w-4 h-4 text-green-500" />,
  roommate: <Users className="w-4 h-4 text-orange-500" />,
  colleague: <Users className="w-4 h-4 text-slate-500" />,
  other: <UserCircle className="w-4 h-4 text-gray-500" />,
};

const RELATIONSHIP_COLORS: Record<ConnectionRelationship, string> = {
  spouse: 'bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-300',
  partner: 'bg-rose-100 text-rose-700 dark:bg-rose-900 dark:text-rose-300',
  friend: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  family: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  roommate: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
  colleague: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300',
  other: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
};

export function ConnectionsList({
  connections,
  onConnectionDeleted
}: ConnectionsListProps): React.ReactElement {
  const [editingConnection, setEditingConnection] = useState<ConnectionWithUser | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Build current permissions from the connection's myPermissions array
  const buildCurrentPermissions = (
    conn: ConnectionWithUser
  ): Record<ShareableModule, ModulePermissionLevel> => {
    const defaults: Record<ShareableModule, ModulePermissionLevel> = {} as Record<ShareableModule, ModulePermissionLevel>;
    Object.keys(MODULE_CONFIGS).forEach((module) => {
      defaults[module as ShareableModule] = 'none';
    });
    // Use connection's myPermissions if available
    const connWithPerms = conn as ConnectionWithUser & { myPermissions?: Array<{ module: ShareableModule; permissionLevel: ModulePermissionLevel }> };
    if (connWithPerms.myPermissions) {
      connWithPerms.myPermissions.forEach((p) => {
        defaults[p.module] = p.permissionLevel;
      });
    }
    return defaults;
  };

  const handleDelete = (connectionId: string) => {
    setDeletingId(connectionId);
    onConnectionDeleted?.(connectionId);
    setDeletingId(null);
  };

  if (connections.length === 0) {
    return (
      <div className="text-center py-12">
        <Users className="w-16 h-16 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
        <h3 className="text-lg font-medium text-slate-700 dark:text-slate-300 mb-2">
          No connections yet
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Add a connection to start sharing data with family, friends, or colleagues.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {connections.map((connection) => (
          <div
            key={connection.id}
            className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-4 hover:shadow-md transition-shadow"
          >
            {/* Header with avatar and name */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                {connection.otherUser.avatarUrl ? (
                  <img
                    src={connection.otherUser.avatarUrl}
                    alt={connection.otherUser.fullName || 'User'}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-semibold text-lg">
                    {(connection.otherUser.fullName || connection.otherUser.email || '?')[0].toUpperCase()}
                  </div>
                )}
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-white">
                    {connection.myLabel || connection.otherUser.fullName || connection.otherUser.email}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {connection.otherUser.email}
                  </p>
                </div>
              </div>
            </div>

            {/* Relationship badge */}
            <div className="flex items-center gap-2 mb-4">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${RELATIONSHIP_COLORS[connection.relationship]}`}>
                {RELATIONSHIP_ICONS[connection.relationship]}
                {connection.relationship.charAt(0).toUpperCase() + connection.relationship.slice(1)}
              </span>
              <span className="text-xs text-slate-400 dark:text-slate-500">
                Connected {new Date(connection.acceptedAt || connection.createdAt).toLocaleDateString()}
              </span>
            </div>

            {/* Action buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => setEditingConnection(connection)}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 rounded-lg transition-colors"
              >
                <Settings className="w-4 h-4" />
                Sharing
              </button>
              <button
                onClick={() => handleDelete(connection.id)}
                disabled={deletingId === connection.id}
                className="px-3 py-2 text-sm font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-lg transition-colors disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Permission Manager Modal */}
      {editingConnection && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="relative max-h-[90vh] overflow-auto">
            <button
              onClick={() => setEditingConnection(null)}
              className="absolute top-4 right-4 p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg z-10"
            >
              <X className="w-5 h-5" />
            </button>
            <PermissionManager
              connectionId={editingConnection.id}
              connectionName={editingConnection.myLabel || editingConnection.otherUser.fullName || editingConnection.otherUser.email}
              currentPermissions={buildCurrentPermissions(editingConnection)}
              onClose={() => setEditingConnection(null)}
            />
          </div>
        </div>
      )}
    </>
  );
}

export default ConnectionsList;
