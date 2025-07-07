<script lang="ts">
    import type { PageData, ActionData } from './$types';
    import { user } from '$lib/stores';
    import { enhance } from '$app/forms';
    import { page } from '$app/stores';
    import { onMount } from 'svelte';
    import ProfileUploader from '$lib/components/ProfileUploader.svelte';
    import Top6 from '$lib/components/Top6.svelte';
    import DisplaySelector from '$lib/components/DisplaySelector.svelte';
    import Header from '$lib/components/Header.svelte';

    export let data: PageData;
    export let form: ActionData;

    // Reactive statements to keep data fresh
    $: profile = data.profile;
    $: whispers = data.whispers as any[];
    $: isOwnProfile = $user && $user.uid === profile.uid;

    let mounted = false;
    let whisperText = '';
    let isSubmitting = false;

    onMount(() => {
        mounted = true;
    });

    // Neural status calculations
    $: cloutTier = profile.cloutScore >= 1000 ? 'NEURAL' : 
                   profile.cloutScore >= 500 ? 'ELITE' : 
                   profile.cloutScore >= 200 ? 'RISING' : 'BASELINE';
    
    $: tierColor = cloutTier === 'NEURAL' ? 'from-gold to-yellow-400' :
                   cloutTier === 'ELITE' ? 'from-electric to-cyan-400' :
                   cloutTier === 'RISING' ? 'from-royal to-purple-400' : 'from-gray-500 to-gray-400';
</script>

<Header />

