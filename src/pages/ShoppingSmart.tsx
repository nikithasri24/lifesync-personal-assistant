/* eslint-disable max-lines */
// TODO: Refactor this file to be under 400 lines by extracting components and logic
import React, { type ReactElement, useState, useEffect, useMemo , type FormEvent } from 'react';
import { logger } from '../services/logger';

import { useComposedStore } from '../stores/useComposedStore';
import { useToast } from '../hooks/useToast';
import type { ShoppingItem, Store as StoreType, ShoppingList } from '../shopping/types';
import { distributeItemsToStores as distributeItems, type DistributionStrategy } from '../shopping/services/storeDistribution';
import { mapShoppingItemDataToModel, mapShoppingItemToCreateInput, mapShoppingItemToUpdateInput } from '../shopping/services/shoppingMappers';
import { ShoppingHeader } from '../shopping/components/layout/ShoppingHeader';
import { ViewTabs } from '../shopping/components/layout/ViewTabs';
import { ShoppingModals } from '../shopping/components/layout/ShoppingModals';
import { MasterListView, DistributeView, StoreListsView, PantryView } from '../shopping/components/views';
import { useVoiceInput, useBarcodeScanner, useStoreSuggestions, useItemForm, useShoppingModals } from '../shopping/hooks';
import { smartRecommendStores } from '../shopping/utils/storeUtils';
import {
  useActiveShoppingList,
  useShoppingItems,
  useCreateShoppingItem,
  useUpdateShoppingItem,
  useDeleteShoppingItem,
  useToggleShoppingItem} from '../hooks/useShoppingQuery';
import { useStoresQuery } from '../hooks/useStoresQuery';
import {
  usePantryItemsQuery,
  useCreatePantryItemMutation,
  useUpdatePantryItemMutation,
  useDeletePantryItemMutation,
  type PantryItem as PantryItemType} from '@/hooks/useMealPlanningQuery';
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

export default function ShoppingSmart(): ReactElement {
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

  // Get other store data that hasn't been migrated yet
  const { showToast } = useToast();

  // Ensure active shopping list exists on mount
  useEffect(() => {
    if (!isLoadingList && !activeListId) {
      ensureActiveList().catch((error: unknown) => {
        logger.error('ShoppingSmart', error as Error);
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

  const updateShoppingItem = async (itemId: string, updates: Partial<ShoppingItem>): Promise<ShoppingItem> => {
    const result = await updateItemMutation.mutateAsync({
      itemId,
      updates: mapShoppingItemToUpdateInput(updates)});
    return mapShoppingItemDataToModel([result])[0];
  };

  const deleteShoppingItem = async (itemId: string): Promise<void> => {
    await deleteItemMutation.mutateAsync(itemId);
  };

  const toggleShoppingItem = async (itemId: string): Promise<ShoppingItem | void> => {
    const item = shoppingItems.find((i) => i.id === itemId);
    if (!item) return Promise.resolve();
    const result = await toggleItemMutation.mutateAsync({
      itemId,
      currentStatus: item.purchased});
    return mapShoppingItemDataToModel([result])[0];
  };

  const { data: stores = [] } = useStoresQuery();

  // Store-specific lists (auto-generated from master list)
  const [storeLists, setStoreLists] = useState<ShoppingList[]>([]);

  const [activeView, setActiveView] = useState<'master' | 'stores' | 'distribute' | 'pantry'>('master');
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
    showStorePrefs: _showStorePrefs,
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
        <PantryView
          pantryItems={pantryItems}
          onAddItem={() => setShowAddPantry(true)}
          onScanReceipt={() => setShowScanReceipt(true)}
          onAddToShopping={addShoppingItem}
          onUpdateItem={async (itemId, updates) => {
            await updatePantryItemMutation.mutateAsync({ itemId, updates });
          }}
          onDeleteItem={(itemId) => { void deletePantryItemMutation.mutate(itemId); }}
          onShowToast={showToast}
        />
      )}

      <ShoppingModals
        showAddPantry={showAddPantry}
        onAddPantryClose={() => setShowAddPantry(false)}
        onAddPantrySave={async (item) => {
          await createPantryItemMutation.mutateAsync({
            ...item,
            createdAt: new Date()
          });
        }}
        showScanReceipt={showScanReceipt}
        onScanReceiptClose={() => setShowScanReceipt(false)}
        onAddToPantry={async (items) => {
          for (const it of items) {
            const thresholdNum = it.threshold ? Number(it.threshold) : undefined;
            const validPantryCategories = ['produce', 'dairy', 'meat', 'pantry', 'other'] as const;
            const pantryCategory = validPantryCategories.includes(it.category as any)
              ? (it.category as 'produce' | 'dairy' | 'meat' | 'pantry' | 'other')
              : 'other';

            await createPantryItemMutation.mutateAsync({
              name: it.name,
              quantity: it.quantity,
              category: pantryCategory,
              lowStockThreshold: thresholdNum,
              isLowStock: thresholdNum != null ? it.quantity <= thresholdNum : undefined,
              createdAt: new Date()
            });
          }
          showToast(`Added ${items.length} items to pantry`, 'success');
        }}
        onLogExpense={async (_amount, _merchant) => {
          showToast('Financial integration not available', 'info');
        }}
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

// Master Item Card Component
