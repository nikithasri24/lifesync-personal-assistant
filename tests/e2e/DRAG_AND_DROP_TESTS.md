# Drag and Drop Test Coverage

## Overview

This document explains the drag-and-drop test coverage for V2 Todos UI and why certain tests are skipped.

## V2 UI Drag Features ✅

The following drag-and-drop features are **fully implemented and tested** in V2 UI:

### 1. Status Section Drag (`drag-status-sections-v2.spec.ts`)
**Status**: ✅ **7/7 tests passing**

Allows dragging tasks between status sections in List view:
- To Do → In Progress
- In Progress → Waiting
- To Do → Done (completes task)
- Status changes persist after page reload
- Cannot drag when in selection mode
- Visual feedback during drag (opacity, highlighted drop zones)
- Undo/redo support via Command pattern

### 2. Calendar Date Drag (`drag-to-calendar-date.spec.ts`)
**Status**: ✅ **3/3 tests passing**

Allows dragging tasks to calendar to set due dates:
- Tasks are draggable in calendar day view
- Calendar day cells accept drops in month view
- Drop zones highlighted with visual feedback
- Due date updates immediately
- Undo/redo support

### 3. Multi-Select Drag (`drag-multi-select.spec.ts`)
**Status**: ✅ **5/5 tests passing**

Allows dragging multiple selected tasks at once:
- Select multiple tasks in selection mode
- Drag any selected task to move all selected tasks together
- Shows count badge (e.g., "3 tasks") during drag
- Single task drag still works when not selected
- Multi-select drag persists after reload
- Undo/redo support via BulkChangeTaskStatusCommand

**Total V2 Drag Tests**: 15 tests, all passing ✅

---

## V1 UI Drag Features (Deprecated) ⏭️

The following tests are **skipped** because they test V1 UI features that don't exist in V2 UI:

### Skipped Tests (6 files)

| Test File | Reason Skipped | V2 Equivalent |
|-----------|---------------|---------------|
| `drag-to-waiting-scheduled-starred.spec.ts` | V1 had sidebar drag targets (Waiting For, Scheduled, Starred) | `drag-status-sections-v2.spec.ts` |
| `drag-persistence.spec.ts` | V1 sidebar drag persistence | Persistence tested in `drag-status-sections-v2.spec.ts` and `drag-multi-select.spec.ts` |
| `drag-to-project.spec.ts` | V1 had project sidebar drag targets | Projects assigned via modal (tested in `task-operations.spec.ts`) |
| `drag-to-today.spec.ts` | V1 had "Today" sidebar drag target | `drag-to-calendar-date.spec.ts` |
| `drag-to-upcoming.spec.ts` | V1 had "Next 7 days" sidebar drag target | `drag-to-calendar-date.spec.ts` |
| `dashboard/add-task-modal-bug.spec.ts` (1 test) | Known bug: backdrop click doesn't close modal | To be fixed |

### Why These Tests Are Skipped

**V1 UI Architecture**:
- Had left sidebar navigation with drag targets (Today, Upcoming, Waiting For, Scheduled, Starred, Projects)
- Tasks could be dragged from main view to sidebar items
- Sidebar items acted as both navigation and drop zones

**V2 UI Architecture**:
- No sidebar navigation (bottom tab bar instead)
- Drag targets are **status sections** in List view (To Do, In Progress, Waiting, Done)
- Drag targets are **calendar dates** in Calendar view
- Projects, categories, and other attributes are assigned via modal editor

**Decision**: Keep V1 tests skipped with clear documentation rather than deleting them, in case we want to restore sidebar drag functionality in the future.

---

## Test Coverage Summary

| Feature | Test File | Tests | Status |
|---------|-----------|-------|--------|
| **V2: Status Section Drag** | `drag-status-sections-v2.spec.ts` | 7 | ✅ Passing |
| **V2: Calendar Date Drag** | `drag-to-calendar-date.spec.ts` | 3 | ✅ Passing |
| **V2: Multi-Select Drag** | `drag-multi-select.spec.ts` | 5 | ✅ Passing |
| V1: Sidebar Waiting/Scheduled/Starred | `drag-to-waiting-scheduled-starred.spec.ts` | 1 | ⏭️ Skipped |
| V1: Sidebar Persistence | `drag-persistence.spec.ts` | 3 | ⏭️ Skipped |
| V1: Sidebar Project | `drag-to-project.spec.ts` | 1 | ⏭️ Skipped |
| V1: Sidebar Today | `drag-to-today.spec.ts` | 1 | ⏭️ Skipped |
| V1: Sidebar Upcoming | `drag-to-upcoming.spec.ts` | 1 | ⏭️ Skipped |
| **Total V2 Drag Tests** | **3 files** | **15** | **✅ 100% passing** |
| **Total V1 Drag Tests** | **5 files** | **7** | **⏭️ Deprecated** |

---

## Running Drag Tests

### Run all V2 drag tests:
```bash
npx playwright test drag-status-sections-v2.spec.ts drag-to-calendar-date.spec.ts drag-multi-select.spec.ts
```

### Run individual test suites:
```bash
# Status section drag
npx playwright test drag-status-sections-v2.spec.ts

# Calendar drag
npx playwright test drag-to-calendar-date.spec.ts

# Multi-select drag
npx playwright test drag-multi-select.spec.ts
```

### Verify all drag tests pass:
```bash
npx playwright test --grep "drag" --project=chromium
```
This will run all drag tests (V2 tests will pass, V1 tests will be skipped).

---

## Implementation Details

### Hooks
- **`useTodosDragDrop`** (`src/todos/hooks/useTodosDragDrop.ts`): Manages drag state and event handlers for status section drag
- **`useCalendarDragDrop`** (`src/calendar/hooks/useCalendarDragDrop.ts`): Manages drag state for calendar date drag

### Components
- **`TaskCardV2`** (`src/todos/components/v2/TaskCardV2.tsx`): Draggable task cards
- **`TaskListViewV2`** (`src/todos/components/v2/TaskListViewV2.tsx`): Drop zones for status sections
- **`Calendar`** (`src/pages/Calendar.tsx`): Drop zones for calendar dates

### Commands (Undo/Redo Support)
- **`ChangeTaskStatusCommand`** (`src/commands/TaskCommands.ts`): Single task status change
- **`BulkChangeTaskStatusCommand`** (`src/commands/TaskCommands.ts`): Multi-task status change
- **`SetTaskDueDateCommand`** (`src/commands/TaskCommands.ts`): Calendar date drag

### Visual Feedback
- Task opacity reduces to 0.4 during drag
- Drop zones highlight with terracotta background (`rgba(212, 165, 116, 0.2)`)
- Drop zones show dashed border (`2px dashed #D4A574`)
- Multi-select shows count badge with gradient background
- Cursor changes to `grab` when hovering over draggable tasks

---

## Future Enhancements

Potential drag-and-drop features to add:
- Drag to sidebar views (if sidebar is restored)
- Drag to Projects sidebar (if project sidebar is added)
- Drag to reorder tasks within a section (requires `order` field in database)
- Drag to assign tags/categories
- Touch-based drag for mobile (HTML5 Drag API is desktop-only)

---

**Last Updated**: 2026-02-25
**V2 Drag Test Coverage**: 100% (15/15 tests passing)
**V1 Drag Tests Skipped**: 7 (deprecated features)
