# Focus Feature Enhancement Plan

## Overview

The Focus feature is **already well-implemented** with V2 components that largely match the design specification. This plan focuses on **refinements and code quality improvements** to fully align with CLAUDE.md standards.

**Current State:**
- Page exists at `src/pages/Focus.tsx` with V2 components
- V2 components: FocusHeaderV2, CircularTimerV2, PresetGridV2, TimerControlsV2
- Uses React Query hooks (`useFocusQuery`)
- Has session tracking (creates/updates focus sessions in database)
- Has terracotta theme
- Has FeatureErrorBoundary (already in App.tsx route) ✅

**Goal:**
- Replace Framer Motion with CSS transitions (CLAUDE.md requirement)
- Update layout to standard centered 900px container pattern
- Ensure design spec compliance
- Apply code quality improvements

**Why This Matters:**
- Focus is a simple but critical productivity feature
- Demonstrates proper implementation of timer/animation patterns
- Shows how to handle real-time countdown state
- Establishes pattern for session tracking features

---

## Critical Files to Modify

### Primary Files (Must Update)
1. `src/pages/Focus.tsx` - Main page (update layout)
2. `src/focus/components/v2/CircularTimerV2.tsx` - Replace Framer Motion
3. `src/focus/components/v2/TimerControlsV2.tsx` - Replace Framer Motion
4. `src/focus/components/v2/PresetGridV2.tsx` - Replace Framer Motion
5. `src/focus/components/v2/FocusHeaderV2.tsx` - Minor refinements (if needed)

### Files to Delete (After Verification)
1. `src/focus/components/layout/FocusHeader.tsx` - Old version (if unused)
2. `src/focus/components/layout/FocusTimerDisplay.tsx` - Old version (if unused)
3. `src/stores/slices/focusSlice.ts` - Zustand slice (if not used)

### Reference Files (Do NOT Modify)
- `src/pages/Together.tsx` - Reference implementation
- `focus-design-spec.html` - Design specification
- `CLAUDE.md` - UI/UX standards

---

## Database Schema Reference

Focus sessions table (already exists):

