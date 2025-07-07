// SERVICE WORKER PUSH HANDLER: display push title/body, click → clients.openWindow('/whispers')
// SW PUSH: showNotification with title/body from payload, tap opens '/whispers'
// CloutDumpster Service Worker - Push Notifications & PWA
// Handles whispers, rating notifications, and offline caching

const CACHE_NAME = 'cloutdumpster-v1';
const OFFLINE_URL = '/offline.html';

// Files to cache for offline functionality
const CACHE_URLS = [
  '/',
  '/feed',
  '/rank',
  '/offline.html',
  '/manifest.json',
  '/favicon.svg'
];

// Install event - cache essential files
self.addEventListener('install', (event) => {
  console.log('[SW] Installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching essential files');
        return cache.addAll(CACHE_URLS);
      })
      .then(() => {
        console.log('[SW] Installation complete');
        return self.skipWaiting();
      })
  );
});

// Activate event - cleanup old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('[SW] Activation complete');
        return self.clients.claim();
      })
  );
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  // Skip chrome-extension and other non-http requests
  if (!event.request.url.startsWith('http')) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Clone response for caching
        const responseClone = response.clone();
        
        // Cache successful responses
        if (response.status === 200) {
          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseClone);
            });
        }
        
        return response;
      })
      .catch(() => {
        // Network failed, try cache
        return caches.match(event.request)
          .then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }
            
            // Return offline page for navigation requests
            if (event.request.mode === 'navigate') {
              return caches.match(OFFLINE_URL);
            }
            
            // Return a basic response for other requests
            return new Response('Offline', {
              status: 503,
              statusText: 'Service Unavailable'
            });
          });
      })
  );
});

// Push event - handle push notifications
self.addEventListener('push', (event) => {
  console.log('[SW] Push received:', event);
  
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    console.error('[SW] Error parsing push data:', e);
  }

  const options = {
    body: data.body || 'You have a new notification!',
    icon: '/favicon.svg',
    badge: '/favicon.svg',
    data: data,
    requireInteraction: true,
    actions: []
  };

  // Different notification types
  switch (data.type) {
    case 'whisper':
      options.title = '💭 New Whisper';
      options.body = `Someone whispered: "${data.message}"`;
      options.actions = [
        { action: 'view', title: 'View Whisper' },
        { action: 'dismiss', title: 'Dismiss' }
      ];
      break;
      
    case 'rating':
      const isPositive = data.rating > 0;
      options.title = isPositive ? '🔥 You\'re Hot!' : '❄️ Not So Hot';
      options.body = `Someone rated you ${isPositive ? 'hot' : 'not hot'}. Your clout: ${data.newClout}`;
      options.actions = [
        { action: 'view_profile', title: 'View Profile' },
        { action: 'rate_back', title: 'Rate Others' }
      ];
      break;
      
    case 'rank_change':
      const direction = data.change > 0 ? 'up' : 'down';
      const emoji = direction === 'up' ? '📈' : '📉';
      options.title = `${emoji} Rank Update`;
      options.body = `You moved ${direction} ${Math.abs(data.change)} spots! New rank: #${data.newRank}`;
      options.actions = [
        { action: 'view_leaderboard', title: 'View Rankings' },
        { action: 'share', title: 'Share' }
      ];
      break;
      
    case 'challenge':
      options.title = '⚡ Hot Challenge';
      options.body = `${data.challenger} challenged you to a hotness battle!`;
      options.actions = [
        { action: 'accept_challenge', title: 'Accept' },
        { action: 'decline_challenge', title: 'Decline' }
      ];
      break;
      
    default:
      options.title = data.title || '🔥 CloutDumpster';
  }

  event.waitUntil(
    self.registration.showNotification(options.title, options)
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event);
  
  event.notification.close();
  
  const data = event.notification.data || {};
  let targetUrl = '/feed';

  // Handle different actions
  switch (event.action) {
    case 'view':
    case 'view_whisper':
      targetUrl = `/whispers/${data.whisperId || ''}`;
      break;
      
    case 'view_profile':
      targetUrl = `/profile/${data.userId || ''}`;
      break;
      
    case 'rate_back':
    case 'view_leaderboard':
      targetUrl = '/rank';
      break;
      
    case 'share':
      // Handle sharing via Web Share API if available
      if (navigator.share) {
        navigator.share({
          title: 'Check out my CloutDumpster rank!',
          text: `I'm ranked #${data.newRank} on CloutDumpster! 🔥`,
          url: 'https://cloutdumpster.com'
        });
        return;
      }
      targetUrl = '/profile';
      break;
      
    case 'accept_challenge':
      targetUrl = `/challenge/${data.challengeId}?action=accept`;
      break;
      
    case 'decline_challenge':
      targetUrl = `/challenge/${data.challengeId}?action=decline`;
      break;
      
    case 'dismiss':
      return; // Just close, don't navigate
      
    default:
      // Default action based on notification type
      switch (data.type) {
        case 'whisper':
          targetUrl = `/whispers`;
          break;
        case 'rating':
          targetUrl = `/profile`;
          break;
        case 'rank_change':
          targetUrl = `/rank`;
          break;
        default:
          targetUrl = '/feed';
      }
  }

  // Open or focus the app
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Check if app is already open
        for (let client of clientList) {
          if (client.url.includes(targetUrl) && 'focus' in client) {
            return client.focus();
          }
        }
        
        // Open new window/tab
        if (clients.openWindow) {
          return clients.openWindow(targetUrl);
        }
      })
  );
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag);
  
  switch (event.tag) {
    case 'upload-votes':
      event.waitUntil(syncPendingVotes());
      break;
      
    case 'upload-whispers':
      event.waitUntil(syncPendingWhispers());
      break;
      
    default:
      console.log('[SW] Unknown sync tag:', event.tag);
  }
});

