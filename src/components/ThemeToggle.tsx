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
      className="flex items-center gap-3 px-4 py-2.5 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-blue-500 dark:hover:bg-blue-600 hover:text-white transition-all duration-200 text-gray-700 dark:text-gray-300 group w-full"
      title={`Theme: ${getLabel()}`}
      aria-label={`Switch theme. Current: ${getLabel()}`}
    >
      <div className="relative">
        {getIcon()}
      </div>
      <span className="text-sm font-medium">
        {getLabel()} Mode
      </span>
    </button>
  );
}