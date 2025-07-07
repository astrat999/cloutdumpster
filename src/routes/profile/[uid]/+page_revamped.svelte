<script lang="ts">
	import type { PageData, ActionData } from './$types';
	import { user } from '$lib/stores';
	import { enhance } from '$app/forms';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { db, storage } from '$lib/firebase';
	import {
		doc,
		collection,
		query,
		orderBy,
		limit,
		getDocs,
		where,
		updateDoc
	} from 'firebase/firestore';
	import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

	export let data: PageData;
	export let form: ActionData;

	$: profile = data.profile;
	$: whispers = data.whispers as any[];
	$: isOwnProfile = $user && $user.uid === profile.uid;

	let recentVotes: any[] = [];
	let showPhotoUpload = false;
	let uploadingPhoto = false;
	let fileInput: HTMLInputElement;

	onMount(async () => {
		if (isOwnProfile) {
			await loadRecentVotes();
		}
	});

	async function loadRecentVotes() {
		if (!$user) return;

		try {
			const votesQuery = query(
				collection(db, 'votes'),
				where('voterId', '==', $user.uid),
				orderBy('createdAt', 'desc'),
				limit(5)
			);
			const snapshot = await getDocs(votesQuery);
			recentVotes = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
		} catch (error) {
			console.error('Error loading recent votes:', error);
		}
	}

	function openPhotoUpload() {
		fileInput.click();
	}

	async function handlePhotoUpload(event: Event) {
		const target = event.target as HTMLInputElement;
		const file = target.files?.[0];

		if (!file || !$user) return;

		uploadingPhoto = true;

		try {
			// Upload to Firebase Storage
			const avatarRef = ref(storage, `avatars/${$user.uid}/avatar.jpg`);
			await uploadBytes(avatarRef, file);
			const photoURL = await getDownloadURL(avatarRef);

			// Update user profile
			const userRef = doc(db, 'users', $user.uid);
			await updateDoc(userRef, { photoURL });

			// Update local profile data
			profile.photoURL = photoURL;
		} catch (error) {
			console.error('Photo upload failed:', error);
		} finally {
			uploadingPhoto = false;
		}
	}

	function formatTimeAgo(timestamp: any) {
		if (!timestamp) return '';
		const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
		const now = new Date();
		const diff = now.getTime() - date.getTime();
		const minutes = Math.floor(diff / (1000 * 60));
		const hours = Math.floor(diff / (1000 * 60 * 60));
		const days = Math.floor(diff / (1000 * 60 * 60 * 24));

		if (minutes < 1) return 'now';
		if (minutes < 60) return `${minutes}m`;
		if (hours < 24) return `${hours}h`;
		return `${days}d`;
	}
</script>

<svelte:head>
	<title>{profile.username} • CloutDumpster</title>
</svelte:head>

<!-- Hidden file input -->
<input
	bind:this={fileInput}
	type="file"
	accept="image/*"
	on:change={handlePhotoUpload}
	class="hidden"
/>

