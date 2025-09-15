/**
 * Focus Mode Integrations
 * 
 * Component for managing external integrations like calendar sync,
 * Slack status updates, Spotify ambient sounds, and notification management.
 */

import React, { useState, useEffect } from 'react';
import { 
  Calendar,
  MessageSquare,
  Music,
  Bell,
  Shield,
  Smartphone,
  Globe,
  Settings,
  Check,
  X,
  ExternalLink,
  RefreshCw,
  AlertCircle,
  CheckCircle
} from 'lucide-react';

interface Integration {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  enabled: boolean;
  connected: boolean;
  status: 'connected' | 'disconnected' | 'error' | 'pending';
  features: string[];
  config?: Record<string, any>;
}

export const FocusIntegrations: React.FC = () => {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [connectingTo, setConnectingTo] = useState<string | null>(null);

  useEffect(() => {
    // Load integrations data
    const defaultIntegrations: Integration[] = [
      {
        id: 'calendar',
        name: 'Calendar Integration',
        description: 'Automatically start focus sessions based on calendar events and block time',
        icon: <Calendar className="w-5 h-5" />,
        enabled: false,
        connected: false,
        status: 'disconnected',
        features: [
          'Auto-start focus sessions from calendar events',
          'Block calendar time during focus sessions',
          'Sync break times with meeting schedules',
          'Smart meeting mode detection'
        ]
      },
      {
        id: 'slack',
        name: 'Slack Status Sync',
        description: 'Update your Slack status to show when you\'re in a focus session',
        icon: <MessageSquare className="w-5 h-5" />,
        enabled: false,
        connected: false,
        status: 'disconnected',
        features: [
          'Auto-update status during focus sessions',
          'Custom focus status messages',
          'Do Not Disturb mode activation',
          'Team focus time coordination'
        ]
      },
      {
        id: 'spotify',
        name: 'Spotify Ambient Sounds',
        description: 'Play focus-enhancing music and ambient sounds during sessions',
        icon: <Music className="w-5 h-5" />,
        enabled: false,
        connected: false,
        status: 'disconnected',
        features: [
          'Curated focus playlists',
          'Ambient sound collections',
          'Binaural beats for concentration',
          'Volume automation during breaks'
        ]
      },
      {
        id: 'notifications',
        name: 'Smart Notifications',
        description: 'Intelligently filter and manage notifications during focus time',
        icon: <Bell className="w-5 h-5" />,
        enabled: true,
        connected: true,
        status: 'connected',
        features: [
          'Priority-based notification filtering',
          'VIP contact allowlist',
          'Emergency keyword detection',
          'Delayed notification delivery'
        ]
      },
      {
        id: 'website-blocker',
        name: 'Website Blocker',
        description: 'Block distracting websites and applications during focus sessions',
        icon: <Shield className="w-5 h-5" />,
        enabled: false,
        connected: false,
        status: 'disconnected',
        features: [
          'Customizable blocklists',
          'Time-based access controls',
          'Allowlist for work websites',
          'Focus mode enforcement'
        ]
      },
      {
        id: 'mobile-sync',
        name: 'Mobile Device Sync',
        description: 'Sync focus sessions across all your devices and enable mobile blocking',
        icon: <Smartphone className="w-5 h-5" />,
        enabled: false,
        connected: false,
        status: 'disconnected',
        features: [
          'Cross-device session sync',
          'Mobile app blocking',
          'Phone call filtering',
          'SMS auto-responses'
        ]
      }
    ];

    setIntegrations(defaultIntegrations);
    setIsLoading(false);
  }, []);

  const handleConnect = async (integrationId: string) => {
    setConnectingTo(integrationId);
    
    try {
      // Simulate connection process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setIntegrations(prev => prev.map(integration => 
        integration.id === integrationId 
          ? { ...integration, connected: true, status: 'connected' }
          : integration
      ));
    } catch (error) {
      setIntegrations(prev => prev.map(integration => 
        integration.id === integrationId 
          ? { ...integration, connected: false, status: 'error' }
          : integration
      ));
    } finally {
      setConnectingTo(null);
    }
  };

  const handleDisconnect = async (integrationId: string) => {
    setIntegrations(prev => prev.map(integration => 
      integration.id === integrationId 
        ? { ...integration, connected: false, status: 'disconnected', enabled: false }
        : integration
    ));
  };

  const handleToggle = (integrationId: string) => {
    setIntegrations(prev => prev.map(integration => 
      integration.id === integrationId 
        ? { ...integration, enabled: !integration.enabled }
        : integration
    ));
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'pending':
        return <RefreshCw className="w-5 h-5 text-yellow-500 animate-spin" />;
      default:
        return <X className="w-5 h-5 text-slate-400" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'connected':
        return 'Connected';
      case 'error':
        return 'Connection Error';
      case 'pending':
        return 'Connecting...';
      default:
        return 'Not Connected';
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-48 mb-6"></div>
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-slate-200 dark:bg-slate-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2 bg-indigo-500 rounded-lg">
            <Globe className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Focus Mode Integrations
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Connect your favorite tools and services to enhance your focus experience
            </p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-3 text-center">
            <div className="text-xl font-bold text-slate-900 dark:text-white">
              {integrations.filter(i => i.connected).length}
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-300">Connected</div>
          </div>
          <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-3 text-center">
            <div className="text-xl font-bold text-slate-900 dark:text-white">
              {integrations.filter(i => i.enabled).length}
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-300">Enabled</div>
          </div>
          <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-3 text-center">
            <div className="text-xl font-bold text-slate-900 dark:text-white">
              {integrations.length}
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-300">Available</div>
          </div>
        </div>
      </div>

      {/* Integration Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {integrations.map((integration) => (
          <div key={integration.id} className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded-lg">
                  {integration.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-white">
                    {integration.name}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    {integration.description}
                  </p>
                </div>
              </div>
              
              {/* Status Indicator */}
              <div className="flex items-center space-x-2">
                {getStatusIcon(connectingTo === integration.id ? 'pending' : integration.status)}
                <span className="text-xs text-slate-600 dark:text-slate-300">
                  {connectingTo === integration.id ? 'Connecting...' : getStatusText(integration.status)}
                </span>
              </div>
            </div>

            {/* Features */}
            <div className="mb-4">
              <h4 className="text-sm font-medium text-slate-900 dark:text-white mb-2">
                Features:
              </h4>
              <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-1">
                {integration.features.map((feature, index) => (
                  <li key={index} className="flex items-center space-x-2">
                    <div className="w-1 h-1 bg-slate-400 rounded-full"></div>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-700">
              <div className="flex items-center space-x-3">
                {integration.connected && (
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={integration.enabled}
                      onChange={() => handleToggle(integration.id)}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-sm text-slate-700 dark:text-slate-300">
                      Enable
                    </span>
                  </label>
                )}
              </div>

              <div className="flex items-center space-x-2">
                {integration.connected ? (
                  <>
                    <button
                      onClick={() => handleDisconnect(integration.id)}
                      className="px-3 py-1 text-xs bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-colors"
                    >
                      Disconnect
                    </button>
                    <button className="px-3 py-1 text-xs bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg transition-colors">
                      <Settings className="w-3 h-3" />
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => handleConnect(integration.id)}
                    disabled={connectingTo === integration.id}
                    className="flex items-center space-x-1 px-3 py-1 text-xs bg-indigo-500 hover:bg-indigo-600 disabled:bg-indigo-300 text-white rounded-lg transition-colors"
                  >
                    {connectingTo === integration.id ? (
                      <RefreshCw className="w-3 h-3 animate-spin" />
                    ) : (
                      <ExternalLink className="w-3 h-3" />
                    )}
                    <span>
                      {connectingTo === integration.id ? 'Connecting...' : 'Connect'}
                    </span>
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Integration Help */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-700 rounded-xl p-6">
        <div className="flex items-start space-x-3">
          <div className="p-2 bg-blue-500 rounded-lg">
            <Settings className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
              Need Help Setting Up Integrations?
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
              Each integration enhances your focus experience in different ways. Connect the ones 
              that matter most to your workflow and productivity goals.
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100">
                📅 Calendar sync for automatic sessions
              </span>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100">
                💬 Team status updates
              </span>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-800 dark:text-purple-100">
                🎵 Focus soundscapes
              </span>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-800 dark:text-orange-100">
                🚫 Distraction blocking
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};