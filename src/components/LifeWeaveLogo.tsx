/**
 * Life Weave Logo Component
 * Basket weave pattern logo with brand wordmark
 */

interface LifeWeaveLogoProps {
  collapsed?: boolean;
  className?: string;
  size?: 'small' | 'medium' | 'large';
  variant?: 'light' | 'dark';
}

export default function LifeWeaveLogo({
  collapsed = false,
  className = '',
  size = 'medium',
  variant = 'light'
}: LifeWeaveLogoProps) {
  // Size configurations
  const sizeConfig = {
    small: {
      grid: 3,
      cellSize: 8,
      fontSize: '18px',
      lineHeight: 2,
    },
    medium: {
      grid: 4,
      cellSize: 12,
      fontSize: '20px',
      lineHeight: 3,
    },
    large: {
      grid: 6,
      cellSize: 16,
      fontSize: '28px',
      lineHeight: 4,
    },
  };

  const config = sizeConfig[size];
  const { grid, cellSize } = config;

  // Color configurations
  const colors = variant === 'dark'
    ? {
        dark: '#E8C4A0',
        light: '#D4A574',
        text: '#F5F1EA',
        line: 'linear-gradient(90deg, #E8C4A0 0%, #D4A574 100%)',
        tagline: '#CCCCCC',
      }
    : {
        dark: '#C18B5E',
        light: '#D4A574',
        text: '#2D2D2D',
        line: 'linear-gradient(90deg, #D4A574 0%, #C18B5E 100%)',
        tagline: '#666666',
      };

  // Generate basket weave pattern
  const generatePattern = () => {
    const cells = [];
    for (let i = 0; i < grid * grid; i++) {
      const row = Math.floor(i / grid);
      const col = i % grid;

      // Basket weave logic: alternate 2x2 blocks
      const blockRow = Math.floor(row / 2);
      const blockCol = Math.floor(col / 2);
      const isDark = (blockRow + blockCol) % 2 === 0;

      cells.push(
        <div
          key={i}
          style={{
            backgroundColor: isDark ? colors.dark : colors.light,
            borderRadius: '2px',
          }}
        />
      );
    }
    return cells;
  };

  // Collapsed version (icon only)
  if (collapsed) {
    return (
      <div className={`flex items-center justify-center ${className}`}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${grid}, ${cellSize}px)`,
            gridTemplateRows: `repeat(${grid}, ${cellSize}px)`,
            gap: 0,
          }}
          className="transition-transform duration-300 hover:scale-105"
        >
          {generatePattern()}
        </div>
      </div>
    );
  }

  // Full version (icon + wordmark)
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Basket Weave Icon */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${grid}, ${cellSize}px)`,
          gridTemplateRows: `repeat(${grid}, ${cellSize}px)`,
          gap: 0,
        }}
        className="transition-transform duration-300 hover:scale-105 flex-shrink-0"
      >
        {generatePattern()}
      </div>

      {/* Wordmark */}
      <div className="flex flex-col">
        <div
          style={{
            fontSize: config.fontSize,
            fontWeight: 500,
            color: colors.text,
            letterSpacing: '-0.3px',
            lineHeight: 1.2,
          }}
        >
          life weave
        </div>
        <div
          style={{
            height: `${config.lineHeight}px`,
            background: colors.line,
            marginTop: '4px',
            marginBottom: '4px',
          }}
        />
        <div
          style={{
            fontSize: '13px',
            color: colors.tagline,
            fontWeight: 400,
          }}
        >
          Skillful Living
        </div>
      </div>
    </div>
  );
}

/**
 * Standalone basket weave icon (no wordmark)
 */
export function BasketWeaveIcon({
  size = 24,
  variant = 'light',
  className = ''
}: {
  size?: number;
  variant?: 'light' | 'dark';
  className?: string;
}) {
  const grid = 4;
  const cellSize = size / grid;

  const colors = variant === 'dark'
    ? { dark: '#E8C4A0', light: '#D4A574' }
    : { dark: '#C18B5E', light: '#D4A574' };

  const cells = [];
  for (let i = 0; i < grid * grid; i++) {
    const row = Math.floor(i / grid);
    const col = i % grid;
    const blockRow = Math.floor(row / 2);
    const blockCol = Math.floor(col / 2);
    const isDark = (blockRow + blockCol) % 2 === 0;

    cells.push(
      <div
        key={i}
        style={{
          backgroundColor: isDark ? colors.dark : colors.light,
          borderRadius: '1px',
        }}
      />
    );
  }

  return (
    <div
      className={className}
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${grid}, ${cellSize}px)`,
        gridTemplateRows: `repeat(${grid}, ${cellSize}px)`,
        gap: 0,
        width: `${size}px`,
        height: `${size}px`,
      }}
    >
      {cells}
    </div>
  );
}
