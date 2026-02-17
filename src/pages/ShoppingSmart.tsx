import React, { type ReactElement, useState, useEffect } from 'react';
import { Bell, Settings } from 'lucide-react';
import { logger } from '../services/logger';
import { useToast } from '../hooks/useToast';
import { useThemeColors } from '../hooks/useThemeColors';
import type { ShoppingItem, ShoppingList, Store } from '../shopping/types';
import { distributeItemsToStores as distributeItems, type DistributionStrategy } from '../shopping/services/storeDistribution';
import type { ParsedReceiptItem } from '../shopping/services/receiptParser';
import { ShoppingModals } from '../shopping/components/layout/ShoppingModals';
import { MasterListView, DistributeView, StoreListsView, PantryView, ShoppingHistoryView } from '../shopping/components/views';
import { PantryGridView } from '../shopping/components/views/PantryGridView';
import { StoresRichView } from '../shopping/components/views/StoresRichView';
import { SegmentedControl } from '../components/ui/SegmentedControl';
import { AddItemChoiceModal } from '../shopping/components/modals/AddItemChoiceModal';
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
  useReceiptHandler,
} from '../shopping/hooks';
import { useStoresQuery, useCreateStore } from '../hooks/useStoresQuery';
import { AddStoreModal } from '../shopping/components/modals/AddStoreModal';
import { StoreShoppingListModal } from '../shopping/components/modals/StoreShoppingListModal';
import { PantryItemDetailsModal } from '../shopping/components/modals/PantryItemDetailsModal';
import { AddToPantryPrompt } from '../shopping/components/modals/AddToPantryPrompt';
import ConfirmDialog from '../components/DebtPayoffCalculator/ConfirmDialog';
import type { PantryItem } from '../types';

type ViewType = 'list' | 'pantry' | 'stores' | 'history';

