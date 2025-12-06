/**
 * Distribute View Component
 * UI for smart store distribution configuration
 */

import React from 'react';
import { Zap, ArrowRight, DollarSign, Award, Navigation, Target, Star } from 'lucide-react';
import type { ShoppingItem, Store } from '../../types';
import type { DistributionStrategy } from '../../services/storeDistribution';
import { CATEGORY_ICONS, STORE_TYPES } from '../../constants';

interface DistributeViewProps {
  items: ShoppingItem[];
  stores: Store[];
  distributionStrategy: DistributionStrategy;
  onStrategyChange: (strategy: DistributionStrategy) => void;
  onDistribute: () => void;
}

export function DistributeView({
  items,
  stores,
  distributionStrategy,
  onStrategyChange,
  onDistribute,
}: DistributeViewProps) {
  const unpurchasedItems = items.filter(item => !item.purchased);

  return (
    <div className="p-6">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Smart Store Distribution
          </h3>
          <p className="text-gray-600">
            AI will analyze your items and automatically assign them to the best stores
          </p>
        </div>

        <div className="space-y-6">
          {/* Current Master List Preview */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-3">Items to Distribute</h4>
            {unpurchasedItems.length === 0 ? (
              <p className="text-gray-500 text-sm">No items in master list to distribute</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {unpurchasedItems.slice(0, 6).map(item => (
                  <div key={item.id} className="flex items-center space-x-2 text-sm">
                    <span>{CATEGORY_ICONS[item.category]}</span>
                    <span className="text-gray-900">{item.name}</span>
                    {item.assignedStore && (
                      <span className="text-purple-600 text-xs">
                        (Preferred: {stores.find(s => s.id === item.assignedStore)?.name})
                      </span>
                    )}
                  </div>
                ))}
                {unpurchasedItems.length > 6 && (
                  <div className="text-xs text-gray-500 col-span-2 text-center">
                    +{unpurchasedItems.length - 6} more items
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Distribution Strategy */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Distribution Strategy
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { value: 'price', label: 'Best Price', icon: DollarSign, desc: 'Minimize cost' },
                { value: 'quality', label: 'Best Quality', icon: Award, desc: 'Premium items' },
                { value: 'convenience', label: 'Convenience', icon: Navigation, desc: 'Nearby stores' },
                { value: 'mixed', label: 'Balanced', icon: Target, desc: 'Best overall' }
              ].map(strategy => (
                <button
                  key={strategy.value}
                  onClick={() => onStrategyChange(strategy.value as DistributionStrategy)}
                  className={`p-3 border-2 rounded-lg text-center transition-all ${
                    distributionStrategy === strategy.value
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300 text-gray-700'
                  }`}
                >
                  <strategy.icon size={20} className="mx-auto mb-1" />
                  <div className="text-sm font-medium">{strategy.label}</div>
                  <div className="text-xs text-gray-500">{strategy.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Available Stores Preview */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Available Stores
            </label>
            <div className="grid grid-cols-2 gap-3">
              {stores.map(store => (
                <div key={store.id} className="p-3 border rounded-lg bg-white">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">{STORE_TYPES[store.type]}</span>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 text-sm">{store.name}</h4>
                      <div className="flex items-center space-x-2 text-xs text-gray-500">
                        <span>{store.distance}mi</span>
                        <div className="flex items-center">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              size={10}
                              className={i < store.preferences.overallRating ? 'text-yellow-400 fill-current' : 'text-gray-300'}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Distribution Button */}
          <div className="text-center">
            <button
              onClick={onDistribute}
              disabled={unpurchasedItems.length === 0}
              className="btn-primary flex items-center space-x-2 mx-auto disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Zap size={16} />
              <span>Auto-Distribute Items</span>
              <ArrowRight size={16} />
            </button>
            <p className="text-xs text-gray-500 mt-2">
              AI will create store-specific lists based on your strategy and item preferences
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
