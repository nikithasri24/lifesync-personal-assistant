import React from 'react';

/**
 * Welcome banner with gradient background
 */
export function WelcomeBanner(): React.ReactElement {
  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 to-purple-700 rounded-xl sm:rounded-2xl p-6 sm:p-8 shadow-xl">
      <div className="relative z-10">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2 sm:mb-3 font-display text-black dark:text-white">Welcome back!</h1>
        <p className="text-base sm:text-lg text-black/80 dark:text-white/90">
          Here's what's happening with your life today.
        </p>
      </div>
      <div className="absolute top-0 right-0 w-24 sm:w-32 h-24 sm:h-32 bg-white opacity-10 rounded-full transform translate-x-4 sm:translate-x-8 -translate-y-4 sm:-translate-y-8"></div>
      <div className="absolute bottom-0 left-0 w-16 sm:w-24 h-16 sm:h-24 bg-white opacity-5 rounded-full transform -translate-x-2 sm:-translate-x-4 translate-y-2 sm:translate-y-4"></div>
    </div>
  );
}
