/**
 * FilterBarV2 Component
 * Pill-style filters for Tasks with search, priority, status, and project filters
 */

import React from 'react';
import { Search } from 'lucide-react';
import { useThemeColors } from '../../../hooks/useThemeColors';

export type PriorityFilter = 'all' | 'urgent' | 'important' | 'high' | 'medium' | 'low';
export type StatusFilter = 'all' | 'todo' | 'in_progress' | 'done' | 'waiting' | 'scheduled';

export interface FilterBarV2Props {
  priorityFilter: PriorityFilter;
  onPriorityFilterChange: (filter: PriorityFilter) => void;
  statusFilter: StatusFilter;
  onStatusFilterChange: (filter: StatusFilter) => void;
  projectFilter: string; // 'all' or project ID
  onProjectFilterChange: (filter: string) => void;
  projects: Array<{ id: string; name: string; color?: string }>;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  showStarredOnly: boolean;
  onToggleStarred: () => void;
}

export const FilterBarV2: React.FC<FilterBarV2Props> = ({
  priorityFilter,
  onPriorityFilterChange,
  statusFilter,
  onStatusFilterChange,
  projectFilter,
  onProjectFilterChange,
  projects,
  searchQuery,
  onSearchChange,
  showStarredOnly,
  onToggleStarred,
}) => {
  const colors = useThemeColors();

  const priorityOptions: { value: PriorityFilter; label: string }[] = [
    { value: 'all', label: 'All Priorities' },
    { value: 'urgent', label: '🔥 Urgent' },
    { value: 'important', label: '⭐ Important' },
    { value: 'high', label: 'High' },
    { value: 'medium', label: 'Medium' },
    { value: 'low', label: 'Low' },
  ];

  const statusOptions: { value: StatusFilter; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'todo', label: 'To Do' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'waiting', label: 'Waiting' },
    { value: 'scheduled', label: 'Scheduled' },
    { value: 'done', label: 'Done' },
  ];

  return (
    <div className="mb-6 space-y-3">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4" style={{ color: colors.text.tertiary }} />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search tasks..."
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none transition-all"
        />
      </div>

      {/* Quick Filters */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={onToggleStarred}
          className="px-4 py-2 rounded-full text-sm font-semibold transition-all"
          style={{
            background: showStarredOnly
              ? 'linear-gradient(135deg, rgba(212, 165, 116, 0.3) 0%, rgba(193, 139, 94, 0.3) 100%)'
              : colors.bg.secondary,
            borderWidth: '2px',
            borderStyle: 'solid',
            borderColor: showStarredOnly ? '#C18B5E' : 'transparent',
            color: showStarredOnly ? '#C18B5E' : colors.text.secondary,
          }}
        >
          ⭐ Starred
        </button>
      </div>

      {/* Priority Filter Pills */}
      <div>
        <div className="text-xs font-semibold mb-2" style={{ color: colors.text.tertiary }}>
          Priority
        </div>
        <div className="flex gap-2 flex-wrap">
          {priorityOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => onPriorityFilterChange(option.value)}
              className="px-4 py-2 rounded-full text-sm font-semibold transition-all"
              style={{
                background: priorityFilter === option.value
                  ? 'linear-gradient(135deg, rgba(212, 165, 116, 0.3) 0%, rgba(193, 139, 94, 0.3) 100%)'
                  : colors.bg.secondary,
                borderWidth: '2px',
                borderStyle: 'solid',
                borderColor: priorityFilter === option.value ? '#C18B5E' : 'transparent',
                color: priorityFilter === option.value ? '#C18B5E' : colors.text.secondary,
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Status Filter Pills */}
      <div>
        <div className="text-xs font-semibold mb-2" style={{ color: colors.text.tertiary }}>
          Status
        </div>
        <div className="flex gap-2 flex-wrap">
          {statusOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => onStatusFilterChange(option.value)}
              className="px-4 py-2 rounded-full text-sm font-semibold transition-all"
              style={{
                background: statusFilter === option.value
                  ? 'linear-gradient(135deg, rgba(212, 165, 116, 0.3) 0%, rgba(193, 139, 94, 0.3) 100%)'
                  : colors.bg.secondary,
                borderWidth: '2px',
                borderStyle: 'solid',
                borderColor: statusFilter === option.value ? '#C18B5E' : 'transparent',
                color: statusFilter === option.value ? '#C18B5E' : colors.text.secondary,
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Project Filter Pills */}
      {projects.length > 0 && (
        <div>
          <div className="text-xs font-semibold mb-2" style={{ color: colors.text.tertiary }}>
            Project
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => onProjectFilterChange('all')}
              className="px-4 py-2 rounded-full text-sm font-semibold transition-all"
              style={{
                background: projectFilter === 'all'
                  ? 'linear-gradient(135deg, rgba(212, 165, 116, 0.3) 0%, rgba(193, 139, 94, 0.3) 100%)'
                  : colors.bg.secondary,
                borderWidth: '2px',
                borderStyle: 'solid',
                borderColor: projectFilter === 'all' ? '#C18B5E' : 'transparent',
                color: projectFilter === 'all' ? '#C18B5E' : colors.text.secondary,
              }}
            >
              All Projects
            </button>
            {projects.map((project) => (
              <button
                key={project.id}
                onClick={() => onProjectFilterChange(project.id)}
                className="px-4 py-2 rounded-full text-sm font-semibold transition-all flex items-center gap-2"
                style={{
                  background: projectFilter === project.id
                    ? 'linear-gradient(135deg, rgba(212, 165, 116, 0.3) 0%, rgba(193, 139, 94, 0.3) 100%)'
                    : colors.bg.secondary,
                  borderWidth: '2px',
                  borderStyle: 'solid',
                  borderColor: projectFilter === project.id ? '#C18B5E' : 'transparent',
                  color: projectFilter === project.id ? '#C18B5E' : colors.text.secondary,
                }}
              >
                <span
                  className="inline-block w-2 h-2 rounded-full"
                  style={{ backgroundColor: project.color || '#6B7280' }}
                />
                {project.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FilterBarV2;
