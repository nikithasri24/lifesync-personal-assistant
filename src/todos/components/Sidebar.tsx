/**
 * Sidebar Component
 *
 * The main navigation sidebar for the Todos app.
 * Contains quick add, smart lists, projects, and theme picker.
 * Follows TickTick-inspired design.
 */

import React from 'react';
import { Plus, CheckSquare, Inbox, Sun, ArrowRight, Grid, Layers } from 'lucide-react';
import type { Task, Project } from '../types';
import { THEMES } from '../constants';
import { QuickAddForm } from './QuickAddForm';
import { getInboxTasks, getTodayTasks, getUpcomingTasks } from '../services/taskHelpers';

interface SidebarProps {
  /** Current view selection */
  currentView: 'today' | 'inbox' | 'upcoming' | 'kanban' | 'matrix';
  /** Called when view changes */
  onViewChange: (view: 'today' | 'inbox' | 'upcoming' | 'kanban' | 'matrix') => void;
  /** List of all projects */
  projects: Project[];
  /** List of all tasks (for counts) */
  tasks: Task[];
  /** Currently selected project ID */
  selectedProject: string;
  /** Called when a project is selected */
  onProjectSelect: (projectId: string) => void;
  /** Current theme name */
  currentTheme: string;
  /** Called when theme changes */
  onThemeChange: (theme: string) => void;
  /** Whether quick add form is visible */
  showQuickAdd: boolean;
  /** Current quick add input text */
  quickAddText: string;
  /** Called when quick add text changes */
  onQuickAddChange: (text: string) => void;
  /** Called when quick add form is submitted */
  onQuickAddSubmit: () => void;
  /** Called when quick add form is cancelled */
  onQuickAddCancel: () => void;
  /** Create task mutation object */
  createTaskMutation: {
    isPending: boolean;
    isError: boolean;
  };
}

/**
 * Sidebar - Main navigation sidebar with smart lists, projects, and themes
 */
