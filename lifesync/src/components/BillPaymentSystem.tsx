import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  Bell,
  CheckCircle,
  AlertTriangle,
  CreditCard,
  Home,
  Zap,
  Wifi,
  Car,
  Heart,
  Phone,
  Tv,
  Plus,
  Edit,
  Trash2,
  DollarSign,
  Target,
  RefreshCw,
  Download,
  Filter,
  Search,
  Eye,
  EyeOff,
  Settings,
  Play,
  Pause,
  X,
  Save
} from 'lucide-react';

interface BillPayment {
  id: string;
  name: string;
  category: string;
  amount: number;
  dueDate: Date;
  frequency: 'weekly' | 'bi-weekly' | 'monthly' | 'quarterly' | 'yearly';
  isRecurring: boolean;
  accountId: string;
  merchantName: string;
  description?: string;
  status: 'paid' | 'pending' | 'overdue' | 'scheduled';
  reminderDays: number[];
  isAutoPay: boolean;
  tags: string[];
  lastPaidDate?: Date;
  nextDueDate: Date;
  estimatedAmount?: number;
  actualAmount?: number;
  paymentMethod: 'bank' | 'credit_card' | 'check' | 'cash';
  confirmation?: string;
}

interface BillReminder {
  id: string;
  billId: string;
  type: 'due_soon' | 'overdue' | 'autopay_scheduled' | 'amount_changed';
  message: string;
  priority: 'high' | 'medium' | 'low';
  createdAt: Date;
  isRead: boolean;
}

const MOCK_BILLS: BillPayment[] = [
  {
    id: '1',
    name: 'Rent Payment',
    category: 'housing',
    amount: 1800,
    dueDate: new Date('2024-02-01'),
    frequency: 'monthly',
    isRecurring: true,
    accountId: '1',
    merchantName: 'Maple Grove Apartments',
    status: 'scheduled',
    reminderDays: [7, 3, 1],
    isAutoPay: true,
    tags: ['rent', 'essential'],
    nextDueDate: new Date('2024-02-01'),
    paymentMethod: 'bank'
  },
  {
    id: '2',
    name: 'Electric Bill',
    category: 'utilities',
    amount: 125,
    dueDate: new Date('2024-01-25'),
    frequency: 'monthly',
    isRecurring: true,
    accountId: '1',
    merchantName: 'City Electric Company',
    status: 'pending',
    reminderDays: [5, 2],
    isAutoPay: false,
    tags: ['utilities', 'variable'],
    nextDueDate: new Date('2024-01-25'),
    estimatedAmount: 130,
    paymentMethod: 'bank'
  },
  {
    id: '3',
    name: 'Car Insurance',
    category: 'insurance',
    amount: 145,
    dueDate: new Date('2024-01-20'),
    frequency: 'monthly',
    isRecurring: true,
    accountId: '3',
    merchantName: 'Safe Drive Insurance',
    status: 'paid',
    reminderDays: [7],
    isAutoPay: true,
    tags: ['insurance', 'auto'],
    lastPaidDate: new Date('2024-01-20'),
    nextDueDate: new Date('2024-02-20'),
    actualAmount: 145,
    paymentMethod: 'credit_card',
    confirmation: 'INS-2024-001234'
  },
  {
    id: '4',
    name: 'Internet Service',
    category: 'utilities',
    amount: 79.99,
    dueDate: new Date('2024-01-15'),
    frequency: 'monthly',
    isRecurring: true,
    accountId: '1',
    merchantName: 'FastNet Communications',
    status: 'overdue',
    reminderDays: [3, 1],
    isAutoPay: false,
    tags: ['internet', 'utilities'],
    nextDueDate: new Date('2024-01-15'),
    paymentMethod: 'bank'
  },
  {
    id: '5',
    name: 'Health Insurance',
    category: 'insurance',
    amount: 285,
    dueDate: new Date('2024-01-28'),
    frequency: 'monthly',
    isRecurring: true,
    accountId: '1',
    merchantName: 'HealthFirst Insurance',
    status: 'scheduled',
    reminderDays: [10, 5, 1],
    isAutoPay: true,
    tags: ['health', 'insurance', 'essential'],
    nextDueDate: new Date('2024-01-28'),
    paymentMethod: 'bank'
  },
  {
    id: '6',
    name: 'Streaming Services',
    category: 'entertainment',
    amount: 45.99,
    dueDate: new Date('2024-01-22'),
    frequency: 'monthly',
    isRecurring: true,
    accountId: '3',
    merchantName: 'MultiStream Bundle',
    status: 'paid',
    reminderDays: [3],
    isAutoPay: true,
    tags: ['entertainment', 'subscriptions'],
    lastPaidDate: new Date('2024-01-22'),
    nextDueDate: new Date('2024-02-22'),
    actualAmount: 45.99,
    paymentMethod: 'credit_card'
  }
];

