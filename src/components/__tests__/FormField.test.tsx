import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { FormField, SelectField, TextAreaField } from '../FormField';

describe('FormField', () => {
  it('renders a label and required indicator', () => {
    render(
      <FormField
        label="Email"
        value=""
        onChange={() => {}}
        required
        placeholder="you@example.com"
        error={undefined}
      />
    );

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByText('*')).toBeInTheDocument();
  });

  it('updates the value and calls onChange when typing', () => {
    const handleChange = vi.fn();

    render(
      <FormField
        label="Name"
        value={undefined}
        onChange={handleChange}
        error={undefined}
        placeholder="Your name"
      />
    );

    const input = screen.getByPlaceholderText('Your name') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'Ada' } });

    expect(input.value).toBe('Ada');
    expect(handleChange).toHaveBeenCalledWith('Ada');
  });

  it('shows the error message and links it via aria-describedby', () => {
    render(
      <FormField
        label="Email"
        value=""
        onChange={() => {}}
        placeholder="you@example.com"
        error="Invalid email"
      />
    );

    const input = screen.getByPlaceholderText('you@example.com');
    const errorMessage = screen.getByRole('alert');

    const describedBy = input.getAttribute('aria-describedby');
    expect(describedBy).toBeTruthy();
    expect(errorMessage).toHaveAttribute('id', describedBy || '');
  });
});

describe('SelectField', () => {
  it('renders options and propagates changes', () => {
    const handleChange = vi.fn();

    const { rerender } = render(
      <SelectField
        label="Category"
        value=""
        onChange={handleChange}
        options={[
          { value: 'work', label: 'Work' },
          { value: 'personal', label: 'Personal' },
        ]}
      />
    );

    const select = screen.getByLabelText(/category/i) as HTMLSelectElement;
    fireEvent.change(select, { target: { value: 'personal' } });

    expect(handleChange).toHaveBeenCalledWith('personal');
    // Update the controlled value to reflect the change
    rerender(
      <SelectField
        label="Category"
        value="personal"
        onChange={handleChange}
        options={[
          { value: 'work', label: 'Work' },
          { value: 'personal', label: 'Personal' },
        ]}
      />
    );
    expect((screen.getByLabelText(/category/i) as HTMLSelectElement).value).toBe('personal');
  });
});

describe('TextAreaField', () => {
  it('captures multiline content', () => {
    const handleChange = vi.fn();

    render(
      <TextAreaField
        label="Notes"
        value={undefined}
        onChange={handleChange}
        placeholder="Add details"
      />
    );

    const textarea = screen.getByPlaceholderText('Add details') as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: 'Line one\nLine two' } });

    expect(textarea.value).toBe('Line one\nLine two');
    expect(handleChange).toHaveBeenCalledWith('Line one\nLine two');
  });
});
