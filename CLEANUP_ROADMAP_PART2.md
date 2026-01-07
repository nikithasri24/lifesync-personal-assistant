# LifeSync Cleanup Roadmap - Part 2

## Phase 3: Component Refactoring (Week 5-6)

**Goal**: Break down massive components to <400 lines

### 3.1 Refactor Calendar.tsx (1711 lines → <400)

**Current structure**: Everything in one file

**Target structure**:
```
src/calendar/
├── pages/
│   └── CalendarPage.tsx (main orchestrator, <200 lines)
├── components/
│   ├── CalendarGrid.tsx (grid rendering, <300 lines)
│   ├── CalendarEventList.tsx (event display, <200 lines)
│   ├── CalendarDragDrop.tsx (drag/drop logic, <250 lines)
│   └── modals/
│       ├── EventModal.tsx
│       └── TaskEditModal.tsx
├── hooks/
│   ├── useCalendarState.ts (state management)
│   ├── useCalendarDragDrop.ts (drag/drop state)
│   └── useCalendarEvents.ts (event filtering/grouping)
└── utils/
    ├── calendarHelpers.ts
    └── dateCalculations.ts
```

**Refactoring steps**:
1. Extract custom hooks first (state, drag/drop, events)
2. Move utility functions to utils/
3. Split into component files
4. Update imports in CalendarPage.tsx
5. Test each piece independently

### 3.2 Refactor MealPlanning.tsx (1327 lines → <400)

**Already has good structure** - just needs file separation

**Action**: Move inline hooks to hooks/ directory

### 3.3 Refactor intelligenceTools.ts (1726 lines → <400)

**Current**: All AI tools in one massive file

**Target structure**:
```
src/lib/ai/tools/
├── index.ts (re-exports all tools)
├── briefingTools.ts (morning briefing)
├── reportTools.ts (weekly reports)
├── patternTools.ts (pattern insights)
├── coachingTools.ts (life coach)
├── memoryTools.ts (contextual memory)
├── predictionTools.ts (predictions)
├── automationTools.ts (automation)
└── quickCaptureTools.ts (quick capture)
```

---

## Phase 4: Infrastructure Improvements (Week 7-8)

### 4.1 Implement Proper Routing

**Recommendation**: Use **React Router v6** (industry standard, well-documented)

```bash
npm install react-router-dom
```

**Implementation**:

```typescript
// src/App.tsx (simplified)
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';

function App() {
  return (
    <BrowserRouter>
      <AuthGate>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="calendar" element={<Calendar />} />
            <Route path="tasks" element={<Focus />} />
            <Route path="habits" element={<Habits />} />
            <Route path="assistant" element={<Assistant />} />
            
            {/* Finance sub-routes */}
            <Route path="finance/*" element={<FinanceRoutes />} />
            
            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </AuthGate>
    </BrowserRouter>
  );
}
```

**Update Layout.tsx**:
```typescript
import { Outlet, useNavigate, useLocation } from 'react-router-dom';

export function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  
  return (
    <div className="flex h-screen">
      <Sidebar onNavigate={(path) => navigate(path)} currentPath={location.pathname} />
      <main className="flex-1">
        <Outlet /> {/* Renders matched route */}
      </main>
    </div>
  );
}
```

### 4.2 Add Error Boundaries Everywhere

**Create domain-specific error boundaries**:

```typescript
// src/components/errors/FeatureErrorBoundary.tsx
interface Props {
  feature: string;
  children: React.ReactNode;
}

export class FeatureErrorBoundary extends React.Component<Props, State> {
  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    logger.error('ErrorBoundary', error, {
      feature: this.props.feature,
      componentStack: errorInfo.componentStack
    });
  }

  render(): React.ReactNode {
    if (this.state.hasError) {
      return (
        <ErrorFallback 
          error={this.state.error} 
          feature={this.props.feature}
          onReset={() => this.setState({ hasError: false, error: null })}
        />
      );
    }
    return this.props.children;
  }
}
```

**Usage in routes**:
```typescript
<Route 
  path="calendar" 
  element={
    <FeatureErrorBoundary feature="calendar">
      <Calendar />
    </FeatureErrorBoundary>
  } 
/>
```

### 4.3 Implement Proper Code Splitting

**Route-based splitting** (already done with lazy):
```typescript
const Calendar = lazy(() => import('./pages/Calendar'));
const Finance = lazy(() => import('./pages/Finances'));
```

**Feature-based splitting** (for large features):
```typescript
// Lazy load entire finance module
const FinanceModule = lazy(() => import('./finance'));

// In routes
<Route path="finance/*" element={
  <Suspense fallback={<FinanceLoading />}>
    <FinanceModule />
  </Suspense>
} />
```

**Component-based splitting** (for heavy components):
```typescript
// Only load chart library when needed
const HeavyChart = lazy(() => import('./components/HeavyChart'));

function Dashboard() {
  const [showChart, setShowChart] = useState(false);
  
  return (
    <div>
      {showChart && (
        <Suspense fallback={<ChartSkeleton />}>
          <HeavyChart />
        </Suspense>
      )}
    </div>
  );
}
```


