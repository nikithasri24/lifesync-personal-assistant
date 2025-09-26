// @ts-nocheck
import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Bell,
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign,
  Plus,
  Edit,
  Trash2,
  RefreshCw,
  Zap,
  TrendingUp,
  TrendingDown,
  CreditCard,
  Home,
  Wifi,
  Car,
  Phone,
  Shield,
  Lightbulb,
  Target,
  Eye,
  EyeOff
} from 'lucide-react';
import { apiClient } from '../services/apiClient';
import { expenseCategorizationEngine } from '../services/expenseCategorizationEngine';
import type { FinancialTransactionData } from '../services/types';

interface Bill {
  id: string;
  name: string;
  payee: string;
  amount: number;
  dueDate: Date;
  frequency: 'weekly' | 'monthly' | 'quarterly' | 'annually';
  category: string;
  isAutoPay: boolean;
  isPaid: boolean;
  reminderDays: number[];
  notes?: string;
  lastPaidDate?: Date;
  nextDueDate: Date;
  averageAmount: number;
  icon: string;
  color: string;
}

interface BillReminder {
  billId: string;
  billName: string;
  dueDate: Date;
  amount: number;
  daysUntilDue: number;
  urgency: 'overdue' | 'urgent' | 'upcoming' | 'normal';
}

