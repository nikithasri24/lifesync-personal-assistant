/**
 * DashboardHeaderV2 Component
 * Time-based greeting header matching Together tab design
 */

import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useThemeColors } from '@/hooks/useThemeColors';

export const DashboardHeaderV2: React.FC = () => {
  const { user } = useAuth();
  const colors = useThemeColors();

  // Get time-based greeting and emoji
  const getGreetingData = () => {
    const hour = new Date().getHours();
    if (hour < 12) return { text: 'Good morning', emoji: '☀️' };
    if (hour < 18) return { text: 'Good afternoon', emoji: '🌤️' };
    return { text: 'Good evening', emoji: '🌙' };
  };

  // Format date
  const formattedDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  // Get user's first name — strip email prefix dots (e.g. "nikitha.lisi" → "Nikitha")
  const rawName = user?.email?.split('@')[0] || 'there';
  const sanitized = rawName.includes('.') ? rawName.split('.')[0] : rawName;
  const displayName = sanitized.charAt(0).toUpperCase() + sanitized.slice(1);

  const greeting = getGreetingData();

  return (
    <div className="mb-6">
      <h1 className="text-3xl font-bold flex items-center gap-3 mb-2" style={{ color: colors.text.primary }}>
        <span className="text-4xl">{greeting.emoji}</span>
        {greeting.text}, {displayName}!
      </h1>
      <p className="text-sm" style={{ color: colors.text.secondary }}>
        {formattedDate}
      </p>
    </div>
  );
};

export default DashboardHeaderV2;
