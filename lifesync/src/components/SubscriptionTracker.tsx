import { useState } from 'react';
import {
  CreditCard,
  Plus,
  Edit,
  Trash2,
  AlertTriangle,
  CheckCircle,
  Calendar,
  DollarSign,
  TrendingUp,
  Bell,
  ExternalLink,
  Pause,
  Play,
  X,
  Search,
  Filter
} from 'lucide-react';
import type { Subscription } from '../types/finance';

const SUBSCRIPTION_CATEGORIES = [
  { value: 'streaming', label: 'Streaming', icon: '📺', color: '#EF4444' },
  { value: 'software', label: 'Software', icon: '💻', color: '#3B82F6' },
  { value: 'fitness', label: 'Fitness', icon: '💪', color: '#10B981' },
  { value: 'news', label: 'News & Media', icon: '📰', color: '#F59E0B' },
  { value: 'cloud', label: 'Cloud Storage', icon: '☁️', color: '#8B5CF6' },
  { value: 'productivity', label: 'Productivity', icon: '📊', color: '#06B6D4' },
  { value: 'entertainment', label: 'Entertainment', icon: '🎮', color: '#EC4899' },
  { value: 'utilities', label: 'Utilities', icon: '⚡', color: '#84CC16' },
  { value: 'other', label: 'Other', icon: '📋', color: '#6B7280' }
];

const MOCK_SUBSCRIPTIONS: Subscription[] = [
  {
    id: '1',
    name: 'Netflix Premium',
    merchant: 'Netflix',
    amount: 15.99,
    frequency: 'monthly',
    nextBillingDate: new Date('2024-02-15'),
    category: 'streaming',
    isActive: true,
    linkedTransactionIds: ['tx1', 'tx2'],
    cancellationUrl: 'https://netflix.com/cancel',
    createdAt: new Date('2023-01-15'),
    updatedAt: new Date()
  },
  {
    id: '2',
    name: 'Spotify Premium',
    merchant: 'Spotify',
    amount: 9.99,
    frequency: 'monthly',
    nextBillingDate: new Date('2024-02-10'),
    category: 'streaming',
    isActive: true,
    linkedTransactionIds: ['tx3'],
    cancellationUrl: 'https://spotify.com/cancel',
    createdAt: new Date('2022-05-20'),
    updatedAt: new Date()
  },
  {
    id: '3',
    name: 'Adobe Creative Cloud',
    merchant: 'Adobe',
    amount: 52.99,
    frequency: 'monthly',
    nextBillingDate: new Date('2024-02-05'),
    category: 'software',
    isActive: true,
    linkedTransactionIds: ['tx4'],
    createdAt: new Date('2023-03-01'),
    updatedAt: new Date()
  },
  {
    id: '4',
    name: 'Amazon Prime',
    merchant: 'Amazon',
    amount: 139.00,
    frequency: 'yearly',
    nextBillingDate: new Date('2024-06-15'),
    category: 'other',
    isActive: true,
    linkedTransactionIds: ['tx5'],
    createdAt: new Date('2023-06-15'),
    updatedAt: new Date()
  },
  {
    id: '5',
    name: 'Planet Fitness',
    merchant: 'Planet Fitness',
    amount: 22.99,
    frequency: 'monthly',
    nextBillingDate: new Date('2024-02-20'),
    category: 'fitness',
    isActive: false,
    linkedTransactionIds: ['tx6'],
    notes: 'Cancelled due to gym closure',
    createdAt: new Date('2022-01-10'),
    updatedAt: new Date()
  }
];