export default function SmartBillTracker() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [reminders, setReminders] = useState<BillReminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingBill, setEditingBill] = useState<Bill | null>(null);
  const [detectedBills, setDetectedBills] = useState<FinancialTransactionData[]>([]);
  const [showDetected, setShowDetected] = useState(true);

  const [billForm, setBillForm] = useState({
    name: '',
    payee: '',
    amount: '',
    dueDate: '',
    frequency: 'monthly' as const,
    category: '',
    isAutoPay: false,
    reminderDays: [3, 1], // Default reminders 3 days and 1 day before
    notes: ''
  });

  useEffect(() => {
    loadBills();
    detectBillsFromTransactions();
  }, []);

  useEffect(() => {
    generateReminders();
  }, [bills]);

  const loadBills = async () => {
    try {
      setLoading(true);
      // In a real implementation, bills would be stored in the database
      // For now, using localStorage as a placeholder
      const storedBills = localStorage.getItem('lifesync_bills');
      if (storedBills) {
        const parsedBills = JSON.parse(storedBills).map((bill: any) => ({
          ...bill,
          dueDate: new Date(bill.dueDate),
          nextDueDate: new Date(bill.nextDueDate),
          lastPaidDate: bill.lastPaidDate ? new Date(bill.lastPaidDate) : undefined
        }));
        setBills(parsedBills);
      }
    } catch (error) {
      console.error('Failed to load bills:', error);
    } finally {
      setLoading(false);
    }
  };

  const detectBillsFromTransactions = async () => {
    try {
      const transactions = await apiClient.getFinancialTransactions();
      const detected = expenseCategorizationEngine.detectPotentialBills(transactions);
      setDetectedBills(detected);
    } catch (error) {
      console.error('Failed to detect bills:', error);
    }
  };

  const generateReminders = () => {
    const today = new Date();
    const newReminders: BillReminder[] = [];

    bills.forEach(bill => {
      const daysUntilDue = Math.ceil(
        (bill.nextDueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      );

      let urgency: BillReminder['urgency'] = 'normal';
      if (daysUntilDue < 0) urgency = 'overdue';
      else if (daysUntilDue <= 1) urgency = 'urgent';
      else if (daysUntilDue <= 7) urgency = 'upcoming';

      if (urgency !== 'normal' || bill.reminderDays.includes(daysUntilDue)) {
        newReminders.push({
          billId: bill.id,
          billName: bill.name,
          dueDate: bill.nextDueDate,
          amount: bill.amount,
          daysUntilDue,
          urgency
        });
      }
    });

    setReminders(newReminders.sort((a, b) => a.daysUntilDue - b.daysUntilDue));
  };

  const handleCreateBill = async () => {
    if (!billForm.name || !billForm.amount || !billForm.dueDate) return;

    const newBill: Bill = {
      id: Date.now().toString(),
      name: billForm.name,
      payee: billForm.payee || billForm.name,
      amount: parseFloat(billForm.amount),
      dueDate: new Date(billForm.dueDate),
      frequency: billForm.frequency,
      category: billForm.category || 'utilities',
      isAutoPay: billForm.isAutoPay,
      isPaid: false,
      reminderDays: billForm.reminderDays,
      notes: billForm.notes,
      nextDueDate: calculateNextDueDate(new Date(billForm.dueDate), billForm.frequency),
      averageAmount: parseFloat(billForm.amount),
      icon: getCategoryIcon(billForm.category || 'utilities'),
      color: getCategoryColor(billForm.category || 'utilities')
    };

    const updatedBills = [...bills, newBill];
    setBills(updatedBills);
    localStorage.setItem('lifesync_bills', JSON.stringify(updatedBills));

    // Reset form
    setBillForm({
      name: '',
      payee: '',
      amount: '',
      dueDate: '',
      frequency: 'monthly',
      category: '',
      isAutoPay: false,
      reminderDays: [3, 1],
      notes: ''
    });
    setShowCreateForm(false);
  };

  const handleMarkPaid = async (billId: string) => {
    const updatedBills = bills.map(bill => {
      if (bill.id === billId) {
        return {
          ...bill,
          isPaid: true,
          lastPaidDate: new Date(),
          nextDueDate: calculateNextDueDate(bill.nextDueDate, bill.frequency)
        };
      }
      return bill;
    });

    setBills(updatedBills);
    localStorage.setItem('lifesync_bills', JSON.stringify(updatedBills));
  };

  const handleDeleteBill = async (billId: string) => {
    const updatedBills = bills.filter(bill => bill.id !== billId);
    setBills(updatedBills);
    localStorage.setItem('lifesync_bills', JSON.stringify(updatedBills));
  };

  const handleCreateFromDetected = (transaction: FinancialTransactionData) => {
    setBillForm({
      name: transaction.payee || transaction.description || '',
      payee: transaction.payee || '',
      amount: Math.abs(transaction.amount).toString(),
      dueDate: new Date().toISOString().split('T')[0],
      frequency: 'monthly',
      category: 'utilities',
      isAutoPay: false,
      reminderDays: [3, 1],
      notes: 'Auto-detected from transaction history'
    });
    setShowCreateForm(true);
  };

  const calculateNextDueDate = (currentDate: Date, frequency: Bill['frequency']): Date => {
    const next = new Date(currentDate);
    switch (frequency) {
      case 'weekly':
        next.setDate(next.getDate() + 7);
        break;
      case 'monthly':
        next.setMonth(next.getMonth() + 1);
        break;
      case 'quarterly':
        next.setMonth(next.getMonth() + 3);
        break;
      case 'annually':
        next.setFullYear(next.getFullYear() + 1);
        break;
    }
    return next;
  };

  const getCategoryIcon = (category: string): string => {
    const iconMap: Record<string, string> = {
      utilities: '⚡',
      rent: '🏠',
      internet: '🌐',
      phone: '📱',
      insurance: '🛡️',
      subscription: '📺',
      loan: '🏦',
      credit_card: '💳',
      default: '📄'
    };
    return iconMap[category] || iconMap.default;
  };

  const getCategoryColor = (category: string): string => {
    const colorMap: Record<string, string> = {
      utilities: '#F59E0B',
      rent: '#10B981',
      internet: '#3B82F6',
      phone: '#8B5CF6',
      insurance: '#EF4444',
      subscription: '#EC4899',
      loan: '#6B7280',
      credit_card: '#DC2626',
      default: '#6366F1'
    };
    return colorMap[category] || colorMap.default;
  };

  const getUrgencyColor = (urgency: BillReminder['urgency']): string => {
    switch (urgency) {
      case 'overdue': return 'text-red-600 bg-red-50 border-red-200';
      case 'urgent': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'upcoming': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default: return 'text-blue-600 bg-blue-50 border-blue-200';
    }
  };

  const totalMonthlyBills = bills.reduce((sum, bill) => {
    const monthlyAmount = bill.frequency === 'monthly' ? bill.amount :
                         bill.frequency === 'weekly' ? bill.amount * 4 :
                         bill.frequency === 'quarterly' ? bill.amount / 3 :
                         bill.amount / 12;
    return sum + monthlyAmount;
  }, 0);

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading bills...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-2xl font-bold text-gray-900 flex items-center">
            <Calendar className="w-8 h-8 mr-3 text-blue-600" />
            Smart Bill Tracker
          </h3>
          <p className="text-gray-600">Automated bill detection and payment reminders</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowCreateForm(true)}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Bill
          </button>
          <button
            onClick={detectBillsFromTransactions}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
          >
            <Zap className="w-4 h-4 mr-2" />
            Auto-Detect
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-800">Total Monthly Bills</p>
              <p className="text-2xl font-bold text-blue-900">${totalMonthlyBills.toFixed(2)}</p>
            </div>
            <DollarSign className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-800">Paid This Month</p>
              <p className="text-2xl font-bold text-green-900">{bills.filter(b => b.isPaid).length}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-6 border border-orange-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-orange-800">Due Soon</p>
              <p className="text-2xl font-bold text-orange-900">
                {reminders.filter(r => r.urgency === 'upcoming' || r.urgency === 'urgent').length}
              </p>
            </div>
            <Clock className="w-8 h-8 text-orange-600" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-6 border border-red-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-red-800">Overdue</p>
              <p className="text-2xl font-bold text-red-900">
                {reminders.filter(r => r.urgency === 'overdue').length}
              </p>
            </div>
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
        </div>
      </div>

      {/* Active Reminders */}
      {reminders.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold text-gray-900 flex items-center">
              <Bell className="w-5 h-5 mr-2 text-yellow-600" />
              Active Reminders
            </h4>
          </div>
          <div className="space-y-3">
            {reminders.map((reminder) => (
              <div
                key={reminder.billId}
                className={`p-4 rounded-lg border-2 ${getUrgencyColor(reminder.urgency)}`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h5 className="font-medium">{reminder.billName}</h5>
                    <p className="text-sm opacity-80">
                      ${reminder.amount.toFixed(2)} • Due {reminder.dueDate.toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">
                      {reminder.daysUntilDue < 0
                        ? `${Math.abs(reminder.daysUntilDue)} days overdue`
                        : reminder.daysUntilDue === 0
                          ? 'Due today'
                          : `${reminder.daysUntilDue} days left`
                      }
                    </div>
                    <button
                      onClick={() => handleMarkPaid(reminder.billId)}
                      className="mt-2 px-3 py-1 bg-white text-gray-700 rounded text-sm hover:bg-gray-50 transition-colors"
                    >
                      Mark Paid
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Detected Bills */}
      {showDetected && detectedBills.length > 0 && (
        <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-6 border border-purple-200">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold text-purple-900 flex items-center">
              <Lightbulb className="w-5 h-5 mr-2" />
              Potential Bills Detected
            </h4>
            <button
              onClick={() => setShowDetected(false)}
              className="text-purple-600 hover:text-purple-800"
            >
              <EyeOff className="w-4 h-4" />
            </button>
          </div>
          <p className="text-sm text-purple-700 mb-4">
            We found recurring transactions that might be bills. Click to add them to your tracker.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {detectedBills.slice(0, 6).map((transaction, index) => (
              <div
                key={index}
                className="bg-white rounded-lg p-3 border border-purple-100 hover:border-purple-300 transition-colors cursor-pointer"
                onClick={() => handleCreateFromDetected(transaction)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h5 className="font-medium text-gray-900">
                      {transaction.payee || transaction.description}
                    </h5>
                    <p className="text-sm text-gray-600">
                      ${Math.abs(transaction.amount).toFixed(2)}
                    </p>
                  </div>
                  <Plus className="w-4 h-4 text-purple-600" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bills List */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h4 className="text-lg font-semibold text-gray-900">Your Bills</h4>
        </div>
        <div className="p-6">
          {bills.length === 0 ? (
            <div className="text-center py-12">
              <Target className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No bills tracked yet</h3>
              <p className="text-gray-600 mb-4">
                Add your recurring bills to get payment reminders and insights.
              </p>
              <button
                onClick={() => setShowCreateForm(true)}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Bill
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {bills.map((bill) => (
                <div
                  key={bill.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className="w-12 h-12 rounded-lg flex items-center justify-center text-white text-xl"
                      style={{ backgroundColor: bill.color }}
                    >
                      {bill.icon}
                    </div>
                    <div>
                      <h5 className="font-medium text-gray-900">{bill.name}</h5>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span>${bill.amount.toFixed(2)}</span>
                        <span>•</span>
                        <span className="capitalize">{bill.frequency}</span>
                        <span>•</span>
                        <span>Due {bill.nextDueDate.toLocaleDateString()}</span>
                        {bill.isAutoPay && (
                          <>
                            <span>•</span>
                            <span className="text-green-600">AutoPay</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleMarkPaid(bill.id)}
                      className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                      title="Mark as paid"
                    >
                      <CheckCircle className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setEditingBill(bill)}
                      className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Edit bill"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteBill(bill.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete bill"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create Bill Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Bill</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bill Name</label>
                <input
                  type="text"
                  value={billForm.name}
                  onChange={(e) => setBillForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Electric Bill"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                <input
                  type="number"
                  value={billForm.amount}
                  onChange={(e) => setBillForm(prev => ({ ...prev, amount: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                <input
                  type="date"
                  value={billForm.dueDate}
                  onChange={(e) => setBillForm(prev => ({ ...prev, dueDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Frequency</label>
                <select
                  value={billForm.frequency}
                  onChange={(e) => setBillForm(prev => ({ ...prev, frequency: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="annually">Annually</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={billForm.category}
                  onChange={(e) => setBillForm(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="utilities">Utilities</option>
                  <option value="rent">Rent/Mortgage</option>
                  <option value="internet">Internet</option>
                  <option value="phone">Phone</option>
                  <option value="insurance">Insurance</option>
                  <option value="subscription">Subscription</option>
                  <option value="loan">Loan</option>
                  <option value="credit_card">Credit Card</option>
                </select>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="autopay"
                  checked={billForm.isAutoPay}
                  onChange={(e) => setBillForm(prev => ({ ...prev, isAutoPay: e.target.checked }))}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="autopay" className="ml-2 block text-sm text-gray-700">
                  This is set up for automatic payment
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowCreateForm(false)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateBill}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Add Bill
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
