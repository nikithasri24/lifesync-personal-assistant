# Travel Tab UI/UX Enhancement Plan

## Context

The Travel feature needs to be updated to match the design specifications in `travel-design-spec.html` and apply all 25 UI/UX enhancement patterns from CLAUDE.md (established by the Together tab reference implementation).

**Current State:**
- Travel page exists at `src/pages/Travel.tsx` with 3 tabs (Map, Visa, Bucket List)
- Already has FeatureErrorBoundary ✅
- Uses SegmentedControl for tab navigation ✅
- Complex components: LeafletTravelMapV2, TripEditor, VisaEditor, PassportEditor
- Missing: consistent modal structure, auto-save, proper stats display, enhanced card styling

**Goal:**
- Match `travel-design-spec.html` styling exactly
- Apply all Together tab UI patterns
- Maintain existing functionality (map tracking, visa management, trips)
- Ensure responsive mobile/desktop behavior
- Enhance with auto-save, better stats, unified theme

**Why This Matters:**
- Travel is a complex feature with maps, location tracking, and visa management
- Needs consistent UX patterns with other features
- Will serve as reference for complex data visualization features

---

## Critical Files to Modify

### Primary Files (Must Update)
1. `src/pages/Travel.tsx` - Main page component (already has centered layout ✅)
2. `src/travel/pages/TravelPage.tsx` - Map view implementation
3. `src/travel/pages/VisaPage.tsx` - Visa tracking view
4. `src/travel/components/TripEditor.tsx` - Trip creation/editing
5. `src/travel/components/VisaEditor.tsx` - Visa creation/editing
6. `src/travel/components/PassportEditor.tsx` - Passport management
7. `src/travel/components/LeafletTravelMapV2.tsx` - Interactive map
8. `src/travel/components/PassportSummaryCard.tsx` - Passport stats card
9. `src/travel/components/CountryStatusModal.tsx` - Location details

### Reference Files (Do NOT Modify)
- `src/pages/Together.tsx` - Reference implementation
- `src/together/components/modals/*.tsx` - Modal examples
- `travel-design-spec.html` - Design specification
- `CLAUDE.md` - UI/UX standards

---

## Implementation Plan

### Phase 1: Update Main Page Header

**File:** `src/pages/Travel.tsx`

**Current State:**
```tsx
// ✅ Already has:
// - FeatureErrorBoundary
// - Centered layout pattern (maxWidth: 900px implied by design)
// - SegmentedControl for tab navigation
// - Lazy loading for heavy map components
```

**Changes Needed:**
1. Update header to match design spec gradient:
   ```tsx
   <div
     style={{
       background: 'linear-gradient(135deg, #D4A574 0%, #C18B5E 100%)',
       padding: '60px 20px 20px',
       color: 'white',
       marginBottom: '16px'
     }}
   >
     <h1 style={{ fontSize: '32px', fontWeight: '800', marginBottom: '8px' }}>
       ✈️ Travel
     </h1>
     <div style={{ fontSize: '14px', opacity: 0.9 }}>
       Track your global adventures
     </div>
   </div>
   ```

2. Move SegmentedControl below header (inside white background section):
   ```tsx
   <div style={{ background: 'rgba(92, 74, 58, 0.1)', borderRadius: '12px', padding: '4px', margin: '16px 20px' }}>
     <SegmentedControl
       segments={[
         { value: 'map', label: 'Map' },
         { value: 'visa', label: 'Visa' },
         { value: 'bucketlist', label: 'Bucket List' },
       ]}
       value={activeTab}
       onChange={(value) => setActiveTab(value as TravelTabView)}
     />
   </div>
   ```

**Expected Outcome:**
- Header matches design spec exactly (terracotta gradient, white text)
- SegmentedControl styled consistently with design
- Clean separation between header and content

---

### Phase 2: Add Stats Bar Component

**File:** `src/travel/components/v2/TravelStatsBarV2.tsx` (Create new)

**Purpose:** Display key travel statistics below header

**Implementation:**
```tsx
import React from 'react';
import { useThemeColors } from '@/hooks/useThemeColors';

interface TravelStatsBarV2Props {
  countriesVisited: number;
  continentsVisited: number;
  citiesVisited: number;
  tripsCompleted: number;
}

export const TravelStatsBarV2: React.FC<TravelStatsBarV2Props> = ({
  countriesVisited,
  continentsVisited,
  citiesVisited,
  tripsCompleted,
}) => {
  const colors = useThemeColors();

  const stats = [
    { number: countriesVisited, label: 'Countries' },
    { number: continentsVisited, label: 'Continents' },
    { number: citiesVisited, label: 'Cities' },
    { number: tripsCompleted, label: 'Trips' },
  ];

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '12px',
        padding: '16px 20px',
        background: 'white',
        margin: '0 20px 16px',
        borderRadius: '16px',
        boxShadow: '0 2px 12px rgba(92, 74, 58, 0.08)',
      }}
    >
      {stats.map((stat, index) => (
        <div key={index} style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '24px', fontWeight: '800', color: '#C18B5E' }}>
            {stat.number}
          </div>
          <div
            style={{
              fontSize: '11px',
              color: '#9B8B7A',
              textTransform: 'uppercase',
              fontWeight: 600,
              letterSpacing: '0.3px',
              marginTop: '4px',
            }}
          >
            {stat.label}
          </div>
        </div>
      ))}
    </div>
  );
};
```

**Expected Outcome:**
- 4-column stats grid showing key metrics
- Terracotta accent color for numbers
- Matches design spec exactly

---

### Phase 3: Create TripFormModalV2 Component

**File:** `src/travel/components/v2/TripFormModalV2.tsx` (Create new)

**Purpose:** Replace TripEditor with Together-pattern modal

