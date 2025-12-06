import { render, screen } from '@testing-library/react';
import ProjectTracking from '../ProjectTracking';

describe('ProjectTracking – end to end placeholder', () => {
  it('guides the user to continue managing work from other sections', () => {
    render(<ProjectTracking />);

    expect(
      screen.getByText(/keep task-level progress flowing from the tasks and goals sections/i)
    ).toBeInTheDocument();
  });
});
