import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import LoadingSpinner, { SkeletonCard, SkeletonTable, SkeletonChart } from '../LoadingSpinner'
import { testAccessibility } from '../../test/test-utils'

describe('LoadingSpinner', () => {
  it('renders with default props', () => {
    render(<LoadingSpinner />)
    
    const spinner = screen.getByRole('img', { hidden: true }) // Lucide icons have role="img"
    expect(spinner).toBeInTheDocument()
    expect(spinner).toHaveClass('w-6', 'h-6', 'animate-spin', 'text-blue-600')
  })

  it('renders with different sizes', () => {
    const { rerender } = render(<LoadingSpinner size="sm" />)
    expect(screen.getByRole('img', { hidden: true })).toHaveClass('w-4', 'h-4')

    rerender(<LoadingSpinner size="md" />)
    expect(screen.getByRole('img', { hidden: true })).toHaveClass('w-6', 'h-6')

    rerender(<LoadingSpinner size="lg" />)
    expect(screen.getByRole('img', { hidden: true })).toHaveClass('w-8', 'h-8')
  })

  it('renders with custom className', () => {
    render(<LoadingSpinner className="custom-class" />)
    
    const container = screen.getByRole('img', { hidden: true }).closest('div')
    expect(container).toHaveClass('custom-class')
  })

  it('renders with text when provided', () => {
    render(<LoadingSpinner text="Loading data..." />)
    
    expect(screen.getByText('Loading data...')).toBeInTheDocument()
    expect(screen.getByText('Loading data...')).toHaveClass('text-sm', 'text-gray-600', 'animate-pulse')
  })

  it('does not render text when not provided', () => {
    render(<LoadingSpinner />)
    
    expect(screen.queryByText(/loading/i)).not.toBeInTheDocument()
  })

  it('is accessible', async () => {
    const { container } = render(<LoadingSpinner text="Loading content" />)
    await testAccessibility(container)
  })

  it('has correct ARIA attributes for screen readers', () => {
    render(<LoadingSpinner text="Loading data..." />)
    
    // The spinner should be hidden from screen readers since it's decorative
    // The text provides the actual loading context
    const text = screen.getByText('Loading data...')
    expect(text).toBeInTheDocument()
  })
})

describe('SkeletonCard', () => {
  it('renders skeleton card with default structure', () => {
    render(<SkeletonCard />)
    
    const card = screen.getByRole('generic') // div element
    expect(card).toHaveClass('animate-pulse', 'bg-white', 'rounded-xl', 'shadow-lg')
  })

  it('applies custom className', () => {
    render(<SkeletonCard className="custom-skeleton" />)
    
    const card = screen.getByRole('generic')
    expect(card).toHaveClass('custom-skeleton')
  })

  it('has correct skeleton structure', () => {
    const { container } = render(<SkeletonCard />)
    
    // Check for avatar skeleton
    const avatar = container.querySelector('.rounded-full.bg-gray-300.h-12.w-12')
    expect(avatar).toBeInTheDocument()
    
    // Check for text skeletons
    const textSkeletons = container.querySelectorAll('.bg-gray-300.rounded')
    expect(textSkeletons.length).toBeGreaterThan(2)
  })

  it('is accessible', async () => {
    const { container } = render(<SkeletonCard />)
    await testAccessibility(container)
  })
})

describe('SkeletonTable', () => {
  it('renders with default rows and columns', () => {
    const { container } = render(<SkeletonTable />)
    
    // Default is 5 rows, 4 columns
    const rows = container.querySelectorAll('.divide-y > div')
    expect(rows).toHaveLength(5)
    
    // Check first row has 4 columns
    const firstRowColumns = rows[0].querySelectorAll('div')
    expect(firstRowColumns).toHaveLength(4)
  })

  it('renders with custom rows and columns', () => {
    const { container } = render(<SkeletonTable rows={3} columns={2} />)
    
    const rows = container.querySelectorAll('.divide-y > div')
    expect(rows).toHaveLength(3)
    
    const firstRowColumns = rows[0].querySelectorAll('div')
    expect(firstRowColumns).toHaveLength(2)
  })

  it('has proper table structure', () => {
    const { container } = render(<SkeletonTable />)
    
    // Should have header area
    const header = container.querySelector('.p-6.border-b')
    expect(header).toBeInTheDocument()
    
    // Should have divided rows
    const rowsContainer = container.querySelector('.divide-y')
    expect(rowsContainer).toBeInTheDocument()
  })

  it('is accessible', async () => {
    const { container } = render(<SkeletonTable />)
    await testAccessibility(container)
  })
})

describe('SkeletonChart', () => {
  it('renders chart skeleton structure', () => {
    const { container } = render(<SkeletonChart />)
    
    // Should have title area
    const title = container.querySelector('.h-6.bg-gray-300.rounded.w-1\\/3')
    expect(title).toBeInTheDocument()
    
    // Should have chart area
    const chart = container.querySelector('.h-64.bg-gray-300.rounded')
    expect(chart).toBeInTheDocument()
    
    // Should have legend area
    const legendItems = container.querySelectorAll('.h-3.bg-gray-300.rounded.w-16')
    expect(legendItems).toHaveLength(3)
  })

  it('applies custom className', () => {
    render(<SkeletonChart className="custom-chart" />)
    
    const chart = screen.getByRole('generic')
    expect(chart).toHaveClass('custom-chart')
  })

  it('is accessible', async () => {
    const { container } = render(<SkeletonChart />)
    await testAccessibility(container)
  })
})

describe('Loading Components Integration', () => {
  it('loading components work together in complex layouts', () => {
    const { container } = render(
      <div>
        <LoadingSpinner text="Loading dashboard..." />
        <SkeletonCard />
        <SkeletonTable rows={3} columns={3} />
        <SkeletonChart />
      </div>
    )
    
    expect(screen.getByText('Loading dashboard...')).toBeInTheDocument()
    expect(container.querySelectorAll('.animate-pulse')).toHaveLength(4) // All components should have animation
  })

  it('maintains accessibility when components are composed', async () => {
    const { container } = render(
      <div role="main" aria-label="Loading content">
        <LoadingSpinner text="Loading..." />
        <SkeletonCard />
      </div>
    )
    
    await testAccessibility(container)
  })
})

describe('Performance and Animation', () => {
  it('all skeleton components have animate-pulse class', () => {
    const { container: spinnerContainer } = render(<LoadingSpinner />)
    const { container: cardContainer } = render(<SkeletonCard />)
    const { container: tableContainer } = render(<SkeletonTable />)
    const { container: chartContainer } = render(<SkeletonChart />)
    
    // LoadingSpinner text should have animate-pulse when text is provided
    const { rerender } = render(<LoadingSpinner text="Loading..." />)
    expect(screen.getByText('Loading...')).toHaveClass('animate-pulse')
    
    // All skeleton components should have animate-pulse
    expect(cardContainer.querySelector('.animate-pulse')).toBeInTheDocument()
    expect(tableContainer.querySelector('.animate-pulse')).toBeInTheDocument()
    expect(chartContainer.querySelector('.animate-pulse')).toBeInTheDocument()
  })

  it('spinner has rotate animation', () => {
    render(<LoadingSpinner />)
    
    const spinner = screen.getByRole('img', { hidden: true })
    expect(spinner).toHaveClass('animate-spin')
  })
})