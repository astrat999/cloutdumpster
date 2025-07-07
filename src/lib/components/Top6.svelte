<script lang="ts">
	import { userProfile, user } from '$lib/stores';
	import { db } from '$lib/firebase';
	import { doc, updateDoc, collection, query, where, getDocs, limit } from 'firebase/firestore';
	import { onMount } from 'svelte';

	export let isOwnProfile: boolean = false;
	export let profileUserId: string;

	// Use profileUserId for component identification
	$: componentId = `top6-${profileUserId}`;
	
	let top6Users: any[] = [];
	let showAddModal = false;
	let searchQuery = '';
	let searchResults: any[] = [];
	let loading = false;

	// Load Top 6 users data
	async function loadTop6() {
		if (!$userProfile?.top6) return;

		try {
			const users = [];
			for (const uid of $userProfile.top6) {
				const userQuery = query(collection(db, 'users'), where('uid', '==', uid), limit(1));
				const snapshot = await getDocs(userQuery);
				if (!snapshot.empty) {
					users.push({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() });
				}
			}
			top6Users = users;
		} catch (error) {
			console.error('Error loading Top 6:', error);
		}
	}

	// Search for users to add
	async function searchUsers() {
		if (!searchQuery.trim()) {
			searchResults = [];
			return;
		}

		loading = true;
		try {
			const q = query(
				collection(db, 'users'),
				where('username', '>=', searchQuery),
				where('username', '<=', searchQuery + '\uf8ff'),
				limit(10)
			);
			const snapshot = await getDocs(q);
			const currentUserId = $user?.uid;
			searchResults = snapshot.docs
				.map((doc) => ({ id: doc.id, ...(doc.data() as any) }))
				.filter((user: any) => user.uid !== currentUserId); // Don't show self
		} catch (error) {
			console.error('Error searching users:', error);
		} finally {
			loading = false;
		}
	}

	// Add user to Top 6
	async function addToTop6(userToAdd: any) {
		if (!$userProfile || !$user) return;

		const currentTop6 = $userProfile.top6 || [];
		if (currentTop6.length >= 6) {
			alert('Your Inner Circle is full. Remove someone first.');
			return;
		}

		if (currentTop6.includes(userToAdd.uid)) {
			alert("They're already in your Inner Circle.");
			return;
		}

		try {
			const newTop6 = [...currentTop6, userToAdd.uid];
			const userRef = doc(db, 'users', $user.uid);
			await updateDoc(userRef, { top6: newTop6 });

			// Update local store
			$userProfile.top6 = newTop6;
			userProfile.set($userProfile);

			showAddModal = false;
			searchQuery = '';
			searchResults = [];
			loadTop6();
		} catch (error) {
			console.error('Error adding to Top 6:', error);
		}
	}

	// Remove user from Top 6
	async function removeFromTop6(uid: string) {
		if (!$userProfile || !$user) return;

		try {
			const newTop6 = ($userProfile.top6 || []).filter((id) => id !== uid);
			const userRef = doc(db, 'users', $user.uid);
			await updateDoc(userRef, { top6: newTop6 });

			// Update local store
			$userProfile.top6 = newTop6;
			userProfile.set($userProfile);

			loadTop6();
		} catch (error) {
			console.error('Error removing from Top 6:', error);
		}
	}

	onMount(loadTop6);

	$: if (searchQuery) {
		searchUsers();
	}
</script>

