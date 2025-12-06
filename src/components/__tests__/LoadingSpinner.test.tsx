import { render, screen } from '@testing-library/react';
import LoadingSpinner, { SkeletonCard, SkeletonTable, SkeletonChart } from '../LoadingSpinner';
import { describe, it, expect } from 'vitest';

describe('LoadingSpinner', () => {
  it('renders a spinning loader and optional text', () => {
    render(<LoadingSpinner text="Loading data" />);

    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByText(/loading data/i)).toBeInTheDocument();
  });

  it('supports different sizes', () => {
    const { rerender } = render(<LoadingSpinner size="sm" />);
    expect(screen.getByRole('img', { hidden: true })).toHaveClass('w-4', 'h-4');

    rerender(<LoadingSpinner size="lg" />);
    expect(screen.getByRole('img', { hidden: true })).toHaveClass('w-8', 'h-8');
  });
});

describe('Skeleton components', () => {
  it('SkeletonCard advertises loading content', () => {
    render(<SkeletonCard />);

    const card = screen.getByRole('group', { name: /loading content/i });
    expect(card).toHaveClass('animate-pulse');
    expect(card).toHaveClass('rounded-xl');
  });

  it('SkeletonTable generates the requested number of rows', () => {
    render(<SkeletonTable rows={3} columns={2} />);

    const table = screen.getByRole('group', { name: /loading table/i });
    expect(table).toHaveClass('animate-pulse');
    expect(table.querySelectorAll('[role="presentation"]')).not.toHaveLength(0);
  });

  it('SkeletonChart accepts additional class names', () => {
    render(<SkeletonChart className="custom-chart" />);

    const chart = screen.getByRole('group', { name: /loading chart/i });
    expect(chart).toHaveClass('custom-chart');
    expect(chart).toHaveClass('animate-pulse');
  });
});
