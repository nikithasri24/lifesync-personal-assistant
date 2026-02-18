/**
 * BucketListFormModalV2 - Modal for creating/editing bucket list destinations
 * Following Together pattern with auto-save and terracotta theme
 */

import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import type { BucketListPriority, BucketListCategory } from '../../types';

export interface BucketListFormData {
  name: string;
  description?: string;
  countryCode?: string;
  countryName?: string;
  cityName?: string;
  regionName?: string;
  priority: BucketListPriority;
  category: BucketListCategory;
  estimatedBudget?: number;
  currency?: string;
  targetYear?: number;
  targetSeason?: string;
  isVisited: boolean;
  visitedDate?: string;
  notes?: string;
  inspirationUrl?: string;
  tags?: string[];
  mustDo?: string[];
  mustEat?: string[];
  mustSee?: string[];
}

interface BucketListFormModalV2Props {
  isOpen: boolean;
  onClose: () => void;
  destination?: BucketListFormData & { id: string };
  isEditing?: boolean;
  onSubmit: (data: Partial<BucketListFormData>) => void | Promise<void>;
  isPending?: boolean;
}

const STORAGE_KEY = 'travel_bucket_list_draft';

const CATEGORIES: { value: BucketListCategory; label: string; emoji: string }[] = [
  { value: 'beach', label: 'Beach', emoji: '🏖️' },
  { value: 'mountain', label: 'Mountain', emoji: '⛰️' },
  { value: 'city', label: 'City', emoji: '🏙️' },
  { value: 'cultural', label: 'Cultural', emoji: '🏛️' },
  { value: 'adventure', label: 'Adventure', emoji: '🎒' },
  { value: 'relaxation', label: 'Relaxation', emoji: '🧘' },
  { value: 'food', label: 'Food', emoji: '🍽️' },
  { value: 'wildlife', label: 'Wildlife', emoji: '🦁' },
  { value: 'other', label: 'Other', emoji: '🌍' },
];

const PRIORITIES: { value: BucketListPriority; label: string; emoji: string }[] = [
  { value: 'urgent', label: 'Urgent', emoji: '🔥' },
  { value: 'high', label: 'High', emoji: '⭐' },
  { value: 'medium', label: 'Medium', emoji: '📌' },
  { value: 'low', label: 'Someday', emoji: '💭' },
];

const SEASONS = ['spring', 'summer', 'fall', 'winter'];

