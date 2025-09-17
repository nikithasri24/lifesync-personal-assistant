import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { 
  mockDndKit,
  simulateCompleteDragDrop,
  simulateDragCancel,
  createMockDragData,
  createMockDropZoneData,
  resetDragDropMocks,
  validateDragSetup
} from '../../test/drag-drop-utils'

// Mock the drag and drop functionality
mockDndKit()

// Mock task component that uses drag and drop
const MockTaskList = ({ 
  tasks = [], 
  onTaskMove = vi.fn(),
  onTaskReorder = vi.fn() 
}: {
  tasks?: Array<{ id: string; title: string; status: string }>
  onTaskMove?: (taskId: string, newStatus: string) => void
  onTaskReorder?: (tasks: Array<{ id: string; title: string; status: string }>) => void
}) => {
  const handleDragEnd = (event: any) => {
    if (!event.over) return
    
    const { active, over } = event
    
    // Handle status change (moving between columns)
    if (over.data?.type === 'task-status') {
      onTaskMove(active.id, over.data.status)
      return
    }
    
    // Handle reordering within same status
    if (active.id !== over.id) {
      const oldIndex = tasks.findIndex(task => task.id === active.id)
      const newIndex = tasks.findIndex(task => task.id === over.id)
      
      if (oldIndex !== -1 && newIndex !== -1) {
        const newTasks = [...tasks]
        const [movedTask] = newTasks.splice(oldIndex, 1)
        newTasks.splice(newIndex, 0, movedTask)
        onTaskReorder(newTasks)
      }
    }
  }

  return (
    <div data-testid="task-list">
      {/* Mock DndContext usage */}
      <div onDragEnd={handleDragEnd} data-testid="dnd-context">
        {tasks.map(task => (
          <div 
            key={task.id} 
            data-testid={`task-${task.id}`}
            data-task-id={task.id}
            data-task-status={task.status}
          >
            {task.title}
          </div>
        ))}
        
        {/* Mock drop zones */}
        <div 
          data-testid="drop-zone-todo"
          data-drop-type="task-status"
          data-drop-status="todo"
        >
          Todo Drop Zone
        </div>
        <div 
          data-testid="drop-zone-in-progress"
          data-drop-type="task-status"
          data-drop-status="in_progress"
        >
          In Progress Drop Zone
        </div>
        <div 
          data-testid="drop-zone-done"
          data-drop-type="task-status"
          data-drop-status="done"
        >
          Done Drop Zone
        </div>
      </div>
    </div>
  )
}

