import React, { useState } from 'react';
import { X } from 'lucide-react';
import type { ShoppingItem } from '../../types';
import { validateCategory } from '../../utils/typeValidators';

interface AddPantryItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: {
    name: string;
    quantity: number;
    unit?: string;
    category: ShoppingItem['category'];
    expirationDate?: Date;
    location?: string;
    lowStockThreshold?: number;
    isLowStock?: boolean;
  }) => Promise<void>;
}

export function AddPantryItemModal({ isOpen, onClose, onSave }: AddPantryItemModalProps) {
  const [pantryForm, setPantryForm] = useState({
    name: '',
    quantity: '1',
    unit: '',
    category: 'pantry' as ShoppingItem['category'],
    expiration: ''
  });
  const [pantryFormLocation, setPantryFormLocation] = useState('');
  const [pantryFormThreshold, setPantryFormThreshold] = useState('');

  const handleSubmit = async () => {
    const qty = Number(pantryForm.quantity) || 0;
    const exp = pantryForm.expiration ? new Date(pantryForm.expiration) : undefined;
    const threshold = pantryFormThreshold ? Number(pantryFormThreshold) : undefined;

    await onSave({
      name: pantryForm.name.trim(),
      quantity: qty,
      unit: pantryForm.unit.trim() || undefined,
      category: pantryForm.category,
      expirationDate: exp,
      location: pantryFormLocation || undefined,
      lowStockThreshold: threshold,
      isLowStock: threshold ? qty <= threshold : undefined
    });

    // Reset form
    setPantryForm({ name: '', quantity: '1', unit: '', category: 'pantry', expiration: '' });
    setPantryFormLocation('');
    setPantryFormThreshold('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold">Add Pantry Item</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-md">
            <X size={18} />
          </button>
        </div>
        <div className="grid gap-3 text-sm">
          <label className="grid gap-1">
            <span className="text-gray-700">Name</span>
            <input
              value={pantryForm.name}
              onChange={(e) => setPantryForm(s => ({ ...s, name: e.target.value }))}
              className="rounded border border-gray-300 px-2 py-1"
            />
          </label>
          <div className="grid grid-cols-3 gap-2">
            <label className="grid gap-1">
              <span className="text-gray-700">Qty</span>
              <input
                type="number"
                min={0}
                value={pantryForm.quantity}
                onChange={(e) => setPantryForm(s => ({ ...s, quantity: e.target.value }))}
                className="rounded border border-gray-300 px-2 py-1"
              />
            </label>
            <label className="grid gap-1">
              <span className="text-gray-700">Unit</span>
              <input
                value={pantryForm.unit}
                onChange={(e) => setPantryForm(s => ({ ...s, unit: e.target.value }))}
                className="rounded border border-gray-300 px-2 py-1"
              />
            </label>
            <label className="grid gap-1">
              <span className="text-gray-700">Category</span>
              <select
                value={pantryForm.category}
                onChange={(e) => setPantryForm(s => ({ ...s, category: validateCategory(e.target.value) }))}
                className="rounded border border-gray-300 px-2 py-1"
              >
                <option value="produce">Produce</option>
                <option value="dairy">Dairy</option>
                <option value="meat">Meat</option>
                <option value="pantry">Pantry</option>
                <option value="other">Other</option>
              </select>
            </label>
          </div>
          <label className="grid gap-1">
            <span className="text-gray-700">Expiration Date</span>
            <input
              type="date"
              value={pantryForm.expiration}
              onChange={(e) => setPantryForm(s => ({ ...s, expiration: e.target.value }))}
              className="rounded border border-gray-300 px-2 py-1"
            />
          </label>
          <div className="grid grid-cols-2 gap-2">
            <label className="grid gap-1">
              <span className="text-gray-700">Location (optional)</span>
              <input
                value={pantryFormLocation}
                onChange={(e) => setPantryFormLocation(e.target.value)}
                className="rounded border border-gray-300 px-2 py-1"
              />
            </label>
            <label className="grid gap-1">
              <span className="text-gray-700">Low stock threshold</span>
              <input
                type="number"
                min={0}
                value={pantryFormThreshold}
                onChange={(e) => setPantryFormThreshold(e.target.value)}
                className="rounded border border-gray-300 px-2 py-1"
              />
            </label>
          </div>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 rounded border border-gray-300 hover:bg-gray-50">
            Cancel
          </button>
          <button
            className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-500"
            onClick={handleSubmit}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
