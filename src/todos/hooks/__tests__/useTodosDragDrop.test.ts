import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTodosDragDrop } from '../useTodosDragDrop';
import type { TaskData } from '@/types';

// Mock the Command class
vi.mock('@/commands/TaskCommands', () => ({
  ChangeTaskStatusCommand: vi.fn().mockImplementation((taskId, title, newStatus, oldStatus) => ({
    taskId,
    title,
    newStatus,
    oldStatus,
    execute: vi.fn(),
    undo: vi.fn(),
    getDescription: vi.fn(() => `Change task status: ${title}`),
  })),
}));

describe('useTodosDragDrop', () => {
  let mockMutation: any;
  let mockExecuteCommand: any;

  beforeEach(() => {
    // Reset mocks before each test
    mockMutation = {
      mutate: vi.fn(),
      isPending: false,
      isError: false,
      isSuccess: false,
    };

    mockExecuteCommand = vi.fn();
  });

  describe('Initial State', () => {
    it('should initialize with no dragged task', () => {
      const { result } = renderHook(() =>
        useTodosDragDrop({
          updateTaskMutation: mockMutation,
        })
      );

      expect(result.current.draggedTask).toBeNull();
    });

    it('should initialize with no dragged task IDs for multi-select', () => {
      const { result } = renderHook(() =>
        useTodosDragDrop({
          updateTaskMutation: mockMutation,
        })
      );

      expect(result.current.draggedTaskIds).toEqual(new Set());
    });
  });

  describe('Single Task Drag', () => {
    const mockTask: TaskData = {
      id: 'task-123',
      title: 'Test Task',
      status: 'todo',
      userId: 'user-1',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    };

    it('should set dragged task on drag start', () => {
      const { result } = renderHook(() =>
        useTodosDragDrop({
          updateTaskMutation: mockMutation,
        })
      );

      const mockEvent = {
        dataTransfer: {
          effectAllowed: '',
          setData: vi.fn(),
        },
      } as unknown as React.DragEvent;

      act(() => {
        result.current.handleDragStart(mockTask, mockEvent);
      });

      expect(result.current.draggedTask).toEqual(mockTask);
      expect(mockEvent.dataTransfer.effectAllowed).toBe('move');
      expect(mockEvent.dataTransfer.setData).toHaveBeenCalledWith('text/plain', 'task-123');
    });

    it('should clear dragged task on drag end', () => {
      const { result } = renderHook(() =>
        useTodosDragDrop({
          updateTaskMutation: mockMutation,
        })
      );

      const mockEvent = {
        dataTransfer: {
          effectAllowed: '',
          setData: vi.fn(),
        },
      } as unknown as React.DragEvent;

      // Start drag
      act(() => {
        result.current.handleDragStart(mockTask, mockEvent);
      });

      expect(result.current.draggedTask).toEqual(mockTask);

      // End drag
      act(() => {
        result.current.handleDragEnd();
      });

      expect(result.current.draggedTask).toBeNull();
    });

    it('should handle drag over event', () => {
      const { result } = renderHook(() =>
        useTodosDragDrop({
          updateTaskMutation: mockMutation,
        })
      );

      const mockEvent = {
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
        dataTransfer: {
          dropEffect: '',
        },
      } as unknown as React.DragEvent;

      act(() => {
        result.current.handleDragOver(mockEvent);
      });

      expect(mockEvent.preventDefault).toHaveBeenCalled();
      expect(mockEvent.stopPropagation).toHaveBeenCalled();
      expect(mockEvent.dataTransfer.dropEffect).toBe('move');
    });

    it('should update task status on drop with Command pattern', () => {
      const { result } = renderHook(() =>
        useTodosDragDrop({
          updateTaskMutation: mockMutation,
          executeCommand: mockExecuteCommand,
        })
      );

      // Start drag
      const dragEvent = {
        dataTransfer: {
          effectAllowed: '',
          setData: vi.fn(),
        },
      } as unknown as React.DragEvent;

      act(() => {
        result.current.handleDragStart(mockTask, dragEvent);
      });

      // Drop on "in_progress" section
      const dropEvent = {
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
      } as unknown as React.DragEvent;

      act(() => {
        result.current.handleDropOnSection('in_progress', dropEvent);
      });

      expect(dropEvent.preventDefault).toHaveBeenCalled();
      expect(dropEvent.stopPropagation).toHaveBeenCalled();
      expect(mockExecuteCommand).toHaveBeenCalled();
      expect(result.current.draggedTask).toBeNull(); // Cleared after drop
    });

    it('should update task status on drop without Command pattern (fallback)', () => {
      const { result } = renderHook(() =>
        useTodosDragDrop({
          updateTaskMutation: mockMutation,
          // No executeCommand provided
        })
      );

      // Start drag
      const dragEvent = {
        dataTransfer: {
          effectAllowed: '',
          setData: vi.fn(),
        },
      } as unknown as React.DragEvent;

      act(() => {
        result.current.handleDragStart(mockTask, dragEvent);
      });

      // Drop on "done" section
      const dropEvent = {
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
      } as unknown as React.DragEvent;

      act(() => {
        result.current.handleDropOnSection('done', dropEvent);
      });

      expect(mockMutation.mutate).toHaveBeenCalledWith({
        id: 'task-123',
        updates: { status: 'done' },
      });
      expect(result.current.draggedTask).toBeNull();
    });

    it('should not update task if dropped on same status section', () => {
      const { result } = renderHook(() =>
        useTodosDragDrop({
          updateTaskMutation: mockMutation,
          executeCommand: mockExecuteCommand,
        })
      );

      // Start drag with task in "todo" status
      const dragEvent = {
        dataTransfer: {
          effectAllowed: '',
          setData: vi.fn(),
        },
      } as unknown as React.DragEvent;

      act(() => {
        result.current.handleDragStart(mockTask, dragEvent);
      });

      // Drop on same "todo" section
      const dropEvent = {
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
      } as unknown as React.DragEvent;

      act(() => {
        result.current.handleDropOnSection('todo', dropEvent);
      });

      expect(mockExecuteCommand).not.toHaveBeenCalled();
      expect(mockMutation.mutate).not.toHaveBeenCalled();
      expect(result.current.draggedTask).toBeNull(); // Still cleared
    });

    it('should not update task if no task is being dragged', () => {
      const { result } = renderHook(() =>
        useTodosDragDrop({
          updateTaskMutation: mockMutation,
        })
      );

      // Drop without starting drag
      const dropEvent = {
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
      } as unknown as React.DragEvent;

      act(() => {
        result.current.handleDropOnSection('in_progress', dropEvent);
      });

      expect(mockMutation.mutate).not.toHaveBeenCalled();
    });
  });

  describe('Drag State', () => {
    it('should track draggedTaskIds set', () => {
      const { result } = renderHook(() =>
        useTodosDragDrop({
          updateTaskMutation: mockMutation,
        })
      );

      expect(result.current.draggedTaskIds).toBeInstanceOf(Set);
      expect(result.current.draggedTaskIds.size).toBe(0);
    });

    it('should clear draggedTaskIds on drag end', () => {
      const mockTask: TaskData = {
        id: 'task-123',
        title: 'Test Task',
        status: 'todo',
        userId: 'user-1',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };

      const { result } = renderHook(() =>
        useTodosDragDrop({
          updateTaskMutation: mockMutation,
        })
      );

      const mockEvent = {
        dataTransfer: {
          effectAllowed: '',
          setData: vi.fn(),
        },
      } as unknown as React.DragEvent;

      // Start drag
      act(() => {
        result.current.handleDragStart(mockTask, mockEvent);
      });

      expect(result.current.draggedTask).toEqual(mockTask);

      // End drag should clear both draggedTask and draggedTaskIds
      act(() => {
        result.current.handleDragEnd();
      });

      expect(result.current.draggedTask).toBeNull();
      expect(result.current.draggedTaskIds.size).toBe(0);
    });
  });

  describe('Status Mapping', () => {
    it('should map section keys to correct database status values', () => {
      const mockTask: TaskData = {
        id: 'task-map',
        title: 'Map Test',
        status: 'todo',
        userId: 'user-1',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };

      const { result } = renderHook(() =>
        useTodosDragDrop({
          updateTaskMutation: mockMutation,
        })
      );

      // Start drag
      const dragEvent = {
        dataTransfer: {
          effectAllowed: '',
          setData: vi.fn(),
        },
      } as unknown as React.DragEvent;

      act(() => {
        result.current.handleDragStart(mockTask, dragEvent);
      });

      // Test each section mapping
      const testCases = [
        { section: 'todo', expectedStatus: 'todo' },
        { section: 'in_progress', expectedStatus: 'in_progress' },
        { section: 'waiting', expectedStatus: 'waiting' },
        { section: 'done', expectedStatus: 'done' },
      ];

      testCases.forEach(({ section, expectedStatus }) => {
        const dropEvent = {
          preventDefault: vi.fn(),
          stopPropagation: vi.fn(),
        } as unknown as React.DragEvent;

        // Reset mutation mock
        mockMutation.mutate.mockClear();

        act(() => {
          result.current.handleDropOnSection(section, dropEvent);
        });

        if (expectedStatus === 'todo') {
          // Same status, should not mutate
          expect(mockMutation.mutate).not.toHaveBeenCalled();
        } else {
          expect(mockMutation.mutate).toHaveBeenCalledWith({
            id: 'task-map',
            updates: { status: expectedStatus },
          });
        }

        // Restart drag for next test
        act(() => {
          result.current.handleDragStart(mockTask, dragEvent);
        });
      });
    });
  });
});
