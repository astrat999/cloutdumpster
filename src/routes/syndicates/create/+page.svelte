<script lang="ts">
	import { db } from '$lib/firebase';
	import { user, userProfile } from '$lib/stores';
	import {
		collection,
		addDoc,
		doc,
		updateDoc,
		query,
		where,
		getDocs,
		serverTimestamp
	} from 'firebase/firestore';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import Header from '$lib/components/Header.svelte';

	let name = '';
	let tag = '';
	let description = '';
	let isLoading = false;
	let error = '';
	let success = false;

	const CREATION_FEE = 1000; // CloutCoin™ required to create a Syndicate

	onMount(() => {
		if (!$user) {
			goto('/');
		}
	});

	// Validate tag format (3-4 uppercase letters)
	function validateTag(value: string): boolean {
		return /^[A-Z]{3,4}$/.test(value);
	}

	// Check if syndicate name or tag already exists
	async function checkUniqueness(): Promise<boolean> {
		try {
			const nameQuery = query(collection(db, 'syndicates'), where('name', '==', name));
			const tagQuery = query(collection(db, 'syndicates'), where('tag', '==', tag.toUpperCase()));

			const [nameSnapshot, tagSnapshot] = await Promise.all([
				getDocs(nameQuery),
				getDocs(tagQuery)
			]);

			if (!nameSnapshot.empty) {
				error = 'Syndicate name already taken. Choose something more original.';
				return false;
			}

			if (!tagSnapshot.empty) {
				error = 'Tag already claimed. Your originality is lacking.';
				return false;
			}

			return true;
		} catch (e) {
			error = 'Failed to verify uniqueness. The server is judging you.';
			return false;
		}
	}

	async function createSyndicate() {
		if (!$user || !$userProfile) {
			error = 'You must be logged in to create a Syndicate.';
			return;
		}

		// Validation
		if (!name.trim() || !tag.trim() || !description.trim()) {
			error = 'All fields are required. Attention to detail matters.';
			return;
		}

		if (name.length < 3 || name.length > 50) {
			error = 'Syndicate name must be 3-50 characters long.';
			return;
		}

		if (!validateTag(tag)) {
			error = 'Tag must be 3-4 uppercase letters only (e.g., CD, CLOUT).';
			return;
		}

		if (description.length < 10 || description.length > 200) {
			error = 'Description must be 10-200 characters long.';
			return;
		}

		// Check if user has enough CloutCoin™
		if (($userProfile.cloutCoin || 0) < CREATION_FEE) {
			error = `Insufficient funds. You need ${CREATION_FEE} CloutCoin™ to create a Syndicate.`;
			return;
		}

		isLoading = true;
		error = '';

		try {
			// Check uniqueness
			if (!(await checkUniqueness())) {
				isLoading = false;
				return;
			}

			// Create the Syndicate
			const syndicateData = {
				name: name.trim(),
				tag: tag.toUpperCase(),
				leaderId: $user.uid,
				memberIds: [$user.uid], // Leader is the first member
				treasury: 0,
				description: description.trim(),
				createdAt: serverTimestamp()
			};

			const syndicateDoc = await addDoc(collection(db, 'syndicates'), syndicateData);

			// Deduct the creation fee from user's balance
			const userRef = doc(db, 'users', $user.uid);
			await updateDoc(userRef, {
				cloutCoin: ($userProfile.cloutCoin || 0) - CREATION_FEE
			});

			// Update local store
			$userProfile.cloutCoin = ($userProfile.cloutCoin || 0) - CREATION_FEE;
			userProfile.set($userProfile);

			success = true;

			// Redirect to the new Syndicate page after a delay
			setTimeout(() => {
				goto(`/syndicates/${syndicateDoc.id}`);
			}, 2000);
		} catch (e) {
			console.error('Syndicate creation failed:', e);
			error = 'Creation failed. The server rejected your power grab.';
		} finally {
			isLoading = false;
		}
	}

	// Auto-format tag as user types
	$: if (tag) {
		tag = tag
			.toUpperCase()
			.replace(/[^A-Z]/g, '')
			.slice(0, 4);
	}
</script>

<svelte:head>
	<title>Create Syndicate - CloutDumpster</title>
</svelte:head>

<Header />

