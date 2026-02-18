# Self Care Tab Implementation Plan

## Context

The Self Care feature needs to be **implemented from scratch** to match the design specifications in `selfcare-design-spec.html` and apply all 25 UI/UX enhancement patterns from CLAUDE.md (established by the Together tab reference implementation).

**Current State:**
- ❌ Self Care feature **does not exist yet** in the codebase
- No components, no pages, no database schema
- This is a **greenfield implementation**

**Goal:**
- Implement complete Self Care feature matching `selfcare-design-spec.html` exactly
- Apply all Together tab UI patterns from the start
- Create database schema for self-care activities
- Build 5 main views: Routines, Schedule, Tasks, Products, Categories
- Ensure responsive mobile/desktop behavior

**Why This Matters:**
- Self-care tracking is essential for wellness and personal growth
- Combines routine management, scheduling, product tracking, and tasks
- Will serve as reference for implementing new features from scratch
- Demonstrates applying all patterns to greenfield code

---

## Critical Files to Create

### Main Page
1. `src/pages/SelfCare.tsx` - Main page with 5 tabs

### View Components (5 Views)
2. `src/selfcare/pages/RoutinesView.tsx` - Morning/evening routines table
3. `src/selfcare/pages/ScheduleView.tsx` - Calendar appointments
4. `src/selfcare/pages/TasksView.tsx` - Self-care tasks list
5. `src/selfcare/pages/ProductsView.tsx` - Product tracking grid
6. `src/selfcare/pages/CategoriesView.tsx` - Category management

### Modal Components (V2 from start)
7. `src/selfcare/components/modals/RoutineFormModalV2.tsx` - Add/edit routines
8. `src/selfcare/components/modals/AppointmentFormModalV2.tsx` - Schedule appointments
9. `src/selfcare/components/modals/TaskFormModalV2.tsx` - Add/edit tasks
10. `src/selfcare/components/modals/ProductFormModalV2.tsx` - Add/edit products
11. `src/selfcare/components/modals/CategoryFormModalV2.tsx` - Add/edit categories

### Card Components
12. `src/selfcare/components/cards/RoutineTableV2.tsx` - Weekly routine table
13. `src/selfcare/components/cards/AppointmentCardV2.tsx` - Appointment cards
14. `src/selfcare/components/cards/TaskCardV2.tsx` - Task cards
15. `src/selfcare/components/cards/ProductCardV2.tsx` - Product cards
16. `src/selfcare/components/cards/CategoryCardV2.tsx` - Category cards

### Calendar Component
17. `src/selfcare/components/calendar/MonthCalendarV2.tsx` - Month view calendar

### Hooks
18. `src/selfcare/hooks/useSelfCareState.ts` - Tab navigation state
19. `src/hooks/useSelfCareQuery.ts` - React Query hooks for data

### Database Schema
20. Database migrations for self-care tables

### Reference Files (Do NOT Modify)
- `src/pages/Together.tsx` - Reference implementation
- `src/together/components/modals/*.tsx` - Modal examples
- `selfcare-design-spec.html` - Design specification
- `CLAUDE.md` - UI/UX standards

---

## Database Schema Design

### Tables to Create

