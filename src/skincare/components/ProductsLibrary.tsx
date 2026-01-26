/**
 * ProductsLibrary - Manage skincare products collection
 */

import React from 'react';
import { Plus, Search, Star, ShoppingBag, Calendar, AlertCircle } from 'lucide-react';
import type { SkincareProduct, ProductCategory } from '../types';

type ProductsLibraryProps = {
  products: SkincareProduct[];
  onAddProduct: () => void;
  onEditProduct: (product: SkincareProduct) => void;
  onDeleteProduct: (id: string) => void;
};

const ProductsLibrary: React.FC<ProductsLibraryProps> = ({
  products,
  onAddProduct,
  onEditProduct,
  onDeleteProduct: _onDeleteProduct,
}) => {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [filterCategory, setFilterCategory] = React.useState<ProductCategory | 'all'>('all');
  const [filterStatus, setFilterStatus] = React.useState<'all' | 'active' | 'inactive'>('all');

  // Filter products
  const filteredProducts = products.filter(product => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.brand?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      filterCategory === 'all' || product.category === filterCategory;

    const matchesStatus =
      filterStatus === 'all' ||
      (filterStatus === 'active' && product.currentlyUsing) ||
      (filterStatus === 'inactive' && !product.currentlyUsing);

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const categories: ProductCategory[] = [
    'cleanser',
    'toner',
    'serum',
    'moisturizer',
    'sunscreen',
    'treatment',
    'mask',
    'eye_cream',
    'exfoliant',
    'oil',
    'other',
  ];

  const formatCategory = (cat: string): string => {
    return cat.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const isExpiringSoon = (expiryDate?: string): boolean => {
    if (!expiryDate) return false;
    const expiry = new Date(expiryDate);
    const now = new Date();
    const daysUntilExpiry = Math.floor((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry >= 0 && daysUntilExpiry <= 30;
  };

  const isExpired = (expiryDate?: string): boolean => {
    if (!expiryDate) return false;
    const expiry = new Date(expiryDate);
    const now = new Date();
    return expiry < now;
  };

  return (
    <div className="space-y-4">
      {/* Header with Add Button */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Products Library</h3>
        <button
          onClick={onAddProduct}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-5 w-5" />
          Add Product
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3">
        {/* Search */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
          <input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>

        {/* Category Filter */}
        <select
          value={filterCategory}
          onChange={e => setFilterCategory(e.target.value as ProductCategory | 'all')}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        >
          <option value="all">All Categories</option>
          {categories.map(cat => (
            <option key={cat} value={cat}>
              {formatCategory(cat)}
            </option>
          ))}
        </select>

        {/* Status Filter */}
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value as 'all' | 'active' | 'inactive')}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        >
          <option value="all">All Status</option>
          <option value="active">Currently Using</option>
          <option value="inactive">Not Using</option>
        </select>
      </div>

      {/* Products Grid */}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-xl">
          <p className="text-gray-600 dark:text-gray-400 mb-4">No products found</p>
          {products.length === 0 && (
            <button
              onClick={onAddProduct}
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm hover:shadow-md"
            >
              <Plus className="h-5 w-5" />
              Add your first product
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProducts.map(product => (
            <div
              key={product.id}
              className={`rounded-xl p-4 border-2 transition-all hover:shadow-md cursor-pointer ${
                product.currentlyUsing
                  ? 'bg-white dark:bg-gray-800 border-blue-200 dark:border-blue-800 hover:border-blue-300 dark:hover:border-blue-700'
                  : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 opacity-75'
              }`}
              onClick={() => onEditProduct(product)}
            >
              {/* Product Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100 truncate">{product.name}</h4>
                  {product.brand && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">{product.brand}</p>
                  )}
                </div>
                {product.currentlyUsing && (
                  <div className="flex-shrink-0 ml-2">
                    <span className="inline-block px-2 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-full">
                      Active
                    </span>
                  </div>
                )}
              </div>

              {/* Category & Type */}
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded">
                  {formatCategory(product.category)}
                </span>
                {product.productType && (
                  <span className="text-xs text-gray-600 dark:text-gray-400">{product.productType}</span>
                )}
              </div>

              {/* Usage Time */}
              <div className="flex items-center gap-1 mb-3">
                {product.usageTime.map(time => (
                  <span
                    key={time}
                    className={`text-xs px-2 py-1 rounded ${
                      time === 'AM'
                        ? 'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300'
                        : time === 'PM'
                        ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300'
                        : 'bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300'
                    }`}
                  >
                    {time}
                  </span>
                ))}
              </div>

              {/* Rating */}
              {product.rating && (
                <div className="flex items-center gap-1 mb-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${
                        i < (product.rating ?? 0)
                          ? 'text-yellow-500 fill-yellow-500'
                          : 'text-gray-300 dark:text-gray-600'
                      }`}
                    />
                  ))}
                </div>
              )}

              {/* Expiry Warning */}
              {isExpired(product.expiryDate) ? (
                <div className="flex items-center gap-2 p-2 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded text-xs text-red-700 dark:text-red-300 mb-2">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <span>Expired</span>
                </div>
              ) : isExpiringSoon(product.expiryDate) ? (
                <div className="flex items-center gap-2 p-2 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded text-xs text-amber-700 dark:text-amber-300 mb-2">
                  <Calendar className="h-4 w-4 flex-shrink-0" />
                  <span>Expiring soon</span>
                </div>
              ) : null}

              {/* Price & Size */}
              <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
                {product.price && (
                  <div className="flex items-center gap-1">
                    <ShoppingBag className="h-3 w-3" />
                    <span>${product.price.toFixed(2)}</span>
                  </div>
                )}
                {product.size && <span>{product.size}</span>}
              </div>

              {/* Repurchase Tag */}
              {product.repurchase && (
                <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                  <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                    ⭐ Would Repurchase
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Summary Stats */}
      {products.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{products.length}</p>
            <p className="text-xs text-gray-600 dark:text-gray-400">Total Products</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {products.filter(p => p.currentlyUsing).length}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400">Currently Using</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
              {products.filter(p => p.rating && p.rating >= 4).length}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400">4+ Stars</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {products.filter(p => p.repurchase).length}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400">Would Repurchase</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductsLibrary;
