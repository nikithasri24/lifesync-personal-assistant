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
import WeeklyRoutineTable from '../components/WeeklyRoutineTable';
import { CalendarView } from '../components/CalendarView';
import CategoryFormModal from '../components/CategoryFormModal';
import ItemFormModal from '../components/ItemFormModal';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useToast } from '@/hooks/useToast';
import { FeatureErrorBoundary } from '@/components/FeatureErrorBoundary';
import { ProductCardV2, ProductFormModalV2, CategoryCardV2 } from '../components/v2';
import {
  useSkincareProducts,
  usePagedSkincareProducts,
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct,
} from '../../hooks/useSkincareQuery';
import { usePagination } from '../../hooks/utilities/usePagination';
import { PaginationV2 } from '../../components/ui/PaginationV2';
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

const SelfCareContent: React.FC = () => {
  const colors = useThemeColors();
  const { showToast } = useToast();
  const [view, setView] = React.useState<ViewType>('routine');
  const [isInitialized, setIsInitialized] = React.useState(false);

  // ===== SKINCARE DATA =====
  // Full list used by routine/schedule components; paged list used for the Products tab UI
  const { data: products = [] } = useSkincareProducts();
  const { page: productsPage, setPage: setProductsPage } = usePagination();
  const { data: pagedProductsData, isLoading: productsLoading } = usePagedSkincareProducts(undefined, productsPage);
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
        showToast('Product updated successfully! ✨', 'success');
      } else {
        await createProductMutation.mutateAsync(productData);
        showToast('Product added successfully! ✨', 'success');
      }
      setShowProductModal(false);
      setEditingProduct(undefined);
    } catch (error) {
      logger.error('Skincare', error as Error, { context: 'Error saving product' });
      showToast('Failed to save product. Please try again.', 'error');
    }
  };

  const handleDeleteProduct = async (id: string) => {
    // Note: Confirmation should be handled in the modal/component, not here
    try {
      await deleteProductMutation.mutateAsync(id);
      showToast('Product deleted successfully! 🗑️', 'success');
    } catch (error) {
      logger.error('Skincare', error as Error, { context: 'Error deleting product' });
      showToast('Failed to delete product. Please try again.', 'error');
    }
  };

  // ===== PERSONAL CARE HANDLERS =====
  const handleCreateCategory = async (categoryData: PersonalCareCategoryInput) => {
    try {
      await createCategoryMutation.mutateAsync(categoryData);
      setShowCategoryModal(false);
      showToast('Category created successfully! 🎉', 'success');
    } catch (error) {
      logger.error('Skincare', error as Error, { context: 'Error creating category' });
      showToast('Failed to create category. Please try again.', 'error');
    }
  };

  const handleSaveItem = async (itemData: PersonalCareItemInput) => {
    try {
      if (editingItem) {
        await updateItemMutation.mutateAsync({
          id: editingItem.id,
          updates: itemData,
        });
        showToast('Item updated successfully! ✨', 'success');
      } else {
        await createItemMutation.mutateAsync(itemData);
        showToast('Item added successfully! ✨', 'success');
      }
      setShowItemModal(false);
      setSelectedCategoryForItem(null);
      setEditingItem(undefined);
    } catch (error) {
      logger.error('Skincare', error as Error, { context: 'Error saving item' });
      showToast('Failed to save item. Please try again.', 'error');
    }
  };

  const handleToggleItemActive = async (item: PersonalCareItem) => {
    try {
      await updateItemMutation.mutateAsync({
        id: item.id,
        updates: { isActive: !item.isActive },
      });
    } catch (error) {
      logger.error('Skincare', error as Error, { context: 'Error toggling item' });
      showToast('Failed to toggle item. Please try again.', 'error');
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

  // Loading skeleton
  if (loading) {
    return (
      <div style={{ backgroundColor: colors.bg.primary, minHeight: '100vh' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '1.5rem', paddingBottom: '5rem' }}>
          {/* Header */}
          <div
            style={{
              background: 'linear-gradient(135deg, #D4A574 0%, #C18B5E 100%)',
              padding: '60px 1.5rem 20px',
              color: 'white',
              marginLeft: '-1.5rem',
              marginRight: '-1.5rem',
              marginTop: '-1.5rem',
              marginBottom: '16px',
              borderRadius: '0 0 16px 16px',
            }}
          >
            <h1 style={{ fontSize: '32px', fontWeight: '800', marginBottom: '8px' }}>✨ Self Care</h1>
            <div style={{ fontSize: '14px', opacity: 0.9 }}>
              Skincare routines, products & personal care
            </div>
          </div>

          {/* View Toggle Skeleton */}
          <div
            className="h-12 rounded-xl mb-4 animate-pulse"
            style={{ backgroundColor: colors.border.medium }}
          />

          {/* Content Skeleton */}
          <div className="space-y-4 animate-pulse">
            <div className="h-10 rounded-xl" style={{ backgroundColor: colors.border.medium }} />
            <div className="grid grid-cols-2 gap-3">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="h-32 rounded-xl"
                  style={{ backgroundColor: colors.border.medium }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: colors.bg.primary, minHeight: '100vh' }}>
      {/* All content centered with max width - CLAUDE.md pattern */}
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '1.5rem', paddingBottom: '5rem' }}>
        {/* Header with Terracotta Gradient */}
        <div
          style={{
            background: 'linear-gradient(135deg, #D4A574 0%, #C18B5E 100%)',
            padding: '60px 1.5rem 20px',
            color: 'white',
            marginLeft: '-1.5rem',
            marginRight: '-1.5rem',
            marginTop: '-1.5rem',
            marginBottom: '16px',
            borderRadius: '0 0 16px 16px',
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
        <div style={{ padding: '0 1.5rem' }}>
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
          <div style={{ padding: '0 1.5rem' }}>
            <WeeklyRoutineTable />
          </div>
        )}

        {view === 'schedule' && (
          <div style={{ padding: '0 1.5rem' }}>
            <CalendarView items={allItems.filter(i => i.isActive)} getCategoryInfo={getCategoryInfo} />
          </div>
        )}

        {view === 'products' && (
          <div style={{ padding: '0 1.5rem' }}>
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
            aria-label="Add product"
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
            {(pagedProductsData?.items ?? []).map((product) => (
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

          {/* Pagination */}
          {pagedProductsData && pagedProductsData.totalPages > 1 && (
            <PaginationV2
              currentPage={pagedProductsData.page}
              totalPages={pagedProductsData.totalPages}
              totalItems={pagedProductsData.total}
              pageSize={pagedProductsData.pageSize}
              onPageChange={setProductsPage}
            />
          )}

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
          <div style={{ padding: '0 1.5rem' }}>
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
            aria-label="Add category"
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
      </div>

      {/* Modals */}
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

// Wrap with error boundary for graceful error handling
const SelfCarePage: React.FC = () => {
  return (
    <FeatureErrorBoundary feature="Self Care">
      <SelfCareContent />
    </FeatureErrorBoundary>
  );
};

export default SelfCarePage;
