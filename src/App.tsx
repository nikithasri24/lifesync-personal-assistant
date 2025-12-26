import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import { ErrorBoundary } from './components/ErrorBoundary';
import { RouteErrorBoundary } from './components/RouteErrorBoundary';
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
import { useRoutePerformance } from './hooks/useRoutePerformance';
import { useWebVitals } from './hooks/useWebVitals';

// Lazy load all page components for route-based code splitting
const Dashboard = lazy(() => import('./pages/DashboardV3'));
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
const PrivacySettings = lazy(() => import('./pages/PrivacySettings'));

function App(): React.ReactElement {
  // Performance monitoring
  useRoutePerformance();

  // Web Vitals tracking (production performance metrics)
  useWebVitals({
    enabled: true,
    reportToAnalytics: !import.meta.env.DEV,
    logToConsole: import.meta.env.DEV
  });

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
          <Routes>
            {/* Main Routes */}
            <Route path="/" element={<Dashboard />} />
            <Route path="/assistant" element={<Assistant />} />
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/scheduler" element={<TaskScheduler />} />
            <Route path="/focus" element={<Focus />} />

            {/* Productivity Routes */}
            <Route path="/habits" element={<Habits />} />
            <Route path="/todos" element={<Todos />} />
            <Route path="/notes" element={<Notes />} />
            <Route path="/projects" element={<ProjectTracking />} />

            {/* Wellbeing Routes */}
            <Route path="/journal" element={<Journal />} />
            <Route path="/skincare" element={<Skincare />} />

            {/* Personal Routes */}
            <Route path="/goals" element={<LifeGoals />} />
            <Route path="/travel" element={<Travel />} />
            <Route path="/travel/visa" element={<VisaPage />} />
            <Route path="/travel/trip-planner" element={<TripPlanner />} />
            <Route path="/finances/*" element={<Finances />} />
            <Route path="/shopping" element={<ShoppingSmart />} />
            <Route path="/meals" element={<MealPlanning />} />
            <Route path="/nutrition" element={<Nutrition />} />
            <Route path="/shared" element={<Shared />} />

            {/* Settings Routes */}
            <Route path="/settings/privacy" element={<PrivacySettings />} />

            {/* Catch-all: redirect to dashboard */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
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
