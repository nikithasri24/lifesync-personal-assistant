import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import type { ReactElement } from 'react';

export default function ThemeToggle() {
  const { theme, currentTheme, toggleTheme } = useTheme();

  const getIcon = (): ReactElement => {
    if (theme === 'system') return <Monitor size={18} className="transition-transform duration-300 group-hover:scale-110" />;
    if (currentTheme === 'dark') return <Moon size={18} className="transition-transform duration-300 group-hover:-rotate-12" />;
    return <Sun size={18} className="transition-transform duration-300 group-hover:rotate-180" />;
  };

  const getLabel = (): string => {
    if (theme === 'system') return 'System';
    if (currentTheme === 'dark') return 'Dark';
    return 'Light';
  };

  return (
    <button
      onClick={toggleTheme}
      className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group w-full"
      style={{
        background: 'rgba(212, 165, 116, 0.1)',
        color: '#5C4A3A',
      }}
      title={`Theme: ${getLabel()}`}
      aria-label={`Switch theme. Current: ${getLabel()}`}
    >
      <div
        className="flex items-center justify-center rounded-lg flex-shrink-0"
        style={{
          width: '36px',
          height: '36px',
          background: 'rgba(212, 165, 116, 0.15)',
        }}
      >
        <div style={{ color: '#C18B5E' }}>
          {getIcon()}
        </div>
      </div>
      <span
        className="font-medium flex-1 text-left"
        style={{
          fontSize: '17px',
          color: '#5C4A3A',
        }}
      >
        {getLabel()} Mode
      </span>
    </button>
  );
}