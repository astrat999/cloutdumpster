import { sveltekit } from '@sveltejs/kit/vite';
import { SvelteKitPWA } from '@vite-pwa/sveltekit'; // Tactical Import
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [
		sveltekit(),
		// Tactical Order: "Configure the SvelteKitPWA plugin."
		SvelteKitPWA({
			registerType: 'autoUpdate',
			strategies: 'injectManifest', // Tactical Change: Use our own service worker file
			srcDir: 'src',
			filename: 'sw.ts',
			manifest: {
				// We are pointing it to our manifest file.
				// This is simpler than defining the manifest inline.
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
