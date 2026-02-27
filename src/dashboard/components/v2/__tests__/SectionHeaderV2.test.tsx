/**
 * Unit tests for SectionHeaderV2 component
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SectionHeaderV2 } from '../SectionHeaderV2';
import { CheckSquare } from 'lucide-react';

describe('SectionHeaderV2', () => {
  describe('Basic Rendering', () => {
    it('should render the title', () => {
      render(<SectionHeaderV2 title="Today's Tasks" />);
      expect(screen.getByText("Today's Tasks")).toBeInTheDocument();
    });

    it('should render subtitle when provided', () => {
      render(<SectionHeaderV2 title="Tasks" subtitle="5 remaining" />);
      expect(screen.getByText('5 remaining')).toBeInTheDocument();
    });

    it('should not render subtitle when not provided', () => {
      render(<SectionHeaderV2 title="Tasks" />);
      expect(screen.queryByText('remaining')).not.toBeInTheDocument();
    });

    it('should render icon when provided', () => {
      render(<SectionHeaderV2 title="Tasks" icon={CheckSquare} />);
      // Icon renders as SVG within a container
      const { container } = render(<SectionHeaderV2 title="Tasks" icon={CheckSquare} />);
      expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('should not render icon container when no icon provided', () => {
      const { container } = render(<SectionHeaderV2 title="Tasks" />);
      expect(container.querySelector('svg')).not.toBeInTheDocument();
    });
  });

  describe('Action Button', () => {
    it('should render "View all" button when onAction provided', () => {
      render(<SectionHeaderV2 title="Tasks" onAction={vi.fn()} />);
      expect(screen.getByText('View all')).toBeInTheDocument();
    });

    it('should not render action button when onAction not provided', () => {
      render(<SectionHeaderV2 title="Tasks" />);
      expect(screen.queryByText('View all')).not.toBeInTheDocument();
    });

    it('should render custom actionLabel', () => {
      render(<SectionHeaderV2 title="Tasks" actionLabel="See more" onAction={vi.fn()} />);
      expect(screen.getByText('See more')).toBeInTheDocument();
    });

    it('should call onAction when button clicked', async () => {
      const user = userEvent.setup();
      const onActionMock = vi.fn();
      render(<SectionHeaderV2 title="Tasks" onAction={onActionMock} />);

      await user.click(screen.getByText('View all'));
      expect(onActionMock).toHaveBeenCalledTimes(1);
    });

    it('should render ArrowRight icon in action button', () => {
      const { container } = render(<SectionHeaderV2 title="Tasks" onAction={vi.fn()} />);
      const svgs = container.querySelectorAll('svg');
      expect(svgs.length).toBeGreaterThan(0);
    });
  });

  describe('Styling', () => {
    it('should have flex layout', () => {
      const { container } = render(<SectionHeaderV2 title="Tasks" />);
      const header = container.firstChild as HTMLElement;
      expect(header.className).toContain('flex');
    });

    it('should have justify-between class', () => {
      const { container } = render(<SectionHeaderV2 title="Tasks" />);
      const header = container.firstChild as HTMLElement;
      expect(header.className).toContain('justify-between');
    });

    it('should use h3 for title', () => {
      render(<SectionHeaderV2 title="My Tasks" />);
      expect(screen.getByRole('heading', { level: 3, name: 'My Tasks' })).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      const { container } = render(<SectionHeaderV2 title="Tasks" className="custom-class" />);
      const header = container.firstChild as HTMLElement;
      expect(header.className).toContain('custom-class');
    });

    it('title should have text-xl class', () => {
      render(<SectionHeaderV2 title="Tasks" />);
      const title = screen.getByRole('heading', { level: 3 });
      expect(title.className).toContain('text-xl');
    });

    it('title should have font-semibold class', () => {
      render(<SectionHeaderV2 title="Tasks" />);
      const title = screen.getByRole('heading', { level: 3 });
      expect(title.className).toContain('font-semibold');
    });
  });
});
