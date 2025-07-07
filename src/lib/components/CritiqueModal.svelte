<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { user, userProfile } from '$lib/stores';
	import { db } from '$lib/firebase';
	import {
		collection,
		addDoc,
		serverTimestamp,
		doc,
		updateDoc,
		increment
	} from 'firebase/firestore';

	export let targetUserId: string;
	export let targetUsername: string;
	export let isOpen = false;

	const dispatch = createEventDispatcher();

	let currentCritiqueIndex = 0;
	let isSubmitting = false;
	let showSuccess = false;

	// Psychologically crafted critique categories with devastating precision
	const critiqueCategories = [
		{
			name: 'Identity Crisis',
			critiques: [
				"This screams 'trying too hard' louder than a desperate Instagram influencer.",
				"Your aesthetic is giving 'peaked in high school' energy.",
				'The gap between who you think you are and who you actually are is... visible.',
				"This has strong 'main character syndrome' but supporting cast execution.",
				"Your whole vibe is 'cosplaying confidence' and it shows."
			]
		},
		{
			name: 'Digital Delusion',
			critiques: [
				'The internet has convinced you that this passes for personality.',
				'Your digital persona is a masterclass in mediocrity.',
				'This is what happens when social media raises your children.',
				"You're performing authenticity, and the audience isn't buying it.",
				'Your online presence has all the depth of a puddle after rain.'
			]
		},
		{
			name: 'Aesthetic Autopsy',
			critiques: [
				'Your style choices suggest you shop exclusively in the clearance section of trends.',
				'This look aged worse than milk left in a hot car.',
				"You're serving 'trying to be edgy but settling for cringe' realness.",
				'Your aesthetic is what happens when Pinterest goes wrong.',
				'This outfit has the same energy as a participation trophy.'
			]
		},
		{
			name: 'Reality Check',
			critiques: [
				'The confidence is admirable, the execution is... concerning.',
				"This energy is giving 'peaked too early' syndrome.",
				'Your self-awareness meter seems to be permanently broken.',
				'The audacity to post this is almost inspirational. Almost.',
				'This is a perfect example of why self-reflection matters.'
			]
		},
		{
			name: 'Social Hierarchy',
			critiques: [
				"This screams 'desperate for validation' in seventeen different languages.",
				'Your status anxiety is showing through every pixel.',
				'This is what happens when you confuse being noticed with being relevant.',
				"You're trying so hard to be memorable that you've become forgettable.",
				'The try-hard energy is suffocating the actual potential.'
			]
		}
	];

	// Flatten all critiques into a single array for the carousel
	let allCritiques: string[] = [];
	critiqueCategories.forEach((category) => {
		allCritiques = [...allCritiques, ...category.critiques];
	});

	// Shuffle the critiques for variety
	function shuffleArray(array: any[]) {
		const shuffled = [...array];
		for (let i = shuffled.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
		}
		return shuffled;
	}

	$: shuffledCritiques = shuffleArray(allCritiques);

	// Navigation functions
	function nextCritique() {
		currentCritiqueIndex = (currentCritiqueIndex + 1) % shuffledCritiques.length;
	}

	function previousCritique() {
		currentCritiqueIndex =
			currentCritiqueIndex === 0 ? shuffledCritiques.length - 1 : currentCritiqueIndex - 1;
	}

	// Submit the selected critique
	async function submitCritique() {
		if (!$user?.uid || !$userProfile || isSubmitting) return;

		// Check if user has enough CloutCoin
		if (($userProfile.cloutCoin || 0) < 10) {
			alert('Insufficient CloutCoin. You need 10 CloutCoin to submit a critique.');
			return;
		}

		isSubmitting = true;

		try {
			const selectedCritique = shuffledCritiques[currentCritiqueIndex];

			// Add the critique to the whispers collection
			await addDoc(collection(db, 'whispers'), {
				targetUserId: targetUserId,
				criticText: selectedCritique,
				submittedBy: $user.uid,
				submitterUsername: $userProfile.username,
				createdAt: serverTimestamp(),
				isAnonymous: false, // We're making it non-anonymous for direct paranoia
				cost: 10
			});

			// Deduct CloutCoin from the user
			const userRef = doc(db, 'users', $user.uid);
			await updateDoc(userRef, {
				cloutCoin: increment(-10)
			});

			// Update local store
			userProfile.update((profile) => {
				if (!profile) return profile;
				return {
					...profile,
					cloutCoin: (profile.cloutCoin || 0) - 10
				};
			});

			// TODO: Send push notification to target user
			// This would trigger a Cloud Function to send: "@username has left a new Critique on your profile."

			showSuccess = true;
			setTimeout(() => {
				showSuccess = false;
				closeModal();
			}, 2000);
		} catch (error) {
			console.error('Error submitting critique:', error);
			alert('Failed to submit critique. Please try again.');
		} finally {
			isSubmitting = false;
		}
	}

	function closeModal() {
		isOpen = false;
		currentCritiqueIndex = 0;
		dispatch('close');
	}

	// Keyboard navigation
	function handleKeydown(event: KeyboardEvent) {
		if (!isOpen) return;

		switch (event.key) {
			case 'Escape':
				closeModal();
				break;
			case 'ArrowLeft':
				previousCritique();
				break;
			case 'ArrowRight':
				nextCritique();
				break;
			case 'Enter':
				if (!isSubmitting) {
					submitCritique();
				}
				break;
		}
	}
