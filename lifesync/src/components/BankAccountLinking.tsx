import { useState } from 'react';
import {
  Building,
  Shield,
  CheckCircle,
  AlertTriangle,
  Clock,
  Eye,
  EyeOff,
  RefreshCw,
  Unlink,
  Link,
  Search,
  Plus,
  Settings,
  Download,
  Upload,
  Info,
  Lock,
  Unlock,
  User,
  CreditCard,
  DollarSign,
  Calendar,
  BarChart3,
  Zap,
  Bell,
  X,
  ArrowRight,
  Wifi,
  WifiOff,
  Star,
  MapPin,
  Phone,
  Globe,
  Key
} from 'lucide-react';

interface BankConnection {
  id: string;
  bankName: string;
  bankLogo: string;
  status: 'connected' | 'needs_reauth' | 'error' | 'connecting';
  lastSync: Date;
  accountsFound: number;
  connectionMethod: 'plaid' | 'yodlee' | 'mx' | 'manual';
  institutionId: string;
  isTestMode: boolean;
  errorMessage?: string;
  lastTransactionSync?: Date;
  nextSync?: Date;
}

interface ConnectedAccount {
  id: string;
  connectionId: string;
  accountName: string;
  accountType: 'checking' | 'savings' | 'credit' | 'investment' | 'loan' | 'mortgage';
  accountNumber: string;
  routingNumber?: string;
  balance: number;
  availableBalance?: number;
  isActive: boolean;
  isHidden: boolean;
  lastUpdated: Date;
  transactionCount: number;
  institution: string;
  currency: 'USD' | 'EUR' | 'GBP' | 'CAD';
}

interface BankInstitution {
  id: string;
  name: string;
  logo: string;
  domain: string;
  mfa: boolean;
  oauth: boolean;
  products: string[];
  healthScore: number;
  primaryColor: string;
  isPopular: boolean;
  hasIssues: boolean;
  avgConnectionTime: number;
  supportedFeatures: string[];
}

interface ConnectionStep {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'error';
  estimatedTime?: string;
}

const MOCK_BANKS: BankInstitution[] = [
  {
    id: 'chase',
    name: 'Chase Bank',
    logo: '🏦',
    domain: 'chase.com',
    mfa: true,
    oauth: true,
    products: ['checking', 'savings', 'credit', 'investment'],
    healthScore: 98,
    primaryColor: '#005CB9',
    isPopular: true,
    hasIssues: false,
    avgConnectionTime: 45,
    supportedFeatures: ['real-time-balance', 'transaction-history', 'account-details']
  },
  {
    id: 'bankofamerica',
    name: 'Bank of America',
    logo: '🏛️',
    domain: 'bankofamerica.com',
    mfa: true,
    oauth: true,
    products: ['checking', 'savings', 'credit', 'investment', 'mortgage'],
    healthScore: 95,
    primaryColor: '#E31837',
    isPopular: true,
    hasIssues: false,
    avgConnectionTime: 60,
    supportedFeatures: ['real-time-balance', 'transaction-history', 'account-details', 'investments']
  },
  {
    id: 'wells_fargo',
    name: 'Wells Fargo',
    logo: '🏪',
    domain: 'wellsfargo.com',
    mfa: true,
    oauth: false,
    products: ['checking', 'savings', 'credit', 'loan', 'mortgage'],
    healthScore: 92,
    primaryColor: '#D71921',
    isPopular: true,
    hasIssues: false,
    avgConnectionTime: 75,
    supportedFeatures: ['real-time-balance', 'transaction-history', 'account-details']
  },
  {
    id: 'citibank',
    name: 'Citibank',
    logo: '🏢',
    domain: 'citibank.com',
    mfa: true,
    oauth: true,
    products: ['checking', 'savings', 'credit', 'investment'],
    healthScore: 90,
    primaryColor: '#056EAE',
    isPopular: true,
    hasIssues: false,
    avgConnectionTime: 50,
    supportedFeatures: ['real-time-balance', 'transaction-history', 'account-details', 'investments']
  },
  {
    id: 'capital_one',
    name: 'Capital One',
    logo: '💳',
    domain: 'capitalone.com',
    mfa: true,
    oauth: true,
    products: ['checking', 'savings', 'credit'],
    healthScore: 96,
    primaryColor: '#004B87',
    isPopular: true,
    hasIssues: false,
    avgConnectionTime: 35,
    supportedFeatures: ['real-time-balance', 'transaction-history', 'account-details']
  },
  {
    id: 'discover',
    name: 'Discover Bank',
    logo: '🔍',
    domain: 'discover.com',
    mfa: true,
    oauth: true,
    products: ['savings', 'credit'],
    healthScore: 94,
    primaryColor: '#FF6000',
    isPopular: false,
    hasIssues: false,
    avgConnectionTime: 40,
    supportedFeatures: ['real-time-balance', 'transaction-history', 'account-details']
  },
  {
    id: 'amex',
    name: 'American Express',
    logo: '💎',
    domain: 'americanexpress.com',
    mfa: true,
    oauth: true,
    products: ['credit', 'savings', 'investment'],
    healthScore: 97,
    primaryColor: '#006FCF',
    isPopular: true,
    hasIssues: false,
    avgConnectionTime: 30,
    supportedFeatures: ['real-time-balance', 'transaction-history', 'account-details', 'rewards']
  },
  {
    id: 'schwab',
    name: 'Charles Schwab',
    logo: '📈',
    domain: 'schwab.com',
    mfa: true,
    oauth: true,
    products: ['investment', 'checking', 'savings'],
    healthScore: 98,
    primaryColor: '#00A3E0',
    isPopular: false,
    hasIssues: false,
    avgConnectionTime: 55,
    supportedFeatures: ['real-time-balance', 'transaction-history', 'account-details', 'investments']
  }
];

