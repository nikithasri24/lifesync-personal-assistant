/* eslint-disable max-lines */
// TODO: Refactor this file to be under 400 lines by extracting components and logic
import React, { useState, useEffect, useMemo } from 'react';
import { logger } from '../services/logger';

import { useAppStore } from '../stores/useAppStore';
import type { ShoppingItem, Store as StoreType, ShoppingList } from '../shopping/types';
import { distributeItemsToStores as distributeItems, type DistributionStrategy } from '../shopping/services/storeDistribution';
import { mapShoppingItemDataToModel, mapShoppingItemToCreateInput, mapShoppingItemToUpdateInput } from '../shopping/services/shoppingMappers';
import { MOCK_STORES } from '../shopping/fixtures/mockStores';
import { ShoppingHeader } from '../shopping/components/layout/ShoppingHeader';
import { ViewTabs } from '../shopping/components/layout/ViewTabs';
import { MasterListView, DistributeView, StoreListsView } from '../shopping/components/views';
import { AddItemModal, EditItemModal, BarcodeScannerModal, ReceiptScanningModal, AddPantryItemModal, StoreSuggestionsModal } from '../shopping/components/modals';
import { PantryActionButtons } from '../shopping/components/pantry/PantryActionButtons';
import { PantryTable } from '../shopping/components/pantry/PantryTable';
import { useVoiceInput, useBarcodeScanner, useStoreSuggestions, usePantryManagement, useItemForm, useShoppingModals, usePantryActions } from '../shopping/hooks';
import { smartRecommendStores } from '../shopping/utils/storeUtils';
import { createShoppingItemFromPantry } from '../shopping/utils/pantryUtils';
import {
  useActiveShoppingList,
  useShoppingItems,
  useCreateShoppingItem,
  useUpdateShoppingItem,
  useDeleteShoppingItem,
  useToggleShoppingItem} from '../hooks/useShoppingQuery';
import {
  usePantryItemsQuery,
  useCreatePantryItemMutation,
  useUpdatePantryItemMutation,
  useDeletePantryItemMutation,
  type PantryItem as PantryItemType} from '../mealPlanning/hooks/useMealPlanningQuery';
import {
  Plus,
  ShoppingCart,
  Search,
  Filter,
  Check,
  X,
  Edit3,
  Trash2,
  Star,
  MapPin,
  DollarSign,
  Clock,
  Users,
  Archive,
  ShoppingBag,
  TrendingUp,
  Package,
  Zap,
  BarChart3,
  Share2,
  Copy,
  ChevronDown,
  ChevronRight,
  Scan,
  AlertCircle,
  Heart,
  Calendar,
  ArrowRight,
  Store,
  Target,
  Award,
  Shuffle,
  FileText,
  Calculator,
  Mic,
  Camera,
  Send,
  Settings,
  Globe,
  Building,
  Navigation,
  Receipt} from 'lucide-react';

