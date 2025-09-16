import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import Layout from '../Layout';
import { useAppStore } from '../../stores/useAppStore';

// Mock the store
vi.mock('../../stores/useAppStore');

const mockStore = {
  activeView: 'dashboard',
  setActiveView: vi.fn(),
  sidebarCollapsed: false,
  setSidebarCollapsed: vi.fn(),
};

describe('Layout', () => {
  beforeEach(() => {
    vi.mocked(useAppStore).mockReturnValue(mockStore);
  });

  it('renders the LifeSync title', () => {
    render(
      <Layout>
        <div>Test Content</div>
      </Layout>
    );

    expect(screen.getByText('LifeSync')).toBeInTheDocument();
  });

  it('renders all navigation items', () => {
    render(
      <Layout>
        <div>Test Content</div>
      </Layout>
    );

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Habits')).toBeInTheDocument();
    expect(screen.getByText('Tasks')).toBeInTheDocument();
    expect(screen.getByText('Notes')).toBeInTheDocument();
    expect(screen.getByText('Projects')).toBeInTheDocument();
    expect(screen.getByText('Journal')).toBeInTheDocument();
    expect(screen.getByText('Personal Life')).toBeInTheDocument();
  });

  it('renders children content', () => {
    render(
      <Layout>
        <div>Test Content</div>
      </Layout>
    );

    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('calls setActiveView when navigation item is clicked', () => {
    render(
      <Layout>
        <div>Test Content</div>
      </Layout>
    );

    fireEvent.click(screen.getByText('Habits'));
    expect(mockStore.setActiveView).toHaveBeenCalledWith('habits');
  });

  it('toggles sidebar when menu button is clicked', () => {
    render(
      <Layout>
        <div>Test Content</div>
      </Layout>
    );

    const menuButton = screen.getByLabelText('Collapse sidebar');
    fireEvent.click(menuButton);
    expect(mockStore.setSidebarCollapsed).toHaveBeenCalledWith(true);
  });

  it('highlights active navigation item', () => {
    vi.mocked(useAppStore).mockReturnValue({
      ...mockStore,
      activeView: 'habits',
    });

    render(
      <Layout>
        <div>Test Content</div>
      </Layout>
    );

    const habitsButton = screen.getByText('Habits');
    expect(habitsButton.closest('button')).toHaveClass('bg-primary-50');
  });
});