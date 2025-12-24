/**
 * OffersTab Component
 * Track promotional offers like 0% APR, merchant offers, etc.
 */

import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Percent, Calendar, AlertCircle } from 'lucide-react';
import { useCardOffersQuery, useUpsertCardOfferMutation } from '@/hooks/useFinanceQuery';
import type { CardOffer, CardOfferInput, OfferType } from '../../types';
import { formatCurrency } from '../../utils/currency';
import { OfferEditor } from './OfferEditor';

interface OffersTabProps {
  accountId: string;
}

export const OffersTab: React.FC<OffersTabProps> = ({ accountId }) => {
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState<CardOffer | null>(null);

  const { data: offers = [], isLoading } = useCardOffersQuery(accountId);
  const upsertMutation = useUpsertCardOfferMutation();

  const handleAdd = () => {
    setEditingOffer(null);
    setIsEditorOpen(true);
  };

  const handleEdit = (offer: CardOffer) => {
    setEditingOffer(offer);
    setIsEditorOpen(true);
  };

  const handleSave = async (offer: CardOfferInput) => {
    await upsertMutation.mutateAsync({ accountId, offer });
    setIsEditorOpen(false);
    setEditingOffer(null);
  };

  // Separate active and expired offers
  const activeOffers = offers.filter(o => !o.expirationDate || new Date(o.expirationDate) >= new Date());
  const expiredOffers = offers.filter(o => o.expirationDate && new Date(o.expirationDate) < new Date());

  if (isLoading) {
    return <div className="text-primary opacity-60">Loading offers...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-primary">Promotional Offers</h3>
        <button
          onClick={handleAdd}
          className="flex items-center gap-2 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Offer
        </button>
      </div>

      {/* Active Offers */}
      {activeOffers.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-primary mb-3">Active Offers</h4>
          <div className="space-y-3">
            {activeOffers.map((offer) => (
              <OfferCard
                key={offer.id}
                offer={offer}
                onEdit={handleEdit}
              />
            ))}
          </div>
        </div>
      )}

      {/* Expired Offers */}
      {expiredOffers.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-primary opacity-60 mb-3">Expired Offers</h4>
          <div className="space-y-3 opacity-50">
            {expiredOffers.map((offer) => (
              <OfferCard
                key={offer.id}
                offer={offer}
                onEdit={handleEdit}
                isExpired
              />
            ))}
          </div>
        </div>
      )}

      {offers.length === 0 && (
        <div className="text-center py-8">
          <Percent className="h-12 w-12 text-primary opacity-30 mx-auto mb-3" />
          <p className="text-primary opacity-60 mb-4">No offers tracked yet</p>
          <button
            onClick={handleAdd}
            className="text-blue-500 hover:text-blue-600 font-medium"
          >
            Add your first offer
          </button>
        </div>
      )}

      {isEditorOpen && (
        <OfferEditor
          offer={editingOffer || undefined}
          onSave={handleSave}
          onCancel={() => {
            setIsEditorOpen(false);
            setEditingOffer(null);
          }}
        />
      )}
    </div>
  );
};

// Offer Card Component
interface OfferCardProps {
  offer: CardOffer;
  onEdit: (offer: CardOffer) => void;
  isExpired?: boolean;
}

const OfferCard: React.FC<OfferCardProps> = ({ offer, onEdit, isExpired = false }) => {
  const daysUntilExpiration = offer.expirationDate 
    ? Math.ceil((new Date(offer.expirationDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : null;

  const getOfferIcon = (type: OfferType) => {
    switch (type) {
      case 'cashback': return '💵';
      case 'statement_credit': return '💳';
      case 'bonus_points': return '⭐';
      default: return '🎁';
    }
  };

  const getOfferTypeLabel = (type: OfferType) => {
    switch (type) {
      case 'cashback': return 'Cashback';
      case 'statement_credit': return 'Statement Credit';
      case 'bonus_points': return 'Bonus Points';
      default: return type;
    }
  };

  return (
    <div 
      className={`rounded-lg p-4 border ${
        isExpired 
          ? 'bg-gray-500/10 border-gray-500/20' 
          : offer.redeemed 
          ? 'bg-emerald-500/10 border-emerald-500/20'
          : 'bg-primary/10 border-primary/10'
      }`}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{getOfferIcon(offer.offerType)}</span>
          <div>
            <h4 className="font-semibold text-primary">{offer.merchant}</h4>
            <p className="text-xs text-primary opacity-60">{getOfferTypeLabel(offer.offerType)}</p>
          </div>
        </div>
        <button
          onClick={() => onEdit(offer)}
          className="p-1 hover:bg-primary/20 rounded transition-colors"
        >
          <Edit2 className="h-4 w-4 text-primary opacity-60" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 mt-3">
        <div>
          <p className="text-xs text-primary opacity-60 mb-1">Offer Amount</p>
          <p className="text-sm font-semibold text-primary">{formatCurrency(offer.offerAmount)}</p>
        </div>
        {offer.requiredSpend && (
          <div>
            <p className="text-xs text-primary opacity-60 mb-1">Required Spend</p>
            <p className="text-sm font-semibold text-primary">{formatCurrency(offer.requiredSpend)}</p>
          </div>
        )}
      </div>

      {offer.expirationDate && (
        <div className={`mt-3 flex items-center gap-1 text-xs ${
          isExpired 
            ? 'text-gray-500' 
            : daysUntilExpiration && daysUntilExpiration <= 7 
            ? 'text-red-500' 
            : 'text-primary opacity-60'
        }`}>
          <Calendar className="h-3 w-3" />
          <span>
            {isExpired 
              ? `Expired: ${new Date(offer.expirationDate).toLocaleDateString()}`
              : `Expires: ${new Date(offer.expirationDate).toLocaleDateString()}`
            }
            {!isExpired && daysUntilExpiration && daysUntilExpiration <= 7 && (
              <span className="ml-1 font-semibold">({daysUntilExpiration} days left!)</span>
            )}
          </span>
        </div>
      )}

      {offer.activated && !offer.redeemed && (
        <div className="mt-2 px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded">
          ✓ Activated on {new Date(offer.activatedDate!).toLocaleDateString()}
        </div>
      )}

      {offer.redeemed && (
        <div className="mt-2 px-2 py-1 bg-emerald-500/20 text-emerald-400 text-xs rounded">
          ✓ Redeemed on {new Date(offer.redeemedDate!).toLocaleDateString()}
        </div>
      )}
    </div>
  );
};



