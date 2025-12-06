import type React from 'react';
import { useState } from 'react';
import type { ShoppingItem } from '../types';

/**
 * Custom hook to manage all shopping-related modal states
 * Consolidates modal visibility and selection state
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
  // Item modals
  const [showAddItem, setShowAddItem] = useState<boolean>(false);
  const [showEditItem, setShowEditItem] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<ShoppingItem | null>(null);

  // Pantry modals
  const [showAddPantry, setShowAddPantry] = useState<boolean>(false);
  const [showScanReceipt, setShowScanReceipt] = useState<boolean>(false);

  // Store suggestions
  const [showLocationSuggestions, setShowLocationSuggestions] = useState<boolean>(false);
  const [selectedItemForSuggestions, setSelectedItemForSuggestions] = useState<ShoppingItem | null>(null);

  // Barcode scanner
  const [showBarcodeScanner, setShowBarcodeScanner] = useState<boolean>(false);
  const [barcodeResult, setBarcodeResult] = useState<string | null>(null);

  // Other modals
  const [showStorePrefs, setShowStorePrefs] = useState<boolean>(false);

  /**
   * Open edit modal for a specific item
   */
  const openEditModal = (item: ShoppingItem): void => {
    setEditingItem(item);
    setShowEditItem(true);
  };

  /**
   * Close edit modal and clear editing item
   */
  const closeEditModal = (): void => {
    setShowEditItem(false);
    setEditingItem(null);
  };

  /**
   * Open store suggestions for an item
   */
  const openStoreSuggestions = (item: ShoppingItem): void => {
    setSelectedItemForSuggestions(item);
    setShowLocationSuggestions(true);
  };

  /**
   * Close store suggestions
   */
  const closeStoreSuggestions = (): void => {
    setShowLocationSuggestions(false);
    setSelectedItemForSuggestions(null);
  };

  return {
    // Item modals
    showAddItem,
    setShowAddItem,
    showEditItem,
    editingItem,
    openEditModal,
    closeEditModal,

    // Pantry modals
    showAddPantry,
    setShowAddPantry,
    showScanReceipt,
    setShowScanReceipt,

    // Store suggestions
    showLocationSuggestions,
    selectedItemForSuggestions,
    openStoreSuggestions,
    closeStoreSuggestions,

    // Barcode scanner
    showBarcodeScanner,
    setShowBarcodeScanner,
    barcodeResult,
    setBarcodeResult,

    // Other
    showStorePrefs,
    setShowStorePrefs,
  };
}
