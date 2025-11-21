import React, { useState, useEffect, useRef, useMemo } from 'react';
import { logger } from '../services/logger';

import { useAppStore } from '../stores/useAppStore';
import type { ShoppingItem, Store as StoreType, ShoppingList } from '../shopping/types';
import type { ViewType, ShoppingItemForm, PantryItemForm, PantryEditForm, PantryFilter, PantrySort } from '../shopping/types/forms';
import { createEmptyItemForm, createEmptyPantryForm, createEmptyPantryEditForm } from '../shopping/types/forms';
import { CATEGORY_ICONS, STORE_TYPES } from '../shopping/constants';
import { parseReceiptToItems, parseReceiptMeta, calculateReceiptCategorySummary, type ParsedReceiptItem } from '../shopping/services/receiptParser';
import { distributeItemsToStores as distributeItems, findBestStoreForItem, type DistributionStrategy } from '../shopping/services/storeDistribution';
import { lookupProductByBarcode } from '../shopping/services/barcodeService';
import { mapShoppingItemDataToModel, mapShoppingItemToCreateInput, mapShoppingItemToUpdateInput } from '../shopping/services/shoppingMappers';
import { MOCK_STORES } from '../shopping/fixtures/mockStores';
import { ShoppingHeader } from '../shopping/components/layout/ShoppingHeader';
import { ViewTabs } from '../shopping/components/layout/ViewTabs';
import { MasterListView, DistributeView, StoreListsView, PantryView } from '../shopping/components/views';
import { AddItemModal, EditItemModal, BarcodeScannerModal, ReceiptScanningModal, AddPantryItemModal, ReplenishModal, StoreSuggestionsModal } from '../shopping/components/modals';
import { useVoiceInput, useBarcodeScanner, useStoreSuggestions, usePantryManagement, useItemForm } from '../shopping/hooks';
import { smartRecommendStores } from '../shopping/utils/storeUtils';
import {
  useActiveShoppingList,
  useShoppingItems,
  useCreateShoppingItem,
  useUpdateShoppingItem,
  useDeleteShoppingItem,
  useToggleShoppingItem,
} from '../hooks/useShoppingQuery';
import {
  usePantryItemsQuery,
  useCreatePantryItemMutation,
  useUpdatePantryItemMutation,
  useDeletePantryItemMutation,
} from '../mealPlanning/hooks/useMealPlanningQuery';
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
  Receipt,
} from 'lucide-react';
import { format, isToday, isThisWeek, isThisMonth, differenceInCalendarDays } from 'date-fns';

