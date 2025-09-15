import React from 'react';

interface NikeLogoProps {
  collapsed?: boolean;
  className?: string;
}

export default function NikeLogo({ collapsed = false, className = '' }: NikeLogoProps) {
  if (collapsed) {
    return (
      <div className={`flex items-center justify-center ${className}`}>
        <div className="relative group">
          {/* Minimalist icon for collapsed state */}
          <div className="relative">
            <svg 
              width="32" 
              height="32" 
              viewBox="0 0 32 32" 
              fill="none"
              className="text-primary group-hover:text-accent-secondary transition-all duration-300"
            >
              {/* Dynamic swoosh-like symbol */}
              <path 
                d="M4 16c0 0 6-8 12-4s12 12 12 12-6-8-12-4-12-12-12-12z" 
                fill="currentColor"
                className="opacity-90"
              />
              <path 
                d="M8 20c4-2 8 0 12 4" 
                stroke="currentColor" 
                strokeWidth="3" 
                strokeLinecap="round"
                className="opacity-60"
              />
            </svg>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-center space-x-4 ${className}`}>
      {/* Clean minimalist icon */}
      <div className="relative group">
        <svg 
          width="36" 
          height="36" 
          viewBox="0 0 36 36" 
          fill="none"
          className="text-primary group-hover:text-accent-secondary transition-all duration-300"
        >
          {/* Dynamic swoosh-like symbol */}
          <path 
            d="M6 18c0 0 6-10 14-4s14 14 14 14-6-10-14-4-14-14-14-14z" 
            fill="currentColor"
            className="opacity-90"
          />
          <path 
            d="M10 22c5-2 10 0 15 6" 
            stroke="currentColor" 
            strokeWidth="3" 
            strokeLinecap="round"
            className="opacity-60"
          />
        </svg>
      </div>
      
      {/* Bold athletic text logo */}
      <div className="flex flex-col">
        <h1 className="text-2xl font-black font-display text-primary leading-none tracking-tight">
          ELEVATE
        </h1>
        <div className="flex items-center space-x-2 mt-1">
          <div className="h-0.5 w-8 bg-accent-secondary"></div>
          <p className="text-xs text-muted font-mono font-medium tracking-wider uppercase">
            Just Do It
          </p>
        </div>
      </div>
    </div>
  );
}