<main class="min-h-screen bg-black text-white">
	<!-- Hero Section: Giant Avatar + Stats -->
	<section class="relative flex h-screen flex-col items-center justify-center px-4">
		<!-- Background blur effect -->
		<div class="absolute inset-0 z-0">
			{#if profile.photoURL || profile.thumbnailURL}
				<img
					src={profile.thumbnailURL || profile.photoURL}
					alt=""
					class="h-full w-full object-cover opacity-20 blur-3xl"
				/>
			{/if}
			<div class="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black"></div>
		</div>

		<!-- Main content -->
		<div class="relative z-10 mx-auto max-w-sm text-center">
			<!-- Giant Avatar -->
			<div class="relative mb-8">
				<div
					class="mx-auto h-80 w-80 overflow-hidden rounded-full border-4 border-white/10 bg-gray-800"
				>
					{#if profile.photoURL || profile.thumbnailURL}
						<img
							src={profile.thumbnailURL || profile.photoURL}
							alt={profile.username}
							class="h-full w-full object-cover"
						/>
					{:else}
						<div
							class="flex h-full w-full items-center justify-center bg-gradient-to-br from-pink-500 to-purple-600"
						>
							<span class="text-8xl font-black text-white">
								{profile.username?.charAt(0).toUpperCase() || '?'}
							</span>
						</div>
					{/if}
				</div>

				<!-- Change Photo FAB (Own Profile Only) -->
				{#if isOwnProfile}
					<button
						on:click={openPhotoUpload}
						disabled={uploadingPhoto}
						class="absolute bottom-4 right-4 flex h-16 w-16 items-center justify-center rounded-full bg-pink-500 shadow-2xl transition-all duration-200 hover:bg-pink-600 disabled:opacity-50"
					>
						{#if uploadingPhoto}
							<div
								class="h-6 w-6 animate-spin rounded-full border-2 border-white border-t-transparent"
							></div>
						{:else}
							<svg class="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
								/>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
								/>
							</svg>
						{/if}
					</button>
				{/if}
			</div>

			<!-- Username -->
			<h1 class="mb-4 text-4xl font-black tracking-tight">{profile.username}</h1>

			<!-- Clout Score (HUGE) -->
			<div class="mb-6">
				<div
					class="mb-2 bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-8xl font-black text-transparent"
				>
					{profile.cloutScore || 0}
				</div>
				<div class="text-sm font-medium uppercase tracking-wider text-gray-400">Clout Score</div>
			</div>

			<!-- Quick Stats Row -->
			<div class="mb-8 grid grid-cols-2 gap-4 text-sm">
				<div class="rounded-2xl bg-white/5 p-4 backdrop-blur-sm">
					<div class="text-2xl font-bold text-yellow-400">{profile.cloutCoin || 0}</div>
					<div class="text-xs uppercase tracking-wider text-gray-400">CloutCoin</div>
				</div>
				<div class="rounded-2xl bg-white/5 p-4 backdrop-blur-sm">
					<div class="text-2xl font-bold text-blue-400">{profile.votes || 0}</div>
					<div class="text-xs uppercase tracking-wider text-gray-400">Total Votes</div>
				</div>
			</div>
		</div>

		<!-- Scroll indicator -->
		<div class="absolute bottom-8 left-1/2 -translate-x-1/2 transform animate-bounce">
			<svg class="h-6 w-6 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M19 14l-7 7m0 0l-7-7m7 7V3"
				/>
			</svg>
		</div>
	</section>

	<!-- Last 3 Whispers Section -->
	<section class="px-4 py-12">
		<div class="mx-auto max-w-md">
			<h2 class="mb-6 text-center text-2xl font-black">Latest Whispers</h2>

			{#if whispers && whispers.length > 0}
				<div class="space-y-4">
					{#each whispers.slice(0, 3) as whisper}
						<div class="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
							<p class="mb-3 leading-relaxed text-gray-200">"{whisper.text}"</p>
							<div class="text-right text-xs text-gray-500">
								{formatTimeAgo(whisper.createdAt)}
							</div>
						</div>
					{/each}
				</div>

				{#if whispers.length > 3}
					<div class="mt-6 text-center">
						<button class="text-sm font-medium text-pink-400 hover:text-pink-300">
							View All Whispers →
						</button>
					</div>
				{/if}
			{:else}
				<div class="py-12 text-center">
					<div class="mb-4 text-6xl text-gray-500">💭</div>
					<p class="text-gray-400">No whispers yet</p>
					<p class="mt-2 text-sm text-gray-500">The silence is deafening</p>
				</div>
			{/if}
		</div>
	</section>

	<!-- Recent Votes (Own Profile Only) -->
	{#if isOwnProfile && recentVotes.length > 0}
		<section class="border-t border-white/10 px-4 py-12">
			<div class="mx-auto max-w-md">
				<h2 class="mb-6 text-center text-2xl font-black">Your Recent Votes</h2>

				<div class="space-y-3">
					{#each recentVotes as vote}
						<div
							class="flex items-center justify-between rounded-xl bg-white/5 p-4 backdrop-blur-sm"
						>
							<div class="flex items-center space-x-3">
								<div class="text-2xl">
									{vote.type === 'hot' ? '🔥' : '🧊'}
								</div>
								<div>
									<div class="text-sm font-medium text-gray-200">{vote.targetUsername}</div>
									<div class="text-xs text-gray-500">{formatTimeAgo(vote.createdAt)}</div>
								</div>
							</div>
							<div class="text-xs text-gray-400">
								{vote.type === 'hot' ? '+1' : '-1'}
							</div>
						</div>
					{/each}
				</div>
			</div>
		</section>
	{/if}

	<!-- Whisper Submission (Other Profiles) -->
	{#if $user && !isOwnProfile}
		<section class="border-t border-white/10 px-4 py-12">
			<div class="mx-auto max-w-md">
				<h2 class="mb-6 text-center text-2xl font-black">Drop a Whisper</h2>

				<form method="POST" action="?/whisper" use:enhance class="space-y-4">
					<textarea
						name="whisperText"
						class="w-full resize-none rounded-2xl border border-white/20 bg-white/5 px-6 py-4 text-white placeholder-gray-400 backdrop-blur-sm focus:border-pink-500 focus:outline-none"
						placeholder="Say something anonymously..."
						rows="4"
						maxlength="280"
					></textarea>

					<button
						type="submit"
						class="w-full transform rounded-2xl bg-gradient-to-r from-pink-500 to-purple-600 py-4 font-bold text-white transition-all duration-200 hover:scale-[1.02] hover:from-pink-600 hover:to-purple-700"
					>
						Send Whisper 💭
					</button>
				</form>

				{#if form?.message}
					<div
						class="mt-4 rounded-2xl p-4 {form?.success
							? 'border border-green-500/30 bg-green-500/20'
							: 'border border-red-500/30 bg-red-500/20'}"
					>
						<p class="text-sm {form?.success ? 'text-green-400' : 'text-red-400'} text-center">
							{form.message}
						</p>
					</div>
				{/if}
			</div>
		</section>
	{/if}

	<!-- Bottom Navigation Space -->
	<div class="h-24"></div>
</main>

<style>
	/* Ensure smooth scrolling and hide scrollbar */
	:global(html) {
		scroll-behavior: smooth;
		scrollbar-width: none;
		-ms-overflow-style: none;
	}

	:global(html::-webkit-scrollbar) {
		display: none;
	}
</style>