const BILL_CATEGORIES = [
  { value: 'housing', label: 'Housing', icon: Home, color: '#3B82F6' },
  { value: 'utilities', label: 'Utilities', icon: Zap, color: '#EF4444' },
  { value: 'insurance', label: 'Insurance', icon: Heart, color: '#10B981' },
  { value: 'transportation', label: 'Transportation', icon: Car, color: '#F59E0B' },
  { value: 'entertainment', label: 'Entertainment', icon: Tv, color: '#8B5CF6' },
  { value: 'communication', label: 'Communication', icon: Phone, color: '#06B6D4' },
  { value: 'financial', label: 'Financial', icon: CreditCard, color: '#EC4899' }
];

const MOCK_REMINDERS: BillReminder[] = [
  {
    id: '1',
    billId: '2',
    type: 'due_soon',
    message: 'Electric Bill ($125) is due in 2 days',
    priority: 'medium',
    createdAt: new Date(),
    isRead: false
  },
  {
    id: '2',
    billId: '4',
    type: 'overdue',
    message: 'Internet Service payment is 8 days overdue',
    priority: 'high',
    createdAt: new Date(),
    isRead: false
  },
  {
    id: '3',
    billId: '1',
    type: 'autopay_scheduled',
    message: 'Rent Payment autopay scheduled for Feb 1st',
    priority: 'low',
    createdAt: new Date(),
    isRead: true
  }
];

