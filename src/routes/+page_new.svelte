<script lang="ts">
  import { auth, db, storage } from '$lib/firebase';
  import { user, userProfile } from '$lib/stores';
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
  import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
  import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
  import Header from '$lib/components/Header.svelte';

  let mounted = false;
  let showSignup = false;
  let isUploading = false;
  let previewUrl = '';
  let selectedFile: File | null = null;
  
  // Signup form data
  let handle = '';
  let email = '';
  let password = '';
  let signupStep = 1; // 1: photo, 2: details

  // Fake activity indicators for social proof
  let onlineCount = 0;
  let recentRatings = 0;

  onMount(() => {
    mounted = true;
    
    // Redirect if already authenticated
    if ($user && $userProfile) {
      goto('/feed');
      return;
    }

    // Generate fake social proof numbers
    onlineCount = Math.floor(Math.random() * 50) + 15;
    recentRatings = Math.floor(Math.random() * 200) + 50;

    // Pulse the online indicator
    setInterval(() => {
      onlineCount = Math.floor(Math.random() * 50) + 15;
    }, 3000);
  });

  function handleFileSelect(event: Event) {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    
    if (file && file.type.startsWith('image/')) {
      selectedFile = file;
      previewUrl = URL.createObjectURL(file);
    }
  }

  function nextStep() {
    if (signupStep === 1 && selectedFile) {
      signupStep = 2;
    }
  }

  async function completeSignup() {
    if (!selectedFile || !handle || !email || !password) return;
    
    isUploading = true;
    try {
      // Create user account
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const userId = userCredential.user.uid;

      // Upload avatar
      const avatarRef = ref(storage, `avatars/${userId}/avatar.jpg`);
      await uploadBytes(avatarRef, selectedFile);
      const avatarURL = await getDownloadURL(avatarRef);

      // Create user profile
      await setDoc(doc(db, 'users', userId), {
        uid: userId,
        username: handle,
        email: email,
        photoURL: avatarURL,
        cloutScore: 100, // Starting score
        cloutCoin: 50,   // Starting coins
        createdAt: serverTimestamp(),
        lastActive: serverTimestamp()
      });

      // Redirect to feed
      goto('/feed');

    } catch (error) {
      console.error('Signup failed:', error);
      alert('Signup failed. Try again.');
    } finally {
      isUploading = false;
    }
  }

  function showLoginInstead() {
    showSignup = false;
    signupStep = 1;
    selectedFile = null;
    previewUrl = '';
  }
</script>

<svelte:head>
  <title>How Hot Are You? - CloutDumpster</title>
  <meta name="description" content="Find out instantly. One photo. Infinite judgment." />
</svelte:head>

