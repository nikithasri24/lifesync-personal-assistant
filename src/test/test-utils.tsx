import React, { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { axe, toHaveNoViolations } from 'jest-axe'
import userEvent from '@testing-library/user-event'

// Re-export everything from React Testing Library
export * from '@testing-library/react'

// Custom render function that includes common providers
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <div data-testid="test-wrapper">
      {children}
    </div>
  )
}

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) => render(ui, { wrapper: AllTheProviders, ...options })

export { customRender as render }

// Accessibility testing helper
export const testAccessibility = async (container: HTMLElement) => {
  const results = await axe(container)
  expect(results).toHaveNoViolations()
}

// Common test data factories
export const createMockTask = (overrides = {}) => ({
  id: '1',
  title: 'Test Task',
  description: 'Test Description',
  status: 'todo' as const,
  priority: 'medium' as const,
  category: 'work' as const,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  due_date: null,
  estimated_time: null,
  actual_time: null,
  tags: [],
  is_starred: false,
  project_id: null,
  ...overrides,
})

export const createMockProject = (overrides = {}) => ({
  id: '1',
  name: 'Test Project',
  description: 'Test Project Description',
  status: 'active' as const,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
})

export const createMockHabit = (overrides = {}) => ({
  id: '1',
  name: 'Test Habit',
  description: 'Test Habit Description',
  category: 'health' as const,
  frequency_type: 'daily' as const,
  frequency_value: 1,
  target_value: 1,
  goal_mode: 'daily_target' as const,
  is_active: true,
  color: '#3B82F6',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
})

// Drag and drop testing helpers
export const createDragEvent = (type: string, dataTransfer?: DataTransfer) => {
  const event = new Event(type, { bubbles: true }) as any
  event.dataTransfer = dataTransfer || new DataTransfer()
  return event
}

export const simulateDragAndDrop = async (
  source: HTMLElement,
  target: HTMLElement,
) => {
  const user = userEvent.setup()
  
  // Start drag
  await user.pointer({ target: source, keys: '[MouseLeft>]' })
  
  // Move to target
  await user.pointer({ target: target })
  
  // Drop
  await user.pointer('[/MouseLeft]')
}

// Performance testing helper
export const measureRenderTime = async (renderFn: () => void) => {
  const start = performance.now()
  renderFn()
  const end = performance.now()
  return end - start
}

// Mock API responses
export const mockApiResponse = <T,>(data: T, status = 200) => {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
  } as Response)
}

// Wait for async operations
export const waitForLoadingToFinish = async () => {
  const { findByText } = await import('@testing-library/react')
  try {
    await findByText(/loading/i, undefined, { timeout: 100 })
  } catch {
    // Loading text not found, which is expected when loading is complete
  }
}

// Setup user event with common configuration
export const setupUserEvent = () => userEvent.setup()

// Common test assertions
export const expectElementToBeAccessible = async (element: HTMLElement) => {
  await testAccessibility(element)
}

export const expectElementToHaveCorrectARIA = (
  element: HTMLElement,
  attributes: Record<string, string>,
) => {
  Object.entries(attributes).forEach(([attr, value]) => {
    expect(element).toHaveAttribute(attr, value)
  })
}

// Mock Zustand store for testing
export const mockZustandStore = <T extends Record<string, any>>(initialState: T) => {
  let state = { ...initialState }
  
  return {
    getState: () => state,
    setState: (newState: Partial<T>) => {
      state = { ...state, ...newState }
    },
    subscribe: vi.fn(),
    destroy: vi.fn(),
  }
}

// Component testing patterns
export const renderWithStore = (
  component: ReactElement,
  initialState = {},
) => {
  // This can be enhanced to include actual store providers
  return customRender(component)
}

// Form testing helpers
export const fillForm = async (form: HTMLElement, data: Record<string, string>) => {
  const user = setupUserEvent()
  
  for (const [fieldName, value] of Object.entries(data)) {
    const field = form.querySelector(`[name="${fieldName}"]`) as HTMLElement
    if (field) {
      await user.clear(field)
      await user.type(field, value)
    }
  }
}

export const submitForm = async (form: HTMLElement) => {
  const user = setupUserEvent()
  const submitButton = form.querySelector('[type="submit"]') as HTMLElement
  if (submitButton) {
    await user.click(submitButton)
  }
}