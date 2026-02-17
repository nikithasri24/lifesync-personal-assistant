/**
 * Drag and Drop Test Utilities
 *
 * Provides mocking and simulation utilities for @dnd-kit drag-and-drop testing.
 * These utilities allow tests to verify drag-and-drop functionality without
 * requiring actual DOM drag events.
 */

import { vi } from 'vitest';

// Track active drag operations for validation
let activeDragHandlers: Map<string, any> = new Map();
let activeDropHandlers: Map<string, any> = new Map();
let dragStartCallback: ((event: any) => void) | null = null;
let dragEndCallback: ((event: any) => void) | null = null;
let dragOverCallback: ((event: any) => void) | null = null;

/**
 * Mock the @dnd-kit library for testing
 *
 * This must be called BEFORE importing components that use @dnd-kit.
 * Sets up mocks for all @dnd-kit/core hooks and utilities.
 */
export function mockDndKit() {
  // Mock @dnd-kit/core
  vi.mock('@dnd-kit/core', () => ({
    DndContext: ({ children, onDragStart, onDragEnd, onDragOver }: any) => {
      // Store callbacks for simulation
      if (onDragStart) dragStartCallback = onDragStart;
      if (onDragEnd) dragEndCallback = onDragEnd;
      if (onDragOver) dragOverCallback = onDragOver;
      return children;
    },
    useDraggable: ({ id, data }: any) => {
      activeDragHandlers.set(id, { data });
      return {
        attributes: { role: 'button', 'aria-roledescription': 'draggable' },
        listeners: { onMouseDown: vi.fn(), onTouchStart: vi.fn() },
        setNodeRef: vi.fn(),
        isDragging: false,
        transform: null,
      };
    },
    useDroppable: ({ id, data }: any) => {
      activeDropHandlers.set(id, { data });
      return {
        setNodeRef: vi.fn(),
        isOver: false,
      };
    },
    DragOverlay: ({ children }: any) => children,
    useSensor: vi.fn(() => ({})),
    useSensors: vi.fn(() => []),
    PointerSensor: vi.fn(),
    KeyboardSensor: vi.fn(),
    TouchSensor: vi.fn(),
    MouseSensor: vi.fn(),
    closestCenter: vi.fn(),
    closestCorners: vi.fn(),
    rectIntersection: vi.fn(),
    pointerWithin: vi.fn(),
  }));

  // Mock @dnd-kit/sortable
  vi.mock('@dnd-kit/sortable', () => ({
    SortableContext: ({ children }: any) => children,
    useSortable: ({ id, data }: any) => {
      activeDragHandlers.set(id, { data });
      activeDropHandlers.set(id, { data });
      return {
        attributes: { role: 'button', 'aria-roledescription': 'sortable' },
        listeners: { onMouseDown: vi.fn(), onTouchStart: vi.fn() },
        setNodeRef: vi.fn(),
        transform: null,
        transition: null,
        isDragging: false,
      };
    },
    arrayMove: (array: any[], oldIndex: number, newIndex: number) => {
      const newArray = [...array];
      const [removed] = newArray.splice(oldIndex, 1);
      newArray.splice(newIndex, 0, removed);
      return newArray;
    },
    verticalListSortingStrategy: vi.fn(),
    horizontalListSortingStrategy: vi.fn(),
    rectSortingStrategy: vi.fn(),
  }));

  // Mock @dnd-kit/utilities
  vi.mock('@dnd-kit/utilities', () => ({
    CSS: {
      Transform: {
        toString: (transform: any) => {
          if (!transform) return '';
          const { x = 0, y = 0, scaleX = 1, scaleY = 1 } = transform;
          return `translate3d(${x}px, ${y}px, 0) scaleX(${scaleX}) scaleY(${scaleY})`;
        },
      },
      Transition: {
        toString: () => '',
      },
    },
  }));
}

/**
 * Simulate a complete drag-and-drop operation
 *
 * @param dragId - The ID of the draggable element
 * @param dropId - The ID of the droppable target
 *
 * This simulates the full drag lifecycle:
 * 1. onDragStart with the drag element
 * 2. onDragOver with the drop target
 * 3. onDragEnd with both drag and drop elements
 */
export function simulateCompleteDragDrop(dragId: string, dropId: string) {
  const dragData = activeDragHandlers.get(dragId);
  const dropData = activeDropHandlers.get(dropId);

  if (!dragData && !activeDragHandlers.has(`task-${dragId}`)) {
    console.warn(`[drag-drop-utils] Warning: Draggable with id "${dragId}" not found. Available IDs:`, Array.from(activeDragHandlers.keys()));
  }

  if (!dropData && !activeDropHandlers.has(`sidebar-${dropId}`)) {
    console.warn(`[drag-drop-utils] Warning: Droppable with id "${dropId}" not found. Available IDs:`, Array.from(activeDropHandlers.keys()));
  }

  // Use the actual registered IDs (which might have prefixes)
  const actualDragId = activeDragHandlers.has(dragId) ? dragId : `task-${dragId}`;
  const actualDropId = activeDropHandlers.has(dropId) ? dropId : `sidebar-${dropId}`;

  const dragEvent = {
    active: {
      id: actualDragId,
      data: activeDragHandlers.get(actualDragId) || {},
    },
  };

  const overEvent = {
    active: dragEvent.active,
    over: {
      id: actualDropId,
      data: activeDropHandlers.get(actualDropId) || {},
    },
  };

  const endEvent = {
    active: dragEvent.active,
    over: {
      id: actualDropId,
      data: activeDropHandlers.get(actualDropId) || {},
    },
    delta: { x: 0, y: 0 },
    collisions: null,
  };

  // Trigger callbacks in order
  if (dragStartCallback) {
    dragStartCallback(dragEvent);
  }

  if (dragOverCallback) {
    dragOverCallback(overEvent);
  }

  if (dragEndCallback) {
    dragEndCallback(endEvent);
  }
}

/**
 * Validate that drag-and-drop setup is correct
 *
 * Ensures that:
 * 1. At least one draggable element is registered
 * 2. At least one droppable element is registered
 *
 * Throws an error if setup is invalid.
 */
export function validateDragSetup() {
  if (activeDragHandlers.size === 0) {
    throw new Error('[drag-drop-utils] No draggable elements registered. Ensure useDraggable or useSortable is called.');
  }

  if (activeDropHandlers.size === 0) {
    throw new Error('[drag-drop-utils] No droppable elements registered. Ensure useDroppable or useSortable is called.');
  }

  // Success - setup is valid
  return true;
}

/**
 * Reset all drag-and-drop mocks
 *
 * Clears all registered draggable/droppable elements and callbacks.
 * Should be called in beforeEach to ensure test isolation.
 */
export function resetDragDropMocks() {
  activeDragHandlers.clear();
  activeDropHandlers.clear();
  dragStartCallback = null;
  dragEndCallback = null;
  dragOverCallback = null;
}

/**
 * Get all registered draggable IDs (for debugging)
 */
export function getDraggableIds(): string[] {
  return Array.from(activeDragHandlers.keys());
}

/**
 * Get all registered droppable IDs (for debugging)
 */
export function getDroppableIds(): string[] {
  return Array.from(activeDropHandlers.keys());
}
