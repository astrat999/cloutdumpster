<script lang="ts">
  import { auth } from '$lib/firebase';
  import { GoogleAuthProvider, signInWithPopup, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';

  let email = '';
  let password = '';
  let error: string | null = null;
  let isLoading = false;

  // Low-friction entry point. Get them in with one click.
  async function handleGoogleLogin() {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (e: any) {
      error = "Google login failed. The universe doesn't want you here.";
    }
  }

  // The main funnel for new users.
  async function handleSignUp() {
    isLoading = true;
    error = null;
    try {
      await createUserWithEmailAndPassword(auth, email, password);
    } catch (e: any) {
      // Shaming, unhelpful error messages are part of the UX.
      if (e.code === 'auth/email-already-in-use') {
        error = "That email is already in the dumpster. Try logging in, genius.";
      } else if (e.code === 'auth/weak-password') {
        error = "Weak password. Is that all the security your clout deserves?";
      } else {
        error = "Something went wrong. Probably your fault.";
      }
    } finally {
      isLoading = false;
    }
  }

  // Funnel for returning users.
  async function handleLogin() {
    isLoading = true;
    error = null;
    try {
        await signInWithEmailAndPassword(auth, email, password);
    } catch (e: any) {
        error = "Wrong credentials. Try again or give up forever.";
    } finally {
        isLoading = false;
    }
  }
</script>

<!-- This is the main container. We use DaisyUI classes for instant styling. -->
<main class="flex flex-col items-center justify-center min-h-screen p-4 bg-base-200">
    <div class="card w-full max-w-sm bg-base-100 shadow-2xl shadow-black">
      <div class="card-body items-center text-center">
        <h1 class="text-5xl font-bold" style="font-family: serif; color: #F472B6; text-shadow: 0 0 8px #F472B6, 0 0 12px #F472B6;">
          CLOUT DUMPSTER
        </h1>
        <p class="py-4 text-neutral-content">Your reputation is garbage. Time to own it.</p>

        <div class="form-control w-full gap-2">
          <input type="email" placeholder="email" class="input input-bordered w-full" bind:value={email} />
          <input type="password" placeholder="password" class="input input-bordered w-full" bind:value={password} />
        </div>

        {#if error}
            <div class="alert alert-error mt-4">
                <span>{error}</span>
            </div>
        {/if}

        <div class="card-actions justify-center w-full mt-4 gap-2">
          <button class="btn btn-primary w-full" on:click={handleSignUp} disabled={isLoading}>
            {#if isLoading}<span class="loading loading-spinner"></span>{/if}
            Join the Dumpster
          </button>
           <button class="btn btn-secondary w-full" on:click={handleLogin} disabled={isLoading}>
            {#if isLoading}<span class="loading loading-spinner"></span>{/if}
            Login
          </button>
          <div class="divider">OR</div>
          <button class="btn btn-outline btn-accent w-full" on:click={handleGoogleLogin}>
            Login with Google
          </button>
        </div>
      </div>
    </div>
</main>