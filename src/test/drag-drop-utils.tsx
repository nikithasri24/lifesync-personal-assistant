import { vi } from 'vitest'
import { fireEvent } from '@testing-library/react'

/**
 * Utilities for testing drag and drop interactions with @dnd-kit
 * These utilities help test drag and drop functionality without relying on complex browser events
 */

// Mock DnD Kit types
export interface MockDragEvent {
  active: { id: string; data?: any }
  over?: { id: string; data?: any } | null
  delta?: { x: number; y: number }
  activatorEvent?: Event
}

export interface MockDragEndEvent extends MockDragEvent {
  over: { id: string; data?: any } | null
}

export interface MockDragStartEvent {
  active: { id: string; data?: any }
}

export interface MockDragOverEvent extends MockDragEvent {
  over: { id: string; data?: any } | null
}

// Mock handlers storage
let mockDragEndHandler: ((event: MockDragEndEvent) => void) | null = null
let mockDragStartHandler: ((event: MockDragStartEvent) => void) | null = null
let mockDragOverHandler: ((event: MockDragOverEvent) => void) | null = null

/**
 * Mock DndContext that captures the drag handlers for testing
 */
export const createMockDndContext = () => {
  return vi.fn().mockImplementation(({ 
    children, 
    onDragEnd, 
    onDragStart, 
    onDragOver 
  }: { 
    children: React.ReactNode
    onDragEnd?: (event: MockDragEndEvent) => void
    onDragStart?: (event: MockDragStartEvent) => void
    onDragOver?: (event: MockDragOverEvent) => void
  }) => {
    // Store handlers for later use in tests
    mockDragEndHandler = onDragEnd || null
    mockDragStartHandler = onDragStart || null
    mockDragOverHandler = onDragOver || null
    
    return children
  })
}

/**
 * Simulate a drag start event
 */
export const simulateDragStart = (activeId: string, data?: any) => {
  if (!mockDragStartHandler) {
    throw new Error('No drag start handler found. Make sure DndContext is mocked.')
  }
  
  const event: MockDragStartEvent = {
    active: { id: activeId, data }
  }
  
  mockDragStartHandler(event)
  return event
}

/**
 * Simulate a drag over event
 */
export const simulateDragOver = (activeId: string, overId: string, activeData?: any, overData?: any) => {
  if (!mockDragOverHandler) {
    // Drag over is optional, so we don't throw
    return null
  }
  
  const event: MockDragOverEvent = {
    active: { id: activeId, data: activeData },
    over: { id: overId, data: overData }
  }
  
  mockDragOverHandler(event)
  return event
}

/**
 * Simulate a drag end event (successful drop)
 */
export const simulateDragEnd = (activeId: string, overId?: string, activeData?: any, overData?: any) => {
  if (!mockDragEndHandler) {
    throw new Error('No drag end handler found. Make sure DndContext is mocked.')
  }
  
  const event: MockDragEndEvent = {
    active: { id: activeId, data: activeData },
    over: overId ? { id: overId, data: overData } : null
  }
  
  mockDragEndHandler(event)
  return event
}

/**
 * Simulate a complete drag and drop operation
 */
export const simulateCompleteDragDrop = (
  activeId: string, 
  overId: string, 
  activeData?: any, 
  overData?: any
) => {
  const startEvent = simulateDragStart(activeId, activeData)
  const overEvent = simulateDragOver(activeId, overId, activeData, overData)
  const endEvent = simulateDragEnd(activeId, overId, activeData, overData)
  
  return { startEvent, overEvent, endEvent }
}

/**
 * Simulate a drag operation that doesn't result in a drop (drag cancelled)
 */
export const simulateDragCancel = (activeId: string, activeData?: any) => {
  const startEvent = simulateDragStart(activeId, activeData)
  const endEvent = simulateDragEnd(activeId, undefined, activeData)
  
  return { startEvent, endEvent }
}

/**
 * Helper to create mock drag data for different item types
 */
export const createMockDragData = {
  task: (id: string, status = 'todo') => ({
    id,
    type: 'task',
    status,
    title: `Mock Task ${id}`,
    sortableIndex: 0
  }),
  
  project: (id: string) => ({
    id,
    type: 'project', 
    name: `Mock Project ${id}`,
    sortableIndex: 0
  }),
  
  habit: (id: string) => ({
    id,
    type: 'habit',
    name: `Mock Habit ${id}`,
    sortableIndex: 0
  })
}

/**
 * Helper to create mock drop zone data
 */
export const createMockDropZoneData = {
  taskStatus: (status: string) => ({
    type: 'task-status',
    status,
    accepts: ['task']
  }),
  
  projectSection: (sectionId: string) => ({
    type: 'project-section',
    sectionId,
    accepts: ['task', 'project']
  }),
  
  habitCategory: (category: string) => ({
    type: 'habit-category', 
    category,
    accepts: ['habit']
  })
}

