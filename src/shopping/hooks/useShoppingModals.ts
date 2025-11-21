import { useState } from 'react';
import type { ShoppingItem } from '../types';

/**
 * Custom hook to manage all shopping-related modal states
 * Consolidates modal visibility and selection state
 */
export function useShoppingModals() {
  // Item modals
  const [showAddItem, setShowAddItem] = useState(false);
  const [showEditItem, setShowEditItem] = useState(false);
  const [editingItem, setEditingItem] = useState<ShoppingItem | null>(null);

  // Pantry modals
  const [showAddPantry, setShowAddPantry] = useState(false);
  const [showScanReceipt, setShowScanReceipt] = useState(false);

  // Store suggestions
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);
  const [selectedItemForSuggestions, setSelectedItemForSuggestions] = useState<ShoppingItem | null>(null);

  // Barcode scanner
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const [barcodeResult, setBarcodeResult] = useState<string | null>(null);

  // Other modals
  const [showStorePrefs, setShowStorePrefs] = useState(false);

  /**
   * Open edit modal for a specific item
   */
  const openEditModal = (item: ShoppingItem) => {
    setEditingItem(item);
    setShowEditItem(true);
  };

  /**
   * Close edit modal and clear editing item
   */
  const closeEditModal = () => {
    setShowEditItem(false);
    setEditingItem(null);
  };

  /**
   * Open store suggestions for an item
   */
  const openStoreSuggestions = (item: ShoppingItem) => {
    setSelectedItemForSuggestions(item);
    setShowLocationSuggestions(true);
  };

  /**
   * Close store suggestions
   */
  const closeStoreSuggestions = () => {
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