```sql
-- Self Care Routines
CREATE TABLE selfcare_routines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  routine_type VARCHAR(20) NOT NULL, -- 'morning' or 'evening'
  day_of_week VARCHAR(10) NOT NULL, -- 'monday', 'tuesday', etc.
  activities TEXT NOT NULL, -- Comma-separated or JSON array
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Self Care Appointments
CREATE TABLE selfcare_appointments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  title VARCHAR(255) NOT NULL,
  category VARCHAR(50), -- 'spa', 'haircare', 'medical', 'wellness', etc.
  date_time TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER,
  location TEXT,
  notes TEXT,
  reminder_minutes INTEGER, -- Minutes before to remind
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Self Care Tasks
CREATE TABLE selfcare_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  title VARCHAR(255) NOT NULL,
  category VARCHAR(50), -- 'skincare', 'haircare', 'wellness', etc.
  due_date DATE,
  status VARCHAR(20) DEFAULT 'upcoming', -- 'upcoming', 'due', 'completed'
  priority VARCHAR(10), -- 'low', 'medium', 'high'
  notes TEXT,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Self Care Products
CREATE TABLE selfcare_products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  name VARCHAR(255) NOT NULL,
  brand VARCHAR(255),
  category VARCHAR(50), -- 'skincare', 'haircare', 'body', 'wellness', etc.
  purchase_date DATE,
  expiry_date DATE,
  price DECIMAL(10, 2),
  rating INTEGER, -- 1-5
  notes TEXT,
  repurchase BOOLEAN,
  photo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Self Care Categories
CREATE TABLE selfcare_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  name VARCHAR(100) NOT NULL,
  icon VARCHAR(10), -- Emoji
  color VARCHAR(7), -- Hex color
  item_count INTEGER DEFAULT 0, -- Cached count
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Self Care Category Items (activities within categories)
CREATE TABLE selfcare_category_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id UUID NOT NULL REFERENCES selfcare_categories(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  schedule VARCHAR(50), -- 'daily', 'weekly', 'monthly', etc.
  active BOOLEAN DEFAULT TRUE,
  last_completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_selfcare_routines_user_day ON selfcare_routines(user_id, day_of_week);
CREATE INDEX idx_selfcare_appointments_user_date ON selfcare_appointments(user_id, date_time);
CREATE INDEX idx_selfcare_tasks_user_due ON selfcare_tasks(user_id, due_date);
CREATE INDEX idx_selfcare_products_user_category ON selfcare_products(user_id, category);
CREATE INDEX idx_selfcare_categories_user ON selfcare_categories(user_id);
```

---

## Implementation Plan

### Phase 1: Create Main Page

**File:** `src/pages/SelfCare.tsx` (Create new)

**Implementation:**
```tsx
import React from 'react';
import { Heart } from 'lucide-react';
import { FeatureErrorBoundary } from '../components/FeatureErrorBoundary';
import { useThemeColors } from '@/hooks/useThemeColors';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { useSelfCareState, type SelfCareTabView } from '@/selfcare/hooks/useSelfCareState';

// Lazy load view components
const RoutinesView = React.lazy(() => import('../selfcare/pages/RoutinesView'));
const ScheduleView = React.lazy(() => import('../selfcare/pages/ScheduleView'));
const TasksView = React.lazy(() => import('../selfcare/pages/TasksView'));
const ProductsView = React.lazy(() => import('../selfcare/pages/ProductsView'));
const CategoriesView = React.lazy(() => import('../selfcare/pages/CategoriesView'));

const SelfCare: React.FC = () => {
  const colors = useThemeColors();
  const { activeTab, setActiveTab } = useSelfCareState();

  return (
    <FeatureErrorBoundary feature="SelfCare">
      <div
        style={{ backgroundColor: colors.bg.primary, minHeight: '100vh' }}
        data-testid="selfcare-container"
      >
        {/* Header */}
        <div
          style={{
            background: 'linear-gradient(135deg, #D4A574 0%, #C18B5E 100%)',
            padding: '60px 20px 20px',
            color: 'white',
            marginBottom: '16px'
          }}
        >
          <h1 style={{ fontSize: '32px', fontWeight: '800', marginBottom: '8px' }}>
            💆 Self Care
          </h1>
          <div style={{ fontSize: '14px', opacity: 0.9 }}>
            Wellness routines & self-love
          </div>
        </div>

        {/* Tab Navigation */}
        <div style={{ background: 'rgba(92, 74, 58, 0.1)', borderRadius: '12px', padding: '4px', margin: '16px 20px' }}>
          <SegmentedControl
            scrollable
            segments={[
              { value: 'routines', label: 'Routines' },
              { value: 'schedule', label: 'Schedule' },
              { value: 'tasks', label: 'Tasks' },
              { value: 'products', label: 'Products' },
              { value: 'categories', label: 'Categories' },
            ]}
            value={activeTab}
            onChange={(value) => setActiveTab(value as SelfCareTabView)}
          />
        </div>

        {/* Tab Content */}
        <div className="pb-6">
          <React.Suspense
            fallback={
              <div className="text-center py-12" style={{ color: colors.text.tertiary }}>
                Loading...
              </div>
            }
          >
            {activeTab === 'routines' && <RoutinesView />}
            {activeTab === 'schedule' && <ScheduleView />}
            {activeTab === 'tasks' && <TasksView />}
            {activeTab === 'products' && <ProductsView />}
            {activeTab === 'categories' && <CategoriesView />}
          </React.Suspense>
        </div>
      </div>
    </FeatureErrorBoundary>
  );
};

export default SelfCare;
```

