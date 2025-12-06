/**
 * Empty State Component
 *
 * Shown when user has no active challenge.
 * - Explains what 75 Hard is
 * - Shows the rules
 * - Call-to-action to start challenge
 */

import React from 'react';
import { Trophy, Target, Flame } from 'lucide-react';

interface EmptyStateProps {
  onStart: () => void;
}

export default function EmptyState({ onStart }: EmptyStateProps) {
  return (
    <div className="max-w-3xl mx-auto">
      {/* Hero */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-primary-100 dark:bg-primary-900/30 rounded-full mb-4">
          <Trophy className="w-10 h-10 text-primary-600 dark:text-primary-400" />
        </div>
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
          75 Hard Challenge
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400">
          A mental toughness program to transform your life
        </p>
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-3 mb-3">
            <Target className="w-6 h-6 text-primary-600 dark:text-primary-400" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              What is 75 Hard?
            </h2>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            A transformative mental toughness program where you complete daily tasks for 75 consecutive days.
            No cheat days, no compromises.
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-3 mb-3">
            <Flame className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              The Rules
            </h2>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Miss a single task? Start over from Day 1. This program is about building mental resilience and discipline.
          </p>
        </div>
      </div>

      {/* Default tasks */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Standard Daily Tasks
        </h2>
        <ul className="space-y-3">
          <li className="flex items-start gap-3">
            <div className="flex-shrink-0 w-6 h-6 bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-full flex items-center justify-center text-sm font-semibold">
              1
            </div>
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">Follow a Diet</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">No cheat meals or alcohol</p>
            </div>
          </li>
          <li className="flex items-start gap-3">
            <div className="flex-shrink-0 w-6 h-6 bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-full flex items-center justify-center text-sm font-semibold">
              2
            </div>
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">Workout Twice Daily</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">45 minutes each, one must be outdoors</p>
            </div>
          </li>
          <li className="flex items-start gap-3">
            <div className="flex-shrink-0 w-6 h-6 bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-full flex items-center justify-center text-sm font-semibold">
              3
            </div>
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">Drink 1 Gallon of Water</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Stay hydrated throughout the day</p>
            </div>
          </li>
          <li className="flex items-start gap-3">
            <div className="flex-shrink-0 w-6 h-6 bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-full flex items-center justify-center text-sm font-semibold">
              4
            </div>
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">Read 10 Pages</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Non-fiction or personal development</p>
            </div>
          </li>
          <li className="flex items-start gap-3">
            <div className="flex-shrink-0 w-6 h-6 bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-full flex items-center justify-center text-sm font-semibold">
              5
            </div>
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">Take Progress Photo</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Track your transformation</p>
            </div>
          </li>
        </ul>

        <p className="text-sm text-gray-500 dark:text-gray-400 mt-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          💡 <strong>Pro tip:</strong> You can customize these tasks before starting!
        </p>
      </div>

      {/* CTA */}
      <div className="text-center">
        <button
          onClick={onStart}
          className="inline-flex items-center gap-2 px-8 py-4 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-semibold text-lg transition-colors shadow-lg hover:shadow-xl"
        >
          <Trophy className="w-6 h-6" />
          Start 75 Hard Challenge
        </button>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-3">
          Ready to transform yourself? Let's begin!
        </p>
      </div>
    </div>
  );
}
