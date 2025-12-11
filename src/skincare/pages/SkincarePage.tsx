/**
 * SkincarePage - Main skincare tracking dashboard
 * Migrated to React Query for automatic caching and state management
 */

import React from 'react';
import { Sparkles, Package, Sun, Moon, Check, Plus, Edit, Calendar } from 'lucide-react';
import SkincareCalendar from '../components/SkincareCalendar';
import ProductsLibrary from '../components/ProductsLibrary';
import ProductFormModal from '../components/ProductFormModal';
import RoutineEditorModal from '../components/RoutineEditorModal';
import WeeklyPlannerView from '../components/WeeklyPlannerView';
import {
  useSkincareProducts,
  useSkincareRoutines,
  useSkincareLogs,
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct,
  useCreateRoutine,
  useUpdateRoutine,
  useDeleteRoutine,
  useLogCompletion,
} from '../../hooks/useSkincareQuery';
import type { SkincareProduct, SkincareProductInput, SkincareRoutine, SkincareRoutineInput, SkincareLog } from '../types';
import { logger } from '../../services/logger';

type ViewType = 'journal' | 'products' | 'planner';

const SkincarePage: React.FC = () => {
  // =====================================================
  // SERVER STATE (React Query)
  // =====================================================
  const { data: products = [], isLoading: productsLoading } = useSkincareProducts();
  const { data: routines = [], isLoading: routinesLoading } = useSkincareRoutines();
  const { data: logs = [], isLoading: logsLoading } = useSkincareLogs();

  // Mutations
  const createProductMutation = useCreateProduct();
  const updateProductMutation = useUpdateProduct();
  const deleteProductMutation = useDeleteProduct();
  const createRoutineMutation = useCreateRoutine();
  const updateRoutineMutation = useUpdateRoutine();
  const deleteRoutineMutation = useDeleteRoutine();
  const logCompletionMutation = useLogCompletion();

  // =====================================================
  // CLIENT STATE (UI only)
  // =====================================================
  const [view, setView] = React.useState<ViewType>('journal');
  const [selectedDate, setSelectedDate] = React.useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [currentMonth, setCurrentMonth] = React.useState(new Date());

  // Modal state
  const [showProductModal, setShowProductModal] = React.useState(false);
  const [editingProduct, setEditingProduct] = React.useState<SkincareProduct | undefined>();
  const [showRoutineEditor, setShowRoutineEditor] = React.useState(false);
  const [editingRoutine, setEditingRoutine] = React.useState<SkincareRoutine | undefined>();

  // =====================================================
  // COMPUTED VALUES
  // =====================================================
  const loading = productsLoading || routinesLoading || logsLoading;

  // Get active routines
  const activeRoutines = routines.filter((r) => r.isActive);
  const amRoutine = activeRoutines.find((r) => r.routineType === 'AM');
  const pmRoutine = activeRoutines.find((r) => r.routineType === 'PM');

  // Get products for each routine
  const getRoutineProducts = (routine?: SkincareRoutine): SkincareProduct[] => {
    if (!routine) return [];
    return routine.productIds
      .map((id) => products.find((p) => p.id === id))
      .filter(Boolean) as SkincareProduct[];
  };

  // Get logs for selected date
  const selectedDateLogs = logs.filter((l) => l.date === selectedDate);
  const selectedAMLog = selectedDateLogs.find((l) => l.routineType === 'AM');
  const selectedPMLog = selectedDateLogs.find((l) => l.routineType === 'PM');

  // =====================================================
  // EVENT HANDLERS
  // =====================================================

  const handleDayClick = (date: string): void => {
    setSelectedDate(date);
  };

  // Toggle routine completion (using mutation for optimistic updates)
  const handleToggleComplete = async (routineType: 'AM' | 'PM'): Promise<void> => {
    const today = new Date().toISOString().split('T')[0];
    const existingLog =
      routineType === 'AM' ? selectedAMLog : selectedPMLog;

    if (existingLog && existingLog.completed) {
      // If already completed, we'd need a reset mutation
      // For now, just log it
      logger.info('Routine already completed', { routineType });
      return;
    }

    const routine = routineType === 'AM' ? amRoutine : pmRoutine;
    if (!routine) {
      logger.warn('No routine found for type', { routineType });
      return;
    }

    try {
      await logCompletionMutation.mutateAsync({
        date: today,
        routineId: routine.id,
        routineType,
        productsUsed: routine.productIds,
        skippedProducts: [],
      });
    } catch (error) {
      logger.error('Error toggling completion', { error });
    }
  };

  const handleAddProduct = (): void => {
    setEditingProduct(undefined);
    setShowProductModal(true);
  };

  const handleEditProduct = (product: SkincareProduct): void => {
    setEditingProduct(product);
    setShowProductModal(true);
  };

  const handleSaveProduct = async (productData: SkincareProductInput): Promise<void> => {
    try {
      if (editingProduct) {
        // Update existing product
        await updateProductMutation.mutateAsync({
          id: editingProduct.id,
          updates: productData,
        });
      } else {
        // Create new product
        await createProductMutation.mutateAsync(productData);
      }
      setShowProductModal(false);
      setEditingProduct(undefined);
    } catch (error) {
      logger.error('Error saving product', { error });
      // eslint-disable-next-line no-alert
      alert('Failed to save product. Please try again.');
    }
  };

  const handleDeleteProduct = async (id: string): Promise<void> => {
    // eslint-disable-next-line no-alert
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      await deleteProductMutation.mutateAsync(id);
    } catch (error) {
      logger.error('Error deleting product', { error });
    }
  };

  const handleCreateRoutine = async (routineType: 'AM' | 'PM'): Promise<void> => {
    const name = routineType === 'AM' ? 'Morning Routine' : 'Evening Routine';
    try {
      await createRoutineMutation.mutateAsync({
        name,
        routineType,
        isActive: true,
        productIds: [],
      });
    } catch (error) {
      logger.error('Error creating routine', { error });
      // eslint-disable-next-line no-alert
      alert('Failed to create routine. Please try again.');
    }
  };

  const handleEditRoutine = (routine: SkincareRoutine): void => {
    setEditingRoutine(routine);
    setShowRoutineEditor(true);
  };

  const handleSaveRoutine = async (
    routineData: Partial<SkincareRoutineInput>
  ): Promise<void> => {
    if (!editingRoutine) return;

    try {
      await updateRoutineMutation.mutateAsync({
        id: editingRoutine.id,
        updates: routineData,
      });
      setShowRoutineEditor(false);
      setEditingRoutine(undefined);
    } catch (error) {
      logger.error('Error saving routine', { error });
      // eslint-disable-next-line no-alert
      alert('Failed to save routine. Please try again.');
    }
  };

  const handleDeleteRoutine = async (routine: SkincareRoutine): Promise<void> => {
    // eslint-disable-next-line no-alert
    if (!confirm(`Are you sure you want to delete ${routine.name}?`)) return;
    try {
      await deleteRoutineMutation.mutateAsync(routine.id);
      setShowRoutineEditor(false);
      setEditingRoutine(undefined);
    } catch (error) {
      logger.error('Error deleting routine', { error });
    }
  };

  // =====================================================
  // RENDER HELPERS
  // =====================================================

  const renderRoutineChecklist = (
    routine: SkincareRoutine | undefined,
    log: SkincareLog | undefined,
    type: 'AM' | 'PM'
  ): React.JSX.Element => {
    if (!routine) {
      return (
        <div className="text-center py-6">
          <p className="text-gray-500 text-sm mb-3">No {type} routine</p>
          <button
            onClick={() => {
              void handleCreateRoutine(type);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            <Plus className="h-4 w-4" />
            Create {type} Routine
          </button>
        </div>
      );
    }

    const routineProducts = getRoutineProducts(routine);
    const isCompleted = log?.completed ?? false;

    return (
      <div className="space-y-2">
        {routineProducts.map((product) => {
          const isUsed = log?.productsUsed?.includes(product.id) ?? false;
          return (
            <div key={product.id} className="flex items-center gap-2 text-sm">
              <div
                className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${
                  isCompleted || isUsed
                    ? 'bg-gray-900 border-gray-900'
                    : 'border-gray-300'
                }`}
              >
                {(isCompleted || isUsed) && <Check className="h-3 w-3 text-white" />}
              </div>
              <span className={isCompleted || isUsed ? 'text-gray-900' : 'text-gray-600'}>
                {product.name}
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  // =====================================================
  // LOADING STATE
  // =====================================================

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent mx-auto mb-2" />
          <p className="text-sm text-gray-600">Loading skincare data...</p>
        </div>
      </div>
    );
  }

  // =====================================================
  // MAIN RENDER
  // =====================================================

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Skincare Journal</h2>
        <p className="text-sm text-gray-600">Track your daily routines and skin progress</p>
      </div>

      {/* View Toggle */}
      <div className="flex gap-2">
        <button
          onClick={() => setView('journal')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
            view === 'journal'
              ? 'bg-gray-900 text-white'
              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
          }`}
        >
          <Sparkles className="h-5 w-5" />
          Journal
        </button>
        <button
          onClick={() => setView('products')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
            view === 'products'
              ? 'bg-gray-900 text-white'
              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
          }`}
        >
          <Package className="h-5 w-5" />
          Products
        </button>
        <button
          onClick={() => setView('planner')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
            view === 'planner'
              ? 'bg-gray-900 text-white'
              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
          }`}
        >
          <Calendar className="h-5 w-5" />
          Weekly Planner
        </button>
      </div>

      {/* Content */}
      {view === 'journal' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Side - Calendar (takes 7 columns) */}
          <div className="lg:col-span-7">
            <SkincareCalendar
              logs={logs}
              currentMonth={currentMonth}
              onMonthChange={setCurrentMonth}
              onDayClick={handleDayClick}
            />
          </div>

          {/* Right Side - Routines (takes 5 columns) */}
          <div className="lg:col-span-5 space-y-6">
            {/* Selected Date Display */}
            <div className="bg-white rounded-xl p-4 border border-gray-200">
              <p className="text-sm text-gray-600 mb-1">Selected Date</p>
              <p className="text-lg font-semibold text-gray-900">
                {new Date(selectedDate).toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>

            {/* AM Routine */}
            <div className="bg-white rounded-xl p-5 border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Sun className="h-5 w-5 text-amber-600" />
                  <h3 className="font-semibold text-gray-900">AM Routine</h3>
                </div>
                <div className="flex items-center gap-2">
                  {amRoutine && (
                    <button
                      onClick={() => {
                        handleEditRoutine(amRoutine);
                      }}
                      className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                      title="Edit routine"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    onClick={() => {
                      void handleToggleComplete('AM');
                    }}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                      selectedAMLog?.completed
                        ? 'bg-gray-900 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {selectedAMLog?.completed ? 'Completed' : 'Mark Done'}
                  </button>
                </div>
              </div>
              {renderRoutineChecklist(amRoutine, selectedAMLog, 'AM')}
            </div>

            {/* PM Routine */}
            <div className="bg-white rounded-xl p-5 border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Moon className="h-5 w-5 text-indigo-600" />
                  <h3 className="font-semibold text-gray-900">PM Routine</h3>
                </div>
                <div className="flex items-center gap-2">
                  {pmRoutine && (
                    <button
                      onClick={() => {
                        handleEditRoutine(pmRoutine);
                      }}
                      className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                      title="Edit routine"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    onClick={() => {
                      void handleToggleComplete('PM');
                    }}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                      selectedPMLog?.completed
                        ? 'bg-gray-900 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {selectedPMLog?.completed ? 'Completed' : 'Mark Done'}
                  </button>
                </div>
              </div>
              {renderRoutineChecklist(pmRoutine, selectedPMLog, 'PM')}
            </div>
          </div>
        </div>
      ) : view === 'products' ? (
        <ProductsLibrary
          products={products}
          onAddProduct={handleAddProduct}
          onEditProduct={handleEditProduct}
          onDeleteProduct={(id) => {
            void handleDeleteProduct(id);
          }}
        />
      ) : (
        <WeeklyPlannerView />
      )}

      {/* Product Form Modal */}
      {showProductModal && (
        <ProductFormModal
          product={editingProduct}
          onSave={(productData) => {
            void handleSaveProduct(productData);
          }}
          onClose={() => {
            setShowProductModal(false);
            setEditingProduct(undefined);
          }}
        />
      )}

      {/* Routine Editor Modal */}
      {showRoutineEditor && editingRoutine && (
        <RoutineEditorModal
          routine={editingRoutine}
          allProducts={products}
          onSave={(routineData) => {
            void handleSaveRoutine(routineData);
          }}
          onDelete={() => {
            void handleDeleteRoutine(editingRoutine);
          }}
          onClose={() => {
            setShowRoutineEditor(false);
            setEditingRoutine(undefined);
          }}
        />
      )}
    </div>
  );
};

export default SkincarePage;
