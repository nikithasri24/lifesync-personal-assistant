import React, { type ReactElement, useState, useEffect } from 'react';
import { logger } from '../services/logger';
import { useToast } from '../hooks/useToast';
import type { ShoppingItem, ShoppingList } from '../shopping/types';
import { distributeItemsToStores as distributeItems, type DistributionStrategy } from '../shopping/services/storeDistribution';
import { ShoppingHeader } from '../shopping/components/layout/ShoppingHeader';
import { ViewTabs } from '../shopping/components/layout/ViewTabs';
import { ShoppingModals } from '../shopping/components/layout/ShoppingModals';
import { MasterListView, DistributeView, StoreListsView, PantryView } from '../shopping/components/views';
import {
  useVoiceInput,
  useBarcodeScanner,
  useStoreSuggestions,
  useItemForm,
  useShoppingModals,
  useShoppingData,
  useShoppingMutations,
  useShoppingFormHandlers,
  usePantryHandlers,
} from '../shopping/hooks';
import { useStoresQuery } from '../hooks/useStoresQuery';

export default function ShoppingSmart(): ReactElement {
  const { shoppingItems, pantryItems, activeListId, isLoadingList, ensureActiveList } = useShoppingData();
  const { addShoppingItem, updateShoppingItem, deleteShoppingItem, toggleShoppingItem, createPantryItem, updatePantryItem, deletePantryItem } = useShoppingMutations({ activeListId, ensureActiveList, shoppingItems });
  const { data: stores = [] } = useStoresQuery();
  const { showToast } = useToast();

  useEffect(() => {
    if (!isLoadingList && !activeListId) {
      ensureActiveList().catch((error: unknown) => logger.error('ShoppingSmart', error as Error));
    }
  }, [isLoadingList, activeListId, ensureActiveList]);

  const [storeLists, setStoreLists] = useState<ShoppingList[]>([]);
  const [activeView, setActiveView] = useState<'master' | 'stores' | 'distribute' | 'pantry'>('master');
  const [distributionStrategy, setDistributionStrategy] = useState<DistributionStrategy>('mixed');
  const newItemForm = useItemForm();
  const editItemForm = useItemForm();
  const { isListening, startVoiceInput } = useVoiceInput();
  const { isScanning, captureMessage, videoRef, startScanning, stopScanning, captureNow } = useBarcodeScanner((barcode, productInfo) => {
    newItemForm.updateForm({
      name: productInfo.name,
      estimatedPrice: productInfo.price?.toString() ?? '',
      category: (productInfo.category as ShoppingItem['category']) ?? 'other'
    });
    setBarcodeResult(barcode);
    setShowAddItem(true);
    setShowBarcodeScanner(false);
  });
  const {
    showAddItem, setShowAddItem, showEditItem, editingItem, openEditModal, closeEditModal,
    showAddPantry, setShowAddPantry, showScanReceipt, setShowScanReceipt,
    showLocationSuggestions, selectedItemForSuggestions, openStoreSuggestions, closeStoreSuggestions,
    showBarcodeScanner, setShowBarcodeScanner, barcodeResult, setBarcodeResult,
    showStorePrefs: _showStorePrefs, setShowStorePrefs,
  } = useShoppingModals();
  const { userLocation, getUserLocation, findNearbyStoresForItem } = useStoreSuggestions(stores);
  const { handleAddItem, handleUpdateItem } = useShoppingFormHandlers({ stores, addShoppingItem, updateShoppingItem });
  const { handleAddPantryItem, handleAddToPantry, handleLogExpense } = usePantryHandlers({ createPantryItem, showToast });

  const distributeItemsToStores = (): void => {
    const newStoreLists = distributeItems({ items: shoppingItems, stores, strategy: distributionStrategy });
    setStoreLists(newStoreLists);
    setActiveView('stores');
  };

  const handleVoiceInput = (): void => startVoiceInput((transcript) => {
    newItemForm.updateForm({ name: transcript });
    setShowAddItem(true);
  });

  const handleStartBarcodeScanning = async (): Promise<void> => {
    setShowBarcodeScanner(true);
    await startScanning();
  };

  const handleStopBarcodeScanning = (): void => {
    stopScanning();
    setShowBarcodeScanner(false);
  };

  const startEditItem = (item: ShoppingItem): void => {
    editItemForm.loadItem({
      name: item.name, quantity: item.quantity, unit: item.unit ?? 'pcs',
      category: item.category, priority: item.priority,
      estimatedPrice: item.estimatedPrice?.toString() ?? '',
      brand: item.brand ?? '', notes: item.notes ?? '',
      preferredStore: item.assignedStore ?? ''
    });
    openEditModal(item);
  };

  const updateExistingItem = (e: React.FormEvent): void => {
    e.preventDefault();
    if (!editingItem) return;
    handleUpdateItem(editingItem, editItemForm.formData);
    closeEditModal();
    editItemForm.resetForm();
  };

  const addItemToMaster = (e: React.FormEvent): void => {
    e.preventDefault();
    handleAddItem(newItemForm.formData, barcodeResult);
    newItemForm.resetForm();
    setBarcodeResult(null);
    setShowAddItem(false);
  };

  const totalMasterItems = shoppingItems.filter((item: ShoppingItem) => !item.purchased).length;
  const totalEstimatedCost = shoppingItems.reduce((sum: number, item: ShoppingItem) => sum + (item.estimatedPrice ?? 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <ShoppingHeader
        totalMasterItems={totalMasterItems}
        storeListsCount={storeLists.length}
        totalEstimatedCost={totalEstimatedCost}
        isScanning={isScanning}
        isListening={isListening}
        onScanBarcode={() => { void handleStartBarcodeScanning(); }}
        onVoiceAdd={handleVoiceInput}
        onAddItem={() => setShowAddItem(true)}
      />

      {/* Navigation Tabs */}
      <div className="bg-white rounded-xl shadow-sm border">
        <ViewTabs
          activeView={activeView}
          totalMasterItems={totalMasterItems}
          storeListsCount={storeLists.length}
          onViewChange={setActiveView}
        />

        {/* Master List View */}
        {activeView === 'master' && (
          <MasterListView
            items={shoppingItems}
            stores={stores}
            onToggleItem={(itemId) => { void toggleShoppingItem(itemId); }}
            onEditItem={startEditItem}
            onDeleteItem={(itemId) => { void deleteShoppingItem(itemId); }}
            onFindStores={openStoreSuggestions}
            onShowStorePrefs={() => setShowStorePrefs(true)}
          />
        )}

        {/* Distribution View */}
        {activeView === 'distribute' && (
          <DistributeView
            items={shoppingItems}
            stores={stores}
            distributionStrategy={distributionStrategy}
            onStrategyChange={setDistributionStrategy}
            onDistribute={distributeItemsToStores}
          />
        )}

        {/* Store Lists View */}
        {activeView === 'stores' && (
          <StoreListsView
            storeLists={storeLists}
            stores={stores}
          />
        )}
      </div>

      {/* Pantry View */}
      {activeView === 'pantry' && (
        <PantryView
          pantryItems={pantryItems}
          onAddItem={() => setShowAddPantry(true)}
          onScanReceipt={() => setShowScanReceipt(true)}
          onAddToShopping={addShoppingItem}
          onUpdateItem={async (itemId, updates) => {
            await updatePantryItem.mutateAsync({ itemId, updates });
          }}
          onDeleteItem={(itemId) => { void deletePantryItem.mutate(itemId); }}
          onShowToast={showToast}
        />
      )}

      <ShoppingModals
        showAddPantry={showAddPantry}
        onAddPantryClose={() => setShowAddPantry(false)}
        onAddPantrySave={handleAddPantryItem}
        showScanReceipt={showScanReceipt}
        onScanReceiptClose={() => setShowScanReceipt(false)}
        onAddToPantry={handleAddToPantry}
        onLogExpense={handleLogExpense}
        showBarcodeScanner={showBarcodeScanner}
        isScanning={isScanning}
        barcodeResult={barcodeResult}
        captureMessage={captureMessage}
        videoRef={videoRef}
        onBarcodeScannerClose={handleStopBarcodeScanning}
        onBarcodeCapture={() => { void captureNow(); }}
        onBarcodeStop={handleStopBarcodeScanning}
        showEditItem={showEditItem}
        editFormData={editItemForm.formData}
        stores={stores}
        onEditItemClose={closeEditModal}
        onEditItemSubmit={updateExistingItem}
        onEditFormChange={(updates) => editItemForm.updateForm(updates)}
        showAddItem={showAddItem}
        addFormData={newItemForm.formData}
        onAddItemClose={() => setShowAddItem(false)}
        onAddItemSubmit={addItemToMaster}
        onAddFormChange={(updates) => newItemForm.updateForm(updates)}
        onBarcodeChange={setBarcodeResult}
        showLocationSuggestions={showLocationSuggestions}
        selectedItemForSuggestions={selectedItemForSuggestions}
        userLocation={userLocation}
        nearbyStores={selectedItemForSuggestions ? findNearbyStoresForItem(selectedItemForSuggestions) : []}
        onStoreSuggestionsClose={closeStoreSuggestions}
        onGetLocation={() => { void getUserLocation(); }}
        onAssignStore={(storeId) => {
          if (selectedItemForSuggestions) {
            void updateShoppingItem(selectedItemForSuggestions.id, {
              assignedStore: storeId,
              bestStores: [storeId, ...(selectedItemForSuggestions.bestStores ?? [])]
            });
          }
        }}
      />
    </div>
  );
}
