/**
 * Hook for managing all UI state
 * Tabs, modals, forms, filters, sorting, search
 */

import { useState } from 'react';
import type { TaskView, ProjectView, FilterType, SortByType, TabType } from '../types';

export const useTaskFocusState = () => {
  // Tab navigation
  const [activeTab, setActiveTab] = useState<TabType>('tasks');

  // Filters and search
  const [filter, setFilter] = useState<FilterType>('all');
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortByType>('priority');

  // Modal states
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TaskView | null>(null);

  // Form states
  const [newTask, setNewTask] = useState<Partial<TaskView>>({
    title: '',
    priority: 'medium',
    estimatedTime: 25,
    tags: [],
    difficulty: 3,
    category: 'work',
    subtasks: [],
    notes: ''
  });

  const [newProject, setNewProject] = useState<Partial<ProjectView>>({
    name: '',
    color: '#6366f1',
    category: 'work',
    icon: '📁',
    estimatedHours: 10,
    status: 'active'
  });

  const resetNewTask = () => {
    setNewTask({
      title: '',
      priority: 'medium',
      estimatedTime: 25,
      tags: [],
      difficulty: 3,
      category: 'work',
      subtasks: [],
      notes: ''
    });
  };

  const resetNewProject = () => {
    setNewProject({
      name: '',
      color: '#6366f1',
      category: 'work',
      icon: '📁',
      estimatedHours: 10,
      status: 'active'
    });
  };

  return {
    // Tab state
    activeTab,
    setActiveTab,

    // Filter state
    filter,
    setFilter,
    selectedProject,
    setSelectedProject,
    searchQuery,
    setSearchQuery,
    sortBy,
    setSortBy,

    // Modal state
    showCreateTask,
    setShowCreateTask,
    showCreateProject,
    setShowCreateProject,
    selectedTask,
    setSelectedTask,

    // Form state
    newTask,
    setNewTask,
    resetNewTask,
    newProject,
    setNewProject,
    resetNewProject
  };
};
