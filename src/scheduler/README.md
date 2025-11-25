# Task Scheduler - Professional Task Management System

A modern, comprehensive task scheduling system inspired by industry-leading tools like **Asana**, **ClickUp**, and **Monday.com**. This feature provides a professional-grade interface for managing tasks, dependencies, time tracking, and team collaboration.

## 🌟 Features

### Multiple Views
- **📋 Board View (Kanban)**: Drag-and-drop task management with customizable columns and WIP limits
- **📅 Timeline View (Gantt)**: Visual timeline with task dependencies and critical path analysis
- **📊 List View (Spreadsheet)**: Tabular view with inline editing and bulk actions

### Core Capabilities
- ✅ **Task Dependencies**: Create finish-to-start, start-to-start, finish-to-finish, and start-to-finish relationships
- ⏱️ **Time Tracking**: Track estimated vs. actual time with active timers and time entries
- 👥 **Team Collaboration**: Assign tasks, add comments, mention team members, and track activity
- 🎯 **Milestones & Sprints**: Organize tasks into milestones and sprint cycles
- 🤖 **Auto-Scheduling**: Intelligent scheduling based on dependencies, constraints, and workload
- 🔄 **Recurring Tasks**: Support for daily, weekly, monthly, and custom recurrence patterns
- 🔍 **Advanced Filtering**: Filter by status, priority, assignee, project, tags, and dates
- 📈 **Progress Tracking**: Visual progress bars and completion percentages

## 🚀 Getting Started

### Navigation

Access the Task Scheduler from the main navigation menu:
1. Click on "Task Scheduler" in the sidebar (Board icon)
2. Or navigate directly to `/scheduler` route

### Quick Start Guide

#### 1. Board View (Default)
- **Create tasks**: Click the "New Task" button or "Add Task" in any column
- **Move tasks**: Drag tasks between columns to change status
- **Edit tasks**: Click on a task card to open details
- **Start timer**: Click the timer button on tasks in progress

#### 2. Timeline View
- **Zoom controls**: Use Day/Week/Month/Quarter buttons to adjust view
- **Navigate**: Use Today/Previous/Next buttons to move through time
- **View dependencies**: Enable "Show Dependencies" to see task relationships
- **Critical path**: Enable to highlight tasks on the critical path

#### 3. List View
- **Sort**: Click column headers to sort by that field
- **Select multiple**: Check boxes to select tasks for bulk actions
- **Inline edit**: Click on cells to edit task properties
- **Bulk actions**: Select multiple tasks and use the action bar

## 📁 Architecture

### File Structure

```
src/scheduler/
├── types.ts                    # TypeScript type definitions
├── utils/
│   └── scheduling.ts           # Auto-scheduling algorithms
├── components/
│   ├── BoardView.tsx          # Kanban board component
│   ├── TimelineView.tsx       # Gantt chart component
│   ├── ListView.tsx           # Spreadsheet view component
│   └── TaskCard.tsx           # Task card component
└── README.md                  # This file

src/pages/
└── TaskScheduler.tsx          # Main page component
```

### Data Flow

```
TaskScheduler (Main Page)
    ↓
    ├── Uses React Query hooks (useTasks, useProjects)
    ├── Transforms data to ScheduledTask format
    ├── Applies filters and search
    └── Renders selected view
        ├── BoardView
        ├── TimelineView
        └── ListView
```

## 🔧 Configuration

### Board Configuration

Customize board columns in `TaskScheduler.tsx`:

```typescript
const boardColumns: BoardColumn[] = [
  {
    id: 'todo',
    title: 'To Do',
    status: 'todo',
    color: '#3b82f6',
    limit: 5,  // WIP limit
    order: 1,
  },
  // Add more columns...
];
```

### Timeline Configuration

Adjust timeline settings:

```typescript
const timelineConfig: TimelineConfig = {
  zoom: 'month',              // day | week | month | quarter
  showDependencies: true,     // Show dependency arrows
  showMilestones: true,       // Show milestone markers
  showWeekends: false,        // Hide weekend columns
  showCriticalPath: false,    // Highlight critical path
};
```

### List Configuration

Customize list columns:

```typescript
const listConfig: ListConfig = {
  columns: [
    {
      id: 'title',
      label: 'Task',
      field: 'title',
      sortable: true,
      width: 300
    },
    // Add more columns...
  ],
  sortBy: 'priority',
  sortDirection: 'desc',
  showSubtasks: false,
};
```

## 🎯 Advanced Features

### Auto-Scheduling

The auto-scheduler uses sophisticated algorithms to:
- Respect task dependencies (topological sorting)
- Consider working hours and days
- Avoid conflicts and overlaps
- Optimize based on priority
- Calculate critical path

Usage:
```typescript
import { autoScheduleTasks } from './scheduler/utils/scheduling';

const result = autoScheduleTasks(
  tasks,
  dependencies,
  startDate,
  constraints
);
```

### Task Dependencies

Create dependencies between tasks:

```typescript
const dependency: TaskDependency = {
  id: 'dep-1',
  predecessorId: 'task-1',
  successorId: 'task-2',
  type: 'finish-to-start',  // Task 2 can't start until Task 1 finishes
  lag: 120,                  // 120 minutes delay (optional)
  isStrict: true,            // Enforce dependency (vs. suggestion)
};
```

