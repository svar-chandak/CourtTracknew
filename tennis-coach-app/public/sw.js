// Service Worker for push notifications
const CACHE_NAME = 'courttrack-v1'
const urlsToCache = [
  '/',
  '/dashboard',
  '/static/js/bundle.js',
  '/static/css/main.css',
]

// Install event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache')
        return cache.addAll(urlsToCache)
      })
  )
})

// Fetch event
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache hit - return response
        if (response) {
          return response
        }
        return fetch(event.request)
      }
    )
  )
})

// Push event
self.addEventListener('push', (event) => {
  console.log('Push message received')

  let data = {}
  if (event.data) {
    data = event.data.json()
  }

  const options = {
    body: data.body || 'You have a new team announcement',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: data.primaryKey || '1'
    },
    actions: [
      {
        action: 'explore',
        title: 'View Announcement',
        icon: '/icons/checkmark.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/icons/xmark.png'
      }
    ]
  }

  event.waitUntil(
    self.registration.showNotification(data.title || 'Team Announcement', options)
  )
})

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('Notification click received')

  event.notification.close()

  if (event.action === 'explore') {
    // Open the app
    event.waitUntil(
      clients.openWindow('/dashboard/announcements')
    )
  } else if (event.action === 'close') {
    // Just close the notification
    return
  } else {
    // Default action - open the app
    event.waitUntil(
      clients.openWindow('/dashboard/announcements')
    )
  }
})

// Background sync for offline support
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    console.log('Background sync triggered')
    event.waitUntil(doBackgroundSync())
  }
})

async function doBackgroundSync() {
  // Handle offline data sync when connection is restored
  try {
    // This would sync any offline changes with the server
    console.log('Syncing offline data...')
  } catch (error) {
    console.error('Background sync failed:', error)
  }
}
