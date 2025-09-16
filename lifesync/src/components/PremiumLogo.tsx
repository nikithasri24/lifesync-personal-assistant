interface PremiumLogoProps {
  collapsed?: boolean;
  className?: string;
}

export default function PremiumLogo({ collapsed = false, className = '' }: PremiumLogoProps) {
  if (collapsed) {
    return (
      <div className={`flex items-center justify-center ${className}`}>
        <div className="relative group">
          <div className="w-10 h-10 relative">
            {/* Sophisticated geometric logo mark */}
            <svg 
              width="40" 
              height="40" 
              viewBox="0 0 40 40" 
              fill="none"
              className="w-full h-full"
            >
              {/* Gradient definitions */}
              <defs>
                <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="var(--accent-primary)" />
                  <stop offset="100%" stopColor="var(--accent-secondary)" />
                </linearGradient>
                <linearGradient id="logoGradientHover" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="var(--accent-secondary)" />
                  <stop offset="100%" stopColor="var(--accent-tertiary)" />
                </linearGradient>
              </defs>
              
              {/* Main logo shape - sophisticated E */}
              <g className="transition-all duration-300 group-hover:scale-105">
                {/* Primary shape */}
                <path 
                  d="M8 8 L32 8 L32 14 L16 14 L16 17 L28 17 L28 23 L16 23 L16 26 L32 26 L32 32 L8 32 Z" 
                  fill="url(#logoGradient)"
                  className="group-hover:fill-[url(#logoGradientHover)]"
                />
                
                {/* Accent dot */}
                <circle 
                  cx="34" 
                  cy="10" 
                  r="2" 
                  fill="var(--accent-tertiary)"
                  className="transition-all duration-300 group-hover:r-3"
                />
              </g>
            </svg>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-center space-x-4 ${className}`}>
      {/* Logo mark */}
      <div className="relative group">
        <div className="w-12 h-12 relative">
          <svg 
            width="48" 
            height="48" 
            viewBox="0 0 48 48" 
            fill="none"
            className="w-full h-full"
          >
            <defs>
              <linearGradient id="mainLogoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="var(--accent-primary)" />
                <stop offset="50%" stopColor="var(--accent-secondary)" />
                <stop offset="100%" stopColor="var(--accent-tertiary)" />
              </linearGradient>
              <filter id="glow">
                <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                <feMerge> 
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
            
            <g className="transition-all duration-500 group-hover:scale-105" filter="url(#glow)">
              {/* Main E shape */}
              <path 
                d="M10 10 L38 10 L38 16 L20 16 L20 20 L34 20 L34 26 L20 26 L20 30 L38 30 L38 36 L10 36 Z" 
                fill="url(#mainLogoGradient)"
              />
              
              {/* Sophisticated accent elements */}
              <circle 
                cx="40" 
                cy="12" 
                r="2.5" 
                fill="var(--accent-tertiary)"
                className="transition-all duration-300 group-hover:scale-110"
              />
              
              <rect 
                x="42" 
                y="32" 
                width="4" 
                height="4" 
                rx="2" 
                fill="var(--accent-secondary)"
                className="transition-all duration-300 group-hover:rotate-45"
              />
            </g>
          </svg>
        </div>
      </div>
      
      {/* Brand text */}
      <div className="flex flex-col">
        <h1 className="text-2xl font-bold font-display text-primary leading-none tracking-tight">
          ELEVATE
        </h1>
        <div className="flex items-center space-x-2 mt-1">
          <div className="h-0.5 w-6 bg-accent-gradient"></div>
          <p className="text-xs text-muted font-medium tracking-wider">
            Personal Suite
          </p>
        </div>
      </div>
    </div>
  );
}