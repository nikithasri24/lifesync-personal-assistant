/**
 * Budget Template Manager
 *
 * Note: This is a stub implementation. Full implementation pending.
 */

import React from 'react';
import type { Category } from '../../types';

interface BudgetTemplate {
  categoryId: string;
  defaultAmount: number;
}

export interface BudgetTemplateManagerProps {
  isOpen?: boolean;
  onClose?: () => void;
  categories?: Category[];
  existingTemplates?: Map<string, number>;
  onSave?: (templates: BudgetTemplate[]) => Promise<void>;
  onDelete?: (categoryId: string) => Promise<void>;
}

export function BudgetTemplateManager({ onClose, isOpen: _isOpen, categories: _categories, existingTemplates: _existingTemplates, onSave: _onSave, onDelete: _onDelete }: BudgetTemplateManagerProps) {
  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold mb-4">Budget Template Manager</h2>
      <p className="text-gray-600">Not implemented yet.</p>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="mt-4 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
        >
          Close
        </button>
      )}
    </div>
  );
}

export default BudgetTemplateManager;
