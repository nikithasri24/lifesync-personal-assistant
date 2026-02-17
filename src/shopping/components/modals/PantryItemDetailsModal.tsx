/**
 * Pantry Item Details Modal
 * View, edit, and manage pantry items with replenish flow
 */

import React, { useEffect, useState } from 'react';
import { X, ShoppingCart, Trash2, Calendar } from 'lucide-react';
import { useThemeColors } from '../../../hooks/useThemeColors';
import type { PantryItem } from '../../../types';
import { format } from 'date-fns';

interface PantryItemDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: PantryItem | null;
  onUpdate: (itemId: string, updates: Partial<PantryItem>) => Promise<void>;
  onDelete: (itemId: string) => Promise<void>;
  onReplenish: (item: PantryItem) => void;
}

const CATEGORIES = [
  { value: 'produce', label: 'Produce', emoji: '🥬' },
  { value: 'dairy', label: 'Dairy & Eggs', emoji: '🥛' },
  { value: 'meat', label: 'Meat & Protein', emoji: '🍖' },
  { value: 'pantry', label: 'Pantry Staples', emoji: '🥫' },
  { value: 'bakery', label: 'Bakery', emoji: '🍞' },
  { value: 'other', label: 'Other', emoji: '📦' },
] as const;

const UNITS = ['pcs', 'lbs', 'oz', 'kg', 'g', 'L', 'mL', 'cups', 'tbsp', 'tsp', 'boxes', 'cans', 'bags'];

