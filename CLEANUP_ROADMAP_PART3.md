# LifeSync Cleanup Roadmap - Part 3

## Phase 4: Infrastructure Improvements (continued)

### 4.4 Add Performance Monitoring

**Install Web Vitals**:
```bash
npm install web-vitals
```

**Implementation**:
```typescript
// src/lib/performance.ts
import { onCLS, onFID, onFCP, onLCP, onTTFB } from 'web-vitals';
import { logger } from '@/services/logger';

export function initPerformanceMonitoring(): void {
  onCLS((metric) => logger.info('Performance', 'CLS', { value: metric.value }));
  onFID((metric) => logger.info('Performance', 'FID', { value: metric.value }));
  onFCP((metric) => logger.info('Performance', 'FCP', { value: metric.value }));
  onLCP((metric) => logger.info('Performance', 'LCP', { value: metric.value }));
  onTTFB((metric) => logger.info('Performance', 'TTFB', { value: metric.value }));
}

// src/main.tsx
import { initPerformanceMonitoring } from './lib/performance';
initPerformanceMonitoring();
```

**React Query performance monitoring**:
```typescript
// src/lib/react-query.ts
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Log slow queries
      onSuccess: (data, query) => {
        const duration = Date.now() - query.state.dataUpdatedAt;
        if (duration > 1000) {
          logger.warn('Performance', 'Slow query', {
            queryKey: query.queryKey,
            duration
          });
        }
      }
    }
  }
});
```

---

## Phase 5: Scope Rationalization (Week 9-10)

**Goal**: Make strategic decisions about feature scope

### 5.1 Finance Module Strategy

**Options**:

**Option A: Keep Integrated** (Recommended if you use it heavily)
- Create proper module boundaries
- Ensure it follows same architecture as other features
- Add feature flag to disable if not needed

**Option B: Extract to Separate App**
- Create `lifesync-finance` as separate repo
- Share auth via Supabase
- Link between apps
- Reduces main app complexity

**Option C: Remove**
- If you don't use it, remove it
- Export data first
- Remove all finance-related code
- Simplifies codebase significantly

**Recommendation**: If you actively use finance features, keep but modularize. If not, remove.

### 5.2 Define Core Feature Set

**Tier 1: Core (Must Keep)**
- ✅ Tasks & Projects
- ✅ Habits
- ✅ Calendar
- ✅ AI Assistant
- ✅ Focus Timer

**Tier 2: High Value (Keep)**
- ✅ Notes
- ✅ Journal
- ✅ Goals
- ✅ Dashboard

**Tier 3: Nice to Have (Evaluate)**
- ⚠️ Meal Planning - Keep if you use it
- ⚠️ Shopping - Keep if you use it
- ⚠️ Finance - See 5.1
- ⚠️ Travel - Consider removing or simplifying
- ⚠️ Nutrition - Overlaps with meal planning

**Tier 4: Remove (Low Value)**
- ❌ Skincare - Too niche
- ❌ National Parks - Not productivity-related
- ❌ Visa Calculator - Use external tool
- ❌ Shared - Unclear purpose

### 5.3 AI Features Scope

**Keep**:
- ✅ Conversation engine
- ✅ Tool registry
- ✅ Voice interface
- ✅ Morning briefing
- ✅ Quick capture
- ✅ Smart suggestions

**Simplify**:
- ⚠️ Life coach - Simplify to basic coaching prompts
- ⚠️ Pattern insights - Keep basic patterns, remove complex ML
- ⚠️ Weekly reports - Keep simple version

**Remove**:
- ❌ Sentiment analysis - Over-engineered for personal use
- ❌ Complex prediction service - Use simpler heuristics
- ❌ Vision board service - Not core to productivity

### 5.4 Create Feature Deprecation Plan

**For features to remove**:

1. **Data Export**
   - Create export scripts for each feature
   - Export to JSON/CSV
   - Store in user's downloads

2. **Code Removal**
   - Remove database migrations (or mark as deprecated)
   - Remove API endpoints
   - Remove components
   - Remove routes
   - Update navigation

3. **Documentation**
   - Update README
   - Update ARCHITECTURE.md
   - Create DEPRECATED_FEATURES.md

**Example removal checklist**:
```markdown
## Removing Skincare Feature

- [ ] Export all skincare data to JSON
- [ ] Remove `src/skincare/` directory
- [ ] Remove `src/api/skincareAPI.ts`
- [ ] Remove skincare routes from App.tsx
- [ ] Remove skincare navigation items from Layout.tsx
- [ ] Remove skincare Zustand slice
- [ ] Mark skincare migrations as deprecated
- [ ] Update documentation
- [ ] Test that app still works
```

---

## Implementation Priority

### Week 1-2: Quick Wins
1. Remove console.log statements (1 day)
2. Remove eslint-disable comments (1 day)
3. Audit Zustand stores (2 days)
4. Start fixing `any` types in API layer (3 days)

### Week 3-4: Architecture
1. Create missing API modules (2 days)
2. Migrate services to use API layer (5 days)
3. Standardize error handling (3 days)

### Week 5-6: Components
1. Refactor intelligenceTools.ts (2 days)
2. Refactor Calendar.tsx (3 days)
3. Refactor MealPlanning.tsx (2 days)
4. Refactor other large components (3 days)

### Week 7-8: Infrastructure
1. Implement React Router (2 days)
2. Add error boundaries (2 days)
3. Improve code splitting (2 days)
4. Add performance monitoring (1 day)
5. Testing and fixes (3 days)

### Week 9-10: Scope
1. Make feature decisions (1 day)
2. Export data from deprecated features (1 day)
3. Remove deprecated features (3 days)
4. Update documentation (1 day)
5. Final testing (4 days)

---

## Success Metrics

**Code Quality**:
- ✅ 0 `any` type violations (down from 959)
- ✅ 0 console.log statements
- ✅ 0 eslint-disable comments
- ✅ All files <400 lines
- ✅ 100% services using API layer

**Architecture**:
- ✅ Proper routing with React Router
- ✅ Error boundaries on all routes
- ✅ Consistent error handling
- ✅ Clean separation of concerns

**Performance**:
- ✅ Initial load <3s
- ✅ Route transitions <500ms
- ✅ No queries >1s
- ✅ Bundle size <500KB (gzipped)

**Scope**:
- ✅ Clear feature tiers defined
- ✅ Deprecated features removed
- ✅ Documentation updated
- ✅ Focused value proposition

---

## Next Steps

1. **Review this roadmap** and adjust priorities
2. **Make scope decisions** (Phase 5) - Do this FIRST
3. **Start with quick wins** (Week 1-2)
4. **Work through phases** systematically
5. **Track progress** using the task list


