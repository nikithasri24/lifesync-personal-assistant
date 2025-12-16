// LifeSync Push Notification Service Worker
// This service worker handles push notifications when the app is in the background

// Cache name for offline support
const CACHE_NAME = 'lifesync-push-v1';

// Install event - cache essential assets
self.addEventListener('install', (event) => {
  console.log('[SW Push] Installing service worker');
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW Push] Activating service worker');
  event.waitUntil(self.clients.claim());
});

// Push event - handle incoming push notifications
self.addEventListener('push', (event) => {
  console.log('[SW Push] Push received:', event);

  let data = {
    title: 'LifeSync',
    body: 'You have a new notification',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    tag: 'lifesync-notification',
    data: {},
  };

  // Parse push data
  if (event.data) {
    try {
      const payload = event.data.json();
      data = {
        ...data,
        ...payload,
      };
    } catch (e) {
      // If not JSON, use as body text
      data.body = event.data.text();
    }
  }

  // Show notification
  const options = {
    body: data.body,
    icon: data.icon || '/icons/icon-192x192.png',
    badge: data.badge || '/icons/badge-72x72.png',
    tag: data.tag || 'lifesync-notification',
    data: data.data || {},
    vibrate: [100, 50, 100],
    requireInteraction: data.requireInteraction || false,
    actions: data.actions || [],
    // Renotify if same tag
    renotify: true,
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Notification click event - handle user interaction
self.addEventListener('notificationclick', (event) => {
  console.log('[SW Push] Notification clicked:', event);

  event.notification.close();

  const data = event.notification.data || {};
  let targetUrl = '/';

  // Determine target URL based on notification type
  if (data.type) {
    switch (data.type) {
      case 'task_due':
      case 'task_overdue':
        targetUrl = data.task_id ? `/tasks?id=${data.task_id}` : '/tasks';
        break;
      case 'habit_reminder':
        targetUrl = data.habit_id ? `/habits?id=${data.habit_id}` : '/habits';
        break;
      case 'calendar_event':
        targetUrl = '/calendar';
        break;
      case 'bill_reminder':
        targetUrl = '/finance';
        break;
      case 'morning_briefing':
        targetUrl = '/dashboard';
        break;
      case 'weekly_report':
        targetUrl = '/analytics';
        break;
      case 'achievement':
        targetUrl = '/achievements';
        break;
      default:
        targetUrl = data.url || '/';
    }
  }

  // Handle action buttons
  if (event.action) {
    switch (event.action) {
      case 'complete':
        // Mark task/habit as complete via API
        // This would need to be implemented with a fetch call
        console.log('[SW Push] Complete action clicked');
        break;
      case 'snooze':
        // Snooze notification for 15 minutes
        console.log('[SW Push] Snooze action clicked');
        break;
      case 'dismiss':
        // Just close the notification
        return;
    }
  }

  // Focus or open the app
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Check if app is already open
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.navigate(targetUrl);
            return client.focus();
          }
        }
        // Open new window if not
        if (self.clients.openWindow) {
          return self.clients.openWindow(targetUrl);
        }
      })
  );
});

// Notification close event - track dismissals
self.addEventListener('notificationclose', (event) => {
  console.log('[SW Push] Notification closed:', event);
  
  // Could send analytics about dismissed notifications
  const data = event.notification.data || {};
  if (data.notification_id) {
    // Track dismissal
    console.log('[SW Push] Notification dismissed:', data.notification_id);
  }
});

// Message event - handle messages from the main app
self.addEventListener('message', (event) => {
  console.log('[SW Push] Message received:', event.data);

  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

