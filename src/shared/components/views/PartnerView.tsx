/**
 * Partner View Component
 * Displays active partner connections
 */

import React from 'react';
import { useThemeColors } from '@/hooks/useThemeColors';
import { ConnectionCard } from '../ConnectionCard';
import type { PartnerConnection } from '../../types';

interface PartnerViewProps {
  connections: PartnerConnection[];
  isLoading: boolean;
}

export function PartnerView({ connections, isLoading }: PartnerViewProps) {
  const colors = useThemeColors();

  if (isLoading) {
    return (
      <div className="pb-4">
        <div className="text-center py-12" style={{ color: colors.text.tertiary }}>
          Loading connections...
        </div>
      </div>
    );
  }

  if (connections.length === 0) {
    return (
      <div className="pb-4">
        <div
          className="text-center py-16 px-10 mt-20 rounded-2xl"
          style={{ backgroundColor: colors.bg.white }}
        >
          <div className="text-6xl mb-4 opacity-50">💑</div>
          <div
            className="text-lg font-bold mb-2"
            style={{ color: colors.text.primary }}
          >
            No partner connected
          </div>
          <div
            className="text-sm leading-relaxed"
            style={{ color: colors.text.tertiary }}
          >
            Invite your spouse or partner to share meal plans, shopping lists,
            finances, and more together!
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-4">
      <h2
        className="text-xl font-bold mb-4"
        style={{ color: colors.text.primary }}
      >
        Partner Connection
      </h2>

      {connections.map((connection) => (
        <ConnectionCard key={connection.id} connection={connection} />
      ))}
    </div>
  );
}