export default function ShoppingSmart() {
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

  const shoppingLoading = isLoadingList || isLoadingItems || pantryLoading;

  // Get other store data that hasn't been migrated yet
  const { showGlobalToast, addFinancialTransaction, financialAccounts } = useAppStore();

  // Ensure active shopping list exists on mount
  useEffect(() => {
    if (!isLoadingList && !activeListId) {
      ensureActiveList().catch((error) => {
        logger.error('ShoppingSmart', 'Failed to create shopping list:', error);
      });
    }
  }, [isLoadingList, activeListId, ensureActiveList]);

  // Wrapper functions to maintain same API as Zustand store
  const addShoppingItem = async (item: Omit<ShoppingItem, 'id' | 'createdAt' | 'updatedAt'>) => {
    const listId = activeListId || (await ensureActiveList()).id || '';
    return createItemMutation.mutateAsync({
      listId,
      item: mapShoppingItemToCreateInput(item),
    });
  };

  const updateShoppingItem = (itemId: string, updates: Partial<ShoppingItem>) => {
    return updateItemMutation.mutateAsync({
      itemId,
      updates: mapShoppingItemToUpdateInput(updates),
    });
  };

  const deleteShoppingItem = (itemId: string) => {
    return deleteItemMutation.mutateAsync(itemId);
  };

  const toggleShoppingItem = (itemId: string) => {
    const item = shoppingItems.find((i) => i.id === itemId);
    if (!item) return Promise.resolve();
    return toggleItemMutation.mutateAsync({
      itemId,
      currentStatus: item.purchased,
    });
  };

  // Sample stores with ratings and preferences
  const [stores] = useState<StoreType[]>(MOCK_STORES);

  // Use global shopping items as master list
  const masterList = shoppingItems;

  // Store-specific lists (auto-generated from master list)
  const [storeLists, setStoreLists] = useState<ShoppingList[]>([]);

  const [activeView, setActiveView] = useState<'master' | 'stores' | 'distribute' | 'pantry'>('master');
  const [showAddItem, setShowAddItem] = useState(false);
  const [showEditItem, setShowEditItem] = useState(false);
  const [editingItem, setEditingItem] = useState<ShoppingItem | null>(null);
  const [showStorePrefs, setShowStorePrefs] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStores, setSelectedStores] = useState<string[]>([]);
  const [distributionStrategy, setDistributionStrategy] = useState<DistributionStrategy>('mixed');

  // Form state management using consolidated hook
  const newItemForm = useItemForm();
  const editItemForm = useItemForm();

  // Voice recognition
  const { isListening, startVoiceInput } = useVoiceInput();

  // Barcode scanning
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const {
    isScanning,
    barcodeResult,
    captureMessage,
    videoRef,
    startScanning,
    stopScanning,
    captureNow,
    setBarcodeResult,
  } = useBarcodeScanner((barcode, productInfo) => {
    setNewItem(prev => ({
      ...prev,
      name: productInfo.name,
      barcode: barcode,
      estimatedPrice: productInfo.price?.toString() || '',
      category: productInfo.category as any || 'other'
    }));
    setShowAddItem(true);
    setShowBarcodeScanner(false);
  });
  
  // Location-based suggestions using custom hook
  const { userLocation, getUserLocation, findNearbyStoresForItem } = useStoreSuggestions(stores);
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);
  const [selectedItemForSuggestions, setSelectedItemForSuggestions] = useState<ShoppingItem | null>(null);

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
    pantrySortedFiltered,
  } = usePantryManagement(pantryItems);

  // Pantry modal state
  const [showAddPantry, setShowAddPantry] = useState(false);
  // Receipt scanning
  const [showScanReceipt, setShowScanReceipt] = useState(false)

  // Heuristic parser to extract item lines from receipt text with auto-categorization

  // Auto-populate distribute tab when master list changes
  useEffect(() => {
    if (shoppingItems.length > 0) {
      distributeItemsToStores();
    }
  }, [shoppingItems]);

  // Smart distribution algorithm - now analyzes master list to determine optimal stores
  const distributeItemsToStores = () => {
    const newStoreLists = distributeItems({
      items: shoppingItems,
      stores,
      strategy: distributionStrategy
    });
    setStoreLists(newStoreLists);
    setActiveView('stores');
  };

  // Voice input handler
  const handleVoiceInput = () => {
    startVoiceInput((transcript) => {
      newItemForm.updateForm({ name: transcript });
      setShowAddItem(true);
    });
  };

  // Barcode scanning handlers
  const handleStartBarcodeScanning = async () => {
    setShowBarcodeScanner(true);
    await startScanning();
  };

  const handleStopBarcodeScanning = () => {
    stopScanning();
    setShowBarcodeScanner(false);
  };

  // Show store suggestions for an item
  const showStoreSuggestions = (item: ShoppingItem) => {
    setSelectedItemForSuggestions(item);
    setShowLocationSuggestions(true);
  };

  // Start editing an item
  const startEditItem = (item: ShoppingItem) => {
    setEditingItem(item);
    editItemForm.loadItem({
      name: item.name,
      quantity: item.quantity,
      unit: item.unit || 'pcs',
      category: item.category,
      priority: item.priority,
      estimatedPrice: item.estimatedPrice?.toString() || '',
      brand: item.brand || '',
      notes: item.notes || '',
      preferredStore: item.assignedStore || ''
    });
    setShowEditItem(true);
  };

  // Update existing item
  const updateExistingItem = (e: React.FormEvent) => {
    e.preventDefault();
    const editItem = editItemForm.formData;
    if (!editingItem || !editItem.name.trim()) return;

    // Use preferred store if specified, otherwise use existing recommendations
    let bestStores: string[];
    if (editItem.preferredStore) {
      const smartRecommendation = smartRecommendStores(stores, editItem.name, editItem.category);
      bestStores = [editItem.preferredStore, ...smartRecommendation.filter(id => id !== editItem.preferredStore)];
    } else {
      bestStores = editingItem.bestStores || smartRecommendStores(stores, editItem.name, editItem.category);
    }

    const updatedData = {
      name: editItem.name,
      quantity: editItem.quantity,
      unit: editItem.unit,
      category: editItem.category,
      priority: editItem.priority,
      estimatedPrice: editItem.estimatedPrice ? parseFloat(editItem.estimatedPrice) : undefined,
      brand: editItem.brand || undefined,
      notes: editItem.notes || undefined,
      bestStores: bestStores,
      assignedStore: editItem.preferredStore || undefined,
      updatedAt: new Date()
    };

    updateShoppingItem(editingItem.id, updatedData);
    setShowEditItem(false);
    setEditingItem(null);
    editItemForm.resetForm();
  };

  // Add item to master list
  const addItemToMaster = (e: React.FormEvent) => {
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
      brand: newItem.brand || undefined,
      notes: newItem.notes || undefined,
      barcode: barcodeResult || undefined,
      bestStores: bestStores,
      assignedStore: newItem.preferredStore || undefined, // Pre-assign if user has preference
    };

    addShoppingItem(item);
    newItemForm.resetForm();
    setBarcodeResult(null);
    setShowAddItem(false);
  };

  // Smart store recommendation algorithm

  const filteredMasterItems = shoppingItems.filter(item =>
    searchQuery === '' || item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalMasterItems = shoppingItems.filter(item => !item.purchased).length;
  const totalEstimatedCost = shoppingItems.reduce((sum, item) => sum + (item.estimatedPrice || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <ShoppingHeader
        totalMasterItems={totalMasterItems}
        storeListsCount={storeLists.length}
        totalEstimatedCost={totalEstimatedCost}
        isScanning={isScanning}
        isListening={isListening}
        onScanBarcode={handleStartBarcodeScanning}
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
            onToggleItem={toggleShoppingItem}
            onEditItem={startEditItem}
            onDeleteItem={deleteShoppingItem}
            onFindStores={showStoreSuggestions}
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
            <div className="flex items-center gap-2">
              {/* Summary */}
              <span className="text-xs text-gray-600 hidden md:inline">
                {pantryItems.filter(p => p.isLowStock).length} low-stock • {pantryItems.filter(p => p.expirationDate && differenceInCalendarDays(p.expirationDate, new Date()) < 0).length} expired
              </span>
              {/* Bulk add low-stock */}
              <button
                type="button"
                className="px-3 py-1 rounded border border-gray-300 text-sm hover:bg-gray-50"
                title="Add all low-stock items to shopping list"
                onClick={async () => {
                  const lows = pantryItems.filter(p => p.isLowStock && (p.lowStockThreshold ?? 0) > 0)
                  for (const p of lows) {
                    const target = p.lowStockThreshold ?? 0
                    const need = Math.max(0, target - (p.quantity || 0)) || 1
                    await addShoppingItem({
                      name: p.name,
                      quantity: need,
                      unit: p.unit,
                      category: p.category,
                      subcategory: undefined,
                      priority: 'medium',
                      purchased: false,
                      price: undefined,
                      estimatedPrice: undefined,
                      aisle: undefined,
                      brand: undefined,
                      size: undefined,
                      notes: p.notes,
                      imageUrl: undefined,
                      nutritionInfo: undefined,
                      tags: ['from:pantry'],
                      addedBy: undefined,
                      purchasedAt: undefined,
                      purchasedBy: undefined,
                      assignedStore: undefined,
                      bestStores: [],
                    })
                  }
                  showGlobalToast?.(`Added ${lows.length} low-stock items to shopping`, 'success')
                }}
              >Add low-stock to Shopping</button>
              <button
                type="button"
                className="px-3 py-1 rounded border border-gray-300 text-sm hover:bg-gray-50"
                title="Move all expired items to shopping list"
                onClick={async () => {
                  const now = new Date()
                  const expired = pantryItems.filter(p => p.expirationDate && p.expirationDate.getTime() < now.getTime())
                  for (const p of expired) {
                    const qty = p.quantity && p.quantity > 0 ? p.quantity : 1
                    await addShoppingItem({
                      name: p.name,
                      quantity: qty,
                      unit: p.unit,
                      category: p.category,
                      subcategory: undefined,
                      priority: 'medium',
                      purchased: false,
                      price: undefined,
                      estimatedPrice: undefined,
                      aisle: undefined,
                      brand: undefined,
                      size: undefined,
                      notes: p.notes,
                      imageUrl: undefined,
                      nutritionInfo: undefined,
                      tags: ['from:pantry','reason:expired'],
                      addedBy: undefined,
                      purchasedAt: undefined,
                      purchasedBy: undefined,
                      assignedStore: undefined,
                      bestStores: [],
                    })
                  }
                  showGlobalToast?.(`Moved ${expired.length} expired items to shopping`, 'info')
                }}
              >Move expired to Shopping</button>
              {/* Export CSV */}
              <button
                type="button"
                className="px-3 py-1 rounded border border-gray-300 text-sm hover:bg-gray-50"
                title="Export pantry to CSV"
                onClick={() => {
                  const headers = ['Name','Quantity','Unit','Category','Expiration','LowStock','Threshold','Location']
                  const rows = pantryItems.map(p => [
                    p.name,
                    String(p.quantity ?? ''),
                    p.unit ?? '',
                    p.category,
                    p.expirationDate ? format(p.expirationDate, 'yyyy-MM-dd') : '',
                    p.isLowStock ? 'yes' : 'no',
                    p.lowStockThreshold != null ? String(p.lowStockThreshold) : '',
                    p.location ?? '',
                  ])
                  const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n')
                  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
                  const url = URL.createObjectURL(blob)
                  const a = document.createElement('a')
                  a.href = url
                  a.download = `pantry-${format(new Date(), 'yyyyMMdd-HHmmss')}.csv`
                  a.click()
                  URL.revokeObjectURL(url)
                }}
              >Export CSV</button>
              {/* Simple filters */}
              <select
                className="rounded border border-gray-300 px-2 py-1 text-sm"
                onChange={(e) => setPantryFilter(e.target.value as any)}
                defaultValue="all"
                title="Filter"
              >
                <option value="all">All</option>
                <option value="soon">Expiring soon</option>
                <option value="expired">Expired</option>
                <option value="low">Low stock</option>
              </select>
              <select
                className="rounded border border-gray-300 px-2 py-1 text-sm"
                onChange={(e) => setPantrySort(e.target.value as any)}
                defaultValue="expiry"
                title="Sort"
              >
                <option value="expiry">Sort by expiry</option>
                <option value="name">Sort by name</option>
              </select>
              <button onClick={() => setShowAddPantry(true)} className="btn-primary flex items-center space-x-2">
                <Plus size={16} />
                <span>Add Pantry Item</span>
              </button>
              <button onClick={() => setShowScanReceipt(true)} className="px-3 py-1 rounded border border-gray-300 text-sm hover:bg-gray-50 flex items-center gap-2" title="Scan receipt to auto-add items">
                <Receipt size={16} />
                <span>Scan Receipt</span>
              </button>
            </div>
          </div>

          {pantryItems.length === 0 ? (
            <p className="text-sm text-gray-500">No pantry items yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-600">
                    <th className="py-2 px-3">Item</th>
                    <th className="py-2 px-3">Qty</th>
                    <th className="py-2 px-3">Expires</th>
                    <th className="py-2 px-3">Status</th>
                    <th className="py-2 px-3">Low stock</th>
                    <th className="py-2 px-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pantrySortedFiltered.map((p) => {
                    const days = p.expirationDate ? differenceInCalendarDays(p.expirationDate, new Date()) : null
                    let status = '—'
                    let cls = 'text-gray-600'
                    if (days != null) {
                      if (days < 0) { status = 'Expired'; cls = 'text-rose-700' }
                      else if (days <= 7) { status = `Expires in ${days}d`; cls = 'text-amber-700' }
                      else { status = `Fresh (${days}d)`; cls = 'text-emerald-700' }
                    }
                    return (
                      <tr key={p.id} className="border-t">
                        <td className="py-2 px-3 font-medium text-gray-900">{p.name}</td>
                        <td className="py-2 px-3">
                          {editingPantryId === p.id ? (
                            <div className="flex items-center gap-2">
                              <input type="number" min={0} value={editPantry.qty} onChange={(e) => setEditPantry(s => ({ ...s, qty: e.target.value }))} className="w-20 rounded border border-gray-300 px-2 py-1" />
                              <input value={editPantry.unit} onChange={(e) => setEditPantry(s => ({ ...s, unit: e.target.value }))} className="w-20 rounded border border-gray-300 px-2 py-1" />
                            </div>
                          ) : (
                            <>{p.quantity} {p.unit || ''}</>
                          )}
                        </td>
                        <td className="py-2 px-3">
                          {editingPantryId === p.id ? (
                            <input type="date" value={editPantry.exp} onChange={(e) => setEditPantry(s => ({ ...s, exp: e.target.value }))} className="rounded border border-gray-300 px-2 py-1" />
                          ) : (
                            <>{p.expirationDate ? format(p.expirationDate, 'MMM d, yyyy') : '—'}</>
                          )}
                        </td>
                        <td className="py-2 px-3"><span className={cls}>{status}</span></td>
                        <td className="py-2 px-3">
                          {editingPantryId === p.id ? (
                            <div className="flex items-center gap-2">
                              <label className="inline-flex items-center gap-1 text-xs text-gray-700">
                                <input type="checkbox" checked={editPantry.low} onChange={(e) => setEditPantry(s => ({ ...s, low: e.target.checked }))} /> Low
                              </label>
                              <input type="number" min={0} placeholder="Threshold" value={editPantry.threshold} onChange={(e) => setEditPantry(s => ({ ...s, threshold: e.target.value }))} className="w-24 rounded border border-gray-300 px-2 py-1" />
                            </div>
                          ) : (
                            <span className={`text-xs ${p.isLowStock ? 'text-amber-700' : 'text-gray-500'}`}>{p.isLowStock ? `Low (≤ ${p.lowStockThreshold ?? '—'})` : 'OK'}</span>
                          )}
                        </td>
                        <td className="py-2 px-3 space-x-2">
                          {editingPantryId === p.id ? (
                            <>
                              <button className="px-2 py-1 text-xs rounded border border-gray-300 hover:bg-gray-50" onClick={async () => {
                                const qty = Number(editPantry.qty) || 0
                                const exp = editPantry.exp ? new Date(editPantry.exp) : undefined
                                await updatePantryItemMutation.mutateAsync({ itemId: p.id, updates: { quantity: qty, unit: editPantry.unit || undefined, expirationDate: exp, isLowStock: editPantry.low, lowStockThreshold: editPantry.threshold ? Number(editPantry.threshold) : undefined } })
                                cancelEditing()
                              }}>Save</button>
                              <button className="px-2 py-1 text-xs rounded border border-gray-300 hover:bg-gray-50" onClick={() => setEditingPantryId(null)}>Cancel</button>
                            </>
                          ) : (
                            <>
                              <button
                                className="px-2 py-1 text-xs rounded border border-gray-300 hover:bg-gray-50"
                                onClick={() => {
                                  startEditingPantry(p)
                                }}
                              >Edit</button>
                              <button
                                className="px-2 py-1 text-xs rounded border border-gray-300 hover:bg-gray-50"
                                title="Replenish to target quantity"
                                onClick={() => { startReplenish(p.id); }}
                              >Replenish</button>
                              <button
                                className="px-2 py-1 text-xs rounded border border-gray-300 hover:bg-gray-50"
                                onClick={() => {
                                  void addShoppingItem({
                                    name: p.name,
                                    quantity: (p.lowStockThreshold && p.quantity < p.lowStockThreshold) ? (p.lowStockThreshold - p.quantity) : p.quantity || 1,
                                    unit: p.unit,
                                    category: p.category,
                                    subcategory: undefined,
                                    priority: 'medium',
                                    purchased: false,
                                    price: undefined,
                                    estimatedPrice: undefined,
                                    aisle: undefined,
                                    brand: undefined,
                                    size: undefined,
                                    notes: p.notes,
                                    imageUrl: undefined,
                                    nutritionInfo: undefined,
                                    tags: ['from:pantry'],
                                    addedBy: undefined,
                                    purchasedAt: undefined,
                                    purchasedBy: undefined,
                                    assignedStore: undefined,
                                    bestStores: [],
                                  })
                                  showGlobalToast?.(`Added ${p.name} to shopping`, 'success')
                                }}
                              >Add to Shopping</button>
                              <button
                                className="px-2 py-1 text-xs rounded border border-gray-300 hover:bg-gray-50"
                                onClick={() => void deletePantryItemMutation.mutate(p.id)}
                              >Delete</button>
                            </>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {replenishId && (() => {
            const p = pantryItems.find(x => x.id === replenishId);
            if (!p) return null;
            return (
              <ReplenishModal
                itemName={p.name}
                currentQuantity={p.quantity || 0}
                suggestedTarget={p.lowStockThreshold || Math.max(p.quantity || 0, 1)}
                onReplenish={async (targetQuantity) => {
                  const need = Math.max(0, targetQuantity - (p.quantity || 0));
                  if (need <= 0) {
                    showGlobalToast?.('Already at or above target', 'info');
                    cancelReplenish();
                    return;
                  }
                  await addShoppingItem({
                    name: p.name,
                    quantity: need,
                    unit: p.unit,
                    category: p.category,
                    subcategory: undefined,
                    priority: 'medium',
                    purchased: false,
                    price: undefined,
                    estimatedPrice: undefined,
                    aisle: undefined,
                    brand: undefined,
                    size: undefined,
                    notes: p.notes,
                    imageUrl: undefined,
                    nutritionInfo: undefined,
                    tags: ['from:pantry','reason:replenish'],
                    addedBy: undefined,
                    purchasedAt: undefined,
                    purchasedBy: undefined,
                    assignedStore: undefined,
                    bestStores: [],
                  });
                  showGlobalToast?.(`Added ${need} ${p.unit || ''} of ${p.name} to shopping`, 'success');
                  cancelReplenish();
                }}
                onCancel={cancelReplenish}
              />
            );
          })()}
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
          const acctId = financialAccounts?.[0]?.id;
          if (!acctId) {
            showGlobalToast?.('Add a financial account first (Financials tab)', 'info');
            return;
          }
          try {
            await addFinancialTransaction({
              accountId: acctId,
              amount: Number(amount.toFixed(2)),
              type: 'expense',
              description: `Groceries — ${merchant}`,
              date: new Date(),
              categoryId: undefined,
            });
            showGlobalToast?.('Logged groceries expense', 'success');
          } catch (e) {
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
        onCapture={captureNow}
        onStop={handleStopBarcodeScanning}
      />

      {/* Edit Item Modal */}
      <EditItemModal
        isOpen={showEditItem}
        formData={editItemForm.formData}
        stores={stores}
        onClose={() => {
          setShowEditItem(false);
          setEditingItem(null);
        }}
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
        onClose={() => setShowLocationSuggestions(false)}
        onGetLocation={getUserLocation}
        onAssignStore={(storeId) => {
          if (selectedItemForSuggestions) {
            updateShoppingItem(selectedItemForSuggestions.id, {
              assignedStore: storeId,
              bestStores: [storeId, ...(selectedItemForSuggestions.bestStores || [])]
            });
          }
        }}
      />
    </div>
  );
}

// Master Item Card Component
