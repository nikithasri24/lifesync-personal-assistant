/**
 * Smoke tests for todos components
 */
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { TaskItem } from '../TaskItem';
import { KanbanView } from '../KanbanView';
import { MatrixView } from '../MatrixView';
import type { Task, Project } from '../../types';

// Mock data
const mockTask: Task = {
  id: '1',
  title: 'Test Task',
  description: 'Test description',
  status: 'todo',
  priority: 'medium',
  estimatedTime: 25,
  actualTime: 0,
  tags: ['test'],
  createdAt: new Date(),
  category: 'work'
};

const mockProject: Project = {
  id: 'p1',
  name: 'Test Project',
  color: '#3b82f6',
  status: 'active'
};

describe('Todos Components', () => {
  it('TaskItem renders without crashing', () => {
    const { container } = render(
      <TaskItem
        task={mockTask}
        project={mockProject}
        subtasks={[]}
        isExpanded={false}
        isEditing={false}
        editText=""
        pomodoroActive={false}
        onToggleStatus={vi.fn()}
        onToggleExpansion={vi.fn()}
        onStartEdit={vi.fn()}
        onSaveEdit={vi.fn()}
        onCancelEdit={vi.fn()}
        onEditTextChange={vi.fn()}
        onAddSubtask={vi.fn()}
        onStartPomodoro={vi.fn()}
        isUpdating={false}
      />
    );
    expect(container).toBeTruthy();
  });

  it('KanbanView renders without crashing', () => {
    const { container } = render(
      <KanbanView
        tasks={[mockTask]}
        projects={[mockProject]}
        selectedProject="all"
        onToggleStatus={vi.fn()}
        isUpdating={false}
      />
    );
    expect(container).toBeTruthy();
  });

  it('MatrixView renders without crashing', () => {
    const { container } = render(
      <MatrixView
        tasks={[mockTask]}
        projects={[mockProject]}
        selectedProject="all"
        onToggleStatus={vi.fn()}
        isUpdating={false}
      />
    );
    expect(container).toBeTruthy();
  });
});
