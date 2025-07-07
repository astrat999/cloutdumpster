<!-- SIGNUP WIZARD: step 1 selfie upload with <input type="file" accept="image/*" capture="user">, auto-crop square thumbnail, upload to Firebase Storage, then step 2 handle+password form, save avatarURL & create Firebase auth user -->
<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { auth, db, storage, app } from '$lib/firebase';
	import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
	import { doc, setDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
	import { createUserWithEmailAndPassword } from 'firebase/auth';
	import { goto } from '$app/navigation';

	const dispatch = createEventDispatcher();

	// Component state
	let currentStep = 1;
	let isUploading = false;
	let previewUrl = '';
	let selectedFile: File | null = null;

	// Form data
	let handle = '';
	let email = '';
	let password = '';
	let errorMessage = '';

	// BEGIN photo upload handling
	function handleFileSelect(event: Event) {
		const target = event.target as HTMLInputElement;
		const file = target.files?.[0];

		if (file && file.type.startsWith('image/')) {
			selectedFile = file;
			previewUrl = URL.createObjectURL(file);
			errorMessage = '';
		} else {
			errorMessage = 'Please select a valid image file';
		}
	}

	function nextStep() {
		if (currentStep === 1 && selectedFile) {
			currentStep = 2;
			errorMessage = '';
		}
	}

	function previousStep() {
		if (currentStep === 2) {
			currentStep = 1;
			errorMessage = '';
		}
	}
	// END photo upload handling

	// BEGIN Firebase signup flow
	async function completeSignup() {
		if (!selectedFile || !handle || !email || !password) {
			errorMessage = 'All fields are required';
			return;
		}

		if (handle.length < 3) {
			errorMessage = 'Handle must be at least 3 characters';
			return;
		}

		isUploading = true;
		errorMessage = '';

		try {
			// Create user account
			const userCredential = await createUserWithEmailAndPassword(auth, email, password);
			const userId = userCredential.user.uid;

			// Upload avatar to Firebase Storage
			const avatarRef = ref(storage, `avatars/${userId}/avatar.jpg`);
			await uploadBytes(avatarRef, selectedFile);
			const avatarURL = await getDownloadURL(avatarRef);

			// Create 256x256 thumbnail (client-side resize for now)
			const thumbnailBlob = await createThumbnail(selectedFile, 256);
			const thumbRef = ref(storage, `avatars/${userId}/avatar_256.jpg`);
			await uploadBytes(thumbRef, thumbnailBlob);
			const thumbnailURL = await getDownloadURL(thumbRef);

			// Save user profile to Firestore
			await setDoc(doc(db, 'users', userId), {
				uid: userId,
				username: handle.toLowerCase().replace(/[^a-z0-9]/g, ''),
				email: email,
				photoURL: avatarURL,
				thumbnailURL: thumbnailURL,
				cloutScore: 100, // Starting score
				cloutCoin: 50, // Starting coins
				createdAt: serverTimestamp(),
				lastActive: serverTimestamp()
			});

			// Subscribe to push notifications
			subscribeToNotifications(userId);

			// Success - redirect to feed
			goto('/feed');
		} catch (error: any) {
			console.error('Signup failed:', error);
			errorMessage = error.message || 'Signup failed. Try again.';
		} finally {
			isUploading = false;
		}
	}

	// Create thumbnail using canvas
	async function createThumbnail(file: File, size: number): Promise<Blob> {
		return new Promise((resolve, reject) => {
			const canvas = document.createElement('canvas');
			const ctx = canvas.getContext('2d')!;
			const img = new Image();

			img.onload = () => {
				canvas.width = size;
				canvas.height = size;

				// Calculate crop dimensions for square thumbnail
				const minDim = Math.min(img.width, img.height);
				const sx = (img.width - minDim) / 2;
				const sy = (img.height - minDim) / 2;

				ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, size, size);
				canvas.toBlob(
					(blob) => {
						if (blob) {
							resolve(blob);
						} else {
							reject(new Error('Failed to create blob'));
						}
					},
					'image/jpeg',
					0.8
				);
			};

			img.onerror = () => reject(new Error('Failed to load image'));
			img.src = URL.createObjectURL(file);
		});
	}
	// END Firebase signup flow

	// SUBSCRIBE TO PUSH AFTER SIGNUP
	async function subscribeToNotifications(uid: string) {
		try {
			if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
				console.log('Push messaging is not supported');
				return;
			}

			const permission = await Notification.requestPermission();
			if (permission !== 'granted') {
				console.log('Notification permission denied');
				return;
			}

			// Import FCM only when needed
			const { getMessaging, getToken } = await import('firebase/messaging');
			const messaging = getMessaging(app);
			
			const vapidKey = import.meta.env.VITE_VAPID_KEY;
			if (!vapidKey) {
				console.log('VAPID key not configured');
				return;
			}

			const token = await getToken(messaging, { vapidKey });
			if (token) {
				// Save FCM token to user document
				await updateDoc(doc(db, 'users', uid), { fcmToken: token });
				console.log('FCM token saved successfully');
			}
		} catch (error) {
			console.error('Error setting up notifications:', error);
		}
	}

	function closeWizard() {
		dispatch('close');
	}
