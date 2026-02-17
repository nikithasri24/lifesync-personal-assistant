import type React from 'react';
import { useModalState } from '@/hooks/useModalState';
import type { ShoppingItem } from '../types';

/**
 * Custom hook to manage all shopping-related modal states
 *
 * REFACTORED: Now uses the generic useModalState hook to eliminate boilerplate.
 * Maintains backward compatibility with the same return interface.
 *
 * @example
 * ```typescript
 * const modals = useShoppingModals();
 *
 * // Add item
 * modals.setShowAddItem(true);
 *
 * // Edit item
 * modals.openEditModal(item);
 * modals.closeEditModal();
 *
 * // Store suggestions
 * modals.openStoreSuggestions(item);
 * ```
 */
export function useShoppingModals(): {
  // Item modals
  showAddItem: boolean;
  setShowAddItem: React.Dispatch<React.SetStateAction<boolean>>;
  showEditItem: boolean;
  editingItem: ShoppingItem | null;
  openEditModal: (item: ShoppingItem) => void;
  closeEditModal: () => void;

  // Pantry modals
  showAddPantry: boolean;
  setShowAddPantry: React.Dispatch<React.SetStateAction<boolean>>;
  showScanReceipt: boolean;
  setShowScanReceipt: React.Dispatch<React.SetStateAction<boolean>>;

  // Store suggestions
  showLocationSuggestions: boolean;
  selectedItemForSuggestions: ShoppingItem | null;
  openStoreSuggestions: (item: ShoppingItem) => void;
  closeStoreSuggestions: () => void;

  // Barcode scanner
  showBarcodeScanner: boolean;
  setShowBarcodeScanner: React.Dispatch<React.SetStateAction<boolean>>;
  barcodeResult: string | null;
  setBarcodeResult: React.Dispatch<React.SetStateAction<string | null>>;

  // Other modals
  showStorePrefs: boolean;
  setShowStorePrefs: React.Dispatch<React.SetStateAction<boolean>>;
} {
  // Use the generic modal state hook
  const modals = useModalState({
    showAddItem: false,
    showEditItem: false,
    editingItem: null as ShoppingItem | null,
    showAddPantry: false,
    showScanReceipt: false,
    showLocationSuggestions: false,
    selectedItemForSuggestions: null as ShoppingItem | null,
    showBarcodeScanner: false,
    barcodeResult: null as string | null,
    showStorePrefs: false,
  });

  /**
   * Open edit modal for a specific item
   */
  const openEditModal = (item: ShoppingItem): void => {
    modals.batch({ editingItem: item, showEditItem: true });
  };

  /**
   * Close edit modal and clear editing item
   */
  const closeEditModal = (): void => {
    modals.batch({ showEditItem: false, editingItem: null });
  };

  /**
   * Open store suggestions for an item
   */
  const openStoreSuggestions = (item: ShoppingItem): void => {
    modals.batch({ selectedItemForSuggestions: item, showLocationSuggestions: true });
  };

  /**
   * Close store suggestions
   */
  const closeStoreSuggestions = (): void => {
    modals.batch({ showLocationSuggestions: false, selectedItemForSuggestions: null });
  };

  return {
    // Item modals
    showAddItem: modals.state.showAddItem,
    setShowAddItem: (value: boolean | ((prev: boolean) => boolean)) => {
      const newValue = typeof value === 'function' ? value(modals.state.showAddItem) : value;
      modals.set('showAddItem', newValue);
    },
    showEditItem: modals.state.showEditItem,
    editingItem: modals.state.editingItem,
    openEditModal,
    closeEditModal,

    // Pantry modals
    showAddPantry: modals.state.showAddPantry,
    setShowAddPantry: (value: boolean | ((prev: boolean) => boolean)) => {
      const newValue = typeof value === 'function' ? value(modals.state.showAddPantry) : value;
      modals.set('showAddPantry', newValue);
    },
    showScanReceipt: modals.state.showScanReceipt,
    setShowScanReceipt: (value: boolean | ((prev: boolean) => boolean)) => {
      const newValue = typeof value === 'function' ? value(modals.state.showScanReceipt) : value;
      modals.set('showScanReceipt', newValue);
    },

    // Store suggestions
    showLocationSuggestions: modals.state.showLocationSuggestions,
    selectedItemForSuggestions: modals.state.selectedItemForSuggestions,
    openStoreSuggestions,
    closeStoreSuggestions,

    // Barcode scanner
    showBarcodeScanner: modals.state.showBarcodeScanner,
    setShowBarcodeScanner: (value: boolean | ((prev: boolean) => boolean)) => {
      const newValue = typeof value === 'function' ? value(modals.state.showBarcodeScanner) : value;
      modals.set('showBarcodeScanner', newValue);
    },
    barcodeResult: modals.state.barcodeResult,
    setBarcodeResult: (value: string | null | ((prev: string | null) => string | null)) => {
      const newValue = typeof value === 'function' ? value(modals.state.barcodeResult) : value;
      modals.set('barcodeResult', newValue);
    },

    // Other
    showStorePrefs: modals.state.showStorePrefs,
    setShowStorePrefs: (value: boolean | ((prev: boolean) => boolean)) => {
      const newValue = typeof value === 'function' ? value(modals.state.showStorePrefs) : value;
      modals.set('showStorePrefs', newValue);
    },
  };
}
