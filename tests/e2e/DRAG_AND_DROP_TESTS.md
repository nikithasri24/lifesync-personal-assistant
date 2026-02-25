# Drag and Drop Test Coverage

## Overview

This document explains the drag-and-drop test coverage for V2 Todos UI.

## Drag Features ✅

The following drag-and-drop features are **fully implemented and tested**:

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

**Total Drag Tests**: 15 tests, all passing ✅

---

## Test Coverage Summary

| Feature | Test File | Tests | Status |
|---------|-----------|-------|--------|
| **Status Section Drag** | `drag-status-sections-v2.spec.ts` | 7 | ✅ Passing |
| **Calendar Date Drag** | `drag-to-calendar-date.spec.ts` | 3 | ✅ Passing |
| **Multi-Select Drag** | `drag-multi-select.spec.ts` | 5 | ✅ Passing |
| **Total** | **3 files** | **15** | **✅ 100% passing** |

---

## Running Drag Tests

### Run all drag tests:
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
- Drag to reorder tasks within a section (requires `order` field in database)
- Drag to assign tags/categories
- Drag to assign projects (alternative to modal editing)
- Touch-based drag for mobile (HTML5 Drag API is desktop-only)

---

**Last Updated**: 2026-02-25
**Drag Test Coverage**: 100% (15/15 tests passing)
