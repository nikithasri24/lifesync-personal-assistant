import { render, screen } from '@testing-library/react';
import ProjectTracking from '../ProjectTracking';

describe('ProjectTracking – advanced scenarios', () => {
  it('falls back to the informational placeholder while advanced features are unavailable', () => {
    render(<ProjectTracking />);

    expect(
      screen.getByText(/kanban lanes, swimlanes, and dependency visualisation will return/i)
    ).toBeInTheDocument();
  });
});
