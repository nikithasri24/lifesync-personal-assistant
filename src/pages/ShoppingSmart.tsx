import React, { useState, useEffect } from 'react';
import { useAppStore } from '../stores/useAppStore';
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
  Navigation
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
  // Get shopping items from global store
  const { 
    shoppingItems, 
    addShoppingItem, 
    updateShoppingItem, 
    deleteShoppingItem, 
    toggleShoppingItem 
  } = useAppStore();

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

  const [activeView, setActiveView] = useState<'master' | 'stores' | 'distribute'>('master');
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
  const [isScanning, setIsScanning] = useState(false);
  
  // Location-based suggestions
  const [userLocation, setUserLocation] = useState<{lat: number; lng: number} | null>(null);
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);
  const [selectedItemForSuggestions, setSelectedItemForSuggestions] = useState<ShoppingItem | null>(null);

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

    try {
      // Check if the browser supports the Barcode Detection API
      if ('BarcodeDetector' in window) {
        const barcodeDetector = new (window as any).BarcodeDetector({
          formats: ['code_128', 'code_39', 'ean_13', 'ean_8', 'upc_a', 'upc_e']
        });

        // Get camera stream
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { 
            facingMode: 'environment', // Use back camera
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }
        });

        // Create video element for camera feed
        const video = document.createElement('video');
        video.srcObject = stream;
        video.play();

        // Start barcode detection
        const detectBarcodes = async () => {
          if (!video.videoWidth || !video.videoHeight) {
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
            console.warn('Barcode detection error:', error);
          }

          if (isScanning) {
            requestAnimationFrame(detectBarcodes);
          }
        };

        video.onloadedmetadata = () => {
          detectBarcodes();
        };

        // Store video element reference for cleanup
        (window as any).currentBarcodeVideo = video;
        (window as any).currentBarcodeStream = stream;

      } else {
        // Fallback: Manual barcode input
        alert('Barcode scanning not supported on this device. Please enter barcode manually.');
        setShowBarcodeScanner(false);
        setIsScanning(false);
      }
    } catch (error) {
      console.error('Camera access error:', error);
      alert('Camera access denied. Please enable camera permissions to scan barcodes.');
      setShowBarcodeScanner(false);
      setIsScanning(false);
    }
  };

  const stopBarcodeScanning = () => {
    setIsScanning(false);
    setShowBarcodeScanner(false);

    // Clean up camera stream and video
    if ((window as any).currentBarcodeStream) {
      const stream = (window as any).currentBarcodeStream;
      stream.getTracks().forEach((track: any) => track.stop());
      (window as any).currentBarcodeStream = null;
    }
    
    if ((window as any).currentBarcodeVideo) {
      (window as any).currentBarcodeVideo = null;
    }
  };

  // Mock product lookup function (in real app, this would call a product API)
  const lookupProductByBarcode = async (barcode: string): Promise<{
    name: string;
    price?: number;
    category?: string;
    brand?: string;
  }> => {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Mock product database
    const mockProducts: { [key: string]: any } = {
      '012345678905': {
        name: 'Organic Bananas',
        price: 4.99,
        category: 'produce',
        brand: 'Organic Valley'
      },
      '012345678912': {
        name: 'Whole Milk',
        price: 3.49,
        category: 'dairy',
        brand: 'Horizon'
      },
      '012345678929': {
        name: 'Ground Beef',
        price: 8.99,
        category: 'meat',
        brand: 'Grass Fed'
      }
    };

    return mockProducts[barcode] || {
      name: `Product ${barcode.slice(-4)}`,
      price: Math.random() * 20 + 1,
      category: 'other'
    };
  };

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
      console.error('Error getting location:', error);
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
                <p className="text-sm font-medium text-blue-600">Master List</p>
                <p className="text-lg font-semibold text-blue-900">{totalMasterItems} items</p>
              </div>
            </div>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center">
              <Store className="h-8 w-8 text-green-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-green-600">Store Lists</p>
                <p className="text-lg font-semibold text-green-900">{storeLists.length} stores</p>
              </div>
            </div>
          </div>
          <div className="bg-purple-50 rounded-lg p-4">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-purple-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-purple-600">Est. Total</p>
                <p className="text-lg font-semibold text-purple-900">${totalEstimatedCost.toFixed(2)}</p>
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
                  : 'text-gray-600 hover:bg-gray-100'
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
                  : 'text-gray-600 hover:bg-gray-100'
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
                  : 'text-gray-600 hover:bg-gray-100'
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
                  <p className="text-gray-600">Point your camera at a barcode</p>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full animate-pulse w-1/2"></div>
                  </div>
                  <p className="text-sm text-gray-500">
                    Camera scanning for barcodes...
                  </p>
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