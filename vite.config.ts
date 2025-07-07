import { sveltekit } from '@sveltejs/kit/vite';
import { SvelteKitPWA } from '@vite-pwa/sveltekit'; // Tactical Import
import { defineConfig } from 'vite';

export default defineConfig({
	build: {
		chunkSizeWarningLimit: 800 // Increase limit to suppress large chunk warnings
	},
	plugins: [
		sveltekit(),
		// Tactical Order: "Configure the SvelteKitPWA plugin."
		SvelteKitPWA({
			registerType: 'autoUpdate',
			strategies: 'generateSW',
			workbox: {
				globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,woff,woff2}'],
				runtimeCaching: [
					{
						urlPattern: /^https:\/\/api\./,
						handler: 'NetworkFirst',
						options: {
							cacheName: 'api-cache',
							networkTimeoutSeconds: 5
						}
					},
					{
						urlPattern: /\.(?:png|jpg|jpeg|svg|webp)$/,
						handler: 'CacheFirst',
						options: {
							cacheName: 'images'
						}
					}
				]
			},
			manifest: {
				name: 'CloutDumpster',
				short_name: 'CloutDumpster',
				description: 'Your reputation is garbage. Embrace it.',
				start_url: '/',
				display: 'standalone',
				background_color: '#1D232A',
				theme_color: '#F472B6',
				icons: [
					{
						src: '/favicon.svg',
						sizes: 'any',
						type: 'image/svg+xml',
						purpose: 'any maskable'
					}
				]
			}
		})
	]
});
