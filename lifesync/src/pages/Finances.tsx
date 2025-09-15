import React, { useState, useRef, useEffect } from 'react';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  PieChart,
  CreditCard,
  Wallet,
  Target,
  Calendar,
  Plus,
  Edit,
  Trash2,
  ArrowUpRight,
  ArrowDownLeft,
  BarChart3,
  Filter,
  Download,
  Receipt,
  Building,
  Home,
  Car,
  ShoppingBag,
  Coffee,
  Utensils,
  Gamepad2,
  Heart,
  GraduationCap,
  Briefcase,
  Search,
  Brain,
  AlertTriangle,
  CheckCircle,
  Upload,
  FileText,
  Settings,
  Bell,
  TrendingDown as TrendingDownIcon,
  Info,
  Eye,
  EyeOff,
  RefreshCw,
  Lightbulb,
  Zap,
  Award,
  Save,
  X,
  Shield,
  Clock,
  PiggyBank,
  Link,
  Activity
} from 'lucide-react';
import BudgetManager from '../components/BudgetManager';
import FinancialInsights from '../components/FinancialInsights';
import InvestmentTracker from '../components/InvestmentTracker';
import FinancialGoals from '../components/FinancialGoals';
import SubscriptionTracker from '../components/SubscriptionTracker';
import DebtPayoffCalculator from '../components/DebtPayoffCalculator';
import NetWorthTracker from '../components/NetWorthTracker';
import CashFlowForecasting from '../components/CashFlowForecasting';
import ReportsAnalytics from '../components/ReportsAnalytics';
import TaxDocumentManager from '../components/TaxDocumentManager';
import BillPaymentSystem from '../components/BillPaymentSystem';
import FinancialCalendar from '../components/FinancialCalendar';
import AccountReconciliation from '../components/AccountReconciliation';
import CreditScoreMonitoring from '../components/CreditScoreMonitoring';
import AdvancedPortfolioAnalytics from '../components/AdvancedPortfolioAnalytics';
import AutomatedSavings from '../components/AutomatedSavings';
import FinancialHealthScore from '../components/FinancialHealthScore';
import BankAccountLinking from '../components/BankAccountLinking';
import RealTimeFinancialDashboard from '../components/RealTimeFinancialDashboard';
import AdvancedFinancialCharts from '../components/AdvancedFinancialCharts';
import type {
  Account,
  Transaction,
  TransactionCategory,
  Budget,
  FinancialGoal,
  Investment,
  CategoryType,
  TransactionType,
  AccountType,
  BudgetPeriod,
  BudgetStatus,
  GoalStatus,
  TransactionStatus
} from '../types/finance';

