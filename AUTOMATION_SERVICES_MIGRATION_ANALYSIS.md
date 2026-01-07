# Automation Services Migration Analysis

**Date**: 2025-12-24
**Status**: 🔍 IN PROGRESS - Analysis Complete

---

## 📊 **Services to Migrate (5 total)**

### **1. DailyBriefingService.ts** 🔴 NEEDS MIGRATION

**Current State**:
- ❌ Uses direct Supabase access
- Queries: `calendar_events`, `tasks`, `habits`, `habit_entries`, `user_gamification`

**Database Operations**:
```typescript
// Calendar events for today
supabase.from('calendar_events').select('...').eq('user_id', user.id)

// Tasks due today or overdue
supabase.from('tasks').select('...').eq('user_id', user.id)

// Active habits
supabase.from('habits').select('...').eq('user_id', user.id)

// Today's habit entries
supabase.from('habit_entries').select('...').eq('date', today)

// Gamification stats
supabase.from('user_gamification').select('...').eq('user_id', user.id)
```

**API Endpoints Available**:
- ✅ `calendarAPI.ts` - `getCalendarEvents()`
- ✅ `tasksAPI.ts` - `getTasks()`
- ✅ `habitsAPI.ts` - `getHabits()`, `getHabitEntriesForDate()`
- ✅ `gamificationAPI.ts` - `getUserGamification()`

**Migration Complexity**: ⭐⭐ EASY (all APIs exist)
**Estimated Time**: 30 minutes

---

### **2. InboxService.ts** 🟡 PARTIALLY MIGRATED

**Current State**:
- ❌ Uses direct Supabase access
- Queries: `inbox_items` (CRUD operations)

**Database Operations**:
```typescript
// Create inbox item
supabase.from('inbox_items').insert({...}).select().single()

// Get inbox items
supabase.from('inbox_items').select('*').eq('user_id', user.id)

// Get pending count
supabase.from('inbox_items').select('*', { count: 'exact', head: true })

// Update status (dismiss)
supabase.from('inbox_items').update({ status: 'dismissed' })

// Update status (process)
supabase.from('inbox_items').update({ status: 'processed' })

// Delete item
supabase.from('inbox_items').delete().eq('id', itemId)

// Get stats
supabase.from('inbox_items').select('*', { count: 'exact', head: true })
```

**API Endpoints Available**:
- ✅ `inboxAPI.ts` exists with functions:
  - `getInboxItems(status?)`
  - `getPendingCount()`
  - `createInboxItem(input)`
  - `updateInboxItem(id, updates)` (need to verify)
  - `deleteInboxItem(id)` (need to verify)
  - `getInboxStats()` (need to verify)

**Missing Functions** (need to check):
- `dismissInboxItem(id)` - wrapper for update with status='dismissed'
- `processInboxItem(id, processedToType, processedToId)` - wrapper for update with status='processed'
- `getInboxStats()` - get pending/processed counts

**Migration Complexity**: ⭐ VERY EASY (API mostly exists)
**Estimated Time**: 30 minutes

---

### **3. ReminderService.ts** 🟡 PARTIALLY MIGRATED

**Current State**:
- ❌ Uses direct Supabase access
- Queries: `notification_queue` (CRUD operations)

**Database Operations**:
```typescript
// Schedule reminder (create)
supabase.from('notification_queue').insert({...}).select('id').single()

// Cancel reminder (update)
supabase.from('notification_queue').update({ status: 'cancelled' })

// Get upcoming reminders
supabase.from('notification_queue').select('*').eq('status', 'pending')

// Get due reminders
supabase.from('notification_queue').select('*').lte('scheduled_for', now)

// Mark as sent (update)
supabase.from('notification_queue').update({ status: 'sent', sent_at: now })
```

**API Endpoints Available**:
- ✅ `notificationAPI.ts` exists with:
  - `queueNotification(notification)` - creates notification

**Missing Functions**:
- `getUpcomingReminders()` - get pending notifications
- `getDueReminders()` - get notifications due now
- `cancelReminder(id)` - update status to cancelled
- `markReminderSent(id)` - update status to sent

**Migration Complexity**: ⭐⭐ EASY (need to add 4 functions)
**Estimated Time**: 1 hour

---

### **4. VisionBoardService.ts** 🟢 EASY MIGRATION

