import { useEffect, useRef, lazy, Suspense } from 'react';
import { useRealAppStore } from './stores/useRealAppStore';
import Layout from './components/Layout';
import { ErrorBoundary } from './components/ErrorBoundary';
import LoadingSpinner from './components/LoadingSpinner';
import { AuthGate } from './components/AuthGate';
import { useAuth } from './hooks/useAuth';
import { isSupabaseConfigured } from './lib/supabase';
import { loadSFHChallenge } from './stores/seventyFiveHardActions';
import { cleanup75HardDuplicates } from './utils/cleanup75HardDuplicates';
import { logger } from 'services/logger';

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
const ProjectTracking = lazy(() => import('./pages/ProjectTracking'));
const Shared = lazy(() => import('./pages/Shared'));
const Travel = lazy(() => import('./pages/Travel'));
const VisaPage = lazy(() => import('./travel/pages/VisaPage'));
const TripPlanner = lazy(() => import('./travel/components/TripPlanner'));
const Finances = lazy(() => import('./pages/Finances'));
const SeventyFiveHard = lazy(() => import('./pages/SeventyFiveHard/index'));
const Skincare = lazy(() => import('./pages/Skincare'));
const Assistant = lazy(() => import('./pages/Assistant'));

// Expose cleanup function globally for debugging
if (typeof window !== 'undefined') {
  (window as any).cleanup75HardDuplicates = cleanup75HardDuplicates;
}

function App() {
  const { activeView, loading, initializeData } = useRealAppStore();
  const { user, loading: authLoading } = useAuth();
  const initializedFor = useRef<string | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      return;
    }

    if (!authLoading && !user) {
      initializedFor.current = null;
    }
  }, [user, authLoading]);

  // Initialize data from Supabase database only
  useEffect(() => {
    // Only proceed if Supabase is configured
    if (!isSupabaseConfigured) {
      logger.warn('App', '🔄 Supabase not configured. Please configure environment variables.');
      return;
    }

    if (authLoading || !user) {
      return;
    }

    if (initializedFor.current === user.id) {
      return;
    }

    initializedFor.current = user.id;

    // Initialize data and load 75 Hard challenge
    (async () => {
      try {
        await initializeData();
        logger.debug('App', '🔄 Initialized LifeSync data for Supabase user');

        // Load active 75 Hard challenge (new architecture)
        // This will check for missed days and show failure prompt if needed
        await loadSFHChallenge();
        logger.debug('App', '✅ 75 Hard challenge loaded');
      } catch (error) {
        logger.error('Failed to initialize data or load 75 Hard challenge:', { error });
      }
    })();
  }, [initializeData, user, authLoading]);

  // Show loading spinner while initializing
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner />
          <p className="mt-4 text-muted">Loading LifeSync...</p>
        </div>
      </div>
    );
  }

  const renderPage = () => {
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
      case 'shared':
        return <Shared />;
      case 'seventy-five-hard':
        return <SeventyFiveHard />;
      case 'skincare':
        return <Skincare />;
      case 'assistant':
        return <Assistant />;
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
      </Layout>
    </AuthGate>
  );
}

export default App;