export default function SubscriptionTracker() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>(MOCK_SUBSCRIPTIONS);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingSubscription, setEditingSubscription] = useState<Subscription | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [subscriptionForm, setSubscriptionForm] = useState({
    name: '',
    merchant: '',
    amount: '',
    frequency: 'monthly' as const,
    nextBillingDate: '',
    category: 'other',
    cancellationUrl: '',
    notes: ''
  });

  const getCategoryInfo = (category: string) => {
    return SUBSCRIPTION_CATEGORIES.find(c => c.value === category) || SUBSCRIPTION_CATEGORIES[SUBSCRIPTION_CATEGORIES.length - 1];
  };

  const getDaysUntilBilling = (date: Date) => {
    const today = new Date();
    const timeDiff = new Date(date).getTime() - today.getTime();
    return Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
  };

  const getFrequencyMultiplier = (frequency: string) => {
    switch (frequency) {
      case 'weekly': return 52;
      case 'monthly': return 12;
      case 'quarterly': return 4;
      case 'yearly': return 1;
      default: return 12;
    }
  };

  const calculateAnnualCost = (subscription: Subscription) => {
    return subscription.amount * getFrequencyMultiplier(subscription.frequency);
  };

  const handleCreateSubscription = () => {
    setEditingSubscription(null);
    setSubscriptionForm({
      name: '',
      merchant: '',
      amount: '',
      frequency: 'monthly',
      nextBillingDate: '',
      category: 'other',
      cancellationUrl: '',
      notes: ''
    });
    setShowCreateModal(true);
  };

  const handleSaveSubscription = () => {
    if (!subscriptionForm.name || !subscriptionForm.amount || !subscriptionForm.nextBillingDate) return;

    const subscriptionData: Subscription = {
      id: editingSubscription?.id || Date.now().toString(),
      name: subscriptionForm.name,
      merchant: subscriptionForm.merchant || subscriptionForm.name,
      amount: parseFloat(subscriptionForm.amount),
      frequency: subscriptionForm.frequency,
      nextBillingDate: new Date(subscriptionForm.nextBillingDate),
      category: subscriptionForm.category,
      isActive: editingSubscription?.isActive ?? true,
      linkedTransactionIds: editingSubscription?.linkedTransactionIds || [],
      cancellationUrl: subscriptionForm.cancellationUrl || undefined,
      notes: subscriptionForm.notes || undefined,
      createdAt: editingSubscription?.createdAt || new Date(),
      updatedAt: new Date()
    };

    if (editingSubscription) {
      setSubscriptions(subscriptions.map(s => s.id === editingSubscription.id ? subscriptionData : s));
    } else {
      setSubscriptions([...subscriptions, subscriptionData]);
    }

    setShowCreateModal(false);
    setEditingSubscription(null);
  };

  const handleDeleteSubscription = (subscriptionId: string) => {
    if (confirm('Delete this subscription?')) {
      setSubscriptions(subscriptions.filter(s => s.id !== subscriptionId));
    }
  };

  const toggleSubscriptionStatus = (subscriptionId: string) => {
    setSubscriptions(subscriptions.map(subscription => {
      if (subscription.id === subscriptionId) {
        return {
          ...subscription,
          isActive: !subscription.isActive,
          updatedAt: new Date()
        };
      }
      return subscription;
    }));
  };

  // Filter subscriptions
  const filteredSubscriptions = subscriptions.filter(subscription => {
    const matchesSearch = subscription.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         subscription.merchant.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || subscription.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && subscription.isActive) ||
                         (statusFilter === 'inactive' && !subscription.isActive);
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Calculate totals
  const activeSubscriptions = subscriptions.filter(s => s.isActive);
  const monthlyTotal = activeSubscriptions.reduce((sum, sub) => {
    const monthlyAmount = sub.frequency === 'yearly' ? sub.amount / 12 :
                         sub.frequency === 'quarterly' ? sub.amount / 3 :
                         sub.frequency === 'weekly' ? sub.amount * 4.33 :
                         sub.amount;
    return sum + monthlyAmount;
  }, 0);
  const annualTotal = activeSubscriptions.reduce((sum, sub) => sum + calculateAnnualCost(sub), 0);
  
  // Upcoming bills (next 7 days)
  const upcomingBills = activeSubscriptions.filter(sub => {
    const daysUntil = getDaysUntilBilling(sub.nextBillingDate);
    return daysUntil >= 0 && daysUntil <= 7;
  }).sort((a, b) => getDaysUntilBilling(a.nextBillingDate) - getDaysUntilBilling(b.nextBillingDate));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-2xl font-bold text-gray-900 flex items-center">
            <CreditCard className="w-8 h-8 mr-3 text-blue-600" />
            Subscription Tracker
          </h3>
          <p className="text-gray-600">Manage and track your recurring payments</p>
        </div>
        
        <button
          onClick={handleCreateSubscription}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          <Plus size={18} className="mr-2" />
          Add Subscription
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-800">Active Subscriptions</p>
              <p className="text-2xl font-bold text-blue-900">{activeSubscriptions.length}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-800">Monthly Total</p>
              <p className="text-2xl font-bold text-green-900">${monthlyTotal.toFixed(2)}</p>
            </div>
            <Calendar className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-800">Annual Total</p>
              <p className="text-2xl font-bold text-purple-900">${annualTotal.toFixed(2)}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-purple-600" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-6 border border-orange-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-orange-800">Upcoming Bills</p>
              <p className="text-2xl font-bold text-orange-900">{upcomingBills.length}</p>
              <p className="text-xs text-orange-700">Next 7 days</p>
            </div>
            <Bell className="w-8 h-8 text-orange-600" />
          </div>
        </div>
      </div>

      {/* Upcoming Bills Alert */}
      {upcomingBills.length > 0 && (
        <div className="bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-xl p-6">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-6 h-6 text-orange-600 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-semibold text-orange-800 mb-2">Upcoming Bills</h4>
              <div className="space-y-2">
                {upcomingBills.map(sub => {
                  const daysUntil = getDaysUntilBilling(sub.nextBillingDate);
                  return (
                    <div key={sub.id} className="flex items-center justify-between py-2">
                      <div className="flex items-center space-x-3">
                        <span className="text-lg">{getCategoryInfo(sub.category).icon}</span>
                        <div>
                          <span className="font-medium text-gray-900">{sub.name}</span>
                          <div className="text-sm text-gray-600">
                            {daysUntil === 0 ? 'Due today' : 
                             daysUntil === 1 ? 'Due tomorrow' : 
                             `Due in ${daysUntil} days`}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-gray-900">${sub.amount}</div>
                        <div className="text-sm text-gray-500">{sub.nextBillingDate.toLocaleDateString()}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search subscriptions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Categories</option>
              {SUBSCRIPTION_CATEGORIES.map(cat => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Subscriptions List */}
      {filteredSubscriptions.length === 0 ? (
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-12 text-center">
          <CreditCard className="w-20 h-20 text-gray-300 mx-auto mb-4" />
          <h4 className="text-xl font-medium text-gray-900 mb-2">No subscriptions found</h4>
          <p className="text-gray-600 mb-6">Start tracking your recurring payments</p>
          <button
            onClick={handleCreateSubscription}
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            <Plus size={20} className="mr-2" />
            Add First Subscription
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredSubscriptions
            .sort((a, b) => getDaysUntilBilling(a.nextBillingDate) - getDaysUntilBilling(b.nextBillingDate))
            .map((subscription) => {
              const categoryInfo = getCategoryInfo(subscription.category);
              const daysUntil = getDaysUntilBilling(subscription.nextBillingDate);
              const annualCost = calculateAnnualCost(subscription);
              
              return (
                <div key={subscription.id} className={`bg-white rounded-xl shadow-lg border-2 p-6 transition-all hover:shadow-xl ${
                  subscription.isActive ? 'border-gray-200' : 'border-gray-300 opacity-75'
                }`}>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start space-x-3">
                      <div 
                        className="p-2 rounded-lg"
                        style={{ backgroundColor: `${categoryInfo.color}20` }}
                      >
                        <span className="text-xl">{categoryInfo.icon}</span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">{subscription.name}</h4>
                        <p className="text-sm text-gray-600">{subscription.merchant}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            subscription.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {subscription.isActive ? 'Active' : 'Inactive'}
                          </span>
                          <span className="text-xs text-gray-500">{categoryInfo.label}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => toggleSubscriptionStatus(subscription.id)}
                        className={`p-2 rounded-lg transition-colors ${
                          subscription.isActive 
                            ? 'text-orange-600 hover:bg-orange-50' 
                            : 'text-green-600 hover:bg-green-50'
                        }`}
                        title={subscription.isActive ? 'Pause subscription' : 'Activate subscription'}
                      >
                        {subscription.isActive ? <Pause size={16} /> : <Play size={16} />}
                      </button>
                      <button
                        onClick={() => {
                          setEditingSubscription(subscription);
                          setSubscriptionForm({
                            name: subscription.name,
                            merchant: subscription.merchant,
                            amount: subscription.amount.toString(),
                            frequency: subscription.frequency,
                            nextBillingDate: subscription.nextBillingDate.toISOString().split('T')[0],
                            category: subscription.category,
                            cancellationUrl: subscription.cancellationUrl || '',
                            notes: subscription.notes || ''
                          });
                          setShowCreateModal(true);
                        }}
                        className="p-2 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteSubscription(subscription.id)}
                        className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-2xl font-bold text-gray-900">
                          ${subscription.amount.toFixed(2)}
                        </div>
                        <div className="text-sm text-gray-600">per {subscription.frequency.slice(0, -2)}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-semibold text-gray-700">
                          ${annualCost.toFixed(2)}
                        </div>
                        <div className="text-sm text-gray-500">per year</div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Next billing:</span>
                      <div className="text-right">
                        <div className="font-medium text-gray-900">
                          {subscription.nextBillingDate.toLocaleDateString()}
                        </div>
                        <div className={`text-xs ${
                          daysUntil <= 3 ? 'text-red-600' : 
                          daysUntil <= 7 ? 'text-orange-600' : 
                          'text-gray-500'
                        }`}>
                          {daysUntil < 0 ? 'Overdue' :
                           daysUntil === 0 ? 'Due today' :
                           daysUntil === 1 ? 'Due tomorrow' :
                           `${daysUntil} days`}
                        </div>
                      </div>
                    </div>

                    {subscription.cancellationUrl && (
                      <div className="pt-3 border-t border-gray-200">
                        <a
                          href={subscription.cancellationUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700"
                        >
                          Cancel subscription
                          <ExternalLink size={14} className="ml-1" />
                        </a>
                      </div>
                    )}

                    {subscription.notes && (
                      <div className="pt-2 border-t border-gray-200">
                        <p className="text-sm text-gray-600">{subscription.notes}</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
        </div>
      )}

      {/* Create/Edit Subscription Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingSubscription ? 'Edit Subscription' : 'Add New Subscription'}
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Service Name
                  </label>
                  <input
                    type="text"
                    value={subscriptionForm.name}
                    onChange={(e) => setSubscriptionForm({ ...subscriptionForm, name: e.target.value })}
                    placeholder="Netflix"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Merchant
                  </label>
                  <input
                    type="text"
                    value={subscriptionForm.merchant}
                    onChange={(e) => setSubscriptionForm({ ...subscriptionForm, merchant: e.target.value })}
                    placeholder="Netflix Inc."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Amount
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={subscriptionForm.amount}
                    onChange={(e) => setSubscriptionForm({ ...subscriptionForm, amount: e.target.value })}
                    placeholder="15.99"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Frequency
                  </label>
                  <select
                    value={subscriptionForm.frequency}
                    onChange={(e) => setSubscriptionForm({ ...subscriptionForm, frequency: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Next Billing Date
                  </label>
                  <input
                    type="date"
                    value={subscriptionForm.nextBillingDate}
                    onChange={(e) => setSubscriptionForm({ ...subscriptionForm, nextBillingDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <select
                    value={subscriptionForm.category}
                    onChange={(e) => setSubscriptionForm({ ...subscriptionForm, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {SUBSCRIPTION_CATEGORIES.map(cat => (
                      <option key={cat.value} value={cat.value}>
                        {cat.icon} {cat.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cancellation URL (Optional)
                </label>
                <input
                  type="url"
                  value={subscriptionForm.cancellationUrl}
                  onChange={(e) => setSubscriptionForm({ ...subscriptionForm, cancellationUrl: e.target.value })}
                  placeholder="https://service.com/cancel"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes (Optional)
                </label>
                <textarea
                  value={subscriptionForm.notes}
                  onChange={(e) => setSubscriptionForm({ ...subscriptionForm, notes: e.target.value })}
                  placeholder="Additional notes about this subscription"
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveSubscription}
                disabled={!subscriptionForm.name || !subscriptionForm.amount || !subscriptionForm.nextBillingDate}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-lg transition-colors"
              >
                {editingSubscription ? 'Update Subscription' : 'Add Subscription'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}