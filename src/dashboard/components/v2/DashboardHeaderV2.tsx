/**
 * DashboardHeaderV2 Component
 * Time-based greeting header with terracotta gradient
 */

import React from 'react';
import { useAuth } from '@/hooks/useAuth';

export const DashboardHeaderV2: React.FC = () => {
  const { user } = useAuth();

  // Get time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  // Format date
  const formattedDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  // Get user's first name or default to 'there'
  const userName = user?.email?.split('@')[0] || 'there';
  const displayName = userName.charAt(0).toUpperCase() + userName.slice(1);

  return (
    <div
      className="px-5 py-5"
      style={{
        background: 'linear-gradient(135deg, #D4A574 0%, #C18B5E 100%)',
      }}
    >
      <div className="text-white">
        <div className="text-2xl font-bold mb-1">
          {getGreeting()}, {displayName}!
        </div>
        <div className="text-sm opacity-90">
          {formattedDate}
        </div>
      </div>
    </div>
  );
};

export default DashboardHeaderV2;
