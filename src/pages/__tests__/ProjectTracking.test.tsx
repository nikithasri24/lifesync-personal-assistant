import { render, screen } from '@testing-library/react';
import ProjectTracking from '../ProjectTracking';

describe('ProjectTracking', () => {
  it('renders the placeholder heading and message', () => {
    render(<ProjectTracking />);

    expect(
      screen.getByRole('heading', { name: /projects/i })
    ).toBeInTheDocument();

    expect(
      screen.getByText(/create your first project to start tracking/i)
    ).toBeInTheDocument();
  });
});
