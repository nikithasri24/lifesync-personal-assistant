# Task Scheduler - Quick Start Guide

## 🎯 What You Just Got

A **professional task scheduling system** with modern features inspired by Asana, ClickUp, and Monday.com!

## ✨ Key Features

### 📋 **Board View (Kanban)**
- Drag-and-drop task management
- Customizable columns with WIP limits
- Visual task cards with all important info
- Status-based organization

### 📅 **Timeline View (Gantt)**
- Horizontal timeline showing task schedules
- Task dependencies visualization
- Zoom controls (Day/Week/Month/Quarter)
- Critical path highlighting
- Drag to reschedule

### 📊 **List View (Spreadsheet)**
- Sortable columns
- Bulk selection and actions
- Inline editing
- Compact or detailed modes

## 🚀 How to Access

1. **Open the sidebar** (if collapsed)
2. **Click "Task Scheduler"** in the Main section (Board icon)
3. **Start managing tasks!**

## 🎨 Quick Tour

### Board View (Default)
```
┌─────────────┬─────────────┬─────────────┬─────────────┐
│   Backlog   │   To Do     │ In Progress │    Done     │
├─────────────┼─────────────┼─────────────┼─────────────┤
│  [Task 1]   │  [Task 3]   │  [Task 5]   │  [Task 7]   │
│  [Task 2]   │  [Task 4]   │  [Task 6]   │  [Task 8]   │
│             │             │             │             │
│  + Add Task │  + Add Task │  + Add Task │  + Add Task │
└─────────────┴─────────────┴─────────────┴─────────────┘
```

### Timeline View
```
Task Name         Jan 15    Jan 22    Jan 29    Feb 5
────────────────  ──────────────────────────────────────
Design Phase      ■■■■■■■■
Development               ■■■■■■■■■■■■
Testing                                 ■■■■■■
```

### List View
```
☑ Task Name              Status      Priority   Due Date    Assignee
─────────────────────────────────────────────────────────────────────
☑ Implement feature      In Progress High       Jan 20      John Doe
☐ Write documentation    To Do       Medium     Jan 25      Jane Smith
☐ Code review           To Do       High       Jan 22      Team
```

## 🎯 Common Actions

### Create a New Task
1. Click **"New Task"** button (top right)
2. Or click **"+ Add Task"** in any board column
3. Fill in details and save

### Move Tasks (Board View)
- **Click and drag** a task card
- **Drop** into a different column
- Status updates automatically

### Schedule Tasks (Timeline View)
1. Switch to Timeline view
2. Tasks with dates appear on timeline
3. Click task to edit
4. Use zoom controls to adjust view

### Sort & Filter (List View)
1. Click **column headers** to sort
2. Use **Filter button** for advanced filters
3. Select **multiple tasks** for bulk actions

### Start Time Tracking
1. Find task in **"In Progress"** status
2. Click **Play button** on task card
3. Timer starts automatically

## 💡 Pro Tips

### 🎨 **Priority Colors**
- 🔴 **Red** = Urgent (critical tasks)
- 🟠 **Orange** = High (important)
- 🟡 **Yellow** = Medium (normal)
- ⚪ **Gray** = Low (when you can)

### 📊 **Task Cards Show**
- ✅ Title and description
- 🏷️ Tags
- 👤 Assigned team members
- 📅 Due date
- ⏱️ Estimated time
- 📈 Progress percentage
- 💬 Comments count
- 📎 Attachments count
- 🔗 Dependencies count

### ⚡ **Keyboard Shortcuts** (Coming Soon)
- `N` - New task
- `F` - Focus search
- `V` - Change view
- `?` - Show help

## 🔧 Customization

### Add Custom Columns
Edit `src/pages/TaskScheduler.tsx`:
```typescript
const boardColumns: BoardColumn[] = [
  {
    id: 'your-column',
    title: 'Your Column',
    status: 'todo',
    color: '#3b82f6',
    limit: 5,  // Optional WIP limit
    order: 1,
  },
];
```

### Change Default View
In `TaskScheduler.tsx`:
```typescript
const [viewMode, setViewMode] = useState<ViewMode>('timeline'); // 'board' | 'timeline' | 'list'
```

## 🎓 Learn More

See full documentation: `src/scheduler/README.md`

### Topics Covered:
- ✅ Task dependencies
- ✅ Auto-scheduling
- ✅ Time tracking
- ✅ Milestones & sprints
- ✅ Team collaboration
- ✅ Recurring tasks
- ✅ Advanced filtering

## 📈 What's Next?

### Immediate Use Cases:
1. **Project Planning** - Use Timeline view for project schedules
2. **Sprint Management** - Use Board view for agile sprints
3. **Task Tracking** - Use List view for detailed task lists
4. **Team Coordination** - Assign tasks to team members
5. **Progress Monitoring** - Track completion rates

### Future Enhancements:
- Real-time collaboration
- Mobile app
- Calendar integration
- Email notifications
- Custom workflows
- Advanced reporting

## 🐛 Need Help?

### Common Issues:

**Q: Tasks not showing up?**
- Check filters (click Filter button)
- Verify tasks aren't deleted/archived
- Make sure you're looking at the right view

**Q: Can't drag tasks?**
- Only works in Board view
- Ensure task has unique ID
- Check browser console for errors

**Q: Timeline empty?**
- Tasks need `scheduledStart` and `scheduledEnd` dates
- Adjust zoom level
- Check date range

**Q: How do I assign tasks?**
- Currently using mock team members
- Full team integration coming soon
- Edit `teamMembers` array in TaskScheduler.tsx

## 🚀 Start Using Now!

1. **Navigate to Task Scheduler** from sidebar
2. **View your existing tasks** in Board view
3. **Try switching views** to see different perspectives
4. **Create a new task** to test functionality
5. **Drag tasks around** to change status
6. **Explore filters and search** for specific tasks

---

**Enjoy your professional task scheduling experience!** 🎉

For detailed documentation, see: `src/scheduler/README.md`
