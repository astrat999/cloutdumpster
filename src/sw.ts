/// <reference lib="webworker" />
import { build, files, version } from '$service-worker';

declare const self: ServiceWorkerGlobalScope;

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
