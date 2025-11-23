/**
 * Style helper utilities
 * Returns Tailwind classes for UI elements
 */

import React from 'react';
import { Briefcase, Heart, Book, Lightbulb, Target, CheckSquare } from 'lucide-react';

export const getPriorityColor = (priority: string): string => {
  switch (priority) {
    case 'urgent':
      return 'text-red-600 bg-red-100 border-red-200';
    case 'high':
      return 'text-orange-600 bg-orange-100 border-orange-200';
    case 'medium':
      return 'text-yellow-600 bg-yellow-100 border-yellow-200';
    case 'low':
      return 'text-green-600 bg-green-100 border-green-200';
    default:
      return 'text-gray-600 bg-gray-100 border-gray-200';
  }
};

export const getStatusColor = (status: string): string => {
  switch (status) {
    case 'completed':
      return 'text-green-600 bg-green-100';
    case 'in_progress':
      return 'text-blue-600 bg-blue-100';
    case 'cancelled':
      return 'text-red-600 bg-red-100';
    default:
      return 'text-gray-600 bg-gray-100';
  }
};

export const getCategoryIcon = (category: string): React.ReactElement => {
  switch (category) {
    case 'work':
      return <Briefcase className="w-4 h-4" />;
    case 'personal':
      return <Heart className="w-4 h-4" />;
    case 'learning':
      return <Book className="w-4 h-4" />;
    case 'creative':
      return <Lightbulb className="w-4 h-4" />;
    case 'health':
      return <Target className="w-4 h-4" />;
    default:
      return <CheckSquare className="w-4 h-4" />;
  }
};
