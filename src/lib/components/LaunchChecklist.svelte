<script lang="ts">
	import { onMount } from 'svelte';
	import { setupHeroImages } from '$lib/setup/heroImages';
	import { testPushNotification } from '$lib/utils/pushTest';

	let checklist = [
		{ 
			id: 'vapid', 
			name: 'VITE_VAPID_KEY Environment Variable', 
			status: 'pending',
			description: 'Add VAPID key to Netlify environment variables'
		},
		{ 
			id: 'hero', 
			name: 'Hero Images Upload', 
			status: 'pending',
			description: 'Upload hero1.jpg, hero2.jpg, hero3.jpg to /static/'
		},
		{ 
			id: 'firestore', 
			name: 'Firestore Hero Config', 
			status: 'pending',
			description: 'Configure hero images in Firestore settings/heroImages'
		},
		{ 
			id: 'push', 
			name: 'Push Notification Test', 
			status: 'pending',
			description: 'Test FCM push notifications end-to-end'
		},
		{ 
			id: 'ssl', 
			name: 'SSL Certificate Active', 
			status: 'pending',
			description: 'Verify HTTPS redirects work properly'
		},
		{ 
			id: 'pwa', 
			name: 'PWA Install Banner', 
			status: 'pending',
			description: 'Test "Add to Home Screen" on mobile'
		}
	];

	async function checkVapidKey() {
		const vapidKey = import.meta.env.VITE_VAPID_KEY;
		updateStatus('vapid', vapidKey ? 'success' : 'error');
	}

	async function setupFirestoreHero() {
		const success = await setupHeroImages();
		updateStatus('firestore', success ? 'success' : 'error');
	}

	async function runPushTest() {
		try {
			await testPushNotification();
			updateStatus('push', 'success');
		} catch (error) {
			updateStatus('push', 'error');
		}
	}

	function updateStatus(id: string, status: 'pending' | 'success' | 'error') {
		checklist = checklist.map(item => 
			item.id === id ? { ...item, status } : item
		);
	}

	function getStatusIcon(status: string) {
		switch (status) {
			case 'success': return '✅';
			case 'error': return '❌';
			default: return '⏳';
		}
	}

	onMount(() => {
		checkVapidKey();
	});
</script>

<div class="launch-checklist max-w-4xl mx-auto p-6">
	<div class="text-center mb-8">
		<h1 class="text-4xl font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">
			🚀 CloutDumpster Launch Checklist
		</h1>
		<p class="text-gray-600 mt-2">Final steps to production blast-off</p>
	</div>

	<div class="space-y-4">
		{#each checklist as item}
			<div class="card bg-base-100 shadow-lg">
				<div class="card-body">
					<div class="flex items-center justify-between">
						<div class="flex items-center space-x-4">
							<span class="text-2xl">{getStatusIcon(item.status)}</span>
							<div>
								<h3 class="text-lg font-semibold">{item.name}</h3>
								<p class="text-sm text-gray-600">{item.description}</p>
							</div>
						</div>
						<div class="flex space-x-2">
							{#if item.id === 'firestore'}
								<button 
									class="btn btn-primary btn-sm" 
									on:click={setupFirestoreHero}
								>
									Setup Firestore
								</button>
							{/if}
							{#if item.id === 'push'}
								<button 
									class="btn btn-secondary btn-sm" 
									on:click={runPushTest}
								>
									Test Push
								</button>
							{/if}
						</div>
					</div>
				</div>
			</div>
		{/each}
	</div>

	<div class="mt-8 card bg-gradient-to-r from-purple-500 to-pink-500 text-white">
		<div class="card-body text-center">
			<h2 class="text-2xl font-bold">Ready to Launch?</h2>
			<p class="mb-4">When all items show ✅, you're ready for the marketing blast!</p>
			<div class="bg-black/20 p-4 rounded-lg">
				<p class="font-mono text-sm">
					"Think you're hot? Prove it. One pic. Instant judgement.<br>
					🔥 cloutdumpster.com 🔥 — Find out who's lurking."
				</p>
			</div>
		</div>
	</div>
</div>

<style>
	.launch-checklist {
		min-height: 100vh;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	}
</style>
