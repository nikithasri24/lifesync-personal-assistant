/**
 * Together Page - Relationship milestones, messages, and challenges
 * Partner-focused feature for sharing special moments and gamified rewards
 */

import React, { useState } from 'react';
import { Heart } from 'lucide-react';
import { usePartnerLink } from '@/together/hooks';
import { PartnerStatusCard } from '@/together/components/PartnerStatusCard';
import { MilestonesView } from '@/together/components/MilestonesView';
import { MessagesView } from '@/together/components/MessagesView';
import { ChallengesView } from '@/together/components/ChallengesView';
import { useThemeColors } from '@/hooks/useThemeColors';

type TabView = 'milestones' | 'messages' | 'challenges';

const Together: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabView>('milestones');
  const colors = useThemeColors();

  // Partner link data (reuses existing Shared connections)
  const { data: partnerLink, isLoading: linkLoading } = usePartnerLink();

  const hasPartner = !!partnerLink;

  const tabs: { key: TabView; label: string }[] = [
    { key: 'milestones', label: 'Milestones' },
    { key: 'messages', label: 'Messages' },
    { key: 'challenges', label: 'Challenges' },
  ];

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1
          className="text-3xl font-bold flex items-center gap-3"
          style={{ color: colors.text.primary }}
        >
          <Heart className="w-8 h-8" style={{ color: '#FF6B9D' }} />
          Together
        </h1>
      </div>

      {/* Partner Connection Status */}
      <PartnerStatusCard
        partnerLink={partnerLink}
        isLoading={linkLoading}
        onLinkPartner={() => {}} // No action needed - uses Shared connections
      />

      {/* Tab Navigation */}
      <div
        className="flex gap-1 p-1 rounded-xl"
        style={{ backgroundColor: colors.bg.secondary }}
      >
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 px-4 py-3 rounded-lg text-sm font-semibold transition-all ${
              activeTab === tab.key
                ? 'bg-white shadow-sm'
                : 'hover:bg-white/50'
            }`}
            style={{
              color: activeTab === tab.key ? '#D4A574' : colors.text.secondary,
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content Views */}
      <section>
        {activeTab === 'milestones' && (
          <MilestonesView partnerLink={partnerLink} />
        )}

        {activeTab === 'messages' && (
          <MessagesView partnerLink={partnerLink} />
        )}

        {activeTab === 'challenges' && (
          <ChallengesView partnerLink={partnerLink} />
        )}
      </section>
    </div>
  );
};

export default Together;
