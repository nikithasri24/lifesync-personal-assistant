# ELEVATE - Personal Assistant & Productivity Suite

A comprehensive, Nike-inspired personal productivity and life management application built with React, TypeScript, and modern web technologies.

## 🔄 Continuous Integration Status

[![Regression Tests](https://github.com/username/lifesync/actions/workflows/regression-tests.yml/badge.svg)](https://github.com/username/lifesync/actions/workflows/regression-tests.yml)
[![Full Test Suite](https://github.com/username/lifesync/actions/workflows/full-test-suite.yml/badge.svg)](https://github.com/username/lifesync/actions/workflows/full-test-suite.yml)
[![Focus Monitor](https://github.com/username/lifesync/actions/workflows/focus-endpoint-monitor.yml/badge.svg)](https://github.com/username/lifesync/actions/workflows/focus-endpoint-monitor.yml)
[![API Connectivity](https://github.com/username/lifesync/actions/workflows/api-connectivity-check.yml/badge.svg)](https://github.com/username/lifesync/actions/workflows/api-connectivity-check.yml)

> **Focus Protection:** Automated monitoring prevents the return of Focus API 404 errors that previously affected the application.

## 🚀 Features Overview

### 🏠 **Dashboard**
- **Welcome Overview**: Personalized greeting with today's summary
- **Quick Stats**: Today's tasks, pending habits, total notes, and weekly progress
- **Today's Tasks**: Prioritized task list with due dates and priority indicators
- **Today's Habits**: Habit completion tracking with progress indicators
- **Recent Notes**: Latest notes with tags and timestamps
- **Weekly Progress**: Visual overview of completed tasks and journal entries
- **Upcoming Deadlines**: Time-sensitive tasks with warning indicators

### 📅 **Calendar & Event Management**
- **Full Calendar View**: Month/week/day views with intuitive navigation
- **Event Creation**: Rich event creation with date/time, location, and descriptions
- **Multiple Calendars**: Support for personal and external calendar sources
- **Event Management**: Edit, delete, and manage calendar events
- **Integration Ready**: Designed for Google Calendar, Outlook, and Apple Calendar sync
- **Visual Organization**: Color-coded events and calendar categorization

### ✅ **Advanced Task Management**
- **Kanban Workflow**: 4-column system (Need to Start, Currently Working, Pending Others, Done)
- **Task Categories**: Personal, Household, and Work organization
- **Priority System**: Low, Medium, High, and Urgent priority levels
- **Sub-tasks**: Micro-checklists and task breakdown capability
- **Drag & Drop**: Intuitive task movement between status columns
- **Due Dates**: Date tracking with overdue indicators
- **Assignment Tracking**: Track who tasks are waiting on
- **Time Estimation**: Task duration planning
- **Focus Time Tracking**: Integration with Pomodoro timer

### 🎯 **Habit Tracking System**
- **Hierarchical Categories**: Organized habit grouping (Supplements, Workouts, Reading)
- **Flexible Frequency**: Daily, weekly, and monthly habit patterns
- **Smart Reminders**: Browser notifications with customizable timing
- **Streak Tracking**: Visual progress and consistency monitoring
- **Color Coding**: Visual organization and quick identification
- **Progress Analytics**: Weekly and monthly completion statistics
- **Drag & Drop Reordering**: Customize habit organization

### ⏱️ **Focus Timer (Pomodoro)**
- **Multiple Timer Modes**: 25min Pomodoro, 45min Deep Work, 90min Flow State
- **Task Integration**: Link focus sessions to specific tasks
- **Smart Breaks**: Automatic short (5min) and long (15min) break scheduling
- **Session Tracking**: Detailed focus session history and analytics
- **Interruption Monitoring**: Track and improve focus quality
- **Daily Statistics**: Focus time, session count, and productivity metrics
- **Customizable Settings**: Adjustable work/break durations
- **Notifications**: Audio and visual alerts for session transitions

### 💭 **Mood Tracking & Wellness**
- **Daily Check-ins**: Comprehensive mood, energy, and stress tracking
- **Multi-dimensional Rating**: 5-point scales for mood, energy, and stress levels
- **Sleep Integration**: Sleep duration tracking and correlation
- **Activity Monitoring**: Exercise and social time tracking
- **Mood Factors**: Identify triggers and influences (15+ predefined factors)
- **Weekly Overview**: Visual week-at-a-glance mood calendar
- **Analytics**: Average mood, check-in streaks, and pattern recognition
- **Rich Notes**: Detailed daily reflections and observations

### 📝 **Notes & Knowledge Management**
- **Rich Text Editor**: Full-featured note creation and editing
- **Smart Categorization**: Work, Personal, Ideas, Meeting, and Project categories
- **Tag System**: Flexible tagging for easy organization and retrieval
- **Pin Important Notes**: Keep crucial information easily accessible
- **Search Functionality**: Quick note discovery across all content
- **Timestamps**: Automatic creation and modification tracking

### 📖 **Journal & Reflection**
- **Daily Journaling**: Structured daily reflection and documentation
- **Mood Integration**: Connect journal entries with daily mood tracking
- **Gratitude Practice**: Built-in gratitude tracking features
- **Attachment Support**: Images, files, and links in journal entries
- **Weather Integration**: Optional weather logging for context
- **Tag Organization**: Categorize and organize journal entries

### 🎨 **Nike-Inspired Design System**
- **Athletic Aesthetics**: Bold, dynamic design inspired by Nike's visual language
- **Premium Typography**: Space Grotesk and Inter fonts for modern appeal
- **Color Palette**: Black, white, and orange accent scheme
- **Micro-interactions**: Smooth animations and hover effects
- **Responsive Design**: Mobile-first approach with desktop optimization
- **Dark Mode**: Complete dark theme implementation
- **Glass Effects**: Modern backdrop blur and transparency effects

### 🔧 **Technical Features**
- **TypeScript**: Full type safety and developer experience
- **React 18**: Latest React features with hooks and modern patterns
- **Zustand State Management**: Lightweight, intuitive state handling
- **Local Storage Persistence**: Automatic data persistence across sessions
- **Date-fns Integration**: Comprehensive date manipulation and formatting
- **Lucide Icons**: Modern, consistent iconography
- **Custom CSS**: Comprehensive design system with CSS variables
- **Responsive Grid**: Flexible layout system for all screen sizes

## 🛠️ Technology Stack

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **State Management**: Zustand with persistence middleware
- **Styling**: Custom CSS with design system variables
- **Icons**: Lucide React
- **Date Handling**: date-fns
- **Drag & Drop**: @dnd-kit
- **Notifications**: Browser Notification API

## 🚀 Getting Started

### Prerequisites
- Node.js 16+ 
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd lifesync
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev -- --port 3000 --host 0.0.0.0
   ```

4. **Access the application**
   - Local: `http://localhost:3000`
   - Network: `http://[your-ip]:3000`

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## 📱 Application Structure

```
src/
├── components/          # Reusable UI components
│   ├── Layout.tsx      # Main application layout
│   ├── NikeLogo.tsx    # Brand logo component
│   └── ThemeToggle.tsx # Dark mode toggle
├── pages/              # Main application pages
│   ├── Dashboard.tsx   # Overview and quick actions
│   ├── Calendar.tsx    # Event and calendar management
│   ├── Focus.tsx       # Pomodoro timer and focus tracking
│   ├── Habits.tsx      # Habit tracking and management
│   ├── Mood.tsx        # Daily check-ins and mood tracking
│   ├── Notes.tsx       # Note creation and management
│   ├── Todos.tsx       # Task management with Kanban
│   ├── Journal.tsx     # Daily journaling
│   └── Personal.tsx    # Personal life management
├── stores/             # State management
│   └── useAppStore.ts  # Main Zustand store
├── types/              # TypeScript type definitions
│   └── index.ts        # All application types
├── index.css           # Nike-inspired design system
└── App.tsx             # Main application component
```

## 🎯 Core Features Deep Dive

### Habit Tracking System
The hierarchical habit system supports three pre-configured categories:
- **Supplements**: Daily vitamins (B12, Vitamin D, Iron)
- **Workouts**: Physical exercise tracking
- **Reading**: Learning and educational content

Each habit includes:
- Flexible frequency (daily, weekly, monthly)
- Target count per period
- Color coding for visual organization
- Reminder system with browser notifications
- Streak calculation and progress tracking

### Task Management (Kanban)
Four-column workflow system:
1. **Need to Start**: New tasks awaiting action
2. **Currently Working**: Active tasks in progress
3. **Pending Others**: Tasks waiting on external dependencies
4. **Done**: Completed tasks

Features include:
- Drag and drop between columns
- Priority levels with visual indicators
- Due date tracking with overdue alerts
- Sub-task creation and management
- Time estimation and tracking

### Focus Timer Features
Comprehensive Pomodoro implementation:
- **Standard Pomodoro**: 25-minute work sessions
- **Deep Work**: 45-minute focused sessions
- **Flow State**: 90-minute intensive sessions
- Automatic break scheduling
- Task integration for productivity tracking
- Session analytics and improvement insights

## 🔮 Upcoming Features

### In Development
- **Recurring Tasks**: Custom frequency patterns for repeating tasks
- **Goals Page**: Bucket list and relationship goal management
- **Shared Features**: Reading lists, gift ideas, and collaboration tools
- **Data Import/Export**: Integration with Notion, Google Keep, and calendar services
- **PWA Capabilities**: Offline functionality and mobile app experience

### Future Enhancements
- **External Calendar Sync**: Google Calendar, Outlook, Apple Calendar integration
- **Advanced Analytics**: Detailed productivity and wellness insights
- **Team Collaboration**: Shared dashboards and collaborative features
- **Mobile Optimization**: Enhanced mobile experience and gestures
- **AI Insights**: Intelligent recommendations and pattern recognition

## 🤝 Contributing

This is a personal productivity application designed for individual use. The codebase serves as a comprehensive example of modern React development with TypeScript.

## 📄 License

This project is for personal and educational use.

---

**ELEVATE** - Just Do It. 🚀

*A comprehensive personal productivity suite designed with Nike's athletic aesthetic and premium functionality for peak performance.*
