import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import type { SessionTemplate } from '../types';

interface CreateTemplateModalProps {
  newTemplate: Partial<SessionTemplate>;
  onClose: () => void;
  onSave: () => void;
  onUpdateName: (name: string) => void;
  onUpdateDescription: (description: string) => void;
  onAddSession: () => void;
  onRemoveSession: (index: number) => void;
  onUpdateSession: (index: number, session: SessionTemplate['sessions'][0]) => void;
}

export const CreateTemplateModal: React.FC<CreateTemplateModalProps> = ({
  newTemplate,
  onClose,
  onSave,
  onUpdateName,
  onUpdateDescription,
  onAddSession,
  onRemoveSession,
  onUpdateSession
}) => {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-2xl border border-white/20 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Create Template</h3>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Template Name
            </label>
            <input
              type="text"
              value={newTemplate.name ?? ''}
              onChange={(e) => onUpdateName(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              placeholder="My Custom Template"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Description (optional)
            </label>
            <textarea
              value={newTemplate.description ?? ''}
              onChange={(e) => onUpdateDescription(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              rows={2}
              placeholder="Describe your template..."
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Sessions
              </label>
              <button
                onClick={onAddSession}
                className="flex items-center space-x-1 text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
                aria-label="Add session"
              >
                <Plus size={16} />
                <span className="text-sm">Add Session</span>
              </button>
            </div>

            <div className="space-y-3">
              {newTemplate.sessions?.map((session, index) => (
                <div key={index} className="flex items-center space-x-3 p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
                  <select
                    value={session.type}
                    onChange={(e) => {
                      const sessionType = e.target.value as 'focus' | 'break' | 'long-break';
                      onUpdateSession(index, { ...session, type: sessionType });
                    }}
                    className="px-3 py-1 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
                  >
                    <option value="focus">Focus</option>
                    <option value="break">Break</option>
                    <option value="long-break">Long Break</option>
                  </select>

                  <input
                    type="number"
                    value={session.duration}
                    onChange={(e) => {
                      onUpdateSession(index, { ...session, duration: parseInt(e.target.value) || 0 });
                    }}
                    className="w-20 px-3 py-1 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
                    min="1"
                  />
                  <span className="text-sm text-slate-600 dark:text-slate-300">min</span>

                  <input
                    type="text"
                    value={session.name ?? ''}
                    onChange={(e) => {
                      onUpdateSession(index, { ...session, name: e.target.value });
                    }}
                    className="flex-1 px-3 py-1 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
                    placeholder="Session name (optional)"
                  />

                  {(newTemplate.sessions?.length ?? 0) > 1 && (
                    <button
                      onClick={() => onRemoveSession(index)}
                      className="text-red-500 hover:text-red-700 dark:text-red-400"
                      aria-label="Delete session"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex space-x-4">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onSave}
              disabled={!newTemplate.name || !newTemplate.sessions?.length}
              className="flex-1 px-6 py-3 bg-indigo-500 hover:bg-indigo-600 disabled:bg-gray-400 text-white rounded-lg transition-colors"
            >
              Save Template
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
