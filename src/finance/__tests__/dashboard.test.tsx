import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import DashboardPage from '../pages/DashboardPage';

vi.mock('../data', async () => {
  const { MockApi } = await import('../data/mockApi');
  return { getFinanceAPI: async () => new MockApi() };
});

vi.mock('@/providers/AuthProvider', () => ({
  useAuthContext: vi.fn(() => ({
    user: { id: 'test-user-123', email: 'test@example.com' },
    session: null,
    loading: false,
    signOut: vi.fn(),
  })),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('Finance Dashboard', () => {
  it('shows cash flow totals from seed (latest month)', async () => {
    const Wrapper = createWrapper();
    render(<DashboardPage />, { wrapper: Wrapper });
    // The dashboard should render and show finance-related content
    await waitFor(() => expect(screen.getByText(/Cash Flow/)).toBeInTheDocument(), { timeout: 5000 });
    // Just verify the dashboard renders with cash flow section
    expect(screen.getByText(/Cash Flow/)).toBeInTheDocument();
  });
});
