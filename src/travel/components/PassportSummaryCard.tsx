/**
 * Passport Summary Card
 * Displays a passport with its visa-free access summary
 */

import React from 'react';
import { useVisaAccessSummary } from '../hooks/useVisaRequirements';
import { getPassportRanking } from '../data/passportPower';
import type { UserPassport } from '../types/visa';

interface PassportSummaryCardProps {
  passport: UserPassport;
  ownerLabel: string;
  ownerColor: string;
  currentUserId: string | null;
  onEdit?: (passport: UserPassport) => void;
  onSetPrimary?: (passportId: string) => void;
  onDelete?: (passportId: string) => void;
}

export const PassportSummaryCard: React.FC<PassportSummaryCardProps> = ({
  passport: p,
  ownerLabel,
  ownerColor,
  currentUserId,
  onEdit,
  onSetPrimary,
  onDelete,
}) => {
  const { data: summary } = useVisaAccessSummary(p.countryName);
  const ranking = React.useMemo(() => getPassportRanking(p.countryCode), [p.countryCode]);

  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <div className="flex items-center gap-3 mb-3">
        <div className="text-4xl">{p.countryCode === 'US' ? '🇺🇸' : p.countryCode === 'IN' ? '🇮🇳' : '🌍'}</div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-900">{p.countryName}</span>
            {ownerLabel && (
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${ownerColor}`}>
                {ownerLabel}
              </span>
            )}
          </div>
          {p.expiryDate && (
            <div className="text-sm text-gray-600">
              Expires: {new Date(p.expiryDate).toLocaleDateString()}
            </div>
          )}
        </div>
      </div>

      {/* Mini summary for each passport */}
      {summary && (
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-green-50 rounded p-2">
            <div className="font-bold text-green-700">{summary.visaFree}</div>
            <div className="text-green-600">Visa Free</div>
          </div>
          <div className="bg-blue-50 rounded p-2">
            <div className="font-bold text-blue-700">{summary.visaOnArrival}</div>
            <div className="text-blue-600">On Arrival</div>
          </div>
        </div>
      )}

      {/* Passport ranking */}
      {ranking && (
        <div className="mt-2 text-xs text-gray-600">
          Rank #{ranking.rank} globally
        </div>
      )}

      {/* Action buttons */}
      {currentUserId && p.userId === currentUserId && (
        <div className="flex gap-2 mt-3">
          <button
            onClick={() => onEdit?.(p)}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            aria-label={`Edit ${p.countryName} passport`}
          >
            Edit
          </button>
          {!p.isPrimary && (
            <button
              onClick={() => onSetPrimary?.(p.id)}
              className="text-sm text-gray-600 hover:text-gray-700 font-medium"
            >
              Set as Primary
            </button>
          )}
          <button
            onClick={() => onDelete?.(p.id)}
            className="text-sm text-red-600 hover:text-red-700 font-medium"
            aria-label={`Delete ${p.countryName} passport`}
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
};
