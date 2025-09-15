import React from 'react';

interface LogoProps {
  collapsed?: boolean;
  className?: string;
}

export default function Logo({ collapsed = false, className = '' }: LogoProps) {
  if (collapsed) {
    return (
      <div className={`flex items-center justify-center ${className}`}>
        <div className="relative">
          {/* Circular logo for collapsed state */}
          <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center shadow-lg">
            <div className="relative">
              <div className="w-6 h-6 relative">
                {/* Stylized "L" */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <svg 
                    width="24" 
                    height="24" 
                    viewBox="0 0 24 24" 
                    fill="none"
                    className="text-white"
                  >
                    <path 
                      d="M6 4v12h8M6 16h8" 
                      stroke="currentColor" 
                      strokeWidth="3" 
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                    />
                    <circle 
                      cx="18" 
                      cy="6" 
                      r="2" 
                      fill="currentColor"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>
          {/* Glow effect */}
          <div className="absolute inset-0 w-10 h-10 bg-accent rounded-xl opacity-20 blur-md"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      {/* Full logo */}
      <div className="relative">
        <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center shadow-lg">
          <div className="relative">
            <div className="w-6 h-6 relative">
              {/* Stylized "L" */}
              <div className="absolute inset-0 flex items-center justify-center">
                <svg 
                  width="24" 
                  height="24" 
                  viewBox="0 0 24 24" 
                  fill="none"
                  className="text-white"
                >
                  <path 
                    d="M6 4v12h8M6 16h8" 
                    stroke="currentColor" 
                    strokeWidth="3" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  />
                  <circle 
                    cx="18" 
                    cy="6" 
                    r="2" 
                    fill="currentColor"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>
        {/* Glow effect */}
        <div className="absolute inset-0 w-10 h-10 bg-accent rounded-xl opacity-20 blur-md"></div>
      </div>
      
      {/* Text logo */}
      <div className="flex flex-col">
        <h1 className="text-2xl font-bold font-display bg-accent-gradient-vibrant bg-clip-text text-transparent leading-none">
          LifeSync
        </h1>
        <p className="text-xs text-muted font-medium tracking-wide">
          Personal Assistant
        </p>
      </div>
    </div>
  );
}