import { useEffect, useRef } from 'react';
import { useRealAppStore } from './stores/useRealAppStore';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Calendar from './pages/Calendar';
import Focus from './pages/Focus';
import Habits from './pages/Habits';
import TodosWorkingFollowUp from './pages/TodosWorkingFollowUp';
import Notes from './pages/Notes';
import Journal from './pages/Journal';
import LifeGoals from './pages/LifeGoals';
import AppleHealthCyclesSimple from './pages/AppleHealthCyclesSimple';
import ShoppingSmart from './pages/ShoppingSmart';
import MealPlanning from './pages/MealPlanning';
import ProjectTracking from './pages/ProjectTracking';
import Shared from './pages/Shared';
import Travel from './pages/Travel';
import VisaPage from './travel/pages/VisaPage';
import TripPlanner from './travel/components/TripPlanner';
import Finances from './pages/Finances';
import SeventyFiveHard from './pages/SeventyFiveHard/index';
import Skincare from './pages/Skincare';
import { ErrorBoundary } from './components/ErrorBoundary';
import LoadingSpinner from './components/LoadingSpinner';
import { AuthGate } from './components/AuthGate';
import { useAuth } from './hooks/useAuth';
import { isSupabaseConfigured } from './lib/supabase';
import { loadSFHChallenge } from './stores/seventyFiveHardActions';
import { cleanup75HardDuplicates } from './utils/cleanup75HardDuplicates';
import { migrateJournalEntries } from './utils/migrateJournalEntries';
import { migrateNotes } from './utils/migrateNotes';

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
      console.warn('🔄 Supabase not configured. Please configure environment variables.');
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
        console.log('🔄 Initialized LifeSync data for Supabase user');

        // Migrate journal entries from localStorage to database (one-time)
        const journalMigration = await migrateJournalEntries();
        if (journalMigration.migrated > 0) {
          console.log(`✅ Migrated ${journalMigration.migrated} journal entries to database`);
        }

        // Migrate notes from localStorage to database (one-time)
        const notesMigration = await migrateNotes();
        if (notesMigration.migrated > 0) {
          console.log(`✅ Migrated ${notesMigration.migrated} notes to database`);
        }

        // Load active 75 Hard challenge (new architecture)
        // This will check for missed days and show failure prompt if needed
        await loadSFHChallenge();
        console.log('✅ 75 Hard challenge loaded');
      } catch (error) {
        console.error('Failed to initialize data or load 75 Hard challenge:', error);
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
      case 'period':
        return <AppleHealthCyclesSimple />;
      case 'todos':
        return <TodosWorkingFollowUp />;
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
      default:
        return <Dashboard />;
    }
  };

  return (
    <AuthGate>
      <Layout>
        {renderPage()}
      </Layout>
    </AuthGate>
  );
}

export default App;