**Expected Outcome:**
- Main page with terracotta gradient header
- 5 tabs using SegmentedControl (scrollable)
- Lazy loading for all views
- Error boundary wrapping feature
- Matches design spec exactly

---

### Phase 2: Create RoutineTableV2 Component

**File:** `src/selfcare/components/cards/RoutineTableV2.tsx` (Create new)

**Purpose:** Display weekly routines in table format

**Implementation:**
```tsx
import React from 'react';
import { useThemeColors } from '@/hooks/useThemeColors';
import { Edit2 } from 'lucide-react';

interface RoutineData {
  day: string;
  morning: string;
  evening: string;
}

interface RoutineTableV2Props {
  routines: RoutineData[];
  onEdit: (day: string, type: 'morning' | 'evening') => void;
}

export const RoutineTableV2: React.FC<RoutineTableV2Props> = ({ routines, onEdit }) => {
  const colors = useThemeColors();

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  return (
    <div
      style={{
        background: 'white',
        margin: '0 20px 16px',
        borderRadius: '16px',
        overflow: 'hidden',
        boxShadow: '0 2px 12px rgba(92, 74, 58, 0.08)',
      }}
    >
      {/* Header Row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '80px 1fr 1fr',
          borderBottom: '1px solid #E8DCC8',
        }}
      >
        <div style={{ padding: '16px 12px', fontSize: '11px', fontWeight: 700, color: '#C18B5E', textTransform: 'uppercase', background: 'linear-gradient(135deg, rgba(212, 165, 116, 0.1) 0%, rgba(193, 139, 94, 0.1) 100%)', borderRight: '1px solid #E8DCC8' }}>
          Day
        </div>
        <div style={{ padding: '16px 12px', fontSize: '11px', fontWeight: 700, color: '#C18B5E', textTransform: 'uppercase', background: 'linear-gradient(135deg, rgba(212, 165, 116, 0.1) 0%, rgba(193, 139, 94, 0.1) 100%)', borderRight: '1px solid #E8DCC8' }}>
          Morning
        </div>
        <div style={{ padding: '16px 12px', fontSize: '11px', fontWeight: 700, color: '#C18B5E', textTransform: 'uppercase', background: 'linear-gradient(135deg, rgba(212, 165, 116, 0.1) 0%, rgba(193, 139, 94, 0.1) 100%)' }}>
          Evening
        </div>
      </div>

      {/* Data Rows */}
      {days.map((day) => {
        const routine = routines.find(r => r.day.toLowerCase() === day.toLowerCase());

        return (
          <div
            key={day}
            style={{
              display: 'grid',
              gridTemplateColumns: '80px 1fr 1fr',
              borderBottom: '1px solid #E8DCC8',
            }}
          >
            <div style={{ padding: '16px 12px', fontSize: '13px', fontWeight: 700, color: '#5C4A3A', background: '#FAFAFA', borderRight: '1px solid #E8DCC8' }}>
              {day.slice(0, 3)}
            </div>
            <div
              onClick={() => onEdit(day, 'morning')}
              className="cursor-pointer hover:bg-gray-50 transition-colors"
              style={{
                padding: '12px',
                fontSize: '12px',
                color: routine?.morning ? '#6B5847' : '#9B8B7A',
                lineHeight: 1.5,
                borderRight: '1px solid #E8DCC8',
                fontStyle: routine?.morning ? 'normal' : 'italic',
                position: 'relative',
              }}
            >
              {routine?.morning || 'Not set'}
              <Edit2 size={12} style={{ position: 'absolute', top: '12px', right: '8px', opacity: 0.3 }} />
            </div>
            <div
              onClick={() => onEdit(day, 'evening')}
              className="cursor-pointer hover:bg-gray-50 transition-colors"
              style={{
                padding: '12px',
                fontSize: '12px',
                color: routine?.evening ? '#6B5847' : '#9B8B7A',
                lineHeight: 1.5,
                fontStyle: routine?.evening ? 'normal' : 'italic',
                position: 'relative',
              }}
            >
              {routine?.evening || 'Not set'}
              <Edit2 size={12} style={{ position: 'absolute', top: '12px', right: '8px', opacity: 0.3 }} />
            </div>
          </div>
        );
      })}
    </div>
  );
};
```

