import React, { useState, useEffect, useRef, useMemo } from 'react';
import { logger } from '../services/logger';

import { useAppStore } from '../stores/useAppStore';
import {
  useActiveShoppingList,
  useShoppingItems,
  useCreateShoppingItem,
  useUpdateShoppingItem,
  useDeleteShoppingItem,
  useToggleShoppingItem,
} from '../hooks/useShoppingQuery';
import {
  usePantryItemsQuery,
  useCreatePantryItemMutation,
  useUpdatePantryItemMutation,
  useDeletePantryItemMutation,
} from '../mealPlanning/hooks/useMealPlanningQuery';
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
  Camera,
  Send,
  Settings,
  Globe,
  Building,
  Navigation,
  Receipt,
} from 'lucide-react';
import { format, isToday, isThisWeek, isThisMonth, differenceInCalendarDays } from 'date-fns';

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
  assignedStore?: string; // Store ID where this item should be bought
  bestStores?: string[]; // Ordered list of best stores for this item
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
  coordinates?: {
    lat: number;
    lng: number;
  };
  preferences: {
    priceRating: 1 | 2 | 3 | 4 | 5; // 1 = expensive, 5 = cheap
    qualityRating: 1 | 2 | 3 | 4 | 5; // 1 = poor, 5 = excellent
    cleanlinessRating: 1 | 2 | 3 | 4 | 5;
    serviceRating: 1 | 2 | 3 | 4 | 5;
    overallRating: 1 | 2 | 3 | 4 | 5;
  };
  specialties: string[];
  bestFor: string[];
  avgPrices: { [itemName: string]: number };
  distance?: number;
  lastVisited?: Date;
  favorite: boolean;
  hours?: {
    [day: string]: { open: string; close: string; } | null;
  };
  hasDelivery?: boolean;
  hasPickup?: boolean;
  deliveryFee?: number;
}

interface ShoppingList {
  id: string;
  name: string;
  description?: string;
  type: 'master' | 'store-specific' | 'shared' | 'recipe-based';
  color: string;
  icon?: string;
  storeId?: string;
  totalEstimatedCost?: number;
  totalActualCost?: number;
  items: ShoppingItem[];
  createdAt: Date;
  updatedAt: Date;
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

const STORE_TYPES = {
  grocery: '🏪',
  wholesale: '🏬', 
  specialty: '🏫',
  organic: '🌱',
  international: '🌍',
  pharmacy: '💊'
};

export default function ShoppingSmart() {
  // React Query hooks for shopping data
  const { activeListId, isLoading: isLoadingList, ensureActiveList } = useActiveShoppingList();
  const { data: shoppingItemsData, isLoading: isLoadingItems } = useShoppingItems(activeListId);
  const createItemMutation = useCreateShoppingItem();
  const updateItemMutation = useUpdateShoppingItem();
  const deleteItemMutation = useDeleteShoppingItem();
  const toggleItemMutation = useToggleShoppingItem();

  // Map React Query data to component format
  const shoppingItems = useMemo(() => {
    if (!shoppingItemsData) return [];
    return shoppingItemsData.map((item) => ({
      id: item.id ?? '',
      name: item.name,
      quantity: item.quantity ?? 1,
      unit: item.unit ?? undefined,
      category: (item.category as ShoppingItem['category']) ?? 'other',
      subcategory: item.subcategory ?? undefined,
      priority: (item.priority as ShoppingItem['priority']) ?? 'medium',
      purchased: item.is_purchased ?? false,
      estimatedPrice: item.estimated_price !== undefined ? Number(item.estimated_price) : undefined,
      price: item.actual_price !== undefined ? Number(item.actual_price) : undefined,
      tags: item.tags ?? [],
      assignedStore: item.assigned_store ?? undefined,
      bestStores: item.best_stores ?? [],
      notes: item.notes ?? undefined,
      createdAt: new Date(item.created_at ?? Date.now()),
      updatedAt: new Date(item.updated_at ?? Date.now()),
    }));
  }, [shoppingItemsData]);

  // React Query hooks for pantry data
  const { data: pantryItems = [], isLoading: pantryLoading } = usePantryItemsQuery();
  const createPantryItemMutation = useCreatePantryItemMutation();
  const updatePantryItemMutation = useUpdatePantryItemMutation();
  const deletePantryItemMutation = useDeletePantryItemMutation();

  const shoppingLoading = isLoadingList || isLoadingItems || pantryLoading;

  // Get other store data that hasn't been migrated yet
  const { showGlobalToast, addFinancialTransaction, financialAccounts } = useAppStore();

  // Ensure active shopping list exists on mount
  useEffect(() => {
    if (!isLoadingList && !activeListId) {
      ensureActiveList().catch((error) => {
        logger.error('ShoppingSmart', 'Failed to create shopping list:', error);
      });
    }
  }, [isLoadingList, activeListId, ensureActiveList]);

  // Wrapper functions to maintain same API as Zustand store
  const addShoppingItem = async (item: Omit<ShoppingItem, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!activeListId) {
      const list = await ensureActiveList();
      const listId = list.id ?? '';
      return createItemMutation.mutateAsync({
        listId,
        item: {
          name: item.name,
          quantity: item.quantity,
          unit: item.unit ?? null,
          category: item.category ?? null,
          subcategory: item.subcategory ?? null,
          priority: item.priority ?? 'medium',
          estimated_price: item.estimatedPrice ?? null,
          actual_price: item.price ?? null,
          tags: item.tags ?? [],
          assigned_store: item.assignedStore ?? null,
          best_stores: item.bestStores ?? [],
          notes: item.notes ?? null,
          is_purchased: item.purchased ?? false,
        },
      });
    }

    return createItemMutation.mutateAsync({
      listId: activeListId,
      item: {
        name: item.name,
        quantity: item.quantity,
        unit: item.unit ?? null,
        category: item.category ?? null,
        subcategory: item.subcategory ?? null,
        priority: item.priority ?? 'medium',
        estimated_price: item.estimatedPrice ?? null,
        actual_price: item.price ?? null,
        tags: item.tags ?? [],
        assigned_store: item.assignedStore ?? null,
        best_stores: item.bestStores ?? [],
        notes: item.notes ?? null,
        is_purchased: item.purchased ?? false,
      },
    });
  };

  const updateShoppingItem = (itemId: string, updates: Partial<ShoppingItem>) => {
    return updateItemMutation.mutateAsync({
      itemId,
      updates: {
        name: updates.name,
        quantity: updates.quantity,
        unit: updates.unit,
        category: updates.category,
        subcategory: updates.subcategory,
        priority: updates.priority,
        estimated_price: updates.estimatedPrice,
        actual_price: updates.price,
        tags: updates.tags,
        assigned_store: updates.assignedStore,
        best_stores: updates.bestStores,
        notes: updates.notes,
        is_purchased: updates.purchased,
      },
    });
  };

  const deleteShoppingItem = (itemId: string) => {
    return deleteItemMutation.mutateAsync(itemId);
  };

  const toggleShoppingItem = (itemId: string) => {
    const item = shoppingItems.find((i) => i.id === itemId);
    if (!item) return Promise.resolve();
    return toggleItemMutation.mutateAsync({
      itemId,
      currentStatus: item.purchased,
    });
  };

  // Sample stores with ratings and preferences
  const [stores] = useState<Store[]>([
    {
      id: 'costco',
      name: 'Costco',
      type: 'wholesale',
      address: '123 Warehouse Ave',
      phone: '(555) 123-4567',
      color: '#1e40af',
      coordinates: { lat: 37.7749, lng: -122.4194 },
      preferences: {
        priceRating: 5, // Very cheap for bulk
        qualityRating: 4, // Good quality
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
        priceRating: 2, // Expensive
        qualityRating: 5, // Excellent quality
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
        priceRating: 4, // Good prices for specialty items
        qualityRating: 4,
        cleanlinessRating: 3,
        serviceRating: 5, // Excellent personal service
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
        priceRating: 4, // Good value
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
  ]);

  // Use global shopping items as master list
  const masterList = shoppingItems;

  // Store-specific lists (auto-generated from master list)
  const [storeLists, setStoreLists] = useState<ShoppingList[]>([]);

  const [activeView, setActiveView] = useState<'master' | 'stores' | 'distribute' | 'pantry'>('master');
  const [showAddItem, setShowAddItem] = useState(false);
  const [showEditItem, setShowEditItem] = useState(false);
  const [editingItem, setEditingItem] = useState<ShoppingItem | null>(null);
  const [showStorePrefs, setShowStorePrefs] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStores, setSelectedStores] = useState<string[]>([]);
  const [distributionStrategy, setDistributionStrategy] = useState<'price' | 'quality' | 'convenience' | 'mixed'>('mixed');

  const [newItem, setNewItem] = useState({
    name: '',
    quantity: 1,
    unit: 'pcs',
    category: 'other' as const,
    priority: 'medium' as const,
    estimatedPrice: '',
    brand: '',
    notes: '',
    preferredStore: '' // New field for manual store preference
  });

  const [editItem, setEditItem] = useState({
    name: '',
    quantity: 1,
    unit: 'pcs',
    category: 'other' as const,
    priority: 'medium' as const,
    estimatedPrice: '',
    brand: '',
    notes: '',
    preferredStore: ''
  });

  // Voice recognition state
  const [isListening, setIsListening] = useState(false);
  
  // Barcode scanning state
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const [barcodeResult, setBarcodeResult] = useState<string | null>(null);
  const [captureMessage, setCaptureMessage] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const barcodeDetectorRef = useRef<any>(null);
  const [isScanning, setIsScanning] = useState(false);
  
  // Location-based suggestions
  const [userLocation, setUserLocation] = useState<{lat: number; lng: number} | null>(null);
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);
  const [selectedItemForSuggestions, setSelectedItemForSuggestions] = useState<ShoppingItem | null>(null);
  // Pantry modal state
  const [showAddPantry, setShowAddPantry] = useState(false);
  const [pantryForm, setPantryForm] = useState<{ name: string; quantity: string; unit: string; category: ShoppingItem['category']; expiration: string }>({ name: '', quantity: '1', unit: '', category: 'pantry', expiration: '' });
  const [pantryFormLocation, setPantryFormLocation] = useState('')
  const [pantryFormThreshold, setPantryFormThreshold] = useState('')
  const [pantryFilter, setPantryFilter] = useState<'all' | 'expired' | 'soon' | 'low'>('all')
  const [pantrySort, setPantrySort] = useState<'expiry' | 'name'>('expiry')
  const [editingPantryId, setEditingPantryId] = useState<string | null>(null)
  const [editPantry, setEditPantry] = useState<{ qty: string; unit: string; exp: string; low: boolean; threshold: string }>({ qty: '0', unit: '', exp: '', low: false, threshold: '' })
  const [replenishId, setReplenishId] = useState<string | null>(null)
  const [replenishTarget, setReplenishTarget] = useState<string>('')
  // Receipt scanning (image OCR via experimental TextDetector)
  const [showScanReceipt, setShowScanReceipt] = useState(false)
  const [receiptImageUrl, setReceiptImageUrl] = useState<string | null>(null)
  const [receiptText, setReceiptText] = useState('')
  const receiptVideoRef = useRef<HTMLVideoElement | null>(null)
  const [receiptCameraOn, setReceiptCameraOn] = useState(false)
  const [receiptCameraMsg, setReceiptCameraMsg] = useState<string | null>(null)
  // Cropping/snippet state
  const receiptImgRef = useRef<HTMLImageElement | null>(null)
  const [cropEnabled, setCropEnabled] = useState(false)
  const [cropStart, setCropStart] = useState<{x:number;y:number}|null>(null)
  const [cropEnd, setCropEnd] = useState<{x:number;y:number}|null>(null)
  const [isCropping, setIsCropping] = useState(false)
  // Receipt metadata extracted from full text
  const [receiptMeta, setReceiptMeta] = useState<{ merchant?: string; address?: string; date?: string; time?: string; subtotal?: number; tax?: number; total?: number; payment?: string }>({})
  const [receiptOcrLoading, setReceiptOcrLoading] = useState(false)
  type ParsedReceiptItem = {
    id: string;
    name: string;
    quantity: number;
    selected: boolean;
    category: ShoppingItem['category'];
    threshold: string;
    price?: number; // total line price or unit price if multi-buy detected
    size?: string;  // e.g., 12 oz, 1 lb, 16 ct
  }
  const [parsedReceipt, setParsedReceipt] = useState<ParsedReceiptItem[]>([])
  const [receiptSelectAll, setReceiptSelectAll] = useState(false)
  const [receiptBulkCategory, setReceiptBulkCategory] = useState<ShoppingItem['category']>('pantry')
  const [receiptBulkThreshold, setReceiptBulkThreshold] = useState('')
  const [receiptViewMode, setReceiptViewMode] = useState<'table' | 'pretty'>('pretty')

