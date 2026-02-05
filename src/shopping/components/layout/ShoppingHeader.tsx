/**
 * Shopping Header Component
 * Displays title, action buttons, and quick stats
 */

import React from 'react';
import { Plus, Scan, Mic, ShoppingBag, Store as StoreIcon, DollarSign } from 'lucide-react';

interface ShoppingHeaderProps {
  totalMasterItems: number;
  storeListsCount: number;
  totalEstimatedCost: number;
  isScanning: boolean;
  isListening: boolean;
  onScanBarcode: () => void;
  onVoiceAdd: () => void;
  onAddItem: () => void;
}

export function ShoppingHeader({
  totalMasterItems,
  storeListsCount,
  totalEstimatedCost,
  isScanning,
  isListening,
  onScanBarcode,
  onVoiceAdd,
  onAddItem,
}: ShoppingHeaderProps): React.JSX.Element {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Smart Shopping System</h1>
          <p className="text-gray-600">Master list + intelligent store distribution</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={onScanBarcode}
            disabled={isScanning}
            className={`btn-secondary flex items-center space-x-2 ${isScanning ? 'opacity-50' : ''}`}
          >
            <Scan size={16} className={isScanning ? 'text-blue-500' : ''} />
            <span>{isScanning ? 'Scanning...' : 'Scan Barcode'}</span>
          </button>
          <button
            onClick={onVoiceAdd}
            disabled={isListening}
            className={`btn-secondary flex items-center space-x-2 ${isListening ? 'opacity-50' : ''}`}
          >
            <Mic size={16} className={isListening ? 'text-red-500' : ''} />
            <span>{isListening ? 'Listening...' : 'Voice Add'}</span>
          </button>
          <button
            onClick={onAddItem}
            className="btn-primary flex items-center space-x-2"
            aria-label="Add shopping item"
          >
            <Plus size={16} />
            <span>Add Item</span>
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center">
            <ShoppingBag className="h-8 w-8 text-blue-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-black">Master List</p>
              <p className="text-lg font-semibold text-black">{totalMasterItems} items</p>
            </div>
          </div>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center">
            <StoreIcon className="h-8 w-8 text-gray-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-black">Store Lists</p>
              <p className="text-lg font-semibold text-black">{storeListsCount} stores</p>
            </div>
          </div>
        </div>
        <div className="bg-purple-50 rounded-lg p-4">
          <div className="flex items-center">
            <DollarSign className="h-8 w-8 text-purple-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-black">Est. Total</p>
              <p className="text-lg font-semibold text-black">${totalEstimatedCost.toFixed(2)}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
