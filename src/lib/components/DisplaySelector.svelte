<script lang="ts">
	import { db } from '$lib/firebase';
	import { doc, updateDoc } from 'firebase/firestore';
	import { userProfile } from '$lib/stores';

	let isLoading = false;
	let message = '';

	// Tactical Order: "Create a function to set the primary display preference."
	async function setPrimaryDisplay(type: 'video' | 'photo') {
		if (!$userProfile) return;

		isLoading = true;
		message = '';

		try {
			const userDocRef = doc(db, 'users', $userProfile.uid);
			await updateDoc(userDocRef, {
				primaryDisplay: type
			});

			// Update local store
			$userProfile.primaryDisplay = type;
			userProfile.set($userProfile);

			message = `Your ${type === 'video' ? 'video' : 'picture'} is now your primary display.`;
		} catch (error) {
			message = 'Failed to update preference. The server is judging you.';
			console.error(error);
		} finally {
			isLoading = false;
		}
	}

	// Check if user has both media types
	$: hasBothTypes = $userProfile?.photoURL && $userProfile?.videoURL;
</script>

{#if hasBothTypes}
	<div class="rounded-2xl border border-royal/20 bg-silk/30 p-6">
		<div class="mb-4">
			<h3 class="mb-2 font-display text-xl font-bold text-white">Avatar Display</h3>
			<p class="text-sm text-gray-400">Choose which format to showcase as your primary avatar</p>
		</div>

		<div class="mb-4 grid grid-cols-2 gap-4">
			<button
				class="flex flex-col items-center space-y-2 rounded-xl border-2 p-4 transition-all duration-200 {$userProfile?.primaryDisplay ===
				'photo'
					? 'border-gold bg-gold/10'
					: 'border-gray-600 hover:border-royal'}"
				on:click={() => setPrimaryDisplay('photo')}
				disabled={isLoading}
			>
				<div
					class="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-royal to-purple-600"
				>
					{#if $userProfile?.photoURL}
						<img src={$userProfile.photoURL} alt="Preview" class="h-full w-full object-cover" />
					{:else}
						<span class="text-xl text-white">📷</span>
					{/if}
				</div>
				<span class="font-semibold text-white">Static Picture</span>
				{#if $userProfile?.primaryDisplay === 'photo'}
					<span class="text-xs font-bold text-gold">ACTIVE</span>
				{/if}
			</button>

			<button
				class="flex flex-col items-center space-y-2 rounded-xl border-2 p-4 transition-all duration-200 {$userProfile?.primaryDisplay ===
				'video'
					? 'border-gold bg-gold/10'
					: 'border-gray-600 hover:border-royal'}"
				on:click={() => setPrimaryDisplay('video')}
				disabled={isLoading}
			>
				<div
					class="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-royal to-purple-600"
				>
					{#if $userProfile?.videoURL}
						<video
							src={$userProfile.videoURL}
							muted
							loop
							autoplay
							class="h-full w-full object-cover"
						></video>
					{:else}
						<span class="text-xl text-white">🎥</span>
					{/if}
				</div>
				<span class="font-semibold text-white">Dynamic Video</span>
				{#if $userProfile?.primaryDisplay === 'video'}
					<span class="text-xs font-bold text-gold">ACTIVE</span>
				{/if}
			</button>
		</div>

		{#if isLoading}
			<div class="flex justify-center py-2">
				<div
					class="h-5 w-5 animate-spin rounded-full border-2 border-royal/30 border-t-royal"
				></div>
			</div>
		{/if}

		{#if message}
			<div class="rounded-xl border border-electric/30 bg-electric/20 p-3">
				<p class="text-center text-sm text-electric">{message}</p>
			</div>
		{/if}
	</div>
{/if}
