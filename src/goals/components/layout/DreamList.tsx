import React, { type ReactElement } from 'react';
import { Sparkles } from 'lucide-react';
import type { LifeDream } from '../../types/lifeGoals';
import { DreamCard } from '../DreamCard';
import { useThemeColors } from '@/hooks/useThemeColors';

const EmptyState: React.FC<{ label: string }> = ({ label }) => {
  const colors = useThemeColors();

  return (
    <div
      className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed p-12 text-center"
      style={{ borderColor: colors.border.medium, backgroundColor: colors.bg.white }}
    >
      <div
        className="flex h-12 w-12 items-center justify-center rounded-full"
        style={{ backgroundColor: colors.badge.bg, color: colors.badge.text }}
      >
        <Sparkles className="h-6 w-6" />
      </div>
      <p className="text-sm font-medium" style={{ color: colors.text.secondary }}>
        {label}
      </p>
    </div>
  );
};

interface DreamListProps {
  dreams: LifeDream[];
  onMarkAchieved: (dreamId: string, previousStatus: LifeDream['status']) => void;
  onUndoAchieved: (dreamId: string) => void;
  onDelete: (dreamId: string) => void;
  onEdit: (dream: LifeDream) => void;
  // Merged mode props
  isMerged?: boolean;
  partnerId?: string | null;
  partnerName?: string;
}

/**
 * List of dreams with status tracking using modern DreamCard
 */
export function DreamList({
  dreams,
  onMarkAchieved,
  onUndoAchieved,
  onDelete,
  onEdit,
  isMerged = false,
  partnerId = null,
  partnerName = 'Partner',
}: DreamListProps): ReactElement {
  // Helper to determine dream ownership
  const getDreamOwnership = (dream: LifeDream): 'mine' | 'partner' | 'shared' => {
    if (dream.connectionId) return 'shared';
    if (partnerId && dream.userId === partnerId) return 'partner';
    return 'mine';
  };

  if (dreams.length === 0) {
    return <EmptyState label="No dreams captured yet. Start with one aspiration." />;
  }

  return (
    <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {dreams.map((dream) => {
        const ownership = isMerged ? getDreamOwnership(dream) : 'mine';
        const isPartnerDream = ownership === 'partner';

        return (
          <li key={dream.id}>
            <DreamCard
              dream={dream}
              onEdit={onEdit}
              onMarkAchieved={onMarkAchieved}
              onUndoAchieved={onUndoAchieved}
              onDelete={onDelete}
              isPartner={isPartnerDream}
            />
          </li>
        );
      })}
    </ul>
  );
}
