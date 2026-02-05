/**
 * Quick Capture Component
 * Fast input for capturing thoughts, ideas, tasks, and reminders
 */

import { useState, useRef, useEffect } from 'react';
import { Plus, Inbox, Send, Mic, X, Loader2 } from 'lucide-react';
import { logger } from '@/services/logger';
import { useCreateInboxItem, usePendingInboxCount } from '@/hooks/useInboxQuery';

interface QuickCaptureProps {
  variant?: 'floating' | 'inline' | 'compact';
  onCaptured?: () => void;
  className?: string;
}

export function QuickCapture({ variant = 'floating', onCaptured, className = '' }: QuickCaptureProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [content, setContent] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);
  
  const { data: pendingCount = 0 } = usePendingInboxCount();
  const createItem = useCreateInboxItem();
  
  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);
  
  // Keyboard shortcut: Cmd/Ctrl + K to open
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
        setContent('');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
  
  const handleSubmit = async () => {
    if (!content.trim()) return;
    
    try {
      await createItem.mutateAsync({ content: content.trim(), source: 'manual' });
      setContent('');
      if (variant === 'floating') {
        setIsOpen(false);
      }
      onCaptured?.();
    } catch (error) {
      logger.error('Inbox', error instanceof Error ? error : new Error(String(error)), { context: 'captureItem' });
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };
  
  // Floating FAB variant
  if (variant === 'floating') {
    return (
      <>
        {/* FAB Button */}
        <button
          onClick={() => setIsOpen(true)}
          className={`fixed bottom-6 right-6 z-50 w-14 h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-110 ${className}`}
          aria-label="Quick capture"
        >
          <Plus className="w-7 h-7" />
          {pendingCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
              {pendingCount > 9 ? '9+' : pendingCount}
            </span>
          )}
        </button>
        
        {/* Modal Overlay */}
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/50 backdrop-blur-sm">
            <div className="w-full max-w-xl bg-white dark:bg-gray-800 rounded-xl shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2 text-gray-700 dark:text-gray-200">
                  <Inbox className="w-5 h-5" />
                  <span className="font-medium">Quick Capture</span>
                  <span className="text-xs text-gray-400">(⌘K)</span>
                </div>
                <button
                  onClick={() => { setIsOpen(false); setContent(''); }}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              
              {/* Input */}
              <div className="p-4">
                <textarea
                  ref={inputRef}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="What's on your mind? Tasks, ideas, reminders... (Enter to save)"
                  className="w-full h-24 resize-none border-0 focus:ring-0 text-lg bg-transparent dark:text-white placeholder-gray-400"
                  disabled={createItem.isPending}
                />
              </div>
              
              {/* Footer */}
              <div className="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-900">
                <div className="text-xs text-gray-500">
                  Tip: Use #tags, say "tomorrow", or "urgent" for smart parsing
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleSubmit}
                    disabled={!content.trim() || createItem.isPending}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg font-medium transition-colors"
                  >
                    {createItem.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                    Capture
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }
  
  // Inline variant (for embedding in pages)
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="flex-1 relative">
        <input
          type="text"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Quick capture... (Enter to save)"
          className="w-full px-4 py-2 pl-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-white"
          disabled={createItem.isPending}
        />
        <Inbox className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
      </div>
      <button
        onClick={handleSubmit}
        disabled={!content.trim() || createItem.isPending}
        className="p-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg"
      >
        {createItem.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
      </button>
    </div>
  );
}