</script>

<svelte:window on:keydown={handleKeydown} />

{#if isOpen}
	<!-- Neural Critique Modal Overlay -->
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
		<div class="relative w-full max-w-2xl">
			<!-- Success State -->
			{#if showSuccess}
				<div
					class="animate-in zoom-in rounded-3xl border border-cyber-green/30 bg-black/90 p-12 text-center backdrop-blur-lg duration-300"
				>
					<div
						class="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-cyber-green/40 bg-cyber-green/20"
					>
						<span class="text-4xl">🗲</span>
					</div>
					<h3 class="mb-4 font-display text-2xl font-bold text-cyber-green">Critique Deployed</h3>
					<p class="font-mono text-gray-300">Neural strike successful. Target notified.</p>
				</div>
			{:else}
				<!-- Main Critique Interface -->
				<div
					class="relative overflow-hidden rounded-3xl border border-white/10 bg-black/90 backdrop-blur-lg"
				>
					<!-- Neural header -->
					<div class="relative overflow-hidden border-b border-white/10 p-8">
						<!-- Animated background -->
						<div class="absolute inset-0 opacity-5">
							<div class="data-flow absolute top-0 h-full w-1 bg-neon-pink"></div>
							<div
								class="data-flow absolute top-0 h-full w-1 bg-electric"
								style="animation-delay: 1s;"
							></div>
						</div>

						<div class="relative z-10">
							<h2
								class="mb-2 bg-gradient-to-r from-neon-pink to-electric bg-clip-text font-display text-3xl font-black text-transparent"
							>
								Neural Critique Interface
							</h2>
							<p class="font-mono text-gray-400">
								Target: <span class="font-bold text-white">@{targetUsername}</span>
							</p>
						</div>

						<!-- Close button -->
						<button
							on:click={closeModal}
							class="absolute right-6 top-6 flex h-10 w-10 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-gray-400 transition-all hover:bg-white/20 hover:text-white"
						>
							✕
						</button>
					</div>

					<!-- Critique Carousel -->
					<div class="p-8">
						<div class="mb-8">
							<div
								class="relative flex min-h-[200px] items-center justify-center rounded-2xl border border-neon-pink/20 bg-void/80 p-8"
							>
								<!-- Navigation arrows -->
								<button
									on:click={previousCritique}
									class="absolute left-4 flex h-12 w-12 items-center justify-center rounded-full border border-neon-pink/30 bg-neon-pink/20 text-neon-pink transition-all hover:bg-neon-pink/30"
								>
									←
								</button>

								<!-- Critique text -->
								<div class="max-w-md px-16 text-center">
									<p class="font-mono text-lg leading-relaxed text-white">
										"{shuffledCritiques[currentCritiqueIndex]}"
									</p>
								</div>

								<button
									on:click={nextCritique}
									class="absolute right-4 flex h-12 w-12 items-center justify-center rounded-full border border-neon-pink/30 bg-neon-pink/20 text-neon-pink transition-all hover:bg-neon-pink/30"
								>
									→
								</button>
							</div>

							<!-- Critique counter -->
							<div class="mt-4 text-center">
								<p class="font-mono text-sm text-gray-500">
									{currentCritiqueIndex + 1} / {shuffledCritiques.length}
								</p>
							</div>
						</div>

						<!-- Cost and submit section -->
						<div class="space-y-6">
							<!-- Cost display -->
							<div
								class="flex items-center justify-center space-x-4 rounded-2xl border border-gold/20 bg-gold/10 p-6"
							>
								<div
									class="flex h-12 w-12 items-center justify-center rounded-full border border-gold/30 bg-gold/20"
								>
									<span class="text-2xl">💰</span>
								</div>
								<div>
									<p class="text-lg font-bold text-gold">Cost: 10 CloutCoin™</p>
									<p class="font-mono text-sm text-gray-400">
										Your balance: {$userProfile?.cloutCoin || 0}
									</p>
								</div>
							</div>

							<!-- Submit button -->
							<button
								on:click={submitCritique}
								disabled={isSubmitting || ($userProfile?.cloutCoin || 0) < 10}
								class="group relative w-full overflow-hidden rounded-2xl bg-gradient-to-r from-neon-pink to-electric py-4 font-black text-black transition-all duration-300 hover:scale-105 disabled:cursor-not-allowed disabled:opacity-50"
							>
								<span class="relative z-10 flex items-center justify-center space-x-3">
									{#if isSubmitting}
										<div
											class="h-5 w-5 animate-spin rounded-full border-2 border-black/30 border-t-black"
										></div>
									{:else}
										<span>🗲</span>
									{/if}
									<span>{isSubmitting ? 'DEPLOYING CRITIQUE...' : 'DEPLOY NEURAL STRIKE'}</span>
								</span>
								<div
									class="absolute inset-0 bg-gradient-to-r from-electric to-neon-pink opacity-0 transition-opacity group-hover:opacity-100"
								></div>
							</button>

							<!-- Warning message -->
							<div class="text-center">
								<p class="font-mono text-xs text-gray-500">
									⚠️ Target will be notified of your critique. Choose wisely.
								</p>
							</div>
						</div>
					</div>
				</div>
			{/if}
		</div>
	</div>
{/if}