/**
 * Mock the @dnd-kit modules for testing
 */
export const mockDndKit = () => {
  const mockDndContext = createMockDndContext()
  
  vi.doMock('@dnd-kit/core', () => ({
    DndContext: mockDndContext,
    useDraggable: vi.fn().mockReturnValue({
      attributes: {},
      listeners: {},
      setNodeRef: vi.fn(),
      transform: null,
      isDragging: false
    }),
    useDroppable: vi.fn().mockReturnValue({
      setNodeRef: vi.fn(),
      isOver: false
    }),
    DragOverlay: ({ children }: { children: React.ReactNode }) => children,
    useSensor: vi.fn(),
    useSensors: vi.fn().mockReturnValue([]),
    MouseSensor: vi.fn(),
    TouchSensor: vi.fn(),
    KeyboardSensor: vi.fn(),
  }))
  
  vi.doMock('@dnd-kit/sortable', () => ({
    SortableContext: ({ children }: { children: React.ReactNode }) => children,
    useSortable: vi.fn().mockReturnValue({
      attributes: {},
      listeners: {},
      setNodeRef: vi.fn(),
      transform: null,
      transition: null,
      isDragging: false
    }),
    verticalListSortingStrategy: 'vertical',
    horizontalListSortingStrategy: 'horizontal',
    rectSortingStrategy: 'rect',
    arrayMove: vi.fn((array, from, to) => {
      const result = [...array]
      const [removed] = result.splice(from, 1)
      result.splice(to, 0, removed)
      return result
    })
  }))
  
  vi.doMock('@dnd-kit/utilities', () => ({
    CSS: {
      Transform: {
        toString: vi.fn().mockReturnValue('')
      }
    }
  }))
  
  return {
    mockDndContext,
    simulateDragStart,
    simulateDragOver,
    simulateDragEnd,
    simulateCompleteDragDrop,
    simulateDragCancel
  }
}

/**
 * Reset all mock handlers (useful in beforeEach)
 */
export const resetDragDropMocks = () => {
  mockDragEndHandler = null
  mockDragStartHandler = null
  mockDragOverHandler = null
}

/**
 * Get the current drag handlers (useful for debugging)
 */
export const getDragHandlers = () => ({
  dragEndHandler: mockDragEndHandler,
  dragStartHandler: mockDragStartHandler,
  dragOverHandler: mockDragOverHandler
})

/**
 * Validate that drag handlers are properly set up
 */
export const validateDragSetup = () => {
  if (!mockDragEndHandler) {
    throw new Error('Drag end handler not found. Component may not be using DndContext correctly.')
  }
  // Note: dragStart and dragOver are optional in many implementations
}

/**
 * Helper for testing drag and drop accessibility
 */
export const simulateKeyboardDrag = (element: HTMLElement, direction: 'up' | 'down' | 'left' | 'right') => {
  const keyMap = {
    up: 'ArrowUp',
    down: 'ArrowDown', 
    left: 'ArrowLeft',
    right: 'ArrowRight'
  }
  
  // Focus the draggable element
  element.focus()
  
  // Simulate keyboard navigation
  fireEvent.keyDown(element, { key: keyMap[direction], code: keyMap[direction] })
  fireEvent.keyUp(element, { key: keyMap[direction], code: keyMap[direction] })
}

/**
 * Helper to test drag and drop with real DOM events (more realistic but slower)
 */
export const simulateRealDragDrop = async (sourceElement: HTMLElement, targetElement: HTMLElement) => {
  // Create and dispatch dragstart event
  const dragStartEvent = new DragEvent('dragstart', {
    bubbles: true,
    cancelable: true,
    dataTransfer: new DataTransfer()
  })
  
  fireEvent(sourceElement, dragStartEvent)
  
  // Create and dispatch dragover event on target
  const dragOverEvent = new DragEvent('dragover', {
    bubbles: true,
    cancelable: true,
    dataTransfer: dragStartEvent.dataTransfer
  })
  
  fireEvent(targetElement, dragOverEvent)
  
  // Create and dispatch drop event
  const dropEvent = new DragEvent('drop', {
    bubbles: true,
    cancelable: true,
    dataTransfer: dragStartEvent.dataTransfer
  })
  
  fireEvent(targetElement, dropEvent)
  
  // Create and dispatch dragend event
  const dragEndEvent = new DragEvent('dragend', {
    bubbles: true,
    cancelable: true,
    dataTransfer: dragStartEvent.dataTransfer
  })
  
  fireEvent(sourceElement, dragEndEvent)
}