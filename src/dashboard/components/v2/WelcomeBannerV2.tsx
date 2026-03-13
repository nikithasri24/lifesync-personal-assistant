import React from 'react';

/**
 * WelcomeBannerV2 - Soft & muted design with time-based greeting
 * 
 * Features:
 * - Time-based greeting (Morning/Afternoon/Evening/Night)
 * - Time-based emoji
 * - Soft gradient background
 * - Light & dark mode support
 * - Responsive design
 */

interface WelcomeBannerV2Props {
  userName?: string;
}

export function WelcomeBannerV2({ userName }: WelcomeBannerV2Props): React.ReactElement {
  // Get current time for greeting
  const getTimeBasedGreeting = (): { greeting: string; emoji: string } => {
    const hour = new Date().getHours();
    
    if (hour >= 5 && hour < 12) {
      return { greeting: 'Good Morning', emoji: '🌅' };
    } else if (hour >= 12 && hour < 17) {
      return { greeting: 'Good Afternoon', emoji: '☀️' };
    } else if (hour >= 17 && hour < 21) {
      return { greeting: 'Good Evening', emoji: '🌆' };
    } else {
      return { greeting: 'Good Night', emoji: '🌙' };
    }
  };

  const { greeting, emoji } = getTimeBasedGreeting();
  const rawName = userName || 'there';
  const sanitized = rawName.includes('.') ? rawName.split('.')[0] : rawName;
  const displayName = sanitized.charAt(0).toUpperCase() + sanitized.slice(1);

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-[var(--color-primary-500)]/10 to-[var(--color-secondary-500)]/10 dark:from-[var(--color-primary-600)]/20 dark:to-[var(--color-secondary-600)]/20 rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-200 dark:border-gray-700 transition-all duration-300">
      {/* Decorative circles - softer */}
      <div className="absolute top-0 right-0 w-24 sm:w-32 h-24 sm:h-32 bg-white/5 dark:bg-white/3 rounded-full transform translate-x-8 -translate-y-8 blur-2xl"></div>
      <div className="absolute bottom-0 left-0 w-16 sm:w-24 h-16 sm:h-24 bg-white/3 dark:bg-white/2 rounded-full transform -translate-x-4 translate-y-4 blur-xl"></div>

      {/* Content */}
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-3xl sm:text-4xl" role="img" aria-label={greeting}>
            {emoji}
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white font-display">
            {greeting}, {displayName}!
          </h1>
        </div>
        <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400 mt-2">
          Here's your overview for today
        </p>
      </div>

      {/* Subtle shine effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>
    </div>
  );
}

