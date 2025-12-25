# Vite WebSocket Connection Fix

## Problem
```
WebSocket connection to 'ws://localhost:5173/?token=...' failed
[vite] failed to connect to websocket
```

This error prevents Vite's Hot Module Replacement (HMR) from working, meaning code changes won't automatically refresh in the browser.

## Root Cause
The Vite dev server was configured with `host: '0.0.0.0'` (to listen on all network interfaces) but the WebSocket client was trying to connect to `localhost:5173` without proper HMR configuration. This mismatch causes WebSocket connection failures.

## Solution Implemented

### Updated `vite.config.ts`
Added HMR configuration to explicitly set the WebSocket connection parameters:

```typescript
server: {
  host: '0.0.0.0', // Listen on all interfaces
  port: 5173,
  strictPort: true,
  hmr: {
    // Fix WebSocket connection issues
    clientPort: 5173,
    host: 'localhost',
  },
  proxy: {
    '/api': {
      target: 'http://localhost:3001',
      changeOrigin: true,
    },
  },
}
```

## How to Apply the Fix

### 1. Restart the Dev Server
```bash
# Kill any existing Vite processes
npm run cleanup:ports

# Or manually
lsof -ti:5173 | xargs kill -9

# Start fresh
npm run dev
```

### 2. Clear Browser Cache
- Hard refresh: `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows/Linux)
- Or clear browser cache completely

### 3. Verify the Fix
1. Open browser console
2. Look for successful WebSocket connection message
3. Make a small change to a React component
4. Verify the page updates without manual refresh

## Alternative Solutions

### Option 1: Use localhost Only
If you don't need network access, simplify the config:

```typescript
server: {
  host: 'localhost', // Only listen on localhost
  port: 5173,
  strictPort: true,
}
```

### Option 2: Use IP Address
If accessing from other devices on your network:

```typescript
server: {
  host: '0.0.0.0',
  port: 5173,
  hmr: {
    host: '192.168.1.x', // Your machine's IP
    clientPort: 5173,
  },
}
```

### Option 3: Disable HMR (Not Recommended)
Only use this for debugging:

```typescript
server: {
  host: '0.0.0.0',
  port: 5173,
  hmr: false, // Disables hot reload
}
```

## Common Causes of WebSocket Errors

### 1. **Port Already in Use**
```bash
# Check what's using port 5173
lsof -i :5173

# Kill the process
kill -9 <PID>
```

### 2. **Firewall Blocking WebSocket**
- Check firewall settings
- Allow port 5173 for both TCP and WebSocket

### 3. **Proxy/VPN Issues**
- Some corporate proxies block WebSocket connections
- Try disabling VPN temporarily

### 4. **Browser Extensions**
- Ad blockers or security extensions may block WebSockets
- Try in incognito mode

### 5. **Multiple Vite Instances**
```bash
# Kill all node processes
pkill -f vite

# Or use the cleanup script
npm run cleanup:ports
```

## Testing the Fix

### Test 1: WebSocket Connection
1. Open browser DevTools → Network tab
2. Filter by "WS" (WebSocket)
3. Look for successful connection to `ws://localhost:5173`
4. Status should be "101 Switching Protocols"

### Test 2: HMR Functionality
1. Open a React component (e.g., `src/App.tsx`)
2. Change some text
3. Save the file
4. Browser should update without manual refresh
5. Console should show: `[vite] hot updated: /src/App.tsx`

### Test 3: Error Recovery
1. Introduce a syntax error
2. Vite should show error overlay
3. Fix the error
4. Overlay should disappear automatically

## Monitoring

### What to Look For
✅ **Success Indicators:**
- `[vite] connected.` in browser console
- WebSocket status: 101 (Switching Protocols)
- Changes reflect immediately without refresh

❌ **Failure Indicators:**
- `[vite] failed to connect to websocket`
- WebSocket status: Failed
- Need to manually refresh for changes

## Troubleshooting Steps

### Step 1: Check Vite Server
```bash
# Ensure Vite is running
npm run dev

# Should see:
# VITE v5.x.x  ready in xxx ms
# ➜  Local:   http://localhost:5173/
# ➜  Network: http://0.0.0.0:5173/
```

### Step 2: Check Network Tab
- Open DevTools → Network
- Look for WebSocket connection
- Check status code (should be 101)

### Step 3: Check Console
- Look for Vite connection messages
- Check for any CORS or security errors

### Step 4: Restart Everything
```bash
# Kill all processes
npm run cleanup:ports

# Clear node_modules cache (if needed)
rm -rf node_modules/.vite

# Restart dev server
npm run dev
```

## Related Files
- `vite.config.ts` - Main Vite configuration
- `package.json` - Scripts for running dev server
- `.env` - Environment variables (if any)

## Additional Resources
- [Vite Server Options](https://vite.dev/config/server-options.html)
- [Vite HMR Configuration](https://vite.dev/config/server-options.html#server-hmr)
- [WebSocket Troubleshooting](https://vite.dev/guide/troubleshooting.html)

