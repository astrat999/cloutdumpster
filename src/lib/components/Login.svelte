<script lang="ts">
  import { auth, db } from '$lib/firebase';
  import { GoogleAuthProvider, signInWithPopup, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
  import { collection, query, where, getDocs } from 'firebase/firestore';

  let username = '';
  let email = '';
  let password = '';
  let error: string | null = null;
  let isLoading = false;
  let mode: 'check' | 'login' | 'signup' = 'check';
  let existingUser = false;

  // Check if username is unique
  async function checkUsernameUnique(username: string): Promise<boolean> {
    const q = query(collection(db, 'users'), where('username', '==', username));
    const querySnapshot = await getDocs(q);
    return querySnapshot.empty;
  }

  // Check if email exists and determine flow
  async function checkEmailExists(email: string): Promise<boolean> {
    try {
      // This is a simple check - in production you'd use a more sophisticated method
      await signInWithEmailAndPassword(auth, email, 'dummy-password');
      return true;
    } catch (e: any) {
      return e.code === 'auth/wrong-password';
    }
  }

  // Intelligent continue function
  async function handleContinue() {
    if (mode === 'check') {
      if (!email) {
        error = "Enter an email address.";
        return;
      }

      isLoading = true;
      error = null;

      try {
        existingUser = await checkEmailExists(email);
        mode = existingUser ? 'login' : 'signup';
      } catch (e) {
        error = "Something went wrong checking your email.";
      } finally {
        isLoading = false;
      }
    } else if (mode === 'login') {
      await handleLogin();
    } else if (mode === 'signup') {
      await handleSignUp();
    }
  }

  // Google OAuth - still the fastest entry
  async function handleGoogleLogin() {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (e: any) {
      error = "Google login failed. The universe doesn't want you here.";
    }
  }

  // Login for existing users
  async function handleLogin() {
    if (!password) {
      error = "Enter your password.";
      return;
    }

    isLoading = true;
    error = null;
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (e: any) {
      error = "Wrong password. Try again or give up forever.";
    } finally {
      isLoading = false;
    }
  }

  // Signup for new users
  async function handleSignUp() {
    if (!username || !password) {
      error = "Fill in all fields.";
      return;
    }

    if (password.length < 6) {
      error = "Password too weak. Is that all the security your clout deserves?";
      return;
    }

    isLoading = true;
    error = null;

    try {
      // Check username uniqueness
      const isUnique = await checkUsernameUnique(username);
      if (!isUnique) {
        error = "Username taken. Try being more original.";
        return;
      }

      await createUserWithEmailAndPassword(auth, email, password);
    } catch (e: any) {
      if (e.code === 'auth/email-already-in-use') {
        error = "Email already in use. Switching to login...";
        mode = 'login';
      } else {
        error = "Registration failed. Probably your fault.";
      }
    } finally {
      isLoading = false;
    }
  }

  function resetFlow() {
    mode = 'check';
    email = '';
    username = '';
    password = '';
    error = null;
    existingUser = false;
  }
</script>

<!-- Luxury Login Interface -->
<div class="min-h-screen flex items-center justify-center bg-velvet px-4">
  <div class="w-full max-w-md">
    <!-- Brand Header -->
    <div class="text-center mb-8">
      <h1 class="font-display text-5xl font-bold text-white mb-2">
        Clout<span class="text-royal">Dumpster</span>
      </h1>
      <p class="text-gray-400 font-body">Welcome to the Inner Circle</p>
    </div>

    <!-- Main Card -->
    <div class="bg-silk/50 backdrop-blur-md rounded-2xl p-8 border border-royal/20">
      
      <!-- Google Login - Primary CTA -->
      <button 
        class="w-full bg-white text-black font-semibold py-4 rounded-xl mb-6 hover:bg-gray-100 transition-colors flex items-center justify-center space-x-3"
        on:click={handleGoogleLogin}
        disabled={isLoading}
      >
        <svg class="w-5 h-5" viewBox="0 0 24 24">
          <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        <span>Continue with Google</span>
      </button>

      <div class="relative mb-6">
        <div class="absolute inset-0 flex items-center">
          <div class="w-full border-t border-gray-600"></div>
        </div>
        <div class="relative flex justify-center text-sm">
          <span class="px-2 bg-silk text-gray-400">or continue with email</span>
        </div>
      </div>

      <!-- Email Field (Always Shown) -->
      <div class="mb-4">
        <input 
          type="email" 
          placeholder="Email address"
          class="w-full bg-velvet/50 border border-gray-600 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:border-royal focus:outline-none transition-colors"
          bind:value={email}
          disabled={mode !== 'check'}
        />
      </div>

      <!-- Username Field (Signup Only) -->
      {#if mode === 'signup'}
        <div class="mb-4">
          <input 
            type="text" 
            placeholder="Choose username"
            class="w-full bg-velvet/50 border border-gray-600 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:border-royal focus:outline-none transition-colors"
            bind:value={username}
          />
        </div>
      {/if}

      <!-- Password Field (Login/Signup) -->
      {#if mode === 'login' || mode === 'signup'}
        <div class="mb-6">
          <input 
            type="password" 
            placeholder="Password"
            class="w-full bg-velvet/50 border border-gray-600 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:border-royal focus:outline-none transition-colors"
            bind:value={password}
          />
        </div>
      {/if}

      <!-- Error Display -->
      {#if error}
        <div class="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-xl">
          <p class="text-red-400 text-sm">{error}</p>
        </div>
      {/if}

      <!-- Main Action Button -->
      <button 
        class="w-full bg-gradient-to-r from-royal to-purple-600 text-white font-semibold py-4 rounded-xl hover:from-purple-600 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 flex items-center justify-center space-x-2"
        on:click={handleContinue}
        disabled={isLoading}
      >
        {#if isLoading}
          <div class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
        {/if}
        <span>
          {#if mode === 'check'}
            Continue
          {:else if mode === 'login'}
            Sign In
          {:else}
            Join the Circle
          {/if}
        </span>
      </button>

      <!-- Back Button (Login/Signup) -->
      {#if mode !== 'check'}
        <button 
          class="w-full mt-3 text-gray-400 hover:text-white transition-colors py-2"
          on:click={resetFlow}
        >
          ← Back
        </button>
      {/if}

    </div>
  </div>
</div>