const MOCK_CONNECTIONS: BankConnection[] = [
  {
    id: 'conn_1',
    bankName: 'Chase Bank',
    bankLogo: '🏦',
    status: 'connected',
    lastSync: new Date('2024-01-22T10:30:00'),
    accountsFound: 3,
    connectionMethod: 'plaid',
    institutionId: 'chase',
    isTestMode: false,
    lastTransactionSync: new Date('2024-01-22T10:30:00'),
    nextSync: new Date('2024-01-22T14:30:00')
  },
  {
    id: 'conn_2',
    bankName: 'Capital One',
    bankLogo: '💳',
    status: 'needs_reauth',
    lastSync: new Date('2024-01-20T08:15:00'),
    accountsFound: 2,
    connectionMethod: 'plaid',
    institutionId: 'capital_one',
    isTestMode: false,
    errorMessage: 'Please re-authenticate your account. Your login credentials may have changed.'
  },
  {
    id: 'conn_3',
    bankName: 'Discover Bank',
    bankLogo: '🔍',
    status: 'error',
    lastSync: new Date('2024-01-19T16:45:00'),
    accountsFound: 1,
    connectionMethod: 'plaid',
    institutionId: 'discover',
    isTestMode: false,
    errorMessage: 'Connection failed. The bank may be undergoing maintenance.'
  }
];