**Structure:**
```tsx
import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useThemeColors } from '@/hooks/useThemeColors';
import type { Trip, TripInput, TripStatus } from '@/travel/types';

interface TripFormModalV2Props {
  isOpen: boolean;
  onClose: () => void;
  trip?: Trip;
  isEditing?: boolean;
  onSubmit: (data: TripInput) => Promise<void>;
}

export const TripFormModalV2: React.FC<TripFormModalV2Props> = ({
  isOpen,
  onClose,
  trip,
  isEditing = false,
  onSubmit,
}) => {
  const colors = useThemeColors();
  const STORAGE_KEY = 'travel_trip_draft';

  // Auto-save draft logic
  const loadDraft = () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (error) {
      console.error('Failed to load draft:', error);
    }
    return null;
  };

  const savedDraft = !trip ? loadDraft() : null;

  const [name, setName] = useState(trip?.name || savedDraft?.name || '');
  const [description, setDescription] = useState(trip?.description || savedDraft?.description || '');
  const [startDate, setStartDate] = useState(trip?.startDate || savedDraft?.startDate || '');
  const [endDate, setEndDate] = useState(trip?.endDate || savedDraft?.endDate || '');
  const [status, setStatus] = useState<TripStatus>(trip?.status || savedDraft?.status || 'planning');
  const [budget, setBudget] = useState(trip?.budget?.toString() || savedDraft?.budget || '');
  const [currency, setCurrency] = useState(trip?.currency || savedDraft?.currency || 'USD');
  const [tags, setTags] = useState(trip?.tags?.join(', ') || savedDraft?.tags || '');
  const [isPending, setIsPending] = useState(false);

  // Auto-save on change
  useEffect(() => {
    if (name || description || startDate) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        name, description, startDate, endDate, status, budget, currency, tags
      }));
    }
  }, [name, description, startDate, endDate, status, budget, currency, tags]);

  // ESC key support
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  const handleSubmit = async () => {
    if (!name.trim() || !startDate || !endDate) {
      return;
    }

    setIsPending(true);
    try {
      await onSubmit({
        name: name.trim(),
        description: description.trim(),
        startDate,
        endDate,
        status,
        budget: budget ? parseFloat(budget) : undefined,
        currency,
        tags: tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      });
      localStorage.removeItem(STORAGE_KEY);
      onClose();
    } catch (error) {
      console.error('Failed to save trip:', error);
    } finally {
      setIsPending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 bottom-0 z-[60] flex items-end justify-center lg:items-center"
      style={{
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        backdropFilter: 'blur(4px)',
        marginTop: 'calc(-1 * env(safe-area-inset-top, 0px))',
        paddingTop: 'env(safe-area-inset-top, 0px)',
        height: 'calc(100vh + env(safe-area-inset-top, 0px) + env(safe-area-inset-bottom, 0px))',
      }}
      onClick={handleBackdropClick}
    >
      <div
        className="w-full bg-white lg:rounded-3xl rounded-t-3xl overflow-hidden flex flex-col"
        style={{ maxHeight: '90vh', maxWidth: '600px' }}
      >
        {/* Mobile Drag Handle */}
        <div className="lg:hidden pt-2 flex-shrink-0">
          <div className="w-9 h-1 rounded-full mx-auto bg-gray-300" />
        </div>

        {/* Fixed Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200 flex-shrink-0">
          <h2 className="text-2xl font-bold text-gray-900">
            {isEditing ? 'Edit Trip' : 'Create Trip'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div
          className="overflow-y-auto p-6 space-y-5 flex-1"
          style={{ maxHeight: 'calc(90vh - 140px)' }}
        >
          {/* Trip Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Trip Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Summer Europe Trip"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none transition-all"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Description (optional)
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Trip details and highlights..."
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none resize-none transition-all"
            />
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none transition-all"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none transition-all"
                required
              />
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Status
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(['planning', 'upcoming', 'in_progress', 'completed'] as TripStatus[]).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatus(s)}
                  className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    status === s
                      ? 'bg-terracotta-100 text-terracotta-600 border-2 border-terracotta-400'
                      : 'bg-gray-100 text-gray-700 border-2 border-transparent'
                  }`}
                >
                  {s === 'in_progress' ? 'In Progress' : s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Budget */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Budget (optional)
              </label>
              <input
                type="number"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                placeholder="0"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Currency
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none transition-all"
              >
                <option value="USD">💵 USD</option>
                <option value="EUR">💶 EUR</option>
                <option value="GBP">💷 GBP</option>
                <option value="JPY">💴 JPY</option>
                <option value="AUD">🇦🇺 AUD</option>
                <option value="CAD">🇨🇦 CAD</option>
              </select>
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Tags (optional)
            </label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="backpacking, business, family"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none transition-all"
            />
            <p className="text-xs mt-1 text-gray-500">
              Separate tags with commas
            </p>
          </div>
        </div>

        {/* Fixed Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex gap-3 flex-shrink-0 bg-white">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-xl font-semibold text-gray-700 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isPending || !name.trim() || !startDate || !endDate}
            className="flex-1 px-4 py-3 rounded-xl font-semibold text-white transition-opacity disabled:opacity-50"
            style={{
              background: 'linear-gradient(135deg, #D4A574 0%, #C18B5E 100%)',
            }}
          >
            {isPending ? 'Saving...' : (isEditing ? 'Update Trip' : 'Create Trip')}
          </button>
        </div>
      </div>
    </div>
  );
};
```

**Expected Outcome:**
- Modal matches Together tab pattern exactly
- Auto-saves drafts to localStorage
- ESC key and backdrop click support
- Status as button grid (4 options)
- Budget with currency selector
- All Together modal features applied

---

### Phase 4: Create VisaFormModalV2 Component

**File:** `src/travel/components/v2/VisaFormModalV2.tsx` (Create new)

**Purpose:** Replace VisaEditor with Together-pattern modal

**Key Fields:**
- Country (dropdown with flags)
- Visa type (tourist, business, work, student, transit)
- Issue date / Expiry date
- Visa number
- Entry type (single, multiple)
- Notes

**Implementation:** Similar structure to TripFormModalV2 but with visa-specific fields

```tsx
// Similar modal structure with these specific fields:

// Country Selector
<select
  value={country}
  onChange={(e) => setCountry(e.target.value)}
  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-terracotta-300 focus:border-terracotta-300 outline-none transition-all"
>
  <option value="">Select country...</option>
  <option value="US">🇺🇸 United States</option>
  <option value="GB">🇬🇧 United Kingdom</option>
  <option value="JP">🇯🇵 Japan</option>
  {/* All countries with flags */}
</select>

// Visa Type (button grid)
<div className="grid grid-cols-3 gap-2">
  {(['tourist', 'business', 'work', 'student', 'transit'] as const).map((type) => (
    <button
      key={type}
      type="button"
      onClick={() => setVisaType(type)}
      className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
        visaType === type
          ? 'bg-terracotta-100 text-terracotta-600 border-2 border-terracotta-400'
          : 'bg-gray-100 text-gray-700 border-2 border-transparent'
      }`}
    >
      {type.charAt(0).toUpperCase() + type.slice(1)}
    </button>
  ))}
</div>

// Entry Type (radio buttons as cards)
<div className="grid grid-cols-2 gap-3">
  <label className="flex items-center gap-3 p-3 border border-gray-300 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
    <input
      type="radio"
      name="entryType"
      value="single"
      checked={entryType === 'single'}
      onChange={(e) => setEntryType(e.target.value)}
      className="w-4 h-4 text-terracotta-400 focus:ring-terracotta-300"
    />
    <span className="font-medium text-gray-900">Single Entry</span>
  </label>
  <label className="flex items-center gap-3 p-3 border border-gray-300 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
    <input
      type="radio"
      name="entryType"
      value="multiple"
      checked={entryType === 'multiple'}
      onChange={(e) => setEntryType(e.target.value)}
      className="w-4 h-4 text-terracotta-400 focus:ring-terracotta-300"
    />
    <span className="font-medium text-gray-900">Multiple Entry</span>
  </label>
</div>
```

**Expiry Warning Logic:**
```tsx
// Calculate days until expiry
const getDaysUntilExpiry = (expiryDate: string): number => {
  const today = new Date();
  const expiry = new Date(expiryDate);
  const diffMs = expiry.getTime() - today.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
};

const daysLeft = expiryDate ? getDaysUntilExpiry(expiryDate) : null;

// Show warning in modal
{daysLeft !== null && daysLeft < 30 && (
  <div
    style={{
      padding: '12px',
      background: daysLeft < 7 ? '#FEF2F2' : '#FFFBEB',
      border: `1px solid ${daysLeft < 7 ? '#FCA5A5' : '#FCD34D'}`,
      borderRadius: '12px',
      fontSize: '13px',
      color: daysLeft < 7 ? '#DC2626' : '#D97706',
      fontWeight: 600,
    }}
  >
    ⚠️ Expires in {daysLeft} day{daysLeft !== 1 ? 's' : ''}!
  </div>
)}
```

**Expected Outcome:**
- Visa modal with Together pattern
- Country dropdown with flag emojis
- Visa type as button grid
- Entry type as radio cards
- Expiry warning based on days remaining
- Auto-save support

---

### Phase 5: Create TripCardV2 Component

**File:** `src/travel/components/v2/TripCardV2.tsx` (Create new)

**Purpose:** Display trip cards in list view

**Implementation:**
```tsx
import React from 'react';
import { useThemeColors } from '@/hooks/useThemeColors';
import { getRelativeTime } from '@/utils/dateUtils';
import type { Trip, TripStatus } from '@/travel/types';

interface TripCardV2Props {
  trip: Trip;
  onClick: () => void;
  showOwnerBadge?: boolean;
  owner?: {
    isOwner: boolean;
    displayName: string;
  };
}

export const TripCardV2: React.FC<TripCardV2Props> = ({
  trip,
  onClick,
  showOwnerBadge = false,
  owner,
}) => {
  const colors = useThemeColors();

  const statusColors: Record<TripStatus, { bg: string; text: string }> = {
    planning: { bg: '#E8DCC8', text: '#6B5847' },
    upcoming: { bg: '#D4E8FF', text: '#0066CC' },
    in_progress: { bg: '#D4F4DD', text: '#16A34A' },
    completed: { bg: '#E8D4FF', text: '#9333EA' },
    cancelled: { bg: '#FEE2E2', text: '#DC2626' },
  };

  const statusColor = statusColors[trip.status];

  const formatDateRange = (start: string, end: string): string => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const startMonth = startDate.toLocaleDateString('en-US', { month: 'short' });
    const endMonth = endDate.toLocaleDateString('en-US', { month: 'short' });
    const startDay = startDate.getDate();
    const endDay = endDate.getDate();

    if (startMonth === endMonth) {
      return `${startMonth} ${startDay}-${endDay}`;
    }
    return `${startMonth} ${startDay} - ${endMonth} ${endDay}`;
  };

  return (
    <div
      onClick={onClick}
      className="cursor-pointer transition-transform hover:scale-[1.01] active:scale-[0.98]"
      style={{
        backgroundColor: 'white',
        borderRadius: '16px',
        overflow: 'hidden',
        boxShadow: '0 2px 12px rgba(92, 74, 58, 0.08)',
        marginBottom: '16px',
        position: 'relative',
      }}
    >
      {/* Cover Image / Placeholder */}
      <div
        style={{
          height: '140px',
          background: trip.coverPhoto
            ? `url(${trip.coverPhoto}) center/cover`
            : 'linear-gradient(135deg, #D4A574 0%, #C18B5E 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '48px',
        }}
      >
        {!trip.coverPhoto && '✈️'}
      </div>

      {/* Owner Badge */}
      {showOwnerBadge && owner && (
        <div
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            padding: '4px 10px',
            background: 'rgba(255, 255, 255, 0.95)',
            borderRadius: '12px',
            fontSize: '10px',
            fontWeight: 700,
            color: '#C18B5E',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
          }}
        >
          {owner.displayName}
        </div>
      )}

      {/* Content */}
      <div style={{ padding: '16px' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#5C4A3A', flex: 1 }}>
            {trip.name}
          </h3>
          <div
            style={{
              padding: '4px 10px',
              borderRadius: '12px',
              fontSize: '11px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.3px',
              backgroundColor: statusColor.bg,
              color: statusColor.text,
              whiteSpace: 'nowrap',
              marginLeft: '8px',
            }}
          >
            {trip.status === 'in_progress' ? 'In Progress' : trip.status}
          </div>
        </div>

        {/* Dates */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#6B5847', marginBottom: '12px' }}>
          <span>📅</span>
          <span>{formatDateRange(trip.startDate, trip.endDate)}</span>
        </div>

        {/* Description */}
        {trip.description && (
          <p
            style={{
              fontSize: '13px',
              color: '#6B5847',
              lineHeight: 1.4,
              marginBottom: '12px',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {trip.description}
          </p>
        )}

        {/* Meta */}
        <div
          style={{
            display: 'flex',
            gap: '12px',
            paddingTop: '12px',
            borderTop: '1px solid #E8DCC8',
          }}
        >
          {trip.budget && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#9B8B7A' }}>
              <span>💰</span>
              <span>{trip.budget} {trip.currency}</span>
            </div>
          )}
          {trip.tags && trip.tags.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#9B8B7A' }}>
              <span>🏷️</span>
              <span>{trip.tags[0]}</span>
              {trip.tags.length > 1 && <span>+{trip.tags.length - 1}</span>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
```

**Expected Outcome:**
- Trip cards match design spec exactly
- Cover image or gradient placeholder
- Status badge with color coding
- Date range formatting
- Description with 2-line clamp
- Meta info (budget, tags) with icons
- Owner badge for merged mode

---

### Phase 6: Create LocationCardV2 Component

**File:** `src/travel/components/v2/LocationCardV2.tsx` (Create new)

**Purpose:** Display country/location cards in grid view

**Implementation:**
```tsx
import React from 'react';
import { useThemeColors } from '@/hooks/useThemeColors';

interface LocationCardV2Props {
  icon: string; // Emoji
  title: string;
  count: number;
  total?: number;
  onClick: () => void;
}

export const LocationCardV2: React.FC<LocationCardV2Props> = ({
  icon,
  title,
  count,
  total,
  onClick,
}) => {
  const colors = useThemeColors();
  const progress = total ? (count / total) * 100 : 0;

  return (
    <div
      onClick={onClick}
      className="cursor-pointer transition-transform active:scale-[0.98]"
      style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '16px',
        boxShadow: '0 2px 12px rgba(92, 74, 58, 0.08)',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
        <div style={{ fontSize: '28px' }}>{icon}</div>
        <div style={{ fontSize: '18px', fontWeight: 800, color: '#C18B5E' }}>
          {count}
        </div>
      </div>

      {/* Title */}
      <div style={{ fontSize: '14px', fontWeight: 600, color: '#5C4A3A', marginBottom: total ? '8px' : 0 }}>
        {title}
      </div>

      {/* Progress Bar */}
      {total && (
        <div
          style={{
            background: '#E8DCC8',
            height: '6px',
            borderRadius: '3px',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              background: 'linear-gradient(90deg, #D4A574 0%, #C18B5E 100%)',
              height: '100%',
              borderRadius: '3px',
              width: `${progress}%`,
              transition: 'width 0.3s',
            }}
          />
        </div>
      )}
    </div>
  );
};
```

**Expected Outcome:**
- 2-column grid of location cards
- Large emoji icon and count
- Progress bar for stats (e.g., "25/195 countries")
- Matches design spec styling

---

### Phase 7: Update PassportSummaryCard

**File:** `src/travel/components/PassportSummaryCard.tsx`

**Changes:**
1. Match design spec card styling:
   ```tsx
   <div
     style={{
       background: 'white',
       margin: '0 20px 16px',
       borderRadius: '16px',
       padding: '20px',
       boxShadow: '0 2px 12px rgba(92, 74, 58, 0.08)',
     }}
   >
     {/* Passport Header with Flag */}
     <div
       style={{
         display: 'flex',
         alignItems: 'center',
         gap: '16px',
         marginBottom: '20px',
         paddingBottom: '16px',
         borderBottom: '2px solid #E8DCC8',
       }}
     >
       <div style={{ fontSize: '48px' }}>🇺🇸</div>
       <div>
         <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#5C4A3A', marginBottom: '4px' }}>
           {passportCountry}
         </h3>
         <div style={{ fontSize: '13px', color: '#9B8B7A' }}>
           Rank: #{passportRank}
         </div>
       </div>
     </div>

     {/* Stats Grid */}
     <div
       style={{
         display: 'grid',
         gridTemplateColumns: 'repeat(2, 1fr)',
         gap: '16px',
       }}
     >
       <div
         style={{
           textAlign: 'center',
           padding: '12px',
           background: 'linear-gradient(135deg, rgba(212, 165, 116, 0.1) 0%, rgba(193, 139, 94, 0.1) 100%)',
           borderRadius: '12px',
         }}
       >
         <div style={{ fontSize: '32px', fontWeight: 800, color: '#C18B5E' }}>
           {visaFreeCount}
         </div>
         <div style={{ fontSize: '11px', color: '#6B5847', textTransform: 'uppercase', fontWeight: 600, marginTop: '4px' }}>
           Visa Free
         </div>
       </div>
       <div
         style={{
           textAlign: 'center',
           padding: '12px',
           background: 'linear-gradient(135deg, rgba(212, 165, 116, 0.1) 0%, rgba(193, 139, 94, 0.1) 100%)',
           borderRadius: '12px',
         }}
       >
         <div style={{ fontSize: '32px', fontWeight: 800, color: '#C18B5E' }}>
           {visaOnArrivalCount}
         </div>
         <div style={{ fontSize: '11px', color: '#6B5847', textTransform: 'uppercase', fontWeight: 600, marginTop: '4px' }}>
           Visa On Arrival
         </div>
       </div>
     </div>
   </div>
   ```

**Expected Outcome:**
- Passport card matches design spec exactly
- Large flag emoji
- Passport rank displayed
- 2-column stats grid (visa-free, visa-on-arrival)
- Terracotta gradient backgrounds for stats

---

### Phase 8: Create VisaItemCardV2 Component

**File:** `src/travel/components/v2/VisaItemCardV2.tsx` (Create new)

**Purpose:** Display visa items in list

**Implementation:**
```tsx
import React from 'react';
import { useThemeColors } from '@/hooks/useThemeColors';
import type { Visa } from '@/travel/types/visa';

interface VisaItemCardV2Props {
  visa: Visa;
  onClick: () => void;
}

export const VisaItemCardV2: React.FC<VisaItemCardV2Props> = ({ visa, onClick }) => {
  const colors = useThemeColors();

  // Calculate days until expiry
  const getDaysUntilExpiry = (expiryDate: string): number => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffMs = expiry.getTime() - today.getTime();
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  };

  const daysLeft = getDaysUntilExpiry(visa.expiryDate);
  const isExpiringSoon = daysLeft < 30;
  const isExpired = daysLeft < 0;

  return (
    <div
      onClick={onClick}
      className="cursor-pointer"
      style={{
        background: 'white',
        padding: '16px',
        borderRadius: '12px',
        marginBottom: '12px',
        boxShadow: '0 2px 12px rgba(92, 74, 58, 0.08)',
        borderLeft: '4px solid #C18B5E',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <div style={{ fontSize: '15px', fontWeight: 700, color: '#5C4A3A' }}>
          {visa.flag} {visa.country}
        </div>
        <div
          style={{
            fontSize: '11px',
            padding: '4px 8px',
            background: '#E8DCC8',
            color: '#6B5847',
            borderRadius: '8px',
            fontWeight: 600,
          }}
        >
          {visa.visaType}
        </div>
      </div>

      {/* Dates */}
      <div style={{ fontSize: '13px', color: '#6B5847', marginBottom: '4px' }}>
        📅 {new Date(visa.issueDate).toLocaleDateString()} - {new Date(visa.expiryDate).toLocaleDateString()}
      </div>

      {/* Expiry Warning */}
      <div
        style={{
          fontSize: '12px',
          color: isExpired ? '#DC2626' : (isExpiringSoon ? '#EA580C' : '#9B8B7A'),
          fontWeight: isExpiringSoon || isExpired ? 600 : 400,
        }}
      >
        {isExpired ? '❌ Expired' : (isExpiringSoon ? `⚠️ Expires in ${daysLeft} days` : `✅ Valid for ${daysLeft} days`)}
      </div>
    </div>
  );
};
```

**Expected Outcome:**
- Visa cards with left border accent
- Country with flag emoji
- Visa type badge
- Expiry warning with color coding:
  - Red (❌) if expired
  - Orange (⚠️) if expiring within 30 days
  - Gray (✅) if valid

---

### Phase 9: Update Map Legend

**File:** `src/travel/components/MapLegend.tsx`

**Changes:**
1. Match design spec styling:
   ```tsx
   <div
     style={{
       padding: '12px 16px',
       background: '#FAFAFA',
       display: 'flex',
       gap: '12px',
       flexWrap: 'wrap',
     }}
   >
     {[
       { status: 'visited', color: '#C18B5E', label: 'Visited' },
       { status: 'lived', color: '#D4A574', label: 'Lived' },
       { status: 'transit', color: '#9B8B7A', label: 'Transit' },
       { status: 'wishlist', color: '#E8DCC8', label: 'Wishlist', border: '2px solid #C18B5E' },
     ].map((item) => (
       <div
         key={item.status}
         style={{
           display: 'flex',
           alignItems: 'center',
           gap: '6px',
           fontSize: '11px',
           color: '#6B5847',
         }}
       >
         <div
           style={{
             width: '10px',
             height: '10px',
             borderRadius: '50%',
             backgroundColor: item.color,
             border: item.border,
           }}
         />
         <span>{item.label}</span>
       </div>
     ))}
   </div>
   ```

**Expected Outcome:**
- Legend matches design spec colors
- Dots with proper colors
- Wishlist has border (hollow circle effect)

---

### Phase 10: Add Filter Pills

**File:** `src/travel/pages/TravelPage.tsx`

**Add filter pills below stats:**
```tsx
<div
  style={{
    display: 'flex',
    gap: '8px',
    padding: '0 20px 16px',
    overflowX: 'auto',
    WebkitOverflowScrolling: 'touch',
  }}
  className="hide-scrollbar"
>
  {['All', 'Visited', 'Lived', 'Transit', 'Wishlist'].map((filter) => (
    <button
      key={filter}
      onClick={() => setActiveFilter(filter.toLowerCase())}
      className={`transition-all ${
        activeFilter === filter.toLowerCase() ? 'active' : ''
      }`}
      style={{
        padding: '8px 16px',
        background: activeFilter === filter.toLowerCase()
          ? 'linear-gradient(135deg, rgba(212, 165, 116, 0.2) 0%, rgba(193, 139, 94, 0.2) 100%)'
          : 'white',
        border: `2px solid ${activeFilter === filter.toLowerCase() ? '#C18B5E' : '#E8DCC8'}`,
        borderRadius: '20px',
        fontSize: '13px',
        fontWeight: 600,
        color: activeFilter === filter.toLowerCase() ? '#C18B5E' : '#5C4A3A',
        whiteSpace: 'nowrap',
        cursor: 'pointer',
      }}
    >
      {filter}
    </button>
  ))}
</div>

{/* CSS for hiding scrollbar */}
<style>{`
  .hide-scrollbar::-webkit-scrollbar {
    display: none;
  }
`}</style>
```

**Expected Outcome:**
- Horizontal scrolling filter pills
- Active pill has terracotta gradient background
- Inactive pills have light background with border

---

### Phase 11: Add FAB (Floating Action Button)

**Files:** `src/travel/pages/TravelPage.tsx`, `src/travel/pages/VisaPage.tsx`

**Add FAB to both pages:**
```tsx
<button
  onClick={() => openCreateModal()}
  className="fixed rounded-full shadow-lg flex items-center justify-center text-white text-2xl transition-transform active:scale-95"
  style={{
    bottom: '90px',
    right: '30px',
    width: '60px',
    height: '60px',
    background: 'linear-gradient(135deg, #D4A574 0%, #C18B5E 100%)',
    boxShadow: '0 4px 16px rgba(193, 139, 94, 0.4)',
    zIndex: 50,
  }}
  aria-label={`Create new ${viewMode === 'trips' ? 'trip' : 'location'}`}
>
  +
</button>
```

**Expected Outcome:**
- FAB positioned in bottom-right
- Terracotta gradient background
- Opens appropriate modal (trip/location/visa)
- Positioned above mobile navigation

---

### Phase 12: Empty States

**Add to all views when no data:**

```tsx
<div
  style={{
    textAlign: 'center',
    padding: '60px 40px',
    margin: '20px',
    background: 'white',
    borderRadius: '16px',
  }}
>
  <div style={{ fontSize: '64px', marginBottom: '16px', opacity: 0.5 }}>
    ✈️
  </div>
  <div style={{ fontSize: '18px', fontWeight: 700, color: '#5C4A3A', marginBottom: '8px' }}>
    No trips yet
  </div>
  <div style={{ fontSize: '14px', color: '#9B8B7A', lineHeight: 1.5 }}>
    Start planning your next adventure
  </div>
</div>
```

**Expected Outcome:**
- Empty states for trips, locations, visas
- Large emoji, title, subtitle
- Encourages first action

---

## Phase X: Code Quality & Cleanup (Post-Implementation) ⭐ **CRITICAL**

After completing the V2 implementation, perform these code quality improvements based on lessons learned from Notes and Journal modules.

### Step 1: Add Error Boundary (CRITICAL - Do First)

**Why:** Prevents crashes in one feature from taking down entire app

**File:** `src/pages/Travel.tsx`

**Current State:**
```typescript
// ✅ ALREADY IMPLEMENTED - Travel page already has error boundary!
const Travel: React.FC = () => {
  return (
    <FeatureErrorBoundary feature="Travel">
      <div>...</div>
    </FeatureErrorBoundary>
  );
};
```

**Impact:** High - Already done! ✅ No action needed.

---

### Step 2: Investigate and Remove Dead Code

**Why:** Reduces maintenance burden, improves clarity, smaller bundle

**Investigation Commands:**
```bash
# List all component files
find src/travel -name "*.tsx" -o -name "*.ts"

# Check if component is imported anywhere
grep -r "ComponentName" src --exclude-dir=travel

# Check if routed in App.tsx
grep "travel\|Travel" src/App.tsx

# Check exports
grep -r "from.*travel" src
```

**Process:**
1. List all components in legacy directories (`components/layout/`, `components/old/`, etc.)
2. For each component:
   - Search codebase for imports
   - Check if routed in App.tsx
   - Check if exported in index.ts
   - If NOT used → Mark for deletion
3. Delete unused files
4. Clean up barrel exports (index.ts)

**Common Dead Code Patterns:**
- Old TripEditor (replaced by TripFormModalV2)
- Old VisaEditor (replaced by VisaFormModalV2)
- Old PassportEditor (replaced by PassportFormModalV2)
- Unused loading/error states
- Duplicate card components
- View wrapper abstractions

**Example Cleanup:**
```bash
# After investigation, delete unused files
rm src/travel/components/TripEditor.tsx
rm src/travel/components/VisaEditor.tsx
rm src/travel/components/PassportEditor.tsx
rm src/travel/components/ConfirmDialog.tsx

# Update index.ts to remove deleted exports
# (Manual edit to remove references to deleted components)

# Stage deletions
git add -u src/travel/
```

**Expected Impact:** -200 to -1,000 lines depending on module size

---

### Step 3: Replace Duplicate Date Formatting

**Why:** DRY principle, consistent formatting, less code to maintain

**Problem Pattern:**
```typescript
// ❌ DUPLICATE in component (10-20 lines)
const formatRelativeTime = (date: string) => {
  const now = new Date();
  const entryDate = new Date(date);
  const diffMs = now.getTime() - entryDate.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  return entryDate.toLocaleDateString();
};
```

**Solution:**
```typescript
// ✅ USE SHARED UTILITY
import { getRelativeTime } from '@/utils/dateUtils';

// In component:
{getRelativeTime(trip.createdAt)}
```

**Available Utilities in `src/utils/dateUtils.ts`:**
- `getRelativeTime(date)` - Returns "2 hours ago", "Yesterday", etc.
- `isSameDay(date1, date2)` - Compares dates ignoring time
- `formatDateForDisplay(date)` - Returns "Jan 15, 2025"
- `formatDateTimeForDisplay(date)` - Returns "Jan 15, 2025 at 3:30 PM"
- `addDays(date, days)` - Add/subtract days
- `startOfDay(date)` - Set to 00:00:00
- `endOfDay(date)` - Set to 23:59:59

**Search for Duplicates:**
```bash
# Find potential date formatting code
grep -r "toLocaleDateString\|getTime\|setHours.*0.*0.*0" src/travel/components/
```

**Expected Impact:** -15 to -40 lines per card component

---

### Step 4: Replace Framer Motion with CSS Transitions

**Why:** Smaller bundle (-20-30KB), better performance, native browser optimization

**Problem:**
```typescript
// ❌ HEAVY LIBRARY for simple hover/tap effects
import { motion } from 'framer-motion';

<motion.div
  whileHover={{ scale: 1.01 }}
  whileTap={{ scale: 0.98 }}
  transition={{ duration: 0.15 }}
>
```

**Solution:**
```typescript
// ✅ CSS TRANSITIONS (equivalent effect, zero JS)
<div
  className="transition-transform hover:scale-[1.01] active:scale-[0.98]"
  style={{ transitionDuration: '150ms' }}
>
```

**Common Framer Motion Replacements:**

| Framer Motion | CSS Equivalent |
|---------------|----------------|
| `whileHover={{ scale: 1.01 }}` | `hover:scale-[1.01]` |
| `whileTap={{ scale: 0.98 }}` | `active:scale-[0.98]` |
| `whileHover={{ opacity: 0.8 }}` | `hover:opacity-80` |
| `transition={{ duration: 0.15 }}` | `style={{ transitionDuration: '150ms' }}` |
| `initial={{ opacity: 0 }}` | Use CSS `@keyframes` or remove (not needed for simple cards) |

**Search for Usage:**
```bash
# Find Framer Motion imports
grep -r "framer-motion" src/travel/
```

**Expected Impact:** -20-30KB bundle size

---

### Step 5: Use Theme Colors Consistently

**Why:** Automatic dark mode support, consistency, easier theming

**Problem:**
```typescript
// ❌ HARDCODED COLORS (no dark mode support)
<div style={{ color: '#5C4A3A' }}>
<div style={{ backgroundColor: '#F5F0EA' }}>
<div style={{ borderColor: '#E8DCC8' }}>
```

**Solution:**
```typescript
// ✅ THEME COLORS (automatic dark mode)
import { useThemeColors } from '@/hooks/useThemeColors';

const colors = useThemeColors();

<div style={{ color: colors.text.primary }}>
<div style={{ backgroundColor: colors.bg.secondary }}>
<div style={{ borderColor: colors.border.light }}>
```

**Theme Colors Reference:**
```typescript
// Background colors
colors.bg.primary      // Page background
colors.bg.secondary    // Section background
colors.bg.tertiary     // Card accent background
colors.bg.white        // Card background

// Text colors
colors.text.primary    // Headings, important text
colors.text.secondary  // Body text, labels
colors.text.tertiary   // Muted text, timestamps

// Border colors
colors.border.light    // Subtle borders
colors.border.medium   // Standard borders

// Accent colors (terracotta)
colors.accent.start    // #D4A574 (gradient start)
colors.accent.end      // #C18B5E (gradient end)

// Badge colors
colors.badge.bg        // Badge background
colors.badge.text      // Badge text
```

**Search for Hardcoded Colors:**
```bash
# Find hex colors in components
grep -r "#[0-9A-Fa-f]\{6\}" src/travel/components/
```

**Expected Impact:** 5-15 hardcoded colors replaced per module

---

### Step 6: Use Shared Date Comparison Utilities

**Why:** DRY principle, consistent date logic

**Problem:**
```typescript
// ❌ DUPLICATE date comparison (8-10 lines)
const selectedItems = items.filter((item) => {
  const itemDate = new Date(item.createdAt);
  itemDate.setHours(0, 0, 0, 0);
  const selected = new Date(selectedDate);
  selected.setHours(0, 0, 0, 0);
  return itemDate.getTime() === selected.getTime();
});
```

**Solution:**
```typescript
// ✅ USE SHARED UTILITY (1 line)
import { isSameDay } from '@/utils/dateUtils';

const selectedItems = items.filter(item =>
  isSameDay(item.createdAt, selectedDate)
);
```

**Expected Impact:** -8 to -15 lines per occurrence

---

### Step 7: Clean Up Unused Imports

**Why:** Cleaner code, better tree-shaking, smaller bundle

**How:**
```bash
# Build will show warnings
npm run build

# Or use ESLint
npx eslint src/travel --fix
```

**Common Unused Imports After V2 Migration:**
- Old component imports (TripEditor, VisaEditor, PassportEditor)
- Unused icon imports
- Framer Motion
- Unused type imports
- Duplicate utility imports

---

### Step 8: Clean Up Module Exports

**Why:** Clear API, prevents importing deleted components

**File:** `src/travel/index.ts` or `src/travel/components/v2/index.ts`

**Before:**
```typescript
// ❌ Exports deleted/unused components
export { TripEditor } from './components/TripEditor';
export { VisaEditor } from './components/VisaEditor';
export { PassportEditor } from './components/PassportEditor';
export { ConfirmDialog } from './components/ConfirmDialog';
// ... 15+ mixed exports
```

**After:**
```typescript
// ✅ Only export active components, grouped logically

// V2 Components (primary)
export { TripFormModalV2 } from './v2/TripFormModalV2';
export { VisaFormModalV2 } from './v2/VisaFormModalV2';
export { TripCardV2 } from './v2/TripCardV2';
export { LocationCardV2 } from './v2/LocationCardV2';
export { VisaItemCardV2 } from './v2/VisaItemCardV2';
export { TravelStatsBarV2 } from './v2/TravelStatsBarV2';

// Legacy (actively used only)
export { LeafletTravelMapV2 } from './LeafletTravelMapV2'; // Still in use
export { MapLegend } from './MapLegend'; // Still in use
export { PassportSummaryCard } from './PassportSummaryCard'; // Still in use

// Hooks
export { useTravelState } from '../hooks/useTravelState';
```

---

### Step 9: Verification & Testing

**Build Check:**
```bash
# Ensure no TypeScript errors
npx tsc --noEmit

# Ensure build succeeds
npm run build

# Check for warnings
npm run build 2>&1 | grep -i "warning"
```

**Manual Testing:**
- [ ] Feature loads without errors
- [ ] All modals open/close correctly
- [ ] CRUD operations work (trips, locations, visas)
- [ ] Map rendering works
- [ ] Filter pills work
- [ ] Stats display correctly
- [ ] Responsive design intact
- [ ] Error boundary catches errors (test by throwing error)

**Performance Check:**
```bash
# Check bundle size before/after
npm run build -- --stats
```

---

### Code Quality Checklist

After completing all steps, verify:

- [ ] ✅ Error boundary added to main page component (already done!)
- [ ] ✅ Dead code identified and deleted (0 unused files remain)
- [ ] ✅ Duplicate date formatting replaced with `getRelativeTime()`
- [ ] ✅ Duplicate date comparison replaced with `isSameDay()`
- [ ] ✅ Framer Motion replaced with CSS (if applicable)
- [ ] ✅ Theme colors used consistently (no hardcoded hex colors)
- [ ] ✅ Unused imports removed
- [ ] ✅ Module exports cleaned up (only active components exported)
- [ ] ✅ Build succeeds with no errors or warnings
- [ ] ✅ Manual testing completed successfully
- [ ] ✅ Module marked as 100% CLAUDE.md compliant

---

### Expected Overall Impact

**Metrics:**
- Lines removed: -200 to -1,000 (varies by module complexity)
- Files deleted: 3-10 legacy components
- Bundle size: -20-40KB (if Framer Motion removed)
- Error boundaries: Already in place ✅
- Code grade: C/D range → A (95/100)

**Benefits:**
- ✅ Crash isolation (errors don't take down entire app)
- ✅ Smaller bundle (faster load times)
- ✅ Less maintenance (no duplicate code)
- ✅ Consistent theming (dark mode ready)
- ✅ Better performance (CSS vs JS animations)
- ✅ Cleaner codebase (easier to understand)

---

## File Modification Summary

**Files to Create:** 6
- ✏️ `src/travel/components/v2/TravelStatsBarV2.tsx`
- ✏️ `src/travel/components/v2/TripFormModalV2.tsx`
- ✏️ `src/travel/components/v2/VisaFormModalV2.tsx`
- ✏️ `src/travel/components/v2/TripCardV2.tsx`
- ✏️ `src/travel/components/v2/LocationCardV2.tsx`
- ✏️ `src/travel/components/v2/VisaItemCardV2.tsx`

**Files to Update:** 6
- ✏️ `src/pages/Travel.tsx` - Update header with gradient
- ✏️ `src/travel/pages/TravelPage.tsx` - Add stats bar, filter pills, FAB
- ✏️ `src/travel/pages/VisaPage.tsx` - Add passport summary, visa list, FAB
- ✏️ `src/travel/components/PassportSummaryCard.tsx` - Match design spec styling
- ✏️ `src/travel/components/MapLegend.tsx` - Match design spec colors
- ✏️ `src/travel/components/LeafletTravelMapV2.tsx` - Keep as-is (complex)

**Files to Delete (After Investigation):** 3-5
- 🗑️ `src/travel/components/TripEditor.tsx` (replaced by TripFormModalV2)
- 🗑️ `src/travel/components/VisaEditor.tsx` (replaced by VisaFormModalV2)
- 🗑️ `src/travel/components/PassportEditor.tsx` (replaced by PassportFormModalV2)
- 🗑️ `src/travel/components/ConfirmDialog.tsx` (use standard modals)
- 🗑️ Other unused legacy components (after investigation)

**Reference Files:** 4
- 📖 `travel-design-spec.html`
- 📖 `src/pages/Together.tsx`
- 📖 `src/pages/Notes.tsx`
- 📖 `CLAUDE.md`

---

## Commit Message Template

```bash
feat: Complete Travel tab UI/UX enhancement with Together patterns

Updated Travel feature to match travel-design-spec.html and apply all 25
UI/UX enhancement patterns from CLAUDE.md. Major improvements include:

UI Components:
- Updated header: Terracotta gradient with clean title
- Created TravelStatsBarV2: 4-column stats (countries, continents, cities, trips)
- Created TripCardV2: Enhanced trip cards with cover images, status badges
- Created LocationCardV2: Country/location cards with progress bars
- Created VisaItemCardV2: Visa cards with expiry warnings
- Updated PassportSummaryCard: Flag emoji, rank, visa-free stats grid
- Updated MapLegend: Design spec colors for visited/lived/transit/wishlist

Modals (Together Pattern):
- TripFormModalV2: Complete trip creation/editing
  - Status as button grid (planning/upcoming/in_progress/completed)
  - Budget with currency selector
  - Tags input
  - Date range picker
  - Auto-save to localStorage
- VisaFormModalV2: Visa tracking with expiry alerts
  - Country dropdown with flag emojis
  - Visa type as button grid
  - Entry type as radio cards
  - Expiry warning based on days remaining
  - Auto-save support
- Mobile drag handles, fixed headers/footers, scrollable content
- ESC key and backdrop support

Page Layout:
- Header with terracotta gradient (matches design spec)
- SegmentedControl for tab navigation
- Stats bar below header
- Filter pills (All/Visited/Lived/Transit/Wishlist)
- FAB for adding trips/locations/visas
- Centered content (900px max-width)

Features:
- 3 views: Map, Visa, Bucket List
- Interactive world map (Leaflet)
- Trip management (planning → completed)
- Visa tracking with expiry alerts (<30 days = warning)
- Passport power statistics
- Location tracking (countries, states, cities, national parks)
- Stats tracking (continents, countries, cities visited)
- Filter by visit status

Map Features:
- Color-coded countries (visited/lived/transit/wishlist)
- Legend with design spec colors
- Interactive markers
- Country status modal

Code Quality:
- Removed 4 legacy components (TripEditor, VisaEditor, PassportEditor, ConfirmDialog)
- Replaced duplicate date formatting with shared utilities
- Used theme colors consistently
- Cleaned up unused imports
- Module exports organized

Technical:
- All V2 components in src/travel/components/v2/
- Error boundary already in place ✅
- Lazy loading for heavy map components
- Responsive mobile/desktop behavior
- Auto-save for all modals

Fixes:
- Header matches design spec (terracotta gradient)
- Stats display correctly
- Visa expiry warnings color-coded
- Passport card styling matches design
- Trip cards show cover images/placeholders
- Empty states for all views

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

---

## Success Criteria

✅ Travel page matches `travel-design-spec.html` exactly
✅ All 25 UI/UX patterns from CLAUDE.md applied
✅ All modals match Together pattern
✅ Auto-save functionality works
✅ Stats bar displays key metrics
✅ Filter pills work correctly
✅ Map rendering works (Leaflet)
✅ Visa expiry warnings color-coded
✅ Passport summary matches design
✅ Trip cards with cover images
✅ Location cards with progress bars
✅ FAB for creating trips/locations/visas
✅ Responsive mobile/desktop
✅ Accessible
✅ No console errors

---

## Travel-Specific Challenges

### Challenge 1: Map Integration (Leaflet)

**Solution:**
- Keep existing LeafletTravelMapV2 component (complex, works well)
- Update MapLegend to match design spec colors
- Ensure map container has proper styling (rounded corners, shadow)

### Challenge 2: Visa Expiry Alerts

**Solution:**
- Calculate days until expiry in VisaItemCardV2
- Color coding:
  - Red (❌) if expired (< 0 days)
  - Orange (⚠️) if expiring soon (< 30 days)
  - Gray (✅) if valid (> 30 days)
- Show warning in VisaFormModalV2 when editing

### Challenge 3: Passport Power Stats

**Solution:**
- Use existing passport power data from `src/travel/data/passportPower.ts`
- Display visa-free and visa-on-arrival counts
- Show passport rank
- Large flag emoji for visual impact

### Challenge 4: Multiple Location Types

**Solution:**
- Support countries, states, cities, national parks, islands
- Use LocationCardV2 for all types
- Different icons for each type:
  - 🌍 Countries
  - 🏞️ States
  - 🏙️ Cities
  - 🏕️ National Parks
  - 🏝️ Islands

### Challenge 5: Trip Status Workflow

**Solution:**
- 5 statuses: planning → upcoming → in_progress → completed (+ cancelled)
- Color coding for each status (see TripCardV2)
- Status as button grid in modal (easy selection)

---

## Notes

- Travel page already has FeatureErrorBoundary ✅
- Map component (LeafletTravelMapV2) is complex - keep as-is, just update styling
- Visa expiry alerts are critical for user value
- Stats bar provides quick overview of travel achievements
- Filter pills allow easy filtering by visit status
- FAB enables quick creation of trips/locations/visas from any view
