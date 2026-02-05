/**
 * SelfCarePage - Unified self care tracking dashboard
 * Combines skincare routines, products, and personal care scheduling
 *
 * Tabs:
 * - Weekly Routine: AM/PM skincare routines by day of week
 * - Schedule: Calendar for periodic personal care tasks
 * - Products: Skincare product library
 * - Setup: Configure personal care categories and items
 */

import React from 'react';
import { Sparkles, Package, Calendar, Settings, Plus, Pencil } from 'lucide-react';
import { logger } from '@/services/logger';
import ProductsLibrary from '../components/ProductsLibrary';
import ProductFormModal from '../components/ProductFormModal';
import WeeklyRoutineTable from '../components/WeeklyRoutineTable';
import { CalendarView } from '../components/CalendarView';
import CategoryFormModal from '../components/CategoryFormModal';
import ItemFormModal from '../components/ItemFormModal';
import {
  useSkincareProducts,
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct,
} from '../../hooks/useSkincareQuery';
import {
  usePersonalCareCategories,
  usePersonalCareItems,
  useCreateCategory,
  useCreateItem,
  useUpdateItem,
  useInitializePersonalCare,
} from '../../hooks/usePersonalCareQuery';
import type { SkincareProduct, SkincareProductInput } from '../types';
import type { PersonalCareCategory, PersonalCareItem, PersonalCareCategoryInput, PersonalCareItemInput } from '../personalCareTypes';

type ViewType = 'routine' | 'schedule' | 'products' | 'setup';

