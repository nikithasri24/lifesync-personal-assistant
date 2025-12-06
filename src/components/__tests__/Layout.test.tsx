import { render, screen, fireEvent } from '@testing-library/react';
import Layout from '../Layout';
import { useAppStore } from '../../stores/useAppStore';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

vi.mock('../../stores/useAppStore');

const setActiveView = vi.fn();
const setSidebarCollapsed = vi.fn();

function mockStore(overrides: Record<string, unknown> = {}) {
  vi.mocked(useAppStore).mockReturnValue({
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
});

afterEach(() => {
  vi.resetAllMocks();
});

describe('Layout', () => {
  it('renders the premium brand header', () => {
    mockStore();

    render(
      <Layout>
        <div>Content area</div>
      </Layout>
    );

    expect(screen.getByText('ELEVATE')).toBeInTheDocument();
    expect(screen.getByText(/personal suite/i)).toBeInTheDocument();
    expect(screen.getByText('Content area')).toBeInTheDocument();
  });

  it('highlights navigation items and reacts to clicks', () => {
    mockStore();

    render(
      <Layout>
        <div />
      </Layout>
    );

    const tasksButton = screen.getByRole('button', { name: /tasks/i });
    fireEvent.click(tasksButton);

    expect(setActiveView).toHaveBeenCalledWith('todos');
  });

  it('allows collapsing and expanding the sidebar', () => {
    mockStore({ sidebarCollapsed: false });

    render(
      <Layout>
        <div />
      </Layout>
    );

    const collapseButton = screen.getByRole('button', { name: /collapse sidebar/i });
    fireEvent.click(collapseButton);

    expect(setSidebarCollapsed).toHaveBeenCalledWith(true);
  });
});