{#if $user && $userProfile}
  <Header />
  <main class="pt-20 min-h-screen bg-black">
    <!-- Redirect to feed if authenticated -->
    <div class="flex items-center justify-center min-h-screen">
      <div class="text-center">
        <div class="w-8 h-8 border-2 border-pink-500/30 border-t-pink-500 rounded-full animate-spin mb-4"></div>
        <p class="text-white">Redirecting to your feed...</p>
      </div>
    </div>
  </main>
{:else}
  <!-- Landing Hero -->
  <main class="h-screen w-full bg-black relative overflow-hidden">
    <!-- Hero Background -->
    <div class="absolute inset-0 bg-gradient-to-br from-pink-500/20 via-black to-purple-500/20"></div>
    
    <!-- Fake Activity Indicators -->
    <div class="absolute top-4 right-4 z-20">
      <div class="flex items-center space-x-4">
        <!-- Online indicator -->
        <div class="flex items-center space-x-2 bg-black/50 backdrop-blur-sm rounded-full px-3 py-1">
          <div class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span class="text-white text-sm font-semibold">{onlineCount} online</span>
        </div>
        
        <!-- Recent activity -->
        <div class="bg-pink-500/20 backdrop-blur-sm rounded-full px-3 py-1">
          <span class="text-white text-sm font-semibold">{recentRatings} rated today</span>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="relative z-10 h-full flex flex-col items-center justify-center px-6 text-center">
      {#if !showSignup}
        <!-- Landing State -->
        <div class="max-w-lg mx-auto">
          <h1 class="text-5xl md:text-6xl font-bold text-white mb-4">
            How Hot Are <em class="text-pink-500">You</em>?
          </h1>
          <p class="text-xl text-gray-300 mb-8">
            Find out instantly. One photo. Infinite judgment.
          </p>
          
          <!-- Tease before signup -->
          <div class="bg-pink-500/10 backdrop-blur-sm border border-pink-500/20 rounded-2xl p-6 mb-8">
            <p class="text-pink-300 font-semibold mb-2">
              🔥 {Math.floor(Math.random() * 100) + 20} people just rated someone
            </p>
            <p class="text-gray-400 text-sm">
              See your rating in 30 seconds
            </p>
          </div>

          <button 
            on:click={() => showSignup = true}
            class="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-bold py-4 px-12 rounded-full text-lg transition-all duration-300 hover:scale-105"
          >
            Jump In →
          </button>

          <!-- Social proof -->
          <div class="mt-12 grid grid-cols-3 gap-8 text-center opacity-70">
            <div>
              <p class="text-2xl font-bold text-white">10K+</p>
              <p class="text-sm text-gray-400">Photos Rated</p>
            </div>
            <div>
              <p class="text-2xl font-bold text-pink-500">4.8★</p>
              <p class="text-sm text-gray-400">Average Rating</p>
            </div>
            <div>
              <p class="text-2xl font-bold text-white">24/7</p>
              <p class="text-sm text-gray-400">Live Judging</p>
            </div>
          </div>
        </div>

      {:else}
        <!-- Signup Wizard -->
        <div class="max-w-md mx-auto w-full">
          <div class="bg-black/50 backdrop-blur-lg border border-gray-800 rounded-3xl p-8">
            
            {#if signupStep === 1}
              <!-- Step 1: Photo Upload -->
              <div class="text-center mb-6">
                <h2 class="text-2xl font-bold text-white mb-2">Step 1: Your Face</h2>
                <p class="text-gray-400">Let's see what we're working with</p>
              </div>

              <!-- Photo Upload Zone -->
              <div class="mb-6">
                {#if previewUrl}
                  <div class="relative">
                    <img src={previewUrl} alt="Preview" class="w-full h-64 object-cover rounded-2xl" />
                    <button 
                      on:click={() => {selectedFile = null; previewUrl = ''}}
                      class="absolute top-2 right-2 bg-black/50 text-white rounded-full w-8 h-8 flex items-center justify-center"
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
                    <div class="w-full h-64 border-2 border-dashed border-pink-500/50 rounded-2xl flex flex-col items-center justify-center hover:border-pink-500 transition-colors">
                      <div class="text-4xl mb-2">📸</div>
                      <p class="text-pink-500 font-semibold">Tap to add photo</p>
                      <p class="text-gray-400 text-sm mt-1">Front camera recommended</p>
                    </div>
                  </label>
                {/if}
              </div>

              <button 
                on:click={nextStep}
                disabled={!selectedFile}
                class="w-full bg-pink-500 hover:bg-pink-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 rounded-full transition-colors"
              >
                Next →
              </button>

            {:else if signupStep === 2}
              <!-- Step 2: Handle & Password -->
              <div class="text-center mb-6">
                <h2 class="text-2xl font-bold text-white mb-2">Step 2: Your Identity</h2>
                <p class="text-gray-400">Pick a handle & password</p>
              </div>

              <div class="space-y-4 mb-6">
                <input 
                  type="text" 
                  placeholder="@handle"
                  bind:value={handle}
                  class="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:border-pink-500 focus:outline-none"
                />
                <input 
                  type="email" 
                  placeholder="Email"
                  bind:value={email}
                  class="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:border-pink-500 focus:outline-none"
                />
                <input 
                  type="password" 
                  placeholder="Password"
                  bind:value={password}
                  class="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:border-pink-500 focus:outline-none"
                />
              </div>

              <button 
                on:click={completeSignup}
                disabled={!handle || !email || !password || isUploading}
                class="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-full transition-all duration-300 flex items-center justify-center space-x-2"
              >
                {#if isUploading}
                  <div class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Creating Account...</span>
                {:else}
                  <span>Enter Dumpster →</span>
                {/if}
              </button>
            {/if}

            <!-- Back/Login options -->
            <div class="mt-6 text-center text-sm">
              {#if signupStep === 2}
                <button 
                  on:click={() => signupStep = 1}
                  class="text-gray-400 hover:text-white mr-4"
                >
                  ← Back
                </button>
              {/if}
              <button 
                on:click={showLoginInstead}
                class="text-pink-500 hover:text-pink-400"
              >
                Already have an account?
              </button>
            </div>
          </div>
        </div>
      {/if}
    </div>

    <!-- Bottom gradient -->
    <div class="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black to-transparent"></div>
  </main>
{/if}
