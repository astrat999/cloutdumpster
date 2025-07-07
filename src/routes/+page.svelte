<script lang="ts">
  import { auth } from '$lib/firebase';
  import { user, userProfile } from '$lib/stores';
  import { onMount } from 'svelte';
  import Login from '$lib/components/Login.svelte';
  import Header from '$lib/components/Header.svelte';
  import Spyglass from '$lib/components/Spyglass.svelte';
  import PremiumFilters from '$lib/components/PremiumFilters.svelte';
  import NotificationManager from '$lib/components/NotificationManager.svelte';

  let mounted = false;
  let currentMomentumBoost = 0;

  onMount(() => {
    mounted = true;
    // Generate momentum boost for returning users
    if ($userProfile?.momentumLoss) {
      currentMomentumBoost = Math.floor(Math.random() * 15) + 5;
    }
  });

  // Neon Noir color particles animation
  let particles: Array<{x: number, y: number, opacity: number, color: string}> = [];
  
  onMount(() => {
    const colors = ['#8B5CF6', '#22D3EE', '#FBBF24', '#FF6B9D'];
    for (let i = 0; i < 25; i++) {
      particles.push({
        x: Math.random() * 100,
        y: Math.random() * 100,
        opacity: Math.random() * 0.6 + 0.1,
        color: colors[Math.floor(Math.random() * colors.length)]
      });
    }
  });
</script>