export default function ShoppingSmart(): ReactElement {
  const { shoppingItems, pantryItems, activeListId, isLoadingList, isLoadingItems, ensureActiveList } = useShoppingData();
  const { addShoppingItem, updateShoppingItem, deleteShoppingItem, toggleShoppingItem, createPantryItem, updatePantryItem, deletePantryItem } = useShoppingMutations({ activeListId, ensureActiveList, shoppingItems });
  const { data: stores = [], isLoading: isLoadingStores } = useStoresQuery();
  const createStoreMutation = useCreateStore();
  const { showToast } = useToast();
  const colors = useThemeColors();

  // All state hooks must be called before any conditional returns
  const [activeView, setActiveView] = useState<ViewType>('list');
  const [showAddChoiceModal, setShowAddChoiceModal] = useState(false);
  const [showAddStoreModal, setShowAddStoreModal] = useState(false);
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [selectedPantryItem, setSelectedPantryItem] = useState<PantryItem | null>(null);
  const [itemToPantry, setItemToPantry] = useState<ShoppingItem | null>(null);
  const [storeLists, setStoreLists] = useState<ShoppingList[]>([]);
  const [distributionStrategy, setDistributionStrategy] = useState<DistributionStrategy>('mixed');
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [isDistributing, setIsDistributing] = useState(false);

  // Form state management using consolidated hook
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
  const { handleReceiptScanned } = useReceiptHandler({
    shoppingItems,
    updateShoppingItem,
    showToast,
    storeId: selectedStore?.id,
  });

  useEffect(() => {
    if (!isLoadingList && !activeListId) {
      ensureActiveList().catch((error: unknown) => logger.error('ShoppingSmart', error as Error));
    }
  }, [isLoadingList, activeListId, ensureActiveList]);

  // Show loading state while initial data is loading (after all hooks are called)
  const isInitialLoading = isLoadingList || (isLoadingItems && shoppingItems.length === 0) || isLoadingStores;

  if (isInitialLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent mx-auto mb-4" />
          <p className="text-gray-600">Loading shopping data...</p>
        </div>
      </div>
    );
  }

  // Smart distribution algorithm - analyzes master list to determine optimal stores
  const distributeItemsToStores = async (): Promise<void> => {
    try {
      setIsDistributing(true);

      const unpurchasedItems = shoppingItems.filter(item => !item.purchased);

      const newStoreLists = distributeItems({
        items: shoppingItems,
        stores,
        strategy: distributionStrategy
      });

      setStoreLists(newStoreLists);

      showToast(
        `Successfully distributed ${unpurchasedItems.length} items to ${newStoreLists.length} stores!`,
        'success'
      );

      setActiveView('stores');
    } catch (error) {
      logger.error('Shopping', error as Error);
      showToast('Failed to distribute items. Please try again.', 'error');
    } finally {
      setIsDistributing(false);
    }
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

  // Combined receipt handler: match to shopping list + optionally add to pantry
  const handleReceiptItems = async (items: ParsedReceiptItem[]): Promise<void> => {
    try {
      // First, try to match and update shopping items
      await handleReceiptScanned(items);

      // Optionally: add remaining items to pantry
      // For now, we just update shopping items
      // Future enhancement: allow user to choose which items to add to pantry
    } catch (error) {
      logger.error('ShoppingSmart', error as Error, {
        context: 'handleReceiptItems',
      });
      showToast('Failed to process receipt', 'error');
    }
  };

  const totalMasterItems = shoppingItems.filter((item: ShoppingItem) => !item.purchased).length;
  const totalEstimatedCost = shoppingItems.reduce((sum: number, item: ShoppingItem) => sum + (item.estimatedPrice ?? 0), 0);

  // Wrapper for toggle that prompts to add to pantry when marking as purchased
  const handleToggleItem = async (itemId: string): Promise<void> => {
    const item = shoppingItems.find(i => i.id === itemId);
    if (!item) return;

    // If marking as purchased (was not purchased before), show prompt
    if (!item.purchased) {
      setItemToPantry(item);
    }

    // Toggle the item
    await toggleShoppingItem(itemId);
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: colors.bg.primary }}>
      {/* Segmented Control and Views - Both Mobile and Desktop */}
      <div style={{ paddingTop: '0px' }}>
        {/* Segmented Control */}
        <div style={{ padding: '16px 20px' }}>
          <SegmentedControl
            segments={[
              { value: 'list', label: 'List' },
              { value: 'pantry', label: 'Pantry' },
              { value: 'stores', label: 'Stores' },
              { value: 'history', label: 'History' },
            ]}
            value={activeView}
            onChange={(value) => setActiveView(value as ViewType)}
          />
        </div>

        {/* Content based on active view */}
        {activeView === 'list' && (
          <MasterListView
            items={shoppingItems}
            stores={stores}
            onToggleItem={(itemId) => { void handleToggleItem(itemId); }}
            onEditItem={startEditItem}
            onRequestDeleteItem={(itemId) => setItemToDelete(itemId)}
            onFindStores={openStoreSuggestions}
            onShowStorePrefs={() => setShowStorePrefs(true)}
          />
        )}

        {activeView === 'pantry' && (
          <PantryGridView
            items={pantryItems}
            onItemClick={(item) => setSelectedPantryItem(item)}
            onAddItem={() => setShowAddPantry(true)}
          />
        )}

        {activeView === 'stores' && (
          <StoresRichView
            stores={stores}
            shoppingItems={shoppingItems}
            onViewStoreList={(store) => setSelectedStore(store)}
            onAddStore={() => setShowAddStoreModal(true)}
          />
        )}

        {activeView === 'history' && (
          <ShoppingHistoryView
            items={shoppingItems}
            onScanReceipt={() => setShowScanReceipt(true)}
          />
        )}
      </div>

      {/* Floating Action Button - Terracotta Gradient */}
      <button
        onClick={() => setShowAddChoiceModal(true)}
        className="fixed z-40 flex items-center justify-center rounded-full transition-transform duration-200 hover:scale-110 active:scale-95"
        style={{
          width: '64px',
          height: '64px',
          background: `linear-gradient(135deg, ${colors.accent.start} 0%, ${colors.accent.end} 100%)`,
          bottom: '116px', // Above tab bar (100px) + spacing
          right: '24px',
          boxShadow: '0 4px 16px rgba(212, 165, 116, 0.35)',
        }}
        aria-label="Add shopping item"
      >
        <svg
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          stroke="white"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
      </button>

      {/* Add Item Choice Modal */}
      <AddItemChoiceModal
        isOpen={showAddChoiceModal}
        onClose={() => setShowAddChoiceModal(false)}
        onSelectBarcode={() => {
          setShowAddChoiceModal(false);
          void handleStartBarcodeScanning();
        }}
        onSelectVoice={() => {
          setShowAddChoiceModal(false);
          handleVoiceInput();
        }}
        onSelectManual={() => {
          setShowAddChoiceModal(false);
          setShowAddItem(true);
        }}
      />

      <ShoppingModals
        showAddPantry={showAddPantry}
        onAddPantryClose={() => setShowAddPantry(false)}
        onAddPantrySave={handleAddPantryItem}
        showScanReceipt={showScanReceipt}
        onScanReceiptClose={() => setShowScanReceipt(false)}
        onAddToPantry={handleReceiptItems}
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

      {/* Add Store Modal */}
      <AddStoreModal
        isOpen={showAddStoreModal}
        onClose={() => setShowAddStoreModal(false)}
        onSubmit={(storeData) => {
          createStoreMutation.mutate(storeData, {
            onSuccess: () => {
              showToast('Store added successfully!', 'success');
              setShowAddStoreModal(false);
            },
            onError: (error) => {
              showToast(`Failed to add store: ${error.message}`, 'error');
            },
          });
        }}
      />

      {/* Store Shopping List Modal */}
      <StoreShoppingListModal
        isOpen={!!selectedStore}
        onClose={() => setSelectedStore(null)}
        store={selectedStore}
        shoppingItems={shoppingItems}
        onToggleItem={(itemId) => { void handleToggleItem(itemId); }}
      />

      {/* Add to Pantry Prompt */}
      <AddToPantryPrompt
        isOpen={!!itemToPantry}
        itemName={itemToPantry?.name ?? ''}
        onAddToPantry={() => {
          if (!itemToPantry) return;

          // Pre-fill the pantry modal with the item details
          void createPantryItem({
            name: itemToPantry.name,
            quantity: itemToPantry.quantity,
            unit: itemToPantry.unit ?? 'pcs',
            category: itemToPantry.category === 'meat' ? 'meat' :
                     itemToPantry.category === 'dairy' ? 'dairy' :
                     itemToPantry.category === 'produce' ? 'produce' :
                     itemToPantry.category === 'bakery' ? 'bakery' :
                     itemToPantry.category === 'pantry' ? 'pantry' : 'other',
            notes: `Added from shopping list`,
            lowStockThreshold: 1,
            isLowStock: false,
          });

          showToast(`${itemToPantry.name} added to pantry`, 'success');
          setItemToPantry(null);
        }}
        onDismiss={() => setItemToPantry(null)}
      />

      {/* Pantry Item Details Modal */}
      <PantryItemDetailsModal
        isOpen={!!selectedPantryItem}
        onClose={() => setSelectedPantryItem(null)}
        item={selectedPantryItem}
        onUpdate={async (itemId, updates) => {
          await updatePantryItem(itemId, updates);
        }}
        onDelete={async (itemId) => {
          await deletePantryItem(itemId);
        }}
        onReplenish={(pantryItem) => {
          // Add pantry item to shopping list
          void addShoppingItem({
            name: pantryItem.name,
            quantity: pantryItem.lowStockThreshold ?? 1,
            unit: pantryItem.unit ?? 'pcs',
            category: pantryItem.category === 'meat' ? 'meat' as const : pantryItem.category === 'dairy' ? 'dairy' as const : 'other' as const,
            priority: 'medium',
            purchased: false,
            notes: `Replenish from pantry`,
          });
          showToast(`${pantryItem.name} added to shopping list`, 'success');
        }}
      />

      {/* Item deletion confirmation dialog */}
      {itemToDelete && (
        <ConfirmDialog
          title="Delete Item"
          message="Are you sure you want to delete this item from your shopping list?"
          onConfirm={() => {
            void deleteShoppingItem(itemToDelete);
            setItemToDelete(null);
          }}
          onCancel={() => setItemToDelete(null)}
        />
      )}
    </div>
  );
}