<div class="rounded-2xl border border-royal/20 bg-silk/30 p-6">
	<div class="mb-6 flex items-center justify-between">
		<h3 class="font-display text-2xl font-bold text-white">Inner Circle</h3>
		{#if isOwnProfile}
			<button
				aria-label="Add to Inner Circle"
				class="text-royal transition-colors hover:text-purple-400"
				on:click={() => (showAddModal = true)}
			>
				<svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M12 6v6m0 0v6m0-6h6m-6 0H6"
					></path>
				</svg>
			</button>
		{/if}
	</div>

	<!-- Top 6 Grid -->
	<div class="grid grid-cols-3 gap-4">
		{#each Array(6) as _, index}
			<div
				class="group relative flex aspect-square items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-gray-600 bg-velvet/50"
			>
				{#if top6Users[index]}
					<!-- User Slot Filled -->
					<a href="/profile/{top6Users[index].uid}" class="block h-full w-full">
						<div
							class="relative flex h-full w-full items-center justify-center overflow-hidden bg-gradient-to-br from-royal to-purple-700"
						>
							{#if top6Users[index].primaryDisplay === 'video' && top6Users[index].videoURL}
								<video
									src={top6Users[index].videoURL}
									autoplay
									muted
									loop
									playsinline
									class="h-full w-full object-cover"
								></video>
							{:else if top6Users[index].primaryDisplay === 'photo' && top6Users[index].photoURL}
								<img
									src={top6Users[index].photoURL}
									alt={top6Users[index].username}
									class="h-full w-full object-cover"
								/>
							{:else if top6Users[index].videoURL}
								<video
									src={top6Users[index].videoURL}
									autoplay
									muted
									loop
									playsinline
									class="h-full w-full object-cover"
								></video>
							{:else if top6Users[index].photoURL}
								<img
									src={top6Users[index].photoURL}
									alt={top6Users[index].username}
									class="h-full w-full object-cover"
								/>
							{:else}
								<span class="text-lg font-bold text-white">
									{top6Users[index].username?.charAt(0).toUpperCase()}
								</span>
							{/if}
							<div
								class="absolute inset-0 flex items-end justify-center bg-black/0 pb-2 transition-colors group-hover:bg-black/30"
							>
								<span
									class="text-xs font-semibold text-white opacity-0 transition-opacity group-hover:opacity-100"
								>
									{top6Users[index].username}
								</span>
							</div>
						</div>
					</a>

					{#if isOwnProfile}
						<button
							aria-label="Remove from Inner Circle"
							class="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 opacity-0 transition-opacity group-hover:opacity-100"
							on:click={() => removeFromTop6(top6Users[index].uid)}
						>
							<svg class="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M6 18L18 6M6 6l12 12"
								></path>
							</svg>
						</button>
					{/if}
				{:else}
					<!-- Empty Slot -->
					{#if isOwnProfile}
						<button
							aria-label="Add to Inner Circle"
							class="flex h-full w-full items-center justify-center text-gray-500 transition-colors hover:text-royal"
							on:click={() => (showAddModal = true)}
						>
							<svg class="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M12 6v6m0 0v6m0-6h6m-6 0H6"
								></path>
							</svg>
						</button>
					{:else}
						<div class="flex h-full w-full items-center justify-center text-gray-600">
							<svg class="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
								></path>
							</svg>
						</div>
					{/if}
				{/if}
			</div>
		{/each}
	</div>
</div>

<!-- Add Modal -->
{#if showAddModal}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
		<div class="w-full max-w-md rounded-2xl bg-silk p-6">
			<div class="mb-4 flex items-center justify-between">
				<h3 class="font-display text-xl font-bold text-white">Add to Inner Circle</h3>
				<button
					aria-label="Close modal"
					class="text-gray-400 hover:text-white"
					on:click={() => {
						showAddModal = false;
						searchQuery = '';
						searchResults = [];
					}}
				>
					<svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M6 18L18 6M6 6l12 12"
						></path>
					</svg>
				</button>
			</div>

			<input
				type="text"
				placeholder="Search users..."
				class="mb-4 w-full rounded-xl border border-gray-600 bg-velvet/50 px-4 py-3 text-white placeholder-gray-400 focus:border-royal focus:outline-none"
				bind:value={searchQuery}
			/>

			{#if loading}
				<div class="flex justify-center py-8">
					<div
						class="h-8 w-8 animate-spin rounded-full border-2 border-royal/30 border-t-royal"
					></div>
				</div>
			{:else if searchResults.length > 0}
				<div class="max-h-64 space-y-2 overflow-y-auto">
					{#each searchResults as result}
						<button
							class="flex w-full items-center space-x-3 rounded-lg bg-velvet/50 p-3 transition-colors hover:bg-velvet"
							on:click={() => addToTop6(result)}
						>
							<div
								class="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-gradient-to-r from-royal to-purple-600"
							>
								{#if result.primaryDisplay === 'video' && result.videoURL}
									<video
										src={result.videoURL}
										muted
										loop
										autoplay
										class="h-full w-full object-cover"
									></video>
								{:else if result.primaryDisplay === 'photo' && result.photoURL}
									<img
										src={result.photoURL}
										alt={result.username}
										class="h-full w-full object-cover"
									/>
								{:else if result.videoURL}
									<video
										src={result.videoURL}
										muted
										loop
										autoplay
										class="h-full w-full object-cover"
									></video>
								{:else if result.photoURL}
									<img
										src={result.photoURL}
										alt={result.username}
										class="h-full w-full object-cover"
									/>
								{:else}
									<span class="font-semibold text-white"
										>{result.username?.charAt(0).toUpperCase()}</span
									>
								{/if}
							</div>
							<div class="flex-1 text-left">
								<p class="font-semibold text-white">{result.username}</p>
								<p class="text-sm text-gray-400">Clout: {result.cloutScore}</p>
							</div>
						</button>
					{/each}
				</div>
			{:else if searchQuery}
				<p class="py-8 text-center text-gray-400">No users found</p>
			{/if}
		</div>
	</div>
{/if}
