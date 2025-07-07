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

	// Import components
	import Header from '$lib/components/Header.svelte';
	import Top6 from '$lib/components/Top6.svelte';
	import ProfileUploader from '$lib/components/ProfileUploader.svelte';
	import DisplaySelector from '$lib/components/DisplaySelector.svelte';
	import CritiqueModal from '$lib/components/CritiqueModal.svelte';
	import CritiqueArchive from '$lib/components/CritiqueArchive.svelte';

	export let data: PageData;
	export let form: ActionData;

	$: profile = data.profile;
	$: whispers = data.whispers as any[];
	$: isOwnProfile = $user && $user.uid === profile.uid;

	let recentVotes: any[] = [];
	let showPhotoUpload = false;
	let uploadingPhoto = false;
	let showCritiqueModal = false;
	let showCritiqueArchive = false;

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

<Header />

<main class="min-h-screen bg-velvet pt-20 font-body">
	<div class="mx-auto max-w-4xl px-4 py-8">
		<!-- Profile Header -->
		<div class="mb-8 rounded-2xl border border-royal/20 bg-silk/30 p-8">
			<div
				class="flex flex-col items-center space-y-6 md:flex-row md:items-start md:space-x-8 md:space-y-0"
			>
				<!-- Avatar with Video Support -->
				<div class="relative">
					<div
						class="h-40 w-40 overflow-hidden rounded-full bg-gradient-to-br from-royal to-purple-700 p-1"
					>
						<div
							class="flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-velvet"
						>
							{#if profile.primaryDisplay === 'video' && profile.videoURL}
								<video
									src={profile.videoURL}
									autoplay
									muted
									loop
									playsinline
									class="h-full w-full object-cover"
								></video>
							{:else if profile.primaryDisplay === 'photo' && profile.photoURL}
								<img
									src={profile.photoURL}
									alt="{profile.username}'s avatar"
									class="h-full w-full object-cover"
								/>
							{:else if profile.videoURL}
								<video
									src={profile.videoURL}
									autoplay
									muted
									loop
									playsinline
									class="h-full w-full object-cover"
								></video>
							{:else if profile.photoURL}
								<img
									src={profile.photoURL}
									alt="{profile.username}'s avatar"
									class="h-full w-full object-cover"
								/>
							{:else}
								<div
									class="flex h-full w-full items-center justify-center bg-gradient-to-br from-royal to-purple-700"
								>
									<span class="text-4xl font-bold text-white">
										{profile.username?.charAt(0).toUpperCase() || '?'}
									</span>
								</div>
							{/if}
						</div>
					</div>
				</div>

				<!-- Profile Info -->
				<div class="flex-1 text-center md:text-left">
					<h1 class="mb-2 font-display text-4xl font-bold text-white">{profile.username}</h1>
					<div
						class="flex flex-col space-y-4 md:flex-row md:items-center md:space-x-8 md:space-y-0"
					>
						<div class="text-center md:text-left">
							<p class="font-display text-4xl font-bold text-electric">{profile.cloutScore}</p>
							<p class="text-sm uppercase tracking-wider text-gray-400">Clout Score</p>
						</div>
						<div class="text-center md:text-left">
							<p class="font-display text-2xl font-bold text-gold">{profile.cloutCoin || 0}</p>
							<p class="text-sm uppercase tracking-wider text-gray-400">CloutCoin</p>
						</div>
					</div>
				</div>
			</div>
		</div>

		<!-- Top 6 Inner Circle -->
		<div class="mb-8">
			<Top6 isOwnProfile={!!isOwnProfile} profileUserId={profile.uid} />
		</div>

		<!-- Profile Management (Own Profile Only) -->
		{#if isOwnProfile}
			<div class="mb-8 space-y-6">
				<ProfileUploader />
				<DisplaySelector />
			</div>
		{/if}

		<!-- Whisper Submission Form -->
		{#if $user && !isOwnProfile}
			<div class="mb-8 rounded-2xl border border-royal/20 bg-silk/30 p-6">
				<h3 class="mb-4 font-display text-xl font-bold text-white">Drop a comment (Anonymously)</h3>
				<form method="POST" action="?/whisper" use:enhance class="space-y-4">
					<textarea
						name="whisperText"
						class="w-full resize-none rounded-xl border border-gray-600 bg-velvet/50 px-4 py-3 text-white placeholder-gray-400 focus:border-royal focus:outline-none"
						placeholder="Throw shade anonymously..."
						rows="3"
					></textarea>
					<button
						type="submit"
						class="w-full rounded-xl bg-gradient-to-r from-royal to-purple-600 py-3 font-semibold text-white transition-all duration-200 hover:from-purple-600 hover:to-purple-700"
					>
						� Send Whisper
					</button>
				</form>

				{#if form?.message}
					<div
						class="mt-4 rounded-xl border p-3 {form?.success
							? 'border-green-500/30 bg-green-500/20'
							: 'border-red-500/30 bg-red-500/20'}"
					>
						<p class="text-sm {form?.success ? 'text-green-400' : 'text-red-400'}">
							{form.message}
						</p>
					</div>
				{/if}
			</div>
		{/if}

		<!-- Whispers Display -->
		<div class="rounded-2xl border border-royal/20 bg-silk/30 p-6">
			<h3 class="mb-6 font-display text-xl font-bold text-white">The Whisper Chamber</h3>
			{#if whispers && whispers.length > 0}
				<div class="space-y-4">
					{#each whispers as whisper}
						<div class="rounded-xl border border-royal/20 bg-velvet/50 p-4">
							<p class="text-gray-300">"{whisper.text}"</p>
							<p class="mt-2 text-right text-xs text-gray-500">
								Whispered on: {new Date(whisper.createdAt?.toDate()).toLocaleString()}
							</p>
						</div>
					{/each}
				</div>
			{:else}
				<div class="py-8 text-center">
					<p class="text-gray-400">Silent as the grave. No whispers yet.</p>
				</div>
			{/if}
		</div>

		<div class="mt-8 text-center">
			<a
				href="/leaderboard"
				class="font-semibold text-royal transition-colors hover:text-purple-400"
			>
				← Back to the Leaderboard
			</a>
		</div>

		<!-- Critique Modal (Hidden by default) -->
		{#if showCritiqueModal}
			<CritiqueModal
				targetUserId={profile.uid}
				targetUsername={profile.username}
				on:close={() => (showCritiqueModal = false)}
			/>
		{/if}

		<!-- Critique Archive (Hidden by default) -->
		{#if showCritiqueArchive}
			<CritiqueArchive userId={profile.uid} on:close={() => (showCritiqueArchive = false)} />
		{/if}
	</div>
</main>
