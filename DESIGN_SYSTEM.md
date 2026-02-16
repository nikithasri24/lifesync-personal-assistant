# LifeSync Design System
## iOS-Native Mobile-First Design

Last Updated: 2026-02-16

---

## 🎨 Design Philosophy

**Principles:**
- **Mobile-First**: Optimized for iPhone usage
- **iOS-Native Feel**: Follow Apple Human Interface Guidelines
- **Consistent**: Same patterns across all features
- **Accessible**: Large touch targets, readable text
- **Spacious**: Generous padding and margins
- **Clean**: Minimal borders, soft shadows, clear hierarchy

---

## 📐 Typography Scale

Based on iOS San Francisco font standards:

```typescript
const typography = {
  // Page/Screen Titles
  hero: {
    fontSize: '34px',      // 34pt
    fontWeight: '700',     // Bold
    lineHeight: '41px',
    letterSpacing: '-0.4px'
  },

  // Large Titles (iOS style)
  largeTitle: {
    fontSize: '28px',      // 28pt
    fontWeight: '700',
    lineHeight: '34px',
    letterSpacing: '-0.3px'
  },

  // Section Headers
  title1: {
    fontSize: '22px',      // 22pt
    fontWeight: '600',     // Semibold
    lineHeight: '28px',
    letterSpacing: '-0.2px'
  },

  // Card/Component Headers
  title2: {
    fontSize: '20px',      // 20pt
    fontWeight: '600',
    lineHeight: '25px',
    letterSpacing: '-0.2px'
  },

  // Subsection Headers
  title3: {
    fontSize: '17px',      // 17pt
    fontWeight: '600',
    lineHeight: '22px',
    letterSpacing: '-0.1px'
  },

  // Body Text (DEFAULT - iOS standard)
  body: {
    fontSize: '17px',      // 17pt
    fontWeight: '400',     // Regular
    lineHeight: '22px',
    letterSpacing: '-0.4px'
  },

  // Secondary Body Text
  callout: {
    fontSize: '16px',      // 16pt
    fontWeight: '400',
    lineHeight: '21px',
    letterSpacing: '-0.3px'
  },

  // Metadata, Labels
  subheadline: {
    fontSize: '15px',      // 15pt
    fontWeight: '400',
    lineHeight: '20px',
    letterSpacing: '-0.2px'
  },

  // Secondary Info
  footnote: {
    fontSize: '13px',      // 13pt
    fontWeight: '400',
    lineHeight: '18px',
    letterSpacing: '-0.1px'
  },

  // Smallest Text (use sparingly)
  caption1: {
    fontSize: '12px',      // 12pt
    fontWeight: '400',
    lineHeight: '16px',
    letterSpacing: '0'
  },

  caption2: {
    fontSize: '11px',      // 11pt
    fontWeight: '400',
    lineHeight: '13px',
    letterSpacing: '0.1px'
  }
}
```

**Tailwind Classes Mapping:**
```typescript
// Use these consistent classes:
'text-[34px] font-bold leading-[41px]'     // hero
'text-[28px] font-bold leading-[34px]'     // largeTitle
'text-[22px] font-semibold leading-7'      // title1
'text-xl font-semibold'                    // title2
'text-[17px] font-semibold'                // title3
'text-[17px] leading-[22px]'               // body (DEFAULT)
'text-base'                                // callout
'text-[15px]'                              // subheadline
'text-[13px]'                              // footnote
'text-xs'                                  // caption1
'text-[11px]'                              // caption2
```

---

## 📏 Spacing System

Consistent spacing scale (based on 4px grid):

```typescript
const spacing = {
  xxs: '4px',    // 0.25rem  - Icon padding, tight inline elements
  xs: '8px',     // 0.5rem   - Compact spacing, button padding
  sm: '12px',    // 0.75rem  - Small gaps, badge padding
  md: '16px',    // 1rem     - DEFAULT spacing (cards, lists)
  lg: '20px',    // 1.25rem  - Comfortable spacing
  xl: '24px',    // 1.5rem   - Section spacing
  '2xl': '32px', // 2rem     - Major sections
  '3xl': '40px', // 2.5rem   - Page sections
  '4xl': '48px', // 3rem     - Large dividers
}
```

