# Travel/Visa Merged Mode - Dual Passport Display

## What Changed

Updated the VisaCalculator component to display **both passports side-by-side** in merged mode instead of just one.

### Before:
- ❌ Only showed ONE passport (the "primary" one)
- ❌ Had to manually switch between passports
- ❌ No clear indication of ownership
- ❌ Couldn't compare passport power at a glance

### After:
- ✅ Shows BOTH passports side-by-side in a 2-column grid
- ✅ Each passport has an owner badge (Me / Partner name)
- ✅ Each passport shows its own visa-free access summary
- ✅ Each passport shows its global ranking
- ✅ Color-coded badges (blue for you, purple for partner)
- ✅ Still shows single passport view in non-merged mode

## UI Changes

### Merged Mode Display:
```
┌─────────────────────────────────────────────┐
│ Passports                    [Manage]       │
├─────────────────────────────────────────────┤
│  ┌──────────────────┐  ┌──────────────────┐│
│  │ 🇺🇸 United States │  │ 🇮🇳 India       ││
│  │ [Me]             │  │ [Sarah]         ││
│  │ Expires: 1/1/30  │  │ Expires: 5/5/28 ││
│  │                  │  │                 ││
│  │ 184 Visa Free    │  │ 57 Visa Free    ││
│  │ 40 On Arrival    │  │ 25 On Arrival   ││
│  │ Rank #6 globally │  │ Rank #83        ││
│  └──────────────────┘  └──────────────────┘│
└─────────────────────────────────────────────┘
```

### Non-Merged Mode Display:
```
┌─────────────────────────────────────────────┐
│ Your Passport              [Change Passport]│
├─────────────────────────────────────────────┤
│  🇺🇸 United States                          │
│  Expires: 1/1/2030                          │
│                                             │
│ [Full summary cards below]                  │
└─────────────────────────────────────────────┘
```

## Technical Implementation

### File Modified:
- `src/travel/components/VisaCalculator.tsx`

### Key Changes:

1. **Conditional Rendering**
   ```tsx
   {mergedConnection && allPassports.length > 0 ? (
     // Show all passports in grid
   ) : (
     // Show single passport
   )}
   ```

2. **Owner Badges**
   ```tsx
   const ownerLabel = getOwnershipLabel(p.userId);
   const ownerColor = getOwnershipColor(p.userId);

   <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${ownerColor}`}>
     {ownerLabel}
   </span>
   ```

3. **Individual Summaries**
   - Each passport card shows its own visa-free access stats
   - Each passport card shows its own global ranking
   - Removed full summary section in merged mode (to avoid redundancy)

4. **Header Updates**
   - "Your Passport" → "Passports" (plural) in merged mode
   - "Change Passport" → "Manage Passports" in merged mode

## User Benefits

### For Couples Planning Travel:
- **Compare Passports**: See at a glance which passport is more powerful
- **Trip Planning**: Decide which passport to use for visa applications
- **Visa Strategy**: Identify which passport provides better access to destination
- **Renewal Planning**: See both expiry dates side-by-side

### Example Use Case:
> John (US passport) and Maria (Brazilian passport) are planning a trip to China.
>
> They can now see:
> - John's passport: Requires e-visa for China
> - Maria's passport: Requires visa for China
> -
> Decision: Apply with John's passport for simpler e-visa process

## Testing

### To Test:
1. Navigate to Travel page (`/travel`)
2. Make sure you have merged mode enabled with partner
3. Both you and partner should have passports added
4. You should see both passports side-by-side with:
   - Owner badges (Me / Partner name)
   - Individual visa-free summaries
   - Individual rankings

### Expected Behavior:
- ✅ Both passports visible in 2-column grid (responsive to 1-column on mobile)
- ✅ Owner badges color-coded correctly
- ✅ Each passport shows its own stats
- ✅ Visa map and filters still work with both passports
- ✅ Non-merged mode still shows single passport view

## Next Steps

The Travel/Visa module is now **fully merged mode complete**!

### Remaining Travel Features to Consider:
- Visited locations could also support merged mode (see both users' travel history)
- Joint trip planning (shared trip itineraries)

But for visa calculator purposes, merged mode is now complete! 🎉
