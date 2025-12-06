/**
 * CountryStatusModal - Select visit status for a country
 */

import React from 'react';
import { X, MapPin, Home, Plane, Heart, Trash2 } from 'lucide-react';
import type { VisitStatus } from '../types';

type CountryStatusModalProps = {
  countryName: string;
  countryCode: string;
  currentStatus?: VisitStatus;
  onSelect: (status: VisitStatus) => void;
  onRemove: () => void;
  onClose: () => void;
};

const CountryStatusModal: React.FC<CountryStatusModalProps> = ({
  countryName,
  currentStatus,
  onSelect,
  onRemove,
  onClose,
}) => {
  const statuses: Array<{
    status: VisitStatus;
    icon: React.ElementType;
    label: string;
    description: string;
    color: string;
    bgColor: string;
  }> = [
    {
      status: 'visited',
      icon: MapPin,
      label: 'Visited',
      description: "I've been here",
      color: 'text-blue-700',
      bgColor: 'bg-blue-100 border-blue-300',
    },
    {
      status: 'lived',
      icon: Home,
      label: 'Lived',
      description: 'I lived here',
      color: 'text-green-700',
      bgColor: 'bg-green-100 border-green-300',
    },
    {
      status: 'transit',
      icon: Plane,
      label: 'Transit',
      description: 'Just passing through',
      color: 'text-yellow-700',
      bgColor: 'bg-yellow-100 border-yellow-300',
    },
    {
      status: 'wishlist',
      icon: Heart,
      label: 'Wishlist',
      description: 'Want to visit',
      color: 'text-purple-700',
      bgColor: 'bg-purple-100 border-purple-300',
    },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{countryName}</h2>
            <p className="text-sm text-gray-600">Mark your travel status</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-600" />
          </button>
        </div>

        {/* Status Options */}
        <div className="p-6 space-y-3">
          {statuses.map(({ status, icon: Icon, label, description, color, bgColor }) => (
            <button
              key={status}
              onClick={() => {
                onSelect(status);
                onClose();
              }}
              className={`w-full flex items-center gap-4 p-4 rounded-lg border-2 transition-all hover:shadow-md ${
                currentStatus === status
                  ? `${bgColor} border-current`
                  : 'bg-white border-gray-200 hover:border-gray-300'
              }`}
            >
              <div
                className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${
                  currentStatus === status ? bgColor : 'bg-gray-100'
                }`}
              >
                <Icon className={`h-6 w-6 ${currentStatus === status ? color : 'text-gray-600'}`} />
              </div>
              <div className="flex-1 text-left">
                <p className="font-semibold text-gray-900">{label}</p>
                <p className="text-sm text-gray-600">{description}</p>
              </div>
              {currentStatus === status && (
                <div className="flex-shrink-0 w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              )}
            </button>
          ))}
        </div>

        {/* Remove Button */}
        {currentStatus && (
          <div className="border-t border-gray-200 px-6 py-4">
            <button
              onClick={() => {
                onRemove();
                onClose();
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <Trash2 className="h-5 w-5" />
              Remove from map
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CountryStatusModal;
