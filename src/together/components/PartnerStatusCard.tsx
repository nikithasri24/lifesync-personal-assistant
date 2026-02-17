/**
 * Partner Status Card Component
 * Shows partner connection status and days together counter
 */

import React, { useState, useRef, useEffect } from 'react';
import { Check, X } from 'lucide-react';
import type { PartnerLink } from '../types';
import { calculateDaysTogether, formatDateLong } from '../utils/dateHelpers';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useUpdatePartnerName } from '../hooks';

interface PartnerStatusCardProps {
  partnerLink: PartnerLink | null | undefined;
  isLoading: boolean;
  onLinkPartner: () => void;
}

export const PartnerStatusCard: React.FC<PartnerStatusCardProps> = ({
  partnerLink,
  isLoading,
  onLinkPartner,
}) => {
  const colors = useThemeColors();
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const updatePartnerName = useUpdatePartnerName();

  // Focus input when editing starts
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleStartEdit = () => {
    if (partnerLink) {
      setEditedName(partnerLink.partner_name || '');
      setIsEditing(true);
    }
  };

  const handleSave = () => {
    if (partnerLink && editedName.trim()) {
      updatePartnerName.mutate(
        { connectionId: partnerLink.id, name: editedName.trim() },
        {
          onSuccess: () => {
            setIsEditing(false);
          },
        }
      );
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedName('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  if (isLoading) {
    return (
      <div
        className="p-6 rounded-2xl shadow-sm border animate-pulse"
        style={{
          backgroundColor: colors.bg.white,
          borderColor: colors.border.light,
        }}
      >
        <div className="h-20 bg-gray-200 rounded"></div>
      </div>
    );
  }

  // No partner linked yet
  if (!partnerLink) {
    return (
      <div
        className="p-6 rounded-2xl shadow-sm border"
        style={{
          backgroundColor: colors.bg.white,
          borderColor: colors.border.light,
        }}
      >
        <div className="flex items-center gap-4">
          <div className="text-5xl">💝</div>
          <div className="flex-1">
            <h2
              className="text-xl font-bold mb-1"
              style={{ color: colors.text.primary }}
            >
              Connect with Your Partner
            </h2>
            <p className="text-sm mb-3" style={{ color: colors.text.secondary }}>
              Link your LifeSync account with your partner to share milestones,
              messages, and memories.
            </p>
            <p className="text-sm mb-3 font-medium" style={{ color: '#D4A574' }}>
              → Go to the <a href="/shared" className="underline hover:opacity-80">Shared</a> page to send a connection request to your partner first.
            </p>
            <p className="text-xs" style={{ color: colors.text.tertiary }}>
              Once your connection is accepted, your partner will appear here automatically.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Partner linked!
  const daysTogether = partnerLink.relationship_start_date
    ? calculateDaysTogether(partnerLink.relationship_start_date)
    : null;

  const displayName = partnerLink.partner_name || 'Your Partner';

  return (
    <div
      className="p-6 rounded-2xl shadow-sm border"
      style={{
        backgroundColor: colors.bg.white,
        borderColor: colors.border.light,
      }}
    >
      <div className="flex items-center gap-4">
        <div className="text-5xl">💑</div>
        <div className="flex-1">
          <h2
            className="text-xl font-bold mb-1"
            style={{ color: colors.text.primary }}
          >
            Partner Connection
          </h2>
          <div className="mb-2 flex items-center gap-2">
            <span style={{ color: colors.text.secondary }}>Connected with:</span>
            {isEditing ? (
              <div className="flex items-center gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="px-2 py-1 rounded border font-semibold"
                  style={{
                    color: '#D4A574',
                    borderColor: colors.border.medium,
                    backgroundColor: colors.bg.white,
                    minWidth: '150px',
                  }}
                  placeholder="Enter partner name"
                  aria-label="Edit partner name"
                />
                <button
                  onClick={handleSave}
                  className="p-1 rounded hover:bg-green-100 transition-colors"
                  disabled={!editedName.trim() || updatePartnerName.isPending}
                  aria-label="Save partner name"
                >
                  <Check className="w-4 h-4" style={{ color: '#2E7D32' }} />
                </button>
                <button
                  onClick={handleCancel}
                  className="p-1 rounded hover:bg-red-100 transition-colors"
                  disabled={updatePartnerName.isPending}
                  aria-label="Cancel editing"
                >
                  <X className="w-4 h-4" style={{ color: '#D32F2F' }} />
                </button>
              </div>
            ) : (
              <span
                onClick={handleStartEdit}
                className="font-semibold cursor-pointer hover:opacity-80 transition-opacity"
                style={{ color: '#D4A574' }}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    handleStartEdit();
                  }
                }}
                aria-label="Click to edit partner name"
              >
                {displayName}
              </span>
            )}
          </div>
          {partnerLink.relationship_start_date && (
            <p className="text-sm" style={{ color: colors.text.tertiary }}>
              Since: {formatDateLong(partnerLink.relationship_start_date)}
              {daysTogether !== null && (
                <span className="font-semibold ml-1">
                  • {daysTogether} days together
                </span>
              )}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
