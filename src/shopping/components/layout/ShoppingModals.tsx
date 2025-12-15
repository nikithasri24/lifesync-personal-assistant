import React from 'react';
import { AddItemModal, EditItemModal, BarcodeScannerModal, ReceiptScanningModal, AddPantryItemModal, StoreSuggestionsModal } from '../modals';
import type { ShoppingItem, Store as StoreType } from '../../types';
import type { PantryItem as PantryItemType } from '../../../mealPlanning/hooks/useMealPlanningQuery';

interface FormData {
  name: string;
  quantity: number;
  unit: string;
  category: ShoppingItem['category'];
  priority: ShoppingItem['priority'];
  estimatedPrice: string;
  brand: string;
  notes: string;
  preferredStore: string;
}

interface ShoppingModalsProps {
  // Add Pantry Modal
  showAddPantry: boolean;
  onAddPantryClose: () => void;
  onAddPantrySave: (item: Omit<PantryItemType, 'id' | 'updatedAt'>) => Promise<void>;

  // Scan Receipt Modal
  showScanReceipt: boolean;
  onScanReceiptClose: () => void;
  onAddToPantry: (items: Array<{
    name: string;
    quantity: number;
    category: string;
    threshold?: string;
  }>) => Promise<void>;
  onLogExpense: (amount: number, merchant: string) => Promise<void>;

  // Barcode Scanner Modal
  showBarcodeScanner: boolean;
  isScanning: boolean;
  barcodeResult: string | null;
  captureMessage: string;
  videoRef: React.RefObject<HTMLVideoElement>;
  onBarcodeScannerClose: () => void;
  onBarcodeCapture: () => void;
  onBarcodeStop: () => void;

  // Edit Item Modal
  showEditItem: boolean;
  editFormData: FormData;
  stores: StoreType[];
  onEditItemClose: () => void;
  onEditItemSubmit: (e: React.FormEvent) => void;
  onEditFormChange: (updates: Partial<FormData>) => void;

  // Add Item Modal
  showAddItem: boolean;
  addFormData: FormData;
  onAddItemClose: () => void;
  onAddItemSubmit: (e: React.FormEvent) => void;
  onAddFormChange: (updates: Partial<FormData>) => void;
  onBarcodeChange: (barcode: string | null) => void;

  // Store Suggestions Modal
  showLocationSuggestions: boolean;
  selectedItemForSuggestions: ShoppingItem | null;
  userLocation: GeolocationCoordinates | null;
  nearbyStores: Array<{ store: StoreType; distance: number }>;
  onStoreSuggestionsClose: () => void;
  onGetLocation: () => void;
  onAssignStore: (storeId: string) => void;
}

/**
 * Container component for all shopping-related modals
 */
export function ShoppingModals({
  showAddPantry,
  onAddPantryClose,
  onAddPantrySave,
  showScanReceipt,
  onScanReceiptClose,
  onAddToPantry,
  onLogExpense,
  showBarcodeScanner,
  isScanning,
  barcodeResult,
  captureMessage,
  videoRef,
  onBarcodeScannerClose,
  onBarcodeCapture,
  onBarcodeStop,
  showEditItem,
  editFormData,
  stores,
  onEditItemClose,
  onEditItemSubmit,
  onEditFormChange,
  showAddItem,
  addFormData,
  onAddItemClose,
  onAddItemSubmit,
  onAddFormChange,
  onBarcodeChange,
  showLocationSuggestions,
  selectedItemForSuggestions,
  userLocation,
  nearbyStores,
  onStoreSuggestionsClose,
  onGetLocation,
  onAssignStore,
}: ShoppingModalsProps): React.ReactElement {
  return (
    <>
      {/* Add Pantry Modal */}
      <AddPantryItemModal
        isOpen={showAddPantry}
        onClose={onAddPantryClose}
        onSave={onAddPantrySave}
      />

      {/* Scan Receipt Modal */}
      <ReceiptScanningModal
        isOpen={showScanReceipt}
        onClose={onScanReceiptClose}
        onAddToPantry={onAddToPantry}
        onLogExpense={onLogExpense}
      />

      {/* Barcode Scanner Modal */}
      <BarcodeScannerModal
        isOpen={showBarcodeScanner}
        isScanning={isScanning}
        barcodeResult={barcodeResult}
        captureMessage={captureMessage}
        videoRef={videoRef}
        onClose={onBarcodeScannerClose}
        onCapture={onBarcodeCapture}
        onStop={onBarcodeStop}
      />

      {/* Edit Item Modal */}
      <EditItemModal
        isOpen={showEditItem}
        formData={editFormData}
        stores={stores}
        onClose={onEditItemClose}
        onSubmit={onEditItemSubmit}
        onFormChange={onEditFormChange}
      />

      {/* Add Item Modal */}
      <AddItemModal
        isOpen={showAddItem}
        formData={addFormData}
        barcodeResult={barcodeResult}
        stores={stores}
        onClose={onAddItemClose}
        onSubmit={onAddItemSubmit}
        onFormChange={onAddFormChange}
        onBarcodeChange={onBarcodeChange}
      />

      {/* Store Suggestions Modal */}
      <StoreSuggestionsModal
        isOpen={showLocationSuggestions}
        item={selectedItemForSuggestions}
        userLocation={userLocation}
        nearbyStores={nearbyStores}
        onClose={onStoreSuggestionsClose}
        onGetLocation={onGetLocation}
        onAssignStore={onAssignStore}
      />
    </>
  );
}
