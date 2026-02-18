/**
 * ImportRecipeModalV2 Component - MIGRATED to use FormModalV2
 * Together pattern modal for importing recipes from URLs
 *
 * MIGRATION COMPLETE:
 * - Reduced from 143 lines to ~90 lines (37% reduction)
 * - Removed all boilerplate (ESC key, backdrop, modal structure)
 * - Form state managed by FormModalV2
 */

import React from 'react';
import { useThemeColors } from '@/hooks/useThemeColors';
import { FormModalV2 } from '@/components/v2';

interface ImportRecipeModalV2Props {
  isOpen: boolean;
  onClose: () => void;
  onImport: (url: string) => Promise<void>;
}

interface ImportRecipeFormData {
  url: string;
}

export const ImportRecipeModalV2: React.FC<ImportRecipeModalV2Props> = ({
  isOpen,
  onClose,
  onImport,
}) => {
  const colors = useThemeColors();

  const defaultFormData: ImportRecipeFormData = {
    url: '',
  };

  return (
    <FormModalV2<ImportRecipeFormData>
      isOpen={isOpen}
      onClose={onClose}
      title="Import Recipe"
      defaultData={defaultFormData}
      isPending={false}
      submitText="Import Recipe"
      onSubmit={async (formData) => {
        await onImport(formData.url);
      }}
      validate={(formData) => {
        if (!formData.url.trim()) return 'Recipe URL is required';
        // Basic URL validation
        try {
          new URL(formData.url);
        } catch {
          return 'Please enter a valid URL';
        }
        return null;
      }}
    >
      {(formState, setFormState) => (
        <>
          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: colors.text.secondary }}>
              Recipe URL
            </label>
            <input
              type="url"
              value={formState.url}
              onChange={(e) => setFormState({ ...formState, url: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none transition-all"
              placeholder="https://example.com/recipe"
              required
              autoFocus
            />
          </div>

          <div className="p-4 bg-blue-50 rounded-xl">
            <div className="text-sm font-semibold text-blue-900 mb-2">
              Supported Sites
            </div>
            <div className="text-xs text-blue-700 space-y-1">
              <div>• AllRecipes</div>
              <div>• Food Network</div>
              <div>• Tasty</div>
              <div>• BBC Good Food</div>
              <div>• Most recipe websites with structured data</div>
            </div>
          </div>

          <div className="p-4 bg-gray-50 rounded-xl">
            <div className="text-sm" style={{ color: colors.text.secondary }}>
              The recipe will be scraped and you'll have a chance to review and edit before saving.
            </div>
          </div>
        </>
      )}
    </FormModalV2>
  );
};

export default ImportRecipeModalV2;
