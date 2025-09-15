import { 
  Home, 
  Target, 
  FileText, 
  CheckSquare, 
  FolderOpen, 
  BookOpen, 
  Heart,
  Menu,
  X,
  Calendar,
  Timer,
  Smile,
  Trophy,
  Users,
  ChevronRight,
  Droplets,
  ShoppingCart,
  ChefHat,
  MapPin,
  DollarSign
} from 'lucide-react';
import { useAppStore } from '../stores/useAppStore';
import ThemeToggle from './ThemeToggle';
import PremiumLogo from './PremiumLogo';
import clsx from 'clsx';

const navigation = [
  { name: 'Dashboard', icon: Home, view: 'dashboard' as const, section: 'main' },
  { name: 'Calendar', icon: Calendar, view: 'calendar' as const, section: 'main' },
  { name: 'Tasks', icon: CheckSquare, view: 'todos' as const, section: 'main' },
  { name: 'Focus', icon: Timer, view: 'focus' as const, section: 'main' },
  { name: 'Habits', icon: Target, view: 'habits' as const, section: 'productivity' },
  { name: 'Notes', icon: FileText, view: 'notes' as const, section: 'productivity' },
  { name: 'Projects', icon: FolderOpen, view: 'projects' as const, section: 'productivity' },
  { name: 'Journal', icon: BookOpen, view: 'journal' as const, section: 'wellbeing' },
  { name: 'Mood', icon: Smile, view: 'mood' as const, section: 'wellbeing' },
  { name: '75 Hard', icon: Trophy, view: 'seventy-five-hard' as const, section: 'wellbeing' },
  { name: 'Period', icon: Droplets, view: 'period' as const, section: 'wellbeing' },
  { name: 'Travel', icon: MapPin, view: 'travel' as const, section: 'personal' },
  { name: 'Finances', icon: DollarSign, view: 'finances' as const, section: 'personal' },
  { name: 'Shopping', icon: ShoppingCart, view: 'shopping' as const, section: 'personal' },
  { name: 'Meals', icon: ChefHat, view: 'meals' as const, section: 'personal' },
  { name: 'Goals', icon: Trophy, view: 'goals' as const, section: 'personal' },
  { name: 'Shared', icon: Users, view: 'shared' as const, section: 'personal' },
  { name: 'Personal', icon: Heart, view: 'personal' as const, section: 'personal' },
];

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
  const { activeView, setActiveView, sidebarCollapsed, setSidebarCollapsed } = useAppStore();

  return (
    <div className="h-screen flex bg-secondary overflow-hidden">
      {/* Mobile sidebar overlay */}
      {!sidebarCollapsed && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300"
          onClick={() => setSidebarCollapsed(true)}
        />
      )}

      {/* Premium Sidebar */}
      <div className={clsx(
        'bg-primary/95 backdrop-blur-xl border-r border-primary/10 transition-all duration-300 ease-out relative z-50',
        'flex flex-col',
        sidebarCollapsed ? 'w-16 lg:w-20' : 'w-72 sm:w-80 lg:w-80',
        'fixed lg:relative inset-y-0 left-0',
        !sidebarCollapsed ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      )}>
        
        {/* Elegant Header */}
        <div className="h-16 sm:h-20 flex items-center justify-between px-4 sm:px-6 border-b border-primary/10">
          <PremiumLogo collapsed={sidebarCollapsed} />
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-2 sm:p-2.5 rounded-lg sm:rounded-xl bg-tertiary/50 hover:bg-accent-primary hover:text-white transition-all duration-300 text-secondary hover:scale-105 active:scale-95"
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {sidebarCollapsed ? <Menu size={16} /> : <X size={16} />}
          </button>
        </div>

        {/* Sophisticated Navigation */}
        <nav className="flex-1 px-3 sm:px-4 py-4 sm:py-6 overflow-y-auto" role="navigation" aria-label="Main navigation">
          <div className="space-y-6 sm:space-y-8">
            {Object.entries(navigationSections).map(([sectionKey, section]) => (
              <div key={sectionKey}>
                {!sidebarCollapsed && (
                  <h3 className="text-xs font-semibold text-muted uppercase tracking-wider mb-4 px-3">
                    {section.label}
                  </h3>
                )}
                
                <ul className="space-y-1" style={{ listStyle: 'none' }}>
                  {section.items.map((item, index) => (
                    <li key={item.name} style={{ listStyle: 'none' }}>
                      <button
                        onClick={() => setActiveView(item.view)}
                        className={clsx(
                          'w-full flex items-center px-3 py-3 rounded-xl text-sm font-medium transition-all duration-300 group relative',
                          'hover:scale-[1.02] active:scale-[0.98]',
                          activeView === item.view
                            ? 'bg-accent-gradient text-white shadow-lg shadow-accent-primary/25'
                            : 'text-black hover:bg-tertiary/50 hover:text-black'
                        )}
                        aria-current={activeView === item.view ? 'page' : undefined}
                        title={sidebarCollapsed ? item.name : undefined}
                      >
                        <item.icon 
                          className={clsx(
                            'flex-shrink-0 transition-all duration-300', 
                            sidebarCollapsed ? 'mx-auto' : 'mr-3',
                            activeView === item.view 
                              ? 'text-white' 
                              : 'text-tertiary group-hover:text-accent-primary'
                          )} 
                          size={20}
                          aria-hidden="true"
                        />
                        
                        {!sidebarCollapsed && (
                          <>
                            <span className="transition-all duration-300 flex-1 text-left">
                              {item.name}
                            </span>
                            
                            {activeView === item.view && (
                              <ChevronRight 
                                size={16} 
                                className="text-white/80 transition-all duration-300"
                              />
                            )}
                          </>
                        )}
                        
                        {sidebarCollapsed && <span className="sr-only">{item.name}</span>}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </nav>
        
        {/* Footer with theme toggle */}
        <div className="p-4 border-t border-primary/10">
          <ThemeToggle />
        </div>
      </div>

      {/* Elegant Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Premium Header */}
        <header className="bg-primary/50 backdrop-blur-sm border-b border-primary/10 px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              {/* Mobile menu button */}
              <button
                onClick={() => setSidebarCollapsed(false)}
                className="lg:hidden p-2.5 rounded-xl bg-tertiary/50 hover:bg-accent-primary hover:text-white transition-all duration-300 text-secondary"
                aria-label="Open sidebar"
              >
                <Menu size={20} />
              </button>
              
              <div className="flex flex-col">
                <h2 className="text-2xl font-bold text-primary font-display leading-tight">
                  {activeView === 'todos' ? 'Tasks' : activeView.charAt(0).toUpperCase() + activeView.slice(1)}
                </h2>
                <p className="text-sm text-tertiary font-medium">
                  {activeView === 'dashboard' && 'Your productivity overview'}
                  {activeView === 'calendar' && 'Events and scheduling'}
                  {activeView === 'todos' && 'Manage your tasks'}
                  {activeView === 'focus' && 'Deep work sessions'}
                  {activeView === 'habits' && 'Build lasting routines'}
                  {activeView === 'notes' && 'Capture your thoughts'}
                  {activeView === 'projects' && 'Project tracking and development overview'}
                  {activeView === 'journal' && 'Daily reflections'}
                  {activeView === 'mood' && 'Track your wellbeing'}
                  {activeView === 'period' && 'Menstrual cycle tracking'}
                  {activeView === 'travel' && 'Plan and organize your trips'}
                  {activeView === 'finances' && 'Track income, expenses, and budgets'}
                  {activeView === 'shopping' && 'Smart grocery management'}
                  {activeView === 'meals' && 'Weekly meal planning'}
                  {activeView === 'goals' && 'Achieve your dreams'}
                  {activeView === 'shared' && 'Collaborate and share'}
                  {activeView === 'personal' && 'Life management'}
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
    </div>
  );
}