### Time Tracking

Track time spent on tasks:

```typescript
const timeEntry: TimeEntry = {
  id: 'time-1',
  taskId: 'task-1',
  userId: 'user-1',
  startTime: '2025-01-15T09:00:00Z',
  endTime: '2025-01-15T11:30:00Z',
  duration: 150,             // minutes
  description: 'Implementation work',
  isBillable: true,
};
```

### Milestones & Sprints

Organize work into milestones:

```typescript
const milestone: Milestone = {
  id: 'milestone-1',
  name: 'MVP Release',
  description: 'First product release',
  dueDate: '2025-12-31',
  status: 'active',
  color: '#3b82f6',
  progress: 45,              // Calculated from tasks
};
```

## 🎨 Customization

### Task Card Appearance

Task cards show:
- **Priority indicator**: Color-coded border (urgent=red, high=orange, medium=yellow, low=gray)
- **Status badge**: Background color based on status
- **Progress bar**: Visual progress indicator (0-100%)
- **Assignees**: Avatar stack (max 3 visible)
- **Metadata**: Due date, estimated time, tags
- **Indicators**: Comments, attachments, dependencies, blocked status

### Color Coding

| Element | Color | Meaning |
|---------|-------|---------|
| Red | `#ef4444` | Urgent priority / Overdue |
| Orange | `#f59e0b` | High priority |
| Yellow | `#eab308` | Medium priority |
| Blue | `#3b82f6` | In Progress / Normal |
| Purple | `#8b5cf6` | Scheduled |
| Green | `#10b981` | Done / Completed |
| Gray | `#64748b` | Low priority / Backlog |

## 🔒 Data Integration

### Current Implementation

The scheduler currently uses:
- `useTasks()` hook for fetching tasks from Supabase
- `useProjects()` hook for fetching projects
- Task mutations for create/update/delete operations

### Data Transformation

Tasks are transformed from the base `Task` type to `ScheduledTask`:

```typescript
const scheduledTasks: ScheduledTask[] = apiTasks.map(task => ({
  ...task,
  progress: calculateProgress(task),
  assignees: fetchAssignees(task),
  dependencies: fetchDependencies(task),
  timeEntries: fetchTimeEntries(task),
  comments: fetchComments(task),
}));
```

## 📊 Analytics & Insights

Track key metrics:
- **Total tasks** by status
- **Completion rate** over time
- **Time estimates** vs. actuals
- **Milestone progress**
- **Team workload** distribution
- **Critical path** duration

## 🛠️ Development

### Adding New Views

1. Create component in `src/scheduler/components/`
2. Add view type to `ViewMode` in `types.ts`
3. Import and render in `TaskScheduler.tsx`
4. Add view switcher button in toolbar

### Extending Task Types

Add new fields to `ScheduledTask` interface:

```typescript
export interface ScheduledTask extends Task {
  // Your custom fields
  customField?: string;
  complexData?: CustomType;
}
```

### Custom Filters

Implement custom filtering logic:

```typescript
const customFilter = (tasks: ScheduledTask[]) => {
  return tasks.filter(task => {
    // Your filter logic
    return condition;
  });
};
```

## 🐛 Troubleshooting

### Tasks Not Appearing
- Check if tasks have required fields (id, title, status)
- Verify filters are not excluding tasks
- Ensure tasks aren't marked as deleted/archived

### Drag & Drop Not Working
- Ensure tasks have unique IDs
- Check browser console for errors
- Verify `onTaskDrop` handler is implemented

### Timeline Not Showing Tasks
- Tasks need both `scheduledStart` and `scheduledEnd` dates
- Check if tasks are within the visible date range
- Verify zoom level is appropriate

## 🚀 Future Enhancements

Planned features:
- [ ] Real-time collaboration with WebSockets
- [ ] Advanced dependency visualization
- [ ] Resource allocation and capacity planning
- [ ] Custom field definitions
- [ ] Template tasks and projects
- [ ] Export to Excel/CSV/PDF
- [ ] Mobile-responsive views
- [ ] Keyboard shortcuts
- [ ] Undo/redo functionality
- [ ] Task history and audit log

## 📝 Best Practices

1. **Keep WIP limits reasonable**: Don't overload in-progress column
2. **Use dependencies wisely**: Too many dependencies create complexity
3. **Regular time tracking**: Update time entries daily for accuracy
4. **Clear task titles**: Use descriptive, action-oriented titles
5. **Set realistic estimates**: Base on historical data when possible
6. **Review milestones**: Check progress weekly
7. **Clean up completed**: Archive old tasks to maintain performance

## 🤝 Contributing

To contribute improvements:
1. Create new components following existing patterns
2. Add TypeScript types for all new features
3. Document changes in this README
4. Test across all three views
5. Ensure responsive design works

## 📄 License

Part of the LifeSync Personal Assistant project.

---

**Built with modern tools**: React, TypeScript, TailwindCSS, Lucide Icons, date-fns

**Inspired by**: Asana, ClickUp, Monday.com, Linear, Jira
