import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';

export default function ThemeToggle() {
  const { theme, currentTheme, toggleTheme } = useTheme();

  const getIcon = () => {
    if (theme === 'system') return <Monitor size={18} className="transition-transform duration-300 group-hover:scale-110" />;
    if (currentTheme === 'dark') return <Moon size={18} className="transition-transform duration-300 group-hover:-rotate-12" />;
    return <Sun size={18} className="transition-transform duration-300 group-hover:rotate-180" />;
  };

  const getLabel = () => {
    if (theme === 'system') return 'System';
    if (currentTheme === 'dark') return 'Dark';
    return 'Light';
  };

  return (
    <button
      onClick={toggleTheme}
      className="flex items-center gap-3 px-4 py-3 rounded-xl bg-tertiary/50 hover:bg-accent-primary hover:text-white transition-all duration-300 text-secondary group w-full"
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