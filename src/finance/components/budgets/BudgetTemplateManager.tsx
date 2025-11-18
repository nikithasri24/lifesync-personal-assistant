import React from 'react';
import { X, Save, Trash2, Settings } from 'lucide-react';
import type { BudgetTemplate, Category } from '../../types';

interface BudgetTemplateManagerProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (templates: Array<{ categoryId: string; defaultAmount: number }>) => Promise<void>;
  onDelete: (categoryId: string) => Promise<void>;
  categories: Category[];
  existingTemplates: Map<string, number>; // categoryId -> defaultAmount
}

const BudgetTemplateManager: React.FC<BudgetTemplateManagerProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  categories,
  existingTemplates,
}) => {
  const [templates, setTemplates] = React.useState<Map<string, number>>(new Map());
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (isOpen) {
      // Initialize with existing templates
      setTemplates(new Map(existingTemplates));
    }
  }, [isOpen, existingTemplates]);

  const handleAmountChange = (categoryId: string, value: string) => {
    const amount = parseFloat(value);
    if (!isNaN(amount) && amount >= 0) {
      const newTemplates = new Map(templates);
      newTemplates.set(categoryId, amount);
      setTemplates(newTemplates);
    } else if (value === '') {
      // Allow clearing the field
      const newTemplates = new Map(templates);
      newTemplates.delete(categoryId);
      setTemplates(newTemplates);
    }
  };

  const handleDeleteTemplate = async (categoryId: string) => {
    try {
      await onDelete(categoryId);
      const newTemplates = new Map(templates);
      newTemplates.delete(categoryId);
      setTemplates(newTemplates);
    } catch (error) {
      console.error('Failed to delete template:', error);
      alert('Failed to delete template');
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const templatesToSave = Array.from(templates.entries()).map(([categoryId, defaultAmount]) => ({
        categoryId,
        defaultAmount,
      }));
      await onSave(templatesToSave);
      onClose();
    } catch (error) {
      console.error('Failed to save templates:', error);
      alert('Failed to save templates');
    } finally {
      setSaving(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  // Sort categories: those with templates first, then alphabetically
  const sortedCategories = [...categories].sort((a, b) => {
    const aHasTemplate = templates.has(a.id);
    const bHasTemplate = templates.has(b.id);
    if (aHasTemplate && !bHasTemplate) return -1;
    if (!aHasTemplate && bHasTemplate) return 1;
    return a.name.localeCompare(b.name);
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={handleBackdropClick}
    >
      <div className="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl ring-1 ring-black/5 max-h-[90vh] flex flex-col">
        {/* Header - Fixed */}
        <div className="flex-shrink-0 flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div className="flex items-center gap-3">
            <Settings className="h-6 w-6 text-blue-500" />
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Budget Templates</h2>
              <p className="text-sm text-slate-600 mt-0.5">
                Set default budgets that auto-apply to new months
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 hover:bg-slate-100 transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5 text-slate-600" />
          </button>
        </div>

        {/* Content - Scrollable with FORCED visible scrollbar */}
        <style>{`
          .template-scroll-container {
            scrollbar-width: auto !important;
            scrollbar-color: #3b82f6 #cbd5e1 !important;
            overflow-y: scroll !important;
          }
          .template-scroll-container::-webkit-scrollbar {
            width: 18px !important;
            background: #cbd5e1 !important;
          }
          .template-scroll-container::-webkit-scrollbar-track {
            background: #cbd5e1 !important;
            border-left: 1px solid #94a3b8 !important;
          }
          .template-scroll-container::-webkit-scrollbar-thumb {
            background: #3b82f6 !important;
            border-radius: 9px !important;
            border: 3px solid #cbd5e1 !important;
            min-height: 50px !important;
          }
          .template-scroll-container::-webkit-scrollbar-thumb:hover {
            background: #2563eb !important;
          }
          .template-scroll-container::-webkit-scrollbar-corner {
            background: #cbd5e1 !important;
          }
        `}</style>
        <div
          className="template-scroll-container"
          style={{
            height: '450px',
            overflowY: 'scroll',
            paddingLeft: '24px',
            paddingRight: '24px',
            paddingTop: '16px',
            paddingBottom: '16px'
          }}
        >
          <div className="space-y-2">
            {sortedCategories.map((category) => {
              const hasTemplate = templates.has(category.id);
              return (
                <div
                  key={category.id}
                  className={`flex items-center gap-3 rounded-lg p-3 transition-colors ${
                    hasTemplate
                      ? 'bg-blue-50 ring-1 ring-blue-200'
                      : 'bg-slate-50 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {category.icon && <span className="text-lg flex-shrink-0">{category.icon}</span>}
                      <span className="font-medium text-slate-900 truncate">{category.name}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-sm text-slate-500">$</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={templates.get(category.id) ?? ''}
                      onChange={(e) => handleAmountChange(category.id, e.target.value)}
                      placeholder="0.00"
                      className="w-28 rounded-lg border border-slate-300 bg-white px-3 py-2 text-right text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
                    />
                    {hasTemplate && (
                      <button
                        type="button"
                        onClick={() => handleDeleteTemplate(category.id)}
                        className="rounded-lg p-2 text-red-500 hover:bg-red-50 transition-colors"
                        title="Delete template"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

            {templates.size === 0 && (
              <div className="mt-8 mb-4 text-center py-8">
                <p className="text-sm text-slate-500">
                  No templates configured yet. Enter amounts above to create your budget templates.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer - Fixed */}
        <div className="flex-shrink-0 border-t border-slate-200 px-6 py-4 bg-slate-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-slate-600 font-medium">
              {templates.size} template{templates.size !== 1 ? 's' : ''} configured
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-slate-600 bg-slate-600 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-500/20 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-700 px-4 py-2 text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save Templates
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BudgetTemplateManager;