**Tailwind Classes:**
```typescript
'p-1'   // 4px   - Icon buttons only
'p-2'   // 8px   - Compact buttons
'p-3'   // 12px  - Small cards
'p-4'   // 16px  - DEFAULT card padding
'p-5'   // 20px  - Comfortable cards
'p-6'   // 24px  - Spacious cards
'p-8'   // 32px  - Section containers
'p-12'  // 48px  - Page containers

'space-y-2'  // 8px gaps   - Tight lists
'space-y-3'  // 12px gaps  - Compact lists
'space-y-4'  // 16px gaps  - DEFAULT list spacing
'space-y-6'  // 24px gaps  - Section spacing
'space-y-8'  // 32px gaps  - Major sections
```

---

## 🎯 Touch Targets (Mobile Optimized)

iOS Human Interface Guidelines standards:

```typescript
const touchTargets = {
  // Minimum touch target
  minimum: '48px',        // 48x48px absolute minimum

  // Buttons
  buttonSmall: '48px',    // Height (width flexible)
  buttonMedium: '52px',   // Standard button
  buttonLarge: '56px',    // Primary actions

  // List Items
  listItemCompact: '56px',   // Compact mode
  listItemDefault: '64px',   // Standard (recommended)
  listItemLarge: '72px',     // Detailed items

  // Input Fields
  inputHeight: '48px',    // All form inputs

  // Tab Bar Icons
  tabIcon: '56px',        // Bottom navigation

  // Icon Buttons
  iconButton: '48px',     // Standalone icon buttons
}
```

**Implementation:**
```typescript
// ✅ CORRECT - All touch targets 48px+
<button className="h-12 px-6">        // 48px height
<div className="h-16">                 // 64px list item
<input className="h-12 px-4">         // 48px input

// ❌ WRONG - Too small for mobile
<button className="p-1">              // Only 24px
<button className="px-2 py-1">        // Only 28px
```

---

## 🎨 Color Palette

iOS-inspired color system with semantic meaning:

```typescript
const colors = {
  // Brand/Primary (iOS Blue by default, can customize)
  primary: {
    default: '#007AFF',    // iOS Blue
    hover: '#0051D5',      // Darker blue
    active: '#004DB3',     // Even darker
    light: '#E5F2FF',      // Light background
  },

  // Backgrounds
  background: {
    primary: '#FFFFFF',     // White cards
    secondary: '#F5F5F5',   // Page background (off-white)
    tertiary: '#EFEFF4',    // Grouped lists background
    elevated: '#FFFFFF',    // Modal/sheet background
  },

  // Text Colors
  text: {
    primary: '#1C1C1E',     // Main text (not pure black)
    secondary: '#8E8E93',   // Secondary text (iOS gray)
    tertiary: '#C7C7CC',    // Disabled text
    inverted: '#FFFFFF',    // Text on dark backgrounds
  },

  // Semantic Colors (iOS system colors)
  semantic: {
    success: '#34C759',     // iOS Green
    warning: '#FF9500',     // iOS Orange
    error: '#FF3B30',       // iOS Red
    info: '#007AFF',        // iOS Blue
  },

  // Gray Scale
  gray: {
    50: '#F9F9F9',
    100: '#F5F5F5',
    200: '#EFEFEF',
    300: '#D1D1D6',
    400: '#C7C7CC',
    500: '#8E8E93',
    600: '#636366',
    700: '#48484A',
    800: '#3A3A3C',
    900: '#1C1C1E',
  },

  // Borders & Dividers
  separator: {
    opaque: '#C6C6C8',      // Visible dividers
    nonOpaque: 'rgba(60, 60, 67, 0.36)', // iOS standard separator
  }
}
```

**Tailwind Config:**
```javascript
// Add to tailwind.config.js
theme: {
  extend: {
    colors: {
      primary: '#007AFF',
      'bg-secondary': '#F5F5F5',
      'text-primary': '#1C1C1E',
      'text-secondary': '#8E8E93',
      success: '#34C759',
      warning: '#FF9500',
      error: '#FF3B30',
    }
  }
}
```

---

## 🃏 Component Patterns

### **Card Component**

Standard card for all content containers:

