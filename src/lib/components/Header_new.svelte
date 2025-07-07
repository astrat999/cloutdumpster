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
    <header class="fixed top-0 left-0 right-0 z-50 transition-all duration-300 {isScrolled ? 'bg-black' : 'bg-black/80'} backdrop-blur-lg border-b border-gray-800">
        <div class="max-w-6xl mx-auto px-6 py-4">
            <div class="flex items-center justify-between">
                <!-- Brand -->
                <div class="flex items-center space-x-8">
                    <a href="/" class="group flex items-center space-x-2">
                        <div class="w-8 h-8 rounded-lg bg-accent flex items-center justify-center group-hover:scale-110 transition-transform">
                            <span class="text-black font-black text-sm">CD</span>
                        </div>
                        <span class="font-bold text-xl text-white">
                            CloutDumpster
                        </span>
                    </a>
                    
                    <!-- Navigation -->
                    <nav class="hidden md:flex items-center space-x-6">
                        <a href="/feed" class="text-gray-400 hover:text-white transition-colors font-medium">
                            Feed
                        </a>
                        <a href="/rank" class="text-gray-400 hover:text-white transition-colors font-medium">
                            Hot/Not
                        </a>
                        <a href="/leaderboard" class="text-gray-400 hover:text-white transition-colors font-medium">
                            Ranks
                        </a>
                    </nav>
                </div>

                <!-- User Status -->
                <div class="flex items-center space-x-4">
                    <!-- Clout Score -->
                    <div class="text-center">
                        <p class="font-bold text-lg text-accent">
                            {$userProfile.cloutScore}
                        </p>
                        <p class="text-xs text-gray-400 uppercase">Clout</p>
                    </div>

                    <!-- CloutCoin Balance -->
                    <div class="text-center">
                        <p class="font-bold text-lg text-yellow-400">
                            {$userProfile.cloutCoin || 0}
                        </p>
                        <p class="text-xs text-gray-400 uppercase">Coins</p>
                    </div>

                    <!-- Profile -->
                    <div class="flex items-center space-x-3">
                        <a href="/profile/{$user.uid}" class="group">
                            <div class="w-10 h-10 rounded-xl bg-accent p-0.5 group-hover:scale-105 transition-transform">
                                <div class="w-full h-full rounded-xl bg-black flex items-center justify-center overflow-hidden">
                                    {#if $userProfile.photoURL}
                                        <img src={$userProfile.photoURL} alt="Profile" class="w-full h-full object-cover" />
                                    {:else}
                                        <span class="text-white font-bold text-sm">{$userProfile.username?.charAt(0).toUpperCase() || '?'}</span>
                                    {/if}
                                </div>
                            </div>
                        </a>
                        
                        <!-- Sign Out -->
                        <button 
                            on:click={() => auth.signOut()}
                            class="text-gray-400 hover:text-red-400 transition-colors text-sm font-medium"
                        >
                            Exit
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </header>
{/if}
