import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, ListTodo, ShoppingCart, Utensils, MoreHorizontal } from 'lucide-react';

/**
 * iOS-style bottom tab bar navigation
 * Implements the terracotta accent design system
 */

interface TabItem {
  name: string;
  icon: React.ElementType;
  path: string;
  label: string;
}

const tabs: TabItem[] = [
  { name: 'Home', icon: Home, path: '/', label: 'Home' },
  { name: 'Tasks', icon: ListTodo, path: '/todos', label: 'Tasks' },
  { name: 'Shopping', icon: ShoppingCart, path: '/shopping', label: 'Shopping' },
  { name: 'Meals', icon: Utensils, path: '/meals', label: 'Meals' },
  { name: 'More', icon: MoreHorizontal, path: '/more', label: 'More' },
];

export const TabBar: React.FC = () => {
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50"
      style={{
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(0, 0, 0, 0.1)',
        paddingBottom: '24px',
        paddingTop: '8px',
      }}
    >
      <nav
        className="flex items-center justify-around px-4"
        role="navigation"
        aria-label="Bottom tab navigation"
      >
        {tabs.map((tab) => {
          const active = isActive(tab.path);
          const Icon = tab.icon;

          return (
            <Link
              key={tab.name}
              to={tab.path}
              className="flex flex-col items-center gap-1 px-3 py-1 transition-all duration-200"
              aria-label={tab.label}
              aria-current={active ? 'page' : undefined}
            >
              {/* Icon with gradient background when active */}
              <div
                className="flex items-center justify-center rounded-lg transition-all duration-200"
                style={{
                  width: '28px',
                  height: '28px',
                  background: active
                    ? 'linear-gradient(135deg, #D4A574 0%, #C18B5E 100%)'
                    : 'transparent',
                }}
              >
                <Icon
                  size={18}
                  style={{
                    color: active ? '#FFFFFF' : '#C7C7CC',
                    strokeWidth: 2.5,
                  }}
                  aria-hidden="true"
                />
              </div>

              {/* Label */}
              <span
                className="text-[10px] font-semibold transition-colors duration-200"
                style={{
                  color: active ? '#C18B5E' : '#8E8E93',
                  letterSpacing: '0.01em',
                }}
              >
                {tab.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
};
