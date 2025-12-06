/**
 * Mock Store Data
 * Sample stores for development and testing
 */

import type { Store } from '../types';

export const MOCK_STORES: Store[] = [
  {
    id: 'costco',
    name: 'Costco',
    type: 'wholesale',
    address: '123 Warehouse Ave',
    phone: '(555) 123-4567',
    color: '#1e40af',
    coordinates: { lat: 37.7749, lng: -122.4194 },
    preferences: {
      priceRating: 5,
      qualityRating: 4,
      cleanlinessRating: 4,
      serviceRating: 3,
      overallRating: 4
    },
    specialties: ['bulk', 'wholesale', 'household'],
    bestFor: ['pantry', 'frozen', 'household'],
    avgPrices: {
      'Bananas': 2.99,
      'Chicken Breast': 15.99,
      'Paper Towels': 19.99
    },
    distance: 5.2,
    favorite: true,
    hours: {
      'Monday': { open: '10:00', close: '20:30' },
      'Tuesday': { open: '10:00', close: '20:30' },
      'Wednesday': { open: '10:00', close: '20:30' },
      'Thursday': { open: '10:00', close: '20:30' },
      'Friday': { open: '10:00', close: '20:30' },
      'Saturday': { open: '09:30', close: '18:00' },
      'Sunday': { open: '10:00', close: '18:00' }
    },
    hasDelivery: false,
    hasPickup: true
  },
  {
    id: 'wholefoods',
    name: 'Whole Foods',
    type: 'organic',
    address: '456 Organic St',
    phone: '(555) 234-5678',
    color: '#059669',
    coordinates: { lat: 37.7849, lng: -122.4094 },
    preferences: {
      priceRating: 2,
      qualityRating: 5,
      cleanlinessRating: 5,
      serviceRating: 4,
      overallRating: 4
    },
    specialties: ['organic', 'natural', 'premium'],
    bestFor: ['produce', 'dairy', 'meat'],
    avgPrices: {
      'Organic Bananas': 4.99,
      'Grass-fed Beef': 25.99,
      'Almond Milk': 5.49
    },
    distance: 2.1,
    favorite: true,
    hours: {
      'Monday': { open: '08:00', close: '22:00' },
      'Tuesday': { open: '08:00', close: '22:00' },
      'Wednesday': { open: '08:00', close: '22:00' },
      'Thursday': { open: '08:00', close: '22:00' },
      'Friday': { open: '08:00', close: '22:00' },
      'Saturday': { open: '08:00', close: '22:00' },
      'Sunday': { open: '08:00', close: '21:00' }
    },
    hasDelivery: true,
    hasPickup: true,
    deliveryFee: 4.95
  },
  {
    id: 'indian-store',
    name: 'Patel Indian Grocery',
    type: 'international',
    address: '789 Spice Road',
    color: '#dc2626',
    preferences: {
      priceRating: 4,
      qualityRating: 4,
      cleanlinessRating: 3,
      serviceRating: 5,
      overallRating: 4
    },
    specialties: ['indian', 'spices', 'international', 'vegetarian'],
    bestFor: ['pantry', 'produce', 'dairy'],
    avgPrices: {
      'Basmati Rice': 8.99,
      'Turmeric': 3.49,
      'Paneer': 4.99
    },
    distance: 3.8,
    favorite: true
  },
  {
    id: 'trader-joes',
    name: "Trader Joe's",
    type: 'grocery',
    address: '321 Quirky Ave',
    color: '#7c2d12',
    preferences: {
      priceRating: 4,
      qualityRating: 4,
      cleanlinessRating: 4,
      serviceRating: 5,
      overallRating: 4
    },
    specialties: ['unique', 'affordable', 'frozen'],
    bestFor: ['frozen', 'pantry', 'dairy'],
    avgPrices: {
      'Frozen Meals': 3.99,
      'Wine': 12.99,
      'Snacks': 2.49
    },
    distance: 1.8,
    favorite: false
  }
];
