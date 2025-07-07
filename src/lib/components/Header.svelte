<script lang="ts">
    import { userProfile, user } from '$lib/stores';
    import { auth } from '$lib/firebase';
    import { onMount } from 'svelte';

    let mounted = false;
    let isScrolled = false;

    onMount(() => {
        mounted = true;
        
        const handleScroll = () => {
            isScrolled = window.scrollY > 20;
        };
        
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    });
</script>

{#if $user && $userProfile}
    <header class="fixed top-0 left-0 right-0 z-50 transition-all duration-300 {isScrolled ? 'bg-black/80' : 'bg-black/40'} backdrop-blur-lg border-b border-white/10">
        <div class="max-w-7xl mx-auto px-6 py-4">
            <div class="flex items-center justify-between">
                <!-- Neural Brand Identity -->
                <div class="flex items-center space-x-8">
                    <a href="/" class="group flex items-center space-x-2">
                        <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-electric to-royal flex items-center justify-center group-hover:scale-110 transition-transform">
                            <span class="text-white font-black text-lg">C</span>
                        </div>
                        <span class="font-display text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-electric to-royal">
                            CloutDumpster
                        </span>
                    </a>
                    
                    <!-- Neural Navigation -->
                    <nav class="hidden md:flex items-center space-x-6">
                        <a href="/feed" class="group relative px-4 py-2 rounded-xl text-gray-300 hover:text-white transition-all duration-200">
                            <span class="relative z-10">Feed</span>
                            <div class="absolute inset-0 bg-electric/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        </a>
                        <a href="/rank" class="group relative px-4 py-2 rounded-xl text-gray-300 hover:text-white transition-all duration-200">
                            <span class="relative z-10">Arena</span>
                            <div class="absolute inset-0 bg-royal/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        </a>
                        <a href="/leaderboard" class="group relative px-4 py-2 rounded-xl text-gray-300 hover:text-white transition-all duration-200">
                            <span class="relative z-10">Ranks</span>
                            <div class="absolute inset-0 bg-gold/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        </a>
                        <a href="/store" class="group relative px-4 py-2 rounded-xl text-gold hover:text-yellow-200 transition-all duration-200">
                            <span class="relative z-10 flex items-center space-x-1">
                                <span>💰</span>
                                <span>Vault</span>
                            </span>
                            <div class="absolute inset-0 bg-gold/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        </a>
                    </nav>
                </div>

                <!-- Neural Status Display -->
                <div class="flex items-center space-x-6">
                    <!-- Clout Score Display -->
                    <div class="group relative">
                        <div class="text-center p-3 rounded-2xl bg-electric/10 border border-electric/20 group-hover:border-electric/40 transition-colors">
                            <p class="font-display text-2xl font-black text-electric">
                                {$userProfile.cloutScore}
                            </p>
                            <p class="text-xs text-electric/70 uppercase tracking-wider font-semibold">CLOUT</p>
                        </div>
                    </div>

                    <!-- CloutCoin Balance -->
                    <div class="group relative">
                        <div class="text-center p-3 rounded-2xl bg-gold/10 border border-gold/20 group-hover:border-gold/40 transition-colors">
                            <p class="font-display text-xl font-black text-gold">
                                {$userProfile.cloutCoin}
                            </p>
                            <p class="text-xs text-gold/70 uppercase tracking-wider font-semibold">COINS</p>
                        </div>
                    </div>

                    <!-- Neural Profile Interface -->
                    <div class="flex items-center space-x-4">
                        <a href="/profile/{$user.uid}" class="group relative">
                            <div class="w-12 h-12 rounded-2xl bg-gradient-to-br from-royal via-electric to-gold p-0.5 group-hover:scale-110 transition-transform">
                                <div class="w-full h-full rounded-2xl bg-black flex items-center justify-center overflow-hidden">
                                    {#if $userProfile.photoURL}
                                        <img src={$userProfile.photoURL} alt="Neural Avatar" class="w-full h-full object-cover" />
                                    {:else}
                                        <span class="text-white font-black text-lg">{$userProfile.username?.charAt(0).toUpperCase() || '?'}</span>
                                    {/if}
                                </div>
                            </div>
                            <!-- Hover tooltip -->
                            <div class="absolute -bottom-10 left-1/2 transform -translate-x-1/2 bg-black/90 backdrop-blur-sm border border-white/10 rounded-lg px-3 py-1 text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                Your Empire
                            </div>
                        </a>
                        
                        <!-- Neural Disconnect -->
                        <button 
                            on:click={() => auth.signOut()}
                            class="group relative p-2 rounded-xl text-gray-400 hover:text-red-400 transition-all duration-200"
                            title="Disconnect"
                        >
                            <span class="relative z-10 text-sm">⏻</span>
                            <div class="absolute inset-0 bg-red-500/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Neural Pulse Border -->
        <div class="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-electric to-transparent opacity-50"></div>
    </header>
{/if}
