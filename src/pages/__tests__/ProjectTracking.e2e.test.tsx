import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import ProjectTracking from '../ProjectTracking';

vi.mock('../hooks/useProjectTracking', () => ({
  useProjectTracking: vi.fn(() => ({
    loading: false,
    viewMode: 'list',
    setViewMode: vi.fn(),
    searchQuery: '',
    setSearchQuery: vi.fn(),
    statusFilter: 'all',
    setStatusFilter: vi.fn(),
    ownerFilter: 'all',
    setOwnerFilter: vi.fn(),
    mergedConnection: null,
    currentUserId: 'test-user',
    partnerName: null,
    showCreateModal: false,
    setShowCreateModal: vi.fn(),
    editingProject: null,
    deleteConfirmId: null,
    setDeleteConfirmId: vi.fn(),
    expandedProjectId: null,
    setExpandedProjectId: vi.fn(),
    formData: {
      name: '',
      description: '',
      status: 'planning',
      priority: 'medium',
      start_date: null,
      target_date: null,
      tags: [],
      color: '#6366f1',
    },
    setFormData: vi.fn(),
    projectMetrics: [],
    filteredProjects: [],
    stats: { total: 0, active: 0, completed: 0, onHold: 0 },
    handleCreateProject: vi.fn(),
    handleUpdateProject: vi.fn(),
    handleDeleteProject: vi.fn(),
    openEditModal: vi.fn(),
    closeModal: vi.fn(),
  })),
}));

describe('ProjectTracking – end to end placeholder', () => {
  it('guides the user to create their first project when none exist', () => {
    render(<ProjectTracking />);

    expect(
      screen.getByText(/get started by creating your first project/i)
    ).toBeInTheDocument();
  });
});