```sql
CREATE TABLE focus_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  type VARCHAR(50) NOT NULL, -- 'pomodoro', 'short-break', 'deep-work', 'long-break'
  duration_minutes INTEGER NOT NULL,
  actual_duration_seconds INTEGER, -- actual time spent
  started_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  status VARCHAR(20) DEFAULT 'in-progress', -- 'in-progress', 'completed', 'abandoned'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Note:** Focus sessions are independent (no merged mode needed - each user tracks their own focus time)

---

## Implementation Plan

### Phase 1: Update Main Page Layout

**File:** `src/pages/Focus.tsx`

**Changes:**
1. Update container to match standard pattern:
   ```typescript
   return (
     <div style={{ backgroundColor: colors.bg.primary, minHeight: '100vh' }}>
       <div style={{ maxWidth: '900px', margin: '0 auto', paddingBottom: '5rem' }}>
         {/* Header */}
         <FocusHeaderV2 subtitle={getSubtitle()} />

         {/* Content */}
         <div className="px-6">
           <CircularTimerV2
             seconds={seconds}
             totalSeconds={totalSeconds}
             state={timerState}
             size={240}
           />

           <TimerControlsV2
             isActive={timerState === 'active'}
             isPaused={timerState === 'paused'}
             onPlayPause={() => void handlePlayPause()}
             onReset={() => void handleReset()}
             disabled={createSession.isPending || updateSession.isPending}
           />

           <PresetGridV2
             activePresetId={activePreset}
             onSelectPreset={handleSelectPreset}
             presets={PRESETS}
           />
         </div>
       </div>
     </div>
   );
   ```

2. Move presets to constants:
   ```typescript
   const PRESETS: TimerPreset[] = [
     { id: 'pomodoro', name: 'Pomodoro', emoji: '🍅', minutes: 25 },
     { id: 'short-break', name: 'Short Break', emoji: '☕', minutes: 5 },
     { id: 'deep-work', name: 'Deep Work', emoji: '🧠', minutes: 90 },
     { id: 'long-break', name: 'Long Break', emoji: '🌟', minutes: 15 },
   ];
   ```

**Expected Outcome:**
- Content centered on desktop (max 900px)
- Full width on mobile (minus padding)
- Consistent with other features

---

### Phase 2: Replace Framer Motion in CircularTimerV2

**File:** `src/focus/components/v2/CircularTimerV2.tsx`

**Changes:**
1. Remove Framer Motion import:
   ```typescript
   // ❌ REMOVE
   import { motion } from 'framer-motion';
   ```

2. Replace motion.div with regular div + CSS:
   ```typescript
   {/* ✅ AFTER - Regular div with CSS animation */}
   <div className="flex flex-col items-center justify-center animate-fadeIn">
     <div
       className="text-5xl font-bold tracking-tight"
       style={{ color: colors.text.primary }}
     >
       {formatTime(seconds)}
     </div>
     <div
       className="text-sm mt-1"
       style={{ color: colors.text.secondary }}
     >
       {getStateLabel()}
     </div>
   </div>
   ```

3. Add CSS animation in a CSS file or Tailwind config:
   ```css
   @keyframes fadeIn {
     from {
       opacity: 0;
       transform: scale(0.9);
     }
     to {
       opacity: 1;
       transform: scale(1);
     }
   }

   .animate-fadeIn {
     animation: fadeIn 0.3s ease-out;
   }
   ```

   Or add to `tailwind.config.js`:
   ```javascript
   theme: {
     extend: {
       keyframes: {
         fadeIn: {
           '0%': { opacity: '0', transform: 'scale(0.9)' },
           '100%': { opacity: '1', transform: 'scale(1)' },
         },
       },
       animation: {
         fadeIn: 'fadeIn 0.3s ease-out',
       },
     },
   }
   ```

**Expected Outcome:**
- No Framer Motion dependency
- Smooth fade-in animation with CSS
- Lighter bundle size
- Better performance

---

### Phase 3: Replace Framer Motion in TimerControlsV2

**File:** `src/focus/components/v2/TimerControlsV2.tsx`

**Changes:**
1. Remove Framer Motion import:
   ```typescript
   // ❌ REMOVE
   import { motion } from 'framer-motion';
   ```

2. Replace motion.button with regular button + CSS:
   ```typescript
   {/* Reset Button */}
   <button
     type="button"
     onClick={onReset}
     disabled={disabled}
     className="
       w-16 h-16 rounded-full
       flex items-center justify-center
       shadow-md
       transition-transform duration-200
       hover:scale-105 active:scale-95
       disabled:hover:scale-100
     "
     style={{
       backgroundColor: colors.bg.card,
       color: '#D4A574',
     }}
     aria-label="Reset timer"
   >
     <RotateCcw className="w-6 h-6" />
   </button>

   {/* Play/Pause Button (Primary) */}
   <button
     type="button"
     onClick={onPlayPause}
     disabled={disabled}
     className="
       w-20 h-20 rounded-full
       flex items-center justify-center
       text-white
       shadow-lg
       transition-transform duration-200
       hover:scale-108 active:scale-92
       disabled:hover:scale-100
     "
     style={{
       background: gradients.primary,
       boxShadow: '0 4px 12px rgba(212, 165, 116, 0.4)',
     }}
     aria-label={getPlayPauseLabel()}
   >
     {getPlayPauseIcon()}
   </button>

   {/* Settings Button */}
   {onSettings && (
     <button
       type="button"
       onClick={onSettings}
       disabled={disabled}
       className="
         w-16 h-16 rounded-full
         flex items-center justify-center
         shadow-md
         transition-transform duration-200
         hover:scale-105 active:scale-95
         disabled:hover:scale-100
       "
       style={{
         backgroundColor: colors.bg.card,
         color: '#D4A574',
       }}
       aria-label="Settings"
     >
       <Settings className="w-6 h-6" />
     </button>
   )}
   ```

3. Add custom scale utilities to `tailwind.config.js` if needed:
   ```javascript
   theme: {
     extend: {
       scale: {
         '92': '0.92',
         '108': '1.08',
       },
     },
   }
   ```

**Expected Outcome:**
- No Framer Motion for button interactions
- Smooth hover/active states with CSS
- Same visual effect, better performance

---

### Phase 4: Replace Framer Motion in PresetGridV2

**File:** `src/focus/components/v2/PresetGridV2.tsx`

**Changes:**
1. Remove Framer Motion import:
   ```typescript
   // ❌ REMOVE
   import { motion } from 'framer-motion';
   ```

2. Replace motion.button with regular button + CSS:
   ```typescript
   <button
     key={preset.id}
     type="button"
     onClick={() => onSelectPreset(preset)}
     className="
       p-4 rounded-xl
       text-center
       transition-all duration-200
       hover:scale-102 active:scale-98
     "
     style={{
       backgroundColor: isActive ? '#FEF3E8' : colors.bg.card,
       border: `2px solid ${isActive ? '#D4A574' : colors.border.light}`,
       boxShadow: isActive
         ? '0 4px 12px rgba(212, 165, 116, 0.2)'
         : '0 2px 8px rgba(0, 0, 0, 0.05)',
     }}
   >
     <div className="text-2xl mb-1">{preset.emoji}</div>
     <div
       className="text-base font-semibold"
       style={{ color: colors.text.primary }}
     >
       {preset.name}
     </div>
     <div
       className="text-xs mt-0.5"
       style={{ color: colors.text.secondary }}
     >
       {preset.minutes} {preset.minutes === 1 ? 'minute' : 'minutes'}
     </div>
   </button>
   ```

**Expected Outcome:**
- No Framer Motion for preset buttons
- Smooth scale transitions with CSS
- Consistent with other components

---

### Phase 5: Refine Circular Timer Ring (Optional)

**File:** `src/focus/components/v2/CircularTimerV2.tsx`

**Objective:** Ensure the circular timer ring matches the design spec exactly

**Current:** Uses `ProgressRingV2` component

**Design Spec:** Shows a simple gradient ring with inner white circle

**Assessment Needed:**
1. Does ProgressRingV2 match the design spec?
2. Is the gradient outer ring → white inner circle correct?
3. Are dimensions correct (240px outer, 220px inner)?

**If refinement needed:**
```typescript
<div className="flex justify-center items-center py-8">
  {/* Outer Ring - Terracotta Gradient */}
  <div
    className="rounded-full flex items-center justify-center"
    style={{
      width: size,
      height: size,
      background: 'linear-gradient(135deg, #D4A574 0%, #C18B5E 100%)',
      boxShadow: '0 8px 24px rgba(212, 165, 116, 0.3)',
    }}
  >
    {/* Inner White Circle */}
    <div
      className="rounded-full bg-white flex flex-col items-center justify-center"
      style={{
        width: size - 20,
        height: size - 20,
      }}
    >
      <div className="flex flex-col items-center justify-center animate-fadeIn">
        <div
          className="text-5xl font-bold tracking-tight"
          style={{ color: colors.text.primary }}
        >
          {formatTime(seconds)}
        </div>
        <div
          className="text-sm mt-1"
          style={{ color: colors.text.secondary }}
        >
          {getStateLabel()}
        </div>
      </div>
    </div>
  </div>
