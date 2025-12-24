/**
 * QuickActionsGridV2 Component
 * Grid of quick action buttons for common tasks
 */

import React from 'react';
import { motion } from 'framer-motion';
import { 
  Plus, 
  Calendar, 
  Target, 
  CheckSquare,
  BookOpen,
  Utensils,
  DollarSign,
  Heart
} from 'lucide-react';
import { QuickActionButtonV2 } from './QuickActionButtonV2';
import { useNavigate } from 'react-router-dom';

export interface QuickActionsGridV2Props {
  className?: string;
}

export const QuickActionsGridV2: React.FC<QuickActionsGridV2Props> = ({ className = '' }) => {
  const navigate = useNavigate();

  const actions = [
    {
      icon: Plus,
      label: 'New Task',
      onClick: () => navigate('/scheduler'),
      variant: 'primary' as const,
    },
    {
      icon: Calendar,
      label: 'Calendar',
      onClick: () => navigate('/calendar'),
      variant: 'primary' as const,
    },
    {
      icon: Target,
      label: 'Habits',
      onClick: () => navigate('/habits'),
      variant: 'accent' as const,
    },
    {
      icon: BookOpen,
      label: 'Journal',
      onClick: () => navigate('/journal'),
      variant: 'secondary' as const,
    },
    {
      icon: Utensils,
      label: 'Meals',
      onClick: () => navigate('/meal-planning'),
      variant: 'accent' as const,
    },
    {
      icon: DollarSign,
      label: 'Finances',
      onClick: () => navigate('/finances'),
      variant: 'secondary' as const,
    },
    {
      icon: Heart,
      label: 'Health',
      onClick: () => navigate('/nutrition'),
      variant: 'primary' as const,
    },
    {
      icon: CheckSquare,
      label: 'Focus',
      onClick: () => navigate('/focus'),
      variant: 'accent' as const,
    },
  ];

  return (
    <div className={className}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Quick Actions
        </h2>
        
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {actions.map((action, index) => (
            <motion.div
              key={action.label}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05, duration: 0.3 }}
            >
              <QuickActionButtonV2
                icon={action.icon}
                label={action.label}
                onClick={action.onClick}
                variant={action.variant}
              />
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default QuickActionsGridV2;

