import React from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  Target,
  FileText,
  FolderOpen,
  BookOpen,
  Timer,
  Trophy,
  Users,
  MapPin,
  DollarSign,
  Sparkles,
  MessageCircle,
  LayoutGrid,
  Plane,
  Heart,
  Settings,
  ChevronRight
} from 'lucide-react';

interface MenuItem {
  name: string;
  icon: React.ElementType;
  path: string;
  section: string;
}

const menuItems: MenuItem[] = [
  { name: 'Dashboard', icon: Target, path: '/', section: 'Main' },
  { name: 'AI Assistant', icon: MessageCircle, path: '/assistant', section: 'Main' },
  { name: 'Calendar', icon: Calendar, path: '/calendar', section: 'Main' },
  { name: 'Task Scheduler', icon: LayoutGrid, path: '/scheduler', section: 'Main' },
  { name: 'Focus', icon: Timer, path: '/focus', section: 'Main' },
  { name: 'Habits', icon: Target, path: '/habits', section: 'Productivity' },
  { name: 'Notes', icon: FileText, path: '/notes', section: 'Productivity' },
  { name: 'Projects', icon: FolderOpen, path: '/projects', section: 'Productivity' },
  { name: 'Journal', icon: BookOpen, path: '/journal', section: 'Wellbeing' },
  { name: 'Self Care', icon: Sparkles, path: '/self-care', section: 'Wellbeing' },
  { name: 'Travel', icon: MapPin, path: '/travel', section: 'Personal' },
  { name: 'Visa Calculator', icon: Plane, path: '/travel/visa', section: 'Personal' },
  { name: 'Finances', icon: DollarSign, path: '/finances', section: 'Personal' },
  { name: 'Goals', icon: Trophy, path: '/goals', section: 'Personal' },
  { name: 'Together', icon: Heart, path: '/together', section: 'Personal' },
  { name: 'Shared', icon: Users, path: '/shared', section: 'Personal' },
];

// Group items by section
const groupedItems = menuItems.reduce((acc, item) => {
  if (!acc[item.section]) {
    acc[item.section] = [];
  }
  acc[item.section].push(item);
  return acc;
}, {} as Record<string, MenuItem[]>);

export default function More() {
  return (
    <div style={{ backgroundColor: '#FAF8F5', minHeight: '100vh' }}>
      <div className="px-6 py-4">
        {Object.entries(groupedItems).map(([section, items]) => (
          <div key={section} className="mb-6">
            <h3
              className="text-xs font-semibold uppercase tracking-wider mb-3 px-3"
              style={{ color: '#9B8B7A' }}
            >
              {section}
            </h3>
            <div
              className="rounded-2xl overflow-hidden"
              style={{
                backgroundColor: '#FFFFFF',
                boxShadow: '0 2px 8px rgba(139, 111, 71, 0.08)',
              }}
            >
              {items.map((item, index) => {
                const Icon = item.icon;
                const isLast = index === items.length - 1;

                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className="flex items-center justify-between px-5 py-4 transition-colors"
                    style={{
                      borderBottom: isLast ? 'none' : '1px solid #F5F0EA',
                      minHeight: '60px',
                    }}
                  >
                    <div className="flex items-center space-x-4">
                      <div
                        className="flex items-center justify-center rounded-lg"
                        style={{
                          width: '36px',
                          height: '36px',
                          background: 'rgba(212, 165, 116, 0.15)',
                        }}
                      >
                        <Icon size={20} style={{ color: '#C18B5E' }} aria-hidden="true" />
                      </div>
                      <span
                        className="font-medium"
                        style={{
                          fontSize: '17px',
                          color: '#5C4A3A',
                        }}
                      >
                        {item.name}
                      </span>
                    </div>
                    <ChevronRight size={20} style={{ color: '#C7C7CC' }} aria-hidden="true" />
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
