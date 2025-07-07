/// <reference lib="webworker" />
import { build, files, version } from '$service-worker';
import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { NavigationRoute, registerRoute } from 'workbox-routing';
import { NetworkFirst, CacheFirst } from 'workbox-strategies';

declare const self: ServiceWorkerGlobalScope;

// Clean up any old caches
cleanupOutdatedCaches();

// Precache all static assets
precacheAndRoute(self.__WB_MANIFEST);

// Cache the SvelteKit app shell
registerRoute(
	new NavigationRoute(
		new NetworkFirst({
			cacheName: 'app-shell',
			networkTimeoutSeconds: 3
		})
	)
);

// Cache API calls
registerRoute(
	({ url }) => url.pathname.startsWith('/api/'),
	new NetworkFirst({
		cacheName: 'api-cache',
		networkTimeoutSeconds: 5
	})
);

// Cache images
registerRoute(
	({ request }) => request.destination === 'image',
	new CacheFirst({
		cacheName: 'images'
	})
);

// Tactical Order: "Add an event listener for 'push' events."
self.addEventListener('push', (event) => {
	const data = event.data?.json();
	const options = {
		body: data.body,
		icon: data.icon,
		data: data.data
	};
	event.waitUntil(self.registration.showNotification(data.title, options));
});

// Tactical Order: "Add an event listener for 'notificationclick' events."
self.addEventListener('notificationclick', (event) => {
	event.notification.close();
	const urlToOpen = event.notification.data.url || '/';
	event.waitUntil(self.clients.openWindow(urlToOpen));
});

// SW PUSH HANDLER: show notification, on click open /feed
self.addEventListener('push', (e) => {
	if (!e.data) return;
	
	const data = e.data.json();
	const { title, body, icon = '/favicon.svg', tag = 'clout-notification' } = data;
	
	e.waitUntil(
		self.registration.showNotification(title, {
			body,
			icon,
			tag,
			badge: '/favicon.svg',
			requireInteraction: true
		})
	);
});

self.addEventListener('notificationclick', (e) => {
	e.notification.close();
	
	e.waitUntil(
		self.clients.matchAll({ type: 'window' }).then((clientList) => {
			// Check if there's already a window/tab open
			for (const client of clientList) {
				if (client.url.includes('/feed') && 'focus' in client) {
					return client.focus();
				}
			}
			// If not, open a new window
			return self.clients.openWindow('/feed');
		})
	);
});
