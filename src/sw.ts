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