const MOCK_ACCOUNTS: ConnectedAccount[] = [
  {
    id: 'acc_1',
    connectionId: 'conn_1',
    accountName: 'Chase Total Checking',
    accountType: 'checking',
    accountNumber: '****1234',
    routingNumber: '021000021',
    balance: 5420.50,
    availableBalance: 5420.50,
    isActive: true,
    isHidden: false,
    lastUpdated: new Date('2024-01-22T10:30:00'),
    transactionCount: 156,
    institution: 'Chase Bank',
    currency: 'USD'
  },
  {
    id: 'acc_2',
    connectionId: 'conn_1',
    accountName: 'Chase Savings',
    accountType: 'savings',
    accountNumber: '****5678',
    balance: 12500.00,
    isActive: true,
    isHidden: false,
    lastUpdated: new Date('2024-01-22T10:30:00'),
    transactionCount: 45,
    institution: 'Chase Bank',
    currency: 'USD'
  },
  {
    id: 'acc_3',
    connectionId: 'conn_1',
    accountName: 'Chase Freedom',
    accountType: 'credit',
    accountNumber: '****9012',
    balance: -1850.75,
    availableBalance: 6149.25,
    isActive: true,
    isHidden: false,
    lastUpdated: new Date('2024-01-22T10:30:00'),
    transactionCount: 89,
    institution: 'Chase Bank',
    currency: 'USD'
  },
  {
    id: 'acc_4',
    connectionId: 'conn_2',
    accountName: 'Capital One 360',
    accountType: 'savings',
    accountNumber: '****3456',
    balance: 8750.00,
    isActive: false,
    isHidden: false,
    lastUpdated: new Date('2024-01-20T08:15:00'),
    transactionCount: 67,
    institution: 'Capital One',
    currency: 'USD'
  }
];