**Expected Outcome:**
- Weekly table with 7 rows (days)
- Morning/evening columns
- Click to edit each cell
- Matches design spec table styling

---

### Phase 3: Create MonthCalendarV2 Component

**File:** `src/selfcare/components/calendar/MonthCalendarV2.tsx` (Create new)

**Purpose:** Calendar for scheduling appointments

**Implementation:**
```tsx
import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useThemeColors } from '@/hooks/useThemeColors';

interface CalendarDay {
  date: Date;
  isToday: boolean;
  isOtherMonth: boolean;
  hasTasks: boolean;
}

interface MonthCalendarV2Props {
  selectedMonth: Date;
  onMonthChange: (newMonth: Date) => void;
  onDateClick: (date: Date) => void;
  appointmentDates: Date[];
}

export const MonthCalendarV2: React.FC<MonthCalendarV2Props> = ({
  selectedMonth,
  onMonthChange,
  onDateClick,
  appointmentDates,
}) => {
  const colors = useThemeColors();

  // Generate calendar days
  const generateCalendarDays = (): CalendarDay[] => {
    // Calendar generation logic
    // ... implementation
    return [];
  };

  const calendarDays = generateCalendarDays();

  const goToPreviousMonth = () => {
    const newMonth = new Date(selectedMonth);
    newMonth.setMonth(newMonth.getMonth() - 1);
    onMonthChange(newMonth);
  };

  const goToNextMonth = () => {
    const newMonth = new Date(selectedMonth);
    newMonth.setMonth(newMonth.getMonth() + 1);
    onMonthChange(newMonth);
  };

  return (
    <div
      style={{
        background: 'white',
        margin: '0 20px 16px',
        borderRadius: '16px',
        padding: '16px',
        boxShadow: '0 2px 12px rgba(92, 74, 58, 0.08)',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div style={{ fontSize: '16px', fontWeight: 700, color: '#5C4A3A' }}>
          {selectedMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={goToPreviousMonth}
            className="hover:bg-gray-100 transition-colors"
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'rgba(212, 165, 116, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: 'none',
              cursor: 'pointer',
            }}
            aria-label="Previous month"
          >
            <ChevronLeft size={18} style={{ color: '#C18B5E' }} />
          </button>
          <button
            onClick={goToNextMonth}
            className="hover:bg-gray-100 transition-colors"
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'rgba(212, 165, 116, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: 'none',
              cursor: 'pointer',
            }}
            aria-label="Next month"
          >
            <ChevronRight size={18} style={{ color: '#C18B5E' }} />
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
        {/* Day labels */}
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
          <div
            key={i}
            style={{
              textAlign: 'center',
              fontSize: '11px',
              fontWeight: 700,
              color: '#9B8B7A',
              padding: '8px 4px',
            }}
          >
            {day}
          </div>
        ))}

        {/* Calendar days */}
        {calendarDays.map((day, i) => (
          <div
            key={i}
            onClick={() => !day.isOtherMonth && onDateClick(day.date)}
            className={!day.isOtherMonth ? 'cursor-pointer hover:opacity-70' : ''}
            style={{
              aspectRatio: '1',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 600,
              color: day.isOtherMonth ? '#D4C5B3' : '#5C4A3A',
              background: day.isToday
                ? 'linear-gradient(135deg, rgba(212, 165, 116, 0.2) 0%, rgba(193, 139, 94, 0.2) 100%)'
                : day.hasTasks
                ? '#E8DCC8'
                : 'transparent',
            }}
          >
            {day.date.getDate()}
            {day.hasTasks && (
              <div style={{ width: '4px', height: '4px', borderRadius: '2px', background: '#C18B5E', marginTop: '2px' }} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
```

**Expected Outcome:**
- Month calendar with navigation
- Today highlighted with gradient
- Days with appointments show dot
- Click date to view/add appointments

---

### Phase 4: Create Product Card Components

**File:** `src/selfcare/components/cards/ProductCardV2.tsx` (Create new)

**Purpose:** Display product cards in grid

