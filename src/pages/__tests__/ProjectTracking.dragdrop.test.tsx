import { render, screen } from '@testing-library/react';
import ProjectTracking from '../ProjectTracking';

describe('ProjectTracking – drag and drop placeholders', () => {
  it('communicates that drag and drop capabilities are not yet available', () => {
    render(<ProjectTracking />);

    expect(
      screen.getByText(/kanban lanes, swimlanes, and dependency visualisation will return once the database schema is finalised/i)
    ).toBeInTheDocument();
  });
});
