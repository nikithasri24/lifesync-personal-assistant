import { lazy, Suspense } from 'react';
import { useComposedStore } from './stores/useComposedStore';
import Layout from './components/Layout';
import { ErrorBoundary } from './components/ErrorBoundary';
import LoadingSpinner from './components/LoadingSpinner';
import { AuthGate } from './components/AuthGate';
import { UndoRedoButtons } from './components/UndoRedoButtons';
import { QuickCapture } from './components/inbox';
import { useReminderChecker } from './hooks/useReminders';
import { useHabitReminders, useStreakProtectionAlerts } from './hooks/useHabitReminders';
import { useBillReminders } from './hooks/useBillReminders';
import { useImportantDateReminders } from './hooks/useImportantDateReminders';
import { useTaskReminders } from './hooks/useTaskReminders';
import { useProactiveNotifications } from './hooks/useProactiveNotifications';

// Lazy load all page components for route-based code splitting
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Calendar = lazy(() => import('./pages/Calendar'));
const Focus = lazy(() => import('./pages/Focus'));
const Habits = lazy(() => import('./pages/Habits'));
const Todos = lazy(() => import('./pages/Todos'));
const Notes = lazy(() => import('./pages/Notes'));
const Journal = lazy(() => import('./pages/Journal'));
const LifeGoals = lazy(() => import('./pages/LifeGoals'));
const ShoppingSmart = lazy(() => import('./pages/ShoppingSmart'));
const MealPlanning = lazy(() => import('./pages/MealPlanning'));
const Nutrition = lazy(() => import('./pages/Nutrition'));
const ProjectTracking = lazy(() => import('./pages/ProjectTracking'));
const Shared = lazy(() => import('./pages/Shared'));
const Travel = lazy(() => import('./pages/Travel'));
const VisaPage = lazy(() => import('./travel/pages/VisaPage'));
const TripPlanner = lazy(() => import('./travel/components/TripPlanner'));
const Finances = lazy(() => import('./pages/Finances'));
const Skincare = lazy(() => import('./pages/Skincare'));
const Assistant = lazy(() => import('./pages/Assistant'));
const TaskScheduler = lazy(() => import('./pages/TaskScheduler'));

function App(): React.ReactElement {
  const { activeView } = useComposedStore();

  // Start reminder checking when app loads
  useReminderChecker(true);

  // Schedule habit reminders for the day
  useHabitReminders(true);

  // Schedule streak protection alerts for habits at risk
  useStreakProtectionAlerts(true);

  // Schedule bill payment reminders
  useBillReminders(true);

  // Schedule important date reminders (birthdays, anniversaries)
  useImportantDateReminders(true);

  // Auto-create reminders for scheduled tasks
  useTaskReminders(true);

  // Proactive AI notifications (streak risks, busy periods, goal deadlines)
  useProactiveNotifications({ enabled: true, checkIntervalMs: 60 * 60 * 1000 });

  const renderPage = (): React.ReactElement => {
    switch (activeView) {
      case 'dashboard':
        return <Dashboard />;
      case 'calendar':
        return <Calendar />;
      case 'focus':
        return <Focus />;
      case 'habits':
        return <Habits />;
      case 'todos':
        return <Todos />;
      case 'notes':
        return <Notes />;
      case 'projects':
        return (
          <ErrorBoundary>
            <ProjectTracking />
          </ErrorBoundary>
        );
      case 'journal':
        return <Journal />;
      case 'goals':
        return <LifeGoals />;
      case 'travel':
        return <Travel />;
      case 'visa':
        return <VisaPage />;
      case 'trip-planner':
        return <TripPlanner />;
      case 'finances':
        return <Finances />;
      case 'shopping':
        return <ShoppingSmart />;
      case 'meals':
        return <MealPlanning />;
      case 'nutrition':
        return <Nutrition />;
      case 'shared':
        return <Shared />;
      case 'skincare':
        return <Skincare />;
      case 'assistant':
        return <Assistant />;
      case 'scheduler':
        return <TaskScheduler />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <AuthGate>
      <Layout>
        <Suspense fallback={
          <div className="min-h-screen bg-background flex items-center justify-center">
            <div className="text-center">
              <LoadingSpinner />
              <p className="mt-4 text-muted">Loading page...</p>
            </div>
          </div>
        }>
          {renderPage()}
        </Suspense>
        {/* Global undo/redo buttons */}
        <UndoRedoButtons />
        {/* Quick Capture FAB */}
        <QuickCapture variant="floating" />
      </Layout>
    </AuthGate>
  );
}

export default App;