**Implementation:**
```tsx
import React from 'react';
import { useThemeColors } from '@/hooks/useThemeColors';
import type { SelfCareProduct } from '@/selfcare/types';

interface ProductCardV2Props {
  product: SelfCareProduct;
  onClick: () => void;
}

export const ProductCardV2: React.FC<ProductCardV2Props> = ({ product, onClick }) => {
  const colors = useThemeColors();

  const renderStars = (rating: number) => {
    return (
      <div style={{ display: 'flex', gap: '2px' }}>
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            style={{
              fontSize: '14px',
              color: star <= rating ? '#D4A574' : '#E8DCC8',
            }}
          >
            ★
          </span>
        ))}
      </div>
    );
  };

  return (
    <div
      onClick={onClick}
      className="cursor-pointer transition-transform active:scale-[0.98]"
      style={{
        background: 'white',
        borderRadius: '12px',
        padding: '16px',
        boxShadow: '0 2px 12px rgba(92, 74, 58, 0.08)',
        position: 'relative',
      }}
    >
      {/* Category Badge */}
      <div
        style={{
          position: 'absolute',
          top: '12px',
          right: '12px',
          padding: '4px 8px',
          background: '#E8DCC8',
          borderRadius: '8px',
          fontSize: '10px',
          fontWeight: 700,
          color: '#6B5847',
          textTransform: 'uppercase',
        }}
      >
        {product.category}
      </div>

      {/* Product Name */}
      <div
        style={{
          fontSize: '14px',
          fontWeight: 700,
          color: '#5C4A3A',
          marginBottom: '4px',
          paddingRight: '60px',
        }}
      >
        {product.name}
      </div>

      {/* Brand */}
      <div style={{ fontSize: '12px', color: '#9B8B7A', marginBottom: '8px' }}>
        {product.brand}
      </div>

      {/* Meta Info */}
      {product.expiryDate && (
        <div style={{ fontSize: '11px', color: '#6B5847', marginBottom: '8px' }}>
          Expires: {new Date(product.expiryDate).toLocaleDateString()}
        </div>
      )}

      {/* Rating */}
      {product.rating && renderStars(product.rating)}
    </div>
  );
};
```

**Expected Outcome:**
- 2-column grid of product cards
- Category badge in corner
- Star rating display
- Expiry date warning

---

### Phase 5: Create Modal Components (Together Pattern)

**All modals follow Together pattern exactly**

**Files to Create:**
1. **RoutineFormModalV2.tsx** - Edit morning/evening routine for a day
2. **AppointmentFormModalV2.tsx** - Schedule spa, haircut, wellness appointments
3. **TaskFormModalV2.tsx** - Add self-care tasks with due dates
4. **ProductFormModalV2.tsx** - Add skincare/haircare products
5. **CategoryFormModalV2.tsx** - Create custom self-care categories

**All modals include:**
- Mobile drag handle
- Fixed header with close button
- Scrollable content area
- Fixed footer with Cancel/Save buttons
- Auto-save to localStorage
- ESC key and backdrop support
- Field validation

---

### Phase 6: Implement RoutinesView

**File:** `src/selfcare/pages/RoutinesView.tsx` (Create new)

**Layout:**
```tsx
<div style={{ paddingBottom: '100px' }}>
  {/* Owner Filter (if merged mode) */}
  {mergedConnection && <OwnerFilter />}

  {/* Routine Table */}
  <RoutineTableV2
    routines={routines}
    onEdit={handleEditRoutine}
  />

  {/* Empty State */}
  {routines.length === 0 && (
    <EmptyState
      icon="💆"
      title="No routines set"
      subtitle="Create morning and evening routines for each day"
    />
  )}
</div>
```

---

### Phase 7: Implement ScheduleView

**File:** `src/selfcare/pages/ScheduleView.tsx` (Create new)

**Layout:**
```tsx
<div style={{ paddingBottom: '100px' }}>
  {/* Calendar */}
  <MonthCalendarV2
    selectedMonth={selectedMonth}
    onMonthChange={setSelectedMonth}
    onDateClick={handleDateClick}
    appointmentDates={appointmentDates}
  />

  {/* Upcoming Appointments */}
  <h2>Upcoming</h2>
  {upcomingAppointments.map(apt => (
    <AppointmentCardV2 key={apt.id} appointment={apt} onClick={() => handleEdit(apt)} />
  ))}

  {/* FAB */}
  <FAB onClick={() => openCreateModal()} />
</div>
```