</div>
```

**Expected Outcome:**
- Circular timer matches design spec exactly
- Proper sizing (240px outer, 220px inner)
- Terracotta gradient outer ring
- White inner circle with timer display

---

### Phase 6: Code Quality Improvements & Cleanup

**Objective:** Apply standardized code quality improvements from MODULE_QUALITY_IMPROVEMENTS_CHECKLIST.md

**Changes:**

#### 6.1: Add Error Boundary
- ✅ Already exists in App.tsx:
  ```typescript
  <Route path="/focus" element={<RouteErrorBoundary feature="Focus"><Focus /></RouteErrorBoundary>} />
  ```
- ✅ No action needed

#### 6.2: Remove Dead Code
**Files to check:**
- `src/focus/components/layout/FocusHeader.tsx` - Old version
- `src/focus/components/layout/FocusTimerDisplay.tsx` - Old version
- `src/stores/slices/focusSlice.ts` - Zustand slice (check if used)

**Action:**
1. Search for imports of old components:
   ```bash
   grep -r "FocusHeader[^V]" src/
   grep -r "FocusTimerDisplay" src/
   grep -r "focusSlice" src/
   ```

2. If not used, delete:
   - `src/focus/components/layout/FocusHeader.tsx`
   - `src/focus/components/layout/FocusTimerDisplay.tsx`
   - `src/stores/slices/focusSlice.ts` (if replaced by React Query)

#### 6.3: Replace Duplicate Date Formatting
**Action:**
- Focus doesn't display dates (only timer countdown)
- ✅ Not applicable

#### 6.4: Replace Framer Motion with CSS
**Already covered in Phases 2-4** ✅

#### 6.5: Use Theme Colors Consistently
**Files to check:**
- All V2 components already use `useThemeColors()`
- Hardcoded terracotta colors (#D4A574, #C18B5E) are intentional for brand consistency
- ✅ Already implemented correctly

#### 6.6: Use Shared Date Utilities
**Action:**
- Focus doesn't format dates
- ✅ Not applicable

#### 6.7: Clean Up Unused Imports
**Action:**
1. Run ESLint fix:
   ```bash
   npm run lint -- --fix src/focus/
   ```

2. Manually verify each V2 component:
   - Remove unused Framer Motion imports (after Phases 2-4)
   - Remove unused icon imports
   - Remove unused type imports

#### 6.8: Clean Up Module Exports
**Files to update:**
- `src/focus/components/v2/index.ts` (verify exports are clean)

**Action:**
1. Verify barrel exports are minimal:
   ```typescript
   // src/focus/components/v2/index.ts
   export { FocusHeaderV2 } from './FocusHeaderV2';
   export { CircularTimerV2 } from './CircularTimerV2';
   export { PresetGridV2 } from './PresetGridV2';
   export { TimerControlsV2 } from './TimerControlsV2';
   export type { TimerPreset } from './PresetGridV2';
   ```

2. Verify no circular dependencies
3. Verify all exports are used

#### 6.9: Verification & Testing
**Action:**
1. **Visual Comparison:**
   - Open `focus-design-spec.html` in browser
   - Open Focus page in app
   - Compare side-by-side on mobile (375px width)
   - Compare on desktop (1200px width)
   - Verify all spacing, colors, fonts match exactly

2. **Functionality Testing:**
   - Select Pomodoro preset → 25:00 displayed ✓
   - Select Short Break → 5:00 displayed ✓
   - Select Deep Work → 90:00 displayed ✓
   - Select Long Break → 15:00 displayed ✓
   - Start timer → countdown begins ✓
   - Pause timer → countdown stops ✓
   - Resume timer → countdown continues ✓
   - Reset timer → back to selected preset duration ✓
   - Timer completes → shows "Complete!" ✓
   - Session saved to database → verify in Supabase ✓

3. **Animation Testing:**
   - Hover buttons → smooth scale up ✓
   - Click buttons → smooth scale down ✓
   - No Framer Motion errors ✓
   - Smooth transitions ✓

4. **Responsive Testing:**
   - Mobile (375px) → proper layout ✓
   - Tablet (768px) → centered ✓
   - Desktop (1200px+) → centered with max 900px ✓

5. **Accessibility Testing:**
   - Tab navigation works ✓
   - All buttons have aria-labels ✓
   - Focus visible ✓
   - Screen reader friendly ✓

6. **Performance Testing:**
   - Timer countdown smooth (no lag) ✓
   - No memory leaks (timer cleanup) ✓
   - No unnecessary re-renders ✓
   - React Query caching works ✓

7. **Cross-browser Testing:**
   - Chrome ✓
   - Safari ✓
   - Firefox ✓
   - Mobile browsers ✓

**Expected Outcome:**
- All code quality standards from CLAUDE.md applied
- No dead code or unused imports
- No Framer Motion dependencies
- Clean, maintainable codebase

---

### Phase 7: Optional Enhancement - Settings Modal

**File:** Create `src/focus/components/v2/FocusSettingsModalV2.tsx`

**Objective:** Allow users to customize timer settings (optional feature)

**Settings Options:**
- Sound notification on/off
- Auto-start next session (Pomodoro → Short Break → Pomodoro cycle)
- Custom durations for each preset
- Notification permission request

**Modal Structure:** Follow Together modal pattern

**Implementation:**
```typescript
<div
  className="fixed top-0 left-0 right-0 bottom-0 z-[60] flex items-end justify-center lg:items-center"
  style={{
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    backdropFilter: 'blur(4px)',
  }}
  onClick={handleBackdropClick}
