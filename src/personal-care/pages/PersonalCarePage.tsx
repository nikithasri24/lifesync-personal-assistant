/**
 * PersonalCarePage - Main personal care tracking dashboard
 * Flexible, customizable personal care tracking for skincare, hair care, hair removal, etc.
 */

import React from 'react';
import {
  Sparkles,
  Settings,
  Calendar,
  Plus,
  ChevronRight,
} from 'lucide-react';
import {
  usePersonalCareCategories,
  usePersonalCareItems,
  useCreateCategory,
  useCreateItem,
  useUpdateItem,
  useInitializePersonalCare,
} from '../../hooks/usePersonalCareQuery';
import type { PersonalCareCategory, PersonalCareItem, PersonalCareCategoryInput, PersonalCareItemInput } from '../types';
import CategoryFormModal from '../components/CategoryFormModal';
import ItemFormModal from '../components/ItemFormModal';
import { CalendarView } from '../components/CalendarView';

type ViewType = 'calendar' | 'setup';

const PersonalCarePage: React.FC = () => {
  const [view, setView] = React.useState<ViewType>('calendar');
  const [isInitialized, setIsInitialized] = React.useState(false);

  // Modal state
  const [showCategoryModal, setShowCategoryModal] = React.useState(false);
  const [showItemModal, setShowItemModal] = React.useState(false);
  const [selectedCategoryForItem, setSelectedCategoryForItem] = React.useState<PersonalCareCategory | null>(null);

  // Data fetching - fetch ALL categories/items for setup and calendar
  const { data: allCategories = [], isLoading: categoriesLoading } = usePersonalCareCategories();
  const { data: allItems = [], isLoading: itemsLoading } = usePersonalCareItems();

  // Mutations
  const createCategoryMutation = useCreateCategory();
  const createItemMutation = useCreateItem();
  const updateItemMutation = useUpdateItem();
  const initializeMutation = useInitializePersonalCare();

  const loading = categoriesLoading || itemsLoading;

  // Initialize with default categories if user has none
  React.useEffect(() => {
    if (!loading && !isInitialized && allCategories.length === 0 && !initializeMutation.isPending) {
      initializeMutation.mutate();
      setIsInitialized(true);
    } else if (allCategories.length > 0) {
      setIsInitialized(true);
    }
  }, [loading, allCategories.length, isInitialized, initializeMutation]);

  // Group ALL items by category (for Setup view - shows all including inactive)
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

  // Handle creating a new category
  const handleCreateCategory = async (categoryData: PersonalCareCategoryInput) => {
    try {
      await createCategoryMutation.mutateAsync(categoryData);
      setShowCategoryModal(false);
    } catch (error) {
      console.error('Failed to create category:', error);
    }
  };

  // Handle creating a new item
  const handleCreateItem = async (itemData: PersonalCareItemInput) => {
    try {
      await createItemMutation.mutateAsync(itemData);
      setShowItemModal(false);
      setSelectedCategoryForItem(null);
    } catch (error) {
      console.error('Failed to create item:', error);
    }
  };

  // Open item modal for a specific category
  const openItemModal = (categoryId: string) => {
    const category = allCategories.find(c => c.id === categoryId);
    if (category) {
      setSelectedCategoryForItem(category);
      setShowItemModal(true);
    }
  };

  // Toggle item active status
  const handleToggleItem = async (itemId: string, isActive: boolean) => {
    try {
      await updateItemMutation.mutateAsync({
        id: itemId,
        updates: { isActive },
      });
    } catch (error) {
      console.error('Failed to toggle item:', error);
    }
  };

  if (loading || initializeMutation.isPending) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
        {initializeMutation.isPending && (
          <p className="ml-3 text-gray-600 dark:text-gray-400">Setting up your personal care...</p>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-8">
      {/* Header */}
      <div className="max-w-4xl mx-auto mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Sparkles className="w-8 h-8 text-purple-600" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Personal Care
            </h1>
          </div>

          {/* View Toggle */}
          <div className="flex bg-gray-200 dark:bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => setView('calendar')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                view === 'calendar'
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              <Calendar className="w-4 h-4 inline-block mr-2" />
              Calendar
            </button>
            <button
              onClick={() => setView('setup')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                view === 'setup'
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              <Settings className="w-4 h-4 inline-block mr-2" />
              Setup
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto">
        {view === 'calendar' ? (
          <CalendarView
            items={allItems}
            getCategoryInfo={getCategoryInfo}
          />
        ) : (
          <SetupView
            categories={allCategories}
            itemsByCategory={itemsByCategory}
            onCreateCategory={() => setShowCategoryModal(true)}
            onCreateItem={openItemModal}
            onToggleItem={handleToggleItem}
          />
        )}
      </div>

      {/* Category Modal */}
      {showCategoryModal && (
        <CategoryFormModal
          onSave={handleCreateCategory}
          onClose={() => setShowCategoryModal(false)}
          isLoading={createCategoryMutation.isPending}
        />
      )}

      {/* Item Modal */}
      {showItemModal && selectedCategoryForItem && (
        <ItemFormModal
          categoryId={selectedCategoryForItem.id}
          categoryName={selectedCategoryForItem.name}
          onSave={handleCreateItem}
          onClose={() => {
            setShowItemModal(false);
            setSelectedCategoryForItem(null);
          }}
          isLoading={createItemMutation.isPending}
        />
      )}
    </div>
  );
};

// =====================================================
// SETUP VIEW
// =====================================================

interface SetupViewProps {
  categories: PersonalCareCategory[];
  itemsByCategory: Map<string, PersonalCareItem[]>;
  onCreateCategory: () => void;
  onCreateItem: (categoryId: string) => void;
  onToggleItem: (itemId: string, isActive: boolean) => void;
}

const SetupView: React.FC<SetupViewProps> = ({
  categories,
  itemsByCategory,
  onCreateCategory,
  onCreateItem,
  onToggleItem,
}) => {
  return (
    <div className="space-y-6">
      {/* Add Category Button */}
      <button
        onClick={onCreateCategory}
        className="w-full flex items-center justify-center gap-2 p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl text-gray-500 dark:text-gray-400 hover:border-purple-500 hover:text-purple-500 dark:hover:border-purple-400 dark:hover:text-purple-400 transition-colors"
      >
        <Plus className="w-5 h-5" />
        Add Category
      </button>

      {/* Categories List */}
      {categories.length === 0 ? (
        <div className="text-center py-12">
          <Sparkles className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400 mb-2">No categories yet</p>
          <p className="text-sm text-gray-400 dark:text-gray-500">
            Create categories to organize your personal care items
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {categories.map(category => {
            const items = itemsByCategory.get(category.id) || [];

            return (
              <div
                key={category.id}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden"
              >
                {/* Category Header */}
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-750">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{category.icon}</span>
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                      {category.name}
                    </h3>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {items.length} item{items.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <button
                    onClick={() => onCreateItem(category.id)}
                    className="flex items-center gap-1 px-3 py-1 text-sm text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/30 rounded-lg transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Add Item
                  </button>
                </div>

                {/* Items List */}
                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                  {items.length === 0 ? (
                    <p className="p-4 text-sm text-gray-500 dark:text-gray-400 text-center">
                      No items in this category
                    </p>
                  ) : (
                    items.map(item => (
                      <div
                        key={item.id}
                        className={`flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors ${
                          !item.isActive ? 'opacity-50' : ''
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {/* Toggle Switch */}
                          <button
                            onClick={() => onToggleItem(item.id, !item.isActive)}
                            className={`relative w-10 h-6 rounded-full transition-colors ${
                              item.isActive
                                ? 'bg-purple-600'
                                : 'bg-gray-300 dark:bg-gray-600'
                            }`}
                          >
                            <span
                              className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                                item.isActive ? 'translate-x-5' : 'translate-x-1'
                              }`}
                            />
                          </button>
                          <span className="text-lg">{item.icon || '•'}</span>
                          <div>
                            <p className={`font-medium ${
                              item.isActive
                                ? 'text-gray-900 dark:text-gray-100'
                                : 'text-gray-500 dark:text-gray-400'
                            }`}>
                              {item.name}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {item.trackingMode === 'scheduled' && item.scheduleIntervalDays
                                ? `Every ${item.scheduleIntervalDays} days`
                                : item.trackingMode === 'manual'
                                ? 'Manual tracking'
                                : 'Not tracked'}
                            </p>
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PersonalCarePage;

