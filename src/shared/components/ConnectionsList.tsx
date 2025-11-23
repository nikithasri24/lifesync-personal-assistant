/**
 * Connections List Component
 * Displays all active connections with permission management
 */

import React, { useState } from 'react';
import { User, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { deleteConnection } from '../api/connectionsAPI';
import type { ConnectionWithUser } from '../types/connections';
import { RELATIONSHIP_INFO } from '../types/connections';
import PermissionManager from './PermissionManager';
import { logger } from '../../services/logger';

interface ConnectionsListProps {
  connections: ConnectionWithUser[];
  onConnectionDeleted: () => void;
}

const ConnectionsList: React.FC<ConnectionsListProps> = ({
  connections,
  onConnectionDeleted,
}) => {
  const [expandedConnectionId, setExpandedConnectionId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (connectionId: string, userName: string): Promise<void> => {
    const confirmDelete = (): boolean => {
      // eslint-disable-next-line no-alert
      const userResponse = window.confirm(`Are you sure you want to remove ${userName}? This will delete all shared permissions.`);
      logger.info(`Delete connection confirmation: ${userResponse}`);
      return userResponse;
    };

    if (!confirmDelete()) {
      return;
    }

    try {
      setDeletingId(connectionId);
      await deleteConnection(connectionId);
      onConnectionDeleted();
    } catch (error) {
      logger.error('Error deleting connection:', { error });
      logger.warn('Failed to delete connection');
    } finally {
      setDeletingId(null);
    }
  };

  const toggleExpanded = (connectionId: string): void => {
    setExpandedConnectionId(prev => prev === connectionId ? null : connectionId);
  };

  if (connections.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-slate-300 bg-white p-12 text-center text-slate-500">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-50 text-indigo-500">
          <User className="h-6 w-6" />
        </div>
        <p className="text-sm font-medium">No connections yet</p>
        <p className="text-xs text-slate-400">Start by adding a connection to share your data</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {connections.map((connection) => {
        const relationshipInfo = RELATIONSHIP_INFO[connection.relationship];
        const isExpanded = expandedConnectionId === connection.id;
        const displayName = connection.myLabel ?? connection.otherUser.fullName ?? connection.otherUser.email;

        return (
          <div
            key={connection.id}
            className="rounded-lg border border-slate-200 bg-white shadow-sm overflow-hidden"
          >
            {/* Connection Header */}
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1">
                {/* Avatar */}
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                  {displayName.charAt(0).toUpperCase()}
                </div>

                {/* Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-slate-900">{displayName}</h3>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium bg-${relationshipInfo.color}-100 text-${relationshipInfo.color}-700`}
                    >
                      {relationshipInfo.label}
                    </span>
                  </div>
                  <p className="text-sm text-slate-500">{connection.otherUser.email}</p>
                  {connection.notes && (
                    <p className="text-xs text-slate-400 mt-1 italic">{connection.notes}</p>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleExpanded(connection.id)}
                  className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
                  title="Manage permissions"
                >
                  {isExpanded ? (
                    <ChevronUp className="h-5 w-5 text-slate-600" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-slate-600" />
                  )}
                </button>
                <button
                  onClick={() => void handleDelete(connection.id, displayName)}
                  disabled={deletingId === connection.id}
                  className="p-2 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                  title="Remove connection"
                >
                  <Trash2 className="h-5 w-5 text-red-600" />
                </button>
              </div>
            </div>

            {/* Permission Manager (expanded) */}
            {isExpanded && (
              <div className="border-t border-slate-200 bg-slate-50 p-4">
                <PermissionManager connection={connection} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default ConnectionsList;
