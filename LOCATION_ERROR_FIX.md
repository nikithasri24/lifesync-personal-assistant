# CoreLocation Error Fix (kCLErrorLocationUnknown)

## Problem
The error `CoreLocationProvider: CoreLocation framework reported a kCLErrorLocationUnknown failure` was appearing in the browser console. This is a common iOS/browser geolocation error that occurs when:

1. **Location cannot be determined** - Weak GPS signal, indoors, or poor weather
2. **Location services are disabled** - User has disabled location in system settings
3. **Permission denied** - User denied location permission
4. **Timeout** - Location request timed out before position could be determined

## Root Cause
The location providers were catching errors but not handling them gracefully:
- Errors were being logged to console even for transient failures
- No distinction between critical errors (permission denied) vs. temporary errors (location unavailable)
- Error callbacks were being triggered for all errors, causing unnecessary noise

## Solution Implemented

### 1. **WebLocationProvider** (`src/lib/location/WebLocationProvider.ts`)
- Added intelligent error filtering in `getCurrentLocation()`
- Only logs non-timeout and non-unavailable errors
- Silently returns `null` for transient errors
- In `startWatching()`, only notifies for permission denied errors

### 2. **NativeLocationProvider** (`src/lib/location/NativeLocationProvider.ts`)
- Added error logging with context in `getCurrentLocation()`
- Filters errors in `watchPosition()` callback
- Only notifies for permission-related errors
- Silently ignores `kCLErrorLocationUnknown` and other transient errors

### 3. **Shopping Location Service** (`src/shopping/services/locationService.ts`)
- Added proper error type checking
- Only logs permission denied errors
- Silently handles transient location failures
- Added geolocation options (timeout, maximumAge, enableHighAccuracy)

### 4. **Daily Briefing Service** (`src/services/briefing/DailyBriefingService.ts`)
- Uses low accuracy mode to reduce errors
- Only logs permission errors at debug level
- Briefing works gracefully without location data

## Error Handling Strategy

### Critical Errors (User Action Required)
- **Permission Denied** - User must grant location permission
- **Not Supported** - Browser/device doesn't support geolocation

### Transient Errors (Silently Handled)
- **Position Unavailable** - GPS signal weak, will retry
- **Timeout** - Request took too long, will retry
- **kCLErrorLocationUnknown** - iOS couldn't determine location, will retry

## Testing

### Test in Browser
1. Open browser console
2. Navigate to a page that uses location (Shopping, Daily Briefing)
3. Verify no `kCLErrorLocationUnknown` errors appear
4. Check that location features still work when available

### Test Permission Denied
1. Deny location permission in browser
2. Verify a clear error message appears (not console spam)
3. Verify app continues to work without location

### Test Location Unavailable
1. Disable location services in system settings
2. Verify no console errors
3. Verify app gracefully handles missing location

## Best Practices for Location Services

### 1. **Always Provide Fallbacks**
```typescript
const location = await provider.getCurrentLocation();
if (!location) {
  // Use default location or skip location-based features
  return defaultBehavior();
}
```

### 2. **Use Appropriate Accuracy**
```typescript
// For critical features (navigation)
{ enableHighAccuracy: true, timeout: 10000 }

// For non-critical features (weather, briefing)
{ enableHighAccuracy: false, timeout: 5000 }
```

### 3. **Handle Errors Gracefully**
```typescript
try {
  const location = await getLocation();
} catch (error) {
  // Only log critical errors
  if (error.code === PERMISSION_DENIED) {
    showPermissionPrompt();
  }
  // Silently handle transient errors
}
```

### 4. **Cache Location Data**
```typescript
// Use maximumAge to avoid repeated requests
{ maximumAge: 300000 } // 5 minutes
```

## iOS-Specific Considerations

### Info.plist Permissions
Already configured in `ios/App/App/Info.plist`:
- `NSLocationWhenInUseUsageDescription` - For foreground location
- `NSLocationAlwaysAndWhenInUseUsageDescription` - For background location

### Common iOS Location Errors
- `kCLErrorLocationUnknown` (0) - Location unavailable
- `kCLErrorDenied` (1) - Permission denied
- `kCLErrorNetwork` (2) - Network error
- `kCLErrorHeadingFailure` (3) - Compass error

## Monitoring

### What to Monitor
- Permission grant/deny rates
- Location success rates
- Time to first location fix
- Battery impact of location services

### What NOT to Log
- Transient location failures
- Timeout errors
- Position unavailable errors

## Related Files
- `src/lib/location/WebLocationProvider.ts`
- `src/lib/location/NativeLocationProvider.ts`
- `src/shopping/services/locationService.ts`
- `src/services/briefing/DailyBriefingService.ts`
- `src/hooks/useLocation.ts`
- `ios/App/App/Info.plist`

