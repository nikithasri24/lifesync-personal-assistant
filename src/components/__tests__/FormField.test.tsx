import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FormField, SelectField, TextAreaField } from '../FormField'
import { testAccessibility, setupUserEvent } from '../../test/test-utils'

describe('FormField', () => {
  const defaultProps = {
    label: 'Test Field',
    value: '',
    onChange: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Basic Rendering', () => {
    it('renders with required props', () => {
      render(<FormField {...defaultProps} />)
      
      expect(screen.getByLabelText('Test Field')).toBeInTheDocument()
      expect(screen.getByRole('textbox')).toBeInTheDocument()
    })

    it('displays label correctly', () => {
      render(<FormField {...defaultProps} label="Custom Label" />)
      
      expect(screen.getByText('Custom Label')).toBeInTheDocument()
      expect(screen.getByLabelText('Custom Label')).toBeInTheDocument()
    })

    it('shows required asterisk when required', () => {
      render(<FormField {...defaultProps} required />)
      
      expect(screen.getByText('*')).toBeInTheDocument()
      expect(screen.getByText('*')).toHaveClass('text-red-500')
    })

    it('applies custom className', () => {
      render(<FormField {...defaultProps} className="custom-class" />)
      
      const container = screen.getByLabelText('Test Field').closest('.space-y-1')
      expect(container).toHaveClass('custom-class')
    })
  })

  describe('Input Types and Values', () => {
    it('handles different input types', () => {
      const { rerender } = render(<FormField {...defaultProps} type="email" />)
      expect(screen.getByRole('textbox')).toHaveAttribute('type', 'email')

      rerender(<FormField {...defaultProps} type="password" />)
      expect(screen.getByLabelText('Test Field')).toHaveAttribute('type', 'password')

      rerender(<FormField {...defaultProps} type="number" />)
      expect(screen.getByLabelText('Test Field')).toHaveAttribute('type', 'number')
    })

    it('displays placeholder text', () => {
      render(<FormField {...defaultProps} placeholder="Enter your name" />)
      
      expect(screen.getByPlaceholderText('Enter your name')).toBeInTheDocument()
    })

    it('displays current value', () => {
      render(<FormField {...defaultProps} value="test value" />)
      
      expect(screen.getByDisplayValue('test value')).toBeInTheDocument()
    })

    it('handles null and undefined values', () => {
      const { rerender } = render(<FormField {...defaultProps} value={null} />)
      expect(screen.getByRole('textbox')).toHaveValue('')

      rerender(<FormField {...defaultProps} value={undefined} />)
      expect(screen.getByRole('textbox')).toHaveValue('')
    })
  })

  describe('User Interactions', () => {
    it('calls onChange when user types', async () => {
      const onChange = vi.fn()
      const user = setupUserEvent()
      
      render(<FormField {...defaultProps} onChange={onChange} />)
      
      const input = screen.getByRole('textbox')
      await user.type(input, 'hello')
      
      expect(onChange).toHaveBeenCalledTimes(5) // Once for each character
      expect(onChange).toHaveBeenLastCalledWith('hello')
    })

    it('calls onChange with complete value on paste', async () => {
      const onChange = vi.fn()
      const user = setupUserEvent()
      
      render(<FormField {...defaultProps} onChange={onChange} />)
      
      const input = screen.getByRole('textbox')
      await user.click(input)
      await user.paste('pasted text')
      
      expect(onChange).toHaveBeenCalledWith('pasted text')
    })

    it('allows clearing the field', async () => {
      const onChange = vi.fn()
      const user = setupUserEvent()
      
      render(<FormField {...defaultProps} value="initial value" onChange={onChange} />)
      
      const input = screen.getByRole('textbox')
      await user.clear(input)
      
      expect(onChange).toHaveBeenCalledWith('')
    })
  })

  describe('Error Handling', () => {
    it('displays error message when provided', () => {
      render(<FormField {...defaultProps} error="This field is required" />)
      
      expect(screen.getByText('This field is required')).toBeInTheDocument()
      expect(screen.getByText('This field is required')).toHaveClass('text-red-600')
    })

    it('shows error icon when error exists', () => {
      render(<FormField {...defaultProps} error="Error message" />)
      
      const errorIcons = screen.getAllByRole('img', { hidden: true })
      expect(errorIcons.length).toBeGreaterThan(0)
    })

    it('sets aria-invalid when error exists', () => {
      render(<FormField {...defaultProps} error="Error message" />)
      
      expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true')
    })

    it('links error message with input using aria-describedby', () => {
      render(<FormField {...defaultProps} label="Email" error="Invalid email" />)
      
      const input = screen.getByRole('textbox')
      const errorElement = screen.getByText('Invalid email')
      
      expect(input).toHaveAttribute('aria-describedby', 'Email-error')
      expect(errorElement.closest('p')).toHaveAttribute('id', 'Email-error')
    })

    it('does not show error elements when no error', () => {
      render(<FormField {...defaultProps} />)
      
      expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'false')
      expect(screen.getByRole('textbox')).not.toHaveAttribute('aria-describedby')
    })
  })

  describe('Accessibility', () => {
    it('is accessible without errors', async () => {
      const { container } = render(<FormField {...defaultProps} />)
      await testAccessibility(container)
    })

    it('is accessible with errors', async () => {
      const { container } = render(
        <FormField {...defaultProps} error="This field is required" />
      )
      await testAccessibility(container)
    })

    it('is accessible when required', async () => {
      const { container } = render(<FormField {...defaultProps} required />)
      await testAccessibility(container)
    })

    it('has proper label association', () => {
      render(<FormField {...defaultProps} label="Full Name" />)
      
      const input = screen.getByRole('textbox')
      const label = screen.getByText('Full Name')
      
      expect(input).toHaveAccessibleName('Full Name')
    })
  })
})