<!-- Neural Header Override for Authenticated Users -->
{#if $user && $userProfile}
  <Header />
{/if}

<main class="min-h-screen bg-gradient-to-br from-black via-velvet to-black font-body relative overflow-hidden">
  <!-- Animated Background Particles -->
  {#if mounted}
    <div class="absolute inset-0 pointer-events-none">
      {#each particles as particle}
        <div 
          class="absolute w-1 h-1 rounded-full animate-pulse"
          style="left: {particle.x}%; top: {particle.y}%; background-color: {particle.color}; opacity: {particle.opacity}"
        ></div>
      {/each}
    </div>
  {/if}

  {#if $user && $userProfile}
    <!-- The Vortex: Authenticated User Hub -->
    <div class="relative z-10 pt-20">
      <!-- Momentum Surge Banner -->
      {#if $userProfile?.momentumLoss && mounted}
        <div class="fixed top-24 left-1/2 transform -translate-x-1/2 z-50 animate-in slide-in-from-top duration-700">
          <div class="bg-gradient-to-r from-electric/20 via-royal/30 to-electric/20 border border-electric/40 rounded-2xl p-4 backdrop-blur-md shadow-2xl">
            <div class="flex items-center space-x-3">
              <div class="w-3 h-3 bg-electric rounded-full animate-ping"></div>
              <p class="text-electric font-bold text-lg">⚡ MOMENTUM SURGE</p>
            </div>
            <p class="text-gray-200 text-sm ml-6">+{currentMomentumBoost} Clout harvested during absence</p>
          </div>
        </div>
      {/if}

      <!-- Central Vortex Grid -->
      <div class="max-w-7xl mx-auto px-6 py-12">
        <div class="text-center mb-16">
          <h1 class="font-display text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-electric via-royal to-gold mb-6">
            THE VORTEX
          </h1>
          <p class="text-gray-300 text-xl max-w-2xl mx-auto">
            Where influence is forged, status is earned, and digital hierarchies are born
          </p>
        </div>

        <!-- Primary Action Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          <!-- The Arena -->
          <a href="/rank" class="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-royal/20 to-purple-900/40 border border-royal/30 p-8 hover:scale-105 hover:border-royal/60 transition-all duration-500 backdrop-blur-sm">
            <div class="absolute inset-0 bg-gradient-to-br from-royal/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div class="relative z-10">
              <div class="w-16 h-16 rounded-2xl bg-royal/20 border border-royal/40 flex items-center justify-center mb-6 group-hover:bg-royal/30 transition-colors">
                <span class="text-3xl">⚔️</span>
              </div>
              <h3 class="font-display text-2xl font-bold text-white mb-3">The Arena</h3>
              <p class="text-purple-200 text-sm">Judge. Destroy. Ascend.</p>
            </div>
          </a>

          <!-- The Heat Feed -->
          <a href="/feed" class="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-electric/20 to-cyan-900/40 border border-electric/30 p-8 hover:scale-105 hover:border-electric/60 transition-all duration-500 backdrop-blur-sm">
            <div class="absolute inset-0 bg-gradient-to-br from-electric/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div class="relative z-10">
              <div class="w-16 h-16 rounded-2xl bg-electric/20 border border-electric/40 flex items-center justify-center mb-6 group-hover:bg-electric/30 transition-colors">
                <span class="text-3xl">🔥</span>
              </div>
              <h3 class="font-display text-2xl font-bold text-white mb-3">Heat Feed</h3>
              <p class="text-cyan-200 text-sm">Share. Ignite. Dominate.</p>
            </div>
          </a>

          <!-- Your Profile -->
          <a href="/profile/{$user.uid}" class="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-gold/20 to-yellow-900/40 border border-gold/30 p-8 hover:scale-105 hover:border-gold/60 transition-all duration-500 backdrop-blur-sm">
            <div class="absolute inset-0 bg-gradient-to-br from-gold/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div class="relative z-10">
              <div class="w-16 h-16 rounded-2xl bg-gold/20 border border-gold/40 flex items-center justify-center mb-6 group-hover:bg-gold/30 transition-colors">
                <span class="text-3xl">👑</span>
              </div>
              <h3 class="font-display text-2xl font-bold text-white mb-3">Your Empire</h3>
              <p class="text-yellow-200 text-sm">Craft. Control. Conquer.</p>
            </div>
          </a>
        </div>

        <!-- Secondary Actions -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <a href="/leaderboard" class="group relative overflow-hidden rounded-2xl bg-gradient-to-r from-silk/40 to-gray-800/40 border border-silk/30 p-6 hover:border-silk/60 transition-all duration-300 backdrop-blur-sm">
            <div class="flex items-center space-x-4">
              <div class="w-12 h-12 rounded-xl bg-silk/30 border border-silk/40 flex items-center justify-center">
                <span class="text-xl">📊</span>
              </div>
              <div>
                <h4 class="font-display text-xl font-bold text-white">Leaderboard</h4>
                <p class="text-gray-400 text-sm">See who reigns supreme</p>
              </div>
            </div>
          </a>

          <a href="/store" class="group relative overflow-hidden rounded-2xl bg-gradient-to-r from-gold/20 to-yellow-800/40 border border-gold/30 p-6 hover:border-gold/60 transition-all duration-300 backdrop-blur-sm">
            <div class="flex items-center space-x-4">
              <div class="w-12 h-12 rounded-xl bg-gold/30 border border-gold/40 flex items-center justify-center">
                <span class="text-xl">💰</span>
              </div>
              <div>
                <h4 class="font-display text-xl font-bold text-white">The Vault</h4>
                <p class="text-yellow-200 text-sm">Power awaits purchase</p>
              </div>
            </div>
          </a>
        </div>

        <!-- Neural Enhancements Section -->
        <div class="space-y-8">
          <Spyglass />
          <PremiumFilters />
          <NotificationManager />
        </div>
      </div>
    </div>
  {:else if !$user}
    <!-- The Vortex: Landing Portal for Unauth Users -->
    <div class="relative z-10 flex items-center justify-center min-h-screen">
      <div class="text-center max-w-6xl mx-auto px-6">
        <!-- Hypnotic Brand Identity -->
        <div class="mb-12">
          <h1 class="font-display text-8xl md:text-9xl font-black text-transparent bg-clip-text bg-gradient-to-r from-electric via-royal to-gold mb-8 animate-pulse">
            CLOUT
          </h1>
          <h2 class="font-display text-6xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-gold via-royal to-electric mb-12">
            DUMPSTER
          </h2>
        </div>

        <!-- Manifesto -->
        <div class="mb-16 space-y-6">
          <p class="text-2xl md:text-3xl font-light text-electric">
            Where influence becomes currency.
          </p>
          <p class="text-xl md:text-2xl font-light text-royal">
            Where status is earned through judgment.
          </p>
          <p class="text-lg md:text-xl font-light text-gold">
            Where the hierarchy is absolute.
          </p>
        </div>

        <!-- Auth Portal -->
        <div class="relative max-w-md mx-auto">
          <div class="absolute inset-0 bg-gradient-to-r from-electric/20 via-royal/20 to-gold/20 rounded-3xl blur-xl"></div>
          <div class="relative bg-black/40 backdrop-blur-lg border border-white/10 rounded-3xl p-8">
            <Login />
          </div>
        </div>

        <!-- Neural Whispers -->
        <div class="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 text-sm opacity-70">
          <div class="text-electric">
            <p class="font-semibold mb-2">JUDGE</p>
            <p>Every verdict shapes the hierarchy</p>
          </div>
          <div class="text-royal">
            <p class="font-semibold mb-2">DOMINATE</p>
            <p>Rise through ruthless precision</p>
          </div>
          <div class="text-gold">
            <p class="font-semibold mb-2">ASCEND</p>
            <p>Claim your digital throne</p>
          </div>
        </div>
      </div>
    </div>
  {:else}
    <!-- Neural Loading State -->
    <div class="relative z-10 flex items-center justify-center min-h-screen">
      <div class="text-center">
        <div class="w-16 h-16 rounded-full border-4 border-royal/20 border-t-royal animate-spin mb-6"></div>
        <p class="text-electric font-bold text-xl animate-pulse">ACCESSING NEURAL MATRIX</p>
        <p class="text-gray-400 mt-2 font-mono text-sm">Synchronizing consciousness...</p>
      </div>
    </div>
  {/if}
</main>