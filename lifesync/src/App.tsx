import { useEffect } from 'react';
import { useRealAppStore } from './stores/useRealAppStore';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Calendar from './pages/Calendar';
import Focus from './pages/Focus';
import Habits from './pages/Habits';
import Mood from './pages/Mood';
import TodosWorkingFollowUp from './pages/TodosWorkingFollowUp';
import Notes from './pages/Notes';
import Personal from './pages/Personal';
import Journal from './pages/Journal';
import Goals from './pages/Goals';
import AppleHealthCyclesSimple from './pages/AppleHealthCyclesSimple';
import ShoppingSmart from './pages/ShoppingSmart';
import MealPlanning from './pages/MealPlanning';
import ProjectTracking from './pages/ProjectTracking';
import Travel from './pages/Travel';
import Finances from './pages/Finances';
import SeventyFiveHard from './pages/SeventyFiveHard';
import { ErrorBoundary } from './components/ErrorBoundary';
import LoadingSpinner from './components/LoadingSpinner';

function App() {
  const { activeView, loading, initializeData } = useRealAppStore();

  // Initialize data from database on app start
  useEffect(() => {
    // Try database initialization with graceful fallback
    initializeData();
    console.log('🔄 Database initialization enabled - attempting connection');
    console.log('📊 Database integration with graceful fallback active');
    console.log('💡 App works with or without database connection');
  }, [initializeData]);

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
      case 'mood':
        return <Mood />;
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
        return <Goals />;
      case 'travel':
        return <Travel />;
      case 'finances':
        return <Finances />;
      case 'shopping':
        return <ShoppingSmart />;
      case 'meals':
        return <MealPlanning />;
      case 'shared':
        return <div className="text-center py-12 text-muted">Shared Lists & Gift Ideas feature coming soon...</div>;
      case 'personal':
        return <Personal />;
      case 'seventy-five-hard':
        return <SeventyFiveHard />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <Layout>
      {renderPage()}
    </Layout>
  );
}

export default App;