<main class="min-h-screen bg-velvet pt-20 font-body">
	<div class="mx-auto max-w-4xl px-4 py-8">
		<!-- Header -->
		<div class="mb-12 text-center">
			<h1 class="mb-4 font-display text-6xl font-bold text-white">Create Your Syndicate</h1>
			<p class="mx-auto mb-6 max-w-2xl text-xl text-gray-400">
				Ascend from individual to <span class="font-semibold text-gold">Leader</span>. Build your
				empire, command loyalty, wield collective power.
			</p>

			<!-- Cost Display -->
			<div
				class="inline-flex items-center space-x-3 rounded-2xl border border-royal/30 bg-royal/20 px-8 py-4"
			>
				<span class="text-3xl">👑</span>
				<div>
					<div class="text-sm text-gray-300">Creation Fee</div>
					<div class="font-display text-2xl font-bold text-gold">
						{CREATION_FEE.toLocaleString()} CloutCoin™
					</div>
				</div>
			</div>

			{#if $userProfile}
				<div class="mt-4 text-center">
					<span class="text-gray-400">Your Balance: </span>
					<span
						class="font-display text-xl font-bold {($userProfile.cloutCoin || 0) >= CREATION_FEE
							? 'text-gold'
							: 'text-red-400'}"
					>
						{($userProfile.cloutCoin || 0).toLocaleString()} CloutCoin™
					</span>
				</div>
			{/if}
		</div>

		<!-- Success Message -->
		{#if success}
			<div class="mb-8 rounded-2xl border border-green-500/30 bg-green-500/20 p-8 text-center">
				<div class="mb-4 text-5xl">🏛️</div>
				<h2 class="mb-4 font-display text-3xl font-bold text-green-400">Syndicate Created!</h2>
				<p class="text-lg text-green-300">
					Your empire has been founded. Redirecting to your new domain...
				</p>
			</div>
		{:else}
			<!-- Creation Form -->
			<div class="rounded-2xl border border-royal/20 bg-silk/30 p-8">
				<div class="grid gap-8 md:grid-cols-2">
					<!-- Form Fields -->
					<div class="space-y-6">
						<div>
							<label class="mb-2 block font-semibold text-white">
								Syndicate Name
								<span class="text-red-400">*</span>
							</label>
							<input
								type="text"
								class="w-full rounded-xl border border-gray-600 bg-velvet/50 px-4 py-3 text-white placeholder-gray-400 transition-colors focus:border-royal focus:outline-none"
								placeholder="The Shadow Collective"
								bind:value={name}
								maxlength="50"
								disabled={isLoading || success}
							/>
							<div class="mt-1 text-xs text-gray-400">{name.length}/50 characters</div>
						</div>

						<div>
							<label class="mb-2 block font-semibold text-white">
								Tag (3-4 Letters)
								<span class="text-red-400">*</span>
							</label>
							<input
								type="text"
								class="w-full rounded-xl border border-gray-600 bg-velvet/50 px-4 py-3 font-mono text-lg text-white placeholder-gray-400 transition-colors focus:border-royal focus:outline-none"
								placeholder="TSC"
								bind:value={tag}
								maxlength="4"
								disabled={isLoading || success}
							/>
							<div class="mt-1 text-xs text-gray-400">
								Will appear as [{tag || 'TAG'}] next to member names
							</div>
						</div>

						<div>
							<label class="mb-2 block font-semibold text-white">
								Description
								<span class="text-red-400">*</span>
							</label>
							<textarea
								class="w-full resize-none rounded-xl border border-gray-600 bg-velvet/50 px-4 py-3 text-white placeholder-gray-400 transition-colors focus:border-royal focus:outline-none"
								placeholder="We control the narrative. We shape the meta. We are inevitable."
								rows="4"
								bind:value={description}
								maxlength="200"
								disabled={isLoading || success}
							></textarea>
							<div class="mt-1 text-xs text-gray-400">{description.length}/200 characters</div>
						</div>
					</div>

					<!-- Preview Card -->
					<div class="rounded-xl border border-royal/10 bg-velvet/50 p-6">
						<h3 class="mb-4 font-display text-xl font-bold text-white">Syndicate Preview</h3>

						<div class="rounded-xl border border-royal/20 bg-silk/30 p-4">
							<div class="mb-3 flex items-center space-x-3">
								<div
									class="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-royal to-purple-700"
								>
									<span class="text-sm font-bold text-white">{tag || '??'}</span>
								</div>
								<div>
									<h4 class="font-display text-lg font-bold text-white">
										{name || 'Syndicate Name'}
									</h4>
									<div class="text-sm text-gray-400">
										Founded by {$userProfile?.username || 'You'}
									</div>
								</div>
							</div>

							<p class="mb-4 text-sm text-gray-300">
								{description || 'Your syndicate description will appear here...'}
							</p>

							<div class="grid grid-cols-3 gap-2 text-center">
								<div>
									<div class="font-bold text-gold">1</div>
									<div class="text-xs text-gray-400">Members</div>
								</div>
								<div>
									<div class="font-bold text-electric">0</div>
									<div class="text-xs text-gray-400">Treasury</div>
								</div>
								<div>
									<div class="font-bold text-white">{$userProfile?.cloutScore || 0}</div>
									<div class="text-xs text-gray-400">Total Clout</div>
								</div>
							</div>
						</div>
					</div>
				</div>

				<!-- Error Display -->
				{#if error}
					<div class="mt-6 rounded-xl border border-red-500/30 bg-red-500/20 p-4">
						<p class="text-center text-red-400">{error}</p>
					</div>
				{/if}

				<!-- Submit Button -->
				<div class="mt-8 text-center">
					<button
						class="mx-auto flex items-center justify-center space-x-3 rounded-xl bg-gradient-to-r from-royal to-purple-600 px-12 py-4 font-bold text-white transition-all duration-200 hover:from-purple-600 hover:to-purple-700 disabled:opacity-50"
						on:click={createSyndicate}
						disabled={isLoading ||
							success ||
							!$userProfile ||
							($userProfile.cloutCoin || 0) < CREATION_FEE}
					>
						{#if isLoading}
							<div
								class="h-6 w-6 animate-spin rounded-full border-2 border-white/30 border-t-white"
							></div>
						{:else}
							<span class="text-2xl">👑</span>
						{/if}
						<span class="text-xl">Establish Syndicate</span>
						<span class="font-display text-gold">-{CREATION_FEE.toLocaleString()}</span>
					</button>

					{#if ($userProfile?.cloutCoin || 0) < CREATION_FEE}
						<p class="mt-4 text-sm text-gray-400">
							Insufficient funds. Visit the <a href="/store" class="text-gold hover:underline"
								>Store</a
							> to acquire more CloutCoin™.
						</p>
					{/if}
				</div>
			</div>
		{/if}
	</div>
</main>