export function PantryItemDetailsModal({
  isOpen,
  onClose,
  item,
  onUpdate,
  onDelete,
  onReplenish,
}: PantryItemDetailsModalProps) {
  const colors = useThemeColors();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    quantity: 1,
    unit: 'pcs',
    category: 'other' as PantryItem['category'],
    location: '',
    expirationDate: '',
    notes: '',
    lowStockThreshold: 1,
  });

  // Load item data when modal opens
  useEffect(() => {
    if (item) {
      setFormData({
        name: item.name,
        quantity: item.quantity,
        unit: item.unit ?? 'pcs',
        category: item.category,
        location: item.location ?? '',
        expirationDate: item.expirationDate ? format(item.expirationDate, 'yyyy-MM-dd') : '',
        notes: item.notes ?? '',
        lowStockThreshold: item.lowStockThreshold ?? 1,
      });
      setIsEditing(false);
    }
  }, [item]);

  // Keyboard navigation for Escape key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  if (!isOpen || !item) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleSave = async () => {
    if (!item) return;

    await onUpdate(item.id, {
      name: formData.name,
      quantity: formData.quantity,
      unit: formData.unit,
      category: formData.category,
      location: formData.location || undefined,
      expirationDate: formData.expirationDate ? new Date(formData.expirationDate) : undefined,
      notes: formData.notes || undefined,
      lowStockThreshold: formData.lowStockThreshold,
      isLowStock: formData.quantity <= formData.lowStockThreshold,
      updatedAt: new Date(),
    });

    setIsEditing(false);
  };

  const handleDelete = async () => {
    if (!item) return;
    if (!confirm(`Delete ${item.name} from pantry?`)) return;

    await onDelete(item.id);
    onClose();
  };

  const handleReplenish = () => {
    if (!item) return;
    onReplenish(item);
    onClose();
  };

  const inputClassName = `w-full px-4 py-3 rounded-xl text-base transition-all duration-200 outline-none`;
  const labelClassName = `block text-sm font-semibold mb-2`;

  const isLowStock = formData.quantity <= formData.lowStockThreshold;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center lg:items-center"
      style={{
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        backdropFilter: 'blur(4px)',
      }}
      onClick={handleBackdropClick}
    >
      <div
        className="w-full lg:max-w-2xl bg-white lg:rounded-3xl rounded-t-3xl overflow-hidden"
        style={{
          maxHeight: '90vh',
          boxShadow: '0 -4px 24px rgba(0, 0, 0, 0.15)',
        }}
      >
        {/* Drag Handle (mobile only) */}
        <div className="lg:hidden pt-2">
          <div
            className="w-9 h-1 rounded-full mx-auto"
            style={{ backgroundColor: colors.border.medium }}
          />
        </div>

        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-5 border-b"
          style={{ borderColor: colors.border.light }}
        >
          <h2
            className="text-2xl font-bold"
            style={{ color: colors.text.primary }}
          >
            {isEditing ? 'Edit Item' : item.name}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg transition-colors duration-200"
            style={{
              backgroundColor: colors.badge.bg,
              color: colors.text.secondary,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = colors.bg.secondary;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = colors.badge.bg;
            }}
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto" style={{ maxHeight: 'calc(90vh - 200px)' }}>
          <div className="p-6 space-y-5">
            {/* Low Stock Warning */}
            {!isEditing && isLowStock && (
              <div
                className="flex items-center gap-3 p-4 rounded-xl"
                style={{
                  backgroundColor: '#FFF3CD',
                  border: '2px solid #FFC107',
                }}
              >
                <span className="text-2xl">⚠️</span>
                <div className="flex-1">
                  <p className="font-semibold" style={{ color: '#856404' }}>
                    Low Stock
                  </p>
                  <p className="text-sm" style={{ color: '#856404' }}>
                    Only {formData.quantity} {formData.unit} remaining
                  </p>
                </div>
              </div>
            )}

            {/* Name */}
            <div>
              <label className={labelClassName} style={{ color: colors.text.secondary }}>
                Item Name *
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={inputClassName}
                  style={{
                    backgroundColor: colors.bg.primary,
                    border: `2px solid ${colors.border.light}`,
                    color: colors.text.primary,
                  }}
                  placeholder="e.g., Milk"
                  autoFocus
                />
              ) : (
                <p className="text-lg font-medium" style={{ color: colors.text.primary }}>
                  {item.name}
                </p>
              )}
            </div>

            {/* Quantity and Unit */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClassName} style={{ color: colors.text.secondary }}>
                  Quantity *
                </label>
                {isEditing ? (
                  <input
                    type="number"
                    min={0}
                    step={0.1}
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: parseFloat(e.target.value) || 0 })}
                    className={inputClassName}
                    style={{
                      backgroundColor: colors.bg.primary,
                      border: `2px solid ${colors.border.light}`,
                      color: colors.text.primary,
                    }}
                  />
                ) : (
                  <p className="text-lg font-medium" style={{ color: colors.text.primary }}>
                    {formData.quantity}
                  </p>
                )}
              </div>
              <div>
                <label className={labelClassName} style={{ color: colors.text.secondary }}>
                  Unit
                </label>
                {isEditing ? (
                  <select
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className={inputClassName}
                    style={{
                      backgroundColor: colors.bg.primary,
                      border: `2px solid ${colors.border.light}`,
                      color: colors.text.primary,
                    }}
                  >
                    {UNITS.map(unit => (
                      <option key={unit} value={unit}>{unit}</option>
                    ))}
                  </select>
                ) : (
                  <p className="text-lg font-medium" style={{ color: colors.text.primary }}>
                    {formData.unit}
                  </p>
                )}
              </div>
            </div>

            {/* Category */}
            <div>
              <label className={labelClassName} style={{ color: colors.text.secondary }}>
                Category
              </label>
              {isEditing ? (
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value as PantryItem['category'] })}
                  className={inputClassName}
                  style={{
                    backgroundColor: colors.bg.primary,
                    border: `2px solid ${colors.border.light}`,
                    color: colors.text.primary,
                  }}
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat.value} value={cat.value}>
                      {cat.emoji} {cat.label}
                    </option>
                  ))}
                </select>
              ) : (
                <p className="text-lg font-medium" style={{ color: colors.text.primary }}>
                  {CATEGORIES.find(c => c.value === formData.category)?.emoji} {CATEGORIES.find(c => c.value === formData.category)?.label}
                </p>
              )}
            </div>

            {/* Location */}
            <div>
              <label className={labelClassName} style={{ color: colors.text.secondary }}>
                Location (optional)
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className={inputClassName}
                  style={{
                    backgroundColor: colors.bg.primary,
                    border: `2px solid ${colors.border.light}`,
                    color: colors.text.primary,
                  }}
                  placeholder="e.g., Fridge, Pantry Shelf 2"
                />
              ) : formData.location ? (
                <p className="text-lg" style={{ color: colors.text.primary }}>
                  {formData.location}
                </p>
              ) : (
                <p className="text-sm" style={{ color: colors.text.tertiary }}>
                  Not specified
                </p>
              )}
            </div>

            {/* Expiration Date */}
            <div>
              <label className={labelClassName} style={{ color: colors.text.secondary }}>
                <Calendar size={16} className="inline mr-1" />
                Expiration Date (optional)
              </label>
              {isEditing ? (
                <input
                  type="date"
                  value={formData.expirationDate}
                  onChange={(e) => setFormData({ ...formData, expirationDate: e.target.value })}
                  className={inputClassName}
                  style={{
                    backgroundColor: colors.bg.primary,
                    border: `2px solid ${colors.border.light}`,
                    color: colors.text.primary,
                  }}
                />
              ) : formData.expirationDate ? (
                <p className="text-lg" style={{ color: colors.text.primary }}>
                  {format(new Date(formData.expirationDate), 'MMM dd, yyyy')}
                </p>
              ) : (
                <p className="text-sm" style={{ color: colors.text.tertiary }}>
                  Not specified
                </p>
              )}
            </div>

            {/* Low Stock Threshold */}
            <div>
              <label className={labelClassName} style={{ color: colors.text.secondary }}>
                Low Stock Threshold
              </label>
              {isEditing ? (
                <input
                  type="number"
                  min={0}
                  step={0.1}
                  value={formData.lowStockThreshold}
                  onChange={(e) => setFormData({ ...formData, lowStockThreshold: parseFloat(e.target.value) || 1 })}
                  className={inputClassName}
                  style={{
                    backgroundColor: colors.bg.primary,
                    border: `2px solid ${colors.border.light}`,
                    color: colors.text.primary,
                  }}
                />
              ) : (
                <p className="text-lg" style={{ color: colors.text.primary }}>
                  {formData.lowStockThreshold} {formData.unit}
                </p>
              )}
              <p className="text-xs mt-1" style={{ color: colors.text.tertiary }}>
                Alert when quantity falls below this value
              </p>
            </div>

            {/* Notes */}
            <div>
              <label className={labelClassName} style={{ color: colors.text.secondary }}>
                Notes (optional)
              </label>
              {isEditing ? (
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className={inputClassName}
                  style={{
                    backgroundColor: colors.bg.primary,
                    border: `2px solid ${colors.border.light}`,
                    color: colors.text.primary,
                    minHeight: '80px',
                  }}
                  placeholder="Add any notes about this item..."
                />
              ) : formData.notes ? (
                <p className="text-base" style={{ color: colors.text.primary }}>
                  {formData.notes}
                </p>
              ) : (
                <p className="text-sm" style={{ color: colors.text.tertiary }}>
                  No notes
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div
          className="px-6 py-4 border-t space-y-3"
          style={{ borderColor: colors.border.light }}
        >
          {isEditing ? (
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="flex-1 py-4 rounded-xl font-semibold text-base transition-all duration-200 active:scale-[0.98]"
                style={{
                  backgroundColor: colors.bg.white,
                  border: `2px solid ${colors.border.medium}`,
                  color: colors.text.secondary,
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleSave()}
                className="flex-1 py-4 rounded-xl font-semibold text-base transition-all duration-200 active:scale-[0.98]"
                style={{
                  background: `linear-gradient(135deg, ${colors.accent.start} 0%, ${colors.accent.end} 100%)`,
                  color: 'white',
                }}
              >
                Save Changes
              </button>
            </div>
          ) : (
            <>
              <button
                type="button"
                onClick={handleReplenish}
                className="w-full flex items-center justify-center gap-2 py-4 rounded-xl font-semibold text-base transition-all duration-200 active:scale-[0.98]"
                style={{
                  background: `linear-gradient(135deg, ${colors.accent.start} 0%, ${colors.accent.end} 100%)`,
                  color: 'white',
                }}
                aria-label="Add to shopping list"
              >
                <ShoppingCart size={20} />
                Add to Shopping List
              </button>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="flex-1 py-3 rounded-xl font-semibold text-base transition-all duration-200 active:scale-[0.98]"
                  style={{
                    backgroundColor: colors.bg.white,
                    border: `2px solid ${colors.accent.start}`,
                    color: colors.accent.start,
                  }}
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => void handleDelete()}
                  className="flex-1 py-3 rounded-xl font-semibold text-base transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-2"
                  style={{
                    backgroundColor: colors.bg.white,
                    border: '2px solid #EF4444',
                    color: '#EF4444',
                  }}
                  aria-label="Delete from pantry"
                >
                  <Trash2 size={18} />
                  Delete
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
