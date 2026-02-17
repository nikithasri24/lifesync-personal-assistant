/**
 * Inbox Triage Component
 * Review and process captured inbox items
 */

import { useState } from 'react';
import { 
  Inbox, CheckCircle2, X, ChevronRight, Trash2, 
  ListTodo, StickyNote, Calendar, Target, ShoppingCart, Lightbulb, Bell 
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useInboxItems, useDismissInboxItem, useDeleteInboxItem } from '@/hooks/useInboxQuery';
import type { InboxItem, InboxItemType } from '@/services/inbox';

const typeConfig: Record<InboxItemType, { icon: React.ReactNode; label: string; color: string }> = {
  task: { icon: <ListTodo className="w-4 h-4" />, label: 'Task', color: 'text-[#C18B5E]' },
  note: { icon: <StickyNote className="w-4 h-4" />, label: 'Note', color: 'text-yellow-500' },
  event: { icon: <Calendar className="w-4 h-4" />, label: 'Event', color: 'text-purple-500' },
  habit: { icon: <CheckCircle2 className="w-4 h-4" />, label: 'Habit', color: 'text-green-500' },
  goal: { icon: <Target className="w-4 h-4" />, label: 'Goal', color: 'text-orange-500' },
  reminder: { icon: <Bell className="w-4 h-4" />, label: 'Reminder', color: 'text-red-500' },
  idea: { icon: <Lightbulb className="w-4 h-4" />, label: 'Idea', color: 'text-amber-500' },
  shopping: { icon: <ShoppingCart className="w-4 h-4" />, label: 'Shopping', color: 'text-pink-500' },
  other: { icon: <Inbox className="w-4 h-4" />, label: 'Other', color: 'text-gray-500' },
};

interface InboxTriageProps {
  className?: string;
}

export function InboxTriage({ className = '' }: InboxTriageProps) {
  const [filter, setFilter] = useState<'pending' | 'processed' | 'dismissed'>('pending');
  const { data: items = [], isLoading } = useInboxItems(filter);
  const dismissItem = useDismissInboxItem();
  const deleteItem = useDeleteInboxItem();
  
  const handleDismiss = async (itemId: string) => {
    await dismissItem.mutateAsync(itemId);
  };
  
  const handleDelete = async (itemId: string) => {
    await deleteItem.mutateAsync(itemId);
  };
  
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <Inbox className="w-5 h-5 text-[#C18B5E]" />
          <h2 className="font-bold text-gray-900 dark:text-white">Inbox</h2>
          {filter === 'pending' && items.length > 0 && (
            <span className="bg-[#F5EBE0] dark:bg-[#8B6F47] text-[#8B6F47] dark:text-[#E5B88A] text-xs font-bold px-2 py-0.5 rounded-full">
              {items.length}
            </span>
          )}
        </div>
        
        {/* Filter tabs */}
        <div className="flex gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
          {(['pending', 'processed', 'dismissed'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                filter === tab
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>
      
      {/* Items List */}
      <div className="divide-y divide-gray-100 dark:divide-gray-700 max-h-96 overflow-y-auto">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : items.length === 0 ? (
          <div className="p-8 text-center">
            <Inbox className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
            <p className="text-gray-500 dark:text-gray-400">
              {filter === 'pending' ? 'Inbox is empty! 🎉' : `No ${filter} items`}
            </p>
          </div>
        ) : (
          items.map((item) => (
            <InboxItemRow 
              key={item.id} 
              item={item} 
              onDismiss={handleDismiss}
              onDelete={handleDelete}
              showActions={filter === 'pending'}
            />
          ))
        )}
      </div>
    </div>
  );
}

// Individual inbox item row
function InboxItemRow({ 
  item, 
  onDismiss, 
  onDelete,
  showActions 
}: { 
  item: InboxItem; 
  onDismiss: (id: string) => void;
  onDelete: (id: string) => void;
  showActions: boolean;
}) {
  const suggestedType = item.suggested_type || 'other';
  const config = typeConfig[suggestedType];
  
  return (
    <div className="flex items-start gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
      {/* Type icon */}
      <div className={`mt-0.5 ${config.color}`}>
        {config.icon}
      </div>
      
      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-900 dark:text-white break-words">{item.content}</p>
        <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
          <span className={`${config.color} font-medium`}>{config.label}</span>
          <span>•</span>
          <span>{formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}</span>
          {item.suggested_tags.length > 0 && (
            <>
              <span>•</span>
              {item.suggested_tags.slice(0, 2).map(tag => (
                <span key={tag} className="bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">#{tag}</span>
              ))}
            </>
          )}
        </div>
      </div>
      
      {/* Actions */}
      {showActions && (
        <div className="flex items-center gap-1">
          <button
            onClick={() => onDismiss(item.id)}
            className="p-1.5 text-gray-400 hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded transition-colors"
            title="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(item.id)}
            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button
            className="p-1.5 text-gray-400 hover:text-[#C18B5E] hover:bg-[#F5EBE0] dark:hover:bg-[#8B6F47]/20 rounded transition-colors"
            title="Convert to..."
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}

