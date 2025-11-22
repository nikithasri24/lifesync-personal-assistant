/**
 * RoutineEditorModal - Edit routine and assign products
 */

import React from 'react';
import { X, Save, Trash2, Plus } from 'lucide-react';
import type { SkincareRoutine, SkincareRoutineInput, SkincareProduct } from '../types';

type RoutineEditorModalProps = {
  routine: SkincareRoutine;
  allProducts: SkincareProduct[];
  onSave: (routineData: Partial<SkincareRoutineInput>) => void;
  onDelete: () => void;
  onClose: () => void;
};

const RoutineEditorModal: React.FC<RoutineEditorModalProps> = ({
  routine,
  allProducts,
  onSave,
  onDelete,
  onClose,
}) => {
  const [name, setName] = React.useState(routine.name);
  const [isActive, setIsActive] = React.useState(routine.isActive);
  const [productIds, setProductIds] = React.useState<string[]>(routine.productIds);
  const [notes, setNotes] = React.useState(routine.notes || '');
  const [showAddProducts, setShowAddProducts] = React.useState(false);

  // Filter products by routine type
  const compatibleProducts = allProducts.filter(product => {
    const usageTime = product.usageTime;
    if (routine.routineType === 'AM') {
      return usageTime.includes('AM') || usageTime.includes('BOTH');
    } else if (routine.routineType === 'PM') {
      return usageTime.includes('PM') || usageTime.includes('BOTH');
    }
    return true;
  });

  // Get products not in routine
  const availableProducts = compatibleProducts.filter(p => !productIds.includes(p.id));

  // Get products in routine (ordered)
  const routineProducts = productIds
    .map(id => allProducts.find(p => p.id === id))
    .filter(Boolean) as SkincareProduct[];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      name,
      isActive,
      productIds,
      notes,
    });
  };

  const handleAddProduct = (productId: string) => {
    setProductIds([...productIds, productId]);
  };

  const handleRemoveProduct = (productId: string) => {
    setProductIds(productIds.filter(id => id !== productId));
  };

  const handleMoveProduct = (index: number, direction: 'up' | 'down') => {
    const newProductIds = [...productIds];
    const newIndex = direction === 'up' ? index - 1 : index + 1;

    if (newIndex < 0 || newIndex >= newProductIds.length) return;

    // Swap
    [newProductIds[index], newProductIds[newIndex]] = [newProductIds[newIndex], newProductIds[index]];
    setProductIds(newProductIds);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Edit Routine</h2>
            <p className="text-sm text-gray-600">{routine.routineType} Routine</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-600" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Routine Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Routine Name
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., Morning Routine"
              required
            />
          </div>

          {/* Active Status */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isActive"
              checked={isActive}
              onChange={e => setIsActive(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
            />
            <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
              Active routine (shown in daily tracking)
            </label>
          </div>

          {/* Products in Routine */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-gray-700">
                Products ({routineProducts.length})
              </label>
              <button
                type="button"
                onClick={() => setShowAddProducts(!showAddProducts)}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
              >
                <Plus className="h-4 w-4" />
                Add Products
              </button>
            </div>

            {/* Add Products Section */}
            {showAddProducts && availableProducts.length > 0 && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-xs text-blue-700 mb-2 font-medium">
                  Available {routine.routineType} Products:
                </p>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {availableProducts.map(product => (
                    <button
                      key={product.id}
                      type="button"
                      onClick={() => {
                        handleAddProduct(product.id);
                        setShowAddProducts(false);
                      }}
                      className="w-full flex items-center justify-between p-2 bg-white rounded border border-blue-200 hover:bg-blue-50 transition-colors text-left"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {product.name}
                        </p>
                        <p className="text-xs text-gray-600">
                          {product.brand && `${product.brand} • `}
                          {product.category}
                        </p>
                      </div>
                      <Plus className="h-4 w-4 text-blue-600 flex-shrink-0 ml-2" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Product List */}
            {routineProducts.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <p className="text-sm text-gray-600 mb-2">No products in this routine</p>
                <p className="text-xs text-gray-500">
                  Add products to create your skincare routine
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {routineProducts.map((product, index) => (
                  <div
                    key={product.id}
                    className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    {/* Order Controls */}
                    <div className="flex flex-col gap-0.5">
                      <button
                        type="button"
                        onClick={() => handleMoveProduct(index, 'up')}
                        disabled={index === 0}
                        className={`p-0.5 rounded ${
                          index === 0
                            ? 'text-gray-300 cursor-not-allowed'
                            : 'text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        ▲
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveProduct(index, 'down')}
                        disabled={index === routineProducts.length - 1}
                        className={`p-0.5 rounded ${
                          index === routineProducts.length - 1
                            ? 'text-gray-300 cursor-not-allowed'
                            : 'text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        ▼
                      </button>
                    </div>

                    {/* Step Number */}
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-semibold">
                      {index + 1}
                    </div>

                    {/* Product Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {product.name}
                      </p>
                      <p className="text-xs text-gray-600">
                        {product.brand && `${product.brand} • `}
                        {product.category}
                      </p>
                    </div>

                    {/* Remove Button */}
                    <button
                      type="button"
                      onClick={() => handleRemoveProduct(product.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Remove from routine"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Any notes about this routine..."
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onDelete}
              className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors flex items-center gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Delete Routine
            </button>
            <div className="flex-1"></div>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Save className="h-5 w-5" />
              Save Routine
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RoutineEditorModal;