// Mock data for demonstration
const MOCK_ACCOUNTS: Account[] = [
  {
    id: '1',
    name: 'Chase Checking',
    type: 'checking',
    balance: 5420.50,
    currency: 'USD',
    institution: 'Chase Bank',
    accountNumber: '****1234',
    isActive: true,
    lastSynced: new Date(),
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '2',
    name: 'Discover Savings',
    type: 'savings',
    balance: 12500.00,
    currency: 'USD',
    institution: 'Discover Bank',
    accountNumber: '****5678',
    isActive: true,
    lastSynced: new Date(),
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '3',
    name: 'Capital One Credit',
    type: 'credit',
    balance: -1850.75,
    currency: 'USD',
    institution: 'Capital One',
    accountNumber: '****9012',
    isActive: true,
    lastSynced: new Date(),
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

const MOCK_TRANSACTIONS: Transaction[] = [
  {
    id: '1',
    accountId: '1',
    description: 'Whole Foods Market',
    amount: -87.45,
    category: 'groceries',
    date: new Date('2024-01-15'),
    status: 'completed',
    type: 'expense',
    merchant: 'Whole Foods',
    isRecurring: false,
    tags: ['groceries', 'food'],
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '2',
    accountId: '1',
    description: 'Monthly Salary',
    amount: 5500.00,
    category: 'salary',
    date: new Date('2024-01-01'),
    status: 'completed',
    type: 'income',
    isRecurring: true,
    recurringPattern: {
      frequency: 'monthly',
      interval: 1,
      endDate: undefined
    },
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '3',
    accountId: '3',
    description: 'Amazon Purchase',
    amount: -156.20,
    category: 'shopping',
    date: new Date('2024-01-14'),
    status: 'completed',
    type: 'expense',
    merchant: 'Amazon',
    isRecurring: false,
    tags: ['online', 'shopping'],
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

const EXPENSE_CATEGORIES = [
  { value: 'groceries', label: 'Groceries', icon: ShoppingBag, color: '#10B981' },
  { value: 'dining', label: 'Dining Out', icon: Utensils, color: '#F59E0B' },
  { value: 'transportation', label: 'Transportation', icon: Car, color: '#3B82F6' },
  { value: 'housing', label: 'Housing', icon: Home, color: '#8B5CF6' },
  { value: 'utilities', label: 'Utilities', icon: Zap, color: '#EF4444' },
  { value: 'healthcare', label: 'Healthcare', icon: Heart, color: '#EC4899' },
  { value: 'entertainment', label: 'Entertainment', icon: Gamepad2, color: '#06B6D4' },
  { value: 'shopping', label: 'Shopping', icon: ShoppingBag, color: '#84CC16' },
  { value: 'education', label: 'Education', icon: GraduationCap, color: '#F97316' },
  { value: 'other', label: 'Other', icon: Receipt, color: '#6B7280' }
];

const INCOME_CATEGORIES = [
  { value: 'salary', label: 'Salary', icon: Building, color: '#10B981' },
  { value: 'freelance', label: 'Freelance', icon: Briefcase, color: '#3B82F6' },
  { value: 'business', label: 'Business Income', icon: TrendingUp, color: '#F59E0B' },
  { value: 'investment', label: 'Investment Returns', icon: PieChart, color: '#8B5CF6' },
  { value: 'rental', label: 'Rental Income', icon: Home, color: '#EF4444' },
  { value: 'other', label: 'Other Income', icon: DollarSign, color: '#6B7280' }
];

interface EditingCell {
  id: string;
  field: string;
}

interface FinancialTransaction {
  id: string;
  title: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  date: Date;
  description?: string;
  recurring?: 'none' | 'weekly' | 'monthly' | 'yearly';
}

export default function Finances() {
  // State for data
  const [accounts] = useState<Account[]>(MOCK_ACCOUNTS);
  const [transactions, setTransactions] = useState<Transaction[]>(MOCK_TRANSACTIONS);
  const [view, setView] = useState<'overview' | 'transactions' | 'budgets' | 'insights' | 'investments' | 'goals' | 'subscriptions' | 'debt' | 'networth' | 'forecast' | 'reports' | 'taxes' | 'bills' | 'calendar' | 'reconciliation' | 'credit' | 'portfolio' | 'savings' | 'health' | 'linking' | 'realtime' | 'charts'>('overview');
  
  // Excel-like editing state
  const [editingCell, setEditingCell] = useState<EditingCell | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const editInputRef = useRef<HTMLInputElement>(null);
  
  // Search and filter
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [accountFilter, setAccountFilter] = useState<string>('all');
  
  // UI state
  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [balanceVisibility, setBalanceVisibility] = useState<{ [key: string]: boolean }>({});
  
  // Excel-like editing functions
  const startEditing = (id: string, field: string, currentValue: any) => {
    setEditingCell({ id, field });
    setEditValue(currentValue?.toString() || '');
    setTimeout(() => editInputRef.current?.focus(), 0);
  };
  
  const saveEdit = () => {
    if (!editingCell) return;
    
    const { id, field } = editingCell;
    setTransactions(prevTransactions => 
      prevTransactions.map(transaction => {
        if (transaction.id === id) {
          let newValue: any = editValue;
          
          // Convert value based on field type
          if (field === 'amount') {
            newValue = parseFloat(editValue) || 0;
          } else if (field === 'date') {
            newValue = new Date(editValue);
          }
          
          return { ...transaction, [field]: newValue };
        }
        return transaction;
      })
    );
    
    setEditingCell(null);
    setEditValue('');
  };
  
  const cancelEdit = () => {
    setEditingCell(null);
    setEditValue('');
  };
  
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      saveEdit();
    } else if (e.key === 'Escape') {
      cancelEdit();
    }
  };
  
  // Add new transaction (Excel-like row insertion)
  const addNewTransaction = () => {
    const newTransaction: Transaction = {
      id: Date.now().toString(),
      accountId: accounts[0]?.id || '1',
      description: 'New Transaction',
      amount: 0,
      category: 'other',
      date: new Date(),
      status: 'pending',
      type: 'expense',
      isRecurring: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    setTransactions(prev => [newTransaction, ...prev]);
    // Start editing the description field of the new transaction
    setTimeout(() => startEditing(newTransaction.id, 'description', 'New Transaction'), 100);
  };
  
  // Delete transaction
  const deleteTransaction = (id: string) => {
    if (confirm('Delete this transaction?')) {
      setTransactions(prev => prev.filter(t => t.id !== id));
    }
  };
  
  // Toggle balance visibility
  const toggleBalanceVisibility = (accountId: string) => {
    setBalanceVisibility(prev => ({
      ...prev,
      [accountId]: !prev[accountId]
    }));
  };
  
  // Filter transactions
  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.merchant?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.category.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = categoryFilter === 'all' || transaction.category === categoryFilter;
    const matchesAccount = accountFilter === 'all' || transaction.accountId === accountFilter;
    
    return matchesSearch && matchesCategory && matchesAccount;
  });
  
  // Get category info
  const getCategoryInfo = (category: string, type: TransactionType) => {
    const categories = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
    return categories.find(c => c.value === category) || categories[categories.length - 1];
  };
  
  // Calculate totals
  const totalBalance = accounts.reduce((sum, account) => sum + account.balance, 0);
  const monthlyIncome = transactions
    .filter(t => t.type === 'income' && t.date.getMonth() === new Date().getMonth())
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);
  const monthlyExpenses = transactions
    .filter(t => t.type === 'expense' && t.date.getMonth() === new Date().getMonth())
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);
  const netIncome = monthlyIncome - monthlyExpenses;

  // Quick add transaction
  const quickAddTransaction = (type: TransactionType, amount: number, description: string, category: string) => {
    const newTransaction: Transaction = {
      id: Date.now().toString(),
      accountId: accounts[0]?.id || '1',
      description,
      amount: type === 'expense' ? -Math.abs(amount) : Math.abs(amount),
      category,
      date: new Date(),
      status: 'completed',
      type,
      isRecurring: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    setTransactions(prev => [newTransaction, ...prev]);
  };
  
  // Import from CSV/Excel simulation
  const handleImport = () => {
    // Simulate importing transactions
    const importedTransactions: Transaction[] = [
      {
        id: 'import-1',
        accountId: accounts[0]?.id || '1',
        description: 'Gas Station',
        amount: -45.20,
        category: 'transportation',
        date: new Date('2024-01-13'),
        status: 'completed',
        type: 'expense',
        merchant: 'Shell',
        isRecurring: false,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'import-2',
        accountId: accounts[0]?.id || '1',
        description: 'Coffee Shop',
        amount: -8.50,
        category: 'dining',
        date: new Date('2024-01-13'),
        status: 'completed',
        type: 'expense',
        merchant: 'Starbucks',
        isRecurring: false,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
    
    setTransactions(prev => [...importedTransactions, ...prev]);
    setShowImport(false);
  };

  return (
    <div className="space-y-6">
      {/* Header - Enhanced Mobile */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
              Finance Hub
            </h2>
            <p className="text-gray-600 mt-1 text-sm sm:text-base">Comprehensive financial management</p>
          </div>
          
          <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
            <button
              onClick={() => setShowImport(true)}
              className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Upload size={16} className="mr-2" />
              <span className="hidden sm:inline">Import</span>
            </button>
            <button
              onClick={addNewTransaction}
              className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg font-medium hover:from-green-700 hover:to-blue-700 transition-colors shadow-lg hover:shadow-xl"
            >
              <Plus size={18} className="mr-2" />
              <span className="hidden sm:inline">Add Transaction</span>
              <span className="sm:hidden">Add</span>
            </button>
          </div>
        </div>
        
        {/* Mobile-friendly stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 text-sm">
          <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
            <span>💰</span>
            <div>
              <span className="text-gray-600">Net Worth: </span>
              <span className={`font-semibold ${totalBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ${totalBalance.toLocaleString()}
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
            <span>📈</span>
            <div>
              <span className="text-gray-600">Monthly: </span>
              <span className={`font-semibold ${netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {netIncome >= 0 ? '+' : ''}${netIncome.toLocaleString()}
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
            <span>🏦</span>
            <div>
              <span className="text-gray-600">Accounts: </span>
              <span className="font-semibold text-blue-600">{accounts.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced View Toggle - Mobile Responsive */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 sm:p-6">
        <div className="flex bg-gray-100 rounded-xl p-1 overflow-x-auto scrollbar-hide">
            <button
              onClick={() => setView('overview')}
              className={`flex items-center px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
                view === 'overview' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-700 hover:text-gray-900'
              }`}
            >
              <Home size={14} className="mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Overview</span>
              <span className="sm:hidden">Home</span>
            </button>
            <button
              onClick={() => setView('transactions')}
              className={`flex items-center px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
                view === 'transactions' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-700 hover:text-gray-900'
              }`}
            >
              <Receipt size={14} className="mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Transactions</span>
              <span className="sm:hidden">Txns</span>
            </button>
            <button
              onClick={() => setView('budgets')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                view === 'budgets' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-700 hover:text-gray-900'
              }`}
            >
              <Target size={16} className="inline mr-1" />
              Budgets
            </button>
            <button
              onClick={() => setView('insights')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                view === 'insights' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-700 hover:text-gray-900'
              }`}
            >
              <Brain size={16} className="inline mr-1" />
              Insights
            </button>
            <button
              onClick={() => setView('investments')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                view === 'investments' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-700 hover:text-gray-900'
              }`}
            >
              <TrendingUp size={16} className="inline mr-1" />
              Investments
            </button>
            <button
              onClick={() => setView('goals')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                view === 'goals' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-700 hover:text-gray-900'
              }`}
            >
              <Award size={16} className="inline mr-1" />
              Goals
            </button>
            <button
              onClick={() => setView('subscriptions')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                view === 'subscriptions' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-700 hover:text-gray-900'
              }`}
            >
              <CreditCard size={16} className="inline mr-1" />
              Subscriptions
            </button>
            <button
              onClick={() => setView('debt')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                view === 'debt' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-700 hover:text-gray-900'
              }`}
            >
              <TrendingDown className="inline mr-1" />
              Debt
            </button>
            <button
              onClick={() => setView('networth')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                view === 'networth' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-700 hover:text-gray-900'
              }`}
            >
              <PieChart size={16} className="inline mr-1" />
              Net Worth
            </button>
            <button
              onClick={() => setView('forecast')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                view === 'forecast' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-700 hover:text-gray-900'
              }`}
            >
              <BarChart3 size={16} className="inline mr-1" />
              Forecast
            </button>
            <button
              onClick={() => setView('reports')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                view === 'reports' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-700 hover:text-gray-900'
              }`}
            >
              <FileText size={16} className="inline mr-1" />
              Reports
            </button>
            <button
              onClick={() => setView('taxes')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                view === 'taxes' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-700 hover:text-gray-900'
              }`}
            >
              <Receipt size={16} className="inline mr-1" />
              Taxes
            </button>
            <button
              onClick={() => setView('bills')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                view === 'bills' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-700 hover:text-gray-900'
              }`}
            >
              <Clock size={16} className="inline mr-1" />
              Bills
            </button>
            <button
              onClick={() => setView('calendar')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                view === 'calendar' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-700 hover:text-gray-900'
              }`}
            >
              <Calendar size={16} className="inline mr-1" />
              Calendar
            </button>
            <button
              onClick={() => setView('reconciliation')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                view === 'reconciliation' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-700 hover:text-gray-900'
              }`}
            >
              <CheckCircle size={16} className="inline mr-1" />
              Reconciliation
            </button>
            <button
              onClick={() => setView('credit')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                view === 'credit' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-700 hover:text-gray-900'
              }`}
            >
              <Shield size={16} className="inline mr-1" />
              Credit Score
            </button>
            <button
              onClick={() => setView('portfolio')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                view === 'portfolio' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-700 hover:text-gray-900'
              }`}
            >
              <BarChart3 size={16} className="inline mr-1" />
              Portfolio Analytics
            </button>
            <button
              onClick={() => setView('savings')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                view === 'savings' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-700 hover:text-gray-900'
              }`}
            >
              <PiggyBank size={16} className="inline mr-1" />
              Auto Savings
            </button>
            <button
              onClick={() => setView('health')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                view === 'health' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-700 hover:text-gray-900'
              }`}
            >
              <Heart size={16} className="inline mr-1" />
              Health Score
            </button>
            <button
              onClick={() => setView('linking')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                view === 'linking' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-700 hover:text-gray-900'
              }`}
            >
              <Link size={16} className="inline mr-1" />
              Bank Linking
            </button>
            <button
              onClick={() => setView('realtime')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                view === 'realtime' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-700 hover:text-gray-900'
              }`}
            >
              <Activity size={16} className="inline mr-1" />
              Real-Time
            </button>
            <button
              onClick={() => setView('charts')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                view === 'charts' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-700 hover:text-gray-900'
              }`}
            >
              <BarChart3 size={16} className="inline mr-1" />
              Analytics
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowImport(true)}
              className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Upload size={16} className="mr-2" />
              Import
            </button>
            <button
              onClick={addNewTransaction}
              className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg font-medium hover:from-green-700 hover:to-blue-700 transition-colors shadow-lg hover:shadow-xl"
            >
              <Plus size={18} className="mr-2" />
              Add Transaction
            </button>
          </div>
        </div>

      {view === 'overview' && (
        <>
          {/* Account Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {accounts.map((account) => {
              const isHidden = balanceVisibility[account.id];
              const balance = account.balance;
              const isNegative = balance < 0;
              
              return (
                <div key={account.id} className="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-all duration-300">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg ${
                        account.type === 'checking' ? 'bg-blue-100' :
                        account.type === 'savings' ? 'bg-green-100' :
                        'bg-purple-100'
                      }`}>
                        <Wallet className={`w-5 h-5 ${
                          account.type === 'checking' ? 'text-blue-600' :
                          account.type === 'savings' ? 'text-green-600' :
                          'text-purple-600'
                        }`} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{account.name}</h3>
                        <p className="text-sm text-gray-500">{account.institution}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => toggleBalanceVisibility(account.id)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      {isHidden ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Balance</span>
                      <span className={`text-2xl font-bold ${
                        isHidden ? 'text-gray-400' :
                        isNegative ? 'text-red-600' : 'text-green-600'
                      }`}>
                        {isHidden ? '••••••' : `$${Math.abs(balance).toLocaleString()}`}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Account #</span>
                      <span className="text-gray-600">{account.accountNumber}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Last Synced</span>
                      <span className="text-gray-600">Just now</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Financial Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-800">Monthly Income</p>
                  <p className="text-2xl font-bold text-green-900">${monthlyIncome.toLocaleString()}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-600" />
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-6 border border-red-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-red-800">Monthly Expenses</p>
                  <p className="text-2xl font-bold text-red-900">${monthlyExpenses.toLocaleString()}</p>
                </div>
                <TrendingDown className="w-8 h-8 text-red-600" />
              </div>
            </div>
            
            <div className={`bg-gradient-to-br rounded-xl p-6 border ${
              netIncome >= 0 
                ? 'from-blue-50 to-blue-100 border-blue-200' 
                : 'from-orange-50 to-orange-100 border-orange-200'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm font-medium ${
                    netIncome >= 0 ? 'text-blue-800' : 'text-orange-800'
                  }`}>Net Income</p>
                  <p className={`text-2xl font-bold ${
                    netIncome >= 0 ? 'text-blue-900' : 'text-orange-900'
                  }`}>
                    {netIncome >= 0 ? '+' : ''}${netIncome.toLocaleString()}
                  </p>
                </div>
                <Wallet className={`w-8 h-8 ${
                  netIncome >= 0 ? 'text-blue-600' : 'text-orange-600'
                }`} />
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-800">Total Net Worth</p>
                  <p className="text-2xl font-bold text-purple-900">${totalBalance.toLocaleString()}</p>
                </div>
                <PieChart className="w-8 h-8 text-purple-600" />
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Add Transaction</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <button
                onClick={() => quickAddTransaction('expense', 50, 'Groceries', 'groceries')}
                className="p-4 bg-green-50 hover:bg-green-100 rounded-lg border border-green-200 transition-colors group"
              >
                <ShoppingBag className="w-6 h-6 text-green-600 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                <span className="text-sm font-medium text-green-800">Groceries</span>
              </button>
              <button
                onClick={() => quickAddTransaction('expense', 25, 'Gas', 'transportation')}
                className="p-4 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors group"
              >
                <Car className="w-6 h-6 text-blue-600 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                <span className="text-sm font-medium text-blue-800">Gas</span>
              </button>
              <button
                onClick={() => quickAddTransaction('expense', 15, 'Coffee', 'dining')}
                className="p-4 bg-amber-50 hover:bg-amber-100 rounded-lg border border-amber-200 transition-colors group"
              >
                <Coffee className="w-6 h-6 text-amber-600 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                <span className="text-sm font-medium text-amber-800">Coffee</span>
              </button>
              <button
                onClick={() => quickAddTransaction('income', 100, 'Freelance', 'freelance')}
                className="p-4 bg-purple-50 hover:bg-purple-100 rounded-lg border border-purple-200 transition-colors group"
              >
                <Briefcase className="w-6 h-6 text-purple-600 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                <span className="text-sm font-medium text-purple-800">Income</span>
              </button>
            </div>
          </div>

          {/* Recent Transactions Preview */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Recent Transactions</h3>
                <button
                  onClick={() => setView('transactions')}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center"
                >
                  View All <ArrowUpRight size={16} className="ml-1" />
                </button>
              </div>
            </div>
            
            {filteredTransactions.slice(0, 5).length === 0 ? (
              <div className="p-8 text-center">
                <Receipt className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-gray-900 mb-2">No transactions yet</h4>
                <p className="text-gray-600 mb-4">Start tracking your financial activity</p>
                <button
                  onClick={addNewTransaction}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  <Plus size={18} className="mr-2" />
                  Add First Transaction
                </button>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {filteredTransactions.slice(0, 5).map((transaction) => {
                  const categoryInfo = getCategoryInfo(transaction.category, transaction.type);
                  const Icon = categoryInfo.icon;
                  const account = accounts.find(a => a.id === transaction.accountId);
                  
                  return (
                    <div key={transaction.id} className="p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div 
                            className="p-2 rounded-lg"
                            style={{ backgroundColor: `${categoryInfo.color}20` }}
                          >
                            <Icon size={18} style={{ color: categoryInfo.color }} />
                          </div>
                          <div>
                            <h4 className="text-lg font-semibold text-gray-900">{transaction.description}</h4>
                            <div className="flex items-center text-base text-gray-600 space-x-2 mt-1">
                              <span className="font-medium">{categoryInfo.label}</span>
                              <span>•</span>
                              <span>{account?.name}</span>
                              <span>•</span>
                              <span className="font-medium">{transaction.date.toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`text-xl font-bold ${
                            transaction.amount >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {transaction.amount >= 0 ? '+' : ''}${Math.abs(transaction.amount).toLocaleString()}
                          </div>
                          <div className="text-sm text-gray-500 mt-1 font-medium">
                            {transaction.status === 'pending' ? 'Pending' : 'Completed'}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}

      {view === 'transactions' && (
        <div className="space-y-6">
          {/* Search and Filters */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex-1 max-w-md">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="text"
                    placeholder="Search transactions..."
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
                  {[...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES].map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
                
                <select
                  value={accountFilter}
                  onChange={(e) => setAccountFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Accounts</option>
                  {accounts.map(account => (
                    <option key={account.id} value={account.id}>{account.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Excel-like Transaction Table */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Transaction History</h3>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-500">{filteredTransactions.length} transactions</span>
                  <button
                    onClick={addNewTransaction}
                    className="inline-flex items-center px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
                  >
                    <Plus size={14} className="mr-1" />
                    Add Row
                  </button>
                </div>
              </div>
            </div>
            
            {filteredTransactions.length === 0 ? (
              <div className="p-12 text-center">
                <Receipt className="w-20 h-20 text-gray-300 mx-auto mb-4" />
                <h4 className="text-xl font-medium text-gray-900 mb-2">No transactions found</h4>
                <p className="text-gray-600 mb-6">Start by adding your first transaction or adjust your filters</p>
                <button
                  onClick={addNewTransaction}
                  className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  <Plus size={20} className="mr-2" />
                  Add First Transaction
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Account</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredTransactions
                      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                      .map((transaction) => {
                        const categoryInfo = getCategoryInfo(transaction.category, transaction.type);
                        const Icon = categoryInfo.icon;
                        const account = accounts.find(a => a.id === transaction.accountId);
                        const isEditing = editingCell?.id === transaction.id;
                        
                        return (
                          <tr key={transaction.id} className="hover:bg-gray-50 transition-colors">
                            {/* Date */}
                            <td className="px-6 py-4 whitespace-nowrap">
                              {isEditing && editingCell.field === 'date' ? (
                                <input
                                  ref={editInputRef}
                                  type="date"
                                  value={editValue}
                                  onChange={(e) => setEditValue(e.target.value)}
                                  onBlur={saveEdit}
                                  onKeyDown={handleKeyPress}
                                  className="w-full px-2 py-1 border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                              ) : (
                                <button
                                  onClick={() => startEditing(transaction.id, 'date', transaction.date.toISOString().split('T')[0])}
                                  className="text-sm text-gray-900 hover:bg-gray-100 px-2 py-1 rounded w-full text-left"
                                >
                                  {transaction.date.toLocaleDateString()}
                                </button>
                              )}
                            </td>
                            
                            {/* Description */}
                            <td className="px-6 py-4">
                              <div className="flex items-center space-x-3">
                                <div 
                                  className="p-1.5 rounded-lg flex-shrink-0"
                                  style={{ backgroundColor: `${categoryInfo.color}20` }}
                                >
                                  <Icon size={16} style={{ color: categoryInfo.color }} />
                                </div>
                                {isEditing && editingCell.field === 'description' ? (
                                  <input
                                    ref={editInputRef}
                                    type="text"
                                    value={editValue}
                                    onChange={(e) => setEditValue(e.target.value)}
                                    onBlur={saveEdit}
                                    onKeyDown={handleKeyPress}
                                    className="flex-1 px-2 py-1 border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  />
                                ) : (
                                  <button
                                    onClick={() => startEditing(transaction.id, 'description', transaction.description)}
                                    className="text-sm text-gray-900 hover:bg-gray-100 px-2 py-1 rounded flex-1 text-left"
                                  >
                                    {transaction.description}
                                  </button>
                                )}
                              </div>
                            </td>
                            
                            {/* Category */}
                            <td className="px-6 py-4 whitespace-nowrap">
                              {isEditing && editingCell.field === 'category' ? (
                                <select
                                  ref={editInputRef as any}
                                  value={editValue}
                                  onChange={(e) => setEditValue(e.target.value)}
                                  onBlur={saveEdit}
                                  onKeyDown={handleKeyPress}
                                  className="w-full px-2 py-1 border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                  {(transaction.type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES).map(cat => (
                                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                                  ))}
                                </select>
                              ) : (
                                <button
                                  onClick={() => startEditing(transaction.id, 'category', transaction.category)}
                                  className="text-sm text-gray-600 hover:bg-gray-100 px-2 py-1 rounded"
                                >
                                  {categoryInfo.label}
                                </button>
                              )}
                            </td>
                            
                            {/* Account */}
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="text-sm text-gray-600">{account?.name}</span>
                            </td>
                            
                            {/* Amount */}
                            <td className="px-6 py-4 whitespace-nowrap text-right">
                              {isEditing && editingCell.field === 'amount' ? (
                                <input
                                  ref={editInputRef}
                                  type="number"
                                  step="0.01"
                                  value={editValue}
                                  onChange={(e) => setEditValue(e.target.value)}
                                  onBlur={saveEdit}
                                  onKeyDown={handleKeyPress}
                                  className="w-24 px-2 py-1 border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-right"
                                />
                              ) : (
                                <button
                                  onClick={() => startEditing(transaction.id, 'amount', Math.abs(transaction.amount))}
                                  className={`text-sm font-semibold hover:bg-gray-100 px-2 py-1 rounded ${
                                    transaction.amount >= 0 ? 'text-green-600' : 'text-red-600'
                                  }`}
                                >
                                  {transaction.amount >= 0 ? '+' : ''}${Math.abs(transaction.amount).toLocaleString()}
                                </button>
                              )}
                            </td>
                            
                            {/* Status */}
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                transaction.status === 'completed' ? 'bg-green-100 text-green-800' :
                                transaction.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {transaction.status}
                              </span>
                            </td>
                            
                            {/* Actions */}
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                              <div className="flex items-center justify-center space-x-1">
                                <button
                                  onClick={() => deleteTransaction(transaction.id)}
                                  className="p-1 text-gray-400 hover:text-red-600 rounded transition-colors"
                                  title="Delete transaction"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {view === 'budgets' && <BudgetManager />}
      
      {view === 'insights' && <FinancialInsights />}
      
      {view === 'investments' && <InvestmentTracker />}
      
      {view === 'goals' && <FinancialGoals />}
      
      {view === 'subscriptions' && <SubscriptionTracker />}
      
      {view === 'debt' && <DebtPayoffCalculator />}
      
      {view === 'networth' && <NetWorthTracker />}
      
      {view === 'forecast' && <CashFlowForecasting />}
      
      {view === 'reports' && <ReportsAnalytics />}
      
      {view === 'taxes' && <TaxDocumentManager />}
      
      {view === 'bills' && <BillPaymentSystem />}
      
      {view === 'calendar' && <FinancialCalendar />}
      
      {view === 'reconciliation' && <AccountReconciliation />}
      
      {view === 'credit' && <CreditScoreMonitoring />}
      
      {view === 'portfolio' && <AdvancedPortfolioAnalytics />}
      
      {view === 'savings' && <AutomatedSavings />}
      
      {view === 'health' && <FinancialHealthScore />}
      
      {view === 'linking' && <BankAccountLinking />}
      
      {view === 'realtime' && <RealTimeFinancialDashboard />}
      
      {view === 'charts' && <AdvancedFinancialCharts />}

      {/* Import Modal */}
      {showImport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Import Transactions</h3>
              <button
                onClick={() => setShowImport(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6">
              <div className="text-center py-8">
                <Upload className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-gray-900 mb-2">CSV/Excel Import</h4>
                <p className="text-gray-600 mb-6">Upload your bank statements or transaction files</p>
                
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-gray-400 transition-colors cursor-pointer">
                    <FileText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">Drag & drop files here or click to browse</p>
                  </div>
                  
                  <button
                    onClick={handleImport}
                    className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                  >
                    Import Sample Data
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}