// Sync pending votes when back online
async function syncPendingVotes() {
  try {
    // Get pending votes from IndexedDB
    const pendingVotes = await getPendingVotes();
    
    for (const vote of pendingVotes) {
      try {
        // Send vote to server
        await fetch('/api/vote', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(vote)
        });
        
        // Remove from pending queue
        await removePendingVote(vote.id);
        
      } catch (error) {
        console.error('[SW] Failed to sync vote:', error);
      }
    }
    
    console.log(`[SW] Synced ${pendingVotes.length} pending votes`);
    
  } catch (error) {
    console.error('[SW] Error syncing votes:', error);
  }
}

// Sync pending whispers when back online
async function syncPendingWhispers() {
  try {
    const pendingWhispers = await getPendingWhispers();
    
    for (const whisper of pendingWhispers) {
      try {
        await fetch('/api/whispers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(whisper)
        });
        
        await removePendingWhisper(whisper.id);
        
      } catch (error) {
        console.error('[SW] Failed to sync whisper:', error);
      }
    }
    
    console.log(`[SW] Synced ${pendingWhispers.length} pending whispers`);
    
  } catch (error) {
    console.error('[SW] Error syncing whispers:', error);
  }
}

// IndexedDB helpers (simplified - you'd want a proper DB wrapper)
async function getPendingVotes() {
  return []; // Implement IndexedDB retrieval
}

async function removePendingVote(id) {
  // Implement IndexedDB removal
}

async function getPendingWhispers() {
  return []; // Implement IndexedDB retrieval
}

async function removePendingWhisper(id) {
  // Implement IndexedDB removal
}

// Message handling for communication with main app
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data);
  
  switch (event.data.type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
      
    case 'QUEUE_VOTE':
      // Queue vote for offline sync
      queuePendingVote(event.data.vote);
      break;
      
    case 'QUEUE_WHISPER':
      // Queue whisper for offline sync
      queuePendingWhisper(event.data.whisper);
      break;
      
    default:
      console.log('[SW] Unknown message type:', event.data.type);
  }
});

// Queue operations (implement with IndexedDB)
async function queuePendingVote(vote) {
  // Store in IndexedDB for offline sync
  console.log('[SW] Queued vote for sync:', vote);
}

async function queuePendingWhisper(whisper) {
  // Store in IndexedDB for offline sync
  console.log('[SW] Queued whisper for sync:', whisper);
}