>
  <div
    className="w-full bg-white lg:rounded-3xl rounded-t-3xl overflow-hidden flex flex-col"
    style={{ maxHeight: '90vh', maxWidth: '600px' }}
  >
    {/* Drag Handle */}
    <div className="lg:hidden pt-2 flex-shrink-0">
      <div className="w-9 h-1 rounded-full mx-auto bg-gray-300" />
    </div>

    {/* Header */}
    <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200 flex-shrink-0">
      <h2 className="text-2xl font-bold text-gray-900">Focus Settings</h2>
      <button
        type="button"
        onClick={onClose}
        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        aria-label="Close"
      >
        <X className="w-5 h-5 text-gray-500" />
      </button>
    </div>

    {/* Content */}
    <div className="overflow-y-auto p-6 space-y-5 flex-1">
      {/* Sound Notification */}
      <label className="flex items-center justify-between">
        <span className="font-medium">Sound Notification</span>
        <input type="checkbox" checked={settings.sound} onChange={...} />
      </label>

      {/* Auto-start Next Session */}
      <label className="flex items-center justify-between">
        <span className="font-medium">Auto-start Next Session</span>
        <input type="checkbox" checked={settings.autoStart} onChange={...} />
      </label>

      {/* Custom Durations */}
      {/* ... */}
    </div>

    {/* Footer */}
    <div className="px-6 py-4 border-t border-gray-200 flex gap-3 flex-shrink-0 bg-white">
      <button
        type="button"
        onClick={onClose}
        className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-xl font-semibold text-gray-700"
      >
        Cancel
      </button>
      <button
        type="submit"
        onClick={handleSave}
        className="flex-1 px-4 py-3 rounded-xl font-semibold text-white"
        style={{ background: 'linear-gradient(135deg, #D4A574 0%, #C18B5E 100%)' }}
      >
        Save Settings
      </button>
    </div>
  </div>