export default function ShoppingSmart(): JSX.Element {
  // React Query hooks for shopping data
  const { activeListId, isLoading: isLoadingList, ensureActiveList } = useActiveShoppingList();
  const { data: shoppingItemsData, isLoading: isLoadingItems } = useShoppingItems(activeListId);
  const createItemMutation = useCreateShoppingItem();
  const updateItemMutation = useUpdateShoppingItem();
  const deleteItemMutation = useDeleteShoppingItem();
  const toggleItemMutation = useToggleShoppingItem();

  // Map React Query data to component format
  const shoppingItems = useMemo(() => {
    if (!shoppingItemsData) return [];
    return mapShoppingItemDataToModel(shoppingItemsData);
  }, [shoppingItemsData]);

  // React Query hooks for pantry data
  const { data: pantryItems = [], isLoading: pantryLoading } = usePantryItemsQuery();
  const createPantryItemMutation = useCreatePantryItemMutation();
  const updatePantryItemMutation = useUpdatePantryItemMutation();
  const deletePantryItemMutation = useDeletePantryItemMutation();

  const _shoppingLoading = isLoadingList || isLoadingItems || pantryLoading;

  // Get other store data that hasn't been migrated yet
  const { showGlobalToast, addFinancialTransaction, financialAccounts } = useAppStore();

  // Ensure active shopping list exists on mount
  useEffect(() => {
    if (!isLoadingList && !activeListId) {
      ensureActiveList().catch((error: unknown) => {
        logger.error('ShoppingSmart', 'Failed to create shopping list:', error as Error);
      });
    }
  }, [isLoadingList, activeListId, ensureActiveList]);

  // Wrapper functions to maintain same API as Zustand store
  const addShoppingItem = async (item: Omit<ShoppingItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<void> => {
    const listId = activeListId ?? (await ensureActiveList()).id ?? '';
    await createItemMutation.mutateAsync({
      listId,
      item: mapShoppingItemToCreateInput(item)});
  };

  const updateShoppingItem = (itemId: string, updates: Partial<ShoppingItem>): Promise<ShoppingItem> => {
    return updateItemMutation.mutateAsync({
      itemId,
      updates: mapShoppingItemToUpdateInput(updates)});
  };

  const deleteShoppingItem = (itemId: string): Promise<void> => {
    return deleteItemMutation.mutateAsync(itemId);
  };

  const toggleShoppingItem = (itemId: string): Promise<ShoppingItem | void> => {
    const item = shoppingItems.find((i) => i.id === itemId);
    if (!item) return Promise.resolve();
    return toggleItemMutation.mutateAsync({
      itemId,
      currentStatus: item.purchased});
  };

  // Sample stores with ratings and preferences
  const [stores] = useState<StoreType[]>(MOCK_STORES);

  // Use global shopping items as master list
  const _masterList = shoppingItems;

  // Store-specific lists (auto-generated from master list)
  const [storeLists, setStoreLists] = useState<ShoppingList[]>([]);

  const [activeView, setActiveView] = useState<'master' | 'stores' | 'distribute' | 'pantry'>('master');
  const [searchQuery, _setSearchQuery] = useState('');
  const [_selectedStores, _setSelectedStores] = useState<string[]>([]);
  const [distributionStrategy, setDistributionStrategy] = useState<DistributionStrategy>('mixed');

  // Form state management using consolidated hook
  const newItemForm = useItemForm();
  const editItemForm = useItemForm();

  // Voice recognition
  const { isListening, startVoiceInput } = useVoiceInput();

  // Modal state management using consolidated hook
  const {
    showAddItem,
    setShowAddItem,
    showEditItem,
    editingItem,
    openEditModal,
    closeEditModal,
    showAddPantry,
    setShowAddPantry,
    showScanReceipt,
    setShowScanReceipt,
    showLocationSuggestions,
    selectedItemForSuggestions,
    openStoreSuggestions,
    closeStoreSuggestions,
    showBarcodeScanner,
    setShowBarcodeScanner,
    barcodeResult,
    setBarcodeResult,
    _showStorePrefs,
    setShowStorePrefs} = useShoppingModals();

  // Barcode scanning
  const {
    isScanning,
    captureMessage,
    videoRef,
    startScanning,
    stopScanning,
    captureNow} = useBarcodeScanner((barcode, productInfo) => {
    newItemForm.updateForm({
      name: productInfo.name,
      estimatedPrice: productInfo.price?.toString() ?? '',
      category: (productInfo.category as ShoppingItem['category']) ?? 'other'
    });
    setBarcodeResult(barcode);
    setShowAddItem(true);
    setShowBarcodeScanner(false);
  });

  // Location-based suggestions using custom hook
  const { userLocation, getUserLocation, findNearbyStoresForItem } = useStoreSuggestions(stores);

  // Pantry management using custom hook
  const {
    pantryFilter,
    setPantryFilter,
    pantrySort,
    setPantrySort,
    editingPantryId,
    editPantry,
    setEditPantry,
    startEditingPantry,
    cancelEditing,
    replenishId,
    startReplenish,
    cancelReplenish,
    pantrySortedFiltered} = usePantryManagement(pantryItems);

  // Pantry bulk actions using custom hook
  const { addLowStockToShopping, addExpiredToShopping } = usePantryActions(pantryItems, addShoppingItem);

  // Heuristic parser to extract item lines from receipt text with auto-categorization

  // Smart distribution algorithm - now analyzes master list to determine optimal stores
  const distributeItemsToStores = (): void => {
    const newStoreLists = distributeItems({
      items: shoppingItems,
      stores,
      strategy: distributionStrategy
    });
    setStoreLists(newStoreLists);
    setActiveView('stores');
  };

  // Auto-populate distribute tab when master list changes
  useEffect(() => {
    if (shoppingItems.length > 0) {
      distributeItemsToStores();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shoppingItems]);

  // Voice input handler
  const handleVoiceInput = (): void => {
    startVoiceInput((transcript) => {
      newItemForm.updateForm({ name: transcript });
      setShowAddItem(true);
    });
  };

  // Barcode scanning handlers
  const handleStartBarcodeScanning = async (): Promise<void> => {
    setShowBarcodeScanner(true);
    await startScanning();
  };

  const handleStopBarcodeScanning = (): void => {
    stopScanning();
    setShowBarcodeScanner(false);
  };


  // Start editing an item
  const startEditItem = (item: ShoppingItem): void => {
    editItemForm.loadItem({
      name: item.name,
      quantity: item.quantity,
      unit: item.unit ?? 'pcs',
      category: item.category,
      priority: item.priority,
      estimatedPrice: item.estimatedPrice?.toString() ?? '',
      brand: item.brand ?? '',
      notes: item.notes ?? '',
      preferredStore: item.assignedStore ?? ''
    });
    openEditModal(item);
  };

  // Update existing item
  const updateExistingItem = (e: React.FormEvent): void => {
    e.preventDefault();
    const editItem = editItemForm.formData;
    if (!editingItem || !editItem.name.trim()) return;

    // Use preferred store if specified, otherwise use existing recommendations
    let bestStores: string[];
    if (editItem.preferredStore) {
      const smartRecommendation = smartRecommendStores(stores, editItem.name, editItem.category);
      bestStores = [editItem.preferredStore, ...smartRecommendation.filter(id => id !== editItem.preferredStore)];
    } else {
      bestStores = editingItem.bestStores ?? smartRecommendStores(stores, editItem.name, editItem.category);
    }

    const updatedData = {
      name: editItem.name,
      quantity: editItem.quantity,
      unit: editItem.unit,
      category: editItem.category,
      priority: editItem.priority,
      estimatedPrice: editItem.estimatedPrice ? parseFloat(editItem.estimatedPrice) : undefined,
      brand: editItem.brand !== '' ? editItem.brand : undefined,
      notes: editItem.notes !== '' ? editItem.notes : undefined,
      bestStores: bestStores,
      assignedStore: editItem.preferredStore !== '' ? editItem.preferredStore : undefined,
      updatedAt: new Date()
    };

    void updateShoppingItem(editingItem.id, updatedData);
    closeEditModal();
    editItemForm.resetForm();
  };

  // Add item to master list
  const addItemToMaster = (e: React.FormEvent): void => {
    e.preventDefault();
    const newItem = newItemForm.formData;
    if (!newItem.name.trim()) return;

    // Use preferred store if specified, otherwise use AI recommendation
    let bestStores: string[];
    if (newItem.preferredStore) {
      // Put preferred store first, then add AI recommendations
      const smartRecommendation = smartRecommendStores(stores, newItem.name, newItem.category);
      bestStores = [newItem.preferredStore, ...smartRecommendation.filter(id => id !== newItem.preferredStore)];
    } else {
      bestStores = smartRecommendStores(stores, newItem.name, newItem.category);
    }

    const item = {
      name: newItem.name,
      quantity: newItem.quantity,
      unit: newItem.unit,
      category: newItem.category,
      priority: newItem.priority,
      purchased: false,
      estimatedPrice: newItem.estimatedPrice ? parseFloat(newItem.estimatedPrice) : undefined,
      brand: newItem.brand !== '' ? newItem.brand : undefined,
      notes: newItem.notes !== '' ? newItem.notes : undefined,
      barcode: barcodeResult ?? undefined,
      bestStores: bestStores,
      assignedStore: newItem.preferredStore !== '' ? newItem.preferredStore : undefined, // Pre-assign if user has preference
    };

    void addShoppingItem(item);
    newItemForm.resetForm();
    setBarcodeResult(null);
    setShowAddItem(false);
  };

  // Smart store recommendation algorithm

  const _filteredMasterItems = shoppingItems.filter(item =>
    searchQuery === '' || item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalMasterItems = shoppingItems.filter(item => !item.purchased).length;
  const totalEstimatedCost = shoppingItems.reduce((sum, item) => sum + (item.estimatedPrice ?? 0), 0);

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
        <div className="bg-white rounded-xl shadow-sm border p-4 mt-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold">Pantry</h4>
            <PantryActionButtons
              pantryItems={pantryItems}
              pantryFilter={pantryFilter}
              pantrySort={pantrySort}
              onFilterChange={setPantryFilter}
              onSortChange={setPantrySort}
              onAddLowStock={async () => {
                const count = await addLowStockToShopping();
                showGlobalToast?.(`Added ${count} low-stock items to shopping`, 'success');
              }}
              onAddExpired={async () => {
                const count = await addExpiredToShopping();
                showGlobalToast?.(`Moved ${count} expired items to shopping`, 'info');
              }}
              onAddItem={() => setShowAddPantry(true)}
              onScanReceipt={() => setShowScanReceipt(true)}
            />
          </div>

          <PantryTable
            items={pantrySortedFiltered}
            editingItemId={editingPantryId}
            editData={editPantry}
            replenishId={replenishId}
            onEditChange={(updates) => setEditPantry(s => ({ ...s, ...updates }))}
            onSaveEdit={(itemId) => {
              const qty = Number(editPantry.qty) || 0;
              const exp = editPantry.exp ? new Date(editPantry.exp) : undefined;
              void updatePantryItemMutation.mutateAsync({
                itemId,
                updates: {
                  quantity: qty,
                  unit: editPantry.unit !== '' ? editPantry.unit : undefined,
                  expirationDate: exp,
                  isLowStock: editPantry.low,
                  lowStockThreshold: editPantry.threshold ? Number(editPantry.threshold) : undefined
                }
              }).then(() => {
                cancelEditing();
              });
            }}
            onCancelEdit={cancelEditing}
            onStartEdit={startEditingPantry}
            onStartReplenish={startReplenish}
            onReplenish={async (targetQuantity) => {
              const item = pantryItems.find(x => x.id === replenishId);
              if (!item) return;

              const need = Math.max(0, targetQuantity - (item.quantity || 0));
              if (need <= 0) {
                showGlobalToast?.('Already at or above target', 'info');
                cancelReplenish();
                return;
              }

              const shoppingItem = createShoppingItemFromPantry(item, need);
              await addShoppingItem({ ...shoppingItem, tags: ['from:pantry', 'reason:replenish'] });
              showGlobalToast?.(`Added ${need} ${item.unit ?? ''} of ${item.name} to shopping`, 'success');
              cancelReplenish();
            }}
            onCancelReplenish={cancelReplenish}
            onAddToShopping={(item: PantryItemType) => {
              const qty = (item.lowStockThreshold != null && item.quantity < item.lowStockThreshold)
                ? (item.lowStockThreshold - item.quantity)
                : item.quantity ?? 1;
              const shoppingItem = createShoppingItemFromPantry(item, qty);
              void addShoppingItem(shoppingItem);
              showGlobalToast?.(`Added ${item.name} to shopping`, 'success');
            }}
            onDelete={(itemId) => void deletePantryItemMutation.mutate(itemId)}
          />
        </div>
      )}

      {/* Add Pantry Modal */}
      <AddPantryItemModal
        isOpen={showAddPantry}
        onClose={() => setShowAddPantry(false)}
        onSave={async (item) => {
          await createPantryItemMutation.mutateAsync(item);
        }}
      />

      {/* Scan Receipt Modal */}
      <ReceiptScanningModal
        isOpen={showScanReceipt}
        onClose={() => setShowScanReceipt(false)}
        onAddToPantry={async (items) => {
          for (const it of items) {
            const thresholdNum = it.threshold ? Number(it.threshold) : undefined;
            await createPantryItemMutation.mutateAsync({
              name: it.name,
              quantity: it.quantity,
              category: it.category,
              lowStockThreshold: thresholdNum,
              isLowStock: thresholdNum != null ? it.quantity <= thresholdNum : undefined
            });
          }
          showGlobalToast?.(`Added ${items.length} items to pantry`, 'success');
        }}
        onLogExpense={async (amount, merchant) => {
          const accounts = financialAccounts as Array<{ id: string }> | undefined;
          const acctId = accounts?.[0]?.id;
          if (!acctId) {
            showGlobalToast?.('Add a financial account first (Financials tab)', 'info');
            return;
          }
          try {
            const addTransaction = addFinancialTransaction as ((transaction: {
              accountId: string;
              amount: number;
              type: string;
              description: string;
              date: Date;
              categoryId: undefined;
            }) => Promise<void>) | undefined;
            await addTransaction?.({
              accountId: acctId,
              amount: Number(amount.toFixed(2)),
              type: 'expense',
              description: `Groceries — ${merchant}`,
              date: new Date(),
              categoryId: undefined});
            showGlobalToast?.('Logged groceries expense', 'success');
          } catch (_e) {
            showGlobalToast?.('Failed to log expense', 'error');
          }
        }}
      />
      {/* Barcode Scanner Modal */}
      <BarcodeScannerModal
        isOpen={showBarcodeScanner}
        isScanning={isScanning}
        barcodeResult={barcodeResult}
        captureMessage={captureMessage}
        videoRef={videoRef}
        onClose={handleStopBarcodeScanning}
        onCapture={() => { void captureNow(); }}
        onStop={handleStopBarcodeScanning}
      />

      {/* Edit Item Modal */}
      <EditItemModal
        isOpen={showEditItem}
        formData={editItemForm.formData}
        stores={stores}
        onClose={closeEditModal}
        onSubmit={updateExistingItem}
        onFormChange={(updates) => editItemForm.updateForm(updates)}
      />

      {/* Add Item Modal */}
      <AddItemModal
        isOpen={showAddItem}
        formData={newItemForm.formData}
        barcodeResult={barcodeResult}
        stores={stores}
        onClose={() => setShowAddItem(false)}
        onSubmit={addItemToMaster}
        onFormChange={(updates) => newItemForm.updateForm(updates)}
        onBarcodeChange={setBarcodeResult}
      />

      {/* Store Suggestions Modal */}
      <StoreSuggestionsModal
        isOpen={showLocationSuggestions}
        item={selectedItemForSuggestions}
        userLocation={userLocation}
        nearbyStores={selectedItemForSuggestions ? findNearbyStoresForItem(selectedItemForSuggestions) : []}
        onClose={closeStoreSuggestions}
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

// Master Item Card Component
