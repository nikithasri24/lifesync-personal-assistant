import React, { useState } from 'react';
import {
  CheckCircle,
  AlertTriangle,
  DollarSign,
  Calendar,
  Upload,
  Download,
  RefreshCw,
  Search,
  Filter,
  Eye,
  EyeOff,
  Plus,
  Minus,
  X,
  Check,
  AlertCircle,
  FileText,
  CreditCard,
  Building,
  Target,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Save,
  Edit
} from 'lucide-react';

interface ReconciliationTransaction {
  id: string;
  date: Date;
  description: string;
  amount: number;
  type: 'debit' | 'credit';
  category: string;
  source: 'manual' | 'bank_import' | 'auto_categorized';
  isMatched: boolean;
  matchedTransactionId?: string;
  status: 'pending' | 'reconciled' | 'discrepancy' | 'ignored';
  bankReference?: string;
  notes?: string;
}

interface BankStatement {
  id: string;
  accountId: string;
  accountName: string;
  statementDate: Date;
  startingBalance: number;
  endingBalance: number;
  totalDebits: number;
  totalCredits: number;
  transactionCount: number;
  isReconciled: boolean;
  reconciliationDate?: Date;
  discrepancies: number;
}

interface ReconciliationSummary {
  accountId: string;
  ourBalance: number;
  bankBalance: number;
  difference: number;
  matchedTransactions: number;
  unmatchedTransactions: number;
  totalTransactions: number;
  reconciliationStatus: 'balanced' | 'out_of_balance' | 'in_progress';
  lastReconciled?: Date;
}

const MOCK_BANK_STATEMENTS: BankStatement[] = [
  {
    id: '1',
    accountId: 'acc1',
    accountName: 'Chase Checking',
    statementDate: new Date('2024-01-31'),
    startingBalance: 4850.25,
    endingBalance: 5420.50,
    totalDebits: 2890.45,
    totalCredits: 3460.70,
    transactionCount: 47,
    isReconciled: false,
    discrepancies: 2
  },
  {
    id: '2',
    accountId: 'acc2',
    accountName: 'Discover Savings',
    statementDate: new Date('2024-01-31'),
    startingBalance: 12250.00,
    endingBalance: 12500.00,
    totalDebits: 0.00,
    totalCredits: 250.00,
    transactionCount: 3,
    isReconciled: true,
    reconciliationDate: new Date('2024-02-01'),
    discrepancies: 0
  },
  {
    id: '3',
    accountId: 'acc3',
    accountName: 'Capital One Credit',
    statementDate: new Date('2024-01-31'),
    startingBalance: -2100.25,
    endingBalance: -1850.75,
    totalDebits: 1450.30,
    totalCredits: 1701.80,
    transactionCount: 23,
    isReconciled: false,
    discrepancies: 1
  }
];

const MOCK_TRANSACTIONS: ReconciliationTransaction[] = [
  {
    id: '1',
    date: new Date('2024-01-30'),
    description: 'Whole Foods Market',
    amount: -87.45,
    type: 'debit',
    category: 'groceries',
    source: 'bank_import',
    isMatched: true,
    matchedTransactionId: 'app_1',
    status: 'reconciled',
    bankReference: 'TXN-2024-001234'
  },
  {
    id: '2',
    date: new Date('2024-01-29'),
    description: 'Monthly Salary Deposit',
    amount: 5500.00,
    type: 'credit',
    category: 'salary',
    source: 'bank_import',
    isMatched: true,
    matchedTransactionId: 'app_2',
    status: 'reconciled',
    bankReference: 'DD-2024-005678'
  },
  {
    id: '3',
    date: new Date('2024-01-28'),
    description: 'Amazon Purchase',
    amount: -156.20,
    type: 'debit',
    category: 'shopping',
    source: 'bank_import',
    isMatched: false,
    status: 'pending',
    bankReference: 'TXN-2024-001235'
  },
  {
    id: '4',
    date: new Date('2024-01-27'),
    description: 'Gas Station Fill-Up',
    amount: -45.30,
    type: 'debit',
    category: 'transportation',
    source: 'manual',
    isMatched: false,
    status: 'discrepancy',
    notes: 'Amount differs from bank statement by $2.30'
  },
  {
    id: '5',
    date: new Date('2024-01-26'),
    description: 'Coffee Shop',
    amount: -8.75,
    type: 'debit',
    category: 'dining',
    source: 'bank_import',
    isMatched: true,
    matchedTransactionId: 'app_5',
    status: 'reconciled',
    bankReference: 'TXN-2024-001236'
  },
  {
    id: '6',
    date: new Date('2024-01-25'),
    description: 'Electric Bill Payment',
    amount: -125.00,
    type: 'debit',
    category: 'utilities',
    source: 'auto_categorized',
    isMatched: false,
    status: 'pending',
    bankReference: 'ACH-2024-007890'
  }
];

const RECONCILIATION_SUMMARY: ReconciliationSummary = {
  accountId: 'acc1',
  ourBalance: 5420.50,
  bankBalance: 5418.20,
  difference: 2.30,
  matchedTransactions: 35,
  unmatchedTransactions: 12,
  totalTransactions: 47,
  reconciliationStatus: 'out_of_balance',
  lastReconciled: new Date('2023-12-31')
};