const SelfCarePage: React.FC = () => {
  const [view, setView] = React.useState<ViewType>('routine');
  const [isInitialized, setIsInitialized] = React.useState(false);

  // ===== SKINCARE DATA =====
  const { data: products = [], isLoading: productsLoading } = useSkincareProducts();
  const createProductMutation = useCreateProduct();
  const updateProductMutation = useUpdateProduct();
  const deleteProductMutation = useDeleteProduct();

  // ===== PERSONAL CARE DATA =====
  const { data: allCategories = [], isLoading: categoriesLoading } = usePersonalCareCategories();
  const { data: allItems = [], isLoading: itemsLoading } = usePersonalCareItems();
  const createCategoryMutation = useCreateCategory();
  const createItemMutation = useCreateItem();
  const updateItemMutation = useUpdateItem();
  const initializeMutation = useInitializePersonalCare();

  const loading = productsLoading || categoriesLoading || itemsLoading;

  // Initialize personal care with default categories if user has none
  React.useEffect(() => {
    if (!loading && !isInitialized && allCategories.length === 0 && !initializeMutation.isPending) {
      initializeMutation.mutate();
      setIsInitialized(true);
    } else if (allCategories.length > 0) {
      setIsInitialized(true);
    }
  }, [loading, allCategories.length, isInitialized, initializeMutation]);

  // Group items by category for Setup view
  const itemsByCategory = React.useMemo(() => {
    const grouped = new Map<string, PersonalCareItem[]>();
    allItems.forEach(item => {
      const existing = grouped.get(item.categoryId) || [];
      grouped.set(item.categoryId, [...existing, item]);
    });
    return grouped;
  }, [allItems]);

  // Get category info for CalendarView
  const getCategoryInfo = React.useCallback((categoryId: string) => {
    const category = allCategories.find(c => c.id === categoryId);
    if (!category) return undefined;
    return { name: category.name, icon: category.icon, color: category.color };
  }, [allCategories]);

  // ===== MODAL STATE =====
  const [showProductModal, setShowProductModal] = React.useState(false);
  const [editingProduct, setEditingProduct] = React.useState<SkincareProduct | undefined>();
  const [showCategoryModal, setShowCategoryModal] = React.useState(false);
  const [showItemModal, setShowItemModal] = React.useState(false);
  const [selectedCategoryForItem, setSelectedCategoryForItem] = React.useState<PersonalCareCategory | null>(null);
  const [editingItem, setEditingItem] = React.useState<PersonalCareItem | undefined>();

  // ===== PRODUCT HANDLERS =====
  const handleAddProduct = () => {
    setEditingProduct(undefined);
    setShowProductModal(true);
  };

  const handleEditProduct = (product: SkincareProduct) => {
    setEditingProduct(product);
    setShowProductModal(true);
  };

  const handleSaveProduct = async (productData: SkincareProductInput) => {
    try {
      if (editingProduct) {
        await updateProductMutation.mutateAsync({
          id: editingProduct.id,
          updates: productData,
        });
      } else {
        await createProductMutation.mutateAsync(productData);
      }
      setShowProductModal(false);
      setEditingProduct(undefined);
    } catch (error) {
      logger.error('Skincare', 'Error saving product', { error });
      alert('Failed to save product. Please try again.');
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      await deleteProductMutation.mutateAsync(id);
    } catch (error) {
      logger.error('Skincare', 'Error deleting product', { error });
    }
  };

  // ===== PERSONAL CARE HANDLERS =====
  const handleCreateCategory = async (categoryData: PersonalCareCategoryInput) => {
    try {
      await createCategoryMutation.mutateAsync(categoryData);
      setShowCategoryModal(false);
    } catch (error) {
      logger.error('Skincare', 'Error creating category', { error });
      alert('Failed to create category. Please try again.');
    }
  };

  const handleSaveItem = async (itemData: PersonalCareItemInput) => {
    try {
      if (editingItem) {
        await updateItemMutation.mutateAsync({
          id: editingItem.id,
          updates: itemData,
        });
      } else {
        await createItemMutation.mutateAsync(itemData);
      }
      setShowItemModal(false);
      setSelectedCategoryForItem(null);
      setEditingItem(undefined);
    } catch (error) {
      logger.error('Skincare', 'Error saving item', { error });
      alert('Failed to save item. Please try again.');
    }
  };

  const handleToggleItemActive = async (item: PersonalCareItem) => {
    try {
      await updateItemMutation.mutateAsync({
        id: item.id,
        updates: { isActive: !item.isActive },
      });
    } catch (error) {
      logger.error('Skincare', 'Error toggling item', { error });
    }
  };

  const handleAddItemToCategory = (category: PersonalCareCategory) => {
    setEditingItem(undefined);
    setSelectedCategoryForItem(category);
    setShowItemModal(true);
  };

  const handleEditItem = (item: PersonalCareItem, category: PersonalCareCategory) => {
    setEditingItem(item);
    setSelectedCategoryForItem(category);
    setShowItemModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Self Care</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Your skincare routines, products, and personal care schedule
        </p>
      </div>

      {/* View Toggle */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setView('routine')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
            view === 'routine'
              ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900'
              : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
          }`}
        >
          <Sparkles className="h-5 w-5" />
          Weekly Routine
        </button>
        <button
          onClick={() => setView('schedule')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
            view === 'schedule'
              ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900'
              : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
          }`}
        >
          <Calendar className="h-5 w-5" />
          Schedule
        </button>
        <button
          onClick={() => setView('products')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
            view === 'products'
              ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900'
              : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
          }`}
        >
          <Package className="h-5 w-5" />
          Products
        </button>
        <button
          onClick={() => setView('setup')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
            view === 'setup'
              ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900'
              : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
          }`}
        >
          <Settings className="h-5 w-5" />
          Setup
        </button>
      </div>

      {/* Content */}
      {view === 'routine' && <WeeklyRoutineTable />}

      {view === 'schedule' && (
        <CalendarView items={allItems.filter(i => i.isActive)} getCategoryInfo={getCategoryInfo} />
      )}

      {view === 'products' && (
        <ProductsLibrary
          products={products}
          onAddProduct={handleAddProduct}
          onEditProduct={handleEditProduct}
          onDeleteProduct={handleDeleteProduct}
        />
      )}

      {view === 'setup' && (
        <div className="space-y-6">
          {/* Add Category Button */}
          <div className="flex justify-end">
            <button
              onClick={() => setShowCategoryModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Add Category
            </button>
          </div>

          {/* Categories and Items */}
          {allCategories.map(category => {
            const categoryItems = itemsByCategory.get(category.id) || [];
            return (
              <div
                key={category.id}
                className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
              >
                {/* Category Header */}
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{category.icon}</span>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100">{category.name}</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {categoryItems.filter(i => i.isActive).length} active items
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleAddItemToCategory(category)}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add Item
                  </button>
                </div>

                {/* Items List */}
                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                  {categoryItems.length === 0 ? (
                    <p className="p-4 text-sm text-gray-500 dark:text-gray-400 italic">
                      No items yet. Add your first item!
                    </p>
                  ) : (
                    categoryItems.map(item => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-lg">{item.icon}</span>
                          <div>
                            <p className={`font-medium ${item.isActive ? 'text-gray-900 dark:text-gray-100' : 'text-gray-400 dark:text-gray-500'}`}>
                              {item.name}
                            </p>
                            {item.scheduleIntervalDays && (
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                Every {item.scheduleIntervalDays} days
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEditItem(item, category)}
                            className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                            title="Edit item"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleToggleItemActive(item)}
                            className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                              item.isActive
                                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                            }`}
                          >
                            {item.isActive ? 'Active' : 'Inactive'}
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Product Form Modal */}
      {showProductModal && (
        <ProductFormModal
          product={editingProduct}
          onSave={handleSaveProduct}
          onClose={() => {
            setShowProductModal(false);
            setEditingProduct(undefined);
          }}
        />
      )}

      {/* Category Form Modal */}
      {showCategoryModal && (
        <CategoryFormModal
          onSave={handleCreateCategory}
          onClose={() => setShowCategoryModal(false)}
        />
      )}

      {/* Item Form Modal */}
      {showItemModal && selectedCategoryForItem && (
        <ItemFormModal
          item={editingItem}
          categoryId={selectedCategoryForItem.id}
          categoryName={selectedCategoryForItem.name}
          onSave={handleSaveItem}
          onClose={() => {
            setShowItemModal(false);
            setSelectedCategoryForItem(null);
            setEditingItem(undefined);
          }}
        />
      )}
    </div>
  );
};

export default SelfCarePage;
