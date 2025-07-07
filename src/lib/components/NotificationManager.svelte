<script lang="ts">
	import { onMount } from 'svelte';
	import { PUBLIC_VAPID_KEY } from '$env/static/public';
	import { db, auth } from '$lib/firebase';
	import { doc, setDoc } from 'firebase/firestore';
	import { user } from '$lib/stores';

	let isSubscribed = false;
	let isSupported = false;

	// Tactical Order: "Create a function to subscribe the user to push notifications."
	async function subscribeUser() {
		try {
			const swRegistration = await navigator.serviceWorker.ready;
			const subscription = await swRegistration.pushManager.subscribe({
				userVisibleOnly: true,
				applicationServerKey: urlBase64ToUint8Array(PUBLIC_VAPID_KEY)
			});

			// Send the subscription object to our backend to be saved.
			if ($user) {
				const subRef = doc(db, 'subscriptions', $user.uid);
				await setDoc(subRef, JSON.parse(JSON.stringify(subscription)));
				isSubscribed = true;
				alert('Notifications enabled. We will now live in your head rent-free.');
			}
		} catch (error) {
			console.error('Failed to subscribe the user: ', error);
			alert('You resisted. For now.');
		}
	}

	// Helper function to convert VAPID key.
	function urlBase64ToUint8Array(base64String: string) {
		const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
		const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
		const rawData = window.atob(base64);
		const outputArray = new Uint8Array(rawData.length);
		for (let i = 0; i < rawData.length; ++i) {
			outputArray[i] = rawData.charCodeAt(i);
		}
		return outputArray;
	}

	onMount(async () => {
		// Check if push notifications are supported
		if ('serviceWorker' in navigator && 'PushManager' in window) {
			isSupported = true;

			// Check if already subscribed
			try {
				const swRegistration = await navigator.serviceWorker.ready;
				const subscription = await swRegistration.pushManager.getSubscription();
				isSubscribed = !(subscription === null);
			} catch (error) {
				console.error('Error checking subscription status:', error);
			}
		}
	});
</script>

{#if isSupported}
	<div class="card bg-base-100 shadow-xl">
		<div class="card-body">
			<h2 class="card-title">🔔 Control Your Descent</h2>
			<p>
				Enable notifications to be instantly alerted to new whispers, score changes, and other vital
				drama.
			</p>
			<div class="card-actions justify-end">
				<button class="btn btn-primary" on:click={subscribeUser} disabled={isSubscribed}>
					{isSubscribed ? '✅ You Are Ours' : '🔔 Enable Notifications'}
				</button>
			</div>
		</div>
	</div>
{/if}