  const pantrySortedFiltered = React.useMemo(() => {
    let items = [...pantryItems]
    const now = new Date()
    if (pantryFilter === 'expired') items = items.filter(p => p.expirationDate && p.expirationDate.getTime() < now.getTime())
    if (pantryFilter === 'soon') items = items.filter(p => p.expirationDate && differenceInCalendarDays(p.expirationDate, now) <= 7 && differenceInCalendarDays(p.expirationDate, now) >= 0)
    if (pantryFilter === 'low') items = items.filter(p => p.isLowStock)
    if (pantrySort === 'expiry') items.sort((a,b) => {
      const ax = a.expirationDate ? a.expirationDate.getTime() : Infinity
      const bx = b.expirationDate ? b.expirationDate.getTime() : Infinity
      return ax - bx
    })
    if (pantrySort === 'name') items.sort((a,b) => a.name.localeCompare(b.name))
    return items
  }, [pantryItems, pantryFilter, pantrySort])

  // Heuristic parser to extract item lines from receipt text with auto-categorization
  function parseReceiptToItems(text: string) {
    const lines = text
      .split(/\r?\n/)
      .map(l => l.trim())
      .filter(Boolean)
    const skip = /^(subtotal|sub\s*total|item\s*count|balance|tax|total|change|cash|visa|mastercard|amex|debit|credit|thank|thanks|store|merchant|date|time|auth|approval|card|aid|tvr|tac|entry|ref|inv|order|sales\s*tax)\b/i
    const trailPrice = /(?:\$\s*)?(\d{1,3}(?:[\.,]\d{3})*(?:[\.,]\d{2})|\d+(?:[\.,]\d{2}))/
    const priceAtEnd = new RegExp(`${trailPrice.source}$`)
    const qtyPrefix = /^(\d+)\s*[x×]\s+/i
    const qtySuffix = /\s*[x×]\s*(\d+)$/i
    const multiFor = /(\d+)\s*(?:for|\/@|\/|@)\s*\$?\s*(\d+(?:[\.,]\d{2})?)/i // 2 for 5.00, 3/$10, 2@5.00
    const sizeToken = /(\d+(?:[\.,]\d+)?\s*(?:oz|fl\s*oz|lb|lbs|g|kg|ml|l|ct|count|pack|pk|ea|btl|bottle|jar|can))\b/i
    const items: ParsedReceiptItem[] = []
    for (let raw of lines) {
      if (skip.test(raw)) continue
      // Remove obvious headers/footers
      if (/^\*{3,}|^-{3,}|_{3,}$/.test(raw)) continue
      let price: number | undefined
      let qty = 1
      // trailing price
      const pe = raw.match(priceAtEnd)
      if (pe) {
        const val = pe[1].replace(/,/g,'.')
        price = Number(val)
        raw = raw.slice(0, pe.index).trim()
      }
      // multi-buy formats
      const mf = raw.match(multiFor)
      if (mf) {
        const count = Number(mf[1]) || 1
        const total = Number(String(mf[2]).replace(/,/g,'.')) || undefined
        qty = count
        if (total && count > 0) price = Number((total / count).toFixed(2))
        raw = raw.replace(multiFor, '').trim()
      }
      // explicit qty x prefix/suffix
      const pre = raw.match(qtyPrefix)
      if (pre) { qty = Math.max(1, Number(pre[1]) || 1); raw = raw.replace(qtyPrefix, '') }
      const suf = raw.match(qtySuffix)
      if (suf) { qty = Math.max(1, Number(suf[1]) || qty); raw = raw.replace(qtySuffix, '') }
      // remove leading numeric codes (PLU/SKU)
      raw = raw.replace(/^(?:plu|sku|upc|#)?\s*\d{5,}\s*/i, '').trim()
      // size token
      let size: string | undefined
      const sm = raw.match(sizeToken)
      if (sm) { size = sm[1].replace(/\s+/g,' ').toLowerCase(); raw = raw.replace(sizeToken, '').trim() }
      // clean name
      let name = raw.replace(/\s{2,}/g,' ').trim()
      if (!name || name.length < 2) continue
      if (items.some(i => i.name.toLowerCase() === name.toLowerCase())) continue
      const category = categorizeName(name)
      items.push({ id: Math.random().toString(36).slice(2, 10), name, quantity: qty, selected: true, category, threshold: '', price, size })
    }
    setParsedReceipt(items)
  }

  // Extracts merchant, date/time, totals, payment method from full OCR text
  function parseReceiptMeta(text: string) {
    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean)
    const meta: { merchant?: string; address?: string; date?: string; time?: string; subtotal?: number; tax?: number; total?: number; payment?: string } = {}
    // Merchant: first non-empty alpha line
    const merchantLine = lines.find(l => /[A-Za-z]/.test(l) && !/(receipt|invoice|order|store|merchant|thank)/i.test(l))
    if (merchantLine) meta.merchant = merchantLine
    // Address: line with street or city, state zip
    const addressLine = lines.find(l => /(\d+\s+\w+\s+(st|ave|rd|blvd|dr|ct)\b|,\s*[A-Z]{2}\s*\d{5})/i.test(l))
    if (addressLine) meta.address = addressLine
    // Date and time
    const dateMatch = text.match(/(\d{4}[\/-]\d{1,2}[\/-]\d{1,2}|\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4})/)
    const timeMatch = text.match(/\b(\d{1,2}:\d{2}(?::\d{2})?\s*(?:AM|PM)?)\b/i)
    if (dateMatch) meta.date = dateMatch[1]
    if (timeMatch) meta.time = timeMatch[1]
    // Totals
    const money = (s: string) => {
      const m = s.match(/(\d{1,3}(?:[\.,]\d{3})*(?:[\.,]\d{2})|\d+(?:[\.,]\d{2}))/)
      if (!m) return undefined
      return Number(m[1].replace(/,/g,'.'))
    }
    const subLine = lines.find(l => /sub\s*total/i.test(l)) || lines.find(l => /^subtotal/i.test(l))
    const taxLine = lines.find(l => /tax/i.test(l))
    // Prefer a line that starts with total
    const totalLine = lines.find(l => /^total\b/i.test(l)) || lines.reverse().find(l => /total/i.test(l))
    if (subLine) meta.subtotal = money(subLine)
    if (taxLine) meta.tax = money(taxLine)
    if (totalLine) meta.total = money(totalLine)
    // Payment
    const payLine = lines.find(l => /(visa|mastercard|amex|debit|credit|cash)/i.test(l))
    if (payLine) meta.payment = payLine
    return meta
  }

  const receiptCategorySummary = React.useMemo(() => {
    const summary: Record<string, { count: number; qty: number; est: number }> = {}
    let estSubtotal = 0
    for (const it of parsedReceipt) {
      const key = it.category
      if (!summary[key]) summary[key] = { count: 0, qty: 0, est: 0 }
      summary[key].count += 1
      summary[key].qty += it.quantity
      if (typeof it.price === 'number') {
        const line = it.price * it.quantity
        summary[key].est += line
        estSubtotal += line
      }
    }
    return { summary, estSubtotal }
  }, [parsedReceipt])

  function categorizeName(name: string): ShoppingItem['category'] {
    const n = name.toLowerCase()
    const any = (arr: string[]) => arr.some(k => n.includes(k))
    if (any(['banana','apple','onion','tomato','lettuce','spinach','greens','carrot','cucumber','pepper','avocado','broccoli','cauliflower','corn','scallion','garlic','ginger','herb'])) return 'produce'
    if (any(['milk','yogurt','butter','cheese','cream','half and half'])) return 'dairy'
    if (any(['chicken','beef','pork','turkey','steak','ground beef','sausage','bacon','ham','fish','salmon','shrimp','tuna'])) return 'meat'
    if (any(['bread','bagel','bun','tortilla','roll','croissant','baguette'])) return 'bakery'
    if (any(['frozen','ice cream','frozen pizza','frozen peas','frozen corn'])) return 'frozen'
    if (any(['deli','salami','prosciutto','sliced','cold cut'])) return 'deli'
    if (any(['soap','detergent','paper towel','toilet paper','cleaner','bleach','foil','wrap','ziplock','bag'])) return 'household'
    if (any(['shampoo','toothpaste','toothbrush','deodorant','razor','lotion'])) return 'personal'
    if (any(['battery','charger','usb','cable'])) return 'electronics'
    if (any(['rice','pasta','noodle','flour','sugar','salt','oil','olive','vinegar','sauce','ketchup','mustard','mayo','beans','lentil','cereal','granola','oats','oatmeal','spice','seasoning','broth','stock','can'])) return 'pantry'
    return 'other'
  }

  // Auto-populate distribute tab when master list changes
  useEffect(() => {
    if (shoppingItems.length > 0) {
      distributeItemsToStores();
    }
  }, [shoppingItems]);

