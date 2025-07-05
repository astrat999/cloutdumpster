<script lang="ts">
  import { auth } from '$lib/firebase';
  import { user, userProfile } from '$lib/stores';
  import Login from '$lib/components/Login.svelte';
  import Spyglass from '$lib/components/Spyglass.svelte';
</script>

<main class="flex flex-col items-center justify-center min-h-screen p-4">
  {#if $user && $userProfile}
    <!-- Use a wider container to fit the new component -->
    <div class="w-full max-w-2xl space-y-8">
        <!-- The original dashboard card -->
        <div class="text-center p-8 bg-base-200 rounded-lg shadow-xl">
            <h1 class="text-2xl font-bold text-accent">Welcome, {$userProfile.username}</h1>
            
            <!-- Display CloutCoin balance -->
            <p class="mt-2 text-sm">Your Balance: <span class="font-bold text-warning">{$userProfile.cloutCoin} CloutCoin™</span></p>

            <div class="my-6">
                <p class="text-7xl font-mono font-extrabold text-primary">
                    {$userProfile.cloutScore}
                </p>
                <p class="text-sm uppercase tracking-widest text-neutral-content">Clout Score</p>
            </div>

            <div class="flex flex-col md:flex-row gap-4 mt-6">
                <a href="/rank" class="btn btn-primary btn-lg flex-1">Enter the Arena</a>
                <a href="/leaderboard" class="btn btn-secondary btn-lg flex-1">View Leaderboard</a>
            </div>

            <button on:click={() => auth.signOut()} class="btn btn-warning btn-outline mt-8">
                Abandon Your Clout (Sign Out)
            </button>
        </div>

        <!-- Tactical Addition: The Spyglass Component -->
        <Spyglass />
    </div>
  {:else if !$user}
    <Login />
  {:else}
    <div class="text-center">
        <span class="loading loading-dots loading-lg"></span>
        <p>Accessing your file...</p>
    </div>
  {/if}
</main>