<script lang="ts">
	import { storage, db } from '$lib/firebase';
	import { userProfile } from '$lib/stores';
	import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
	import { doc, updateDoc } from 'firebase/firestore';

	let file: FileList | null;
	let isLoading = false;
	let error: string | null = null;
	let success: string | null = null;

	// Tactical Order: "Create a function to handle file upload and update the user's profile."
	async function handleUpload() {
		if (!file || file.length === 0) {
			error = 'Select a file, you amateur.';
			return;
		}
		if (!$userProfile) {
			error = 'User profile not found. Are you even real?';
			return;
		}

		isLoading = true;
		error = null;
		success = null;

		const uploadedFile = file[0];
		const isVideo = uploadedFile.type.startsWith('video/');

		// Check file size for videos (5MB limit)
		if (isVideo && uploadedFile.size > 5 * 1024 * 1024) {
			error = 'Video too large. Keep it under 5MB, attention seeker.';
			isLoading = false;
			return;
		}

		// Create appropriate storage path
		const basePath = isVideo ? 'profile-videos' : 'profile-pictures';
		const storagePath = `${basePath}/${$userProfile.uid}/${uploadedFile.name}`;
		const storageRef = ref(storage, storagePath);

		try {
			// Upload the file
			const snapshot = await uploadBytes(storageRef, uploadedFile);
			const downloadURL = await getDownloadURL(snapshot.ref);

			// Update the user's document with appropriate field
			const userDocRef = doc(db, 'users', $userProfile.uid);
			const updateData = isVideo ? { videoURL: downloadURL } : { photoURL: downloadURL };

			await updateDoc(userDocRef, updateData);

			// Update the local store for instant feedback
			if (isVideo) {
				$userProfile.videoURL = downloadURL;
				success = "Video avatar uploaded. You're literally moving up in the world.";
			} else {
				$userProfile.photoURL = downloadURL;
				success = 'New face, same dumpster. Profile picture updated.';
			}
			userProfile.set($userProfile);
		} catch (e) {
			error = `Upload failed. The server probably hates your ${isVideo ? 'video' : 'face'}.`;
			console.error(e);
		} finally {
			isLoading = false;
		}
	}
</script>

<div class="rounded-2xl border border-royal/20 bg-silk/30 p-6">
	<div class="mb-4">
		<h3 class="mb-2 font-display text-xl font-bold text-white">Avatar Upload</h3>
		<p class="text-sm text-gray-400">Upload a photo or 3-second video to stand out</p>
	</div>

	<div class="space-y-4">
		<input
			type="file"
			class="w-full rounded-xl border border-gray-600 bg-velvet/50 px-4 py-3 text-white transition-colors file:mr-4 file:rounded-lg file:border-0 file:bg-royal file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-purple-600"
			bind:files={file}
			accept="image/*, video/mp4, video/quicktime"
		/>

		<button
			class="flex w-full items-center justify-center space-x-2 rounded-xl bg-gradient-to-r from-royal to-purple-600 py-3 font-semibold text-white transition-all duration-200 hover:from-purple-600 hover:to-purple-700 disabled:opacity-50"
			on:click={handleUpload}
			disabled={isLoading}
		>
			{#if isLoading}
				<div
					class="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white"
				></div>
			{/if}
			<span>Upload Avatar</span>
		</button>

		{#if error}
			<div class="rounded-xl border border-red-500/30 bg-red-500/20 p-3">
				<p class="text-sm text-red-400">{error}</p>
			</div>
		{/if}

		{#if success}
			<div class="rounded-xl border border-green-500/30 bg-green-500/20 p-3">
				<p class="text-sm text-green-400">{success}</p>
			</div>
		{/if}
	</div>
</div>
