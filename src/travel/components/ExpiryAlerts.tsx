/**
 * Expiry Alerts Component
 * Displays passport and visa expiry warnings
 */

import React from 'react';
import { AlertTriangle, AlertCircle, Info, X } from 'lucide-react';
import { getAllExpiryAlerts, getUpcomingTravelRestrictions } from '../utils/expiryAlerts';
import type { UserPassport, UserVisa } from '../types/visa';
import type { ExpiryAlert } from '../utils/expiryAlerts';

interface ExpiryAlertsProps {
  passports: UserPassport[];
  visas: UserVisa[];
  onDismiss?: (alertId: string) => void;
}

const ExpiryAlerts: React.FC<ExpiryAlertsProps> = ({ passports, visas, onDismiss }) => {
  const [dismissedAlerts, setDismissedAlerts] = React.useState<Set<string>>(new Set());

  const alerts = React.useMemo(() => {
    return getAllExpiryAlerts(passports, visas).filter(
      alert => !dismissedAlerts.has(alert.id)
    );
  }, [passports, visas, dismissedAlerts]);

  const primaryPassport = passports.find(p => p.isPrimary);
  const travelRestriction = primaryPassport ? getUpcomingTravelRestrictions(primaryPassport) : null;

  const handleDismiss = (alertId: string): void => {
    setDismissedAlerts(prev => new Set(prev).add(alertId));
    onDismiss?.(alertId);
  };

  if (alerts.length === 0 && !travelRestriction?.message) {
    return null;
  }

  const getSeverityStyles = (severity: ExpiryAlert['severity']): {
    bg: string;
    border: string;
    icon: string;
    text: string;
    action: string;
  } => {
    switch (severity) {
      case 'critical':
        return {
          bg: 'bg-red-50',
          border: 'border-red-200',
          icon: 'text-red-600',
          text: 'text-red-900',
          action: 'text-red-700',
        };
      case 'warning':
        return {
          bg: 'bg-yellow-50',
          border: 'border-yellow-200',
          icon: 'text-yellow-600',
          text: 'text-yellow-900',
          action: 'text-yellow-700',
        };
      case 'info':
        return {
          bg: 'bg-blue-50',
          border: 'border-blue-200',
          icon: 'text-blue-600',
          text: 'text-blue-900',
          action: 'text-blue-700',
        };
    }
  };

  const getSeverityIcon = (severity: ExpiryAlert['severity']): React.ComponentType<{ className?: string }> => {
    switch (severity) {
      case 'critical':
        return AlertTriangle;
      case 'warning':
        return AlertCircle;
      case 'info':
        return Info;
    }
  };

  return (
    <div className="space-y-3">
      {/* Travel Restriction Warning */}
      {travelRestriction?.message && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-semibold text-orange-900 text-sm mb-1">
                Travel Restriction Warning
              </h4>
              <p className="text-sm text-orange-700">{travelRestriction.message}</p>
            </div>
          </div>
        </div>
      )}

      {/* Expiry Alerts */}
      {alerts.map(alert => {
        const styles = getSeverityStyles(alert.severity);
        const Icon = getSeverityIcon(alert.severity);

        return (
          <div
            key={alert.id}
            className={`${styles.bg} border ${styles.border} rounded-lg p-4`}
          >
            <div className="flex items-start gap-3">
              <Icon className={`w-5 h-5 ${styles.icon} flex-shrink-0 mt-0.5`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <h4 className={`font-semibold ${styles.text} text-sm mb-1`}>
                      {alert.itemName}
                    </h4>
                    <p className={`text-sm ${styles.text} mb-2`}>
                      {alert.message}
                    </p>
                    <div className="flex items-center gap-4 text-xs">
                      <span className={styles.action}>
                        <span className="font-medium">Action:</span> {alert.action}
                      </span>
                      <span className={`${styles.text} opacity-75`}>
                        Expires: {new Date(alert.expiryDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDismiss(alert.id)}
                    className={`${styles.icon} hover:opacity-70 transition-opacity`}
                    aria-label="Dismiss alert"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ExpiryAlerts;
