/**
 * Credit Card Templates Database
 * Predefined benefits, bonuses, and earning rates for popular credit cards
 */

import type { CardBenefitInput, CardCategoryBonusInput, WelcomeBonusInput, RewardsType } from '../types';

export type CreditCardTemplate = {
  id: string;
  name: string;
  issuer: 'amex' | 'chase' | 'capital_one' | 'citi' | 'discover' | 'other';
  annualFee: number;
  rewardsType: RewardsType;
  baseRewardsRate: number;
  apr: number; // Typical APR
  benefits: Omit<CardBenefitInput, 'accountId'>[];
  categoryBonuses: Omit<CardCategoryBonusInput, 'accountId'>[];
  welcomeBonus?: Omit<WelcomeBonusInput, 'accountId'>;
};

export const CREDIT_CARD_TEMPLATES: CreditCardTemplate[] = [
  {
    id: 'amex-platinum',
    name: 'American Express Platinum',
    issuer: 'amex',
    annualFee: 695,
    rewardsType: 'points',
    baseRewardsRate: 1.0,
    apr: 20.99,
    benefits: [
      {
        benefitType: 'travel_credit',
        name: '$200 Hotel Credit',
        description: 'Annual credit for prepaid Fine Hotels + Resorts or The Hotel Collection bookings',
        value: 200,
        frequency: 'annual',
        usedAmount: 0,
        active: true,
      },
      {
        benefitType: 'travel_credit',
        name: '$200 Airline Fee Credit',
        description: 'Annual airline incidental fee credit (select one airline)',
        value: 200,
        frequency: 'annual',
        usedAmount: 0,
        active: true,
      },
      {
        benefitType: 'recurring_credit',
        name: '$15/month Uber Credit',
        description: '$15 monthly Uber Cash ($35 in December)',
        value: 180, // $15 x 12 months
        frequency: 'monthly',
        usedAmount: 0,
        active: true,
      },
      {
        benefitType: 'recurring_credit',
        name: '$20/month Digital Entertainment Credit',
        description: 'Monthly credit for eligible streaming services',
        value: 240, // $20 x 12 months
        frequency: 'monthly',
        usedAmount: 0,
        active: true,
      },
      {
        benefitType: 'recurring_credit',
        name: '$100/quarter Equinox Credit',
        description: 'Quarterly credit for Equinox/Equinox+ memberships',
        value: 400,
        frequency: 'quarterly',
        usedAmount: 0,
        active: true,
      },
      {
        benefitType: 'recurring_credit',
        name: '$100/year Saks Fifth Avenue Credit',
        description: 'Split into $50 every 6 months (Jan-Jun, Jul-Dec)',
        value: 100,
        frequency: 'annual',
        usedAmount: 0,
        active: true,
      },
      {
        benefitType: 'lounge_access',
        name: 'Global Lounge Access',
        description: 'Priority Pass Select, Centurion Lounges, Delta Sky Clubs, Escape Lounges, and more',
        frequency: 'per_use',
        usedAmount: 0,
        active: true,
      },
      {
        benefitType: 'protection',
        name: 'CLEAR Plus Credit',
        description: 'Annual CLEAR Plus membership ($189 value)',
        value: 189,
        frequency: 'annual',
        usedAmount: 0,
        active: true,
      },
    ],
    categoryBonuses: [
      { category: 'travel', rewardsRate: 5.0, isRotating: false },
    ],
    welcomeBonus: {
      bonusAmount: 80000,
      requiredSpend: 6000,
      currentSpend: 0,
      deadline: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 6 months
      completed: false,
    },
  },
  {
    id: 'amex-gold',
    name: 'American Express Gold',
    issuer: 'amex',
    annualFee: 250,
    rewardsType: 'points',
    baseRewardsRate: 1.0,
    apr: 20.99,
    benefits: [
      {
        benefitType: 'recurring_credit',
        name: '$10/month Dining Credit',
        description: 'Monthly credit at Grubhub, The Cheesecake Factory, Goldbelly, Wine.com, Milk Bar, and select Shake Shack locations',
        value: 120,
        frequency: 'monthly',
        usedAmount: 0,
        active: true,
      },
      {
        benefitType: 'recurring_credit',
        name: '$10/month Uber Cash',
        description: 'Monthly Uber Cash for Uber Eats orders or Uber rides',
        value: 120,
        frequency: 'monthly',
        usedAmount: 0,
        active: true,
      },
    ],
    categoryBonuses: [
      { category: 'dining', rewardsRate: 4.0, isRotating: false },
      { category: 'groceries', rewardsRate: 4.0, isRotating: false },
    ],
    welcomeBonus: {
      bonusAmount: 60000,
      requiredSpend: 4000,
      currentSpend: 0,
      deadline: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      completed: false,
    },
  },
  {
    id: 'chase-sapphire-reserve',
    name: 'Chase Sapphire Reserve',
    issuer: 'chase',
    annualFee: 550,
    rewardsType: 'points',
    baseRewardsRate: 1.0,
    apr: 22.49,
    benefits: [
      {
        benefitType: 'travel_credit',
        name: '$300 Annual Travel Credit',
        description: 'Automatic credit for travel purchases',
        value: 300,
        frequency: 'annual',
        usedAmount: 0,
        active: true,
      },
      {
        benefitType: 'lounge_access',
        name: 'Priority Pass Lounge Access',
        description: 'Unlimited Priority Pass Select membership',
        frequency: 'per_use',
        usedAmount: 0,
        active: true,
      },
      {
        benefitType: 'recurring_credit',
        name: '$120/year DoorDash DashPass',
        description: 'Complimentary DoorDash DashPass subscription after account activation',
        value: 120,
        frequency: 'annual',
        usedAmount: 0,
        active: true,
      },
      {
        benefitType: 'protection',
        name: 'Travel Insurance',
        description: 'Trip delay, cancellation, interruption, and lost luggage reimbursement',
        frequency: 'per_use',
        usedAmount: 0,
        active: true,
      },
    ],
    categoryBonuses: [
      { category: 'travel', rewardsRate: 3.0, isRotating: false },
      { category: 'dining', rewardsRate: 3.0, isRotating: false },
    ],
    welcomeBonus: {
      bonusAmount: 60000,
      requiredSpend: 4000,
      currentSpend: 0,
      deadline: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 3 months
      completed: false,
    },
  },
  {
    id: 'chase-sapphire-preferred',
    name: 'Chase Sapphire Preferred',
    issuer: 'chase',
    annualFee: 95,
    rewardsType: 'points',
    baseRewardsRate: 1.0,
    apr: 21.49,
    benefits: [
      {
        benefitType: 'recurring_credit',
        name: '$50/year Hotel Credit',
        description: 'Annual credit on hotel stays booked through Chase Travel',
        value: 50,
        frequency: 'annual',
        usedAmount: 0,
        active: true,
      },
      {
        benefitType: 'protection',
        name: 'Travel Insurance',
        description: 'Trip cancellation, interruption, and delay coverage',
        frequency: 'per_use',
        usedAmount: 0,
        active: true,
      },
    ],
    categoryBonuses: [
      { category: 'travel', rewardsRate: 2.0, isRotating: false },
      { category: 'dining', rewardsRate: 3.0, isRotating: false },
    ],
    welcomeBonus: {
      bonusAmount: 60000,
      requiredSpend: 4000,
      currentSpend: 0,
      deadline: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      completed: false,
    },
  },
  {
    id: 'capital-one-venture-x',
    name: 'Capital One Venture X',
    issuer: 'capital_one',
    annualFee: 395,
    rewardsType: 'miles',
    baseRewardsRate: 2.0,
    apr: 20.99,
    benefits: [
      {
        benefitType: 'travel_credit',
        name: '$300 Annual Travel Credit',
        description: 'Annual credit when booking travel through Capital One Travel',
        value: 300,
        frequency: 'annual',
        usedAmount: 0,
        active: true,
      },
      {
        benefitType: 'lounge_access',
        name: 'Priority Pass and Plaza Premium Lounge Access',
        description: 'Unlimited Priority Pass and Plaza Premium lounge visits',
        frequency: 'per_use',
        usedAmount: 0,
        active: true,
      },
      {
        benefitType: 'recurring_credit',
        name: '10,000 Anniversary Bonus Miles',
        description: 'Receive 10,000 bonus miles each account anniversary',
        value: 100, // Estimated value
        frequency: 'annual',
        usedAmount: 0,
        active: true,
      },
    ],
    categoryBonuses: [
      { category: 'travel', rewardsRate: 5.0, isRotating: false },
    ],
    welcomeBonus: {
      bonusAmount: 75000,
      requiredSpend: 4000,
      currentSpend: 0,
      deadline: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      completed: false,
    },
  },
  {
    id: 'citi-double-cash',
    name: 'Citi Double Cash',
    issuer: 'citi',
    annualFee: 0,
    rewardsType: 'cashback',
    baseRewardsRate: 2.0, // 1% when you buy, 1% as you pay
    apr: 19.24,
    benefits: [],
    categoryBonuses: [],
  },
  {
    id: 'discover-it-cash-back',
    name: 'Discover It Cash Back',
    issuer: 'discover',
    annualFee: 0,
    rewardsType: 'cashback',
    baseRewardsRate: 1.0,
    apr: 16.24,
    benefits: [
      {
        benefitType: 'other',
        name: 'Cashback Match',
        description: 'Discover matches all cashback earned in first year',
        frequency: 'once',
        usedAmount: 0,
        active: true,
      },
    ],
    categoryBonuses: [
      {
        category: 'online',
        rewardsRate: 5.0,
        isRotating: true,
        startDate: new Date(2024, 9, 1).toISOString().split('T')[0], // Oct 1
        endDate: new Date(2024, 11, 31).toISOString().split('T')[0], // Dec 31
      },
    ],
  },
];

export function findCardTemplate(cardName: string): CreditCardTemplate | undefined {
  const normalizedName = cardName.toLowerCase().trim();

  return CREDIT_CARD_TEMPLATES.find(template => {
    const templateName = template.name.toLowerCase();
    return templateName.includes(normalizedName) || normalizedName.includes(templateName);
  });
}

export function getCardTemplateById(id: string): CreditCardTemplate | undefined {
  return CREDIT_CARD_TEMPLATES.find(t => t.id === id);
}