  // Smart distribution algorithm - now analyzes master list to determine optimal stores
  const distributeItemsToStores = () => {
    const unpurchasedItems = shoppingItems.filter(item => !item.purchased);
    if (unpurchasedItems.length === 0) {
      setStoreLists([]);
      setActiveView('stores');
      return;
    }

    // Step 1: Determine which stores are needed based on items
    const storeScores = new Map<string, number>();
    const storeItems = new Map<string, ShoppingItem[]>();

    // Initialize store collections
    stores.forEach(store => {
      storeItems.set(store.id, []);
      storeScores.set(store.id, 0);
    });

    // Step 2: Assign each item to its best store(s) and calculate store scores
    unpurchasedItems.forEach(item => {
      // If user has a preferred store, assign it there
      if (item.assignedStore) {
        const storeItemsList = storeItems.get(item.assignedStore) || [];
        storeItemsList.push({ ...item, assignedStore: item.assignedStore });
        storeItems.set(item.assignedStore, storeItemsList);
        storeScores.set(item.assignedStore, (storeScores.get(item.assignedStore) || 0) + 1);
        return;
      }

      // Otherwise, find best store based on strategy
      const bestStoreId = findBestStoreForItem(item);
      if (bestStoreId) {
        const storeItemsList = storeItems.get(bestStoreId) || [];
        storeItemsList.push({ ...item, assignedStore: bestStoreId });
        storeItems.set(bestStoreId, storeItemsList);
        storeScores.set(bestStoreId, (storeScores.get(bestStoreId) || 0) + 1);
      }
    });

    // Step 3: Create store lists only for stores that have items
    const newStoreLists: ShoppingList[] = [];
    
    storeItems.forEach((items, storeId) => {
      if (items.length === 0) return;
      
      const store = stores.find(s => s.id === storeId);
      if (!store) return;

      const totalCost = items.reduce((sum, item) => sum + (item.estimatedPrice || 0), 0);
      
      newStoreLists.push({
        id: `store-${storeId}`,
        name: store.name,
        description: `${items.length} items • $${totalCost.toFixed(2)} • ${store.distance}mi`,
        type: 'store-specific',
        color: store.color,
        storeId: storeId,
        items: items,
        totalEstimatedCost: totalCost,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    });

    // Sort by number of items (most items first) or total cost
    newStoreLists.sort((a, b) => {
      if (distributionStrategy === 'price') {
        return (a.totalEstimatedCost || 0) - (b.totalEstimatedCost || 0); // Cheapest first
      }
      return b.items.length - a.items.length; // Most items first
    });

    setStoreLists(newStoreLists);
    setActiveView('stores');
  };

  // Find the best store for an item based on current strategy
  const findBestStoreForItem = (item: ShoppingItem): string | null => {
    let bestStoreId: string | null = null;
    let bestScore = -1;

    stores.forEach(store => {
      let score = 0;

      switch (distributionStrategy) {
        case 'price':
          // Prioritize stores with good price ratings and known low prices for this item
          score = store.preferences.priceRating * 2;
          if (store.avgPrices[item.name]) {
            score += 3; // Bonus for having price data
          }
          if (store.bestFor.includes(item.category)) {
            score += 2;
          }
          break;

        case 'quality':
          // Prioritize quality and specialty matches
          score = store.preferences.qualityRating * 2;
          if (item.nutritionInfo?.organic && store.specialties.includes('organic')) {
            score += 4; // Big bonus for organic matches
          }
          if (store.bestFor.includes(item.category)) {
            score += 3;
          }
          break;

        case 'convenience':
          // Prioritize nearby stores
          score = Math.max(0, 6 - (store.distance || 5)); // Closer = higher score
          if (store.bestFor.includes(item.category)) {
            score += 2;
          }
          break;

        case 'mixed':
        default:
          // Balanced approach
          const priceScore = store.preferences.priceRating * 0.3;
          const qualityScore = store.preferences.qualityRating * 0.25;
          const convenienceScore = Math.max(0, 6 - (store.distance || 5)) * 0.2;
          
          let specialtyScore = 0;
          if (item.bestStores?.includes(store.id)) {
            specialtyScore = 2;
          } else if (store.bestFor.includes(item.category)) {
            specialtyScore = 1.5;
          } else if (item.nutritionInfo?.organic && store.specialties.includes('organic')) {
            specialtyScore = 1.8;
          }
          specialtyScore *= 0.25;

          score = priceScore + qualityScore + convenienceScore + specialtyScore;
          break;
      }

      // Bonus for user's favorite stores
      if (store.favorite) {
        score += 0.5;
      }

      // Check if this is the best store so far
      if (score > bestScore) {
        bestScore = score;
        bestStoreId = store.id;
      }
    });

    return bestStoreId;
  };

  // Voice recognition
  const startVoiceInput = () => {
    if ('webkitSpeechRecognition' in window) {
      const recognition = new (window as any).webkitSpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      setIsListening(true);
      
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setNewItem(prev => ({ ...prev, name: transcript }));
        setShowAddItem(true);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    }
  };

  // Barcode scanning functionality
  const startBarcodeScanning = async () => {
    setShowBarcodeScanner(true);
    setIsScanning(true);
    setBarcodeResult(null);
    setCaptureMessage(null);

    try {
      // Check if the browser supports the Barcode Detection API
      if ('BarcodeDetector' in window) {
        // Build a safe list of formats supported by this browser
        const desired = ['code_128','code-128','code_39','code-39','ean_13','ean-13','ean_8','ean-8','upc_a','upc-a','upc_e','upc-e']
        let formats: string[] | undefined = undefined
        try {
          const supported: string[] = typeof (window as any).BarcodeDetector.getSupportedFormats === 'function'
            ? await (window as any).BarcodeDetector.getSupportedFormats()
            : []
          if (Array.isArray(supported) && supported.length) {
            const supportedSet = new Set(supported)
            formats = desired.filter(f => supportedSet.has(f))
          }
        } catch {}
        const detectorOpts = formats && formats.length ? { formats } : undefined
        const barcodeDetector = new (window as any).BarcodeDetector(detectorOpts)
        barcodeDetectorRef.current = barcodeDetector

        // Get camera stream
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 1280 },
            height: { ideal: 720 }
          },
          audio: false,
        })

        // Attach stream to on-screen video element
        if (videoRef.current) {
          videoRef.current.srcObject = stream as any;
          try { await (videoRef.current as any).play(); } catch {}
        }

        // Start barcode detection
        const detectBarcodes = async () => {
          const video = videoRef.current as HTMLVideoElement | null;
          if (!video || !video.videoWidth || !video.videoHeight) {
            requestAnimationFrame(detectBarcodes);
            return;
          }

          try {
            const barcodes = await barcodeDetector.detect(video);
            if (barcodes.length > 0) {
              const barcode = barcodes[0].rawValue;
              setBarcodeResult(barcode);
              
              // Look up product info (mock implementation)
              const productInfo = await lookupProductByBarcode(barcode);
              
              setNewItem(prev => ({
                ...prev,
                name: productInfo.name,
                barcode: barcode,
                estimatedPrice: productInfo.price?.toString() || '',
                category: productInfo.category || 'other'
              }));
              
              setShowAddItem(true);
              stopBarcodeScanning();
              return;
            }
          } catch (error) {
            // Some browsers intermittently throw while the frame is not ready; keep trying
            // logger.warn('ShoppingSmart', 'Barcode detection error:', error);
          }

          if (isScanning) {
            requestAnimationFrame(detectBarcodes);
          }
        };

        if (videoRef.current) {
          videoRef.current.onloadedmetadata = () => detectBarcodes();
        }

        // Store stream reference for cleanup
        (window as any).currentBarcodeStream = stream;

      } else {
        // Fallback: Manual barcode input
        alert('Barcode scanning not supported on this device. Please enter barcode manually.');
        setShowBarcodeScanner(false);
        setIsScanning(false);
      }
    } catch (error) {
      logger.error('ShoppingSmart', 'Camera access error:', error);
      alert('Camera access denied. Please enable camera permissions to scan barcodes.');
      setShowBarcodeScanner(false);
      setIsScanning(false);
    }
  };

  const stopBarcodeScanning = () => {
    setIsScanning(false);
    setShowBarcodeScanner(false);
    setCaptureMessage(null);

    // Clean up camera stream and video
    if ((window as any).currentBarcodeStream) {
      const stream = (window as any).currentBarcodeStream;
      stream.getTracks().forEach((track: any) => track.stop());
      (window as any).currentBarcodeStream = null;
    }
    
    if (videoRef.current) {
      try { videoRef.current.pause(); } catch {}
      (videoRef.current as any).srcObject = null;
    }
  };

  // Manual capture while scanning (one-shot detection on current frame)
  const captureBarcodeNow = async () => {
    setCaptureMessage(null)
    try {
      const detector = barcodeDetectorRef.current
      const video = videoRef.current
      if (!detector || !video) return
      const result = await detector.detect(video)
      if (Array.isArray(result) && result.length > 0) {
        const code = result[0].rawValue
        setBarcodeResult(code)
        const productInfo = await lookupProductByBarcode(code)
        setNewItem(prev => ({
          ...prev,
          name: productInfo.name,
          barcode: code,
          estimatedPrice: productInfo.price?.toString() || '',
          category: productInfo.category || 'other'
        }))
        setShowAddItem(true)
        stopBarcodeScanning()
      } else {
        setCaptureMessage('No barcode found. Try moving closer, centering, and tapping Capture again.')
      }
    } catch (e) {
      setCaptureMessage('Capture failed. Please try again or enter manually.')
    }
  }

  // Real product lookup via server proxy -> Open Food Facts
  const lookupProductByBarcode = async (barcode: string): Promise<{
    name: string;
    price?: number;
    category?: string;
    brand?: string;
    image?: string;
  }> => {
    try {
      const resp = await fetch(`/api/barcode/lookup?code=${encodeURIComponent(barcode)}`, { headers: { Accept: 'application/json' } })
      if (!resp.ok) throw new Error('lookup failed')
      const data = await resp.json()
      return {
        name: data.name || `Product ${barcode.slice(-4)}`,
        price: typeof data.price === 'number' ? data.price : undefined,
        category: data.category || 'other',
        brand: data.brand || undefined,
        image: data.image || undefined,
      }
    } catch {
      return { name: `Product ${barcode.slice(-4)}`, category: 'other' }
    }
  }

  // Get user location for store suggestions
  const getUserLocation = async () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by this browser.');
      return;
    }

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject);
      });
      
      setUserLocation({
        lat: position.coords.latitude,
        lng: position.coords.longitude
      });
    } catch (error) {
      logger.error('ShoppingSmart', 'Error getting location:', error);
      alert('Unable to get your location. Please enable location services.');
    }
  };

  // Calculate distance between two coordinates
  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 3959; // Earth's radius in miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Find nearby stores for a specific item
  const findNearbyStoresForItem = (item: ShoppingItem) => {
    if (!userLocation) {
      getUserLocation();
      return [];
    }

    const storesWithDistance = stores.map(store => ({
      ...store,
      actualDistance: store.coordinates 
        ? calculateDistance(userLocation.lat, userLocation.lng, store.coordinates.lat, store.coordinates.lng)
        : store.distance || 999
    }));

    // Filter and sort by relevance and distance
    return storesWithDistance
      .filter(store => 
        store.bestFor.includes(item.category) || 
        store.avgPrices[item.name] ||
        store.specialties.some(specialty => 
          (item.nutritionInfo?.organic && specialty === 'organic') ||
          (item.category === 'produce' && specialty === 'organic')
        )
      )
      .sort((a, b) => {
        // Prioritize by relevance first, then distance
        const aRelevance = (a.bestFor.includes(item.category) ? 2 : 0) + 
                          (a.avgPrices[item.name] ? 3 : 0) + 
                          (a.favorite ? 1 : 0);
        const bRelevance = (b.bestFor.includes(item.category) ? 2 : 0) + 
                          (b.avgPrices[item.name] ? 3 : 0) + 
                          (b.favorite ? 1 : 0);
        
        if (aRelevance !== bRelevance) {
          return bRelevance - aRelevance;
        }
        
        return a.actualDistance - b.actualDistance;
      })
      .slice(0, 5); // Show top 5 suggestions
  };

  // Show store suggestions for an item
  const showStoreSuggestions = (item: ShoppingItem) => {
    setSelectedItemForSuggestions(item);
    setShowLocationSuggestions(true);
  };

  // Start editing an item
  const startEditItem = (item: ShoppingItem) => {
    setEditingItem(item);
    setEditItem({
      name: item.name,
      quantity: item.quantity,
      unit: item.unit || 'pcs',
      category: item.category,
      priority: item.priority,
      estimatedPrice: item.estimatedPrice?.toString() || '',
      brand: item.brand || '',
      notes: item.notes || '',
      preferredStore: item.assignedStore || ''
    });
    setShowEditItem(true);
  };

  // Update existing item
  const updateExistingItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem || !editItem.name.trim()) return;

    // Use preferred store if specified, otherwise use existing recommendations
    let bestStores: string[];
    if (editItem.preferredStore) {
      const smartRecommendation = smartRecommendStores(editItem.name, editItem.category);
      bestStores = [editItem.preferredStore, ...smartRecommendation.filter(id => id !== editItem.preferredStore)];
    } else {
      bestStores = editingItem.bestStores || smartRecommendStores(editItem.name, editItem.category);
    }

    const updatedData = {
      name: editItem.name,
      quantity: editItem.quantity,
      unit: editItem.unit,
      category: editItem.category,
      priority: editItem.priority,
      estimatedPrice: editItem.estimatedPrice ? parseFloat(editItem.estimatedPrice) : undefined,
      brand: editItem.brand || undefined,
      notes: editItem.notes || undefined,
      bestStores: bestStores,
      assignedStore: editItem.preferredStore || undefined,
      updatedAt: new Date()
    };

    updateShoppingItem(editingItem.id, updatedData);
    setShowEditItem(false);
    setEditingItem(null);
    setEditItem({
      name: '',
      quantity: 1,
      unit: 'pcs',
      category: 'other',
      priority: 'medium',
      estimatedPrice: '',
      brand: '',
      notes: '',
      preferredStore: ''
    });
  };

  // Add item to master list
  const addItemToMaster = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.name.trim()) return;

    // Use preferred store if specified, otherwise use AI recommendation
    let bestStores: string[];
    if (newItem.preferredStore) {
      // Put preferred store first, then add AI recommendations
      const smartRecommendation = smartRecommendStores(newItem.name, newItem.category);
      bestStores = [newItem.preferredStore, ...smartRecommendation.filter(id => id !== newItem.preferredStore)];
    } else {
      bestStores = smartRecommendStores(newItem.name, newItem.category);
    }

    const item = {
      name: newItem.name,
      quantity: newItem.quantity,
      unit: newItem.unit,
      category: newItem.category,
      priority: newItem.priority,
      purchased: false,
      estimatedPrice: newItem.estimatedPrice ? parseFloat(newItem.estimatedPrice) : undefined,
      brand: newItem.brand || undefined,
      notes: newItem.notes || undefined,
      barcode: barcodeResult || undefined,
      bestStores: bestStores,
      assignedStore: newItem.preferredStore || undefined, // Pre-assign if user has preference
    };

    addShoppingItem(item);
    setNewItem({
      name: '',
      quantity: 1,
      unit: 'pcs',
      category: 'other',
      priority: 'medium',
      estimatedPrice: '',
      brand: '',
      notes: '',
      preferredStore: ''
    });
    setBarcodeResult(null);
    setShowAddItem(false);
  };

  // Smart store recommendation algorithm
  const smartRecommendStores = (itemName: string, category: string): string[] => {
    return stores
      .filter(store => 
        store.bestFor.includes(category) || 
        store.avgPrices[itemName] ||
        (category === 'produce' && store.specialties.includes('organic'))
      )
      .sort((a, b) => {
        // Score based on multiple factors
        const scoreA = calculateStoreScore(a, category);
        const scoreB = calculateStoreScore(b, category);
        return scoreB - scoreA;
      })
      .map(store => store.id);
  };

  const calculateStoreScore = (store: Store, category: string): number => {
    let score = 0;
    
    // Best for category
    if (store.bestFor.includes(category)) score += 3;
    
    // Price rating (higher is better for affordability)
    score += store.preferences.priceRating * 0.5;
    
    // Quality rating
    score += store.preferences.qualityRating * 0.4;
    
    // Distance penalty (closer is better)
    score -= (store.distance || 5) * 0.2;
    
    // Specialty bonus
    if (store.specialties.length > 0) score += 0.5;
    
    // Favorite bonus
    if (store.favorite) score += 1;
    
    return score;
  };

  const filteredMasterItems = shoppingItems.filter(item =>
    searchQuery === '' || item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalMasterItems = shoppingItems.filter(item => !item.purchased).length;
  const totalEstimatedCost = shoppingItems.reduce((sum, item) => sum + (item.estimatedPrice || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl p-6 shadow-sm border">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Smart Shopping System</h1>
            <p className="text-gray-600">Master list + intelligent store distribution</p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={startBarcodeScanning}
              disabled={isScanning}
              className={`btn-secondary flex items-center space-x-2 ${isScanning ? 'opacity-50' : ''}`}
            >
              <Scan size={16} className={isScanning ? 'text-blue-500' : ''} />
              <span>{isScanning ? 'Scanning...' : 'Scan Barcode'}</span>
            </button>
            <button
              onClick={startVoiceInput}
              disabled={isListening}
              className={`btn-secondary flex items-center space-x-2 ${isListening ? 'opacity-50' : ''}`}
            >
              <Mic size={16} className={isListening ? 'text-red-500' : ''} />
              <span>{isListening ? 'Listening...' : 'Voice Add'}</span>
            </button>
            <button
              onClick={() => setShowAddItem(true)}
              className="btn-primary flex items-center space-x-2"
            >
              <Plus size={16} />
              <span>Add Item</span>
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center">
              <ShoppingBag className="h-8 w-8 text-blue-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-black">Master List</p>
                <p className="text-lg font-semibold text-black">{totalMasterItems} items</p>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center">
              <Store className="h-8 w-8 text-gray-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-black">Store Lists</p>
                <p className="text-lg font-semibold text-black">{storeLists.length} stores</p>
              </div>
            </div>
          </div>
          <div className="bg-purple-50 rounded-lg p-4">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-purple-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-black">Est. Total</p>
                <p className="text-lg font-semibold text-black">${totalEstimatedCost.toFixed(2)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white rounded-xl shadow-sm border">
        <div className="border-b">
          <div className="flex space-x-1 p-1">
            <button
              onClick={() => setActiveView('master')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeView === 'master'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-black hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center space-x-2">
                <FileText size={16} />
                <span>Master List</span>
                <span className="text-xs bg-gray-200 px-2 py-1 rounded-full">
                  {totalMasterItems}
                </span>
              </div>
            </button>
            <button
              onClick={() => setActiveView('distribute')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeView === 'distribute'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-black hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Shuffle size={16} />
                <span>Distribute</span>
              </div>
            </button>
            <button
              onClick={() => setActiveView('stores')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeView === 'stores'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-black hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Store size={16} />
                <span>Store Lists</span>
                <span className="text-xs bg-gray-200 px-2 py-1 rounded-full">
                  {storeLists.length}
                </span>
              </div>
            </button>
            <button
              onClick={() => setActiveView('pantry')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeView === 'pantry'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-black hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Package size={16} />
                <span>Pantry</span>
              </div>
            </button>
          </div>
        </div>

        {/* Master List View */}
        {activeView === 'master' && (
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  placeholder="Search master list..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <button
                onClick={() => setShowStorePrefs(true)}
                className="btn-secondary flex items-center space-x-2"
              >
                <Settings size={16} />
                <span>Store Preferences</span>
              </button>
            </div>

            <div className="space-y-2">
              {filteredMasterItems.map(item => (
                <MasterItemCard
                  key={item.id}
                  item={item}
                  stores={stores}
                  onToggle={() => {
                    toggleShoppingItem(item.id);
                  }}
                  onEdit={() => {
                    startEditItem(item);
                  }}
                  onDelete={() => {
                    deleteShoppingItem(item.id);
                  }}
                  onFindStores={() => showStoreSuggestions(item)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Distribution View */}
        {activeView === 'distribute' && (
          <div className="p-6">
            <div className="max-w-2xl mx-auto">
              <div className="text-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Smart Store Distribution
                </h3>
                <p className="text-gray-600">
                  AI will analyze your items and automatically assign them to the best stores
                </p>
              </div>

              <div className="space-y-6">
                {/* Current Master List Preview */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">Items to Distribute</h4>
                  {shoppingItems.filter(item => !item.purchased).length === 0 ? (
                    <p className="text-gray-500 text-sm">No items in master list to distribute</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {shoppingItems.filter(item => !item.purchased).slice(0, 6).map(item => (
                        <div key={item.id} className="flex items-center space-x-2 text-sm">
                          <span>{CATEGORY_ICONS[item.category]}</span>
                          <span className="text-gray-900">{item.name}</span>
                          {item.assignedStore && (
                            <span className="text-purple-600 text-xs">
                              (Preferred: {stores.find(s => s.id === item.assignedStore)?.name})
                            </span>
                          )}
                        </div>
                      ))}
                      {shoppingItems.filter(item => !item.purchased).length > 6 && (
                        <div className="text-xs text-gray-500 col-span-2 text-center">
                          +{shoppingItems.filter(item => !item.purchased).length - 6} more items
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Distribution Strategy */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Distribution Strategy
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      { value: 'price', label: 'Best Price', icon: DollarSign, desc: 'Minimize cost' },
                      { value: 'quality', label: 'Best Quality', icon: Award, desc: 'Premium items' },
                      { value: 'convenience', label: 'Convenience', icon: Navigation, desc: 'Nearby stores' },
                      { value: 'mixed', label: 'Balanced', icon: Target, desc: 'Best overall' }
                    ].map(strategy => (
                      <button
                        key={strategy.value}
                        onClick={() => setDistributionStrategy(strategy.value as any)}
                        className={`p-3 border-2 rounded-lg text-center transition-all ${
                          distributionStrategy === strategy.value
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-200 hover:border-gray-300 text-gray-700'
                        }`}
                      >
                        <strategy.icon size={20} className="mx-auto mb-1" />
                        <div className="text-sm font-medium">{strategy.label}</div>
                        <div className="text-xs text-gray-500">{strategy.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Available Stores Preview */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Available Stores
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {stores.map(store => (
                      <div key={store.id} className="p-3 border rounded-lg bg-white">
                        <div className="flex items-center space-x-2">
                          <span className="text-lg">{STORE_TYPES[store.type]}</span>
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900 text-sm">{store.name}</h4>
                            <div className="flex items-center space-x-2 text-xs text-gray-500">
                              <span>{store.distance}mi</span>
                              <div className="flex items-center">
                                {Array.from({ length: 5 }).map((_, i) => (
                                  <Star
                                    key={i}
                                    size={10}
                                    className={i < store.preferences.overallRating ? 'text-yellow-400 fill-current' : 'text-gray-300'}
                                  />
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Distribution Button */}
                <div className="text-center">
                  <button
                    onClick={distributeItemsToStores}
                    disabled={shoppingItems.filter(item => !item.purchased).length === 0}
                    className="btn-primary flex items-center space-x-2 mx-auto disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Zap size={16} />
                    <span>Auto-Distribute Items</span>
                    <ArrowRight size={16} />
                  </button>
                  <p className="text-xs text-gray-500 mt-2">
                    AI will create store-specific lists based on your strategy and item preferences
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Store Lists View */}
        {activeView === 'stores' && (
          <div className="p-4">
            {storeLists.length === 0 ? (
              <div className="text-center py-12">
                <Store className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No store lists yet</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Use the Distribution tab to organize your items by store
                </p>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {storeLists.map(list => (
                  <StoreListCard
                    key={list.id}
                    list={list}
                    store={stores.find(s => s.id === list.storeId)!}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Pantry View */}
      {activeView === 'pantry' && (
        <div className="bg-white rounded-xl shadow-sm border p-4 mt-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold">Pantry</h4>
            <div className="flex items-center gap-2">
              {/* Summary */}
              <span className="text-xs text-gray-600 hidden md:inline">
                {pantryItems.filter(p => p.isLowStock).length} low-stock • {pantryItems.filter(p => p.expirationDate && differenceInCalendarDays(p.expirationDate, new Date()) < 0).length} expired
              </span>
              {/* Bulk add low-stock */}
              <button
                type="button"
                className="px-3 py-1 rounded border border-gray-300 text-sm hover:bg-gray-50"
                title="Add all low-stock items to shopping list"
                onClick={async () => {
                  const lows = pantryItems.filter(p => p.isLowStock && (p.lowStockThreshold ?? 0) > 0)
                  for (const p of lows) {
                    const target = p.lowStockThreshold ?? 0
                    const need = Math.max(0, target - (p.quantity || 0)) || 1
                    await addShoppingItem({
                      name: p.name,
                      quantity: need,
                      unit: p.unit,
                      category: p.category,
                      subcategory: undefined,
                      priority: 'medium',
                      purchased: false,
                      price: undefined,
                      estimatedPrice: undefined,
                      aisle: undefined,
                      brand: undefined,
                      size: undefined,
                      notes: p.notes,
                      imageUrl: undefined,
                      nutritionInfo: undefined,
                      tags: ['from:pantry'],
                      addedBy: undefined,
                      purchasedAt: undefined,
                      purchasedBy: undefined,
                      assignedStore: undefined,
                      bestStores: [],
                    })
                  }
                  showGlobalToast?.(`Added ${lows.length} low-stock items to shopping`, 'success')
                }}
              >Add low-stock to Shopping</button>
              <button
                type="button"
                className="px-3 py-1 rounded border border-gray-300 text-sm hover:bg-gray-50"
                title="Move all expired items to shopping list"
                onClick={async () => {
                  const now = new Date()
                  const expired = pantryItems.filter(p => p.expirationDate && p.expirationDate.getTime() < now.getTime())
                  for (const p of expired) {
                    const qty = p.quantity && p.quantity > 0 ? p.quantity : 1
                    await addShoppingItem({
                      name: p.name,
                      quantity: qty,
                      unit: p.unit,
                      category: p.category,
                      subcategory: undefined,
                      priority: 'medium',
                      purchased: false,
                      price: undefined,
                      estimatedPrice: undefined,
                      aisle: undefined,
                      brand: undefined,
                      size: undefined,
                      notes: p.notes,
                      imageUrl: undefined,
                      nutritionInfo: undefined,
                      tags: ['from:pantry','reason:expired'],
                      addedBy: undefined,
                      purchasedAt: undefined,
                      purchasedBy: undefined,
                      assignedStore: undefined,
                      bestStores: [],
                    })
                  }
                  showGlobalToast?.(`Moved ${expired.length} expired items to shopping`, 'info')
                }}
              >Move expired to Shopping</button>
              {/* Export CSV */}
              <button
                type="button"
                className="px-3 py-1 rounded border border-gray-300 text-sm hover:bg-gray-50"
                title="Export pantry to CSV"
                onClick={() => {
                  const headers = ['Name','Quantity','Unit','Category','Expiration','LowStock','Threshold','Location']
                  const rows = pantryItems.map(p => [
                    p.name,
                    String(p.quantity ?? ''),
                    p.unit ?? '',
                    p.category,
                    p.expirationDate ? format(p.expirationDate, 'yyyy-MM-dd') : '',
                    p.isLowStock ? 'yes' : 'no',
                    p.lowStockThreshold != null ? String(p.lowStockThreshold) : '',
                    p.location ?? '',
                  ])
                  const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n')
                  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
                  const url = URL.createObjectURL(blob)
                  const a = document.createElement('a')
                  a.href = url
                  a.download = `pantry-${format(new Date(), 'yyyyMMdd-HHmmss')}.csv`
                  a.click()
                  URL.revokeObjectURL(url)
                }}
              >Export CSV</button>
              {/* Simple filters */}
              <select
                className="rounded border border-gray-300 px-2 py-1 text-sm"
                onChange={(e) => setPantryFilter(e.target.value as any)}
                defaultValue="all"
                title="Filter"
              >
                <option value="all">All</option>
                <option value="soon">Expiring soon</option>
                <option value="expired">Expired</option>
                <option value="low">Low stock</option>
              </select>
              <select
                className="rounded border border-gray-300 px-2 py-1 text-sm"
                onChange={(e) => setPantrySort(e.target.value as any)}
                defaultValue="expiry"
                title="Sort"
              >
                <option value="expiry">Sort by expiry</option>
                <option value="name">Sort by name</option>
              </select>
              <button onClick={() => setShowAddPantry(true)} className="btn-primary flex items-center space-x-2">
                <Plus size={16} />
                <span>Add Pantry Item</span>
              </button>
              <button onClick={() => setShowScanReceipt(true)} className="px-3 py-1 rounded border border-gray-300 text-sm hover:bg-gray-50 flex items-center gap-2" title="Scan receipt to auto-add items">
                <Receipt size={16} />
                <span>Scan Receipt</span>
              </button>
            </div>
          </div>

          {pantryItems.length === 0 ? (
            <p className="text-sm text-gray-500">No pantry items yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-600">
                    <th className="py-2 px-3">Item</th>
                    <th className="py-2 px-3">Qty</th>
                    <th className="py-2 px-3">Expires</th>
                    <th className="py-2 px-3">Status</th>
                    <th className="py-2 px-3">Low stock</th>
                    <th className="py-2 px-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pantrySortedFiltered.map((p) => {
                    const days = p.expirationDate ? differenceInCalendarDays(p.expirationDate, new Date()) : null
                    let status = '—'
                    let cls = 'text-gray-600'
                    if (days != null) {
                      if (days < 0) { status = 'Expired'; cls = 'text-rose-700' }
                      else if (days <= 7) { status = `Expires in ${days}d`; cls = 'text-amber-700' }
                      else { status = `Fresh (${days}d)`; cls = 'text-emerald-700' }
                    }
                    return (
                      <tr key={p.id} className="border-t">
                        <td className="py-2 px-3 font-medium text-gray-900">{p.name}</td>
                        <td className="py-2 px-3">
                          {editingPantryId === p.id ? (
                            <div className="flex items-center gap-2">
                              <input type="number" min={0} value={editPantry.qty} onChange={(e) => setEditPantry(s => ({ ...s, qty: e.target.value }))} className="w-20 rounded border border-gray-300 px-2 py-1" />
                              <input value={editPantry.unit} onChange={(e) => setEditPantry(s => ({ ...s, unit: e.target.value }))} className="w-20 rounded border border-gray-300 px-2 py-1" />
                            </div>
                          ) : (
                            <>{p.quantity} {p.unit || ''}</>
                          )}
                        </td>
                        <td className="py-2 px-3">
                          {editingPantryId === p.id ? (
                            <input type="date" value={editPantry.exp} onChange={(e) => setEditPantry(s => ({ ...s, exp: e.target.value }))} className="rounded border border-gray-300 px-2 py-1" />
                          ) : (
                            <>{p.expirationDate ? format(p.expirationDate, 'MMM d, yyyy') : '—'}</>
                          )}
                        </td>
                        <td className="py-2 px-3"><span className={cls}>{status}</span></td>
                        <td className="py-2 px-3">
                          {editingPantryId === p.id ? (
                            <div className="flex items-center gap-2">
                              <label className="inline-flex items-center gap-1 text-xs text-gray-700">
                                <input type="checkbox" checked={editPantry.low} onChange={(e) => setEditPantry(s => ({ ...s, low: e.target.checked }))} /> Low
                              </label>
                              <input type="number" min={0} placeholder="Threshold" value={editPantry.threshold} onChange={(e) => setEditPantry(s => ({ ...s, threshold: e.target.value }))} className="w-24 rounded border border-gray-300 px-2 py-1" />
                            </div>
                          ) : (
                            <span className={`text-xs ${p.isLowStock ? 'text-amber-700' : 'text-gray-500'}`}>{p.isLowStock ? `Low (≤ ${p.lowStockThreshold ?? '—'})` : 'OK'}</span>
                          )}
                        </td>
                        <td className="py-2 px-3 space-x-2">
                          {editingPantryId === p.id ? (
                            <>
                              <button className="px-2 py-1 text-xs rounded border border-gray-300 hover:bg-gray-50" onClick={async () => {
                                const qty = Number(editPantry.qty) || 0
                                const exp = editPantry.exp ? new Date(editPantry.exp) : undefined
                                await updatePantryItemMutation.mutateAsync({ itemId: p.id, updates: { quantity: qty, unit: editPantry.unit || undefined, expirationDate: exp, isLowStock: editPantry.low, lowStockThreshold: editPantry.threshold ? Number(editPantry.threshold) : undefined } })
                                setEditingPantryId(null)
                              }}>Save</button>
                              <button className="px-2 py-1 text-xs rounded border border-gray-300 hover:bg-gray-50" onClick={() => setEditingPantryId(null)}>Cancel</button>
                            </>
                          ) : (
                            <>
                              <button
                                className="px-2 py-1 text-xs rounded border border-gray-300 hover:bg-gray-50"
                                onClick={() => {
                                  setEditingPantryId(p.id)
                                  setEditPantry({ qty: String(p.quantity), unit: p.unit || '', exp: p.expirationDate ? format(p.expirationDate, 'yyyy-MM-dd') : '', low: !!p.isLowStock, threshold: p.lowStockThreshold ? String(p.lowStockThreshold) : '' })
                                }}
                              >Edit</button>
                              <button
                                className="px-2 py-1 text-xs rounded border border-gray-300 hover:bg-gray-50"
                                title="Replenish to target quantity"
                                onClick={() => { setReplenishId(p.id); setReplenishTarget(p.lowStockThreshold ? String(p.lowStockThreshold) : String(Math.max(p.quantity, 1))) }}
                              >Replenish</button>
                              <button
                                className="px-2 py-1 text-xs rounded border border-gray-300 hover:bg-gray-50"
                                onClick={() => {
                                  void addShoppingItem({
                                    name: p.name,
                                    quantity: (p.lowStockThreshold && p.quantity < p.lowStockThreshold) ? (p.lowStockThreshold - p.quantity) : p.quantity || 1,
                                    unit: p.unit,
                                    category: p.category,
                                    subcategory: undefined,
                                    priority: 'medium',
                                    purchased: false,
                                    price: undefined,
                                    estimatedPrice: undefined,
                                    aisle: undefined,
                                    brand: undefined,
                                    size: undefined,
                                    notes: p.notes,
                                    imageUrl: undefined,
                                    nutritionInfo: undefined,
                                    tags: ['from:pantry'],
                                    addedBy: undefined,
                                    purchasedAt: undefined,
                                    purchasedBy: undefined,
                                    assignedStore: undefined,
                                    bestStores: [],
                                  })
                                  showGlobalToast?.(`Added ${p.name} to shopping`, 'success')
                                }}
                              >Add to Shopping</button>
                              <button
                                className="px-2 py-1 text-xs rounded border border-gray-300 hover:bg-gray-50"
                                onClick={() => void deletePantryItemMutation.mutate(p.id)}
                              >Delete</button>
                            </>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {replenishId && (
            <div className="mt-3 flex items-center gap-2 text-sm">
              <span className="text-gray-700">Replenish to target quantity:</span>
              <input type="number" min={0} value={replenishTarget} onChange={(e) => setReplenishTarget(e.target.value)} className="w-28 rounded border border-gray-300 px-2 py-1" />
              <button
                className="px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-500"
                onClick={async () => {
                  const p = pantryItems.find(x => x.id === replenishId)
                  if (!p) { setReplenishId(null); return }
                  const target = Number(replenishTarget) || 0
                  const need = Math.max(0, target - (p.quantity || 0))
                  if (need <= 0) {
                    showGlobalToast?.('Already at or above target', 'info')
                    setReplenishId(null)
                    return
                  }
                  await addShoppingItem({
                    name: p.name,
                    quantity: need,
                    unit: p.unit,
                    category: p.category,
                    subcategory: undefined,
                    priority: 'medium',
                    purchased: false,
                    price: undefined,
                    estimatedPrice: undefined,
                    aisle: undefined,
                    brand: undefined,
                    size: undefined,
                    notes: p.notes,
                    imageUrl: undefined,
                    nutritionInfo: undefined,
                    tags: ['from:pantry','reason:replenish'],
                    addedBy: undefined,
                    purchasedAt: undefined,
                    purchasedBy: undefined,
                    assignedStore: undefined,
                    bestStores: [],
                  })
                  showGlobalToast?.(`Added ${need} ${p.unit || ''} of ${p.name} to shopping`, 'success')
                  setReplenishId(null)
                }}
              >Go</button>
              <button className="px-3 py-1 rounded border border-gray-300 hover:bg-gray-50" onClick={() => setReplenishId(null)}>Cancel</button>
            </div>
          )}
        </div>
      )}

      {/* Add Pantry Modal */}
      {showAddPantry && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold">Add Pantry Item</h3>
              <button onClick={() => setShowAddPantry(false)} className="p-2 hover:bg-gray-100 rounded-md"><X size={18} /></button>
            </div>
            <div className="grid gap-3 text-sm">
              <label className="grid gap-1">
                <span className="text-gray-700">Name</span>
                <input value={pantryForm.name} onChange={(e) => setPantryForm(s => ({ ...s, name: e.target.value }))} className="rounded border border-gray-300 px-2 py-1" />
              </label>
              <div className="grid grid-cols-3 gap-2">
                <label className="grid gap-1">
                  <span className="text-gray-700">Qty</span>
                  <input type="number" min={0} value={pantryForm.quantity} onChange={(e) => setPantryForm(s => ({ ...s, quantity: e.target.value }))} className="rounded border border-gray-300 px-2 py-1" />
                </label>
                <label className="grid gap-1">
                  <span className="text-gray-700">Unit</span>
                  <input value={pantryForm.unit} onChange={(e) => setPantryForm(s => ({ ...s, unit: e.target.value }))} className="rounded border border-gray-300 px-2 py-1" />
                </label>
                <label className="grid gap-1">
                  <span className="text-gray-700">Category</span>
                  <select value={pantryForm.category} onChange={(e) => setPantryForm(s => ({ ...s, category: e.target.value as any }))} className="rounded border border-gray-300 px-2 py-1">
                    <option value="produce">Produce</option>
                    <option value="dairy">Dairy</option>
                    <option value="meat">Meat</option>
                    <option value="pantry">Pantry</option>
                    <option value="other">Other</option>
                  </select>
                </label>
              </div>
              <label className="grid gap-1">
                <span className="text-gray-700">Expiration Date</span>
                <input type="date" value={pantryForm.expiration} onChange={(e) => setPantryForm(s => ({ ...s, expiration: e.target.value }))} className="rounded border border-gray-300 px-2 py-1" />
              </label>
              <div className="grid grid-cols-2 gap-2">
                <label className="grid gap-1">
                  <span className="text-gray-700">Location (optional)</span>
                  <input value={pantryFormLocation} onChange={(e) => setPantryFormLocation(e.target.value)} className="rounded border border-gray-300 px-2 py-1" />
                </label>
                <label className="grid gap-1">
                  <span className="text-gray-700">Low stock threshold</span>
                  <input type="number" min={0} value={pantryFormThreshold} onChange={(e) => setPantryFormThreshold(e.target.value)} className="rounded border border-gray-300 px-2 py-1" />
                </label>
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setShowAddPantry(false)} className="px-4 py-2 rounded border border-gray-300 hover:bg-gray-50">Cancel</button>
              <button
                className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-500"
                onClick={async () => {
                  const qty = Number(pantryForm.quantity) || 0
                  const exp = pantryForm.expiration ? new Date(pantryForm.expiration) : undefined
                  await createPantryItemMutation.mutateAsync({ name: pantryForm.name.trim(), quantity: qty, unit: pantryForm.unit.trim() || undefined, category: pantryForm.category, expirationDate: exp, location: pantryFormLocation || undefined, lowStockThreshold: pantryFormThreshold ? Number(pantryFormThreshold) : undefined, isLowStock: pantryFormThreshold ? qty <= Number(pantryFormThreshold) : undefined })
                  setPantryForm({ name: '', quantity: '1', unit: '', category: 'pantry', expiration: '' })
                  setPantryFormLocation('')
                  setPantryFormThreshold('')
                  setShowAddPantry(false)
                }}
              >Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Scan Receipt Modal */}
      {showScanReceipt && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold">Scan Receipt</h3>
              <button onClick={() => { setShowScanReceipt(false); setReceiptImageUrl(null); setReceiptText(''); setParsedReceipt([]) }} className="p-2 hover:bg-gray-100 rounded-md"><X size={18} /></button>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <div className="border rounded-lg p-3 min-h-[200px] flex items-center justify-center bg-gray-50 relative select-none">
                  {receiptImageUrl ? (
                    <div
                      className={`relative inline-block ${cropEnabled ? 'cursor-crosshair' : ''}`}
                      onMouseDown={(e) => {
                        if (!cropEnabled) return
                        setIsCropping(true)
                        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
                        setCropStart({ x: e.clientX - rect.left, y: e.clientY - rect.top })
                        setCropEnd(null)
                      }}
                      onMouseMove={(e) => {
                        if (!cropEnabled || !isCropping || !cropStart) return
                        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
                        setCropEnd({ x: e.clientX - rect.left, y: e.clientY - rect.top })
                      }}
                      onMouseUp={() => setIsCropping(false)}
                    >
                      <img ref={receiptImgRef} src={receiptImageUrl} alt="Receipt" className="max-h-64 object-contain" />
                      {cropEnabled && cropStart && cropEnd && (
                        <div
                          className="absolute border-2 border-amber-500 bg-amber-200/20"
                          style={{
                            left: Math.min(cropStart.x, cropEnd.x),
                            top: Math.min(cropStart.y, cropEnd.y),
                            width: Math.abs(cropEnd.x - cropStart.x),
                            height: Math.abs(cropEnd.y - cropStart.y),
                          }}
                        />
                      )}
                    </div>
                  ) : (
                    <span className="text-sm text-gray-500">Upload a receipt image</span>
                  )}
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={(e) => {
                      const f = e.target.files?.[0]
                      if (!f) return
                      const url = URL.createObjectURL(f)
                      setReceiptImageUrl(url)
                    }}
                  />
                  {!receiptCameraOn ? (
                    <button
                      type="button"
                      className="px-3 py-1 rounded border border-gray-300 text-sm hover:bg-gray-50"
                      onClick={async () => {
                        setReceiptCameraOn(true)
                        setReceiptCameraMsg('Starting camera… If it does not appear, ensure you are on https or localhost and camera permission is allowed.')
                        try {
                          const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false })
                          if (receiptVideoRef.current) {
                            receiptVideoRef.current.srcObject = stream as any
                            try { await (receiptVideoRef.current as any).play() } catch {}
                          }
                          setReceiptCameraMsg(null)
                        } catch (e) {
                          setReceiptCameraMsg('Camera access failed. Use Upload, or open this site via https/localhost and allow camera permissions.')
                          setReceiptCameraOn(false)
                        }
                      }}
                    >Use Camera</button>
                  ) : (
                    <>
                      <button
                        type="button"
                        className="px-3 py-1 rounded bg-blue-600 text-white text-sm hover:bg-blue-500"
                        onClick={() => {
                          const video = receiptVideoRef.current
                          if (!video || !video.videoWidth) return
                          const canvas = document.createElement('canvas')
                          canvas.width = video.videoWidth
                          canvas.height = video.videoHeight
                          const ctx = canvas.getContext('2d')
                          if (!ctx) return
                          ctx.drawImage(video, 0, 0)
                          const dataUrl = canvas.toDataURL('image/jpeg', 0.9)
                          setReceiptImageUrl(dataUrl)
                        }}
                      >Capture</button>
                      <button
                        type="button"
                        className="px-3 py-1 rounded border border-gray-300 text-sm hover:bg-gray-50"
                        onClick={() => {
                          const stream: any = receiptVideoRef.current?.srcObject
                          if (stream) { stream.getTracks?.().forEach((t: any) => t.stop()) }
                          if (receiptVideoRef.current) (receiptVideoRef.current as any).srcObject = null
                          setReceiptCameraOn(false)
                          setReceiptCameraMsg(null)
                        }}
                      >Stop</button>
                    </>
                  )}
                  <button
                    type="button"
                    className="px-3 py-1 rounded bg-blue-600 text-white text-sm hover:bg-blue-500"
                    onClick={async () => {
                      if (!receiptImageUrl) return
                      setParsedReceipt([])
                      setReceiptText('')
                      try {
                        if ('TextDetector' in window) {
                          const img = new Image()
                          img.src = receiptImageUrl
                          await new Promise(r => { img.onload = r })
                          const bitmap = await createImageBitmap(img)
                          // @ts-expect-error experimental API
                          const td = new (window as any).TextDetector()
                          const results = await td.detect(bitmap)
                          let text = ''
                          if (Array.isArray(results) && results.length) {
                            // Group by y-position to reconstruct lines
                            const groups: Record<string, Array<any>> = {}
                            for (const r of results) {
                              const box = (r.boundingBox || r.boundingClientRect || { y: 0, top: 0 })
                              const y = Math.round((box.y ?? box.top ?? 0) / 10) * 10
                              const key = String(y)
                              if (!groups[key]) groups[key] = []
                              groups[key].push(r)
                            }
                            const lines = Object.keys(groups)
                              .map(k => ({ y: Number(k), items: groups[k].sort((a,b) => (a.boundingBox?.x ?? a.boundingBox?.left ?? 0) - (b.boundingBox?.x ?? b.boundingBox?.left ?? 0)) }))
                              .sort((a,b) => a.y - b.y)
                              .map(g => g.items.map(it => String(it.rawValue || '').trim()).filter(Boolean).join(' '))
                            text = lines.join('\n')
                          }
                          setReceiptText(text)
                          setReceiptMeta(parseReceiptMeta(text))
                          parseReceiptToItems(text)
                        } else {
                          alert('On-device text detection is not supported in this browser. Paste text below instead, or use Extract via server.')
                        }
                      } catch (e) {
                        logger.warn('ShoppingSmart', 'Text detection failed', e)
                        alert('Text detection failed. Paste text below instead, or use Extract via server.')
                      }
                    }}
                  >Extract text (beta)</button>
                  <button
                    type="button"
                    className="px-3 py-1 rounded bg-indigo-600 text-white text-sm hover:bg-indigo-500"
                    title="Use the server OCR service to extract text"
                    onClick={async () => {
                      if (!receiptImageUrl) return
                      try {
                        setReceiptOcrLoading(true)
                        // Convert blob URL to data URL if needed
                        let dataUrl = receiptImageUrl
                        if (dataUrl.startsWith('blob:')) {
                          const resp = await fetch(dataUrl)
                          const blob = await resp.blob()
                          dataUrl = await new Promise<string>((resolve) => {
                            const reader = new FileReader()
                            reader.onloadend = () => resolve(String(reader.result))
                            reader.readAsDataURL(blob)
                          })
                        }
                        const resp = await fetch('/api/ocr/receipt', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ dataUrl }),
                        })
                        if (!resp.ok) {
                          const j = await resp.json().catch(() => ({}))
                          throw new Error(j.error || `HTTP ${resp.status}`)
                        }
                        const j = await resp.json()
                        const text = String(j.text || '')
                        setReceiptText(text)
                        setReceiptMeta(parseReceiptMeta(text))
                        parseReceiptToItems(text)
                      } catch (e) {
                        alert('Server OCR failed. Please paste text manually or try again.')
                      } finally {
                        setReceiptOcrLoading(false)
                      }
                    }}
                    disabled={receiptOcrLoading}
                  >{receiptOcrLoading ? 'Extracting…' : 'Auto extract & parse'}</button>
                  {receiptImageUrl && (
                    <>
                      <a
                        href={receiptImageUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1 rounded border border-gray-300 text-sm hover:bg-gray-50"
                        title="Open image in new tab"
                      >Open image</a>
                      <a
                        href={receiptImageUrl}
                        download={`receipt-${Date.now()}.jpg`}
                        className="px-3 py-1 rounded border border-gray-300 text-sm hover:bg-gray-50"
                        title="Download image"
                      >Download</a>
                      <button
                        type="button"
                        className={`px-3 py-1 rounded border text-sm ${cropEnabled ? 'border-amber-500 bg-amber-50' : 'border-gray-300 hover:bg-gray-50'}`}
                        onClick={() => { setCropEnabled(!cropEnabled); setCropStart(null); setCropEnd(null) }}
                        title="Toggle crop selection"
                      >{cropEnabled ? 'Cancel Crop' : 'Enable Crop'}</button>
                      <button
                        type="button"
                        className="px-3 py-1 rounded bg-amber-600 text-white text-sm hover:bg-amber-500 disabled:opacity-50"
                        disabled={!cropEnabled || !cropStart || !cropEnd}
                        onClick={() => {
                          if (!receiptImgRef.current || !cropStart || !cropEnd) return
                          const img = receiptImgRef.current
                          // Compute displayed rect relative to natural size
                          const dispRect = img.getBoundingClientRect()
                          // But we used offset within wrapper; derive scale using actual rendered image size
                          const dispWidth = img.clientWidth
                          const dispHeight = img.clientHeight
                          const scaleX = img.naturalWidth / dispWidth
                          const scaleY = img.naturalHeight / dispHeight
                          const x = Math.round(Math.min(cropStart.x, cropEnd.x) * scaleX)
                          const y = Math.round(Math.min(cropStart.y, cropEnd.y) * scaleY)
                          const w = Math.round(Math.abs(cropEnd.x - cropStart.x) * scaleX)
                          const h = Math.round(Math.abs(cropEnd.y - cropStart.y) * scaleY)
                          if (w <= 2 || h <= 2) return
                          const canvas = document.createElement('canvas')
                          canvas.width = w
                          canvas.height = h
                          const ctx = canvas.getContext('2d')
                          if (!ctx) return
                          const temp = new Image()
                          temp.src = img.src
                          temp.onload = () => {
                            ctx.drawImage(temp, x, y, w, h, 0, 0, w, h)
                            const url = canvas.toDataURL('image/jpeg', 0.95)
                            setReceiptImageUrl(url)
                            setCropStart(null)
                            setCropEnd(null)
                            setCropEnabled(false)
                          }
                        }}
                      >Crop to selection</button>
                    </>
                  )}
                </div>
                {receiptCameraOn && (
                  <div className="mt-2 relative rounded overflow-hidden bg-black">
                    <video ref={receiptVideoRef} className="w-full h-64 object-contain" playsInline muted autoPlay />
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-2 text-white text-xs">Align receipt and tap Capture</div>
                  </div>
                )}
                {receiptCameraMsg && (
                  <p className="mt-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded p-2">{receiptCameraMsg}</p>
                )}
                <label className="mt-3 grid gap-1 text-sm">
                  <span className="text-gray-700">Or paste text</span>
                  <textarea rows={6} value={receiptText} onChange={(e) => setReceiptText(e.target.value)} className="rounded border border-gray-300 px-2 py-1" placeholder="Paste recognized text from your receipt" />
                  <div className="flex justify-end">
                    <button type="button" className="px-3 py-1 rounded border border-gray-300 text-sm hover:bg-gray-50" onClick={() => { setReceiptMeta(parseReceiptMeta(receiptText)); parseReceiptToItems(receiptText) }}>Parse</button>
                  </div>
                </label>
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <h4 className="text-sm font-semibold text-gray-900">Detected items</h4>
                    <div className="flex items-center rounded-full bg-gray-100 p-0.5 text-xs">
                      <button
                        type="button"
                        className={`px-2 py-1 rounded-full ${receiptViewMode === 'pretty' ? 'bg-white shadow text-gray-900' : 'text-gray-600'}`}
                        onClick={() => setReceiptViewMode('pretty')}
                        title="Show receipt-style preview"
                      >Receipt view</button>
                      <button
                        type="button"
                        className={`px-2 py-1 rounded-full ${receiptViewMode === 'table' ? 'bg-white shadow text-gray-900' : 'text-gray-600'}`}
                        onClick={() => setReceiptViewMode('table')}
                        title="Show editable table"
                      >Table view</button>
                    </div>
                  </div>
                  {parsedReceipt.length > 0 && (
                    <div className="flex items-center gap-2 text-xs">
                      <label className="inline-flex items-center gap-1">
                        <input
                          type="checkbox"
                          checked={receiptSelectAll}
                          onChange={(e) => {
                            setReceiptSelectAll(e.target.checked)
                            setParsedReceipt(list => list.map(x => ({ ...x, selected: e.target.checked })))
                          }}
                        />
                        <span>{receiptSelectAll ? 'Deselect all' : 'Select all'}</span>
                      </label>
                      <span className="text-gray-400">|</span>
                      <span className="text-gray-700">Category</span>
                      <select value={receiptBulkCategory} onChange={(e) => setReceiptBulkCategory(e.target.value as any)} className="rounded border border-gray-300 px-2 py-1">
                        <option value="produce">Produce</option>
                        <option value="dairy">Dairy</option>
                        <option value="meat">Meat</option>
                        <option value="pantry">Pantry</option>
                        <option value="frozen">Frozen</option>
                        <option value="bakery">Bakery</option>
                        <option value="deli">Deli</option>
                        <option value="household">Household</option>
                        <option value="personal">Personal</option>
                        <option value="electronics">Electronics</option>
                        <option value="other">Other</option>
                      </select>
                      <button
                        className="px-2 py-1 rounded border border-gray-300 hover:bg-gray-50"
                        onClick={() => setParsedReceipt(list => list.map(x => x.selected ? { ...x, category: receiptBulkCategory } : x))}
                      >Apply</button>
                      <span className="text-gray-400">|</span>
                      <span className="text-gray-700">Threshold</span>
                      <input value={receiptBulkThreshold} onChange={(e) => setReceiptBulkThreshold(e.target.value)} className="w-20 rounded border border-gray-300 px-2 py-1" placeholder="0" />
                      <button
                        className="px-2 py-1 rounded border border-gray-300 hover:bg-gray-50"
                        onClick={() => setParsedReceipt(list => list.map(x => x.selected ? { ...x, threshold: receiptBulkThreshold } : x))}
                      >Apply</button>
                    </div>
                  )}
                </div>
                {/* Receipt summary card */}
                {(receiptMeta.merchant || receiptMeta.total != null || receiptMeta.subtotal != null || parsedReceipt.length > 0) && (
                  <div className="mt-2 rounded border bg-white p-3 text-xs text-gray-700">
                    {receiptMeta.merchant && <div className="font-medium text-gray-900">{receiptMeta.merchant}</div>}
                    {receiptMeta.address && <div className="text-gray-500">{receiptMeta.address}</div>}
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      {receiptMeta.date && <div><span className="text-gray-500">Date:</span> {receiptMeta.date}</div>}
                      {receiptMeta.time && <div><span className="text-gray-500">Time:</span> {receiptMeta.time}</div>}
                      {receiptMeta.subtotal != null && <div><span className="text-gray-500">Subtotal:</span> ${receiptMeta.subtotal?.toFixed(2)}</div>}
                      {receiptMeta.tax != null && <div><span className="text-gray-500">Tax:</span> ${receiptMeta.tax?.toFixed(2)}</div>}
                      {receiptMeta.total != null && <div className="col-span-2"><span className="text-gray-500">Total:</span> <span className="font-medium text-gray-900">${receiptMeta.total?.toFixed(2)}</span></div>}
                      {receiptMeta.payment && <div className="col-span-2"><span className="text-gray-500">Payment:</span> {receiptMeta.payment}</div>}
                    </div>
                    {receiptCategorySummary.estSubtotal > 0 && (
                      <div className="mt-2 text-gray-600">
                        <div>Items est subtotal: ${receiptCategorySummary.estSubtotal.toFixed(2)} {receiptMeta.subtotal ? `(vs $${receiptMeta.subtotal.toFixed(2)})` : ''}</div>
                      </div>
                    )}
                  </div>
                )}
                {parsedReceipt.length === 0 ? (
                  <p className="text-sm text-gray-500 mt-2">No items parsed yet.</p>
                ) : receiptViewMode === 'table' ? (
                  <div className="mt-2 overflow-x-auto border rounded">
                    <table className="min-w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-2 w-10"></th>
                          <th className="px-3 py-2 text-left">Item</th>
                          <th className="px-3 py-2 text-left">Qty</th>
                          <th className="px-3 py-2 text-left">Category</th>
                          <th className="px-3 py-2 text-left">Threshold</th>
                          <th className="px-3 py-2 text-left">Details</th>
                        </tr>
                      </thead>
                      <tbody>
                        {parsedReceipt.map((it, idx) => (
                          <tr key={it.id} className={idx % 2 ? 'bg-white' : 'bg-gray-50/50'}>
                            <td className="px-3 py-2 align-top">
                              <input type="checkbox" checked={it.selected} onChange={(e) => setParsedReceipt(list => list.map(x => x.id === it.id ? { ...x, selected: e.target.checked } : x))} />
                            </td>
                            <td className="px-3 py-2 align-top">
                              <div className="font-medium text-gray-900 truncate" title={it.name}>{it.name}</div>
                            </td>
                            <td className="px-3 py-2 align-top">
                              <input type="number" min={1} value={it.quantity} onChange={(e) => setParsedReceipt(list => list.map(x => x.id === it.id ? { ...x, quantity: Math.max(1, Number(e.target.value)||1) } : x))} className="w-20 rounded border border-gray-300 px-2 py-1 text-sm" />
                            </td>
                            <td className="px-3 py-2 align-top">
                              <select value={it.category} onChange={(e) => setParsedReceipt(list => list.map(x => x.id === it.id ? { ...x, category: e.target.value as any } : x))} className="rounded border border-gray-300 px-2 py-1 text-sm">
                                <option value="produce">Produce</option>
                                <option value="dairy">Dairy</option>
                                <option value="meat">Meat</option>
                                <option value="pantry">Pantry</option>
                                <option value="frozen">Frozen</option>
                                <option value="bakery">Bakery</option>
                                <option value="deli">Deli</option>
                                <option value="household">Household</option>
                                <option value="personal">Personal</option>
                                <option value="electronics">Electronics</option>
                                <option value="other">Other</option>
                              </select>
                            </td>
                            <td className="px-3 py-2 align-top">
                              <input type="number" min={0} value={it.threshold} onChange={(e) => setParsedReceipt(list => list.map(x => x.id === it.id ? { ...x, threshold: e.target.value } : x))} className="w-24 rounded border border-gray-300 px-2 py-1 text-sm" placeholder="0" />
                            </td>
                            <td className="px-3 py-2 align-top text-xs text-gray-600">
                              {it.size ? it.size : ''}{it.price != null ? (it.size ? ' • ' : '') + `$${it.price.toFixed(2)}` : ''}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="mt-2 rounded border bg-white">
                    <div className="p-4">
                      <div className="text-sm text-gray-900 font-semibold">Store: {receiptMeta.merchant || '—'}</div>
                      <div className="text-xs text-gray-600 mt-0.5">Date {receiptMeta.date || '—'}{receiptMeta.time ? ` ${receiptMeta.time}` : ''}</div>
                    </div>
                    <div className="border-t">
                      <div className="px-4 py-2 text-xs text-gray-500">Items</div>
                      <ul className="divide-y">
                        {parsedReceipt.map((it) => (
                          <li key={it.id} className="px-4 py-2 text-sm">
                            <div className="font-medium text-gray-900">{it.name}</div>
                            <div className="text-xs text-gray-600">
                              {it.price != null ? `$${it.price.toFixed(2)}` : ''}
                              {(it.size || it.quantity) ? `${it.price != null ? ' ' : ''}${it.size ? it.size : ''}${it.size && it.quantity ? ' • ' : ''}${it.quantity ? `${it.quantity} ${it.quantity > 1 ? 'units' : 'unit'}` : ''}` : ''}
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="border-t p-4 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Total</span>
                        <span className="font-semibold text-gray-900">${(receiptMeta.total != null ? receiptMeta.total : receiptCategorySummary.estSubtotal).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                )}
                <div className="mt-3 flex justify-end gap-2">
                  <button className="px-4 py-2 rounded border border-gray-300 hover:bg-gray-50" onClick={() => { setShowScanReceipt(false); setReceiptImageUrl(null); setReceiptText(''); setParsedReceipt([]) }}>Cancel</button>
                  <button
                    className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-50"
                    disabled={parsedReceipt.filter(x => x.selected).length === 0}
                    onClick={async () => {
                      const chosen = parsedReceipt.filter(x => x.selected)
                      for (const it of chosen) {
                        const thresholdNum = it.threshold ? Number(it.threshold) : undefined
                        await createPantryItemMutation.mutateAsync({ name: it.name, quantity: it.quantity, category: it.category, lowStockThreshold: thresholdNum, isLowStock: thresholdNum != null ? it.quantity <= thresholdNum : undefined })
                      }
                      showGlobalToast?.(`Added ${chosen.length} items to pantry`, 'success')
                      setShowScanReceipt(false); setReceiptImageUrl(null); setReceiptText(''); setParsedReceipt([])
                    }}
                  >Add to Pantry</button>
                  <button
                    className="px-4 py-2 rounded bg-emerald-600 text-white hover:bg-emerald-500"
                    title="Log groceries expense in Financial Tracker"
                    onClick={async () => {
                      const amount = (receiptMeta.total != null && receiptMeta.total > 0)
                        ? receiptMeta.total
                        : receiptCategorySummary.estSubtotal
                      const acctId = financialAccounts?.[0]?.id
                      if (!acctId) {
                        showGlobalToast?.('Add a financial account first (Financials tab)', 'info')
                        return
                      }
                      try {
                        await addFinancialTransaction({
                          accountId: acctId,
                          amount: Number(amount.toFixed(2)),
                          type: 'expense',
                          description: `Groceries — ${receiptMeta.merchant || 'Unknown Store'}`,
                          date: new Date(),
                          categoryId: undefined,
                        })
                        showGlobalToast?.('Logged groceries expense', 'success')
                      } catch (e) {
                        showGlobalToast?.('Failed to log expense', 'error')
                      }
                    }}
                  >Log Groceries Expense</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Barcode Scanner Modal */}
      {showBarcodeScanner && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Barcode Scanner</h3>
              <button
                onClick={stopBarcodeScanning}
                className="p-2 hover:bg-gray-100 rounded-md"
              >
                <X size={20} />
              </button>
            </div>

            <div className="text-center space-y-4">
              <div className="flex items-center justify-center">
                <Camera size={48} className="text-blue-500 animate-pulse" />
              </div>
              
              {isScanning ? (
                <div className="space-y-3">
                  <div className="relative w-full overflow-hidden rounded-lg bg-black">
                    <video
                      ref={videoRef}
                      className="w-full h-64 object-cover"
                      playsInline
                      muted
                      autoPlay
                    />
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-2 text-white text-xs">
                      Point your camera at a barcode • Supports UPC, EAN, Code 128, Code 39
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 text-center">Camera scanning for barcodes...</p>
                  <div className="flex items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={captureBarcodeNow}
                      className="px-4 py-2 rounded-full bg-blue-600 text-white text-sm font-medium hover:bg-blue-500"
                    >
                      Capture
                    </button>
                    <button
                      type="button"
                      onClick={stopBarcodeScanning}
                      className="px-4 py-2 rounded-full border border-gray-300 text-sm font-medium hover:bg-gray-50"
                    >
                      Stop
                    </button>
                  </div>
                  {captureMessage && (
                    <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded p-2 text-center">{captureMessage}</p>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-gray-600">
                    Camera access is required to scan barcodes
                  </p>
                  <button
                    onClick={startBarcodeScanning}
                    className="btn-primary flex items-center space-x-2 mx-auto"
                  >
                    <Camera size={16} />
                    <span>Enable Camera</span>
                  </button>
                </div>
              )}

              {barcodeResult && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <p className="text-sm text-green-800">
                    <strong>Barcode found:</strong> {barcodeResult}
                  </p>
                </div>
              )}

              <div className="text-xs text-gray-500">
                <p>Supports: UPC, EAN, Code 128, Code 39</p>
                <p>Or enter barcode manually in the add item form</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Item Modal */}
      {showEditItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Edit Item</h3>
              <button
                onClick={() => {
                  setShowEditItem(false);
                  setEditingItem(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-md"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={updateExistingItem} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Item Name *
                </label>
                <input
                  type="text"
                  value={editItem.name}
                  onChange={(e) => setEditItem(prev => ({ ...prev, name: e.target.value }))}
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
                    value={editItem.quantity}
                    onChange={(e) => setEditItem(prev => ({ ...prev, quantity: parseInt(e.target.value) }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Unit
                  </label>
                  <select
                    value={editItem.unit}
                    onChange={(e) => setEditItem(prev => ({ ...prev, unit: e.target.value }))}
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
                    value={editItem.category}
                    onChange={(e) => setEditItem(prev => ({ ...prev, category: e.target.value as any }))}
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
                    value={editItem.priority}
                    onChange={(e) => setEditItem(prev => ({ ...prev, priority: e.target.value as any }))}
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
                    value={editItem.estimatedPrice}
                    onChange={(e) => setEditItem(prev => ({ ...prev, estimatedPrice: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="$0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Preferred Store (optional)
                  </label>
                  <select
                    value={editItem.preferredStore}
                    onChange={(e) => setEditItem(prev => ({ ...prev, preferredStore: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">AI will decide</option>
                    {stores.map(store => (
                      <option key={store.id} value={store.id}>
                        {STORE_TYPES[store.type]} {store.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Brand (optional)
                </label>
                <input
                  type="text"
                  value={editItem.brand}
                  onChange={(e) => setEditItem(prev => ({ ...prev, brand: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Organic Valley"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes (optional)
                </label>
                <textarea
                  value={editItem.notes}
                  onChange={(e) => setEditItem(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Any special notes or preferences..."
                  rows={2}
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditItem(false);
                    setEditingItem(null);
                  }}
                  className="flex-1 btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 btn-primary"
                >
                  Update Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Item Modal */}
      {showAddItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Add to Master List</h3>
              <button
                onClick={() => setShowAddItem(false)}
                className="p-2 hover:bg-gray-100 rounded-md"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={addItemToMaster} className="space-y-4">
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
                    Preferred Store (optional)
                  </label>
                  <select
                    value={newItem.preferredStore}
                    onChange={(e) => setNewItem(prev => ({ ...prev, preferredStore: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">AI will decide</option>
                    {stores.map(store => (
                      <option key={store.id} value={store.id}>
                        {STORE_TYPES[store.type]} {store.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
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
                    Barcode (optional)
                  </label>
                  <input
                    type="text"
                    value={barcodeResult || ''}
                    onChange={(e) => setBarcodeResult(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Scan or enter manually"
                    readOnly={!!barcodeResult}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes (optional)
                </label>
                <textarea
                  value={newItem.notes}
                  onChange={(e) => setNewItem(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Any special notes or preferences..."
                  rows={2}
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

      {/* Store Suggestions Modal */}
      {showLocationSuggestions && selectedItemForSuggestions && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Store Suggestions</h3>
              <button
                onClick={() => setShowLocationSuggestions(false)}
                className="p-2 hover:bg-gray-100 rounded-md"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <span className="text-lg">{CATEGORY_ICONS[selectedItemForSuggestions.category]}</span>
                <div>
                  <h4 className="font-medium text-gray-900">{selectedItemForSuggestions.name}</h4>
                  <p className="text-sm text-gray-600">
                    {selectedItemForSuggestions.quantity} {selectedItemForSuggestions.unit} • {selectedItemForSuggestions.category}
                  </p>
                </div>
              </div>

              {!userLocation && (
                <div className="text-center py-6">
                  <div className="flex items-center justify-center mb-3">
                    <MapPin className="h-12 w-12 text-gray-400" />
                  </div>
                  <h4 className="font-medium text-gray-900 mb-2">Enable Location</h4>
                  <p className="text-sm text-gray-600 mb-4">
                    Allow location access to find nearby stores for this item
                  </p>
                  <button
                    onClick={getUserLocation}
                    className="btn-primary flex items-center space-x-2 mx-auto"
                  >
                    <Navigation size={16} />
                    <span>Get My Location</span>
                  </button>
                </div>
              )}

              {userLocation && (
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-900 flex items-center space-x-2">
                    <Store size={16} />
                    <span>Nearby Stores</span>
                  </h4>
                  
                  {findNearbyStoresForItem(selectedItemForSuggestions).map(store => (
                    <div key={store.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3">
                          <span className="text-xl">{STORE_TYPES[store.type]}</span>
                          <div className="flex-1">
                            <h5 className="font-medium text-gray-900">{store.name}</h5>
                            <p className="text-sm text-gray-600">{store.address}</p>
                            
                            <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                              <span className="flex items-center space-x-1">
                                <Navigation size={12} />
                                <span>{store.actualDistance?.toFixed(1) || store.distance} mi</span>
                              </span>
                              
                              {store.avgPrices[selectedItemForSuggestions.name] && (
                                <span className="flex items-center space-x-1 text-green-600 font-medium">
                                  <DollarSign size={12} />
                                  <span>{store.avgPrices[selectedItemForSuggestions.name].toFixed(2)}</span>
                                </span>
                              )}
                              
                              <div className="flex items-center space-x-1">
                                {Array.from({ length: 5 }).map((_, i) => (
                                  <Star
                                    key={i}
                                    size={10}
                                    className={i < store.preferences.overallRating ? 'text-yellow-400 fill-current' : 'text-gray-300'}
                                  />
                                ))}
                              </div>
                            </div>

                            <div className="flex items-center space-x-3 mt-2">
                              {store.hasDelivery && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  🚚 Delivery
                                  {store.deliveryFee && <span className="ml-1">${store.deliveryFee}</span>}
                                </span>
                              )}
                              {store.hasPickup && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  📦 Pickup
                                </span>
                              )}
                              {store.favorite && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                  ❤️ Favorite
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex flex-col space-y-2">
                          <button
                            onClick={() => {
                              // Add item to this store's list
                              updateShoppingItem(selectedItemForSuggestions.id, {
                                assignedStore: store.id, 
                                bestStores: [store.id, ...(selectedItemForSuggestions.bestStores || [])]
                              });
                              setShowLocationSuggestions(false);
                            }}
                            className="text-xs btn-primary px-3 py-1"
                          >
                            Assign Store
                          </button>
                          
                          {store.phone && (
                            <a
                              href={`tel:${store.phone}`}
                              className="text-xs btn-secondary px-3 py-1 text-center"
                            >
                              Call
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  {findNearbyStoresForItem(selectedItemForSuggestions).length === 0 && (
                    <div className="text-center py-6 text-gray-500">
                      <Store className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                      <p className="text-sm">No nearby stores found for this item</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Master Item Card Component
function MasterItemCard({ 
  item, 
  stores, 
  onToggle, 
  onEdit,
  onDelete,
  onFindStores
}: { 
  item: ShoppingItem;
  stores: Store[];
  onToggle: () => void; 
  onEdit: () => void;
  onDelete: () => void; 
  onFindStores: () => void;
}) {
  const bestStore = stores.find(s => s.id === item.bestStores?.[0]);

  return (
    <div className={`
      bg-white border border-l-4 rounded-lg p-4 transition-all duration-200 hover:shadow-md
      ${item.priority === 'high' ? 'border-l-red-400' : 
        item.priority === 'medium' ? 'border-l-yellow-400' : 'border-l-gray-300'}
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
              <span className="text-lg">{CATEGORY_ICONS[item.category]}</span>
              {item.nutritionInfo?.organic && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                  🌱 Organic
                </span>
              )}
            </div>
            
            <div className="flex items-center space-x-4 mt-1 text-sm text-gray-500">
              <span>{item.quantity} {item.unit}</span>
              {item.estimatedPrice && (
                <span className="flex items-center font-medium text-green-600">
                  <DollarSign size={12} />
                  {item.estimatedPrice.toFixed(2)}
                </span>
              )}
              {item.barcode && (
                <span className="flex items-center text-gray-500">
                  <Scan size={12} className="mr-1" />
                  {item.barcode.slice(-4)}
                </span>
              )}
              {bestStore && (
                <span className={`flex items-center ${item.assignedStore ? 'text-purple-600' : 'text-blue-600'}`}>
                  {item.assignedStore ? (
                    <>
                      <Heart size={12} className="mr-1" />
                      Preferred: {bestStore.name}
                    </>
                  ) : (
                    <>
                      <Store size={12} className="mr-1" />
                      AI Rec: {bestStore.name}
                    </>
                  )}
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
            onClick={onFindStores}
            className="p-1 text-gray-400 hover:text-blue-500 transition-colors"
            title="Find nearby stores"
          >
            <Navigation size={16} />
          </button>
          <button
            onClick={onEdit}
            className="p-1 text-gray-400 hover:text-blue-500 transition-colors"
            title="Edit item"
          >
            <Edit3 size={16} />
          </button>
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

// Store List Card Component
function StoreListCard({ 
  list, 
  store 
}: { 
  list: ShoppingList;
  store: Store;
}) {
  return (
    <div className="bg-white rounded-lg border shadow-sm">
      <div className="p-4 border-b" style={{ backgroundColor: `${store.color}10` }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">{STORE_TYPES[store.type]}</span>
            <div>
              <h3 className="font-semibold text-gray-900">{store.name}</h3>
              <p className="text-sm text-gray-600">{list.description}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-lg font-semibold" style={{ color: store.color }}>
              {list.items.length}
            </div>
            <div className="text-xs text-gray-500">items</div>
          </div>
        </div>
      </div>

      <div className="p-4">
        <div className="space-y-2 max-h-40 overflow-y-auto">
          {list.items.slice(0, 5).map(item => (
            <div key={item.id} className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-2">
                <span>{CATEGORY_ICONS[item.category]}</span>
                <span className="text-gray-900">{item.name}</span>
              </div>
              <span className="text-gray-500">{item.quantity} {item.unit}</span>
            </div>
          ))}
          {list.items.length > 5 && (
            <div className="text-xs text-gray-500 text-center pt-2">
              +{list.items.length - 5} more items
            </div>
          )}
        </div>

        <div className="mt-4 pt-3 border-t flex items-center justify-between">
          <div className="text-sm text-gray-600">
            <MapPin size={12} className="inline mr-1" />
            {store.distance} miles
          </div>
          <div className="text-sm font-semibold text-green-600">
            ${list.totalEstimatedCost?.toFixed(2)}
          </div>
        </div>
      </div>
    </div>
  );
}