export function Sidebar({
  currentView,
  onViewChange,
  projects,
  tasks,
  selectedProject,
  onProjectSelect,
  currentTheme,
  onThemeChange,
  showQuickAdd,
  quickAddText,
  onQuickAddChange,
  onQuickAddSubmit,
  onQuickAddCancel,
  createTaskMutation
}: SidebarProps) {
  return (
    <div className="w-72 bg-white dark:bg-slate-800 border-r border-gray-200 dark:border-slate-700 flex flex-col shadow-sm min-h-0 overflow-hidden">
      {/* Sidebar Header */}
      <div className="p-4 border-b border-gray-100 dark:border-slate-700">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
            <CheckSquare className="w-5 h-5 text-white" />
          </div>
          <h2 className="font-semibold text-slate-900 dark:text-white text-lg">TickTick</h2>
        </div>
      </div>

      {/* Quick Add */}
      <div className="p-4 flex-shrink-0">
        {showQuickAdd ? (
          <QuickAddForm
            value={quickAddText}
            onChange={onQuickAddChange}
            onSubmit={onQuickAddSubmit}
            onCancel={onQuickAddCancel}
            isLoading={createTaskMutation.isPending}
            error={createTaskMutation.isError ? 'Failed to create task. Please try again.' : undefined}
            autoFocus
          />
        ) : (
          <button
            onClick={() => {
              onQuickAddChange('');
              onQuickAddSubmit(); // This should trigger showing the form
            }}
            className="w-full flex items-center space-x-2 px-3 py-2.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-700 rounded-md transition-colors text-sm font-medium"
          >
            <Plus size={16} />
            <span>Add task</span>
          </button>
        )}
      </div>

      {/* Smart Lists */}
      <div className="flex-1 px-4 pb-4 overflow-y-auto min-h-0">
        <div className="mb-4">
          <h3 className="text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-2 px-3">
            Smart Lists
          </h3>
          <nav className="space-y-1">
            {/* All/Inbox */}
            <button
              onClick={() => {
                onViewChange('inbox');
                onProjectSelect('all');
              }}
              className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md text-sm transition-colors ${
                currentView === 'inbox'
                  ? 'bg-blue-50 dark:bg-slate-700 text-blue-700 dark:text-blue-400'
                  : 'text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700'
              }`}
            >
              <Inbox className="w-4 h-4" />
              <span>All</span>
              <span className="ml-auto text-xs bg-gray-200 dark:bg-slate-600 px-2 py-0.5 rounded-full">
                {getInboxTasks(tasks).length}
              </span>
            </button>

            {/* Today */}
            <button
              onClick={() => {
                onViewChange('today');
                onProjectSelect('all');
              }}
              className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md text-sm transition-colors ${
                currentView === 'today'
                  ? 'bg-blue-50 dark:bg-slate-700 text-blue-700 dark:text-blue-400'
                  : 'text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700'
              }`}
            >
              <Sun className="w-4 h-4" />
              <span>Today</span>
              <span className="ml-auto text-xs bg-gray-200 dark:bg-slate-600 px-2 py-0.5 rounded-full">
                {getTodayTasks(tasks).length}
              </span>
            </button>

            {/* Upcoming */}
            <button
              onClick={() => {
                onViewChange('upcoming');
                onProjectSelect('all');
              }}
              className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md text-sm transition-colors ${
                currentView === 'upcoming'
                  ? 'bg-blue-50 dark:bg-slate-700 text-blue-700 dark:text-blue-400'
                  : 'text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700'
              }`}
            >
              <ArrowRight className="w-4 h-4" />
              <span>Next 7 days</span>
              <span className="ml-auto text-xs bg-gray-200 dark:bg-slate-600 px-2 py-0.5 rounded-full">
                {getUpcomingTasks(tasks).length}
              </span>
            </button>

            {/* Kanban */}
            <button
              onClick={() => {
                onViewChange('kanban');
                onProjectSelect('all');
              }}
              className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md text-sm transition-colors ${
                currentView === 'kanban'
                  ? 'bg-blue-50 dark:bg-slate-700 text-blue-700 dark:text-blue-400'
                  : 'text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700'
              }`}
            >
              <Grid className="w-4 h-4" />
              <span>Kanban</span>
            </button>

            {/* Matrix */}
            <button
              onClick={() => {
                onViewChange('matrix');
                onProjectSelect('all');
              }}
              className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md text-sm transition-colors ${
                currentView === 'matrix'
                  ? 'bg-blue-50 dark:bg-slate-700 text-blue-700 dark:text-blue-400'
                  : 'text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Matrix</span>
            </button>
          </nav>
        </div>

        {/* Projects Section */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-3 px-3">
            <h3 className="text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
              Lists
            </h3>
          </div>
          <div className="space-y-1">
            {projects.map((project) => (
              <button
                key={project.id}
                onClick={() => {
                  onProjectSelect(project.id);
                  onViewChange('inbox'); // Switch to inbox view when selecting a project
                }}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md text-sm transition-colors ${
                  selectedProject === project.id
                    ? 'bg-blue-50 dark:bg-slate-700 text-blue-700 dark:text-blue-400'
                    : 'text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700'
                }`}
              >
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: project.color }}></div>
                <span className="truncate">{project.name}</span>
                <span className="ml-auto text-xs bg-gray-200 dark:bg-slate-600 px-2 py-0.5 rounded-full">
                  {tasks.filter(t => t.projectId === project.id && t.status !== 'done').length}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Theme Customization */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
              Themes
            </h3>
          </div>
          <div className="grid grid-cols-5 gap-2">
            {Object.entries(THEMES).map(([themeName, themeColors]) => (
              <button
                key={themeName}
                onClick={() => onThemeChange(themeName)}
                className={`w-8 h-8 rounded-lg ${themeColors.primary} hover:scale-110 transition-transform ${
                  currentTheme === themeName ? 'ring-2 ring-gray-400' : ''
                }`}
                title={`${themeName.charAt(0).toUpperCase() + themeName.slice(1)} theme`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
