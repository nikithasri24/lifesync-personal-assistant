/**
 * Add Store Modal Component
 * Modal form for adding new stores to the shopping list
 * Terracotta themed with bottom sheet style
 */

import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { useThemeColors } from '../../../hooks/useThemeColors';
import { STORE_TYPES } from '../../constants';

interface AddStoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (storeData: {
    name: string;
    type: string;
    address?: string;
    phone?: string;
    website?: string;
  }) => void;
}

export function AddStoreModal({
  isOpen,
  onClose,
  onSubmit,
}: AddStoreModalProps) {
  const colors = useThemeColors();
  const [formData, setFormData] = useState({
    name: '',
    type: 'grocery',
    address: '',
    phone: '',
    website: '',
  });

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

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      name: formData.name,
      type: formData.type,
      address: formData.address || undefined,
      phone: formData.phone || undefined,
      website: formData.website || undefined,
    });
    // Reset form
    setFormData({
      name: '',
      type: 'grocery',
      address: '',
      phone: '',
      website: '',
    });
    onClose();
  };

  const inputClassName = `w-full px-4 py-3 rounded-xl text-base transition-all duration-200 outline-none`;
  const labelClassName = `block text-sm font-semibold mb-2`;

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
            Add Store
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

        {/* Form */}
        <div className="overflow-y-auto" style={{ maxHeight: 'calc(90vh - 140px)' }}>
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {/* Store Name */}
            <div>
              <label className={labelClassName} style={{ color: colors.text.secondary }}>
                Store Name *
              </label>
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
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = colors.accent.start;
                  e.currentTarget.style.backgroundColor = colors.bg.white;
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = colors.border.light;
                  e.currentTarget.style.backgroundColor = colors.bg.primary;
                }}
                placeholder="e.g., Trader Joe's"
                required
                autoFocus
              />
            </div>

            {/* Store Type */}
            <div>
              <label className={labelClassName} style={{ color: colors.text.secondary }}>
                Store Type *
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className={inputClassName}
                style={{
                  backgroundColor: colors.bg.primary,
                  border: `2px solid ${colors.border.light}`,
                  color: colors.text.primary,
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = colors.accent.start;
                  e.currentTarget.style.backgroundColor = colors.bg.white;
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = colors.border.light;
                  e.currentTarget.style.backgroundColor = colors.bg.primary;
                }}
                required
              >
                {STORE_TYPES.map(storeType => (
                  <option key={storeType.value} value={storeType.value}>
                    {storeType.icon} {storeType.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Address */}
            <div>
              <label className={labelClassName} style={{ color: colors.text.secondary }}>
                Address (optional)
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className={inputClassName}
                style={{
                  backgroundColor: colors.bg.primary,
                  border: `2px solid ${colors.border.light}`,
                  color: colors.text.primary,
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = colors.accent.start;
                  e.currentTarget.style.backgroundColor = colors.bg.white;
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = colors.border.light;
                  e.currentTarget.style.backgroundColor = colors.bg.primary;
                }}
                placeholder="123 Main St, City, State 12345"
              />
            </div>

            {/* Phone and Website */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClassName} style={{ color: colors.text.secondary }}>
                  Phone (optional)
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className={inputClassName}
                  style={{
                    backgroundColor: colors.bg.primary,
                    border: `2px solid ${colors.border.light}`,
                    color: colors.text.primary,
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = colors.accent.start;
                    e.currentTarget.style.backgroundColor = colors.bg.white;
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = colors.border.light;
                    e.currentTarget.style.backgroundColor = colors.bg.primary;
                  }}
                  placeholder="(555) 123-4567"
                />
              </div>
              <div>
                <label className={labelClassName} style={{ color: colors.text.secondary }}>
                  Website (optional)
                </label>
                <input
                  type="url"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  className={inputClassName}
                  style={{
                    backgroundColor: colors.bg.primary,
                    border: `2px solid ${colors.border.light}`,
                    color: colors.text.primary,
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = colors.accent.start;
                    e.currentTarget.style.backgroundColor = colors.bg.white;
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = colors.border.light;
                    e.currentTarget.style.backgroundColor = colors.bg.primary;
                  }}
                  placeholder="https://example.com"
                />
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
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
                type="submit"
                className="flex-1 py-4 rounded-xl font-semibold text-base transition-all duration-200 active:scale-[0.98]"
                style={{
                  background: `linear-gradient(135deg, ${colors.accent.start} 0%, ${colors.accent.end} 100%)`,
                  color: 'white',
                  border: 'none',
                }}
              >
                Add Store
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
