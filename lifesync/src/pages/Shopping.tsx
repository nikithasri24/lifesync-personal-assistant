import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  ShoppingCart, 
  Search,
  Filter,
  Check,
  X,
  Edit3,
  Trash2,
  Star,
  MapPin,
  DollarSign,
  Clock,
  Users,
  Archive,
  ShoppingBag,
  TrendingUp,
  Package,
  Zap,
  BarChart3,
  Share2,
  Copy,
  ChevronDown,
  ChevronRight,
  Scan,
  AlertCircle,
  Heart,
  Calendar,
  ArrowRight,
  Store,
  Target,
  Award,
  Shuffle,
  FileText,
  Calculator,
  Mic,
  Camera
} from 'lucide-react';
import { format, isToday, isThisWeek, isThisMonth } from 'date-fns';

interface ShoppingItem {
  id: string;
  name: string;
  quantity: number;
  unit?: string;
  category: 'produce' | 'dairy' | 'meat' | 'pantry' | 'frozen' | 'bakery' | 'deli' | 'household' | 'personal' | 'electronics' | 'other';
  subcategory?: string;
  priority: 'low' | 'medium' | 'high';
  purchased: boolean;
  price?: number;
  estimatedPrice?: number;
  store?: string;
  aisle?: string;
  brand?: string;
  size?: string;
  notes?: string;
  imageUrl?: string;
  barcode?: string;
  nutritionInfo?: {
    calories?: number;
    organic?: boolean;
    glutenFree?: boolean;
    vegan?: boolean;
  };
  tags?: string[];
  addedBy?: string;
  purchasedAt?: Date;
  purchasedBy?: string;
  listId: string;
  recipeId?: string;
  autoAdded?: boolean;
  recurring?: {
    frequency: 'weekly' | 'biweekly' | 'monthly';
    lastPurchased?: Date;
    autoAdd: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

interface ShoppingList {
  id: string;
  name: string;
  description?: string;
  type: 'master' | 'store-specific' | 'shared' | 'recipe-based' | 'template';
  color: string;
  icon?: string;
  store?: Store;
  totalEstimatedCost?: number;
  totalActualCost?: number;
  items: ShoppingItem[];
  collaborators?: string[];
  owner: string;
  completedAt?: Date;
  archived: boolean;
  template?: boolean;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
}

interface Store {
  id: string;
  name: string;
  type: 'grocery' | 'wholesale' | 'specialty' | 'organic' | 'international' | 'pharmacy';
  address?: string;
  phone?: string;
  website?: string;
  logo?: string;
  color: string;
  preferences: {
    priceRating: 1 | 2 | 3 | 4 | 5; // 1 = expensive, 5 = cheap
    qualityRating: 1 | 2 | 3 | 4 | 5; // 1 = poor, 5 = excellent
    cleanlinessRating: 1 | 2 | 3 | 4 | 5;
    serviceRating: 1 | 2 | 3 | 4 | 5;
    overallRating: 1 | 2 | 3 | 4 | 5;
  };
  specialties: string[]; // ['organic', 'bulk', 'international', 'kosher', 'halal']
  bestFor: string[]; // ['produce', 'meat', 'dairy', 'pantry', 'frozen']
  avgPrices: { [itemName: string]: number };
  hours?: {
    [day: string]: { open: string; close: string; closed?: boolean };
  };
  distance?: number; // miles from user
  lastVisited?: Date;
  favorite: boolean;
}

interface StorePreference {
  itemCategory: string;
  preferredStores: string[]; // ordered by preference
  reasons: string[]; // ['price', 'quality', 'convenience', 'specialty']
}

const CATEGORY_ICONS = {
  produce: '🥬',
  dairy: '🥛',
  meat: '🥩',
  pantry: '🥫',
  frozen: '🧊',
  bakery: '🍞',
  deli: '🧀',
  household: '🧽',
  personal: '🧴',
  electronics: '📱',
  other: '📦'
};

const CATEGORY_COLORS = {
  produce: 'bg-green-100 text-green-800 border-green-200',
  dairy: 'bg-blue-100 text-blue-800 border-blue-200',
  meat: 'bg-red-100 text-red-800 border-red-200',
  pantry: 'bg-amber-100 text-amber-800 border-amber-200',
  frozen: 'bg-cyan-100 text-cyan-800 border-cyan-200',
  bakery: 'bg-orange-100 text-orange-800 border-orange-200',
  deli: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  household: 'bg-gray-100 text-gray-800 border-gray-200',
  personal: 'bg-pink-100 text-pink-800 border-pink-200',
  electronics: 'bg-purple-100 text-purple-800 border-purple-200',
  other: 'bg-slate-100 text-slate-800 border-slate-200'
};

const PRIORITY_COLORS = {
  low: 'border-l-gray-300',
  medium: 'border-l-yellow-400',
  high: 'border-l-red-400'
};

export default function Shopping() {
  const [lists, setLists] = useState<ShoppingList[]>([
    {
      id: '1',
      name: 'Weekly Groceries',
      type: 'personal',
      color: '#22c55e',
      store: 'Whole Foods',
      items: [
        {
          id: '1',
          name: 'Organic Bananas',
          quantity: 6,
          unit: 'pcs',
          category: 'produce',
          priority: 'medium',
          purchased: false,
          estimatedPrice: 3.99,
          aisle: '1',
          nutritionInfo: { organic: true },
          listId: '1',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: '2',
          name: 'Almond Milk',
          quantity: 1,
          unit: 'carton',
          category: 'dairy',
          priority: 'high',
          purchased: true,
          price: 4.49,
          estimatedPrice: 4.49,
          aisle: '3',
          brand: 'Califia',
          size: '48oz',
          nutritionInfo: { vegan: true },
          purchasedAt: new Date(),
          listId: '1',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ],
      owner: 'user',
      archived: false,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ]);

  const [activeList, setActiveList] = useState<string>('1');
  const [viewMode, setViewMode] = useState<'list' | 'category' | 'store'>('category');
  const [showCompleted, setShowCompleted] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddItem, setShowAddItem] = useState(false);
  const [showAddList, setShowAddList] = useState(false);
  const [showInsights, setShowInsights] = useState(false);
  const [sortBy, setSortBy] = useState<'name' | 'category' | 'priority' | 'added'>('category');

  const [newItem, setNewItem] = useState({
    name: '',
    quantity: 1,
    unit: 'pcs',
    category: 'other' as const,
    priority: 'medium' as const,
    estimatedPrice: '',
    aisle: '',
    brand: '',
    notes: ''
  });

  const currentList = lists.find(list => list.id === activeList);
  const activeItems = currentList?.items || [];

  // Smart suggestions based on purchase history
  const [suggestions] = useState([
    { name: 'Milk', reason: 'Usually buy weekly', confidence: 0.9 },
    { name: 'Bread', reason: 'Low stock detected', confidence: 0.8 },
    { name: 'Apples', reason: 'Seasonal favorite', confidence: 0.7 }
  ]);

  // Filter and sort items
  const filteredItems = activeItems
    .filter(item => {
      if (!showCompleted && item.purchased) return false;
      if (searchQuery && !item.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'category':
          return a.category.localeCompare(b.category);
        case 'priority':
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        case 'added':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        default:
          return 0;
      }
    });

  // Group items by category for category view
  const itemsByCategory = filteredItems.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, ShoppingItem[]>);

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.name.trim() || !currentList) return;

    const item: ShoppingItem = {
      id: Date.now().toString(),
      name: newItem.name,
      quantity: newItem.quantity,
      unit: newItem.unit,
      category: newItem.category,
      priority: newItem.priority,
      purchased: false,
      estimatedPrice: newItem.estimatedPrice ? parseFloat(newItem.estimatedPrice) : undefined,
      aisle: newItem.aisle || undefined,
      brand: newItem.brand || undefined,
      notes: newItem.notes || undefined,
      listId: activeList,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    setLists(lists.map(list => 
      list.id === activeList 
        ? { ...list, items: [...list.items, item] }
        : list
    ));

    setNewItem({
      name: '',
      quantity: 1,
      unit: 'pcs',
      category: 'other',
      priority: 'medium',
      estimatedPrice: '',
      aisle: '',
      brand: '',
      notes: ''
    });
    setShowAddItem(false);
  };

  const toggleItemPurchased = (itemId: string) => {
    setLists(lists.map(list => 
      list.id === activeList 
        ? {
            ...list, 
            items: list.items.map(item => 
              item.id === itemId 
                ? { 
                    ...item, 
                    purchased: !item.purchased,
                    purchasedAt: !item.purchased ? new Date() : undefined 
                  }
                : item
            )
          }
        : list
    ));
  };

  const deleteItem = (itemId: string) => {
    setLists(lists.map(list => 
      list.id === activeList 
        ? { ...list, items: list.items.filter(item => item.id !== itemId) }
        : list
    ));
  };

  const totalItems = activeItems.length;
  const completedItems = activeItems.filter(item => item.purchased).length;
  const totalCost = activeItems.reduce((sum, item) => sum + (item.price || item.estimatedPrice || 0), 0);
  const progress = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="bg-white rounded-xl p-6 shadow-sm border">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Smart Shopping</h1>
            <p className="text-gray-600">Intelligent grocery management</p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => setShowInsights(true)}
              className="btn-secondary flex items-center space-x-2"
            >
              <BarChart3 size={16} />
              <span>Insights</span>
            </button>
            <button
              onClick={() => setShowAddList(true)}
              className="btn-primary flex items-center space-x-2"
            >
              <Plus size={16} />
              <span>New List</span>
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center">
              <ShoppingCart className="h-8 w-8 text-blue-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-blue-600">Total Items</p>
                <p className="text-lg font-semibold text-blue-900">{totalItems}</p>
              </div>
            </div>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center">
              <Check className="h-8 w-8 text-green-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-green-600">Completed</p>
                <p className="text-lg font-semibold text-green-900">{completedItems}</p>
              </div>
            </div>
          </div>
          <div className="bg-purple-50 rounded-lg p-4">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-purple-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-purple-600">Est. Total</p>
                <p className="text-lg font-semibold text-purple-900">${totalCost.toFixed(2)}</p>
              </div>
            </div>
          </div>
          <div className="bg-orange-50 rounded-lg p-4">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-orange-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-orange-600">Progress</p>
                <p className="text-lg font-semibold text-orange-900">{progress.toFixed(0)}%</p>
              </div>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        {totalItems > 0 && (
          <div className="mt-4">
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>Shopping Progress</span>
              <span>{completedItems} of {totalItems} completed</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-green-400 to-green-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Lists Tabs */}
      <div className="bg-white rounded-xl shadow-sm border">
        <div className="border-b">
          <div className="flex space-x-1 p-1">
            {lists.map(list => (
              <button
                key={list.id}
                onClick={() => setActiveList(list.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeList === list.id
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: list.color }}
                  />
                  <span>{list.name}</span>
                  <span className="text-xs bg-gray-200 px-2 py-1 rounded-full">
                    {list.items.length}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Controls */}
        <div className="p-4 border-b bg-gray-50">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  placeholder="Search items..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                <option value="category">Sort by Category</option>
                <option value="name">Sort by Name</option>
                <option value="priority">Sort by Priority</option>
                <option value="added">Sort by Date Added</option>
              </select>

              <select
                value={viewMode}
                onChange={(e) => setViewMode(e.target.value as any)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                <option value="category">Category View</option>
                <option value="list">List View</option>
                <option value="store">Store Layout</option>
              </select>
            </div>

            <div className="flex items-center space-x-3">
              <label className="flex items-center space-x-2 text-sm">
                <input
                  type="checkbox"
                  checked={showCompleted}
                  onChange={(e) => setShowCompleted(e.target.checked)}
                  className="rounded"
                />
                <span>Show completed</span>
              </label>

              <button
                onClick={() => setShowAddItem(true)}
                className="btn-primary flex items-center space-x-2"
              >
                <Plus size={16} />
                <span>Add Item</span>
              </button>
            </div>
          </div>
        </div>

        {/* Smart Suggestions */}
        {suggestions.length > 0 && (
          <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
            <h3 className="text-sm font-medium text-gray-900 mb-2 flex items-center">
              <Zap className="h-4 w-4 text-yellow-500 mr-2" />
              Smart Suggestions
            </h3>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => setNewItem(prev => ({ ...prev, name: suggestion.name }))}
                  className="text-xs bg-white border border-blue-200 rounded-full px-3 py-1 text-blue-700 hover:bg-blue-50 transition-colors"
                >
                  + {suggestion.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Items Display */}
        <div className="p-4">
          {viewMode === 'category' ? (
            <div className="space-y-6">
              {Object.entries(itemsByCategory).map(([category, items]) => (
                <div key={category}>
                  <div className="flex items-center mb-3">
                    <span className="text-2xl mr-2">{CATEGORY_ICONS[category as keyof typeof CATEGORY_ICONS]}</span>
                    <h3 className="text-lg font-semibold text-gray-900 capitalize">{category}</h3>
                    <span className="ml-2 text-sm text-gray-500">({items.length})</span>
                  </div>
                  <div className="grid gap-2">
                    {items.map(item => (
                      <ItemCard
                        key={item.id}
                        item={item}
                        onToggle={() => toggleItemPurchased(item.id)}
                        onDelete={() => deleteItem(item.id)}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredItems.map(item => (
                <ItemCard
                  key={item.id}
                  item={item}
                  onToggle={() => toggleItemPurchased(item.id)}
                  onDelete={() => deleteItem(item.id)}
                />
              ))}
            </div>
          )}

          {filteredItems.length === 0 && (
            <div className="text-center py-12">
              <ShoppingBag className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No items found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchQuery ? 'Try adjusting your search' : 'Start by adding your first item'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Add Item Modal */}
      {showAddItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Add New Item</h3>
              <button
                onClick={() => setShowAddItem(false)}
                className="p-2 hover:bg-gray-100 rounded-md"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddItem} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Item Name *
                </label>
                <input
                  type="text"
                  value={newItem.name}
                  onChange={(e) => setNewItem(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Organic Bananas"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quantity
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={newItem.quantity}
                    onChange={(e) => setNewItem(prev => ({ ...prev, quantity: parseInt(e.target.value) }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Unit
                  </label>
                  <select
                    value={newItem.unit}
                    onChange={(e) => setNewItem(prev => ({ ...prev, unit: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="pcs">pieces</option>
                    <option value="lbs">pounds</option>
                    <option value="oz">ounces</option>
                    <option value="bottles">bottles</option>
                    <option value="cartons">cartons</option>
                    <option value="boxes">boxes</option>
                    <option value="bags">bags</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <select
                    value={newItem.category}
                    onChange={(e) => setNewItem(prev => ({ ...prev, category: e.target.value as any }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {Object.entries(CATEGORY_ICONS).map(([category, icon]) => (
                      <option key={category} value={category}>
                        {icon} {category.charAt(0).toUpperCase() + category.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Priority
                  </label>
                  <select
                    value={newItem.priority}
                    onChange={(e) => setNewItem(prev => ({ ...prev, priority: e.target.value as any }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Est. Price
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={newItem.estimatedPrice}
                    onChange={(e) => setNewItem(prev => ({ ...prev, estimatedPrice: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="$0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Aisle
                  </label>
                  <input
                    type="text"
                    value={newItem.aisle}
                    onChange={(e) => setNewItem(prev => ({ ...prev, aisle: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., 3"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Brand (optional)
                </label>
                <input
                  type="text"
                  value={newItem.brand}
                  onChange={(e) => setNewItem(prev => ({ ...prev, brand: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Organic Valley"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes (optional)
                </label>
                <textarea
                  value={newItem.notes}
                  onChange={(e) => setNewItem(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={2}
                  placeholder="Any special notes..."
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddItem(false)}
                  className="flex-1 btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 btn-primary"
                >
                  Add Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Item Card Component
function ItemCard({ 
  item, 
  onToggle, 
  onDelete 
}: { 
  item: ShoppingItem; 
  onToggle: () => void; 
  onDelete: () => void; 
}) {
  return (
    <div className={`
      bg-white border border-l-4 rounded-lg p-4 transition-all duration-200 hover:shadow-md
      ${PRIORITY_COLORS[item.priority]}
      ${item.purchased ? 'opacity-60 bg-gray-50' : ''}
    `}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3 flex-1">
          <button
            onClick={onToggle}
            className={`
              flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors
              ${item.purchased 
                ? 'bg-green-500 border-green-500 text-white' 
                : 'border-gray-300 hover:border-green-400'
              }
            `}
          >
            {item.purchased && <Check size={14} />}
          </button>

          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <h4 className={`font-medium ${item.purchased ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                {item.name}
              </h4>
              <span className={`
                inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border
                ${CATEGORY_COLORS[item.category]}
              `}>
                <span className="mr-1">{CATEGORY_ICONS[item.category]}</span>
                {item.category}
              </span>
              {item.nutritionInfo?.organic && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                  🌱 Organic
                </span>
              )}
            </div>
            
            <div className="flex items-center space-x-4 mt-1 text-sm text-gray-500">
              <span>{item.quantity} {item.unit}</span>
              {item.aisle && (
                <span className="flex items-center">
                  <MapPin size={12} className="mr-1" />
                  Aisle {item.aisle}
                </span>
              )}
              {item.brand && <span>• {item.brand}</span>}
              {(item.price || item.estimatedPrice) && (
                <span className="flex items-center font-medium text-green-600">
                  <DollarSign size={12} />
                  {(item.price || item.estimatedPrice)?.toFixed(2)}
                </span>
              )}
            </div>
            
            {item.notes && (
              <p className="mt-1 text-sm text-gray-600">{item.notes}</p>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {item.priority === 'high' && (
            <AlertCircle size={16} className="text-red-500" />
          )}
          <button
            onClick={onDelete}
            className="p-1 text-gray-400 hover:text-red-500 transition-colors"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}