---

### Phase 8: Implement TasksView

**File:** `src/selfcare/pages/TasksView.tsx` (Create new)

**Layout:**
```tsx
<div style={{ padding: '0 20px 100px' }}>
  {/* Tasks List */}
  {tasks.map(task => (
    <TaskCardV2
      key={task.id}
      task={task}
      onClick={() => handleEdit(task)}
      onComplete={() => handleComplete(task.id)}
    />
  ))}

  {/* FAB */}
  <FAB onClick={() => openCreateModal()} />
</div>
```

---

### Phase 9: Implement ProductsView

**File:** `src/selfcare/pages/ProductsView.tsx` (Create new)

**Layout:**
```tsx
<div style={{ padding: '0 20px 100px' }}>
  {/* Products Grid */}
  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
    {products.map(product => (
      <ProductCardV2
        key={product.id}
        product={product}
        onClick={() => handleEdit(product)}
      />
    ))}
  </div>

  {/* FAB */}
  <FAB onClick={() => openCreateModal()} />
</div>
```

---

### Phase 10: Implement CategoriesView

**File:** `src/selfcare/pages/CategoriesView.tsx` (Create new)

**Layout:**
```tsx
<div style={{ padding: '0 20px 100px' }}>
  {/* Categories List */}
  {categories.map(category => (
    <CategoryCardV2
      key={category.id}
      category={category}
      items={categoryItems[category.id] || []}
      onAddItem={(catId) => openAddItemModal(catId)}
      onEditCategory={() => handleEditCategory(category)}
    />
  ))}

  {/* FAB */}
  <FAB onClick={() => openCreateCategoryModal()} />
</div>
```

---

## Phase X: Code Quality & Cleanup (Post-Implementation) ⭐ **CRITICAL**

### Step 1: Add Error Boundary (CRITICAL - Do First)

**File:** `src/pages/SelfCare.tsx`

**Implementation:**
```typescript
// ✅ IMPLEMENT FROM START
const SelfCare: React.FC = () => {
  return (
    <FeatureErrorBoundary feature="SelfCare">
      <div>...</div>
    </FeatureErrorBoundary>
  );
};
```

**Impact:** High - Built in from day one! ✅

---

### Step 2-9: Apply Best Practices from Start

Since this is greenfield implementation:
- ✅ Use shared date utilities from start (getRelativeTime, isSameDay)
- ✅ Use CSS transitions (no Framer Motion)
- ✅ Use theme colors consistently (useThemeColors)
- ✅ Clean module exports from start
- ✅ All V2 components (no legacy code)
- ✅ Together pattern modals from start
- ✅ Build verification before first commit

---

## File Creation Summary

**Files to Create:** 20+

**Main Page:** 1
- ✏️ `src/pages/SelfCare.tsx`

**Views:** 5
- ✏️ `src/selfcare/pages/RoutinesView.tsx`
- ✏️ `src/selfcare/pages/ScheduleView.tsx`
- ✏️ `src/selfcare/pages/TasksView.tsx`
- ✏️ `src/selfcare/pages/ProductsView.tsx`
- ✏️ `src/selfcare/pages/CategoriesView.tsx`

**Modals:** 5
- ✏️ `src/selfcare/components/modals/RoutineFormModalV2.tsx`
- ✏️ `src/selfcare/components/modals/AppointmentFormModalV2.tsx`
- ✏️ `src/selfcare/components/modals/TaskFormModalV2.tsx`
- ✏️ `src/selfcare/components/modals/ProductFormModalV2.tsx`
- ✏️ `src/selfcare/components/modals/CategoryFormModalV2.tsx`

**Cards:** 5
- ✏️ `src/selfcare/components/cards/RoutineTableV2.tsx`
- ✏️ `src/selfcare/components/cards/AppointmentCardV2.tsx`
- ✏️ `src/selfcare/components/cards/TaskCardV2.tsx`
- ✏️ `src/selfcare/components/cards/ProductCardV2.tsx`
- ✏️ `src/selfcare/components/cards/CategoryCardV2.tsx`

**Calendar:** 1
- ✏️ `src/selfcare/components/calendar/MonthCalendarV2.tsx`