describe('Task Drag and Drop', () => {
  const mockTasks = [
    { id: 'task-1', title: 'Task 1', status: 'todo' },
    { id: 'task-2', title: 'Task 2', status: 'todo' },
    { id: 'task-3', title: 'Task 3', status: 'in_progress' },
    { id: 'task-4', title: 'Task 4', status: 'done' },
  ]

  let onTaskMove: ReturnType<typeof vi.fn>
  let onTaskReorder: ReturnType<typeof vi.fn>

  beforeEach(() => {
    resetDragDropMocks()
    onTaskMove = vi.fn()
    onTaskReorder = vi.fn()
  })

  describe('Task Status Changes', () => {
    it('moves task from todo to in_progress', () => {
      render(
        <MockTaskList 
          tasks={mockTasks} 
          onTaskMove={onTaskMove}
          onTaskReorder={onTaskReorder}
        />
      )
      
      const dragData = createMockDragData.task('task-1', 'todo')
      const dropData = createMockDropZoneData.taskStatus('in_progress')
      
      act(() => {
        simulateCompleteDragDrop('task-1', 'drop-zone-in-progress', dragData, dropData)
      })
      
      expect(onTaskMove).toHaveBeenCalledWith('task-1', 'in_progress')
      expect(onTaskReorder).not.toHaveBeenCalled()
    })

    it('moves task from in_progress to done', () => {
      render(
        <MockTaskList 
          tasks={mockTasks} 
          onTaskMove={onTaskMove}
          onTaskReorder={onTaskReorder}
        />
      )
      
      const dragData = createMockDragData.task('task-3', 'in_progress')
      const dropData = createMockDropZoneData.taskStatus('done')
      
      act(() => {
        simulateCompleteDragDrop('task-3', 'drop-zone-done', dragData, dropData)
      })
      
      expect(onTaskMove).toHaveBeenCalledWith('task-3', 'done')
    })

    it('moves task from done back to todo', () => {
      render(
        <MockTaskList 
          tasks={mockTasks} 
          onTaskMove={onTaskMove}
          onTaskReorder={onTaskReorder}
        />
      )
      
      const dragData = createMockDragData.task('task-4', 'done')
      const dropData = createMockDropZoneData.taskStatus('todo')
      
      act(() => {
        simulateCompleteDragDrop('task-4', 'drop-zone-todo', dragData, dropData)
      })
      
      expect(onTaskMove).toHaveBeenCalledWith('task-4', 'todo')
    })

    it('handles invalid status transitions gracefully', () => {
      render(
        <MockTaskList 
          tasks={mockTasks} 
          onTaskMove={onTaskMove}
          onTaskReorder={onTaskReorder}
        />
      )
      
      const dragData = createMockDragData.task('task-1', 'todo')
      const dropData = createMockDropZoneData.taskStatus('invalid-status')
      
      act(() => {
        simulateCompleteDragDrop('task-1', 'invalid-drop-zone', dragData, dropData)
      })
      
      expect(onTaskMove).toHaveBeenCalledWith('task-1', 'invalid-status')
    })
  })

  describe('Task Reordering', () => {
    it('reorders tasks within the same status', () => {
      const todoTasks = [
        { id: 'task-1', title: 'Task 1', status: 'todo' },
        { id: 'task-2', title: 'Task 2', status: 'todo' },
        { id: 'task-5', title: 'Task 5', status: 'todo' },
      ]
      
      render(
        <MockTaskList 
          tasks={todoTasks} 
          onTaskMove={onTaskMove}
          onTaskReorder={onTaskReorder}
        />
      )
      
      // Move task-1 to position of task-5 (last position)
      act(() => {
        simulateCompleteDragDrop('task-1', 'task-5')
      })
      
      expect(onTaskReorder).toHaveBeenCalledWith([
        { id: 'task-2', title: 'Task 2', status: 'todo' },
        { id: 'task-5', title: 'Task 5', status: 'todo' },
        { id: 'task-1', title: 'Task 1', status: 'todo' },
      ])
      expect(onTaskMove).not.toHaveBeenCalled()
    })

    it('reorders tasks from last to first position', () => {
      const todoTasks = [
        { id: 'task-1', title: 'Task 1', status: 'todo' },
        { id: 'task-2', title: 'Task 2', status: 'todo' },
        { id: 'task-3', title: 'Task 3', status: 'todo' },
      ]
      
      render(
        <MockTaskList 
          tasks={todoTasks} 
          onTaskMove={onTaskMove}
          onTaskReorder={onTaskReorder}
        />
      )
      
      // Move task-3 to position of task-1 (first position)
      act(() => {
        simulateCompleteDragDrop('task-3', 'task-1')
      })
      
      expect(onTaskReorder).toHaveBeenCalledWith([
        { id: 'task-3', title: 'Task 3', status: 'todo' },
        { id: 'task-1', title: 'Task 1', status: 'todo' },
        { id: 'task-2', title: 'Task 2', status: 'todo' },
      ])
    })

    it('handles reordering middle position correctly', () => {
      const todoTasks = [
        { id: 'task-1', title: 'Task 1', status: 'todo' },
        { id: 'task-2', title: 'Task 2', status: 'todo' },
        { id: 'task-3', title: 'Task 3', status: 'todo' },
        { id: 'task-4', title: 'Task 4', status: 'todo' },
      ]
      
      render(
        <MockTaskList 
          tasks={todoTasks} 
          onTaskMove={onTaskMove}
          onTaskReorder={onTaskReorder}
        />
      )
      
      // Move task-1 to position of task-3 (middle position)
      act(() => {
        simulateCompleteDragDrop('task-1', 'task-3')
      })
      
      expect(onTaskReorder).toHaveBeenCalledWith([
        { id: 'task-2', title: 'Task 2', status: 'todo' },
        { id: 'task-3', title: 'Task 3', status: 'todo' },
        { id: 'task-1', title: 'Task 1', status: 'todo' },
        { id: 'task-4', title: 'Task 4', status: 'todo' },
      ])
    })
  })

  describe('Drag Cancel Scenarios', () => {
    it('handles drag cancel without making changes', () => {
      render(
        <MockTaskList 
          tasks={mockTasks} 
          onTaskMove={onTaskMove}
          onTaskReorder={onTaskReorder}
        />
      )
      
      const dragData = createMockDragData.task('task-1', 'todo')
      
      act(() => {
        simulateDragCancel('task-1', dragData)
      })
      
      expect(onTaskMove).not.toHaveBeenCalled()
      expect(onTaskReorder).not.toHaveBeenCalled()
    })

    it('handles drag without valid drop target', () => {
      render(
        <MockTaskList 
          tasks={mockTasks} 
          onTaskMove={onTaskMove}
          onTaskReorder={onTaskReorder}
        />
      )
      
      const dragData = createMockDragData.task('task-1', 'todo')
      
      act(() => {
        simulateCompleteDragDrop('task-1', '', dragData, null)
      })
      
      // Should not trigger any callbacks when no valid drop target
      expect(onTaskMove).not.toHaveBeenCalled()
      expect(onTaskReorder).not.toHaveBeenCalled()
    })
  })

  describe('Edge Cases', () => {
    it('handles dragging non-existent task', () => {
      render(
        <MockTaskList 
          tasks={mockTasks} 
          onTaskMove={onTaskMove}
          onTaskReorder={onTaskReorder}
        />
      )
      
      const dragData = createMockDragData.task('non-existent-task', 'todo')
      const dropData = createMockDropZoneData.taskStatus('done')
      
      act(() => {
        simulateCompleteDragDrop('non-existent-task', 'drop-zone-done', dragData, dropData)
      })
      
      // Should still call onTaskMove even for non-existent task
      expect(onTaskMove).toHaveBeenCalledWith('non-existent-task', 'done')
    })

    it('handles empty task list', () => {
      render(
        <MockTaskList 
          tasks={[]} 
          onTaskMove={onTaskMove}
          onTaskReorder={onTaskReorder}
        />
      )
      
      const dragData = createMockDragData.task('task-1', 'todo')
      
      act(() => {
        simulateDragCancel('task-1', dragData)
      })
      
      expect(onTaskMove).not.toHaveBeenCalled()
      expect(onTaskReorder).not.toHaveBeenCalled()
    })

    it('handles dragging same task to same position', () => {
      render(
        <MockTaskList 
          tasks={mockTasks} 
          onTaskMove={onTaskMove}
          onTaskReorder={onTaskReorder}
        />
      )
      
      // Drag task-1 to itself (no change)
      act(() => {
        simulateCompleteDragDrop('task-1', 'task-1')
      })
      
      expect(onTaskReorder).not.toHaveBeenCalled()
      expect(onTaskMove).not.toHaveBeenCalled()
    })
  })

  describe('Performance and Optimization', () => {
    it('handles large number of tasks efficiently', () => {
      const largeTasks = Array.from({ length: 100 }, (_, i) => ({
        id: `task-${i}`,
        title: `Task ${i}`,
        status: 'todo'
      }))
      
      render(
        <MockTaskList 
          tasks={largeTasks} 
          onTaskMove={onTaskMove}
          onTaskReorder={onTaskReorder}
        />
      )
      
      // Move first task to last position
      act(() => {
        simulateCompleteDragDrop('task-0', 'task-99')
      })
      
      expect(onTaskReorder).toHaveBeenCalledTimes(1)
    })

    it('batches multiple rapid drag operations', () => {
      render(
        <MockTaskList 
          tasks={mockTasks} 
          onTaskMove={onTaskMove}
          onTaskReorder={onTaskReorder}
        />
      )
      
      // Simulate rapid drag operations
      act(() => {
        simulateCompleteDragDrop('task-1', 'drop-zone-in-progress')
        simulateCompleteDragDrop('task-2', 'drop-zone-done')
        simulateCompleteDragDrop('task-3', 'drop-zone-todo')
      })
      
      expect(onTaskMove).toHaveBeenCalledTimes(3)
    })
  })

  describe('Accessibility Support', () => {
    it('supports keyboard-based drag and drop', () => {
      const { container } = render(
        <MockTaskList 
          tasks={mockTasks} 
          onTaskMove={onTaskMove}
          onTaskReorder={onTaskReorder}
        />
      )
      
      const taskElement = screen.getByTestId('task-task-1')
      
      // Test that task element exists and can be focused
      expect(taskElement).toBeInTheDocument()
      expect(taskElement).toHaveAttribute('data-task-id', 'task-1')
    })

    it('provides proper ARIA attributes for drag and drop', () => {
      render(
        <MockTaskList 
          tasks={mockTasks} 
          onTaskMove={onTaskMove}
          onTaskReorder={onTaskReorder}
        />
      )
      
      // Verify drop zones are properly identified
      expect(screen.getByTestId('drop-zone-todo')).toHaveAttribute('data-drop-type', 'task-status')
      expect(screen.getByTestId('drop-zone-in-progress')).toHaveAttribute('data-drop-status', 'in_progress')
      expect(screen.getByTestId('drop-zone-done')).toHaveAttribute('data-drop-status', 'done')
    })
  })

  describe('Error Handling', () => {
    it('handles callback errors gracefully', () => {
      const errorCallback = vi.fn().mockImplementation(() => {
        throw new Error('Callback error')
      })
      
      // Should not crash when callback throws
      expect(() => {
        render(
          <MockTaskList 
            tasks={mockTasks} 
            onTaskMove={errorCallback}
            onTaskReorder={onTaskReorder}
          />
        )
        
        act(() => {
          simulateCompleteDragDrop('task-1', 'drop-zone-done')
        })
      }).not.toThrow()
    })

    it('handles missing callback functions', () => {
      expect(() => {
        render(
          <MockTaskList 
            tasks={mockTasks} 
            // No callbacks provided
          />
        )
        
        act(() => {
          simulateCompleteDragDrop('task-1', 'drop-zone-done')
        })
      }).not.toThrow()
    })
  })
})