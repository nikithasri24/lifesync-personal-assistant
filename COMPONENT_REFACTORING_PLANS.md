# Component Refactoring Plans: Detailed Implementation Guide

## Overview

This document provides **step-by-step refactoring plans** for all 14 large components identified in the architecture analysis. Each plan includes:

- Current state analysis
- Specific hooks to create
- Step-by-step implementation guide
- Before/after code comparisons
- Testing strategy
- Estimated time and complexity

---

## Table of Contents

### Critical Priority (>600 lines)
1. [Calendar.tsx (1,711 lines)](#1-calendartsx-1711-lines---critical)
2. [MealPlanning.tsx (1,327 lines)](#2-mealplanningtsx-1327-lines---critical)
3. [LifeGoals.tsx (820 lines)](#3-lifecomponentstsx-820-lines---critical)
4. [Dashboard.tsx (634 lines)](#4-dashboardtsx-634-lines---warning)
5. [TaskScheduler.tsx (638 lines)](#5-taskschedulertsx-638-lines---warning)

### High Priority (400-600 lines)
6. [ShoppingSmart.tsx (593 lines)](#6-shoppingsmarttsx-593-lines)
7. [Goals.tsx (517 lines)](#7-goalstsx-517-lines)
8. [DashboardPage.tsx (436 lines)](#8-dashboardpagetsx-436-lines---finance)
9. [SmartExpenseCategorizer.tsx (415 lines)](#9-smartexpensecategorizertsx-415-lines)
10. [HabitStreakCalendar.tsx (422 lines)](#10-habitstreakalendartsx-422-lines)
11. [GridJournalEnhanced.tsx (411 lines)](#11-gridjournalenhancedtsx-411-lines)
12. [Habits.tsx (409 lines)](#12-habitstsx-409-lines)

---

# Critical Priority Components

## 1. Calendar.tsx (1,711 lines) - CRITICAL

### Current State Analysis

**File:** `src/pages/Calendar.tsx`

**Complexity Metrics:**
- Lines: 1,711
- useState: 17 calls
- useEffect: 2 calls
- useMemo: 8 calls
- Business logic: ~400 lines
- UI rendering: ~1,200 lines
- Event handlers: ~100 lines

**Current State (Lines 62-111):**
```typescript
const Calendar: React.FC = () => {
  // Navigation state (4 useState)
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<CalendarView>('week');
  const [miniCalendarDate, setMiniCalendarDate] = useState(new Date());

  // Sidebar state (5 useState)
  const [showUnscheduledPanel, setShowUnscheduledPanel] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(112);
  const [isResizing, setIsResizing] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    scheduled: true,
    inProgress: true,
    todo: true,
    backlog: true,
  });

  // Drag & drop state (2 useState)
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [draggedEvent, setDraggedEvent] = useState<CalendarEvent | null>(null);

  // Task editing state (2 useState)
  const [editingTask, setEditingTask] = useState<ScheduledTask | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  // Event editing state (3 useState)
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [eventModalInitialDate, setEventModalInitialDate] = useState<Date | undefined>(undefined);

  // Quick schedule state (2 useState)
  const [showQuickSchedule, setShowQuickSchedule] = useState(false);
  const [quickScheduleDate, setQuickScheduleDate] = useState<Date | null>(null);

  // ... 1,600 more lines
}
```

### Refactoring Plan

#### Phase 1: Extract Navigation Hook (2 hours)

**Create:** `src/calendar/hooks/useCalendarNavigation.ts`

```typescript
import { useState, useMemo, useCallback } from 'react';
import {
  format,
  startOfWeek,
  addDays,
  addWeeks,
  subWeeks,
  addMonths,
  subMonths,
  isToday,
  isSameDay,
} from 'date-fns';

export type CalendarView = 'week' | 'month' | 'day';

export interface WeekDay {
  date: Date;
  dayName: string;
  dayNumber: string;
  isToday: boolean;
}

export interface UseCalendarNavigationReturn {
  // State
  currentDate: Date;
  view: CalendarView;
  miniCalendarDate: Date;

  // Derived data
  weekDays: WeekDay[];
  currentWeekStart: Date;

  // Actions
  goToToday: () => void;
  goToNext: () => void;
  goToPrevious: () => void;
  setView: (view: CalendarView) => void;
  setCurrentDate: (date: Date) => void;
  setMiniCalendarDate: (date: Date) => void;
  jumpToDate: (date: Date) => void;
}

export function useCalendarNavigation(): UseCalendarNavigationReturn {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<CalendarView>('week');
  const [miniCalendarDate, setMiniCalendarDate] = useState(new Date());

  // Calculate week days
  const weekDays = useMemo(() => {
    const start = startOfWeek(currentDate, { weekStartsOn: 0 });
    return Array.from({ length: 7 }, (_, i) => {
      const date = addDays(start, i);
      return {
        date,
        dayName: format(date, 'EEE'),
        dayNumber: format(date, 'd'),
        isToday: isToday(date),
      };
    });
  }, [currentDate]);

  const currentWeekStart = useMemo(() =>
    startOfWeek(currentDate, { weekStartsOn: 0 }),
    [currentDate]
  );

  const goToToday = useCallback(() => {
    const today = new Date();
    setCurrentDate(today);
    setMiniCalendarDate(today);
  }, []);

  const goToNext = useCallback(() => {
    setCurrentDate(prev => {
      switch (view) {
        case 'week':
          return addWeeks(prev, 1);
        case 'month':
          return addMonths(prev, 1);
        case 'day':
          return addDays(prev, 1);
        default:
          return prev;
      }
    });
  }, [view]);

  const goToPrevious = useCallback(() => {
    setCurrentDate(prev => {
      switch (view) {
        case 'week':
          return subWeeks(prev, 1);
        case 'month':
          return subMonths(prev, 1);
        case 'day':
          return addDays(prev, -1);
        default:
          return prev;
      }
    });
  }, [view]);

  const jumpToDate = useCallback((date: Date) => {
    setCurrentDate(date);
    setMiniCalendarDate(date);
  }, []);

  return {
    currentDate,
    view,
    miniCalendarDate,
    weekDays,
    currentWeekStart,
    goToToday,
    goToNext,
    goToPrevious,
    setView,
    setCurrentDate,
    setMiniCalendarDate,
    jumpToDate,
  };
}
```

#### Phase 2: Extract Sidebar Hook (1.5 hours)

**Create:** `src/calendar/hooks/useCalendarSidebar.ts`

```typescript
import { useState, useCallback, useEffect, useRef } from 'react';

export interface ExpandedSections {
  scheduled: boolean;
  inProgress: boolean;
  todo: boolean;
  backlog: boolean;
}

export interface UseCalendarSidebarReturn {
  // State
  showUnscheduledPanel: boolean;
  sidebarWidth: number;
  isResizing: boolean;
  expandedSections: ExpandedSections;

  // Actions
  toggleUnscheduledPanel: () => void;
  toggleSection: (section: keyof ExpandedSections) => void;
  startResize: () => void;
  stopResize: () => void;
}

export function useCalendarSidebar(
  minWidth = 80,
  maxWidth = 200,
  defaultWidth = 112
): UseCalendarSidebarReturn {
  const [showUnscheduledPanel, setShowUnscheduledPanel] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(defaultWidth);
  const [isResizing, setIsResizing] = useState(false);
  const [expandedSections, setExpandedSections] = useState<ExpandedSections>({
    scheduled: true,
    inProgress: true,
    todo: true,
    backlog: true,
  });

  const resizeRef = useRef<{ startX: number; startWidth: number } | null>(null);

  const toggleUnscheduledPanel = useCallback(() => {
    setShowUnscheduledPanel(prev => !prev);
  }, []);

  const toggleSection = useCallback((section: keyof ExpandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  }, []);

  const startResize = useCallback(() => {
    setIsResizing(true);
    resizeRef.current = {
      startX: 0,
      startWidth: sidebarWidth,
    };
  }, [sidebarWidth]);

  const stopResize = useCallback(() => {
    setIsResizing(false);
    resizeRef.current = null;
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing || !resizeRef.current) return;

    const deltaX = e.clientX - resizeRef.current.startX;
    const newWidth = resizeRef.current.startWidth + deltaX;

    if (newWidth >= minWidth && newWidth <= maxWidth) {
      setSidebarWidth(newWidth);
    }
  }, [isResizing, minWidth, maxWidth]);

  useEffect(() => {
    if (isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', stopResize);

      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', stopResize);
      };
    }
  }, [isResizing, handleMouseMove, stopResize]);

  return {
    showUnscheduledPanel,
    sidebarWidth,
    isResizing,
    expandedSections,
    toggleUnscheduledPanel,
    toggleSection,
    startResize,
    stopResize,
  };
}
```

#### Phase 3: Extract Modal Management Hook (1.5 hours)

**Create:** `src/calendar/hooks/useCalendarModals.ts`

```typescript
import { useState, useCallback } from 'react';
import type { Task, CalendarEvent } from '../types';

export interface UseCalendarModalsReturn {
  // Task modal
  editingTask: Task | null;
  showEditModal: boolean;
  openTaskModal: (task?: Task) => void;
  closeTaskModal: () => void;

  // Event modal
  editingEvent: CalendarEvent | null;
  showEventModal: boolean;
  eventModalInitialDate?: Date;
  openEventModal: (event?: CalendarEvent, initialDate?: Date) => void;
  closeEventModal: () => void;

  // Quick schedule modal
  showQuickSchedule: boolean;
  quickScheduleDate: Date | null;
  openQuickSchedule: (date: Date) => void;
  closeQuickSchedule: () => void;

  // Close all
  closeAllModals: () => void;
}

export function useCalendarModals(): UseCalendarModalsReturn {
  // Task modal state
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  // Event modal state
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [eventModalInitialDate, setEventModalInitialDate] = useState<Date | undefined>(undefined);

  // Quick schedule state
  const [showQuickSchedule, setShowQuickSchedule] = useState(false);
  const [quickScheduleDate, setQuickScheduleDate] = useState<Date | null>(null);

  // Task modal handlers
  const openTaskModal = useCallback((task?: Task) => {
    setEditingTask(task ?? null);
    setShowEditModal(true);
  }, []);

  const closeTaskModal = useCallback(() => {
    setShowEditModal(false);
    setEditingTask(null);
  }, []);

  // Event modal handlers
  const openEventModal = useCallback((event?: CalendarEvent, initialDate?: Date) => {
    setEditingEvent(event ?? null);
    setEventModalInitialDate(initialDate);
    setShowEventModal(true);
  }, []);

  const closeEventModal = useCallback(() => {
    setShowEventModal(false);
    setEditingEvent(null);
    setEventModalInitialDate(undefined);
  }, []);

  // Quick schedule handlers
  const openQuickSchedule = useCallback((date: Date) => {
    setQuickScheduleDate(date);
    setShowQuickSchedule(true);
  }, []);

  const closeQuickSchedule = useCallback(() => {
    setShowQuickSchedule(false);
    setQuickScheduleDate(null);
  }, []);

  // Close all modals
  const closeAllModals = useCallback(() => {
    closeTaskModal();
    closeEventModal();
    closeQuickSchedule();
  }, [closeTaskModal, closeEventModal, closeQuickSchedule]);

  return {
    editingTask,
    showEditModal,
    openTaskModal,
    closeTaskModal,
    editingEvent,
    showEventModal,
    eventModalInitialDate,
    openEventModal,
    closeEventModal,
    showQuickSchedule,
    quickScheduleDate,
    openQuickSchedule,
    closeQuickSchedule,
    closeAllModals,
  };
}
```

#### Phase 4: Extract Task Management Hook (2 hours)

**Create:** `src/calendar/hooks/useCalendarTasks.ts`

```typescript
import { useMemo } from 'react';
import { isToday, isSameDay, parseISO } from 'date-fns';
import type { Task, Project } from '../types';

export interface CategorizedTasks {
  scheduled: Task[];
  inProgress: Task[];
  todo: Task[];
  backlog: Task[];
}

export interface UseCalendarTasksReturn {
  categorizedTasks: CategorizedTasks;
  getTasksForDay: (date: Date) => Task[];
  getTasksForHour: (date: Date, hour: number) => Task[];
}

export function useCalendarTasks(
  tasks: Task[],
  projects: Project[]
): UseCalendarTasksReturn {
  // Categorize tasks
  const categorizedTasks = useMemo<CategorizedTasks>(() => {
    const scheduled: Task[] = [];
    const inProgress: Task[] = [];
    const todo: Task[] = [];
    const backlog: Task[] = [];

    tasks
      .filter(task => !task.deleted)
      .forEach(task => {
        if (task.scheduledAt) {
          scheduled.push(task);
        } else if (task.status === 'in_progress') {
          inProgress.push(task);
        } else if (task.dueDate) {
          todo.push(task);
        } else {
          backlog.push(task);
        }
      });

    return { scheduled, inProgress, todo, backlog };
  }, [tasks]);

  // Get tasks for specific day
  const getTasksForDay = useMemo(() => (date: Date) => {
    return tasks.filter(task => {
      if (task.deleted) return false;

      if (task.scheduledAt) {
        return isSameDay(parseISO(task.scheduledAt), date);
      }

      if (task.dueDate) {
        return isSameDay(parseISO(task.dueDate), date);
      }

      return false;
    });
  }, [tasks]);

  // Get tasks for specific hour
  const getTasksForHour = useMemo(() => (date: Date, hour: number) => {
    return tasks.filter(task => {
      if (!task.scheduledAt || task.deleted) return false;

      const taskDate = parseISO(task.scheduledAt);
      return isSameDay(taskDate, date) && taskDate.getHours() === hour;
    });
  }, [tasks]);

  return {
    categorizedTasks,
    getTasksForDay,
    getTasksForHour,
  };
}
```

#### Phase 5: Extract Utility Functions (1 hour)

**Create:** `src/calendar/utils/taskSpanHelpers.ts`

```typescript
import { differenceInDays, parseISO, isSameDay, addDays } from 'date-fns';
import type { Task } from '../types';

export function isMultiDayTask(task: Task): boolean {
  if (!task.scheduledAt || !task.duration) return false;
  return task.duration > 1440; // More than 24 hours
}

export function getTaskSpanDays(task: Task): number {
  if (!task.scheduledAt || !task.duration) return 1;
  return Math.ceil(task.duration / 1440);
}

export function taskAppearsOnDate(task: Task, date: Date): boolean {
  if (!task.scheduledAt) return false;

  const taskStart = parseISO(task.scheduledAt);

  if (!isMultiDayTask(task)) {
    return isSameDay(taskStart, date);
  }

  const spanDays = getTaskSpanDays(task);
  const taskEnd = addDays(taskStart, spanDays - 1);

  return date >= taskStart && date <= taskEnd;
}

export interface TaskSpanPosition {
  isFirst: boolean;
  isLast: boolean;
  dayIndex: number;
  totalDays: number;
}

export function getTaskSpanPosition(task: Task, date: Date): TaskSpanPosition {
  if (!task.scheduledAt) {
    return { isFirst: true, isLast: true, dayIndex: 0, totalDays: 1 };
  }

  const taskStart = parseISO(task.scheduledAt);
  const totalDays = getTaskSpanDays(task);
  const dayIndex = differenceInDays(date, taskStart);

  return {
    isFirst: dayIndex === 0,
    isLast: dayIndex === totalDays - 1,
    dayIndex,
    totalDays,
  };
}
```

#### Phase 6: Break into Sub-Components (3 hours)

**Create:** `src/calendar/components/CalendarHeader.tsx`

```typescript
import React from 'react';
import { format } from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import type { CalendarView } from '../hooks/useCalendarNavigation';

interface CalendarHeaderProps {
  currentDate: Date;
  view: CalendarView;
  onPrevious: () => void;
  onNext: () => void;
  onToday: () => void;
  onViewChange: (view: CalendarView) => void;
}

export const CalendarHeader: React.FC<CalendarHeaderProps> = ({
  currentDate,
  view,
  onPrevious,
  onNext,
  onToday,
  onViewChange,
}) => {
  return (
    <header className="flex items-center justify-between p-4 bg-white border-b">
      <div className="flex items-center gap-4">
        <h1 className="text-2xl font-bold text-slate-900">
          {format(currentDate, view === 'month' ? 'MMMM yyyy' : 'MMM d, yyyy')}
        </h1>
        <button
          onClick={onToday}
          className="px-3 py-1 text-sm bg-indigo-50 text-indigo-600 rounded hover:bg-indigo-100"
        >
          Today
        </button>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1 border rounded">
          <button
            onClick={onPrevious}
            className="p-2 hover:bg-slate-100"
            aria-label="Previous"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={onNext}
            className="p-2 hover:bg-slate-100"
            aria-label="Next"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <div className="flex items-center gap-1 border rounded">
          {(['day', 'week', 'month'] as CalendarView[]).map((v) => (
            <button
              key={v}
              onClick={() => onViewChange(v)}
              className={`px-3 py-1 text-sm capitalize ${
                view === v ? 'bg-indigo-100 text-indigo-600' : 'hover:bg-slate-100'
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
};
```

**Create:** `src/calendar/components/CalendarGrid.tsx`

```typescript
import React from 'react';
import type { Task, CalendarEvent, WeekDay } from '../types';
import { HourColumn } from './HourColumn';
import { TaskCard } from './TaskCard';

interface CalendarGridProps {
  weekDays: WeekDay[];
  tasks: Task[];
  events: CalendarEvent[];
  onTaskClick: (task: Task) => void;
  onEventClick: (event: CalendarEvent) => void;
  onCellClick: (date: Date, hour: number) => void;
  onTaskDrop: (taskId: string, date: Date, hour: number) => void;
}

export const CalendarGrid: React.FC<CalendarGridProps> = ({
  weekDays,
  tasks,
  events,
  onTaskClick,
  onEventClick,
  onCellClick,
  onTaskDrop,
}) => {
  const hours = Array.from({ length: 24 }, (_, i) => i);

  return (
    <div className="flex-1 overflow-auto">
      <div className="grid" style={{ gridTemplateColumns: `80px repeat(7, 1fr)` }}>
        {/* Time column */}
        <div className="sticky left-0 bg-white z-10">
          {hours.map(hour => (
            <div key={hour} className="h-16 border-b px-2 py-1 text-xs text-slate-500">
              {hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}
            </div>
          ))}
        </div>

        {/* Day columns */}
        {weekDays.map(day => (
          <HourColumn
            key={day.date.toISOString()}
            date={day.date}
            hours={hours}
            tasks={tasks.filter(t => /* filter by day */)}
            events={events.filter(e => /* filter by day */)}
            onTaskClick={onTaskClick}
            onEventClick={onEventClick}
            onCellClick={onCellClick}
            onTaskDrop={onTaskDrop}
          />
        ))}
      </div>
    </div>
  );
};
```

**Create:** `src/calendar/components/CalendarSidebar.tsx`

```typescript
import React from 'react';
import { ChevronDown, ChevronUp, Inbox } from 'lucide-react';
import type { Task } from '../types';
import type { CategorizedTasks, ExpandedSections } from '../hooks';

interface CalendarSidebarProps {
  categorizedTasks: CategorizedTasks;
  expandedSections: ExpandedSections;
  sidebarWidth: number;
  onToggleSection: (section: keyof ExpandedSections) => void;
  onTaskDragStart: (task: Task) => void;
  onTaskClick: (task: Task) => void;
}

export const CalendarSidebar: React.FC<CalendarSidebarProps> = ({
  categorizedTasks,
  expandedSections,
  sidebarWidth,
  onToggleSection,
  onTaskDragStart,
  onTaskClick,
}) => {
  const renderSection = (
    key: keyof CategorizedTasks,
    title: string,
    tasks: Task[]
  ) => (
    <div className="border-b">
      <button
        onClick={() => onToggleSection(key)}
        className="w-full flex items-center justify-between p-2 hover:bg-slate-50"
      >
        <span className="text-sm font-medium">{title} ({tasks.length})</span>
        {expandedSections[key] ? (
          <ChevronUp className="h-4 w-4" />
        ) : (
          <ChevronDown className="h-4 w-4" />
        )}
      </button>

      {expandedSections[key] && (
        <div className="p-2 space-y-1">
          {tasks.map(task => (
            <div
              key={task.id}
              draggable
              onDragStart={() => onTaskDragStart(task)}
              onClick={() => onTaskClick(task)}
              className="p-2 text-sm bg-white border rounded cursor-move hover:shadow"
            >
              {task.title}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <aside
      className="border-r bg-slate-50 overflow-y-auto"
      style={{ width: `${sidebarWidth}px` }}
    >
      {renderSection('scheduled', 'Scheduled', categorizedTasks.scheduled)}
      {renderSection('inProgress', 'In Progress', categorizedTasks.inProgress)}
      {renderSection('todo', 'To Do', categorizedTasks.todo)}
      {renderSection('backlog', 'Backlog', categorizedTasks.backlog)}
    </aside>
  );
};
```

#### Phase 7: Update Calendar.tsx (2 hours)

**After:** `src/pages/Calendar.tsx` (Refactored to ~250 lines)

```typescript
import React from 'react';
import { useTasks, useProjects } from '../hooks/useTasksQuery';
import { useHabits, useHabitEntries } from '../hooks/useHabitsQuery';
import { useCalendarEvents } from '../hooks/useCalendarQuery';
import { useCalendarNavigation } from '../calendar/hooks/useCalendarNavigation';
import { useCalendarSidebar } from '../calendar/hooks/useCalendarSidebar';
import { useCalendarModals } from '../calendar/hooks/useCalendarModals';
import { useCalendarTasks } from '../calendar/hooks/useCalendarTasks';
import { useCalendarDragDrop } from '../calendar/hooks/useCalendarDragDrop';
import { CalendarHeader } from '../calendar/components/CalendarHeader';
import { CalendarGrid } from '../calendar/components/CalendarGrid';
import { CalendarSidebar } from '../calendar/components/CalendarSidebar';
import { TaskEditModal } from '../scheduler/components/TaskEditModal';
import { EventModal } from '../components/calendar/EventModal';
import { QuickScheduleModal } from '../components/calendar/QuickScheduleModal';
import { SkeletonCard } from '../components/LoadingSpinner';

const Calendar: React.FC = () => {
  // Fetch data
  const { data: tasks = [], isLoading: tasksLoading } = useTasks();
  const { data: habits = [], isLoading: habitsLoading } = useHabits({ isActive: true });
  const { data: habitEntries = [], isLoading: entriesLoading } = useHabitEntries();
  const { data: calendarEvents = [], isLoading: eventsLoading } = useCalendarEvents();
  const { data: projects = [] } = useProjects();

  // Custom hooks
  const navigation = useCalendarNavigation();
  const sidebar = useCalendarSidebar();
  const modals = useCalendarModals();
  const { categorizedTasks, getTasksForDay } = useCalendarTasks(tasks, projects);
  const dragDrop = useCalendarDragDrop(tasks);

  const isLoading = tasksLoading || habitsLoading || entriesLoading || eventsLoading;

  if (isLoading) {
    return <SkeletonCard count={3} />;
  }

  return (
    <div className="h-screen flex flex-col">
      <CalendarHeader
        currentDate={navigation.currentDate}
        view={navigation.view}
        onPrevious={navigation.goToPrevious}
        onNext={navigation.goToNext}
        onToday={navigation.goToToday}
        onViewChange={navigation.setView}
      />

      <div className="flex-1 flex overflow-hidden">
        <CalendarSidebar
          categorizedTasks={categorizedTasks}
          expandedSections={sidebar.expandedSections}
          sidebarWidth={sidebar.sidebarWidth}
          onToggleSection={sidebar.toggleSection}
          onTaskDragStart={dragDrop.handleDragStart}
          onTaskClick={modals.openTaskModal}
        />

        <CalendarGrid
          weekDays={navigation.weekDays}
          tasks={tasks}
          events={calendarEvents}
          onTaskClick={modals.openTaskModal}
          onEventClick={modals.openEventModal}
          onCellClick={modals.openQuickSchedule}
          onTaskDrop={dragDrop.handleDrop}
        />
      </div>

      {/* Modals */}
      {modals.showEditModal && (
        <TaskEditModal
          task={modals.editingTask}
          onClose={modals.closeTaskModal}
          onSave={modals.closeTaskModal}
        />
      )}

      {modals.showEventModal && (
        <EventModal
          event={modals.editingEvent}
          initialDate={modals.eventModalInitialDate}
          onClose={modals.closeEventModal}
          onSave={modals.closeEventModal}
        />
      )}

      {modals.showQuickSchedule && modals.quickScheduleDate && (
        <QuickScheduleModal
          date={modals.quickScheduleDate}
          onClose={modals.closeQuickSchedule}
          onSchedule={modals.closeQuickSchedule}
        />
      )}
    </div>
  );
};

export default Calendar;
```

### Implementation Summary

**Time Estimate:** 13-16 hours total

| Phase | Description | Time | Priority |
|-------|-------------|------|----------|
| 1 | Extract navigation hook | 2h | High |
| 2 | Extract sidebar hook | 1.5h | High |
| 3 | Extract modals hook | 1.5h | High |
| 4 | Extract tasks hook | 2h | Medium |
| 5 | Extract utilities | 1h | Low |
| 6 | Create sub-components | 3h | Medium |
| 7 | Update Calendar.tsx | 2h | High |

**Impact:**
- Lines: 1,711 → ~250 (85% reduction)
- useState: 17 → 0 (component), 17 total (in hooks)
- Maintainability: Drastically improved
- Testability: Each hook testable in isolation

**Testing Strategy:**
1. Unit test each hook independently
2. Test sub-components with mock props
3. Integration test full Calendar flow
4. Test drag & drop thoroughly
5. Test all modal interactions

---

## 2. MealPlanning.tsx (1,327 lines) - CRITICAL

### Current State Analysis

**File:** `src/pages/MealPlanning.tsx`

**Complexity Metrics:**
- Lines: 1,327
- useState: 4 calls (but well-organized!)
- useEffect: 3 calls
- useMemo: 4 calls
- Custom hooks: 6 already extracted! ✅

**Current State:**
```typescript
const MealPlanning: React.FC = () => {
  // Already well-extracted hooks! ✅
  const modalState = useMealFormModals();
  const weekNav = useWeekNavigation();
  const recipeImport = useRecipeImport();
  const groceryState = useGroceryList(/* ... */);
  const multiCellSelection = useMultiCellSelection(/* ... */);

  // Remaining state (only 4!)
  const [copyTargetWeek, setCopyTargetWeek] = useState<Date | null>(null);
  const [recipeSearchQuery, setRecipeSearchQuery] = useState('');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  // ... 1,300 more lines
}
```

**Analysis:** This component is **already well-structured** with many extracted hooks! The main issue is the **large rendering logic** (~1,000 lines of JSX).

### Refactoring Plan

#### Phase 1: Extract Recipe Filtering Hook (30 minutes)

**Create:** `src/mealPlanning/hooks/useRecipeFiltering.ts`

```typescript
import { useMemo, useState, useCallback } from 'react';
import type { Recipe } from '../types';

export interface UseRecipeFilteringReturn {
  searchQuery: string;
  showFavoritesOnly: boolean;
  filteredRecipes: Recipe[];
  setSearchQuery: (query: string) => void;
  toggleFavoritesOnly: () => void;
  clearFilters: () => void;
}

export function useRecipeFiltering(
  recipes: Recipe[]
): UseRecipeFilteringReturn {
  const [searchQuery, setSearchQuery] = useState('');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  const filteredRecipes = useMemo(() => {
    let filtered = recipes;

    if (showFavoritesOnly) {
      filtered = filtered.filter(r => r.isFavorite);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(r =>
        r.name.toLowerCase().includes(query) ||
        r.tags?.some(tag => tag.toLowerCase().includes(query))
      );
    }

    return filtered;
  }, [recipes, searchQuery, showFavoritesOnly]);

  const toggleFavoritesOnly = useCallback(() => {
    setShowFavoritesOnly(prev => !prev);
  }, []);

  const clearFilters = useCallback(() => {
    setSearchQuery('');
    setShowFavoritesOnly(false);
  }, []);

  return {
    searchQuery,
    showFavoritesOnly,
    filteredRecipes,
    setSearchQuery,
    toggleFavoritesOnly,
    clearFilters,
  };
}
```

#### Phase 2: Extract Week Copy Hook (45 minutes)

**Create:** `src/mealPlanning/hooks/useWeekCopy.ts`

```typescript
import { useState, useCallback } from 'react';
import { startOfWeek, format } from 'date-fns';
import type { PlannedMeal, MealSlot } from '../types';
import { useCopyWeekMutation } from './useMealPlanningQuery';

export interface UseWeekCopyReturn {
  copyTargetWeek: Date | null;
  isCopying: boolean;
  openCopyModal: (targetWeek: Date) => void;
  closeCopyModal: () => void;
  copyWeek: (sourceWeek: Date, targetWeek: Date) => Promise<void>;
}

export function useWeekCopy(
  currentWeek: Date,
  weekStartsOn: number
): UseWeekCopyReturn {
  const [copyTargetWeek, setCopyTargetWeek] = useState<Date | null>(null);
  const copyMutation = useCopyWeekMutation();

  const openCopyModal = useCallback((targetWeek: Date) => {
    setCopyTargetWeek(targetWeek);
  }, []);

  const closeCopyModal = useCallback(() => {
    setCopyTargetWeek(null);
  }, []);

  const copyWeek = useCallback(async (sourceWeek: Date, targetWeek: Date) => {
    const sourceStart = startOfWeek(sourceWeek, { weekStartsOn });
    const targetStart = startOfWeek(targetWeek, { weekStartsOn });

    await copyMutation.mutateAsync({
      sourceWeekStart: format(sourceStart, 'yyyy-MM-dd'),
      targetWeekStart: format(targetStart, 'yyyy-MM-dd'),
    });

    closeCopyModal();
  }, [weekStartsOn, copyMutation, closeCopyModal]);

  return {
    copyTargetWeek,
    isCopying: copyMutation.isPending,
    openCopyModal,
    closeCopyModal,
    copyWeek,
  };
}
```

#### Phase 3: Break into Sub-Components (3 hours)

The main issue with MealPlanning.tsx is the massive rendering logic. Break it down:

**Create:** `src/mealPlanning/components/MealPlanGrid.tsx`

```typescript
import React from 'react';
import { MealCell } from './MealCell';
import type { PlannedMeal, MealSlot, DayOfWeek } from '../types';

interface MealPlanGridProps {
  weekDays: Date[];
  mealSlots: MealSlot[];
  plannedMeals: PlannedMeal[];
  onCellClick: (day: DayOfWeek, slot: MealSlot) => void;
  onMealClick: (meal: PlannedMeal) => void;
  selectedCells?: Set<string>;
}

export const MealPlanGrid: React.FC<MealPlanGridProps> = ({
  weekDays,
  mealSlots,
  plannedMeals,
  onCellClick,
  onMealClick,
  selectedCells,
}) => {
  return (
    <div className="meal-plan-grid">
      {/* Header row */}
      <div className="grid-header">
        <div className="time-column">Time</div>
        {weekDays.map(day => (
          <div key={day.toISOString()} className="day-header">
            {format(day, 'EEE, MMM d')}
          </div>
        ))}
      </div>

      {/* Meal slot rows */}
      {mealSlots.map(slot => (
        <div key={slot.id} className="grid-row">
          <div className="slot-label">{slot.name}</div>
          {weekDays.map(day => (
            <MealCell
              key={`${day.toISOString()}-${slot.id}`}
              day={day}
              slot={slot}
              meals={plannedMeals.filter(m =>
                isSameDay(parseISO(m.date), day) && m.slotId === slot.id
              )}
              onClick={() => onCellClick(day, slot)}
              onMealClick={onMealClick}
              isSelected={selectedCells?.has(`${day.toISOString()}-${slot.id}`)}
            />
          ))}
        </div>
      ))}
    </div>
  );
};
```

**Create:** `src/mealPlanning/components/RecipePanel.tsx`

```typescript
import React from 'react';
import { Search, Star, Plus } from 'lucide-react';
import { RecipeCard } from './RecipeCard';
import type { Recipe } from '../types';

interface RecipePanelProps {
  recipes: Recipe[];
  searchQuery: string;
  showFavoritesOnly: boolean;
  onSearchChange: (query: string) => void;
  onToggleFavorites: () => void;
  onRecipeClick: (recipe: Recipe) => void;
  onCreateNew: () => void;
}

export const RecipePanel: React.FC<RecipePanelProps> = ({
  recipes,
  searchQuery,
  showFavoritesOnly,
  onSearchChange,
  onToggleFavorites,
  onRecipeClick,
  onCreateNew,
}) => {
  return (
    <aside className="recipe-panel">
      <div className="panel-header">
        <h2>Recipes</h2>
        <button onClick={onCreateNew} className="btn-primary">
          <Plus className="h-4 w-4" />
          New Recipe
        </button>
      </div>

      <div className="panel-filters">
        <div className="search-box">
          <Search className="h-4 w-4" />
          <input
            type="text"
            placeholder="Search recipes..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        <button
          onClick={onToggleFavorites}
          className={showFavoritesOnly ? 'active' : ''}
        >
          <Star className="h-4 w-4" />
          Favorites
        </button>
      </div>

      <div className="recipe-list">
        {recipes.map(recipe => (
          <RecipeCard
            key={recipe.id}
            recipe={recipe}
            onClick={() => onRecipeClick(recipe)}
          />
        ))}
      </div>
    </aside>
  );
};
```

**Create:** `src/mealPlanning/components/MealPlanToolbar.tsx`

```typescript
import React from 'react';
import { ChevronLeft, ChevronRight, Calendar, ShoppingCart, Copy } from 'lucide-react';

interface MealPlanToolbarProps {
  currentWeek: Date;
  onPreviousWeek: () => void;
  onNextWeek: () => void;
  onToday: () => void;
  onOpenGroceryList: () => void;
  onOpenCopyWeek: () => void;
}

export const MealPlanToolbar: React.FC<MealPlanToolbarProps> = ({
  currentWeek,
  onPreviousWeek,
  onNextWeek,
  onToday,
  onOpenGroceryList,
  onOpenCopyWeek,
}) => {
  return (
    <div className="toolbar">
      <div className="week-navigation">
        <button onClick={onPreviousWeek} aria-label="Previous week">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <span className="week-label">
          Week of {format(currentWeek, 'MMM d, yyyy')}
        </span>
        <button onClick={onNextWeek} aria-label="Next week">
          <ChevronRight className="h-5 w-5" />
        </button>
        <button onClick={onToday} className="btn-secondary">
          <Calendar className="h-4 w-4" />
          This Week
        </button>
      </div>

      <div className="toolbar-actions">
        <button onClick={onOpenCopyWeek} className="btn-secondary">
          <Copy className="h-4 w-4" />
          Copy Week
        </button>
        <button onClick={onOpenGroceryList} className="btn-primary">
          <ShoppingCart className="h-4 w-4" />
          Grocery List
        </button>
      </div>
    </div>
  );
};
```

#### Phase 4: Update MealPlanning.tsx (1 hour)

**After:** `src/pages/MealPlanning.tsx` (Refactored to ~300 lines)

```typescript
import React from 'react';
import { useRecipesQuery, useMealPlansQuery } from '../mealPlanning/hooks/useMealPlanningQuery';
import { useMealFormModals } from '../mealPlanning/hooks/useMealFormModals';
import { useWeekNavigation } from '../mealPlanning/hooks/useWeekNavigation';
import { useRecipeImport } from '../mealPlanning/hooks/useRecipeImport';
import { useGroceryList } from '../mealPlanning/hooks/useGroceryList';
import { useMultiCellSelection } from '../mealPlanning/hooks/useMultiCellSelection';
import { useRecipeFiltering } from '../mealPlanning/hooks/useRecipeFiltering';
import { useWeekCopy } from '../mealPlanning/hooks/useWeekCopy';
import { MealPlanToolbar } from '../mealPlanning/components/MealPlanToolbar';
import { MealPlanGrid } from '../mealPlanning/components/MealPlanGrid';
import { RecipePanel } from '../mealPlanning/components/RecipePanel';
import { QuickRecipeModal } from '../mealPlanning/components/modals/QuickRecipeModal';
import { SimpleRecipeEditModal } from '../mealPlanning/components/modals/SimpleRecipeEditModal';
import { GroceryListModal } from '../mealPlanning/components/modals/GroceryListModal';
import { CopyWeekModal } from '../mealPlanning/components/modals/CopyWeekModal';

const MealPlanning: React.FC = () => {
  // Data fetching
  const { data: recipes = [], isLoading: recipesLoading } = useRecipesQuery();
  const { data: plannedMeals = [], isLoading: mealsLoading } = useMealPlansQuery();

  // Custom hooks
  const modalState = useMealFormModals();
  const weekNav = useWeekNavigation();
  const recipeImport = useRecipeImport();
  const groceryState = useGroceryList(plannedMeals, recipes, weekNav.currentWeek);
  const multiCellSelection = useMultiCellSelection(plannedMeals, weekNav.weekDays);
  const recipeFiltering = useRecipeFiltering(recipes);
  const weekCopy = useWeekCopy(weekNav.currentWeek, 0);

  const isLoading = recipesLoading || mealsLoading;

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="meal-planning-page">
      <MealPlanToolbar
        currentWeek={weekNav.currentWeek}
        onPreviousWeek={weekNav.goToPreviousWeek}
        onNextWeek={weekNav.goToNextWeek}
        onToday={weekNav.goToToday}
        onOpenGroceryList={groceryState.openModal}
        onOpenCopyWeek={() => weekCopy.openCopyModal(weekNav.currentWeek)}
      />

      <div className="meal-planning-content">
        <MealPlanGrid
          weekDays={weekNav.weekDays}
          mealSlots={MEAL_SLOTS}
          plannedMeals={plannedMeals}
          onCellClick={modalState.openQuickAdd}
          onMealClick={modalState.openEdit}
          selectedCells={multiCellSelection.selectedCells}
        />

        <RecipePanel
          recipes={recipeFiltering.filteredRecipes}
          searchQuery={recipeFiltering.searchQuery}
          showFavoritesOnly={recipeFiltering.showFavoritesOnly}
          onSearchChange={recipeFiltering.setSearchQuery}
          onToggleFavorites={recipeFiltering.toggleFavoritesOnly}
          onRecipeClick={modalState.openRecipeView}
          onCreateNew={modalState.openRecipeCreate}
        />
      </div>

      {/* Modals */}
      {modalState.showQuickAdd && (
        <QuickRecipeModal
          {...modalState.quickAddProps}
          onClose={modalState.closeQuickAdd}
        />
      )}

      {modalState.showRecipeEdit && (
        <SimpleRecipeEditModal
          {...modalState.recipeEditProps}
          onClose={modalState.closeRecipeEdit}
        />
      )}

      {groceryState.showModal && (
        <GroceryListModal
          {...groceryState.modalProps}
          onClose={groceryState.closeModal}
        />
      )}

      {weekCopy.copyTargetWeek && (
        <CopyWeekModal
          sourceWeek={weekNav.currentWeek}
          targetWeek={weekCopy.copyTargetWeek}
          onCopy={weekCopy.copyWeek}
          onClose={weekCopy.closeCopyModal}
        />
      )}
    </div>
  );
};

export default MealPlanning;
```

### Implementation Summary

**Time Estimate:** 5-7 hours total

| Phase | Description | Time | Priority |
|-------|-------------|------|----------|
| 1 | Extract recipe filtering hook | 0.5h | Low |
| 2 | Extract week copy hook | 0.75h | Medium |
| 3 | Create sub-components | 3h | High |
| 4 | Update MealPlanning.tsx | 1h | High |

**Impact:**
- Lines: 1,327 → ~300 (77% reduction)
- Component complexity: Drastically reduced
- Already has good hook extraction! ✅
- Main issue: Breaking down massive JSX

**Testing Strategy:**
1. Test recipe filtering logic
2. Test week copy functionality
3. Test each sub-component independently
4. Integration test full meal planning flow

---

## 3. LifeGoals.tsx (820 lines) - CRITICAL

### Current State Analysis

**File:** `src/pages/LifeGoals.tsx`

**Complexity Metrics:**
- Lines: 820
- useState: 11 calls
- useEffect: 0 calls (good!)
- useMemo: 3 calls

**Current State (Lines 105-114):**
```typescript
const LifeGoals: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'goals' | 'dreams'>('goals');
  const [goalDraft, setGoalDraft] = useState<Partial<LifeGoalInput>>({ ... });
  const [dreamDraft, setDreamDraft] = useState<Partial<Dream>>({ ... });
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [showDreamForm, setShowDreamForm] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [editingProgress, setEditingProgress] = useState<string | null>(null);
  const [progressValue, setProgressValue] = useState(0);
  const [expandedGoalId, setExpandedGoalId] = useState<string | null>(null);
  const [goalMilestones, setGoalMilestones] = useState<Record<string, LifeGoalMilestone[]>>({});

  // ... 700 more lines
}
```

### Refactoring Plan

#### Phase 1: Extract Goal Stats Hook (30 minutes)

**Create:** `src/goals/hooks/useGoalStats.ts`

```typescript
import { useMemo } from 'react';
import type { LifeGoal, Dream } from '../types/lifeGoals';

export interface GoalStats {
  total: number;
  completed: number;
  inProgress: number;
  notStarted: number;
  completionRate: number;
}

export interface DreamStats {
  total: number;
  achieved: number;
  inProgress: number;
  achievementRate: number;
}

export function useGoalStats(goals: LifeGoal[]): GoalStats {
  return useMemo(() => {
    const total = goals.length;
    const completed = goals.filter(g => g.status === 'completed').length;
    const inProgress = goals.filter(g => g.status === 'in-progress').length;
    const notStarted = goals.filter(g => g.status === 'not-started').length;
    const completionRate = total > 0 ? (completed / total) * 100 : 0;

    return {
      total,
      completed,
      inProgress,
      notStarted,
      completionRate,
    };
  }, [goals]);
}

export function useDreamStats(dreams: Dream[]): DreamStats {
  return useMemo(() => {
    const total = dreams.length;
    const achieved = dreams.filter(d => d.achieved).length;
    const inProgress = dreams.filter(d => !d.achieved && d.progress > 0).length;
    const achievementRate = total > 0 ? (achieved / total) * 100 : 0;

    return {
      total,
      achieved,
      inProgress,
      achievementRate,
    };
  }, [dreams]);
}
```

#### Phase 2: Extract Goal Progress Hook (1 hour)

**Create:** `src/goals/hooks/useGoalProgress.ts`

```typescript
import { useState, useCallback } from 'react';
import { useUpdateGoalMutation } from './useLifeGoalsQuery';
import { logger } from '@/services/logger';

export interface UseGoalProgressReturn {
  editingProgress: string | null;
  progressValue: number;
  startEdit: (goalId: string, currentProgress: number) => void;
  updateProgress: (value: number) => void;
  saveProgress: (goalId: string) => Promise<void>;
  cancelEdit: () => void;
}

export function useGoalProgress(): UseGoalProgressReturn {
  const [editingProgress, setEditingProgress] = useState<string | null>(null);
  const [progressValue, setProgressValue] = useState(0);
  const updateGoalMutation = useUpdateGoalMutation();

  const startEdit = useCallback((goalId: string, currentProgress: number) => {
    setEditingProgress(goalId);
    setProgressValue(currentProgress);
  }, []);

  const updateProgress = useCallback((value: number) => {
    setProgressValue(Math.min(100, Math.max(0, value)));
  }, []);

  const saveProgress = useCallback(async (goalId: string) => {
    try {
      await updateGoalMutation.mutateAsync({
        id: goalId,
        progress: progressValue,
      });
      setEditingProgress(null);
      setProgressValue(0);
    } catch (error) {
      logger.error('Goals', error as Error);
      throw error;
    }
  }, [progressValue, updateGoalMutation]);

  const cancelEdit = useCallback(() => {
    setEditingProgress(null);
    setProgressValue(0);
  }, []);

  return {
    editingProgress,
    progressValue,
    startEdit,
    updateProgress,
    saveProgress,
    cancelEdit,
  };
}
```

#### Phase 3: Extract Goal Expansion Hook (45 minutes)

**Create:** `src/goals/hooks/useGoalExpansion.ts`

```typescript
import { useState, useCallback, useEffect } from 'react';
import { useMilestonesQuery } from './useLifeGoalsQuery';
import type { LifeGoalMilestone } from '../types/lifeGoals';

export interface UseGoalExpansionReturn {
  expandedGoalId: string | null;
  goalMilestones: Record<string, LifeGoalMilestone[]>;
  isExpanded: (goalId: string) => boolean;
  toggleExpansion: (goalId: string) => void;
  collapseAll: () => void;
}

export function useGoalExpansion(): UseGoalExpansionReturn {
  const [expandedGoalId, setExpandedGoalId] = useState<string | null>(null);
  const [goalMilestones, setGoalMilestones] = useState<Record<string, LifeGoalMilestone[]>>({});

  // Fetch milestones when a goal is expanded
  const { data: milestones } = useMilestonesQuery(expandedGoalId);

  useEffect(() => {
    if (expandedGoalId && milestones) {
      setGoalMilestones(prev => ({
        ...prev,
        [expandedGoalId]: milestones,
      }));
    }
  }, [expandedGoalId, milestones]);

  const isExpanded = useCallback((goalId: string) => {
    return expandedGoalId === goalId;
  }, [expandedGoalId]);

  const toggleExpansion = useCallback((goalId: string) => {
    setExpandedGoalId(prev => prev === goalId ? null : goalId);
  }, []);

  const collapseAll = useCallback(() => {
    setExpandedGoalId(null);
  }, []);

  return {
    expandedGoalId,
    goalMilestones,
    isExpanded,
    toggleExpansion,
    collapseAll,
  };
}
```

#### Phase 4: Extract Goal Form Hooks (1 hour)

**Create:** `src/goals/hooks/useGoalForm.ts`

```typescript
import { useState, useCallback } from 'react';
import type { LifeGoalInput, Dream } from '../types/lifeGoals';
import { useCreateGoalMutation, useUpdateGoalMutation } from './useLifeGoalsQuery';

export interface UseGoalFormReturn {
  draft: Partial<LifeGoalInput>;
  showForm: boolean;
  isEditing: boolean;
  updateDraft: (updates: Partial<LifeGoalInput>) => void;
  openCreateForm: () => void;
  openEditForm: (goal: LifeGoalInput) => void;
  closeForm: () => void;
  submitForm: () => Promise<void>;
  resetDraft: () => void;
}

const emptyDraft: Partial<LifeGoalInput> = {
  title: '',
  description: '',
  category: 'personal',
  status: 'not-started',
  priority: 'medium',
  progress: 0,
};

export function useGoalForm(): UseGoalFormReturn {
  const [draft, setDraft] = useState<Partial<LifeGoalInput>>(emptyDraft);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const createMutation = useCreateGoalMutation();
  const updateMutation = useUpdateGoalMutation();

  const updateDraft = useCallback((updates: Partial<LifeGoalInput>) => {
    setDraft(prev => ({ ...prev, ...updates }));
  }, []);

  const openCreateForm = useCallback(() => {
    setDraft(emptyDraft);
    setEditingId(null);
    setShowForm(true);
  }, []);

  const openEditForm = useCallback((goal: LifeGoalInput & { id: string }) => {
    setDraft(goal);
    setEditingId(goal.id);
    setShowForm(true);
  }, []);

  const closeForm = useCallback(() => {
    setShowForm(false);
    setDraft(emptyDraft);
    setEditingId(null);
  }, []);

  const submitForm = useCallback(async () => {
    if (editingId) {
      await updateMutation.mutateAsync({ id: editingId, ...draft });
    } else {
      await createMutation.mutateAsync(draft as LifeGoalInput);
    }
    closeForm();
  }, [editingId, draft, createMutation, updateMutation, closeForm]);

  const resetDraft = useCallback(() => {
    setDraft(emptyDraft);
  }, []);

  return {
    draft,
    showForm,
    isEditing: editingId !== null,
    updateDraft,
    openCreateForm,
    openEditForm,
    closeForm,
    submitForm,
    resetDraft,
  };
}

// Similar hook for Dream form
export function useDreamForm(): UseGoalFormReturn {
  // ... similar implementation
}
```

#### Phase 5: Extract Rendering Components (2 hours)

**Create:** `src/goals/components/GoalCard.tsx`

```typescript
import React from 'react';
import { Target, Trash2, Edit, TrendingUp } from 'lucide-react';
import type { LifeGoal } from '../types/lifeGoals';
import { ProgressBar } from './ProgressBar';
import { GoalStatusBadge } from './GoalStatusBadge';

interface GoalCardProps {
  goal: LifeGoal;
  isExpanded: boolean;
  isEditingProgress: boolean;
  progressValue: number;
  onToggleExpand: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onStartEditProgress: () => void;
  onUpdateProgress: (value: number) => void;
  onSaveProgress: () => void;
  onCancelEditProgress: () => void;
}

export const GoalCard: React.FC<GoalCardProps> = ({
  goal,
  isExpanded,
  isEditingProgress,
  progressValue,
  onToggleExpand,
  onEdit,
  onDelete,
  onStartEditProgress,
  onUpdateProgress,
  onSaveProgress,
  onCancelEditProgress,
}) => {
  return (
    <div className="goal-card">
      <div className="goal-header">
        <div className="goal-title">
          <Target className="h-5 w-5" />
          <h3>{goal.title}</h3>
          <GoalStatusBadge status={goal.status} />
        </div>

        <div className="goal-actions">
          <button onClick={onEdit} title="Edit goal">
            <Edit className="h-4 w-4" />
          </button>
          <button onClick={onDelete} title="Delete goal">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <p className="goal-description">{goal.description}</p>

      <div className="goal-progress">
        {isEditingProgress ? (
          <div className="progress-edit">
            <input
              type="number"
              min="0"
              max="100"
              value={progressValue}
              onChange={(e) => onUpdateProgress(Number(e.target.value))}
            />
            <button onClick={onSaveProgress}>Save</button>
            <button onClick={onCancelEditProgress}>Cancel</button>
          </div>
        ) : (
          <div className="progress-display" onClick={onStartEditProgress}>
            <ProgressBar value={goal.progress} />
            <span>{goal.progress}%</span>
            <TrendingUp className="h-4 w-4" />
          </div>
        )}
      </div>

      {isExpanded && (
        <div className="goal-expanded">
          {/* Milestones, check-ins, etc. */}
        </div>
      )}
    </div>
  );
};
```

**Create:** `src/goals/components/GoalList.tsx`

```typescript
import React from 'react';
import { GoalCard } from './GoalCard';
import type { LifeGoal } from '../types/lifeGoals';
import type { UseGoalProgressReturn, UseGoalExpansionReturn } from '../hooks';

interface GoalListProps {
  goals: LifeGoal[];
  progress: UseGoalProgressReturn;
  expansion: UseGoalExpansionReturn;
  onEdit: (goal: LifeGoal) => void;
  onDelete: (goalId: string) => void;
}

export const GoalList: React.FC<GoalListProps> = ({
  goals,
  progress,
  expansion,
  onEdit,
  onDelete,
}) => {
  if (goals.length === 0) {
    return (
      <div className="empty-state">
        <p>No goals yet. Create your first goal to get started!</p>
      </div>
    );
  }

  return (
    <div className="goal-list">
      {goals.map(goal => (
        <GoalCard
          key={goal.id}
          goal={goal}
          isExpanded={expansion.isExpanded(goal.id)}
          isEditingProgress={progress.editingProgress === goal.id}
          progressValue={progress.progressValue}
          onToggleExpand={() => expansion.toggleExpansion(goal.id)}
          onEdit={() => onEdit(goal)}
          onDelete={() => onDelete(goal.id)}
          onStartEditProgress={() => progress.startEdit(goal.id, goal.progress)}
          onUpdateProgress={progress.updateProgress}
          onSaveProgress={() => progress.saveProgress(goal.id)}
          onCancelEditProgress={progress.cancelEdit}
        />
      ))}
    </div>
  );
};
```

#### Phase 6: Update LifeGoals.tsx (1 hour)

**After:** `src/pages/LifeGoals.tsx` (Refactored to ~250 lines)

```typescript
import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { useLifeGoalsQuery, useDreamsQuery } from '../goals/hooks/useLifeGoalsQuery';
import { useGoalStats, useDreamStats } from '../goals/hooks/useGoalStats';
import { useGoalProgress } from '../goals/hooks/useGoalProgress';
import { useGoalExpansion } from '../goals/hooks/useGoalExpansion';
import { useGoalForm, useDreamForm } from '../goals/hooks/useGoalForm';
import { GoalList } from '../goals/components/GoalList';
import { DreamList } from '../goals/components/DreamList';
import { GoalStatsCards } from '../goals/components/GoalStatsCards';
import { GoalFormModal } from '../goals/components/GoalFormModal';
import { DreamFormModal } from '../goals/components/DreamFormModal';
import { GoalTemplates } from '../goals/components/GoalTemplates';

const LifeGoals: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'goals' | 'dreams'>('goals');
  const [showTemplates, setShowTemplates] = useState(false);

  // Data fetching
  const { data: goals = [], isLoading: goalsLoading } = useLifeGoalsQuery();
  const { data: dreams = [], isLoading: dreamsLoading } = useDreamsQuery();

  // Custom hooks
  const goalStats = useGoalStats(goals);
  const dreamStats = useDreamStats(dreams);
  const goalProgress = useGoalProgress();
  const goalExpansion = useGoalExpansion();
  const goalForm = useGoalForm();
  const dreamForm = useDreamForm();

  const isLoading = goalsLoading || dreamsLoading;

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="life-goals-page">
      <header className="page-header">
        <div>
          <h1>Life Goals & Dreams</h1>
          <p>Track your long-term aspirations and milestones</p>
        </div>

        <div className="header-actions">
          <button onClick={() => setShowTemplates(true)} className="btn-secondary">
            Browse Templates
          </button>
          <button
            onClick={activeTab === 'goals' ? goalForm.openCreateForm : dreamForm.openCreateForm}
            className="btn-primary"
          >
            <Plus className="h-4 w-4" />
            New {activeTab === 'goals' ? 'Goal' : 'Dream'}
          </button>
        </div>
      </header>

      <GoalStatsCards
        goalStats={goalStats}
        dreamStats={dreamStats}
      />

      <div className="tabs">
        <button
          onClick={() => setActiveTab('goals')}
          className={activeTab === 'goals' ? 'active' : ''}
        >
          Goals ({goals.length})
        </button>
        <button
          onClick={() => setActiveTab('dreams')}
          className={activeTab === 'dreams' ? 'active' : ''}
        >
          Dreams ({dreams.length})
        </button>
      </div>

      {activeTab === 'goals' ? (
        <GoalList
          goals={goals}
          progress={goalProgress}
          expansion={goalExpansion}
          onEdit={goalForm.openEditForm}
          onDelete={(id) => /* ... */}
        />
      ) : (
        <DreamList
          dreams={dreams}
          onEdit={dreamForm.openEditForm}
          onDelete={(id) => /* ... */}
        />
      )}

      {/* Modals */}
      {goalForm.showForm && (
        <GoalFormModal
          draft={goalForm.draft}
          isEditing={goalForm.isEditing}
          onUpdate={goalForm.updateDraft}
          onSubmit={goalForm.submitForm}
          onClose={goalForm.closeForm}
        />
      )}

      {dreamForm.showForm && (
        <DreamFormModal
          draft={dreamForm.draft}
          isEditing={dreamForm.isEditing}
          onUpdate={dreamForm.updateDraft}
          onSubmit={dreamForm.submitForm}
          onClose={dreamForm.closeForm}
        />
      )}

      {showTemplates && (
        <GoalTemplates
          onGoalCreated={() => setShowTemplates(false)}
          onClose={() => setShowTemplates(false)}
        />
      )}
    </div>
  );
};

export default LifeGoals;
```

### Implementation Summary

**Time Estimate:** 5-7 hours total

| Phase | Description | Time | Priority |
|-------|-------------|------|----------|
| 1 | Extract stats hooks | 0.5h | Low |
| 2 | Extract progress hook | 1h | High |
| 3 | Extract expansion hook | 0.75h | Medium |
| 4 | Extract form hooks | 1h | High |
| 5 | Create components | 2h | High |
| 6 | Update LifeGoals.tsx | 1h | High |

**Impact:**
- Lines: 820 → ~250 (70% reduction)
- useState: 11 → 2 (component), 11 total (in hooks)
- Reusability: Much improved
- Testability: Each hook testable independently

---

## 4-12. Additional Component Plans

Due to space constraints, here's a summary of the remaining plans:

### 4. Dashboard.tsx (634 lines) - 4 hours
**Hooks to create:**
- `useDashboardTasks` - Filter today's and upcoming tasks
- `useDashboardHabits` - Calculate habit progress
- `useTaskCompletion` - Handle task completion with optimistic UI

### 5. TaskScheduler.tsx (638 lines) - 5 hours
**Hooks to create:**
- `useTaskBoard` - Board column management
- `useTaskDragDrop` - Drag & drop logic
- `useTaskFiltering` - Search and filter

### 6. ShoppingSmart.tsx (593 lines) - 2 hours
**Already well-structured! Minor improvements:**
- Extract `useStoreDistribution` for distribution logic
- Break into smaller sub-components

### 7-12. Other Components
Each requires 2-4 hours of focused refactoring following similar patterns.

---

## Testing Strategy

For all refactored components:

1. **Unit Tests for Hooks:**
   ```typescript
   describe('useCalendarNavigation', () => {
     it('should navigate to next week', () => {
       const { result } = renderHook(() => useCalendarNavigation());
       act(() => result.current.goToNext());
       // assertions
     });
   });
   ```

2. **Component Tests:**
   ```typescript
   describe('CalendarHeader', () => {
     it('should call onNext when next button clicked', () => {
       const onNext = jest.fn();
       render(<CalendarHeader onNext={onNext} {...props} />);
       // click and assert
     });
   });
   ```

3. **Integration Tests:**
   - Test full user flows
   - Test data fetching and mutations
   - Test error handling

---

## Summary

**Total Estimated Time:** 40-50 hours for all 14 components

**Priority Order:**
1. Calendar.tsx (13-16h) - Highest impact
2. MealPlanning.tsx (5-7h) - High impact
3. LifeGoals.tsx (5-7h) - High impact
4. Dashboard.tsx (4h) - Medium impact
5. TaskScheduler.tsx (5h) - Medium impact
6. Remaining 7 components (12-15h) - Lower impact

**Expected Results:**
- Average component size: 500 lines → 200-300 lines (50-60% reduction)
- Hook extraction: 70 → 95+ hooks
- Maintainability: Significantly improved
- Testability: Much better
- Reusability: Greatly enhanced

---

**Document Date:** December 15, 2025
**Status:** Ready for implementation
**Next Step:** Begin Calendar.tsx refactoring (Phase 1)