```typescript
// Base Card
<div className="bg-white rounded-2xl shadow-sm p-6">
  {/* Content */}
</div>

// Variants
const cardStyles = {
  // Default - Soft shadow, rounded
  default: 'bg-white rounded-2xl shadow-sm p-6',

  // Elevated - Stronger shadow for modals
  elevated: 'bg-white rounded-2xl shadow-lg p-6',

  // Flat - No shadow, just border
  flat: 'bg-white rounded-2xl border border-gray-200 p-6',

  // Compact - Less padding
  compact: 'bg-white rounded-xl shadow-sm p-4',
}
```

**Shadow Specifications:**
```css
shadow-sm:  0px 1px 3px rgba(0, 0, 0, 0.1)   /* Default cards */
shadow:     0px 2px 8px rgba(0, 0, 0, 0.1)   /* Hover states */
shadow-lg:  0px 4px 16px rgba(0, 0, 0, 0.12) /* Modals/sheets */
```

---

### **Button Component**

Consistent button styles across all screens:

```typescript
const buttonStyles = {
  // Primary Action (Blue, filled)
  primary: 'h-12 px-6 bg-primary text-white rounded-xl font-semibold text-[17px] active:opacity-80 transition-opacity',

  // Secondary Action (Gray, filled)
  secondary: 'h-12 px-6 bg-gray-100 text-primary rounded-xl font-semibold text-[17px] active:bg-gray-200 transition-colors',

  // Destructive Action (Red)
  destructive: 'h-12 px-6 bg-error text-white rounded-xl font-semibold text-[17px] active:opacity-80 transition-opacity',

  // Ghost/Text Only
  ghost: 'h-12 px-4 text-primary font-semibold text-[17px] active:opacity-50 transition-opacity',

  // Icon Button (48x48 minimum)
  icon: 'w-12 h-12 flex items-center justify-center rounded-xl text-primary active:bg-gray-100 transition-colors',
}
```

**Usage:**
```tsx
// Primary action
<button className="h-12 px-6 bg-primary text-white rounded-xl font-semibold">
  Add Item
</button>

// Icon button (always 48x48 minimum)
<button className="w-12 h-12 flex items-center justify-center rounded-xl active:bg-gray-100">
  <Plus size={24} />
</button>
```

---

### **List Item Component**

Standard list item for all list views:

```typescript
const listItemStyles = {
  // Default List Item (64px height)
  default: `
    flex items-center h-16 px-4
    bg-white border-b border-gray-100
    active:bg-gray-50 transition-colors
  `,

  // With Navigation Arrow
  navigation: `
    flex items-center justify-between h-16 px-4
    bg-white border-b border-gray-100
    active:bg-gray-50 transition-colors
  `,

  // Compact (56px height)
  compact: `
    flex items-center h-14 px-4
    bg-white border-b border-gray-100
    active:bg-gray-50 transition-colors
  `,
}
```

**Structure:**
```tsx
<div className="flex items-center h-16 px-4 bg-white border-b border-gray-100">
  {/* Left: Checkbox/Icon (optional) */}
  <div className="flex-shrink-0 w-6 h-6 mr-3">
    <Checkbox />
  </div>

  {/* Center: Content */}
  <div className="flex-1 min-w-0">
    <p className="text-[17px] text-text-primary truncate">
      Item Name
    </p>
    <p className="text-[15px] text-text-secondary truncate">
      Secondary info
    </p>
  </div>

  {/* Right: Action/Chevron (optional) */}
  <div className="flex-shrink-0 ml-3">
    <ChevronRight size={20} className="text-gray-400" />
  </div>
</div>
```

---

### **Input Field Component**

Standard form inputs:

```typescript
const inputStyles = {
  // Default Input (48px height)
  default: `
    h-12 px-4
    bg-white border border-gray-300 rounded-xl
    text-[17px] text-text-primary placeholder-text-secondary
    focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent
    transition-shadow
  `,

  // Error State
  error: `
    h-12 px-4
    bg-white border-2 border-error rounded-xl
    text-[17px] text-text-primary
    focus:outline-none focus:ring-2 focus:ring-error
  `,
}
```

---

## 📱 Layout Patterns

### **Page Container**

Standard page wrapper:

```tsx
<div className="min-h-screen bg-bg-secondary">
  {/* Page content */}
</div>
```

