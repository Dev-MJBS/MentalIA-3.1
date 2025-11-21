// MentalIA 3.0 - Service Worker
// Offline support, caching, and background sync

const CACHE_NAME = 'mental-ia-v3.0.0';
const STATIC_CACHE = `${CACHE_NAME}-static`;
const DYNAMIC_CACHE = `${CACHE_NAME}-dynamic`;
const RUNTIME_CACHE = `${CACHE_NAME}-runtime`;

// Resources to cache immediately
const STATIC_RESOURCES = [
    '/',
    '/index.html',
    '/css/styles.css',
    '/js/app.js',
    '/js/storage.js',
    '/js/ai_analysis.js',
    '/js/google_drive_backup.js',
    '/manifest.json',
    // External CDN resources (cache for offline use)
    'https://cdn.jsdelivr.net/npm/chart.js',
    'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2/dist/transformers.min.js'
];

// Resources that should be cached dynamically
const DYNAMIC_RESOURCES = [
    '/api/',
    'https://api.anthropic.com/',
    'https://generativelanguage.googleapis.com/',
    'https://www.googleapis.com/'
];

// Install event - cache static resources
self.addEventListener('install', (event) => {
    console.log('🔧 Service Worker: Installing...');
    
    event.waitUntil(
        Promise.all([
            // Cache static resources
            caches.open(STATIC_CACHE).then((cache) => {
                console.log('📦 Caching static resources...');
                return cache.addAll(STATIC_RESOURCES.map(url => {
                    return new Request(url, { cache: 'no-cache' });
                })).catch(error => {
                    console.warn('Some static resources failed to cache:', error);
                    // Don't fail the entire installation for missing resources
                    return Promise.resolve();
                });
            }),
            
            // Initialize other caches
            caches.open(DYNAMIC_CACHE),
            caches.open(RUNTIME_CACHE)
        ])
    );
    
    // Force activation
    self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('✅ Service Worker: Activating...');
    
    event.waitUntil(
        Promise.all([
            // Clean up old caches
            caches.keys().then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        if (cacheName.startsWith('mental-ia-') && !cacheName.startsWith(CACHE_NAME)) {
                            console.log('🗑️ Deleting old cache:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            }),
            
            // Take control of all clients
            self.clients.claim()
        ])
    );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);
    
    // Skip non-GET requests
    if (request.method !== 'GET') {
        return;
    }
    
    // Skip chrome-extension requests
    if (url.protocol === 'chrome-extension:') {
        return;
    }
    
    // Handle different types of requests
    if (isStaticResource(request)) {
        event.respondWith(handleStaticResource(request));
    } else if (isAPIRequest(request)) {
        event.respondWith(handleAPIRequest(request));
    } else if (isExternalResource(request)) {
        event.respondWith(handleExternalResource(request));
    } else {
        event.respondWith(handleRuntimeResource(request));
    }
});

// Check if request is for static resources
function isStaticResource(request) {
    const url = new URL(request.url);
    const path = url.pathname;
    
    return (
        path === '/' ||
        path.endsWith('.html') ||
        path.endsWith('.css') ||
        path.endsWith('.js') ||
        path.endsWith('.json') ||
        path.includes('/css/') ||
        path.includes('/js/')
    );
}

// Check if request is for API
function isAPIRequest(request) {
    const url = new URL(request.url);
    return (
        url.pathname.startsWith('/api/') ||
        url.hostname === 'api.anthropic.com' ||
        url.hostname === 'generativelanguage.googleapis.com' ||
        url.hostname.includes('googleapis.com')
    );
}

// Check if request is for external resources
function isExternalResource(request) {
    const url = new URL(request.url);
    return (
        url.hostname !== self.location.hostname &&
        (url.hostname === 'cdn.jsdelivr.net' ||
         url.hostname === 'fonts.googleapis.com' ||
         url.hostname === 'fonts.gstatic.com')
    );
}

// Handle static resources - cache first, fallback to network
async function handleStaticResource(request) {
    try {
        // Try cache first
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        
        // Fallback to network
        const networkResponse = await fetch(request);
        
        // Cache successful responses
        if (networkResponse.ok) {
            const cache = await caches.open(STATIC_CACHE);
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
    } catch (error) {
        console.error('Error handling static resource:', error);
        
        // Return offline fallback
        if (request.url.endsWith('.html') || request.url === self.location.origin + '/') {
            return caches.match('/index.html');
        }
        
        throw error;
    }
}

// Handle API requests - network first, fallback to cache for critical data
async function handleAPIRequest(request) {
    try {
        // Try network first for fresh data
        const networkResponse = await fetch(request);
        
        // Cache successful GET responses
        if (networkResponse.ok && request.method === 'GET') {
            const cache = await caches.open(DYNAMIC_CACHE);
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
    } catch (error) {
        console.warn('API request failed, trying cache:', error);
        
        // Fallback to cache
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        
        // Return offline response for API failures
        return new Response(
            JSON.stringify({
                error: 'offline',
                message: 'Você está offline. Algumas funcionalidades podem estar limitadas.'
            }),
            {
                status: 503,
                headers: { 'Content-Type': 'application/json' }
            }
        );
    }
}

// Handle external resources - cache first for performance
async function handleExternalResource(request) {
    try {
        // Try cache first
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            // Serve from cache and update in background
            updateCacheInBackground(request);
            return cachedResponse;
        }
        
        // Fallback to network
        const networkResponse = await fetch(request);
        
        // Cache successful responses
        if (networkResponse.ok) {
            const cache = await caches.open(RUNTIME_CACHE);
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
    } catch (error) {
        console.error('Error handling external resource:', error);
        
        // Try cache as last resort
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        
        throw error;
    }
}

// Handle runtime resources - stale while revalidate
async function handleRuntimeResource(request) {
    try {
        const cache = await caches.open(RUNTIME_CACHE);
        const cachedResponse = await cache.match(request);
        
        // Always try to fetch fresh version
        const fetchPromise = fetch(request).then((networkResponse) => {
            if (networkResponse.ok) {
                cache.put(request, networkResponse.clone());
            }
            return networkResponse;
        }).catch(() => {
            // Network failed, rely on cache
            return cachedResponse;
        });
        
        // Return cache immediately if available, otherwise wait for network
        return cachedResponse || await fetchPromise;
    } catch (error) {
        console.error('Error handling runtime resource:', error);
        throw error;
    }
}

// Update cache in background
async function updateCacheInBackground(request) {
    try {
        const networkResponse = await fetch(request);
        if (networkResponse.ok) {
            const cache = await caches.open(RUNTIME_CACHE);
            cache.put(request, networkResponse);
        }
    } catch (error) {
        // Silently fail background updates
        console.warn('Background cache update failed:', error);
    }
}

// Background sync for data synchronization
self.addEventListener('sync', (event) => {
    console.log('🔄 Background sync triggered:', event.tag);
    
    if (event.tag === 'mood-data-sync') {
        event.waitUntil(syncMoodData());
    } else if (event.tag === 'backup-sync') {
        event.waitUntil(syncBackupData());
    }
});

// Sync mood data when connection is restored
async function syncMoodData() {
    try {
        console.log('📊 Syncing mood data...');
        
        // This would typically sync with a backend server
        // For now, we'll just log the action
        
        const clients = await self.clients.matchAll();
        clients.forEach(client => {
            client.postMessage({
                type: 'sync-complete',
                data: { syncType: 'mood-data' }
            });
        });
        
        console.log('✅ Mood data sync completed');
    } catch (error) {
        console.error('❌ Mood data sync failed:', error);
    }
}

// Sync backup data
async function syncBackupData() {
    try {
        console.log('☁️ Syncing backup data...');
        
        // This would typically handle backup synchronization
        // For now, we'll just log the action
        
        const clients = await self.clients.matchAll();
        clients.forEach(client => {
            client.postMessage({
                type: 'sync-complete',
                data: { syncType: 'backup-data' }
            });
        });
        
        console.log('✅ Backup sync completed');
    } catch (error) {
        console.error('❌ Backup sync failed:', error);
    }
}

// Push notifications
self.addEventListener('push', (event) => {
    console.log('📲 Push notification received');
    
    let data = {};
    if (event.data) {
        try {
            data = event.data.json();
        } catch (error) {
            console.error('Error parsing push data:', error);
        }
    }
    
    const options = {
        title: data.title || 'MentalIA 3.0',
        body: data.body || 'Lembrete para registrar seu humor',
        icon: '/icon-192x192.png',
        badge: '/icon-72x72.png',
        data: data.url || '/',
        actions: [
            {
                action: 'open',
                title: 'Abrir App'
            },
            {
                action: 'dismiss',
                title: 'Dispensar'
            }
        ],
        tag: 'mental-ia-reminder',
        renotify: true,
        requireInteraction: false,
        vibrate: [200, 100, 200]
    };
    
    event.waitUntil(
        self.registration.showNotification(options.title, options)
    );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
    console.log('🔔 Notification clicked:', event.action);
    
    event.notification.close();
    
    if (event.action === 'dismiss') {
        return;
    }
    
    // Default action or 'open' action
    const urlToOpen = event.notification.data || '/';
    
    event.waitUntil(
        self.clients.matchAll({ type: 'window' }).then((clients) => {
            // Check if there's already a window open
            const existingClient = clients.find(client => {
                return client.url.includes(self.location.origin);
            });
            
            if (existingClient) {
                // Focus existing window and navigate
                existingClient.focus();
                existingClient.postMessage({
                    type: 'navigate',
                    url: urlToOpen
                });
            } else {
                // Open new window
                self.clients.openWindow(urlToOpen);
            }
        })
    );
});

// Handle messages from main thread
self.addEventListener('message', (event) => {
    console.log('💬 Message received in SW:', event.data);
    
    const { type, data } = event.data;
    
    switch (type) {
        case 'skip-waiting':
            self.skipWaiting();
            break;
        case 'cache-urls':
            event.waitUntil(cacheUrls(data.urls));
            break;
        case 'clear-cache':
            event.waitUntil(clearCache(data.cacheNames));
            break;
        case 'schedule-sync':
            event.waitUntil(scheduleSync(data.tag));
            break;
    }
});

// Cache specific URLs
async function cacheUrls(urls) {
    try {
        const cache = await caches.open(RUNTIME_CACHE);
        await cache.addAll(urls);
        console.log('📦 URLs cached successfully');
    } catch (error) {
        console.error('Error caching URLs:', error);
    }
}

// Clear specific caches
async function clearCache(cacheNames) {
    try {
        const promises = cacheNames.map(name => caches.delete(name));
        await Promise.all(promises);
        console.log('🗑️ Caches cleared successfully');
    } catch (error) {
        console.error('Error clearing caches:', error);
    }
}

// Schedule background sync
async function scheduleSync(tag) {
    try {
        await self.registration.sync.register(tag);
        console.log(`🔄 Sync scheduled: ${tag}`);
    } catch (error) {
        console.error('Error scheduling sync:', error);
    }
}

// Periodic background sync (experimental)
self.addEventListener('periodicsync', (event) => {
    console.log('⏰ Periodic sync triggered:', event.tag);
    
    if (event.tag === 'mood-reminder') {
        event.waitUntil(sendMoodReminder());
    }
});

// Send mood reminder notification
async function sendMoodReminder() {
    try {
        // Check if user has registered mood today
        // This would typically check with the storage system
        
        const options = {
            title: '🧠 MentalIA Lembrete',
            body: 'Que tal registrar como você está se sentindo hoje?',
            icon: '/icon-192x192.png',
            badge: '/icon-72x72.png',
            data: '/?screen=mood',
            tag: 'daily-mood-reminder',
            requireInteraction: false
        };
        
        await self.registration.showNotification(options.title, options);
        console.log('📲 Mood reminder sent');
    } catch (error) {
        console.error('Error sending mood reminder:', error);
    }
}

// Error handling
self.addEventListener('error', (event) => {
    console.error('Service Worker error:', event.error);
});

self.addEventListener('unhandledrejection', (event) => {
    console.error('Service Worker unhandled rejection:', event.reason);
});

// Cleanup on beforeunload
self.addEventListener('beforeunload', () => {
    console.log('🔧 Service Worker: Cleaning up...');
});

console.log('🚀 MentalIA 3.0 Service Worker loaded successfully');