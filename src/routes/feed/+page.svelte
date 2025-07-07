<script lang="ts">
	import { onMount } from 'svelte';
	import { auth, db, storage } from '$lib/firebase';
	import { user, userProfile } from '$lib/stores';
	import {
		collection,
		addDoc,
		query,
		orderBy,
		limit,
		getDocs,
		serverTimestamp,
		Timestamp,
		updateDoc,
		doc,
		startAfter
	} from 'firebase/firestore';
	import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
	import { goto } from '$app/navigation';
	import Header from '$lib/components/Header.svelte';

	interface FeedPost {
		id: string;
		userId: string;
		imageURL?: string;
		videoURL?: string;
		caption?: string;
		createdAt: Timestamp;
		heatScore?: number;
		userName?: string;
		userPhotoURL?: string;
		postType: 'image' | 'video';
	}

	let feedPosts: FeedPost[] = [];
	let uploading = false;
	let uploadFile: File | null = null;
	let caption = '';
	let previewUrl = '';
	let currentTab: 'hot' | 'recent' = 'hot';
	let lastDoc: any = null;
	let loading = false;
	let hasMore = true;

	// Handle file selection
	function handleFileSelect(event: Event) {
		const target = event.target as HTMLInputElement;
		const file = target.files?.[0];

		if (file) {
			if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
				uploadFile = file;
				previewUrl = URL.createObjectURL(file);
			}
		}
	}

	// Upload content
	async function uploadToFeed() {
		if (!uploadFile || !$user?.uid || !$userProfile) {
			return;
		}

		uploading = true;
		try {
			const postType = uploadFile.type.startsWith('video/') ? 'video' : 'image';

			const feedData: any = {
				userId: $user.uid,
				userName: $userProfile.username || 'Anonymous',
				userPhotoURL: $userProfile.photoURL || '',
				caption: caption.trim() || '',
				createdAt: serverTimestamp(),
				heatScore: Math.floor(Math.random() * 50) + 10,
				postType: postType
			};

			const feedDocRef = await addDoc(collection(db, 'feed'), feedData);

			const contentRef = ref(storage, `feed/${feedDocRef.id}/${uploadFile.name}`);
			const snapshot = await uploadBytes(contentRef, uploadFile);
			const downloadURL = await getDownloadURL(snapshot.ref);

			const updateData =
				postType === 'video' ? { videoURL: downloadURL } : { imageURL: downloadURL };

			await updateDoc(feedDocRef, updateData);

			// Reset form
			uploadFile = null;
			caption = '';
			previewUrl = '';

			const fileInput = document.getElementById('file-input') as HTMLInputElement;
			if (fileInput) fileInput.value = '';

			loadFeed(true);
		} catch (error) {
			console.error('Error uploading:', error);
			alert('Upload failed. Try again.');
		} finally {
			uploading = false;
		}
	}

	// Load feed
	async function loadFeed(reset = false) {
		if (loading) return;

		loading = true;

		try {
			let q: any;

			if (currentTab === 'hot') {
				q = query(
					collection(db, 'feed'),
					orderBy('heatScore', 'desc'),
					orderBy('createdAt', 'desc'),
					limit(20)
				);
			} else {
				q = query(collection(db, 'feed'), orderBy('createdAt', 'desc'), limit(20));
			}

			if (!reset && lastDoc) {
				q = query(q, startAfter(lastDoc));
			}

			const snapshot = await getDocs(q);

			if (snapshot.empty) {
				hasMore = false;
				loading = false;
				return;
			}

			const newPosts = snapshot.docs.map((doc) => ({
				id: doc.id,
				...(doc.data() as any)
			})) as FeedPost[];

			if (reset) {
				feedPosts = newPosts;
			} else {
				feedPosts = [...feedPosts, ...newPosts];
			}

			lastDoc = snapshot.docs[snapshot.docs.length - 1];
			hasMore = snapshot.docs.length === 20;
		} catch (error) {
			console.error('Error loading feed:', error);
		} finally {
			loading = false;
		}
	}

	// Handle infinite scroll
	function handleScroll() {
		if (
			window.innerHeight + window.scrollY >= document.body.offsetHeight - 1000 &&
			hasMore &&
			!loading
		) {
			loadFeed();
		}
	}

	// Switch tabs
	function switchTab(tab: 'hot' | 'recent') {
		currentTab = tab;
		lastDoc = null;
		hasMore = true;
		loadFeed(true);
	}

	onMount(() => {
		if (!$user?.uid) {
			goto('/');
			return;
		}

		loadFeed(true);
		window.addEventListener('scroll', handleScroll);

		return () => {
			window.removeEventListener('scroll', handleScroll);
		};
	});

	$: if (currentTab && $user) {
		lastDoc = null;
		hasMore = true;
		loadFeed(true);
	}
</script>

<svelte:head>
	<title>Feed - CloutDumpster</title>
</svelte:head>

<Header />

