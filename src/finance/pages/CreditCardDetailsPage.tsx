/**
 * CreditCardDetailsPage
 * Detailed view of a single credit card with benefits tracking
 */

import React, { useEffect, useState } from 'react';
import { ArrowLeft, Edit, Plus } from 'lucide-react';
import { getFinanceAPI } from '../data';
import type { Account, CardBenefit, CardCategoryBonus, WelcomeBonus, CardOffer } from '../types';
import { CreditCardCard } from '../components/creditCards/CreditCardCard';
import { CardBenefitsPanel } from '../components/creditCards/CardBenefitsPanel';

interface CreditCardDetailsPageProps {
  accountId: string;
  onBack: () => void;
}

export const CreditCardDetailsPage: React.FC<CreditCardDetailsPageProps> = ({ accountId, onBack }) => {
  const [card, setCard] = useState<Account | null>(null);
  const [benefits, setBenefits] = useState<CardBenefit[]>([]);
  const [categoryBonuses, setCategoryBonuses] = useState<CardCategoryBonus[]>([]);
  const [welcomeBonuses, setWelcomeBonuses] = useState<WelcomeBonus[]>([]);
  const [offers, setOffers] = useState<CardOffer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [accountId]);

  const loadData = async () => {
    try {
      setLoading(true);

      const api = await getFinanceAPI();

      // Load card details
      const accounts = await api.listAccounts();
      const foundCard = accounts.find((a) => a.id === accountId);
      if (foundCard) {
        setCard(foundCard);
      }

      // Load benefits data
      const [benefitsData, bonusesData, welcomeData, offersData] = await Promise.all([
        api.listCardBenefits(accountId),
        api.listCategoryBonuses(accountId),
        api.listWelcomeBonuses(accountId),
        api.listCardOffers(accountId),
      ]);

      setBenefits(benefitsData);
      setCategoryBonuses(bonusesData);
      setWelcomeBonuses(welcomeData);
      setOffers(offersData);
    } catch (error) {
      console.error('Failed to load card details:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-primary opacity-70">Loading card details...</div>
      </div>
    );
  }

  if (!card) {
    return (
      <div className="text-center py-12">
        <p className="text-primary opacity-70">Card not found</p>
        <button
          onClick={onBack}
          className="mt-4 px-4 py-2 text-sm font-medium text-primary bg-primary/10 rounded-lg hover:bg-primary/20 transition-colors"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
          <span className="font-medium">Back to Credit Cards</span>
        </button>

        <button
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Edit className="h-4 w-4" />
          Edit Card
        </button>
      </div>

      {/* Card Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <CreditCardCard card={card} />
        </div>

        <div className="lg:col-span-2">
          <div className="rounded-2xl bg-primary/30 backdrop-blur-sm shadow-sm ring-1 ring-primary/20 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-primary">Benefits & Rewards</h2>
              <button
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-primary bg-primary/10 rounded-lg hover:bg-primary/20 transition-colors"
              >
                <Plus className="h-4 w-4" />
                Add Benefit
              </button>
            </div>

            <CardBenefitsPanel
              accountId={accountId}
              benefits={benefits}
              categoryBonuses={categoryBonuses}
              welcomeBonuses={welcomeBonuses}
              offers={offers}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreditCardDetailsPage;
