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
  Plane,
  Map,
  MessageCircle,
  LayoutGrid,
  Utensils,
  Shield
} from 'lucide-react';
import { useComposedStore } from '../stores/useComposedStore';
import { useToast } from '../hooks/useToast';
import Toast from './Toast';
import ThemeToggle from './ThemeToggle';
import VoiceLauncher from './VoiceLauncher';
import PremiumLogo from './PremiumLogo';
import ModeSwitch, { useAppMode } from './ModeSwitch';
import { NotificationBell } from './notifications';
import clsx from 'clsx';
import type { ViewKey } from '../stores/slices/uiSlice';

const navigation = [
  { name: 'Dashboard', icon: Home, view: 'dashboard' as const, path: '/', section: 'main' },
  { name: 'AI Assistant', icon: MessageCircle, view: 'assistant' as const, path: '/assistant', section: 'main' },
  { name: 'Calendar', icon: Calendar, view: 'calendar' as const, path: '/calendar', section: 'main' },
  { name: 'Task Scheduler', icon: LayoutGrid, view: 'scheduler' as const, path: '/scheduler', section: 'main' },
  { name: 'Focus', icon: Timer, view: 'focus' as const, path: '/focus', section: 'main' },
  { name: 'Habits', icon: Target, view: 'habits' as const, path: '/habits', section: 'productivity' },
  { name: 'Tasks', icon: Target, view: 'todos' as const, path: '/todos', section: 'productivity' },
  { name: 'Notes', icon: FileText, view: 'notes' as const, path: '/notes', section: 'productivity' },
  { name: 'Projects', icon: FolderOpen, view: 'projects' as const, path: '/projects', section: 'productivity' },
  { name: 'Journal', icon: BookOpen, view: 'journal' as const, path: '/journal', section: 'wellbeing' },
  { name: 'Skincare', icon: Sparkles, view: 'skincare' as const, path: '/skincare', section: 'wellbeing' },
  { name: 'Travel', icon: MapPin, view: 'travel' as const, path: '/travel', section: 'personal' },
  { name: 'Visa Calculator', icon: Plane, view: 'visa' as const, path: '/travel/visa', section: 'personal' },
  { name: 'Trip Planner', icon: Map, view: 'trip-planner' as const, path: '/travel/trip-planner', section: 'personal' },
  { name: 'Finances', icon: DollarSign, view: 'finances' as const, path: '/finances', section: 'personal' },
  { name: 'Shopping', icon: ShoppingCart, view: 'shopping' as const, path: '/shopping', section: 'personal' },
  { name: 'Meals', icon: ChefHat, view: 'meals' as const, path: '/meals', section: 'personal' },
  { name: 'Nutrition', icon: Utensils, view: 'nutrition' as const, path: '/nutrition', section: 'wellbeing' },
  { name: 'Goals', icon: Trophy, view: 'goals' as const, path: '/goals', section: 'personal' },
  { name: 'Shared', icon: Users, view: 'shared' as const, path: '/shared', section: 'personal' },
  { name: 'Privacy Settings', icon: Shield, view: 'privacy-settings' as const, path: '/settings/privacy', section: 'settings' },
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
  if (pathname.startsWith('/settings/privacy')) return 'privacy-settings';

  return 'dashboard';
};

