import { render, screen } from '@testing-library/react';
import ProjectTracking from '../ProjectTracking';

describe('ProjectTracking', () => {
  it('renders the placeholder heading and message', () => {
    render(<ProjectTracking />);

    expect(
      screen.getByRole('heading', { name: /project tracking/i })
    ).toBeInTheDocument();

    expect(
      screen.getByText(/a slimmer project view is on the roadmap/i)
    ).toBeInTheDocument();

    expect(
      screen.getByText(/kanban lanes, swimlanes, and dependency visualisation/i)
    ).toBeInTheDocument();
  });
});