describe('SelectField', () => {
  const options = [
    { value: 'option1', label: 'Option 1' },
    { value: 'option2', label: 'Option 2' },
    { value: 'option3', label: 'Option 3' },
  ]

  const defaultProps = {
    label: 'Test Select',
    value: '',
    onChange: vi.fn(),
    options,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders select with options', () => {
    render(<SelectField {...defaultProps} />)
    
    const select = screen.getByRole('combobox')
    expect(select).toBeInTheDocument()
    
    options.forEach(option => {
      expect(screen.getByRole('option', { name: option.label })).toBeInTheDocument()
    })
  })

  it('displays placeholder option', () => {
    render(<SelectField {...defaultProps} placeholder="Choose option" />)
    
    expect(screen.getByRole('option', { name: 'Choose option' })).toBeInTheDocument()
  })

  it('handles selection changes', async () => {
    const onChange = vi.fn()
    const user = setupUserEvent()
    
    render(<SelectField {...defaultProps} onChange={onChange} />)
    
    const select = screen.getByRole('combobox')
    await user.selectOptions(select, 'option2')
    
    expect(onChange).toHaveBeenCalledWith('option2')
  })

  it('displays current value', () => {
    render(<SelectField {...defaultProps} value="option2" />)
    
    expect(screen.getByRole('combobox')).toHaveValue('option2')
  })

  it('shows error state correctly', () => {
    render(<SelectField {...defaultProps} error="Please select an option" />)
    
    expect(screen.getByText('Please select an option')).toBeInTheDocument()
    expect(screen.getByRole('combobox')).toHaveAttribute('aria-invalid', 'true')
  })

  it('is accessible', async () => {
    const { container } = render(<SelectField {...defaultProps} />)
    await testAccessibility(container)
  })
})

describe('TextAreaField', () => {
  const defaultProps = {
    label: 'Test TextArea',
    value: '',
    onChange: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders textarea with correct attributes', () => {
    render(<TextAreaField {...defaultProps} rows={5} />)
    
    const textarea = screen.getByRole('textbox')
    expect(textarea).toBeInTheDocument()
    expect(textarea).toHaveAttribute('rows', '5')
  })

  it('uses default rows when not specified', () => {
    render(<TextAreaField {...defaultProps} />)
    
    expect(screen.getByRole('textbox')).toHaveAttribute('rows', '3')
  })

  it('handles text input correctly', async () => {
    const onChange = vi.fn()
    const user = setupUserEvent()
    
    render(<TextAreaField {...defaultProps} onChange={onChange} />)
    
    const textarea = screen.getByRole('textbox')
    await user.type(textarea, 'Multi-line\ntext content')
    
    expect(onChange).toHaveBeenCalledWith('Multi-line\ntext content')
  })

  it('displays placeholder', () => {
    render(<TextAreaField {...defaultProps} placeholder="Enter description" />)
    
    expect(screen.getByPlaceholderText('Enter description')).toBeInTheDocument()
  })

  it('shows error correctly', () => {
    render(<TextAreaField {...defaultProps} error="Text is too long" />)
    
    expect(screen.getByText('Text is too long')).toBeInTheDocument()
    expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true')
  })

  it('positions error icon correctly for textarea', () => {
    const { container } = render(<TextAreaField {...defaultProps} error="Error" />)
    
    const errorIcon = container.querySelector('.absolute.top-2.right-2')
    expect(errorIcon).toBeInTheDocument()
  })

  it('is accessible', async () => {
    const { container } = render(<TextAreaField {...defaultProps} />)
    await testAccessibility(container)
  })
})

describe('Form Fields Integration', () => {
  it('all form fields work together in a form', async () => {
    const user = setupUserEvent()
    const onInputChange = vi.fn()
    const onSelectChange = vi.fn()
    const onTextAreaChange = vi.fn()
    
    render(
      <form>
        <FormField
          label="Name"
          value=""
          onChange={onInputChange}
          required
        />
        <SelectField
          label="Category"
          value=""
          onChange={onSelectChange}
          options={[{ value: 'work', label: 'Work' }]}
        />
        <TextAreaField
          label="Description"
          value=""
          onChange={onTextAreaChange}
        />
      </form>
    )
    
    // Interact with each field
    await user.type(screen.getByLabelText('Name'), 'John Doe')
    await user.selectOptions(screen.getByLabelText('Category'), 'work')
    await user.type(screen.getByLabelText('Description'), 'Some description')
    
    expect(onInputChange).toHaveBeenCalledWith('John Doe')
    expect(onSelectChange).toHaveBeenCalledWith('work')
    expect(onTextAreaChange).toHaveBeenCalledWith('Some description')
  })

  it('maintains accessibility when multiple fields have errors', async () => {
    const { container } = render(
      <div>
        <FormField
          label="Email"
          value=""
          onChange={vi.fn()}
          error="Invalid email format"
          required
        />
        <SelectField
          label="Country"
          value=""
          onChange={vi.fn()}
          options={[{ value: 'us', label: 'United States' }]}
          error="Please select a country"
        />
        <TextAreaField
          label="Comments"
          value=""
          onChange={vi.fn()}
          error="Comments are required"
        />
      </div>
    )
    
    await testAccessibility(container)
  })
})