# 🎨 Dashboard Migration to V2 Design System

**Status**: 📋 Planning  
**Priority**: HIGH (Most visible page)  
**Estimated Time**: 3-4 days  
**Target**: Perfect light & dark mode support

---

## 📊 **CURRENT DASHBOARD ANALYSIS**

### **Existing Components Used**
```
✅ DashboardLoadingState
✅ WelcomeBanner
✅ StatsGrid
✅ TodayTasksSection
✅ TodayHabitsSection
✅ RecentNotesSection
✅ WeeklyOverview
✅ UpcomingDeadlines
✅ GamificationWidget
✅ MorningBriefing
✅ SmartScheduler
✅ Toast
```

### **Data Sources**
```
- Tasks (useTasks)
- Habits (useHabits, useHabitEntries)
- Notes (useNotes)
- Journal Entries (useJournalEntries)
- Dashboard aggregated data (useDashboardData)
```

### **Key Features**
```
✅ Time-based welcome banner
✅ Stats cards (tasks, habits, notes, journal)
✅ Today's tasks with completion
✅ Today's habits with completion
✅ Recent notes preview
✅ Weekly overview
✅ Upcoming deadlines
✅ Gamification widget
✅ Morning briefing
✅ Smart scheduler
✅ Toast notifications
✅ Loading states
✅ Error handling
```

### **Layout Structure**
```
┌─────────────────────────────────────────────────┐
│ WelcomeBanner              GamificationWidget   │
├─────────────────────────────────────────────────┤
│ MorningBriefing │ StatsGrid                     │
│                 │ SmartScheduler                │
├─────────────────┴───────────────────────────────┤
│ TodayTasks      │ TodayHabits                   │
│ RecentNotes     │ WeeklyOverview                │
├─────────────────────────────────────────────────┤
│ UpcomingDeadlines                               │
└─────────────────────────────────────────────────┘
```

---

## 🎯 **MIGRATION STRATEGY**

### **Approach: Incremental Component Migration**

We'll migrate the dashboard in phases, replacing one component at a time:

1. **Phase 1**: Migrate layout & container (1 day)
2. **Phase 2**: Migrate stats & cards (1 day)
3. **Phase 3**: Migrate task & habit sections (1 day)
4. **Phase 4**: Polish & test both modes (1 day)

---

## 🛠️ **COMPONENTS TO BUILD/MIGRATE**

### **Already Have (V2)** ✅
- Button
- Card
- StatCard

### **Need to Build (V2)** 🔲

#### **1. QuickActionButton**
```typescript
interface QuickActionButtonProps {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
}
```
**Usage**: Quick actions in dashboard  
**Design**: Soft gradient background, icon + label, hover effect

---

#### **2. TaskItem**
```typescript
interface TaskItemProps {
  task: Task;
  onComplete: (id: string) => void;
  isCompleting?: boolean;
  showProject?: boolean;
  showDueDate?: boolean;
}
```
**Usage**: Display individual tasks  
**Design**: Checkbox, title, priority badge, due date, soft colors

---

#### **3. HabitItem**
```typescript
interface HabitItemProps {
  habit: Habit;
  onComplete: (id: string) => void;
  isCompleting?: boolean;
  isCompleted?: boolean;
  showStreak?: boolean;
}
```
**Usage**: Display individual habits  
**Design**: Completion button, title, streak indicator, soft colors

---

#### **4. NotePreview**
```typescript
interface NotePreviewProps {
  note: Note;
  onClick: () => void;
}
```
**Usage**: Preview recent notes  
**Design**: Title, excerpt, timestamp, soft card

---

#### **5. ProgressRing**
```typescript
interface ProgressRingProps {
  value: number;
  max: number;
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  label?: string;
}
```
**Usage**: Weekly overview progress  
**Design**: Circular progress with soft colors

---

#### **6. DeadlineItem**
```typescript
interface DeadlineItemProps {
  task: Task;
  onComplete: (id: string) => void;
  isCompleting?: boolean;
}
```
**Usage**: Upcoming deadlines list  
**Design**: Task with due date highlighting, soft urgency colors

---

#### **7. WelcomeBannerV2**
```typescript
interface WelcomeBannerV2Props {
  userName?: string;
}
```
**Usage**: Time-based greeting  
**Design**: Gradient background, time-based emoji, soft colors

---

#### **8. LoadingSkeletonV2**
```typescript
interface LoadingSkeletonV2Props {
  variant: 'card' | 'list' | 'stat' | 'text';
  count?: number;
}
```
**Usage**: Loading states  
**Design**: Soft pulsing animation, muted colors

---

## 📋 **DETAILED MIGRATION PLAN**

### **DAY 1: Foundation & Layout**

#### **Morning (3-4 hours)**
- [ ] Create `src/dashboard/components/v2/` directory
- [ ] Build `WelcomeBannerV2` component
  - Time-based greeting (Morning/Afternoon/Evening/Night)
  - Soft gradient background
  - User name display
  - Light & dark mode support
- [ ] Build `LoadingSkeletonV2` component
  - Multiple variants
  - Soft pulsing animation
  - Muted colors

#### **Afternoon (3-4 hours)**
- [ ] Create `DashboardV2.tsx` (new file)
- [ ] Set up basic layout structure
- [ ] Implement responsive grid
- [ ] Add theme toggle in header
- [ ] Test layout on mobile/tablet/desktop

#### **Testing**
- [ ] Light mode layout looks good
- [ ] Dark mode layout looks good
- [ ] Responsive on all screen sizes
- [ ] No console errors

---