**Current State**:
- ❌ Uses direct Supabase access
- Queries: `life_dreams` (read/update vision board fields)

**Database Operations**:
```typescript
// Get vision board items (dreams with images)
supabase.from('life_dreams').select('*').not('vision_board_images', 'is', null)

// Add image to dream
supabase.from('life_dreams').select('vision_board_images').eq('id', dreamId)
supabase.from('life_dreams').update({ vision_board_images: [...] })

// Remove image from dream
supabase.from('life_dreams').select('vision_board_images').eq('id', dreamId)
supabase.from('life_dreams').update({ vision_board_images: [...] })

// Update notes
supabase.from('life_dreams').update({ vision_board_notes: notes })
```

**API Endpoints Available**:
- ✅ `lifeGoalsAPI.ts` (in `src/goals/api/`) has:
  - `getUserLifeDreams()` - get all dreams
  - `updateLifeDream(id, input)` - update dream (includes vision_board_images, vision_board_notes)

**Migration Strategy**:
- Use `getUserLifeDreams()` and filter for dreams with images
- Use `updateLifeDream()` for all update operations
- Service layer handles array manipulation logic

**Migration Complexity**: ⭐ VERY EASY (API exists, just refactor)
**Estimated Time**: 30 minutes

---

### **5. FoodPhotoService.ts** 🟢 NO MIGRATION NEEDED

**Current State**:
- ✅ Only uses Supabase Storage (not database)
- Operations: Upload photo, get public URL

**Supabase Usage**:
```typescript
// Upload to storage
supabase.storage.from('food-photos').upload(filePath, file)

// Get public URL
supabase.storage.from('food-photos').getPublicUrl(filePath)
```

**Migration Strategy**:
- ✅ **NO MIGRATION NEEDED** - Storage operations are infrastructure, not data access
- Storage operations are acceptable to keep in service layer
- Similar to how file uploads work in other services

**Migration Complexity**: ⭐ NONE (no action needed)
**Estimated Time**: 0 minutes

---

## 📋 **Migration Summary**

| Service | Status | API Exists | Missing Functions | Time | Priority |
|---------|--------|------------|-------------------|------|----------|
| **DailyBriefingService** | 🔴 Needs Migration | ✅ Yes | None | 30min | High |
| **InboxService** | 🟡 Partial | ✅ Mostly | 3 functions | 30min | High |
| **ReminderService** | 🟡 Partial | ✅ Partial | 4 functions | 1h | Medium |
| **VisionBoardService** | 🟢 Easy | ✅ Yes | None | 30min | Low |
| **FoodPhotoService** | 🟢 Skip | N/A | N/A | 0min | None |

**Total Estimated Time**: 2.5 hours (was 4-5 hours, reduced!)

---

## 🎯 **Migration Plan**

### **Phase 1: Add Missing API Functions** (1 hour)

1. **inboxAPI.ts** - Add 3 functions:
   - `dismissInboxItem(id)`
   - `processInboxItem(id, processedToType, processedToId)`
   - `getInboxStats()`

2. **notificationAPI.ts** - Add 4 functions:
   - `getUpcomingReminders()`
   - `getDueReminders()`
   - `cancelReminder(id)`
   - `markReminderSent(id)`

### **Phase 2: Migrate Services** (1.5 hours)

1. **DailyBriefingService.ts** (30min)
   - Replace Supabase calls with API layer
   - Import from `@/api/calendarAPI`, `@/api/tasksAPI`, etc.

2. **InboxService.ts** (30min)
   - Replace Supabase calls with `inboxAPI` functions

3. **ReminderService.ts** (30min)
   - Replace Supabase calls with `notificationAPI` functions

4. **VisionBoardService.ts** (30min)
   - Replace Supabase calls with `lifeGoalsAPI` functions
   - Keep array manipulation logic in service

5. **FoodPhotoService.ts** (0min)
   - ✅ Skip - storage operations are fine

---

## ✅ **Next Steps**

1. ✅ Mark "Audit automation services" task as COMPLETE
2. ⏳ Start "Create missing API endpoints" task
3. ⏳ Then "Migrate services to use API layer" task
4. ⏳ Finally "Verify automation services migration" task

---

**Analysis Completed**: 2025-12-24
**Result**: 4/5 services need migration, 1 service (FoodPhoto) is fine as-is
**Revised Estimate**: 2.5 hours (down from 4-5 hours)