export default function AccountReconciliation() {
  const [statements] = useState<BankStatement[]>(MOCK_BANK_STATEMENTS);
  const [transactions, setTransactions] = useState<ReconciliationTransaction[]>(MOCK_TRANSACTIONS);
  const [summary] = useState<ReconciliationSummary>(RECONCILIATION_SUMMARY);
  const [selectedAccount, setSelectedAccount] = useState<string>('acc1');
  const [showValues, setShowValues] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [reconciliationMode, setReconciliationMode] = useState<boolean>(false);

  const formatValue = (value: number) => {
    if (!showValues) return '•••••';
    const sign = value >= 0 ? '' : '-';
    return `${sign}$${Math.abs(value).toLocaleString()}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'reconciled': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'discrepancy': return 'bg-red-100 text-red-800';
      case 'ignored': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'bank_import': return <Building size={16} className="text-blue-600" />;
      case 'manual': return <Edit size={16} className="text-purple-600" />;
      case 'auto_categorized': return <RefreshCw size={16} className="text-green-600" />;
      default: return <FileText size={16} className="text-gray-600" />;
    }
  };

  const selectedStatement = statements.find(s => s.accountId === selectedAccount);
  
  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.bankReference?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || transaction.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const markAsReconciled = (transactionId: string) => {
    setTransactions(transactions.map(t => 
      t.id === transactionId ? { ...t, status: 'reconciled', isMatched: true } : t
    ));
  };

  const markAsDiscrepancy = (transactionId: string, notes: string) => {
    setTransactions(transactions.map(t => 
      t.id === transactionId ? { ...t, status: 'discrepancy', notes } : t
    ));
  };

  const markAsIgnored = (transactionId: string) => {
    setTransactions(transactions.map(t => 
      t.id === transactionId ? { ...t, status: 'ignored' } : t
    ));
  };

  const getReconciliationStats = () => {
    const pending = transactions.filter(t => t.status === 'pending').length;
    const reconciled = transactions.filter(t => t.status === 'reconciled').length;
    const discrepancies = transactions.filter(t => t.status === 'discrepancy').length;
    const ignored = transactions.filter(t => t.status === 'ignored').length;
    
    return { pending, reconciled, discrepancies, ignored };
  };

  const stats = getReconciliationStats();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-2xl font-bold text-gray-900 flex items-center">
            <CheckCircle className="w-8 h-8 mr-3 text-green-600" />
            Account Reconciliation
          </h3>
          <p className="text-gray-600">Match your records with bank statements</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowValues(!showValues)}
            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            {showValues ? <EyeOff size={16} /> : <Eye size={16} />}
            <span className="ml-2">{showValues ? 'Hide' : 'Show'} Values</span>
          </button>
          
          <button
            onClick={() => setShowUploadModal(true)}
            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Upload size={16} className="mr-2" />
            Import Statement
          </button>
          
          <button className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
            <Download size={16} className="mr-2" />
            Export Report
          </button>
          
          <button
            onClick={() => setReconciliationMode(!reconciliationMode)}
            className={`inline-flex items-center px-4 py-2 rounded-lg font-medium transition-colors ${
              reconciliationMode 
                ? 'bg-red-600 text-white hover:bg-red-700' 
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            {reconciliationMode ? (
              <>
                <X size={18} className="mr-2" />
                Exit Reconciliation
              </>
            ) : (
              <>
                <RefreshCw size={18} className="mr-2" />
                Start Reconciliation
              </>
            )}
          </button>
        </div>
      </div>

      {/* Account Selection & Summary */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Account Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Account
            </label>
            <select
              value={selectedAccount}
              onChange={(e) => setSelectedAccount(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              {statements.map(statement => (
                <option key={statement.id} value={statement.accountId}>
                  {statement.accountName}
                </option>
              ))}
            </select>
            
            {selectedStatement && (
              <div className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Statement Date:</span>
                  <span className="font-medium">{selectedStatement.statementDate.toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Transactions:</span>
                  <span className="font-medium">{selectedStatement.transactionCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    selectedStatement.isReconciled 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {selectedStatement.isReconciled ? 'Reconciled' : 'Pending'}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Balance Comparison */}
          <div>
            <h5 className="font-medium text-gray-900 mb-4">Balance Comparison</h5>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                <span className="text-sm text-blue-800">Our Records:</span>
                <span className="font-bold text-blue-900">{formatValue(summary.ourBalance)}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                <span className="text-sm text-purple-800">Bank Statement:</span>
                <span className="font-bold text-purple-900">{formatValue(summary.bankBalance)}</span>
              </div>
              <div className={`flex justify-between items-center p-3 rounded-lg ${
                Math.abs(summary.difference) < 0.01 
                  ? 'bg-green-50' 
                  : 'bg-red-50'
              }`}>
                <span className={`text-sm ${
                  Math.abs(summary.difference) < 0.01 
                    ? 'text-green-800' 
                    : 'text-red-800'
                }`}>
                  Difference:
                </span>
                <span className={`font-bold ${
                  Math.abs(summary.difference) < 0.01 
                    ? 'text-green-900' 
                    : 'text-red-900'
                }`}>
                  {formatValue(Math.abs(summary.difference))}
                </span>
              </div>
            </div>
          </div>

          {/* Reconciliation Status */}
          <div>
            <h5 className="font-medium text-gray-900 mb-4">Reconciliation Status</h5>
            <div className="grid grid-cols-2 gap-3">
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-lg font-bold text-green-600">{stats.reconciled}</div>
                <div className="text-xs text-green-700">Reconciled</div>
              </div>
              <div className="text-center p-3 bg-yellow-50 rounded-lg">
                <div className="text-lg font-bold text-yellow-600">{stats.pending}</div>
                <div className="text-xs text-yellow-700">Pending</div>
              </div>
              <div className="text-center p-3 bg-red-50 rounded-lg">
                <div className="text-lg font-bold text-red-600">{stats.discrepancies}</div>
                <div className="text-xs text-red-700">Discrepancies</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-lg font-bold text-gray-600">{stats.ignored}</div>
                <div className="text-xs text-gray-700">Ignored</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      {reconciliationMode && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
          <div className="flex items-start space-x-3">
            <Target className="w-6 h-6 text-blue-600 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-semibold text-blue-800 mb-2">Reconciliation Mode Active</h4>
              <p className="text-blue-700 mb-4">
                Review each transaction below and match it with your bank statement. 
                Mark items as reconciled, flag discrepancies, or ignore duplicate entries.
              </p>
              <div className="flex space-x-4">
                <button className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors">
                  Auto-Match Similar
                </button>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
                  Mark All Reviewed
                </button>
                <button className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors">
                  Generate Report
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters and Search */}
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
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="reconciled">Reconciled</option>
              <option value="discrepancy">Discrepancies</option>
              <option value="ignored">Ignored</option>
            </select>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h4 className="text-lg font-semibold text-gray-900">Transactions for Reconciliation</h4>
            <div className="text-sm text-gray-500">
              {filteredTransactions.length} of {transactions.length} transactions
            </div>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Source</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bank Reference</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTransactions.map((transaction) => (
                <tr key={transaction.id} className={`hover:bg-gray-50 transition-colors ${
                  transaction.status === 'discrepancy' ? 'bg-red-50' : 
                  transaction.status === 'reconciled' ? 'bg-green-50' : ''
                }`}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {transaction.date.toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-lg font-medium text-gray-900">{transaction.description}</div>
                      <div className="text-sm text-gray-500">{transaction.category}</div>
                      {transaction.notes && (
                        <div className="text-sm text-orange-600 mt-1">
                          <AlertTriangle size={14} className="inline mr-1" />
                          {transaction.notes}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className={`text-lg font-bold ${
                      transaction.amount >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {transaction.amount >= 0 ? '+' : ''}{formatValue(transaction.amount)}
                    </div>
                    <div className="text-sm text-gray-500">
                      {transaction.type === 'credit' ? 'Credit' : 'Debit'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <div className="flex items-center justify-center">
                      {getSourceIcon(transaction.source)}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {transaction.source.replace('_', ' ')}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(transaction.status)}`}>
                      {transaction.status}
                    </span>
                    {transaction.isMatched && (
                      <div className="text-xs text-green-600 mt-1">
                        <Check size={12} className="inline mr-1" />
                        Matched
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {transaction.bankReference || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    {reconciliationMode && transaction.status !== 'reconciled' && (
                      <div className="flex items-center justify-center space-x-1">
                        <button
                          onClick={() => markAsReconciled(transaction.id)}
                          className="p-1 text-green-600 hover:bg-green-50 rounded transition-colors"
                          title="Mark as Reconciled"
                        >
                          <CheckCircle size={16} />
                        </button>
                        <button
                          onClick={() => markAsDiscrepancy(transaction.id, 'Amount discrepancy noted')}
                          className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Mark as Discrepancy"
                        >
                          <AlertTriangle size={16} />
                        </button>
                        <button
                          onClick={() => markAsIgnored(transaction.id)}
                          className="p-1 text-gray-600 hover:bg-gray-50 rounded transition-colors"
                          title="Ignore Transaction"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Upload Statement Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Import Bank Statement</h3>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6">
              <div className="text-center py-8">
                <Upload className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-gray-900 mb-2">Upload Statement File</h4>
                <p className="text-gray-600 mb-6">Upload CSV, OFX, QFX, or PDF bank statements</p>
                
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-gray-400 transition-colors cursor-pointer">
                    <FileText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">Drag & drop files here or click to browse</p>
                    <p className="text-xs text-gray-500 mt-1">CSV, OFX, QFX, PDF up to 10MB</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Account
                    </label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500">
                      <option value="acc1">Chase Checking</option>
                      <option value="acc2">Discover Savings</option>
                      <option value="acc3">Capital One Credit</option>
                    </select>
                  </div>
                  
                  <button className="w-full py-2 px-4 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors">
                    Import Statement
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