import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { describe, it, expect, vi } from 'vitest';

// Mock all the project hooks
vi.mock('@/hooks/useProjectsQuery', () => ({
  useProjectsQuery: () => ({ data: [], isLoading: false, error: null }),
  useMergedProjectsConnectionQuery: () => ({ data: null, isLoading: false }),
  useCreateProjectMutation: () => ({ mutate: vi.fn(), mutateAsync: vi.fn(), isPending: false }),
  useUpdateProjectMutation: () => ({ mutate: vi.fn(), mutateAsync: vi.fn(), isPending: false }),
  useDeleteProjectMutation: () => ({ mutate: vi.fn(), mutateAsync: vi.fn(), isPending: false }),
  useProjectsByStatus: () => ({ data: [], isLoading: false }),
  useProjectStats: () => ({ data: { total: 0, active: 0, completed: 0, onHold: 0 }, isLoading: false }),
  useProjectAnalyticsQuery: () => ({ data: null, isLoading: false }),
}));

vi.mock('@/utils/ownerUtils', () => ({
  useCurrentUserId: () => ({ data: 'test-user', isLoading: false }),
  usePartnerName: () => 'Partner',
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('ProjectTracking', () => {
  it('renders the projects heading', async () => {
    const { default: ProjectTracking } = await import('../ProjectTracking');
    render(<ProjectTracking />, { wrapper: createWrapper() });

    await waitFor(() => {
      const headings = screen.getAllByRole('heading', { name: /projects/i });
      expect(headings.length).toBeGreaterThan(0);
    });
  });
});
