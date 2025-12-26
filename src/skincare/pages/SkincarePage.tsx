/**
 * SkincarePage - Main skincare tracking dashboard
 * Journal-style layout matching the reference image
 */

import React from 'react';
import { Sparkles, Package, Sun, Moon, Check, Plus, Edit, Calendar, Grid3x3 } from 'lucide-react';
import SkincareCalendar from '../components/SkincareCalendar';
import ProductsLibrary from '../components/ProductsLibrary';
import ProductFormModal from '../components/ProductFormModal';
import RoutineEditorModal from '../components/RoutineEditorModal';
import WeeklyPlannerView from '../components/WeeklyPlannerView';
import WeeklyGridView from '../components/WeeklyGridView';
import { skincareAPI } from '../data';
import type { SkincareProduct, SkincareProductInput, SkincareRoutine, SkincareRoutineInput, SkincareLog } from '../types';

type ViewType = 'journal' | 'products' | 'weekly' | 'grid';

const SkincarePage: React.FC = () => {
  const [view, setView] = React.useState<ViewType>('journal');
  const [loading, setLoading] = React.useState(true);
  const [selectedDate, setSelectedDate] = React.useState<string>(
    new Date().toISOString().split('T')[0]
  );

  // Data state
  const [products, setProducts] = React.useState<SkincareProduct[]>([]);
  const [routines, setRoutines] = React.useState<SkincareRoutine[]>([]);
  const [logs, setLogs] = React.useState<SkincareLog[]>([]);

  // Calendar state
  const [currentMonth, setCurrentMonth] = React.useState(new Date());

  // Modal state
  const [showProductModal, setShowProductModal] = React.useState(false);
  const [editingProduct, setEditingProduct] = React.useState<SkincareProduct | undefined>();
  const [showRoutineEditor, setShowRoutineEditor] = React.useState(false);
  const [editingRoutine, setEditingRoutine] = React.useState<SkincareRoutine | undefined>();

  // Load data
  React.useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [productsData, routinesData, logsData] = await Promise.all([
        skincareAPI.listProducts(),
        skincareAPI.listRoutines(),
        skincareAPI.listLogs({ limit: 100 }),
      ]);

      setProducts(productsData);
      setRoutines(routinesData);
      setLogs(logsData.items);
    } catch (error) {
      console.error('Error loading skincare data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Get active routines
  const activeRoutines = routines.filter(r => r.isActive);
  const amRoutine = activeRoutines.find(r => r.routineType === 'AM');
  const pmRoutine = activeRoutines.find(r => r.routineType === 'PM');

  // Get products for each routine
  const getRoutineProducts = (routine?: SkincareRoutine): SkincareProduct[] => {
    if (!routine) return [];
    return routine.productIds
      .map(id => products.find(p => p.id === id))
      .filter(Boolean) as SkincareProduct[];
  };

  // Check if today's routine is completed
  const getTodayCompletion = (routineType: 'AM' | 'PM'): boolean => {
    const today = new Date().toISOString().split('T')[0];
    const log = logs.find(l => l.date === today && l.routineType === routineType);
    return log?.completed || false;
  };

  // Toggle routine completion
  const handleToggleComplete = async (routineType: 'AM' | 'PM') => {
    const today = new Date().toISOString().split('T')[0];
    const existingLog = logs.find(l => l.date === today && l.routineType === routineType);

    try {
      if (existingLog) {
        // Update existing log
        const updated = await skincareAPI.updateLog(existingLog.id, {
          completed: !existingLog.completed,
          completedAt: !existingLog.completed ? new Date().toISOString() : undefined,
        });
        setLogs(logs.map(l => (l.id === updated.id ? updated : l)));
      } else {
        // Create new log
        const routine = routineType === 'AM' ? amRoutine : pmRoutine;
        const newLog = await skincareAPI.createLog({
          date: today,
          routineId: routine?.id,
          routineType,
          completed: true,
          completedAt: new Date().toISOString(),
          productsUsed: routine?.productIds || [],
          skippedProducts: [],
        });
        setLogs([newLog, ...logs]);
      }
    } catch (error) {
      console.error('Error toggling completion:', error);
    }
  };

  const handleDayClick = (date: string) => {
    setSelectedDate(date);
  };

  // Get logs for selected date
  const selectedDateLogs = logs.filter(l => l.date === selectedDate);
  const selectedAMLog = selectedDateLogs.find(l => l.routineType === 'AM');
  const selectedPMLog = selectedDateLogs.find(l => l.routineType === 'PM');

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
        // Update existing product
        const updated = await skincareAPI.updateProduct(editingProduct.id, productData);
        setProducts(products.map(p => (p.id === updated.id ? updated : p)));
      } else {
        // Create new product
        const newProduct = await skincareAPI.createProduct(productData);
        setProducts([newProduct, ...products]);
      }
      setShowProductModal(false);
      setEditingProduct(undefined);
    } catch (error) {
      console.error('Error saving product:', error);
      alert('Failed to save product. Please try again.');
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      await skincareAPI.deleteProduct(id);
      setProducts(products.filter(p => p.id !== id));
    } catch (error) {
      console.error('Error deleting product:', error);
    }
  };

  const handleCreateRoutine = async (routineType: 'AM' | 'PM') => {
    const name = routineType === 'AM' ? 'Morning Routine' : 'Evening Routine';
    try {
      const newRoutine = await skincareAPI.createRoutine({
        name,
        routineType,
        isActive: true,
        productIds: [],
      });
      setRoutines([...routines, newRoutine]);
    } catch (error) {
      console.error('Error creating routine:', error);
      alert('Failed to create routine. Please try again.');
    }
  };

  const handleEditRoutine = (routine: SkincareRoutine) => {
    setEditingRoutine(routine);
    setShowRoutineEditor(true);
  };

  const handleSaveRoutine = async (routineData: Partial<SkincareRoutineInput>) => {
    if (!editingRoutine) return;

    try {
      const updated = await skincareAPI.updateRoutine(editingRoutine.id, routineData);
      setRoutines(routines.map(r => (r.id === updated.id ? updated : r)));
      setShowRoutineEditor(false);
      setEditingRoutine(undefined);
    } catch (error) {
      console.error('Error saving routine:', error);
      alert('Failed to save routine. Please try again.');
    }
  };

  const handleDeleteRoutine = async (routine: SkincareRoutine) => {
    if (!confirm(`Are you sure you want to delete ${routine.name}?`)) return;
    try {
      await skincareAPI.deleteRoutine(routine.id);
      setRoutines(routines.filter(r => r.id !== routine.id));
      setShowRoutineEditor(false);
      setEditingRoutine(undefined);
    } catch (error) {
      console.error('Error deleting routine:', error);
    }
  };

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

  // Render simple routine checklist (journal style)
  const renderRoutineChecklist = (
    routine: SkincareRoutine | undefined,
    log: SkincareLog | undefined,
    type: 'AM' | 'PM'
  ) => {
    if (!routine) {
      return (
        <div className="text-center py-6">
          <p className="text-gray-500 text-sm mb-3">No {type} routine</p>
          <button
            onClick={() => handleCreateRoutine(type)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            <Plus className="h-4 w-4" />
            Create {type} Routine
          </button>
        </div>
      );
    }

    const routineProducts = getRoutineProducts(routine);
    const isCompleted = log?.completed || false;

    return (
      <div className="space-y-2">
        {routineProducts.map((product) => {
          const isUsed = log?.productsUsed?.includes(product.id) ?? false;
          return (
            <div
              key={product.id}
              className="flex items-center gap-2 text-sm"
            >
              <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${
                isCompleted || isUsed
                  ? 'bg-gray-900 border-gray-900'
                  : 'border-gray-300'
              }`}>
                {(isCompleted || isUsed) && (
                  <Check className="h-3 w-3 text-white" />
                )}
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Skincare Journal</h2>
        <p className="text-sm text-gray-600">
          Track your daily routines and skin progress
        </p>
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
          onClick={() => setView('grid')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
            view === 'grid'
              ? 'bg-gray-900 text-white'
              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
          }`}
        >
          <Grid3x3 className="h-5 w-5" />
          Week View
        </button>
        <button
          onClick={() => setView('weekly')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
            view === 'weekly'
              ? 'bg-gray-900 text-white'
              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
          }`}
        >
          <Calendar className="h-5 w-5" />
          Cards
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
                      onClick={() => handleEditRoutine(amRoutine)}
                      className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                      title="Edit routine"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    onClick={() => handleToggleComplete('AM')}
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
                      onClick={() => handleEditRoutine(pmRoutine)}
                      className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                      title="Edit routine"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    onClick={() => handleToggleComplete('PM')}
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
      ) : view === 'grid' ? (
        <WeeklyGridView />
      ) : view === 'weekly' ? (
        <WeeklyPlannerView />
      ) : (
        <ProductsLibrary
          products={products}
          onAddProduct={handleAddProduct}
          onEditProduct={handleEditProduct}
          onDeleteProduct={handleDeleteProduct}
        />
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

      {/* Routine Editor Modal */}
      {showRoutineEditor && editingRoutine && (
        <RoutineEditorModal
          routine={editingRoutine}
          allProducts={products}
          onSave={handleSaveRoutine}
          onDelete={() => handleDeleteRoutine(editingRoutine)}
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
