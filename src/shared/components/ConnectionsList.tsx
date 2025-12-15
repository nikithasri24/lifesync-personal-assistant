import React from 'react';
import type { ConnectionWithUser } from '../types/connections';

interface ConnectionsListProps {
  connections: ConnectionWithUser[];
  onConnectionDeleted?: () => void;
}

export function ConnectionsList({ connections: _connections, onConnectionDeleted: _onConnectionDeleted }: ConnectionsListProps): React.ReactElement {
  return (
    <div className="p-4">
      <p className="text-sm text-gray-500">Connections list feature not yet implemented</p>
    </div>
  );
}

export default ConnectionsList;
