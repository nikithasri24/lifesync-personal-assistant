import { render, screen, fireEvent } from '@testing-library/react'
import React from 'react'
import ErrorState, { NetworkError, NotFoundError, PermissionError, EmptyState } from '../ErrorState'

describe('ErrorState family', () => {
  it('renders default generic error', () => {
    render(<ErrorState />)
    expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument()
  })

  it('renders network error and invokes retry', () => {
    const onRetry = vi.fn()
    render(<NetworkError onRetry={onRetry} />)
    fireEvent.click(screen.getByRole('button', { name: /try again/i }))
    expect(onRetry).toHaveBeenCalled()
  })

  it('renders not found with custom resource', () => {
    render(<NotFoundError resource="page" />)
    expect(screen.getByText(/The page you're looking for/i)).toBeInTheDocument()
  })

  it('renders permission error', () => {
    render(<PermissionError />)
    expect(screen.getByText(/Access Denied/i)).toBeInTheDocument()
  })

  it('renders empty state and triggers action', () => {
    const action = vi.fn()
    render(<EmptyState title="No items" message="Add your first item" action={action} actionText="Create" />)
    expect(screen.getByText('No items')).toBeInTheDocument()
    expect(screen.getByText('Add your first item')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Create' }))
    expect(action).toHaveBeenCalled()
  })
})

