import React from 'react';
import { Plus, Trash2, Brain, Coffee } from 'lucide-react';
import type { SessionTemplate } from '../types';

interface TemplatesModalProps {
  templates: SessionTemplate[];
  onClose: () => void;
  onStartTemplate: (template: SessionTemplate) => void;
  onDeleteTemplate: (templateId: string) => void;
  onShowCreate: () => void;
}

export const TemplatesModal: React.FC<TemplatesModalProps> = ({
  templates,
  onClose,
  onStartTemplate,
  onDeleteTemplate,
  onShowCreate
}) => {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-2xl border border-white/20 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Session Templates</h3>
          <div className="flex items-center space-x-2">
            <button
              onClick={onShowCreate}
              className="flex items-center space-x-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-colors"
            >
              <Plus size={16} />
              <span>Create</span>
            </button>
            <button
              onClick={onClose}
              className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            >
              ×
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {templates.map((template) => (
            <div key={template.id} className="bg-slate-50 dark:bg-slate-700 rounded-xl p-6 border border-slate-200 dark:border-slate-600">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h4 className="font-semibold text-slate-900 dark:text-white mb-1">{template.name}</h4>
                  {template.description && (
                    <p className="text-sm text-slate-600 dark:text-slate-300 mb-2">{template.description}</p>
                  )}
                  <div className="flex items-center space-x-4 text-xs text-slate-500 dark:text-slate-400">
                    <span>{template.sessions.length} sessions</span>
                    <span>{template.totalDuration} min total</span>
                    <span>Used {template.usageCount} times</span>
                  </div>
                </div>

                {!template.isDefault && (
                  <button
                    onClick={() => onDeleteTemplate(template.id)}
                    className="text-red-500 hover:text-red-700 dark:text-red-400"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>

              <div className="space-y-2 mb-4">
                {template.sessions.map((session, index) => (
                  <div key={index} className="flex items-center space-x-2 text-sm">
                    {session.type === 'focus' ? (
                      <Brain className="w-4 h-4 text-indigo-500" />
                    ) : session.type === 'long-break' ? (
                      <Coffee className="w-4 h-4 text-orange-600" />
                    ) : (
                      <Coffee className="w-4 h-4 text-orange-400" />
                    )}
                    <span className="text-slate-900 dark:text-white">
                      {session.name ?? `${session.type} (${session.duration}m)`}
                    </span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => onStartTemplate(template)}
                className="w-full px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-colors"
              >
                Start Template
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
