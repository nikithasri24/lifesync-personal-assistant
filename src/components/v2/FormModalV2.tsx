/**
 * FormModalV2 Component
 *
 * Generic form modal following the Together tab pattern (CLAUDE.md reference)
 * Includes auto-save, ESC key support, backdrop click, and proper mobile handling
 *
 * Features:
 * - Together pattern modal structure (mobile bottom-sheet, desktop centered)
 * - Auto-save draft support via useDraftStorage
 * - ESC key closes modal
 * - Backdrop click closes modal
 * - Safe area insets for mobile notches
 * - Fixed header and footer, scrollable content
 * - Mobile drag handle
 * - Loading states with disabled buttons
 *
 * @example
 * ```typescript
 * <FormModalV2
 *   isOpen={showModal}
 *   onClose={() => setShowModal(false)}
 *   title="Create Task"
 *   onSubmit={handleSubmit}
 *   isPending={mutation.isPending}
 *   showDelete={isEditing}
 *   onDelete={handleDelete}
 * >
 *   {(formState, setFormState) => (
 *     // Your form fields here
 *     <input value={formState.title} onChange={e => setFormState({...formState, title: e.target.value})} />
 *   )}
 * </FormModalV2>
 * ```
 */

import React, { useEffect, ReactNode } from 'react';
import { X } from 'lucide-react';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useDraftStorage } from '@/hooks/useDraftStorage';
import { logger } from '@/services/logger';

export interface FormModalV2Props<T extends Record<string, any>> {
  /** Whether the modal is open */
  isOpen: boolean;

  /** Close handler */
  onClose: () => void;

  /** Modal title */
  title: string;

  /** Submit handler - receives form data */
  onSubmit: (data: T) => void | Promise<void>;

  /** Optional delete handler for edit mode */
  onDelete?: () => void | Promise<void>;

  /** Initial form data (for edit mode) */
  initialData?: Partial<T>;

  /** Default form data (for create mode) */
  defaultData: T;

  /** Whether currently editing (disables auto-save) */
  isEditing?: boolean;

  /** Whether form is submitting/deleting */
  isPending?: boolean;

  /** Whether to show delete button */
  showDelete?: boolean;

  /** Custom submit button text */
  submitText?: string;

  /** Custom delete button text */
  deleteText?: string;

  /** Custom cancel button text */
  cancelText?: string;

  /** localStorage key for auto-save drafts */
  draftKey?: string;

  /** Children as render prop receiving formState and setFormState */
  children: (
    formState: T,
    setFormState: React.Dispatch<React.SetStateAction<T>>
  ) => ReactNode;

  /** Optional custom footer (replaces default buttons) */
  customFooter?: ReactNode;

  /** Validation function - return error message or null */
  validate?: (data: T) => string | null;
}

export function FormModalV2<T extends Record<string, any>>({
  isOpen,
  onClose,
  title,
  onSubmit,
  onDelete,
  initialData,
  defaultData,
  isEditing = false,
  isPending = false,
  showDelete = false,
  submitText,
  deleteText = 'Delete',
  cancelText = 'Cancel',
  draftKey,
  children,
  customFooter,
  validate,
}: FormModalV2Props<T>): React.ReactElement | null {
  const colors = useThemeColors();

  // Merge initialData with defaultData
  const mergedInitialData = { ...defaultData, ...initialData } as T;

  // Auto-save draft support (only if draftKey provided and not editing)
  // IMPORTANT: Always call the hook to avoid conditional hook call violations
  const [draft, updateDraft, clearDraft] = useDraftStorage(
    draftKey || '_no_draft',
    mergedInitialData,
    { disabled: !draftKey || isEditing }
  );

  // Form state - use draft if available and not editing
  const [formState, setFormState] = React.useState<T>(
    isEditing ? mergedInitialData : (draft || mergedInitialData)
  );

  // Update form state when initialData changes (for edit mode)
  useEffect(() => {
    if (isEditing && initialData) {
      setFormState({ ...defaultData, ...initialData } as T);
    }
  }, [initialData, isEditing, defaultData]);

  // Auto-save when form state changes (only if draft key provided)
  useEffect(() => {
    if (!isEditing && draftKey) {
      updateDraft(formState);
    }
  }, [formState, isEditing, draftKey, updateDraft]);

  // ESC key support
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  // Backdrop click handler
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate if validator provided
    if (validate) {
      const error = validate(formState);
      if (error) {
        logger.warn('Form', 'Validation error', { error });
        return;
      }
    }

    try {
      await onSubmit(formState);

      // Clear draft after successful submit
      if (draftKey) {
        clearDraft();
      }

      // Reset form if creating new item
      if (!isEditing) {
        setFormState(defaultData);
      }

      // Note: Don't close modal here - let parent handle it
      // This allows parent to handle errors and keep modal open if needed
    } catch (error) {
      // Error handling is done by parent component
      throw error;
    }
  };

  // Delete handler
  const handleDelete = async () => {
    if (onDelete) {
      await onDelete();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 bottom-0 z-[60] flex items-end justify-center lg:items-center"
      style={{
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        backdropFilter: 'blur(4px)',
        marginTop: 'calc(-1 * env(safe-area-inset-top, 0px))',
        paddingTop: 'env(safe-area-inset-top, 0px)',
        height: 'calc(100vh + env(safe-area-inset-top, 0px) + env(safe-area-inset-bottom, 0px))',
      }}
      onClick={handleBackdropClick}
    >
      <div
        className="w-full bg-white lg:rounded-3xl rounded-t-3xl overflow-hidden flex flex-col"
        style={{ maxHeight: '90vh', maxWidth: '600px' }}
      >
        {/* Mobile drag handle */}
        <div className="lg:hidden pt-2 flex-shrink-0">
          <div className="w-9 h-1 rounded-full mx-auto bg-gray-300" />
        </div>

        {/* Fixed Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200 flex-shrink-0">
          <h2 className="text-2xl font-bold text-gray-900">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Scrollable Form Content */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div
            className="overflow-y-auto p-6 space-y-5 flex-1"
            style={{ maxHeight: 'calc(90vh - 140px)' }}
          >
            {children(formState, setFormState)}
          </div>

          {/* Fixed Footer */}
          {customFooter || (
            <div className="px-6 py-4 border-t border-gray-200 flex gap-3 flex-shrink-0 bg-white">
              {showDelete && onDelete && (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isPending}
                  className="px-4 py-3 bg-red-100 hover:bg-red-200 rounded-xl font-semibold text-red-700 transition-colors disabled:opacity-50"
                >
                  {deleteText}
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-xl font-semibold text-gray-700 transition-colors"
              >
                {cancelText}
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="flex-1 px-4 py-3 rounded-xl font-semibold text-white transition-opacity disabled:opacity-50"
                style={{
                  background: 'linear-gradient(135deg, #D4A574 0%, #C18B5E 100%)',
                }}
              >
                {isPending ? 'Saving...' : (submitText || (isEditing ? 'Update' : 'Create'))}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

export default FormModalV2;