</div>
```

**Expected Outcome:**
- Users can customize focus session settings
- Settings persisted to localStorage
- Enhanced user experience

---

## Verification Steps

After implementation, verify:

1. **Visual Comparison:**
   - Focus page matches `focus-design-spec.html` exactly
   - All spacing, colors, fonts match
   - Circular timer looks identical

2. **Functionality Testing:**
   - All presets work correctly
   - Timer countdown is accurate
   - Start/pause/reset work correctly
   - Sessions save to database

3. **Performance:**
   - No Framer Motion dependencies
   - Smooth CSS animations
   - No timer lag or jumps

4. **Code Quality:**
   - No dead code
   - Clean imports
   - Consistent theming
   - No console errors

---

## Success Criteria

✅ Focus page matches `focus-design-spec.html` exactly
✅ Framer Motion completely removed and replaced with CSS transitions
✅ Centered page layout (900px max-width)
✅ All timer functionality works correctly
✅ Sessions save to database properly
✅ Responsive on mobile and desktop
✅ Accessible (keyboard, screen readers, aria-labels)
✅ Smooth animations with CSS only
✅ No console errors or warnings
✅ Code quality improvements applied (9 steps)

---

## Files Summary

### Files to Update (5)
- `src/pages/Focus.tsx` - Update layout to standard pattern
- `src/focus/components/v2/CircularTimerV2.tsx` - Remove Framer Motion
- `src/focus/components/v2/TimerControlsV2.tsx` - Remove Framer Motion
- `src/focus/components/v2/PresetGridV2.tsx` - Remove Framer Motion
- `tailwind.config.js` - Add custom animations (if needed)

### Files to Delete (3) - After verification
- `src/focus/components/layout/FocusHeader.tsx` - Old version (if unused)
- `src/focus/components/layout/FocusTimerDisplay.tsx` - Old version (if unused)
- `src/stores/slices/focusSlice.ts` - Zustand slice (if unused)

### Files to Create (1) - Optional
- `src/focus/components/v2/FocusSettingsModalV2.tsx` - Settings modal

### Reference Files (2)
- 📖 `focus-design-spec.html`
- 📖 `CLAUDE.md`

---

## Commit Message Template

```
feat: Refine Focus feature and remove Framer Motion

