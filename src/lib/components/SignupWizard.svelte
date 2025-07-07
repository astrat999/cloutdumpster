<!-- SIGNUP WIZARD: step 1 selfie upload with <input type="file" accept="image/*" capture="user">, auto-crop square thumbnail, upload to Firebase Storage, then step 2 handle+password form, save avatarURL & create Firebase auth user -->
<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { auth, db, storage } from '$lib/firebase';
  import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
  import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
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
        cloutCoin: 50,   // Starting coins
        createdAt: serverTimestamp(),
        lastActive: serverTimestamp()
      });

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
    return new Promise((resolve) => {
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
        canvas.toBlob(resolve!, 'image/jpeg', 0.8);
      };
      
      img.src = previewUrl;
    });
  }
  // END Firebase signup flow

  function closeWizard() {
    dispatch('close');
  }
</script>

<!-- Signup Wizard Modal -->
<div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
  <div class="w-full max-w-md">
    <!-- Glass-morphism card -->
    <div class="bg-black/70 backdrop-blur-lg border border-gray-800 rounded-3xl p-8 relative">
      <!-- Close button -->
      <button 
        on:click={closeWizard}
        class="absolute top-4 right-4 text-gray-400 hover:text-white text-2xl"
      >
        ×
      </button>

      {#if currentStep === 1}
        <!-- Step 1: Photo Upload -->
        <div class="text-center mb-6">
          <h2 class="text-2xl font-bold text-white mb-2">Step 1: Your Face</h2>
          <p class="text-gray-400">Let's see what we're working with</p>
        </div>

        <!-- Photo upload zone with Tailwind glass styling -->
        <div class="mb-6">
          {#if previewUrl}
            <div class="relative">
              <img src={previewUrl} alt="Preview" class="w-full h-64 object-cover rounded-2xl" />
              <button 
                on:click={() => {selectedFile = null; previewUrl = ''}}
                class="absolute top-2 right-2 bg-black/70 backdrop-blur-sm text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-black transition-colors"
              >
                ×
              </button>
            </div>
          {:else}
            <label class="cursor-pointer block">
              <input 
                type="file" 
                accept="image/*" 
                capture="user"
                class="hidden" 
                on:change={handleFileSelect}
              />
              <div class="w-full h-64 border-2 border-dashed border-accent/50 rounded-2xl flex flex-col items-center justify-center hover:border-accent hover:bg-accent/5 transition-all">
                <div class="text-4xl mb-2">📸</div>
                <p class="text-accent font-semibold">Tap to add photo</p>
                <p class="text-gray-400 text-sm mt-1">Front camera recommended</p>
              </div>
            </label>
          {/if}
        </div>

        <button 
          on:click={nextStep}
          disabled={!selectedFile}
          class="w-full bg-accent hover:bg-pink-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 rounded-full transition-colors"
        >
          Next →
        </button>

      {:else if currentStep === 2}
        <!-- Step 2: Handle & Password -->
        <div class="text-center mb-6">
          <h2 class="text-2xl font-bold text-white mb-2">Step 2: Your Identity</h2>
          <p class="text-gray-400">Pick a handle & password</p>
        </div>

        <div class="space-y-4 mb-6">
          <div>
            <input 
              type="text" 
              placeholder="@handle"
              bind:value={handle}
              class="w-full bg-gray-900/70 backdrop-blur-sm border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:border-accent focus:outline-none"
            />
          </div>
          <div>
            <input 
              type="email" 
              placeholder="Email"
              bind:value={email}
              class="w-full bg-gray-900/70 backdrop-blur-sm border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:border-accent focus:outline-none"
            />
          </div>
          <div>
            <input 
              type="password" 
              placeholder="Password"
              bind:value={password}
              class="w-full bg-gray-900/70 backdrop-blur-sm border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:border-accent focus:outline-none"
            />
          </div>
        </div>

        <!-- Action buttons -->
        <div class="space-y-3">
          <button 
            on:click={completeSignup}
            disabled={!handle || !email || !password || isUploading}
            class="w-full bg-gradient-to-r from-accent to-purple-600 hover:from-pink-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-full transition-all duration-300 flex items-center justify-center space-x-2"
          >
            {#if isUploading}
              <div class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              <span>Creating Account...</span>
            {:else}
              <span>Enter Dumpster →</span>
            {/if}
          </button>
          
          <button 
            on:click={previousStep}
            class="w-full text-gray-400 hover:text-white py-2 transition-colors"
          >
            ← Back to Photo
          </button>
        </div>
      {/if}

      <!-- Error message -->
      {#if errorMessage}
        <div class="mt-4 p-3 bg-red-500/20 border border-red-500/30 rounded-xl">
          <p class="text-red-400 text-sm text-center">{errorMessage}</p>
        </div>
      {/if}
    </div>
  </div>
</div>