export const BucketListFormModalV2: React.FC<BucketListFormModalV2Props> = ({
  isOpen,
  onClose,
  destination,
  isEditing = false,
  onSubmit,
  isPending = false,
}) => {
  // Load draft on mount
  const loadDraft = () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (error) {
      console.error('Failed to load draft:', error);
    }
    return null;
  };

  const savedDraft = !isEditing ? loadDraft() : null;

  const [formData, setFormData] = useState<BucketListFormData>({
    name: destination?.name || savedDraft?.name || '',
    description: destination?.description || savedDraft?.description || '',
    countryName: destination?.countryName || savedDraft?.countryName || '',
    cityName: destination?.cityName || savedDraft?.cityName || '',
    priority: destination?.priority || savedDraft?.priority || 'medium',
    category: destination?.category || savedDraft?.category || 'city',
    estimatedBudget: destination?.estimatedBudget || savedDraft?.estimatedBudget || undefined,
    currency: destination?.currency || savedDraft?.currency || 'USD',
    targetYear: destination?.targetYear || savedDraft?.targetYear || undefined,
    targetSeason: destination?.targetSeason || savedDraft?.targetSeason || '',
    isVisited: destination?.isVisited || false,
    notes: destination?.notes || savedDraft?.notes || '',
    inspirationUrl: destination?.inspirationUrl || savedDraft?.inspirationUrl || '',
    mustDo: destination?.mustDo || savedDraft?.mustDo || [],
    mustEat: destination?.mustEat || savedDraft?.mustEat || [],
    mustSee: destination?.mustSee || savedDraft?.mustSee || [],
  });

  const [newMustDo, setNewMustDo] = useState('');
  const [newMustEat, setNewMustEat] = useState('');
  const [newMustSee, setNewMustSee] = useState('');

  // Auto-save draft
  useEffect(() => {
    if (!isEditing && formData.name) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
    }
  }, [formData, isEditing]);

  // ESC key to close
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

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      alert('Please enter a destination name');
      return;
    }

    await onSubmit(formData);
    localStorage.removeItem(STORAGE_KEY);
  };

  const addToList = (list: 'mustDo' | 'mustEat' | 'mustSee', value: string, setter: (val: string) => void) => {
    if (!value.trim()) return;
    setFormData(prev => ({
      ...prev,
      [list]: [...(prev[list] || []), value.trim()],
    }));
    setter('');
  };

  const removeFromList = (list: 'mustDo' | 'mustEat' | 'mustSee', index: number) => {
    setFormData(prev => ({
      ...prev,
      [list]: prev[list]?.filter((_, i) => i !== index) || [],
    }));
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 bottom-0 z-[60] flex items-end justify-center lg:items-center"
      style={{
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        backdropFilter: 'blur(4px)',
        marginTop: 'calc(-1 * env(safe-area-inset-top, 0px))',
        paddingTop: 'env(safe-area-inset-top, 0px)',
        height: 'calc(100vh + env(safe-area-inset-top, 0px) + env(safe-area-inset-bottom, 0px))',
      }}
      onClick={handleBackdropClick}
    >
      <div
        className="w-full bg-white lg:rounded-3xl rounded-t-3xl overflow-hidden flex flex-col"
        style={{ maxHeight: '90vh', maxWidth: '600px' }}
      >
        {/* Mobile drag handle */}
        <div className="lg:hidden pt-2 flex-shrink-0">
          <div className="w-9 h-1 rounded-full mx-auto bg-gray-300" />
        </div>

        {/* Fixed Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200 flex-shrink-0">
          <h2 className="text-2xl font-bold text-gray-900">
            {isEditing ? 'Edit Destination' : 'Add Dream Destination'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Scrollable Form Content */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div
            className="overflow-y-auto p-6 space-y-5 flex-1"
            style={{ maxHeight: 'calc(90vh - 140px)' }}
          >
            {/* Destination Name */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Destination Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none transition-all"
                placeholder="e.g., Santorini, Greece"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Description
              </label>
              <textarea
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none resize-none transition-all"
                placeholder="What makes this destination special?"
              />
            </div>

            {/* Location Details */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Country
                </label>
                <input
                  type="text"
                  value={formData.countryName}
                  onChange={(e) => setFormData({ ...formData, countryName: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none transition-all"
                  placeholder="Greece"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  City
                </label>
                <input
                  type="text"
                  value={formData.cityName}
                  onChange={(e) => setFormData({ ...formData, cityName: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none transition-all"
                  placeholder="Santorini"
                />
              </div>
            </div>

            {/* Category Selection */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Category *
              </label>
              <div className="grid grid-cols-3 gap-2">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, category: cat.value })}
                    className="p-3 rounded-xl border-2 transition-all text-center"
                    style={{
                      background: formData.category === cat.value
                        ? 'linear-gradient(135deg, #D4A574 0%, #C18B5E 100%)'
                        : 'white',
                      borderColor: formData.category === cat.value ? '#C18B5E' : '#E5E7EB',
                      color: formData.category === cat.value ? 'white' : '#1F2937',
                    }}
                  >
                    <div className="text-2xl mb-1">{cat.emoji}</div>
                    <div className="text-xs font-semibold">{cat.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Priority Selection */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Priority *
              </label>
              <div className="grid grid-cols-2 gap-2">
                {PRIORITIES.map((pri) => (
                  <button
                    key={pri.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, priority: pri.value })}
                    className="p-3 rounded-xl border-2 transition-all flex items-center gap-2"
                    style={{
                      background: formData.priority === pri.value
                        ? 'linear-gradient(135deg, #D4A574 0%, #C18B5E 100%)'
                        : 'white',
                      borderColor: formData.priority === pri.value ? '#C18B5E' : '#E5E7EB',
                      color: formData.priority === pri.value ? 'white' : '#1F2937',
                    }}
                  >
                    <span className="text-xl">{pri.emoji}</span>
                    <span className="text-sm font-semibold">{pri.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Budget & Timeline */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Budget
                </label>
                <input
                  type="number"
                  value={formData.estimatedBudget || ''}
                  onChange={(e) => setFormData({ ...formData, estimatedBudget: e.target.value ? Number(e.target.value) : undefined })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none transition-all"
                  placeholder="3000"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Target Year
                </label>
                <input
                  type="number"
                  value={formData.targetYear || ''}
                  onChange={(e) => setFormData({ ...formData, targetYear: e.target.value ? Number(e.target.value) : undefined })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none transition-all"
                  placeholder="2027"
                  min={new Date().getFullYear()}
                />
              </div>
            </div>

            {/* Target Season */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Best Season
              </label>
              <select
                value={formData.targetSeason}
                onChange={(e) => setFormData({ ...formData, targetSeason: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none transition-all"
              >
                <option value="">Any time</option>
                {SEASONS.map((season) => (
                  <option key={season} value={season}>
                    {season.charAt(0).toUpperCase() + season.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* Must Do List */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Must Do Activities
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={newMustDo}
                  onChange={(e) => setNewMustDo(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addToList('mustDo', newMustDo, setNewMustDo);
                    }
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none transition-all text-sm"
                  placeholder="e.g., Watch sunset at Oia"
                />
                <button
                  type="button"
                  onClick={() => addToList('mustDo', newMustDo, setNewMustDo)}
                  className="px-4 py-2 rounded-xl font-semibold text-white transition-opacity"
                  style={{
                    background: 'linear-gradient(135deg, #D4A574 0%, #C18B5E 100%)',
                  }}
                >
                  <Plus size={16} />
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.mustDo?.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-1 px-3 py-1 bg-gray-100 rounded-lg text-sm"
                  >
                    <span>{item}</span>
                    <button
                      type="button"
                      onClick={() => removeFromList('mustDo', idx)}
                      className="text-gray-500 hover:text-red-600"
                      aria-label={`Remove ${item}`}
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Inspiration URL */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Inspiration Link
              </label>
              <input
                type="url"
                value={formData.inspirationUrl}
                onChange={(e) => setFormData({ ...formData, inspirationUrl: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none transition-all"
                placeholder="https://..."
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Notes
              </label>
              <textarea
                rows={3}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none resize-none transition-all"
                placeholder="Additional thoughts or planning notes..."
              />
            </div>
          </div>

          {/* Fixed Footer */}
          <div className="px-6 py-4 border-t border-gray-200 flex gap-3 flex-shrink-0 bg-white">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-xl font-semibold text-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 px-4 py-3 rounded-xl font-semibold text-white transition-opacity disabled:opacity-50"
              style={{
                background: 'linear-gradient(135deg, #D4A574 0%, #C18B5E 100%)',
              }}
            >
              {isPending ? 'Saving...' : (isEditing ? 'Update' : 'Add to Bucket List')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
