<script lang="ts">
	import { db } from '$lib/firebase';
	import { collection, getDocs, query, orderBy } from 'firebase/firestore';
	import { onMount } from 'svelte';
	import type { Syndicate } from '$lib/stores';
	import Header from '$lib/components/Header.svelte';

	let syndicates: (Syndicate & { memberCount: number; leaderName?: string })[] = [];
	let loading = true;
	let sortBy: 'treasury' | 'members' | 'clout' = 'treasury';

	async function loadSyndicates() {
		loading = true;
		try {
			const syndicatesQuery = query(collection(db, 'syndicates'), orderBy('createdAt', 'desc'));
			const snapshot = await getDocs(syndicatesQuery);

			const syndicateData = await Promise.all(
				snapshot.docs.map(async (doc) => {
					const data = doc.data() as Omit<Syndicate, 'id'>;

					// Get leader info
					let leaderName = 'Unknown';
					try {
						const usersQuery = query(collection(db, 'users'), orderBy('uid'));
						const usersSnapshot = await getDocs(usersQuery);
						const leaderDoc = usersSnapshot.docs.find(
							(userDoc) => userDoc.data().uid === data.leaderId
						);
						if (leaderDoc) {
							leaderName = leaderDoc.data().username || 'Unknown';
						}
					} catch (e) {
						console.error('Error fetching leader name:', e);
					}

					// Calculate total clout score (placeholder for now)
					let totalCloutScore = 0;
					try {
						const usersQuery = query(collection(db, 'users'), orderBy('uid'));
						const usersSnapshot = await getDocs(usersQuery);

						const memberList = data.memberIds || data.members || [];
						for (const memberId of memberList) {
							const memberDoc = usersSnapshot.docs.find(
								(userDoc) => userDoc.data().uid === memberId
							);
							if (memberDoc) {
								totalCloutScore += memberDoc.data().cloutScore || 0;
							}
						}
					} catch (e) {
						console.error('Error calculating total clout:', e);
					}

					return {
						id: doc.id,
						...data,
						memberCount: (data.memberIds || data.members || []).length,
						totalCloutScore,
						leaderName
					} as Syndicate & { memberCount: number; leaderName: string };
				})
			);

			syndicates = syndicateData;
			sortSyndicates();
		} catch (error) {
			console.error('Error loading syndicates:', error);
		} finally {
			loading = false;
		}
	}

	function sortSyndicates() {
		syndicates = [...syndicates].sort((a, b) => {
			switch (sortBy) {
				case 'treasury':
					return b.treasury - a.treasury;
				case 'members':
					return b.memberCount - a.memberCount;
				case 'clout':
					return (b.totalCloutScore || 0) - (a.totalCloutScore || 0);
				default:
					return 0;
			}
		});
	}

	function getSyndicateRank(index: number): string {
		if (index === 0) return '👑';
		if (index === 1) return '🥈';
		if (index === 2) return '🥉';
		return `#${index + 1}`;
	}

	onMount(loadSyndicates);

	$: if (sortBy) {
		sortSyndicates();
	}
</script>

<svelte:head>
	<title>Syndicates - CloutDumpster</title>
</svelte:head>

<Header />