Polish Focus feature to fully align with CLAUDE.md standards:
- Replace Framer Motion with CSS transitions in all V2 components
- Update layout to standard centered 900px container pattern
- Remove dead code (old layout components, unused Zustand slice)
- Ensure design spec compliance (circular timer, presets, controls)
- Code quality improvements (clean imports, consistent theming)

Changes:
- CircularTimerV2: CSS fadeIn animation instead of Framer Motion
- TimerControlsV2: CSS scale transitions for hover/active states
- PresetGridV2: CSS scale transitions for preset buttons
- Main page: Centered layout (max 900px) matching other features
- Removed: Old FocusHeader, FocusTimerDisplay, focusSlice

Features maintained:
- Pomodoro timer with 4 presets (25min, 5min, 90min, 15min)
- Start/pause/reset controls
- Session tracking to database
- Smooth countdown with accurate timing
- Terracotta theme throughout
- Responsive mobile/desktop layout

Technical:
- No Framer Motion dependencies (lighter bundle)
- CSS animations via Tailwind
- React Query for session management
- FeatureErrorBoundary for crash isolation
- useThemeColors() for consistent theming

Files: 5 updated, 3 deleted

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

---

## Estimated Complexity

**Low** - Focus is already well-implemented, main changes are:
- Replacing Framer Motion with CSS (straightforward find/replace)
- Layout update (simple container change)
- Removing dead code (verification + deletion)
- Minor refinements

**Risk Level:** Very Low
- Existing functionality is solid and tested
- Changes are mostly cosmetic (Framer Motion → CSS)
- No API changes needed
- No database schema changes

---

## Implementation Notes

### Key Advantages

1. **Already 90% Complete:**
   - V2 components match design spec
   - React Query integration works
   - Session tracking implemented
   - Terracotta theme applied

2. **Simple Refactoring:**
   - Framer Motion → CSS is mechanical
   - Layout change is one line
   - Dead code removal is low-risk

3. **No Breaking Changes:**
   - Timer logic untouched
   - Session tracking untouched
   - Database schema unchanged

### Best Practices Applied

- **Performance:** CSS transitions are faster than Framer Motion
- **Bundle Size:** Removing Framer Motion reduces bundle
- **Accessibility:** Aria-labels already present
- **Code Quality:** Consistent patterns, clean imports
- **User Experience:** Smooth animations, accurate timer

### Testing Checklist

1. **Timer Accuracy:**
   - ✓ Countdown is accurate to the second
   - ✓ Pause/resume works correctly
   - ✓ Reset works correctly

2. **Session Tracking:**
   - ✓ Sessions created on start
   - ✓ Sessions updated on pause
   - ✓ Sessions completed on finish
   - ✓ Sessions abandoned on reset

3. **Preset Selection:**
   - ✓ All 4 presets work
   - ✓ Can't change preset during active session
   - ✓ Active preset highlighted correctly

4. **Visual Consistency:**
   - ✓ Matches design spec exactly
   - ✓ Terracotta theme throughout
   - ✓ Responsive layout

### Future Enhancements (After This Plan)

1. **Settings Modal:**
   - Customize preset durations
   - Sound notifications
   - Auto-start next session (Pomodoro cycles)

2. **Statistics Dashboard:**
   - Total focus time
   - Daily/weekly charts
   - Streak tracking
   - Most productive times

3. **Task Integration:**
   - Link focus sessions to tasks
   - Track time per task/project
   - Pomodoro count per task

4. **Ambient Sounds:**
   - Background noise (rain, coffee shop, etc.)
   - White noise
   - Music integration

5. **Badges & Achievements:**
   - Focus streaks
   - Total hours milestones
   - Perfect Pomodoro days

---

## Conclusion

This plan provides a streamlined roadmap for **polishing** the Focus feature to fully comply with CLAUDE.md standards. The implementation is **already excellent** - this plan focuses on:

1. **Performance:** Removing Framer Motion for faster animations
2. **Consistency:** Matching standard layout pattern (900px centered)
3. **Code Quality:** Removing dead code, cleaning imports
4. **Standards Compliance:** Full alignment with CLAUDE.md

The Focus feature will become a lightweight, performant productivity tool that demonstrates best practices for timer implementation, session tracking, and real-time state management.