### **DAY 2: Stats & Cards**

#### **Morning (3-4 hours)**
- [ ] Migrate `StatsGrid` to use `StatCard` (already built)
- [ ] Update stat calculations
- [ ] Add soft gradient backgrounds
- [ ] Implement hover effects
- [ ] Add trend indicators

#### **Afternoon (3-4 hours)**
- [ ] Build `QuickActionButton` component
- [ ] Add quick actions section
- [ ] Build `ProgressRing` component
- [ ] Migrate `WeeklyOverview` with new design

#### **Testing**
- [ ] All stats display correctly
- [ ] Light mode stats readable
- [ ] Dark mode stats readable
- [ ] Hover effects smooth
- [ ] Quick actions work

---

### **DAY 3: Tasks & Habits**

#### **Morning (3-4 hours)**
- [ ] Build `TaskItem` component
  - Checkbox with soft colors
  - Priority badge (muted colors)
  - Due date display
  - Completion animation
- [ ] Build `HabitItem` component
  - Completion button
  - Streak indicator
  - Soft colors
- [ ] Build `NotePreview` component
- [ ] Build `DeadlineItem` component

#### **Afternoon (3-4 hours)**
- [ ] Migrate `TodayTasksSection`
- [ ] Migrate `TodayHabitsSection`
- [ ] Migrate `RecentNotesSection`
- [ ] Migrate `UpcomingDeadlines`
- [ ] Connect all data hooks
- [ ] Implement completion handlers

#### **Testing**
- [ ] Task completion works
- [ ] Habit completion works
- [ ] Animations smooth
- [ ] Light mode clear
- [ ] Dark mode clear
- [ ] All interactions work

---

### **DAY 4: Polish & Testing**

#### **Morning (2-3 hours)**
- [ ] Integrate `GamificationWidget` with new design
- [ ] Integrate `MorningBriefing` with new design
- [ ] Integrate `SmartScheduler` with new design
- [ ] Add micro-interactions
- [ ] Polish animations
- [ ] Adjust spacing/sizing

#### **Afternoon (3-4 hours)**
- [ ] **Comprehensive Testing**
  - [ ] Light mode - every section
  - [ ] Dark mode - every section
  - [ ] Mobile (375px, 414px)
  - [ ] Tablet (768px, 1024px)
  - [ ] Desktop (1280px, 1920px)
  - [ ] All features work
  - [ ] No console errors
  - [ ] No TypeScript errors
  - [ ] Performance check
  - [ ] Accessibility audit

#### **Evening (1 hour)**
- [ ] Final polish
- [ ] Code cleanup
- [ ] Add comments
- [ ] Update documentation
- [ ] Commit to git

---

## 🎨 **DESIGN SPECIFICATIONS**

### **Color Usage**

#### **Stats Cards**
```
Tasks:      from-slate-400/15 to-blue-400/15
Habits:     from-teal-400/15 to-emerald-400/15
Notes:      from-violet-400/15 to-purple-400/15
Journal:    from-amber-400/15 to-orange-400/15
```

#### **Priority Badges**
```
High:       bg-rose-100/70 text-rose-600/80
Medium:     bg-amber-100/70 text-amber-600/80
Low:        bg-sky-100/70 text-sky-600/80
```

#### **Status Indicators**
```
Completed:  text-[var(--color-accent-500)]
Pending:    text-[var(--text-secondary)]
Overdue:    text-rose-500/80
```

### **Spacing**
```
Section gaps:     space-y-6
Card padding:     p-6
Grid gaps:        gap-6
Mobile gaps:      gap-4
```

### **Typography**
```
Page title:       text-3xl font-bold
Section title:    text-xl font-semibold
Card title:       text-lg font-medium
Body text:        text-base
Small text:       text-sm
```

---

## ✅ **ACCEPTANCE CRITERIA**

### **Functionality**
- [ ] All existing features work
- [ ] Task completion works
- [ ] Habit completion works
- [ ] Navigation works
- [ ] Toast notifications work
- [ ] Loading states work
- [ ] Error handling works

### **Visual Design**
- [ ] Matches design system
- [ ] Soft, muted colors throughout
- [ ] Consistent spacing
- [ ] Proper typography
- [ ] Smooth animations
- [ ] Professional appearance

### **Light Mode**
- [ ] All text readable
- [ ] All colors appropriate
- [ ] Good contrast ratios
- [ ] No harsh elements
- [ ] Comfortable to view

### **Dark Mode**
- [ ] All text readable
- [ ] All colors appropriate
- [ ] Good contrast ratios
- [ ] No harsh elements
- [ ] Comfortable to view

### **Responsive**
- [ ] Mobile: Perfect layout
- [ ] Tablet: Perfect layout
- [ ] Desktop: Perfect layout
- [ ] No horizontal scroll
- [ ] Touch-friendly on mobile

### **Performance**
- [ ] Fast initial load
- [ ] Smooth animations
- [ ] No jank
- [ ] Efficient re-renders
- [ ] No memory leaks

### **Code Quality**
- [ ] 0 TypeScript errors
- [ ] 0 ESLint warnings
- [ ] Clean code
- [ ] Proper types
- [ ] Good comments
- [ ] Reusable components

---

## 🚀 **NEXT STEPS**

1. **Review this plan** - Make sure we're aligned
2. **Start Day 1** - Build foundation components
3. **Daily check-ins** - Review progress
4. **Test thoroughly** - Both modes, all sizes
5. **Get feedback** - Before moving to next page

---

**Ready to start? Let's build the Dashboard V2!** 🎨