</script>

<!-- Signup Wizard Modal -->
<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
	<div class="w-full max-w-md">
		<!-- Glass-morphism card -->
		<div class="relative rounded-3xl border border-gray-800 bg-black/70 p-8 backdrop-blur-lg">
			<!-- Close button -->
			<button
				on:click={closeWizard}
				class="absolute right-4 top-4 text-2xl text-gray-400 hover:text-white"
			>
				×
			</button>

			{#if currentStep === 1}
				<!-- Step 1: Photo Upload -->
				<div class="mb-6 text-center">
					<h2 class="mb-2 text-2xl font-bold text-white">Step 1: Your Face</h2>
					<p class="text-gray-400">Let's see what we're working with</p>
				</div>

				<!-- Photo upload zone with Tailwind glass styling -->
				<div class="mb-6">
					{#if previewUrl}
						<div class="relative">
							<img src={previewUrl} alt="Preview" class="h-64 w-full rounded-2xl object-cover" />
							<button
								on:click={() => {
									selectedFile = null;
									previewUrl = '';
								}}
								class="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/70 text-white backdrop-blur-sm transition-colors hover:bg-black"
							>
								×
							</button>
						</div>
					{:else}
						<label class="block cursor-pointer">
							<input
								type="file"
								accept="image/*"
								capture="user"
								class="hidden"
								on:change={handleFileSelect}
							/>
							<div
								class="flex h-64 w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-accent/50 transition-all hover:border-accent hover:bg-accent/5"
							>
								<div class="mb-2 text-4xl">📸</div>
								<p class="font-semibold text-accent">Tap to add photo</p>
								<p class="mt-1 text-sm text-gray-400">Front camera recommended</p>
							</div>
						</label>
					{/if}
				</div>

				<button
					on:click={nextStep}
					disabled={!selectedFile}
					class="w-full rounded-full bg-accent py-3 font-bold text-white transition-colors hover:bg-pink-600 disabled:cursor-not-allowed disabled:bg-gray-600"
				>
					Next →
				</button>
			{:else if currentStep === 2}
				<!-- Step 2: Handle & Password -->
				<div class="mb-6 text-center">
					<h2 class="mb-2 text-2xl font-bold text-white">Step 2: Your Identity</h2>
					<p class="text-gray-400">Pick a handle & password</p>
				</div>

				<div class="mb-6 space-y-4">
					<div>
						<input
							type="text"
							placeholder="@handle"
							bind:value={handle}
							class="w-full rounded-xl border border-gray-700 bg-gray-900/70 px-4 py-3 text-white placeholder-gray-400 backdrop-blur-sm focus:border-accent focus:outline-none"
						/>
					</div>
					<div>
						<input
							type="email"
							placeholder="Email"
							bind:value={email}
							class="w-full rounded-xl border border-gray-700 bg-gray-900/70 px-4 py-3 text-white placeholder-gray-400 backdrop-blur-sm focus:border-accent focus:outline-none"
						/>
					</div>
					<div>
						<input
							type="password"
							placeholder="Password"
							bind:value={password}
							class="w-full rounded-xl border border-gray-700 bg-gray-900/70 px-4 py-3 text-white placeholder-gray-400 backdrop-blur-sm focus:border-accent focus:outline-none"
						/>
					</div>
				</div>

				<!-- Action buttons -->
				<div class="space-y-3">
					<button
						on:click={completeSignup}
						disabled={!handle || !email || !password || isUploading}
						class="flex w-full items-center justify-center space-x-2 rounded-full bg-gradient-to-r from-accent to-purple-600 py-3 font-bold text-white transition-all duration-300 hover:from-pink-600 hover:to-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
					>
						{#if isUploading}
							<div
								class="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white"
							></div>
							<span>Creating Account...</span>
						{:else}
							<span>Enter Dumpster →</span>
						{/if}
					</button>

					<button
						on:click={previousStep}
						class="w-full py-2 text-gray-400 transition-colors hover:text-white"
					>
						← Back to Photo
					</button>
				</div>
			{/if}

			<!-- Error message -->
			{#if errorMessage}
				<div class="mt-4 rounded-xl border border-red-500/30 bg-red-500/20 p-3">
					<p class="text-center text-sm text-red-400">{errorMessage}</p>
				</div>
			{/if}
		</div>
	</div>
</div>
