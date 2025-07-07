<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { db } from '$lib/firebase';
	import { user, userProfile } from '$lib/stores';
	import {
		collection,
		query,
		orderBy,
		limit,
		getDocs,
		doc,
		updateDoc,
		increment,
		startAfter,
		where,
		setDoc,
		serverTimestamp
	} from 'firebase/firestore';
	import { goto } from '$app/navigation';

	interface HotUser {
		id: string;
		username: string;
		photoURL: string;
		thumbnailURL?: string;
		cloutScore: number;
		votes?: number;
	}

	let users: HotUser[] = [];
	let currentIndex = 0;
	let loading = true;
	let voting = false;
	let lastDoc: any = null;
	let hasMore = true;
	let intersectionObserver: IntersectionObserver | null = null;

	$: currentUser = users[currentIndex];

	onMount(async () => {
		if (!$user) {
			goto('/');
			return;
		}
		await loadUsers();
		setupInfiniteScroll();
		setupKeyboardNavigation();
	});

	onDestroy(() => {
		if (intersectionObserver) {
			intersectionObserver.disconnect();
		}
	});

	// BEGIN user loading with pagination
	async function loadUsers(loadMore = false) {
		if (loading && loadMore) return;

		loading = true;
		try {
			let usersQuery = query(
				collection(db, 'users'),
				where('uid', '!=', $user?.uid || ''), // Exclude current user
				orderBy('uid'), // Required for != queries
				orderBy('cloutScore', 'desc'),
				limit(10)
			);

			if (loadMore && lastDoc) {
				usersQuery = query(usersQuery, startAfter(lastDoc));
			}

			const snapshot = await getDocs(usersQuery);

			if (snapshot.empty) {
				hasMore = false;
				return;
			}

			const newUsers = snapshot.docs.map((doc) => ({
				id: doc.id,
				...doc.data()
			})) as HotUser[];

			if (loadMore) {
				users = [...users, ...newUsers];
			} else {
				users = newUsers;
				currentIndex = 0;
			}

			lastDoc = snapshot.docs[snapshot.docs.length - 1];
			hasMore = snapshot.docs.length === 10;
		} catch (error) {
			console.error('Error loading users:', error);
		} finally {
			loading = false;
		}
	}
	// END user loading

	// BEGIN infinite scroll setup
	function setupInfiniteScroll() {
		intersectionObserver = new IntersectionObserver(
			(entries) => {
				entries.forEach((entry) => {
					if (entry.isIntersecting && hasMore && !loading) {
						loadUsers(true);
					}
				});
			},
			{ threshold: 0.1 }
		);
	}

	function setupKeyboardNavigation() {
		function handleKeyPress(event: KeyboardEvent) {
			if (event.code === 'ArrowUp' || event.code === 'KeyW') {
				event.preventDefault();
				vote(1); // Hot
			} else if (event.code === 'ArrowDown' || event.code === 'KeyS') {
				event.preventDefault();
				vote(-1); // Not
			}
		}

		window.addEventListener('keydown', handleKeyPress);

		return () => {
			window.removeEventListener('keydown', handleKeyPress);
		};
	}
	// END infinite scroll

	// BEGIN voting system
	async function vote(type: number) {
		if (voting || !currentUser || !$user) return;

		voting = true;

		try {
			// Record the vote
			await updateDoc(doc(db, 'users', currentUser.id), {
				cloutScore: increment(type * 10), // Each vote is worth 10 points
				votes: increment(1)
			});

			// Add vote record for tracking
			await setDoc(doc(db, 'votes'), {
				voterId: $user.uid,
				targetId: currentUser.id,
				targetUsername: currentUser.username,
				type: type === 1 ? 'hot' : 'not',
				createdAt: serverTimestamp()
			});

			// Move to next user
			nextUser();
		} catch (error) {
			console.error('Voting failed:', error);
		} finally {
			voting = false;
		}
	}

	function nextUser() {
		if (currentIndex < users.length - 1) {
			currentIndex++;
		} else if (hasMore && !loading) {
			// Load more users if we've reached the end
			loadUsers(true).then(() => {
				currentIndex++;
			});
		} else {
			// No more users, loop back to start
			currentIndex = 0;
		}
	}
	// END voting system

	function goToProfile(userId: string) {
		goto(`/profile/${userId}`);
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'ArrowUp' || event.key === 'w' || event.key === 'W') {
			event.preventDefault();
			vote(1); // Hot
		} else if (event.key === 'ArrowDown' || event.key === 's' || event.key === 'S') {
			event.preventDefault();
			vote(-1); // Not
		}
	}
