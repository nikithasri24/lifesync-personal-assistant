import { lazy, Suspense, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import { ErrorBoundary } from './components/ErrorBoundary';
import { RouteErrorBoundary } from './components/RouteErrorBoundary';
import LoadingSpinner from './components/LoadingSpinner';
import { AuthGate } from './components/AuthGate';
import { UndoRedoButtons } from './components/UndoRedoButtons';
import { SmartQuickCapture } from './components/inbox/SmartQuickCapture';
import { useReminderChecker } from './hooks/useReminders';
import { useHabitReminders, useStreakProtectionAlerts } from './hooks/useHabitReminders';
import { useBillReminders } from './hooks/useBillReminders';
import { useImportantDateReminders } from './hooks/useImportantDateReminders';
import { useTaskReminders } from './hooks/useTaskReminders';
import { useProactiveNotifications } from './hooks/useProactiveNotifications';
import { useRoutePerformance } from './hooks/useRoutePerformance';
import { useWebVitals } from './hooks/useWebVitals';
import { MessageRevealListener } from './together/components';
import { useMilestoneReminders } from './together/hooks';
import { BatchHabitPromptBanner } from './habits/components/BatchHabitPromptBanner';
import { useAuth } from './hooks/useAuth';
import { isNative, isIOS } from './lib/platform';
import { PushNotifications } from '@capacitor/push-notifications';
import { upsertPushSubscription } from './api/pushSubscriptionsAPI';
import { reminderService } from './services/reminders/ReminderService';
import { logger } from './services/logger';

// Lazy load all page components for route-based code splitting
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Calendar = lazy(() => import('./pages/Calendar'));
const CalendarMainView = lazy(() => import('./pages/CalendarMainView'));
const Focus = lazy(() => import('./pages/Focus'));
const Habits = lazy(() => import('./pages/Habits'));
const Todos = lazy(() => import('./pages/Todos'));
const Notes = lazy(() => import('./pages/Notes'));
const Journal = lazy(() => import('./journal/JournalPage'));
const JournalDetail = lazy(() => import('./journal/components/JournalDetailView'));
const LifeGoals = lazy(() => import('./pages/LifeGoals'));
const ShoppingSmart = lazy(() => import('./pages/ShoppingSmart'));
const MealPlanning = lazy(() => import('./pages/MealPlanning'));
const Nutrition = lazy(() => import('./pages/Nutrition'));
const ProjectTracking = lazy(() => import('./pages/ProjectTracking'));
const Shared = lazy(() => import('./pages/Shared'));
const Together = lazy(() => import('./pages/Together'));
const Travel = lazy(() => import('./pages/Travel'));
const VisaPage = lazy(() => import('./travel/pages/VisaPage'));
const Finances = lazy(() => import('./pages/Finances'));
const SelfCare = lazy(() => import('./pages/SelfCare'));
const Assistant = lazy(() => import('./pages/Assistant'));
const More = lazy(() => import('./pages/More'));

async function registerForPush(userId: string): Promise<void> {
  if (!isNative() || !isIOS()) return;
  const { receive } = await PushNotifications.requestPermissions();
  if (receive !== 'granted') return;
  await PushNotifications.register();
  PushNotifications.addListener('registration', ({ value: token }) => {
    void upsertPushSubscription({
      user_id: userId,
      endpoint: `apns:${token}`,
      is_active: true,
    });
  });
  PushNotifications.addListener('registrationError', (err) => {
    logger.warn('PushNotifications', 'APNs registration failed', { err });
  });
}

function App(): React.ReactElement {
  const { user } = useAuth();

  // Initialize native notification permissions once on mount
  useEffect(() => {
    void reminderService.initialize();
  }, []);

  // Register for remote push once the user is authenticated on iOS
  useEffect(() => {
    if (user?.id) {
      void registerForPush(user.id);
    }
  }, [user?.id]);

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

  // Milestone reminders (birthdays, anniversaries)
  useMilestoneReminders({ enabled: true, checkIntervalMs: 60 * 60 * 1000 });

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
            <Route path="/" element={<RouteErrorBoundary feature="Dashboard"><Dashboard /></RouteErrorBoundary>} />
            <Route path="/assistant" element={<RouteErrorBoundary feature="Assistant"><Assistant /></RouteErrorBoundary>} />
            <Route path="/calendar" element={<RouteErrorBoundary feature="Calendar"><Calendar /></RouteErrorBoundary>} />
            <Route path="/scheduler" element={<RouteErrorBoundary feature="Scheduler"><CalendarMainView /></RouteErrorBoundary>} />
            <Route path="/focus" element={<RouteErrorBoundary feature="Focus"><Focus /></RouteErrorBoundary>} />

            {/* Productivity Routes */}
            <Route path="/habits" element={<RouteErrorBoundary feature="Habits"><Habits /></RouteErrorBoundary>} />
            <Route path="/todos" element={<RouteErrorBoundary feature="Todos"><Todos /></RouteErrorBoundary>} />
            <Route path="/notes" element={<RouteErrorBoundary feature="Notes"><Notes /></RouteErrorBoundary>} />
            <Route path="/projects" element={<RouteErrorBoundary feature="Projects"><ProjectTracking /></RouteErrorBoundary>} />

            {/* Wellbeing Routes */}
            <Route path="/journal" element={<RouteErrorBoundary feature="Journal"><Journal /></RouteErrorBoundary>} />
            <Route path="/journal/:id" element={<RouteErrorBoundary feature="Journal"><JournalDetail /></RouteErrorBoundary>} />
            <Route path="/self-care" element={<RouteErrorBoundary feature="Self Care"><SelfCare /></RouteErrorBoundary>} />
            {/* Legacy routes redirect to self-care */}
            <Route path="/skincare" element={<Navigate to="/self-care" replace />} />
            <Route path="/personal-care" element={<Navigate to="/self-care" replace />} />

            {/* Personal Routes */}
            <Route path="/goals" element={<RouteErrorBoundary feature="Life Goals"><LifeGoals /></RouteErrorBoundary>} />
            <Route path="/travel" element={<RouteErrorBoundary feature="Travel"><Travel /></RouteErrorBoundary>} />
            <Route path="/travel/visa" element={<RouteErrorBoundary feature="Visa"><VisaPage /></RouteErrorBoundary>} />
            <Route path="/finances/*" element={<RouteErrorBoundary feature="Finances"><Finances /></RouteErrorBoundary>} />
            <Route path="/shopping" element={<RouteErrorBoundary feature="Shopping"><ShoppingSmart /></RouteErrorBoundary>} />
            <Route path="/meals" element={<RouteErrorBoundary feature="Meal Planning"><MealPlanning /></RouteErrorBoundary>} />
            <Route path="/nutrition" element={<RouteErrorBoundary feature="Nutrition"><Nutrition /></RouteErrorBoundary>} />
            <Route path="/shared" element={<RouteErrorBoundary feature="Shared"><Shared /></RouteErrorBoundary>} />
            <Route path="/together" element={<RouteErrorBoundary feature="Together"><Together /></RouteErrorBoundary>} />
            <Route path="/more" element={<RouteErrorBoundary feature="More"><More /></RouteErrorBoundary>} />

            {/* Catch-all: redirect to dashboard */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
        {/* Global undo/redo buttons */}
        <UndoRedoButtons />
        {/* Smart Quick Capture FAB — intent-aware routing */}
        <SmartQuickCapture />
        {/* Batch Habit Prompt Banner — shows all due habits at once */}
        <BatchHabitPromptBanner />
        {/* Message Reveal Listener - Shows partner messages when triggered */}
        <MessageRevealListener />
      </Layout>
    </AuthGate>
  );
}

export default App;