export default function BankAccountLinking() {
  const [connections, setConnections] = useState<BankConnection[]>(MOCK_CONNECTIONS);
  const [accounts, setAccounts] = useState<ConnectedAccount[]>(MOCK_ACCOUNTS);
  const [showAddBank, setShowAddBank] = useState(false);
  const [showBankList, setShowBankList] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBank, setSelectedBank] = useState<BankInstitution | null>(null);
  const [connectionSteps, setConnectionSteps] = useState<ConnectionStep[]>([]);
  const [isConnecting, setIsConnecting] = useState(false);
  const [viewMode, setViewMode] = useState<'overview' | 'connections' | 'accounts' | 'security'>('overview');
  const [showValues, setShowValues] = useState(true);
  const [credentials, setCredentials] = useState({ username: '', password: '' });

  const filteredBanks = MOCK_BANKS.filter(bank =>
    bank.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    bank.domain.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'bg-green-100 text-green-800 border-green-200';
      case 'needs_reauth': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'error': return 'bg-red-100 text-red-800 border-red-200';
      case 'connecting': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected': return CheckCircle;
      case 'needs_reauth': return AlertTriangle;
      case 'error': return X;
      case 'connecting': return Clock;
      default: return Clock;
    }
  };

  const getAccountTypeIcon = (type: string) => {
    switch (type) {
      case 'checking': return DollarSign;
      case 'savings': return Building;
      case 'credit': return CreditCard;
      case 'investment': return BarChart3;
      case 'loan': return Receipt;
      case 'mortgage': return Home;
      default: return DollarSign;
    }
  };

  const startConnection = (bank: BankInstitution) => {
    setSelectedBank(bank);
    setIsConnecting(true);
    setConnectionSteps([
      {
        id: 'verify',
        title: 'Verify Institution',
        description: 'Confirming bank details and security protocols',
        status: 'completed'
      },
      {
        id: 'authenticate',
        title: 'Authenticate',
        description: 'Securely connect to your bank account',
        status: 'in_progress'
      },
      {
        id: 'discover',
        title: 'Discover Accounts',
        description: 'Finding all your accounts at this institution',
        status: 'pending'
      },
      {
        id: 'sync',
        title: 'Initial Sync',
        description: 'Downloading recent transactions and balances',
        status: 'pending'
      }
    ]);

    // Simulate connection process
    setTimeout(() => {
      setConnectionSteps(steps => steps.map(step => 
        step.id === 'authenticate' ? { ...step, status: 'completed' } :
        step.id === 'discover' ? { ...step, status: 'in_progress' } : step
      ));
    }, 2000);

    setTimeout(() => {
      setConnectionSteps(steps => steps.map(step => 
        step.id === 'discover' ? { ...step, status: 'completed' } :
        step.id === 'sync' ? { ...step, status: 'in_progress' } : step
      ));
    }, 4000);

    setTimeout(() => {
      setConnectionSteps(steps => steps.map(step => 
        step.id === 'sync' ? { ...step, status: 'completed' } : step
      ));
      
      // Add new connection
      const newConnection: BankConnection = {
        id: `conn_${Date.now()}`,
        bankName: bank.name,
        bankLogo: bank.logo,
        status: 'connected',
        lastSync: new Date(),
        accountsFound: Math.floor(Math.random() * 3) + 1,
        connectionMethod: 'plaid',
        institutionId: bank.id,
        isTestMode: true,
        lastTransactionSync: new Date(),
        nextSync: new Date(Date.now() + 4 * 60 * 60 * 1000)
      };
      
      setConnections(prev => [...prev, newConnection]);
      setIsConnecting(false);
      setShowAddBank(false);
      setSelectedBank(null);
      setCredentials({ username: '', password: '' });
    }, 6000);
  };

  const disconnectBank = (connectionId: string) => {
    if (confirm('Are you sure you want to disconnect this bank? This will remove all associated accounts and transaction data.')) {
      setConnections(prev => prev.filter(conn => conn.id !== connectionId));
      setAccounts(prev => prev.filter(acc => acc.connectionId !== connectionId));
    }
  };

  const refreshConnection = (connectionId: string) => {
    setConnections(prev => prev.map(conn => 
      conn.id === connectionId 
        ? { ...conn, status: 'connecting', lastSync: new Date() }
        : conn
    ));

    setTimeout(() => {
      setConnections(prev => prev.map(conn => 
        conn.id === connectionId 
          ? { ...conn, status: 'connected', lastSync: new Date() }
          : conn
      ));
    }, 3000);
  };

  const toggleAccountVisibility = (accountId: string) => {
    setAccounts(prev => prev.map(acc => 
      acc.id === accountId ? { ...acc, isHidden: !acc.isHidden } : acc
    ));
  };

  const formatValue = (value: number) => {
    if (!showValues) return '•••••';
    return `$${Math.abs(value).toLocaleString()}`;
  };

  const connectedCount = connections.filter(c => c.status === 'connected').length;
  const totalAccounts = accounts.length;
  const needsAttention = connections.filter(c => c.status === 'needs_reauth' || c.status === 'error').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-2xl font-bold text-gray-900 flex items-center">
            <Link className="w-8 h-8 mr-3 text-blue-600" />
            Bank Account Linking
          </h3>
          <p className="text-gray-600">Securely connect and manage your financial accounts</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowValues(!showValues)}
            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            {showValues ? <EyeOff size={16} /> : <Eye size={16} />}
            <span className="ml-2">{showValues ? 'Hide' : 'Show'} Balances</span>
          </button>
          
          <button className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
            <Download size={16} className="mr-2" />
            Export Data
          </button>
          
          <button
            onClick={() => setShowAddBank(true)}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            <Plus size={18} className="mr-2" />
            Connect Bank
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-800">Connected Banks</p>
              <p className="text-2xl font-bold text-blue-900">{connectedCount}</p>
              <p className="text-xs text-blue-700">of {connections.length} total</p>
            </div>
            <Building className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-800">Total Accounts</p>
              <p className="text-2xl font-bold text-green-900">{totalAccounts}</p>
              <p className="text-xs text-green-700">Across all banks</p>
            </div>
            <DollarSign className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className={`bg-gradient-to-br rounded-xl p-6 border ${
          needsAttention > 0 ? 'from-orange-50 to-orange-100 border-orange-200' : 'from-gray-50 to-gray-100 border-gray-200'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${needsAttention > 0 ? 'text-orange-800' : 'text-gray-800'}`}>
                Needs Attention
              </p>
              <p className={`text-2xl font-bold ${needsAttention > 0 ? 'text-orange-900' : 'text-gray-900'}`}>
                {needsAttention}
              </p>
              <p className={`text-xs ${needsAttention > 0 ? 'text-orange-700' : 'text-gray-700'}`}>
                {needsAttention > 0 ? 'Connections need reauth' : 'All connections healthy'}
              </p>
            </div>
            {needsAttention > 0 ? (
              <AlertTriangle className="w-8 h-8 text-orange-600" />
            ) : (
              <CheckCircle className="w-8 h-8 text-green-600" />
            )}
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-800">Last Sync</p>
              <p className="text-lg font-bold text-purple-900">
                {connections.length > 0 ? 
                  Math.max(...connections.map(c => c.lastSync.getTime())) === connections[0]?.lastSync.getTime() ? 
                  'Just now' : '2 min ago'
                  : 'Never'
                }
              </p>
              <p className="text-xs text-purple-700">Auto-sync every 4hrs</p>
            </div>
            <RefreshCw className="w-8 h-8 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
        <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setViewMode('overview')}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              viewMode === 'overview' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-700 hover:text-gray-900'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setViewMode('connections')}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              viewMode === 'connections' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-700 hover:text-gray-900'
            }`}
          >
            Connections
          </button>
          <button
            onClick={() => setViewMode('accounts')}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              viewMode === 'accounts' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-700 hover:text-gray-900'
            }`}
          >
            Accounts
          </button>
          <button
            onClick={() => setViewMode('security')}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              viewMode === 'security' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-700 hover:text-gray-900'
            }`}
          >
            Security
          </button>
        </div>
      </div>

      {viewMode === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Connections */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Bank Connections</h4>
            <div className="space-y-3">
              {connections.slice(0, 3).map((connection) => {
                const StatusIcon = getStatusIcon(connection.status);
                return (
                  <div key={connection.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="text-2xl">{connection.bankLogo}</div>
                      <div>
                        <div className="font-medium text-gray-900">{connection.bankName}</div>
                        <div className="text-sm text-gray-600">{connection.accountsFound} accounts</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(connection.status)}`}>
                        <StatusIcon size={12} className="mr-1" />
                        {connection.status.replace('_', ' ')}
                      </span>
                      <div className="text-xs text-gray-500 mt-1">
                        {connection.lastSync.toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Account Summary */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Account Summary</h4>
            <div className="space-y-3">
              {accounts.filter(acc => !acc.isHidden).slice(0, 4).map((account) => {
                const Icon = getAccountTypeIcon(account.accountType);
                return (
                  <div key={account.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Icon size={20} className="text-blue-600" />
                      <div>
                        <div className="font-medium text-gray-900">{account.accountName}</div>
                        <div className="text-sm text-gray-600">{account.institution} • {account.accountNumber}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`font-semibold ${account.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatValue(account.balance)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {account.lastUpdated.toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {viewMode === 'connections' && (
        <div className="space-y-4">
          {connections.map((connection) => {
            const StatusIcon = getStatusIcon(connection.status);
            const connectedAccounts = accounts.filter(acc => acc.connectionId === connection.id);
            
            return (
              <div key={connection.id} className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="text-3xl">{connection.bankLogo}</div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">{connection.bankName}</h3>
                      <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600">
                        <span>{connection.accountsFound} accounts found</span>
                        <span>•</span>
                        <span>Last sync: {connection.lastSync.toLocaleDateString()}</span>
                        <span>•</span>
                        <span className="capitalize">{connection.connectionMethod}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(connection.status)}`}>
                      <StatusIcon size={14} className="mr-1" />
                      {connection.status.replace('_', ' ')}
                    </span>
                    
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => refreshConnection(connection.id)}
                        className="p-2 text-gray-400 hover:text-blue-600 rounded-lg transition-colors"
                        title="Refresh connection"
                      >
                        <RefreshCw size={16} />
                      </button>
                      <button
                        className="p-2 text-gray-400 hover:text-gray-600 rounded-lg transition-colors"
                        title="Connection settings"
                      >
                        <Settings size={16} />
                      </button>
                      <button
                        onClick={() => disconnectBank(connection.id)}
                        className="p-2 text-gray-400 hover:text-red-600 rounded-lg transition-colors"
                        title="Disconnect bank"
                      >
                        <Unlink size={16} />
                      </button>
                    </div>
                  </div>
                </div>

                {connection.errorMessage && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-start space-x-2">
                      <AlertTriangle size={16} className="text-red-600 mt-0.5" />
                      <div className="text-sm text-red-800">{connection.errorMessage}</div>
                    </div>
                  </div>
                )}

                <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Method:</span>
                    <div className="font-medium capitalize">{connection.connectionMethod}</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Accounts:</span>
                    <div className="font-medium">{connectedAccounts.length} connected</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Next Sync:</span>
                    <div className="font-medium">
                      {connection.nextSync ? connection.nextSync.toLocaleTimeString() : 'Manual'}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-500">Mode:</span>
                    <div className="font-medium">{connection.isTestMode ? 'Test' : 'Live'}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {viewMode === 'accounts' && (
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h4 className="text-lg font-semibold text-gray-900">Connected Accounts</h4>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Account</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Balance</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Institution</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Updated</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {accounts.map((account) => {
                  const Icon = getAccountTypeIcon(account.accountType);
                  const connection = connections.find(c => c.id === account.connectionId);
                  
                  return (
                    <tr key={account.id} className={`hover:bg-gray-50 ${account.isHidden ? 'opacity-50' : ''}`}>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <Icon size={20} className="text-blue-600" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">{account.accountName}</div>
                            <div className="text-sm text-gray-500">{account.accountNumber} • {account.accountType}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className={`text-sm font-semibold ${account.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatValue(account.balance)}
                        </div>
                        {account.availableBalance && (
                          <div className="text-xs text-gray-500">
                            Available: {formatValue(account.availableBalance)}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <span className="text-2xl">{connection?.bankLogo}</span>
                          <span className="text-sm text-gray-900">{account.institution}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          account.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {account.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {account.lastUpdated.toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <button
                          onClick={() => toggleAccountVisibility(account.id)}
                          className="text-gray-400 hover:text-gray-600 transition-colors"
                          title={account.isHidden ? 'Show account' : 'Hide account'}
                        >
                          {account.isHidden ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {viewMode === 'security' && (
        <div className="space-y-6">
          {/* Security Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-800">Encryption Status</p>
                  <p className="text-lg font-bold text-green-900">256-bit SSL</p>
                  <p className="text-xs text-green-700">Bank-grade security</p>
                </div>
                <Lock className="w-8 h-8 text-green-600" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-800">Data Provider</p>
                  <p className="text-lg font-bold text-blue-900">Plaid</p>
                  <p className="text-xs text-blue-700">Trusted by 11,000+ apps</p>
                </div>
                <Shield className="w-8 h-8 text-blue-600" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-800">Compliance</p>
                  <p className="text-lg font-bold text-purple-900">SOC 2 Type II</p>
                  <p className="text-xs text-purple-700">Audited annually</p>
                </div>
                <Award className="w-8 h-8 text-purple-600" />
              </div>
            </div>
          </div>

          {/* Security Details */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Security & Privacy</h4>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <Shield className="w-5 h-5 text-green-600 mt-0.5" />
                <div>
                  <h5 className="font-medium text-gray-900">End-to-End Encryption</h5>
                  <p className="text-sm text-gray-600">All data is encrypted in transit and at rest using industry-standard 256-bit encryption.</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <Eye className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <h5 className="font-medium text-gray-900">Read-Only Access</h5>
                  <p className="text-sm text-gray-600">We can only view your account information - we cannot move money or make changes to your accounts.</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <Lock className="w-5 h-5 text-purple-600 mt-0.5" />
                <div>
                  <h5 className="font-medium text-gray-900">Secure Storage</h5>
                  <p className="text-sm text-gray-600">Your credentials are tokenized and never stored in plain text. We use bank-grade security standards.</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <User className="w-5 h-5 text-orange-600 mt-0.5" />
                <div>
                  <h5 className="font-medium text-gray-900">Privacy Protection</h5>
                  <p className="text-sm text-gray-600">Your data is never sold or shared with third parties. We only use it to provide you with financial insights.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Bank Modal */}
      {showAddBank && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Connect Your Bank</h3>
              <button
                onClick={() => setShowAddBank(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            {!selectedBank ? (
              <div className="p-6">
                {/* Search */}
                <div className="mb-6">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="text"
                      placeholder="Search for your bank..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Popular Banks */}
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Popular Banks</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {filteredBanks.filter(bank => bank.isPopular).map((bank) => (
                      <button
                        key={bank.id}
                        onClick={() => setSelectedBank(bank)}
                        className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors text-center"
                      >
                        <div className="text-2xl mb-2">{bank.logo}</div>
                        <div className="text-sm font-medium text-gray-900">{bank.name}</div>
                        <div className="flex items-center justify-center mt-1">
                          <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
                          <span className="text-xs text-gray-600">{bank.healthScore}%</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* All Banks */}
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3">All Banks ({filteredBanks.length})</h4>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {filteredBanks.map((bank) => (
                      <button
                        key={bank.id}
                        onClick={() => setSelectedBank(bank)}
                        className="w-full p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors text-left"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="text-2xl">{bank.logo}</div>
                            <div>
                              <div className="font-medium text-gray-900">{bank.name}</div>
                              <div className="text-sm text-gray-600">{bank.domain}</div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {bank.oauth && <Shield size={16} className="text-green-600" />}
                            {bank.mfa && <Lock size={16} className="text-blue-600" />}
                            <div className="text-right">
                              <div className="text-sm font-medium">{bank.healthScore}%</div>
                              <div className="text-xs text-gray-500">~{bank.avgConnectionTime}s</div>
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : isConnecting ? (
              <div className="p-8">
                <div className="text-center mb-8">
                  <div className="text-4xl mb-4">{selectedBank.logo}</div>
                  <h3 className="text-xl font-semibold text-gray-900">Connecting to {selectedBank.name}</h3>
                  <p className="text-gray-600">Please wait while we securely connect to your account</p>
                </div>

                <div className="space-y-4">
                  {connectionSteps.map((step) => (
                    <div key={step.id} className="flex items-center space-x-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                        step.status === 'completed' ? 'bg-green-500' :
                        step.status === 'in_progress' ? 'bg-blue-500' :
                        step.status === 'error' ? 'bg-red-500' :
                        'bg-gray-300'
                      }`}>
                        {step.status === 'completed' ? (
                          <CheckCircle size={14} className="text-white" />
                        ) : step.status === 'in_progress' ? (
                          <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                        ) : step.status === 'error' ? (
                          <X size={14} className="text-white" />
                        ) : (
                          <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{step.title}</div>
                        <div className="text-sm text-gray-600">{step.description}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-6">
                <div className="text-center mb-6">
                  <div className="text-4xl mb-4">{selectedBank.logo}</div>
                  <h3 className="text-xl font-semibold text-gray-900">Connect to {selectedBank.name}</h3>
                  <p className="text-gray-600">Enter your online banking credentials to connect securely</p>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <div className="flex items-start space-x-2">
                    <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div className="text-sm text-blue-800">
                      <strong>Secure Connection:</strong> Your credentials are encrypted and transmitted securely. 
                      We use read-only access and cannot move money or make changes to your accounts.
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Username or Email
                    </label>
                    <input
                      type="text"
                      value={credentials.username}
                      onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
                      placeholder="Enter your username"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Password
                    </label>
                    <input
                      type="password"
                      value={credentials.password}
                      onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                      placeholder="Enter your password"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between mt-8">
                  <button
                    onClick={() => setSelectedBank(null)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    Back to Banks
                  </button>
                  <button
                    onClick={() => startConnection(selectedBank)}
                    disabled={!credentials.username || !credentials.password}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                  >
                    Connect Securely
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}