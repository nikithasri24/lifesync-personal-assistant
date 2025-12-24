/**
 * Design Demo Page
 * Side-by-side comparison of old vs new design
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeftRight, Moon, Sun } from 'lucide-react';
import Dashboard from './Dashboard';
import DashboardV2 from './DashboardV2';
import { Button } from '../components/v2/Button';
import { useTheme } from '../contexts/ThemeContext';

type ViewMode = 'old' | 'new' | 'split';

const DesignDemo: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('split');
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      {/* Control Bar */}
      <div className="sticky top-0 z-50 bg-[var(--bg-secondary)] border-b border-[var(--border-primary)] shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Title */}
            <div>
              <h1 className="text-2xl font-bold text-[var(--text-primary)]">
                🎨 Design System Demo
              </h1>
              <p className="text-sm text-[var(--text-secondary)]">
                Compare old vs new design
              </p>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-4">
              {/* View Mode Toggle */}
              <div className="flex items-center gap-2 bg-[var(--bg-tertiary)] rounded-xl p-1">
                <button
                  onClick={() => setViewMode('old')}
                  className={`
                    px-4 py-2 rounded-lg font-medium transition-all
                    ${viewMode === 'old' 
                      ? 'bg-white dark:bg-gray-700 text-[var(--text-primary)] shadow-md' 
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    }
                  `}
                >
                  Old Design
                </button>
                <button
                  onClick={() => setViewMode('split')}
                  className={`
                    px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2
                    ${viewMode === 'split' 
                      ? 'bg-white dark:bg-gray-700 text-[var(--text-primary)] shadow-md' 
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    }
                  `}
                >
                  <ArrowLeftRight className="h-4 w-4" />
                  Split View
                </button>
                <button
                  onClick={() => setViewMode('new')}
                  className={`
                    px-4 py-2 rounded-lg font-medium transition-all
                    ${viewMode === 'new' 
                      ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-md' 
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    }
                  `}
                >
                  New Design ✨
                </button>
              </div>

              {/* Theme Toggle */}
              <Button
                variant="ghost"
                size="md"
                onClick={toggleTheme}
                icon={theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {viewMode === 'split' && (
          <motion.div
            key="split"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-2 gap-1 bg-[var(--border-primary)]"
          >
            {/* Old Design */}
            <div className="relative bg-[var(--bg-primary)]">
              <div className="sticky top-20 z-10 bg-red-500/10 backdrop-blur-sm border-b border-red-500/20 px-4 py-2">
                <p className="text-sm font-semibold text-red-600 dark:text-red-400">
                  ❌ Old Design
                </p>
              </div>
              <div className="opacity-75 pointer-events-none">
                <Dashboard />
              </div>
            </div>

            {/* New Design */}
            <div className="relative bg-[var(--bg-primary)]">
              <div className="sticky top-20 z-10 bg-emerald-500/10 backdrop-blur-sm border-b border-emerald-500/20 px-4 py-2">
                <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                  ✨ New Design
                </p>
              </div>
              <DashboardV2 />
            </div>
          </motion.div>
        )}

        {viewMode === 'old' && (
          <motion.div
            key="old"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <Dashboard />
          </motion.div>
        )}

        {viewMode === 'new' && (
          <motion.div
            key="new"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
          >
            <DashboardV2 />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DesignDemo;

