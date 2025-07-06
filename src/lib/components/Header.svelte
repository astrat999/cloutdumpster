<script lang="ts">
    import { userProfile, user } from '$lib/stores';
    import { auth } from '$lib/firebase';
</script>

{#if $user && $userProfile}
    <header class="fixed top-0 left-0 right-0 z-50 bg-velvet/90 backdrop-blur-md border-b border-silk">
        <div class="max-w-6xl mx-auto px-4 py-3">
            <div class="flex items-center justify-between">
                <!-- Logo & Brand -->
                <div class="flex items-center space-x-4">
                    <a href="/" class="font-display text-2xl font-bold text-royal">
                        CloutDumpster
                    </a>
                    
                    <!-- Navigation Links -->
                    <div class="hidden md:flex items-center space-x-6 ml-8">
                        <a href="/feed" class="text-gray-300 hover:text-white transition-colors font-medium">Feed</a>
                        <a href="/syndicates" class="text-gray-300 hover:text-royal transition-colors font-medium">🏛️ Syndicates</a>
                        <a href="/store" class="text-gray-300 hover:text-gold transition-colors font-medium">💰 Store</a>
                        <a href="/leaderboard" class="text-gray-300 hover:text-white transition-colors font-medium">Leaderboard</a>
                    </div>
                </div>

                <!-- Stats Display -->
                <div class="flex items-center space-x-6">
                    <!-- Clout Score -->
                    <div class="text-center">
                        <p class="font-display text-3xl font-bold text-electric">
                            {$userProfile.cloutScore}
                        </p>
                        <p class="text-xs text-gray-400 uppercase tracking-wider">Clout</p>
                    </div>

                    <!-- CloutCoin Balance -->
                    <div class="text-center">
                        <p class="font-display text-xl font-bold text-gold">
                            {$userProfile.cloutCoin}
                        </p>
                        <p class="text-xs text-gray-400 uppercase tracking-wider">Coins</p>
                    </div>

                    <!-- Profile Avatar -->
                    <div class="flex items-center space-x-3">
                        <a href="/profile/{$user.uid}" class="group">
                            <div class="w-10 h-10 rounded-full bg-gradient-to-r from-royal to-electric p-0.5 group-hover:scale-105 transition-transform">
                                <div class="w-full h-full rounded-full bg-velvet flex items-center justify-center overflow-hidden">
                                    {#if $userProfile.photoURL}
                                        <img src={$userProfile.photoURL} alt="Profile" class="w-full h-full object-cover" />
                                    {:else}
                                        <span class="text-white font-semibold">{$userProfile.username?.charAt(0).toUpperCase() || '?'}</span>
                                    {/if}
                                </div>
                            </div>
                        </a>
                        
                        <!-- Sign Out -->
                        <button 
                            on:click={() => auth.signOut()}
                            class="text-gray-400 hover:text-white transition-colors text-sm"
                        >
                            Exit
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </header>
{/if}
