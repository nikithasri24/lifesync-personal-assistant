import React from 'react';
import { Trash2 } from 'lucide-react';
import type { TripDestinationWithRequirement } from '../types/trip';
import { getVisaRequirementColor, getVisaRequirementLabel } from '../utils/tripPlannerUtils';

interface DestinationItemProps {
  destination: TripDestinationWithRequirement;
  index: number;
  onRemove: () => void;
}

const DestinationItem: React.FC<DestinationItemProps> = ({ destination, index, onRemove }) => {
  return (
    <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
      <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
        {index + 1}
      </div>
      <div className="flex-1">
        <div className="flex items-start justify-between">
          <div>
            <div className="font-semibold text-gray-900">{destination.countryName}</div>
            {destination.visaRequirement && (
              <div className="mt-2 space-y-1">
                <span className={`inline-block px-2 py-1 rounded text-xs font-medium border ${
                  getVisaRequirementColor(destination.visaRequirement.visaType)
                }`}>
                  {getVisaRequirementLabel(destination.visaRequirement.visaType)}
                </span>
                {destination.visaRequirement.accessVia !== 'passport' && (
                  <div className="text-xs text-purple-700 font-medium">
                    Via {destination.visaRequirement.accessVia}
                  </div>
                )}
                <div className="flex items-center gap-4 text-xs text-gray-600 mt-1">
                  {destination.visaRequirement.daysAllowed && (
                    <span>{destination.visaRequirement.daysAllowed} days</span>
                  )}
                  {destination.visaRequirement.estimatedCost ? (
                    <span>${destination.visaRequirement.estimatedCost}</span>
                  ) : null}
                  {destination.visaRequirement.processingDays ? (
                    <span>{destination.visaRequirement.processingDays} days</span>
                  ) : null}
                </div>
              </div>
            )}
          </div>
          <button
            onClick={onRemove}
            className="text-red-600 hover:text-red-800"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default DestinationItem;
