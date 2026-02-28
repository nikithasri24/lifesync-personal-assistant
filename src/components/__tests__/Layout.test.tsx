import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Layout from '../Layout';
import { useComposedStore } from '../../stores/useComposedStore';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

vi.mock('../../stores/useComposedStore');

vi.mock('../../providers/AuthProvider', () => ({
  useAuthContext: () => ({
    user: null,
    loading: false,
    error: null,
    signIn: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
    clearError: vi.fn(),
    isConfigured: false,
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

const setActiveView = vi.fn();
const setSidebarCollapsed = vi.fn();

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{children}</MemoryRouter>
    </QueryClientProvider>
  );
};

function mockStore(overrides: Record<string, unknown> = {}) {
  vi.mocked(useComposedStore).mockReturnValue({
    activeView: 'dashboard',
    setActiveView,
    sidebarCollapsed: false,
    setSidebarCollapsed,
    ...overrides,
  } as any);
}

beforeEach(() => {
  setActiveView.mockClear();
  setSidebarCollapsed.mockClear();
  // Set desktop width so sidebar renders
  Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1280 });
  window.dispatchEvent(new Event('resize'));
  // Mock matchMedia for useTheme hook
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
});

afterEach(() => {
  vi.resetAllMocks();
  // Reset window width
  Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1024 });
});

describe('Layout', () => {
  it('renders the brand header and content', () => {
    mockStore();

    render(
      <Layout>
        <div>Content area</div>
      </Layout>,
      { wrapper: createWrapper() }
    );

    // The logo now shows "life weave" branding
    expect(screen.getByText('life weave')).toBeInTheDocument();
    expect(screen.getByText('Content area')).toBeInTheDocument();
  });

  it('renders navigation links in the sidebar', () => {
    mockStore();

    render(
      <Layout>
        <div />
      </Layout>,
      { wrapper: createWrapper() }
    );

    // Tasks navigation link should appear at least once (in sidebar or TabBar)
    const taskLinks = screen.getAllByText('Tasks');
    expect(taskLinks.length).toBeGreaterThan(0);
  });

  it('allows collapsing and expanding the sidebar', () => {
    mockStore({ sidebarCollapsed: false });

    render(
      <Layout>
        <div />
      </Layout>,
      { wrapper: createWrapper() }
    );

    const collapseButton = screen.getByRole('button', { name: /collapse sidebar/i });
    fireEvent.click(collapseButton);

    expect(setSidebarCollapsed).toHaveBeenCalledWith(true);
  });
});
