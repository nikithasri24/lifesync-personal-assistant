/**
 * Together Page - Relationship milestones, messages, and challenges
 * Partner-focused feature for sharing special moments and gamified rewards
 */

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { usePartnerLink } from '@/together/hooks';
import { PartnerStatusCard } from '@/together/components/PartnerStatusCard';
import { MilestonesView } from '@/together/components/MilestonesView';
import { MessagesView } from '@/together/components/MessagesView';
import { ChallengesView } from '@/together/components/ChallengesView';
import { useThemeColors } from '@/hooks/useThemeColors';

type TabView = 'milestones' | 'messages' | 'challenges';

const Together: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const colors = useThemeColors();

  // Initialize active tab from URL or default to 'milestones'
  const initialTab = (searchParams.get('tab') as TabView) || 'milestones';
  const [activeTab, setActiveTab] = useState<TabView>(initialTab);

  // Update URL when tab changes
  useEffect(() => {
    const currentTab = searchParams.get('tab');
    if (currentTab !== activeTab) {
      setSearchParams({ tab: activeTab }, { replace: true });
    }
  }, [activeTab, searchParams, setSearchParams]);

  // Partner link data (reuses existing Shared connections)
  const { data: partnerLink, isLoading: linkLoading } = usePartnerLink();

  const tabs: { key: TabView; label: string }[] = [
    { key: 'milestones', label: 'Milestones' },
    { key: 'messages', label: 'Messages' },
    { key: 'challenges', label: 'Challenges' },
  ];

  return (
    <div style={{ backgroundColor: colors.bg.primary, minHeight: '100vh' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '1.5rem', paddingBottom: '5rem' }}>
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold flex items-center gap-3" style={{ color: colors.text.primary }}>
              <span className="text-4xl">❤️</span>
              Together
            </h1>
            <button
              className="px-4 py-2 rounded-lg font-semibold text-white transition-colors"
              style={{
                background: 'linear-gradient(135deg, #D4A574 0%, #C18B5E 100%)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, #C18B5E 0%, #B4794F 100%)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, #D4A574 0%, #C18B5E 100%)';
              }}
              aria-label="Link partner"
            >
              + Link Partner
            </button>
          </div>
        </div>

        {/* Partner Connection Card */}
        <div className="mb-6">
          <PartnerStatusCard
            partnerLink={partnerLink}
            isLoading={linkLoading}
            onLinkPartner={() => {}}
          />
        </div>

        {/* Tab Navigation */}
        <div className="mb-6 p-1 rounded-xl flex gap-1" style={{ backgroundColor: colors.bg.secondary }}>
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 px-4 py-3 rounded-lg font-semibold transition-all ${
                activeTab === tab.key ? 'bg-white shadow-sm' : ''
              }`}
              style={{
                color: activeTab === tab.key ? '#C18B5E' : colors.text.secondary,
              }}
              aria-label={`${tab.label} tab`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Views */}
        <div>
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
    </div>
  );
};

export default Together;
