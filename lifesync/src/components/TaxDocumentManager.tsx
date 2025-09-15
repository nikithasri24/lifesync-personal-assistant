import React, { useState } from 'react';
import {
  FileText,
  Upload,
  Download,
  Calendar,
  DollarSign,
  Tag,
  Search,
  Filter,
  Plus,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  AlertTriangle,
  Clock,
  Archive,
  Folder,
  Receipt,
  Building,
  Home,
  Car,
  GraduationCap,
  Heart,
  Briefcase,
  Calculator,
  Target,
  TrendingUp,
  X,
  Save
} from 'lucide-react';

interface TaxDocument {
  id: string;
  name: string;
  type: 'W2' | '1099' | 'receipt' | 'form' | 'statement' | 'other';
  category: string;
  amount?: number;
  date: Date;
  taxYear: number;
  isDeductible: boolean;
  status: 'pending' | 'reviewed' | 'approved' | 'rejected';
  tags: string[];
  description?: string;
  fileUrl?: string;
  uploadedAt: Date;
}

interface TaxCategory {
  id: string;
  name: string;
  type: 'deduction' | 'income' | 'credit';
  icon: React.ComponentType<any>;
  color: string;
  description: string;
  limit?: number;
  currentAmount: number;
  documents: string[];
}

interface TaxSummary {
  year: number;
  totalDeductions: number;
  totalIncome: number;
  estimatedRefund: number;
  documentsCount: number;
  missingDocuments: string[];
  deadlines: { description: string; date: Date; priority: 'high' | 'medium' | 'low' }[];
}

const MOCK_TAX_DOCUMENTS: TaxDocument[] = [
  {
    id: '1',
    name: 'W-2 Form - ABC Company',
    type: 'W2',
    category: 'employment',
    amount: 75000,
    date: new Date('2023-12-31'),
    taxYear: 2023,
    isDeductible: false,
    status: 'approved',
    tags: ['employment', 'income', 'W2'],
    description: 'Annual wage and tax statement',
    uploadedAt: new Date('2024-01-15')
  },
  {
    id: '2',
    name: 'Medical Expenses Receipt',
    type: 'receipt',
    category: 'medical',
    amount: 450,
    date: new Date('2023-09-15'),
    taxYear: 2023,
    isDeductible: true,
    status: 'reviewed',
    tags: ['medical', 'deductible', 'healthcare'],
    description: 'Doctor visit and prescription costs',
    uploadedAt: new Date('2023-09-16')
  },
  {
    id: '3',
    name: 'Home Office Equipment',
    type: 'receipt',
    category: 'business',
    amount: 1200,
    date: new Date('2023-03-10'),
    taxYear: 2023,
    isDeductible: true,
    status: 'approved',
    tags: ['business', 'equipment', 'office'],
    description: 'Desk, chair, and monitor for home office',
    uploadedAt: new Date('2023-03-11')
  },
  {
    id: '4',
    name: 'Charitable Donation Receipt',
    type: 'receipt',
    category: 'charity',
    amount: 500,
    date: new Date('2023-12-20'),
    taxYear: 2023,
    isDeductible: true,
    status: 'pending',
    tags: ['charity', 'donation', 'deductible'],
    description: 'Annual donation to local food bank',
    uploadedAt: new Date('2023-12-21')
  },
  {
    id: '5',
    name: 'Student Loan Interest Statement',
    type: 'statement',
    category: 'education',
    amount: 1800,
    date: new Date('2023-12-31'),
    taxYear: 2023,
    isDeductible: true,
    status: 'reviewed',
    tags: ['education', 'interest', 'loan'],
    description: '1098-E Student Loan Interest Statement',
    uploadedAt: new Date('2024-01-20')
  }
];

