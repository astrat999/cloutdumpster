<script lang="ts">
	import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
	import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
	import { db } from '$lib/firebase';
	import { user } from '$lib/stores';

	export let onUploadComplete: (url: string) => void = () => {};
	export let maxDurationSeconds: number = 3;
	export let maxSizeMB: number = 10;

	let fileInput: HTMLInputElement;
	let uploading = false;
	let error = '';
	let preview: string | null = null;

	async function handleUpload(event: Event) {
		const target = event.target as HTMLInputElement;
		const file = target.files?.[0];

		if (!file || !$user) {
			return;
		}

		error = '';

		// Validate file type
		if (!file.type.startsWith('video/')) {
			error = 'Please select a video file.';
			return;
		}

		// Validate file size
		if (file.size > maxSizeMB * 1024 * 1024) {
			error = `File size must be less than ${maxSizeMB}MB.`;
			return;
		}

		// Create preview
		preview = URL.createObjectURL(file);

		try {
			uploading = true;

			// Generate unique filename
			const timestamp = Date.now();
			const extension = file.name.split('.').pop();
			const filename = `${$user.uid}_${timestamp}.${extension}`;

			// Upload to Firebase Storage
			const storage = getStorage();
			const storageRef = ref(storage, `videos/${filename}`);

			await uploadBytes(storageRef, file, {
				contentType: file.type,
				customMetadata: {
					uploadedBy: $user.uid,
					originalName: file.name
				}
			});

			const downloadURL = await getDownloadURL(storageRef);

			// Add to posts collection
			await addDoc(collection(db, 'posts'), {
				uid: $user.uid,
				type: 'video',
				url: downloadURL,
				filename: filename,
				size: file.size,
				timestamp: serverTimestamp()
			});

			onUploadComplete(downloadURL);

			// Clear form
			target.value = '';
			if (preview) {
				URL.revokeObjectURL(preview);
				preview = null;
			}
		} catch (err) {
			console.error('Upload failed:', err);
			error = 'Upload failed. Please try again.';
		} finally {
			uploading = false;
		}
	}

	function clearPreview() {
		if (preview) {
			URL.revokeObjectURL(preview);
			preview = null;
		}
		if (fileInput) {
			fileInput.value = '';
		}
	}
</script>

<div class="rounded-2xl border border-royal/20 bg-silk/30 p-6">
	<h3 class="mb-4 font-display text-xl font-bold text-white">
		📹 Upload Video ({maxDurationSeconds}s max)
	</h3>

	<div class="space-y-4">
		<input
			bind:this={fileInput}
			type="file"
			accept="video/*"
			on:change={handleUpload}
			disabled={uploading}
			class="w-full text-white file:mr-4 file:cursor-pointer file:rounded-lg file:border-0 file:bg-royal file:px-4 file:py-2 file:text-white hover:file:bg-purple-600 disabled:opacity-50"
		/>

		{#if preview}
			<div class="relative">
				<video src={preview} controls class="w-full max-w-md rounded-xl" style="max-height: 300px;">
					<track kind="captions" />
				</video>
				<button
					on:click={clearPreview}
					class="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-red-600 text-white hover:bg-red-700"
				>
					✕
				</button>
			</div>
		{/if}

		{#if uploading}
			<div class="flex items-center space-x-2 text-royal">
				<div
					class="h-5 w-5 animate-spin rounded-full border-2 border-royal/30 border-t-royal"
				></div>
				<span>Uploading video...</span>
			</div>
		{/if}

		{#if error}
			<div class="rounded-xl border border-red-500/30 bg-red-500/20 p-3">
				<p class="text-sm text-red-400">{error}</p>
			</div>
		{/if}

		<div class="text-xs text-gray-400">
			<p>• Maximum duration: {maxDurationSeconds} seconds</p>
			<p>• Maximum file size: {maxSizeMB}MB</p>
			<p>• Supported formats: MP4, WebM, MOV</p>
		</div>
	</div>
</div>