const navigationSections = {
  main: { label: 'Main', items: navigation.filter(item => item.section === 'main') },
  productivity: { label: 'Productivity', items: navigation.filter(item => item.section === 'productivity') },
  wellbeing: { label: 'Wellbeing', items: navigation.filter(item => item.section === 'wellbeing') },
  personal: { label: 'Personal', items: navigation.filter(item => item.section === 'personal') },
  settings: { label: 'Settings', items: navigation.filter(item => item.section === 'settings') },
};

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const { sidebarCollapsed, setSidebarCollapsed } = useComposedStore();
  const { toast, dismissToast } = useToast();
  const { mode } = useAppMode();

  // Derive activeView from current URL path
  const activeView = getViewFromPath(location.pathname);

  // In voice mode and on assistant page, show full-screen assistant
  const isVoiceModeAssistant = mode === 'voice' && activeView === 'assistant';

  // Voice mode: full-screen assistant without navigation
  if (isVoiceModeAssistant) {
    return (
      <div className="h-screen flex flex-col bg-gradient-to-br from-slate-50 via-orange-50 to-slate-50">
        {/* Floating mode switch */}
        <div className="absolute top-4 right-4 z-50">
          <ModeSwitch />
        </div>
        {children}
        <Toast toast={toast} onDismiss={dismissToast} />
      </div>
    );
  }

  // Visual mode: traditional dashboard layout
  return (
    <div className="h-screen flex bg-secondary overflow-x-hidden">
      {/* Mobile sidebar overlay */}
      {!sidebarCollapsed && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300"
          onClick={() => setSidebarCollapsed(true)}
        />
      )}

      {/* Premium Sidebar */}
      <aside
        className={clsx(
          'bg-white dark:bg-[#0f1419] backdrop-blur-xl border-r border-gray-200 dark:border-gray-800 transition-all duration-300 ease-out z-50 shadow-lg',
          sidebarCollapsed ? 'w-16 lg:w-20' : 'w-72 sm:w-80 lg:w-80',
          'fixed lg:relative inset-y-0 left-0',
          !sidebarCollapsed ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100vh',
          maxHeight: '100vh',
          overflow: 'hidden',
          pointerEvents: 'auto'
        }}
      >

        {/* Elegant Header */}
        <div
          className="flex items-center justify-between px-4 sm:px-6 border-b border-gray-200 dark:border-gray-800"
          style={{ height: '5rem', minHeight: '5rem', flexShrink: 0 }}
        >
          <PremiumLogo collapsed={sidebarCollapsed} />
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-2 sm:p-2.5 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-blue-500 dark:hover:bg-blue-600 hover:text-white transition-all duration-200 text-gray-700 dark:text-gray-300 hover:scale-105 active:scale-95"
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {sidebarCollapsed ? <Menu size={16} /> : <X size={16} />}
          </button>
        </div>

        {/* Sophisticated Navigation */}
        <nav
          className="px-3 sm:px-4 py-4 sm:py-6"
          role="navigation"
          aria-label="Main navigation"
          style={{
            flex: '1 1 auto',
            overflowY: 'scroll',
            overflowX: 'hidden',
            minHeight: 0
          }}
        >
          <div className="space-y-6 sm:space-y-8">
            {Object.entries(navigationSections).map(([sectionKey, section]) => (
              <div key={sectionKey}>
                {!sidebarCollapsed && (
                  <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-500 uppercase tracking-wider mb-3 px-3">
                    {section.label}
                  </h3>
                )}

                <ul className="space-y-1" style={{ listStyle: 'none' }}>
                  {section.items.map((item, _index) => {
                    const isActive = location.pathname === item.path ||
                                   (item.path !== '/' && location.pathname.startsWith(item.path));

                    return (
                      <li key={item.name} style={{ listStyle: 'none' }}>
                        <Link
                          to={item.path}
                          style={{ textDecoration: 'none' }}
                          className={clsx(
                            'w-full flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group relative',
                            isActive
                              ? 'bg-blue-500 dark:bg-blue-600 text-white shadow-sm'
                              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                          )}
                          aria-current={isActive ? 'page' : undefined}
                          title={sidebarCollapsed ? item.name : undefined}
                        >
                          <item.icon
                            className={clsx(
                              'flex-shrink-0 transition-all duration-200',
                              sidebarCollapsed ? 'mx-auto' : 'mr-3',
                              isActive
                                ? 'text-white'
                                : 'text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white'
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
                                  className="text-white/80 transition-all duration-300"
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

        {/* Footer with theme toggle */}
        <div
          className="p-4 border-t border-gray-200 dark:border-gray-800"
          style={{
            flexShrink: 0,
            minHeight: 'fit-content'
          }}
        >
          <ThemeToggle />
        </div>
      </aside>

      {/* Elegant Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Premium Header */}
        <header className="bg-[var(--bg-secondary)] backdrop-blur-sm border-b border-[var(--border-primary)] px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              {/* Mobile menu button */}
              <button
                onClick={() => setSidebarCollapsed(false)}
                className="lg:hidden p-2.5 rounded-xl bg-[var(--color-primary-100)]/30 dark:bg-[var(--color-primary-800)]/30 hover:bg-[var(--color-primary-500)] hover:text-white transition-all duration-300 text-[var(--color-primary-700)] dark:text-white"
                aria-label="Open sidebar"
              >
                <Menu size={20} />
              </button>

              <div className="flex flex-col">
                <h2 className="text-2xl font-bold text-[var(--text-primary)] font-display leading-tight">
                  {activeView === 'todos' ? 'Tasks' : activeView.charAt(0).toUpperCase() + activeView.slice(1)}
                </h2>
                <p className="text-sm text-[var(--text-secondary)] font-medium">
                  {activeView === 'dashboard' && 'Your productivity overview'}
                  {activeView === 'calendar' && 'Events and scheduling'}
                  {activeView === 'todos' && 'Manage your tasks'}
                  {activeView === 'focus' && 'Deep work sessions'}
                  {activeView === 'habits' && 'Build lasting routines'}
                  {activeView === 'notes' && 'Capture your thoughts'}
                  {activeView === 'projects' && 'Project tracking and development overview'}
                  {activeView === 'journal' && 'Daily reflections'}
                  {activeView === 'travel' && 'Plan and organize your trips'}
                  {activeView === 'visa' && 'Calculate visa-free travel destinations'}
                  {activeView === 'trip-planner' && 'Plan multi-country trips and calculate visa costs'}
                  {activeView === 'finances' && 'Track income, expenses, and budgets'}
                  {activeView === 'shopping' && 'Smart grocery management'}
                  {activeView === 'meals' && 'Weekly meal planning'}
                  {activeView === 'nutrition' && 'Track your meals and nutrition'}
                  {activeView === 'goals' && 'Achieve your dreams'}
                  {activeView === 'shared' && 'Collaborate and share'}
                  {activeView === 'privacy-settings' && 'Control your data sharing preferences'}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="hidden sm:flex items-center space-x-3 px-4 py-2 bg-gradient-to-r from-accent-primary/10 to-accent-secondary/10 rounded-xl border border-accent-primary/20">
                <div className="w-2 h-2 bg-accent-primary rounded-full animate-pulse"></div>
                <div className="text-sm font-medium text-accent-primary">
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

        {/* Premium Page Content */}
        <main
          className="flex-1 overflow-y-auto p-8 bg-gradient-to-br from-secondary via-tertiary/30 to-secondary"
          role="main"
          aria-labelledby="page-title"
        >
          <h1 id="page-title" className="sr-only">
            {activeView === 'todos' ? 'Tasks' : activeView} page
          </h1>
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
      <Toast toast={toast} onDismiss={dismissToast} />
    </div>
  );
}
