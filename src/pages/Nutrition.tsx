/**
 * Nutrition Page
 * Food logging with photo upload, AI nutrition analysis, and goal tracking
 */

import React, { useState } from 'react';
import { Utensils, BarChart3, Settings } from 'lucide-react';
import { NutritionTracker } from '@/components/nutrition/NutritionTracker';
import { NutritionDashboard } from '@/components/nutrition/NutritionDashboard';

type Tab = 'tracker' | 'dashboard';

const Nutrition: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('tracker');

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50">
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Utensils className="w-7 h-7 text-orange-500" />
              Nutrition
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Track your meals and hit your nutrition goals
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 p-1 bg-gray-100 rounded-xl">
          <button
            onClick={() => setActiveTab('tracker')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-medium transition-all ${
              activeTab === 'tracker'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Utensils className="w-4 h-4" />
            Log Food
          </button>
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-medium transition-all ${
              activeTab === 'dashboard'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            Dashboard
          </button>
        </div>

        {/* Content */}
        {activeTab === 'tracker' && <NutritionTracker />}
        {activeTab === 'dashboard' && <NutritionDashboard />}
      </div>
    </div>
  );
};

export default Nutrition;