<!-- Minimal Feed -->
<main class="min-h-screen bg-black pt-20">
	<div class="mx-auto max-w-2xl px-4 py-8">
		<!-- Feed Header -->
		<div class="mb-8 text-center">
			<h1 class="mb-4 text-4xl font-bold text-white">The Feed</h1>

			<!-- Tab Navigation -->
			<div class="mb-6 flex rounded-2xl bg-card p-1">
				<button
					class="flex-1 rounded-xl px-4 py-3 font-bold transition-all {currentTab === 'hot'
						? 'bg-accent text-black'
						: 'text-gray-400 hover:text-white'}"
					on:click={() => switchTab('hot')}
				>
					🔥 Hot
				</button>
				<button
					class="flex-1 rounded-xl px-4 py-3 font-bold transition-all {currentTab === 'recent'
						? 'bg-accent text-black'
						: 'text-gray-400 hover:text-white'}"
					on:click={() => switchTab('recent')}
				>
					⏰ Recent
				</button>
			</div>
		</div>

		<!-- Upload Section -->
		<div class="card mb-8">
			<h2 class="mb-4 text-xl font-bold text-white">Share Something</h2>

			{#if previewUrl}
				<div class="mb-4 overflow-hidden rounded-xl">
					{#if uploadFile?.type.startsWith('video/')}
						<video src={previewUrl} controls class="max-h-64 w-full object-cover" muted></video>
					{:else}
						<img src={previewUrl} alt="Preview" class="max-h-64 w-full object-cover" />
					{/if}
				</div>
			{/if}

			<div class="space-y-4">
				<textarea
					class="w-full"
					placeholder="What's the story?"
					rows="3"
					bind:value={caption}
					maxlength="280"
				></textarea>

				<input
					id="file-input"
					type="file"
					class="w-full"
					accept="image/*,video/*"
					on:change={handleFileSelect}
				/>

				<button
					class="btn-primary flex w-full items-center justify-center space-x-2"
					on:click={uploadToFeed}
					disabled={uploading || !uploadFile}
				>
					{#if uploading}
						<div
							class="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white"
						></div>
					{:else}
						<span>📸</span>
					{/if}
					<span>{uploading ? 'Posting...' : 'Post'}</span>
				</button>
			</div>
		</div>

		<!-- Feed Posts -->
		<div class="space-y-6">
			{#each feedPosts as post}
				<div class="card">
					<!-- Post Header -->
					<div class="mb-4 flex items-center space-x-3">
						<a href="/profile/{post.userId}" class="flex flex-1 items-center space-x-3">
							<div class="h-12 w-12 rounded-xl bg-accent p-0.5">
								<div
									class="flex h-full w-full items-center justify-center overflow-hidden rounded-xl bg-black"
								>
									{#if post.userPhotoURL}
										<img
											src={post.userPhotoURL}
											alt={post.userName}
											class="h-full w-full object-cover"
										/>
									{:else}
										<span class="font-bold text-white"
											>{post.userName?.charAt(0).toUpperCase()}</span
										>
									{/if}
								</div>
							</div>
							<div>
								<p class="font-bold text-white">@{post.userName}</p>
								<p class="text-sm text-gray-400">
									{post.createdAt?.toDate
										? new Date(post.createdAt.toDate()).toLocaleDateString()
										: 'Recent'}
								</p>
							</div>
						</a>

						{#if post.heatScore && post.heatScore > 25}
							<div class="rounded-full bg-accent px-3 py-1 text-sm font-bold text-black">
								🔥 {post.heatScore}
							</div>
						{/if}
					</div>

					<!-- Post Content -->
					<div class="mb-4">
						{#if post.postType === 'video' && post.videoURL}
							<video
								src={post.videoURL}
								controls
								muted
								class="aspect-video w-full rounded-xl object-cover"
								preload="metadata"
							></video>
						{:else if post.imageURL}
							<img
								src={post.imageURL}
								alt="Post"
								class="aspect-square w-full rounded-xl object-cover"
							/>
						{/if}
					</div>

					{#if post.caption}
						<p class="text-gray-300">{post.caption}</p>
					{/if}
				</div>
			{/each}
		</div>

		<!-- Loading -->
		{#if loading}
			<div class="flex justify-center py-8">
				<div
					class="h-8 w-8 animate-spin rounded-full border-2 border-accent/30 border-t-accent"
				></div>
			</div>
		{/if}

		<!-- End of feed -->
		{#if !hasMore && feedPosts.length > 0}
			<div class="py-8 text-center">
				<p class="text-gray-400">You've reached the bottom</p>
			</div>
		{/if}

		<!-- Empty state -->
		{#if !loading && feedPosts.length === 0}
			<div class="py-16 text-center">
				<div class="mb-4 text-6xl">📸</div>
				<h3 class="mb-2 text-xl font-bold text-white">Nothing here yet</h3>
				<p class="text-gray-400">Be the first to post!</p>
			</div>
		{/if}
	</div>
</main>