const TAX_CATEGORIES: TaxCategory[] = [
  {
    id: 'medical',
    name: 'Medical & Healthcare',
    type: 'deduction',
    icon: Heart,
    color: '#EC4899',
    description: 'Medical expenses, insurance premiums, prescriptions',
    currentAmount: 450,
    documents: ['2']
  },
  {
    id: 'business',
    name: 'Business Expenses',
    type: 'deduction',
    icon: Briefcase,
    color: '#3B82F6',
    description: 'Office supplies, equipment, travel, meals',
    currentAmount: 1200,
    documents: ['3']
  },
  {
    id: 'charity',
    name: 'Charitable Donations',
    type: 'deduction',
    icon: Heart,
    color: '#10B981',
    description: 'Cash and non-cash charitable contributions',
    currentAmount: 500,
    documents: ['4']
  },
  {
    id: 'education',
    name: 'Education',
    type: 'deduction',
    icon: GraduationCap,
    color: '#8B5CF6',
    description: 'Student loan interest, tuition, education credits',
    currentAmount: 1800,
    documents: ['5']
  },
  {
    id: 'employment',
    name: 'Employment Income',
    type: 'income',
    icon: Building,
    color: '#F59E0B',
    description: 'W-2 wages, salary, tips, bonuses',
    currentAmount: 75000,
    documents: ['1']
  },
  {
    id: 'mortgage',
    name: 'Mortgage Interest',
    type: 'deduction',
    icon: Home,
    color: '#EF4444',
    description: 'Mortgage interest, property taxes',
    currentAmount: 0,
    documents: []
  }
];

const TAX_DEADLINES = [
  { description: 'File Tax Return', date: new Date('2024-04-15'), priority: 'high' as const },
  { description: 'First Quarter Estimated Tax', date: new Date('2024-04-15'), priority: 'medium' as const },
  { description: 'File Extension (if needed)', date: new Date('2024-04-15'), priority: 'low' as const },
  { description: 'Extended Deadline', date: new Date('2024-10-15'), priority: 'medium' as const }
];