### **Page Header**

iOS-style large title header:

```tsx
<div className="bg-white px-6 pt-12 pb-6">
  <h1 className="text-[34px] font-bold text-text-primary">
    Shopping List
  </h1>
</div>
```

### **Section**

Content sections with headers:

```tsx
<div className="px-6 py-4">
  <h2 className="text-[22px] font-semibold text-text-primary mb-4">
    Section Title
  </h2>
  <div className="space-y-4">
    {/* Section content */}
  </div>
</div>
```

### **Card Grid**

Responsive card layouts:

```tsx
{/* Single column on mobile, 2+ on larger screens */}
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 px-6">
  {/* Cards */}
</div>
```

---

## 🎭 Animation & Transitions

Subtle, iOS-like animations:

```typescript
const transitions = {
  // Quick feedback (tap/press)
  quick: 'transition-all duration-150 ease-out',

  // Standard UI changes
  default: 'transition-all duration-250 ease-in-out',

  // Slower, deliberate animations
  slow: 'transition-all duration-350 ease-in-out',
}
```

**Opacity for pressed states:**
```tsx
// Button press
className="active:opacity-80 transition-opacity duration-150"

// Background highlight
className="active:bg-gray-100 transition-colors duration-150"
```

---

## ♿ Accessibility

### **Touch Targets**
- Minimum 48x48px for all interactive elements
- Increase to 56-64px for primary actions

### **Color Contrast**
- Text on white: Minimum 4.5:1 contrast ratio
- Large text (22pt+): Minimum 3:1 ratio
- Use `text-text-primary` (#1C1C1E) not pure black

### **ARIA Labels**
- All icon-only buttons must have `aria-label`
- Form inputs must have labels (visible or `aria-label`)
- Interactive elements must have clear purpose

---

## 📦 Component Library Files

### **To Create:**

1. `/src/components/design-system/Button.tsx`
2. `/src/components/design-system/Card.tsx`
3. `/src/components/design-system/ListItem.tsx`
4. `/src/components/design-system/Input.tsx`
5. `/src/components/design-system/Badge.tsx`
6. `/src/components/design-system/Header.tsx`
7. `/src/components/design-system/Section.tsx`

### **Design Tokens:**

`/src/styles/design-tokens.ts`:
```typescript
export const designTokens = {
  typography: { /* ... */ },
  spacing: { /* ... */ },
  colors: { /* ... */ },
  shadows: { /* ... */ },
  borderRadius: { /* ... */ },
  touchTargets: { /* ... */ },
}
```

---

## 🚀 Migration Plan

### **Phase 1: Design Tokens** ✅
- [ ] Create design tokens file
- [ ] Update Tailwind config
- [ ] Document all values

### **Phase 2: Base Components** 🔄
- [ ] Button component
- [ ] Card component
- [ ] ListItem component
- [ ] Input component
- [ ] Badge component
- [ ] Header component

### **Phase 3: Apply to Features** 📋
- [ ] Shopping Lists
- [ ] Meal Planning
- [ ] Finance Dashboard
- [ ] Todos/Tasks
- [ ] Calendar
- [ ] Habits Tracker
- [ ] Journal
- [ ] Settings

---

## 📸 Visual Examples

### **Before (Current Issues):**
- Small text (14px body, 12px metadata)
- Cramped spacing (8px gaps, py-2 padding)
- Tiny touch targets (24px buttons)
- Dense tables (7 columns)
- Harsh borders everywhere

### **After (New Design System):**
- Readable text (17px body, 15px metadata)
- Generous spacing (16-24px gaps, p-6 cards)
- Large touch targets (48px+ buttons)
- Card-based layouts (no tables on mobile)
- Soft shadows, minimal borders

---

## 🎯 Key Measurements

### **Shopping List Example:**

**Old:**
- Item height: 44px (cramped)
- Button size: 24x24px (too small)
- Text: 14px (too small)
- Padding: 8px (tight)

**New:**
- Item height: 64px (comfortable)
- Button size: 48x48px (easy to tap)
- Text: 17px (readable)
- Padding: 16-20px (spacious)

---

This design system ensures **consistency across all screens** while optimizing for **mobile-first iOS usage**.