<!-- Neural Profile Gallery -->
<main class="pt-20 min-h-screen bg-gradient-to-br from-void via-velvet to-void font-body">
    <!-- Animated Background Grid -->
    <div class="fixed inset-0 neural-grid opacity-20 pointer-events-none"></div>
    
    <div class="relative z-10 max-w-6xl mx-auto px-6 py-12">
        <!-- Neural Profile Matrix -->
        <div class="mb-12">
            <!-- Profile Nexus -->
            <div class="relative overflow-hidden rounded-3xl bg-black/40 backdrop-blur-lg border border-white/10 p-8 mb-8">
                <!-- Neural Status Indicator -->
                <div class="absolute top-4 right-4">
                    <div class="px-4 py-2 rounded-xl bg-gradient-to-r {tierColor} text-black font-black text-sm">
                        {cloutTier}
                    </div>
                </div>

                <div class="flex flex-col lg:flex-row items-center lg:items-start space-y-8 lg:space-y-0 lg:space-x-12">
                    <!-- Neural Avatar Matrix -->
                    <div class="relative group">
                        <!-- Pulsing halo effect -->
                        <div class="absolute inset-0 rounded-full bg-gradient-to-r from-electric via-royal to-gold opacity-75 blur-xl group-hover:opacity-100 transition-opacity animate-pulse-slow"></div>
                        
                        <div class="relative w-48 h-48 rounded-full overflow-hidden bg-gradient-to-br from-electric via-royal to-gold p-1">
                            <div class="w-full h-full rounded-full overflow-hidden bg-black flex items-center justify-center">
                                {#if profile.primaryDisplay === 'video' && profile.videoURL}
                                    <video 
                                        src={profile.videoURL} 
                                        autoplay 
                                        muted 
                                        loop 
                                        playsinline
                                        class="w-full h-full object-cover"
                                    ></video>
                                {:else if profile.primaryDisplay === 'photo' && profile.photoURL}
                                    <img 
                                        src={profile.photoURL} 
                                        alt="{profile.username}'s neural avatar" 
                                        class="w-full h-full object-cover"
                                    />
                                {:else if profile.videoURL}
                                    <video 
                                        src={profile.videoURL} 
                                        autoplay 
                                        muted 
                                        loop 
                                        playsinline
                                        class="w-full h-full object-cover"
                                    ></video>
                                {:else if profile.photoURL}
                                    <img 
                                        src={profile.photoURL} 
                                        alt="{profile.username}'s neural avatar" 
                                        class="w-full h-full object-cover"
                                    />
                                {:else}
                                    <div class="w-full h-full bg-gradient-to-br from-royal to-electric flex items-center justify-center">
                                        <span class="text-white text-6xl font-black">
                                            {profile.username?.charAt(0).toUpperCase() || '?'}
                                        </span>
                                    </div>
                                {/if}
                            </div>
                        </div>

                        <!-- Neural activity indicators -->
                        <div class="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-gradient-to-r from-cyber-green to-electric border-2 border-black animate-pulse"></div>
                    </div>

                    <!-- Identity Matrix -->
                    <div class="flex-1 text-center lg:text-left">
                        <div class="mb-6">
                            <h1 class="font-display text-5xl lg:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-electric via-royal to-gold mb-2">
                                {profile.username}
                            </h1>
                            <p class="text-gray-400 text-lg font-mono">Neural ID: {profile.uid.slice(0, 8)}</p>
                        </div>

                        <!-- Power Metrics -->
                        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <!-- Clout Score -->
                            <div class="group relative p-6 rounded-2xl bg-electric/10 border border-electric/20 hover:border-electric/40 transition-all">
                                <div class="text-center">
                                    <p class="font-display text-4xl font-black text-electric mb-1">{profile.cloutScore}</p>
                                    <p class="text-electric/70 text-sm font-semibold uppercase tracking-wider">Neural Clout</p>
                                </div>
                                <div class="absolute inset-0 bg-electric/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            </div>

                            <!-- CloutCoin Balance -->
                            <div class="group relative p-6 rounded-2xl bg-gold/10 border border-gold/20 hover:border-gold/40 transition-all">
                                <div class="text-center">
                                    <p class="font-display text-3xl font-black text-gold mb-1">{profile.cloutCoin || 0}</p>
                                    <p class="text-gold/70 text-sm font-semibold uppercase tracking-wider">Vault Balance</p>
                                </div>
                                <div class="absolute inset-0 bg-gold/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            </div>

                            <!-- Tier Status -->
                            <div class="group relative p-6 rounded-2xl bg-royal/10 border border-royal/20 hover:border-royal/40 transition-all">
                                <div class="text-center">
                                    <p class="font-display text-2xl font-black text-royal mb-1">{cloutTier}</p>
                                    <p class="text-royal/70 text-sm font-semibold uppercase tracking-wider">Access Level</p>
                                </div>
                                <div class="absolute inset-0 bg-royal/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Neural Inner Circle -->
            <div class="mb-8">
                <Top6 isOwnProfile={!!isOwnProfile} profileUserId={profile.uid} />
            </div>

            <!-- Profile Control Matrix (Own Profile Only) -->
            {#if isOwnProfile}
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    <div class="rounded-3xl bg-black/40 backdrop-blur-lg border border-white/10 p-6">
                        <h3 class="font-display text-xl font-bold text-white mb-4 flex items-center">
                            <span class="w-3 h-3 bg-electric rounded-full mr-3 animate-pulse"></span>
                            Neural Upload
                        </h3>
                        <ProfileUploader />
                    </div>
                    <div class="rounded-3xl bg-black/40 backdrop-blur-lg border border-white/10 p-6">
                        <h3 class="font-display text-xl font-bold text-white mb-4 flex items-center">
                            <span class="w-3 h-3 bg-royal rounded-full mr-3 animate-pulse"></span>
                            Display Matrix
                        </h3>
                        <DisplaySelector />
                    </div>
                </div>
            {/if}

            <!-- Whisper Injection Terminal -->
            {#if $user && !isOwnProfile}
                <div class="rounded-3xl bg-black/40 backdrop-blur-lg border border-white/10 p-8 mb-8 relative overflow-hidden">
                    <!-- Matrix rain effect -->
                    <div class="absolute inset-0 opacity-5">
                        <div class="data-flow absolute top-0 h-full w-1 bg-electric"></div>
                        <div class="data-flow absolute top-0 h-full w-1 bg-royal" style="animation-delay: 1s;"></div>
                    </div>
                    
                    <div class="relative z-10">
                        <h3 class="font-display text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-electric to-royal mb-6 flex items-center">
                            <span class="text-2xl mr-3">🗲</span>
                            Anonymous Whisper Injection
                        </h3>
                        
                        <form method="POST" action="?/whisper" use:enhance class="space-y-6">
                            <div class="relative">
                                <textarea 
                                    bind:value={whisperText}
                                    name="whisperText" 
                                    class="w-full bg-void/80 border border-electric/20 rounded-2xl px-6 py-4 text-white placeholder-gray-500 focus:border-electric focus:outline-none resize-none font-mono text-sm backdrop-blur-sm" 
                                    placeholder="// Inject anonymous whisper into the neural matrix..."
                                    rows="4"
                                    maxlength="280"
                                ></textarea>
                                <div class="absolute bottom-3 right-3 text-xs text-gray-500 font-mono">
                                    {whisperText.length}/280
                                </div>
                            </div>
                            
                            <button 
                                type="submit" 
                                disabled={isSubmitting}
                                class="group relative w-full bg-gradient-to-r from-electric to-royal text-black font-black py-4 rounded-2xl hover:scale-105 transition-all duration-300 overflow-hidden disabled:opacity-50"
                            >
                                <span class="relative z-10 flex items-center justify-center space-x-2">
                                    <span>🗲</span>
                                    <span>{isSubmitting ? 'INJECTING...' : 'INJECT WHISPER'}</span>
                                </span>
                                <div class="absolute inset-0 bg-gradient-to-r from-royal to-electric opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            </button>
                        </form>
                        
                        {#if form?.message}
                            <div class="mt-6 p-4 rounded-2xl border {form?.success ? 'bg-cyber-green/20 border-cyber-green/30' : 'bg-neon-pink/20 border-neon-pink/30'}">
                                <p class="text-sm font-mono {form?.success ? 'text-cyber-green' : 'text-neon-pink'}">{form.message}</p>
                            </div>
                        {/if}
                    </div>
                </div>
            {/if}

            <!-- Whisper Archive Chamber -->
            <div class="rounded-3xl bg-black/40 backdrop-blur-lg border border-white/10 p-8 relative overflow-hidden">
                <div class="relative z-10">
                    <h3 class="font-display text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-gold to-electric mb-8 flex items-center">
                        <span class="text-2xl mr-3">👁</span>
                        Neural Whisper Archive
                    </h3>
                    
                    {#if whispers && whispers.length > 0}
                        <div class="space-y-4">
                            {#each whispers as whisper, index}
                                <div class="group relative rounded-2xl bg-void/50 border border-white/10 p-6 hover:border-electric/30 transition-all backdrop-blur-sm">
                                    <!-- Whisper content -->
                                    <div class="relative">
                                        <p class="text-gray-200 font-mono text-sm leading-relaxed mb-4">"{whisper.text}"</p>
                                        
                                        <!-- Metadata -->
                                        <div class="flex items-center justify-between text-xs text-gray-500">
                                            <span class="font-mono">Anonymous Neural Source</span>
                                            <span class="font-mono">
                                                {new Date(whisper.createdAt?.toDate()).toLocaleString()}
                                            </span>
                                        </div>
                                    </div>

                                    <!-- Neural glow effect -->
                                    <div class="absolute top-2 right-2 w-2 h-2 rounded-full bg-electric animate-pulse opacity-50"></div>
                                </div>
                            {/each}
                        </div>
                    {:else}
                        <div class="text-center py-16">
                            <div class="w-24 h-24 rounded-full bg-electric/10 border border-electric/20 flex items-center justify-center mx-auto mb-6">
                                <span class="text-4xl opacity-50">👁</span>
                            </div>
                            <p class="text-gray-400 font-mono text-lg">Neural Archive Empty</p>
                            <p class="text-gray-500 font-mono text-sm mt-2">No whispers detected in the matrix</p>
                        </div>
                    {/if}
                </div>
            </div>
        </div>
        
        <!-- Neural Navigation -->
        <div class="text-center mt-12">
            <a href="/leaderboard" class="group inline-flex items-center space-x-2 px-6 py-3 rounded-2xl bg-royal/20 border border-royal/30 text-royal hover:border-royal/60 hover:bg-royal/30 transition-all font-mono font-semibold">
                <span>←</span>
                <span>RETURN TO NEURAL HIERARCHY</span>
            </a>
        </div>
    </div>
</main>