export default function TaxDocumentManager() {
  const [documents, setDocuments] = useState<TaxDocument[]>(MOCK_TAX_DOCUMENTS);
  const [selectedYear, setSelectedYear] = useState<number>(2023);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    name: '',
    type: 'receipt' as const,
    category: 'medical',
    amount: '',
    date: '',
    description: '',
    isDeductible: true,
    tags: [] as string[]
  });

  const filteredDocuments = documents.filter(doc => {
    const matchesYear = doc.taxYear === selectedYear;
    const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = categoryFilter === 'all' || doc.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' || doc.status === statusFilter;
    
    return matchesYear && matchesSearch && matchesCategory && matchesStatus;
  });

  const getDocumentTypeIcon = (type: string) => {
    switch (type) {
      case 'W2': return Building;
      case '1099': return Briefcase;
      case 'receipt': return Receipt;
      case 'form': return FileText;
      case 'statement': return Archive;
      default: return FileText;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'reviewed': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleUploadDocument = () => {
    if (!uploadForm.name || !uploadForm.date) return;

    const newDocument: TaxDocument = {
      id: Date.now().toString(),
      name: uploadForm.name,
      type: uploadForm.type,
      category: uploadForm.category,
      amount: uploadForm.amount ? parseFloat(uploadForm.amount) : undefined,
      date: new Date(uploadForm.date),
      taxYear: new Date(uploadForm.date).getFullYear(),
      isDeductible: uploadForm.isDeductible,
      status: 'pending',
      tags: uploadForm.tags,
      description: uploadForm.description,
      uploadedAt: new Date()
    };

    setDocuments([...documents, newDocument]);
    setShowUploadModal(false);
    setUploadForm({
      name: '',
      type: 'receipt',
      category: 'medical',
      amount: '',
      date: '',
      description: '',
      isDeductible: true,
      tags: []
    });
  };

  const handleDeleteDocument = (documentId: string) => {
    if (confirm('Delete this document?')) {
      setDocuments(documents.filter(d => d.id !== documentId));
    }
  };

  const updateDocumentStatus = (documentId: string, status: TaxDocument['status']) => {
    setDocuments(documents.map(doc => 
      doc.id === documentId ? { ...doc, status } : doc
    ));
  };

  // Calculate tax summary
  const yearDocuments = documents.filter(d => d.taxYear === selectedYear);
  const totalDeductions = yearDocuments
    .filter(d => d.isDeductible && d.amount)
    .reduce((sum, d) => sum + (d.amount || 0), 0);
  const totalIncome = yearDocuments
    .filter(d => !d.isDeductible && d.amount)
    .reduce((sum, d) => sum + (d.amount || 0), 0);
  const estimatedRefund = Math.max(0, totalDeductions * 0.22); // Rough 22% bracket estimate

  const upcomingDeadlines = TAX_DEADLINES.filter(deadline => 
    deadline.date >= new Date()
  ).slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-2xl font-bold text-gray-900 flex items-center">
            <FileText className="w-8 h-8 mr-3 text-orange-600" />
            Tax Document Manager
          </h3>
          <p className="text-gray-600">Organize tax documents and track deductible expenses</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            <option value={2023}>Tax Year 2023</option>
            <option value={2022}>Tax Year 2022</option>
            <option value={2021}>Tax Year 2021</option>
          </select>
          
          <button className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
            <Download size={16} className="mr-2" />
            Export
          </button>
          
          <button
            onClick={() => setShowUploadModal(true)}
            className="inline-flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 transition-colors"
          >
            <Upload size={18} className="mr-2" />
            Upload Document
          </button>
        </div>
      </div>

      {/* Tax Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-800">Total Deductions</p>
              <p className="text-2xl font-bold text-green-900">${totalDeductions.toLocaleString()}</p>
              <p className="text-xs text-green-700">{selectedYear} tax year</p>
            </div>
            <Calculator className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-800">Total Income</p>
              <p className="text-2xl font-bold text-blue-900">${totalIncome.toLocaleString()}</p>
              <p className="text-xs text-blue-700">reported income</p>
            </div>
            <TrendingUp className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-800">Est. Tax Savings</p>
              <p className="text-2xl font-bold text-purple-900">${estimatedRefund.toLocaleString()}</p>
              <p className="text-xs text-purple-700">from deductions</p>
            </div>
            <Target className="w-8 h-8 text-purple-600" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-6 border border-orange-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-orange-800">Documents</p>
              <p className="text-2xl font-bold text-orange-900">{yearDocuments.length}</p>
              <p className="text-xs text-orange-700">uploaded for {selectedYear}</p>
            </div>
            <FileText className="w-8 h-8 text-orange-600" />
          </div>
        </div>
      </div>

      {/* Upcoming Deadlines */}
      <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-xl p-6">
        <div className="flex items-start space-x-3">
          <Clock className="w-6 h-6 text-red-600 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-semibold text-red-800 mb-2">Upcoming Tax Deadlines</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {upcomingDeadlines.map((deadline, index) => {
                const daysUntil = Math.ceil((deadline.date.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                return (
                  <div key={index} className={`p-3 rounded-lg border ${
                    deadline.priority === 'high' ? 'bg-red-50 border-red-200' :
                    deadline.priority === 'medium' ? 'bg-orange-50 border-orange-200' :
                    'bg-yellow-50 border-yellow-200'
                  }`}>
                    <div className="font-medium text-gray-900 text-sm">{deadline.description}</div>
                    <div className="text-xs text-gray-600 mt-1">
                      {deadline.date.toLocaleDateString()} ({daysUntil} days)
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search documents..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="all">All Categories</option>
              {TAX_CATEGORIES.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="reviewed">Reviewed</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
            
            <button
              onClick={() => setShowCategoryModal(true)}
              className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Folder size={16} className="mr-2" />
              Categories
            </button>
          </div>
        </div>
      </div>

      {/* Tax Categories Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Deduction Categories</h4>
          <div className="space-y-4">
            {TAX_CATEGORIES.filter(cat => cat.type === 'deduction').map((category) => {
              const Icon = category.icon;
              return (
                <div key={category.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="p-2 rounded-lg"
                      style={{ backgroundColor: `${category.color}20` }}
                    >
                      <Icon size={18} style={{ color: category.color }} />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{category.name}</div>
                      <div className="text-sm text-gray-600">{category.documents.length} documents</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-gray-900">${category.currentAmount.toLocaleString()}</div>
                    <div className="text-sm text-gray-600">deductions</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Income Categories</h4>
          <div className="space-y-4">
            {TAX_CATEGORIES.filter(cat => cat.type === 'income').map((category) => {
              const Icon = category.icon;
              return (
                <div key={category.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="p-2 rounded-lg"
                      style={{ backgroundColor: `${category.color}20` }}
                    >
                      <Icon size={18} style={{ color: category.color }} />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{category.name}</div>
                      <div className="text-sm text-gray-600">{category.documents.length} documents</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-gray-900">${category.currentAmount.toLocaleString()}</div>
                    <div className="text-sm text-gray-600">income</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Documents List */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h4 className="text-lg font-semibold text-gray-900">Tax Documents</h4>
            <div className="text-sm text-gray-500">
              {filteredDocuments.length} of {yearDocuments.length} documents
            </div>
          </div>
        </div>
        
        {filteredDocuments.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="w-20 h-20 text-gray-300 mx-auto mb-4" />
            <h4 className="text-xl font-medium text-gray-900 mb-2">No documents found</h4>
            <p className="text-gray-600 mb-6">Upload your tax documents to get started</p>
            <button
              onClick={() => setShowUploadModal(true)}
              className="inline-flex items-center px-6 py-3 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 transition-colors"
            >
              <Upload size={20} className="mr-2" />
              Upload First Document
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Document</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredDocuments.map((document) => {
                  const TypeIcon = getDocumentTypeIcon(document.type);
                  const category = TAX_CATEGORIES.find(c => c.id === document.category);
                  
                  return (
                    <tr key={document.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-gray-100 rounded-lg">
                            <TypeIcon size={18} className="text-gray-600" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{document.name}</div>
                            <div className="text-xs text-gray-500">{category?.name}</div>
                            {document.isDeductible && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 mt-1">
                                Deductible
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          {document.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-gray-900">
                        {document.amount ? `$${document.amount.toLocaleString()}` : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {document.date.toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(document.status)}`}>
                          {document.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center space-x-2">
                          <button
                            onClick={() => updateDocumentStatus(document.id, 'approved')}
                            className="p-1 text-green-600 hover:bg-green-50 rounded transition-colors"
                            title="Approve"
                          >
                            <CheckCircle size={16} />
                          </button>
                          <button
                            className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title="View"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteDocument(document.id)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Delete"
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
        )}
      </div>

      {/* Upload Document Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Upload Tax Document</h3>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Document Name
                </label>
                <input
                  type="text"
                  value={uploadForm.name}
                  onChange={(e) => setUploadForm({ ...uploadForm, name: e.target.value })}
                  placeholder="W-2 Form - Company Name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Document Type
                  </label>
                  <select
                    value={uploadForm.type}
                    onChange={(e) => setUploadForm({ ...uploadForm, type: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="receipt">Receipt</option>
                    <option value="W2">W-2 Form</option>
                    <option value="1099">1099 Form</option>
                    <option value="form">Tax Form</option>
                    <option value="statement">Statement</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <select
                    value={uploadForm.category}
                    onChange={(e) => setUploadForm({ ...uploadForm, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    {TAX_CATEGORIES.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Amount (Optional)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={uploadForm.amount}
                    onChange={(e) => setUploadForm({ ...uploadForm, amount: e.target.value })}
                    placeholder="0.00"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    value={uploadForm.date}
                    onChange={(e) => setUploadForm({ ...uploadForm, date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={uploadForm.description}
                  onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })}
                  placeholder="Brief description of the document"
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isDeductible"
                  checked={uploadForm.isDeductible}
                  onChange={(e) => setUploadForm({ ...uploadForm, isDeductible: e.target.checked })}
                  className="rounded border-gray-300 focus:ring-orange-500"
                />
                <label htmlFor="isDeductible" className="ml-2 text-sm text-gray-700">
                  This is a tax-deductible expense
                </label>
              </div>

              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600">Click to upload or drag and drop</p>
                <p className="text-xs text-gray-500">PDF, JPG, PNG up to 10MB</p>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
              <button
                onClick={() => setShowUploadModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleUploadDocument}
                disabled={!uploadForm.name || !uploadForm.date}
                className="px-4 py-2 text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-lg transition-colors"
              >
                Upload Document
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}