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
    <div style={{ backgroundColor: colors.bg.primary, minHeight: '100vh' }}>
      {/* Header */}
      <div className="sticky top-0 z-10" style={{ backgroundColor: colors.bg.primary }}>
        <div
          className="px-6 pt-4 pb-3"
          style={{
            background: 'linear-gradient(135deg, #D4A574 0%, #C18B5E 100%)',
          }}
        >
          <div className="flex items-center gap-2 mb-2 text-white">
            <Heart size={28} />
            <h1 className="text-3xl font-extrabold">Together</h1>
          </div>
          <div className="text-sm opacity-90 text-white">
            Share moments with your partner
          </div>
        </div>

        {/* Partner Connection Status */}
        <div className="px-6 pt-3">
          <PartnerStatusCard
            partnerLink={partnerLink}
            isLoading={linkLoading}
            onLinkPartner={() => {}} // No action needed - uses Shared connections
          />
        </div>

        {/* Tab Navigation */}
        <div className="px-5 pt-3">
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
                aria-label={`${tab.label} tab`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content Views */}
      <div className="pt-5 px-6 pb-20">
        {activeTab === 'milestones' && (
          <MilestonesView partnerLink={partnerLink} />
        )}

        {activeTab === 'messages' && (
          <MessagesView partnerLink={partnerLink} />
        )}

        {activeTab === 'challenges' && (
          <ChallengesView partnerLink={partnerLink} />
        )}
      </div>
    </div>
  );
};

export default Together;
