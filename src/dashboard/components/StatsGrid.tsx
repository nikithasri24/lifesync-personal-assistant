import React from 'react';
import { CheckSquare } from 'lucide-react';

interface StatsCard {
  title: string;
  value: number | string;
  icon: typeof CheckSquare;
  color: string;
  onClick: () => void;
}

interface StatsGridProps {
  cards: StatsCard[];
}

/**
 * Grid of statistics cards with click handlers
 */
export function StatsGrid({ cards }: StatsGridProps): React.ReactElement {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
      {cards.map((card, index) => (
        <div
          key={index}
          onClick={card.onClick}
          className="group card hover:shadow-xl hover:-translate-y-1 sm:hover:-translate-y-2 transition-all duration-300 cursor-pointer animate-fade-in active:scale-95"
          style={{ animationDelay: `${index * 100}ms` }}
        >
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium text-secondary mb-1 truncate">{card.title}</p>
              <p className="text-2xl sm:text-3xl font-bold text-primary font-display">{card.value}</p>
            </div>
            <div className={`${card.color} p-3 sm:p-4 rounded-lg sm:rounded-xl shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110 flex-shrink-0`}>
              <card.icon className="text-white" size={20} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
