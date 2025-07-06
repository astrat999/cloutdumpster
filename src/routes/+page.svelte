<script lang="ts">
  import { auth } from '$lib/firebase';
  import { user, userProfile } from '$lib/stores';
  import Login from '$lib/components/Login.svelte';
  import Header from '$lib/components/Header.svelte';
  import Spyglass from '$lib/components/Spyglass.svelte';
  import PremiumFilters from '$lib/components/PremiumFilters.svelte';
  import NotificationManager from '$lib/components/NotificationManager.svelte';
</script>

<!-- Global Header -->
<Header />

<main class="pt-20 min-h-screen bg-velvet font-body">
  {#if $user && $userProfile}
    <!-- Elegant Vertical Feed Layout -->
    <div class="max-w-4xl mx-auto px-4 py-8">
        <!-- Welcome Section -->
        <div class="text-center mb-12">
            <h1 class="font-display text-5xl font-bold text-white mb-4">
                Welcome to the <span class="text-royal">Inner Circle</span>
            </h1>
            <p class="text-gray-400 text-lg">
                Your exclusive gateway to digital status and influence
            </p>
        </div>

        <!-- Main Navigation Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <a href="/rank" class="group relative overflow-hidden rounded-xl bg-gradient-to-br from-royal to-purple-700 p-8 hover:scale-105 transition-all duration-300">
                <div class="relative z-10">
                    <h3 class="font-display text-2xl font-bold text-white mb-2">The Arena</h3>
                    <p class="text-purple-100">Judge others. Build your influence.</p>
                </div>
                <div class="absolute inset-0 bg-gradient-to-br from-royal/20 to-transparent"></div>
            </a>

            <a href="/feed" class="group relative overflow-hidden rounded-xl bg-gradient-to-br from-electric to-cyan-600 p-8 hover:scale-105 transition-all duration-300">
                <div class="relative z-10">
                    <h3 class="font-display text-2xl font-bold text-white mb-2">The Heat Feed</h3>
                    <p class="text-cyan-100">Share your fire. Climb the ranks.</p>
                </div>
                <div class="absolute inset-0 bg-gradient-to-br from-electric/20 to-transparent"></div>
            </a>

            <a href="/leaderboard" class="group relative overflow-hidden rounded-xl bg-gradient-to-br from-gold to-yellow-600 p-8 hover:scale-105 transition-all duration-300">
                <div class="relative z-10">
                    <h3 class="font-display text-2xl font-bold text-black mb-2">Leaderboard</h3>
                    <p class="text-yellow-900">See who reigns supreme.</p>
                </div>
                <div class="absolute inset-0 bg-gradient-to-br from-gold/20 to-transparent"></div>
            </a>

            <a href="/profile/{$user.uid}" class="group relative overflow-hidden rounded-xl bg-gradient-to-br from-silk to-gray-700 p-8 hover:scale-105 transition-all duration-300">
                <div class="relative z-10">
                    <h3 class="font-display text-2xl font-bold text-white mb-2">Your Profile</h3>
                    <p class="text-gray-300">Craft your digital persona.</p>
                </div>
                <div class="absolute inset-0 bg-gradient-to-br from-silk/20 to-transparent"></div>
            </a>
        </div>

        <!-- Premium Components Section -->
        <div class="space-y-8">
            <!-- Tactical Addition: The Spyglass Component -->
            <Spyglass />
            
            <!-- Tactical Addition: The Premium Filters Component -->
            <PremiumFilters />
            
            <!-- Tactical Addition: The Notification Manager Component -->
            <NotificationManager />
        </div>
    </div>
  {:else if !$user}
    <Login />
  {:else}
    <div class="flex items-center justify-center min-h-screen">
        <div class="text-center">
            <div class="loading loading-dots loading-lg text-royal"></div>
            <p class="text-gray-400 mt-4 font-body">Accessing your file...</p>
        </div>
    </div>
  {/if}
</main>