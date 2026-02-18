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
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import ProductFormModal from '../components/ProductFormModal';
import WeeklyRoutineTable from '../components/WeeklyRoutineTable';
import { CalendarView } from '../components/CalendarView';
import CategoryFormModal from '../components/CategoryFormModal';
import ItemFormModal from '../components/ItemFormModal';
import { useThemeColors } from '@/hooks/useThemeColors';
import { ProductCardV2, ProductFormModalV2, CategoryCardV2 } from '../components/v2';
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
  const colors = useThemeColors();
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

  const viewSegments = [
    { value: 'routine', label: '✨ Routine' },
    { value: 'schedule', label: '📅 Schedule' },
    { value: 'products', label: '🧴 Products' },
    { value: 'setup', label: '⚙️ Setup' },
  ];

  return (
    <div style={{ backgroundColor: colors.bg.primary, minHeight: '100vh' }}>
      {/* Header with Terracotta Gradient */}
      <div
        style={{
          background: 'linear-gradient(135deg, #D4A574 0%, #C18B5E 100%)',
          padding: '60px 20px 20px',
          color: 'white',
          marginBottom: '16px',
        }}
      >
        <h1 style={{ fontSize: '32px', fontWeight: '800', marginBottom: '8px' }}>
          ✨ Self Care
        </h1>
        <div style={{ fontSize: '14px', opacity: 0.9 }}>
          Skincare routines, products & personal care
        </div>
      </div>

      {/* View Toggle */}
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '0 1.5rem' }}>
        <div
          style={{
            background: 'rgba(92, 74, 58, 0.1)',
            borderRadius: '12px',
            padding: '4px',
            marginBottom: '16px',
          }}
        >
          <SegmentedControl
            segments={viewSegments}
            value={view}
            onChange={(value) => setView(value as ViewType)}
          />
        </div>
      </div>

      {/* Content */}
      {view === 'routine' && (
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '1.5rem', paddingBottom: '5rem' }}>
          <WeeklyRoutineTable />
        </div>
      )}

      {view === 'schedule' && (
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '1.5rem', paddingBottom: '5rem' }}>
          <CalendarView items={allItems.filter(i => i.isActive)} getCategoryInfo={getCategoryInfo} />
        </div>
      )}

      {view === 'products' && (
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '1.5rem', paddingBottom: '5rem' }}>
          {/* Add Product Button */}
          <button
            onClick={handleAddProduct}
            className="w-full mb-4 transition-all hover:opacity-90"
            style={{
              padding: '12px',
              background: 'linear-gradient(135deg, #D4A574 0%, #C18B5E 100%)',
              border: 'none',
              borderRadius: '12px',
              fontSize: '14px',
              fontWeight: '600',
              color: 'white',
              cursor: 'pointer',
            }}
          >
            + Add Product
          </button>

          {/* Products Grid (2 columns) */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '12px',
            }}
          >
            {products.map((product) => (
              <ProductCardV2
                key={product.id}
                id={product.id}
                name={product.name}
                brand={product.brand}
                category={product.category}
                rating={product.rating}
                useFrequency={product.useFrequency}
                onClick={() => handleEditProduct(product)}
              />
            ))}
          </div>

          {products.length === 0 && (
            <div
              className="text-center py-12"
              style={{ color: colors.text.tertiary }}
            >
              <div className="text-4xl mb-3">🧴</div>
              <p>No products yet. Add your first skincare product!</p>
            </div>
          )}
        </div>
      )}

      {view === 'setup' && (
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '1.5rem', paddingBottom: '5rem' }}>
          {/* Add Category Button */}
          <button
            onClick={() => setShowCategoryModal(true)}
            className="w-full mb-4 transition-all hover:opacity-90"
            style={{
              padding: '12px',
              background: 'linear-gradient(135deg, #D4A574 0%, #C18B5E 100%)',
              border: 'none',
              borderRadius: '12px',
              fontSize: '14px',
              fontWeight: '600',
              color: 'white',
              cursor: 'pointer',
            }}
          >
            + Add Category
          </button>

          {/* Categories List */}
          {allCategories.map(category => {
            const categoryItems = itemsByCategory.get(category.id) || [];
            return (
              <CategoryCardV2
                key={category.id}
                id={category.id}
                name={category.name}
                icon={category.icon}
                color={category.color}
                items={categoryItems.map(item => ({
                  id: item.id,
                  name: item.name,
                  isActive: item.isActive,
                  frequency: item.scheduleIntervalDays
                    ? `Every ${item.scheduleIntervalDays} days`
                    : undefined,
                }))}
                onAddItem={() => handleAddItemToCategory(category)}
                onToggleItem={(itemId, currentActive) => {
                  const item = categoryItems.find(i => i.id === itemId);
                  if (item) handleToggleItemActive(item);
                }}
                onEditItem={(itemId) => {
                  const item = categoryItems.find(i => i.id === itemId);
                  if (item) handleEditItem(item, category);
                }}
              />
            );
          })}
        </div>
      )}

      {/* Product Form Modal */}
      <ProductFormModalV2
        isOpen={showProductModal}
        onClose={() => {
          setShowProductModal(false);
          setEditingProduct(undefined);
        }}
        product={editingProduct ? {
          id: editingProduct.id,
          name: editingProduct.name,
          brand: editingProduct.brand,
          category: editingProduct.category,
          rating: editingProduct.rating,
          useFrequency: editingProduct.useFrequency,
          purchaseDate: editingProduct.purchaseDate,
          expiryDate: editingProduct.expiryDate,
          notes: editingProduct.notes,
        } : undefined}
        isEditing={!!editingProduct}
        onSubmit={handleSaveProduct}
      />

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
