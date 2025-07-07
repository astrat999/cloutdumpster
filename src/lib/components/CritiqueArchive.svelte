<script lang="ts">
	import { onMount } from 'svelte';
	import { db } from '$lib/firebase';
	import { collection, query, where, orderBy, getDocs, Timestamp } from 'firebase/firestore';
	import { createEventDispatcher } from 'svelte';

	export let userId: string;
	export let isOpen = false;

	const dispatch = createEventDispatcher();

	interface Critique {
		id: string;
		criticText: string;
		submittedBy: string;
		submitterUsername: string;
		createdAt: Timestamp;
		isAnonymous: boolean;
		cost: number;
	}

	let critiques: Critique[] = [];
	let loading = true;
	let mounted = false;

	onMount(() => {
		mounted = true;
		if (isOpen) {
			loadCritiques();
		}
	});

	$: if (isOpen && mounted) {
		loadCritiques();
	}

	async function loadCritiques() {
		loading = true;
		try {
			const q = query(
				collection(db, 'whispers'),
				where('targetUserId', '==', userId),
				orderBy('createdAt', 'desc')
			);

			const snapshot = await getDocs(q);
			critiques = snapshot.docs.map((doc) => ({
				id: doc.id,
				...(doc.data() as any)
			})) as Critique[];
		} catch (error) {
			console.error('Error loading critiques:', error);
		} finally {
			loading = false;
		}
	}

	function closeModal() {
		isOpen = false;
		dispatch('close');
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape' && isOpen) {
			closeModal();
		}
	}
</script>

<svelte:window on:keydown={handleKeydown} />

{#if isOpen}
	<!-- Neural Critique Archive Modal -->
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
		<div class="relative max-h-[90vh] w-full max-w-4xl overflow-hidden">
			<div class="overflow-hidden rounded-3xl border border-white/10 bg-black/90 backdrop-blur-lg">
				<!-- Archive Header -->
				<div class="relative overflow-hidden border-b border-white/10 p-8">
					<!-- Animated background -->
					<div class="absolute inset-0 opacity-5">
						<div class="data-flow absolute top-0 h-full w-1 bg-neon-pink"></div>
						<div
							class="data-flow absolute top-0 h-full w-1 bg-electric"
							style="animation-delay: 1s;"
						></div>
						<div
							class="data-flow absolute top-0 h-full w-1 bg-gold"
							style="animation-delay: 2s;"
						></div>
					</div>

					<div class="relative z-10">
						<h2
							class="mb-2 bg-gradient-to-r from-neon-pink via-electric to-gold bg-clip-text font-display text-3xl font-black text-transparent"
						>
							Neural Critique Archive
						</h2>
						<p class="font-mono text-gray-400">
							{critiques.length}
							{critiques.length === 1 ? 'critique' : 'critiques'} on file
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

				<!-- Critiques Content -->
				<div class="max-h-[60vh] overflow-y-auto p-8">
					{#if loading}
						<!-- Loading State -->
						<div class="flex items-center justify-center py-16">
							<div class="relative">
								<div
									class="h-12 w-12 animate-spin rounded-full border-2 border-electric/20 border-t-electric"
								></div>
								<div class="absolute inset-0 flex items-center justify-center">
									<div
										class="h-6 w-6 animate-spin rounded-full border-2 border-royal/20 border-t-royal"
									></div>
								</div>
							</div>
						</div>
					{:else if critiques.length === 0}
						<!-- Empty State -->
						<div class="py-16 text-center">
							<div
								class="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full border border-electric/20 bg-electric/10"
							>
								<span class="text-4xl opacity-50">🛡️</span>
							</div>
							<h3 class="mb-3 font-display text-2xl font-bold text-white">Archive Empty</h3>
							<p class="font-mono text-gray-400">
								No neural critiques detected. Your defenses hold strong.
							</p>
						</div>
					{:else}
						<!-- Critiques List -->
						<div class="space-y-6">
							{#each critiques as critique, index}
								<div
									class="group relative rounded-2xl border border-white/10 bg-void/50 p-6 backdrop-blur-sm transition-all hover:border-neon-pink/30"
								>
									<!-- Critique header -->
									<div class="mb-4 flex items-center justify-between">
										<div class="flex items-center space-x-3">
											<!-- Anonymous vs Known indicator -->
											<div
												class="flex h-8 w-8 items-center justify-center rounded-full border border-neon-pink/30 bg-neon-pink/20"
											>
												<span class="text-sm text-neon-pink">
													{critique.isAnonymous ? '👤' : '🎯'}
												</span>
											</div>
											<div>
												<p class="text-sm font-semibold text-white">
													{critique.isAnonymous
														? 'Anonymous Neural Source'
														: `@${critique.submitterUsername}`}
												</p>
												<p class="font-mono text-xs text-gray-500">
													{critique.createdAt?.toDate
														? new Date(critique.createdAt.toDate()).toLocaleString()
														: 'Recent'}
												</p>
											</div>
										</div>

										<!-- Cost indicator -->
										<div
											class="flex items-center space-x-2 rounded-lg border border-gold/20 bg-gold/10 px-3 py-1"
										>
											<span class="text-xs text-gold">💰</span>
											<span class="font-mono text-xs text-gold">{critique.cost}</span>
										</div>
									</div>

									<!-- Critique content -->
									<div class="relative">
										<blockquote class="font-mono text-sm italic leading-relaxed text-gray-200">
											"{critique.criticText}"
										</blockquote>
									</div>

									<!-- Neural activity indicator -->
									<div
										class="absolute right-2 top-2 h-2 w-2 animate-pulse rounded-full bg-neon-pink opacity-50"
									></div>

									<!-- Hover effect -->
									<div
										class="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-r from-neon-pink/5 to-electric/5 opacity-0 transition-opacity group-hover:opacity-100"
									></div>
								</div>
							{/each}
						</div>

						<!-- Archive Statistics -->
						<div
							class="mt-8 rounded-2xl border border-electric/20 bg-gradient-to-r from-electric/10 to-royal/10 p-6"
						>
							<h4 class="mb-3 font-display text-lg font-bold text-white">Neural Analysis</h4>
							<div class="grid grid-cols-1 gap-4 text-center md:grid-cols-3">
								<div>
									<p class="text-2xl font-black text-electric">{critiques.length}</p>
									<p class="font-mono text-sm text-electric/70">Total Strikes</p>
								</div>
								<div>
									<p class="text-2xl font-black text-royal">
										{critiques.filter((c) => !c.isAnonymous).length}
									</p>
									<p class="font-mono text-sm text-royal/70">Direct Hits</p>
								</div>
								<div>
									<p class="text-2xl font-black text-gold">
										{critiques.reduce((sum, c) => sum + (c.cost || 0), 0)}
									</p>
									<p class="font-mono text-sm text-gold/70">Coin Spent</p>
								</div>
							</div>
						</div>
					{/if}
				</div>
			</div>
		</div>
	</div>
{/if}