export default function BillPaymentSystem() {
  const [bills, setBills] = useState<BillPayment[]>(MOCK_BILLS);
  const [reminders, setReminders] = useState<BillReminder[]>(MOCK_REMINDERS);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [showValues, setShowValues] = useState(true);
  const [showAddBill, setShowAddBill] = useState(false);
  const [viewMode, setViewMode] = useState<'upcoming' | 'all' | 'calendar'>('upcoming');
  const [billForm, setBillForm] = useState({
    name: '',
    category: 'utilities',
    amount: '',
    dueDate: '',
    frequency: 'monthly' as const,
    merchantName: '',
    reminderDays: [3, 1],
    isAutoPay: false,
    paymentMethod: 'bank' as const
  });

  const formatValue = (value: number) => {
    if (!showValues) return '•••••';
    return `$${value.toLocaleString()}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryInfo = (category: string) => {
    return BILL_CATEGORIES.find(c => c.value === category) || BILL_CATEGORIES[0];
  };

  const getUpcomingBills = () => {
    const now = new Date();
    const next30Days = new Date();
    next30Days.setDate(now.getDate() + 30);
    
    return bills
      .filter(bill => bill.nextDueDate <= next30Days)
      .sort((a, b) => a.nextDueDate.getTime() - b.nextDueDate.getTime());
  };

  const getOverdueBills = () => {
    const now = new Date();
    return bills.filter(bill => bill.nextDueDate < now && bill.status !== 'paid');
  };

  const getTotalUpcoming = () => {
    return getUpcomingBills().reduce((sum, bill) => sum + bill.amount, 0);
  };

  const getTotalOverdue = () => {
    return getOverdueBills().reduce((sum, bill) => sum + bill.amount, 0);
  };

  const getMonthlyRecurring = () => {
    return bills
      .filter(bill => bill.isRecurring && bill.frequency === 'monthly')
      .reduce((sum, bill) => sum + bill.amount, 0);
  };

  const filteredBills = bills.filter(bill => {
    const matchesSearch = bill.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         bill.merchantName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || bill.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || bill.category === categoryFilter;
    
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const markAsPaid = (billId: string) => {
    setBills(bills.map(bill => {
      if (bill.id === billId) {
        const nextDue = new Date(bill.nextDueDate);
        if (bill.frequency === 'monthly') {
          nextDue.setMonth(nextDue.getMonth() + 1);
        } else if (bill.frequency === 'weekly') {
          nextDue.setDate(nextDue.getDate() + 7);
        }
        
        return {
          ...bill,
          status: 'paid' as const,
          lastPaidDate: new Date(),
          nextDueDate: nextDue,
          actualAmount: bill.amount
        };
      }
      return bill;
    }));
  };

  const handleAddBill = () => {
    if (!billForm.name || !billForm.amount || !billForm.dueDate) return;

    const newBill: BillPayment = {
      id: Date.now().toString(),
      name: billForm.name,
      category: billForm.category,
      amount: parseFloat(billForm.amount),
      dueDate: new Date(billForm.dueDate),
      frequency: billForm.frequency,
      isRecurring: true,
      accountId: '1',
      merchantName: billForm.merchantName || billForm.name,
      status: 'pending',
      reminderDays: billForm.reminderDays,
      isAutoPay: billForm.isAutoPay,
      tags: [],
      nextDueDate: new Date(billForm.dueDate),
      paymentMethod: billForm.paymentMethod
    };

    setBills([...bills, newBill]);
    setShowAddBill(false);
    setBillForm({
      name: '',
      category: 'utilities',
      amount: '',
      dueDate: '',
      frequency: 'monthly',
      merchantName: '',
      reminderDays: [3, 1],
      isAutoPay: false,
      paymentMethod: 'bank'
    });
  };

  const deleteBill = (billId: string) => {
    if (confirm('Delete this bill?')) {
      setBills(bills.filter(b => b.id !== billId));
    }
  };

  const unreadReminders = reminders.filter(r => !r.isRead);
  const upcomingBills = getUpcomingBills();
  const overdueBills = getOverdueBills();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-2xl font-bold text-gray-900 flex items-center">
            <Calendar className="w-8 h-8 mr-3 text-blue-600" />
            Bill Payment System
          </h3>
          <p className="text-gray-600">Track and manage all your recurring payments</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowValues(!showValues)}
            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            {showValues ? <EyeOff size={16} /> : <Eye size={16} />}
            <span className="ml-2">{showValues ? 'Hide' : 'Show'} Values</span>
          </button>
          
          <button className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
            <Download size={16} className="mr-2" />
            Export
          </button>
          
          <button
            onClick={() => setShowAddBill(true)}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            <Plus size={18} className="mr-2" />
            Add Bill
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-6 border border-red-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-red-800">Overdue Bills</p>
              <p className="text-2xl font-bold text-red-900">{overdueBills.length}</p>
              <p className="text-xs text-red-700">{formatValue(getTotalOverdue())}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-6 border border-orange-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-orange-800">Due Next 30 Days</p>
              <p className="text-2xl font-bold text-orange-900">{upcomingBills.length}</p>
              <p className="text-xs text-orange-700">{formatValue(getTotalUpcoming())}</p>
            </div>
            <Clock className="w-8 h-8 text-orange-600" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-800">Monthly Recurring</p>
              <p className="text-2xl font-bold text-blue-900">{formatValue(getMonthlyRecurring())}</p>
              <p className="text-xs text-blue-700">auto-pay enabled</p>
            </div>
            <RefreshCw className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-800">Paid This Month</p>
              <p className="text-2xl font-bold text-green-900">{bills.filter(b => b.status === 'paid').length}</p>
              <p className="text-xs text-green-700">on schedule</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </div>
      </div>

      {/* Alerts & Reminders */}
      {unreadReminders.length > 0 && (
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl p-6">
          <div className="flex items-start space-x-3">
            <Bell className="w-6 h-6 text-yellow-600 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-semibold text-yellow-800 mb-3">Payment Reminders ({unreadReminders.length})</h4>
              <div className="space-y-2">
                {unreadReminders.slice(0, 3).map((reminder) => (
                  <div key={reminder.id} className={`p-3 rounded-lg border ${
                    reminder.priority === 'high' ? 'bg-red-50 border-red-200' :
                    reminder.priority === 'medium' ? 'bg-orange-50 border-orange-200' :
                    'bg-blue-50 border-blue-200'
                  }`}>
                    <div className="text-sm font-medium text-gray-900">{reminder.message}</div>
                    <div className="text-xs text-gray-600 mt-1">
                      {reminder.createdAt.toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Toggle and Filters */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="flex border border-gray-300 rounded-lg">
              <button
                onClick={() => setViewMode('upcoming')}
                className={`px-4 py-2 text-sm font-medium transition-colors rounded-l-lg ${
                  viewMode === 'upcoming' ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                Upcoming
              </button>
              <button
                onClick={() => setViewMode('all')}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  viewMode === 'all' ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                All Bills
              </button>
              <button
                onClick={() => setViewMode('calendar')}
                className={`px-4 py-2 text-sm font-medium transition-colors rounded-r-lg ${
                  viewMode === 'calendar' ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                Calendar
              </button>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search bills..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="overdue">Overdue</option>
              <option value="scheduled">Scheduled</option>
            </select>
            
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Categories</option>
              {BILL_CATEGORIES.map(cat => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {viewMode === 'calendar' ? (
        /* Calendar View */
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <div className="bg-gray-100 rounded-lg h-96 flex items-center justify-center">
            <div className="text-center">
              <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">Interactive calendar view coming soon</p>
              <p className="text-sm text-gray-500 mt-1">Bill due dates and payment schedule</p>
            </div>
          </div>
        </div>
      ) : (
        /* Bills Table */
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-semibold text-gray-900">
                {viewMode === 'upcoming' ? 'Upcoming Bills' : 'All Bills'}
              </h4>
              <div className="text-sm text-gray-500">
                {filteredBills.length} bills
              </div>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bill</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Auto-Pay</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {(viewMode === 'upcoming' ? upcomingBills : filteredBills).map((bill) => {
                  const categoryInfo = getCategoryInfo(bill.category);
                  const Icon = categoryInfo.icon;
                  const daysUntilDue = Math.ceil((bill.nextDueDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                  
                  return (
                    <tr key={bill.id} className={`hover:bg-gray-50 transition-colors ${
                      bill.status === 'overdue' ? 'bg-red-50' : ''
                    }`}>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div 
                            className="p-2 rounded-lg"
                            style={{ backgroundColor: `${categoryInfo.color}20` }}
                          >
                            <Icon size={18} style={{ color: categoryInfo.color }} />
                          </div>
                          <div>
                            <div className="text-lg font-semibold text-gray-900">{bill.name}</div>
                            <div className="text-base text-gray-600">{bill.merchantName}</div>
                            <div className="text-sm text-gray-500">{categoryInfo.label} • {bill.frequency}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="text-lg font-bold text-gray-900">{formatValue(bill.amount)}</div>
                        {bill.estimatedAmount && bill.estimatedAmount !== bill.amount && (
                          <div className="text-sm text-gray-500">Est: {formatValue(bill.estimatedAmount)}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-base font-medium text-gray-900">
                          {bill.nextDueDate.toLocaleDateString()}
                        </div>
                        <div className={`text-sm ${
                          daysUntilDue < 0 ? 'text-red-600' :
                          daysUntilDue <= 3 ? 'text-orange-600' :
                          'text-gray-500'
                        }`}>
                          {daysUntilDue < 0 ? `${Math.abs(daysUntilDue)} days overdue` :
                           daysUntilDue === 0 ? 'Due today' :
                           `Due in ${daysUntilDue} days`}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(bill.status)}`}>
                          {bill.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        {bill.isAutoPay ? (
                          <span className="inline-flex items-center text-green-600">
                            <Play size={14} className="mr-1" />
                            Enabled
                          </span>
                        ) : (
                          <span className="inline-flex items-center text-gray-500">
                            <Pause size={14} className="mr-1" />
                            Manual
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center space-x-2">
                          {bill.status !== 'paid' && (
                            <button
                              onClick={() => markAsPaid(bill.id)}
                              className="p-1 text-green-600 hover:bg-green-50 rounded transition-colors"
                              title="Mark as Paid"
                            >
                              <CheckCircle size={16} />
                            </button>
                          )}
                          <button
                            className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title="Edit Bill"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => deleteBill(bill.id)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Delete Bill"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Bill Modal */}
      {showAddBill && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Add New Bill</h3>
              <button
                onClick={() => setShowAddBill(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bill Name
                </label>
                <input
                  type="text"
                  value={billForm.name}
                  onChange={(e) => setBillForm({ ...billForm, name: e.target.value })}
                  placeholder="Electric Bill"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <select
                    value={billForm.category}
                    onChange={(e) => setBillForm({ ...billForm, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {BILL_CATEGORIES.map(cat => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Amount
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={billForm.amount}
                    onChange={(e) => setBillForm({ ...billForm, amount: e.target.value })}
                    placeholder="125.00"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={billForm.dueDate}
                    onChange={(e) => setBillForm({ ...billForm, dueDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Frequency
                  </label>
                  <select
                    value={billForm.frequency}
                    onChange={(e) => setBillForm({ ...billForm, frequency: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="weekly">Weekly</option>
                    <option value="bi-weekly">Bi-weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Merchant/Company
                </label>
                <input
                  type="text"
                  value={billForm.merchantName}
                  onChange={(e) => setBillForm({ ...billForm, merchantName: e.target.value })}
                  placeholder="City Electric Company"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isAutoPay"
                  checked={billForm.isAutoPay}
                  onChange={(e) => setBillForm({ ...billForm, isAutoPay: e.target.checked })}
                  className="rounded border-gray-300 focus:ring-blue-500"
                />
                <label htmlFor="isAutoPay" className="ml-2 text-sm text-gray-700">
                  Enable Auto-Pay
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
              <button
                onClick={() => setShowAddBill(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddBill}
                disabled={!billForm.name || !billForm.amount || !billForm.dueDate}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-lg transition-colors"
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