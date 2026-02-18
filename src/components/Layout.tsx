import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Home,
  Target,
  FileText,
  FolderOpen,
  BookOpen,
  Menu,
  X,
  Calendar,
  Timer,
  Trophy,
  Users,
  ChevronRight,
  ShoppingCart,
  ChefHat,
  MapPin,
  DollarSign,
  Sparkles,
  MessageCircle,
  Utensils,
  Plane,
  Heart,
} from 'lucide-react';
import { useComposedStore } from '../stores/useComposedStore';
import { useToast } from '../hooks/useToast';
import Toast from './Toast';
import ThemeToggle from './ThemeToggle';
import VoiceLauncher from './VoiceLauncher';
import PremiumLogo from './PremiumLogo';
import ModeSwitch from './ModeSwitch';
import { NotificationBell } from './notifications';
import { TabBar } from './navigation/TabBar';
import { useThemeColors } from '../hooks/useThemeColors';
import clsx from 'clsx';
import type { ViewKey } from '../stores/slices/uiSlice';

const navigation = [
  { name: 'Dashboard', icon: Home, view: 'dashboard' as const, path: '/', section: 'main' },
  { name: 'AI Assistant', icon: MessageCircle, view: 'assistant' as const, path: '/assistant', section: 'main' },
  { name: 'Calendar', icon: Calendar, view: 'calendar' as const, path: '/calendar', section: 'main' },
  { name: 'Focus', icon: Timer, view: 'focus' as const, path: '/focus', section: 'main' },
  { name: 'Habits', icon: Target, view: 'habits' as const, path: '/habits', section: 'productivity' },
  { name: 'Tasks', icon: Target, view: 'todos' as const, path: '/todos', section: 'productivity' },
  { name: 'Notes', icon: FileText, view: 'notes' as const, path: '/notes', section: 'productivity' },
  { name: 'Projects', icon: FolderOpen, view: 'projects' as const, path: '/projects', section: 'productivity' },
  { name: 'Journal', icon: BookOpen, view: 'journal' as const, path: '/journal', section: 'wellbeing' },
  { name: 'Self Care', icon: Sparkles, view: 'self-care' as const, path: '/self-care', section: 'wellbeing' },
  { name: 'Travel', icon: MapPin, view: 'travel' as const, path: '/travel', section: 'personal' },
  { name: 'Visa Calculator', icon: Plane, view: 'visa' as const, path: '/travel/visa', section: 'personal' },
  { name: 'Finances', icon: DollarSign, view: 'finances' as const, path: '/finances', section: 'personal' },
  { name: 'Shopping', icon: ShoppingCart, view: 'shopping' as const, path: '/shopping', section: 'personal' },
  { name: 'Meals', icon: ChefHat, view: 'meals' as const, path: '/meals', section: 'personal' },
  { name: 'Nutrition', icon: Utensils, view: 'nutrition' as const, path: '/nutrition', section: 'wellbeing' },
  { name: 'Goals', icon: Trophy, view: 'goals' as const, path: '/goals', section: 'personal' },
  { name: 'Shared', icon: Users, view: 'shared' as const, path: '/shared', section: 'personal' },
  { name: 'Together', icon: Heart, view: 'together' as const, path: '/together', section: 'personal' },
];

// Helper function to get ViewKey from pathname
const getViewFromPath = (pathname: string): ViewKey => {
  const item = navigation.find(nav => nav.path === pathname);
  if (item) return item.view;

  // Handle nested routes
  if (pathname.startsWith('/travel/visa')) return 'visa';
  if (pathname.startsWith('/travel/trip-planner')) return 'trip-planner';
  if (pathname.startsWith('/travel')) return 'travel';
  if (pathname.startsWith('/finances')) return 'finances';
  if (pathname.startsWith('/together')) return 'together';

  return 'dashboard';
};