</script>

// VERTICAL HOT/NOT FEED: infinite scroll list of user avatars, full-height card, 👍 👎 vote
buttons, Firestore pagination with startAfter + limit
<svelte:window on:keydown={handleKeydown} />

<div class="flex min-h-screen flex-col items-center justify-center bg-black p-4">
	{#if loading}
		<div class="text-center">
			<div
				class="mb-4 h-8 w-8 animate-spin rounded-full border-2 border-accent/30 border-t-accent"
			></div>
			<p class="text-white">Loading hot people...</p>
		</div>
	{:else if currentUser}
		<!-- Hot/Not Interface -->
		<div class="mx-auto w-full max-w-sm">
			<!-- User Card -->
			<div class="group relative mb-8">
				<div class="relative aspect-[3/4] overflow-hidden rounded-3xl bg-gray-900">
					{#if currentUser.photoURL}
						<img
							src={currentUser.photoURL}
							alt={currentUser.username}
							class="h-full w-full object-cover"
						/>
					{:else}
						<div
							class="flex h-full w-full items-center justify-center bg-gradient-to-br from-accent to-purple-600"
						>
							<span class="text-6xl font-bold text-white">
								{currentUser.username?.charAt(0).toUpperCase()}
							</span>
						</div>
					{/if}

					<!-- Overlay gradient -->
					<div
						class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"
					></div>

					<!-- User info overlay -->
					<div class="absolute bottom-6 left-6 right-6">
						<h3 class="mb-1 text-2xl font-bold text-white">@{currentUser.username}</h3>
						<div class="flex items-center space-x-2">
							<span class="font-bold text-accent">{currentUser.cloutScore}</span>
							<span class="text-sm text-gray-300">clout</span>
						</div>
					</div>

					<!-- Vote buttons overlay -->
					<div
						class="absolute inset-0 flex items-end justify-center pb-8 opacity-0 transition-opacity group-hover:opacity-100"
					>
						<div class="flex space-x-6">
							<button
								on:click={() => vote(-1)}
								disabled={voting}
								class="flex h-16 w-16 items-center justify-center rounded-full bg-red-500/80 text-2xl backdrop-blur-sm transition-colors hover:bg-red-500 disabled:opacity-50"
							>
								👎
							</button>
							<button
								on:click={() => vote(1)}
								disabled={voting}
								class="flex h-16 w-16 items-center justify-center rounded-full bg-green-500/80 text-2xl backdrop-blur-sm transition-colors hover:bg-green-500 disabled:opacity-50"
							>
								👍
							</button>
						</div>
					</div>
				</div>
			</div>

			<!-- Vote buttons (always visible on mobile) -->
			<div class="mb-8 flex space-x-4 md:hidden">
				<button
					on:click={() => vote(-1)}
					disabled={voting}
					class="flex flex-1 items-center justify-center space-x-2 rounded-2xl bg-red-500 py-4 font-bold text-white transition-colors hover:bg-red-600 disabled:opacity-50"
				>
					<span class="text-2xl">👎</span>
					<span>Not Hot</span>
				</button>
				<button
					on:click={() => vote(1)}
					disabled={voting}
					class="flex flex-1 items-center justify-center space-x-2 rounded-2xl bg-green-500 py-4 font-bold text-white transition-colors hover:bg-green-600 disabled:opacity-50"
				>
					<span class="text-2xl">👍</span>
					<span>Hot</span>
				</button>
			</div>

			<!-- Instructions -->
			<div class="text-center text-sm text-gray-400">
				<p class="mb-2">Use arrow keys or tap buttons to vote</p>
				<p class="text-xs">
					{currentIndex + 1} of {users.length} •
					<span class="text-accent">{users.length - currentIndex - 1}</span> remaining
				</p>
			</div>
		</div>
	{:else}
		<!-- Empty state -->
		<div class="text-center">
			<div class="mb-4 text-6xl">🔥</div>
			<h3 class="mb-2 text-xl font-bold text-white">No more people to rate!</h3>
			<p class="mb-6 text-gray-400">Check back later for fresh faces</p>
			<button on:click={() => goto('/feed')} class="btn-primary"> Go to Feed </button>
		</div>
	{/if}
</div>