<main class="min-h-screen bg-velvet pt-20 font-body">
	<div class="mx-auto max-w-6xl px-4 py-8">
		<!-- Header -->
		<div class="mb-12 text-center">
			<h1 class="mb-4 font-display text-6xl font-bold text-white">The Syndicates</h1>
			<p class="mx-auto mb-8 max-w-3xl text-xl text-gray-400">
				Where individual ambition evolves into <span class="font-semibold text-gold"
					>collective power</span
				>. Join an empire, or build your own.
			</p>

			<!-- Create Syndicate CTA -->
			<div
				class="flex flex-col items-center justify-center space-y-4 sm:flex-row sm:space-x-6 sm:space-y-0"
			>
				<a
					href="/syndicates/create"
					class="flex items-center space-x-3 rounded-xl bg-gradient-to-r from-royal to-purple-600 px-8 py-4 font-bold text-white transition-all duration-200 hover:from-purple-600 hover:to-purple-700"
				>
					<span class="text-xl">👑</span>
					<span>Establish Syndicate</span>
				</a>

				<div class="text-sm text-gray-400">
					<span>Creation Fee: </span>
					<span class="font-bold text-gold">1,000 CloutCoin™</span>
				</div>
			</div>
		</div>

		<!-- Sort Controls -->
		<div class="mb-8 flex flex-wrap items-center justify-center gap-4">
			<span class="font-semibold text-white">Rank by:</span>

			<button
				class="rounded-lg px-4 py-2 font-medium transition-colors {sortBy === 'treasury'
					? 'bg-gold text-black'
					: 'bg-silk/30 text-gray-300 hover:text-white'}"
				on:click={() => (sortBy = 'treasury')}
			>
				💰 Treasury
			</button>

			<button
				class="rounded-lg px-4 py-2 font-medium transition-colors {sortBy === 'members'
					? 'bg-electric text-black'
					: 'bg-silk/30 text-gray-300 hover:text-white'}"
				on:click={() => (sortBy = 'members')}
			>
				👥 Members
			</button>

			<button
				class="rounded-lg px-4 py-2 font-medium transition-colors {sortBy === 'clout'
					? 'bg-royal text-white'
					: 'bg-silk/30 text-gray-300 hover:text-white'}"
				on:click={() => (sortBy = 'clout')}
			>
				⚡ Total Clout
			</button>
		</div>

		<!-- Loading State -->
		{#if loading}
			<div class="py-16 text-center">
				<div
					class="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-royal/30 border-t-royal"
				></div>
				<p class="text-gray-400">Loading the power structures...</p>
			</div>

			<!-- Empty State -->
		{:else if syndicates.length === 0}
			<div class="py-16 text-center">
				<div
					class="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-royal to-purple-600"
				>
					<span class="text-4xl">🏛️</span>
				</div>
				<h3 class="mb-4 font-display text-2xl font-bold text-white">No Syndicates Yet</h3>
				<p class="mb-6 text-gray-400">Be the first to establish a power structure.</p>
				<a
					href="/syndicates/create"
					class="inline-flex items-center space-x-2 rounded-xl bg-gradient-to-r from-royal to-purple-600 px-6 py-3 font-bold text-white transition-colors hover:from-purple-600 hover:to-purple-700"
				>
					<span>👑</span>
					<span>Create First Syndicate</span>
				</a>
			</div>

			<!-- Syndicates Grid -->
		{:else}
			<div class="grid gap-6">
				{#each syndicates as syndicate, index}
					<div
						class="group rounded-2xl border border-royal/20 bg-silk/30 p-6 transition-all duration-200 hover:border-royal/40"
					>
						<div class="flex items-start justify-between">
							<!-- Syndicate Info -->
							<div class="flex flex-1 items-start space-x-4">
								<!-- Rank & Logo -->
								<div class="flex flex-col items-center space-y-2">
									<div class="text-2xl">{getSyndicateRank(index)}</div>
									<div
										class="flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br from-royal to-purple-700 transition-transform group-hover:scale-105"
									>
										<span class="text-lg font-bold text-white">{syndicate.tag}</span>
									</div>
								</div>

								<!-- Details -->
								<div class="flex-1">
									<div class="mb-2 flex items-center space-x-3">
										<h3 class="font-display text-2xl font-bold text-white">{syndicate.name}</h3>
										<span class="text-sm text-gray-400">[{syndicate.tag}]</span>
									</div>

									<p class="mb-4 text-gray-300">{syndicate.description}</p>

									<div class="mb-4 flex items-center space-x-2 text-sm text-gray-400">
										<span>Led by</span>
										<span class="font-semibold text-white">{syndicate.leaderName}</span>
										<span>•</span>
										<span
											>Founded {syndicate.createdAt && typeof syndicate.createdAt === 'object' && 'toDate' in syndicate.createdAt
												? new Date(syndicate.createdAt.toDate()).toLocaleDateString()
												: syndicate.createdAt 
												? new Date(syndicate.createdAt).toLocaleDateString()
												: 'Recently'}</span
										>
									</div>
								</div>
							</div>

							<!-- Stats -->
							<div class="grid grid-cols-3 gap-6 text-center">
								<div>
									<div class="font-display text-2xl font-bold text-gold">
										{syndicate.treasury.toLocaleString()}
									</div>
									<div class="text-sm text-gray-400">Treasury</div>
								</div>
								<div>
									<div class="font-display text-2xl font-bold text-electric">
										{syndicate.memberCount}
									</div>
									<div class="text-sm text-gray-400">Members</div>
								</div>
								<div>
									<div class="font-display text-2xl font-bold text-white">
										{(syndicate.totalCloutScore || 0).toLocaleString()}
									</div>
									<div class="text-sm text-gray-400">Total Clout</div>
								</div>
							</div>
						</div>

						<!-- View Syndicate Button -->
						<div class="mt-6 text-right">
							<a
								href="/syndicates/{syndicate.id}"
								class="inline-flex items-center space-x-2 rounded-lg bg-gradient-to-r from-royal to-purple-600 px-6 py-2 font-semibold text-white transition-colors hover:from-purple-600 hover:to-purple-700"
							>
								<span>View Syndicate</span>
								<span>→</span>
							</a>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>
</main>