**Hooks:** 2
- ✏️ `src/selfcare/hooks/useSelfCareState.ts`
- ✏️ `src/hooks/useSelfCareQuery.ts`

**Database:** 1
- ✏️ Database migration file with 6 tables

**Types:** 1
- ✏️ `src/selfcare/types.ts`

**Reference Files:** 4
- 📖 `selfcare-design-spec.html`
- 📖 `src/pages/Together.tsx`
- 📖 `src/pages/Notes.tsx`
- 📖 `CLAUDE.md`

---

## Commit Message Template

```bash
feat: Implement Self Care feature with 5 views

Implemented complete Self Care feature from scratch matching
selfcare-design-spec.html and applying all 25 UI/UX patterns from
CLAUDE.md. This is a greenfield implementation.

Database Schema:
- Created 6 tables: routines, appointments, tasks, products,
  categories, category_items
- Added indexes for performance
- Full RLS policies for user data isolation

UI Components:
- Created main page with terracotta gradient header
- 5 views: Routines, Schedule, Tasks, Products, Categories
- RoutineTableV2: Weekly table with morning/evening columns
- MonthCalendarV2: Calendar with appointment dots
- TaskCardV2: Self-care task cards with status
- ProductCardV2: Product grid with ratings and expiry
- CategoryCardV2: Expandable category management

Modals (Together Pattern) - All new:
- RoutineFormModalV2: Edit daily routines
- AppointmentFormModalV2: Schedule wellness appointments
- TaskFormModalV2: Add self-care tasks
- ProductFormModalV2: Track skincare/haircare products
- CategoryFormModalV2: Create custom categories
- All modals: Auto-save, ESC key, backdrop, mobile drag handles

Features (5 Views):
- Routines: Weekly morning/evening routine table
- Schedule: Month calendar with appointments
- Tasks: Self-care tasks with due dates and priorities
- Products: Skincare/haircare product tracking with ratings
- Categories: Custom category management with activities

Technical:
- All V2 components from start (no legacy code)
- Error boundary built in
- Lazy loading for all 5 views
- React Query for data fetching
- Responsive mobile/desktop
- Built with best practices from day one

Code Quality:
- Used shared date utilities from start
- CSS transitions (no Framer Motion)
- Theme colors consistent
- Clean module exports
- Together pattern modals
- Build verification passed

Implementation Notes:
- Greenfield implementation (no existing code)
- Applied all CLAUDE.md patterns from start
- No dead code or legacy components
- 100% compliant with UI/UX standards

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

---

## Success Criteria

✅ Self Care page matches `selfcare-design-spec.html` exactly
✅ All 25 UI/UX patterns from CLAUDE.md applied
✅ Database schema created and migrated
✅ All 5 views implemented and working
✅ All modals match Together pattern
✅ Routine table displays weekly view
✅ Calendar shows appointments
✅ Product tracking with ratings
✅ Category management working
✅ Responsive mobile/desktop
✅ Accessible
✅ No console errors
✅ 100% CLAUDE.md compliant from day one

---

## Self Care-Specific Challenges

### Challenge 1: Weekly Routine Table

**Solution:**
- Grid layout with 3 columns (day, morning, evening)
- 7 rows for each day of week
- Click cells to edit
- Store routines by day and type

### Challenge 2: Calendar with Appointments

**Solution:**
- Month view with day dots for appointments
- Navigate previous/next month
- Click day to add/view appointments
- Highlight today with gradient

### Challenge 3: Product Expiry Tracking

**Solution:**
- Store expiry dates in database
- Show warning if expiring soon (<30 days)
- Color code expired products
- Sort by expiry date

### Challenge 4: Category Management

**Solution:**
- Expandable category cards
- Each category has multiple items
- Track item schedule (daily, weekly, monthly)
- Show active/inactive status

### Challenge 5: Multiple Entity Types

**Solution:**
- Separate database tables for each type
- Unified React Query hooks
- Shared modal pattern across all types
- Consistent card styling

---

## Notes

- Self Care is a **new feature** - no existing code to refactor
- Apply all best practices from day one
- No legacy components or dead code
- Build with Together pattern from start
- 5 views provide comprehensive self-care tracking
- Weekly routine table is unique UI element
- Product tracking includes expiry warnings
- Category system allows customization
