/**
 * Send Partner Request Modal
 * Form to send a partner link request via email
 */

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface SendPartnerRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// NOTE: This modal is deprecated - Together now uses Shared connections
// Users should go to /shared to send connection requests
export const SendPartnerRequestModal: React.FC<SendPartnerRequestModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [partnerEmail, setPartnerEmail] = useState('');
  const [anniversaryDate, setAnniversaryDate] = useState('');

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    }

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Redirect to Shared page
    window.location.href = '/shared';
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

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
        className="w-full lg:max-w-xl bg-white lg:rounded-3xl rounded-t-3xl overflow-hidden"
        style={{
          maxHeight: '90vh',
          boxShadow: '0 -4px 24px rgba(0, 0, 0, 0.15)',
        }}
      >
        {/* Drag Handle (mobile) */}
        <div className="lg:hidden pt-2">
          <div className="w-9 h-1 bg-gray-300 rounded-full mx-auto" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">
            Send Partner Request
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-700">
              Partner's Email
            </label>
            <input
              type="email"
              value={partnerEmail}
              onChange={(e) => setPartnerEmail(e.target.value)}
              placeholder="partner@example.com"
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-700">
              Anniversary Date (Optional)
            </label>
            <input
              type="date"
              value={anniversaryDate}
              onChange={(e) => setAnniversaryDate(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none transition-all"
            />
            <p className="text-xs mt-1 text-gray-500">
              The date you started your relationship together
            </p>
          </div>

          <div className="p-4 bg-gray-50 rounded-xl">
            <p className="text-sm text-gray-600">
              💡 Your partner will receive a notification to accept your request.
              Once accepted, you can share milestones, messages, and challenges!
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-xl font-semibold text-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-3 rounded-xl font-semibold text-white transition-opacity"
              style={{
                background: 'linear-gradient(135deg, #D4A574 0%, #C18B5E 100%)',
              }}
            >
              Go to Shared Page
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
