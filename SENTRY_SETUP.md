# Sentry Error Monitoring Setup Guide

This guide explains how to set up Sentry for production error monitoring in LifeSync.

## What is Sentry?

Sentry is an error tracking and monitoring service that helps you:
- **Track production errors** - See all errors that users encounter in real-time
- **Monitor performance** - Track slow operations and performance bottlenecks
- **Replay sessions** - Watch session replays to understand what led to errors
- **Get alerts** - Receive notifications when critical errors occur

## Setup Steps

### 1. Create a Sentry Account

1. Go to [https://sentry.io](https://sentry.io)
2. Sign up for a free account (includes 5,000 errors/month)
3. Create a new project
   - Platform: **React**
   - Alert frequency: **On every new issue** (recommended for small projects)

### 2. Get Your DSN

After creating the project, Sentry will show you a **DSN** (Data Source Name). It looks like:
```
https://examplePublicKey@o0.ingest.sentry.io/0
```

### 3. Configure Your Environment

Add the DSN to your environment files:

**For Production** (`.env.production`):
```bash
VITE_SENTRY_DSN=https://your-actual-dsn-here@o0.ingest.sentry.io/0
```

**For Staging** (`.env.staging`):
```bash
VITE_SENTRY_DSN=https://your-actual-dsn-here@o0.ingest.sentry.io/0
```

**For Local Development** (`.env.local`):
```bash
# Leave empty - Sentry only runs in production builds
VITE_SENTRY_DSN=
```

### 4. Build and Deploy

Sentry is **only active in production mode**:

```bash
# Build for production
npm run build

# Preview production build locally
npm run preview
```

When you deploy to production, errors will automatically be sent to Sentry.

## How It Works

### Automatic Error Capture

Sentry automatically captures:
- ✅ Unhandled React errors (via ErrorBoundary)
- ✅ Route-level errors (via RouteErrorBoundary)
- ✅ Network errors from API calls
- ✅ Uncaught JavaScript exceptions
- ✅ Unhandled promise rejections

### Manual Error Logging

The logger service sends errors to Sentry:

```typescript
import { logger } from '@/services/logger';

// This will be sent to Sentry in production
logger.error('Finance', 'Failed to fetch transactions', {
  userId: user.id,
  error: error.message
});
```

### Privacy & Security

Sentry is configured to:
- ✅ Filter out passwords and tokens from error reports
- ✅ Only send errors in production (not during development)
- ✅ Sample 10% of sessions for performance monitoring
- ✅ Capture 100% of sessions with errors for replay

## Viewing Errors

1. Go to [https://sentry.io](https://sentry.io)
2. Select your project
3. Navigate to **Issues** to see all errors
4. Click on an issue to see:
   - Error message and stack trace
   - User context (browser, OS, location)
   - Breadcrumbs (what happened before the error)
   - Session replay (if error occurred)

## Pricing

**Free Tier** (Perfect for small projects):
- 5,000 errors per month
- 10,000 performance monitoring transactions/month
- 50 session replays/month
- 1 team member
- 30 days of data retention

**Paid Tiers**: Only needed for larger scale or team collaboration.

## Troubleshooting

### Errors Not Appearing in Sentry?

1. **Check DSN is set**: `echo $VITE_SENTRY_DSN` should show your DSN
2. **Check production mode**: Sentry only runs when `import.meta.env.PROD` is true
3. **Check browser console**: Should see "Sentry initialized" in production builds
4. **Test manually**:
   ```typescript
   import * as Sentry from '@sentry/react';
   Sentry.captureMessage('Test error from LifeSync');
   ```

### Too Many Errors?

Adjust sampling rates in `src/main.tsx`:

```typescript
Sentry.init({
  // ... other config
  tracesSampleRate: 0.05,  // Lower from 0.1 to 0.05 (5%)
  replaysSessionSampleRate: 0.05,  // Lower from 0.1 to 0.05 (5%)
});
```

## Alternative Error Monitoring Services

Don't want to use Sentry? You can integrate alternatives:

- **LogRocket** - Better for session replay and frontend monitoring
- **Bugsnag** - Similar to Sentry with different pricing
- **Rollbar** - Good for backend + frontend error tracking

Just update `src/services/logger.ts` to use their SDK instead of Sentry.

## Support

- Sentry Docs: [https://docs.sentry.io/platforms/javascript/guides/react/](https://docs.sentry.io/platforms/javascript/guides/react/)
- LifeSync Issue Tracker: [Your GitHub Issues URL]