const navigationSections = {
  main: { label: 'Main', items: navigation.filter(item => item.section === 'main') },
  productivity: { label: 'Productivity', items: navigation.filter(item => item.section === 'productivity') },
  wellbeing: { label: 'Wellbeing', items: navigation.filter(item => item.section === 'wellbeing') },
  personal: { label: 'Personal', items: navigation.filter(item => item.section === 'personal') },
};

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const { sidebarCollapsed, setSidebarCollapsed } = useComposedStore();
  const { toast, dismissToast } = useToast();
  const mainRef = React.useRef<HTMLDivElement>(null);
  const colors = useThemeColors();

  // Track screen size for responsive layout
  const [isDesktop, setIsDesktop] = React.useState(false);

  React.useEffect(() => {
    const checkScreenSize = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Derive activeView from current URL path
  const activeView = getViewFromPath(location.pathname);

  // Add keyboard navigation for Home/End keys
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle if not focused on input/textarea
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (event.key === 'Home') {
        event.preventDefault();
        mainRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
      } else if (event.key === 'End') {
        event.preventDefault();
        const scrollHeight = mainRef.current?.scrollHeight ?? 0;
        mainRef.current?.scrollTo({ top: scrollHeight, behavior: 'smooth' });
      }
    };

    const mainEl = mainRef.current;
    mainEl?.addEventListener('keydown', handleKeyDown);
    return () => mainEl?.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Responsive layout: Desktop with sidebar, Mobile with tab bar
  return (
    <div className="h-screen flex" style={{ backgroundColor: colors.bg.primary }}>
      {/* Mobile sidebar overlay */}
      {!sidebarCollapsed && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300"
          onClick={() => setSidebarCollapsed(true)}
        />
      )}

      {/* Desktop Sidebar with Terracotta Design - Only show on desktop */}
      {isDesktop && (
        <aside
          className={clsx(
            'backdrop-blur-xl border-r transition-all duration-300 ease-out z-50 shadow-lg',
            sidebarCollapsed ? 'w-20' : 'w-80',
            'relative inset-y-0 left-0'
          )}
          style={{
            backgroundColor: colors.bg.white,
            borderRight: `1px solid ${colors.border.light}`,
            display: 'flex',
            flexDirection: 'column',
            height: '100vh',
            maxHeight: '100vh',
            overflow: 'hidden',
          }}
        >
        {/* Sidebar Header */}
        <div
          className="flex items-center justify-between px-6"
          style={{
            height: '5rem',
            minHeight: '5rem',
            flexShrink: 0,
            borderBottom: `1px solid ${colors.border.light}`
          }}
        >
          <PremiumLogo collapsed={sidebarCollapsed} />
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-2.5 rounded-lg transition-all duration-200 hover:scale-105 active:scale-95"
            style={{
              backgroundColor: colors.badge.bg,
              color: colors.badge.text,
            }}
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {sidebarCollapsed ? <Menu size={16} /> : <X size={16} />}
          </button>
        </div>

        {/* Sidebar Navigation */}
        <nav
          className="px-4 py-6"
          role="navigation"
          aria-label="Main navigation"
          style={{
            flex: '1 1 auto',
            overflowY: 'auto',
            overflowX: 'hidden',
            minHeight: 0
          }}
        >
          <div className="space-y-8">
            {Object.entries(navigationSections).map(([sectionKey, section]) => (
              <div key={sectionKey}>
                {!sidebarCollapsed && (
                  <h3
                    className="text-xs font-semibold uppercase tracking-wider mb-3 px-3"
                    style={{ color: colors.text.tertiary }}
                  >
                    {section.label}
                  </h3>
                )}

                <ul className="space-y-1" style={{ listStyle: 'none' }}>
                  {section.items.map((item) => {
                    const isActive = location.pathname === item.path ||
                                   (item.path !== '/' && location.pathname.startsWith(item.path));

                    return (
                      <li key={item.name} style={{ listStyle: 'none' }}>
                        <Link
                          to={item.path}
                          className={clsx(
                            'w-full flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group relative',
                          )}
                          style={{
                            textDecoration: 'none',
                            background: isActive
                              ? `linear-gradient(135deg, ${colors.accent.start} 0%, ${colors.accent.end} 100%)`
                              : 'transparent',
                            color: isActive ? '#FFFFFF' : colors.text.primary,
                          }}
                          aria-current={isActive ? 'page' : undefined}
                          title={sidebarCollapsed ? item.name : undefined}
                          onMouseEnter={(e) => {
                            if (!isActive) {
                              e.currentTarget.style.backgroundColor = colors.bg.secondary;
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!isActive) {
                              e.currentTarget.style.backgroundColor = 'transparent';
                            }
                          }}
                        >
                          <item.icon
                            className={clsx(
                              'flex-shrink-0 transition-all duration-200',
                              sidebarCollapsed ? 'mx-auto' : 'mr-3',
                            )}
                            size={20}
                            aria-hidden="true"
                          />

                          {!sidebarCollapsed && (
                            <>
                              <span className="transition-all duration-300 flex-1 text-left">
                                {item.name}
                              </span>

                              {isActive && (
                                <ChevronRight
                                  size={16}
                                  className="transition-all duration-300"
                                  style={{ color: 'rgba(255, 255, 255, 0.8)' }}
                                />
                              )}
                            </>
                          )}

                          {sidebarCollapsed && <span className="sr-only">{item.name}</span>}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </nav>

          {/* Sidebar Footer */}
          <div
            className="p-4"
            style={{
              flexShrink: 0,
              minHeight: 'fit-content',
              borderTop: `1px solid ${colors.border.light}`
            }}
          >
            <ThemeToggle />
          </div>
        </aside>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Header - Only on small screens, hide for Together, Notes, Journal, Habits, Goals, Tasks, Shopping, Meals, Assistant, and Calendar pages */}
        {!isDesktop && activeView !== 'together' && activeView !== 'notes' && activeView !== 'journal' && activeView !== 'habits' && activeView !== 'lifegoals' && activeView !== 'todos' && activeView !== 'shopping' && activeView !== 'meals' && activeView !== 'assistant' && activeView !== 'calendar' && (
          <header
            className="flex-shrink-0"
            style={{
            backgroundColor: colors.bg.white,
            paddingTop: '48px',
            paddingLeft: '24px',
            paddingRight: '24px',
            paddingBottom: '24px',
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <h2
                className="font-bold"
                style={{
                  fontSize: '34px',
                  fontWeight: 700,
                  letterSpacing: '-0.4px',
                  background: `linear-gradient(135deg, ${colors.accent.start} 0%, ${colors.accent.end} 100%)`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                {activeView === 'todos' ? 'Tasks' : activeView.charAt(0).toUpperCase() + activeView.slice(1)}
              </h2>
              <p className="text-sm" style={{ color: colors.text.tertiary, fontSize: '15px' }}>
                {activeView === 'dashboard' && 'Your productivity overview'}
                {activeView === 'calendar' && 'Events and scheduling'}
                {activeView === 'todos' && 'Manage your tasks'}
                {activeView === 'shopping' && 'Smart grocery management'}
                {activeView === 'meals' && 'Weekly meal planning'}
              </p>
            </div>

            <div className="flex items-center space-x-3">
              <NotificationBell />
              <ModeSwitch />
            </div>
          </div>
        </header>
        )}

        {/* Desktop Header - Only on large screens, hide for Together, Notes, Journal, Habits, Goals, Tasks, Shopping, Meals, Assistant, and Calendar pages */}
        {isDesktop && activeView !== 'together' && activeView !== 'notes' && activeView !== 'journal' && activeView !== 'habits' && activeView !== 'lifegoals' && activeView !== 'todos' && activeView !== 'shopping' && activeView !== 'meals' && activeView !== 'assistant' && activeView !== 'calendar' && (
          <header
            className="flex backdrop-blur-sm border-b px-8 py-6"
            style={{
            backgroundColor: colors.bg.primary,
            borderBottom: `1px solid ${colors.border.light}`
          }}
        >
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center space-x-6">
              <div className="flex flex-col">
                <h2
                  className="text-2xl font-bold font-display leading-tight"
                  style={{
                    background: `linear-gradient(135deg, ${colors.accent.start} 0%, ${colors.accent.end} 100%)`,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  {activeView === 'todos' ? 'Tasks' : activeView.charAt(0).toUpperCase() + activeView.slice(1)}
                </h2>
                <p className="text-sm font-medium" style={{ color: colors.text.tertiary }}>
                  {activeView === 'dashboard' && 'Your productivity overview'}
                  {activeView === 'calendar' && 'Events and scheduling'}
                  {activeView === 'todos' && 'Manage your tasks'}
                  {activeView === 'shopping' && 'Smart grocery management'}
                  {activeView === 'meals' && 'Weekly meal planning'}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="hidden sm:flex items-center space-x-3 px-4 py-2 rounded-xl" style={{ backgroundColor: colors.badge.bg, border: `1px solid ${colors.badge.text}33` }}>
                <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: colors.accent.start }}></div>
                <div className="text-sm font-medium" style={{ color: colors.badge.text }}>
                  {new Date().toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric'
                  })}
                </div>
              </div>
              <NotificationBell />
              <ModeSwitch />
              <VoiceLauncher />
            </div>
          </div>
        </header>
        )}

        {/* Main Content */}
        <main
          ref={mainRef}
          className="flex-1 overflow-y-auto lg:p-8"
          style={{
            backgroundColor: colors.bg.primary,
            paddingBottom: '100px', // Space for mobile tab bar
          }}
          role="main"
          tabIndex={0}
          aria-labelledby="page-title"
        >
          <h1 id="page-title" className="sr-only">
            {activeView === 'todos' ? 'Tasks' : activeView} page
          </h1>
          <div className="lg:max-w-7xl lg:mx-auto">
            {children}
          </div>
        </main>
      </div>

      {/* iOS Bottom Tab Bar - Only on Mobile */}
      <div className="lg:hidden">
        <TabBar />
      </div>

      <Toast toast={toast} onDismiss={dismissToast} />
    </div>
  );
}
